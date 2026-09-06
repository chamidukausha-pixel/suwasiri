import 'dart:async';
import 'dart:convert';

import 'package:file_selector/file_selector.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/schedule/schedule_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/map_launcher.dart';
import '../../data/catalogs/doctor_schedule_slots.dart';
import '../../data/models/appointment.dart';
import '../../data/models/clinic_fee_item.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/sheet_close_bar.dart';
import 'booking_confirm_step.dart';

String _sexLabel(String? raw) {
  final g = (raw ?? '').trim().toLowerCase();
  if (g.startsWith('f')) return 'Female';
  if (g.startsWith('m')) return 'Male';
  return (raw ?? '').trim();
}

enum _CheckoutStep { confirm, pay }

class _BookingResult {
  const _BookingResult({
    required this.appointment,
    required this.paymentMethod,
    required this.slot,
    required this.doctor,
    required this.consultMode,
  });

  final Appointment appointment;
  final String paymentMethod;
  final DateTime slot;
  final Doctor doctor;
  final ConsultMode consultMode;
}

Future<void> showBookingCheckoutFlow(
  BuildContext context, {
  required Doctor doctor,
  String? initialVisitReason,
  String? homeService,
  DateTime? initialSlot,
}) async {
  final result = await showModalBottomSheet<_BookingResult>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: const Color(0xFFFAF9F7),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (_) => _BookingCheckoutSheet(
      doctor: doctor,
      initialVisitReason: initialVisitReason,
      homeService: homeService,
      initialSlot: initialSlot,
    ),
  );
  if (result == null || !context.mounted) return;

  final l = AppLocalizations.of(context);
  final isVideo = result.consultMode == ConsultMode.video;
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l.t('bookingConfirmed')),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${l.t('consultationToken')}: ${result.appointment.token}\n'
            '${result.doctor.name}\n'
            '${isVideo ? l.t('onlineVideoConsult') : l.t('clinicConsult')}\n'
            '${DateFormat('EEE d MMM · hh:mm a').format(result.slot)}\n'
            '${result.paymentMethod}',
          ),
          const SizedBox(height: 14),
          if (isVideo) ...[
            Text(
              l.t('videoSyncedToCall'),
              style: const TextStyle(
                color: AppColors.trustBlueDark,
                height: 1.4,
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else ...[
            Text(
              l.t('clinicPlace'),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: AppColors.trustBlueDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              result.doctor.placeLabel,
              style: const TextStyle(color: AppColors.slateMuted, height: 1.35),
            ),
            const SizedBox(height: 12),
            Text(
              l.t('openClinicInMaps'),
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: AppColors.trustBlueDark,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => MapLauncher.openGoogleMaps(
                      address: result.doctor.placeLabel,
                      latitude: result.doctor.latitude,
                      longitude: result.doctor.longitude,
                    ),
                    icon: const Icon(Icons.map_outlined, size: 18),
                    label: Text(l.t('googleMaps')),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => MapLauncher.openAppleMaps(
                      address: result.doctor.placeLabel,
                      latitude: result.doctor.latitude,
                      longitude: result.doctor.longitude,
                    ),
                    icon: const Icon(Icons.map, size: 18),
                    label: Text(l.t('appleMaps')),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
      actions: [
        LiquidFilledButton(
          onPressed: () => Navigator.pop(ctx),
          child: Text(l.t('done')),
        ),
      ],
    ),
  );
  if (!context.mounted) return;
  if (isVideo) {
    MainTabScope.go(context, 2);
  }
}

class _BookingCheckoutSheet extends StatefulWidget {
  const _BookingCheckoutSheet({
    required this.doctor,
    this.initialVisitReason,
    this.homeService,
    this.initialSlot,
  });

  final Doctor doctor;
  final String? initialVisitReason;
  final String? homeService;
  final DateTime? initialSlot;

  @override
  State<_BookingCheckoutSheet> createState() => _BookingCheckoutSheetState();
}

class _BookingCheckoutSheetState extends State<_BookingCheckoutSheet> {
  _CheckoutStep _step = _CheckoutStep.confirm;
  ConsultMode _mode = ConsultMode.clinic;
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  bool _paying = false;
  bool _slotsLoading = false;
  List<DateTime> _bookedSlots = const [];
  StreamSubscription<List<DateTime>>? _bookedSub;
  String _visitReason = '';
  bool _depsReady = false;
  List<ClinicFeeItem> _fees = const [];

  static const _venueFee = 350;

  List<TimeOfDay> get _times => DoctorScheduleSlots.timesFor(
        widget.doctor,
        _selectedDate,
        booked: _bookedSlots,
      );

  int get _consultFee => consultFeeForVisit(
        doctorFeeLkr: widget.doctor.feeLkr,
        fees: _fees,
        homeService: widget.homeService,
      );

  bool get _homeServiceFee => isHomeServiceBooking(widget.homeService);

  int get _total => _homeServiceFee ? _consultFee : _consultFee + _venueFee;

  List<DateTime> get _dates => DoctorScheduleSlots.upcomingDates();

  DateTime get _slotDateTime =>
      DoctorScheduleSlots.combine(_selectedDate, _selectedTime);

  bool _isBooked(TimeOfDay t) {
    final slot = DoctorScheduleSlots.combine(_selectedDate, t);
    return DoctorScheduleSlots.isTaken(slot, _bookedSlots);
  }

  void _ensureSelectedTimeAvailable() {
    if (_times.isEmpty) return;
    if (!_isBooked(_selectedTime) && _times.contains(_selectedTime)) return;
    for (final t in _times) {
      if (!_isBooked(t)) {
        _selectedTime = t;
        return;
      }
    }
    _selectedTime = _times.first;
  }

  void _pickFirstOpenDate() {
    for (final d in _dates) {
      final times = DoctorScheduleSlots.timesFor(
        widget.doctor,
        d,
        booked: _bookedSlots,
      );
      if (times.isEmpty) continue;
      _selectedDate = d;
      _selectedTime = times.first;
      return;
    }
  }

  @override
  void initState() {
    super.initState();
    final reason = widget.initialVisitReason?.trim();
    if (reason != null && reason.isNotEmpty) {
      _visitReason = reason;
    }
    if (widget.initialSlot != null) {
      final slot = widget.initialSlot!;
      _selectedDate = DateTime(slot.year, slot.month, slot.day);
      _selectedTime = TimeOfDay(hour: slot.hour, minute: slot.minute);
    } else {
      _selectedDate = _dates.first;
      final firstTimes = DoctorScheduleSlots.timesFor(
        widget.doctor,
        _selectedDate,
        booked: _bookedSlots,
      );
      _selectedTime = firstTimes.isNotEmpty
          ? firstTimes.first
          : DoctorScheduleSlots.times.first;
      _pickFirstOpenDate();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_depsReady) return;
    _depsReady = true;
    if (_visitReason.isEmpty && !isHomeServiceBooking(widget.homeService)) {
      _visitReason = AppLocalizations.of(context).t('bookingReasonFollowUp');
    }
    unawaited(_loadFees());
    _bookedSub = context
        .read<HealthRepository>()
        .watchDoctorBookedSlots(
          widget.doctor.id,
          doctorName: widget.doctor.name,
        )
        .listen((booked) {
      if (!mounted) return;
      setState(() {
        _bookedSlots = booked;
        _slotsLoading = false;
        _ensureSelectedTimeAvailable();
      });
    }, onError: (_) {
      if (!mounted) return;
      setState(() => _slotsLoading = false);
    });
  }

  @override
  void dispose() {
    unawaited(_bookedSub?.cancel());
    super.dispose();
  }

  Future<void> _loadFees() async {
    try {
      final fees = await context.read<HealthRepository>().getClinicFeeSchedule(
            hospitalId: widget.doctor.feeScheduleHospitalId,
          );
      if (!mounted) return;
      setState(() => _fees = fees);
    } catch (_) {}
  }

  Future<void> _completeBooking({
    required String paymentMethod,
    String paymentStatus = 'PAID',
    bool paidBySuwasiri = false,
    String? suwasiriReceiptUrl,
  }) async {
    if (_times.isEmpty || _isBooked(_selectedTime)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'That time is already booked for this doctor. Pick an available slot.',
          ),
        ),
      );
      return;
    }
    final health = context.read<HealthRepository>();
    final user = context.read<AuthCubit>().state.user!;
    setState(() => _paying = true);
    try {
      final appt = await health.bookAppointment(
        patientId: user.id,
        doctor: widget.doctor,
        slot: _slotDateTime,
        consultMode: _mode,
        patientName: user.displayName.isNotEmpty ? user.displayName : user.name,
        patientEmail: user.email,
        patientPhone: user.mobileNo,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        paidBySuwasiri: paidBySuwasiri,
        suwasiriReceiptUrl: suwasiriReceiptUrl,
        visitReason: _visitReason,
        feeLkr: _total,
        patientAge: user.ageYears,
        patientGender: _sexLabel(user.healthIntake?.sex),
      );
      if (!mounted) return;
      await context.read<NotificationCubit>().load();
      if (!mounted) return;
      await context.read<ScheduleCubit>().watch(user.id);
      if (!mounted) return;
      context.read<ScheduleCubit>().recordBooking(appt);
      if (!mounted) return;
      setState(() => _paying = false);
      Navigator.of(context).pop(
        _BookingResult(
          appointment: appt,
          paymentMethod: paymentMethod,
          slot: _slotDateTime,
          doctor: widget.doctor,
          consultMode: _mode,
        ),
      );
    } on SlotUnavailableException catch (e) {
      if (!mounted) return;
      setState(() => _paying = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } catch (e) {
      if (!mounted) return;
      setState(() => _paying = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.94;
    return SizedBox(
      height: height,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        child: _step == _CheckoutStep.confirm
            ? BookingConfirmStep(
                key: const ValueKey('confirm'),
                doctor: widget.doctor,
                mode: _mode,
                dates: _dates,
                times: _times,
                selectedDate: _selectedDate,
                selectedTime: _selectedTime,
                bookedSlots: _bookedSlots,
                slotsLoading: _slotsLoading,
                visitReason: _visitReason,
                consultFee: _consultFee,
                lockVisitReason: _homeServiceFee,
                onClose: () => Navigator.pop(context),
                onMode: (m) => setState(() => _mode = m),
                onDate: (d) => setState(() {
                  _selectedDate = d;
                  _ensureSelectedTimeAvailable();
                }),
                onTime: (t) {
                  if (_isBooked(t)) return;
                  setState(() => _selectedTime = t);
                },
                onReason: (r) {
                  if (_homeServiceFee) return;
                  setState(() => _visitReason = r);
                },
                onProceed: () {
                  if (_times.isEmpty || _isBooked(_selectedTime)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Pick an available time — this slot is already booked.',
                        ),
                      ),
                    );
                    return;
                  }
                  setState(() => _step = _CheckoutStep.pay);
                },
              )
            : _PaymentChannelStep(
                key: const ValueKey('pay'),
                doctor: widget.doctor,
                slot: _slotDateTime,
                total: _total,
                feeLabel: _homeServiceFee ? _visitReason : null,
                paying: _paying,
                onBack: () => setState(() => _step = _CheckoutStep.confirm),
                onClose: () => Navigator.pop(context),
                onConfirm: _completeBooking,
              ),
      ),
    );
  }
}

class _PaymentChannelStep extends StatefulWidget {
  const _PaymentChannelStep({
    super.key,
    required this.doctor,
    required this.slot,
    required this.total,
    this.feeLabel,
    required this.paying,
    required this.onBack,
    required this.onClose,
    required this.onConfirm,
  });

  final Doctor doctor;
  final DateTime slot;
  final int total;
  final String? feeLabel;
  final bool paying;
  final VoidCallback onBack;
  final VoidCallback onClose;
  final Future<void> Function({
    required String paymentMethod,
    String paymentStatus,
    bool paidBySuwasiri,
    String? suwasiriReceiptUrl,
  }) onConfirm;

  @override
  State<_PaymentChannelStep> createState() => _PaymentChannelStepState();
}

enum _PayChannel { counter, card, slip }

class _PaymentChannelStepState extends State<_PaymentChannelStep> {
  _PayChannel _channel = _PayChannel.counter;
  final _cardName = TextEditingController();
  final _cardNumber = TextEditingController();
  final _cardExpiry = TextEditingController();
  final _cardCvv = TextEditingController();
  String? _slipDataUrl;
  String? _slipName;
  bool _picking = false;

  @override
  void dispose() {
    _cardName.dispose();
    _cardNumber.dispose();
    _cardExpiry.dispose();
    _cardCvv.dispose();
    super.dispose();
  }

  Future<String> _storeSlip(Uint8List bytes, String mime, String patientHint) async {
    try {
      final ext = mime.contains('pdf') ? 'pdf' : 'jpg';
      final uid = FirebaseAuth.instance.currentUser?.uid ?? patientHint;
      final ref = FirebaseStorage.instance.ref().child(
            'appointment_receipts/${uid}_${DateTime.now().millisecondsSinceEpoch}.$ext',
          );
      await ref.putData(bytes, SettableMetadata(contentType: mime));
      return await ref.getDownloadURL();
    } catch (_) {
      if (bytes.length > 700000) {
        throw Exception('That file is too large. Choose a smaller PDF or photo.');
      }
      return 'data:$mime;base64,${base64Encode(bytes)}';
    }
  }

  Future<void> _pickSlip() async {
    setState(() => _picking = true);
    try {
      const typeGroup = XTypeGroup(
        label: 'Bank slip',
        extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
      );
      final file = await openFile(acceptedTypeGroups: [typeGroup]);
      Uint8List? bytes;
      var name = 'slip.jpg';
      if (file != null) {
        bytes = await file.readAsBytes();
        name = file.name;
      } else {
        final picked = await ImagePicker().pickImage(
          source: ImageSource.gallery,
          maxWidth: 1280,
          imageQuality: 72,
        );
        if (picked == null) return;
        bytes = await picked.readAsBytes();
        name = picked.name;
      }
      final lower = name.toLowerCase();
      final mime = lower.endsWith('.pdf')
          ? 'application/pdf'
          : lower.endsWith('.png')
              ? 'image/png'
              : 'image/jpeg';
      final url = await _storeSlip(bytes, mime, 'suwasiri');
      setState(() {
        _slipDataUrl = url;
        _slipName = name;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _submit() async {
    final l = AppLocalizations.of(context);
    switch (_channel) {
      case _PayChannel.counter:
        await widget.onConfirm(
          paymentMethod: l.t('payAtCounter'),
          paymentStatus: 'PENDING',
        );
        return;
      case _PayChannel.card:
        final digits = _cardNumber.text.replaceAll(RegExp(r'\D'), '');
        if (_cardName.text.trim().isEmpty || digits.length < 12) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Enter cardholder name and a valid card number.'),
            ),
          );
          return;
        }
        await widget.onConfirm(
          paymentMethod: l.t('onlineDebitCard'),
          paymentStatus: 'PAID',
          paidBySuwasiri: true,
        );
        return;
      case _PayChannel.slip:
        if (_slipDataUrl == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(l.t('attachSlipFirst'))),
          );
          return;
        }
        await widget.onConfirm(
          paymentMethod: l.t('manualBankSlip'),
          paymentStatus: 'PAID',
          paidBySuwasiri: true,
          suwasiriReceiptUrl: _slipDataUrl,
        );
    }
  }

  String _cta(AppLocalizations l) {
    switch (_channel) {
      case _PayChannel.counter:
        return l.t('confirmBookingPayAtCounter');
      case _PayChannel.card:
        return l.t('authorizePay');
      case _PayChannel.slip:
        return l.t('submitReceiptBook');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final money = NumberFormat.decimalPattern();
    final slotLabel =
        DateFormat('MMM d, yyyy \'at\' hh:mm a').format(widget.slot);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          children: [
            MinTap(
              enforceMinSize: false,
              onTap: widget.onBack,
              child: Row(
                children: [
                  const Icon(Icons.arrow_back_ios_new,
                      size: 16, color: AppColors.trustBlue),
                  const SizedBox(width: 4),
                  Text(
                    l.t('changeDateSlot'),
                    style: const TextStyle(
                      color: AppColors.trustBlue,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            SheetCloseActions(onClose: widget.onClose),
          ],
        ),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.emeraldSoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              l.t('secureCheckout'),
              style: const TextStyle(
                color: AppColors.emerald,
                fontWeight: FontWeight.w800,
                fontSize: 11,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          l.t('payForAppointment'),
          style: const TextStyle(
            color: AppColors.trustBlueDark,
            fontWeight: FontWeight.w800,
            fontSize: 22,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${l.t('doctor')}: ${widget.doctor.name} • ${l.t('slot')}: $slotLabel',
          style: const TextStyle(color: AppColors.slateMuted, fontSize: 13),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.trustBlueDark,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('paymentDue'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.feeLabel?.trim().isNotEmpty == true
                          ? widget.feeLabel!
                          : l.t('consultationSessionFee'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'LKR ${money.format(widget.total)}',
                style: const TextStyle(
                  color: AppColors.limePrice,
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Text(
          l.t('selectPaymentChannel'),
          style: const TextStyle(
            color: AppColors.trustBlueDark,
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),
        LiquidChoiceChip(
          label: l.t('payAtCounter'),
          selected: _channel == _PayChannel.counter,
          onTap: () => setState(() => _channel = _PayChannel.counter),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: LiquidChoiceChip(
                label: l.t('onlineDebitCard'),
                selected: _channel == _PayChannel.card,
                onTap: () => setState(() => _channel = _PayChannel.card),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: LiquidChoiceChip(
                label: l.t('manualBankSlip'),
                selected: _channel == _PayChannel.slip,
                onTap: () => setState(() => _channel = _PayChannel.slip),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (_channel == _PayChannel.counter)
          Text(
            l.t('payAtCounterHint'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 13,
              height: 1.45,
            ),
          ),
        if (_channel == _PayChannel.card) ...[
          TextField(
            controller: _cardName,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(labelText: l.t('cardholderName')),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _cardNumber,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: l.t('cardNumber')),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _cardExpiry,
                  decoration: InputDecoration(labelText: l.t('expiry')),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _cardCvv,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: l.t('cvv')),
                ),
              ),
            ],
          ),
        ],
        if (_channel == _PayChannel.slip) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.t('depositToAccount'),
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text('${l.t('bank')}: Commercial Bank of Ceylon PLC',
                    style: const TextStyle(
                        color: AppColors.trustBlueDark, fontSize: 13)),
                Text('${l.t('accountName')}: Suwasiri GP Care Ltd',
                    style: const TextStyle(
                        color: AppColors.trustBlueDark, fontSize: 13)),
                Text('${l.t('accountNumber')}: 1000 4829 3491',
                    style: const TextStyle(
                        color: AppColors.trustBlueDark, fontSize: 13)),
                Text('${l.t('branch')}: Colombo Fort Branch',
                    style: const TextStyle(
                        color: AppColors.trustBlueDark, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          MinTap(
            onTap: _picking ? null : _pickSlip,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.trustBlue.withValues(alpha: 0.45),
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    _slipDataUrl == null
                        ? Icons.add_photo_alternate_outlined
                        : Icons.check_circle_rounded,
                    color: _slipDataUrl == null
                        ? AppColors.trustBlue
                        : AppColors.emerald,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _slipDataUrl == null
                        ? '${l.t('attachReceiptSlip')} (photo or PDF)'
                        : (_slipName ?? 'Receipt attached'),
                    style: const TextStyle(
                      color: AppColors.trustBlue,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l.t('uploadDepositSlip'),
                    style: const TextStyle(
                      color: AppColors.slateMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 18),
        LiquidButton(
          onPressed: widget.paying ? null : _submit,
          label: _cta(l),
          busy: widget.paying,
        ),
      ],
    );
  }
}

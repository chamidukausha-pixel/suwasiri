import 'dart:async';
import 'dart:io';

import 'package:file_selector/file_selector.dart';
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
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/sheet_close_bar.dart';
import 'booking_confirm_step.dart';

enum _PayChannel { card, bankSlip }
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
}) async {
  final result = await showModalBottomSheet<_BookingResult>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: const Color(0xFFFAF9F7),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (_) => _BookingCheckoutSheet(doctor: doctor),
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
        FilledButton(
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
  const _BookingCheckoutSheet({required this.doctor});

  final Doctor doctor;

  @override
  State<_BookingCheckoutSheet> createState() => _BookingCheckoutSheetState();
}

class _BookingCheckoutSheetState extends State<_BookingCheckoutSheet> {
  _CheckoutStep _step = _CheckoutStep.confirm;
  ConsultMode _mode = ConsultMode.clinic;
  _PayChannel _channel = _PayChannel.card;
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  String? _slipPath;
  String? _slipName;
  bool _paying = false;
  bool _slotsLoading = true;
  List<DateTime> _bookedSlots = const [];
  StreamSubscription<List<DateTime>>? _bookedSub;
  String _visitReason = 'Follow up';

  final _nameCtrl = TextEditingController();
  final _cardCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvvCtrl = TextEditingController();

  static const _venueFee = 350;

  List<TimeOfDay> get _times => DoctorScheduleSlots.times;

  int get _consultFee => widget.doctor.feeLkr;
  int get _total => _consultFee + _venueFee;

  List<DateTime> get _dates => DoctorScheduleSlots.upcomingDates();

  DateTime get _slotDateTime =>
      DoctorScheduleSlots.combine(_selectedDate, _selectedTime);

  bool _isBooked(TimeOfDay t) {
    final slot = DoctorScheduleSlots.combine(_selectedDate, t);
    return DoctorScheduleSlots.isTaken(slot, _bookedSlots);
  }

  void _ensureSelectedTimeAvailable() {
    if (!_isBooked(_selectedTime)) return;
    for (final t in _times) {
      if (!_isBooked(t)) {
        _selectedTime = t;
        return;
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _selectedDate = _dates.length > 3 ? _dates[3] : _dates.first;
    _selectedTime = _times.first;
    final user = context.read<AuthCubit>().state.user;
    _nameCtrl.text = user?.name ?? '';
    _bookedSub = context
        .read<HealthRepository>()
        .watchDoctorBookedSlots(widget.doctor.id)
        .listen((booked) {
      if (!mounted) return;
      setState(() {
        _bookedSlots = booked;
        _slotsLoading = false;
        _ensureSelectedTimeAvailable();
      });
    });
  }

  @override
  void dispose() {
    unawaited(_bookedSub?.cancel());
    _nameCtrl.dispose();
    _cardCtrl.dispose();
    _expiryCtrl.dispose();
    _cvvCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickSlip() async {
    final l = AppLocalizations.of(context);
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: Text(l.t('chooseFromGallery')),
              onTap: () => Navigator.pop(ctx, 'gallery'),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: Text(l.t('takePhoto')),
              onTap: () => Navigator.pop(ctx, 'camera'),
            ),
            ListTile(
              leading: const Icon(Icons.insert_drive_file_outlined),
              title: Text(l.t('chooseDocument')),
              onTap: () => Navigator.pop(ctx, 'document'),
            ),
          ],
        ),
      ),
    );
    if (choice == null || !mounted) return;

    if (choice == 'document') {
      const typeGroup = XTypeGroup(
        label: 'Bank slip',
        extensions: <String>['pdf', 'jpg', 'jpeg', 'png', 'heic'],
      );
      final file = await openFile(acceptedTypeGroups: <XTypeGroup>[typeGroup]);
      if (file == null) return;
      setState(() {
        _slipPath = file.path;
        _slipName = file.name;
      });
      return;
    }

    final picker = ImagePicker();
    final source =
        choice == 'camera' ? ImageSource.camera : ImageSource.gallery;
    final shot = await picker.pickImage(source: source, imageQuality: 85);
    if (shot == null) return;
    setState(() {
      _slipPath = shot.path;
      _slipName = shot.name;
    });
  }

  Future<void> _completeBooking({required String paymentMethod}) async {
    if (_isBooked(_selectedTime)) {
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
        patientName: user.displayName,
        patientEmail: user.email,
        patientPhone: user.mobileNo,
        paymentMethod: paymentMethod,
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
                onReason: (r) => setState(() => _visitReason = r),
                onProceed: () {
                  if (_isBooked(_selectedTime)) {
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
            : _PayStep(
                key: const ValueKey('pay'),
                doctor: widget.doctor,
                slot: _slotDateTime,
                total: _total,
                channel: _channel,
                paying: _paying,
                slipPath: _slipPath,
                slipName: _slipName,
                nameCtrl: _nameCtrl,
                cardCtrl: _cardCtrl,
                expiryCtrl: _expiryCtrl,
                cvvCtrl: _cvvCtrl,
                onBack: () => setState(() => _step = _CheckoutStep.confirm),
                onClose: () => Navigator.pop(context),
                onChannel: (c) => setState(() => _channel = c),
                onPickSlip: _pickSlip,
                onPayCard: () => _completeBooking(
                  paymentMethod: 'Online Debit/Card',
                ),
                onPaySlip: () {
                  if (_slipPath == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          AppLocalizations.of(context).t('attachSlipFirst'),
                        ),
                      ),
                    );
                    return;
                  }
                  _completeBooking(paymentMethod: 'Manual Bank Slip');
                },
              ),
      ),
    );
  }
}

class _PayStep extends StatelessWidget {
  const _PayStep({
    super.key,
    required this.doctor,
    required this.slot,
    required this.total,
    required this.channel,
    required this.paying,
    required this.slipPath,
    required this.slipName,
    required this.nameCtrl,
    required this.cardCtrl,
    required this.expiryCtrl,
    required this.cvvCtrl,
    required this.onBack,
    required this.onClose,
    required this.onChannel,
    required this.onPickSlip,
    required this.onPayCard,
    required this.onPaySlip,
  });

  final Doctor doctor;
  final DateTime slot;
  final int total;
  final _PayChannel channel;
  final bool paying;
  final String? slipPath;
  final String? slipName;
  final TextEditingController nameCtrl;
  final TextEditingController cardCtrl;
  final TextEditingController expiryCtrl;
  final TextEditingController cvvCtrl;
  final VoidCallback onBack;
  final VoidCallback onClose;
  final ValueChanged<_PayChannel> onChannel;
  final VoidCallback onPickSlip;
  final VoidCallback onPayCard;
  final VoidCallback onPaySlip;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final money = NumberFormat.decimalPattern();
    final slotLabel = DateFormat('MMM d, yyyy \'at\' hh:mm a').format(slot);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          children: [
            MinTap(
              enforceMinSize: false,
              onTap: onBack,
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
            SheetCloseActions(onClose: onClose),
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
          '${l.t('doctor')}: ${doctor.name} • ${l.t('slot')}: $slotLabel',
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
                      l.t('consultationSessionFee'),
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
                'LKR ${money.format(total)}',
                style: const TextStyle(
                  color: Color(0xFF00E676),
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          l.t('selectPaymentChannel'),
          style: const TextStyle(
            color: AppColors.slateMuted,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _ChannelChip(
                selected: channel == _PayChannel.card,
                label: l.t('onlineDebitCard'),
                onTap: () => onChannel(_PayChannel.card),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ChannelChip(
                selected: channel == _PayChannel.bankSlip,
                label: l.t('manualBankSlip'),
                onTap: () => onChannel(_PayChannel.bankSlip),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (channel == _PayChannel.card)
          _CardForm(
            nameCtrl: nameCtrl,
            cardCtrl: cardCtrl,
            expiryCtrl: expiryCtrl,
            cvvCtrl: cvvCtrl,
            paying: paying,
            totalLabel: 'LKR ${money.format(total)}',
            onPay: onPayCard,
          )
        else
          _BankSlipForm(
            slipPath: slipPath,
            slipName: slipName,
            paying: paying,
            onPickSlip: onPickSlip,
            onSubmit: onPaySlip,
          ),
      ],
    );
  }
}

class _ChannelChip extends StatelessWidget {
  const _ChannelChip({
    required this.selected,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? Colors.white : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.trustBlue : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: selected ? AppColors.trustBlue : AppColors.slateMuted,
            fontWeight: FontWeight.w800,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _CardForm extends StatelessWidget {
  const _CardForm({
    required this.nameCtrl,
    required this.cardCtrl,
    required this.expiryCtrl,
    required this.cvvCtrl,
    required this.paying,
    required this.totalLabel,
    required this.onPay,
  });

  final TextEditingController nameCtrl;
  final TextEditingController cardCtrl;
  final TextEditingController expiryCtrl;
  final TextEditingController cvvCtrl;
  final bool paying;
  final String totalLabel;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.t('cardholderName'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 6),
          TextField(controller: nameCtrl),
          const SizedBox(height: 12),
          Text(
            l.t('cardNumber'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: cardCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: '4111 2222 3333 4444',
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('expiry'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: expiryCtrl,
                      decoration: const InputDecoration(hintText: 'MM/YY'),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('cvv'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: cvvCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(hintText: '•••'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton(
              onPressed: paying ? null : onPay,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.trustBlueLight,
              ),
              child: paying
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      '${l.t('authorizePay')} $totalLabel',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BankSlipForm extends StatelessWidget {
  const _BankSlipForm({
    required this.slipPath,
    required this.slipName,
    required this.paying,
    required this.onPickSlip,
    required this.onSubmit,
  });

  final String? slipPath;
  final String? slipName;
  final bool paying;
  final VoidCallback onPickSlip;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
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
                    fontSize: 10,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${l.t('bank')}: Commercial Bank of Ceylon PLC\n'
                  '${l.t('accountName')}: Suwasiri GP Care Ltd\n'
                  '${l.t('accountNumber')}: 1000 4829 3491\n'
                  '${l.t('branch')}: Colombo Fort Branch',
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 12,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          MinTap(
            onTap: onPickSlip,
            child: CustomPaint(
              painter: _DashedBorderPainter(color: AppColors.border),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 12),
                child: Column(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: AppColors.trustBlue,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      slipName ?? l.t('attachReceiptSlip'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l.t('uploadDepositSlip'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 12,
                      ),
                    ),
                    if (slipPath != null) ...[
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(slipPath!),
                          height: 72,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Icon(
                            Icons.insert_drive_file,
                            color: AppColors.trustBlue,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: paying ? null : onSubmit,
              child: paying
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      l.t('submitReceiptBook'),
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  _DashedBorderPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(14),
    );
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      const dash = 6.0;
      const gap = 4.0;
      while (distance < metric.length) {
        final next = distance + dash;
        canvas.drawPath(
          metric.extractPath(distance, next.clamp(0, metric.length)),
          paint,
        );
        distance = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color;
}

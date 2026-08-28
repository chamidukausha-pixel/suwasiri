import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
  const _BookingCheckoutSheet({
    required this.doctor,
    this.initialVisitReason,
  });

  final Doctor doctor;
  final String? initialVisitReason;

  @override
  State<_BookingCheckoutSheet> createState() => _BookingCheckoutSheetState();
}

class _BookingCheckoutSheetState extends State<_BookingCheckoutSheet> {
  _CheckoutStep _step = _CheckoutStep.confirm;
  ConsultMode _mode = ConsultMode.clinic;
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  bool _paying = false;
  bool _slotsLoading = true;
  List<DateTime> _bookedSlots = const [];
  StreamSubscription<List<DateTime>>? _bookedSub;
  String _visitReason = 'Follow up';

  static const _venueFee = 350;
  static const _paymentMethod = 'Pay at reception';

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
    final reason = widget.initialVisitReason?.trim();
    if (reason != null && reason.isNotEmpty) {
      _visitReason = reason;
    }
    _selectedDate = _dates.length > 3 ? _dates[3] : _dates.first;
    _selectedTime = _times.first;
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
    super.dispose();
  }

  Future<void> _completeBooking() async {
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
        paymentMethod: _paymentMethod,
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
          paymentMethod: _paymentMethod,
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
            : _PayAtReceptionStep(
                key: const ValueKey('pay'),
                doctor: widget.doctor,
                slot: _slotDateTime,
                total: _total,
                paying: _paying,
                onBack: () => setState(() => _step = _CheckoutStep.confirm),
                onClose: () => Navigator.pop(context),
                onConfirm: _completeBooking,
              ),
      ),
    );
  }
}

class _PayAtReceptionStep extends StatelessWidget {
  const _PayAtReceptionStep({
    super.key,
    required this.doctor,
    required this.slot,
    required this.total,
    required this.paying,
    required this.onBack,
    required this.onClose,
    required this.onConfirm,
  });

  final Doctor doctor;
  final DateTime slot;
  final int total;
  final bool paying;
  final VoidCallback onBack;
  final VoidCallback onClose;
  final VoidCallback onConfirm;

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
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.trustBlueSoft,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.storefront_outlined,
                      color: AppColors.trustBlue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      l.t('payAtReception'),
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                l.t('payAtReceptionHint'),
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 13,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: paying ? null : onConfirm,
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
                    l.t('confirmBookingPayAtReception'),
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
          ),
        ),
      ],
    );
  }
}

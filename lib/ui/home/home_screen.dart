import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/schedule/schedule_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/map_launcher.dart';
import '../../data/catalogs/doctor_catalog.dart';
import '../../data/models/appointment.dart';
import '../../data/models/vaccine_models.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.onNavigate,
    this.isActive = true,
  });

  final ValueChanged<int> onNavigate;
  final bool isActive;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _syncSchedule();
  }

  @override
  void didUpdateWidget(HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _syncSchedule();
    }
  }

  void _syncSchedule() {
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;
    context.read<ScheduleCubit>().watch(user.id);
  }

  Future<void> _openAppointmentDetails(Appointment appt) async {
    if (appt.isVideo) {
      widget.onNavigate(2);
      return;
    }
    final doctor = DoctorCatalog.doctorById(appt.doctorId);
    if (doctor != null) {
      await MapLauncher.showMapChoice(context, doctor: doctor);
      return;
    }
    await MapLauncher.showPlaceMapChoice(
      context,
      title: appt.doctorName,
      address: doctorHospital(appt) ?? appt.specialty,
    );
  }

  String? doctorHospital(Appointment appt) =>
      DoctorCatalog.doctorById(appt.doctorId)?.hospital;

  Future<void> _openVaccineMaps(VaccineBooking booking) async {
    await MapLauncher.showPlaceMapChoice(
      context,
      title: booking.facilityName,
      address: booking.placeLabel,
      latitude: booking.latitude,
      longitude: booking.longitude,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final user = context.watch<AuthCubit>().state.user;
    final schedule = context.watch<ScheduleCubit>().state;
    final nextAppt = schedule.nextDoctor;
    final nextVaccine = schedule.nextVaccine;
    final hospitalName = nextAppt == null ? null : doctorHospital(nextAppt);
    final firstName = user?.name.split(' ').first ?? '';

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          const SuwasiriBrandHeader(),
          const SizedBox(height: 22),
          Text(
            '${l.t('greeting')}, $firstName',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 6),
          Text(
            l.t('homeHelp'),
            style:
                Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 15),
          ),
          const SizedBox(height: 18),
          _SearchField(
            hint: l.t('searchDoctors'),
            onTap: () => widget.onNavigate(1),
          ),
          const SizedBox(height: 24),
          Text(
            l.t('quickActions'),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.calendar_month_rounded,
                  iconBg: AppColors.trustBlue,
                  label: l.t('bookAppointment'),
                  onTap: () => widget.onNavigate(1),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.videocam_rounded,
                  iconBg: AppColors.videoBrown,
                  label: l.t('videoConsultation'),
                  onTap: () => widget.onNavigate(2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.folder_special_rounded,
                  iconBg: AppColors.vaultGreen,
                  label: l.t('viewVault'),
                  onTap: () => widget.onNavigate(3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                l.t('upcoming'),
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  letterSpacing: 1.2,
                ),
              ),
              const Spacer(),
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: AppColors.trustBlue,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (nextAppt != null && nextAppt.isActiveSlot)
            _UpcomingAppointmentCard(
              appointment: nextAppt,
              hospitalName: hospitalName,
              upcomingLabel: l.t('upcoming'),
              detailsLabel: nextAppt.isVideo
                  ? l.t('openCallSession')
                  : l.t('viewDetailsMap'),
              modeLabel: nextAppt.isVideo
                  ? l.t('onlineVideoConsult')
                  : l.t('inPerson'),
              onDetails: () => _openAppointmentDetails(nextAppt),
            )
          else
            SoftCard(
              child: Text(
                l.t('noUpcoming'),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          if (nextVaccine != null) ...[
            const SizedBox(height: 12),
            _UpcomingVaccineCard(
              booking: nextVaccine,
              onDetails: () => _openVaccineMaps(nextVaccine),
            ),
          ],
          const SizedBox(height: 14),
          _HealthTipCard(
            title: l.t('healthTipTitle'),
            body: l.t('healthTipBody'),
          ),
        ],
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.hint, required this.onTap});

  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.search_rounded, color: AppColors.slateMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                hint,
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.iconBg,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final Color iconBg;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 16, 10, 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.trustBlueDark.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.trustBlueDark,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingAppointmentCard extends StatelessWidget {
  const _UpcomingAppointmentCard({
    required this.appointment,
    required this.upcomingLabel,
    required this.detailsLabel,
    required this.modeLabel,
    required this.onDetails,
    this.hospitalName,
  });

  final Appointment appointment;
  final String? hospitalName;
  final String upcomingLabel;
  final String detailsLabel;
  final String modeLabel;
  final VoidCallback onDetails;

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('MMM d, y').format(appointment.timeSlot);
    final time = DateFormat('hh:mm a').format(appointment.timeSlot);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.trustBlue,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlue.withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  upcomingLabel,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
              const Spacer(),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_outlined,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            appointment.doctorName,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 22,
            ),
          ),
          if (hospitalName != null && hospitalName!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              hospitalName!,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.95),
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ],
          const SizedBox(height: 4),
          Text(
            '${appointment.specialty} Consultation',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 14),
          Divider(color: Colors.white.withValues(alpha: 0.25), height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Text(
                date,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              const Icon(Icons.access_time, color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  '$time ($modeLabel)',
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.trustBlue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                elevation: 0,
              ),
              onPressed: onDetails,
              child: Text(
                detailsLabel,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UpcomingVaccineCard extends StatelessWidget {
  const _UpcomingVaccineCard({
    required this.booking,
    required this.onDetails,
  });

  final VaccineBooking booking;
  final VoidCallback onDetails;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final date = DateFormat('MMM d, y').format(booking.slot);
    final time = DateFormat('hh:mm a').format(booking.slot);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.emerald,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.emerald.withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  l.t('upcomingVaccine'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
              const Spacer(),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.vaccines_outlined,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            booking.vaccineName.isEmpty
                ? l.t('vaccineBooking')
                : booking.vaccineName,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            booking.facilityName,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.95),
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          if (booking.address.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              booking.address,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 13,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Divider(color: Colors.white.withValues(alpha: 0.25), height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Text(
                date,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              const Icon(Icons.access_time, color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Text(
                time,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.emerald,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                elevation: 0,
              ),
              onPressed: onDetails,
              child: Text(
                l.t('viewDetailsMap'),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HealthTipCard extends StatelessWidget {
  const _HealthTipCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.emeraldSoft,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.emerald.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFD1FAE5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.spa_outlined,
              color: AppColors.tipTeal,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.tipTeal,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: TextStyle(
                    color: AppColors.tipTeal.withValues(alpha: 0.85),
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

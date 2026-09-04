import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import 'clinic_practice.dart';
import 'doctor_booking_flow.dart';
import 'doctor_booking_shared.dart';
import 'doctor_profile_screen.dart';
import 'practice_availability.dart';

class ClinicHubScreen extends StatefulWidget {
  const ClinicHubScreen({
    super.key,
    required this.practice,
    this.initialVisitReason,
  });

  final ClinicPractice practice;
  final String? initialVisitReason;

  @override
  State<ClinicHubScreen> createState() => _ClinicHubScreenState();
}

class _ClinicHubScreenState extends State<ClinicHubScreen> {
  final _nextByDoctor = <String, DateTime?>{};
  bool _loadingSlots = true;

  @override
  void initState() {
    super.initState();
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    final health = context.read<HealthRepository>();
    final map = <String, DateTime?>{};
    for (final d in widget.practice.practitioners) {
      map[d.id] = await nextSlotForDoctor(health, d);
    }
    if (!mounted) return;
    setState(() {
      _nextByDoctor
        ..clear()
        ..addAll(map);
      _loadingSlots = false;
    });
  }

  Future<void> _bookClinic() async {
    final doctor = widget.practice.primaryDoctor;
    if (doctor == null || doctor.isClinicOnly) return;
    await startDoctorBooking(
      context,
      doctor: doctor,
      initialVisitReason: widget.initialVisitReason,
    );
    if (mounted) await _loadAvailability();
  }

  void _openDoctor(Doctor doctor) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => DoctorProfileScreen(
          doctor: doctor,
          practice: widget.practice,
          initialVisitReason: widget.initialVisitReason,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final p = widget.practice;
    final practitioners = p.practitioners;
    final phone = clinicPhoneForRegion(p.region);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.trustBlueDark,
        elevation: 0,
        title: Text(
          p.name,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const ClinicLogoPlaceholder(size: 64),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _LinkAction(
                          icon: Icons.favorite_border_rounded,
                          label: l.t('addToCareTeam'),
                          onTap: () {},
                        ),
                        const SizedBox(width: 16),
                        _LinkAction(
                          icon: Icons.ios_share_rounded,
                          label: l.t('share'),
                          onTap: () {},
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (p.placeLabel.isNotEmpty) ...[
            const Divider(height: 1),
            ClinicContactRow(
              label: p.placeLabel,
              actionLabel: l.t('map'),
              onAction: () => openClinicMap(
                address: p.placeLabel,
                latitude: p.latitude,
                longitude: p.longitude,
              ),
            ),
          ],
          if (phone.isNotEmpty) ...[
            const Divider(height: 1),
            ClinicContactRow(
              label: phone,
              actionLabel: l.t('call'),
              onAction: () => dialClinicPhone(phone),
            ),
          ],
          const Divider(height: 1),
          const SizedBox(height: 16),
          if (!p.clinicOnly)
            BookAppointmentButton(onPressed: _bookClinic),
          const SizedBox(height: 16),
          Text(
            l.t('gpCareClinicNotice'),
            style: const TextStyle(
              color: AppColors.trustBlue,
              fontSize: 13,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l.t('practitioners'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 8),
          if (practitioners.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                l.t('noDoctorsAtClinic'),
                style: const TextStyle(color: AppColors.slateMuted),
              ),
            )
          else
            ...practitioners.map((d) {
              final next = _nextByDoctor[d.id];
              return _PractitionerRow(
                doctor: d,
                nextSlot: next,
                loading: _loadingSlots,
                onTap: () => _openDoctor(d),
              );
            }),
        ],
      ),
    );
  }
}

class _LinkAction extends StatelessWidget {
  const _LinkAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: AppColors.trustBlue),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.trustBlue,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _PractitionerRow extends StatelessWidget {
  const _PractitionerRow({
    required this.doctor,
    required this.nextSlot,
    required this.loading,
    required this.onTap,
  });

  final Doctor doctor;
  final DateTime? nextSlot;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            children: [
              DoctorAvatar(doctor: doctor, radius: 30),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.name,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${doctor.specialty}, ${doctor.region}',
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l.t('appointmentsAvailableFrom'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 12,
                      ),
                    ),
                    if (loading)
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    else if (nextSlot != null)
                      Text(
                        formatNextAvailable(nextSlot!),
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      )
                    else
                      Text(
                        l.t('noSlotsSoon'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.slateMuted),
            ],
          ),
        ),
      ),
    );
  }
}

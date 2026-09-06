import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import 'clinic_practice.dart';
import 'doctor_booking_flow.dart';
import 'doctor_booking_shared.dart';
import 'doctor_slot_board.dart';
import 'practice_availability.dart';

class DoctorProfileScreen extends StatefulWidget {
  const DoctorProfileScreen({
    super.key,
    required this.doctor,
    required this.practice,
    this.initialVisitReason,
    this.homeService,
  });

  final Doctor doctor;
  final ClinicPractice practice;
  final String? initialVisitReason;
  final String? homeService;

  @override
  State<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends State<DoctorProfileScreen> {
  DateTime? _nextSlot;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNext();
  }

  Future<void> _loadNext() async {
    try {
      final health = context.read<HealthRepository>();
      final next = await nextSlotForDoctor(health, widget.doctor);
      if (!mounted) return;
      setState(() {
        _nextSlot = next;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _book({DateTime? slot}) async {
    await startDoctorBooking(
      context,
      doctor: widget.doctor,
      initialVisitReason: widget.initialVisitReason,
      homeService: widget.homeService,
      initialSlot: slot,
    );
    if (mounted) await _loadNext();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final d = widget.doctor;
    final phone = clinicPhoneForRegion(widget.practice.region);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.trustBlueDark,
        elevation: 0,
        title: Text(
          d.name,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        children: [
          TextButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.chevron_left_rounded, size: 18),
            label: Text(l.t('backToClinic').replaceAll('{clinic}', widget.practice.name)),
            style: TextButton.styleFrom(
              alignment: Alignment.centerLeft,
              foregroundColor: AppColors.trustBlue,
              padding: EdgeInsets.zero,
            ),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DoctorAvatar(doctor: d, radius: 36, circular: true),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      d.name,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${d.specialty}, ${d.region}',
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 13,
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
          const SizedBox(height: 16),
          BookAppointmentButton(onPressed: () => _book()),
          const SizedBox(height: 10),
          if (_nextSlot != null)
            Text(
              '${l.t('appointmentsAvailableFrom')} ${formatNextAvailable(_nextSlot!)}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.trustBlueDark,
                fontSize: 13,
              ),
            )
          else if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
          const SizedBox(height: 18),
          DoctorSlotBoard(
            doctor: d,
            onSelectSlot: (slot) => _book(slot: slot),
          ),
          const Divider(height: 32),
          if (widget.practice.placeLabel.isNotEmpty) ...[
            ClinicContactRow(
              label: widget.practice.placeLabel,
              actionLabel: l.t('map'),
              onAction: () => openClinicMap(
                address: widget.practice.placeLabel,
                latitude: widget.practice.latitude,
                longitude: widget.practice.longitude,
              ),
            ),
            const Divider(height: 1),
          ],
          if (phone.isNotEmpty) ...[
            ClinicContactRow(
              label: phone,
              actionLabel: l.t('call'),
              onAction: () => dialClinicPhone(phone),
            ),
            const Divider(height: 1),
          ],
          const SizedBox(height: 16),
          Text(
            l.t('gpCareClinicNotice'),
            style: const TextStyle(
              color: AppColors.trustBlue,
              fontSize: 13,
              height: 1.45,
            ),
          ),
          const Divider(height: 32),
          Text(
            l.t('professionalStatement'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            d.bio.isNotEmpty ? d.bio : l.t('defaultDoctorBio'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const Divider(height: 32),
          Text(
            l.t('areasOfInterest'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          ..._interestLines(d).map(
            (line) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('• ', style: TextStyle(color: AppColors.trustBlueDark)),
                  Expanded(
                    child: Text(
                      line,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<String> _interestLines(Doctor d) {
    if (d.specialty.isNotEmpty) return [d.specialty];
    return ['General practice'];
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

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../localization/app_localizations.dart';
import 'doctor_booking_shared.dart';

enum PatientVisitType { existing, newPatient }

/// HotDoc-style step before slot selection.
Future<PatientVisitType?> showPatientTypeSheet(
  BuildContext context, {
  required Doctor doctor,
}) {
  return showModalBottomSheet<PatientVisitType>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => _PatientTypeSheet(doctor: doctor),
  );
}

class _PatientTypeSheet extends StatelessWidget {
  const _PatientTypeSheet({required this.doctor});

  final Doctor doctor;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DoctorAvatar(doctor: doctor, radius: 28),
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
                        fontSize: 17,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l.t('atClinicName').replaceAll('{clinic}', doctor.hospital),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Stack(
            children: [
              Container(height: 3, color: AppColors.border.withValues(alpha: 0.5)),
              Container(
                width: 72,
                height: 3,
                color: bookingGreen,
              ),
            ],
          ),
          const SizedBox(height: 36),
          Text(
            l.t('seenAtClinicBefore'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 22,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 28),
          _PatientTypeButton(
            label: l.t('existingPatient'),
            onTap: () => Navigator.pop(context, PatientVisitType.existing),
          ),
          const SizedBox(height: 12),
          _PatientTypeButton(
            label: l.t('newPatient'),
            onTap: () => Navigator.pop(context, PatientVisitType.newPatient),
          ),
        ],
      ),
    );
  }
}

class _PatientTypeButton extends StatelessWidget {
  const _PatientTypeButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.trustBlueDark,
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        child: Text(label),
      ),
    );
  }
}

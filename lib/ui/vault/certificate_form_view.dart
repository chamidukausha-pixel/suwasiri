import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../data/catalogs/patient_health_samples.dart';
import '../../data/models/user_profile.dart';
import '../../localization/app_localizations.dart';

/// Formal digital doctor certificate layout for Vault.
class CertificateFormView extends StatelessWidget {
  const CertificateFormView({
    super.key,
    required this.certificate,
    this.patient,
  });

  final DoctorCertificate certificate;
  final UserProfile? patient;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final patientName =
        (patient?.name.isNotEmpty == true) ? patient!.name : 'Patient';
    final healthId = patient?.barcodeNumber ??
        patient?.ceylonHealthId ??
        patient?.nic ??
        '—';
    final dateStr = DateFormat('d MMMM yyyy').format(certificate.date);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFDDD6FE), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF5F3FF),
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Column(
              children: [
                Text(
                  l.t('digitalCertificate'),
                  style: const TextStyle(
                    color: Color(0xFF7C3AED),
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  certificate.title.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _CertRow(label: l.t('certificateNo'), value: certificate.certificateNo),
                _CertRow(label: l.t('issuedDate'), value: dateStr),
                _CertRow(label: l.t('patientName'), value: patientName),
                _CertRow(label: l.t('healthIdLabel'), value: healthId),
                _CertRow(label: l.t('issuedDoctorName'), value: certificate.doctor),
                _CertRow(
                  label: l.t('issuedHospitalClinic'),
                  value: certificate.clinicName,
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Text(
                  l.t('certificateBody'),
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  certificate.body,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 20),
                Align(
                  alignment: Alignment.centerRight,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        certificate.doctor,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        l.t('doctorSignature'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l.t('certificateFooter'),
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 10,
                    height: 1.35,
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

class _CertRow extends StatelessWidget {
  const _CertRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.trustBlueDark,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

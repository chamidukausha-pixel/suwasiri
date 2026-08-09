import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../data/models/user_profile.dart';
import '../../data/models/vault_report.dart';
import '../../localization/app_localizations.dart';

/// Dual-copy formal e-prescription layout (pharmacist + MediLanka / NMRA).
class PrescriptionFormView extends StatelessWidget {
  const PrescriptionFormView({
    super.key,
    required this.medicines,
    required this.doctorName,
    required this.clinicName,
    this.patient,
  });

  final List<Prescription> medicines;
  final String doctorName;
  final String clinicName;
  final UserProfile? patient;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l.t('issuedPrescriptionForm'),
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _FormCopy(
                width: 280,
                sidebarLabel: l.t('rxPharmacistCopy'),
                patientFooter: false,
                medicines: medicines,
                patient: patient,
                doctorName: doctorName,
                clinicName: clinicName,
              ),
              const SizedBox(width: 10),
              _FormCopy(
                width: 280,
                sidebarLabel: l.t('rxAgencyCopy'),
                patientFooter: true,
                medicines: medicines,
                patient: patient,
                doctorName: doctorName,
                clinicName: clinicName,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FormCopy extends StatelessWidget {
  const _FormCopy({
    required this.width,
    required this.sidebarLabel,
    required this.patientFooter,
    required this.medicines,
    required this.doctorName,
    required this.clinicName,
    this.patient,
  });

  final double width;
  final String sidebarLabel;
  final bool patientFooter;
  final List<Prescription> medicines;
  final UserProfile? patient;
  final String doctorName;
  final String clinicName;

  static const _ink = Color(0xFF1A1A1A);
  static const _teal = Color(0xFFB8D4D8);
  static const _tealDeep = Color(0xFF7BA8B0);
  static const _bodyWash = Color(0xFFE8F4F6);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final issued = medicines.isNotEmpty
        ? (medicines.first.issuedAt ?? DateTime.now())
        : DateTime.now();
    final dateStr = DateFormat('dd/MM/yyyy').format(issued);
    final digits = medicines.isNotEmpty
        ? medicines.first.code.replaceAll(RegExp(r'[^0-9]'), '')
        : '';
    final scriptNo = digits.isEmpty
        ? '00003194'
        : digits.padLeft(8, '0').substring(digits.padLeft(8, '0').length - 8);
    final patientName =
        patient?.name.isNotEmpty == true ? patient!.name : 'Kamal Gunasekara';
    final healthId = patient?.ceylonHealthId?.isNotEmpty == true
        ? patient!.ceylonHealthId!
        : (patient?.nic?.isNotEmpty == true ? patient!.nic! : '1234 56789 0-1');
    final address = [
      if (patient?.region != null && patient!.region!.isNotEmpty) patient!.region!,
      'Sri Lanka',
    ].join(', ');
    final phone = patient?.mobileNo?.isNotEmpty == true
        ? patient!.mobileNo!
        : '+94 11 214 0000';

    return Container(
      width: width,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF9CA3AF), width: 1.2),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 22,
              color: _teal,
              alignment: Alignment.center,
              child: RotatedBox(
                quarterTurns: 3,
                child: Text(
                  sidebarLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF334155),
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          doctorName,
                          style: const TextStyle(
                            color: _ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                          ),
                        ),
                        Text(clinicName,
                            style: const TextStyle(color: _ink, fontSize: 9)),
                        const SizedBox(height: 2),
                        Text(
                          '${l.t('rxPrescriberNo')} 1234567',
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                        Text(
                          'Phone: $phone',
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    color: _teal.withValues(alpha: 0.45),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "${l.t('rxPatientHealthId')}  $healthId",
                          style: const TextStyle(
                            color: _ink,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.7),
                            border: Border.all(color: _tealDeep),
                          ),
                          child: Text(
                            l.t('rxEntitlementNo'),
                            style: const TextStyle(color: _ink, fontSize: 8),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "${l.t('rxPatientName')}: $patientName",
                          style: const TextStyle(
                            color: _ink,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          "${l.t('rxAddress')}: $address",
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 6, 8, 4),
                    child: Row(
                      children: [
                        Text(
                          '${l.t('rxDate')} $dateStr',
                          style: const TextStyle(
                            color: _ink,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        _TinyCheck(label: l.t('rxPrivate'), checked: true),
                        const SizedBox(width: 6),
                        _TinyCheck(label: l.t('rxFormulary'), checked: false),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: _TinyCheck(label: l.t('rxBrandSub'), checked: false),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
                    decoration: BoxDecoration(
                      color: _bodyWash,
                      border:
                          Border.all(color: _tealDeep.withValues(alpha: 0.6)),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Align(
                          alignment: Alignment.centerRight,
                          child: Text(
                            '${l.t('rxScriptNo')}: $scriptNo',
                            style: const TextStyle(
                              color: _ink,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        ...medicines.map((m) {
                          final qty = m.doseBadge.toUpperCase() == 'PRN'
                              ? '1'
                              : (RegExp(r'(\d+)')
                                      .firstMatch(m.doseBadge)
                                      ?.group(1) ??
                                  '1');
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  m.medicine,
                                  style: const TextStyle(
                                    color: _ink,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                if (m.schedule.isNotEmpty)
                                  Text(
                                    m.schedule,
                                    style: const TextStyle(
                                        color: _ink, fontSize: 10),
                                  ),
                                const SizedBox(height: 2),
                                Text(
                                  '${l.t('rxQuantity')}: $qty    0 ${l.t('rxRepeats')}',
                                  style: const TextStyle(
                                    color: _ink,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Text(
                                '$doctorName, MBBS',
                                style: const TextStyle(
                                  color: _ink,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              '${medicines.length} ${l.t('rxItemsPrinted')}',
                              style:
                                  const TextStyle(color: _ink, fontSize: 8),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (!patientFooter)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(6, 0, 6, 6),
                      padding: const EdgeInsets.all(8),
                      color: _teal,
                      child: Text(
                        l.t('rxDoctorSign'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF1E3A3F),
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(6, 0, 6, 6),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _teal.withValues(alpha: 0.55),
                        border: Border.all(color: _tealDeep),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l.t('rxPatientDeclare'),
                            style: const TextStyle(
                              color: _ink,
                              fontSize: 8,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            l.t('rxPatientSignature'),
                            style: const TextStyle(color: _ink, fontSize: 8),
                          ),
                          Container(
                            margin: const EdgeInsets.only(top: 2, bottom: 6),
                            height: 1,
                            color: _ink.withValues(alpha: 0.35),
                          ),
                          Text(
                            '${l.t('rxDateOfSupply')}   /   /',
                            style: const TextStyle(color: _ink, fontSize: 8),
                          ),
                        ],
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        l.t('rxPrivacyNote'),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 7,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TinyCheck extends StatelessWidget {
  const _TinyCheck({required this.label, required this.checked});

  final String label;
  final bool checked;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF1A1A1A)),
            color: checked ? const Color(0xFF1A1A1A) : Colors.white,
          ),
          child: checked
              ? const Icon(Icons.check, size: 8, color: Colors.white)
              : null,
        ),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF1A1A1A),
            fontSize: 8,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

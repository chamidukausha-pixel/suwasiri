import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/patient_health_samples.dart';
import '../../data/models/vault_report.dart';
import '../../data/services/prescription_export_service.dart';
import '../../localization/app_localizations.dart';
import '../telehealth/prescription_detail_sheet.dart';
import '../widgets/common_widgets.dart';
import '../widgets/sheet_close_bar.dart';
import 'certificate_form_view.dart';
import 'lab_report_detail_sheet.dart';
import 'prescription_form_view.dart';

/// Pending e-prescriptions only — shown above AI Lab Assistant in Vault.
class VaultEPrescriptionSection extends StatelessWidget {
  const VaultEPrescriptionSection({super.key, required this.state});

  final VaultState state;

  Future<void> _openClinic(
    BuildContext context,
    List<Prescription> meds,
  ) async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null || meds.isEmpty) return;
    final first = meds.first;
    await showPrescriptionDetailSheet(
      context: context,
      medicines: meds,
      clinicName: first.clinicName,
      doctorName: first.doctor,
      patient: user,
      mediLankaSynced: false,
      showFormalForm: true,
      onSyncMediLanka: () async {
        await context.read<VaultCubit>().sendMedicinesToMediLanka(
              patientId: user.id,
              medicines: meds,
            );
        if (!context.mounted) return;
        await context.read<NotificationCubit>().load();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final pending = latestPendingPrescription(state.pendingMedicines);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 5,
              decoration: const BoxDecoration(
                color: AppColors.trustBlue,
                borderRadius: BorderRadius.horizontal(left: Radius.circular(20)),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 16, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.description_outlined,
                            color: AppColors.trustBlue, size: 22),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            l.t('ePrescription'),
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l.t('latestDoctorRxOnly'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (pending.isEmpty)
                      Text(
                        l.t('noPendingMedicines'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontStyle: FontStyle.italic,
                          fontSize: 13,
                        ),
                      )
                    else ...[
                      Text(
                        '${l.t('issuedDate')}: ${pending.first.issuedAt != null ? DateFormat('d MMM yyyy · hh:mm a').format(pending.first.issuedAt!) : '—'}',
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        pending.first.clinicName,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        pending.first.doctor,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${l.t('mediLankaIssuedNo')}: ${pending.first.prescriberNumber}',
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      MinTap(
                        enforceMinSize: false,
                        onTap: () => _openClinic(context, pending),
                        child: PrescriptionFormView(
                          medicines: pending,
                          doctorName: pending.first.doctor,
                          clinicName: pending.first.clinicName,
                          patient: context.read<AuthCubit>().state.user,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Issued Medical History with colored category tiles.
class IssuedMedicalHistorySection extends StatelessWidget {
  const IssuedMedicalHistorySection({super.key, required this.state});

  final VaultState state;

  static const _medColor = Color(0xFF1A66FF);
  static const _labColor = Color(0xFF0D9488);
  static const _vaxColor = Color(0xFF059669);
  static const _certColor = Color(0xFF7C3AED);
  static const _noteColor = Color(0xFFD97706);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final patientId =
        context.watch<AuthCubit>().state.user?.id ?? 'sample';
    final history = state.historyMedicines.isNotEmpty
        ? state.historyMedicines
        : PatientHealthSamples.historyMedicines(patientId: patientId);
    final labs = state.labReports.isNotEmpty
        ? state.labReports
        : PatientHealthSamples.sampleLabReports(patientId: patientId);
    final vaccines = state.vaccineHistory.isNotEmpty
        ? state.vaccineHistory
        : PatientHealthSamples.vaccineHistory(patientId: patientId);
    final notes = state.treatmentNotes.isNotEmpty
        ? state.treatmentNotes
        : PatientHealthSamples.treatmentNotes(patientId: patientId);
    final certificates = state.certificates.isNotEmpty
        ? state.certificates
        : PatientHealthSamples.doctorCertificates(patientId: patientId);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l.t('issuedMedicalHistory'),
          style: const TextStyle(
            color: AppColors.trustBlueDark,
            fontWeight: FontWeight.w800,
            fontSize: 17,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          l.t('issuedMedicalHistoryHint'),
          style: const TextStyle(
            color: AppColors.slateMuted,
            fontSize: 12,
            height: 1.35,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _CategoryTile(
                icon: Icons.medication_outlined,
                title: l.t('issuedMedicines'),
                count: history.length,
                color: _medColor,
                selected: state.healthTab == HealthHistoryTab.medicines,
                onTap: () => context
                    .read<VaultCubit>()
                    .setHealthTab(HealthHistoryTab.medicines),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _CategoryTile(
                icon: Icons.biotech_outlined,
                title: l.t('labReports'),
                count: labs.length,
                color: _labColor,
                selected: state.healthTab == HealthHistoryTab.labs,
                onTap: () => context
                    .read<VaultCubit>()
                    .setHealthTab(HealthHistoryTab.labs),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _CategoryTile(
                icon: Icons.vaccines_outlined,
                title: l.t('vaccineHistory'),
                count: vaccines.length,
                color: _vaxColor,
                selected: state.healthTab == HealthHistoryTab.vaccines,
                onTap: () => context
                    .read<VaultCubit>()
                    .setHealthTab(HealthHistoryTab.vaccines),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _CategoryTile(
                icon: Icons.workspace_premium_outlined,
                title: l.t('doctorCertificates'),
                count: certificates.length,
                color: _certColor,
                selected: state.healthTab == HealthHistoryTab.certificates,
                onTap: () => context
                    .read<VaultCubit>()
                    .setHealthTab(HealthHistoryTab.certificates),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _CategoryTile(
                icon: Icons.note_alt_outlined,
                title: l.t('treatmentNotes'),
                count: notes.length,
                color: _noteColor,
                selected: state.healthTab == HealthHistoryTab.notes,
                onTap: () =>
                    context.read<VaultCubit>().setHealthTab(HealthHistoryTab.notes),
              ),
            ),
            const Expanded(child: SizedBox()),
          ],
        ),
        const SizedBox(height: 14),
        if (state.healthTab == HealthHistoryTab.medicines)
          _HistoryMedicinesList(medicines: history)
        else if (state.healthTab == HealthHistoryTab.labs)
          _LabsList(labs: labs)
        else if (state.healthTab == HealthHistoryTab.vaccines)
          _VaccinesList(entries: vaccines)
        else if (state.healthTab == HealthHistoryTab.certificates)
          _CertificatesList(certificates: certificates)
        else
          _NotesList(notes: notes),
      ],
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.icon,
    required this.title,
    required this.count,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final int count;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return MinTap(
      enforceMinSize: false,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.14) : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? color : AppColors.border,
            width: selected ? 1.6 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              l.t('recordsCount').replaceAll('{count}', '$count'),
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryMedicinesList extends StatelessWidget {
  const _HistoryMedicinesList({required this.medicines});

  final List<Prescription> medicines;

  Future<void> _open(BuildContext context, List<Prescription> group) async {
    final user = context.read<AuthCubit>().state.user;
    if (group.isEmpty) return;
    final first = group.first;
    await showPrescriptionDetailSheet(
      context: context,
      medicines: group,
      clinicName: first.clinicName,
      doctorName: first.doctor,
      patient: user,
      mediLankaSynced: true,
      showFormalForm: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (medicines.isEmpty) {
      return EmptyHint(l.t('noMedicines'));
    }
    final byClinic = <String, List<Prescription>>{};
    for (final p in medicines) {
      byClinic.putIfAbsent(p.clinicName, () => []).add(p);
    }
    return Column(
      children: [
        for (final e in byClinic.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => _open(context, e.value),
              child: SoftCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${l.t('issuedDate')}: ${e.value.first.issuedAt != null ? DateFormat('d MMM yyyy').format(e.value.first.issuedAt!) : '—'}',
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      e.key,
                      style: const TextStyle(
                        color: Color(0xFF1A66FF),
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    Text(
                      e.value.first.doctor,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    ...e.value.map(
                      (m) => Text(
                        '• ${m.medicine}',
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _LabsList extends StatelessWidget {
  const _LabsList({required this.labs});

  final List<VaultReport> labs;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (labs.isEmpty) return EmptyHint(l.t('noReports'));
    return Column(
      children: [
        for (final r in labs)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => showLabReportDetailSheet(context: context, report: r),
              child: SoftCard(
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D9488).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.biotech_outlined,
                          color: Color(0xFF0D9488)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r.title,
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            '${r.facility ?? r.issuedBy} · ${DateFormat('d MMM yyyy').format(r.date)}',
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.slateMuted),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _VaccinesList extends StatelessWidget {
  const _VaccinesList({required this.entries});

  final List<VaccineHistoryEntry> entries;

  void _open(BuildContext context, VaccineHistoryEntry e) {
    final l = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Spacer(),
                  SheetCloseActions(),
                ],
              ),
              Text(
                l.t('vaccineDetailTitle'),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                e.vaccineName,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 10),
              _kv(l.t('issuedByLabel'), e.issuer),
              _kv(l.t('medicalClinic'), e.facility),
              _kv(l.t('issuedDate'), DateFormat('d MMM yyyy').format(e.date)),
              _kv(l.t('batchCode'), e.batchCode),
              _kv('Dose', e.doseLabel),
            ],
          ),
        );
      },
    );
  }

  Widget _kv(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              k,
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              v,
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

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (entries.isEmpty) return EmptyHint(l.t('noVaccineHistory'));
    return Column(
      children: [
        for (final e in entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => _open(context, e),
              child: SoftCard(
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.vaccines_outlined,
                          color: Color(0xFF059669)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            e.vaccineName,
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            '${e.issuer} · ${DateFormat('d MMM yyyy').format(e.date)}',
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.slateMuted),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _CertificatesList extends StatelessWidget {
  const _CertificatesList({required this.certificates});

  final List<DoctorCertificate> certificates;

  Future<void> _open(BuildContext context, DoctorCertificate c) async {
    final l = AppLocalizations.of(context);
    final user = context.read<AuthCubit>().state.user;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: AppColors.canvas,
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.88,
          minChildSize: 0.5,
          maxChildSize: 0.97,
          builder: (context, scrollCtrl) {
            return ListView(
              controller: scrollCtrl,
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                20 + MediaQuery.paddingOf(ctx).bottom,
              ),
              children: [
                const Row(
                  children: [
                    Spacer(),
                    SheetCloseActions(),
                  ],
                ),
                Text(
                  l.t('certificateDetail'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    color: Color(0xFF7C3AED),
                  ),
                ),
                const SizedBox(height: 12),
                CertificateFormView(certificate: c, patient: user),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        await PrescriptionExportService.downloadCertificatePdf(
                          certificate: c,
                          patient: user,
                        );
                        if (!context.mounted) return;
                        Navigator.of(ctx).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(l.t('certReady'))),
                        );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${l.t('rxPdfFailed')}: $e'),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.download_outlined),
                    label: Text(l.t('downloadCertificate')),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () async {
                      final email = user?.email ?? '';
                      if (email.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(l.t('rxEmailMissing'))),
                        );
                        return;
                      }
                      try {
                        await PrescriptionExportService.emailCertificate(
                          certificate: c,
                          toEmail: email,
                          patient: user,
                        );
                        if (!context.mounted) return;
                        Navigator.of(ctx).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(l.t('certEmailSent'))),
                        );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('$e')),
                        );
                      }
                    },
                    icon: const Icon(Icons.email_outlined),
                    label: Text(l.t('emailCertificate')),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (certificates.isEmpty) return EmptyHint(l.t('noCertificates'));
    return Column(
      children: [
        for (final c in certificates)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => _open(context, c),
              child: SoftCard(
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.workspace_premium_outlined,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c.title,
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            '${c.doctor} · ${DateFormat('d MMM yyyy').format(c.date)}',
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.slateMuted),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _NotesList extends StatelessWidget {
  const _NotesList({required this.notes});

  final List<TreatmentNote> notes;

  void _open(BuildContext context, TreatmentNote n) {
    final l = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            8,
            20,
            20 + MediaQuery.paddingOf(ctx).bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Spacer(),
                  SheetCloseActions(),
                ],
              ),
              Text(
                l.t('treatmentNotes'),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                n.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${n.doctor} · ${n.clinicName}',
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                DateFormat('d MMM yyyy').format(n.date),
                style: const TextStyle(color: AppColors.slateMuted, fontSize: 12),
              ),
              const SizedBox(height: 12),
              Text(
                n.body,
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (notes.isEmpty) {
      return EmptyHint(l.t('noTreatmentNotes'));
    }
    return Column(
      children: [
        for (final n in notes)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => _open(context, n),
              child: SoftCard(
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD97706).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.note_alt_outlined,
                          color: Color(0xFFD97706)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            n.title,
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            '${n.doctor} · ${DateFormat('d MMM yyyy').format(n.date)}',
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.slateMuted),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}


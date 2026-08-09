import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/patient_health_samples.dart';
import '../../data/models/vault_report.dart';
import '../../localization/app_localizations.dart';
import '../telehealth/prescription_detail_sheet.dart';
import '../widgets/common_widgets.dart';

/// Active patient health: Issued Medicines / Lab Reports / Vaccine History.
class PatientHealthHistorySection extends StatelessWidget {
  const PatientHealthHistorySection({
    super.key,
    required this.state,
    required this.onOpenLab,
  });

  final VaultState state;
  final void Function(VaultReport report) onOpenLab;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final pending = state.pendingMedicines;
    final labs = state.labReports;
    final vaccines = state.vaccineHistory;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.t('patientHealthTreatmentHistory'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            l.t('patientHealthHint'),
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
                child: _TabChip(
                  label: l.t('issuedMedicines'),
                  count: pending.length,
                  selected: state.healthTab == HealthHistoryTab.medicines,
                  onTap: () => context
                      .read<VaultCubit>()
                      .setHealthTab(HealthHistoryTab.medicines),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _TabChip(
                  label: l.t('labReports'),
                  count: labs.length,
                  selected: state.healthTab == HealthHistoryTab.labs,
                  onTap: () => context
                      .read<VaultCubit>()
                      .setHealthTab(HealthHistoryTab.labs),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _TabChip(
                  label: l.t('vaccineHistory'),
                  count: vaccines.length,
                  selected: state.healthTab == HealthHistoryTab.vaccines,
                  onTap: () => context
                      .read<VaultCubit>()
                      .setHealthTab(HealthHistoryTab.vaccines),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (state.healthTab == HealthHistoryTab.medicines)
            _PendingMedicinesPanel(state: state)
          else if (state.healthTab == HealthHistoryTab.labs)
            _LabsPanel(labs: labs, onOpen: onOpenLab)
          else
            _VaccinesPanel(entries: vaccines),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      enforceMinSize: false,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.trustBlueSoft : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.trustBlue : AppColors.border,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: selected ? AppColors.trustBlueDark : AppColors.slateMuted,
                fontWeight: FontWeight.w800,
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '$count',
              style: TextStyle(
                color: selected ? AppColors.trustBlue : AppColors.slateMuted,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingMedicinesPanel extends StatelessWidget {
  const _PendingMedicinesPanel({required this.state});

  final VaultState state;

  Future<void> _openGroup(
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
    final pending = state.pendingMedicines;
    if (pending.isEmpty) {
      return Text(
        l.t('noPendingMedicines'),
        style: const TextStyle(
          color: AppColors.slateMuted,
          fontSize: 13,
          fontStyle: FontStyle.italic,
        ),
      );
    }

    final byClinic = <String, List<Prescription>>{};
    for (final p in pending) {
      byClinic.putIfAbsent(p.clinicName, () => []).add(p);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l.t('pendingPharmacyRx'),
          style: const TextStyle(
            color: AppColors.slateMuted,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        ...byClinic.entries.map((e) {
          final first = e.value.first;
          final date = first.issuedAt != null
              ? DateFormat('d MMM yyyy').format(first.issuedAt!)
              : '—';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => _openGroup(context, e.value),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${l.t('issuedDate')}: $date',
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      e.key,
                      style: const TextStyle(
                        color: AppColors.trustBlue,
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    Text(
                      first.doctor,
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
          );
        }),
        if (state.treatmentNotes.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            l.t('treatmentNotes'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 6),
          ...state.treatmentNotes.take(3).map(
                (n) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.trustBlueSoft.withValues(alpha: 0.45),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          n.title,
                          style: const TextStyle(
                            color: AppColors.trustBlueDark,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '${n.doctor} · ${DateFormat('d MMM yyyy').format(n.date)}',
                          style: const TextStyle(
                            color: AppColors.slateMuted,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          n.body,
                          style: const TextStyle(
                            color: AppColors.trustBlueDark,
                            fontSize: 12,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        ],
      ],
    );
  }
}

class _LabsPanel extends StatelessWidget {
  const _LabsPanel({required this.labs, required this.onOpen});

  final List<VaultReport> labs;
  final void Function(VaultReport report) onOpen;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (labs.isEmpty) {
      return Text(
        l.t('noReports'),
        style: const TextStyle(
          color: AppColors.slateMuted,
          fontStyle: FontStyle.italic,
        ),
      );
    }
    return Column(
      children: [
        for (final r in labs)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => onOpen(r),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.biotech_outlined,
                        color: AppColors.trustBlue),
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

class _VaccinesPanel extends StatelessWidget {
  const _VaccinesPanel({required this.entries});

  final List<VaccineHistoryEntry> entries;

  void _openDetail(BuildContext context, VaccineHistoryEntry e) {
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
              const SizedBox(height: 8),
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
    if (entries.isEmpty) {
      return Text(
        l.t('noVaccineHistory'),
        style: const TextStyle(
          color: AppColors.slateMuted,
          fontStyle: FontStyle.italic,
        ),
      );
    }
    return Column(
      children: [
        for (final e in entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MinTap(
              enforceMinSize: false,
              onTap: () => _openDetail(context, e),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.vaccines_outlined,
                        color: AppColors.emerald),
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

Future<void> showLabReportDetailSheet({
  required BuildContext context,
  required VaultReport report,
}) {
  final l = AppLocalizations.of(context);
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          8,
          20,
          20 + MediaQuery.paddingOf(ctx).bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l.t('labReportDetail'),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                report.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${report.facility ?? report.issuedBy} · ${DateFormat('d MMM yyyy').format(report.date)}',
                style: const TextStyle(color: AppColors.slateMuted, fontSize: 13),
              ),
              if (report.requestedBy != null) ...[
                const SizedBox(height: 4),
                Text(
                  '${l.t('issuedByLabel')}: ${report.requestedBy}',
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 14),
              ...report.metrics.map(
                (m) => Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          m.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.trustBlueDark,
                          ),
                        ),
                      ),
                      Text(
                        m.value,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.trustBlueDark,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        m.status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: m.status == 'normal'
                              ? AppColors.emerald
                              : AppColors.warning,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

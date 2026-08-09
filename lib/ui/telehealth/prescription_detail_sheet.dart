import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/user_profile.dart';
import '../../data/models/vault_report.dart';
import '../../data/services/prescription_export_service.dart';
import '../../localization/app_localizations.dart';
import '../vault/prescription_form_view.dart';

/// Sheet showing a doctor's issued script with email / MediLanka / PDF actions.
Future<void> showPrescriptionDetailSheet({
  required BuildContext context,
  required List<Prescription> medicines,
  required String clinicName,
  required String doctorName,
  UserProfile? patient,
  Future<void> Function()? onSyncMediLanka,
  bool mediLankaSynced = false,
  bool showFormalForm = false,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (ctx) {
      return _PrescriptionDetailSheet(
        medicines: medicines,
        clinicName: clinicName,
        doctorName: doctorName,
        patient: patient,
        onSyncMediLanka: onSyncMediLanka,
        mediLankaSynced: mediLankaSynced,
        showFormalForm: showFormalForm,
      );
    },
  );
}

class _PrescriptionDetailSheet extends StatefulWidget {
  const _PrescriptionDetailSheet({
    required this.medicines,
    required this.clinicName,
    required this.doctorName,
    this.patient,
    this.onSyncMediLanka,
    this.mediLankaSynced = false,
    this.showFormalForm = false,
  });

  final List<Prescription> medicines;
  final String clinicName;
  final String doctorName;
  final UserProfile? patient;
  final Future<void> Function()? onSyncMediLanka;
  final bool mediLankaSynced;
  final bool showFormalForm;

  @override
  State<_PrescriptionDetailSheet> createState() =>
      _PrescriptionDetailSheetState();
}

class _PrescriptionDetailSheetState extends State<_PrescriptionDetailSheet> {
  bool _busyEmail = false;
  bool _busyPdf = false;
  bool _busySync = false;
  late bool _synced;

  @override
  void initState() {
    super.initState();
    _synced = widget.mediLankaSynced ||
        widget.medicines.every((m) => m.sentToPharmacare);
  }

  Future<void> _email() async {
    final l = AppLocalizations.of(context);
    final email = widget.patient?.email;
    if (email == null || email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('rxEmailMissing'))),
      );
      return;
    }
    setState(() => _busyEmail = true);
    try {
      await PrescriptionExportService.emailPrescription(
        medicines: widget.medicines,
        clinicName: widget.clinicName,
        doctorName: widget.doctorName,
        toEmail: email,
        patient: widget.patient,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('rxEmailOpened'))),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('rxEmailFailed'))),
      );
    } finally {
      if (mounted) setState(() => _busyEmail = false);
    }
  }

  Future<void> _pdf() async {
    final l = AppLocalizations.of(context);
    setState(() => _busyPdf = true);
    try {
      await PrescriptionExportService.downloadPdf(
        medicines: widget.medicines,
        clinicName: widget.clinicName,
        doctorName: widget.doctorName,
        patient: widget.patient,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('rxPdfReady'))),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('rxPdfFailed'))),
      );
    } finally {
      if (mounted) setState(() => _busyPdf = false);
    }
  }

  Future<void> _sync() async {
    if (widget.onSyncMediLanka == null || _synced) return;
    final l = AppLocalizations.of(context);
    setState(() => _busySync = true);
    try {
      await widget.onSyncMediLanka!();
      if (!mounted) return;
      setState(() => _synced = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('mediLankaSynced'))),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('mediLankaFailed'))),
      );
    } finally {
      if (mounted) setState(() => _busySync = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final issued = widget.medicines.isNotEmpty
        ? widget.medicines.first.issuedAt
        : null;
    final issuedLabel = issued != null
        ? DateFormat('d MMM yyyy · hh:mm a').format(issued)
        : '—';
    final bottom = MediaQuery.paddingOf(context).bottom;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.82,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollCtrl) {
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 10, 16, 12 + bottom),
          child: ListView(
            controller: scrollCtrl,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                l.t('issuedPrescription'),
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${l.t('issuedDate')}: $issuedLabel',
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.clinicName,
                style: const TextStyle(
                  color: AppColors.trustBlue,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                widget.doctorName,
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 14),
              if (widget.showFormalForm) ...[
                PrescriptionFormView(
                  medicines: widget.medicines,
                  doctorName: widget.doctorName,
                  clinicName: widget.clinicName,
                  patient: widget.patient,
                ),
                const SizedBox(height: 14),
              ],
              if (!widget.showFormalForm)
                ...widget.medicines.map(
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.medicine,
                                style: const TextStyle(
                                  color: AppColors.trustBlueDark,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                ),
                              ),
                              if (m.schedule.isNotEmpty) ...[
                                const SizedBox(height: 3),
                                Text(
                                  m.schedule,
                                  style: const TextStyle(
                                    color: AppColors.slateMuted,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            m.doseBadge.isEmpty ? m.code : m.doseBadge,
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 8),
              Text(
                l.t('rxActionsHint'),
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 12),
              _ActionButton(
                icon: Icons.email_outlined,
                label: l.t('rxSendEmail'),
                busy: _busyEmail,
                onTap: _busyEmail ? null : _email,
              ),
              const SizedBox(height: 8),
              _ActionButton(
                icon: Icons.cloud_sync_outlined,
                label: _synced ? l.t('mediLankaSynced') : l.t('rxSyncMediLanka'),
                busy: _busySync,
                filled: true,
                onTap: (_busySync || _synced || widget.onSyncMediLanka == null)
                    ? null
                    : _sync,
              ),
              const SizedBox(height: 8),
              _ActionButton(
                icon: Icons.picture_as_pdf_outlined,
                label: l.t('rxDownloadPdf'),
                busy: _busyPdf,
                onTap: _busyPdf ? null : _pdf,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.busy,
    this.filled = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool busy;
  final bool filled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final child = busy
        ? const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Icon(icon, size: 20);

    if (filled) {
      return SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: onTap,
          icon: child,
          label: Text(label),
        ),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: child,
        label: Text(label),
      ),
    );
  }
}

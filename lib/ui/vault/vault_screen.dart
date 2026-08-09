import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/vault_report.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'patient_health_section.dart';

class VaultScreen extends StatefulWidget {
  const VaultScreen({super.key});

  @override
  State<VaultScreen> createState() => _VaultScreenState();
}

class _VaultScreenState extends State<VaultScreen> {
  final _aiQuestion = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tryUnlock();
  }

  Future<void> _tryUnlock() async {
    final vault = context.read<VaultCubit>();
    final auth = context.read<AuthCubit>();
    await vault.unlock(auth.unlockVault);
    final user = auth.state.user;
    if (user != null && vault.state.unlocked) {
      await vault.load(user.id);
    }
  }

  @override
  void dispose() {
    _aiQuestion.dispose();
    super.dispose();
  }

  Future<void> _showAiSheet(VaultState state) async {
    final l = AppLocalizations.of(context);
    final cubit = context.read<VaultCubit>();
    if (state.selectedReport == null && state.reports.isNotEmpty) {
      final ready = state.reports.where((r) => r.readyForAi);
      cubit.selectReport(ready.isNotEmpty ? ready.first : state.reports.first);
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            bottom: MediaQuery.viewInsetsOf(ctx).bottom + 16,
            top: 8,
          ),
          child: BlocBuilder<VaultCubit, VaultState>(
            builder: (context, s) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    l.t('aiLabAssistant'),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      color: AppColors.trustBlueDark,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    s.selectedReport == null
                        ? l.t('aiSelectReport')
                        : '${l.t('askingAbout')}: ${s.selectedReport!.title}',
                    style: const TextStyle(color: AppColors.slateMuted),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _aiQuestion,
                    decoration: InputDecoration(
                      hintText: l.t('aiExplainHint'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: s.selectedReport == null || s.loading
                        ? null
                        : () => cubit.askAi(_aiQuestion.text.trim()),
                    child: Text(l.t('tryExplainNow')),
                  ),
                  if (s.loading) ...[
                    const SizedBox(height: 12),
                    const LinearProgressIndicator(),
                  ],
                  if (s.aiReply != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.trustBlueSoft,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        s.aiReply!,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return BlocBuilder<VaultCubit, VaultState>(
      builder: (context, state) {
        if (!state.unlocked) {
          return SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.fingerprint,
                        size: 64, color: AppColors.trustBlue),
                    const SizedBox(height: 16),
                    Text(
                      l.t('unlockVault'),
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l.t('unlockVaultHint'),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    FilledButton.icon(
                      onPressed: _tryUnlock,
                      icon: const Icon(Icons.lock_open),
                      label: Text(l.t('authenticate')),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final user = context.watch<AuthCubit>().state.user!;
        final labCount = state.labReports.length;
        final historyCount = state.historyMedicines.length;

        return SafeArea(
          bottom: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              const SuwasiriBrandHeader(),
              const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 4,
                    height: 28,
                    margin: const EdgeInsets.only(top: 4, right: 10),
                    decoration: BoxDecoration(
                      color: AppColors.trustBlue,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.t('medicalVault'),
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(fontSize: 26),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l.t('vaultSubtitle'),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              PatientHealthHistorySection(
                state: state,
                onOpenLab: (r) async {
                  context.read<VaultCubit>().selectReport(r);
                  await showLabReportDetailSheet(context: context, report: r);
                },
              ),
              const SizedBox(height: 12),
              _AiLabAssistantCard(
                onTry: () => _showAiSheet(state),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _SummaryTile(
                      icon: Icons.history_edu_outlined,
                      iconBg: const Color(0xFFF1F5F9),
                      iconColor: AppColors.slateMuted,
                      title: l.t('issuedMedicalHistory'),
                      subtitle: l
                          .t('recordsCount')
                          .replaceAll('{count}', '$historyCount'),
                      selected: state.filter == VaultFilter.history ||
                          state.filter == VaultFilter.medicines,
                      onTap: () => context
                          .read<VaultCubit>()
                          .setFilter(VaultFilter.history),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _SummaryTile(
                      icon: Icons.description_outlined,
                      iconBg: AppColors.trustBlue,
                      iconColor: Colors.white,
                      title: l.t('labReports'),
                      subtitle: l
                          .t('recordsCount')
                          .replaceAll('{count}', '$labCount'),
                      selected: state.filter == VaultFilter.labs,
                      onTap: () => context
                          .read<VaultCubit>()
                          .setFilter(VaultFilter.labs),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Text(
                    l.t('recentTimeline'),
                    style: const TextStyle(
                      color: AppColors.slateMuted,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    l.t('chronological'),
                    style: const TextStyle(
                      color: AppColors.slateMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _GpCareSyncedBar(
                  active: state.gpCareSynced || state.prescriptions.isNotEmpty),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _PortalSyncCard(
                      tint: AppColors.trustBlueSoft,
                      border: AppColors.trustBlue.withValues(alpha: 0.25),
                      icon: Icons.science_outlined,
                      iconBg: const Color(0xFFDBEAFE),
                      iconColor: AppColors.trustBlue,
                      title: l.t('lankaLabPortal'),
                      subtitle: l.t('centralLabRegistrar'),
                      synced: state.lankaLabSynced || labCount > 0,
                      body: l.t('lankaLabBody'),
                      buttonLabel: l.t('syncLankaLab'),
                      buttonColor: AppColors.trustBlueDark,
                      loading: state.syncingLankaLab,
                      onSync: () async {
                        await context
                            .read<VaultCubit>()
                            .syncLankaLab(user.id);
                        if (!context.mounted) return;
                        await context.read<NotificationCubit>().load();
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _PortalSyncCard(
                      tint: AppColors.emeraldSoft,
                      border: AppColors.emerald.withValues(alpha: 0.25),
                      icon: Icons.folder_shared_outlined,
                      iconBg: const Color(0xFFD1FAE5),
                      iconColor: AppColors.emerald,
                      title: l.t('lankaGpCare'),
                      subtitle: l.t('practitionerPrescriptions'),
                      synced:
                          state.gpCareSynced || state.prescriptions.isNotEmpty,
                      body: l.t('lankaGpBody'),
                      buttonLabel: l.t('syncLankaGp'),
                      buttonColor: AppColors.vaultGreen,
                      loading: state.syncingGpCare,
                      onSync: () async {
                        await context.read<VaultCubit>().syncGpCare(user.id);
                        if (!context.mounted) return;
                        await context.read<NotificationCubit>().load();
                      },
                    ),
                  ),
                ],
              ),
              if (state.loading ||
                  state.syncingLankaLab ||
                  state.syncingGpCare) ...[
                const SizedBox(height: 12),
                const LinearProgressIndicator(),
              ],
              const SizedBox(height: 18),
              if (state.filter == VaultFilter.labs)
                _VaultTimeline(
                  reports: state.labReports,
                  onSelect: (r) async {
                    context.read<VaultCubit>().selectReport(r);
                    await showLabReportDetailSheet(context: context, report: r);
                    if (r.readyForAi && context.mounted) {
                      _showAiSheet(context.read<VaultCubit>().state);
                    }
                  },
                )
              else ...[
                Text(
                  l.t('issuedMedicalHistory'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 8),
                ..._buildMedicines(context, state),
              ],
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildMedicines(BuildContext context, VaultState state) {
    final l = AppLocalizations.of(context);
    final history = state.historyMedicines;
    if (history.isEmpty) {
      return [EmptyHint(l.t('noMedicines'))];
    }
    return [
      for (final p in history)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: SoftCard(
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.emeraldSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.medication, color: AppColors.emerald),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.medicine,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.trustBlueDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${p.doctor} · ${p.code}',
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                        ),
                      ),
                      if (p.schedule.isNotEmpty)
                        Text(
                          p.schedule,
                          style: const TextStyle(
                            color: AppColors.slateMuted,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ),
                StatusChip(
                  label: p.doseBadge.isNotEmpty
                      ? p.doseBadge
                      : (p.active ? 'Active' : 'Ended'),
                  color: AppColors.emerald,
                ),
              ],
            ),
          ),
        ),
    ];
  }
}

class _AiLabAssistantCard extends StatelessWidget {
  const _AiLabAssistantCard({required this.onTry});

  final VoidCallback onTry;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A66FF), Color(0xFF0B4FD9)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlue.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 26),
          ),
          const SizedBox(height: 14),
          Text(
            l.t('aiLabAssistant'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l.t('aiLabAssistantBody'),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.92),
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onTry,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.trustBlue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
              ),
              child: Text(
                l.t('tryExplainNow'),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? AppColors.trustBlue : AppColors.border,
            width: selected ? 1.8 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.trustBlueDark.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                color: selected
                    ? AppColors.trustBlueDark
                    : AppColors.trustBlueDark,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                color: selected ? AppColors.trustBlue : AppColors.slateMuted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GpCareSyncedBar extends StatelessWidget {
  const _GpCareSyncedBar({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.emeraldSoft,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: const BoxDecoration(
              color: AppColors.onlineGreen,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.t('gpCareSynced'),
                  style: const TextStyle(
                    color: AppColors.tipTeal,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
                Text(
                  l.t('gpCareSyncedHint'),
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          if (active)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                l.t('activeBadge'),
                style: const TextStyle(
                  color: AppColors.emerald,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _PortalSyncCard extends StatelessWidget {
  const _PortalSyncCard({
    required this.tint,
    required this.border,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.synced,
    required this.body,
    required this.buttonLabel,
    required this.buttonColor,
    required this.loading,
    required this.onSync,
  });

  final Color tint;
  final Color border;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool synced;
  final String body;
  final String buttonLabel;
  final Color buttonColor;
  final bool loading;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const Spacer(),
              if (synced)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    l.t('synced'),
                    style: TextStyle(
                      color: iconColor,
                      fontWeight: FontWeight.w800,
                      fontSize: 10,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: iconColor == AppColors.trustBlue
                  ? AppColors.trustBlueDark
                  : AppColors.tipTeal,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
          Text(
            subtitle,
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 11,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: loading ? null : onSync,
              style: FilledButton.styleFrom(
                backgroundColor: buttonColor,
                foregroundColor: Colors.white,
                minimumSize: const Size(0, 40),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: loading
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.sync, size: 16),
              label: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  buttonLabel,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _VaultTimeline extends StatelessWidget {
  const _VaultTimeline({
    required this.reports,
    required this.onSelect,
  });

  final List<VaultReport> reports;
  final ValueChanged<VaultReport> onSelect;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (reports.isEmpty) {
      return EmptyHint(l.t('noLabReports'));
    }

    final sorted = [...reports]
      ..sort((a, b) => b.date.compareTo(a.date));

    String? lastMonthKey;
    final children = <Widget>[];

    // Self uploads header for first upload-kind item
    final hasUpload = sorted.any((r) => r.kind == VaultRecordKind.upload);
    if (hasUpload) {
      children.add(_TimelineMonthChip(label: l.t('selfUploads'), accent: true));
    }

    for (final report in sorted) {
      final monthKey = DateFormat('MMMM yyyy').format(report.date);
      if (report.kind != VaultRecordKind.upload && monthKey != lastMonthKey) {
        lastMonthKey = monthKey;
        children.add(_TimelineMonthChip(label: monthKey, accent: false));
      }
      children.add(
        _TimelineRecordCard(
          report: report,
          onTap: () => onSelect(report),
        ),
      );
    }

    return Column(children: children);
  }
}

class _TimelineMonthChip extends StatelessWidget {
  const _TimelineMonthChip({required this.label, required this.accent});

  final String label;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: accent ? AppColors.trustBlueSoft : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              label,
              style: TextStyle(
                color: accent ? AppColors.trustBlue : AppColors.slateMuted,
                fontWeight: FontWeight.w800,
                fontSize: 11,
              ),
            ),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Divider(color: AppColors.border),
          ),
        ],
      ),
    );
  }
}

class _TimelineRecordCard extends StatelessWidget {
  const _TimelineRecordCard({
    required this.report,
    required this.onTap,
  });

  final VaultReport report;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final isVaccine = report.kind == VaultRecordKind.vaccine;
    final accent = isVaccine ? AppColors.emerald : AppColors.trustBlueDark;
    final dateColor = isVaccine ? AppColors.emerald : AppColors.trustBlue;
    final date = DateFormat('d MMM yyyy').format(report.date);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              width: 36,
              child: Column(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: accent, width: 1.5),
                    ),
                    child: Icon(
                      isVaccine
                          ? Icons.vaccines_outlined
                          : report.kind == VaultRecordKind.upload
                              ? Icons.add
                              : Icons.biotech_outlined,
                      size: 16,
                      color: accent,
                    ),
                  ),
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: AppColors.border,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MinTap(
                onTap: onTap,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.trustBlueDark.withValues(alpha: 0.04),
                        blurRadius: 10,
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
                          decoration: BoxDecoration(
                            color: accent,
                            borderRadius: const BorderRadius.horizontal(
                              left: Radius.circular(16),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        report.title,
                                        style: const TextStyle(
                                          color: AppColors.trustBlueDark,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                    if (report.fileSizeMb != null)
                                      Container(
                                        margin: const EdgeInsets.only(left: 6),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '${report.fileSizeMb} MB',
                                          style: const TextStyle(
                                            color: AppColors.slateMuted,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      )
                                    else if (report.readyForAi &&
                                        report.kind == VaultRecordKind.lab)
                                      Container(
                                        margin: const EdgeInsets.only(left: 6),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.emeraldSoft,
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          l.t('readyForAi'),
                                          style: const TextStyle(
                                            color: AppColors.emerald,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                if (report.category != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    '${l.t('category')}: ${report.category}',
                                    style: const TextStyle(
                                      color: AppColors.slateMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                                if (report.facility != null) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(
                                        isVaccine
                                            ? Icons.health_and_safety_outlined
                                            : Icons.info_outline,
                                        size: 14,
                                        color: isVaccine
                                            ? AppColors.trustBlue
                                            : const Color(0xFF9F7AEA),
                                      ),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          report.facility!,
                                          style: const TextStyle(
                                            color: AppColors.slateMuted,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                const SizedBox(height: 6),
                                Text(
                                  date,
                                  style: TextStyle(
                                    color: dateColor,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                  ),
                                ),
                                if (report.requestedBy != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    '${l.t('requestedBy')} ${report.requestedBy}',
                                    style: const TextStyle(
                                      color: AppColors.slateMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                                if (report.batchCode != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Batch: ${report.batchCode}',
                                    style: AppTheme.mono(
                                      fontSize: 11,
                                      color: AppColors.slateMuted,
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
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

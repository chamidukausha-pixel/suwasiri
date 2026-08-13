import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'patient_health_section.dart';

class VaultScreen extends StatefulWidget {
  const VaultScreen({super.key});

  @override
  State<VaultScreen> createState() => _VaultScreenState();
}

class _VaultScreenState extends State<VaultScreen> {
  @override
  void initState() {
    super.initState();
    _tryUnlock();
  }

  Future<void> _tryUnlock() async {
    final vault = context.read<VaultCubit>();
    final auth = context.read<AuthCubit>();
    if (!vault.state.unlocked) {
      await vault.unlock(auth.unlockVault);
    }
    final user = auth.state.user;
    if (user != null && vault.state.unlocked) {
      await vault.load(user.id);
    }
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
              VaultEPrescriptionSection(state: state),
              const SizedBox(height: 12),
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
                      synced:
                          state.lankaLabSynced || state.labReports.isNotEmpty,
                      body: l.t('lankaLabBody'),
                      buttonLabel: l.t('syncLankaLab'),
                      buttonColor: AppColors.trustBlueDark,
                      loading: state.syncingLankaLab,
                      onSync: () async {
                        await context.read<VaultCubit>().syncLankaLab(user.id);
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
              const SizedBox(height: 20),
              IssuedMedicalHistorySection(state: state),
            ],
          ),
        );
      },
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
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 14, color: iconColor),
              ),
              const Spacer(),
              if (synced)
                Text(
                  l.t('synced'),
                  style: TextStyle(
                    color: iconColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 9,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: iconColor == AppColors.trustBlue
                  ? AppColors.trustBlueDark
                  : AppColors.tipTeal,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 10,
            ),
          ),
          Text(
            body,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 9,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            height: 32,
            child: FilledButton(
              onPressed: loading ? null : onSync,
              style: FilledButton.styleFrom(
                backgroundColor: buttonColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: loading
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      buttonLabel,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}


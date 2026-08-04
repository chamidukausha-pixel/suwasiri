import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';

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

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return BlocBuilder<VaultCubit, VaultState>(
      builder: (context, state) {
        if (!state.unlocked) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.fingerprint, size: 64, color: AppColors.trustBlue),
                  const SizedBox(height: 16),
                  Text(
                    'Unlock Health Vault',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  const Text('Use Face ID / Touch ID to access medical records.'),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: _tryUnlock,
                    icon: const Icon(Icons.lock_open),
                    label: const Text('Authenticate'),
                  ),
                ],
              ),
            ),
          );
        }

        final user = context.read<AuthCubit>().state.user!;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(child: SectionHeader('Lab reports & medicines')),
                IconButton(
                  tooltip: 'Sync LankaLab & GP Care',
                  onPressed: () async {
                    await context.read<VaultCubit>().syncAll(user.id);
                    if (!context.mounted) return;
                    await context.read<NotificationCubit>().load();
                  },
                  icon: const Icon(Icons.sync),
                ),
              ],
            ),
            if (state.loading) const LinearProgressIndicator(),
            ...state.reports.map((r) {
              final selected = state.selectedReport?.id == r.id;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SoftCard(
                  color: selected
                      ? AppColors.trustBlue.withValues(alpha: 0.06)
                      : null,
                  onTap: () => context.read<VaultCubit>().selectReport(r),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          StatusChip(
                            label: r.issuedBy,
                            color: r.issuedBy == 'LankaLab'
                                ? AppColors.trustBlue
                                : AppColors.emerald,
                          ),
                          const Spacer(),
                          Text(
                            DateFormat('d MMM yyyy').format(r.date),
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(r.title,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      ...r.metrics.map((m) => Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              children: [
                                Expanded(child: Text('${m.name}: ${m.value}')),
                                StatusChip(
                                  label: m.status,
                                  color: m.status == 'normal'
                                      ? AppColors.emerald
                                      : m.status == 'critical'
                                          ? AppColors.emergencyRed
                                          : AppColors.warning,
                                ),
                              ],
                            ),
                          )),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 12),
            SectionHeader(l.t('activePrescriptions')),
            ...state.prescriptions.map((p) => SoftCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.medication, color: AppColors.emerald),
                    title: Text(p.medicine),
                    subtitle: Text('${p.doctor} · ${p.code}'),
                    trailing: StatusChip(
                      label: p.active ? 'Active' : 'Ended',
                      color: AppColors.emerald,
                    ),
                  ),
                )),
            const SizedBox(height: 20),
            SectionHeader(l.t('aiAssistant')),
            SoftCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    state.selectedReport == null
                        ? 'Select a report above, then ask a question.'
                        : 'Asking about: ${state.selectedReport!.title}',
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _aiQuestion,
                    decoration: const InputDecoration(
                      hintText: 'Explain my HbA1c value',
                    ),
                  ),
                  const SizedBox(height: 10),
                  FilledButton(
                    onPressed: state.selectedReport == null
                        ? null
                        : () => context
                            .read<VaultCubit>()
                            .askAi(_aiQuestion.text.trim()),
                    child: const Text('Ask assistant'),
                  ),
                  if (state.aiReply != null) ...[
                    const SizedBox(height: 12),
                    Text(state.aiReply!),
                  ],
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

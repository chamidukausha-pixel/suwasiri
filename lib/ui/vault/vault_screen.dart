import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
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
      await vault.watch(user.id);
    }
  }

  Future<void> _loadForUser() async {
    final vault = context.read<VaultCubit>();
    final auth = context.read<AuthCubit>();
    final user = auth.state.user;
    if (user != null && vault.state.unlocked) {
      await vault.watch(user.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (prev, curr) =>
          prev.activeFamilyKey != curr.activeFamilyKey,
      listener: (context, state) => _loadForUser(),
      child: BlocBuilder<VaultCubit, VaultState>(
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
              if (state.loading) ...[
                const SizedBox(height: 12),
                const LinearProgressIndicator(),
              ],
              const SizedBox(height: 20),
              IssuedMedicalHistorySection(state: state),
            ],
          ),
        );
      },
      ), // BlocBuilder
    ); // BlocListener
  }
}


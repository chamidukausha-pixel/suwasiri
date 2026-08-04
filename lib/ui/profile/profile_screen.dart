import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final user = context.watch<AuthCubit>().state.user;

    if (user == null) {
      return const EmptyHint('Not signed in');
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SoftCard(
          child: Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: AppColors.trustBlue.withValues(alpha: 0.15),
                child: Text(
                  user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: AppColors.trustBlue,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name,
                        style: Theme.of(context).textTheme.titleLarge),
                    Text(user.email),
                    if (user.ceylonHealthId != null)
                      Text(
                        user.ceylonHealthId!,
                        style: AppTheme.mono(fontSize: 12),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SoftCard(
          child: Column(
            children: [
              _row('NIC', user.nic ?? '—'),
              _row('Mobile', user.mobileNo ?? '—'),
              _row('Blood group', user.bloodGroup ?? '—'),
              _row('MOH district', user.region ?? '—'),
              _row(
                'Date of birth',
                user.dateOfBirth?.toLocal().toString().split(' ').first ?? '—',
              ),
              _row(
                'Emergency',
                user.emergencyContacts.isEmpty
                    ? '—'
                    : user.emergencyContacts.join(', '),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () =>
              Navigator.of(context).pushNamed('/register-profile'),
          icon: const Icon(Icons.edit_outlined),
          label: const Text('Edit clinical profile'),
        ),
        const SizedBox(height: 8),
        FilledButton.tonalIcon(
          style: FilledButton.styleFrom(
            foregroundColor: AppColors.emergencyRed,
            backgroundColor: AppColors.emergencyRedSoft,
            minimumSize: const Size(48, 48),
          ),
          onPressed: () async {
            await context.read<AuthCubit>().signOut();
            if (context.mounted) {
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/auth',
                (_) => false,
              );
            }
          },
          icon: const Icon(Icons.logout),
          label: Text(l.t('logout')),
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: AppColors.slateMuted)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

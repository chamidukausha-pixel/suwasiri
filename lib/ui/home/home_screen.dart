import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../bloc/sos/sos_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../sos/sos_overlay.dart';
import '../widgets/common_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _nextAppt;
  int _rxCount = 0;

  @override
  void initState() {
    super.initState();
    _loadGreetingData();
  }

  Future<void> _loadGreetingData() async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;
    final health = context.read<HealthRepository>();
    final appts = await health.getAppointments(user.id);
    final rx = await health.getPrescriptions(user.id);
    if (!mounted) return;
    setState(() {
      _rxCount = rx.where((e) => e.active).length;
      if (appts.isNotEmpty) {
        _nextAppt =
            '${appts.first.doctorName} · ${DateFormat('EEE, d MMM · HH:mm').format(appts.first.timeSlot)}';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final user = context.watch<AuthCubit>().state.user;
    final localeCubit = context.watch<LocaleCubit>();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${l.t('greeting')}, ${user?.name.split(' ').first ?? ''}',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  Text(
                    user?.region != null
                        ? 'MOH ${user!.region}'
                        : l.t('tagline'),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            MinTap(
              onTap: () => localeCubit.cycle(),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.trustBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: AppColors.trustBlue.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  localeCubit.pillLabel,
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SoftCard(
          color: AppColors.surface,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    l.t('healthStatus'),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const Spacer(),
                  StatusChip(
                    label: l.t('stable'),
                    color: AppColors.emerald,
                    icon: Icons.check_circle,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${l.t('activePrescriptions')}: $_rxCount',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 6),
              Text(
                '${l.t('nextAppointment')}: ${_nextAppt ?? '—'}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (user?.ceylonHealthId != null) ...[
                const SizedBox(height: 10),
                Text(
                  'Ceylon Health ID: ${user!.ceylonHealthId}',
                  style: AppTheme.mono(fontSize: 12, color: AppColors.slateMuted),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        SectionHeader(l.t('quickActions')),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.35,
          children: [
            _QuickTile(
              icon: Icons.calendar_month,
              label: l.t('book'),
              color: AppColors.trustBlue,
              onTap: () => widget.onNavigate(1),
            ),
            _QuickTile(
              icon: Icons.folder_special,
              label: l.t('vault'),
              color: AppColors.emerald,
              onTap: () => widget.onNavigate(3),
            ),
            _QuickTile(
              icon: Icons.video_call,
              label: l.t('telehealth'),
              color: AppColors.warning,
              onTap: () => widget.onNavigate(2),
            ),
            _QuickTile(
              icon: Icons.vaccines,
              label: l.t('vaccines'),
              color: AppColors.trustBlueLight,
              onTap: () => widget.onNavigate(4),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _EmergencyButton(
          label: '🚨 ${l.t('emergencySos')}',
          onPressed: () async {
            HapticFeedback.heavyImpact();
            await context.read<SosCubit>().triggerEmergency();
            if (!context.mounted) return;
            await showSosOverlay(context);
          },
        ),
      ],
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _EmergencyButton extends StatefulWidget {
  const _EmergencyButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  State<_EmergencyButton> createState() => _EmergencyButtonState();
}

class _EmergencyButtonState extends State<_EmergencyButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) {
        final scale = 1 + (_pulse.value * 0.03);
        return Transform.scale(
          scale: scale,
          child: child,
        );
      },
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.emergencyRed,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          onPressed: widget.onPressed,
          child: Text(
            widget.label,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/schedule/schedule_cubit.dart';
import '../../bloc/vaccine/vaccine_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../appointments/appointments_screen.dart';
import '../help/help_desk_sheet.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../telehealth/telehealth_screen.dart';
import '../vaccine/vaccine_screen.dart';
import '../vault/vault_screen.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/toast_overlay.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    context.read<NotificationCubit>().load();
    final schedule = context.read<ScheduleCubit>();
    schedule.onVideoReminder = (appt) {
      if (!mounted) return;
      context.read<NotificationCubit>().load();
      showDialog<void>(
        context: context,
        barrierDismissible: true,
        builder: (ctx) => AlertDialog(
          title: const Text('Video consult reminder'),
          content: Text(
            '${appt.doctorName} starts in about 5 minutes.\nOpen Call to answer when the doctor rings from Lanka GP Care.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                _goTo(2);
              },
              child: const Text('Open Call'),
            ),
          ],
        ),
      );
    };
    final authState = context.read<AuthCubit>().state;
    final user = authState.user;
    if (user != null) {
      schedule.watch(user.id);
    }
  }

  void _reloadForMember(AuthState authState) {
    final user = authState.user;
    if (user == null) return;
    context.read<ScheduleCubit>().watch(user.id);
    context.read<VaccineCubit>().bootstrap(
          user.id,
          dateOfBirth: user.effectiveDateOfBirth,
        );
    final vault = context.read<VaultCubit>();
    vault.resetForPatient();
    if (vault.state.unlocked) {
      vault.watch(user.id);
    }
  }

  void _goTo(int index) => setState(() => _index = index);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final pages = [
      HomeScreen(onNavigate: _goTo, isActive: _index == 0),
      const AppointmentsScreen(),
      TelehealthScreen(isActive: _index == 2),
      const VaultScreen(),
      VaccineScreen(isActive: _index == 4),
      const ProfileScreen(),
    ];

    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (prev, curr) => prev.activeFamilyKey != curr.activeFamilyKey,
      listener: (context, state) => _reloadForMember(state),
      child: MainTabScope(
      goTo: _goTo,
      child: Scaffold(
        appBar: null,
        body: Stack(
          children: [
            IndexedStack(index: _index, children: pages),
            const ToastOverlay(),
            const Positioned.fill(
              child: DraggableHelpFab(),
            ),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: _goTo,
          backgroundColor: AppColors.cardBg(context),
          indicatorColor: _index == 2
              ? (AppColors.isDark(context)
                  ? const Color(0xFF064E3B)
                  : const Color(0xFFD1FAE5))
              : (_index == 3 || _index == 4)
                  ? AppColors.emerald.withValues(alpha: 0.18)
                  : AppColors.trustBlue.withValues(alpha: 0.12),
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home_rounded),
              label: l.t('home'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.calendar_month_outlined),
              selectedIcon: const Icon(Icons.calendar_month),
              label: l.t('appointments'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.videocam_outlined),
              selectedIcon: Container(
                width: 40,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.videocam,
                  color: Color(0xFF065F46),
                  size: 20,
                ),
              ),
              label: l.t('telehealth'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.folder_outlined),
              selectedIcon: Icon(
                Icons.folder_special,
                color: _index == 3 ? AppColors.vaultGreen : null,
              ),
              label: l.t('vault'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.vaccines_outlined),
              selectedIcon: Icon(
                Icons.vaccines,
                color: _index == 4 ? AppColors.vaultGreen : null,
              ),
              label: l.t('vaccines'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person),
              label: l.t('profile'),
            ),
          ],
        ),
      ),
      ), // MainTabScope
    ); // BlocListener
  }
}

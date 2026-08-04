import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../appointments/appointments_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../telehealth/telehealth_screen.dart';
import '../vaccine/vaccine_screen.dart';
import '../vault/vault_screen.dart';
import '../widgets/notification_tray.dart';
import '../widgets/toast_overlay.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _titles = [
    'home',
    'appointments',
    'telehealth',
    'vault',
    'vaccines',
    'profile',
  ];

  @override
  void initState() {
    super.initState();
    context.read<NotificationCubit>().load();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final pages = [
      HomeScreen(onNavigate: (i) => setState(() => _index = i)),
      const AppointmentsScreen(),
      const TelehealthScreen(),
      const VaultScreen(),
      const VaccineScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(l.t(_titles[_index])),
        actions: [
          BlocBuilder<NotificationCubit, NotificationState>(
            builder: (context, state) {
              return IconButton(
                tooltip: l.t('notifications'),
                onPressed: () => showNotificationTray(context),
                icon: Badge(
                  isLabelVisible: state.unreadCount > 0,
                  label: Text('${state.unreadCount}'),
                  child: const Icon(Icons.notifications_outlined),
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          IndexedStack(index: _index, children: pages),
          const ToastOverlay(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.trustBlue.withValues(alpha: 0.12),
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
            icon: const Icon(Icons.video_call_outlined),
            selectedIcon: const Icon(Icons.video_call),
            label: l.t('telehealth'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.folder_outlined),
            selectedIcon: const Icon(Icons.folder_special),
            label: l.t('vault'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.vaccines_outlined),
            selectedIcon: const Icon(Icons.vaccines),
            label: l.t('vaccines'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l.t('profile'),
          ),
        ],
      ),
    );
  }
}

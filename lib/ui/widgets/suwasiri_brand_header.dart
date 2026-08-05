import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/sos/sos_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../sos/sos_overlay.dart';
import '../widgets/common_widgets.dart';
import '../widgets/notification_tray.dart';

/// Shared top bar used on Home and Doctors directory.
class SuwasiriBrandHeader extends StatelessWidget {
  const SuwasiriBrandHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    final firstName = user?.name.split(' ').first ?? '';
    final initials = firstName.isNotEmpty
        ? firstName.substring(0, 1).toUpperCase()
        : 'S';
    final unread = context.watch<NotificationCubit>().state.unreadCount;

    return Row(
      children: [
        Stack(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.trustBlueSoft,
              child: Text(
                initials,
                style: const TextStyle(
                  color: AppColors.trustBlue,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppColors.onlineGreen,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  AppLocalizations.of(context).t('appName'),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
              ),
              const SizedBox(width: 3),
              const Icon(
                Icons.favorite_rounded,
                color: AppColors.heartPink,
                size: 15,
              ),
            ],
          ),
        ),
        MinTap(
          enforceMinSize: false,
          onTap: () => showNotificationTray(context),
          child: SizedBox(
            width: 36,
            height: 36,
            child: Center(
              child: Badge(
                isLabelVisible: unread > 0,
                backgroundColor: AppColors.emergencyRed,
                label: Text('$unread'),
                child: const Icon(
                  Icons.notifications_outlined,
                  color: AppColors.trustBlueDark,
                  size: 22,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 2),
        MinTap(
          enforceMinSize: false,
          onTap: () async {
            HapticFeedback.heavyImpact();
            await context.read<SosCubit>().triggerEmergency();
            if (!context.mounted) return;
            await showSosOverlay(context);
          },
          child: Container(
            height: 32,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: AppColors.emergencyRed,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.emergency, color: Colors.white, size: 14),
                const SizedBox(width: 3),
                Text(
                  AppLocalizations.of(context).t('emergencySos'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 4),
        const LanguagePill(),
      ],
    );
  }
}

class LanguagePill extends StatelessWidget {
  const LanguagePill({super.key});

  @override
  Widget build(BuildContext context) {
    final localeCubit = context.watch<LocaleCubit>();
    final code = localeCubit.state.locale.languageCode;

    Widget option(String value, String label) {
      final selected = code == value;
      return MinTap(
        enforceMinSize: false,
        onTap: () => localeCubit.setLocale(Locale(value)),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppColors.trustBlue : Colors.transparent,
            shape: BoxShape.circle,
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : AppColors.slateMuted,
              fontWeight: FontWeight.w700,
              fontSize: selected ? 10 : 11,
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          option('en', 'EN'),
          option('si', 'සි'),
          option('ta', 'த'),
        ],
      ),
    );
  }
}

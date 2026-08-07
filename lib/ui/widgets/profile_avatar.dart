import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../core/theme/app_colors.dart';

/// Local avatar path keyed by auth uid (camera / gallery pick).
abstract final class ProfileAvatarStore {
  static final ValueNotifier<int> revision = ValueNotifier(0);

  static String _key(String uid) => 'suwasiri_avatar_$uid';

  static String? pathFor(SharedPreferences prefs, String? uid) {
    if (uid == null || uid.isEmpty) return null;
    final path = prefs.getString(_key(uid));
    if (path == null || path.isEmpty) return null;
    if (!File(path).existsSync()) return null;
    return path;
  }

  static Future<void> save(
    SharedPreferences prefs,
    String uid,
    String path,
  ) async {
    await prefs.setString(_key(uid), path);
    revision.value++;
  }

  static Future<void> clear(SharedPreferences prefs, String uid) async {
    await prefs.remove(_key(uid));
    revision.value++;
  }
}

class ProfileAvatar extends StatelessWidget {
  const ProfileAvatar({
    super.key,
    this.radius = 18,
    this.onTap,
    this.showOnlineDot = true,
  });

  final double radius;
  final VoidCallback? onTap;
  final bool showOnlineDot;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    final prefs = context.watch<LocaleCubit>().prefs;

    return ValueListenableBuilder<int>(
      valueListenable: ProfileAvatarStore.revision,
      builder: (context, revision, _) {
        final path = ProfileAvatarStore.pathFor(prefs, user?.id);
        final firstName = user?.name.split(' ').first ?? '';
        final initials = firstName.isNotEmpty
            ? firstName.substring(0, 1).toUpperCase()
            : 'S';

        final avatar = Stack(
          children: [
            CircleAvatar(
              radius: radius,
              backgroundColor: AppColors.trustBlueSoft,
              backgroundImage: path != null ? FileImage(File(path)) : null,
              child: path != null
                  ? null
                  : Text(
                      initials,
                      style: TextStyle(
                        color: AppColors.trustBlue,
                        fontWeight: FontWeight.w800,
                        fontSize: radius * 0.85,
                      ),
                    ),
            ),
            if (showOnlineDot)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: radius * 0.5,
                  height: radius * 0.5,
                  decoration: BoxDecoration(
                    color: AppColors.onlineGreen,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                ),
              ),
          ],
        );

        if (onTap == null) return avatar;
        return GestureDetector(onTap: onTap, child: avatar);
      },
    );
  }
}

/// Lets child screens jump to a main shell tab (e.g. Profile = 5).
class MainTabScope extends InheritedWidget {
  const MainTabScope({
    super.key,
    required this.goTo,
    required super.child,
  });

  final ValueChanged<int> goTo;

  static MainTabScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<MainTabScope>();
  }

  static void go(BuildContext context, int index) {
    maybeOf(context)?.goTo(index);
  }

  @override
  bool updateShouldNotify(MainTabScope oldWidget) => goTo != oldWidget.goTo;
}

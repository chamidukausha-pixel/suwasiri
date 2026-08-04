import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';

/// Floating toast stack for background sync alerts.
class ToastOverlay extends StatefulWidget {
  const ToastOverlay({super.key});

  @override
  State<ToastOverlay> createState() => _ToastOverlayState();
}

class _ToastOverlayState extends State<ToastOverlay> {
  @override
  Widget build(BuildContext context) {
    return BlocListener<NotificationCubit, NotificationState>(
      listenWhen: (p, c) => c.toast != null && p.toast != c.toast,
      listener: (context, state) {
        final toast = state.toast;
        if (toast == null) return;
        final cubit = context.read<NotificationCubit>();
        Future<void>.delayed(const Duration(seconds: 3), () {
          if (!mounted) return;
          cubit.clearToast();
        });
      },
      child: BlocBuilder<NotificationCubit, NotificationState>(
        buildWhen: (p, c) => p.toast != c.toast,
        builder: (context, state) {
          final toast = state.toast;
          return AnimatedPositioned(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            top: toast == null ? -80 : 8,
            left: 16,
            right: 16,
            child: Material(
              elevation: 6,
              borderRadius: BorderRadius.circular(14),
              color: AppColors.cosmicSlate,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    const Icon(Icons.cloud_sync, color: AppColors.emerald, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            toast?.title ?? '',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            toast?.body ?? '',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () =>
                          context.read<NotificationCubit>().clearToast(),
                      icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/app_notification.dart';
import '../../localization/app_localizations.dart';
import 'sheet_close_bar.dart';

Future<void> showNotificationTray(BuildContext context) async {
  final l = AppLocalizations.of(context);
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.92,
        builder: (_, scroll) {
          return BlocBuilder<NotificationCubit, NotificationState>(
            builder: (context, state) {
              return Column(
                children: [
                  const SizedBox(height: 8),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            l.t('notifications'),
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                        TextButton(
                          onPressed: () =>
                              context.read<NotificationCubit>().markAllRead(),
                          child: const Text('Mark all read'),
                        ),
                        const SheetCloseActions(),
                      ],
                    ),
                  ),
                  Expanded(
                    child: state.items.isEmpty
                        ? Center(child: Text(l.t('noUnread')))
                        : ListView.separated(
                            controller: scroll,
                            itemCount: state.items.length,
                            separatorBuilder: (_, index) =>
                                const Divider(height: 1),
                            itemBuilder: (_, i) {
                              final n = state.items[i];
                              return ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: _color(n.type)
                                      .withValues(alpha: 0.15),
                                  child: Icon(_icon(n.type),
                                      color: _color(n.type), size: 20),
                                ),
                                title: Text(
                                  n.title,
                                  style: TextStyle(
                                    fontWeight: n.read
                                        ? FontWeight.w500
                                        : FontWeight.w700,
                                  ),
                                ),
                                subtitle: Text(n.body),
                                trailing: Text(
                                  _ago(n.timestamp),
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                onTap: () => context
                                    .read<NotificationCubit>()
                                    .markRead(n.id),
                              );
                            },
                          ),
                  ),
                ],
              );
            },
          );
        },
      );
    },
  );
}

Color _color(NotificationPayloadType t) {
  switch (t) {
    case NotificationPayloadType.vaccine:
      return AppColors.emerald;
    case NotificationPayloadType.labResult:
      return AppColors.trustBlue;
    case NotificationPayloadType.appointment:
      return AppColors.warning;
    case NotificationPayloadType.sync:
      return AppColors.emerald;
    case NotificationPayloadType.dose:
      return AppColors.emergencyRed;
    case NotificationPayloadType.system:
      return AppColors.slateMuted;
  }
}

IconData _icon(NotificationPayloadType t) {
  switch (t) {
    case NotificationPayloadType.vaccine:
      return Icons.vaccines;
    case NotificationPayloadType.labResult:
      return Icons.science;
    case NotificationPayloadType.appointment:
      return Icons.event;
    case NotificationPayloadType.sync:
      return Icons.sync;
    case NotificationPayloadType.dose:
      return Icons.medication;
    case NotificationPayloadType.system:
      return Icons.info_outline;
  }
}

String _ago(DateTime t) {
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 60) return '${d.inMinutes}m';
  if (d.inHours < 24) return '${d.inHours}h';
  return '${d.inDays}d';
}

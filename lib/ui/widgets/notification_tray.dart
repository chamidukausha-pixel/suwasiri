import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/app_notification.dart';
import '../../localization/app_localizations.dart';
import 'profile_avatar.dart';

enum _NotifFilter { all, messages, apps }

Future<void> showNotificationTray(BuildContext context) async {
  final host = context;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return NotificationInboxSheet(
        onReply: (n) {
          Navigator.of(ctx).maybePop();
          _openRelatedTab(host, n);
        },
      );
    },
  );
}

void _openRelatedTab(BuildContext context, AppNotification n) {
  switch (n.type) {
    case NotificationPayloadType.appointment:
      final video = '${n.title} ${n.body}'.toLowerCase().contains('video');
      MainTabScope.go(context, video ? 2 : 1);
    case NotificationPayloadType.labResult:
      MainTabScope.go(context, 3);
    case NotificationPayloadType.vaccine:
    case NotificationPayloadType.dose:
      MainTabScope.go(context, 4);
    case NotificationPayloadType.sync:
    case NotificationPayloadType.system:
      break;
  }
}

class NotificationInboxSheet extends StatefulWidget {
  const NotificationInboxSheet({super.key, required this.onReply});

  final ValueChanged<AppNotification> onReply;

  @override
  State<NotificationInboxSheet> createState() => _NotificationInboxSheetState();
}

class _NotificationInboxSheetState extends State<NotificationInboxSheet> {
  _NotifFilter _filter = _NotifFilter.all;
  String? _expandedId;

  List<AppNotification> _visible(List<AppNotification> items) {
    switch (_filter) {
      case _NotifFilter.all:
        return items;
      case _NotifFilter.messages:
        return items.where((n) => n.isMessage).toList();
      case _NotifFilter.apps:
        return items.where((n) => !n.isMessage).toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final height = MediaQuery.sizeOf(context).height;
    final ink = AppColors.ink(context);
    final muted = AppColors.muted(context);
    final canvas = AppColors.pageBg(context);

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        height: height * 0.96,
        decoration: BoxDecoration(
          color: canvas,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: BlocBuilder<NotificationCubit, NotificationState>(
          builder: (context, state) {
            final items = _visible(state.items);
            final unread = state.unreadCount;
            if (_expandedId == null) {
              for (final n in items) {
                if (!n.read) {
                  _expandedId = n.id;
                  break;
                }
              }
            }

            return SafeArea(
              top: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 10),
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.line(context),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                    child: Row(
                      children: [
                        IconButton(
                          tooltip: l.t('close'),
                          onPressed: () => Navigator.of(context).maybePop(),
                          icon: Icon(Icons.arrow_back_ios_new_rounded,
                              size: 18, color: ink),
                        ),
                        if (unread > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.emergencyRed,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              l
                                  .t('notifNewCount')
                                  .replaceAll('{n}', '$unread'),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        const Spacer(),
                        TextButton(
                          onPressed: state.items.isEmpty
                              ? null
                              : () => context
                                  .read<NotificationCubit>()
                                  .clearAll(),
                          child: Text(
                            l.t('notifClearAll'),
                            style: TextStyle(
                              color: ink,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                    child: Text(
                      l.t('notifications'),
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            fontSize: 32,
                            color: ink,
                          ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Row(
                      children: [
                        _FilterChip(
                          selected: _filter == _NotifFilter.all,
                          icon: Icons.notifications_rounded,
                          label: l.t('notifFilterAll'),
                          onTap: () =>
                              setState(() => _filter = _NotifFilter.all),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          selected: _filter == _NotifFilter.messages,
                          icon: Icons.chat_bubble_outline_rounded,
                          label: l.t('notifFilterMessages'),
                          onTap: () =>
                              setState(() => _filter = _NotifFilter.messages),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          selected: _filter == _NotifFilter.apps,
                          icon: Icons.apps_rounded,
                          label: l.t('notifFilterApps'),
                          onTap: () =>
                              setState(() => _filter = _NotifFilter.apps),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: items.isEmpty
                        ? Center(
                            child: Text(
                              l.t('noUnread'),
                              style: TextStyle(color: muted),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: items.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (_, i) {
                              final n = items[i];
                              final expanded = _expandedId == n.id;
                              return _NotificationCard(
                                notification: n,
                                expanded: expanded,
                                onToggle: () {
                                  setState(() {
                                    _expandedId =
                                        expanded ? null : n.id;
                                  });
                                  if (!n.read) {
                                    context
                                        .read<NotificationCubit>()
                                        .markRead(n.id);
                                  }
                                },
                                onReply: () => widget.onReply(n),
                                onSnooze: () {
                                  context
                                      .read<NotificationCubit>()
                                      .markRead(n.id);
                                  setState(() {
                                    if (_expandedId == n.id) {
                                      _expandedId = null;
                                    }
                                  });
                                },
                                onDismiss: () => context
                                    .read<NotificationCubit>()
                                    .dismiss(n.id),
                              );
                            },
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: SizedBox(
                      height: 56,
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () => Navigator.of(context).maybePop(),
                        style: FilledButton.styleFrom(
                          backgroundColor: ink,
                          foregroundColor: AppColors.cardBg(context),
                          shape: const StadiumBorder(),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        icon: const Icon(Icons.notifications_rounded, size: 20),
                        label: Text(l.t('notifDone')),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.selected,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ink = AppColors.ink(context);
    final muted = AppColors.muted(context);
    return Material(
      color: selected ? ink : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: selected ? AppColors.cardBg(context) : muted,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: selected ? AppColors.cardBg(context) : muted,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.expanded,
    required this.onToggle,
    required this.onReply,
    required this.onSnooze,
    required this.onDismiss,
  });

  final AppNotification notification;
  final bool expanded;
  final VoidCallback onToggle;
  final VoidCallback onReply;
  final VoidCallback onSnooze;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final n = notification;
    final accent = _color(n.type);
    final muted = AppColors.muted(context);
    final ink = AppColors.ink(context);

    return Material(
      color: AppColors.cardBg(context),
      elevation: 0,
      shadowColor: Colors.black26,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onToggle,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
            border: Border.all(color: AppColors.line(context)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: accent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(_icon(n.type), color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      n.sourceLabel,
                      style: TextStyle(
                        color: muted,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  Text(
                    _ago(n.timestamp, l),
                    style: TextStyle(color: muted, fontSize: 13),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: muted,
                    size: 20,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                n.title,
                style: TextStyle(
                  color: ink,
                  fontWeight: n.read ? FontWeight.w600 : FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                n.body,
                style: TextStyle(
                  color: muted,
                  fontSize: 14,
                  height: 1.35,
                ),
              ),
              if (expanded) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    _ActionPill(
                      icon: Icons.reply_rounded,
                      label: l.t('notifReply'),
                      onTap: onReply,
                    ),
                    const SizedBox(width: 8),
                    _ActionPill(
                      icon: Icons.alarm_rounded,
                      label: l.t('notifSnooze'),
                      onTap: onSnooze,
                    ),
                    const SizedBox(width: 8),
                    _ActionPill(
                      icon: Icons.delete_outline_rounded,
                      label: l.t('notifDismiss'),
                      danger: true,
                      onTap: onDismiss,
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionPill extends StatelessWidget {
  const _ActionPill({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? AppColors.emergencyRed : AppColors.muted(context);
    return Expanded(
      child: Material(
        color: AppColors.softFill(context),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Color _color(NotificationPayloadType t) {
  switch (t) {
    case NotificationPayloadType.vaccine:
      return AppColors.emerald;
    case NotificationPayloadType.labResult:
      return AppColors.trustBlue;
    case NotificationPayloadType.appointment:
      return const Color(0xFF0F766E);
    case NotificationPayloadType.sync:
      return AppColors.tipTeal;
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
      return Icons.chat_bubble_rounded;
    case NotificationPayloadType.sync:
      return Icons.sync;
    case NotificationPayloadType.dose:
      return Icons.medication;
    case NotificationPayloadType.system:
      return Icons.info_outline;
  }
}

String _ago(DateTime t, AppLocalizations l) {
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return l.t('notifNow');
  if (d.inMinutes < 60) return '${d.inMinutes}m';
  if (d.inHours < 24) return '${d.inHours}h';
  return '${d.inDays}d';
}

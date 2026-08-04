import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/app_notification.dart';
import '../../data/repositories/health_repository.dart';

class NotificationState extends Equatable {
  const NotificationState({
    this.items = const [],
    this.toast,
    this.loading = false,
  });

  final List<AppNotification> items;
  final AppNotification? toast;
  final bool loading;

  int get unreadCount => items.where((n) => !n.read).length;

  NotificationState copyWith({
    List<AppNotification>? items,
    AppNotification? toast,
    bool? loading,
    bool clearToast = false,
  }) {
    return NotificationState(
      items: items ?? this.items,
      toast: clearToast ? null : (toast ?? this.toast),
      loading: loading ?? this.loading,
    );
  }

  @override
  List<Object?> get props => [items, toast, loading];
}

class NotificationCubit extends Cubit<NotificationState> {
  NotificationCubit(this._health) : super(const NotificationState());

  final HealthRepository _health;

  Future<void> load() async {
    emit(state.copyWith(loading: true));
    final items = await _health.getNotifications();
    emit(state.copyWith(items: items, loading: false));
  }

  Future<void> markRead(String id) async {
    await _health.markNotificationRead(id);
    await load();
  }

  Future<void> markAllRead() async {
    for (final n in state.items.where((e) => !e.read)) {
      await _health.markNotificationRead(n.id);
    }
    await load();
  }

  Future<void> showToast(AppNotification notification) async {
    await _health.pushNotification(notification);
    final items = await _health.getNotifications();
    emit(state.copyWith(items: items, toast: notification));
  }

  void clearToast() => emit(state.copyWith(clearToast: true));
}

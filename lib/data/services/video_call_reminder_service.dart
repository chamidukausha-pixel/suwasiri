import 'dart:async';

import 'package:flutter/services.dart';

import '../models/appointment.dart';
import '../models/app_notification.dart';
import '../repositories/health_repository.dart';

/// Fires an in-app notification + haptic/alarm cue 5 minutes before video slots.
class VideoCallReminderService {
  VideoCallReminderService(this._health);

  final HealthRepository _health;
  final _fired = <String>{};
  Timer? _timer;
  void Function(Appointment appt)? onAlarm;

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) {});
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Call whenever schedule appointments change (or on a tick).
  Future<void> check(List<Appointment> appointments, {DateTime? now}) async {
    final t = now ?? DateTime.now();
    for (final a in appointments) {
      if (!a.isVideo || a.status != AppointmentStatus.upcoming) continue;
      final remindAt = a.timeSlot.subtract(const Duration(minutes: 5));
      if (t.isBefore(remindAt)) continue;
      if (t.isAfter(a.timeSlot.add(const Duration(minutes: 2)))) continue;
      if (_fired.contains(a.id)) continue;
      _fired.add(a.id);
      await _fire(a);
    }
  }

  Future<void> _fire(Appointment a) async {
    HapticFeedback.heavyImpact();
    SystemSound.play(SystemSoundType.alert);
    try {
      await _health.pushNotification(
        AppNotification(
          id: 'video-remind-${a.id}',
          title: 'Video consult in 5 minutes',
          body:
              '${a.doctorName} · ${a.specialty}. Open Call to join GP Care.',
          timestamp: DateTime.now(),
          type: NotificationPayloadType.appointment,
        ),
      );
    } catch (_) {}
    onAlarm?.call(a);
  }

  void dispose() => stop();
}

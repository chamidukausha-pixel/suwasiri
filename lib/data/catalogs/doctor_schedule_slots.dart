import 'package:flutter/material.dart';

import '../models/appointment.dart';
import 'gp_care_clinic_map.dart';

/// Shared clinic / video consult times for every Suwasiri doctor.
abstract final class DoctorScheduleSlots {
  static const times = <TimeOfDay>[
    TimeOfDay(hour: 9, minute: 0),
    TimeOfDay(hour: 9, minute: 30),
    TimeOfDay(hour: 10, minute: 0),
    TimeOfDay(hour: 10, minute: 30),
    TimeOfDay(hour: 11, minute: 15),
    TimeOfDay(hour: 11, minute: 45),
    TimeOfDay(hour: 13, minute: 0),
    TimeOfDay(hour: 13, minute: 30),
    TimeOfDay(hour: 14, minute: 30),
    TimeOfDay(hour: 15, minute: 0),
    TimeOfDay(hour: 15, minute: 30),
    TimeOfDay(hour: 16, minute: 15),
    TimeOfDay(hour: 16, minute: 45),
    TimeOfDay(hour: 17, minute: 45),
  ];

  static const _weekdays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  /// Bookable days for the next 6 months, including remaining slots today.
  static List<DateTime> upcomingDates({int days = 183, DateTime? now}) {
    final n = now ?? DateTime.now();
    return List.generate(days, (i) {
      final d = n.add(Duration(days: i));
      return DateTime(d.year, d.month, d.day);
    });
  }

  static DateTime combine(DateTime date, TimeOfDay time) => DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );

  static int _minutes(TimeOfDay t) => t.hour * 60 + t.minute;

  static int? _parseHm(String raw) {
    final m = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(raw.trim());
    if (m == null) return null;
    return int.parse(m.group(1)!) * 60 + int.parse(m.group(2)!);
  }

  /// Times still open on [date] for this doctor (roster hours + not in the past).
  static List<TimeOfDay> timesFor(Doctor doctor, DateTime date, {DateTime? now}) {
    var list = List<TimeOfDay>.from(times);
    if (doctor.rosterHours.isNotEmpty) {
      final key = _weekdays[date.weekday - 1];
      final day = doctor.rosterHours[key];
      if (day == null) return const [];
      final start = _parseHm(day['start'] ?? '') ?? 0;
      final end = _parseHm(day['end'] ?? '') ?? (24 * 60);
      list = list.where((t) {
        final m = _minutes(t);
        return m >= start && m < end;
      }).toList();
    }
    final n = now ?? DateTime.now();
    final isToday =
        date.year == n.year && date.month == n.month && date.day == n.day;
    if (isToday) {
      list = list.where((t) => combine(date, t).isAfter(n)).toList();
    }
    return list;
  }

  /// Deterministic Firestore doc id for one doctor + datetime (blocks double book).
  static String slotLockId(String doctorId, DateTime slot) {
    final date = gpCareDateKey(slot);
    final hh = slot.hour.toString().padLeft(2, '0');
    final mm = slot.minute.toString().padLeft(2, '0');
    return '${doctorId}_${date}_$hh-$mm';
  }

  static bool sameMinute(DateTime a, DateTime b) =>
      a.year == b.year &&
      a.month == b.month &&
      a.day == b.day &&
      a.hour == b.hour &&
      a.minute == b.minute;

  static bool isTaken(DateTime slot, Iterable<DateTime> booked) {
    for (final b in booked) {
      if (sameMinute(slot, b)) return true;
    }
    return false;
  }

  static int freeCountOnDate(
    DateTime date,
    Iterable<DateTime> booked, {
    Doctor? doctor,
  }) {
    final open = doctor != null ? timesFor(doctor, date) : times;
    var free = 0;
    for (final t in open) {
      final slot = combine(date, t);
      if (!isTaken(slot, booked)) free++;
    }
    return free;
  }
}

/// Thrown when another patient (app or GP Care) already holds the slot.
class SlotUnavailableException implements Exception {
  SlotUnavailableException([
    this.message =
        'This date and time is already booked for this doctor. Choose another slot.',
  ]);

  final String message;

  @override
  String toString() => message;
}

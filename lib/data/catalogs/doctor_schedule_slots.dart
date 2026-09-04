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

  static String _normDoctorName(String name) => name
      .toLowerCase()
      .replaceFirst(RegExp(r'^dr\.?\s*'), '')
      .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
      .trim();

  /// First + last token so Chamidu Rathnayake ≡ Chamidu Kaushal Rathnayake.
  static String personKey(String name) {
    final parts = _normDoctorName(name).split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    return '${parts.first}|${parts.last}';
  }

  static String canonicalDoctorId(String doctorId, String doctorName) {
    final n = _normDoctorName(doctorName);
    if (n.contains('chamidu') && (n.contains('rathnayake') || n.contains('kaushal'))) {
      return 'd-chamidu-rathnayake';
    }
    final id = doctorId.trim();
    if (id.startsWith('d-') || id.startsWith('clinic-')) return id;
    if (id.isNotEmpty) return id;
    final slug = n.replaceAll(RegExp(r'\s+'), '-');
    return slug.isEmpty ? 'd-unknown' : 'd-$slug';
  }

  static List<String> identityIds(String doctorId, String doctorName) {
    final ids = <String>{};
    final raw = doctorId.trim();
    if (raw.isNotEmpty) ids.add(raw);
    ids.add(canonicalDoctorId(doctorId, doctorName));
    final n = _normDoctorName(doctorName);
    if (n.contains('chamidu') && (n.contains('rathnayake') || n.contains('kaushal'))) {
      ids.add('d-chamidu-rathnayake');
      ids.add('d-chamidu-kaushal-rathnayake');
    }
    return ids.where((id) => id.isNotEmpty).toList();
  }

  static bool isSameClinicDoctor({
    required String selectedId,
    required String selectedName,
    required String bookingDoctorId,
    required String bookingDoctorName,
  }) {
    final selected = identityIds(selectedId, selectedName).toSet();
    if (identityIds(bookingDoctorId, bookingDoctorName).any(selected.contains)) {
      return true;
    }
    final a = personKey(selectedName);
    final b = personKey(bookingDoctorName);
    return a.isNotEmpty && a == b;
  }

  static int? _parseHm(String raw) {
    final m = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(raw.trim());
    if (m == null) return null;
    return int.parse(m.group(1)!) * 60 + int.parse(m.group(2)!);
  }

  /// Times still open on [date] for this doctor (roster hours + not in the past).
  /// Booked times on that date are always included so occupancy is visible even
  /// when Practice Manager hours would otherwise hide the slot (e.g. Sunday).
  static List<TimeOfDay> timesFor(
    Doctor doctor,
    DateTime date, {
    DateTime? now,
    Iterable<DateTime>? booked,
  }) {
    var list = List<TimeOfDay>.from(times);
    if (doctor.rosterHours.isNotEmpty) {
      final key = _weekdays[date.weekday - 1];
      final day = doctor.rosterHours[key];
      if (day != null) {
        final start = _parseHm(day['start'] ?? '') ?? 0;
        final end = _parseHm(day['end'] ?? '') ?? (24 * 60);
        list = list.where((t) {
          final m = _minutes(t);
          return m >= start && m < end;
        }).toList();
      }
    }
    if (booked != null) {
      for (final b in booked) {
        if (b.year != date.year || b.month != date.month || b.day != date.day) {
          continue;
        }
        final t = TimeOfDay(hour: b.hour, minute: b.minute);
        if (!list.any((x) => x.hour == t.hour && x.minute == t.minute)) {
          list.add(t);
        }
      }
      list.sort((a, b) => _minutes(a).compareTo(_minutes(b)));
    }
    final n = now ?? DateTime.now();
    final isToday =
        date.year == n.year && date.month == n.month && date.day == n.day;
    if (isToday) {
      list = list.where((t) {
        final slot = combine(date, t);
        if (booked != null && isTaken(slot, booked)) return true;
        return slot.isAfter(n);
      }).toList();
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

  static int? parseClockMinutes(String raw) {
    final t = raw.trim().replaceAll('.', ':').replaceAll(RegExp(r'\s+'), ' ');
    final ampm = RegExp(r'^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$', caseSensitive: false)
        .firstMatch(t);
    if (ampm != null) {
      var hours = int.parse(ampm.group(1)!) % 12;
      if (ampm.group(3)!.toUpperCase() == 'PM') hours += 12;
      return hours * 60 + int.parse(ampm.group(2)!);
    }
    final glued = RegExp(r'^(\d{1,2}):(\d{2})(?::\d{2})?(AM|PM)$', caseSensitive: false)
        .firstMatch(t);
    if (glued != null) {
      var hours = int.parse(glued.group(1)!) % 12;
      if (glued.group(3)!.toUpperCase() == 'PM') hours += 12;
      return hours * 60 + int.parse(glued.group(2)!);
    }
    final h24 = RegExp(r'^(\d{1,2}):(\d{2})(?::\d{2})?$').firstMatch(t);
    if (h24 != null) {
      return (int.parse(h24.group(1)!) % 24) * 60 + int.parse(h24.group(2)!);
    }
    return null;
  }

  /// Clinic wall-clock from Firestore `date` + `time` (not the ISO `timeSlot`).
  static DateTime? wallClockFromBooking(Map<String, dynamic> data) {
    final dateRaw = '${data['date'] ?? ''}';
    final key = dateRaw.length >= 10 ? dateRaw.substring(0, 10) : '';
    final minutes = parseClockMinutes('${data['time'] ?? ''}');
    if (RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(key) && minutes != null) {
      final p = key.split('-');
      return DateTime(
        int.parse(p[0]),
        int.parse(p[1]),
        int.parse(p[2]),
        minutes ~/ 60,
        minutes % 60,
      );
    }
    final raw = data['timeSlot'] as String?;
    final parsed = DateTime.tryParse(raw ?? '');
    if (parsed == null) return null;
    if (!parsed.isUtc) return parsed;
    return DateTime(
      parsed.toLocal().year,
      parsed.toLocal().month,
      parsed.toLocal().day,
      parsed.toLocal().hour,
      parsed.toLocal().minute,
    );
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
    final open = doctor != null
        ? timesFor(doctor, date, booked: booked)
        : times;
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

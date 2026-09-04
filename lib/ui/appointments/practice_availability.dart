import '../../data/catalogs/doctor_schedule_slots.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import 'clinic_practice.dart';

class PracticeSlotPreview {
  const PracticeSlotPreview({
    required this.doctor,
    required this.date,
    required this.slots,
  });

  final Doctor doctor;
  final DateTime date;
  final List<DateTime> slots;
}

Future<PracticeSlotPreview?> nextAvailabilityForDoctor(
  HealthRepository health,
  Doctor doctor, {
  int scanDays = 14,
}) async {
  if (doctor.isClinicOnly) return null;
  final booked = await health.getDoctorBookedSlots(
    doctor.id,
    doctorName: doctor.name,
  );
  for (final date in DoctorScheduleSlots.upcomingDates(days: scanDays)) {
    final times = DoctorScheduleSlots.timesFor(
      doctor,
      date,
      booked: booked,
    );
    final open = <DateTime>[];
    for (final t in times) {
      final slot = DoctorScheduleSlots.combine(date, t);
      if (!DoctorScheduleSlots.isTaken(slot, booked)) {
        open.add(slot);
      }
      if (open.length >= 4) break;
    }
    if (open.isNotEmpty) {
      return PracticeSlotPreview(doctor: doctor, date: date, slots: open);
    }
  }
  return null;
}

Future<PracticeSlotPreview?> nextAvailabilityForPractice(
  HealthRepository health,
  ClinicPractice practice,
) async {
  PracticeSlotPreview? best;
  for (final doctor in practice.practitioners) {
    final preview = await nextAvailabilityForDoctor(health, doctor);
    if (preview == null) continue;
    if (best == null ||
        preview.slots.first.isBefore(best.slots.first)) {
      best = preview;
    }
  }
  return best;
}

Future<DateTime?> nextSlotForDoctor(
  HealthRepository health,
  Doctor doctor,
) async {
  final preview = await nextAvailabilityForDoctor(health, doctor);
  return preview?.slots.first;
}

String dayLabelForSlot(DateTime slot, DateTime now) {
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(slot.year, slot.month, slot.day);
  final diff = day.difference(today).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Tomorrow';
  return '${_weekdayShort[slot.weekday - 1]} ${slot.day}';
}

const _weekdayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

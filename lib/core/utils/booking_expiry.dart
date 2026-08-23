/// When Home / Call booking cards disappear after the slot time.
abstract final class BookingExpiry {
  /// Doctor clinic or video: hide 1 hour after the booked start time.
  ///
  /// Example: 23 Aug 2026 09:30 → hides at 23 Aug 2026 10:30.
  static DateTime hidesAtAppointment(DateTime slot) =>
      slot.add(const Duration(hours: 1));

  static bool isAppointmentVisibleOnHome(DateTime slot, [DateTime? now]) {
    return (now ?? DateTime.now()).isBefore(hidesAtAppointment(slot));
  }

  /// Vaccine sessions: stay on Home until local midnight after the slot date.
  static DateTime hidesAtVaccine(DateTime slot) {
    final day = DateTime(slot.year, slot.month, slot.day);
    return day.add(const Duration(days: 1));
  }

  static bool isVaccineVisibleOnHome(DateTime slot, [DateTime? now]) {
    return (now ?? DateTime.now()).isBefore(hidesAtVaccine(slot));
  }

  /// @Deprecated — use [hidesAtAppointment] or [hidesAtVaccine].
  static DateTime hidesAt(DateTime slot) => hidesAtAppointment(slot);

  /// @Deprecated — use [isAppointmentVisibleOnHome] or [isVaccineVisibleOnHome].
  static bool isVisibleOnHome(DateTime slot, [DateTime? now]) =>
      isAppointmentVisibleOnHome(slot, now);
}

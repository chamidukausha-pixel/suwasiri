/// Home cards stay visible through the booking’s calendar day, then hide at local midnight.
abstract final class BookingExpiry {
  /// Local start of the next calendar day after [slot].
  ///
  /// Example: 21 Aug 2026 10:30 → hides at 22 Aug 2026 00:00 (midnight).
  static DateTime hidesAt(DateTime slot) {
    final day = DateTime(slot.year, slot.month, slot.day);
    return day.add(const Duration(days: 1));
  }

  static bool isVisibleOnHome(DateTime slot, [DateTime? now]) {
    return (now ?? DateTime.now()).isBefore(hidesAt(slot));
  }
}

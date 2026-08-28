/// One-shot intent when Home (or elsewhere) opens the Doctors tab.
class DoctorDirectoryIntent {
  DoctorDirectoryIntent._();

  static String? pendingVisitReason;
  static String? pendingCategoryId;

  static void set({
    String? visitReason,
    String? categoryId,
  }) {
    pendingVisitReason = visitReason;
    pendingCategoryId = categoryId;
  }

  static ({String? visitReason, String? categoryId}) consume() {
    final result = (
      visitReason: pendingVisitReason,
      categoryId: pendingCategoryId,
    );
    pendingVisitReason = null;
    pendingCategoryId = null;
    return result;
  }
}

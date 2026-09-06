/// One-shot intent when Home (or elsewhere) opens the Doctors tab.
class DoctorDirectoryIntent {
  DoctorDirectoryIntent._();

  static String? pendingVisitReason;
  static String? pendingCategoryId;
  /// GP Care MBS service from Home: medical_certificate / repeat_prescription / review_results.
  static String? pendingHomeService;

  static void set({
    String? visitReason,
    String? categoryId,
    String? homeService,
  }) {
    pendingVisitReason = visitReason;
    pendingCategoryId = categoryId;
    pendingHomeService = homeService;
  }

  static ({String? visitReason, String? categoryId, String? homeService}) consume() {
    final result = (
      visitReason: pendingVisitReason,
      categoryId: pendingCategoryId,
      homeService: pendingHomeService,
    );
    pendingVisitReason = null;
    pendingCategoryId = null;
    pendingHomeService = null;
    return result;
  }
}

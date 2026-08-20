/// Maps Suwasiri clinic names onto Sri Lankan GP Care hospital/branch IDs
/// (`web/src/tenancy.ts`). Keep these string IDs in lockstep.
abstract final class GpCareClinicMap {
  static const hospitalPrimecare = 'hosp-primecare';
  static const hospitalSouthern = 'hosp-southern';
  static const branchColombo = 'branch-cmb';
  static const branchKandy = 'branch-kdy';
  static const branchGalle = 'branch-galle';

  static ({String hospitalId, String branchId}) resolve(String hospitalName) {
    final n = hospitalName.toLowerCase();
    if (n.contains('kandy')) {
      return (hospitalId: hospitalPrimecare, branchId: branchKandy);
    }
    if (n.contains('southern') || n.contains('galle')) {
      return (hospitalId: hospitalSouthern, branchId: branchGalle);
    }
    return (hospitalId: hospitalPrimecare, branchId: branchColombo);
  }
}

String gpCareDateKey(DateTime slot) {
  final y = slot.year.toString().padLeft(4, '0');
  final m = slot.month.toString().padLeft(2, '0');
  final d = slot.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

String gpCareTimeLabel(DateTime slot) {
  final hour = slot.hour % 12 == 0 ? 12 : slot.hour % 12;
  final min = slot.minute.toString().padLeft(2, '0');
  final ampm = slot.hour >= 12 ? 'PM' : 'AM';
  return '${hour.toString().padLeft(2, '0')}:$min $ampm';
}

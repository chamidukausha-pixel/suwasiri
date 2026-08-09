import '../models/vault_report.dart';

/// Curated sample e-prescriptions for patient reference (not live session Rx).
abstract final class SamplePrescriptions {
  static List<Prescription> referenceSamples({String patientId = 'sample'}) {
    final issued = DateTime.now().subtract(const Duration(days: 3));
    return [
      Prescription(
        id: 'sample-amox',
        medicine: 'Amoxicillin 500mg capsules',
        doctor: 'Dr. Aruni Perera',
        code: 'EP-00003194',
        active: true,
        patientId: patientId,
        schedule: '1 capsule three times daily after meals for 5 days',
        doseBadge: '1×3',
        issuedAt: issued,
        clinicName: 'Lanka GP Care · Durdans Teleclinic',
      ),
      Prescription(
        id: 'sample-para',
        medicine: 'Paracetamol 500mg tablets',
        doctor: 'Dr. Aruni Perera',
        code: 'EP-00003194',
        active: true,
        patientId: patientId,
        schedule: '1–2 tablets every 6 hours if fever or pain (max 4g/day)',
        doseBadge: 'PRN',
        issuedAt: issued,
        clinicName: 'Lanka GP Care · Durdans Teleclinic',
      ),
      Prescription(
        id: 'sample-atorva',
        medicine: 'Atorvastatin 20mg tablets',
        doctor: 'Dr. Kavinda Jayawardena',
        code: 'EP-00005290',
        active: true,
        patientId: patientId,
        schedule: '1 tablet at night',
        doseBadge: '1×1',
        issuedAt: issued.subtract(const Duration(days: 14)),
        clinicName: 'Nawaloka Heart Clinic · Colombo 02',
      ),
      Prescription(
        id: 'sample-met',
        medicine: 'Metformin 500mg tablets',
        doctor: 'Dr. Kavinda Jayawardena',
        code: 'EP-00005312',
        active: true,
        patientId: patientId,
        schedule: '1 tablet twice daily with meals',
        doseBadge: '1×2',
        issuedAt: issued.subtract(const Duration(days: 14)),
        clinicName: 'Nawaloka Heart Clinic · Colombo 02',
      ),
      Prescription(
        id: 'sample-salbut',
        medicine: 'Salbutamol 100mcg inhaler',
        doctor: 'Dr. Nimal Fernando',
        code: 'EP-00006101',
        active: true,
        patientId: patientId,
        schedule: '2 puffs as needed for wheeze (max 8 puffs/day)',
        doseBadge: 'PRN',
        issuedAt: issued.subtract(const Duration(days: 30)),
        clinicName: 'Asiri Central · Respiratory Unit',
      ),
    ];
  }

  /// Groups samples into script forms (same code = one form).
  static List<List<Prescription>> groupedScripts({String patientId = 'sample'}) {
    final map = <String, List<Prescription>>{};
    for (final rx in referenceSamples(patientId: patientId)) {
      map.putIfAbsent(rx.code, () => []).add(rx);
    }
    return map.values.toList();
  }

  /// Clinic name → medicines (for tappable clinic rows under E-Prescription).
  static Map<String, List<Prescription>> byClinic({String patientId = 'sample'}) {
    final map = <String, List<Prescription>>{};
    for (final rx in referenceSamples(patientId: patientId)) {
      map.putIfAbsent(rx.clinicName, () => []).add(rx);
    }
    return map;
  }
}

import '../models/vaccine_models.dart';
import 'sri_lanka_vaccine_facilities.dart';

/// National immunization targets + registered vaccination centers.
abstract final class VaccineCatalog {
  /// Babies from birth through childhood + adult / travel vaccines.
  static const List<String> immunizationTargets = [
    'BCG (at birth)',
    'Hepatitis B — Birth dose',
    'OPV / IPV (Polio)',
    'Pentavalent (DTP-HepB-Hib) — Dose 1',
    'Pentavalent (DTP-HepB-Hib) — Dose 2',
    'Pentavalent (DTP-HepB-Hib) — Dose 3',
    'Pneumococcal (PCV) — Dose 1',
    'Pneumococcal (PCV) — Dose 2',
    'Rotavirus — Dose 1',
    'Rotavirus — Dose 2',
    'MMR (Measles, Mumps, Rubella) — Dose 1',
    'MMR (Measles, Mumps, Rubella) — Dose 2',
    'Japanese Encephalitis (JE) — Live',
    'Japanese Encephalitis (JE) — Booster',
    'DT / aP booster (preschool)',
    'HPV (Girls) — Dose 1',
    'HPV (Girls) — Dose 2',
    'Tetanus Toxoid (TT) / Td',
    'COVID-19 Primary series',
    'COVID-19 Booster',
    'Influenza (Seasonal)',
    'Dengue Prevention (Dose 1) (Qdenga® Tetravalent Vaccine)',
    'Dengue Prevention (Dose 2) (Qdenga® Tetravalent Vaccine)',
    'Typhoid (Vi polysaccharide)',
    'Varicella (Chickenpox)',
    'Hepatitis A',
    'Rabies (post-exposure schedule)',
  ];

  /// Pending + scheduled protocols for the Vaccines main page only.
  static List<VaccineProtocol> activeProtocols() {
    return [
      VaccineProtocol(
        id: 'v1',
        name: 'Dengue Prevention (Dose 2)',
        doseLabel: 'Dose 2 of 3',
        productName: 'Qdenga® Tetravalent Vaccine',
        progress: 0.60,
        nextDue: DateTime.now().add(const Duration(days: 12)),
        status: VaccineStatus.pending,
        statusDetail: 'Schedule required',
      ),
      VaccineProtocol(
        id: 'v3',
        name: 'Influenza (Flu Shot) Annual',
        doseLabel: 'Dose 1 of 1',
        productName: 'Influvac Tetra 2026 Season',
        progress: 0.0,
        nextDue: DateTime(2026, 7, 13),
        status: VaccineStatus.scheduled,
        statusDetail: 'Booked at clinic',
        booked: true,
      ),
      VaccineProtocol(
        id: 'v4',
        name: 'HPV (Girls) — Dose 2',
        doseLabel: 'Dose 2 of 2',
        productName: 'Gardasil®',
        progress: 0.50,
        nextDue: DateTime.now().add(const Duration(days: 28)),
        status: VaccineStatus.pending,
        statusDetail: 'Schedule required',
      ),
      VaccineProtocol(
        id: 'v5',
        name: 'Japanese Encephalitis — Booster',
        doseLabel: 'Booster',
        productName: 'JE Live Attenuated',
        progress: 0.75,
        nextDue: DateTime.now().add(const Duration(days: 45)),
        status: VaccineStatus.pending,
        statusDetail: 'Due soon',
      ),
    ];
  }

  static List<ClinicFacility> get clinics => SriLankaVaccineFacilities.all;

  /// Search MOH offices, government hospitals, and private hospitals.
  /// A typed query of 2+ characters searches nationwide (district filter off).
  static List<ClinicFacility> searchClinics({
    String? district,
    FacilityType type = FacilityType.all,
    String query = '',
  }) {
    final q = query.trim().toLowerCase();
    final nationwide = q.length >= 2;
    return clinics.where((c) {
      final dOk = nationwide ||
          district == null ||
          district.isEmpty ||
          c.district == district;
      final tOk = type == FacilityType.all || c.type == type;
      final qOk = q.isEmpty ||
          c.name.toLowerCase().contains(q) ||
          c.address.toLowerCase().contains(q) ||
          c.district.toLowerCase().contains(q);
      return dOk && tOk && qOk;
    }).toList();
  }
}

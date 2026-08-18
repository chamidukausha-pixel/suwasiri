import '../models/vaccine_models.dart';
import 'sri_lanka_vaccine_facilities.dart';

/// National immunization targets + registered vaccination centers.
abstract final class VaccineCatalog {
  /// Babies from birth through childhood + adult / travel vaccines.
  static const List<String> immunizationTargets = [
    'BCG (tuberculosis)',
    'Hepatitis B (first dose)',
    'Pentavalent 1 (Diphtheria, Tetanus, Pertussis, Hepatitis B, Hib)',
    'OPV 1 (Oral Polio)',
    'IPV 1 (Inactivated Polio)',
    'Pentavalent 2',
    'OPV 2',
    'IPV 2',
    'Pentavalent 3',
    'OPV 3',
    'Measles (first dose)',
    'DPT booster',
    'OPV booster (18 months)',
    'MMR 1',
    'MMR 2',
    'DT (Diphtheria-Tetanus) booster',
    'OPV booster (school entry)',
    'Japanese Encephalitis (JE) — Primary',
    'Japanese Encephalitis (JE) — Booster',
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

  /// Sri Lanka EPI from birth through age 10 (calendar months from DOB).
  ///
  /// Example: born 1 Apr 2026 → Pentavalent 3 and OPV 3 on 1 Oct 2026
  /// (6 months completed). The 4-month visit on 1 Aug 2026 is Pentavalent 2,
  /// OPV 2, and IPV 2.
  static List<VaccineProtocol> protocolsFor({
    DateTime? dateOfBirth,
    List<VaccineBooking> bookings = const [],
    DateTime? now,
  }) {
    final today = now ?? DateTime.now();
    final day = DateTime(today.year, today.month, today.day);
    if (dateOfBirth == null || !_isUnderTen(dateOfBirth, day)) {
      return _withBookings(_adultProtocols(today), bookings, today);
    }
    final all = _epiProtocols(dateOfBirth);
    DateTime? soonestUpcoming;
    for (final p in all) {
      final due = p.nextDue;
      if (due == null) continue;
      final dueDay = DateTime(due.year, due.month, due.day);
      if (dueDay.isBefore(day)) continue;
      if (soonestUpcoming == null || dueDay.isBefore(soonestUpcoming)) {
        soonestUpcoming = dueDay;
      }
    }
    final following = all.where((p) {
      final due = p.nextDue;
      if (due == null) return false;
      final dueDay = DateTime(due.year, due.month, due.day);
      if (dueDay.isBefore(day)) {
        return day.difference(dueDay).inDays <= 90;
      }
      if (dueDay.difference(day).inDays <= 366) return true;
      return soonestUpcoming != null && dueDay == soonestUpcoming;
    }).toList()
      ..sort((a, b) => (a.nextDue ?? day).compareTo(b.nextDue ?? day));
    return _withBookings(following, bookings, today);
  }

  /// Pending + scheduled protocols when date of birth is unknown (adult list).
  static List<VaccineProtocol> activeProtocols() => protocolsFor();

  static bool _isUnderTen(DateTime dob, DateTime onDay) {
    final tenth = DateTime(dob.year + 10, dob.month, dob.day);
    return onDay.isBefore(tenth);
  }

  /// Add [months] to [dob], clamping the day if the target month is shorter.
  static DateTime addCalendarMonths(DateTime dob, int months) {
    var year = dob.year;
    var month = dob.month + months;
    year += (month - 1) ~/ 12;
    month = ((month - 1) % 12) + 1;
    final lastDay = DateTime(year, month + 1, 0).day;
    final day = dob.day > lastDay ? lastDay : dob.day;
    return DateTime(year, month, day);
  }

  static List<VaccineProtocol> _epiProtocols(DateTime dob) {
    DateTime at(int months) => addCalendarMonths(dob, months);
    return [
      _dose(
        id: 'epi-bcg',
        name: 'BCG (tuberculosis)',
        doseLabel: 'Birth dose',
        product: 'BCG vaccine',
        due: at(0),
        progress: 0.05,
      ),
      _dose(
        id: 'epi-hepb-birth',
        name: 'Hepatitis B (first dose)',
        doseLabel: 'Birth dose',
        product: 'Hepatitis B vaccine',
        due: at(0),
        progress: 0.05,
      ),
      _dose(
        id: 'epi-penta-1',
        name: 'Pentavalent 1 (Diphtheria, Tetanus, Pertussis, Hepatitis B, Hib)',
        doseLabel: '2 months completed',
        product: 'Pentavalent (DTP-HepB-Hib)',
        due: at(2),
        progress: 0.20,
      ),
      _dose(
        id: 'epi-opv-1',
        name: 'OPV 1 (Oral Polio)',
        doseLabel: '2 months completed',
        product: 'Oral polio vaccine',
        due: at(2),
        progress: 0.20,
      ),
      _dose(
        id: 'epi-ipv-1',
        name: 'IPV 1 (Inactivated Polio)',
        doseLabel: '2 months completed',
        product: 'Inactivated polio vaccine',
        due: at(2),
        progress: 0.20,
      ),
      _dose(
        id: 'epi-penta-2',
        name: 'Pentavalent 2',
        doseLabel: '4 months completed',
        product: 'Pentavalent (DTP-HepB-Hib)',
        due: at(4),
        progress: 0.35,
      ),
      _dose(
        id: 'epi-opv-2',
        name: 'OPV 2',
        doseLabel: '4 months completed',
        product: 'Oral polio vaccine',
        due: at(4),
        progress: 0.35,
      ),
      _dose(
        id: 'epi-ipv-2',
        name: 'IPV 2',
        doseLabel: '4 months completed',
        product: 'Inactivated polio vaccine',
        due: at(4),
        progress: 0.35,
      ),
      _dose(
        id: 'epi-penta-3',
        name: 'Pentavalent 3',
        doseLabel: '6 months completed',
        product: 'Pentavalent (DTP-HepB-Hib)',
        due: at(6),
        progress: 0.50,
      ),
      _dose(
        id: 'epi-opv-3',
        name: 'OPV 3',
        doseLabel: '6 months completed',
        product: 'Oral polio vaccine',
        due: at(6),
        progress: 0.50,
      ),
      _dose(
        id: 'epi-measles-1',
        name: 'Measles (first dose)',
        doseLabel: '9 months completed',
        product: 'Measles vaccine',
        due: at(9),
        progress: 0.58,
      ),
      _dose(
        id: 'epi-je-primary',
        name: 'Japanese Encephalitis (JE) — Primary',
        doseLabel: '12 months · high-risk areas',
        product: 'JE live attenuated',
        due: at(12),
        progress: 0.62,
      ),
      _dose(
        id: 'epi-dpt-booster',
        name: 'DPT booster',
        doseLabel: '18 months',
        product: 'DPT booster',
        due: at(18),
        progress: 0.70,
      ),
      _dose(
        id: 'epi-opv-booster-18',
        name: 'OPV booster (18 months)',
        doseLabel: '18 months',
        product: 'Oral polio vaccine',
        due: at(18),
        progress: 0.70,
      ),
      _dose(
        id: 'epi-mmr-1',
        name: 'MMR 1',
        doseLabel: '18 months',
        product: 'Measles, Mumps and Rubella',
        due: at(18),
        progress: 0.70,
      ),
      _dose(
        id: 'epi-je-booster',
        name: 'Japanese Encephalitis (JE) — Booster',
        doseLabel: '24 months · high-risk areas',
        product: 'JE live attenuated',
        due: at(24),
        progress: 0.78,
      ),
      _dose(
        id: 'epi-mmr-2',
        name: 'MMR 2',
        doseLabel: '3 years',
        product: 'Measles, Mumps and Rubella',
        due: at(36),
        progress: 0.88,
      ),
      _dose(
        id: 'epi-dt-5',
        name: 'DT (Diphtheria-Tetanus) booster',
        doseLabel: '5 years · school entry',
        product: 'DT booster',
        due: at(60),
        progress: 0.95,
      ),
      _dose(
        id: 'epi-opv-booster-5',
        name: 'OPV booster (school entry)',
        doseLabel: '5 years · school entry',
        product: 'Oral polio vaccine',
        due: at(60),
        progress: 0.95,
      ),
    ];
  }

  static List<VaccineProtocol> _adultProtocols(DateTime today) {
    return [
      VaccineProtocol(
        id: 'v1',
        name: 'Dengue Prevention (Dose 2)',
        doseLabel: 'Dose 2 of 3',
        productName: 'Qdenga® Tetravalent Vaccine',
        progress: 0.60,
        nextDue: today.add(const Duration(days: 12)),
        status: VaccineStatus.pending,
        statusDetail: 'Schedule required',
      ),
      VaccineProtocol(
        id: 'v3',
        name: 'Influenza (Flu Shot) Annual',
        doseLabel: 'Dose 1 of 1',
        productName: 'Influvac Tetra',
        progress: 0.0,
        nextDue: DateTime(today.year + 1, 4, 1),
        status: VaccineStatus.pending,
        statusDetail: 'Schedule required',
      ),
      VaccineProtocol(
        id: 'v4',
        name: 'HPV (Girls) — Dose 2',
        doseLabel: 'Dose 2 of 2',
        productName: 'Gardasil®',
        progress: 0.50,
        nextDue: today.add(const Duration(days: 28)),
        status: VaccineStatus.pending,
        statusDetail: 'Schedule required',
      ),
      VaccineProtocol(
        id: 'v5',
        name: 'Japanese Encephalitis — Booster',
        doseLabel: 'Booster',
        productName: 'JE Live Attenuated',
        progress: 0.75,
        nextDue: today.add(const Duration(days: 45)),
        status: VaccineStatus.pending,
        statusDetail: 'Due soon',
      ),
    ];
  }

  static VaccineProtocol _dose({
    required String id,
    required String name,
    required String doseLabel,
    required String product,
    required DateTime due,
    required double progress,
  }) {
    return VaccineProtocol(
      id: id,
      name: name,
      doseLabel: doseLabel,
      productName: product,
      progress: progress,
      nextDue: due,
      status: VaccineStatus.pending,
      statusDetail: 'Reminder — schedule this dose',
    );
  }

  static List<VaccineProtocol> _withBookings(
    List<VaccineProtocol> protocols,
    List<VaccineBooking> bookings,
    DateTime now,
  ) {
    return protocols.map((p) {
      VaccineBooking? match;
      for (final b in bookings) {
        if (b.status != 'confirmed') continue;
        if (!_namesMatch(p.name, b.vaccineName)) continue;
        if (match == null || b.slot.isAfter(match.slot)) match = b;
      }
      if (match == null) {
        final due = p.nextDue;
        if (due != null &&
            DateTime(due.year, due.month, due.day)
                .isBefore(DateTime(now.year, now.month, now.day))) {
          return p.copyWith(statusDetail: 'Overdue — schedule now');
        }
        return p;
      }
      final upcoming = match.slot.isAfter(now);
      return p.copyWith(
        booked: true,
        status: upcoming ? VaccineStatus.scheduled : VaccineStatus.pending,
        statusDetail: upcoming
            ? 'Booked at ${match.facilityName}'
            : 'Session completed — confirm in Vault',
        nextDue: upcoming ? match.slot : p.nextDue,
        progress: upcoming ? (p.progress + 0.15).clamp(0.0, 0.95) : p.progress,
      );
    }).toList();
  }

  static bool _namesMatch(String protocolName, String vaccineName) {
    final a = _compact(protocolName);
    final b = _compact(vaccineName);
    if (a.isEmpty || b.isEmpty) return false;
    return a == b || a.contains(b) || b.contains(a);
  }

  static String _compact(String raw) =>
      raw.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), ' ').trim();

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

import 'package:flutter_test/flutter_test.dart';
import 'package:suwasiri/data/catalogs/vaccine_catalog.dart';
import 'package:suwasiri/data/models/vaccine_models.dart';

void main() {
  group('EPI calendar months', () {
    test('adds months without shifting the day', () {
      final dob = DateTime(2026, 4, 1);
      expect(VaccineCatalog.addCalendarMonths(dob, 2), DateTime(2026, 6, 1));
      expect(VaccineCatalog.addCalendarMonths(dob, 4), DateTime(2026, 8, 1));
      expect(VaccineCatalog.addCalendarMonths(dob, 6), DateTime(2026, 10, 1));
      expect(VaccineCatalog.addCalendarMonths(dob, 9), DateTime(2027, 1, 1));
      expect(VaccineCatalog.addCalendarMonths(dob, 18), DateTime(2027, 10, 1));
      expect(VaccineCatalog.addCalendarMonths(dob, 36), DateTime(2029, 4, 1));
      expect(VaccineCatalog.addCalendarMonths(dob, 60), DateTime(2031, 4, 1));
    });
  });

  group('protocolsFor children under 10', () {
    final dob = DateTime(2026, 4, 1);

    test('Pentavalent 3 and OPV 3 are due at 6 months completed', () {
      final now = DateTime(2026, 8, 17);
      final protocols = VaccineCatalog.protocolsFor(
        dateOfBirth: dob,
        now: now,
      );
      DateTime? penta3;
      DateTime? opv3;
      for (final p in protocols) {
        if (p.name == 'Pentavalent 3') penta3 = p.nextDue;
        if (p.name == 'OPV 3') opv3 = p.nextDue;
      }
      expect(penta3, DateTime(2026, 10, 1));
      expect(opv3, DateTime(2026, 10, 1));
    });

    test('4-month visit is Pentavalent 2, OPV 2, and IPV 2', () {
      final now = DateTime(2026, 7, 15);
      final protocols = VaccineCatalog.protocolsFor(
        dateOfBirth: dob,
        now: now,
      );
      final names = protocols
          .where((p) => p.nextDue == DateTime(2026, 8, 1))
          .map((p) => p.name)
          .toSet();
      expect(
        names,
        {
          'Pentavalent 2',
          'OPV 2',
          'IPV 2',
        },
      );
    });

    test('does not show dummy adult dengue protocols for a toddler', () {
      final protocols = VaccineCatalog.protocolsFor(
        dateOfBirth: dob,
        now: DateTime(2026, 8, 17),
      );
      expect(protocols.any((p) => p.name.toLowerCase().contains('dengue')), isFalse);
    });

    test('marks a matching booking as scheduled', () {
      final booking = VaccineBooking(
        id: 'b1',
        facilityId: 'c1',
        facilityName: 'Colombo MOH',
        slot: DateTime(2026, 10, 2, 9, 30),
        ceylonHealthId: 'CH-1',
        status: 'confirmed',
        vaccineName: 'Pentavalent 3',
        bookedAt: DateTime(2026, 8, 17),
      );
      final protocols = VaccineCatalog.protocolsFor(
        dateOfBirth: dob,
        now: DateTime(2026, 8, 17),
        bookings: [booking],
      );
      final penta3 = protocols.firstWhere((p) => p.name == 'Pentavalent 3');
      expect(penta3.booked, isTrue);
      expect(penta3.status, VaccineStatus.scheduled);
    });
  });

  group('protocolsFor adults', () {
    test('uses adult list when age is 10 or over', () {
      final protocols = VaccineCatalog.protocolsFor(
        dateOfBirth: DateTime(2010, 1, 1),
        now: DateTime(2026, 8, 17),
      );
      expect(protocols.any((p) => p.name.contains('Dengue')), isTrue);
      expect(protocols.any((p) => p.name == 'Pentavalent 3'), isFalse);
    });

    test('adult influenza is not pre-marked as booked', () {
      final protocols = VaccineCatalog.protocolsFor(
        now: DateTime(2026, 8, 17),
      );
      expect(protocols.any((p) => p.booked), isFalse);
    });
  });
}

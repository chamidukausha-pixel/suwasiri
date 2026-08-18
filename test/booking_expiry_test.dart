import 'package:flutter_test/flutter_test.dart';
import 'package:suwasiri/core/utils/booking_expiry.dart';
import 'package:suwasiri/data/models/appointment.dart';
import 'package:suwasiri/data/models/vaccine_models.dart';

void main() {
  final slot = DateTime(2026, 8, 21, 10, 30);

  test('hides at local midnight after the booking date', () {
    expect(BookingExpiry.hidesAt(slot), DateTime(2026, 8, 22));
  });

  test('stays visible through the appointment day', () {
    expect(
      BookingExpiry.isVisibleOnHome(slot, DateTime(2026, 8, 21, 23, 59, 59)),
      isTrue,
    );
  });

  test('disappears at 22/08/2026 midnight', () {
    expect(
      BookingExpiry.isVisibleOnHome(slot, DateTime(2026, 8, 22)),
      isFalse,
    );
  });

  test('clinic and vaccine bookings share the same hide rule', () {
    final clinic = Appointment(
      id: 'a1',
      patientId: 'p1',
      doctorId: 'd1',
      doctorName: 'Dr Test',
      specialty: 'GP',
      timeSlot: DateTime(2026, 8, 21, 10, 30),
      status: AppointmentStatus.upcoming,
    );
    final vaccine = VaccineBooking(
      id: 'v1',
      facilityId: 'moh-gampaha',
      facilityName: 'MOH Gampaha',
      slot: DateTime(2026, 8, 21, 10, 30),
      ceylonHealthId: 'CH-1',
      status: 'confirmed',
    );

    expect(clinic.isVisibleOnHome(DateTime(2026, 8, 21, 18)), isTrue);
    expect(vaccine.isVisibleOnHome(DateTime(2026, 8, 21, 18)), isTrue);
    expect(clinic.isVisibleOnHome(DateTime(2026, 8, 22)), isFalse);
    expect(vaccine.isVisibleOnHome(DateTime(2026, 8, 22)), isFalse);
  });
}

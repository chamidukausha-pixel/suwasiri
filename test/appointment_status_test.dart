import 'package:flutter_test/flutter_test.dart';
import 'package:suwasiri/data/models/appointment.dart';

void main() {
  test('appointmentStatusFrom maps GP Care COMPLETED and cancelled', () {
    expect(appointmentStatusFrom('COMPLETED'), AppointmentStatus.completed);
    expect(appointmentStatusFrom('completed'), AppointmentStatus.completed);
    expect(appointmentStatusFrom('CANCELLED'), AppointmentStatus.cancelled);
    expect(appointmentStatusFrom('upcoming'), AppointmentStatus.upcoming);
    expect(appointmentStatusFrom('SCHEDULED'), AppointmentStatus.upcoming);
  });
}

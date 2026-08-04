import 'package:equatable/equatable.dart';

class Doctor extends Equatable {
  const Doctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.hospital,
    required this.rating,
  });

  final String id;
  final String name;
  final String specialty;
  final String hospital;
  final double rating;

  @override
  List<Object?> get props => [id, name, specialty, hospital, rating];
}

enum AppointmentStatus { upcoming, completed, cancelled }

class Appointment extends Equatable {
  const Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.specialty,
    required this.timeSlot,
    required this.status,
    this.token,
  });

  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String specialty;
  final DateTime timeSlot;
  final AppointmentStatus status;
  final String? token;

  Map<String, dynamic> toMap() => {
        'patientId': patientId,
        'doctorId': doctorId,
        'doctorName': doctorName,
        'specialty': specialty,
        'timeSlot': timeSlot.toIso8601String(),
        'status': status.name,
        'token': token,
      };

  factory Appointment.fromMap(String id, Map<String, dynamic> map) {
    return Appointment(
      id: id,
      patientId: map['patientId'] as String? ?? '',
      doctorId: map['doctorId'] as String? ?? '',
      doctorName: map['doctorName'] as String? ?? '',
      specialty: map['specialty'] as String? ?? '',
      timeSlot:
          DateTime.tryParse(map['timeSlot'] as String? ?? '') ?? DateTime.now(),
      status: AppointmentStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => AppointmentStatus.upcoming,
      ),
      token: map['token'] as String?,
    );
  }

  @override
  List<Object?> get props =>
      [id, patientId, doctorId, doctorName, specialty, timeSlot, status, token];
}

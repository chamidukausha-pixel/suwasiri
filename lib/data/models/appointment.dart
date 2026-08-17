import 'package:equatable/equatable.dart';

class Doctor extends Equatable {
  const Doctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.hospital,
    required this.rating,
    this.region = 'Colombo',
    this.yearsExperience = 10,
    this.feeLkr = 2500,
    this.bio =
        'Experienced consultant providing patient-centred care at accredited Sri Lankan hospitals.',
    this.nextAvailable = 'Mon–Fri · 09:00–13:00',
    this.address = '',
    this.latitude,
    this.longitude,
  });

  final String id;
  final String name;
  final String specialty;
  final String hospital;
  final double rating;
  final String region;
  final int yearsExperience;
  final int feeLkr;
  final String bio;
  final String nextAvailable;
  final String address;
  final double? latitude;
  final double? longitude;

  String get placeLabel {
    final parts = [
      hospital,
      if (address.isNotEmpty) address,
      region,
    ];
    return parts.join(', ');
  }

  @override
  List<Object?> get props => [
        id,
        name,
        specialty,
        hospital,
        rating,
        region,
        yearsExperience,
        feeLkr,
        bio,
        nextAvailable,
        address,
        latitude,
        longitude,
      ];
}

enum AppointmentStatus { upcoming, completed, cancelled }

/// Clinic visit vs video/telehealth consult.
enum ConsultMode { clinic, video }

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
    this.consultMode = ConsultMode.clinic,
  });

  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String specialty;
  final DateTime timeSlot;
  final AppointmentStatus status;
  final String? token;
  final ConsultMode consultMode;

  bool get isVideo => consultMode == ConsultMode.video;

  /// Visible until the booked slot (plus a short consult window).
  bool get isActiveSlot {
    if (status != AppointmentStatus.upcoming) return false;
    final end = timeSlot.add(const Duration(minutes: 45));
    return DateTime.now().isBefore(end);
  }

  Map<String, dynamic> toMap() => {
        'patientId': patientId,
        'doctorId': doctorId,
        'doctorName': doctorName,
        'specialty': specialty,
        'timeSlot': timeSlot.toIso8601String(),
        'status': status.name,
        'token': token,
        'consultMode': consultMode.name,
      };

  factory Appointment.fromMap(String id, Map<String, dynamic> map) {
    final modeRaw = map['consultMode'] as String? ?? '';
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
      consultMode: ConsultMode.values.firstWhere(
        (e) => e.name == modeRaw,
        orElse: () => ConsultMode.clinic,
      ),
    );
  }

  @override
  List<Object?> get props => [
        id,
        patientId,
        doctorId,
        doctorName,
        specialty,
        timeSlot,
        status,
        token,
        consultMode,
      ];
}

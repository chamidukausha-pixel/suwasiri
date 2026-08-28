import 'package:equatable/equatable.dart';

import '../../core/utils/booking_expiry.dart';
import '../catalogs/gp_care_clinic_map.dart';

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
    this.photoUrl,
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
  final String? photoUrl;

  /// Network avatar when no clinic photo is stored.
  String get displayPhotoUrl =>
      photoUrl ??
      'https://i.pravatar.cc/256?u=${Uri.encodeComponent(id)}';

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
        photoUrl,
      ];

  /// GP Care Platform Console doctors published to Firestore `clinic_doctors`.
  factory Doctor.fromClinicMap(String id, Map<String, dynamic> map) {
    return Doctor(
      id: id,
      name: map['name'] as String? ?? '',
      specialty: map['specialty'] as String? ?? 'General Practitioner',
      hospital: map['hospital'] as String? ?? '',
      rating: (map['rating'] as num?)?.toDouble() ?? 4.8,
      region: map['region'] as String? ?? 'Colombo',
      yearsExperience: (map['yearsExperience'] as num?)?.toInt() ?? 8,
      feeLkr: (map['feeLkr'] as num?)?.toInt() ?? 3500,
      bio: map['bio'] as String? ?? '',
      nextAvailable:
          map['nextAvailable'] as String? ?? 'Mon–Fri · 09:00–17:00',
      address: map['address'] as String? ?? '',
      photoUrl: map['photoUrl'] as String?,
    );
  }
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
    this.hospital = '',
    this.bookedAt,
    this.patientName = '',
    this.patientEmail = '',
    this.patientPhone = '',
    this.hospitalId = '',
    this.branchId = '',
    this.paymentMethod,
    this.feeLkr,
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
  final String hospital;
  final DateTime? bookedAt;
  final String patientName;
  final String patientEmail;
  final String patientPhone;
  final String hospitalId;
  final String branchId;
  final String? paymentMethod;
  final int? feeLkr;

  bool get isVideo => consultMode == ConsultMode.video;

  /// Latest booking wins Home/Call cards. Missing `bookedAt` (legacy docs) sorts last.
  DateTime get bookedStamp =>
      bookedAt ?? DateTime.fromMillisecondsSinceEpoch(0);

  /// Call tab: video consult stays until 1 hour after the booked start.
  bool get isActiveSlot {
    if (status != AppointmentStatus.upcoming) return false;
    return DateTime.now().isBefore(BookingExpiry.hidesAtAppointment(timeSlot));
  }

  /// Patient may join the GP Care room from 15 minutes before until +1 hour.
  bool get canJoinGpCareCall {
    if (!isVideo || status != AppointmentStatus.upcoming) return false;
    final now = DateTime.now();
    final open = timeSlot.subtract(const Duration(minutes: 15));
    final close = BookingExpiry.hidesAtAppointment(timeSlot);
    return !now.isBefore(open) && now.isBefore(close);
  }

  /// Home blue / purple cards hide 1 hour after the booked start time.
  bool isVisibleOnHome([DateTime? now]) {
    if (status != AppointmentStatus.upcoming) return false;
    return BookingExpiry.isAppointmentVisibleOnHome(timeSlot, now);
  }

  Map<String, dynamic> toMap() => {
        'patientId': patientId,
        'patientName': patientName,
        'patientEmail': patientEmail,
        'patientPhone': patientPhone,
        'doctorId': doctorId,
        'doctorName': doctorName,
        'specialty': specialty,
        'timeSlot': timeSlot.toIso8601String(),
        'date': gpCareDateKey(timeSlot),
        'time': gpCareTimeLabel(timeSlot),
        'reason': isVideo
            ? 'Video consultation · $specialty'
            : 'Clinic visit · $specialty',
        'type': isVideo ? 'Telehealth Video' : 'Standard GP Consult',
        'isTelehealth': isVideo,
        'status': status.name,
        'token': token,
        'consultMode': consultMode.name,
        'hospital': hospital,
        'clinicName': hospital,
        'hospitalId': hospitalId,
        'branchId': branchId,
        'source': 'suwasiri_app',
        'paymentStatus': 'PAID',
        'paymentMethod': paymentMethod,
        'feeAmount': feeLkr,
        'bookedAt': (bookedAt ?? DateTime.now()).toIso8601String(),
      };

  factory Appointment.fromMap(String id, Map<String, dynamic> map) {
    final modeRaw = (map['consultMode'] as String? ?? '').toLowerCase();
    final typeRaw = (map['type'] as String? ?? '').toLowerCase();
    final isVideo = map['isTelehealth'] == true ||
        modeRaw == ConsultMode.video.name ||
        modeRaw.contains('video') ||
        modeRaw.contains('online') ||
        modeRaw.contains('tele') ||
        typeRaw.contains('telehealth') ||
        typeRaw.contains('video');
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
      consultMode: isVideo ? ConsultMode.video : ConsultMode.clinic,
      hospital: map['hospital'] as String? ??
          map['clinicName'] as String? ??
          '',
      bookedAt: DateTime.tryParse(map['bookedAt'] as String? ?? ''),
      patientName: map['patientName'] as String? ?? '',
      patientEmail: map['patientEmail'] as String? ?? '',
      patientPhone: map['patientPhone'] as String? ?? '',
      hospitalId: map['hospitalId'] as String? ?? '',
      branchId: map['branchId'] as String? ?? '',
      paymentMethod: map['paymentMethod'] as String?,
      feeLkr: (map['feeAmount'] as num?)?.toInt() ??
          (map['feeLkr'] as num?)?.toInt(),
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
        hospital,
        bookedAt,
        patientName,
        patientEmail,
        patientPhone,
        hospitalId,
        branchId,
        paymentMethod,
        feeLkr,
      ];
}

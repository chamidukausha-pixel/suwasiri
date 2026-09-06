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
    this.logoUrl,
    this.hospitalId = '',
    this.branchId = '',
    this.rosterHours = const {},
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
  /// Medical centre logo from GP Care Platform Console.
  final String? logoUrl;
  final String hospitalId;
  final String branchId;
  /// Weekday → `{start: "16:00", end: "18:00"}` from GP Care Practice Manager.
  final Map<String, Map<String, String>> rosterHours;

  /// Platform Console published a medical centre with no doctors yet.
  bool get isClinicOnly =>
      id.startsWith('center-') || specialty == 'Medical Centre';

  Doctor copyWith({
    String? id,
    String? name,
    String? specialty,
    String? hospital,
    double? rating,
    String? region,
    int? yearsExperience,
    int? feeLkr,
    String? bio,
    String? nextAvailable,
    String? address,
    double? latitude,
    double? longitude,
    String? photoUrl,
    String? logoUrl,
    String? hospitalId,
    String? branchId,
    Map<String, Map<String, String>>? rosterHours,
  }) {
    return Doctor(
      id: id ?? this.id,
      name: name ?? this.name,
      specialty: specialty ?? this.specialty,
      hospital: hospital ?? this.hospital,
      rating: rating ?? this.rating,
      region: region ?? this.region,
      yearsExperience: yearsExperience ?? this.yearsExperience,
      feeLkr: feeLkr ?? this.feeLkr,
      bio: bio ?? this.bio,
      nextAvailable: nextAvailable ?? this.nextAvailable,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      photoUrl: photoUrl ?? this.photoUrl,
      logoUrl: logoUrl ?? this.logoUrl,
      hospitalId: hospitalId ?? this.hospitalId,
      branchId: branchId ?? this.branchId,
      rosterHours: rosterHours ?? this.rosterHours,
    );
  }

  /// Network avatar when no clinic photo is stored.
  String get displayPhotoUrl {
    final url = photoUrl?.trim();
    if (url != null && url.isNotEmpty) return url;
    return 'https://i.pravatar.cc/256?u=${Uri.encodeComponent(id)}';
  }

  String get placeLabel {
    final parts = [
      hospital,
      if (address.isNotEmpty) address,
      region,
    ];
    return parts.join(', ');
  }

  /// GP Care MBS schedule for this medical centre (clinic-specific).
  String get feeScheduleHospitalId {
    final hid = hospitalId.trim();
    if (hid.isNotEmpty) return hid;
    return GpCareClinicMap.resolve(hospital).hospitalId;
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
        logoUrl,
        hospitalId,
        branchId,
        rosterHours,
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
      photoUrl: _nonEmptyUrl(map['photoUrl']),
      logoUrl: _nonEmptyUrl(map['logoUrl']),
      hospitalId: map['hospitalId'] as String? ?? '',
      branchId: map['branchId'] as String? ?? '',
      rosterHours: _parseRosterHours(map['rosterHours']),
    );
  }

  static String? _nonEmptyUrl(dynamic raw) {
    final value = raw?.toString().trim() ?? '';
    return value.isEmpty ? null : value;
  }

  static Map<String, Map<String, String>> _parseRosterHours(dynamic raw) {
    if (raw is! Map) return const {};
    final out = <String, Map<String, String>>{};
    raw.forEach((key, value) {
      if (value is! Map) return;
      final start = value['start']?.toString() ?? '';
      final end = value['end']?.toString() ?? '';
      if (start.isEmpty && end.isEmpty) return;
      out[key.toString()] = {'start': start, 'end': end};
    });
    return out;
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
    this.paymentStatus = 'PAID',
    this.paidBySuwasiri = false,
    this.suwasiriReceiptUrl,
    this.visitReason = '',
    this.patientAge,
    this.patientGender = '',
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
  final String paymentStatus;
  final bool paidBySuwasiri;
  final String? suwasiriReceiptUrl;
  final String visitReason;
  final int? patientAge;
  final String patientGender;

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
        'reason': visitReason.trim().isNotEmpty
            ? visitReason.trim()
            : (isVideo
                ? 'Video consultation · $specialty'
                : 'Clinic visit · $specialty'),
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
        'paymentStatus': paymentStatus,
        'paymentMethod': paymentMethod,
        'paidBySuwasiri': paidBySuwasiri,
        'suwasiriReceiptUrl': suwasiriReceiptUrl,
        if (patientAge != null) 'patientAge': patientAge,
        if (patientGender.isNotEmpty) 'patientGender': patientGender,
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
      paymentStatus: map['paymentStatus'] as String? ?? 'PAID',
      paidBySuwasiri: map['paidBySuwasiri'] == true,
      suwasiriReceiptUrl: map['suwasiriReceiptUrl'] as String?,
      visitReason: map['reason'] as String? ?? '',
      patientAge: (map['patientAge'] as num?)?.toInt(),
      patientGender: map['patientGender'] as String? ?? '',
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
        paymentStatus,
        paidBySuwasiri,
        suwasiriReceiptUrl,
        visitReason,
        patientAge,
        patientGender,
      ];
}

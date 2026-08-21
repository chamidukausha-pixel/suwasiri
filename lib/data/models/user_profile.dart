import 'package:equatable/equatable.dart';

import 'patient_health_intake.dart';

class UserProfile extends Equatable {
  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    this.nic,
    this.mobileNo,
    this.bloodGroup,
    this.region,
    this.dateOfBirth,
    this.emergencyContacts = const [],
    this.ceylonHealthId,
    this.barcodeNumber,
    this.healthIntake,
  });

  final String id;
  final String name;
  final String email;
  final String? nic;
  final String? mobileNo;
  final String? bloodGroup;
  final String? region;
  final DateTime? dateOfBirth;
  final List<String> emergencyContacts;
  final String? ceylonHealthId;
  /// Unique barcode number (stable). Displayed on Profile ID card.
  final String? barcodeNumber;
  final PatientHealthIntake? healthIntake;

  DateTime? get effectiveDateOfBirth =>
      dateOfBirth ?? healthIntake?.dateOfBirth;

  int? get ageYears {
    final dob = effectiveDateOfBirth;
    if (dob == null) return null;
    final now = DateTime.now();
    var age = now.year - dob.year;
    if (now.month < dob.month ||
        (now.month == dob.month && now.day < dob.day)) {
      age--;
    }
    return age < 0 ? null : age;
  }

  String get displayName {
    final fromIntake = healthIntake?.fullName.trim();
    if (fromIntake != null && fromIntake.isNotEmpty) return fromIntake;
    final n = name.trim();
    if (n.isNotEmpty && n.toLowerCase() != 'patient') return n;
    final local = email.split('@').first.replaceAll(RegExp(r'[._]+'), ' ').trim();
    if (local.isNotEmpty) {
      return local
          .split(RegExp(r'\s+'))
          .where((w) => w.isNotEmpty)
          .map((w) => '${w[0].toUpperCase()}${w.substring(1)}')
          .join(' ');
    }
    return n.isNotEmpty ? n : 'Patient';
  }

  bool get isProfileComplete {
    final intake = healthIntake;
    final nicOk = nic != null && nic!.isNotEmpty;
    final dobOk = dateOfBirth != null || intake?.dateOfBirth != null;
    final bloodOk = bloodGroup != null && bloodGroup!.isNotEmpty;
    final intakeOk = intake != null && intake.isMandatoryComplete;
    return nicOk && dobOk && bloodOk && intakeOk;
  }

  UserProfile copyWith({
    String? id,
    String? name,
    String? email,
    String? nic,
    String? mobileNo,
    String? bloodGroup,
    String? region,
    DateTime? dateOfBirth,
    List<String>? emergencyContacts,
    String? ceylonHealthId,
    String? barcodeNumber,
    PatientHealthIntake? healthIntake,
  }) {
    return UserProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      nic: nic ?? this.nic,
      mobileNo: mobileNo ?? this.mobileNo,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      region: region ?? this.region,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      ceylonHealthId: ceylonHealthId ?? this.ceylonHealthId,
      barcodeNumber: barcodeNumber ?? this.barcodeNumber,
      healthIntake: healthIntake ?? this.healthIntake,
    );
  }

  /// Ensures a stable barcode is assigned when NIC is known.
  UserProfile withEnsuredBarcode() {
    if (barcodeNumber != null && barcodeNumber!.isNotEmpty) return this;
    final n = nic;
    if (n == null || n.isEmpty) return this;
    final code = SuwasiriHealthId.generate(userId: id, nic: n);
    return copyWith(
      barcodeNumber: code,
      ceylonHealthId: ceylonHealthId ?? code,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'email': email,
        'NIC': nic,
        'mobileNo': mobileNo,
        'bloodGroup': bloodGroup,
        'region': region,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'emergencyContacts': emergencyContacts,
        'ceylonHealthId': ceylonHealthId,
        'barcodeNumber': barcodeNumber,
        if (healthIntake != null) 'healthIntake': healthIntake!.toMap(),
      };

  factory UserProfile.fromMap(String id, Map<String, dynamic> map) {
    final intakeRaw = map['healthIntake'];
    return UserProfile(
      id: id,
      name: map['name'] as String? ?? '',
      email: map['email'] as String? ?? '',
      nic: map['NIC'] as String?,
      mobileNo: map['mobileNo'] as String?,
      bloodGroup: map['bloodGroup'] as String?,
      region: map['region'] as String?,
      dateOfBirth: map['dateOfBirth'] != null
          ? DateTime.tryParse(map['dateOfBirth'] as String)
          : null,
      emergencyContacts: (map['emergencyContacts'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      ceylonHealthId: map['ceylonHealthId'] as String?,
      barcodeNumber: map['barcodeNumber'] as String?,
      healthIntake: intakeRaw is Map<String, dynamic>
          ? PatientHealthIntake.fromMap(intakeRaw)
          : null,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        nic,
        mobileNo,
        bloodGroup,
        region,
        dateOfBirth,
        emergencyContacts,
        ceylonHealthId,
        barcodeNumber,
        healthIntake,
      ];
}

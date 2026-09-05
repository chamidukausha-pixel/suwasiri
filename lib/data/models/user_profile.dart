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
    this.clinicAllergies,
    this.clinicRegistrations,
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
  /// GP Care–recorded allergies (shown under the name on the Unique Health ID card).
  final String? clinicAllergies;
  /// Per-clinic new-patient registration forms from Suwasiri booking.
  final Map<String, dynamic>? clinicRegistrations;

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

  /// Allergies under the Unique Health ID name: GP Care first, then intake.
  String get allergyLabel {
    final clinic = clinicAllergies?.trim();
    if (clinic != null && clinic.isNotEmpty) return clinic;
    final intake = healthIntake;
    final parts = <String>[
      if ((intake?.importantAllergies ?? '').trim().isNotEmpty)
        intake!.importantAllergies.trim(),
      if ((intake?.medicationAllergies ?? '').trim().isNotEmpty)
        intake!.medicationAllergies.trim(),
      if ((intake?.otherAllergies ?? '').trim().isNotEmpty)
        intake!.otherAllergies.trim(),
    ];
    return parts.toSet().join(', ');
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
    String? clinicAllergies,
    Map<String, dynamic>? clinicRegistrations,
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
      clinicAllergies: clinicAllergies ?? this.clinicAllergies,
      clinicRegistrations: clinicRegistrations ?? this.clinicRegistrations,
    );
  }

  /// Ensures a stable barcode is assigned when NIC or user id is known.
  UserProfile withEnsuredBarcode() {
    if (barcodeNumber != null && barcodeNumber!.isNotEmpty) return this;
    final n = nic;
    final seed = (n != null && n.isNotEmpty) ? n : id;
    if (seed.isEmpty) return this;
    final code = SuwasiriHealthId.generate(userId: id, nic: seed);
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
        if (clinicAllergies != null && clinicAllergies!.isNotEmpty)
          'clinicAllergies': clinicAllergies,
        if (clinicRegistrations != null && clinicRegistrations!.isNotEmpty)
          'clinicRegistrations': clinicRegistrations,
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
      clinicAllergies: map['clinicAllergies'] as String?,
      clinicRegistrations: map['clinicRegistrations'] is Map
          ? Map<String, dynamic>.from(map['clinicRegistrations'] as Map)
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
        clinicAllergies,
        clinicRegistrations,
      ];
}

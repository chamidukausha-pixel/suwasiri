import 'package:equatable/equatable.dart';

/// New-patient registration at a clinic/hospital (Sri Lankan GP Care intake).
class ClinicPatientRegistration extends Equatable {
  const ClinicPatientRegistration({
    this.title = '',
    this.fullName = '',
    this.nameWithInitials = '',
    this.dateOfBirth,
    this.nicOrPassport = '',
    this.gender = '',
    this.civilStatus = '',
    this.preferredLanguage = '',
    this.mobile = '',
    this.altPhone = '',
    this.email = '',
    this.streetAddress = '',
    this.city = '',
    this.district = '',
    this.emergencyName = '',
    this.emergencyRelationship = '',
    this.emergencyMobile = '',
    this.paymentMethod = '',
    this.insuranceProviders = const [],
    this.policyId = '',
    this.visitReason = '',
    this.hasAllergies = false,
    this.allergyDetails = '',
    this.chronicConditions = const [],
    this.chronicOther = '',
    this.currentMedications = '',
    this.hadSurgery = false,
    this.surgeryDetails = '',
    this.consentSms = false,
    this.consentPrivacy = false,
    this.consentConfirmed = false,
    this.hospitalId = '',
    this.hospitalName = '',
    this.branchId = '',
    this.registeredAt,
  });

  final String title;
  final String fullName;
  final String nameWithInitials;
  final DateTime? dateOfBirth;
  final String nicOrPassport;
  final String gender;
  final String civilStatus;
  final String preferredLanguage;
  final String mobile;
  final String altPhone;
  final String email;
  final String streetAddress;
  final String city;
  final String district;
  final String emergencyName;
  final String emergencyRelationship;
  final String emergencyMobile;
  final String paymentMethod;
  final List<String> insuranceProviders;
  final String policyId;
  final String visitReason;
  final bool hasAllergies;
  final String allergyDetails;
  final List<String> chronicConditions;
  final String chronicOther;
  final String currentMedications;
  final bool hadSurgery;
  final String surgeryDetails;
  final bool consentSms;
  final bool consentPrivacy;
  final bool consentConfirmed;
  final String hospitalId;
  final String hospitalName;
  final String branchId;
  final DateTime? registeredAt;

  String get fullAddress {
    final parts = <String>[
      streetAddress,
      city,
      district,
    ].where((p) => p.trim().isNotEmpty);
    return parts.join(', ');
  }

  String get emergencyContactLabel {
    final parts = <String>[
      emergencyName,
      if (emergencyRelationship.isNotEmpty) emergencyRelationship,
      emergencyMobile,
    ].where((p) => p.trim().isNotEmpty);
    return parts.join(' · ');
  }

  bool get isComplete =>
      fullName.trim().isNotEmpty &&
      dateOfBirth != null &&
      nicOrPassport.trim().isNotEmpty &&
      gender.trim().isNotEmpty &&
      mobile.trim().isNotEmpty &&
      streetAddress.trim().isNotEmpty &&
      city.trim().isNotEmpty &&
      district.trim().isNotEmpty &&
      emergencyName.trim().isNotEmpty &&
      emergencyMobile.trim().isNotEmpty &&
      visitReason.trim().isNotEmpty &&
      consentPrivacy &&
      consentConfirmed;

  ClinicPatientRegistration copyWith({
    String? title,
    String? fullName,
    String? nameWithInitials,
    DateTime? dateOfBirth,
    String? nicOrPassport,
    String? gender,
    String? civilStatus,
    String? preferredLanguage,
    String? mobile,
    String? altPhone,
    String? email,
    String? streetAddress,
    String? city,
    String? district,
    String? emergencyName,
    String? emergencyRelationship,
    String? emergencyMobile,
    String? paymentMethod,
    List<String>? insuranceProviders,
    String? policyId,
    String? visitReason,
    bool? hasAllergies,
    String? allergyDetails,
    List<String>? chronicConditions,
    String? chronicOther,
    String? currentMedications,
    bool? hadSurgery,
    String? surgeryDetails,
    bool? consentSms,
    bool? consentPrivacy,
    bool? consentConfirmed,
    String? hospitalId,
    String? hospitalName,
    String? branchId,
    DateTime? registeredAt,
    bool clearDob = false,
  }) {
    return ClinicPatientRegistration(
      title: title ?? this.title,
      fullName: fullName ?? this.fullName,
      nameWithInitials: nameWithInitials ?? this.nameWithInitials,
      dateOfBirth: clearDob ? null : (dateOfBirth ?? this.dateOfBirth),
      nicOrPassport: nicOrPassport ?? this.nicOrPassport,
      gender: gender ?? this.gender,
      civilStatus: civilStatus ?? this.civilStatus,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      mobile: mobile ?? this.mobile,
      altPhone: altPhone ?? this.altPhone,
      email: email ?? this.email,
      streetAddress: streetAddress ?? this.streetAddress,
      city: city ?? this.city,
      district: district ?? this.district,
      emergencyName: emergencyName ?? this.emergencyName,
      emergencyRelationship: emergencyRelationship ?? this.emergencyRelationship,
      emergencyMobile: emergencyMobile ?? this.emergencyMobile,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      insuranceProviders: insuranceProviders ?? this.insuranceProviders,
      policyId: policyId ?? this.policyId,
      visitReason: visitReason ?? this.visitReason,
      hasAllergies: hasAllergies ?? this.hasAllergies,
      allergyDetails: allergyDetails ?? this.allergyDetails,
      chronicConditions: chronicConditions ?? this.chronicConditions,
      chronicOther: chronicOther ?? this.chronicOther,
      currentMedications: currentMedications ?? this.currentMedications,
      hadSurgery: hadSurgery ?? this.hadSurgery,
      surgeryDetails: surgeryDetails ?? this.surgeryDetails,
      consentSms: consentSms ?? this.consentSms,
      consentPrivacy: consentPrivacy ?? this.consentPrivacy,
      consentConfirmed: consentConfirmed ?? this.consentConfirmed,
      hospitalId: hospitalId ?? this.hospitalId,
      hospitalName: hospitalName ?? this.hospitalName,
      branchId: branchId ?? this.branchId,
      registeredAt: registeredAt ?? this.registeredAt,
    );
  }

  Map<String, dynamic> toMap() => {
        'title': title,
        'fullName': fullName,
        'nameWithInitials': nameWithInitials,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'nicOrPassport': nicOrPassport,
        'gender': gender,
        'civilStatus': civilStatus,
        'preferredLanguage': preferredLanguage,
        'mobile': mobile,
        'altPhone': altPhone,
        'email': email,
        'streetAddress': streetAddress,
        'city': city,
        'district': district,
        'emergencyName': emergencyName,
        'emergencyRelationship': emergencyRelationship,
        'emergencyMobile': emergencyMobile,
        'paymentMethod': paymentMethod,
        'insuranceProviders': insuranceProviders,
        'policyId': policyId,
        'visitReason': visitReason,
        'hasAllergies': hasAllergies,
        'allergyDetails': allergyDetails,
        'chronicConditions': chronicConditions,
        'chronicOther': chronicOther,
        'currentMedications': currentMedications,
        'hadSurgery': hadSurgery,
        'surgeryDetails': surgeryDetails,
        'consentSms': consentSms,
        'consentPrivacy': consentPrivacy,
        'consentConfirmed': consentConfirmed,
        'hospitalId': hospitalId,
        'hospitalName': hospitalName,
        'branchId': branchId,
        'registeredAt': registeredAt?.toIso8601String(),
        'source': 'suwasiri_app',
      };

  factory ClinicPatientRegistration.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const ClinicPatientRegistration();
    String s(Object? v) => v?.toString() ?? '';
    DateTime? parse(Object? v) =>
        v is String ? DateTime.tryParse(v) : null;
    return ClinicPatientRegistration(
      title: s(map['title']),
      fullName: s(map['fullName']),
      nameWithInitials: s(map['nameWithInitials']),
      dateOfBirth: parse(map['dateOfBirth']),
      nicOrPassport: s(map['nicOrPassport']),
      gender: s(map['gender']),
      civilStatus: s(map['civilStatus']),
      preferredLanguage: s(map['preferredLanguage']),
      mobile: s(map['mobile']),
      altPhone: s(map['altPhone']),
      email: s(map['email']),
      streetAddress: s(map['streetAddress']),
      city: s(map['city']),
      district: s(map['district']),
      emergencyName: s(map['emergencyName']),
      emergencyRelationship: s(map['emergencyRelationship']),
      emergencyMobile: s(map['emergencyMobile']),
      paymentMethod: s(map['paymentMethod']),
      insuranceProviders: (map['insuranceProviders'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      policyId: s(map['policyId']),
      visitReason: s(map['visitReason']),
      hasAllergies: map['hasAllergies'] == true,
      allergyDetails: s(map['allergyDetails']),
      chronicConditions: (map['chronicConditions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      chronicOther: s(map['chronicOther']),
      currentMedications: s(map['currentMedications']),
      hadSurgery: map['hadSurgery'] == true,
      surgeryDetails: s(map['surgeryDetails']),
      consentSms: map['consentSms'] == true,
      consentPrivacy: map['consentPrivacy'] == true,
      consentConfirmed: map['consentConfirmed'] == true,
      hospitalId: s(map['hospitalId']),
      hospitalName: s(map['hospitalName']),
      branchId: s(map['branchId']),
      registeredAt: parse(map['registeredAt']),
    );
  }

  @override
  List<Object?> get props => [toMap()];
}

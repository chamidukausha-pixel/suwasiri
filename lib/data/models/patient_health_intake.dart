import 'package:equatable/equatable.dart';

/// Patient health questionnaire stored on `users/{uid}.healthIntake`.
class PatientHealthIntake extends Equatable {
  const PatientHealthIntake({
    // Basic
    this.fullName = '',
    this.dateOfBirth,
    this.sex = '',
    this.address = '',
    this.contactDetails = '',
    this.medicareDetails = '',
    this.emergencyContact = '',
    // Medical history
    this.existingConditions = '',
    this.previousSurgeries = '',
    this.currentMedications = '',
    this.medicationAllergies = '',
    this.otherAllergies = '',
    this.familyHistory = '',
    this.previousSeriousIllnesses = '',
    // Vaccinations
    this.covidVaccination = '',
    this.influenzaVaccination = '',
    this.otherImmunisations = '',
    this.mostRecentVaccinationDate,
    // Lifestyle
    this.smokingStatus = '',
    this.alcoholConsumption = '',
    this.exerciseLevel = '',
    this.dietNutrition = '',
    this.heightCm = '',
    this.weightKg = '',
    // Current health
    this.currentSymptoms = '',
    this.mentalWellbeing = '',
    this.sleep = '',
    this.painMobility = '',
    this.bloodPressure = '',
    this.otherMeasurements = '',
    // Safety / urgent
    this.safetyEmergencyContact = '',
    this.importantAllergies = '',
    this.safetyMedications = '',
    this.conditionsProfessionalsShouldKnow = '',
    this.advanceCarePreferences = '',
    this.completed = false,
  });

  final String fullName;
  final DateTime? dateOfBirth;
  final String sex;
  final String address;
  final String contactDetails;
  final String medicareDetails;
  final String emergencyContact;

  final String existingConditions;
  final String previousSurgeries;
  final String currentMedications;
  final String medicationAllergies;
  final String otherAllergies;
  final String familyHistory;
  final String previousSeriousIllnesses;

  final String covidVaccination;
  final String influenzaVaccination;
  final String otherImmunisations;
  final DateTime? mostRecentVaccinationDate;

  final String smokingStatus;
  final String alcoholConsumption;
  final String exerciseLevel;
  final String dietNutrition;
  final String heightCm;
  final String weightKg;

  final String currentSymptoms;
  final String mentalWellbeing;
  final String sleep;
  final String painMobility;
  final String bloodPressure;
  final String otherMeasurements;

  final String safetyEmergencyContact;
  final String importantAllergies;
  final String safetyMedications;
  final String conditionsProfessionalsShouldKnow;
  final String advanceCarePreferences;

  final bool completed;

  /// Mandatory basics for first-time app use.
  bool get isMandatoryComplete =>
      fullName.trim().isNotEmpty &&
      dateOfBirth != null &&
      sex.trim().isNotEmpty &&
      address.trim().isNotEmpty &&
      contactDetails.trim().isNotEmpty &&
      emergencyContact.trim().isNotEmpty &&
      importantAllergies.trim().isNotEmpty &&
      safetyMedications.trim().isNotEmpty;

  PatientHealthIntake copyWith({
    String? fullName,
    DateTime? dateOfBirth,
    String? sex,
    String? address,
    String? contactDetails,
    String? medicareDetails,
    String? emergencyContact,
    String? existingConditions,
    String? previousSurgeries,
    String? currentMedications,
    String? medicationAllergies,
    String? otherAllergies,
    String? familyHistory,
    String? previousSeriousIllnesses,
    String? covidVaccination,
    String? influenzaVaccination,
    String? otherImmunisations,
    DateTime? mostRecentVaccinationDate,
    String? smokingStatus,
    String? alcoholConsumption,
    String? exerciseLevel,
    String? dietNutrition,
    String? heightCm,
    String? weightKg,
    String? currentSymptoms,
    String? mentalWellbeing,
    String? sleep,
    String? painMobility,
    String? bloodPressure,
    String? otherMeasurements,
    String? safetyEmergencyContact,
    String? importantAllergies,
    String? safetyMedications,
    String? conditionsProfessionalsShouldKnow,
    String? advanceCarePreferences,
    bool? completed,
    bool clearDob = false,
    bool clearVaxDate = false,
  }) {
    return PatientHealthIntake(
      fullName: fullName ?? this.fullName,
      dateOfBirth: clearDob ? null : (dateOfBirth ?? this.dateOfBirth),
      sex: sex ?? this.sex,
      address: address ?? this.address,
      contactDetails: contactDetails ?? this.contactDetails,
      medicareDetails: medicareDetails ?? this.medicareDetails,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      existingConditions: existingConditions ?? this.existingConditions,
      previousSurgeries: previousSurgeries ?? this.previousSurgeries,
      currentMedications: currentMedications ?? this.currentMedications,
      medicationAllergies: medicationAllergies ?? this.medicationAllergies,
      otherAllergies: otherAllergies ?? this.otherAllergies,
      familyHistory: familyHistory ?? this.familyHistory,
      previousSeriousIllnesses:
          previousSeriousIllnesses ?? this.previousSeriousIllnesses,
      covidVaccination: covidVaccination ?? this.covidVaccination,
      influenzaVaccination: influenzaVaccination ?? this.influenzaVaccination,
      otherImmunisations: otherImmunisations ?? this.otherImmunisations,
      mostRecentVaccinationDate: clearVaxDate
          ? null
          : (mostRecentVaccinationDate ?? this.mostRecentVaccinationDate),
      smokingStatus: smokingStatus ?? this.smokingStatus,
      alcoholConsumption: alcoholConsumption ?? this.alcoholConsumption,
      exerciseLevel: exerciseLevel ?? this.exerciseLevel,
      dietNutrition: dietNutrition ?? this.dietNutrition,
      heightCm: heightCm ?? this.heightCm,
      weightKg: weightKg ?? this.weightKg,
      currentSymptoms: currentSymptoms ?? this.currentSymptoms,
      mentalWellbeing: mentalWellbeing ?? this.mentalWellbeing,
      sleep: sleep ?? this.sleep,
      painMobility: painMobility ?? this.painMobility,
      bloodPressure: bloodPressure ?? this.bloodPressure,
      otherMeasurements: otherMeasurements ?? this.otherMeasurements,
      safetyEmergencyContact:
          safetyEmergencyContact ?? this.safetyEmergencyContact,
      importantAllergies: importantAllergies ?? this.importantAllergies,
      safetyMedications: safetyMedications ?? this.safetyMedications,
      conditionsProfessionalsShouldKnow: conditionsProfessionalsShouldKnow ??
          this.conditionsProfessionalsShouldKnow,
      advanceCarePreferences:
          advanceCarePreferences ?? this.advanceCarePreferences,
      completed: completed ?? this.completed,
    );
  }

  Map<String, dynamic> toMap() => {
        'fullName': fullName,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'sex': sex,
        'address': address,
        'contactDetails': contactDetails,
        'medicareDetails': medicareDetails,
        'emergencyContact': emergencyContact,
        'existingConditions': existingConditions,
        'previousSurgeries': previousSurgeries,
        'currentMedications': currentMedications,
        'medicationAllergies': medicationAllergies,
        'otherAllergies': otherAllergies,
        'familyHistory': familyHistory,
        'previousSeriousIllnesses': previousSeriousIllnesses,
        'covidVaccination': covidVaccination,
        'influenzaVaccination': influenzaVaccination,
        'otherImmunisations': otherImmunisations,
        'mostRecentVaccinationDate':
            mostRecentVaccinationDate?.toIso8601String(),
        'smokingStatus': smokingStatus,
        'alcoholConsumption': alcoholConsumption,
        'exerciseLevel': exerciseLevel,
        'dietNutrition': dietNutrition,
        'heightCm': heightCm,
        'weightKg': weightKg,
        'currentSymptoms': currentSymptoms,
        'mentalWellbeing': mentalWellbeing,
        'sleep': sleep,
        'painMobility': painMobility,
        'bloodPressure': bloodPressure,
        'otherMeasurements': otherMeasurements,
        'safetyEmergencyContact': safetyEmergencyContact,
        'importantAllergies': importantAllergies,
        'safetyMedications': safetyMedications,
        'conditionsProfessionalsShouldKnow': conditionsProfessionalsShouldKnow,
        'advanceCarePreferences': advanceCarePreferences,
        'completed': completed,
      };

  factory PatientHealthIntake.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const PatientHealthIntake();
    DateTime? parse(Object? v) =>
        v is String ? DateTime.tryParse(v) : null;
    String s(Object? v) => v?.toString() ?? '';
    return PatientHealthIntake(
      fullName: s(map['fullName']),
      dateOfBirth: parse(map['dateOfBirth']),
      sex: s(map['sex']),
      address: s(map['address']),
      contactDetails: s(map['contactDetails']),
      medicareDetails: s(map['medicareDetails']),
      emergencyContact: s(map['emergencyContact']),
      existingConditions: s(map['existingConditions']),
      previousSurgeries: s(map['previousSurgeries']),
      currentMedications: s(map['currentMedications']),
      medicationAllergies: s(map['medicationAllergies']),
      otherAllergies: s(map['otherAllergies']),
      familyHistory: s(map['familyHistory']),
      previousSeriousIllnesses: s(map['previousSeriousIllnesses']),
      covidVaccination: s(map['covidVaccination']),
      influenzaVaccination: s(map['influenzaVaccination']),
      otherImmunisations: s(map['otherImmunisations']),
      mostRecentVaccinationDate: parse(map['mostRecentVaccinationDate']),
      smokingStatus: s(map['smokingStatus']),
      alcoholConsumption: s(map['alcoholConsumption']),
      exerciseLevel: s(map['exerciseLevel']),
      dietNutrition: s(map['dietNutrition']),
      heightCm: s(map['heightCm']),
      weightKg: s(map['weightKg']),
      currentSymptoms: s(map['currentSymptoms']),
      mentalWellbeing: s(map['mentalWellbeing']),
      sleep: s(map['sleep']),
      painMobility: s(map['painMobility']),
      bloodPressure: s(map['bloodPressure']),
      otherMeasurements: s(map['otherMeasurements']),
      safetyEmergencyContact: s(map['safetyEmergencyContact']),
      importantAllergies: s(map['importantAllergies']),
      safetyMedications: s(map['safetyMedications']),
      conditionsProfessionalsShouldKnow:
          s(map['conditionsProfessionalsShouldKnow']),
      advanceCarePreferences: s(map['advanceCarePreferences']),
      completed: map['completed'] == true,
    );
  }

  @override
  List<Object?> get props => [toMap()];
}

/// Stable unique Suwasiri Health barcode for a user.
abstract final class SuwasiriHealthId {
  static String generate({
    required String userId,
    required String nic,
  }) {
    final nicDigits = nic.replaceAll(RegExp(r'[^0-9A-Za-z]'), '').toUpperCase();
    final seed = '$userId|$nicDigits';
    var hash = 0x811C9DC5;
    for (final unit in seed.codeUnits) {
      hash ^= unit;
      hash = (hash * 0x01000193) & 0xFFFFFFFF;
    }
    final body = hash.toRadixString(16).padLeft(8, '0').toUpperCase();
    final check = (hash % 97).toString().padLeft(2, '0');
    return 'SW$body$check';
  }
}

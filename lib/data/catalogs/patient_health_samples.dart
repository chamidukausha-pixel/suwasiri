import '../models/vault_report.dart';

/// Sample patient health records for Vault (pending Rx, labs, vaccines, notes).
abstract final class PatientHealthSamples {
  /// Active / pending e-Rx (not yet sent to pharmacy via MediLanka).
  static List<Prescription> pendingMedicines({required String patientId}) {
    final now = DateTime.now();
    return [
      Prescription(
        id: 'pending-inperson-1',
        medicine: 'Amoxicillin 500mg capsules',
        doctor: 'Dr. Samanthi Wickramasinghe',
        code: 'EP-IP-1042',
        active: true,
        patientId: patientId,
        schedule: '1 capsule TDS after meals × 5 days',
        doseBadge: '1×3',
        issuedAt: now.subtract(const Duration(days: 1)),
        clinicName: 'Nawaloka Hospital · OPD Clinic',
        sentToPharmacare: false,
      ),
      Prescription(
        id: 'pending-inperson-2',
        medicine: 'Omeprazole 20mg capsules',
        doctor: 'Dr. Samanthi Wickramasinghe',
        code: 'EP-IP-1042',
        active: true,
        patientId: patientId,
        schedule: '1 capsule daily before breakfast × 14 days',
        doseBadge: '1×1',
        issuedAt: now.subtract(const Duration(days: 1)),
        clinicName: 'Nawaloka Hospital · OPD Clinic',
        sentToPharmacare: false,
      ),
      Prescription(
        id: 'pending-clinic-3',
        medicine: 'Cetirizine 10mg tablets',
        doctor: 'Dr. Ruwan Perera',
        code: 'EP-IP-2088',
        active: true,
        patientId: patientId,
        schedule: '1 tablet at night for allergy',
        doseBadge: '1×1',
        issuedAt: now.subtract(const Duration(days: 4)),
        clinicName: 'Asiri Medical · Allergy Clinic',
        sentToPharmacare: false,
      ),
    ];
  }

  /// Already dispensed / sent to MediLanka — Issued Medical History.
  static List<Prescription> historyMedicines({required String patientId}) {
    final issued = DateTime.now().subtract(const Duration(days: 21));
    return [
      Prescription(
        id: 'hist-atorva',
        medicine: 'Atorvastatin 20mg tablets',
        doctor: 'Dr. Kavinda Jayawardena',
        code: 'EP-00005290',
        active: true,
        patientId: patientId,
        schedule: '1 tablet at night',
        doseBadge: '1×1',
        issuedAt: issued,
        clinicName: 'Nawaloka Heart Clinic · Colombo 02',
        sentToPharmacare: true,
      ),
      Prescription(
        id: 'hist-met',
        medicine: 'Metformin 500mg tablets',
        doctor: 'Dr. Kavinda Jayawardena',
        code: 'EP-00005312',
        active: true,
        patientId: patientId,
        schedule: '1 tablet twice daily with meals',
        doseBadge: '1×2',
        issuedAt: issued,
        clinicName: 'Nawaloka Heart Clinic · Colombo 02',
        sentToPharmacare: true,
      ),
      Prescription(
        id: 'hist-salbut',
        medicine: 'Salbutamol 100mcg inhaler',
        doctor: 'Dr. Nimal Fernando',
        code: 'EP-00006101',
        active: true,
        patientId: patientId,
        schedule: '2 puffs as needed for wheeze',
        doseBadge: 'PRN',
        issuedAt: issued.subtract(const Duration(days: 20)),
        clinicName: 'Asiri Central · Respiratory Unit',
        sentToPharmacare: true,
      ),
    ];
  }

  static List<Prescription> allSamplePrescriptions({required String patientId}) =>
      [
        ...pendingMedicines(patientId: patientId),
        ...historyMedicines(patientId: patientId),
      ];

  static List<TreatmentNote> treatmentNotes({required String patientId}) {
    final now = DateTime.now();
    return [
      TreatmentNote(
        id: 'note-1',
        patientId: patientId,
        doctor: 'Dr. Samanthi Wickramasinghe',
        clinicName: 'Nawaloka Hospital · OPD Clinic',
        title: 'In-person consultation — upper respiratory infection',
        body:
            'Mild pharyngitis. Advised rest, warm fluids. Started Amoxicillin + Omeprazole. Return if fever >38.5°C persists >48h.',
        date: now.subtract(const Duration(days: 1)),
      ),
      TreatmentNote(
        id: 'note-2',
        patientId: patientId,
        doctor: 'Dr. Ruwan Perera',
        clinicName: 'Asiri Medical · Allergy Clinic',
        title: 'Seasonal allergic rhinitis',
        body:
            'Non-sedating antihistamine prescribed. Avoid dust exposure. Follow-up in 2 weeks if symptoms continue.',
        date: now.subtract(const Duration(days: 4)),
      ),
      TreatmentNote(
        id: 'note-3',
        patientId: patientId,
        doctor: 'Dr. Aruni Perera',
        clinicName: 'Lanka GP Care · Durdans Teleclinic',
        title: 'Video consult — fever & myalgia',
        body:
            'Likely viral illness. Paracetamol PRN. Monitor hydration. Telehealth e-Rx issued during call.',
        date: now.subtract(const Duration(days: 7)),
      ),
    ];
  }

  static List<VaultReport> sampleLabReports({required String patientId}) {
    final now = DateTime.now();
    return [
      VaultReport(
        id: 'lab-hba1c',
        patientId: patientId,
        title: 'Glycated Hemoglobin (HbA1c)',
        issuedBy: 'LankaLab',
        date: now.subtract(const Duration(days: 12)),
        category: 'Blood Work',
        facility: 'LankaLab Central · Colombo',
        requestedBy: 'Dr. Kavinda Jayawardena',
        fileSizeMb: 1.4,
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'HbA1c', value: '5.9%', status: 'attention'),
          MetricReading(
              name: 'Fasting Glucose', value: '108 mg/dL', status: 'attention'),
        ],
      ),
      VaultReport(
        id: 'lab-lipid',
        patientId: patientId,
        title: 'Lipid Profile',
        issuedBy: 'LankaLab',
        date: now.subtract(const Duration(days: 18)),
        category: 'Biochemistry',
        facility: 'Asiri Medical Hospital Lab',
        requestedBy: 'Dr. M. Silva',
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'LDL', value: '118 mg/dL', status: 'attention'),
          MetricReading(name: 'HDL', value: '52 mg/dL', status: 'normal'),
          MetricReading(name: 'Triglycerides', value: '140 mg/dL', status: 'normal'),
        ],
      ),
      VaultReport(
        id: 'lab-fbc',
        patientId: patientId,
        title: 'Full Blood Count (FBC)',
        issuedBy: 'Hemas Hospitals Lab',
        date: now.subtract(const Duration(days: 30)),
        category: 'Haematology',
        facility: 'Hemas Hospitals · Wattala',
        requestedBy: 'Dr. Nimal Fernando',
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'WBC', value: '7.2 ×10⁹/L', status: 'normal'),
          MetricReading(name: 'Hemoglobin', value: '13.8 g/dL', status: 'normal'),
          MetricReading(name: 'Platelets', value: '245 ×10⁹/L', status: 'normal'),
        ],
      ),
    ];
  }

  static List<VaccineHistoryEntry> vaccineHistory({required String patientId}) {
    return [
      VaccineHistoryEntry(
        id: 'vh-covid-3',
        patientId: patientId,
        vaccineName: 'COVID-19 Booster (Pfizer-BioNTech)',
        batchCode: 'FL8094',
        issuer: 'HNR · Colombo Municipal Council',
        facility: 'CMC Vaccination Centre · Town Hall',
        date: DateTime.now().subtract(const Duration(days: 120)),
        doseLabel: 'Booster dose',
      ),
      VaccineHistoryEntry(
        id: 'vh-flu',
        patientId: patientId,
        vaccineName: 'Influenza (Seasonal)',
        batchCode: 'IF-2025-441',
        issuer: 'Nawaloka Hospital',
        facility: 'Nawaloka Preventive Health Unit',
        date: DateTime.now().subtract(const Duration(days: 200)),
        doseLabel: 'Annual dose',
      ),
      VaccineHistoryEntry(
        id: 'vh-hep-b',
        patientId: patientId,
        vaccineName: 'Hepatitis B',
        batchCode: 'HB-9921',
        issuer: 'MOH / HNR',
        facility: 'MOH Clinic · Nugegoda',
        date: DateTime.now().subtract(const Duration(days: 900)),
        doseLabel: 'Dose 3 of 3',
      ),
      VaccineHistoryEntry(
        id: 'vh-tt',
        patientId: patientId,
        vaccineName: 'Tetanus Toxoid (TT)',
        batchCode: 'TT-7710',
        issuer: 'Asiri Central Hospital',
        facility: 'Asiri Central · Emergency',
        date: DateTime.now().subtract(const Duration(days: 400)),
        doseLabel: 'Booster',
      ),
    ];
  }
}

class TreatmentNote {
  const TreatmentNote({
    required this.id,
    required this.patientId,
    required this.doctor,
    required this.clinicName,
    required this.title,
    required this.body,
    required this.date,
  });

  final String id;
  final String patientId;
  final String doctor;
  final String clinicName;
  final String title;
  final String body;
  final DateTime date;
}

class VaccineHistoryEntry {
  const VaccineHistoryEntry({
    required this.id,
    required this.patientId,
    required this.vaccineName,
    required this.batchCode,
    required this.issuer,
    required this.facility,
    required this.date,
    required this.doseLabel,
  });

  final String id;
  final String patientId;
  final String vaccineName;
  final String batchCode;
  final String issuer;
  final String facility;
  final DateTime date;
  final String doseLabel;
}

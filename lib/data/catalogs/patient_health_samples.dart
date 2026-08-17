import '../models/vault_report.dart';

/// Sample patient health records for **Vault only** (pending Rx, labs, vaccines, notes).
abstract final class PatientHealthSamples {
  /// Latest doctor-issued e-Rx (formal dual-copy script) — not yet sent to MediLanka.
  static List<Prescription> pendingMedicines({required String patientId}) {
    return latestDoctorScript(patientId: patientId);
  }

  /// Canonical latest script matching the issued dual-copy form.
  static List<Prescription> latestDoctorScript({
    required String patientId,
    String doctorName = 'Dr. Andrew Practitioner',
    String clinicName = 'Lanka GP Care · Durdans Teleclinic',
    String? sessionId,
    DateTime? issuedAt,
    bool sentToPharmacare = false,
  }) {
    final when = issuedAt ?? DateTime.now().subtract(const Duration(hours: 2));
    return [
      Prescription(
        id: 'latest-fluoro',
        medicine: 'Fluorometholone 0.1% eye drops, 5 mL',
        doctor: doctorName,
        code: 'EP-00003194',
        active: true,
        patientId: patientId,
        schedule: '4× per day right eye',
        doseBadge: '1',
        sessionId: sessionId,
        issuedAt: when,
        clinicName: clinicName,
        sentToPharmacare: sentToPharmacare,
        prescriberNumber: '1234567',
      ),
      Prescription(
        id: 'latest-para',
        medicine: 'Paracetamol 500mg tablets',
        doctor: doctorName,
        code: 'EP-00003194',
        active: true,
        patientId: patientId,
        schedule: '1-2 tablets 4-6 hourly',
        doseBadge: '20',
        sessionId: sessionId,
        issuedAt: when,
        clinicName: clinicName,
        sentToPharmacare: sentToPharmacare,
        prescriberNumber: '1234567',
      ),
    ];
  }

  /// Already sent to MediLanka — Issued Medicines (history).
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
      Prescription(
        id: 'hist-amlo',
        medicine: 'Amlodipine 5mg tablets',
        doctor: 'Dr. Malini Silva',
        code: 'EP-00007022',
        active: true,
        patientId: patientId,
        schedule: '1 tablet daily in the morning',
        doseBadge: '1×1',
        issuedAt: issued.subtract(const Duration(days: 40)),
        clinicName: 'Lanka Hospitals · Cardiology',
        sentToPharmacare: true,
      ),
      Prescription(
        id: 'hist-vitd',
        medicine: 'Vitamin D3 1000 IU capsules',
        doctor: 'Dr. Malini Silva',
        code: 'EP-00007022',
        active: true,
        patientId: patientId,
        schedule: '1 capsule daily with food × 90 days',
        doseBadge: '1×1',
        issuedAt: issued.subtract(const Duration(days: 40)),
        clinicName: 'Lanka Hospitals · Cardiology',
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
      TreatmentNote(
        id: 'note-4',
        patientId: patientId,
        doctor: 'Dr. Andrew Practitioner',
        clinicName: 'Lanka Eye Care · Colombo 07',
        title: 'Ophthalmology review — right eye inflammation',
        body:
            'Prescribed Fluorometholone 0.1% drops QID OD. Avoid contact lenses for 7 days. Review in 1 week.',
        date: now.subtract(const Duration(days: 2)),
      ),
      TreatmentNote(
        id: 'note-5',
        patientId: patientId,
        doctor: 'Dr. Kavinda Jayawardena',
        clinicName: 'Nawaloka Heart Clinic · Colombo 02',
        title: 'Cardiology follow-up — lipid management',
        body:
            'Continue Atorvastatin nightly. Lifestyle counselling given. Repeat lipid profile in 3 months.',
        date: now.subtract(const Duration(days: 21)),
      ),
    ];
  }

  static List<VaultReport> sampleLabReports({required String patientId}) {
    final now = DateTime.now();
    return [
      VaultReport(
        id: 'lab-cbc',
        patientId: patientId,
        title: 'Complete Blood Count (CBC)',
        issuedBy: 'LankaLab',
        date: DateTime(now.year, 10, 10).isAfter(now)
            ? DateTime(now.year - 1, 10, 10)
            : DateTime(now.year, 10, 10),
        category: 'Blood Work',
        facility: 'LankaLab Central · Colombo',
        requestedBy: 'Dr. Samantha Silva',
        fileSizeMb: 1.8,
        kind: VaultRecordKind.lab,
        clinicalComments:
            'All parameters are within normal clinical thresholds. Adequate hydration is recommended.',
        metrics: const [
          MetricReading(
            name: 'Hemoglobin',
            value: '14.2 g/dL',
            status: 'normal',
            normalRange: '13.5 - 17.5 g/dL',
          ),
          MetricReading(
            name: 'White Blood Cells (WBC)',
            value: '6500 cells/mcL',
            status: 'normal',
            normalRange: '4500 - 11000 cells/mcL',
          ),
          MetricReading(
            name: 'Platelets',
            value: '245000 /mcL',
            status: 'normal',
            normalRange: '150000 - 450000 /mcL',
          ),
          MetricReading(
            name: 'Red Blood Cells (RBC)',
            value: '4.8 million/mcL',
            status: 'normal',
            normalRange: '4.3 - 5.9 million/mcL',
          ),
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
          MetricReading(name: 'LDL', value: '118 mg/dL', status: 'attention', normalRange: '< 100 mg/dL'),
          MetricReading(name: 'HDL', value: '52 mg/dL', status: 'normal', normalRange: '> 40 mg/dL'),
          MetricReading(name: 'Triglycerides', value: '140 mg/dL', status: 'normal', normalRange: '< 150 mg/dL'),
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
          MetricReading(name: 'WBC', value: '7.2 ×10⁹/L', status: 'normal', normalRange: '4.0 - 11.0 ×10⁹/L'),
          MetricReading(name: 'Hemoglobin', value: '13.8 g/dL', status: 'normal', normalRange: '13.5 - 17.5 g/dL'),
          MetricReading(name: 'Platelets', value: '245 ×10⁹/L', status: 'normal', normalRange: '150 - 450 ×10⁹/L'),
        ],
      ),
      VaultReport(
        id: 'lab-lft',
        patientId: patientId,
        title: 'Liver Function Test (LFT)',
        issuedBy: 'LankaLab',
        date: now.subtract(const Duration(days: 25)),
        category: 'Biochemistry',
        facility: 'LankaLab Central · Colombo',
        requestedBy: 'Dr. Samanthi Wickramasinghe',
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'ALT', value: '32 U/L', status: 'normal', normalRange: '< 40 U/L'),
          MetricReading(name: 'AST', value: '28 U/L', status: 'normal', normalRange: '< 40 U/L'),
          MetricReading(name: 'Bilirubin', value: '0.8 mg/dL', status: 'normal', normalRange: '0.1 - 1.2 mg/dL'),
        ],
      ),
      VaultReport(
        id: 'lab-tsh',
        patientId: patientId,
        title: 'Thyroid Stimulating Hormone (TSH)',
        issuedBy: 'Durdans Lab',
        date: now.subtract(const Duration(days: 45)),
        category: 'Endocrinology',
        facility: 'Durdans Hospital Lab',
        requestedBy: 'Dr. Malini Silva',
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'TSH', value: '2.1 mIU/L', status: 'normal', normalRange: '0.4 - 4.0 mIU/L'),
          MetricReading(name: 'Free T4', value: '1.2 ng/dL', status: 'normal', normalRange: '0.8 - 1.8 ng/dL'),
        ],
      ),
    ];
  }

  /// Completed vaccines only — shown under Vault → Vaccine History
  /// (not on the Vaccines main protocols list).
  static List<VaccineHistoryEntry> vaccineHistory({required String patientId}) {
    return [
      VaccineHistoryEntry(
        id: 'vh-bcg',
        patientId: patientId,
        vaccineName: 'BCG (at birth)',
        batchCode: 'BCG-4412',
        issuer: 'MOH / HNR',
        facility: 'Teaching Hospital · Labour Ward',
        date: DateTime.now().subtract(const Duration(days: 9800)),
        doseLabel: 'Birth dose',
      ),
      VaccineHistoryEntry(
        id: 'vh-hep-b-birth',
        patientId: patientId,
        vaccineName: 'Hepatitis B — Birth dose',
        batchCode: 'HB-001',
        issuer: 'MOH / HNR',
        facility: 'Teaching Hospital · Labour Ward',
        date: DateTime.now().subtract(const Duration(days: 9800)),
        doseLabel: 'Birth dose',
      ),
      VaccineHistoryEntry(
        id: 'vh-opv',
        patientId: patientId,
        vaccineName: 'OPV / IPV (Polio)',
        batchCode: 'OPV-882',
        issuer: 'MOH Clinic',
        facility: 'MOH Clinic · Local Division',
        date: DateTime.now().subtract(const Duration(days: 9000)),
        doseLabel: 'Primary series complete',
      ),
      VaccineHistoryEntry(
        id: 'vh-penta',
        patientId: patientId,
        vaccineName: 'Pentavalent (DTP-HepB-Hib)',
        batchCode: 'PV-5510',
        issuer: 'MOH / HNR',
        facility: 'MOH Clinic · Local Division',
        date: DateTime.now().subtract(const Duration(days: 8500)),
        doseLabel: 'Dose 3 of 3',
      ),
      VaccineHistoryEntry(
        id: 'vh-mmr',
        patientId: patientId,
        vaccineName: 'MMR (Measles, Mumps, Rubella)',
        batchCode: 'MMR-3301',
        issuer: 'HNR · MOH',
        facility: 'MOH Clinic · Dehiwala',
        date: DateTime.now().subtract(const Duration(days: 2200)),
        doseLabel: 'Dose 2 of 2',
      ),
      VaccineHistoryEntry(
        id: 'vh-je',
        patientId: patientId,
        vaccineName: 'Japanese Encephalitis (JE) — Live',
        batchCode: 'JE-2104',
        issuer: 'MOH / HNR',
        facility: 'MOH Clinic · Kaduwela',
        date: DateTime.now().subtract(const Duration(days: 1800)),
        doseLabel: 'Primary dose',
      ),
      VaccineHistoryEntry(
        id: 'vh-covid-3',
        patientId: patientId,
        vaccineName: 'COVID-19 Booster (Pfizer-BioNTech)',
        batchCode: 'FL8094',
        issuer: 'HNR · Colombo Municipal Council',
        facility: 'CMC Vaccination Centre · Town Hall',
        date: DateTime.now().subtract(const Duration(days: 120)),
        doseLabel: 'Booster dose — completed',
      ),
      VaccineHistoryEntry(
        id: 'vh-flu',
        patientId: patientId,
        vaccineName: 'Influenza (Seasonal) 2025',
        batchCode: 'IF-2025-441',
        issuer: 'Nawaloka Hospital',
        facility: 'Nawaloka Preventive Health Unit',
        date: DateTime.now().subtract(const Duration(days: 200)),
        doseLabel: 'Annual dose — completed',
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
      VaccineHistoryEntry(
        id: 'vh-dengue',
        patientId: patientId,
        vaccineName: 'Qdenga® Dengue (Dose 1)',
        batchCode: 'QD-1188',
        issuer: 'Asiri Medical Hospital',
        facility: 'Asiri Medical · Vaccine Desk',
        date: DateTime.now().subtract(const Duration(days: 60)),
        doseLabel: 'Dose 1 of 2 — completed',
      ),
    ];
  }

  static List<DoctorCertificate> doctorCertificates({required String patientId}) {
    final now = DateTime.now();
    return [
      DoctorCertificate(
        id: 'cert-fit-1',
        patientId: patientId,
        title: 'Medical Fitness Certificate',
        doctor: 'Dr. Aruni Perera',
        clinicName: 'Lanka GP Care · Durdans Teleclinic',
        certificateNo: 'MC-2026-4410',
        date: now.subtract(const Duration(days: 8)),
        body:
            'This is to certify that the above-named patient was examined on the date stated and is medically fit to resume usual occupation and daily activities. No restriction of physical duty is advised at this time.',
      ),
      DoctorCertificate(
        id: 'cert-sick-1',
        patientId: patientId,
        title: 'Sick Leave / Medical Certificate',
        doctor: 'Dr. Samanthi Wickramasinghe',
        clinicName: 'Nawaloka Hospital · OPD Clinic',
        certificateNo: 'MC-2026-3381',
        date: now.subtract(const Duration(days: 20)),
        body:
            'The patient was under medical care for an acute febrile illness and is advised rest from work for 3 days from the date of issue. Follow-up if fever persists beyond 72 hours.',
      ),
      DoctorCertificate(
        id: 'cert-sport-1',
        patientId: patientId,
        title: 'Sports / Physical Activity Clearance',
        doctor: 'Dr. Kavinda Jayawardena',
        clinicName: 'Nawaloka Heart Clinic · Colombo 02',
        certificateNo: 'MC-2026-2194',
        date: now.subtract(const Duration(days: 45)),
        body:
            'Cardiovascular examination and resting ECG are within normal limits. Cleared for moderate recreational sport. Avoid unaccustomed extreme exertion until next review.',
      ),
    ];
  }
}

class DoctorCertificate {
  const DoctorCertificate({
    required this.id,
    required this.patientId,
    required this.title,
    required this.doctor,
    required this.clinicName,
    required this.certificateNo,
    required this.date,
    required this.body,
  });

  final String id;
  final String patientId;
  final String title;
  final String doctor;
  final String clinicName;
  final String certificateNo;
  final DateTime date;
  final String body;
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

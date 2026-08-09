import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../catalogs/doctor_catalog.dart';
import '../models/app_notification.dart';
import '../models/appointment.dart';
import '../models/sos_location.dart';
import '../models/vaccine_models.dart';
import '../models/vault_report.dart';
import 'health_repository.dart';

/// Firestore-backed health data; clinics/doctors stay as curated catalogs.
class FirebaseHealthRepository implements HealthRepository {
  FirebaseHealthRepository(this._prefs, {FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final SharedPreferences _prefs;
  final FirebaseFirestore _db;
  final _uuid = const Uuid();

  static const _kMohSync = 'suwasiri_moh_sync';

  CollectionReference<Map<String, dynamic>> get _vault =>
      _db.collection('vault');
  CollectionReference<Map<String, dynamic>> get _vaccinations =>
      _db.collection('vaccinations');
  CollectionReference<Map<String, dynamic>> get _appointments =>
      _db.collection('appointments');
  CollectionReference<Map<String, dynamic>> get _notifications =>
      _db.collection('notifications');
  CollectionReference<Map<String, dynamic>> get _prescriptions =>
      _db.collection('prescriptions');
  CollectionReference<Map<String, dynamic>> get _sosSessions =>
      _db.collection('sos_sessions');

  final _clinics = const [
    ClinicFacility(
      id: 'c1',
      name: 'NHSL — National Hospital of Sri Lanka',
      district: 'Colombo',
      type: FacilityType.hospital,
      address: 'Colombo 10',
    ),
    ClinicFacility(
      id: 'c2',
      name: 'Ragama Teaching Hospital',
      district: 'Gampaha',
      type: FacilityType.hospital,
      address: 'Ragama',
    ),
    ClinicFacility(
      id: 'c3',
      name: 'MOH Colombo Council',
      district: 'Colombo',
      type: FacilityType.mohClinic,
      address: 'Town Hall, Colombo',
    ),
    ClinicFacility(
      id: 'c4',
      name: 'MOH Kandy',
      district: 'Kandy',
      type: FacilityType.mohClinic,
      address: 'Kandy Municipal Area',
    ),
    ClinicFacility(
      id: 'c5',
      name: 'Karapitiya Teaching Hospital',
      district: 'Galle',
      type: FacilityType.hospital,
      address: 'Galle',
    ),
    ClinicFacility(
      id: 'c6',
      name: 'MOH Gampaha',
      district: 'Gampaha',
      type: FacilityType.mohClinic,
      address: 'Gampaha Town',
    ),
  ];

  final _doctors = DoctorCatalog.doctors;

  @override
  Future<List<VaultReport>> getVaultReports(String patientId) async {
    final snap = await _vault.where('patientId', isEqualTo: patientId).get();
    final list = snap.docs
        .map((d) => VaultReport.fromMap(d.id, d.data()))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    if (list.isNotEmpty) return list;
    return _sampleVault(patientId);
  }

  List<VaultReport> _sampleVault(String patientId) {
    return [
      VaultReport(
        id: 'sample-hba1c',
        patientId: patientId,
        title: 'LankaLab: Glycated Hemoglobin (HbA1c)',
        issuedBy: 'LankaLab',
        date: DateTime(2026, 6, 13),
        category: 'Blood Work',
        facility: 'LankaLab Central',
        fileSizeMb: 1.6,
        kind: VaultRecordKind.upload,
        metrics: const [
          MetricReading(name: 'HbA1c', value: '5.9%', status: 'attention'),
        ],
      ),
      VaultReport(
        id: 'sample-fbc',
        patientId: patientId,
        title: 'Full Blood Count (FBC)',
        issuedBy: 'LankaLab',
        date: DateTime(2023, 10, 12),
        category: 'Hematology',
        facility: 'Lanka Hospitals PLC',
        requestedBy: 'Dr. S. Perera',
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'Hemoglobin', value: '13.8 g/dL', status: 'normal'),
          MetricReading(name: 'WBC', value: '6.2 ×10⁹/L', status: 'normal'),
        ],
      ),
      VaultReport(
        id: 'sample-flu',
        patientId: patientId,
        title: 'Influenza Vaccine (Seasonal)',
        issuedBy: 'MOH',
        date: DateTime(2023, 9, 22),
        facility: 'National Hospital of Sri Lanka',
        kind: VaultRecordKind.vaccine,
        batchCode: 'IN-044-L',
      ),
      VaultReport(
        id: 'sample-lipid',
        patientId: patientId,
        title: 'Lipid Profile',
        issuedBy: 'LankaLab',
        date: DateTime(2023, 9, 15),
        facility: 'Asiri Medical Hospital',
        requestedBy: 'Dr. M. Silva',
        kind: VaultRecordKind.lab,
        metrics: const [
          MetricReading(name: 'LDL', value: '118 mg/dL', status: 'attention'),
          MetricReading(name: 'HDL', value: '52 mg/dL', status: 'normal'),
        ],
      ),
    ];
  }

  @override
  Future<List<Prescription>> getPrescriptions(String patientId) async {
    final snap =
        await _prescriptions.where('patientId', isEqualTo: patientId).get();
    final list = snap.docs
        .map((d) => Prescription.fromMap(d.id, d.data()))
        .where((p) => p.active)
        .toList()
      ..sort((a, b) => (b.issuedAt ?? DateTime(0))
          .compareTo(a.issuedAt ?? DateTime(0)));
    if (list.isNotEmpty) return list;
    // Seeded fallback until a telehealth GP issues live Rx.
    return [
      Prescription(
        id: 'p1',
        medicine: 'Atorvastatin 20mg',
        doctor: 'Dr. Aruni Perera',
        code: 'EP-5290',
        active: true,
        patientId: patientId,
        schedule: 'Cardiovascular (nightly)',
        doseBadge: '1x1',
      ),
      Prescription(
        id: 'p2',
        medicine: 'Metformin 500mg',
        doctor: 'Dr. Kavinda Jayawardena',
        code: 'EP-5312',
        active: true,
        patientId: patientId,
        schedule: 'Diabetes (BD with meals)',
        doseBadge: '1x2',
      ),
    ];
  }

  @override
  Future<List<Prescription>> issueTelehealthPrescription({
    required String patientId,
    required String doctorName,
    required String sessionId,
  }) async {
    final now = DateTime.now();
    final batch = [
      Prescription(
        id: _uuid.v4(),
        medicine: 'Amoxicillin 500mg',
        doctor: doctorName,
        code: 'EP-${now.millisecondsSinceEpoch % 10000}',
        active: true,
        patientId: patientId,
        schedule: 'Antibiotic (TDS Schedule)',
        doseBadge: '1x3',
        sessionId: sessionId,
        issuedAt: now,
      ),
      Prescription(
        id: _uuid.v4(),
        medicine: 'Paracetamol 500mg',
        doctor: doctorName,
        code: 'EP-${(now.millisecondsSinceEpoch + 1) % 10000}',
        active: true,
        patientId: patientId,
        schedule: 'As Needed for Pain/Fever',
        doseBadge: 'PRN',
        sessionId: sessionId,
        issuedAt: now,
      ),
    ];
    for (final rx in batch) {
      await _prescriptions.doc(rx.id).set(rx.toMap());
    }
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'E-Prescription issued',
        body: '$doctorName issued ${batch.length} medicines via Lanka GP Care.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
    return batch;
  }

  @override
  Future<void> sendPrescriptionsToPharmacare({
    required String patientId,
    required String sessionId,
  }) async {
    final snap = await _prescriptions
        .where('patientId', isEqualTo: patientId)
        .get();
    for (final doc in snap.docs) {
      if (doc.data()['sessionId'] != sessionId) continue;
      await doc.reference.update({'sentToPharmacare': true, 'updating': false});
    }
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Sent to PharmaCare',
        body:
            'E-prescription forwarded to PharmaCare pharmacist portal for dispensing.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<void> syncLankaLab(String patientId) async {
    final report = VaultReport(
      id: _uuid.v4(),
      patientId: patientId,
      title: 'LankaLab: Glycated Hemoglobin (HbA1c)',
      issuedBy: 'LankaLab',
      date: DateTime.now(),
      category: 'Blood Work',
      facility: 'LankaLab Central Registrar',
      fileSizeMb: 1.6,
      kind: VaultRecordKind.upload,
      metrics: const [
        MetricReading(name: 'HbA1c', value: '5.9%', status: 'attention'),
        MetricReading(
            name: 'Fasting Glucose', value: '108 mg/dL', status: 'attention'),
      ],
    );
    await _vault.doc(report.id).set(report.toMap());
    final lipid = VaultReport(
      id: _uuid.v4(),
      patientId: patientId,
      title: 'Lipid Profile',
      issuedBy: 'LankaLab',
      date: DateTime.now().subtract(const Duration(hours: 1)),
      category: 'Biochemistry',
      facility: 'Asiri Medical Hospital',
      requestedBy: 'Dr. M. Silva',
      kind: VaultRecordKind.lab,
      metrics: const [
        MetricReading(name: 'LDL', value: '118 mg/dL', status: 'attention'),
        MetricReading(name: 'HDL', value: '52 mg/dL', status: 'normal'),
      ],
    );
    await _vault.doc(lipid.id).set(lipid.toMap());
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'LankaLab sync',
        body: 'HbA1c & pathology indexes pulled into your Medical Vault.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<void> syncGpCare(String patientId) async {
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Lanka GP Care sync',
        body: 'Active medicines refreshed from registered GP care record.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<List<VaccineProtocol>> getVaccineProtocols(String patientId) async {
    return [
      VaccineProtocol(
        id: 'v1',
        name: 'Dengue Prevention (Dose 2)',
        doseLabel: 'Dose 2 of 3',
        productName: 'Qdenga® Tetravalent Vaccine',
        progress: 0.60,
        nextDue: DateTime.now().add(const Duration(days: 12)),
        status: VaccineStatus.pending,
        statusDetail: 'Schedule required',
      ),
      VaccineProtocol(
        id: 'v2',
        name: 'COVID-19 Booster Dose',
        doseLabel: 'Completed',
        productName: 'Comirnaty Pfizer-BioNTech Booster',
        progress: 1.0,
        nextDue: null,
        status: VaccineStatus.completed,
        statusDetail: 'All doses administered',
      ),
      VaccineProtocol(
        id: 'v3',
        name: 'Influenza (Flu Shot) Annual',
        doseLabel: 'Dose 1 of 1',
        productName: 'Influvac Tetra 2026 Season',
        progress: 0.0,
        nextDue: DateTime(2026, 7, 13),
        status: VaccineStatus.scheduled,
        statusDetail: 'Booked at clinic',
        booked: true,
      ),
    ];
  }

  @override
  Future<List<ClinicFacility>> getClinics({
    String? district,
    FacilityType type = FacilityType.all,
    String query = '',
  }) async {
    return _clinics.where((c) {
      final dOk =
          district == null || district.isEmpty || c.district == district;
      final tOk = type == FacilityType.all || c.type == type;
      final q = query.trim().toLowerCase();
      final qOk = q.isEmpty || c.name.toLowerCase().contains(q);
      return dOk && tOk && qOk;
    }).toList();
  }

  @override
  Future<List<DateTime>> getAvailableSlots(String facilityId) async {
    final now = DateTime.now();
    return List.generate(6, (i) {
      final day = now.add(Duration(days: i + 1));
      return DateTime(day.year, day.month, day.day, 9 + (i % 3) * 2);
    });
  }

  @override
  Future<VaccineBooking> bookVaccine({
    required String patientId,
    required String facilityId,
    required String facilityName,
    required DateTime slot,
    required String ceylonHealthId,
  }) async {
    final booking = VaccineBooking(
      id: _uuid.v4(),
      facilityId: facilityId,
      facilityName: facilityName,
      slot: slot,
      ceylonHealthId: ceylonHealthId,
      status: 'confirmed',
    );
    await _vaccinations.doc(booking.id).set({
      'patientId': patientId,
      'facilityId': facilityId,
      'facilityName': facilityName,
      'slot': slot.toIso8601String(),
      'ceylonHealthId': ceylonHealthId,
      'status': booking.status,
    });
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Vaccine booked',
        body: '$facilityName — ${slot.toLocal()}',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.vaccine,
      ),
    );
    return booking;
  }

  @override
  Future<DateTime?> lastMohSync() async {
    final raw = _prefs.getString(_kMohSync);
    if (raw == null) return null;
    return DateTime.tryParse(raw);
  }

  @override
  Future<void> syncMoh() async {
    await _prefs.setString(_kMohSync, DateTime.now().toIso8601String());
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'MOH Live Synced',
        body: 'National immunization registry refreshed.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<List<Doctor>> getDoctors({String query = ''}) async {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return _doctors;
    return _doctors
        .where((d) =>
            d.name.toLowerCase().contains(q) ||
            d.specialty.toLowerCase().contains(q) ||
            d.hospital.toLowerCase().contains(q))
        .toList();
  }

  @override
  Future<List<Appointment>> getAppointments(String patientId) async {
    final snap =
        await _appointments.where('patientId', isEqualTo: patientId).get();
    return snap.docs
        .map((d) => Appointment.fromMap(d.id, d.data()))
        .toList()
      ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));
  }

  @override
  Future<Appointment> bookAppointment({
    required String patientId,
    required Doctor doctor,
    required DateTime slot,
  }) async {
    final appt = Appointment(
      id: _uuid.v4(),
      patientId: patientId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      timeSlot: slot,
      status: AppointmentStatus.upcoming,
      token: 'TKN-${DateTime.now().millisecondsSinceEpoch % 10000}',
    );
    await _appointments.doc(appt.id).set(appt.toMap());
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Appointment confirmed',
        body: '${doctor.name} — token ${appt.token}',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.appointment,
      ),
    );
    return appt;
  }

  @override
  Future<List<AppNotification>> getNotifications() async {
    final snap = await _notifications.orderBy('timestamp', descending: true).get();
    return snap.docs
        .map((d) => AppNotification.fromMap(d.id, d.data()))
        .toList();
  }

  @override
  Future<void> markNotificationRead(String id) async {
    await _notifications.doc(id).update({'read': true});
  }

  @override
  Future<void> pushNotification(AppNotification notification) async {
    await _notifications.doc(notification.id).set(notification.toMap());
  }

  @override
  Future<String> askReportAssistant({
    required VaultReport report,
    required String question,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final q = question.toLowerCase();
    if (q.contains('hba1c') || report.title.toLowerCase().contains('hba1c')) {
      return 'Your HbA1c of 5.9% is in the prediabetes attention range '
          '(5.7–6.4%). This reflects average blood glucose over ~3 months. '
          'Discuss lifestyle measures and follow-up with your GP. '
          'This is educational guidance, not a diagnosis.';
    }
    if (report.metrics.isNotEmpty) {
      final lines = report.metrics
          .map((m) => '• ${m.name}: ${m.value} (${m.status})')
          .join('\n');
      return 'Here is a structured summary of "${report.title}" '
          'from ${report.issuedBy}:\n$lines\n\n'
          'Ask your clinician before changing any treatment.';
    }
    return 'I reviewed "${report.title}". No structured metrics were attached. '
        'Upload the full PDF or ask a more specific question.';
  }

  @override
  Future<String> upsertSosSession({
    required String patientId,
    required SosLocation location,
    required bool shareLiveGps,
    String? sessionId,
  }) async {
    final id = sessionId ?? _uuid.v4();
    final ref = _sosSessions.doc(id);
    final existing = await ref.get();
    final payload = <String, dynamic>{
      'patientId': patientId,
      'shareLiveGps': shareLiveGps,
      'active': true,
      'updatedAt': DateTime.now().toIso8601String(),
      ...location.toMap(),
    };
    if (!existing.exists) {
      payload['createdAt'] = DateTime.now().toIso8601String();
      await ref.set(payload);
    } else {
      await ref.update(payload);
    }
    return id;
  }

  @override
  Future<void> endSosSession(String sessionId) async {
    await _sosSessions.doc(sessionId).set({
      'active': false,
      'shareLiveGps': false,
      'endedAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }
}

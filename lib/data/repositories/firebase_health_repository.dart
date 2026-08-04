import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/app_notification.dart';
import '../models/appointment.dart';
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

  final _doctors = const [
    Doctor(
      id: 'd1',
      name: 'Dr. Perera',
      specialty: 'Cardiology',
      hospital: 'NHSL',
      rating: 4.8,
    ),
    Doctor(
      id: 'd2',
      name: 'Dr. Fernando',
      specialty: 'General Practice',
      hospital: 'Asiri Central',
      rating: 4.6,
    ),
    Doctor(
      id: 'd3',
      name: 'Dr. Silva',
      specialty: 'Pediatrics',
      hospital: 'Lady Ridgeway',
      rating: 4.9,
    ),
    Doctor(
      id: 'd4',
      name: 'Dr. Jayawardena',
      specialty: 'Endocrinology',
      hospital: 'Nawaloka',
      rating: 4.7,
    ),
  ];

  @override
  Future<List<VaultReport>> getVaultReports(String patientId) async {
    final snap = await _vault.where('patientId', isEqualTo: patientId).get();
    final list = snap.docs
        .map((d) => VaultReport.fromMap(d.id, d.data()))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    return list;
  }

  @override
  Future<List<Prescription>> getPrescriptions(String patientId) async {
    return const [
      Prescription(
        id: 'p1',
        medicine: 'Atorvastatin 20mg',
        doctor: 'Dr. Perera',
        code: 'EP-5290',
        active: true,
      ),
      Prescription(
        id: 'p2',
        medicine: 'Metformin 500mg',
        doctor: 'Dr. Jayawardena',
        code: 'EP-5312',
        active: true,
      ),
    ];
  }

  @override
  Future<void> syncLankaLab(String patientId) async {
    final report = VaultReport(
      id: _uuid.v4(),
      patientId: patientId,
      title: 'Lipid Profile (Auto-sync)',
      issuedBy: 'LankaLab',
      date: DateTime.now(),
      metrics: const [
        MetricReading(name: 'LDL', value: '118 mg/dL', status: 'attention'),
        MetricReading(name: 'HDL', value: '52 mg/dL', status: 'normal'),
      ],
    );
    await _vault.doc(report.id).set(report.toMap());
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'LankaLab sync',
        body: 'New diagnostic records pulled into your vault.',
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
        body: 'Active cardiovascular medicines refreshed (EP-5290).',
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
        name: 'Dengue Vaccine',
        doseLabel: 'Dose 2 of 3',
        progress: 0.75,
        nextDue: DateTime.now().add(const Duration(days: 21)),
      ),
      VaccineProtocol(
        id: 'v2',
        name: 'COVID-19 Booster',
        doseLabel: 'Completed',
        progress: 1.0,
        nextDue: null,
      ),
      VaccineProtocol(
        id: 'v3',
        name: 'Influenza (Seasonal)',
        doseLabel: 'Dose 1 of 1',
        progress: 0.0,
        nextDue: DateTime.now().add(const Duration(days: 45)),
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
}

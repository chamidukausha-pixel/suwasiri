import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/app_notification.dart';
import '../models/appointment.dart';
import '../models/vaccine_models.dart';
import '../models/vault_report.dart';
import 'health_repository.dart';

class DemoHealthRepository implements HealthRepository {
  DemoHealthRepository(this._prefs) {
    _seedIfNeeded();
  }

  final SharedPreferences _prefs;
  final _uuid = const Uuid();

  static const _kReports = 'suwasiri_vault';
  static const _kNotifs = 'suwasiri_notifs';
  static const _kAppts = 'suwasiri_appts';
  static const _kBookings = 'suwasiri_vax_bookings';
  static const _kMohSync = 'suwasiri_moh_sync';
  static const _kSeeded = 'suwasiri_seeded';

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

  void _seedIfNeeded() {
    if (_prefs.getBool(_kSeeded) == true) return;
    // Seeded lazily on first vault read with patientId.
  }

  Future<void> _ensureSeed(String patientId) async {
    if (_prefs.getBool(_kSeeded) == true) return;
    final reports = [
      VaultReport(
        id: _uuid.v4(),
        patientId: patientId,
        title: 'HbA1c Prediabetes Panel',
        issuedBy: 'LankaLab',
        date: DateTime.now().subtract(const Duration(days: 12)),
        metrics: const [
          MetricReading(name: 'HbA1c', value: '5.9%', status: 'attention'),
          MetricReading(name: 'Fasting Glucose', value: '108 mg/dL', status: 'attention'),
        ],
      ),
      VaultReport(
        id: _uuid.v4(),
        patientId: patientId,
        title: 'Complete Blood Count',
        issuedBy: 'LankaLab',
        date: DateTime.now().subtract(const Duration(days: 30)),
        metrics: const [
          MetricReading(name: 'Hemoglobin', value: '13.8 g/dL', status: 'normal'),
          MetricReading(name: 'WBC', value: '6.2 ×10⁹/L', status: 'normal'),
        ],
      ),
    ];
    await _saveReports(reports);
    final notifs = [
      AppNotification(
        id: _uuid.v4(),
        title: 'Lab result ready',
        body: 'HbA1c panel from LankaLab is in your vault.',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        type: NotificationPayloadType.labResult,
      ),
      AppNotification(
        id: _uuid.v4(),
        title: 'Vaccine reminder',
        body: 'Dengue Vaccine Dose 2 — book at your MOH clinic.',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        type: NotificationPayloadType.vaccine,
      ),
      AppNotification(
        id: _uuid.v4(),
        title: 'MOH sync complete',
        body: 'Immunization registry updated successfully.',
        timestamp: DateTime.now().subtract(const Duration(hours: 5)),
        type: NotificationPayloadType.sync,
        read: true,
      ),
    ];
    await _saveNotifs(notifs);
    await _prefs.setString(_kMohSync, DateTime.now().toIso8601String());
    await _prefs.setBool(_kSeeded, true);
  }

  Future<void> _saveReports(List<VaultReport> list) async {
    final encoded = list
        .map((r) => {'id': r.id, ...r.toMap()})
        .toList();
    await _prefs.setString(_kReports, jsonEncode(encoded));
  }

  Future<List<VaultReport>> _loadReports() async {
    final raw = _prefs.getString(_kReports);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) {
          final m = Map<String, dynamic>.from(e as Map);
          final id = m.remove('id') as String;
          return VaultReport.fromMap(id, m);
        })
        .toList();
  }

  Future<void> _saveNotifs(List<AppNotification> list) async {
    final encoded = list.map((n) => {'id': n.id, ...n.toMap()}).toList();
    await _prefs.setString(_kNotifs, jsonEncode(encoded));
  }

  Future<List<AppNotification>> _loadNotifs() async {
    final raw = _prefs.getString(_kNotifs);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) {
      final m = Map<String, dynamic>.from(e as Map);
      final id = m.remove('id') as String;
      return AppNotification.fromMap(id, m);
    }).toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  @override
  Future<List<VaultReport>> getVaultReports(String patientId) async {
    await _ensureSeed(patientId);
    final all = await _loadReports();
    return all.where((r) => r.patientId == patientId).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
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
    await Future<void>.delayed(const Duration(milliseconds: 800));
    final reports = await _loadReports();
    reports.insert(
      0,
      VaultReport(
        id: _uuid.v4(),
        patientId: patientId,
        title: 'Lipid Profile (Auto-sync)',
        issuedBy: 'LankaLab',
        date: DateTime.now(),
        metrics: const [
          MetricReading(name: 'LDL', value: '118 mg/dL', status: 'attention'),
          MetricReading(name: 'HDL', value: '52 mg/dL', status: 'normal'),
        ],
      ),
    );
    await _saveReports(reports);
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
    await Future<void>.delayed(const Duration(milliseconds: 600));
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
      final dOk = district == null || district.isEmpty || c.district == district;
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
    // Multi-stage validation simulation
    await Future<void>.delayed(const Duration(milliseconds: 400)); // handshake
    await Future<void>.delayed(const Duration(milliseconds: 400)); // verify CH ID
    await Future<void>.delayed(const Duration(milliseconds: 400)); // secure slot
    final booking = VaccineBooking(
      id: _uuid.v4(),
      facilityId: facilityId,
      facilityName: facilityName,
      slot: slot,
      ceylonHealthId: ceylonHealthId,
      status: 'confirmed',
    );
    final raw = _prefs.getString(_kBookings);
    final list = raw == null
        ? <Map<String, dynamic>>[]
        : List<Map<String, dynamic>>.from(jsonDecode(raw) as List);
    list.add({
      'id': booking.id,
      'facilityId': facilityId,
      'facilityName': facilityName,
      'slot': slot.toIso8601String(),
      'ceylonHealthId': ceylonHealthId,
      'status': booking.status,
      'patientId': patientId,
    });
    await _prefs.setString(_kBookings, jsonEncode(list));
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
    await Future<void>.delayed(const Duration(milliseconds: 700));
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
    final raw = _prefs.getString(_kAppts);
    if (raw == null) {
      return [
        Appointment(
          id: 'a0',
          patientId: patientId,
          doctorId: 'd1',
          doctorName: 'Dr. Perera',
          specialty: 'Cardiology',
          timeSlot: DateTime.now().add(const Duration(days: 4, hours: 2)),
          status: AppointmentStatus.upcoming,
          token: 'TKN-1042',
        ),
      ];
    }
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) {
      final m = Map<String, dynamic>.from(e as Map);
      final id = m.remove('id') as String;
      return Appointment.fromMap(id, m);
    }).where((a) => a.patientId == patientId).toList()
      ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));
  }

  @override
  Future<Appointment> bookAppointment({
    required String patientId,
    required Doctor doctor,
    required DateTime slot,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
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
    final existing = await getAppointments(patientId);
    final all = [...existing, appt];
    await _prefs.setString(
      _kAppts,
      jsonEncode(all.map((a) => {'id': a.id, ...a.toMap()}).toList()),
    );
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
  Future<List<AppNotification>> getNotifications() => _loadNotifs();

  @override
  Future<void> markNotificationRead(String id) async {
    final list = await _loadNotifs();
    final updated =
        list.map((n) => n.id == id ? n.copyWith(read: true) : n).toList();
    await _saveNotifs(updated);
  }

  @override
  Future<void> pushNotification(AppNotification notification) async {
    final list = await _loadNotifs();
    list.insert(0, notification);
    await _saveNotifs(list);
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

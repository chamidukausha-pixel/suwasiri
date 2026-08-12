import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../catalogs/doctor_catalog.dart';
import '../catalogs/patient_health_samples.dart';
import '../catalogs/vaccine_catalog.dart';
import '../models/app_notification.dart';
import '../models/appointment.dart';
import '../models/sos_location.dart';
import '../models/vaccine_models.dart';
import '../models/vault_report.dart';
import '../services/lab_assistant_replies.dart';
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

  List<Prescription> _rxMemory = [];

  List<ClinicFacility> get _clinics => VaccineCatalog.clinics;

  final _doctors = DoctorCatalog.doctors;

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
        title: 'LankaLab: Glycated Hemoglobin (HbA1c)',
        issuedBy: 'LankaLab',
        date: DateTime.now().subtract(const Duration(days: 12)),
        category: 'Blood Work',
        facility: 'LankaLab Central',
        fileSizeMb: 1.6,
        kind: VaultRecordKind.upload,
        metrics: const [
          MetricReading(name: 'HbA1c', value: '5.9%', status: 'attention'),
          MetricReading(
              name: 'Fasting Glucose', value: '108 mg/dL', status: 'attention'),
        ],
      ),
      VaultReport(
        id: _uuid.v4(),
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
        id: _uuid.v4(),
        patientId: patientId,
        title: 'Influenza Vaccine (Seasonal)',
        issuedBy: 'MOH',
        date: DateTime(2023, 9, 22),
        facility: 'National Hospital of Sri Lanka',
        kind: VaultRecordKind.vaccine,
        batchCode: 'IN-044-L',
      ),
      VaultReport(
        id: _uuid.v4(),
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
    final mine =
        _rxMemory.where((p) => p.patientId == patientId && p.active).toList();
    final samples =
        PatientHealthSamples.allSamplePrescriptions(patientId: patientId);
    if (mine.isEmpty) return samples;
    final byId = {for (final p in mine) p.id: p};
    return [
      ...mine,
      for (final s in samples)
        if (!byId.containsKey(s.id)) s,
    ]..sort((a, b) =>
        (b.issuedAt ?? DateTime(0)).compareTo(a.issuedAt ?? DateTime(0)));
  }

  @override
  Future<List<Prescription>> issueTelehealthPrescription({
    required String patientId,
    required String doctorName,
    required String sessionId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final now = DateTime.now();
    final batch = PatientHealthSamples.latestDoctorScript(
      patientId: patientId,
      doctorName: doctorName,
      clinicName: 'Lanka GP Care · Durdans Teleclinic',
      sessionId: sessionId,
      issuedAt: now,
    );
    _rxMemory = [..._rxMemory, ...batch];
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
    await Future<void>.delayed(const Duration(milliseconds: 350));
    _rxMemory = _rxMemory
        .map((p) => p.patientId == patientId && p.sessionId == sessionId
            ? p.copyWith(sentToPharmacare: true, updating: false)
            : p)
        .toList();
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Synced to MediLanka',
        body:
            'E-prescription forwarded to MediLanka pharmacy web portal for Sri Lankan dispensing.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<void> markPrescriptionsSentToPharmacy({
    required String patientId,
    required List<Prescription> medicines,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    final byId = {for (final m in medicines) m.id: m};
    _rxMemory = [
      for (final p in _rxMemory)
        if (byId.containsKey(p.id))
          p.copyWith(sentToPharmacare: true, updating: false)
        else
          p,
      for (final m in medicines)
        if (!_rxMemory.any((p) => p.id == m.id))
          m.copyWith(
            patientId: patientId,
            sentToPharmacare: true,
            updating: false,
          ),
    ];
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Synced to MediLanka',
        body:
            'E-prescription moved to Issued Medical History after MediLanka pharmacy sync.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
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
      ),
    );
    await _saveReports(reports);
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
    await Future<void>.delayed(const Duration(milliseconds: 600));
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
    return VaccineCatalog.activeProtocols();
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
    final dateOffsets = [1, 4, 6];
    const hours = [8, 9, 10, 11, 13, 14, 15];
    const minutes = [30, 30, 30, 30, 30, 30, 30];
    final slots = <DateTime>[];
    for (final offset in dateOffsets) {
      final day = now.add(Duration(days: offset));
      for (var i = 0; i < hours.length; i++) {
        slots.add(DateTime(day.year, day.month, day.day, hours[i], minutes[i]));
      }
    }
    return slots;
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
    ClinicFacility? clinic;
    for (final c in VaccineCatalog.clinics) {
      if (c.id == facilityId) {
        clinic = c;
        break;
      }
    }
    final booking = VaccineBooking(
      id: _uuid.v4(),
      facilityId: facilityId,
      facilityName: facilityName,
      slot: slot,
      ceylonHealthId: ceylonHealthId,
      status: 'confirmed',
      address: clinic?.address ?? '',
    );
    final raw = _prefs.getString(_kBookings);
    final list = raw == null
        ? <Map<String, dynamic>>[]
        : List<Map<String, dynamic>>.from(jsonDecode(raw) as List);
    list.add({
      'id': booking.id,
      'patientId': patientId,
      ...booking.toMap(),
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
  Future<List<VaccineBooking>> getVaccineBookings(String patientId) async {
    final raw = _prefs.getString(_kBookings);
    if (raw == null) return const [];
    final list = List<Map<String, dynamic>>.from(jsonDecode(raw) as List);
    return list
        .where((m) => m['patientId'] == patientId)
        .map((m) => VaccineBooking.fromMap(m['id'] as String? ?? '', m))
        .toList()
      ..sort((a, b) => a.slot.compareTo(b.slot));
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
          specialty: 'Cardiologist',
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
    return LabAssistantReplies.reply(report: report, question: question);
  }

  @override
  Future<String> upsertSosSession({
    required String patientId,
    required SosLocation location,
    required bool shareLiveGps,
    String? sessionId,
  }) async {
    return sessionId ?? _uuid.v4();
  }

  @override
  Future<void> endSosSession(String sessionId) async {}
}

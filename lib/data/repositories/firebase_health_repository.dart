import 'package:cloud_firestore/cloud_firestore.dart';
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

  final _doctors = DoctorCatalog.doctors;

  @override
  Future<List<VaultReport>> getVaultReports(String patientId) async {
    final snap = await _vault.where('patientId', isEqualTo: patientId).get();
    final list = snap.docs
        .map((d) => VaultReport.fromMap(d.id, d.data()))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    if (list.isNotEmpty) return list;
    return PatientHealthSamples.sampleLabReports(patientId: patientId);
  }

  @override
  Future<List<Prescription>> getPrescriptions(String patientId) async {
    final snap =
        await _prescriptions.where('patientId', isEqualTo: patientId).get();
    final list = snap.docs
        .map((d) => Prescription.fromMap(d.id, d.data()))
        .where((p) => p.active)
        .toList();
    final samples =
        PatientHealthSamples.allSamplePrescriptions(patientId: patientId);
    if (list.isEmpty) {
      return samples
        ..sort((a, b) => (b.issuedAt ?? DateTime(0))
            .compareTo(a.issuedAt ?? DateTime(0)));
    }
    final byId = {for (final p in list) p.id: p};
    final merged = <Prescription>[
      ...list,
      for (final s in samples)
        if (!byId.containsKey(s.id) &&
            !( !s.sentToPharmacare &&
                list.any((p) => p.code == s.code && p.sentToPharmacare)))
          s,
    ]..sort((a, b) =>
        (b.issuedAt ?? DateTime(0)).compareTo(a.issuedAt ?? DateTime(0)));
    return merged;
  }

  @override
  Future<List<Prescription>> issueTelehealthPrescription({
    required String patientId,
    required String doctorName,
    required String sessionId,
  }) async {
    final now = DateTime.now();
    final batch = PatientHealthSamples.latestDoctorScript(
      patientId: patientId,
      doctorName: doctorName,
      clinicName: 'Lanka GP Care · Durdans Teleclinic',
      sessionId: sessionId,
      issuedAt: now,
    );
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
    for (final rx in medicines) {
      final updated = rx.copyWith(
        patientId: patientId,
        sentToPharmacare: true,
        updating: false,
      );
      await _prescriptions.doc(rx.id).set(updated.toMap(), SetOptions(merge: true));
    }
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
    // Active protocols only (pending + scheduled). Completed live in Vault history.
    return VaccineCatalog.activeProtocols();
  }

  @override
  Future<List<ClinicFacility>> getClinics({
    String? district,
    FacilityType type = FacilityType.all,
    String query = '',
  }) async {
    return VaccineCatalog.searchClinics(
      district: district,
      type: type,
      query: query,
    );
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
    String vaccineName = '',
  }) async {
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
      vaccineName: vaccineName,
      address: clinic?.address ?? '',
    );
    await _vaccinations.doc(booking.id).set({
      'patientId': patientId,
      ...booking.toMap(),
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
  Future<List<VaccineBooking>> getVaccineBookings(String patientId) async {
    final snap =
        await _vaccinations.where('patientId', isEqualTo: patientId).get();
    final list = snap.docs
        .map((d) => VaccineBooking.fromMap(d.id, d.data()))
        .toList()
      ..sort((a, b) => a.slot.compareTo(b.slot));
    return list;
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
    ConsultMode consultMode = ConsultMode.clinic,
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
      consultMode: consultMode,
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
    return LabAssistantReplies.reply(report: report, question: question);
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

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../catalogs/doctor_catalog.dart';
import '../catalogs/doctor_schedule_slots.dart';
import '../catalogs/gp_care_clinic_map.dart';
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
  CollectionReference<Map<String, dynamic>> get _appointmentSlots =>
      _db.collection('appointment_slots');
  CollectionReference<Map<String, dynamic>> get _notifications =>
      _db.collection('notifications');
  CollectionReference<Map<String, dynamic>> get _prescriptions =>
      _db.collection('prescriptions');
  CollectionReference<Map<String, dynamic>> get _certificates =>
      _db.collection('medical_certificates');
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
        .toList();
    return PatientHealthSamples.mergeStoredWithSamples(
      patientId: patientId,
      stored: list,
    );
  }

  @override
  Stream<List<Prescription>> watchPrescriptions(String patientId) {
    return _prescriptions
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) {
      final list = snap.docs
          .map((d) => Prescription.fromMap(d.id, d.data()))
          .toList();
      return PatientHealthSamples.mergeStoredWithSamples(
        patientId: patientId,
        stored: list,
      );
    });
  }

  @override
  Stream<List<DoctorCertificate>> watchCertificates(String patientId) {
    return _certificates
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) {
      final list = snap.docs
          .map((d) => DoctorCertificate.fromMap(d.id, d.data()))
          .toList();
      return PatientHealthSamples.mergeCertificatesWithSamples(
        patientId: patientId,
        stored: list,
      );
    });
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
    final now = DateTime.now().toIso8601String();
    final history = PatientHealthSamples.vaccineHistory(patientId: patientId);
    for (final entry in history) {
      await _vaccinations.doc('suwasiri-hist-$patientId-${entry.id}').set({
        'patientId': patientId,
        'vaccineName': entry.vaccineName,
        'date': entry.date.toIso8601String(),
        'doseLabel': entry.doseLabel,
        'dose': entry.doseLabel,
        'batchNumber': entry.batchCode,
        'facilityName': entry.facility,
        'issuer': entry.issuer,
        'status': 'completed',
        'recordType': 'history',
        'source': 'suwasiri_app',
        'syncedAt': now,
      }, SetOptions(merge: true));
    }
    final bookings = await getVaccineBookings(patientId);
    for (final booking in bookings) {
      await _vaccinations.doc(booking.id).set({
        'patientId': patientId,
        'recordType': 'booking',
        'source': 'suwasiri_app',
        'syncedAt': now,
      }, SetOptions(merge: true));
    }
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Lanka GP Care sync',
        body:
            'Vaccine history sent to Sri Lankan GP Care. Doctor-issued e-prescriptions stay in Vault → E-Prescription.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<List<VaccineProtocol>> getVaccineProtocols(
    String patientId, {
    DateTime? dateOfBirth,
  }) async {
    final bookings = await getVaccineBookings(patientId);
    return VaccineCatalog.protocolsFor(
      dateOfBirth: dateOfBirth,
      bookings: bookings,
    );
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
    String patientName = '',
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
      patientName: patientName,
      address: clinic?.address ?? '',
      bookedAt: DateTime.now(),
    );
    await _vaccinations.doc(booking.id).set({
      'patientId': patientId,
      'patientName': patientName,
      ...booking.toMap(),
    });
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Vaccine booked',
        body: patientName.isEmpty
            ? '$facilityName — ${slot.toLocal()}'
            : '$patientName · $facilityName — ${slot.toLocal()}',
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
  Stream<List<Appointment>> watchAppointments(String patientId) {
    return _appointments
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) {
      return snap.docs
          .map((d) => Appointment.fromMap(d.id, d.data()))
          .toList()
        ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));
    });
  }

  List<DateTime> _bookedFromDocs(
    Iterable<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
  ) {
    final out = <DateTime>[];
    for (final d in docs) {
      final data = d.data();
      final status = (data['status'] as String? ?? '').toLowerCase();
      if (status == AppointmentStatus.cancelled.name ||
          status == 'cancelled' ||
          status == 'completed') {
        continue;
      }
      final raw = data['timeSlot'] as String?;
      final slot = DateTime.tryParse(raw ?? '');
      if (slot != null) out.add(slot);
    }
    return out;
  }

  @override
  Future<List<DateTime>> getDoctorBookedSlots(String doctorId) async {
    final snap =
        await _appointments.where('doctorId', isEqualTo: doctorId).get();
    return _bookedFromDocs(snap.docs);
  }

  @override
  Stream<List<DateTime>> watchDoctorBookedSlots(String doctorId) {
    return _appointments
        .where('doctorId', isEqualTo: doctorId)
        .snapshots()
        .map((snap) => _bookedFromDocs(snap.docs));
  }

  @override
  Future<Appointment> bookAppointment({
    required String patientId,
    required Doctor doctor,
    required DateTime slot,
    ConsultMode consultMode = ConsultMode.clinic,
    String patientName = '',
    String patientEmail = '',
    String? patientPhone,
    String? paymentMethod,
  }) async {
    final gp = GpCareClinicMap.resolve(doctor.hospital);
    final apptId = _uuid.v4();
    final lockId = DoctorScheduleSlots.slotLockId(doctor.id, slot);
    final appt = Appointment(
      id: apptId,
      patientId: patientId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      timeSlot: slot,
      status: AppointmentStatus.upcoming,
      token: 'TKN-${DateTime.now().millisecondsSinceEpoch % 10000}',
      consultMode: consultMode,
      hospital: doctor.hospital,
      bookedAt: DateTime.now(),
      patientName: patientName,
      patientEmail: patientEmail,
      patientPhone: patientPhone ?? '',
      hospitalId: gp.hospitalId,
      branchId: gp.branchId,
      paymentMethod: paymentMethod,
      feeLkr: doctor.feeLkr,
    );

    final lockRef = _appointmentSlots.doc(lockId);
    final apptRef = _appointments.doc(apptId);

    try {
      await _db.runTransaction((tx) async {
        final existing = await tx.get(lockRef);
        if (existing.exists) {
          throw SlotUnavailableException();
        }
        tx.set(lockRef, {
          'doctorId': doctor.id,
          'doctorName': doctor.name,
          'timeSlot': slot.toIso8601String(),
          'date': gpCareDateKey(slot),
          'time': gpCareTimeLabel(slot),
          'appointmentId': apptId,
          'patientId': patientId,
          'patientName': patientName,
          'source': 'suwasiri_app',
          'createdAt': DateTime.now().toIso8601String(),
        });
        tx.set(apptRef, appt.toMap());
      });
    } on SlotUnavailableException {
      rethrow;
    } catch (e) {
      // Concurrent create can surface as permission / already-exists style errors.
      final msg = e.toString().toLowerCase();
      if (msg.contains('already') || msg.contains('exists')) {
        throw SlotUnavailableException();
      }
      rethrow;
    }

    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Appointment confirmed',
        body:
            '${consultMode == ConsultMode.video ? 'Video' : 'Clinic'} · ${doctor.name} — token ${appt.token}',
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
  Future<LabAiReview> askReportAssistant({
    required VaultReport report,
    required String question,
    String language = 'en',
    String patientName = '',
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    return LabAssistantReplies.review(
      report: report,
      question: question,
      language: language,
      patientName: patientName,
    );
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

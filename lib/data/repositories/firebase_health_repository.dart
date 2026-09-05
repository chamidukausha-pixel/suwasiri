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
import '../models/clinic_fee_item.dart';
import '../models/clinic_patient_registration.dart';
import '../models/sos_location.dart';
import '../models/vaccine_models.dart';
import '../models/vault_report.dart';
import '../services/lab_assistant_replies.dart';
import 'health_repository.dart';

/// Firestore-backed health data. Clinic doctors from GP Care merge with the curated catalog.
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
  Stream<List<TreatmentNote>> watchTreatmentNotes(String patientId) {
    return _db
        .collection('consultation_notes')
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) {
      final live = snap.docs
          .map((d) => TreatmentNote.fromMap(d.id, d.data()))
          .toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      final samples = PatientHealthSamples.treatmentNotes(patientId: patientId);
      if (live.isEmpty) return samples;
      final ids = {for (final n in live) n.id};
      return [
        ...live,
        ...samples.where((s) => !ids.contains(s.id)),
      ];
    });
  }

  List<VaultReport> _mergeLabReports(String patientId, List<VaultReport> live) {
    final samples = PatientHealthSamples.sampleLabReports(patientId: patientId);
    if (live.isEmpty) return samples;
    final ids = {for (final r in live) r.id};
    return [
      ...live,
      ...samples.where((s) => !ids.contains(s.id)),
    ]..sort((a, b) => b.date.compareTo(a.date));
  }

  List<VaccineHistoryEntry> _mergeVaccineHistory(
    String patientId,
    List<VaccineHistoryEntry> live,
  ) {
    final samples = PatientHealthSamples.vaccineHistory(patientId: patientId);
    if (live.isEmpty) return samples;
    final ids = {for (final e in live) e.id};
    return [
      ...live,
      ...samples.where((s) => !ids.contains(s.id)),
    ]..sort((a, b) => b.date.compareTo(a.date));
  }

  @override
  Stream<List<VaultReport>> watchVaultReports(String patientId) {
    return _vault.where('patientId', isEqualTo: patientId).snapshots().map((snap) {
      final live = snap.docs
          .map((d) => VaultReport.fromMap(d.id, d.data()))
          .toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      return _mergeLabReports(patientId, live);
    });
  }

  @override
  Stream<List<VaccineHistoryEntry>> watchVaccineHistory(String patientId) {
    return _vaccinations
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .map((snap) {
      final live = <VaccineHistoryEntry>[];
      for (final d in snap.docs) {
        final data = d.data();
        final type = data['recordType'] as String? ?? '';
        final source = data['source'] as String? ?? '';
        if (type == 'booking') continue;
        if (type != 'history' && source != 'gp_care') continue;
        live.add(VaccineHistoryEntry.fromMap(d.id, data));
      }
      live.sort((a, b) => b.date.compareTo(a.date));
      return _mergeVaccineHistory(patientId, live);
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
    try {
      final vaultSnap =
          await _vault.where('patientId', isEqualTo: patientId).get();
      for (final doc in vaultSnap.docs) {
        await doc.reference.set({
          'gpCareSyncedAt': now,
          'source': doc.data()['source'] ?? 'suwasiri_app',
        }, SetOptions(merge: true));
      }
    } catch (_) {}
    await pushNotification(
      AppNotification(
        id: _uuid.v4(),
        title: 'Lanka GP Care sync',
        body:
            'Patient profile, vaccine history, allergies, pathology and imaging reports synced to Sri Lankan GP Care.',
        timestamp: DateTime.now(),
        type: NotificationPayloadType.sync,
      ),
    );
  }

  @override
  Future<void> registerPatientAtClinic({
    required String patientId,
    required ClinicPatientRegistration registration,
  }) async {
    final key = registration.hospitalId.isNotEmpty
        ? registration.hospitalId
        : registration.hospitalName
            .toLowerCase()
            .replaceAll(RegExp(r'[^a-z0-9]+'), '-');
    final regId = '${patientId}_$key';
    await _db.collection('clinic_patient_registrations').doc(regId).set({
      'patientId': patientId,
      'patientName': registration.fullName,
      'hospitalId': registration.hospitalId,
      'hospitalName': registration.hospitalName,
      'branchId': registration.branchId,
      'registration': registration.toMap(),
      'source': 'suwasiri_app',
      'registeredAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
    try {
      await syncGpCare(patientId);
    } catch (_) {
      // Profile saved; sync can retry from Vault → Sync GP Care.
    }
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
    final merged = <Doctor>[..._doctors];
    try {
      final snap = await _db.collection('clinic_doctors').get();
      for (final doc in snap.docs) {
        final data = doc.data();
        if (data['active'] == false) continue;
        merged.add(Doctor.fromClinicMap(doc.id, data));
      }
    } catch (_) {
      // Catalog-only fallback if clinic_doctors is unavailable.
    }
    final logos = <String, String>{};
    try {
      final centers = await _db.collection('clinic_centers').get();
      for (final doc in centers.docs) {
        final data = doc.data();
        if (data['active'] == false) continue;
        final logo = (data['logoUrl'] as String?)?.trim() ?? '';
        final hid = (data['hospitalId'] as String?)?.trim() ?? doc.id;
        if (logo.isNotEmpty) logos[hid] = logo;
        if (logo.isNotEmpty) logos[doc.id] = logo;
        final name = (data['name'] as String? ?? '').trim();
        if (name.isNotEmpty) logos['name:${name.toLowerCase()}'] = logo;
      }
      final hospitals = merged.map((d) => d.hospital.toLowerCase()).toSet();
      for (final doc in centers.docs) {
        final data = doc.data();
        if (data['active'] == false) continue;
        final name = (data['name'] as String? ?? '').trim();
        if (name.isEmpty) continue;
        if (hospitals.contains(name.toLowerCase())) continue;
        hospitals.add(name.toLowerCase());
        final logo = (data['logoUrl'] as String?)?.trim();
        merged.add(
          Doctor(
            id: 'center-${doc.id}',
            name: name,
            specialty: 'Medical Centre',
            hospital: name,
            rating: 0,
            region: data['region'] as String? ?? 'Colombo',
            address: data['address'] as String? ?? '',
            hospitalId: data['hospitalId'] as String? ?? '',
            logoUrl: (logo != null && logo.isNotEmpty) ? logo : null,
            photoUrl: (logo != null && logo.isNotEmpty) ? logo : null,
            bio:
                'GP Care medical centre. Doctors appear here after they are added in Platform Console.',
            feeLkr: 0,
          ),
        );
      }
    } catch (_) {}
    final deduped = _applyClinicLogos(_mergeDoctors(merged), logos);
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return deduped;
    final tokens = q.split(RegExp(r'\s+')).where((t) => t.isNotEmpty);
    return deduped.where((d) {
      final hay =
          '${d.name} ${d.specialty} ${d.hospital} ${d.region} ${d.address}'
              .toLowerCase();
      if (hay.contains(q)) return true;
      return tokens.every((t) => hay.contains(t));
    }).toList();
  }

  @override
  Future<List<ClinicFeeItem>> getClinicFeeSchedule({String hospitalId = ''}) async {
    List<ClinicFeeItem> parse(Map<String, dynamic>? data) {
      final raw = data?['items'];
      if (raw is! List) return const [];
      return raw
          .whereType<Map>()
          .map((item) => ClinicFeeItem.fromMap(Map<String, dynamic>.from(item)))
          .where((item) => item.privateFeeLkr > 0)
          .toList();
    }

    try {
      if (hospitalId.trim().isNotEmpty) {
        final doc = await _db.collection('clinic_fee_schedules').doc(hospitalId).get();
        final items = parse(doc.data());
        if (items.isNotEmpty) return items;
      }
      final global = await _db.collection('clinic_fee_schedules').doc('global').get();
      return parse(global.data());
    } catch (_) {
      return const [];
    }
  }

  static String _normDoctorName(String name) => name
      .toLowerCase()
      .replaceFirst(RegExp(r'^dr\.?\s*'), '')
      .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
      .trim();

  static String _doctorMergeKey(Doctor d) {
    final key = DoctorScheduleSlots.personKey(d.name);
    return key.isEmpty ? _normDoctorName(d.name) : key;
  }

  /// Prefer catalog ids (shared slot locks) and overlay GP Care roster / tenancy.
  static List<Doctor> _mergeDoctors(List<Doctor> list) {
    final byKey = <String, Doctor>{};
    for (final d in list) {
      final key = _doctorMergeKey(d);
      final existing = byKey[key];
      if (existing == null) {
        byKey[key] = d.copyWith(
          id: DoctorScheduleSlots.canonicalDoctorId(d.id, d.name),
        );
        continue;
      }
      final name = d.name.length >= existing.name.length ? d.name : existing.name;
      final keepId = DoctorScheduleSlots.canonicalDoctorId(
        existing.id.startsWith('d-') ? existing.id : d.id,
        name,
      );
      byKey[key] = existing.copyWith(
        id: keepId,
        name: name,
        specialty:
            d.specialty.isNotEmpty ? d.specialty : existing.specialty,
        region: d.region.isNotEmpty ? d.region : existing.region,
        hospital: d.hospital.isNotEmpty ? d.hospital : existing.hospital,
        hospitalId:
            d.hospitalId.isNotEmpty ? d.hospitalId : existing.hospitalId,
        branchId: d.branchId.isNotEmpty ? d.branchId : existing.branchId,
        rosterHours:
            d.rosterHours.isNotEmpty ? d.rosterHours : existing.rosterHours,
        nextAvailable: d.nextAvailable.isNotEmpty
            ? d.nextAvailable
            : existing.nextAvailable,
        feeLkr: d.feeLkr > 0 ? d.feeLkr : existing.feeLkr,
        address: d.address.isNotEmpty ? d.address : existing.address,
        photoUrl: (d.photoUrl != null && d.photoUrl!.trim().isNotEmpty)
            ? d.photoUrl
            : existing.photoUrl,
        logoUrl: (d.logoUrl != null && d.logoUrl!.trim().isNotEmpty)
            ? d.logoUrl
            : existing.logoUrl,
      );
    }
    return byKey.values.toList();
  }

  static List<Doctor> _applyClinicLogos(
    List<Doctor> doctors,
    Map<String, String> logos,
  ) {
    if (logos.isEmpty) return doctors;
    return doctors.map((d) {
      final logo = logos[d.hospitalId] ??
          logos['name:${d.hospital.toLowerCase()}'] ??
          d.logoUrl;
      if (logo == null || logo.isEmpty || d.logoUrl == logo) return d;
      return d.copyWith(logoUrl: logo);
    }).toList();
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

  bool _isActiveBookingStatus(Map<String, dynamic> data) {
    final status = (data['status'] as String? ?? '').toLowerCase();
    return status != AppointmentStatus.cancelled.name &&
        status != 'cancelled' &&
        status != 'canceled' &&
        status != 'completed';
  }

  List<DateTime> _bookedForDoctor({
    required String doctorId,
    required String doctorName,
    required Iterable<QueryDocumentSnapshot<Map<String, dynamic>>> appointmentDocs,
    Iterable<QueryDocumentSnapshot<Map<String, dynamic>>> lockDocs = const [],
  }) {
    final out = <DateTime>[];
    void consider(Map<String, dynamic> data) {
      if (!_isActiveBookingStatus(data)) return;
      if (!DoctorScheduleSlots.isSameClinicDoctor(
        selectedId: doctorId,
        selectedName: doctorName,
        bookingDoctorId: '${data['doctorId'] ?? ''}',
        bookingDoctorName: '${data['doctorName'] ?? ''}',
      )) {
        return;
      }
      final slot = DoctorScheduleSlots.wallClockFromBooking(data);
      if (slot != null &&
          !out.any((s) => DoctorScheduleSlots.sameMinute(s, slot))) {
        out.add(slot);
      }
    }

    for (final d in appointmentDocs) {
      consider(d.data());
    }
    for (final d in lockDocs) {
      consider(d.data());
    }
    return out;
  }

  @override
  Future<List<DateTime>> getDoctorBookedSlots(
    String doctorId, {
    String doctorName = '',
  }) async {
    try {
      final snap = await _appointments.get();
      QuerySnapshot<Map<String, dynamic>>? locks;
      try {
        locks = await _appointmentSlots.get();
      } catch (_) {}
      return _bookedForDoctor(
        doctorId: doctorId,
        doctorName: doctorName,
        appointmentDocs: snap.docs,
        lockDocs: locks?.docs ?? const [],
      );
    } catch (_) {
      return const [];
    }
  }

  @override
  Stream<List<DateTime>> watchDoctorBookedSlots(
    String doctorId, {
    String doctorName = '',
  }) {
    return _appointments.snapshots().asyncMap((snap) async {
      QuerySnapshot<Map<String, dynamic>>? locks;
      try {
        locks = await _appointmentSlots.get();
      } catch (_) {}
      return _bookedForDoctor(
        doctorId: doctorId,
        doctorName: doctorName,
        appointmentDocs: snap.docs,
        lockDocs: locks?.docs ?? const [],
      );
    });
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
    String paymentStatus = 'PAID',
    bool paidBySuwasiri = false,
    String? suwasiriReceiptUrl,
    String visitReason = '',
    int? feeLkr,
    int? patientAge,
    String patientGender = '',
  }) async {
    final gp = GpCareClinicMap.resolve(doctor.hospital);
    final apptId = _uuid.v4();
    final canonicalId =
        DoctorScheduleSlots.canonicalDoctorId(doctor.id, doctor.name);
    final aliasIds = DoctorScheduleSlots.identityIds(doctor.id, doctor.name);
    final lockId = DoctorScheduleSlots.slotLockId(canonicalId, slot);
    final hospitalId =
        doctor.hospitalId.isNotEmpty ? doctor.hospitalId : gp.hospitalId;
    final branchId =
        doctor.branchId.isNotEmpty ? doctor.branchId : gp.branchId;
    final appt = Appointment(
      id: apptId,
      patientId: patientId,
      doctorId: canonicalId,
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
      hospitalId: hospitalId,
      branchId: branchId,
      paymentMethod: paymentMethod,
      feeLkr: feeLkr ?? doctor.feeLkr,
      paymentStatus: paymentStatus,
      paidBySuwasiri: paidBySuwasiri,
      suwasiriReceiptUrl: suwasiriReceiptUrl,
      visitReason: visitReason,
      patientAge: patientAge,
      patientGender: patientGender,
    );

    final lockRef = _appointmentSlots.doc(lockId);
    final apptRef = _appointments.doc(apptId);

    try {
      await _db.runTransaction((tx) async {
        for (final id in aliasIds) {
          final aliasLock =
              _appointmentSlots.doc(DoctorScheduleSlots.slotLockId(id, slot));
          final existing = await tx.get(aliasLock);
          if (existing.exists) {
            throw SlotUnavailableException();
          }
        }
        tx.set(lockRef, {
          'doctorId': canonicalId,
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
  Future<List<AppNotification>> getNotifications({String? patientId}) async {
    final snap = await _notifications.orderBy('timestamp', descending: true).get();
    final list = snap.docs
        .map((d) => AppNotification.fromMap(d.id, d.data()))
        .toList();
    if (patientId == null || patientId.isEmpty) return list;
    return list
        .where((n) => n.patientId.isEmpty || n.patientId == patientId)
        .toList();
  }

  @override
  Stream<List<AppNotification>> watchNotifications(String patientId) {
    return _notifications.snapshots().map((snap) {
      final list = snap.docs
          .map((d) => AppNotification.fromMap(d.id, d.data()))
          .toList()
        ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list
          .where((n) => n.patientId.isEmpty || n.patientId == patientId)
          .toList();
    });
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

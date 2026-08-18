import '../models/app_notification.dart';
import '../models/appointment.dart';
import '../models/sos_location.dart';
import '../models/vaccine_models.dart';
import '../models/vault_report.dart';
import '../services/lab_assistant_replies.dart';

abstract class HealthRepository {
  Future<List<VaultReport>> getVaultReports(String patientId);
  Future<List<Prescription>> getPrescriptions(String patientId);
  Future<void> syncLankaLab(String patientId);
  Future<void> syncGpCare(String patientId);

  /// GP issues e-prescription during a telehealth session (Lanka GP Care sync).
  Future<List<Prescription>> issueTelehealthPrescription({
    required String patientId,
    required String doctorName,
    required String sessionId,
  });

  /// Forward session Rx lines to the MediLanka / PharmaCare pharmacist portal.
  Future<void> sendPrescriptionsToPharmacare({
    required String patientId,
    required String sessionId,
  });

  /// Mark specific prescriptions as sent to MediLanka (moves to Issued Medical History).
  Future<void> markPrescriptionsSentToPharmacy({
    required String patientId,
    required List<Prescription> medicines,
  });

  Future<List<VaccineProtocol>> getVaccineProtocols(
    String patientId, {
    DateTime? dateOfBirth,
  });
  Future<List<ClinicFacility>> getClinics({
    String? district,
    FacilityType type = FacilityType.all,
    String query = '',
  });
  Future<List<DateTime>> getAvailableSlots(String facilityId);
  Future<VaccineBooking> bookVaccine({
    required String patientId,
    required String facilityId,
    required String facilityName,
    required DateTime slot,
    required String ceylonHealthId,
    String vaccineName = '',
  });
  Future<List<VaccineBooking>> getVaccineBookings(String patientId);
  Future<DateTime?> lastMohSync();
  Future<void> syncMoh();

  Future<List<Doctor>> getDoctors({String query = ''});
  Future<List<Appointment>> getAppointments(String patientId);
  Stream<List<Appointment>> watchAppointments(String patientId);
  Future<Appointment> bookAppointment({
    required String patientId,
    required Doctor doctor,
    required DateTime slot,
    ConsultMode consultMode = ConsultMode.clinic,
  });

  Future<List<AppNotification>> getNotifications();
  Future<void> markNotificationRead(String id);
  Future<void> pushNotification(AppNotification notification);

  Future<LabAiReview> askReportAssistant({
    required VaultReport report,
    required String question,
    String language = 'en',
    String patientName = '',
  });

  /// Publish / update a live Suwasariya dispatcher GPS session.
  Future<String> upsertSosSession({
    required String patientId,
    required SosLocation location,
    required bool shareLiveGps,
    String? sessionId,
  });

  Future<void> endSosSession(String sessionId);
}

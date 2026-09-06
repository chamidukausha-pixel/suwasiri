import 'package:flutter/material.dart';

import '../../data/models/appointment.dart';
import 'booking_checkout_flow.dart';
import 'clinic_patient_registration_screen.dart';
import 'patient_type_sheet.dart';

/// Patient-type sheet, then existing slot checkout (GP Care Firestore sync).
Future<void> startDoctorBooking(
  BuildContext context, {
  required Doctor doctor,
  String? initialVisitReason,
  String? homeService,
  DateTime? initialSlot,
}) async {
  if (doctor.isClinicOnly) return;
  final visitType = await showPatientTypeSheet(context, doctor: doctor);
  if (visitType == null || !context.mounted) return;
  if (visitType == PatientVisitType.newPatient) {
    final completed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => ClinicPatientRegistrationScreen(doctor: doctor),
      ),
    );
    if (completed != true || !context.mounted) return;
  }
  await showBookingCheckoutFlow(
    context,
    doctor: doctor,
    initialVisitReason: initialVisitReason,
    homeService: homeService,
    initialSlot: initialSlot,
  );
}

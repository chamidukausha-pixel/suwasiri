export interface VaccineRecord {
  vaccineName: string;
  date: string;
  dose: string;
  batchNumber: string;
  status: string;
  airSyncStatus?: "SYNCED_TO_AIR" | "PENDING_AIR" | "NOT_SYNCED";
  providerNumber?: string;
  site?: string;
  route?: string;
}

export interface LabResult {
  id: string;
  testName: string;
  date: string;
  status: "COMPLETED" | "PENDING" | "ABNORMAL" | "CRITICAL";
  result: string;
  remarks: string;
  doctorReviewed?: boolean;
  reviewedBy?: string;
  reviewedDate?: string;
  abnormalFlag?: boolean;
  category?: string;
  labName?: string;
}

export interface ImagingRecord {
  id: string;
  patientId: string;
  patientName: string;
  modality: "X-ray" | "CT" | "MRI" | "Ultrasound" | "Mammography" | "Bone Densitometry" | "Nuclear Medicine";
  bodyPart: string;
  clinicalIndication: string;
  dateOrdered: string;
  dateCompleted?: string;
  status: "ORDERED" | "SCHEDULED" | "COMPLETED" | "REPORT_READY";
  radiologistReport?: string;
  findings?: string;
  radiologistName?: string;
  imagingCenter?: string;
  doctorReviewed?: boolean;
  reviewedBy?: string;
  urgentAlert?: boolean;
}

export interface PrescriptionRecord {
  id: string;
  date: string;
  items: string[];
  dosageInstructions: string;
  rxNumber: string;
  signatureUrl: string;
  pbsType?: "PBS_SUBSIDISED" | "NON_PBS_PRIVATE" | "AUTHORITY_REQUIRED" | "REPATRIATION";
  repeats?: number;
  quantity?: number;
  ePrescriptionToken?: string;
  aslStatus?: "ACTIVE_IN_ASL" | "DISPENSED" | "CANCELLED";
  rtpmStatus?: "RTPM_CLEARED" | "RTPM_MONITORED" | "RTPM_HIGH_RISK";
  authorityCode?: string;
}

export interface ObservationRecord {
  id: string;
  date: string;
  time: string;
  systolicBp?: number;
  diastolicBp?: number;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  spO2?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bmiCategory?: string;
  bloodGlucoseMmol?: number;
  waistCircumferenceCm?: number;
  eGFR?: number;
  recordedBy?: string;
  notes?: string;
}

export interface ClinicalCalculationResult {
  id: string;
  date: string;
  type: "BMI" | "CVD_RISK" | "DIABETES_RISK" | "EGFR" | "BP_STAGING" | "PREGNANCY_EDD" | "PAEDIATRIC_DOSE";
  score: string | number;
  interpretation: string;
  recommendation: string;
  inputs: Record<string, any>;
  calculatedBy: string;
}

export interface RecallRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  category: "Diabetes Review" | "Immunisation" | "Cervical Screening" | "Pathology Follow-up" | "Care Plan Review" | "Cardiovascular Check" | "Bowel Screening" | "Skin Cancer Check";
  urgency: "HIGH" | "MEDIUM" | "ROUTINE";
  dueDate: string;
  status: "DUE" | "SMS_SENT" | "EMAIL_SENT" | "BOOKED" | "COMPLETED" | "CANCELLED";
  lastContactedDate?: string;
  contactMethod?: "SMS" | "Email" | "App Notification" | "Letter";
  notes: string;
  assignedDoctor: string;
}

export interface ReferralRecord {
  id: string;
  patientId: string;
  patientName: string;
  specialistName: string;
  specialty: string;
  clinicAddress: string;
  ediIdentifier?: string;
  healthlinkEdi?: string;
  dateCreated: string;
  clinicalSummary: string;
  urgency: "URGENT" | "ROUTINE" | "SEMI_URGENT";
  status: "DRAFT" | "SENT_E_REFERRAL" | "ACKNOWLEDGED" | "APPOINTMENT_BOOKED" | "COMPLETED";
  attachedDocuments: string[];
  referringDoctor: string;
  doctorProviderNo: string;
}

export interface CarePlanRecord {
  id: string;
  patientId: string;
  patientName: string;
  planType: "GPMP_721" | "TCA_723" | "MENTAL_HEALTH_2715" | "DIABETES_SIP_2517" | "ASTHMA_SIP_2546";
  title: string;
  dateCreated: string;
  reviewDueDate: string;
  goals: string[];
  interventions: string[];
  alliedHealthReferrals: string[];
  patientConsent: boolean;
  status: "ACTIVE" | "NEEDS_REVIEW" | "COMPLETED";
  doctorName: string;
}

export interface MyHealthRecordDoc {
  id: string;
  title: string;
  docType: "Shared Health Summary" | "Event Summary" | "Discharge Summary" | "Pathology Report" | "Diagnostic Imaging Report" | "Prescription & Dispense Record";
  author: string;
  facility: string;
  date: string;
  status: "ACCESSED" | "AVAILABLE" | "SYNCED";
  summary: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: "Doctor" | "Admin" | "Receptionist" | "Nurse" | "Patient";
  action: string;
  category: "PATIENT_RECORD" | "PRESCRIPTION" | "DIAGNOSIS" | "PATHOLOGY" | "REFERRAL" | "BILLING" | "SECURITY" | "MHR_ACCESS" | "AUTHENTICATION";
  patientId?: string;
  patientName?: string;
  details: string;
  ipAddress?: string;
}

export interface StaffProvider {
  id: string;
  userId?: string;
  hospitalId?: string;
  roleId?: string;
  branchIds?: string[];
  name: string;
  role: string;
  specialty?: string;
  providerNumber: string;
  prescriberNumber?: string;
  ahpraNumber?: string;
  slmcNumber?: string;
  email: string;
  phone: string;
  assignedRoom: string;
  roster: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  active: boolean;
}

export interface FeeScheduleItem {
  id: string;
  mbsItemNumber: string;
  description: string;
  category: "Standard Consult" | "Long Consult" | "Telehealth" | "Care Plan" | "Mental Health" | "Procedure" | "After Hours";
  mbsScheduleFee: number;
  mbsBenefit: number;
  privateFee: number;
  gapFee: number;
  bulkBillable: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth?: string;
  bloodType: string;
  allergies: string;
  phone: string;
  email: string;
  image: string;
  notes: string;
  history: Array<{
    date: string;
    reason: string;
    doctor: string;
    notes: string;
  }>;
  activeMedications: string[];
  // Australian & International Identifiers
  medicareNumber?: string;
  medicareRefNumber?: string;
  medicareExpiry?: string;
  ihiNumber?: string; // Individual Healthcare Identifier
  dvaNumber?: string;
  pensionerCardNumber?: string;
  healthCareCardNumber?: string;
  preferredGp?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  consentSmsReminder?: boolean;
  consentEmailHealthSummary?: boolean;
  consentMyHealthRecordUpload?: boolean;
  consentClinicalAudits?: boolean;
  myMedicareEnrolled?: boolean;
  myMedicareClinic?: string;
  // Advanced Medical Records
  medicalHistory: string[];
  diagnosesList?: Array<{
    id: string;
    condition: string;
    icd10Code?: string;
    dateDiagnosed: string;
    status: "ACTIVE" | "RESOLVED" | "INACTIVE";
    notes?: string;
  }>;
  vaccineRecords: VaccineRecord[];
  labResults: LabResult[];
  imagingRecords?: ImagingRecord[];
  prescriptionsList: PrescriptionRecord[];
  observationsHistory?: ObservationRecord[];
  clinicalCalculations?: ClinicalCalculationResult[];
  referralsList?: ReferralRecord[];
  carePlansList?: CarePlanRecord[];
  myHealthRecordDocs?: MyHealthRecordDoc[];
  recallsList?: RecallRecord[];
  medicalCertificatesList?: MedicalCertificateRecord[];
  sampleCollections?: SampleCollection[];
  medicalCenter?: string;
  suwasiriBarcode?: string;
  hospitalId?: string;
  branchId?: string;
}

export interface SampleCollection {
  id: string;
  patientId: string;
  patientName: string;
  sampleCategory: "Blood" | "Urinal" | "Both Blood & Urinal";
  status: "PENDING" | "COLLECTED" | "DELIVERED";
  collectedTime?: string;
  deliveredTime?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  deliveryPersonId?: string;
  labName?: string;
  lankaLabSyncStatus?: "NOT_SYNCED" | "SYNCED";
  lankaLabLedgerKey?: string;
}

export interface MedicalCertificateRecord {
  id: string;
  date: string;
  diagnosis: string;
  startDate: string;
  endDate: string;
  numDays: number;
  status: "UNFIT_FOR_WORK" | "FIT_FOR_LIGHT_DUTY" | "FIT_FOR_DUTY";
  doctorName: string;
  doctorRegNo: string;
  additionalRemarks?: string;
  emailStatus: "NOT_SENT" | "SENDING" | "SENT" | "FAILED";
  recipientEmail: string;
  suwasiriSyncStatus: "NOT_SYNCED" | "SYNCING" | "SYNCED" | "FAILED";
  suwasiriSyncTime?: string;
  lankalabSyncStatus: "NOT_SYNCED" | "SYNCING" | "SYNCED" | "FAILED";
  lankalabSyncTime?: string;
}

export interface DoctorConsultationActivity {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorSlmcNo?: string;
  consultationDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FOLLOW_UP_REQUIRED";
  modality: "In-Person OPD" | "Telehealth Video" | "Home Visit" | "Emergency Triage";
  vitalsRecorded: {
    bp?: string;
    pulse?: number;
    temp?: number;
    spo2?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
  };
  chiefComplaints: string;
  soapNotes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  primaryDiagnosis?: string;
  icd10Code?: string;
  prescriptionsIssued: string[];
  labInvestigationsOrdered: string[];
  medicalCertificatesIssued?: string[];
  referralsIssued?: string[];
  nextRecallDate?: string;
  billingAmountLkr: number;
  paymentStatus: "PAID" | "PENDING" | "SUWASIRI_SUBSIDIZED";
  doctorClinicalRemarks?: string;
  lastUpdated: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  time: string;
  reason: string;
  status: "SCHEDULED" | "CHECKED IN" | "IN EXAM ROOM" | "COMPLETED" | "CANCELLED";
  date: string;
  type?: "Standard GP Consult" | "Long Consult (20+ min)" | "Telehealth Video" | "Care Plan Review" | "Immunisation" | "Skin Check";
  doctorName?: string;
  doctorSlmcNo?: string;
  room?: string;
  isTelehealth?: boolean;
  telehealthLink?: string;
  waitingListRequested?: boolean;
  medicareClaimStatus?: "PENDING" | "CLAIMED_ECLIPSE" | "PRIVATE_PAID" | "NOT_CLAIMED";
  feeAmount?: number;
  rebateAmount?: number;
  consultationActivity?: DoctorConsultationActivity;
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  timeLabel: string;
  text: string;
  severity: "critical" | "high" | "medium";
}

export interface Task {
  id: string;
  text: string;
  dueDate: string;
  completed: boolean;
}

export interface Billing {
  id: string;
  patientName: string;
  patientId?: string;
  amount: number;
  service: string;
  mbsItemNumber?: string;
  medicareRebate?: number;
  gapFee?: number;
  status: "PAID" | "PENDING" | "OVERDUE" | "BULK_BILLED";
  date: string;
  paymentMethod?: "Medicare Bulk Bill" | "EFTPOS" | "Credit Card" | "Cash" | "Suwasiri Pay" | "DVA";
  paidBySuwasiri?: boolean;
  suwasiriReceiptUrl?: string;
  claimId?: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  dateOrdered: string;
  status: string;
  remarks: string;
  dateCompleted: string;
  isAbnormal?: boolean;
  urgentRecall?: boolean;
  doctorReviewStatus?: "PENDING_REVIEW" | "REVIEWED_NORMAL" | "REVIEWED_ABNORMAL_RECALL";
}

export interface NotificationLog {
  id: string;
  patientName: string;
  recipient: string;
  transport: "WhatsApp" | "SMS" | "Email" | "App Notification";
  templateType: string;
  content: string;
  date: string;
  status: string;
}

export interface ClinicMessage {
  id: string;
  sender: string;
  senderRole: string;
  text: string;
  timestamp: string;
  channel: string;
  isPatientMessage?: boolean;
  patientId?: string;
  subject?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

// ==========================================
// 15. DOCUMENT MANAGEMENT
// ==========================================
export type DocumentCategory =
  | "Clinical Correspondence"
  | "Specialist Letters"
  | "Pathology Reports"
  | "Imaging Reports"
  | "Medical Certificates"
  | "Referral Documents"
  | "Discharge Summaries"
  | "Patient Consents"
  | "Allied Health Reports"
  | "Insurance / WorkCover";

export interface DocumentVersion {
  versionNumber: number;
  timestamp: string;
  author: string;
  notes: string;
  fileSizeKb: number;
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  category: DocumentCategory;
  fileType: "PDF" | "IMAGE_PNG" | "IMAGE_JPEG" | "SCANNED_DOC" | "E_CORRESPONDENCE";
  fileUrl?: string;
  fileSizeKb: number;
  uploadedBy: string;
  uploadedDate: string;
  allocatedDoctor: string;
  status: "DRAFT" | "PENDING_DOCTOR_REVIEW" | "REVIEWED_NORMAL" | "ACTION_REQUIRED" | "ARCHIVED";
  versionHistory: DocumentVersion[];
  tags: string[];
  summaryNotes?: string;
  isConfidential?: boolean;
  ocrExtractedText?: string;
  signatureStatus?: "UNSIGNED" | "SIGNED_DIGITALLY" | "VERIFIED";
  signedBy?: string;
  signedDate?: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  category: DocumentCategory;
  description: string;
  contentTemplate: string;
  placeholders: string[];
}

// ==========================================
// 16. AI FEATURES — CLINICAL ADVANTAGE
// ==========================================
export interface AIScribeSession {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  timestamp: string;
  audioDurationSeconds?: number;
  rawTranscript: string;
  generatedSoap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    suggestedDiagnoses: Array<{ icd10: string; description: string; confidence: number }>;
    suggestedPrescriptions: Array<{ drug: string; dose: string; frequency: string; reason: string }>;
    suggestedPathology: string[];
    suggestedRecalls: string[];
  };
  doctorApprovalStatus: "AWAITING_REVIEW" | "DOCTOR_APPROVED" | "MODIFIED_AND_SAVED";
  doctorNotes?: string;
}

export interface AIPatientSummary {
  patientId: string;
  patientAge: number;
  patientGender: string;
  keyConditions: string[];
  activeMedicationsCount: number;
  recentCriticalOrAbnormalResults: Array<{ test: string; result: string; date: string; flag: "HIGH" | "LOW" | "CRITICAL" }>;
  outstandingCareGapsAndRecalls: Array<{ title: string; urgency: "HIGH" | "MEDIUM" | "ROUTINE"; recommendedInterval: string; rationale: string }>;
  aiExecutiveInsight: string;
  interactionRisks: Array<{ severity: "CRITICAL" | "MODERATE" | "LOW"; title: string; explanation: string }>;
}

export interface AIChatSuggestion {
  id: string;
  type: "SUMMARY" | "MISSING_INFO" | "REFERRAL_DRAFT" | "PATIENT_LEAFLET" | "INTERACTION_CHECK" | "RECALL_PROMPT";
  title: string;
  content: string;
  applied: boolean;
}

// ==========================================
// 17. SECURITY & ACCESS CONTROL MODULE
// ==========================================
export type UserRole =
  | "Platform Super Admin"
  | "Hospital Super Admin"
  | "Doctor"
  | "Specialist Consultant"
  | "Medical Officer"
  | "Nurse"
  | "Triage Officer"
  | "Receptionist"
  | "Pharmacist"
  | "Lab Technician"
  | "Billing Officer"
  | "Practice Manager"
  | "Admin"
  | "Auditor"
  | "Patient";

export interface PermissionFlags {
  canAccessDoctorDashboard: boolean;
  canViewClinicalNotes: boolean;
  canEditClinicalNotes: boolean;
  canPrescribeMedications: boolean;
  canOrderDiagnosticsAndLabs: boolean;
  canDispatchSampleCourier: boolean;
  canAccessTelehealthSuite: boolean;
  canViewBilling: boolean;
  canManageCashierAndInvoicing: boolean;
  canManageUsers: boolean;
  canBreakGlassEmergency: boolean;
  canExportData: boolean;
  canManageRecalls: boolean;
  canViewAuditLogs: boolean;
  canAccessAnalyticsReports: boolean;
  canConfigureSystemSecurity: boolean;
}

export type PermissionKey = keyof PermissionFlags;

export interface RolePermissionMatrix extends PermissionFlags {
  role: UserRole | string;
}

export interface Hospital {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
}

export interface Branch {
  id: string;
  hospitalId: string;
  name: string;
  address: string;
  phone?: string;
  rooms: string[];
}

export interface RoleDefinition extends PermissionFlags {
  id: string;
  hospitalId: string;
  name: string;
  isSystem: boolean;
  enabled: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  platformRole?: "platform_super_admin" | null;
}

export interface StaffMembership {
  id: string;
  userId: string;
  hospitalId: string;
  roleId: string;
  branchIds: string[];
  active: boolean;
}

export interface SessionContext {
  userId: string;
  hospitalId: string;
  branchId: string;
  roleId: string;
}

export interface SecurityStatusConfig {
  mfaEnabled: boolean;
  mfaMethod: "AUTHENTICATOR_APP" | "SMS_OTP" | "HARDWARE_FIDO2";
  encryptionRestStatus: "AES-256-GCM Active" | "Degraded";
  encryptionTransitStatus: "TLS 1.3 Active";
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordComplexityEnforced: boolean;
  passwordExpiryDays: number;
  failedLoginLockoutAttempts: number;
  backupFrequency: "HOURLY_INCREMENTAL" | "DAILY_FULL";
  lastBackupTimestamp: string;
  backupIntegrityVerified: boolean;
  disasterRecoveryRpoMinutes: number; // Recovery Point Objective
  disasterRecoveryRtoMinutes: number; // Recovery Time Objective
  dataRetentionAdultYears: number; // 10 years Sri Lanka MoH / PDPA Standard
  dataRetentionPaediatricAgeYears: number; // Until 21 years old + 3 years
}

export interface ActiveSession {
  id: string;
  userName: string;
  role: UserRole | string;
  ipAddress: string;
  device: string;
  location: string;
  loginTime: string;
  lastActiveTime: string;
  isCurrent: boolean;
}

export interface BreakGlassEvent {
  id: string;
  timestamp: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  clinicalReason: string;
  authorizedWitness?: string;
  urgencyLevel: "LIFE_THREATENING_EMERGENCY" | "AFTER_HOURS_URGENT" | "MEDICO_LEGAL_OVERRIDE";
}

// ==========================================
// 19. REPORTS & CLINICAL ANALYTICS
// ==========================================
export interface PracticeKPIReport {
  period: string;
  totalRegisteredPatients: number;
  newPatientsThisMonth: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  dnaAppointments: number; // Did Not Attend
  dnaRatePercentage: number;
  averageWaitTimeMinutes: number;
  averageConsultDurationMinutes: number;
  telehealthPercentage: number;
  doctorWorkload: Array<{
    doctorName: string;
    consultsCount: number;
    hoursBilled: number;
    avgPatientSatisfaction: number;
  }>;
  financials: {
    totalBilledRevenue: number;
    medicareDirectClaims: number;
    privateEftposBilling: number;
    bulkBilledAmount: number;
    gapRevenueCollected: number;
    outstandingAgedDebtors: number;
  };
}

export interface ChronicDiseaseRegistryData {
  category: "Diabetes Mellitus" | "Hypertension" | "Asthma / COPD" | "Chronic Kidney Disease" | "Cardiovascular Disease";
  totalCohort: number;
  withUpToDateCarePlan: number; // MBS 721 / 723
  withControlledHbA1cOrBp: number;
  overdueRecallCount: number;
  annualHealthAssessmentCompletedRate: number;
}


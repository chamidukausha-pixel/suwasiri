export type TestStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CRITICAL';

export interface PatientDocument {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  docType: 'LAB_REPORT' | 'SPECIMEN_RECEIPT' | 'PRESCRIPTION' | 'CONSENT_FORM';
  url: string;
  parsedSummary?: string;
  isLinkedToGPCare: boolean;
  isLinkedToPatientApp: boolean;
}

export interface LabOrder {
  id: string;
  patientName: string;
  avatarColor?: string; // used for patient initials avatar (e.g., bg-primary-container)
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  testType: string;
  orderTime: string; // ISO string or human string eg "Today, 08:45 AM"
  orderTimestamp: Date;
  specimenId: string;
  status: TestStatus;
  priority: 'Routine' | 'Urgent' | 'Critical';
  results?: {
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
  }[];
  notes?: string;
  wardOrDept?: string;
  documents?: PatientDocument[];
  phone?: string;
  email?: string;
  suwasiriBarcode?: string;
  connectedClinic?: string;
}

export interface CourierRoute {
  id: string;
  routeName: string;
  courierName: string;
  courierPhone: string;
  etaMinutes: number;
  progressPercent: number;
  totalSamples: number;
  urgentSamples: number;
  currentLocation: { lat: number; lng: number };
}

export interface UrgentNotification {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timeAgo: string;
  timestamp: Date;
}

export interface TestCatalogItem {
  code: string;
  name: string;
  category: string;
  subDepartment?: string; // e.g., 'Haematology & Blood Transfusion', 'General Biochemistry & Endocrinology', 'Digital Pathology'
  specimenType: string;
  containerColor: string; // tube top (e.g., lavender, red, yellow)
  turnaroundTime: string;
  referenceValue: string;
  clinicalSignificance: string;
  specimenVolume?: string;
  fastingRequired?: boolean;
  isClinicalTrialReady?: boolean;
  hl7Code?: string;
  blindingEligible?: boolean;
}

export interface ConsumableItem {
  id: string;
  sku: string;
  name: string;
  category: 'TUBES' | 'NEEDLES' | 'BIOHAZARD' | 'VACCINES' | 'SWABS';
  packSize: string;
  inStock: boolean;
  unitPriceLkr: number;
  description: string;
  isVaccine?: boolean;
}

export interface MQLinkRecord {
  id: string;
  patientName: string;
  dob: string;
  doctorName: string;
  clinicName: string;
  testName: string;
  reportedAt: string;
  status: 'DELIVERED' | 'IMPORTED' | 'AUDITED' | 'FLAGGED';
  hl7MessageId: string;
  auditTrack: string[];
  fileFormat: 'HL7 v2.4' | 'PIT Encrypted' | 'PDF (Secured)';
}

export interface ClinicalTrialProtocol {
  protocolId: string;
  trialTitle: string;
  sponsor: string;
  phase: string;
  blindingEnabled: boolean;
  exclusionCriteria: string[];
  activeSubjects: number;
  criticalFlaggedCount: number;
  targetAssays: string[];
}

export type DiagnosticReportFormat = 'STANDARD' | 'PRIVATE' | 'CONFIDENTIAL' | 'CUMULATIVE' | 'INTERIM';

export interface SupplementaryTestRequest {
  id: string;
  orderId: string;
  testName: string;
  requestedBy: string;
  clinicalReason: string;
  specimenId: string;
  tubeColor: string;
  status: 'PENDING_APPROVAL' | 'LAB_CONFIRMED' | 'IN_PROCESSING' | 'COMPLETED';
  requestedAt: string;
}

export interface QuickShareLog {
  id: string;
  orderId: string;
  patientName: string;
  sharedWith: string;
  recipientRole: string;
  shareMethod: 'DIRECT_PRACTITIONER' | 'MDT_PANEL' | 'ENCRYPTED_LINK';
  expiryHours: number;
  sharedAt: string;
  passcodeProtected: boolean;
  notes?: string;
  accessCount?: number;
}

export interface CumulativeResultPoint {
  date: string;
  visitLabel: string;
  numericValue: number;
  displayValue: string;
  isAbnormal: boolean;
  notes?: string;
}

export interface CumulativeParameterHistory {
  parameter: string;
  unit: string;
  referenceRange: string;
  history: CumulativeResultPoint[];
}

export interface TrialWorkflowStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tubeDetails: string;
  requiredVolume: string;
  inversions?: string;
  centrifugeSpecs?: string;
  storageTarget?: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
}

export interface TrialFinancialInvoice {
  invoiceId: string;
  protocolId: string;
  sponsor: string;
  billingPeriod: string;
  items: {
    serviceCode: string;
    description: string;
    unitsProcessed: number;
    unitPriceLkr: number;
    subtotalLkr: number;
  }[];
  totalLkr: number;
  status: 'DRAFT' | 'DISPATCHED_TO_SPONSOR' | 'AUDITED_AND_PAID';
  generatedAt: string;
  dueDate: string;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface InventoryItem {
  id: string;
  brandName: string;
  genericName: string;
  nmraRegNo: string; // Sri Lanka National Medicines Regulatory Authority ID
  category: 'Cardiovascular' | 'Endocrine' | 'Respiratory' | 'Antibiotic' | 'Analgesic' | 'Gastrointestinal' | 'Psychiatric' | 'Other';
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Inhaler' | 'Injection' | 'Cream';
  strength: string; // e.g. "500mg", "50mg"
  packSize: number;
  stockQty: number; // Current stock count
  reorderLevel: number;
  unitPriceLkr: number; // Price in Sri Lankan Rupees (LKR)
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  pharmacyLocation: 'Colombo Central' | 'Kandy General' | 'Galle Health Hub' | 'Jaffna Depot';
  status: 'In Stock' | 'Low Stock' | 'Critical Shortage' | 'Expired Soon';
}

export interface PrescribedMedication {
  medicationId: string;
  brandName: string;
  genericName: string;
  dosage: string; // e.g. "500mg BD (twice daily)"
  durationDays: number;
  quantityPrescribed: number;
  refillsAllowed: number;
  refillsRemaining: number;
  specialInstructions?: string;
}

export interface GPCarePrescription {
  id: string; // e.g. "GPC-2026-9821"
  doctorName: string;
  slmcNumber: string; // Sri Lanka Medical Council Registration
  clinicName: string;
  patientNIC: string; // National Identity Card e.g. "198574102938V"
  patientName: string;
  patientPhone: string;
  patientAge: number;
  diagnosis: string;
  dateIssued: string;
  validUntil: string;
  medications: PrescribedMedication[];
  dispenseStatus: 'Pending' | 'Dispensed' | 'Partial' | 'Cancelled';
  suwasiriSynced: boolean;
}

export interface SuwasiriPatientProfile {
  nic: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  district: 'Colombo' | 'Kandy' | 'Galle' | 'Jaffna' | 'Kurunegala' | 'Gampaha';
  knownAllergies: string[];
  chronicDiseases: string[];
  activeMedications: string[];
  lastEHealthSync: string;
  encryptedRecordHash: string; // AES-256 encrypted verification fingerprint
  primaryGP: string;
}

export interface AIMedicationAlert {
  id: string;
  patientNIC: string;
  patientName: string;
  alertType: 'Drug-Drug Interaction' | 'Food Interaction' | 'Dosage Overflow' | 'Allergy Flag' | 'Contraindication';
  severity: RiskLevel;
  medicationPair: string;
  description: string;
  clinicalImpact: string;
  aiRecommendation: string;
  timestamp: string;
  resolved: boolean;
}

export interface AutoRefillNotification {
  id: string;
  prescriptionId: string;
  patientNIC: string;
  patientName: string;
  patientPhone: string;
  medicationName: string;
  dosageSchedule: string;
  daysRemaining: number;
  estimatedDepletionDate: string;
  suggestedPharmacy: string;
  stockAvailable: boolean;
  status: 'Scheduled' | 'Sent' | 'Confirmed' | 'Snoozed';
  preferredLanguage: 'English' | 'Sinhala' | 'Tamil';
  messageDrafts: {
    en: string;
    si: string;
    ta: string;
  };
  lastSentTimestamp?: string;
}

export interface SystemSyncLog {
  id: string;
  sourceSystem: 'Sri Lanka GP Care' | 'Suwasiri eHealth Portal' | 'NMRA Registry' | 'PharmaCloud Vault' | 'Supplier Procurement Portal';
  action: string;
  timestamp: string;
  recordsProcessed: number;
  status: 'SUCCESS' | 'ENCRYPTED_SYNC' | 'WARNING' | 'FAILED';
  securityProtocol: 'TLS 1.3 / AES-256-GCM' | 'FHIR v4.0.1 REST API' | 'TLS 1.3 Audit Verified';
  details: string;
}

export interface BillItem {
  inventoryId: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  unitPriceLkr: number;
  quantity: number;
  subtotalLkr: number;
}

export interface CustomerBill {
  id: string; // e.g. "INV-BILL-2026-104"
  customerName: string;
  customerPhone: string;
  customerNIC?: string;
  items: BillItem[];
  totalLkr: number;
  discountLkr: number;
  netLkr: number;
  paymentMethod: 'Cash' | 'Card' | 'Suwasiri Pay' | 'Insurance';
  timestamp: string;
  smsDispatched: boolean;
  pharmacistName: string;
}

export interface Supplier {
  id: string; // e.g. "SUP-101"
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  nmraLicenseNo: string;
  category: string; // e.g. "Cardiovascular & Endocrine Specialties", "Antibiotic Importers"
  rating: number; // e.g. 4.8
  leadTimeDays: number;
  activeContractsCount: number;
  status: 'Active' | 'Under Review' | 'Suspended';
}

export interface SupplierOrder {
  id: string; // e.g. "PO-2026-801"
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDelivery: string;
  items: {
    brandName: string;
    genericName: string;
    quantity: number;
    unitCostLkr: number;
  }[];
  totalLkr: number;
  status: 'Draft' | 'Purchase Order Issued' | 'In Transit' | 'Received & Injected to Stock';
  paymentTerms: '30 Days Net' | 'Letter of Credit' | 'Cash on Delivery';
}

export interface OnlineProduct {
  id: string;
  inventoryId: string;
  brandName: string;
  genericName: string;
  category: 'Cardiovascular' | 'Endocrine' | 'Respiratory' | 'Antibiotic' | 'Analgesic' | 'Gastrointestinal' | 'Psychiatric' | 'Other';
  dosageForm: string;
  strength: string;
  unitPriceLkr: number;
  stockQty: number;
  imageUrl: string;
  description: string;
  requiresPrescription: boolean;
  rating: number;
}

export interface OnlineOrder {
  id: string; // e.g. "ORD-ONL-2026-501"
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryMethod: 'Home Express Delivery' | 'Click & Store Pickup';
  paymentMethod: 'Suwasiri Pay' | 'Card Online' | 'Cash on Delivery';
  prescriptionUploaded?: boolean;
  prescriptionImageName?: string;
  items: {
    productId: string;
    brandName: string;
    quantity: number;
    unitPriceLkr: number;
    subtotalLkr: number;
  }[];
  totalLkr: number;
  deliveryFeeLkr: number;
  netLkr: number;
  status: 'Pending Verification' | 'Pharmacist Approved' | 'Out for Express Delivery' | 'Delivered' | 'Cancelled';
  orderTimestamp: string;
}

export interface AIAnalysisRequest {
  patientNIC: string;
  prescriptionMeds: { name: string; dosage: string }[];
  patientAllergies: string[];
  patientConditions: string[];
  customQuery?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  overallSafetyStatus: 'SAFE' | 'CAUTION_REQUIRED' | 'HIGH_RISK';
  alerts: {
    type: 'Drug-Drug Interaction' | 'Food Interaction' | 'Dosage Overflow' | 'Allergy Flag' | 'Contraindication';
    severity: RiskLevel;
    medicationPair: string;
    description: string;
    clinicalImpact: string;
    aiRecommendation: string;
  }[];
  refillInsights: {
    urgencyDays: number;
    prediction: string;
    patientAdvice: string;
  };
  trilingualMessage: {
    en: string;
    si: string;
    ta: string;
  };
}

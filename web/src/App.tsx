import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Calendar as CalendarIcon,
  CheckCircle,
  FileText,
  Plus,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  Bell,
  Search,
  CheckSquare,
  ShieldAlert,
  Loader2,
  Trash2,
  ArrowRight,
  ExternalLink,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  Stethoscope,
  Info,
  Clock,
  HeartPulse,
  UserCheck,
  Sparkles,
  AlertTriangle,
  UserPlus,
  MessageSquare,
  Video,
  Printer,
  Syringe,
  FlaskConical,
  ShieldCheck,
  Share2,
  Globe,
  Barcode,
  Upload,
  Eye,
  X,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Pill,
  Star,
  SlidersHorizontal,
  AlertOctagon,
  MoveUp,
  MoveDown
} from "lucide-react";

import { 
  Patient, Appointment, Alert, Task, Billing, VaccineRecord, LabResult, PrescriptionRecord, LabOrder, NotificationLog, ClinicMessage, Expense,
  Hospital, Branch, RoleDefinition, StaffMembership, StaffUser, StaffProvider, MedicalCertificateRecord
} from "./types";

import ClinicMonthCalendar, { LiveColomboClock } from "./components/ClinicMonthCalendar";
import RoleSwitcher from "./components/RoleSwitcher";
import { formatDateKey, formatLongDate } from "./utils/clinicCalendar";
import LoginView from "./components/LoginView";
import PlatformConsoleView from "./components/PlatformConsoleView";
import PrintablePrescription from "./components/PrintablePrescription";
import SecureClinicChat from "./components/SecureClinicChat";
import TelehealthRoom from "./components/TelehealthRoom";
import PatientDetailsHub from "./components/PatientDetailsHub";
import DoctorClinicalRecordModal from "./components/DoctorClinicalRecordModal";
import ClinicalCalculatorsModal from "./components/ClinicalCalculatorsModal";
import RecallsDashboard from "./components/RecallsDashboard";
import PatientPortalView from "./components/PatientPortalView";
import PracticeManagerView from "./components/PracticeManagerView";
import SystemAdminView from "./components/SystemAdminView";
import DocumentManagementHub from "./components/DocumentManagementHub";
import PathologyHub from "./components/PathologyHub";
import AIFeaturesHub from "./components/AIFeaturesHub";
import SecurityModuleView from "./components/SecurityModuleView";
import AuditLogView from "./components/AuditLogView";
import ReportsAnalyticsView from "./components/ReportsAnalyticsView";
import { RecallRecord, ClinicalDocument } from "./types";
import {
  BRANCH_COLOMBO,
  HOSPITAL_PRIMECARE,
  canViewHospitalWideCharts,
  defaultTabFor,
  isGovernanceEditor,
  tabAllowed,
} from "./tenancy";
import { isFirebaseConfigured } from "./firebase";
import { signOutFirebase, staffForAuthUser, subscribeAuth } from "./firebaseAuth";
import type { User } from "firebase/auth";
import {
  appointmentPatientName,
  bookGpCareSlotToFirestore,
  compareAppointmentTime,
  isDueTelehealth,
  isVideoBooking,
  mergeAppointments,
  mergePatients,
  stubPatientFromBooking,
  subscribeSuwasiriAppointments,
  suwasiriDoctorCatalogId,
  updateSuwasiriAppointmentStatus,
} from "./sync/suwasiriAppointments";
import { issuePrescriptionsToSuwasiri } from "./sync/suwasiriPrescriptions";
import {
  applySuwasiriChart,
  subscribeSuwasiriPatientCharts,
  type SuwasiriChartPatch,
} from "./sync/suwasiriPatientChart";
import { subscribeSuwasiriVaccinePatients } from "./sync/suwasiriVaccinations";
import { PATHOLOGY_INVESTIGATIONS, sampleCategoryForTest } from "./catalogs/pathologyInvestigations";

export interface DrugFormularyItem {
  name: string;
  brand: string;
  generic: string;
  category: "Antibiotics" | "Analgesics & Pain" | "Diabetes" | "Cardio & BP" | "Respiratory" | "Gastric & GI" | "Antihistamine & Allergy" | "Vitamins & Minerals" | "Steroids & Other";
  strength: string;
  defaultDose: string;
  defaultDays: string;
  defaultMeal: string;
  contraindicatedAllergies: string[];
  indications: string;
}

export const SRI_LANKA_GP_DRUGS: DrugFormularyItem[] = [
  {
    name: "Paracetamol 500mg Tablet",
    brand: "Panadol / Calpol / Para",
    generic: "Paracetamol (Acetaminophen)",
    category: "Analgesics & Pain",
    strength: "500mg",
    defaultDose: "Take 2 tablets every 6 hours PRN",
    defaultDays: "3",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Paracetamol"],
    indications: "Fever, headache, musculoskeletal aches, post-vaccination pain"
  },
  {
    name: "Amoxicillin 500mg Capsule",
    brand: "Amoxil / Moxikem",
    generic: "Amoxicillin Trihydrate",
    category: "Antibiotics",
    strength: "500mg",
    defaultDose: "Take 1 capsule three times a day (TDS)",
    defaultDays: "5",
    defaultMeal: "Before Meals",
    contraindicatedAllergies: ["Penicillin", "Amoxicillin", "Beta-lactam"],
    indications: "Upper respiratory tract infection, acute sinusitis, tonsillitis, otitis media"
  },
  {
    name: "Co-Amoxiclav 625mg Tablet",
    brand: "Augmentin / Clavam",
    generic: "Amoxicillin + Clavulanic Acid",
    category: "Antibiotics",
    strength: "625mg (500mg/125mg)",
    defaultDose: "Take 1 tablet twice a day (BD)",
    defaultDays: "5",
    defaultMeal: "With Meals",
    contraindicatedAllergies: ["Penicillin", "Amoxicillin", "Beta-lactam"],
    indications: "Bacterial bronchitis, recurrent UTI, soft tissue / skin infection"
  },
  {
    name: "Ciprofloxacin 500mg Tablet",
    brand: "Cipro / Ciloxan / Cifran",
    generic: "Ciprofloxacin Hydrochloride",
    category: "Antibiotics",
    strength: "500mg",
    defaultDose: "Take 1 tablet twice a day (BD)",
    defaultDays: "5",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Ciprofloxacin", "Fluoroquinolones"],
    indications: "Urinary tract infection (UTI), bacterial gastroenteritis, enteric fever"
  },
  {
    name: "Azithromycin 500mg Tablet",
    brand: "Zithromax / Azithral",
    generic: "Azithromycin Monohydrate",
    category: "Antibiotics",
    strength: "500mg",
    defaultDose: "Take 1 tablet once daily (OD)",
    defaultDays: "3",
    defaultMeal: "Before Meals",
    contraindicatedAllergies: ["Azithromycin", "Macrolides"],
    indications: "Atypical pneumonia, severe pharyngitis, penicillin-allergic patients"
  },
  {
    name: "Metronidazole 400mg Tablet",
    brand: "Flagyl / Metrogyl",
    generic: "Metronidazole",
    category: "Antibiotics",
    strength: "400mg",
    defaultDose: "Take 1 tablet three times a day (TDS)",
    defaultDays: "5",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Metronidazole", "Nitroimidazoles"],
    indications: "Amoebiasis, giardiasis, dental abscess, pelvic infections"
  },
  {
    name: "Co-trimoxazole 480mg Tablet",
    brand: "Bactrim / Septra / Trisul",
    generic: "Trimethoprim + Sulfamethoxazole",
    category: "Antibiotics",
    strength: "480mg",
    defaultDose: "Take 2 tablets twice a day (BD)",
    defaultDays: "5",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Sulfa", "Sulfonamides", "Sulfa Drugs"],
    indications: "Uncomplicated UTI, exacerbation of chronic bronchitis, traveler's diarrhea"
  },
  {
    name: "Metformin 500mg Tablet",
    brand: "Glucophage / Cetapin",
    generic: "Metformin Hydrochloride",
    category: "Diabetes",
    strength: "500mg",
    defaultDose: "Take 1 tablet twice a day (BD)",
    defaultDays: "30",
    defaultMeal: "With Meals",
    contraindicatedAllergies: ["Metformin"],
    indications: "Type 2 Diabetes Mellitus glycemic management (First-line Biguanide)"
  },
  {
    name: "Metformin 1000mg Tablet",
    brand: "Glucophage XR 1000",
    generic: "Metformin Hydrochloride Extended Release",
    category: "Diabetes",
    strength: "1000mg",
    defaultDose: "Take 1 tablet with dinner (OD)",
    defaultDays: "30",
    defaultMeal: "With Meals",
    contraindicatedAllergies: ["Metformin"],
    indications: "Type 2 Diabetes Mellitus ongoing glycemic maintenance"
  },
  {
    name: "Glibenclamide 5mg Tablet",
    brand: "Daonil",
    generic: "Glibenclamide (Glyburide)",
    category: "Diabetes",
    strength: "5mg",
    defaultDose: "Take 1 tablet before breakfast (OD)",
    defaultDays: "30",
    defaultMeal: "Before Meals",
    contraindicatedAllergies: ["Sulfa", "Sulfonylureas"],
    indications: "Type 2 Diabetes Mellitus insulin secretagogue"
  },
  {
    name: "Amlodipine 5mg Tablet",
    brand: "Norvasc / Amlong",
    generic: "Amlodipine Besylate",
    category: "Cardio & BP",
    strength: "5mg",
    defaultDose: "Take 1 tablet daily in morning (OD)",
    defaultDays: "30",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Amlodipine", "Dihydropyridines"],
    indications: "Essential hypertension, stable angina pectoris"
  },
  {
    name: "Losartan Potassium 50mg Tablet",
    brand: "Cozaar / Losacar",
    generic: "Losartan Potassium",
    category: "Cardio & BP",
    strength: "50mg",
    defaultDose: "Take 1 tablet daily in morning (OD)",
    defaultDays: "30",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Losartan", "ARB"],
    indications: "Hypertension, diabetic nephropathy, cardio-renal protection"
  },
  {
    name: "Atorvastatin 20mg Tablet",
    brand: "Lipitor / Storvas",
    generic: "Atorvastatin Calcium",
    category: "Cardio & BP",
    strength: "20mg",
    defaultDose: "Take 1 tablet at night bedtime (Nocte)",
    defaultDays: "30",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Atorvastatin", "Statins"],
    indications: "Primary hypercholesterolemia, cardiovascular risk reduction"
  },
  {
    name: "Salbutamol Inhaler 100mcg",
    brand: "Ventolin Evohaler / Asthalin",
    generic: "Salbutamol (Albuterol) Sulfate",
    category: "Respiratory",
    strength: "100mcg/puff",
    defaultDose: "Inhale 2 puffs as needed for wheeze (PRN)",
    defaultDays: "30",
    defaultMeal: "As required / regardless of meals",
    contraindicatedAllergies: ["Salbutamol"],
    indications: "Acute bronchospasm, asthma exacerbation, COPD wheeze relief"
  },
  {
    name: "Prednisolone 5mg Tablet",
    brand: "Predlone / Deltasone",
    generic: "Prednisolone",
    category: "Steroids & Other",
    strength: "5mg",
    defaultDose: "Take 4 tablets (20mg) in morning (OD)",
    defaultDays: "5",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Prednisolone", "Steroids"],
    indications: "Acute asthma flare, severe allergic reactions, contact dermatitis"
  },
  {
    name: "Omeprazole 20mg Capsule",
    brand: "Losec / Ocid / Omez",
    generic: "Omeprazole",
    category: "Gastric & GI",
    strength: "20mg",
    defaultDose: "Take 1 capsule 30 mins before breakfast (OD)",
    defaultDays: "14",
    defaultMeal: "Before Meals",
    contraindicatedAllergies: ["Omeprazole", "PPI"],
    indications: "Gastroesophageal reflux disease (GERD), gastritis, NSAID ulcer prophylaxis"
  },
  {
    name: "Pantoprazole 40mg Tablet",
    brand: "Pan 40 / Pantocid",
    generic: "Pantoprazole Sodium",
    category: "Gastric & GI",
    strength: "40mg",
    defaultDose: "Take 1 tablet once daily before breakfast (OD)",
    defaultDays: "14",
    defaultMeal: "Before Meals",
    contraindicatedAllergies: ["Pantoprazole", "PPI"],
    indications: "Severe acid reflux, erosive esophagitis, gastric acidity"
  },
  {
    name: "Cetirizine HCl 10mg Tablet",
    brand: "Zyrtec / Alerid / Cetzine",
    generic: "Cetirizine Hydrochloride",
    category: "Antihistamine & Allergy",
    strength: "10mg",
    defaultDose: "Take 1 tablet at night (Nocte)",
    defaultDays: "7",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Cetirizine", "Hydroxyzine"],
    indications: "Allergic rhinitis, urticaria, pruritus, seasonal hay fever"
  },
  {
    name: "Chlorpheniramine 4mg Tablet",
    brand: "Piriton / Antihist",
    generic: "Chlorpheniramine Maleate",
    category: "Antihistamine & Allergy",
    strength: "4mg",
    defaultDose: "Take 1 tablet at night bedtime",
    defaultDays: "5",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Chlorpheniramine"],
    indications: "Acute allergy relief, insect bites, watery eyes, sneezing"
  },
  {
    name: "Diclofenac Sodium 50mg Tablet",
    brand: "Voltaren / Voveran",
    generic: "Diclofenac Sodium",
    category: "Analgesics & Pain",
    strength: "50mg",
    defaultDose: "Take 1 tablet twice a day (BD)",
    defaultDays: "5",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Aspirin", "Diclofenac", "NSAIDs"],
    indications: "Osteoarthritis flare, joint inflammation, acute musculoskeletal injury"
  },
  {
    name: "Mefenamic Acid 500mg Tablet",
    brand: "Ponstan",
    generic: "Mefenamic Acid",
    category: "Analgesics & Pain",
    strength: "500mg",
    defaultDose: "Take 1 tablet three times a day (TDS)",
    defaultDays: "3",
    defaultMeal: "After Meals",
    contraindicatedAllergies: ["Aspirin", "NSAIDs"],
    indications: "Primary dysmenorrhea, dental pain, moderate inflammatory aches"
  },
  {
    name: "Oral Rehydration Salts (ORS)",
    brand: "Jeevani / Electral",
    generic: "Sodium Chloride + Potassium Chloride + Glucose + Citrate",
    category: "Gastric & GI",
    strength: "Standard WHO Sachet",
    defaultDose: "Dissolve 1 sachet in 1L boiled water; sip frequently",
    defaultDays: "3",
    defaultMeal: "As required / regardless of meals",
    contraindicatedAllergies: [],
    indications: "Acute gastroenteritis, diarrhea dehydration, heat fatigue"
  },
  {
    name: "Vitamin B Complex & Zinc Tablet",
    brand: "Becozinc / Neurobion",
    generic: "Vit B1, B2, B6, B12, Niacinamide + Zinc",
    category: "Vitamins & Minerals",
    strength: "High Potency Multi-B",
    defaultDose: "Take 1 tablet daily with food (OD)",
    defaultDays: "30",
    defaultMeal: "After Meals",
    contraindicatedAllergies: [],
    indications: "Peripheral neuropathy, convalescence, dietary supplementation"
  }
];

export function parseMedicineInstruction(item: string) {
  const match = item.match(/^(.*?)\[(.*?)\]$/);
  if (match) {
    const medName = match[1].trim();
    const detailsStr = match[2].trim();
    const parts = detailsStr.split(",");
    const instruction = parts[0] ? parts[0].trim() : "";
    const days = parts[1] ? parts[1].replace(/for|days/g, "").trim() : "";
    const meal = parts[2] ? parts[2].trim() : "";
    return {
      formatted: true,
      name: medName,
      instruction,
      days: days ? `${days} Days` : "",
      meal
    };
  }
  return {
    formatted: false,
    name: item,
    instruction: "",
    days: "",
    meal: ""
  };
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState("");
  const [sessionHospitalId, setSessionHospitalId] = useState(HOSPITAL_PRIMECARE);
  const [sessionBranchId, setSessionBranchId] = useState(BRANCH_COLOMBO);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roleDefs, setRoleDefs] = useState<RoleDefinition[]>([]);
  const [memberships, setMemberships] = useState<StaffMembership[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffDirectory, setStaffDirectory] = useState<StaffProvider[]>([]);

  // Navigation tab routing
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Global Sync State (clinic JSON store + live Suwasiri App Firestore bookings)
  const [clinicPatients, setPatients] = useState<Patient[]>([]);
  const [reviewedLabKeys, setReviewedLabKeys] = useState<Record<string, true>>({});
  const [clinicAppointments, setAppointments] = useState<Appointment[]>([]);
  const [suwasiriAppointments, setSuwasiriAppointments] = useState<Appointment[]>([]);
  const [suwasiriPatients, setSuwasiriPatients] = useState<Patient[]>([]);
  const [suwasiriVaccinePatients, setSuwasiriVaccinePatients] = useState<Patient[]>([]);
  const [suwasiriCharts, setSuwasiriCharts] = useState<Record<string, SuwasiriChartPatch>>({});
  const patients = useMemo(
    () =>
      mergePatients(
        clinicPatients,
        mergePatients(suwasiriPatients, suwasiriVaccinePatients)
      ).map((p) => {
        const patched = applySuwasiriChart(p, suwasiriCharts[p.id]);
        if (!patched.labResults?.length) return patched;
        return {
          ...patched,
          labResults: patched.labResults.map((lr) =>
            reviewedLabKeys[`${patched.id}:${lr.id}`]
              ? { ...lr, doctorReviewed: true }
              : lr
          ),
        };
      }),
    [clinicPatients, suwasiriPatients, suwasiriVaccinePatients, suwasiriCharts, reviewedLabKeys]
  );
  const appointments = useMemo(
    () => mergeAppointments(clinicAppointments, suwasiriAppointments),
    [clinicAppointments, suwasiriAppointments]
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [billing, setBilling] = useState<Billing[]>([]);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [clinicMessages, setClinicMessages] = useState<ClinicMessage[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sampleCollections, setSampleCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const staffMatch = authUser && !loading ? staffForAuthUser(authUser, staffUsers) : undefined;
  const sessionUser = staffMatch || staffUsers.find((u) => u.id === sessionUserId);
  const isPlatformSA = sessionUser?.platformRole === "platform_super_admin";
  const isPatientOnly = Boolean(authUser) && !loading && !staffMatch;
  const resolvedUserId = sessionUserId || staffMatch?.id || "";
  const activeMembership = memberships.find(
    (m) => m.userId === resolvedUserId && m.hospitalId === sessionHospitalId && m.active
  );
  const activeRole = roleDefs.find((r) => r.id === activeMembership?.roleId);
  const currentRole = isPlatformSA ? "Platform Super Admin" : isPatientOnly ? "Patient" : (activeRole?.name || "Doctor");
  const activeHospital = hospitals.find((h) => h.id === sessionHospitalId);
  const activeBranch = branches.find((b) => b.id === sessionBranchId);
  const canEditRbac = isGovernanceEditor(activeRole, isPlatformSA);
  const canOpen = (tab: string) => {
    if (isPatientOnly) return tab === "patientPortal" || tab === "publicBooking";
    return tabAllowed(tab, activeRole, isPlatformSA);
  };

  const applyUser = (userId: string) => {
    setSessionUserId(userId);
    const user = staffUsers.find((u) => u.id === userId);
    if (user?.platformRole === "platform_super_admin") {
      return;
    }
    const mems = memberships.filter((m) => m.userId === userId && m.active);
    const mem = mems[0];
    if (!mem) return;
    setSessionHospitalId(mem.hospitalId);
    setSessionBranchId(mem.branchIds[0] || sessionBranchId);
    const role = roleDefs.find((r) => r.id === mem.roleId);
    setActiveTab(defaultTabFor(role, false));
  };

  const applyHospital = (hospitalId: string) => {
    setSessionHospitalId(hospitalId);
    const mem = memberships.find((m) => m.userId === sessionUserId && m.hospitalId === hospitalId && m.active);
    if (mem) {
      setSessionBranchId(mem.branchIds[0] || sessionBranchId);
      if (!isPlatformSA) {
        setActiveTab(defaultTabFor(roleDefs.find((r) => r.id === mem.roleId), false));
      }
      return;
    }
    const firstBranch = branches.find((b) => b.hospitalId === hospitalId);
    if (firstBranch) setSessionBranchId(firstBranch.id);
  };

  const requestTab = (tab: string) => {
    if (isPatientOnly && tab !== "patientPortal" && tab !== "publicBooking") {
      alert("This Firebase account has no staff membership. Use the Patient Portal, or ask a Hospital Super Admin to assign a role.");
      return;
    }
    if (!tabAllowed(tab, activeRole, isPlatformSA)) {
      alert(`Your ${currentRole} role does not have permission to open this module.`);
      return;
    }
    setActiveTab(tab);
    setSelectedConsultPatient(null);
  };

  // Interface view overlays
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [focusedSearchPatientId, setFocusedSearchPatientId] = useState<string | null>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState<boolean>(false);
  const [highlightSampleId, setHighlightSampleId] = useState<string | null>(null);
  const [dispatchTestFilter, setDispatchTestFilter] = useState<string>("ALL");
  const [selectedConsultPatient, setSelectedConsultPatient] = useState<Patient | null>(null);
  
  // Modal controllers
  const [showAptModal, setShowAptModal] = useState<boolean>(false);
  const [showPatientModal, setShowPatientModal] = useState<boolean>(false);
  const [showCustomAlertModal, setShowCustomAlertModal] = useState<boolean>(false);
  const [showLedgerExplorer, setShowLedgerExplorer] = useState<boolean>(false);
  const [activeReceiptRx, setActiveReceiptRx] = useState<{ patient: Patient; prescription: PrescriptionRecord } | null>(null);
  const [activeHubPatient, setActiveHubPatient] = useState<Patient | null>(null);
  const [activeHubInitialTab, setActiveHubInitialTab] = useState<"history" | "vaccines" | "labs" | "prescriptions" | "mc">("history");
  const [lastOnlineBookingResult, setLastOnlineBookingResult] = useState<any | null>(null);
  const [barcodeSearchText, setBarcodeSearchText] = useState<string>("");
  const [barcodeLoading, setBarcodeLoading] = useState<boolean>(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedReceiptPatientName, setSelectedReceiptPatientName] = useState<string>("");

  // Bp Premier Doctor Portal & Patient Clinical Record Modal
  const [activeDoctorRecordPatient, setActiveDoctorRecordPatient] = useState<Patient | null>(null);
  const [showCalculatorsModal, setShowCalculatorsModal] = useState<boolean>(false);
  const [selectedPatientForPortal, setSelectedPatientForPortal] = useState<Patient | null>(null);

  // Recalls & Preventive Health Reminders State
  const [recalls, setRecalls] = useState<RecallRecord[]>([
    {
      id: "rec-1",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      patientPhone: "+94 77 982 1100",
      patientEmail: "fatima.zahra@email.lk",
      category: "Diabetes Review",
      urgency: "HIGH",
      dueDate: "2026-08-25",
      status: "DUE",
      notes: "6-monthly HbA1c, microalbuminuria check, and diabetic foot sensory exam",
      assignedDoctor: "Dr. Priyantha Silva"
    },
    {
      id: "rec-2",
      patientId: "1028-LK",
      patientName: "Sunil Jayawardena",
      patientPhone: "+94 71 345 8899",
      patientEmail: "sunil.j@email.lk",
      category: "Pathology Follow-up",
      urgency: "HIGH",
      dueDate: "2026-08-20",
      status: "DUE",
      notes: "Elevated Fasting Lipid Profile (Cholesterol 6.8 mmol/L, LDL 4.2). Review statin therapy.",
      assignedDoctor: "Dr. Priyantha Silva"
    },
    {
      id: "rec-3",
      patientId: "4491-LK",
      patientName: "Kamala Wickramasinghe",
      patientPhone: "+94 77 234 5566",
      patientEmail: "kamala.w@email.lk",
      category: "Immunisation",
      urgency: "ROUTINE",
      dueDate: "2026-09-01",
      status: "SMS_SENT",
      lastContactedDate: "2026-08-14",
      contactMethod: "SMS",
      notes: "Seasonal Influenza Vaccine (Fluarix Tetra) booster due",
      assignedDoctor: "Dr. Anoja Senanayake"
    },
    {
      id: "rec-4",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      patientPhone: "+94 77 982 1100",
      patientEmail: "fatima.zahra@email.lk",
      category: "Cervical Screening",
      urgency: "MEDIUM",
      dueDate: "2026-09-15",
      status: "DUE",
      notes: "National Cervical Screening Program (CST) 5-yearly routine interval",
      assignedDoctor: "Dr. Anoja Senanayake"
    },
    {
      id: "rec-5",
      patientId: "1028-LK",
      patientName: "Sunil Jayawardena",
      patientPhone: "+94 71 345 8899",
      patientEmail: "sunil.j@email.lk",
      category: "Care Plan Review",
      urgency: "MEDIUM",
      dueDate: "2026-09-30",
      status: "DUE",
      notes: "Chronic Disease GPMP (Item 721) and Team Care Arrangement (Item 723) 6-month review",
      assignedDoctor: "Dr. Priyantha Silva"
    }
  ]);

  // Clinical Alert Deep Warning Modal
  const [selectedAlertForDetails, setSelectedAlertForDetails] = useState<Alert | null>(null);
  const [showAllAlertsModal, setShowAllAlertsModal] = useState<boolean>(false);

  // Lobby Schedule states
  const [lobbyFilterStatus, setLobbyFilterStatus] = useState<string>("ALL");
  const [lobbySearchQuery, setLobbySearchQuery] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedClinicDate, setSelectedClinicDate] = useState(() => formatDateKey(new Date()));

  // GP Exam Room Medication Search Bar states
  const [medSearchQuery, setMedSearchQuery] = useState<string>("");
  const [medCategoryFilter, setMedCategoryFilter] = useState<string>("All");
  const [medSearchFocused, setMedSearchFocused] = useState<boolean>(false);
  const [selectedFormularyDrug, setSelectedFormularyDrug] = useState<DrugFormularyItem | null>(null);

  // Form input variables
  const [newTaskText, setNewTaskText] = useState<string>("");
  const [headerSearchPlaceholder, setHeaderSearchPlaceholder] = useState<string>("Search Patients, Lab Orders, or eRx...");

  // Appointment states
  const [newAptPatientId, setNewAptPatientId] = useState<string>("");
  const [newAptTime, setNewAptTime] = useState<string>("09:00 AM");
  const [newAptReason, setNewAptReason] = useState<string>("General Health Checkup");
  const [newAptStatus, setNewAptStatus] = useState<Appointment["status"]>("SCHEDULED");
  const [newAptDate, setNewAptDate] = useState<string>(formatDateKey(new Date()));

  // Consultation active desk states
  const [consultNotes, setConsultNotes] = useState<string>("");
  const [consultSelectedMed, setConsultSelectedMed] = useState<string>("");
  const [consultCustomMed, setConsultCustomMed] = useState<string>("");
  const [consultAllergiesStr, setConsultAllergiesStr] = useState<string>("");
  const [consultMedsList, setConsultMedsList] = useState<string[]>([]);
  const [suwasiriRxSyncing, setSuwasiriRxSyncing] = useState(false);
  const [suwasiriRxSyncMsg, setSuwasiriRxSyncMsg] = useState<string | null>(null);
  const [consultMedInstruction, setConsultMedInstruction] = useState<string>("Take 1 tablet twice a day");
  const [consultMedDays, setConsultMedDays] = useState<string>("5");
  const [consultMedMeal, setConsultMedMeal] = useState<string>("After Meal");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>("");

  // Patient registration states
  const [newPatName, setNewPatName] = useState<string>("");
  const [newPatAge, setNewPatAge] = useState<string>("");
  const [newPatGender, setNewPatGender] = useState<string>("Male");
  const [newPatBlood, setNewPatBlood] = useState<string>("O+");
  const [newPatAllergies, setNewPatAllergies] = useState<string>("");
  const [newPatPhone, setNewPatPhone] = useState<string>("+94 77 ");
  const [newPatEmail, setNewPatEmail] = useState<string>("");
  const [newPatNotes, setNewPatNotes] = useState<string>("");
  const [newPatHistoryText, setNewPatHistoryText] = useState<string>("");
  const [newPatMedicalCenter, setNewPatMedicalCenter] = useState<string>("Colombo Central Clinic");

  // Alert builder states
  const [customAlertType, setCustomAlertType] = useState<string>("CRITICAL LAB RESULT");
  const [customAlertTitle, setCustomAlertTitle] = useState<string>("");
  const [customAlertText, setCustomAlertText] = useState<string>("");
  const [customAlertSeverity, setCustomAlertSeverity] = useState<"critical" | "high" | "medium">("high");

  // Admin and Secure Broadcast dispatch inputs
  const [newAdminDrugName, setNewAdminDrugName] = useState("");
  const [smsTargetPatient, setSmsTargetPatient] = useState<string>("");
  const [smsTransport, setSmsTransport] = useState<"WhatsApp" | "SMS">("WhatsApp");
  const [smsTemplate, setSmsTemplate] = useState<string>("PRESCRIPTION_READY");
  const [smsCustomText, setSmsCustomText] = useState<string>("");

  // Expenses management states
  const [newExpCategory, setNewExpCategory] = useState<string>("Medical Supplies");
  const [newExpAmount, setNewExpAmount] = useState<string>("");
  const [newExpDescription, setNewExpDescription] = useState<string>("");
  const [newExpDate, setNewExpDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Ledger detailed explorer states
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>("");
  const [ledgerFilterTab, setLedgerFilterTab] = useState<"all" | "income" | "expense">("all");
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>("all");

  // Secure clinic chat active channel
  const [activeChannel, setActiveChannel] = useState<string>("#general-clinical");

  // Fetch initial client-server state
  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clinical-state");
      const data = await res.json();
      setPatients(data.patients || []);
      setAppointments(data.appointments || []);
      setAlerts(data.alerts || []);
      setTasks(data.tasks || []);
      setBilling(data.billing || []);
      setDrugs(data.drugs || []);
      setNotifications(data.notifications || []);
      setClinicMessages(data.clinicMessages || []);
      setLabOrders(data.labOrders || []);
      setExpenses(data.expenses || []);
      setSampleCollections(data.sampleCollections || []);
      setHospitals(data.hospitals || []);
      setBranches(data.branches || []);
      setRoleDefs(data.roles || []);
      setMemberships(data.memberships || []);
      setStaffUsers(data.staffUsers || []);
      setStaffDirectory(data.staffDirectory || []);
      
      // Auto-set first patient id for appointment book dropdown
      if (data.patients && data.patients.length > 0) {
        setNewAptPatientId(data.patients[0].id);
      }
    } catch (error) {
      console.error("Error fetching state:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    if (!authUser || !isFirebaseConfigured()) {
      setSuwasiriAppointments([]);
      setSuwasiriPatients([]);
      setSuwasiriVaccinePatients([]);
      return;
    }
    const unsubAppt = subscribeSuwasiriAppointments((apts, pats) => {
      setSuwasiriAppointments(apts);
      setSuwasiriPatients(pats);
    });
    const unsubVax = subscribeSuwasiriVaccinePatients((pats) => {
      setSuwasiriVaccinePatients(pats);
    });
    return () => {
      unsubAppt?.();
      unsubVax?.();
    };
  }, [authUser?.uid]);

  const suwasiriPatientIdsKey = useMemo(
    () =>
      [
        ...new Set([
          ...suwasiriAppointments.map((a) => a.patientId),
          ...suwasiriVaccinePatients.map((p) => p.id),
        ].filter(Boolean)),
      ]
        .sort()
        .join(","),
    [suwasiriAppointments, suwasiriVaccinePatients]
  );

  useEffect(() => {
    if (!authUser || !isFirebaseConfigured() || !suwasiriPatientIdsKey) {
      setSuwasiriCharts({});
      return;
    }
    const ids = suwasiriPatientIdsKey.split(",").filter(Boolean);
    return subscribeSuwasiriPatientCharts(ids, (patientId, patch) => {
      setSuwasiriCharts((prev) => ({ ...prev, [patientId]: patch }));
    });
  }, [authUser?.uid, suwasiriPatientIdsKey]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "suwasiri-rbac-rev") fetchState();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setAuthReady(true);
      return;
    }
    return subscribeAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      setSessionUserId("");
      return;
    }
    if (loading) return;
    const staff = staffForAuthUser(authUser, staffUsers);
    if (staff) {
      applyUser(staff.id);
    } else {
      setSessionUserId("");
      setActiveTab("patientPortal");
    }
  }, [authUser?.uid, authUser?.email, staffUsers, loading]);

  useEffect(() => {
    if (!authUser || loading) return;
    if (isPatientOnly) {
      if (activeTab !== "patientPortal" && activeTab !== "publicBooking") {
        setActiveTab("patientPortal");
      }
      return;
    }
    if (!tabAllowed(activeTab, activeRole, isPlatformSA)) {
      setActiveTab(defaultTabFor(activeRole, isPlatformSA));
    }
  }, [roleDefs, activeTab, activeRole, isPlatformSA, isPatientOnly, authUser, loading]);

  const handleSyncState = () => {
    fetchState();
  };

  const hospitalRoles = roleDefs.filter((r) => r.hospitalId === sessionHospitalId);
  const hospitalStaff = staffDirectory.filter((s) => s.hospitalId === sessionHospitalId);
  const hospitalBranches = branches.filter((b) => b.hospitalId === sessionHospitalId);
  const hospitalPatients = patients.filter((p) => (p.hospitalId || HOSPITAL_PRIMECARE) === sessionHospitalId);
  const tenantAppointments = appointments.filter((a) => {
    if (a.hospitalId) return a.hospitalId === sessionHospitalId;
    const p = patients.find((pt) => pt.id === a.patientId);
    return !p || (p.hospitalId || HOSPITAL_PRIMECARE) === sessionHospitalId;
  });
  const todayKey = formatDateKey(new Date());
  const dayAppointments = tenantAppointments
    .filter((a) => a.date === selectedClinicDate)
    .slice()
    .sort(compareAppointmentTime);
  const appointmentCountsByDate = tenantAppointments.reduce((acc, a) => {
    if (!a.date) return acc;
    acc[a.date] = (acc[a.date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const jumpToToday = () => {
    const n = new Date();
    setCalendarMonth({ year: n.getFullYear(), month: n.getMonth() });
    setSelectedClinicDate(formatDateKey(n));
    setNewAptDate(formatDateKey(n));
  };
  const selectClinicDate = (dateKey: string) => {
    setSelectedClinicDate(dateKey);
    setNewAptDate(dateKey);
  };
  const clinicCalendar = (
    <ClinicMonthCalendar
      year={calendarMonth.year}
      month={calendarMonth.month}
      selectedDate={selectedClinicDate}
      todayKey={todayKey}
      countsByDate={appointmentCountsByDate}
      onSelectDate={selectClinicDate}
      onChangeMonth={(year, month) => setCalendarMonth({ year, month })}
      onJumpToToday={jumpToToday}
    />
  );

  const persistRoles = async (roles: RoleDefinition[]) => {
    const res = await fetch("/api/tenancy/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalId: sessionHospitalId, roles }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Could not save RBAC policy.");
    }
    if (data.roles) {
      setRoleDefs((prev) => [...prev.filter((r) => r.hospitalId !== sessionHospitalId), ...data.roles]);
    } else {
      fetchState();
    }
    try {
      localStorage.setItem("suwasiri-rbac-rev", String(Date.now()));
    } catch {
      /* ignore quota / private mode */
    }
  };

  const addHospitalRole = async (name: string, cloneFromRoleId: string) => {
    const res = await fetch("/api/tenancy/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalId: sessionHospitalId, name, cloneFromRoleId }),
    });
    const data = await res.json();
    if (data.role) setRoleDefs((prev) => [...prev, data.role]);
    else fetchState();
  };

  const removeHospitalRole = async (roleId: string) => {
    const res = await fetch(`/api/tenancy/roles/${roleId}`, { method: "DELETE" });
    if (res.ok) setRoleDefs((prev) => prev.filter((r) => r.id !== roleId));
    else {
      const err = await res.json().catch(() => ({ error: "Unable to remove role" }));
      alert(err.error || "Unable to remove role");
    }
  };

  const persistStaffDirectory = async (next: StaffProvider[]) => {
    await fetch("/api/tenancy/staff-directory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalId: sessionHospitalId, staffDirectory: next }),
    });
    setStaffDirectory((prev) => [...prev.filter((s) => s.hospitalId !== sessionHospitalId), ...next]);
  };

  const persistBranches = async (action: "create" | "update" | "delete", payload: any) => {
    if (action === "create") {
      const res = await fetch("/api/tenancy/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId: sessionHospitalId, ...payload }),
      });
      const data = await res.json();
      if (data.branch) setBranches((prev) => [...prev, data.branch]);
    } else if (action === "update") {
      const res = await fetch(`/api/tenancy/branches/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.branch) setBranches((prev) => prev.map((b) => (b.id === data.branch.id ? data.branch : b)));
    } else {
      await fetch(`/api/tenancy/branches/${payload.id}`, { method: "DELETE" });
      setBranches((prev) => prev.filter((b) => b.id !== payload.id));
    }
  };

  // Consultation Room activator
  const handleStartConsultation = (patient: Patient) => {
    setSelectedConsultPatient(patient);
    setConsultNotes(patient.notes || "");
    setConsultAllergiesStr(patient.allergies || "");
    setConsultMedsList(patient.activeMedications || []);
    setConsultCustomMed("");
    setConsultSelectedMed("");
    setAiAnalysisResult("");
    setSuwasiriRxSyncMsg(null);
    setActiveTab("clinical");
  };

  const [telehealthFocus, setTelehealthFocus] = useState<{
    patientId: string;
    appointmentId: string;
  } | null>(null);

  const openBookedPatient = (apt: Appointment, p?: Patient | null) => {
    const person = p || stubPatientFromBooking(apt);
    if (isVideoBooking(apt)) {
      setTelehealthFocus({ patientId: person.id, appointmentId: apt.id });
      setActiveTab("telehealth");
      return;
    }
    handleStartConsultation(person);
  };

  // Tasks checklist controls
  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTaskText, dueDate: "Due: End of Shift" }),
      });
      const data = await res.json();
      setTasks(data.state.tasks);
      setNewTaskText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id: string, checked: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: checked }),
      });
      const data = await res.json();
      setTasks(data.state.tasks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      setTasks(data.state.tasks);
    } catch (err) {
      console.error(err);
    }
  };

  // Urgent Emergency clinical alert creator
  const handleCreateCustomAlert = async (e: FormEvent) => {
    e.preventDefault();
    if (!customAlertTitle.trim()) return;
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: customAlertType,
          title: customAlertTitle,
          text: customAlertText,
          severity: customAlertSeverity
        })
      });
      const data = await res.json();
      setAlerts(data.state.alerts);
      setCustomAlertTitle("");
      setCustomAlertText("");
      setShowCustomAlertModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      const data = await res.json();
      setAlerts(data.state.alerts);
    } catch (err) {
      console.error(err);
    }
  };

  // Appointment creation
  const handleCreateAppointment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAptPatientId || !newAptReason) return;
    try {
      const patient = patients.find((p) => p.id === newAptPatientId);
      const doctorName = sessionUser?.name || "Dr. Priyantha Silva";
      const doctorId = suwasiriDoctorCatalogId({
        staffUserId: sessionUser?.id,
        doctorName,
      });
      const slotResult = await bookGpCareSlotToFirestore({
        patientId: newAptPatientId,
        patientName: patient?.name || "Patient",
        patientEmail: patient?.email,
        patientPhone: patient?.phone,
        date: newAptDate,
        time: newAptTime,
        reason: newAptReason,
        doctorId,
        doctorName,
        hospitalId: patient?.hospitalId,
        branchId: patient?.branchId,
        clinicName: patient?.medicalCenter,
      });
      if (!slotResult.ok) {
        alert(slotResult.reason);
        return;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: newAptPatientId,
          time: newAptTime,
          reason: newAptReason,
          status: newAptStatus,
          date: newAptDate
        })
      });
      const data = await res.json();
      setAppointments(data.state.appointments);
      setBilling(data.state.billing);
      setShowAptModal(false);
      alert("Appointment registered — synced to Suwasiri App slot calendar.");
    } catch (err) {
      console.error(err);
      alert("Could not book slot. It may already be taken.");
    }
  };

  const handleCheckInWalkIn = async (pat: Patient) => {
    try {
      const now = new Date();
      let timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: pat.id,
          time: timeStr,
          reason: "In-Clinic Walk-In Consultation",
          status: "CHECKED IN",
          date: new Date().toISOString().split("T")[0]
        })
      });
      if (!res.ok) throw new Error("Check-in failed");
      const data = await res.json();
      setAppointments(data.state.appointments);
      setBilling(data.state.billing);
      
      // Auto redirect to lobby schedule dashboard tab
      setActiveTab("dashboard");
      // Close active patient details hub if open
      setActiveHubPatient(null);
      
      alert(`⚡ Walk-In Success! ${pat.name} (ID: ${pat.id}) is checked in for today and is now listed under the active Lobby Schedule.`);
    } catch (err: any) {
      alert("Error booking walk-in: " + err.message);
    }
  };

  const handleUpdateAptStatus = async (id: string, status: Appointment["status"]) => {
    const isSuwasiri = suwasiriAppointments.some((a) => a.id === id);
    if (isSuwasiri) {
      setSuwasiriAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      try {
        await updateSuwasiriAppointmentStatus(id, status);
      } catch (err) {
        console.error(err);
      }
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.state?.appointments) setAppointments(data.state.appointments);
    } catch (err) {
      console.error(err);
    }
  };

  // Move Appointment Position (Change Patient Place in Queue)
  const handleMoveAppointment = async (id: string, direction: "up" | "down" | "top") => {
    try {
      const dayList = appointments.filter((a) => a.date === selectedClinicDate);
      const currentIndex = dayList.findIndex((a) => a.id === id);
      if (currentIndex === -1) return;

      const reorderedDay = [...dayList];
      const [movedItem] = reorderedDay.splice(currentIndex, 1);
      if (direction === "top") {
        reorderedDay.unshift(movedItem);
      } else if (direction === "up") {
        reorderedDay.splice(Math.max(0, currentIndex - 1), 0, movedItem);
      } else {
        reorderedDay.splice(Math.min(reorderedDay.length, currentIndex + 1), 0, movedItem);
      }

      let dayCursor = 0;
      const updated = appointments.map((a) =>
        a.date === selectedClinicDate ? reorderedDay[dayCursor++] : a
      );
      setAppointments(updated);

      const res = await fetch("/api/appointments/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointments: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appointments) setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Failed to move appointment place:", err);
    }
  };

  const handleChangeAppointmentPlace = async (id: string, targetPlaceNum: number) => {
    try {
      const dayList = appointments.filter((a) => a.date === selectedClinicDate);
      const currentIndex = dayList.findIndex((a) => a.id === id);
      if (currentIndex === -1) return;
      const targetIndex = Math.max(0, Math.min(dayList.length - 1, targetPlaceNum - 1));
      if (currentIndex === targetIndex) return;

      const reorderedDay = [...dayList];
      const [movedItem] = reorderedDay.splice(currentIndex, 1);
      reorderedDay.splice(targetIndex, 0, movedItem);

      let dayCursor = 0;
      const updated = appointments.map((a) =>
        a.date === selectedClinicDate ? reorderedDay[dayCursor++] : a
      );
      setAppointments(updated);

      const res = await fetch("/api/appointments/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointments: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appointments) setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Failed to reorder appointment place:", err);
    }
  };

  // Register New Patient file
  const handleRegisterPatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPatName || !newPatAge) return;
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatName,
          age: newPatAge,
          gender: newPatGender,
          bloodType: newPatBlood,
          allergies: newPatAllergies || "None declared",
          phone: newPatPhone,
          email: newPatEmail,
          notes: newPatNotes,
          medicalHistory: newPatHistoryText || "No systemic chronic conditions declared",
          medicalCenter: newPatMedicalCenter
        })
      });
      const data = await res.json();
      setPatients(data.state.patients);
      
      setNewPatName("");
      setNewPatAge("");
      setNewPatAllergies("");
      setNewPatNotes("");
      setNewPatHistoryText("");
      setNewPatMedicalCenter("Colombo Central Clinic");
      setShowPatientModal(false);
      alert(`Successfully registered patient registry file: ${data.patient.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Consultation items manager inside Consultation Lobby
  const handleAddPrescriptionToConsult = () => {
    const medBase = consultSelectedMed === "other" ? consultCustomMed : consultSelectedMed;
    if (!medBase) return;
    const formattedMed = `${medBase} [${consultMedInstruction}, for ${consultMedDays} days, ${consultMedMeal}]`;
    if (consultMedsList.includes(formattedMed)) return;
    setConsultMedsList([...consultMedsList, formattedMed]);
    setConsultCustomMed("");
    setConsultSelectedMed("");
    // Reset to friendly default values
    setConsultMedInstruction("Take 1 tablet twice a day");
    setConsultMedDays("5");
    setConsultMedMeal("After Meal");
  };

  const handleRemovePrescriptionFromConsult = (med: string) => {
    setConsultMedsList(consultMedsList.filter(m => m !== med));
  };

  const handleSyncDrugsToSuwasiri = async (): Promise<{ count: number; code: string } | null> => {
    if (!selectedConsultPatient) return null;
    if (consultMedsList.length === 0) {
      setSuwasiriRxSyncMsg("Select medicines first, then sync to the patient’s Suwasiri Vault.");
      return null;
    }
    setSuwasiriRxSyncing(true);
    setSuwasiriRxSyncMsg(null);
    try {
      const matchApt = appointments.find(
        (a) => a.patientId === selectedConsultPatient.id && a.status !== "COMPLETED"
      );
      const rxNum = `RX-SL-${Math.floor(10000 + Math.random() * 90000)}`;
      const result = await issuePrescriptionsToSuwasiri({
        patientId: selectedConsultPatient.id,
        doctorName: sessionUser?.name || "Dr. Priyantha Silva",
        clinicName:
          activeHospital?.name ||
          selectedConsultPatient.medicalCenter ||
          "PrimeCare Medical Centre - Colombo Central",
        medicines: consultMedsList,
        sessionId: matchApt?.id,
        rxNumber: rxNum,
        prescriberNumber: "12908",
      });
      if (!result) {
        setSuwasiriRxSyncMsg("Could not reach Suwasiri (check Firebase). The patient will not see this e-Rx yet.");
        return null;
      }
      setSuwasiriRxSyncMsg(
        `${result.count} medicine(s) synced. The patient can open Suwasiri → Vault → E-Prescription.`
      );
      return result;
    } catch (err) {
      console.error(err);
      setSuwasiriRxSyncMsg("Suwasiri sync failed. Try again.");
      return null;
    } finally {
      setSuwasiriRxSyncing(false);
    }
  };

  // Save Consultation and Issue SLMC e-Prescription
  const handleSaveConsultation = async () => {
    if (!selectedConsultPatient) return;
    try {
      const signatureText = "Dr. Priyantha Silva, MBBS (Col), MD (FMed), SLMC: 12908";
      const rxNum = `RX-SL-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPrescriptionRecord: PrescriptionRecord = {
        id: `rx-gen-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        items: consultMedsList,
        dosageInstructions: "Use exactly according to guidelines; strictly refrain if allergy indicators emerge.",
        rxNumber: rxNum,
        signatureUrl: signatureText
      };

      const clinicalSummary = `Consultation Summary. Signs/Symptoms: ${consultNotes}. Prescribed treatment: ${consultMedsList.join(", ") || "None issued"}`;
      const historyEntry = {
        reason: appointments.find(a => a.patientId === selectedConsultPatient.id)?.reason || "Clinical Follow-up",
        notes: clinicalSummary,
        doctor: "Dr. Priyantha Silva"
      };

      const matchApt = appointments.find(a => a.patientId === selectedConsultPatient.id && a.status !== "COMPLETED");

      // Write e-Rx to Firestore first so a Suwasiri App patient sees it even if they are not in the JSON clinic store.
      if (consultMedsList.length > 0) {
        const synced = await issuePrescriptionsToSuwasiri({
          patientId: selectedConsultPatient.id,
          doctorName: sessionUser?.name || "Dr. Priyantha Silva",
          clinicName: activeHospital?.name || selectedConsultPatient.medicalCenter || "PrimeCare Medical Centre - Colombo Central",
          medicines: consultMedsList,
          sessionId: matchApt?.id,
          rxNumber: rxNum,
          prescriberNumber: "12908",
        });
        if (synced) {
          setSuwasiriRxSyncMsg(
            `${synced.count} medicine(s) now in the patient’s Suwasiri Vault → E-Prescription.`
          );
        }
      }

      let savedPatient = selectedConsultPatient;
      const res = await fetch(`/api/patients/${selectedConsultPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: consultNotes,
          activeMedications: consultMedsList,
          allergies: consultAllergiesStr,
          newPrescriptionRecord,
          historyEntry
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state?.patients) setPatients(data.state.patients);
        if (data.patient) savedPatient = data.patient;
      }

      if (matchApt && matchApt.source !== "suwasiri_app") {
        await handleUpdateAptStatus(matchApt.id, "COMPLETED");
      }

      alert(`Consultation records locked securely. Digitally signed SLMC e-Prescription issued: ${rxNum} and synced to Suwasiri Vault → E-Prescription.`);
      setActiveReceiptRx({ patient: savedPatient, prescription: newPrescriptionRecord });

      setActiveHubInitialTab("prescriptions");
      setActiveHubPatient(savedPatient);
      setSelectedConsultPatient(null);
      setActiveTab("dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskGemini = async () => {
    if (!selectedConsultPatient) return;
    try {
      setAiLoading(true);
      setAiAnalysisResult("");

      const res = await fetch("/api/ai/analyze-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: selectedConsultPatient.name,
          allergies: consultAllergiesStr,
          activeMedications: consultMedsList,
          currentNotes: consultNotes,
          prescribeMedName: consultSelectedMed === "other" ? consultCustomMed : consultSelectedMed
        })
      });
      const data = await res.json();
      if (data.error) {
        setAiAnalysisResult(`### API Config Notice\n\n${data.error}\n\n*Note: Complete clinical integration handles all severe antibiotic cross-allergies in localized demographics.*`);
      } else {
        setAiAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error(err);
      setAiAnalysisResult("Unable to query active AI Clinical Copilot. Verify server setup.");
    } finally {
      setAiLoading(false);
    }
  };

  // Bill settling
  const handleSettleReceipt = async (id: string, status: "PAID" | "PENDING") => {
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      setBilling(data.state.billing);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadReceipt = async (invoiceId: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch(`/api/billing/${invoiceId}/upload-receipt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiptUrl: base64data,
            paidBySuwasiri: true
          })
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setBilling(data.state.billing);
        alert("Receipt uploaded successfully & verified under Suwasiri app record!");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Error uploading receipt: " + err.message);
    }
  };

  // Admin Custom pharmaceutical adding
  const handleAdminAddDrug = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAdminDrugName.trim()) return;
    try {
      const res = await fetch("/api/drugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName: newAdminDrugName.trim() })
      });
      const data = await res.json();
      if (data.drugs) {
        setDrugs(data.drugs);
        setNewAdminDrugName("");
        alert(`Medicine Database registry updated successfully: ${newAdminDrugName}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!newExpAmount.trim()) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newExpCategory,
          amount: parseFloat(newExpAmount) || 0,
          description: newExpDescription.trim(),
          date: newExpDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(data.state.expenses || []);
        setNewExpAmount("");
        setNewExpDescription("");
        alert(`Registered Rs ${parseFloat(newExpAmount).toLocaleString()} expense under ${newExpCategory} successfully!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to remove this expense record?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(data.state.expenses || []);
        alert("Expense record purged successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispatch Broadcast Notification (WhatsApp/SMS)
  const handleAdminDispatchBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!smsTargetPatient) return;
    const patObj = patients.find(p => p.id === smsTargetPatient);
    if (!patObj) return;

    let textPayload = smsCustomText;
    if (!textPayload) {
      if (smsTemplate === "PRESCRIPTION_READY") {
        textPayload = `Dear ${patObj.name}, your GP Care e-Prescribed medicine sequence has been authenticated. You can pick it up from your adjacent pharmacist.`;
      } else if (smsTemplate === "APPOINTMENT_REMINDER") {
        textPayload = `Reminder: Scheduled consultation check with family practitioner Dr. Priyantha Silva is active. Please present at lobby.`;
      } else if (smsTemplate === "LAB_COMPLETED") {
        textPayload = `Hi ${patObj.name}, your clinical laboratory biopsy outcomes have been processed and uploaded to your secure Health Card.`;
      } else {
        textPayload = `Warm updates from Sri Lankan GP Care portal. Contact Colombo desk for information.`;
      }
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patObj.name,
          recipient: patObj.phone,
          transport: smsTransport,
          templateType: smsTemplate,
          content: textPayload
        })
      });
      const data = await res.json();
      if (data.state) {
        setNotifications(data.state.notifications);
        setSmsCustomText("");
        alert(`Broadcast successfully dispatched via ${smsTransport} to ${patObj.name} [${patObj.phone}]! Check transmission logs.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clinic Messaging team chat handler
  const handlePostSecureClinicChat = async (text: string, channel: string) => {
    let sName = "Dr. Priyantha Silva";
    if (currentRole === "Hospital Super Admin" || currentRole === "Admin" || currentRole === "Practice Manager") sName = sessionUser?.name || "Ms. Sandamali Jayasekara";
    else if (currentRole === "Receptionist") sName = sessionUser?.name || "Mr. Thusitha Perera";
    else sName = sessionUser?.name || "Dr. Priyantha Silva";

    try {
      const res = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: sName,
          senderRole: currentRole,
          text,
          channel
        })
      });
      const data = await res.json();
      if (data.success) {
        setClinicMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lab Results subcategory modifiers (from within Patient Card Hub)
  const handleHubAddHistoryItem = async (patientId: string, updatedHistory: string[]) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalHistory: updatedHistory })
      });
      const data = await res.json();
      setPatients(data.state.patients);
      // Synchronize modal state patient reference card
      const reFound = data.state.patients.find((p: Patient) => p.id === patientId);
      if (reFound) setActiveHubPatient(reFound);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHubAddVaccine = async (patientId: string, newVaccineRecord: VaccineRecord) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newVaccineRecord })
      });
      const data = await res.json();
      setPatients(data.state.patients);
      const reFound = data.state.patients.find((p: Patient) => p.id === patientId);
      if (reFound) setActiveHubPatient(reFound);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHubOrderLabTest = async (patientId: string, testName: string, remarks: string) => {
    const pat = patients.find((p) => p.id === patientId);
    try {
      const res = await fetch("/api/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          testName,
          remarks,
          patientName: pat?.name,
          sampleCategory: sampleCategoryForTest(testName),
          orderedBy: sessionUser?.name || currentRole,
        })
      });
      const data = await res.json();
      if (data.state?.labOrders) setLabOrders(data.state.labOrders);
      if (data.state?.sampleCollections) setSampleCollections(data.state.sampleCollections);
      if (data.state?.notifications) setNotifications(data.state.notifications);
      if (data.state?.clinicMessages) setClinicMessages(data.state.clinicMessages);
      alert(`Pathology order for "${testName}" sent to Sample Dispatch Hub. Reception will be notified.`);
    } catch (err) {
      console.error(err);
      alert("Could not dispatch the pathology order.");
    }
  };

  const handleMarkLabReviewed = async (patientId: string, labResultId: string) => {
    setReviewedLabKeys((prev) => ({ ...prev, [`${patientId}:${labResultId}`]: true }));
    try {
      await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewLabResultId: labResultId, reviewedBy: sessionUser?.name || currentRole }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const dispatchInbox = notifications.filter(
    (n) => n.templateType === "PATHOLOGY_ORDER" && n.status !== "READ" && !n.read
  );

  const openSampleDispatchFromAlert = async (alert: NotificationLog) => {
    requestTab("sampleCollection");
    if (alert.sampleId) setHighlightSampleId(alert.sampleId);
    const registrar = sessionUser?.name || currentRole;
    if (alert.sampleId) {
      try {
        const res = await fetch(`/api/sample-collections/${alert.sampleId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registeredBy: registrar }),
        });
        const data = await res.json();
        if (data.state?.sampleCollections) setSampleCollections(data.state.sampleCollections);
        if (data.state?.notifications) setNotifications(data.state.notifications);
      } catch (err) {
        console.error(err);
      }
    }
    try {
      await fetch(`/api/notifications/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true, status: "READ", registeredBy: registrar }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === alert.id ? { ...n, read: true, status: "READ", registeredBy: registrar } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
    setShowNotificationPopup(false);
  };

  const handleHubProcessLabResult = async (orderId: string, resultVal: string) => {
    try {
      const res = await fetch(`/api/lab-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", resultVal })
      });
      const data = await res.json();
      setLabOrders(data.state.labOrders);
      setPatients(data.state.patients);
      setAlerts(data.state.alerts);
      
      const patId = labOrders.find(o => o.id === orderId)?.patientId;
      if (patId) {
        const reFound = data.state.patients.find((p: Patient) => p.id === patId);
        if (reFound) setActiveHubPatient(reFound);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset datastore
  const handleResetClinicalDatastore = async () => {
    if (!window.confirm("Reseed system? All previous records will be reset to default templates.")) return;
    try {
      const res = await fetch("/api/admin/reset-db", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPatients(data.state.patients);
        setAppointments(data.state.appointments);
        setAlerts(data.state.alerts);
        setTasks(data.state.tasks);
        setBilling(data.state.billing);
        setDrugs(data.state.drugs);
        setNotifications(data.state.notifications);
        setClinicMessages(data.state.clinicMessages);
        setLabOrders(data.state.labOrders);
        alert("Sri Lankan GP Care datastore seeded cleanly!");
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pathology state handlers
  const handleAddLabResult = (patientId: string, result: LabResult) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const existing = p.labResults || [];
        return {
          ...p,
          labResults: [result, ...existing]
        };
      }
      return p;
    }));
    // If abnormal/critical flag, trigger alert
    if (result.status === "ABNORMAL" || result.status === "CRITICAL" || result.abnormalFlag) {
      const targetP = patients.find(p => p.id === patientId);
      const newAlert: Alert = {
        id: "alert-path-" + Date.now(),
        title: `Pathology Alert: ${result.testName} (${result.status})`,
        text: `Patient ${targetP?.name || patientId} recorded ${result.testName}: ${result.result}. ${result.remarks || ""}`,
        severity: result.status === "CRITICAL" ? "critical" : "high",
        type: "Pathology",
        timeLabel: "Just now"
      };
      setAlerts(prev => [newAlert, ...prev]);
    }
  };

  const handleUpdateLabResult = (patientId: string, updatedResult: LabResult) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const existing = p.labResults || [];
        return {
          ...p,
          labResults: existing.map(r => r.id === updatedResult.id ? updatedResult : r)
        };
      }
      return p;
    }));
  };

  // Multi-Field Search Matcher: Patient Name, Identity Number (ID/Medicare/IHI/Barcode/DVA/NIC/Phone), Lab Orders/Results, eRx Prescriptions/Medications
  const getSearchMatchDetails = (p: Patient, q: string) => {
    if (!q || !q.trim()) return null;
    const query = q.toLowerCase().trim();
    const matches: { type: "NAME" | "IDENTITY" | "LAB" | "ERX" | "ALLERGY"; label: string; snippet: string }[] = [];

    // 1. Patient Name
    if (p.name.toLowerCase().includes(query)) {
      matches.push({ type: "NAME", label: "Patient Name", snippet: p.name });
    }

    // 2. Identity numbers (ID, Medicare, IHI, Suwasiri Barcode, DVA, Pensioner card, Phone)
    const idFields: { name: string; val?: string }[] = [
      { name: "Patient ID", val: p.id },
      { name: "Medicare Card", val: p.medicareNumber },
      { name: "Medicare Ref", val: p.medicareRefNumber },
      { name: "IHI Identifier", val: p.ihiNumber },
      { name: "Suwasiri Barcode", val: p.suwasiriBarcode },
      { name: "DVA Card", val: p.dvaNumber },
      { name: "Pensioner Card", val: p.pensionerCardNumber },
      { name: "Mobile Phone", val: p.phone }
    ];
    idFields.forEach(f => {
      if (f.val && f.val.toLowerCase().includes(query)) {
        matches.push({ type: "IDENTITY", label: f.name, snippet: f.val });
      }
    });

    // 3. Lab orders & Pathology tests
    const labHits: typeof matches = [];
    if (p.labResults) {
      p.labResults.forEach(lr => {
        if (
          lr.testName.toLowerCase().includes(query) ||
          (lr.category && lr.category.toLowerCase().includes(query)) ||
          (lr.result && lr.result.toLowerCase().includes(query))
        ) {
          labHits.push({ type: "LAB", label: `Pathology: ${lr.testName}`, snippet: `${lr.result} (${lr.status}) • ${lr.date}` });
        }
      });
    }
    labOrders.filter(o => o.patientId === p.id).forEach(lo => {
      if (lo.testName.toLowerCase().includes(query) || lo.id.toLowerCase().includes(query)) {
        labHits.push({ type: "LAB", label: `Lab Order #${lo.id}`, snippet: `${lo.testName} • Status: ${lo.status}` });
      }
    });

    // 4. eRx Prescriptions & Active medications
    const rxHits: typeof matches = [];
    if (p.prescriptionsList) {
      p.prescriptionsList.forEach(rx => {
        const tokenHit =
          rx.rxNumber.toLowerCase().includes(query) ||
          (rx.ePrescriptionToken && rx.ePrescriptionToken.toLowerCase().includes(query));
        if (tokenHit) {
          rxHits.push({ type: "ERX", label: `eRx #${rx.rxNumber}`, snippet: `Token: ${rx.ePrescriptionToken || "eRx-SEALED"} • ${rx.date}` });
        }
        if (rx.items) {
          rx.items.forEach(item => {
            if (typeof item === "string" && (item.toLowerCase().includes(query) || tokenHit)) {
              rxHits.push({ type: "ERX", label: `Prescription Item`, snippet: item });
            }
          });
        }
      });
    }
    if (p.activeMedications) {
      p.activeMedications.forEach(med => {
        if (med.toLowerCase().includes(query)) {
          rxHits.push({ type: "ERX", label: "Active Medication", snippet: med });
        }
      });
    }

    const nameOrIdMatch = matches.length > 0;
    if (nameOrIdMatch) {
      if (labHits.length === 0) {
        p.labResults?.forEach((lr) => {
          labHits.push({
            type: "LAB",
            label: `Pathology: ${lr.testName}`,
            snippet: `${lr.result || "Pending"} (${lr.status}) • ${lr.date}`,
          });
        });
        labOrders.filter((o) => o.patientId === p.id).forEach((lo) => {
          labHits.push({
            type: "LAB",
            label: `Lab Order #${lo.id}`,
            snippet: `${lo.testName} • Status: ${lo.status}`,
          });
        });
      }
      if (rxHits.length === 0) {
        p.prescriptionsList?.forEach((rx) => {
          rxHits.push({
            type: "ERX",
            label: `eRx #${rx.rxNumber}`,
            snippet: (rx.items || []).join(", ") || rx.date,
          });
        });
        p.activeMedications?.forEach((med) => {
          rxHits.push({ type: "ERX", label: "Active Medication", snippet: med });
        });
      }
    }

    matches.push(...labHits, ...rxHits);

    // 5. Allergies
    if (p.allergies && p.allergies.toLowerCase().includes(query)) {
      matches.push({ type: "ALLERGY", label: "Allergy", snippet: p.allergies });
    }

    return matches.length > 0 ? matches : null;
  };

  // Name-first registry filter: searching a patient name shows only that person
  const filteredPatients = patients.filter(p => {
    if ((p.hospitalId || HOSPITAL_PRIMECARE) !== sessionHospitalId) return false;
    if (!isPlatformSA && !canViewHospitalWideCharts(activeRole) && (p.branchId || BRANCH_COLOMBO) !== sessionBranchId) return false;
    if (focusedSearchPatientId) return p.id === focusedSearchPatientId;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameHits = patients.filter((x) => {
      if ((x.hospitalId || HOSPITAL_PRIMECARE) !== sessionHospitalId) return false;
      return x.name.toLowerCase().includes(query);
    });
    if (nameHits.length > 0) {
      return p.name.toLowerCase().includes(query);
    }
    return getSearchMatchDetails(p, searchQuery) !== null;
  });

  const unreadPathologyPatientCount = patients.filter((p) =>
    p.labResults?.some((lr) => !lr.doctorReviewed)
  ).length;
  const lobbyCheckedInCount = dayAppointments.filter((a) => a.status === "CHECKED IN").length;

  // Advanced Financial calculations
  const totalIncome = billing.filter(b => b.status === "PAID").reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = expenses.reduce((sum, b) => sum + b.amount, 0);
  const totalSettledPayment = totalIncome;
  const totalRemainingPayment = billing.filter(b => b.status !== "PAID").reduce((sum, b) => sum + b.amount, 0);

  // Group items by date to get per-day stats: { [date]: { income, consultations, settledCount, pendingCount, remainingAmount } }
  const financialPeriods: { [date: string]: { income: number, consultations: number, settledCount: number, pendingCount: number, remainingAmount: number } } = {};

  // Group all unique dates
  const uniqueDates = Array.from(new Set([
    ...billing.map(b => b.date),
    ...tenantAppointments.map(a => a.date),
    new Date().toISOString().substring(0, 10)
  ])).filter(Boolean).sort((a, b) => b.localeCompare(a)); // sorted descending (most recent first)

  uniqueDates.forEach(d => {
    // Income for day d: settled payments on date d
    const billingForDay = billing.filter(b => b.date === d);
    const dayIncome = billingForDay.filter(b => b.status === "PAID").reduce((sum, b) => sum + b.amount, 0);
    const dayRemaining = billingForDay.filter(b => b.status !== "PAID").reduce((sum, b) => sum + b.amount, 0);
    const daySettledCount = billingForDay.filter(b => b.status === "PAID").length;
    const dayPendingCount = billingForDay.filter(b => b.status !== "PAID").length;

    // Consultations completed on date d
    const dayConsultations = tenantAppointments.filter(a => a.date === d && a.status === "COMPLETED").length;

    financialPeriods[d] = {
      income: dayIncome,
      consultations: dayConsultations,
      settledCount: daySettledCount,
      pendingCount: dayPendingCount,
      remainingAmount: dayRemaining
    };
  });

  const clinicalSearchPanel = searchQuery.trim() ? (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b bg-[#f0f3ff] flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-sm text-[#00334f]">
            {focusedSearchPatientId
              ? `Patient file: ${filteredPatients[0]?.name || searchQuery}`
              : `Patients matching “${searchQuery}”`}
          </h2>
          <p className="text-[11px] text-slate-500">
            Only this patient is shown. Click a name to open their details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setFocusedSearchPatientId(null);
          }}
          className="text-xs font-bold text-slate-500 hover:text-red-600"
        >
          Clear
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {filteredPatients.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">No patient matches this name.</p>
        ) : (
          filteredPatients.map((p) => {
            const details = getSearchMatchDetails(p, searchQuery) || [];
            const labs = details.filter((m) => m.type === "LAB");
            const erx = details.filter((m) => m.type === "ERX");
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setFocusedSearchPatientId(p.id)}
                className="w-full text-left p-4 space-y-2 hover:bg-sky-50/70 transition"
              >
                <p className="font-serif font-bold text-sm text-[#00334f]">
                  {p.name}{" "}
                  <span className="font-mono text-[10px] text-slate-500 font-sans">[{p.id}]</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  {p.age} yrs • {p.gender} • {p.phone || "No phone"} • {p.medicalCenter || "Clinic"}
                </p>
                {p.allergies && (
                  <p className="text-[11px] text-rose-700">Allergies: {p.allergies}</p>
                )}
                {labs.map((m, i) => (
                  <div key={`d-lab-${i}`} className="text-xs bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                    <span className="font-bold text-emerald-900">{m.label}: </span>{m.snippet}
                  </div>
                ))}
                {erx.map((m, i) => (
                  <div key={`d-rx-${i}`} className="text-xs bg-purple-50 border border-purple-100 rounded px-3 py-2">
                    <span className="font-bold text-purple-900">{m.label}: </span>{m.snippet}
                  </div>
                ))}
              </button>
            );
          })
        )}
      </div>
    </section>
  ) : null;

  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9ff]">
        <Loader2 className="w-10 h-10 text-[#00334f] animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-500">Checking Firebase session…</p>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] p-6">
        <div className="max-w-lg bg-white border rounded-2xl p-8 space-y-3 text-sm">
          <h1 className="font-bold text-[#00334f] text-lg">Firebase Web app ID missing</h1>
          <p className="text-slate-600 text-xs leading-relaxed">
            Register a Web app in Firebase Console for project <strong>suwasiri-91824</strong>, then add
            <code className="mx-1 bg-slate-100 px-1">VITE_FIREBASE_APP_ID</code> to <code className="bg-slate-100 px-1">web/.env.local</code>.
            See <strong>docs/NEXT.md</strong> step 0.
          </p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen font-sans bg-[#f9f9ff] text-[#111c2d]" id="app_root">
      
      {/* Sidebar navigation */}
      <aside className="fixed left-0 top-0 bottom-0 flex flex-col z-40 bg-white border-r border-[#c1c7cf] h-full w-64 print:hidden" id="app_sidebar">
        <div className="p-5 border-b border-slate-100">
          <h1 className="font-serif font-bold text-lg text-[#00334f] leading-tight mb-0.5">
            Sri Lankan GP Care
          </h1>
          <p className="text-[9px] font-extrabold text-[#72787f] uppercase tracking-widest">
            General Practice Portal
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/50 p-1.5 px-2 rounded-md">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">
              {activeBranch?.name || activeHospital?.name || (isPlatformSA ? "Suwasiri Platform" : "No branch")}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
          {!isPatientOnly && (
          <>
          {(canOpen("dashboard") || canOpen("clinical") || canOpen("pathology") || canOpen("documents") || canOpen("ai_features") || canOpen("calculators") || canOpen("recalls") || canOpen("patients") || canOpen("telehealth")) && (
          <div className="pb-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider px-2">Clinical Core (Doctor Portal)</span>
          </div>
          )}

          {canOpen("dashboard") && (
          <button
            onClick={() => requestTab("dashboard")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "dashboard"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <Activity className="w-4 h-4 mr-3 text-[#00334f]" />
            <span className="text-[13px] font-medium">Doctor Dashboard</span>
          </button>
          )}

          {canOpen("clinical") && (
          <button
            onClick={() => requestTab("clinical")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "clinical"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <Stethoscope className="w-4 h-4 mr-3 text-sky-700" />
            <span className="text-[13px] font-medium">GP Exam Room</span>
          </button>
          )}

          {canOpen("pathology") && (
          <button
            onClick={() => requestTab("pathology")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "pathology"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <FlaskConical className="w-4 h-4 mr-3 text-emerald-600" />
            <span className="text-[13px] font-medium">Pathology & Diagnostics</span>
          </button>
          )}

          {canOpen("documents") && (
          <button
            onClick={() => requestTab("documents")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "documents"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <FileText className="w-4 h-4 mr-3 text-sky-600" />
            <span className="text-[13px] font-medium">Document Management</span>
          </button>
          )}

          {canOpen("ai_features") && (
          <button
            onClick={() => requestTab("ai_features")}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "ai_features"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 mr-3 text-purple-600 animate-pulse" />
              <span className="text-[13px] font-medium">AI Clinical Suite</span>
            </div>
            <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full uppercase">
              AI Scribe
            </span>
          </button>
          )}

          {canOpen("calculators") && (
          <button
            onClick={() => requestTab("calculators")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "calculators"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <BrainCircuit className="w-4 h-4 mr-3 text-sky-600" />
            <span className="text-[13px] font-medium">Clinical Calculators</span>
          </button>
          )}

          {canOpen("recalls") && (
          <button
            onClick={() => requestTab("recalls")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "recalls"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <Bell className="w-4 h-4 mr-3 text-red-500" />
            <span className="text-[13px] font-medium">Recalls & Reminders</span>
          </button>
          )}

          {canOpen("patients") && (
          <button
            onClick={() => requestTab("patients")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "patients"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <Users className="w-4 h-4 mr-3" />
            <span className="text-[13px] font-medium">Patient Clinical Records</span>
          </button>
          )}

          {canOpen("telehealth") && (
          <button
            onClick={() => requestTab("telehealth")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "telehealth"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <Video className="w-4 h-4 mr-3" />
            <span className="text-[13px] font-medium">Telehealth Room</span>
          </button>
          )}

          {(canOpen("calendar") || canOpen("billing") || canOpen("sampleCollection") || canOpen("chat")) && (
          <div className="pt-2 pb-1 border-t border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider px-2">Receptionist & Front Desk</span>
          </div>
          )}

          {canOpen("calendar") && (
          <button
            onClick={() => requestTab("calendar")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "calendar"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <CalendarIcon className="w-4 h-4 mr-3 text-sky-700" />
            <span className="text-[13px] font-medium">Lobby Schedule & Queue</span>
          </button>
          )}

          {canOpen("billing") && (
          <button
            onClick={() => requestTab("billing")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "billing"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <CreditCard className="w-4 h-4 mr-3 text-emerald-600" />
            <span className="text-[13px] font-medium">Receipts and Invoices</span>
          </button>
          )}

          {canOpen("sampleCollection") && (
          <button
            onClick={() => requestTab("sampleCollection")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "sampleCollection"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <FlaskConical className="w-4 h-4 mr-3 text-rose-500" />
            <span className="text-[13px] font-medium flex-1">Sample Dispatch Hub</span>
            {dispatchInbox.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                {dispatchInbox.length}
              </span>
            )}
          </button>
          )}

          {canOpen("chat") && (
          <button
            onClick={() => requestTab("chat")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "chat"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-3 text-purple-600" />
            <span className="text-[13px] font-medium">Team Secure Chat</span>
          </button>
          )}

          {(canOpen("platform") || canOpen("practiceManager") || canOpen("security") || canOpen("audit_logs") || canOpen("reports")) && (
          <div className="pt-2 pb-1 border-t border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider px-2">Operations & Governance</span>
          </div>
          )}

          {canOpen("platform") && (
            <button
              onClick={() => requestTab("platform")}
              className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
                activeTab === "platform"
                  ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                  : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
              }`}
            >
              <ShieldAlert className="w-4 h-4 mr-3 text-amber-600" />
              <span className="text-[13px] font-medium">Platform Console</span>
            </button>
          )}

          {canOpen("practiceManager") && (
          <button
            onClick={() => requestTab("practiceManager")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "practiceManager"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-3 text-purple-600" />
            <span className="text-[13px] font-medium">Practice Manager</span>
          </button>
          )}

          {canOpen("security") && (
          <button
            onClick={() => requestTab("security")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "security"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-3 text-emerald-600" />
            <span className="text-[13px] font-medium">Security & RBAC</span>
          </button>
          )}

          {canOpen("audit_logs") && (
          <button
            onClick={() => requestTab("audit_logs")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "audit_logs"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <Clock className="w-4 h-4 mr-3 text-slate-700" />
            <span className="text-[13px] font-medium">Clinical Audit Trail</span>
          </button>
          )}

          {canOpen("reports") && (
          <button
            onClick={() => requestTab("reports")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "reports"
                ? "text-[#00334f] bg-[#e7eeff] font-bold shadow-xs"
                : "text-[#72787f] hover:text-[#00334f] hover:bg-[#f0f3ff]"
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-3 text-sky-600" />
            <span className="text-[13px] font-medium">Reports & Analytics</span>
          </button>
          )}
          </>
          )}

          {(canOpen("patientPortal") || canOpen("publicBooking")) && (
          <div className="pt-2 pb-1 border-t border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider px-2">Patient Facing Portal</span>
          </div>
          )}

          {canOpen("patientPortal") && (
          <button
            onClick={() => requestTab("patientPortal")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "patientPortal"
                ? "text-emerald-900 bg-emerald-100 font-bold shadow-xs"
                : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
            }`}
          >
            <HeartPulse className="w-4 h-4 mr-3 text-emerald-600" />
            <span className="text-[13px] font-bold">Patient Portal</span>
          </button>
          )}

          {canOpen("publicBooking") && (
          <button
            onClick={() => requestTab("publicBooking")}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
              activeTab === "publicBooking"
                ? "text-sky-900 bg-sky-100 font-bold shadow-xs"
                : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
            }`}
          >
            <Globe className="w-4 h-4 mr-3 text-sky-600" />
            <span className="text-[13px] font-medium">Online Public Booking</span>
          </button>
          )}
        </nav>

        {/* Sidebar bottom */}
        <div className="p-4 border-t border-[#c1c7cf] space-y-2">
            {!isPatientOnly && (canOpen("calendar") || canOpen("clinical")) && (
            <button
            onClick={() => {
              if (patients.length > 0) {
                setNewAptPatientId(patients[0].id);
              }
              setNewAptDate(selectedClinicDate);
              setShowAptModal(true);
            }}
            className="w-full bg-[#00334f] text-white py-2.5 px-3 font-bold text-xs rounded shadow hover:bg-[#0c4a6e] transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Book Active Appointment
          </button>
            )}
        </div>
      </aside>

      {/* Main layout container */}
      <main className="pl-64 flex-1 min-h-screen flex flex-col overflow-x-hidden">
        
        {/* Top Navbar role control banner */}
        <RoleSwitcher
          displayName={sessionUser?.name || authUser?.displayName || authUser?.email || "Signed in"}
          hospitals={hospitals}
          branches={branches}
          roles={roleDefs}
          memberships={memberships}
          userId={resolvedUserId}
          hospitalId={sessionHospitalId}
          branchId={sessionBranchId}
          roleId={activeMembership?.roleId || ""}
          isPlatformSA={isPlatformSA}
          isPatientOnly={isPatientOnly}
          onSelectHospital={applyHospital}
          onSelectBranch={setSessionBranchId}
          onSignOut={() => { void signOutFirebase(); }}
        />

        {/* Header toolbar */}
        <header className="flex justify-between items-center h-16 px-6 sticky top-0 z-20 bg-white border-b border-[#c1c7cf] print:hidden gap-4">
          <div className="flex items-center flex-1 relative min-w-0">
            <div className="relative w-full max-w-lg">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72787f]">
                <Search className="w-4 h-4" />
              </span>
              <input
                className="w-full pl-10 pr-10 py-2 bg-[#f0f3ff] border border-[#c1c7cf] focus:border-[#00334f] focus:bg-white outline-none text-xs transition-all rounded-lg"
                placeholder={headerSearchPlaceholder || "Search patient name..."}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedSearchPatientId(null);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFocusedSearchPatientId(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-red-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}

              {searchQuery.trim().length > 0 && !focusedSearchPatientId && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-[480px] flex flex-col animate-in fade-in slide-in-from-top-2">
                  <div className="bg-[#f0f3ff] px-4 py-2.5 border-b flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00334f] flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-[#00334f]" />
                      Patients matching "{searchQuery}" ({filteredPatients.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Click a name to view that patient only
                    </span>
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100 p-1 flex-1">
                    {filteredPatients.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 space-y-1">
                        <p className="text-xs font-bold text-slate-600">No matching patient found</p>
                        <p className="text-[11px]">Try the full patient name, for example Chamidu Kaushal Rathnayake.</p>
                      </div>
                    ) : (
                      filteredPatients.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFocusedSearchPatientId(p.id);
                              setSearchQuery(p.name);
                            }}
                            className="w-full text-left p-3 hover:bg-sky-50 transition flex flex-col gap-1"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif font-bold text-xs text-[#00334f]">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded">
                                ID: {p.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              {p.age} yrs • {p.gender} • {p.phone || "No phone"}
                            </p>
                          </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowNotificationPopup((open) => !open)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-[#f0f3ff] hover:bg-white hover:border-[#00334f] transition"
              title="Staff notifications"
            >
              <Bell className="w-4 h-4 text-[#00334f]" />
              <span className="text-xs font-bold text-[#00334f] hidden sm:inline">Notifications</span>
              {dispatchInbox.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                  {dispatchInbox.length}
                </span>
              )}
            </button>
            {showNotificationPopup && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[360px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 bg-[#f0f3ff] border-b flex items-center justify-between">
                  <p className="text-xs font-bold text-[#00334f]">Sample Dispatch Hub</p>
                  <button type="button" className="text-[10px] font-bold text-slate-400" onClick={() => setShowNotificationPopup(false)}>Close</button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y">
                  {dispatchInbox.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500">No new pathology dispatch alerts.</p>
                  ) : (
                    dispatchInbox.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => { void openSampleDispatchFromAlert(alert); }}
                        className="w-full text-left p-3 hover:bg-amber-50 transition"
                      >
                        <p className="text-xs font-bold text-[#00334f]">{alert.testName || "Pathology order"}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{alert.content}</p>
                        <p className="text-[10px] text-amber-800 font-bold mt-1">Open Sample Dispatch Hub →</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-[#c1c7cf] pr-4">
              {/* Emergency custom alert triggers */}
              <button
                onClick={() => setShowCustomAlertModal(true)}
                className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
                title="Simulate epidemiological alert"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              <button
                onClick={handleSyncState}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                title="Force refresh database state"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-xs text-[#111c2d]">
                  {sessionUser?.name || currentRole}
                </p>
                <p className="text-[9px] font-extrabold uppercase text-slate-400">
                  {currentRole} · {activeHospital?.name || (isPlatformSA ? "Platform" : "Hospital")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Global Loading Spinner */}
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center p-12">
            <Loader2 className="w-12 h-12 text-[#00334f] animate-spin mb-2" />
            <p className="text-xs font-bold text-gray-500 font-sans">Connecting to Sri Lankan General Practice datastore...</p>
          </div>
        ) : (
          <div className="p-6 flex-grow">
            
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              !tabAllowed("dashboard", activeRole, isPlatformSA) ? (
                <div className="bg-white border border-amber-200 rounded-2xl p-10 max-w-2xl mx-auto my-8 shadow-lg text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Doctor Portal Access Restricted</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    The Doctor Dashboard is restricted by your RBAC role. You are currently viewing as <em>{currentRole}</em>
                    {activeHospital ? <> at <strong>{activeHospital.name}</strong></> : null}.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => requestTab("calendar")}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition"
                    >
                      View Reception Schedule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Doctor Dashboard TODAY Metrics Bar */}
                  <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h2 className="text-sm font-black text-[#00334f] tracking-tight uppercase">
                            Doctor Dashboard • {formatLongDate(selectedClinicDate)}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Practitioner: <strong className="text-slate-800">{sessionUser?.name || "Dr. Priyantha Silva"}</strong>
                          {activeHospital ? <> • {activeHospital.name}{activeBranch ? ` · ${activeBranch.name}` : ""}</> : null}
                          {selectedClinicDate === todayKey ? " • Live session" : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Colombo time</p>
                          <LiveColomboClock className="text-2xl font-mono font-black text-[#00334f] tabular-nums leading-none" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCalculatorsModal(true)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-sky-600" />
                          Clinical Calculators
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConsultPatient(null);
                            setActiveTab("clinical");
                          }}
                          className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          GP Exam Room (Standby)
                        </button>
                      </div>
                    </div>

                    {/* 6 Key Clinical Indicators (Appointments 18, Waiting 4, Telehealth 3, Pathology Results 7, Recalls 5, Documents 8) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* 1. Appointments 18 */}
                      <div 
                        onClick={() => setActiveTab("calendar")}
                        className="bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/60 p-3 rounded-lg cursor-pointer transition group"
                        title="Click to view full appointment schedule"
                      >
                        <div className="flex items-center justify-between text-sky-700 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Appointments</span>
                          <CalendarIcon className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-[#00334f]">{dayAppointments.length}</div>
                        <p className="text-[10px] text-sky-700/80 mt-0.5">
                          {dayAppointments.filter((a) => a.status === "SCHEDULED").length} scheduled • {dayAppointments.filter((a) => a.status === "CHECKED IN" || a.status === "IN EXAM ROOM").length} in clinic
                        </p>
                      </div>

                      {/* 2. Waiting 4 */}
                      <div 
                        onClick={() => setActiveTab("calendar")}
                        className="bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/60 p-3 rounded-lg cursor-pointer transition group"
                        title="Click to inspect waiting queue"
                      >
                        <div className="flex items-center justify-between text-amber-800 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Waiting</span>
                          <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-amber-900">{lobbyCheckedInCount}</div>
                        <p className="text-[10px] text-amber-700 mt-0.5">In lobby queue</p>
                      </div>

                      {/* 3. Telehealth 3 */}
                      <div 
                        onClick={() => setActiveTab("telehealth")}
                        className="bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/60 p-3 rounded-lg cursor-pointer transition group"
                        title="Click to open Telehealth suite"
                      >
                        <div className="flex items-center justify-between text-purple-700 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Telehealth</span>
                          <Video className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-purple-900">{dayAppointments.filter((a) => a.isTelehealth || a.type === "Telehealth Video").length}</div>
                        <p className="text-[10px] text-purple-700 mt-0.5">Remote consults</p>
                      </div>

                      {/* 4. Pathology Results 7 -> Opens PathologyHub */}
                      <div 
                        onClick={() => setActiveTab("pathology")}
                        className="bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-300 p-3 rounded-lg cursor-pointer transition group ring-1 ring-emerald-400/30"
                        title="Click to view Pathology patients and diagnostic lab results"
                      >
                        <div className="flex items-center justify-between text-emerald-800 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Pathology</span>
                          <FlaskConical className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-emerald-900">{unreadPathologyPatientCount}</div>
                        <p className="text-[10px] text-emerald-700 mt-0.5 font-semibold">Unread reports →</p>
                      </div>

                      {/* 5. Recalls 5 */}
                      <div 
                        onClick={() => setActiveTab("recalls")}
                        className="bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60 p-3 rounded-lg cursor-pointer transition group"
                        title="Click to manage clinical recalls"
                      >
                        <div className="flex items-center justify-between text-rose-800 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Recalls</span>
                          <Bell className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-rose-900">{recalls.length || 5}</div>
                        <p className="text-[10px] text-rose-700 mt-0.5">Diabetes & CST</p>
                      </div>

                      {/* 6. Documents 8 -> Opens DocumentManagementHub */}
                      <div 
                        onClick={() => setActiveTab("documents")}
                        className="bg-slate-50 hover:bg-sky-50 border border-sky-200 p-3 rounded-lg cursor-pointer transition group ring-1 ring-sky-300/30"
                        title="Click to view Document Management (grouped by Patient)"
                      >
                        <div className="flex items-center justify-between text-slate-700 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Documents</span>
                          <FileText className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-slate-800">8</div>
                        <p className="text-[10px] text-sky-700 mt-0.5 font-semibold">Patient Docs &rarr;</p>
                      </div>
                    </div>
                  </div>

                  {/* Cleaned Top Status Strip (Removed Registry Count and Pending Labs) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 border border-[#c1c7cf] rounded-xl flex items-center justify-between transition-all hover:shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[#72787f] font-bold text-[10px] uppercase">Completed Consultations</p>
                          <p className="font-bold text-lg text-[#00334f]">{dayAppointments.filter(a => a.status === "COMPLETED").length} finished this date</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        On Schedule
                      </span>
                    </div>

                    <div className="bg-white p-4 border border-[#c1c7cf] rounded-xl flex items-center justify-between transition-all hover:shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-amber-100 text-amber-900 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[#72787f] font-bold text-[10px] uppercase">Lobby Active Queue</p>
                          <p className="font-bold text-lg text-amber-900">{lobbyCheckedInCount} in clinic queue</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("calendar")}
                        className="text-[10px] font-bold text-sky-700 hover:underline"
                      >
                        Manage &rarr;
                      </button>
                    </div>

                    <div 
                      onClick={() => {
                        if (alerts.length > 0) {
                          setSelectedAlertForDetails(alerts[0]);
                        } else {
                          setShowAllAlertsModal(true);
                        }
                      }}
                      className="bg-white p-4 border border-[#c1c7cf] border-l-4 border-l-[#ba1a1a] rounded-xl flex items-center justify-between gap-4 transition-all hover:shadow-md hover:border-[#ba1a1a] cursor-pointer group select-none"
                      title="Click to inspect all Clinical Warning Details and Action Protocols"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                          <ShieldAlert className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[#72787f] font-bold text-[10px] uppercase flex items-center gap-1">
                            Clinical Alerts
                            <span className="bg-red-100 text-[#ba1a1a] text-[8px] font-black px-1.5 py-0.2 rounded uppercase">Critical</span>
                          </p>
                          <p className="font-bold text-lg text-[#ba1a1a]">{alerts.length} Warnings</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 group-hover:underline flex items-center gap-0.5">
                        Inspect &rarr;
                      </span>
                    </div>
                  </div>

                  {clinicalSearchPanel}

                  {/* EXPANDED LARGE QUEUE & CLINICAL SHIFT DASHBOARD (Removed Quick Patient Registry) */}
                  {!searchQuery.trim() && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Primary Large Queue Section (Col Span 8 on Desktop) */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Today's Appointment Schedule & Live Lobby Queue - EXPANDED LARGE */}
                      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-[#f0f3ff]">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#00334f]" />
                            <div>
                              <h2 className="font-bold text-slate-800 text-sm">
                                {formatLongDate(selectedClinicDate)} — Appointments & Lobby Queue
                              </h2>
                              <p className="text-[11px] text-slate-500">
                                Click a date on the side calendar, then open a patient to launch the <strong>GP Exam Room</strong>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 font-semibold bg-white px-2.5 py-1 rounded-md border">
                              {dayAppointments.length} Patients Scheduled
                            </span>
                            <button
                              onClick={() => setActiveTab("calendar")}
                              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              Manage Places
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50/90 border-b text-[#72787f] font-bold">
                                <th className="p-3.5 text-center w-24">Queue #</th>
                                <th className="p-3.5">Time</th>
                                <th className="p-3.5">Patient Details</th>
                                <th className="p-3.5">Presenting Complaint</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 text-right">Clinical Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {dayAppointments.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                    No appointments booked for {formatLongDate(selectedClinicDate)}. Use the calendar to pick another date, or book a new appointment.
                                  </td>
                                </tr>
                              ) : dayAppointments.map((apt, index) => {
                                const p = patients.find(pat => pat.id === apt.patientId);
                                const isFirst = index === 0;
                                const isLast = index === dayAppointments.length - 1;
                                return (
                                  <tr key={apt.id} className="hover:bg-sky-50/50 transition-colors group">
                                    {/* Queue Place Number & Reorder Controls */}
                                    <td className="p-3.5 text-center">
                                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                        <span className={`font-mono font-black text-xs ${
                                          index === 0 
                                            ? "text-emerald-700 bg-emerald-100 px-1 rounded font-bold" 
                                            : index === 1 
                                            ? "text-sky-700 font-bold" 
                                            : "text-slate-700"
                                        }`}>
                                          #{index + 1}
                                        </span>
                                        
                                        <div className="flex flex-col gap-0.5">
                                          <button
                                            type="button"
                                            disabled={isFirst}
                                            onClick={() => handleMoveAppointment(apt.id, "up")}
                                            className={`p-0.5 rounded transition-colors ${
                                              isFirst 
                                                ? "text-slate-300 cursor-not-allowed" 
                                                : "text-slate-600 hover:bg-slate-200 hover:text-[#00334f]"
                                            }`}
                                            title="Move patient up 1 place in queue"
                                          >
                                            <ChevronUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isLast}
                                            onClick={() => handleMoveAppointment(apt.id, "down")}
                                            className={`p-0.5 rounded transition-colors ${
                                              isLast 
                                                ? "text-slate-300 cursor-not-allowed" 
                                                : "text-slate-600 hover:bg-slate-200 hover:text-[#00334f]"
                                            }`}
                                            title="Move patient down 1 place in queue"
                                          >
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="p-3.5 font-bold text-[#00334f] whitespace-nowrap">
                                      {apt.time}
                                    </td>

                                    <td className="p-3.5">
                                      <div 
                                        className="font-serif font-bold text-sm text-[#00334f] hover:text-sky-700 cursor-pointer flex items-center gap-1.5"
                                        onClick={() => openBookedPatient(apt, p)}
                                        title={isVideoBooking(apt) ? "Open Telehealth room and call this patient" : "Click patient name to launch GP Exam Room"}
                                      >
                                        <span>{appointmentPatientName(apt, p)}</span>
                                        <Stethoscope className="w-3.5 h-3.5 text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="font-mono bg-slate-100 px-1 rounded">ID: {apt.patientId}</span>
                                        {apt.source === "suwasiri_app" && (
                                          <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                            Suwasiri App
                                          </span>
                                        )}
                                        {(apt.isTelehealth || apt.type === "Telehealth Video") && (
                                          <span className="text-[9px] font-bold uppercase tracking-wide text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                            Video
                                          </span>
                                        )}
                                        {p && p.age > 0 && <span>{p.gender}, {p.age} yrs • {p.bloodType}</span>}
                                        {(p?.phone || apt.patientPhone) && <span>{p?.phone || apt.patientPhone}</span>}
                                        {apt.doctorName && <span>{apt.doctorName}</span>}
                                        {p?.allergies && p.allergies !== "NKDA" && p.allergies !== "None" && (
                                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                                            {p.allergies}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="p-3.5 text-slate-700 max-w-[220px]">
                                      <p className="font-medium truncate">"{apt.reason}"</p>
                                      {apt.type && (
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          {apt.type}
                                        </span>
                                      )}
                                    </td>

                                    <td className="p-3.5">
                                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border inline-block ${
                                        apt.status === "IN EXAM ROOM"
                                          ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                                          : apt.status === "CHECKED IN"
                                          ? "bg-amber-50 text-amber-800 border-amber-300 font-black"
                                          : apt.status === "COMPLETED"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                          : "bg-slate-100 text-slate-600 border-slate-300"
                                      }`}>
                                        {apt.status}
                                      </span>
                                    </td>

                                    <td className="p-3.5 text-right space-x-1.5 font-bold whitespace-nowrap">
                                      {apt.status === "SCHEDULED" && (
                                        <button
                                          onClick={() => handleUpdateAptStatus(apt.id, "CHECKED IN")}
                                          className="text-[#00334f] hover:underline bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-xs"
                                        >
                                          Check In
                                        </button>
                                      )}

                                      {apt.status === "CHECKED IN" && (
                                        <button
                                          onClick={() => {
                                            const person = p || stubPatientFromBooking(apt);
                                            if (isVideoBooking(apt)) {
                                              openBookedPatient(apt, person);
                                              return;
                                            }
                                            handleUpdateAptStatus(apt.id, "IN EXAM ROOM");
                                            handleStartConsultation(person);
                                          }}
                                          className="text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs text-xs font-bold inline-flex items-center gap-1"
                                        >
                                          <Stethoscope className="w-3.5 h-3.5" />
                                          {isVideoBooking(apt) ? "Open Telehealth →" : "Call To GP Exam →"}
                                        </button>
                                      )}

                                      {apt.status === "IN EXAM ROOM" && (
                                        <button
                                          onClick={() => openBookedPatient(apt, p)}
                                          className="text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold inline-flex items-center gap-1"
                                        >
                                          <Stethoscope className="w-3.5 h-3.5" />
                                          {isVideoBooking(apt) ? "Resume Telehealth →" : "Resume Consult →"}
                                        </button>
                                      )}

                                      {apt.status === "COMPLETED" && (
                                        <span className="text-emerald-700 font-normal text-xs">Consult Completed</span>
                                      )}

                                      {p && (
                                        <button
                                          type="button"
                                          onClick={() => setActiveDoctorRecordPatient(p)}
                                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs transition inline-flex items-center gap-1"
                                          title="View full 16-tab medical history & records"
                                        >
                                          <FileText className="w-3 h-3" />
                                          Record
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>

                    {/* Right Column: month calendar + alerts */}
                    <div className="lg:col-span-4 space-y-6">
                      {clinicCalendar}
                      
                      {/* Clinical checklist tasks */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
                        <h4 className="font-bold text-xs uppercase text-slate-600 tracking-wider flex items-center justify-between">
                          <span>Clinical Shift Checklist</span>
                          <span className="text-[10px] font-normal text-slate-400 font-sans">{tasks.filter(t=>t.completed).length}/{tasks.length} done</span>
                        </h4>
                        <form onSubmit={handleAddTask} className="flex gap-1.5 text-xs">
                          <input
                            type="text"
                            placeholder="e.g. Sterilize diagnostic equipment..."
                            className="flex-grow p-2 border rounded-lg focus:border-[#00334f] text-xs outline-none"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                          />
                          <button type="submit" className="bg-[#00334f] text-white px-3 py-2 rounded-lg font-bold text-xs">Add</button>
                        </form>

                        <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto">
                          {tasks.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100">
                              <label className="flex items-center gap-2 cursor-pointer font-semibold flex-1">
                                <input
                                  type="checkbox"
                                  checked={t.completed}
                                  onChange={(e) => handleToggleTask(t.id, e.target.checked)}
                                />
                                <span className={t.completed ? "line-through text-slate-400" : "text-slate-700"}>{t.text}</span>
                              </label>
                              <button onClick={() => handleDeleteTask(t.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Active alerts warnings list - CLICKABLE TO VIEW WARNING DETAILS */}
                      <div className="bg-[#ffdad6] border border-[#ffb4ab] rounded-xl p-4 text-xs text-[#93000a] space-y-3 shadow-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold uppercase flex items-center gap-1.5 text-[#ba1a1a]">
                            <ShieldAlert className="w-4 h-4 animate-pulse" />
                            Urgent Clinical Alerts ({alerts.length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowAllAlertsModal(true)}
                            className="text-[10px] font-bold text-[#ba1a1a] hover:underline"
                          >
                            View All &rarr;
                          </button>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {alerts.map(al => (
                            <div 
                              key={al.id} 
                              onClick={() => setSelectedAlertForDetails(al)}
                              className="p-3 bg-white border border-red-200 rounded-md relative group hover:border-red-500 hover:shadow-md cursor-pointer transition-all border-l-4 border-l-red-600"
                            >
                              <div className="flex justify-between font-bold text-slate-800 items-start">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                                  {al.title}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismissAlert(al.id);
                                  }}
                                  className="text-slate-400 hover:text-red-700 p-0.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                  title="Dismiss alert"
                                >
                                  ×
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                                  {al.type}
                                </span>
                                <span className="text-slate-400 text-[10px] font-mono">{al.timeLabel}</span>
                              </div>

                              <p className="text-slate-700 mt-1.5 font-medium text-[11px] line-clamp-2 leading-relaxed">
                                {al.text}
                              </p>

                              <div className="mt-2 pt-1.5 border-t border-red-100 flex items-center justify-between text-[10px] text-red-700 font-bold group-hover:translate-x-0.5 transition-transform">
                                <span className="flex items-center gap-1">
                                  <AlertOctagon className="w-3 h-3 text-red-600" />
                                  Inspect Warning & Protocols
                                </span>
                                <span>&rarr;</span>
                              </div>
                            </div>
                          ))}

                          {alerts.length === 0 && (
                            <div className="bg-white/80 p-4 rounded border text-center space-y-1">
                              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                              <p className="text-slate-700 font-bold">No active clinical warnings</p>
                              <p className="text-slate-500 text-[10px]">All critical lab bounds, imaging alerts, and contraindications are in stable status.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              )
            )}

            {/* TAB: LOBBY SCHEDULE & PATIENT QUEUE REORDERING */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                
                {/* Lobby Management Header */}
                <div className="bg-white p-6 border rounded-lg shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#00334f] text-white flex items-center justify-center">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-serif font-bold text-lg text-[#00334f]">
                            Lobby Schedule & Patient Queue Order
                          </h2>
                          <p className="text-xs text-slate-500">
                            {formatLongDate(selectedClinicDate)} — reorder the queue, check patients in, and open charts. Use the side calendar to change date.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          if (patients.length > 0) setNewAptPatientId(patients[0].id);
                          setNewAptDate(selectedClinicDate);
                          setShowAptModal(true);
                        }}
                        className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3.5 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Book Appointment
                      </button>

                      <button
                        onClick={() => setShowPatientModal(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        Fast Walk-In
                      </button>
                    </div>
                  </div>
                </div>

                {clinicalSearchPanel}

                {!searchQuery.trim() && (
                <>
                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    {/* Status filter tabs */}
                    <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border">
                      {[
                        { id: "ALL", label: "All Patients", count: dayAppointments.length },
                        { id: "CHECKED IN", label: "Waiting in Lobby", count: dayAppointments.filter(a => a.status === "CHECKED IN").length },
                        { id: "IN EXAM ROOM", label: "In Exam Room", count: dayAppointments.filter(a => a.status === "IN EXAM ROOM").length },
                        { id: "SCHEDULED", label: "Upcoming Scheduled", count: dayAppointments.filter(a => a.status === "SCHEDULED").length },
                        { id: "COMPLETED", label: "Completed", count: dayAppointments.filter(a => a.status === "COMPLETED").length }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setLobbyFilterStatus(tab.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                            lobbyFilterStatus === tab.id
                              ? "bg-white text-[#00334f] shadow-xs border border-slate-200"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            lobbyFilterStatus === tab.id ? "bg-[#e7eeff] text-[#00334f]" : "bg-slate-200 text-slate-600"
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Quick Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search lobby queue..."
                        value={lobbySearchQuery}
                        onChange={(e) => setLobbySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border rounded-lg text-xs outline-none focus:border-[#00334f] focus:bg-white"
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                {/* Patient Queue Reordering Table / Live Board */}
                <div className="bg-white border rounded-lg shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 bg-[#f0f3ff] border-b flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <h3 className="font-bold text-sm text-[#00334f]">
                        {formatLongDate(selectedClinicDate)} — Patient queue
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      💡 Use the <span className="font-bold text-slate-700">⬆️ / ⬇️</span> buttons or place selector dropdown to change a patient's position in the lobby queue.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b text-[#72787f]">
                          <th className="p-3.5 font-bold text-center w-36">Patient Place #</th>
                          <th className="p-3.5 font-bold">Shift Position</th>
                          <th className="p-3.5 font-bold">Time & Est. Wait</th>
                          <th className="p-3.5 font-bold">Patient Bio & ID</th>
                          <th className="p-3.5 font-bold">Reason / Symptoms</th>
                          <th className="p-3.5 font-bold text-center">Status</th>
                          <th className="p-3.5 font-bold text-right">Consult Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayAppointments
                          .map((apt, actualIdx) => ({ apt, actualIdx }))
                          .filter(({ apt }) => {
                            if (lobbyFilterStatus !== "ALL" && apt.status !== lobbyFilterStatus) return false;
                            if (lobbySearchQuery) {
                              const p = patients.find(pat => pat.id === apt.patientId);
                              const q = lobbySearchQuery.toLowerCase();
                              const matchName = appointmentPatientName(apt, p).toLowerCase().includes(q);
                              const matchReason = apt.reason.toLowerCase().includes(q);
                              const matchId = apt.patientId.toLowerCase().includes(q);
                              const matchPhone = (p?.phone || apt.patientPhone || "").toLowerCase().includes(q);
                              const matchDoctor = (apt.doctorName || "").toLowerCase().includes(q);
                              return matchName || matchReason || matchId || matchPhone || matchDoctor;
                            }
                            return true;
                          })
                          .map(({ apt, actualIdx }) => {
                            const p = patients.find(pat => pat.id === apt.patientId);
                            const isFirst = actualIdx === 0;
                            const isLast = actualIdx === dayAppointments.length - 1;
                            const estWaitMins = actualIdx * 15;

                            return (
                              <tr 
                                key={apt.id} 
                                className={`transition-colors ${
                                  apt.status === "IN EXAM ROOM"
                                    ? "bg-red-50/40 hover:bg-red-50/70"
                                    : apt.status === "CHECKED IN"
                                    ? "bg-amber-50/30 hover:bg-amber-50/60"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                {/* Place Badge & Dropdown */}
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div className={`px-2.5 py-1 rounded-md font-mono font-black text-xs border flex items-center gap-1 shadow-xs ${
                                      actualIdx === 0
                                        ? "bg-emerald-600 text-white border-emerald-700"
                                        : actualIdx === 1
                                        ? "bg-sky-100 text-sky-900 border-sky-300"
                                        : "bg-slate-100 text-slate-700 border-slate-300"
                                    }`}>
                                      {actualIdx === 0 && <Star className="w-3 h-3 fill-amber-300 text-amber-300" />}
                                      <span>Place #{actualIdx + 1}</span>
                                    </div>
                                    
                                    {/* Direct place selector */}
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400 font-semibold">Move to:</span>
                                      <select
                                        value={actualIdx + 1}
                                        onChange={(e) => handleChangeAppointmentPlace(apt.id, Number(e.target.value))}
                                        className="bg-white border rounded text-[10px] font-bold px-1.5 py-0.5 text-slate-700 outline-none hover:border-[#00334f]"
                                      >
                                        {dayAppointments.map((_, pNum) => (
                                          <option key={pNum} value={pNum + 1}>
                                            #{pNum + 1} {pNum === 0 ? "(Next)" : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </td>

                                {/* Shift Position Controls (Up / Down / Top) */}
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={isFirst}
                                      onClick={() => handleMoveAppointment(apt.id, "up")}
                                      className={`p-1.5 rounded border text-xs font-bold flex items-center gap-0.5 transition-all ${
                                        isFirst
                                          ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                          : "bg-white text-slate-700 border-slate-200 hover:bg-[#00334f] hover:text-white hover:border-[#00334f] shadow-xs cursor-pointer"
                                      }`}
                                      title="Move Up 1 Place"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                      <span className="text-[10px]">Up</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isLast}
                                      onClick={() => handleMoveAppointment(apt.id, "down")}
                                      className={`p-1.5 rounded border text-xs font-bold flex items-center gap-0.5 transition-all ${
                                        isLast
                                          ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                          : "bg-white text-slate-700 border-slate-200 hover:bg-[#00334f] hover:text-white hover:border-[#00334f] shadow-xs cursor-pointer"
                                      }`}
                                      title="Move Down 1 Place"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                      <span className="text-[10px]">Down</span>
                                    </button>

                                    {!isFirst && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveAppointment(apt.id, "top")}
                                        className="p-1.5 rounded border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                        title="Fast-track to Top of Queue"
                                      >
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        <span>Top</span>
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Time & Est Wait */}
                                <td className="p-3 whitespace-nowrap">
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-[#00334f] text-sm flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      {apt.time}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      {actualIdx === 0 ? (
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                                          ⚡ Next in Line
                                        </span>
                                      ) : (
                                        <span>Est. Wait: ~{estWaitMins} mins</span>
                                      )}
                                    </p>
                                  </div>
                                </td>

                                {/* Patient Bio */}
                                <td className="p-3">
                                  <div 
                                    className="flex items-start gap-2.5 cursor-pointer group"
                                    onClick={() => openBookedPatient(apt, p)}
                                    title={isVideoBooking(apt) ? "Open Telehealth room and call this patient" : "Click patient name to launch GP Exam Room"}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-[#dee8ff] text-[#00334f] font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      {(appointmentPatientName(apt, p) || "P").split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div>
                                      <p className="font-serif font-bold text-slate-900 group-hover:text-[#00334f] group-hover:underline">
                                        {appointmentPatientName(apt, p)}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        <span className="font-mono font-bold text-slate-500">[{apt.patientId}]</span>
                                        {apt.source === "suwasiri_app" && (
                                          <span className="ml-1 text-[9px] font-bold uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded">Suwasiri App</span>
                                        )}
                                        {(apt.isTelehealth || apt.type === "Telehealth Video") && (
                                          <span className="ml-1 text-[9px] font-bold uppercase text-purple-800 bg-purple-50 border border-purple-200 px-1 rounded">Video</span>
                                        )}
                                      </p>
                                      {(p?.phone || apt.patientPhone) && (
                                        <p className="text-[10px] text-slate-500">{p?.phone || apt.patientPhone}{(p?.email || apt.patientEmail) ? ` • ${p?.email || apt.patientEmail}` : ""}</p>
                                      )}
                                      {apt.doctorName && (
                                        <p className="text-[10px] text-slate-500">{apt.doctorName}{apt.room ? ` • ${apt.room}` : ""}</p>
                                      )}
                                      {p?.allergies && p.allergies !== "None declared" && (
                                        <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded inline-block mt-0.5">
                                          ⚠️ Allergy: {p.allergies}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Reason */}
                                <td className="p-3 max-w-[200px]">
                                  <p className="text-slate-700 italic font-medium">"{apt.reason}"</p>
                                </td>

                                {/* Status */}
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold border ${
                                    apt.status === "IN EXAM ROOM"
                                      ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                                      : apt.status === "CHECKED IN"
                                      ? "bg-amber-50 text-amber-800 border-amber-300 font-extrabold"
                                      : apt.status === "COMPLETED"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : "bg-slate-100 text-slate-600 border-slate-300"
                                  }`}>
                                    {apt.status}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                  {apt.status === "SCHEDULED" && (
                                    <button
                                      onClick={() => handleUpdateAptStatus(apt.id, "CHECKED IN")}
                                      className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-2.5 py-1.5 rounded font-bold transition-colors text-xs"
                                    >
                                      Check In Now
                                    </button>
                                  )}

                                  {apt.status === "CHECKED IN" && (
                                    <button
                                      onClick={() => {
                                        if (currentRole === "Receptionist") {
                                          alert("Check-in confirmed. Starting examination requires Doctor role.");
                                          return;
                                        }
                                        const person = p || stubPatientFromBooking(apt);
                                        if (isVideoBooking(apt)) {
                                          openBookedPatient(apt, person);
                                          return;
                                        }
                                        handleUpdateAptStatus(apt.id, "IN EXAM ROOM");
                                        handleStartConsultation(person);
                                      }}
                                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded font-bold transition-colors text-xs shadow-xs"
                                    >
                                      {isVideoBooking(apt) ? "Open Telehealth →" : "Call to GP Exam →"}
                                    </button>
                                  )}

                                  {apt.status === "IN EXAM ROOM" && (
                                    <button
                                      onClick={() => openBookedPatient(apt, p)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-bold transition-colors text-xs"
                                    >
                                      {isVideoBooking(apt) ? "Active Telehealth" : "Active Exam Room"}
                                    </button>
                                  )}

                                  {apt.status === "COMPLETED" && (
                                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded text-[11px] border border-emerald-200">
                                      ✓ Consult Closed
                                    </span>
                                  )}

                                  {p && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveHubInitialTab("history");
                                        setActiveHubPatient(p);
                                      }}
                                      className="text-slate-500 hover:text-[#00334f] p-1.5 rounded hover:bg-slate-100"
                                      title="Open Patient Hub"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                        {dayAppointments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                              No patients booked for {formatLongDate(selectedClinicDate)}. Click another date on the calendar, or book an appointment for this day.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>

                <div className="lg:col-span-4">
                  {clinicCalendar}
                </div>
                </div>
                </>
                )}

              </div>
            )}

            {/* TAB: PATIENT DIRECTORY DATABASE */}
            {activeTab === "patients" && (
              <div className="bg-white p-6 border rounded space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#00334f]">Clinical registry files and past histories</h2>
                    <p className="text-xs text-slate-500 font-sans">Double click any health card profile below to view vaccine records, lab results, and print past e-prescriptions.</p>
                  </div>
                  <button
                    onClick={() => setShowPatientModal(true)}
                    className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register New Patient File
                  </button>
                </div>

                {/* Patient Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded text-xs bg-slate-50 focus:border-[#00334f] outline-none"
                      placeholder="Filter registered clinical files by name, clinical allergies and parameters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* SUWASIRI MOBILE APP BARCODE INTEGRATION */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-600 text-white font-black p-1 px-1.5 rounded text-[9px] tracking-wider animate-pulse font-mono">
                        SUWASIRI LIVE
                      </div>
                      <h3 className="font-serif font-extrabold text-xs text-emerald-800">
                        Suwasiri Mobile App Barcode System Sync Gateway
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Type a barcode to automatically sync all patient details from Suwasiri portal</span>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const input = barcodeSearchText.trim();
                    if (!input) return;
                    setBarcodeLoading(true);
                    try {
                      const res = await fetch(`/api/suwasiri/barcode/${encodeURIComponent(input)}`);
                      if (!res.ok) throw new Error("Could not sync barcode from Suwasiri mobile app server.");
                      const data = await res.json();
                      
                      // Auto state sync
                      if (data.state && data.state.patients) {
                        setPatients(data.state.patients);
                      }
                      if (data.state && data.state.clinicMessages) {
                        setClinicMessages(data.state.clinicMessages);
                      }
                      setBarcodeSearchText("");
                      alert(`⚡ Sync Success! Loaded patient "${data.patient.name}" directly from Suwasiri portal. Zero manual entry needed!`);
                      setActiveHubPatient(data.patient);
                    } catch (err: any) {
                      alert("Error loading barcode: " + err.message);
                    } finally {
                      setBarcodeLoading(false);
                    }
                  }} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4.5 h-4.5" />
                      <input
                        type="text"
                        required
                        placeholder="Type Suwasiri Mobile App Barcode (e.g. SWSR-9912, SWSR-4451, SWSR-1085, SWSR-3022 or enter a custom code)"
                        className="w-full pl-10 pr-4 py-2 border border-emerald-300 rounded text-xs bg-white text-emerald-900 placeholder-emerald-600/40 font-bold tracking-wider uppercase focus:ring-1 focus:ring-emerald-500 outline-none"
                        value={barcodeSearchText}
                        onChange={(e) => setBarcodeSearchText(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={barcodeLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {barcodeLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Synchronizing...
                        </>
                      ) : (
                        <>
                          <Barcode className="w-3.5 h-3.5" />
                          Sync to Portal
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sample suggestions */}
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="text-emerald-800 font-bold uppercase tracking-wider text-[8px]">Available Demo Barcodes:</span>
                    {[
                      { code: "SWSR-9912", name: "Sahan" },
                      { code: "SWSR-4451", name: "Nimani" },
                      { code: "SWSR-1085", name: "Dilhan" },
                      { code: "SWSR-3022", name: "Kavindi" }
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setBarcodeSearchText(item.code)}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-850 border border-emerald-200/60 p-1 px-1.5 rounded transition text-[9px] font-mono font-semibold"
                      >
                        {item.code} ({item.name})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grids list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredPatients.map((pat) => (
                    <div
                      key={pat.id}
                      className="border p-4 rounded-lg bg-slate-50/50 hover:bg-white hover:border-[#00334f] hover:shadow transition-all space-y-3 cursor-pointer"
                      onClick={() => {
                        setActiveHubInitialTab("history");
                        setActiveHubPatient(pat);
                      }}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#dee8ff] text-[#00334f] font-bold text-xs flex items-center justify-center">
                          {pat.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-[#00334f]">{pat.name}</h3>
                          <p className="text-[10px] text-slate-400">ID: {pat.id} • {pat.gender}, {pat.age} yrs</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="bg-emerald-50 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                              ⚕ {pat.medicalCenter || "Colombo Central Clinic"}
                            </span>
                            {pat.suwasiriBarcode && (
                              <span className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-700">
                                ⚡ SUWASIRI {pat.suwasiriBarcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded p-2 text-[10px] space-y-1 font-semibold text-slate-600">
                        <p><span className="text-slate-400">Clinical Allergies:</span> <span className="font-bold text-red-600">{pat.allergies}</span></p>
                        <p><span className="text-slate-400">Biological Blood:</span> {pat.bloodType}</p>
                        <p><span className="text-slate-400">Immunization Sequence:</span> {pat.vaccineRecords?.length || 0} Dose(s) logged</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckInWalkIn(pat);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Clock className="w-3 h-3" />
                          Check-in Walk-In
                        </button>
                        <div className="flex items-center gap-1 hover:text-[#00334f]">
                          <span>View health profile</span>
                          <ArrowRight className="w-3 h-3 text-[#00334f]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GP EXAM CONSULTATION ROOM */}
            {activeTab === "clinical" && (
              <div className="space-y-6">
                {selectedConsultPatient ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Diagnostic Progress Notes (8 cols) */}
                    <div className="lg:col-span-8 bg-white p-6 border rounded space-y-4">
                      
                      <div className="border-b pb-3 flex justify-between items-start">
                        <div>
                          <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">Active Clinical Consultation Room</span>
                          <h2 className="font-serif font-bold text-xl text-[#00334f] mt-1">{selectedConsultPatient.name}</h2>
                          <p className="text-xs text-slate-500">Age parameter: {selectedConsultPatient.age} | ID: {selectedConsultPatient.id} | Declared sensitivity: <span className="font-bold text-red-600">{selectedConsultPatient.allergies}</span></p>
                        </div>

                        <button
                          onClick={() => { setSelectedConsultPatient(null); setActiveTab("dashboard"); }}
                          className="text-xs text-slate-400 hover:text-slate-700 font-bold border border-slate-300 px-3 py-1 bg-slate-50 rounded"
                        >
                          Cancel Examination
                        </button>
                      </div>

                      {/* MEDICAL CERTIFICATE DIRECT HUB REDIRECT */}
                      <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-900">Patient asks for a Medical Certificate (MC)?</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 animate-pulse">
                              Directly open the Clinical Record Hub section for {selectedConsultPatient.name} to view their full medical history and draft/issue certificates.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveHubInitialTab("mc");
                            setActiveHubPatient(selectedConsultPatient);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-md font-extrabold text-[10px] uppercase tracking-wider shrink-0 transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-sm active:scale-95"
                        >
                          View Clinical Hub (MC Section) &rarr;
                        </button>
                      </div>

                      {/* Progress findings */}
                      <div className="space-y-1.5 text-xs">
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Consultation clinical findings & Vitals notes</label>
                        <textarea
                          placeholder="Include symptom onset duration, cardiovascular sounds, throat inflammation check..."
                          className="w-full h-40 p-3 border rounded focus:border-[#00334f] font-serif-medical"
                          value={consultNotes}
                          onChange={(e) => setConsultNotes(e.target.value)}
                        />
                      </div>

                      {/* Prescriptions & Medication Search Bar section */}
                      <div className="space-y-4 text-xs">
                        
                        {/* Allergies & Patient Sensitivity Alert */}
                        <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5 flex-1">
                            <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                              Patient Known Sensitivities & Allergies
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border border-amber-300 bg-white rounded text-xs text-red-700 font-bold focus:border-red-500 outline-none"
                              value={consultAllergiesStr}
                              onChange={(e) => setConsultAllergiesStr(e.target.value)}
                              placeholder="e.g. Penicillin, Sulfa drugs, Aspirin, NSAIDs..."
                            />
                          </div>
                          {consultAllergiesStr && consultAllergiesStr !== "None declared" && (
                            <div className="bg-red-100 border border-red-300 text-red-800 text-[10px] px-3 py-1.5 rounded font-bold self-start sm:self-center shrink-0">
                              ⚠️ Contraindication Shield Active
                            </div>
                          )}
                        </div>

                        {/* DRUG FORMULARY SEARCH BAR & FAST ADD */}
                        <div className="bg-slate-50 border border-slate-300/80 rounded-lg p-4 space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                            <div>
                              <h3 className="font-bold text-xs uppercase tracking-wider text-[#00334f] flex items-center gap-1.5">
                                <Search className="w-4 h-4 text-teal-700" />
                                Search Medication & Add to Prescription (Rx)
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Search by generic name, brand name (Panadol, Augmentin, etc.), or therapeutic class.
                              </p>
                            </div>

                            <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold self-start sm:self-auto font-mono">
                              {SRI_LANKA_GP_DRUGS.length + drugs.length} Formulary Drugs Loaded
                            </span>
                          </div>

                          {/* Search Input and Category Filter */}
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Type medicine name (e.g. Paracetamol, Amoxicillin, Metformin, Salbutamol, Omeprazole)..."
                                value={medSearchQuery}
                                onChange={(e) => {
                                  setMedSearchQuery(e.target.value);
                                  setMedSearchFocused(true);
                                }}
                                onFocus={() => setMedSearchFocused(true)}
                                className="w-full pl-9 pr-24 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#00334f] focus:ring-1 focus:ring-[#00334f] outline-none shadow-xs"
                              />
                              {medSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setMedSearchQuery("")}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex flex-wrap items-center gap-1">
                              {["All", "Antibiotics", "Analgesics & Pain", "Gastric & GI", "Respiratory", "Diabetes", "Cardio & BP", "Antihistamine & Allergy"].map(cat => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setMedCategoryFilter(cat)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    medCategoryFilter === cat
                                      ? "bg-[#00334f] text-white shadow-xs"
                                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>

                            {/* Search Results / Matching Drugs Dropdown List */}
                            {(medSearchQuery || medSearchFocused) && (
                              <div className="bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 z-10">
                                <div className="p-2 bg-slate-50 border-b flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                                  <span>Formulary Recommendations</span>
                                  <button
                                    type="button"
                                    onClick={() => setMedSearchFocused(false)}
                                    className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5"
                                  >
                                    Close List ✕
                                  </button>
                                </div>

                                {SRI_LANKA_GP_DRUGS
                                  .filter(item => {
                                    if (medCategoryFilter !== "All" && item.category !== medCategoryFilter) return false;
                                    if (!medSearchQuery) return true;
                                    const q = medSearchQuery.toLowerCase();
                                    return (
                                      item.name.toLowerCase().includes(q) ||
                                      item.brand.toLowerCase().includes(q) ||
                                      item.generic.toLowerCase().includes(q) ||
                                      item.category.toLowerCase().includes(q) ||
                                      item.indications.toLowerCase().includes(q)
                                    );
                                  })
                                  .slice(0, 15)
                                  .map((item, idx) => {
                                    const isAllergyConflict = consultAllergiesStr && 
                                      consultAllergiesStr !== "None declared" &&
                                      item.contraindicatedAllergies.some(alg => 
                                        consultAllergiesStr.toLowerCase().includes(alg.toLowerCase())
                                      );

                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setConsultSelectedMed(`${item.name} (${item.brand})`);
                                          setConsultMedInstruction(item.defaultDose);
                                          setConsultMedMeal(item.defaultMeal);
                                          setConsultMedDays(item.defaultDays);
                                          setMedSearchQuery(item.name);
                                          setSelectedFormularyDrug(item);
                                          setMedSearchFocused(false);
                                        }}
                                        className={`p-2.5 hover:bg-sky-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                          isAllergyConflict ? "bg-red-50/70 border-l-4 border-l-red-500" : ""
                                        }`}
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                              Brand: {item.brand}
                                            </span>
                                            <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-bold">
                                              {item.category}
                                            </span>
                                            {isAllergyConflict && (
                                              <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded border border-red-200 animate-pulse flex items-center gap-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                Patient Allergy Warning
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-500">
                                            Default: <span className="font-semibold text-slate-700">{item.defaultDose}</span> • {item.defaultDays} days • {item.defaultMeal}
                                          </p>
                                          {item.indications && (
                                            <p className="text-[9px] text-slate-500 italic">Indication: {item.indications}</p>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConsultSelectedMed(`${item.name} (${item.brand})`);
                                            setConsultMedInstruction(item.defaultDose);
                                            setConsultMedMeal(item.defaultMeal);
                                            setConsultMedDays(item.defaultDays);
                                            setMedSearchQuery(item.name);
                                            setSelectedFormularyDrug(item);
                                            setMedSearchFocused(false);
                                          }}
                                          className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-2.5 py-1 rounded text-[10px] font-bold self-start sm:self-center shrink-0 cursor-pointer"
                                        >
                                          Select
                                        </button>
                                      </div>
                                    );
                                  })}

                                {medSearchQuery && SRI_LANKA_GP_DRUGS.filter(i => i.name.toLowerCase().includes(medSearchQuery.toLowerCase()) || i.brand.toLowerCase().includes(medSearchQuery.toLowerCase()) || i.generic.toLowerCase().includes(medSearchQuery.toLowerCase())).length === 0 && (
                                  <div className="p-3 text-center text-slate-500 space-y-1">
                                    <p className="font-semibold">No exact formulary match for "{medSearchQuery}"</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConsultSelectedMed("other");
                                        setConsultCustomMed(medSearchQuery);
                                        setMedSearchFocused(false);
                                      }}
                                      className="text-xs text-[#00334f] font-bold underline hover:text-[#0c4a6e] cursor-pointer"
                                    >
                                      Prescribe "{medSearchQuery}" as custom medication &rarr;
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Selected Medication Formulation Details & Dosage Configurator */}
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Current Selected Medication
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Select from search above or type custom drug..."
                                    className="w-full p-2 border rounded text-xs font-bold text-[#00334f] bg-slate-50"
                                    value={consultSelectedMed === "other" ? consultCustomMed : consultSelectedMed}
                                    onChange={(e) => {
                                      setConsultSelectedMed("other");
                                      setConsultCustomMed(e.target.value);
                                    }}
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleAddPrescriptionToConsult}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer self-stretch sm:self-end active:scale-95"
                              >
                                <Plus className="w-4 h-4" />
                                Add to Prescription (Rx)
                              </button>
                            </div>

                            {/* Dosage, Duration, and Food Timing Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">
                                  Dosage Frequency
                                </label>
                                <select
                                  className="w-full p-1.5 bg-white border rounded text-xs text-slate-800 outline-none"
                                  value={consultMedInstruction}
                                  onChange={(e) => setConsultMedInstruction(e.target.value)}
                                >
                                  <option value="Take 1 tablet twice a day">1 tablet twice a day (BD)</option>
                                  <option value="Take 1 tablet three times a day">1 tablet 3x daily (TDS)</option>
                                  <option value="Take 1 tablet four times a day">1 tablet 4x daily (QDS)</option>
                                  <option value="Take 1 tablet daily in morning">1 tablet daily AM (OD)</option>
                                  <option value="Take 1 tablet at night bedtime">1 tablet at night (Nocte)</option>
                                  <option value="Take 2 tablets as needed">2 tablets as needed (PRN)</option>
                                  <option value="Take 1 capsule twice a day">1 capsule twice daily</option>
                                  <option value="Take 5ml syrup three times a day">5ml syrup 3x daily</option>
                                  <option value="Take 10ml syrup three times a day">10ml syrup 3x daily</option>
                                  <option value="Inhale 2 puffs as needed">Inhale 2 puffs as needed (PRN)</option>
                                  <option value="Apply affected area twice a day">Apply ointment twice a day</option>
                                </select>
                                <input 
                                  type="text" 
                                  className="w-full p-1 border mt-1 rounded text-[11px] bg-slate-50 text-slate-800" 
                                  placeholder="Or type custom dose instruction..." 
                                  value={consultMedInstruction}
                                  onChange={(e) => setConsultMedInstruction(e.target.value)}
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">
                                  Course Duration
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="90"
                                    className="w-20 p-1.5 bg-white border rounded text-xs font-bold text-slate-800"
                                    value={consultMedDays}
                                    onChange={(e) => setConsultMedDays(e.target.value)}
                                  />
                                  <span className="text-xs text-slate-500 font-semibold">days</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                  {["3", "5", "7", "14", "30"].map(d => (
                                    <button 
                                      key={d} 
                                      type="button" 
                                      onClick={() => setConsultMedDays(d)}
                                      className={`text-[10px] px-1.5 py-0.5 border rounded cursor-pointer ${
                                        consultMedDays === d ? "bg-[#00334f] text-white font-bold border-[#00334f]" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {d}d
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">
                                  Food / Meal Timing
                                </label>
                                <select
                                  className="w-full p-1.5 bg-white border rounded text-xs text-slate-800 outline-none"
                                  value={consultMedMeal}
                                  onChange={(e) => setConsultMedMeal(e.target.value)}
                                >
                                  <option value="After Meals">After Meals (Post-Prandial / කෑමෙන් පසු)</option>
                                  <option value="Before Meals">Before Meals (Pre-Prandial / කෑමට පෙර)</option>
                                  <option value="With Meals">With Meals (කෑම සමඟ)</option>
                                  <option value="On an Empty Stomach">On an Empty Stomach (හිස්බඩ)</option>
                                  <option value="At Bedtime">At Bedtime (නින්දට පෙර)</option>
                                  <option value="As required / regardless of meals">Regardless of meals / As needed</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Active selections list (SLMC certified e-prescription details section) */}
                      <div className="space-y-3 text-xs bg-slate-50 p-4 rounded border border-slate-200">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <h4 className="font-bold text-[#00334f] uppercase tracking-wide">e-Prescription (Rx) Active Selections</h4>
                          {consultMedsList.length > 0 && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              <span>Ready to sync to Suwasiri Vault</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2.5">
                          {consultMedsList.map(med => {
                            const parsed = parseMedicineInstruction(med);
                            return (
                              <div key={med} className="bg-white border rounded p-3 relative hover:shadow-sm transition-shadow flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrescriptionFromConsult(med)}
                                  className="absolute top-2.5 right-2.5 bg-red-50 hover:bg-red-100 text-red-600 w-5 h-5 flex items-center justify-center rounded font-bold text-xs cursor-pointer transition-colors"
                                  title="Remove from prescription list"
                                >
                                  ×
                                </button>
                                
                                <div className="pr-6">
                                  <span className="font-bold text-sm text-[#00334f]">{parsed.name}</span>
                                </div>

                                {parsed.formatted ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-sans">
                                    <div className="bg-slate-50 p-2 rounded">
                                      <span className="text-slate-400 block font-bold uppercase text-[8px]">In-take dosage</span>
                                      <span className="font-semibold text-slate-800">{parsed.instruction}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded">
                                      <span className="text-slate-400 block font-bold uppercase text-[8px]">Duration</span>
                                      <span className="font-semibold text-slate-800">{parsed.days}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded">
                                      <span className="text-slate-400 block font-bold uppercase text-[8px]">Food Timing</span>
                                      <span className="font-bold text-teal-700">{parsed.meal}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-600 italic block">{med}</p>
                                )}

                                <div className="text-[9px] text-[#006f66] bg-teal-50 px-2 py-1 rounded inline-flex items-center gap-1 font-bold self-start border border-teal-100 uppercase tracking-tight">
                                  <span>Appears in Suwasiri Vault → E-Prescription after sync</span>
                                </div>
                              </div>
                            );
                          })}
                          
                          {consultMedsList.length === 0 && (
                            <p className="text-slate-400 italic text-center py-6 text-xs bg-white border border-dashed rounded">No medications prescribed yet. Select high-grade medicines from clinical directory below.</p>
                          )}
                        </div>
                      </div>

                      {/* Save consultation records trigger */}
                      <div className="pt-4 border-t space-y-2">
                        {suwasiriRxSyncMsg && (
                          <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                            {suwasiriRxSyncMsg}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => { void handleSyncDrugsToSuwasiri(); }}
                          disabled={suwasiriRxSyncing || consultMedsList.length === 0}
                          className="w-full bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white font-bold py-2.5 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5"
                        >
                          {suwasiriRxSyncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                          Sync e-Rx to Suwasiri App
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveConsultation}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Save Consult Records & Seal Digital e-Prescription
                        </button>
                      </div>

                    </div>

                    {/* Copilot Clinical recommendations Assistant (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                      
                      <div className="bg-white border-2 border-[#00334f] p-5 rounded space-y-3 shadow-sm">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-[#00334f]" />
                            <h3 className="font-serif font-bold text-xs text-[#00334f]">Clinical Copilot Advisor</h3>
                          </div>
                          <span className="bg-[#dee8ff] text-[#00334f] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">GEMINI 3.5</span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          This AI assistant evaluates progress notes in real-time, alerts on drug allergies, and provides differential recommendations under family practice.
                        </p>

                        <button
                          onClick={handleAskGemini}
                          disabled={aiLoading}
                          className="w-full bg-[#00334f] text-white py-2 px-4 text-xs font-bold rounded hover:bg-[#0c4a6e] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:bg-slate-300"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Running safety analyzer...
                            </>
                          ) : (
                            <>
                              <BrainCircuit className="w-4 h-4" />
                              Query safe drug interaction
                            </>
                          )}
                        </button>

                        <div className="bg-slate-50 p-3 rounded border text-xs" id="gemini_advisor_results">
                          <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-2">Copilot safe findings:</h4>
                          {aiAnalysisResult ? (
                            <div className="space-y-2 leading-relaxed text-slate-700 max-h-80 overflow-y-auto pr-1">
                              {aiAnalysisResult.split("\n").map((line, lIdx) => {
                                if (line.startsWith("###")) {
                                  return <p key={lIdx} className="font-bold text-xs text-[#00334f] mt-3">{line.replace("###", "")}</p>;
                                }
                                if (line.startsWith("**") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.")) {
                                  return <p key={lIdx} className="font-bold text-xs text-slate-800 mt-1.5">{line}</p>;
                                }
                                return <p key={lIdx} className="text-[11px] text-slate-600">{line}</p>;
                              })}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">No active examination safety logs loaded. Double check patient allergies before saving.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-white border rounded p-12 text-center max-w-xl mx-auto space-y-4">
                    <Stethoscope className="w-16 h-16 text-slate-300 mx-auto" />
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#00334f]">No patient file loaded in exam room</h3>
                      <p className="text-xs text-slate-500 mt-1">Please call a patient from the checked-in dashboard queues, or open any file from clinical registry to initiate consultations, active drug prescriptions, or biochemical diagnostics.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className="bg-[#00334f] text-white px-4 py-2 font-bold rounded text-xs"
                    >
                      Return to dashboard
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SECURE TELEHEALTH VIDEO ROOM */}
            {activeTab === "telehealth" && (
              <TelehealthRoom
                patients={hospitalPatients}
                appointments={tenantAppointments}
                activePatient={
                  hospitalPatients.find((p) => p.id === telehealthFocus?.patientId) ||
                  hospitalPatients.find((p) => {
                    const due = tenantAppointments.find((a) => isDueTelehealth(a));
                    return Boolean(due && p.id === due.patientId);
                  }) ||
                  null
                }
                focusPatientId={telehealthFocus?.patientId}
                focusAppointmentId={telehealthFocus?.appointmentId}
                sessionDoctorName={sessionUser?.name || "Dr. Priyantha Silva"}
                drugsDatabase={drugs}
                onTelehealthSyncSuccess={fetchState}
                onUpdatePatientMedications={(patId, newMedications) => {
                  setPatients(prev => prev.map(p => p.id === patId ? { ...p, currentMedications: newMedications } : p));
                  fetch(`/api/patients/${patId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentMedications: newMedications })
                  }).then(() => fetchState());
                }}
                onInvitePatient={(pName, phone, transport, token) => {
                  // Post sent invite to server notification log history
                  fetch("/api/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      patientName: pName,
                      recipient: phone,
                      transport,
                      templateType: "TELEHEALTH_ACCESS",
                      content: token
                    })
                  }).then(() => {
                    fetchState();
                    alert(`Telehealth conference link successfully dispatched via ${transport}! Link: ${token}`);
                  });
                }}
                onSaveTelehealthNotes={(patId, notes) => {
                  fetch(`/api/patients/${patId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes })
                  }).then(() => fetchState());
                }}
              />
            )}

            {/* TAB: SECURE CLINIC TEAM MESSAGING CHAT */}
            {activeTab === "chat" && (
              <SecureClinicChat
                messages={clinicMessages}
                currentRole={currentRole}
                activeChannel={activeChannel}
                setActiveChannel={setActiveChannel}
                onPostMessage={handlePostSecureClinicChat}
              />
            )}

            {/* TAB: LANKALAB SAMPLE DISPATCH GLOBAL BOARD */}
            {activeTab === "sampleCollection" && (
              <div className="space-y-6">
                <div className="p-6 bg-white border rounded shadow-sm space-y-4">
                  <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#00334f] uppercase tracking-wider flex items-center gap-2">
                        <span>🧪</span>
                        LankaLab Sample Dispatch Hub
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Central management system for clinic laboratory specimen drawn, collections, courier dispatches, and real-time LankaLab Portal Ledger sync.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full flex items-center gap-1.5 self-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> LankaLab API Integrator Active
                    </span>
                  </div>

                  {/* LOG NEW COLLECTION ACCORDION */}
                  <div className="bg-slate-50 p-4 rounded border space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <span>➕</span> Quick-Log New Patient Specimen Drew
                    </h4>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = e.currentTarget;
                        const patId = (f.elements.namedItem("patSelect") as HTMLSelectElement).value;
                        const testName = (f.elements.namedItem("testSelect") as HTMLSelectElement).value;
                        const cat = sampleCategoryForTest(testName);
                        if (!patId) {
                          alert("Please select a registered patient.");
                          return;
                        }
                        const pat = patients.find((p) => p.id === patId);
                        try {
                          const res = await fetch("/api/sample-collections", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              patientId: patId,
                              sampleCategory: cat,
                              patientName: pat?.name,
                              testName,
                              orderedBy: sessionUser?.name || currentRole,
                            })
                          });
                          if (!res.ok) throw new Error("Could not log collection reference");
                          const data = await res.json();
                          if (data.state?.sampleCollections) setSampleCollections(data.state.sampleCollections);
                          else fetchState();
                          alert("Patient clinical sample collection successfully logged!");
                          f.reset();
                        } catch (err: any) {
                          alert("Error: " + err.message);
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Select Patient Profile</label>
                        <select name="patSelect" required className="p-2 border rounded w-full text-xs bg-white">
                          <option value="">-- Choose Registered Citizen --</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (ID: {p.id} - Age: {p.age})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Test / Investigation Profile</label>
                        <select name="testSelect" required className="p-2 border rounded w-full text-xs bg-white">
                          {PATHOLOGY_INVESTIGATIONS.map((inv) => (
                            <option key={inv.name} value={inv.name}>
                              {inv.category}: {inv.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="bg-[#00334f] hover:bg-[#0c4a6e] text-white text-xs font-bold py-2.5 px-4 rounded transition duration-150"
                      >
                        Log Collection Entry
                      </button>
                    </form>
                  </div>

                  <div className="border border-emerald-100 rounded-lg p-3 bg-emerald-50/40">
                    <h4 className="text-[10px] font-bold uppercase text-emerald-900 mb-2">Test / Investigation Profile</h4>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setDispatchTestFilter("ALL")}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          dispatchTestFilter === "ALL" ? "bg-[#00334f] text-white border-[#00334f]" : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        All tests
                      </button>
                      {PATHOLOGY_INVESTIGATIONS.map((inv) => (
                        <button
                          key={inv.name}
                          type="button"
                          onClick={() => setDispatchTestFilter(inv.name)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                            dispatchTestFilter === inv.name ? "bg-[#00334f] text-white border-[#00334f]" : "bg-white text-slate-700 border-slate-200"
                          }`}
                          title={inv.category}
                        >
                          {inv.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FILTERS & SEARCH */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                    <div className="relative w-full sm:max-w-xs">
                      <input
                        type="text"
                        placeholder="Filter by patient name or ID..."
                        className="text-xs p-2 border pl-8 rounded w-full border-slate-200"
                        id="globalSampleSearch"
                        onChange={(e) => {
                          const query = e.target.value.toLowerCase();
                          setSearchQuery(query); 
                        }}
                      />
                      <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[11px] font-bold text-slate-400 mr-1 hidden md:inline">Filters:</span>
                      {["ALL", "PENDING", "COLLECTED", "DELIVERED"].map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            const el = document.getElementById("selectedStatusFilter") as HTMLInputElement;
                            if (el) {
                              el.value = st;
                              fetchState();
                            }
                          }}
                          className="text-[10px] font-bold px-3 py-1.5 border rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {st === "ALL" ? "All Entries" : st}
                        </button>
                      ))}
                      <input type="hidden" id="selectedStatusFilter" defaultValue="ALL" />
                    </div>
                  </div>

                  {/* RESULTS LIST TABLE */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[#00334f] font-bold">
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Patient Name & File</th>
                          <th className="p-3">Investigation</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Collection Details</th>
                          <th className="p-3">Registered By</th>
                          <th className="p-3">LankaLab Sync Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sampleCollections
                          .filter(s => {
                            const sq = searchQuery ? searchQuery.toLowerCase() : "";
                            const filterEl = document.getElementById("selectedStatusFilter") as HTMLInputElement;
                            const filterStatus = filterEl ? filterEl.value : "ALL";
                            
                            const matchesSearch = s.patientName.toLowerCase().includes(sq) || s.patientId.toLowerCase().includes(sq) || s.id.toLowerCase().includes(sq) || (s.testName || "").toLowerCase().includes(sq);
                            const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
                            const matchesTest = dispatchTestFilter === "ALL" || s.testName === dispatchTestFilter;
                            
                            return matchesSearch && matchesStatus && matchesTest;
                          })
                          .map((sample) => (
                            <tr
                              key={sample.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                highlightSampleId === sample.id ? "bg-amber-50 ring-2 ring-amber-300" : ""
                              }`}
                            >
                              <td className="p-3 font-mono font-bold text-slate-400">{sample.id}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{sample.patientName}</div>
                                <div className="text-[10px] text-slate-400">File ID: <button type="button" onClick={() => {
                                  const pObj = patients.find(p => p.id === sample.patientId);
                                  if (pObj) {
                                    setActiveHubPatient(pObj);
                                    setActiveHubInitialTab("samples");
                                  }
                                }} className="underline hover:text-[#00334f] text-slate-550 font-bold">{sample.patientId}</button></div>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-[#00334f]">{sample.testName || "—"}</span>
                                {sample.orderedBy && (
                                  <div className="text-[10px] text-slate-500">Ordered by {sample.orderedBy}</div>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                  sample.sampleCategory.includes("Blood") && sample.sampleCategory.includes("Urinal")
                                    ? "bg-purple-100 text-purple-800"
                                    : sample.sampleCategory.includes("Blood")
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {sample.sampleCategory}
                                </span>
                              </td>
                              <td className="p-3">
                                {sample.status === "PENDING" && <span className="text-amber-600 font-medium italic">Awaiting Nurse drawing...</span>}
                                {sample.status === "COLLECTED" && (
                                  <div className="space-y-0.5">
                                    <span className="text-emerald-700 font-bold">Collected ✓</span>
                                    <div className="text-[9px] text-slate-400 font-mono">{sample.collectedTime}</div>
                                  </div>
                                )}
                                {sample.status === "DELIVERED" && (
                                  <div className="space-y-0.5 font-sans">
                                    <span className="text-slate-800 font-semibold">🏨 {sample.labName}</span>
                                    <div className="text-[10px] text-slate-500">C: {sample.deliveryPersonName}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">{sample.deliveredTime}</div>
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {sample.registeredBy ? (
                                  <span className="font-bold text-emerald-800">{sample.registeredBy}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Not registered</span>
                                )}
                              </td>
                              <td className="p-3">
                                {sample.lankaLabSyncStatus === "SYNCED" ? (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-250 rounded inline-block">
                                      SYNCED
                                    </span>
                                    <div className="font-mono text-[9px] font-semibold text-slate-500">TX: {sample.lankaLabLedgerKey}</div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 border rounded">
                                    NOT SYNCED
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 flex-wrap">
                                  {!sample.registeredBy && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const registrar = sessionUser?.name || currentRole;
                                        try {
                                          const r = await fetch(`/api/sample-collections/${sample.id}/register`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ registeredBy: registrar }),
                                          });
                                          if (!r.ok) throw new Error();
                                          const data = await r.json();
                                          if (data.state?.sampleCollections) setSampleCollections(data.state.sampleCollections);
                                          else fetchState();
                                        } catch (e) {
                                          alert("Could not register name.");
                                        }
                                      }}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold p-1 px-3 rounded text-[10px]"
                                    >
                                      Register my name
                                    </button>
                                  )}
                                  {sample.status === "PENDING" && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const r = await fetch(`/api/sample-collections/${sample.id}/collect`, { method: "POST" });
                                          if (!r.ok) throw new Error();
                                          fetchState();
                                          alert("Sample drawer completed. Specimen marked as COLLECTED!");
                                        } catch (e) {
                                          alert("Error saving record.");
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 px-3 rounded text-[10px]"
                                    >
                                      Collected
                                    </button>
                                  )}

                                  {sample.status === "COLLECTED" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const pObj = patients.find(p => p.id === sample.patientId);
                                        if (pObj) {
                                          setActiveHubPatient(pObj);
                                          setActiveHubInitialTab("samples");
                                        }
                                      }}
                                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold p-1 px-3 rounded text-[10px]"
                                    >
                                      Delivered
                                    </button>
                                  )}

                                  {sample.status === "DELIVERED" && (
                                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                      ✓ Complete
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}

                        {sampleCollections.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-12 italic text-slate-400">
                              No specimen collection requests registered on system. Use the builder above to log one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: ADMIN MODULE PANEL & ADVANCED ENTERPRISE FINANCE LEDGER */}
            {activeTab === "admin" && (
              <div className="space-y-6">
                {/* 1. CLINICAL & ENTERPRISE FINANCIAL LEDGER */}
                <div className="bg-white p-6 border rounded shadow-sm space-y-4">
                  <div className="border-b pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#00334f] uppercase tracking-wider">Clinical & Enterprise Finance Ledger</h3>
                      <p className="text-[11px] text-slate-500">Live analytics of all active consultation receipts, operations overheads, and net ROI calculations.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => setShowLedgerExplorer(true)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                      >
                        <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                        Go Inside Ledger Explorer
                      </button>
                      <span className="bg-[#ebf5f3] text-[#006f66] text-[10px] font-bold px-2.5 py-1 rounded border border-teal-200 uppercase tracking-tight">Active Fiscal Period</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* card: income */}
                    <div 
                      onClick={() => { setLedgerFilterTab("income"); setShowLedgerExplorer(true); }}
                      className="bg-emerald-50/40 p-4 border border-emerald-200/60 rounded flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
                      title="Click to view income transactions histoy"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Total Income (Settled)</span>
                        <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-700 group-hover:bg-emerald-200">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-bold font-mono text-emerald-900">Rs. {totalIncome.toLocaleString()}.00</span>
                        <p className="text-[10px] text-emerald-700 mt-1">✔ Cash & Suwasiri payments cleared</p>
                      </div>
                      <button className="text-left text-[9px] text-emerald-800 hover:underline mt-2.5 font-bold">Go Inside Income History →</button>
                    </div>

                    {/* card: expenses */}
                    <div 
                      onClick={() => { setLedgerFilterTab("expense"); setShowLedgerExplorer(true); }}
                      className="bg-rose-50/40 p-4 border border-rose-200/60 rounded flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
                      title="Click to view bills, salaries and rent logs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Total Operating Expenses</span>
                        <div className="bg-rose-100 p-1.5 rounded-full text-rose-700 group-hover:bg-rose-200">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-bold font-mono text-rose-900">Rs. {totalExpenses.toLocaleString()}.00</span>
                        <p className="text-[10px] text-rose-700 mt-1">🛠 Rent, salary, utilities & overheads</p>
                      </div>
                      <button className="text-left text-[9px] text-rose-800 hover:underline mt-2.5 font-bold">Go Inside Bill & Salary Logs →</button>
                    </div>

                    {/* card: net profits */}
                    <div 
                      onClick={() => { setLedgerFilterTab("all"); setShowLedgerExplorer(true); }}
                      className="bg-blue-50/40 p-4 border border-blue-200/60 rounded flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Net Clinic Profit</span>
                        <div className="bg-blue-100 p-1.5 rounded-full text-blue-700 group-hover:bg-blue-200">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xl font-bold font-mono ${totalIncome - totalExpenses >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                          Rs. {(totalIncome - totalExpenses).toLocaleString()}.00
                        </span>
                        <p className="text-[10px] text-blue-700 mt-1">📊 Operating surplus / deficit</p>
                      </div>
                      <button className="text-left text-[9px] text-blue-800 hover:underline mt-2.5 font-bold">Go Inside Complete Ledger →</button>
                    </div>

                    {/* card: outstanding / remaining payments */}
                    <div 
                      className="bg-amber-50/40 p-4 border border-amber-200/60 rounded flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Remaining Payments</span>
                        <div className="bg-amber-100 p-1.5 rounded-full text-amber-700">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-bold font-mono text-amber-900">Rs. {totalRemainingPayment.toLocaleString()}.00</span>
                        <p className="text-[10px] text-amber-700 mt-1">⏳ PENDING/OVERDUE bills outstanding</p>
                      </div>
                      <span className="text-[9px] text-amber-700 mt-2.5 block font-bold">Subject to patient settlement</span>
                    </div>
                  </div>
                </div>

                {/* 2. DAY-BY-DAY OPERATIONS AUDIT LEDGER */}
                <div className="bg-white p-6 border rounded shadow-sm space-y-3">
                  <div className="border-b pb-2">
                    <h3 className="font-serif font-bold text-sm text-[#00334f] uppercase tracking-wider">Day-by-Day Operations & Consultation Logs</h3>
                    <p className="text-[11px] text-slate-500">Live operational audit detailing daily incomes, completed GP consultations, and remaining billing receivables.</p>
                  </div>

                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-2.5 font-bold text-slate-700">Service Date</th>
                          <th className="p-2.5 font-bold text-slate-700">Consultations Done</th>
                          <th className="p-2.5 font-bold text-slate-700">Daily Income (Settled)</th>
                          <th className="p-2.5 font-bold text-gray-700">Remaining / Outstanding Amount</th>
                          <th className="p-2.5 font-bold text-slate-700">Diagnostic Summary Indicator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600 leading-tight">
                        {uniqueDates.map(dateKey => {
                          const stats = financialPeriods[dateKey] || { income: 0, consultations: 0, settledCount: 0, pendingCount: 0, remainingAmount: 0 };
                          return (
                            <tr key={dateKey} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold font-mono text-slate-900">{dateKey}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${stats.consultations > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {stats.consultations} Completed GP sessions
                                </span>
                              </td>
                              <td className="p-2.5">
                                <strong className="text-emerald-700 font-mono">Rs. {stats.income.toLocaleString()}.00</strong>
                              </td>
                              <td className="p-2.5">
                                <span className={`font-mono ${stats.remainingAmount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                                  Rs. {stats.remainingAmount.toLocaleString()}.00 
                                </span>
                                {stats.pendingCount > 0 && (
                                  <span className="text-[9px] text-slate-400 ml-1.5">({stats.pendingCount} unpaid)</span>
                                )}
                              </td>
                              <td className="p-2.5 text-[10px]">
                                <span className={`inline-flex items-center gap-1 font-bold ${stats.income > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${stats.income > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`}></span>
                                  {stats.income > 0 ? "Operational Revenue Active" : "Operational Idle"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. ADMINISTRATION FORMS GRID: CO-EXISTING CORES */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 bg-white p-6 border rounded shadow-sm">
                  {/* Left Form: configure drugs */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="font-serif font-bold text-xs text-[#00334f] uppercase tracking-wider">Medicine Directory Database</h3>
                      <p className="text-[10px] text-slate-500">Inject high-grade drugs into prescription dropdowns.</p>
                    </div>

                    <form onSubmit={handleAdminAddDrug} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Standard Pharmaceutical Formulation Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Paracetamol 500mg"
                          className="w-full p-2 border bg-slate-50 rounded"
                          value={newAdminDrugName}
                          onChange={(e) => setNewAdminDrugName(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="bg-[#00334f] text-white py-1.5 px-4 rounded font-bold text-xs">Register drug</button>
                    </form>

                    {/* reseeding datastore config */}
                    <div className="border-t pt-4 space-y-2 text-xs">
                      <h4 className="font-bold text-red-700 uppercase mb-1">Reseed Clinical datastore</h4>
                      <p className="text-[11px] text-slate-500 leading-snug">Resets schedules, check-ins, and billing back to default.</p>
                      <button
                        type="button"
                        onClick={handleResetClinicalDatastore}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-[10px] transition-colors"
                      >
                        Reset Database & Seeding Templates
                      </button>
                    </div>
                  </div>

                  {/* Center Form: register expense */}
                  <div className="space-y-4 border-l pl-6">
                    <div className="border-b pb-2">
                      <h3 className="font-serif font-bold text-xs text-slate-700 uppercase tracking-wider">Log Clinic Operating Expense</h3>
                      <p className="text-[10px] text-slate-500">Log expenditures to compute net clinics operating margin.</p>
                    </div>

                    <form onSubmit={handleAddExpense} className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-slate-500 font-bold">Category</label>
                          <select
                            className="w-full p-2 border bg-white rounded"
                            value={newExpCategory}
                            onChange={(e) => setNewExpCategory(e.target.value)}
                          >
                            <option value="Medical Supplies">Medical Supplies</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Salaries">Salaries</option>
                            <option value="Rent">Rent</option>
                            <option value="Diagnostics">Diagnostics</option>
                            <option value="Other">Other Operational</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 font-bold">Amount (Rs.)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 15000"
                            className="w-full p-2 border bg-slate-50 rounded"
                            value={newExpAmount}
                            onChange={(e) => setNewExpAmount(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Description / Vendor Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Restocked 20 syringes canisters"
                          className="w-full p-2 border bg-slate-50 rounded"
                          value={newExpDescription}
                          onChange={(e) => setNewExpDescription(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Expense Date</label>
                        <input
                          type="date"
                          required
                          className="w-full p-2 border bg-slate-50 rounded"
                          value={newExpDate}
                          onChange={(e) => setNewExpDate(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-1.5 font-bold rounded">
                        Log Expense
                      </button>
                    </form>

                    <div className="border-t pt-3 space-y-1 text-[10px]">
                      <span className="font-bold text-slate-600 block uppercase mb-1">Expense Log (Last 3)</span>
                      <div className="max-h-[85px] overflow-auto space-y-1 pr-1 font-mono">
                        {expenses.slice().reverse().map(e => (
                          <div key={e.id} className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-200">
                            <span className="truncate max-w-[120px] text-slate-700" title={e.description}>
                              {e.category}: {e.description || e.category}
                            </span>
                            <div className="flex items-center gap-1 text-slate-900 font-bold">
                              <span>Rs. {e.amount.toLocaleString()}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(e.id)}
                                className="text-red-600 hover:bg-red-50 p-0.5 rounded ml-1 transition-colors font-sans font-bold"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Form: SMS sender */}
                  <div className="space-y-4 border-l pl-6">
                    <div className="border-b pb-2">
                      <h3 className="font-serif font-bold text-xs text-slate-700 uppercase tracking-wider">SMS / WhatsApp Broadcast dispatcher</h3>
                      <p className="text-[10px] text-slate-500">Transmit custom reminders or laboratory completed reports instantly.</p>
                    </div>

                    <form onSubmit={handleAdminDispatchBroadcast} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-slate-500 font-bold">Recipient Patient</label>
                          <select
                            required
                            className="w-full p-2 border bg-white rounded"
                            value={smsTargetPatient}
                            onChange={(e) => setSmsTargetPatient(e.target.value)}
                          >
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                              <option key={p.id} value={p.id}>{p.name} [{p.phone}]</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 font-bold">Protocol Transport</label>
                          <select
                            className="w-full p-2 border bg-white rounded"
                            value={smsTransport}
                            onChange={(e) => setSmsTransport(e.target.value as any)}
                          >
                            <option value="WhatsApp">WhatsApp Message</option>
                            <option value="SMS">SMS standard cell</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-slate-500 font-bold">Direct Template</label>
                          <select
                            className="w-full p-2 border bg-white rounded"
                            value={smsTemplate}
                            onChange={(e) => setSmsTemplate(e.target.value)}
                          >
                            <option value="PRESCRIPTION_READY">Prescription Ready pickup</option>
                            <option value="APPOINTMENT_REMINDER">Appointment confirmation check</option>
                            <option value="LAB_COMPLETED">Lab report analysis outcomes</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-500 font-bold">Custom dispatch payload (Leave blank for default templates)</label>
                        <textarea
                          placeholder="Type custom sms broadcast lines..."
                          className="w-full p-2 border h-14 rounded"
                          value={smsCustomText}
                          onChange={(e) => setSmsCustomText(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-1.5 font-bold rounded">
                        Dispatch Broadcast
                      </button>
                    </form>
                  </div>
                </div>

                {/* Audit Transmission Logs list */}
                <div className="bg-white p-6 border rounded shadow-sm">
                  <div className="border-b pb-2 mb-3">
                    <h3 className="font-serif font-bold text-sm text-[#00334f]">WhatsApp & SMS Transmission history logs</h3>
                    <p className="text-[11px] text-slate-500">Audit tracker of all system notifications dispatched to patients cell.</p>
                  </div>

                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="p-2.5 font-bold text-slate-700">Patient</th>
                        <th className="p-2.5 font-bold text-slate-700">Mobile Phone</th>
                        <th className="p-2.5 font-bold text-slate-700">Type Route</th>
                        <th className="p-2.5 font-bold text-slate-700">Date Issued</th>
                        <th className="p-2.5 font-bold text-slate-700">Dispatched Payload text</th>
                        <th className="p-2.5 font-bold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600 leading-tight">
                      {notifications.map(no => (
                        <tr key={no.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-[#00334f]">{no.patientName}</td>
                          <td className="p-2.5">{no.recipient}</td>
                          <td className="p-2.5">
                            <span className="bg-slate-100 border text-slate-700 text-[9px] font-bold px-1.5 rounded">{no.transport}</span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">{no.date}</td>
                          <td className="p-2.5 italic text-slate-500 truncate max-w-sm">"{no.content}"</td>
                          <td className="p-2.5 text-emerald-700 font-bold">✔ {no.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: RECEIPTS & INVOICES */}
            {activeTab === "billing" && (
              <div className="bg-white p-6 border rounded space-y-6">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#00334f]">Invoices & Billing Panel</h2>
                  <p className="text-xs text-slate-500">Verify payments, manage consultation fees and print medical receipts (Rs).</p>
                </div>

                <div className="border rounded overflow-hidden">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#d8e3fb] border-b">
                      <tr>
                        <th className="p-3 font-bold text-gray-700">Invoice ID</th>
                        <th className="p-3 font-bold text-gray-700">Patient Name</th>
                        <th className="p-3 font-bold text-gray-700">Service Rendered</th>
                        <th className="p-3 font-bold text-gray-700">Date Issued</th>
                        <th className="p-3 font-bold text-gray-700">Amount</th>
                        <th className="p-3 font-bold text-gray-700">Status</th>
                        <th className="p-3 font-bold text-gray-700 text-right">Invoice actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {billing.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-500">{invoice.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {invoice.suwasiriReceiptUrl ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReceiptUrl(invoice.suwasiriReceiptUrl || null);
                                    setSelectedReceiptPatientName(invoice.patientName);
                                  }}
                                  className="w-10 h-10 border-2 border-emerald-500 rounded overflow-hidden hover:opacity-85 transition-opacity relative shrink-0 cursor-pointer shadow active:scale-95 group bg-slate-100"
                                  title="Click to view full receipt"
                                >
                                  <img
                                    src={invoice.suwasiriReceiptUrl}
                                    alt="Suwasiri Receipt"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] font-bold text-white transition-opacity uppercase font-sans">
                                    VIEW
                                  </div>
                                </button>
                              ) : (
                                <div className={`flex flex-col gap-0.5 items-center justify-center w-10 h-10 border rounded shrink-0 relative ${invoice.paidBySuwasiri ? 'border-dashed border-rose-400 bg-rose-50 text-rose-500 animate-pulse' : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'}`} title={invoice.paidBySuwasiri ? "Suwasiri Paid - upload receipt required!" : "No receipt uploaded"}>
                                  <Upload className="w-3.5 h-3.5 text-current" />
                                  <span className="text-[6px] uppercase font-sans tracking-tighter text-center font-black leading-none bg-white p-0.5 border rounded shadow-xs">
                                    {invoice.paidBySuwasiri ? "UPLOAD" : "NO REC"}
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-700">{invoice.patientName}</span>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {invoice.paidBySuwasiri && (
                                    <span className="inline-flex bg-emerald-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      ⚡ Paid by Suwasiri
                                    </span>
                                  )}
                                  
                                  {/* Upload triggers */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-all flex items-center gap-0.5 shadow-sm hover:text-slate-800">
                                      <Upload className="w-2.5 h-2.5" />
                                      <span>Upload Receipt</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleUploadReceipt(invoice.id, e.target.files[0]);
                                          }
                                        }}
                                      />
                                    </label>

                                    {!invoice.suwasiriReceiptUrl && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const mockReceiptUrl = "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=260&auto=format&fit=crop";
                                          const res = await fetch(`/api/billing/${invoice.id}/upload-receipt`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              receiptUrl: mockReceiptUrl,
                                              paidBySuwasiri: true
                                            })
                                          });
                                          if (res.ok) {
                                            const data = await res.json();
                                            setBilling(data.state.billing);
                                            alert(`⚡ Receipt auto-generated & uploaded under Suwasiri app records for ${invoice.patientName}!`);
                                          }
                                        }}
                                        className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1 py-0.5 rounded text-[8px] font-black tracking-tight cursor-pointer transition-colors"
                                      >
                                        [Mock Upload]
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{invoice.service}</td>
                          <td className="p-3 text-slate-400">{invoice.date}</td>
                          <td className="p-3 font-bold text-[#00334f]">Rs {invoice.amount.toLocaleString()}.00</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              invoice.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 border"
                                : "bg-amber-50 text-amber-800 border-amber-200 border"
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {invoice.status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => handleSettleReceipt(invoice.id, "PAID")}
                                    className="bg-[#00334f] hover:bg-[#002235] text-white px-2 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Cash Settle
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/billing/${invoice.id}/sync-suwasiri`, { method: "POST" });
                                        if (!res.ok) throw new Error("Synchronization refused or gateway is busy");
                                        const data = await res.json();
                                        setBilling(data.state.billing);
                                        alert(`⚡ Suwasiri App Confirmed Payment Recieved! Received automatic callback sync for invoice: ${invoice.id}. Marked as paid by Suwasiri.`);
                                      } catch (err: any) {
                                        alert("Error syncing Suwasiri payment: " + err.message);
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[9px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    Sync Suwasiri
                                  </button>
                                </>
                              ) : (
                                <span className="text-emerald-700 font-extrabold text-[10px] flex items-center gap-1">
                                  ✓ Settled {invoice.paidBySuwasiri && <span className="text-[10px] text-emerald-600 italic font-medium font-sans">(Suwasiri)</span>}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: REPORTS & ANALYTICS */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <ReportsAnalyticsView
                  patients={patients}
                  appointments={appointments}
                  billingList={billing}
                  recalls={recalls}
                />
              </div>
            )}

            {/* TAB: PUBLIC ONLINE BOOKING GATEWAY */}
            {activeTab === "publicBooking" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-[#00334f] text-white p-6 rounded-lg shadow-sm border border-[#002235]">
                  <h2 className="font-serif font-bold text-xl flex items-center gap-2">
                    <span className="p-1 px-2 bg-sky-600 rounded text-xs">ONLINE</span>
                    Sri Lankan GP Care – Public Online Booking & Auto-Registration Portal
                  </h2>
                  <p className="text-xs text-sky-200 mt-1 max-w-2xl leading-relaxed">
                    This public-facing portal connects citizens directly to our clinics. Completing a reservation automatically registers your electronic health profile, raises an initial invoice, and posts an instant notification to the clinical team.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Booking Form */}
                  <div className="lg:col-span-7 bg-white p-6 border rounded shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-[#00334f] text-base border-b pb-2 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-sky-600" />
                      Patient Demographics & Appointment Slot Details
                    </h3>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const payload = {
                          name: formData.get("name"),
                          age: formData.get("age"),
                          gender: formData.get("gender"),
                          phone: formData.get("phone"),
                          email: formData.get("email"),
                          medicalCenter: formData.get("medicalCenter"),
                          date: formData.get("date"),
                          time: formData.get("time"),
                          reason: formData.get("reason"),
                        };

                        if (!payload.name || !payload.age || !payload.phone || !payload.email) {
                          alert("Please fill in all required fields.");
                          return;
                        }

                        try {
                          const res = await fetch("/api/online-booking", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });
                          if (!res.ok) throw new Error("Could not register online booking.");
                          const data = await res.json();
                          
                          // Sync main states
                          if (data.state.patients) setPatients(data.state.patients);
                          if (data.state.appointments) setAppointments(data.state.appointments);
                          if (data.state.billing) setBilling(data.state.billing);
                          if (data.state.clinicMessages) setClinicMessages(data.state.clinicMessages);

                          // Set successful booking result states to show receipt
                          setLastOnlineBookingResult({
                            patient: data.patient,
                            appointment: data.appointment,
                            invoiceAmount: 1500,
                          });
                          
                          e.currentTarget.reset();
                        } catch (err: any) {
                          alert("Error processing booking: " + err.message);
                        }
                      }}
                      className="space-y-4 text-xs font-semibold text-slate-600"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Patient Full Name *</label>
                          <input
                            type="text"
                            required
                            name="name"
                            placeholder="e.g. Nimani Rajasinghe"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs font-medium focus:border-sky-600 text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Age *</label>
                          <input
                            type="number"
                            required
                            name="age"
                            placeholder="e.g. 29"
                            min="1"
                            max="120"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs font-medium focus:border-sky-600 text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Biological Gender *</label>
                          <select
                            required
                            name="gender"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs text-slate-800"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Sri Lankan Phone Number *</label>
                          <input
                            type="text"
                            required
                            name="phone"
                            placeholder="e.g. +94 77 111 2222"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs font-medium focus:border-sky-600 text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Email Address (for MC dispatch) *</label>
                          <input
                            type="email"
                            required
                            name="email"
                            placeholder="e.g. nimani.r@gmail.com"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs font-medium focus:border-sky-600 text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Target Medical Center *</label>
                          <select
                            required
                            name="medicalCenter"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs text-emerald-800 font-bold"
                          >
                            <option value="Colombo Central Clinic">Colombo Central Clinic</option>
                            <option value="Kandy Wellness Center">Kandy Wellness Center</option>
                            <option value="Galle GP Care">Galle GP Care</option>
                            <option value="Jaffna Medical Hub">Jaffna Medical Hub</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Preferred Booking Date *</label>
                          <input
                            type="date"
                            required
                            name="date"
                            defaultValue={new Date().toISOString().split("T")[0]}
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs font-medium text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 uppercase">Preferred Time Slot *</label>
                          <select
                            required
                            name="time"
                            className="w-full p-2.5 border bg-white rounded outline-none text-xs text-slate-800"
                          >
                            <option value="08:30 AM">08:30 AM (Early session)</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="11:30 AM">11:30 AM</option>
                            <option value="01:30 PM">01:30 PM (Midday)</option>
                            <option value="03:00 PM">03:00 PM</option>
                            <option value="04:30 PM">04:30 PM (Evening slot)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-500 uppercase">Brief Consultation Reason *</label>
                        <input
                          type="text"
                          required
                          name="reason"
                          placeholder="e.g. Acute chest congestion, viral symptoms, GP rest certificate request"
                          className="w-full p-2.5 border bg-white rounded outline-none text-xs font-medium focus:border-sky-600 text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded shadow transition duration-150 flex items-center justify-center gap-2 text-sm"
                      >
                        <ShieldCheck className="w-5 h-5 text-emerald-100" />
                        Confirm Slot & Auto-Register Health File
                      </button>
                    </form>
                  </div>

                  {/* Booking Receipt / Feedback Box */}
                  <div className="lg:col-span-5 bg-slate-50 border rounded-lg p-6 space-y-4">
                    <h4 className="font-serif font-bold text-sm text-[#00334f] flex items-center gap-1.5 border-b pb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Live Gate Registration Tracker
                    </h4>

                    {lastOnlineBookingResult ? (
                      <div className="space-y-4 animate-in fade-in transition duration-300 font-sans">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded text-xs space-y-2">
                          <p className="font-bold flex items-center gap-1 text-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                            REGISTRATION SUCCESSFUL!
                          </p>
                          <p>
                            Patient slot secured inside <strong>Sri Lankan GP Care</strong> under medical registry files.
                          </p>
                        </div>

                        <div className="bg-white border rounded p-4 text-xs space-y-3">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-slate-400">Assigned ID No:</span>
                            <span className="font-mono font-bold text-[#00334f] text-sm bg-[#e7eeff] px-2 py-0.5 rounded">
                              {lastOnlineBookingResult.patient.id}
                            </span>
                          </div>

                          <div className="space-y-1 border-b pb-2">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Name</span>
                            <strong className="text-slate-800">{lastOnlineBookingResult.patient.name} ({lastOnlineBookingResult.patient.age} yrs, {lastOnlineBookingResult.patient.gender})</strong>
                          </div>

                          <div className="space-y-1 border-b pb-2">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Medical Center Branch</span>
                            <span className="text-emerald-800 font-bold flex items-center gap-1">
                              ⚕ {lastOnlineBookingResult.patient.medicalCenter}
                            </span>
                          </div>

                          <div className="space-y-1 border-b pb-2">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Consultation Slot secured</span>
                            <strong className="text-slate-700">
                              {lastOnlineBookingResult.appointment.date} at {lastOnlineBookingResult.appointment.time}
                            </strong>
                            <p className="text-[10px] text-slate-400">Reason: {lastOnlineBookingResult.appointment.reason}</p>
                          </div>

                          <div className="pt-1 flex justify-between items-center text-[11px]">
                            <span className="text-slate-500">Government GP Consultation Fee:</span>
                            <strong className="text-[#00334f]">Rs. {lastOnlineBookingResult.invoiceAmount}.00 (Pending)</strong>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 italic text-center">
                          * Patient can now be checked, edited, and rest certificate / medical leave can be filled by switching to clinical views.
                        </p>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveHubPatient(lastOnlineBookingResult.patient);
                            }}
                            className="flex-1 bg-[#00334f] text-white hover:bg-[#0c4a6e] font-bold p-2 rounded text-xs text-center transition"
                          >
                            Open Details & Enter Rest / MC
                          </button>
                          <button
                            type="button"
                            onClick={() => setLastOnlineBookingResult(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold p-2 px-3 rounded text-xs transition"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 italic text-xs space-y-2">
                        <Globe className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                        <p>Waiting for consumer registration form submission...</p>
                        <p className="text-[10px] max-w-xs mx-auto">
                          Once a citizen registers their appointment, their live medical record and Sri Lankan GP clinical file displays here interactively.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CLINICAL CALCULATORS (STANDALONE VIEW) */}
            {activeTab === "calculators" && (
              <div className="space-y-6">
                <div className="bg-white p-6 border rounded-xl shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-sky-600" />
                        <h2 className="font-serif font-bold text-xl text-[#00334f]">Clinical Calculators Suite</h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Validated diagnostic scoring engines: Body Mass Index (BMI), Australian CVD Risk (Framingham/NVDPA), AUSDRISK, eGFR (CKD-EPI 2021), Blood Pressure Classification, Pregnancy EDD & Paediatric Dosing.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Select Active Patient:</span>
                      <select 
                        className="text-xs p-2 border rounded-lg bg-slate-50 font-bold text-[#00334f] outline-none"
                        value={activeDoctorRecordPatient?.id || (patients[0]?.id || "")}
                        onChange={(e) => {
                          const found = patients.find(p => p.id === e.target.value);
                          if (found) setActiveDoctorRecordPatient(found);
                        }}
                      >
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.age}y, {p.gender})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Render the embedded clinical calculators component */}
                  <div className="bg-slate-50 p-6 rounded-xl border">
                    <ClinicalCalculatorsModal 
                      patient={activeDoctorRecordPatient || patients[0]} 
                      onClose={() => setActiveTab("dashboard")} 
                      onSaveToConsultation={(resultText) => {
                        alert("Calculator result copied to clinical consultation clipboard:\n\n" + resultText);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RECALLS & PREVENTIVE HEALTH REMINDERS */}
            {activeTab === "recalls" && (
              <div className="space-y-6">
                <RecallsDashboard
                  patients={patients}
                  recalls={recalls}
                  onSendNotification={(recallId, method) => {
                    const rec = recalls.find(r => r.id === recallId);
                    if (rec) {
                      setRecalls(prev => prev.map(r => r.id === recallId ? {
                        ...r,
                        status: "SMS_SENT",
                        lastContactedDate: new Date().toISOString().split("T")[0],
                        contactMethod: method as any
                      } : r));
                      alert(`⚡ Transmission successful: Dispatched ${method} recall reminder to ${rec.patientName} (${rec.patientPhone || rec.patientEmail})!`);
                    }
                  }}
                  onBookAppointment={(recall) => {
                    setNewAptPatientId(recall.patientId);
                    setNewAptReason(`Preventive Recall: ${recall.category}`);
                    setShowAptModal(true);
                  }}
                  onCreateRecall={(newRecall) => {
                    const pat = patients.find(p => p.id === newRecall.patientId);
                    const record: RecallRecord = {
                      id: "rec-" + Date.now(),
                      patientId: newRecall.patientId || "pat-1",
                      patientName: pat ? pat.name : (newRecall.patientName || "Patient"),
                      patientPhone: pat ? pat.phone : "+94 77 123 4567",
                      patientEmail: pat ? pat.email : "patient@email.lk",
                      category: (newRecall.category as any) || "Diabetes Review",
                      urgency: newRecall.urgency || "ROUTINE",
                      dueDate: newRecall.dueDate || new Date().toISOString().split("T")[0],
                      status: "DUE",
                      notes: newRecall.notes || "Preventive screening reminder",
                      assignedDoctor: newRecall.assignedDoctor || "Dr. Priyantha Silva"
                    };
                    setRecalls(prev => [record, ...prev]);
                    alert(`Created preventive recall for ${record.patientName} under ${record.category}!`);
                  }}
                  onMarkComplete={(recallId) => {
                    setRecalls(prev => prev.map(r => r.id === recallId ? {
                      ...r,
                      status: "COMPLETED"
                    } : r));
                    alert("Recall successfully marked as completed!");
                  }}
                />
              </div>
            )}

            {/* TAB: AI MEDICAL FEATURES HUB */}
            {activeTab === "ai_features" && (
              <div className="space-y-6">
                <AIFeaturesHub
                  patients={patients}
                  activePatient={selectedConsultPatient || activeDoctorRecordPatient || patients[0]}
                  onCommitSoapToChart={(patientId, soap) => {
                    alert(`SOAP Note successfully committed to chart for patient (${patientId}):\n\nSubjective: ${soap.subjective}\nObjective: ${soap.objective}\nAssessment: ${soap.assessment}\nPlan: ${soap.plan}`);
                  }}
                  onApplyPrescriptionSuggestion={(patientId, rx) => {
                    alert(`Prescription suggestion applied: ${rx.drug} ${rx.dose} (${rx.frequency})`);
                  }}
                  onApplyRecallSuggestion={(patientId, title) => {
                    alert(`Preventive recall scheduled: ${title}`);
                  }}
                />
              </div>
            )}

            {/* TAB: PATHOLOGY & DIAGNOSTICS HUB */}
            {activeTab === "pathology" && (
              <div className="space-y-6">
                <PathologyHub
                  patients={patients}
                  labOrders={labOrders}
                  currentRole={currentRole}
                  onOpenPatientEverything={(pat) => setActiveDoctorRecordPatient(pat)}
                  onStartConsultation={(pat) => handleStartConsultation(pat)}
                  onOrderLabTest={handleHubOrderLabTest}
                  onMarkLabReviewed={handleMarkLabReviewed}
                />
              </div>
            )}

            {/* TAB: DOCUMENT MANAGEMENT HUB */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <DocumentManagementHub
                  patients={patients}
                  onUploadDocument={(doc) => {
                    alert(`Clinical document "${doc.title}" successfully uploaded and registered!`);
                  }}
                  onAllocateDocument={(docId, patientId, doctorName) => {
                    alert(`Document allocated to patient (${patientId}) under ${doctorName}.`);
                  }}
                  onDigitalSign={(docId, doctorName) => {
                    alert(`Document digitally signed and verified by ${doctorName}.`);
                  }}
                  onOpenPatientEverything={(pat) => setActiveDoctorRecordPatient(pat)}
                  onStartConsultation={(pat) => handleStartConsultation(pat)}
                />
              </div>
            )}

            {activeTab === "platform" && (
              <PlatformConsoleView
                hospitals={hospitals}
                staffUsers={staffUsers}
                memberships={memberships}
                roles={roleDefs}
                onCreateHospital={async (name) => {
                  const res = await fetch("/api/tenancy/hospitals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                  });
                  const data = await res.json();
                  if (data.hospital) {
                    setHospitals((prev) => [...prev, data.hospital]);
                    if (data.roles) setRoleDefs((prev) => [...prev, ...data.roles]);
                  }
                }}
                onToggleHospitalStatus={async (hospitalId, status) => {
                  const res = await fetch(`/api/tenancy/hospitals/${hospitalId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                  });
                  const data = await res.json();
                  if (data.hospital) {
                    setHospitals((prev) => prev.map((h) => (h.id === data.hospital.id ? data.hospital : h)));
                  }
                }}
              />
            )}

            {/* TAB: PRACTICE MANAGER */}
            {activeTab === "practiceManager" && (
              <div className="space-y-6">
                <PracticeManagerView
                  currentRole={currentRole}
                  canManage={canEditRbac || currentRole === "Practice Manager"}
                  hospital={activeHospital}
                  branches={hospitalBranches}
                  roles={hospitalRoles}
                  staffList={hospitalStaff}
                  onSaveStaff={persistStaffDirectory}
                  onCreateBranch={(payload) => persistBranches("create", payload)}
                  onUpdateBranch={(payload) => persistBranches("update", payload)}
                  onDeleteBranch={(id) => persistBranches("delete", { id })}
                />
              </div>
            )}

            {/* TAB: SECURITY MODULE & RBAC */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <SecurityModuleView
                  currentRole={currentRole}
                  patients={hospitalPatients}
                  hospitalName={activeHospital?.name}
                  hospitalId={sessionHospitalId}
                  roles={hospitalRoles}
                  canEditRbac={canEditRbac}
                  isPlatformSA={isPlatformSA}
                  onSaveRoles={persistRoles}
                  onAddRole={addHospitalRole}
                  onRemoveRole={removeHospitalRole}
                />
              </div>
            )}

            {/* TAB: MEDICO-LEGAL AUDIT LOG TRAIL */}
            {activeTab === "audit_logs" && (
              <div className="space-y-6">
                <AuditLogView patients={hospitalPatients} />
              </div>
            )}

            {/* TAB: SYSTEM ADMIN & AUDIT TRAIL */}
            {activeTab === "systemAdmin" && (
              <div className="space-y-6">
                <SystemAdminView />
              </div>
            )}

            {/* TAB: PATIENT PORTAL */}
            {activeTab === "patientPortal" && (
              <div className="space-y-6">
                <PatientPortalView 
                  patient={selectedPatientForPortal || patients[0] || {
                    id: "9942-LK",
                    name: "Fatima Zahra",
                    age: 38,
                    gender: "Female",
                    bloodType: "B+",
                    allergies: "Penicillin (Hives / Anaphylaxis risk)",
                    notes: "Type 2 Diabetes Mellitus & Hypertension",
                    phone: "+94 77 982 1100",
                    email: "fatima.zahra@email.lk",
                    address: "No. 45/2 Galle Road, Colombo 03, Western Province",
                    medicalCenter: "Colombo Central Clinic",
                    medicareNumber: "2948 10294 1 / 1 (Exp: 11/2028)",
                    ihiNumber: "8003608129038472",
                    emergencyContact: {
                      name: "Mohamed Zahra",
                      relationship: "Spouse",
                      phone: "+94 77 982 1101"
                    },
                    nextOfKin: {
                      name: "Amina Zahra",
                      relationship: "Daughter",
                      phone: "+94 77 982 1102"
                    },
                    preferredGp: "Dr. Priyantha Silva (FRACGP, MBBS)",
                    activeMedications: [
                      "Metformin Hydrochloride 500mg (1 tablet BD with meals)",
                      "Telmisartan 40mg (1 tablet OD morning)",
                      "Atorvastatin 20mg (1 tablet nocte)"
                    ],
                    medicalHistory: [
                      "2019: Type 2 Diabetes Mellitus diagnosed",
                      "2021: Primary Essential Hypertension",
                      "2023: Mild Non-Proliferative Diabetic Retinopathy"
                    ],
                    diagnosesList: [
                      { id: "diag-1", code: "E11.9", term: "Type 2 diabetes mellitus without complications", isPrimary: true, date: "2019-04-12" },
                      { id: "diag-2", code: "I10", term: "Essential (primary) hypertension", isPrimary: false, date: "2021-08-19" }
                    ],
                    vaccineRecords: [
                      { id: "v-1", vaccineName: "Influenza (Fluarix Tetra)", batchNumber: "FLX-9982A", dateAdministered: "2026-03-15", site: "Left Deltoid (IM)", dose: "0.5mL", provider: "Dr. Priyantha Silva" },
                      { id: "v-2", vaccineName: "COVID-19 Pfizer (Comirnaty XBB.1.5)", batchNumber: "PFR-4410B", dateAdministered: "2025-10-20", site: "Right Deltoid (IM)", dose: "0.3mL", provider: "Dr. Priyantha Silva" }
                    ],
                    labResults: [
                      { id: "lab-1", testName: "HbA1c Glycated Haemoglobin", resultValue: "6.8%", referenceRange: "4.0 - 6.0%", flag: "HIGH", date: "2026-07-10", notes: "Target < 7.0% met" },
                      { id: "lab-2", testName: "eGFR (CKD-EPI)", resultValue: "88 mL/min/1.73m2", referenceRange: "> 60 mL/min", flag: "NORMAL", date: "2026-07-10", notes: "Normal renal function" }
                    ]
                  }}
                  patientsList={patients}
                  appointments={appointments}
                  recalls={recalls}
                  onBookAppointment={(apt) => {
                    handleCreateAppointment({ preventDefault: () => {} } as any);
                  }}
                  onCancelAppointment={(aptId) => {
                    handleUpdateAptStatus(aptId, "CANCELLED");
                    alert("Appointment cancelled successfully.");
                  }}
                  onSendMessage={(msg) => {
                    handlePostSecureClinicChat(msg.text || "", msg.channel || "#general-clinical");
                  }}
                  onUpdatePatientDetails={(upPat) => {
                    setPatients(prev => prev.map(p => p.id === upPat.id ? upPat : p));
                    setSelectedPatientForPortal(upPat);
                    alert("Patient profile and consent preferences updated!");
                  }}
                  onLaunchTelehealth={(apt) => {
                    setActiveTab("telehealth");
                  }}
                  onSelectPatient={(p) => {
                    setSelectedPatientForPortal(p);
                  }}
                  onOpenGpExam={(p) => {
                    handleStartConsultation(p);
                    setActiveTab("clinicalRoom");
                  }}
                  onOpenDoctorClinicalRecord={(p) => {
                    setActiveDoctorRecordPatient(p);
                  }}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* OVERLAY MODALS */}

      {/* MODAL: SCHEDULER BOOKER */}
      {showAptModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border rounded shadow-2xl max-w-md w-full p-6">
            <h3 className="font-serif font-bold text-[#00334f] text-base mb-4">Book scheduler appointment slot</h3>
            
            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-500 uppercase">Patient Name ID</label>
                <select
                  required
                  className="w-full p-2 border bg-white rounded outline-none"
                  value={newAptPatientId}
                  onChange={(e) => setNewAptPatientId(e.target.value)}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 uppercase">Time slot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    className="w-full p-1.5 border rounded"
                    value={newAptTime}
                    onChange={(e) => setNewAptTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-1.5 border rounded"
                    value={newAptDate}
                    onChange={(e) => setNewAptDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 uppercase">Symptom Complaint reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cough control, BP check"
                  className="w-full p-1.5 border rounded"
                  value={newAptReason}
                  onChange={(e) => setNewAptReason(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 uppercase">Status</label>
                <select
                  className="w-full p-1.5 border bg-white rounded outline-none"
                  value={newAptStatus}
                  onChange={(e) => setNewAptStatus(e.target.value as any)}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CHECKED IN">Checked In</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAptModal(false)}
                  className="px-4 py-1.5 border text-slate-600 rounded font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00334f] text-white px-4 py-1.5 rounded font-bold"
                >
                  Confirm slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER PATIENT */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border rounded shadow-2xl max-w-md w-full p-6">
            <h3 className="font-serif font-bold text-[#00334f] text-base mb-4">Register New Patient File</h3>
            
            <form onSubmit={handleRegisterPatient} className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-500">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahan Gunasekara"
                  className="w-full p-2 border rounded bg-slate-50 outline-none focus:border-[#00334f]"
                  value={newPatName}
                  onChange={(e) => setNewPatName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500">Age parameter</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 42"
                    className="w-full p-2 border rounded bg-slate-50 outline-none"
                    value={newPatAge}
                    onChange={(e) => setNewPatAge(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">Sex</label>
                  <select
                    className="w-full p-2 border bg-slate-50 rounded outline-none"
                    value={newPatGender}
                    onChange={(e) => setNewPatGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500">Allergies (Sulfa, Penicillin, None)</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded bg-slate-50 outline-none"
                    placeholder="e.g. Penicillin"
                    value={newPatAllergies}
                    onChange={(e) => setNewPatAllergies(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500">Blood Group</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded bg-slate-50 outline-none"
                    placeholder="e.g. O+"
                    value={newPatBlood}
                    onChange={(e) => setNewPatBlood(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500">Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded bg-slate-50 outline-none"
                    value={newPatPhone}
                    onChange={(e) => setNewPatPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded bg-slate-50 outline-none"
                    placeholder="name@gmail.com"
                    value={newPatEmail}
                    onChange={(e) => setNewPatEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Medical History</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Hypertension diagnosed 2024"
                  className="w-full p-2 border rounded bg-slate-50 outline-none"
                  value={newPatHistoryText}
                  onChange={(e) => setNewPatHistoryText(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Assigned Medical Center Branch</label>
                <select
                  className="w-full p-2 border bg-slate-50 rounded outline-none font-bold text-emerald-800"
                  value={newPatMedicalCenter}
                  onChange={(e) => setNewPatMedicalCenter(e.target.value)}
                >
                  <option value="Colombo Central Clinic">Colombo Central Clinic</option>
                  <option value="Kandy Wellness Center">Kandy Wellness Center</option>
                  <option value="Galle GP Care">Galle GP Care</option>
                  <option value="Jaffna Medical Hub">Jaffna Medical Hub</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-1.5 border rounded text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00334f] text-white px-4 py-1.5 rounded font-bold"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM SIMULATED ALERT WRITER */}
      {showCustomAlertModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border rounded shadow-2xl max-w-sm w-full p-6 text-xs font-semibold space-y-4">
            <h3 className="font-bold text-sm text-[#ba1a1a] flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              Simulate epidemiological alert
            </h3>
            
            <form onSubmit={handleCreateCustomAlert} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-slate-500 uppercase">Alert Category</label>
                <select
                  className="w-full p-1.5 border bg-white rounded outline-none"
                  value={customAlertType}
                  onChange={(e) => setCustomAlertType(e.target.value)}
                >
                  <option value="CRITICAL LAB RESULT">Critical lab result</option>
                  <option value="IMAGING REPORT">Imaging report / X-Ray</option>
                  <option value="EPIDEMIOLOGICAL ALERT">Epidemiological Alert (SLMC)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 uppercase">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dengue warning Colombo districts..."
                  className="w-full p-1.5 border rounded outline-none"
                  value={customAlertTitle}
                  onChange={(e) => setCustomAlertTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 uppercase">Findings remarks description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. increase daily checks for suspected joint fatigue."
                  className="w-full p-1.5 border rounded outline-none"
                  value={customAlertText}
                  onChange={(e) => setCustomAlertText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCustomAlertModal(false)}
                  className="px-4 py-1.5 border rounded font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ba1a1a] text-white px-4 py-1.5 rounded font-bold hover:bg-red-700"
                >
                  Trigger Warnings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SUWASIRI PAYMENT RECEIPT */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border rounded shadow-2xl max-w-lg w-full p-6 relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setSelectedReceiptUrl(null)}
              className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer text-slate-700"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif font-bold text-[#00334f] text-base mb-1.5">
              Verified Suwasiri Mobile App Payment Receipt
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              Patient: <span className="text-[#00334f] font-bold">{selectedReceiptPatientName}</span>
            </p>
            <div className="flex-1 overflow-auto border bg-slate-50 p-2 rounded flex items-center justify-center min-h-[300px]">
              <img
                src={selectedReceiptUrl}
                alt="Suwasiri Payment Receipt"
                className="max-w-full max-h-[50vh] object-contain rounded shadow"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer"
              >
                Close Visualizer
              </button>
              <a
                href={selectedReceiptUrl}
                download={`receipt_${selectedReceiptPatientName.replace(/\s+/g, '_')}.png`}
                className="bg-[#00334f] hover:bg-[#002235] text-white px-4 py-1.5 rounded text-xs font-bold transition-all text-center flex items-center gap-1 cursor-pointer"
                target="_blank"
                rel="noreferrer"
              >
                <Eye className="w-3.5 h-3.5" />
                Open In New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY HUB PANEL: DETAILED PATIENT HISTORY CARD */}
      {activeHubPatient && (
        <PatientDetailsHub
          patient={applySuwasiriChart(
            patients.find((p) => p.id === activeHubPatient.id) || activeHubPatient,
            suwasiriCharts[activeHubPatient.id]
          )}
          labOrders={labOrders}
          drugsDatabase={drugs}
          currentRole={currentRole}
          initialSubTab={activeHubInitialTab}
          onClose={() => setActiveHubPatient(null)}
          onAddHistoryItem={handleHubAddHistoryItem}
          onAddVaccine={handleHubAddVaccine}
          onOrderLabTest={handleHubOrderLabTest}
          onProcessLabResult={handleHubProcessLabResult}
          onRenderPrescription={(rx) => {
            setActiveReceiptRx({ patient: activeHubPatient, prescription: rx });
          }}
          onWalkInCheckIn={handleCheckInWalkIn}
          onIssueMedicalCertificate={(patientId, cert) => {
            const addCert = (p: Patient): Patient =>
              p.id !== patientId
                ? p
                : {
                    ...p,
                    medicalCertificatesList: [
                      cert,
                      ...(p.medicalCertificatesList || []).filter((c) => c.id !== cert.id),
                    ],
                  };
            setPatients((prev) => prev.map(addCert));
            setSuwasiriPatients((prev) => prev.map(addCert));
            setActiveHubPatient((prev) => (prev ? addCert(prev) : prev));
          }}
          onStateUpdate={(updatedState) => {
            if (updatedState.patients) setPatients(updatedState.patients);
            if (updatedState.notifications) setNotifications(updatedState.notifications);
            if (updatedState.clinicMessages) setClinicMessages(updatedState.clinicMessages);
            if (updatedState.alerts) setAlerts(updatedState.alerts);
            if (updatedState.appointments) setAppointments(updatedState.appointments);
            if (updatedState.billing) setBilling(updatedState.billing);
            if (updatedState.labOrders) setLabOrders(updatedState.labOrders);
            if (updatedState.sampleCollections) setSampleCollections(updatedState.sampleCollections);

            // Re-sync current active hub patient reference frame
            const reFound = updatedState.patients.find((p: Patient) => p.id === activeHubPatient.id);
            if (reFound) {
              setActiveHubPatient(reFound);
            }
          }}
        />
      )}

      {/* PORTAL MODAL: PRINTABLE E-PRESCRIPTION SHEET */}
      {activeReceiptRx && (
        <PrintablePrescription
          patient={activeReceiptRx.patient}
          prescription={activeReceiptRx.prescription}
          onClose={() => setActiveReceiptRx(null)}
        />
      )}

      {/* 4. MODAL: ENTERPRISE FINANCIAL LEDGER EXPLORER */}
      {showLedgerExplorer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white border rounded-xl shadow-2xl max-w-5xl w-full p-6 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="border-b pb-3 flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <h3 className="font-serif font-bold text-[#00334f] text-lg uppercase tracking-wide">Enterprise Ledger Explorer</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage bills, salaries, rent, log overheads, and inspect the unified cash flow timeline comprehensively.</p>
              </div>
              <button 
                onClick={() => setShowLedgerExplorer(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content body split into two panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1 pr-1">
              {/* Left Column: Category subtotals + Log Form (5 columns) */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. Sum by Category boxes */}
                <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b pb-1">Operating Bills Subtotals (Categorized)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Rent */}
                    <div className="bg-white p-2.5 border rounded">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Rent Expenditures</span>
                      <strong className="text-rose-900 font-mono text-xs">
                        Rs. {expenses.filter(e => e.category === "Rent").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}.00
                      </strong>
                    </div>

                    {/* Salaries */}
                    <div className="bg-white p-2.5 border rounded">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Staff Salaries</span>
                      <strong className="text-rose-900 font-mono text-xs">
                        Rs. {expenses.filter(e => e.category === "Salaries" || e.category === "Salaries & Staff").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}.00
                      </strong>
                    </div>

                    {/* Utilities/Bills */}
                    <div className="bg-white p-2.5 border rounded">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Utilities & Bills</span>
                      <strong className="text-rose-900 font-mono text-xs">
                        Rs. {expenses.filter(e => e.category === "Utilities" || e.category === "Utilities & Bills").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}.00
                      </strong>
                    </div>

                    {/* Supplies */}
                    <div className="bg-white p-2.5 border rounded">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Medical Supplies</span>
                      <strong className="text-rose-900 font-mono text-xs">
                        Rs. {expenses.filter(e => e.category === "Medical Supplies" || e.category === "Medical Supplies & Inventory").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}.00
                      </strong>
                    </div>

                    {/* Diagnostics */}
                    <div className="bg-white p-2.5 border rounded">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Diagnostics Bills</span>
                      <strong className="text-rose-900 font-mono text-xs">
                        Rs. {expenses.filter(e => e.category === "Diagnostics" || e.category === "Diagnostics & Lab Bills").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}.00
                      </strong>
                    </div>

                    {/* Other */}
                    <div className="bg-white p-2.5 border rounded">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Other Operational</span>
                      <strong className="text-rose-900 font-mono text-xs">
                        Rs. {expenses.filter(e => !["Rent", "Salaries", "Salaries & Staff", "Utilities", "Utilities & Bills", "Medical Supplies", "Medical Supplies & Inventory", "Diagnostics", "Diagnostics & Lab Bills"].includes(e.category)).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}.00
                      </strong>
                    </div>
                  </div>

                  {/* Grand total balance info */}
                  <div className="bg-rose-950/5 p-3 rounded border border-rose-950/10 flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-900 uppercase text-[10px]">Grand Expenses Total:</span>
                    <strong className="font-mono text-rose-900 font-extrabold text-sm">Rs. {totalExpenses.toLocaleString()}.00</strong>
                  </div>
                </div>

                {/* 2. Premium Log Form right inside explorer */}
                <div className="bg-white p-4 rounded-lg border space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b pb-1">Record Live Expense or Bill</h4>
                  <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Category</label>
                        <select
                          className="w-full p-2 border bg-white rounded text-xs outline-none"
                          value={newExpCategory}
                          onChange={(e) => setNewExpCategory(e.target.value)}
                        >
                          <option value="Rent">Rent Payment</option>
                          <option value="Salaries">Salary Payment</option>
                          <option value="Utilities">Utilities & Bills</option>
                          <option value="Medical Supplies">Medical Supplies</option>
                          <option value="Diagnostics">Diagnostics & Lab Bills</option>
                          <option value="Other">Other Operational</option>
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Amount (Rs.)</label>
                        <input
                          type="number"
                          required
                          placeholder="Amount in Rupees"
                          className="w-full p-2 border bg-slate-50 rounded text-xs"
                          value={newExpAmount}
                          onChange={(e) => setNewExpAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Description / Details</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. June Staff Salary or CEB Bill"
                        className="w-full p-2 border bg-slate-50 rounded text-xs"
                        value={newExpDescription}
                        onChange={(e) => setNewExpDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full p-2 border bg-slate-50 rounded text-xs"
                        value={newExpDate}
                        onChange={(e) => setNewExpDate(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded font-bold text-xs shadow-sm"
                    >
                      + Formulate & Commit Expense
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Unified Statement ledger (7 columns) */}
              <div className="lg:col-span-7 flex flex-col min-h-[400px] bg-slate-50 border rounded-lg p-4">
                {/* Search & Filters block */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Historical Unified Transactions Log</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Live audit compliant
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        className="w-full bg-white pl-8 pr-3 py-1.5 border rounded text-xs outline-none"
                        placeholder="Search description, patient, category..."
                        value={ledgerSearchQuery}
                        onChange={(e) => setLedgerSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Filter categories dropdown */}
                    <select
                      className="bg-white p-1.5 border rounded text-xs outline-none"
                      value={ledgerCategoryFilter}
                      onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                    >
                      <option value="all">-- All Categories --</option>
                      <option value="Rent">Rent Only</option>
                      <option value="Salaries">Salaries Only</option>
                      <option value="Utilities">Utilities & Bills</option>
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Diagnostics">Diagnostics Only</option>
                      <option value="Consultation & Clinical Fees">Consultation Fees</option>
                      <option value="Other">Other Operational</option>
                    </select>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex gap-1.5 border-b pb-1 text-xs">
                    <button
                      onClick={() => setLedgerFilterTab("all")}
                      className={`px-3 py-1 rounded font-bold transition-all border-none cursor-pointer ${
                        ledgerFilterTab === "all" ? "bg-[#00334f] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      All Inflow & Outflow
                    </button>
                    <button
                      onClick={() => setLedgerFilterTab("income")}
                      className={`px-3 py-1 rounded font-bold transition-all border-none cursor-pointer ${
                        ledgerFilterTab === "income" ? "bg-emerald-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Inflows (Income)
                    </button>
                    <button
                      onClick={() => setLedgerFilterTab("expense")}
                      className={`px-3 py-1 rounded font-bold transition-all border-none cursor-pointer ${
                        ledgerFilterTab === "expense" ? "bg-rose-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Outflows (Expenses)
                    </button>
                  </div>
                </div>

                {/* Ledger Listing (scrollable) */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px]">
                  {(() => {
                    const combined = [
                      ...billing.filter(b => b.status === "PAID").map(b => ({
                        type: "INCOME" as const,
                        id: b.id,
                        date: b.date,
                        amount: b.amount,
                        title: b.patientName,
                        subtitle: b.service || "Clinical Consultation Fee",
                        category: "Consultation & Clinical Fees"
                      })),
                      ...expenses.map(e => ({
                        type: "EXPENSE" as const,
                        id: e.id,
                        date: e.date,
                        amount: e.amount,
                        title: e.description || `Overheads: ${e.category}`,
                        subtitle: e.category,
                        category: e.category
                      }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    const filtered = combined.filter(item => {
                      // Filter by tab
                      if (ledgerFilterTab === "income" && item.type !== "INCOME") return false;
                      if (ledgerFilterTab === "expense" && item.type !== "EXPENSE") return false;

                      // Filter by category
                      if (ledgerCategoryFilter !== "all") {
                        if (ledgerCategoryFilter === "Other") {
                          if (["Rent", "Salaries", "Utilities", "Medical Supplies", "Diagnostics", "Consultation & Clinical Fees"].includes(item.category)) return false;
                        } else {
                          // Rough matching
                          const targetLower = ledgerCategoryFilter.toLowerCase();
                          const catLower = item.category.toLowerCase();
                          if (!catLower.includes(targetLower)) return false;
                        }
                      }

                      // Filter by search query
                      if (ledgerSearchQuery.trim()) {
                        const q = ledgerSearchQuery.toLowerCase();
                        const matchTitle = item.title.toLowerCase().includes(q);
                        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
                        const matchCategory = item.category.toLowerCase().includes(q);
                        if (!matchTitle && !matchSubtitle && !matchCategory) return false;
                      }

                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-400 italic text-xs">
                          No transaction ledgers found matching current criteria.
                        </div>
                      );
                    }

                    return filtered.map((tx, idx) => (
                      <div 
                        key={tx.id || idx} 
                        className={`p-3 rounded border bg-white flex justify-between items-center transition-all ${
                          tx.type === "INCOME" ? "border-l-4 border-l-emerald-500 hover:shadow-xs" : "border-l-4 border-l-rose-500 hover:shadow-xs"
                        }`}
                      >
                        <div className="space-y-1 pr-4 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{tx.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">{tx.date}</span>
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 rounded ${
                              tx.type === "INCOME" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            }`}>
                              {tx.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate max-w-[320px]">{tx.subtitle}</p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div className="font-mono text-xs font-bold leading-none">
                            <span className={tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}>
                              {tx.type === "INCOME" ? "+" : "-"} Rs. {tx.amount.toLocaleString()}.00
                            </span>
                          </div>
                          {tx.type === "EXPENSE" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(tx.id)}
                              className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1 border-none bg-transparent"
                              title="Delete overhead voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Modal footer summary indicators */}
            <div className="border-t pt-3.5 mt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-bold">
              <span>🔒 OPERATIONAL COMPLIANCE SECURED BY SRI LANKA CENTRAL HEALTH REGISTRY</span>
              <div className="flex gap-4">
                <span>Inflow Settled: Rs. {totalIncome.toLocaleString()}</span>
                <span>Outfall Logged: Rs. {totalExpenses.toLocaleString()}</span>
                <span className={totalIncome - totalExpenses >= 0 ? "text-emerald-700 border-b border-emerald-300" : "text-rose-700 border-b border-rose-300"}>
                  Net Surplus: Rs. {(totalIncome - totalExpenses).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 16-TAB DOCTOR CLINICAL RECORD (BP PREMIER / SRI LANKAN STANDARD CONSULTATION) */}
      {activeDoctorRecordPatient && (
        <DoctorClinicalRecordModal
          patient={applySuwasiriChart(
            patients.find((p) => p.id === activeDoctorRecordPatient.id) || activeDoctorRecordPatient,
            suwasiriCharts[activeDoctorRecordPatient.id]
          )}
          appointments={appointments}
          billingList={billing}
          currentRole={currentRole}
          onClose={() => setActiveDoctorRecordPatient(null)}
          onUpdatePatient={(updatedPatient) => {
            setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setActiveDoctorRecordPatient(updatedPatient);
          }}
          onUpdateAppointment={(updatedApt) => {
            setAppointments(prev => prev.map(a => a.id === updatedApt.id ? updatedApt : a));
          }}
          onRenderPrescription={(rx) => {
            if (activeDoctorRecordPatient) {
              const updated = {
                ...activeDoctorRecordPatient,
                prescriptionRecords: [...(activeDoctorRecordPatient.prescriptionRecords || []), rx]
              };
              setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
              setActiveDoctorRecordPatient(updated);
            }
          }}
          onLaunchTelehealth={(apt) => {
            setActiveDoctorRecordPatient(null);
            setActiveTab("telehealth");
          }}
        />
      )}

      {/* STANDALONE CLINICAL CALCULATORS MODAL */}
      {showCalculatorsModal && (
        <ClinicalCalculatorsModal
          patient={activeDoctorRecordPatient || patients[0]}
          onClose={() => setShowCalculatorsModal(false)}
          onSaveToConsultation={(resultText) => {
            alert("Calculator result copied to consultation clipboard:\n\n" + resultText);
          }}
        />
      )}

    </div>
  );
}

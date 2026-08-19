import type {
  Branch,
  Hospital,
  PermissionFlags,
  PermissionKey,
  RoleDefinition,
  StaffMembership,
  StaffProvider,
  StaffUser,
} from "./types";

export const HOSPITAL_PRIMECARE = "hosp-primecare";
export const HOSPITAL_SOUTHERN = "hosp-southern";
export const BRANCH_COLOMBO = "branch-cmb";
export const BRANCH_KANDY = "branch-kdy";
export const BRANCH_GALLE = "branch-galle";

export const USER_PLATFORM = "user-platform";
export const USER_PLATFORM_CHAMIDU = "user-platform-chamidu";
export const USER_SILVA = "user-silva";
export const USER_ANOJA = "user-anoja";
export const USER_SANDAMALI = "user-sandamali";
export const USER_THUSITHA = "user-thusitha";
export const USER_KANTHI = "user-kanthi";
export const USER_SOUTHERN_SA = "user-southern-sa";
export const USER_SOUTHERN_MO = "user-southern-mo";

const DENIED: PermissionFlags = {
  canAccessDoctorDashboard: false,
  canViewClinicalNotes: false,
  canEditClinicalNotes: false,
  canPrescribeMedications: false,
  canOrderDiagnosticsAndLabs: false,
  canDispatchSampleCourier: false,
  canAccessTelehealthSuite: false,
  canViewBilling: false,
  canManageCashierAndInvoicing: false,
  canManageUsers: false,
  canBreakGlassEmergency: false,
  canExportData: false,
  canManageRecalls: false,
  canViewAuditLogs: false,
  canAccessAnalyticsReports: false,
  canConfigureSystemSecurity: false,
};

export const PERMISSION_COLUMNS: { key: PermissionKey; label: string; allow: string; deny: string }[] = [
  { key: "canAccessDoctorDashboard", label: "Doctor Dashboard", allow: "ACTIVE", deny: "NO" },
  { key: "canViewClinicalNotes", label: "View Clinical Notes", allow: "ALLOWED", deny: "DENIED" },
  { key: "canEditClinicalNotes", label: "Edit / SOAP Notes", allow: "ALLOWED", deny: "DENIED" },
  { key: "canPrescribeMedications", label: "ePrescribe (NMRA)", allow: "ALLOWED", deny: "DENIED" },
  { key: "canOrderDiagnosticsAndLabs", label: "LankaLab Orders", allow: "ALLOWED", deny: "DENIED" },
  { key: "canDispatchSampleCourier", label: "Sample Courier", allow: "ALLOWED", deny: "DENIED" },
  { key: "canAccessTelehealthSuite", label: "Telehealth Video", allow: "ACTIVE", deny: "NO" },
  { key: "canViewBilling", label: "View Billing", allow: "ALLOWED", deny: "DENIED" },
  { key: "canManageCashierAndInvoicing", label: "Cashier & POS (Rs.)", allow: "ALLOWED", deny: "DENIED" },
  { key: "canManageUsers", label: "Manage Users", allow: "ALLOWED", deny: "DENIED" },
  { key: "canBreakGlassEmergency", label: "Break-Glass", allow: "AUTHORIZED", deny: "NO" },
  { key: "canManageRecalls", label: "Recalls & Suwasiri", allow: "ALLOWED", deny: "DENIED" },
  { key: "canViewAuditLogs", label: "Audit Logs", allow: "ALLOWED", deny: "DENIED" },
  { key: "canAccessAnalyticsReports", label: "Analytics & MoH", allow: "ALLOWED", deny: "DENIED" },
  { key: "canConfigureSystemSecurity", label: "System Security", allow: "ROOT ADMIN", deny: "DENIED" },
];

export function roleSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function roleIdFor(hospitalId: string, name: string): string {
  return `${hospitalId}-role-${roleSlug(name)}`;
}

type TemplateSpec = { name: string; flags: Partial<PermissionFlags>; isSystem?: boolean };

const CLINICAL: Partial<PermissionFlags> = {
  canAccessDoctorDashboard: true,
  canViewClinicalNotes: true,
  canEditClinicalNotes: true,
  canPrescribeMedications: true,
  canOrderDiagnosticsAndLabs: true,
  canDispatchSampleCourier: true,
  canAccessTelehealthSuite: true,
  canViewBilling: true,
  canBreakGlassEmergency: true,
  canExportData: true,
  canManageRecalls: true,
  canViewAuditLogs: true,
  canAccessAnalyticsReports: true,
};

const ROLE_TEMPLATES: TemplateSpec[] = [
  { name: "Hospital Super Admin", isSystem: true, flags: {
    canManageUsers: true,
    canConfigureSystemSecurity: true,
    canViewAuditLogs: true,
    canAccessAnalyticsReports: true,
    canExportData: true,
    canViewBilling: true,
    canManageCashierAndInvoicing: true,
    canManageRecalls: true,
  } },
  { name: "Doctor", flags: CLINICAL },
  { name: "Specialist Consultant", flags: CLINICAL },
  { name: "Medical Officer", flags: {
    ...CLINICAL,
    canExportData: false,
    canViewAuditLogs: false,
    canAccessAnalyticsReports: false,
  } },
  { name: "Nurse", flags: {
    canAccessDoctorDashboard: true,
    canViewClinicalNotes: true,
    canEditClinicalNotes: true,
    canOrderDiagnosticsAndLabs: true,
    canDispatchSampleCourier: true,
    canBreakGlassEmergency: true,
    canManageRecalls: true,
  } },
  { name: "Triage Officer", flags: {
    canAccessDoctorDashboard: true,
    canViewClinicalNotes: true,
    canEditClinicalNotes: true,
    canOrderDiagnosticsAndLabs: true,
    canDispatchSampleCourier: true,
    canBreakGlassEmergency: true,
    canManageRecalls: true,
  } },
  { name: "Pharmacist", flags: {
    canViewClinicalNotes: true,
    canViewBilling: true,
    canManageCashierAndInvoicing: true,
    canExportData: true,
    canViewAuditLogs: true,
    canAccessAnalyticsReports: true,
  } },
  { name: "Lab Technician", flags: {
    canViewClinicalNotes: true,
    canOrderDiagnosticsAndLabs: true,
    canDispatchSampleCourier: true,
    canExportData: true,
    canViewAuditLogs: true,
  } },
  { name: "Receptionist", flags: {
    canDispatchSampleCourier: true,
    canViewBilling: true,
    canManageCashierAndInvoicing: true,
  } },
  { name: "Billing Officer", flags: {
    canViewBilling: true,
    canManageCashierAndInvoicing: true,
    canExportData: true,
    canViewAuditLogs: true,
    canAccessAnalyticsReports: true,
  } },
  { name: "Practice Manager", flags: {
    canAccessDoctorDashboard: true,
    canViewClinicalNotes: true,
    canDispatchSampleCourier: true,
    canAccessTelehealthSuite: true,
    canViewBilling: true,
    canManageCashierAndInvoicing: true,
    canManageUsers: true,
    canExportData: true,
    canManageRecalls: true,
    canViewAuditLogs: true,
    canAccessAnalyticsReports: true,
    canConfigureSystemSecurity: true,
  } },
  { name: "Admin", flags: {
    ...CLINICAL,
    canManageCashierAndInvoicing: true,
    canManageUsers: true,
    canConfigureSystemSecurity: true,
  } },
  { name: "Auditor", flags: {
    canViewClinicalNotes: true,
    canViewBilling: true,
    canExportData: true,
    canViewAuditLogs: true,
    canAccessAnalyticsReports: true,
  } },
  { name: "Patient", flags: {
    canViewClinicalNotes: true,
    canAccessTelehealthSuite: true,
    canViewBilling: true,
  } },
];

export function cloneHospitalRoles(hospitalId: string): RoleDefinition[] {
  return ROLE_TEMPLATES.map((t) => ({
    id: roleIdFor(hospitalId, t.name),
    hospitalId,
    name: t.name,
    isSystem: t.isSystem ?? true,
    enabled: true,
    ...DENIED,
    ...t.flags,
  }));
}

export const DEFAULT_HOSPITALS: Hospital[] = [
  { id: HOSPITAL_PRIMECARE, name: "PrimeCare Medical Group", status: "ACTIVE" },
  { id: HOSPITAL_SOUTHERN, name: "Southern Coast Hospitals", status: "ACTIVE" },
];

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: BRANCH_COLOMBO,
    hospitalId: HOSPITAL_PRIMECARE,
    name: "PrimeCare Medical Centre - Colombo Central",
    address: "142 Galle Road, Colombo 03, Sri Lanka",
    phone: "+94 11 234 5678",
    rooms: [
      "Consultation Room 1",
      "Consultation Room 2",
      "Treatment & Procedure Room",
      "Telehealth Digital Suite",
      "Front Desk Reception",
      "Practice Admin Office",
    ],
  },
  {
    id: BRANCH_KANDY,
    hospitalId: HOSPITAL_PRIMECARE,
    name: "PrimeCare Specialist Branch - Kandy",
    address: "88 Peradeniya Road, Kandy, Sri Lanka",
    phone: "+94 81 222 9900",
    rooms: [
      "Specialist Suite A",
      "Allied Health & Physiotherapy Studio",
      "Pathology Sample Collection Hub",
    ],
  },
  {
    id: BRANCH_GALLE,
    hospitalId: HOSPITAL_SOUTHERN,
    name: "Southern Coast Clinic - Galle",
    address: "12 Church Street, Galle Fort, Sri Lanka",
    phone: "+94 91 222 1100",
    rooms: ["Consultation Room 1", "Triage Bay", "Front Desk Reception"],
  },
];

export const DEFAULT_STAFF_USERS: StaffUser[] = [
  { id: USER_PLATFORM_CHAMIDU, name: "Chamidu Kausha", email: "chamidukausha@gmail.com", platformRole: "platform_super_admin" },
  { id: USER_PLATFORM, name: "Nimal Fernando", email: "nimal.fernando@suwasiri.lk", platformRole: "platform_super_admin" },
  { id: USER_SILVA, name: "Dr. Priyantha Silva", email: "dr.silva@primecare.lk", platformRole: null },
  { id: USER_ANOJA, name: "Dr. Anoja Senanayake", email: "dr.anoja@primecare.lk", platformRole: null },
  { id: USER_SANDAMALI, name: "Ms. Sandamali Jayasekara", email: "manager@primecare.lk", platformRole: null },
  { id: USER_THUSITHA, name: "Mr. Thusitha Perera", email: "reception@primecare.lk", platformRole: null },
  { id: USER_KANTHI, name: "Nurse Kanthi Weerasinghe", email: "nurse.kanthi@primecare.lk", platformRole: null },
  { id: USER_SOUTHERN_SA, name: "Ms. Dilani Wickramasinghe", email: "admin@southerncoast.lk", platformRole: null },
  { id: USER_SOUTHERN_MO, name: "Dr. Kasun Jayawardena", email: "dr.kasun@southerncoast.lk", platformRole: null },
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  ...cloneHospitalRoles(HOSPITAL_PRIMECARE),
  ...cloneHospitalRoles(HOSPITAL_SOUTHERN),
];

export const DEFAULT_MEMBERSHIPS: StaffMembership[] = [
  {
    id: "mem-sandamali-pc",
    userId: USER_SANDAMALI,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Hospital Super Admin"),
    branchIds: [BRANCH_COLOMBO, BRANCH_KANDY],
    active: true,
  },
  {
    id: "mem-silva-pc",
    userId: USER_SILVA,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Doctor"),
    branchIds: [BRANCH_COLOMBO, BRANCH_KANDY],
    active: true,
  },
  {
    id: "mem-silva-south",
    userId: USER_SILVA,
    hospitalId: HOSPITAL_SOUTHERN,
    roleId: roleIdFor(HOSPITAL_SOUTHERN, "Doctor"),
    branchIds: [BRANCH_GALLE],
    active: true,
  },
  {
    id: "mem-anoja-pc",
    userId: USER_ANOJA,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Doctor"),
    branchIds: [BRANCH_COLOMBO],
    active: true,
  },
  {
    id: "mem-thusitha-pc",
    userId: USER_THUSITHA,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Receptionist"),
    branchIds: [BRANCH_COLOMBO],
    active: true,
  },
  {
    id: "mem-kanthi-pc",
    userId: USER_KANTHI,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Nurse"),
    branchIds: [BRANCH_COLOMBO, BRANCH_KANDY],
    active: true,
  },
  {
    id: "mem-dilani-south",
    userId: USER_SOUTHERN_SA,
    hospitalId: HOSPITAL_SOUTHERN,
    roleId: roleIdFor(HOSPITAL_SOUTHERN, "Hospital Super Admin"),
    branchIds: [BRANCH_GALLE],
    active: true,
  },
  {
    id: "mem-kasun-south",
    userId: USER_SOUTHERN_MO,
    hospitalId: HOSPITAL_SOUTHERN,
    roleId: roleIdFor(HOSPITAL_SOUTHERN, "Medical Officer"),
    branchIds: [BRANCH_GALLE],
    active: true,
  },
];

const WEEKDAYS = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false };

export const DEFAULT_STAFF_DIRECTORY: StaffProvider[] = [
  {
    id: "staff-1",
    userId: USER_SILVA,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Doctor"),
    branchIds: [BRANCH_COLOMBO, BRANCH_KANDY],
    name: "Dr. Priyantha Silva",
    role: "Doctor",
    specialty: "General Practice & Chronic Care",
    providerNumber: "4829102A",
    prescriberNumber: "5910291",
    slmcNumber: "SLMC-48291",
    email: "dr.silva@primecare.lk",
    phone: "+94 77 111 2233",
    assignedRoom: "Consultation Room 1",
    roster: { ...WEEKDAYS, saturday: true },
    active: true,
  },
  {
    id: "staff-2",
    userId: USER_ANOJA,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Doctor"),
    branchIds: [BRANCH_COLOMBO],
    name: "Dr. Anoja Senanayake",
    role: "Doctor",
    specialty: "Paediatrics & Women's Health",
    providerNumber: "5920193B",
    prescriberNumber: "6910392",
    slmcNumber: "SLMC-51029",
    email: "dr.anoja@primecare.lk",
    phone: "+94 77 222 3344",
    assignedRoom: "Consultation Room 2",
    roster: { ...WEEKDAYS, tuesday: false },
    active: true,
  },
  {
    id: "staff-3",
    userId: USER_SANDAMALI,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Hospital Super Admin"),
    branchIds: [BRANCH_COLOMBO, BRANCH_KANDY],
    name: "Ms. Sandamali Jayasekara",
    role: "Hospital Super Admin",
    specialty: "Governance & Operations",
    providerNumber: "N/A",
    email: "manager@primecare.lk",
    phone: "+94 77 333 4455",
    assignedRoom: "Practice Admin Office",
    roster: { ...WEEKDAYS },
    active: true,
  },
  {
    id: "staff-4",
    userId: USER_THUSITHA,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Receptionist"),
    branchIds: [BRANCH_COLOMBO],
    name: "Mr. Thusitha Perera",
    role: "Receptionist",
    providerNumber: "N/A",
    email: "reception@primecare.lk",
    phone: "+94 77 444 5566",
    assignedRoom: "Front Desk Reception",
    roster: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
    active: true,
  },
  {
    id: "staff-5",
    userId: USER_KANTHI,
    hospitalId: HOSPITAL_PRIMECARE,
    roleId: roleIdFor(HOSPITAL_PRIMECARE, "Nurse"),
    branchIds: [BRANCH_COLOMBO, BRANCH_KANDY],
    name: "Nurse Kanthi Weerasinghe",
    role: "Nurse",
    specialty: "Triage & Immunisations",
    providerNumber: "NUR-99120",
    email: "nurse.kanthi@primecare.lk",
    phone: "+94 77 555 6677",
    assignedRoom: "Treatment & Procedure Room",
    roster: { ...WEEKDAYS, saturday: true },
    active: true,
  },
  {
    id: "staff-6",
    userId: USER_SOUTHERN_SA,
    hospitalId: HOSPITAL_SOUTHERN,
    roleId: roleIdFor(HOSPITAL_SOUTHERN, "Hospital Super Admin"),
    branchIds: [BRANCH_GALLE],
    name: "Ms. Dilani Wickramasinghe",
    role: "Hospital Super Admin",
    specialty: "Hospital Governance",
    providerNumber: "N/A",
    email: "admin@southerncoast.lk",
    phone: "+94 77 888 1122",
    assignedRoom: "Practice Admin Office",
    roster: { ...WEEKDAYS },
    active: true,
  },
  {
    id: "staff-7",
    userId: USER_SOUTHERN_MO,
    hospitalId: HOSPITAL_SOUTHERN,
    roleId: roleIdFor(HOSPITAL_SOUTHERN, "Medical Officer"),
    branchIds: [BRANCH_GALLE],
    name: "Dr. Kasun Jayawardena",
    role: "Medical Officer",
    specialty: "General Practice",
    providerNumber: "7102931C",
    slmcNumber: "SLMC-61044",
    email: "dr.kasun@southerncoast.lk",
    phone: "+94 77 999 3344",
    assignedRoom: "Consultation Room 1",
    roster: { ...WEEKDAYS },
    active: true,
  },
];

export const SOUTHERN_DEMO_PATIENT = {
  id: "7701-LK",
  name: "Ishara Mendis",
  age: 41,
  gender: "Female",
  bloodType: "A+",
  allergies: "None known",
  phone: "+94 77 901 2233",
  email: "ishara.mendis@gmail.com",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA47qS69AH5bvNCTnM-s0ZmRfxT4b3TbhXqCQbKjGKdUQZIts0tigMpwXRs4gxDDQI2tMVt7rl_9OLS48MrOGHDE9t2CueGtB1mdu8J2ffYWnxYdsGezHdob2vIARibFl3kTyNsha4YX21oU_3gizPOwjQPBG4uecZbWMGRNFkGZ2IDSNTnvjAf4oqKNzT4RC5YwvSEzCqmW226XGDSHHoNUxQzDNLvZUOgu4ccp8GpGejTZEDoJ3yiq8xzz9yNf5-fUV3zs6H85Q0",
  notes: "Southern Coast Hospitals chart only — isolated from PrimeCare.",
  history: [{ date: "2026-07-02", reason: "Hypertension review", doctor: "Dr. Kasun Jayawardena", notes: "BP controlled on amlodipine." }],
  activeMedications: ["Amlodipine 5mg OD"],
  medicalHistory: ["Essential Hypertension"],
  vaccineRecords: [],
  labResults: [],
  prescriptionsList: [],
  medicalCertificatesList: [],
  sampleCollections: [],
  medicalCenter: "Southern Coast Clinic - Galle",
  hospitalId: HOSPITAL_SOUTHERN,
  branchId: BRANCH_GALLE,
};

export const EMPTY_PERMISSIONS: PermissionFlags = { ...DENIED };

export function canViewHospitalWideCharts(role: RoleDefinition | undefined): boolean {
  if (!role) return false;
  return role.canAccessDoctorDashboard || role.canEditClinicalNotes;
}

export function isGovernanceEditor(role: RoleDefinition | undefined, isPlatformSA: boolean): boolean {
  if (isPlatformSA) return true;
  if (!role || !role.enabled) return false;
  return role.name === "Hospital Super Admin" || role.canConfigureSystemSecurity;
}

export function tabAllowed(tab: string, role: RoleDefinition | undefined, isPlatformSA: boolean): boolean {
  if (isPlatformSA) {
    return tab === "platform" || tab === "security";
  }
  if (!role || !role.enabled) return false;
  switch (tab) {
    case "platform":
      return false;
    case "dashboard":
      return role.canAccessDoctorDashboard;
    case "clinical":
      return role.canEditClinicalNotes;
    case "pathology":
      return role.canOrderDiagnosticsAndLabs || role.canViewClinicalNotes;
    case "documents":
      return role.canViewClinicalNotes;
    case "ai_features":
      return role.canEditClinicalNotes;
    case "calculators":
      return role.canAccessDoctorDashboard || role.canEditClinicalNotes;
    case "recalls":
      return role.canManageRecalls;
    case "patients":
      return role.canViewClinicalNotes;
    case "telehealth":
      return role.canAccessTelehealthSuite;
    case "calendar":
      return true;
    case "billing":
      return role.canViewBilling;
    case "sampleCollection":
      return role.canDispatchSampleCourier;
    case "chat":
      return true;
    case "practiceManager":
      return role.canManageUsers || role.name === "Practice Manager" || role.name === "Hospital Super Admin";
    case "security":
      return role.canConfigureSystemSecurity || role.canManageUsers;
    case "audit_logs":
      return role.canViewAuditLogs;
    case "reports":
      return role.canAccessAnalyticsReports;
    case "admin":
      return role.canManageUsers;
    case "patientPortal":
    case "publicBooking":
      return true;
    default:
      return true;
  }
}

export function defaultTabFor(role: RoleDefinition | undefined, isPlatformSA: boolean): string {
  if (isPlatformSA) return "platform";
  if (!role) return "calendar";
  if (role.canAccessDoctorDashboard) return "dashboard";
  if (role.canConfigureSystemSecurity || role.name === "Hospital Super Admin") return "security";
  if (role.canViewBilling || role.canManageCashierAndInvoicing) return "calendar";
  return "calendar";
}

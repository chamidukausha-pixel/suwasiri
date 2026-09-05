import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import {
  BRANCH_COLOMBO,
  BRANCH_GALLE,
  BRANCH_KANDY,
  HOSPITAL_PRIMECARE,
  HOSPITAL_SOUTHERN,
} from "../tenancy";
import type { Patient } from "../types";
import { pickRealPatientName } from "./suwasiriHealthId";

export interface ClinicRegistrationPatch {
  docId: string;
  hospitalId: string;
  hospitalName: string;
  branchId?: string;
  historyLines: string[];
  notes: string;
  patient?: Patient;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string {
  return String(value ?? "").trim();
}

function toDate(raw: unknown): Date | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "string" || typeof raw === "number") {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof raw === "object") {
    const obj = raw as { toDate?: () => Date; seconds?: number };
    if (typeof obj.toDate === "function") return obj.toDate();
    if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
  }
  return null;
}

function isoDate(raw: unknown): string {
  const parsed = toDate(raw);
  if (!parsed) return str(raw);
  return parsed.toISOString().slice(0, 10);
}

function ageFromDob(raw?: string): number {
  const parsed = toDate(raw);
  if (!parsed) return 0;
  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const m = now.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < parsed.getDate())) age -= 1;
  return Math.max(0, age);
}

function genderLabel(raw: string): string {
  const g = raw.toLowerCase();
  if (!g) return "Not recorded";
  if (g.startsWith("f") || g.includes("female")) return "Female";
  if (g.startsWith("m") && !g.includes("female")) return "Male";
  return raw;
}

/** Same name → tenant mapping as Flutter `GpCareClinicMap`. */
export function mapToGpCareHospital(
  hospitalId: string,
  hospitalName: string,
  branchId?: string
): { hospitalId: string; branchId: string } {
  const id = str(hospitalId);
  if (id === HOSPITAL_PRIMECARE || id === HOSPITAL_SOUTHERN) {
    return {
      hospitalId: id,
      branchId:
        str(branchId) ||
        (id === HOSPITAL_SOUTHERN ? BRANCH_GALLE : BRANCH_COLOMBO),
    };
  }
  const n = hospitalName.toLowerCase();
  if (n.includes("kandy")) {
    return { hospitalId: HOSPITAL_PRIMECARE, branchId: BRANCH_KANDY };
  }
  if (n.includes("southern") || n.includes("galle")) {
    return { hospitalId: HOSPITAL_SOUTHERN, branchId: BRANCH_GALLE };
  }
  return {
    hospitalId: HOSPITAL_PRIMECARE,
    branchId: str(branchId) || BRANCH_COLOMBO,
  };
}

function historyFromRegistration(reg: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const visit = str(reg.visitReason);
  if (visit) lines.push(`Visit reason: ${visit}`);
  const chronic = Array.isArray(reg.chronicConditions)
    ? reg.chronicConditions.map((c) => str(c)).filter(Boolean)
    : [];
  if (chronic.length) lines.push(`Chronic conditions: ${chronic.join(", ")}`);
  const chronicOther = str(reg.chronicOther);
  if (chronicOther) lines.push(`Other conditions: ${chronicOther}`);
  const meds = str(reg.currentMedications);
  if (meds) lines.push(`Current medications: ${meds}`);
  if (reg.hasAllergies === true) {
    lines.push(`Allergies: ${str(reg.allergyDetails) || "Yes"}`);
  }
  if (reg.hadSurgery === true) {
    lines.push(`Surgery history: ${str(reg.surgeryDetails) || "Yes"}`);
  }
  return lines;
}

export function patientFromClinicRegistration(opts: {
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  branchId?: string;
  registration: Record<string, unknown>;
}): Patient {
  const reg = opts.registration;
  const dob = isoDate(reg.dateOfBirth);
  const name = str(reg.fullName) || opts.patientName || "Suwasiri patient";
  const address = [reg.streetAddress, reg.city, reg.district].map(str).filter(Boolean).join(", ");
  const tenant = mapToGpCareHospital(opts.hospitalId, opts.hospitalName, opts.branchId);
  const meds = str(reg.currentMedications);
  const history = [
    `New patient registration · ${opts.hospitalName || tenant.hospitalId}`,
    ...historyFromRegistration(reg),
  ];
  return {
    id: opts.patientId,
    name,
    age: ageFromDob(dob) || Number(reg.age) || 0,
    gender: genderLabel(str(reg.gender)),
    dateOfBirth: dob || undefined,
    nic: str(reg.nicOrPassport) || undefined,
    address: address || undefined,
    bloodType: "Not recorded",
    allergies: reg.hasAllergies === true ? (str(reg.allergyDetails) || "Yes") : "NKDA",
    phone: str(reg.mobile) || str(reg.altPhone),
    email: str(reg.email),
    image: "",
    notes: `Suwasiri new-patient intake at ${opts.hospitalName || "clinic"}`,
    history: [],
    activeMedications: meds ? [meds] : [],
    medicalHistory: history,
    vaccineRecords: [],
    labResults: [],
    prescriptionsList: [],
    hospitalId: tenant.hospitalId,
    branchId: tenant.branchId,
    medicalCenter: opts.hospitalName || undefined,
    syncedHospitalIds: [tenant.hospitalId],
    accessStatus: "ACTIVE",
    emergencyContactName: str(reg.emergencyName) || undefined,
    emergencyContactPhone: str(reg.emergencyMobile) || undefined,
    ihiNumber: str(reg.nicOrPassport) || undefined,
    medicareNumber: str(reg.nicOrPassport) || undefined,
  };
}

export function mergeRegistrationWithLiveFile(fromReg: Patient, fromUser?: Patient | null): Patient {
  if (!fromUser) return fromReg;
  const userBlood = str(fromUser.bloodType);
  return {
    ...fromUser,
    ...fromReg,
    name: pickRealPatientName(fromReg.name, fromUser.name) || fromReg.name || fromUser.name,
    email: fromReg.email || fromUser.email,
    phone: fromReg.phone || fromUser.phone,
    suwasiriBarcode: fromUser.suwasiriBarcode || fromReg.suwasiriBarcode,
    bloodType:
      userBlood && userBlood.toLowerCase() !== "not recorded"
        ? fromUser.bloodType
        : fromReg.bloodType,
    labResults: fromUser.labResults?.length ? fromUser.labResults : fromReg.labResults,
    vaccineRecords: fromUser.vaccineRecords?.length ? fromUser.vaccineRecords : fromReg.vaccineRecords,
    heightCm: fromReg.heightCm || fromUser.heightCm,
    weightKg: fromReg.weightKg || fromUser.weightKg,
    hospitalId: fromReg.hospitalId,
    branchId: fromReg.branchId,
    medicalCenter: fromReg.medicalCenter || fromUser.medicalCenter,
    syncedHospitalIds: fromReg.syncedHospitalIds,
    notes: fromReg.notes,
    medicalHistory: [
      ...new Set([...(fromReg.medicalHistory || []), ...(fromUser.medicalHistory || [])]),
    ],
  };
}

export function applyClinicRegistration(
  patient: Patient,
  patch?: ClinicRegistrationPatch | null
): Patient {
  if (!patch?.historyLines.length) return patient;
  const existing = patient.medicalHistory || [];
  const merged = [...existing];
  for (const line of patch.historyLines) {
    if (!merged.includes(line)) merged.push(line);
  }
  const fromReg = patch.patient;
  return {
    ...patient,
    name: pickRealPatientName(fromReg?.name, patient.name) || patient.name,
    ...(fromReg
      ? {
          age: patient.age > 0 ? patient.age : fromReg.age,
          gender:
            patient.gender && !/^(unknown|not recorded)$/i.test(patient.gender)
              ? patient.gender
              : fromReg.gender,
          dateOfBirth: patient.dateOfBirth || fromReg.dateOfBirth,
          nic: patient.nic || fromReg.nic,
          address: patient.address || fromReg.address,
          phone: patient.phone || fromReg.phone,
          email: patient.email || fromReg.email,
          allergies: patient.allergies && patient.allergies !== "NKDA" ? patient.allergies : fromReg.allergies,
          emergencyContactName: patient.emergencyContactName || fromReg.emergencyContactName,
          emergencyContactPhone: patient.emergencyContactPhone || fromReg.emergencyContactPhone,
        }
      : {}),
    medicalHistory: merged,
    notes: patch.notes || patient.notes,
  };
}

function patchFromDoc(docId: string, data: Record<string, unknown>): ClinicRegistrationPatch | null {
  const patientId = str(data.patientId);
  if (!patientId) return null;
  const reg = asRecord(data.registration);
  const hospitalName = str(data.hospitalName) || str(reg.hospitalName);
  const tenant = mapToGpCareHospital(
    str(data.hospitalId) || str(reg.hospitalId),
    hospitalName,
    str(data.branchId) || str(reg.branchId)
  );
  const historyLines = [
    `New patient registration · ${hospitalName || tenant.hospitalId}`,
    ...historyFromRegistration(reg),
  ];
  return {
    docId,
    hospitalId: tenant.hospitalId,
    hospitalName,
    branchId: tenant.branchId,
    historyLines,
    notes: `Suwasiri new-patient intake at ${hospitalName || "clinic"}`,
    patient: patientFromClinicRegistration({
      patientId,
      patientName: str(data.patientName) || str(reg.fullName),
      hospitalId: tenant.hospitalId,
      hospitalName,
      branchId: tenant.branchId,
      registration: Object.keys(reg).length ? reg : data,
    }),
  };
}

export function subscribeClinicRegistrations(
  onChange: (patientId: string, patch: ClinicRegistrationPatch) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured()) return undefined;
  const db = getFirebaseDb();
  return onSnapshot(
    collection(db, "clinic_patient_registrations"),
    (snap) => {
      const changes = snap.docChanges();
      const docs = changes.length ? changes.filter((c) => c.type !== "removed").map((c) => c.doc) : snap.docs;
      for (const d of docs) {
        const patch = patchFromDoc(d.id, d.data() as Record<string, unknown>);
        if (!patch) continue;
        onChange(str((d.data() as Record<string, unknown>).patientId), patch);
      }
    },
    (err) => console.warn("clinic_patient_registrations:", err.message)
  );
}

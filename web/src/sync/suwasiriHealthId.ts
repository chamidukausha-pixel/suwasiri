import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  query,
  where,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { LabResult, Patient, VaccineRecord } from "../types";
import { mapVaccinations } from "./suwasiriPatientChart";

/** Same FNV-1a Unique Health ID as Flutter `SuwasiriHealthId.generate`. */
export function generateSuwasiriHealthId(userId: string, nic: string): string {
  const nicDigits = nic.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  const seed = `${userId}|${nicDigits}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const body = hash.toString(16).toUpperCase().padStart(8, "0");
  const check = (hash % 97).toString().padStart(2, "0");
  return `SW${body}${check}`;
}

export function normalizeHealthId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Suwasiri Unique Health ID printed on the card (SW + 10 alphanumeric). */
export function looksLikeUniqueHealthId(raw: string): boolean {
  return /^SW[A-Z0-9]{10}$/.test(normalizeHealthId(raw));
}

/** Dummy hashed Unique Health ID files (wrong name for a real SW… ID). */
export function isFakeSuwasiriClinicFile(p: { notes?: string } | null | undefined): boolean {
  return /dynamically compiled|secure id:|synced via suwasiri mobile app index/i.test(String(p?.notes || ""));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value).trim();
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

export function isPlaceholderPatientName(name?: string | null): boolean {
  const n = (name || "").trim().toLowerCase();
  return (
    !n ||
    n === "patient" ||
    n === "suwasiri patient" ||
    n === "unknown" ||
    n === "unknown patient"
  );
}

function namesFromClinicRegistrations(data: Record<string, unknown>): string[] {
  const regs = asRecord(data.clinicRegistrations);
  const names: string[] = [];
  for (const value of Object.values(regs)) {
    const row = asRecord(value);
    const n = str(row.fullName) || str(row.name);
    if (n && !isPlaceholderPatientName(n)) names.push(n);
  }
  return names;
}

/** Real patient name from the Suwasiri `users` file — never the Auth placeholder "Patient". */
export function displayName(data: Record<string, unknown>, intake: Record<string, unknown>): string {
  const candidates = [
    str(intake.fullName),
    str(data.fullName),
    ...namesFromClinicRegistrations(data),
    str(data.name),
    str(data.displayName),
  ].filter((n) => n && !isPlaceholderPatientName(n));
  if (candidates[0]) return candidates[0];
  const email = str(data.email);
  const local = email.split("@")[0].replace(/[._]+/g, " ").trim();
  if (local && !isPlaceholderPatientName(local) && !local.includes("phone.suwasiri")) {
    return local
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return "";
}

export function pickRealPatientName(...names: Array<string | undefined | null>): string {
  for (const n of names) {
    if (n && !isPlaceholderPatientName(n)) return n.trim();
  }
  return "";
}

function genderFromIntake(data: Record<string, unknown>, intake: Record<string, unknown>): string {
  const raw = str(intake.sex || intake.gender || data.gender);
  if (!raw) return "Not recorded";
  const g = raw.toLowerCase();
  if (g.startsWith("f") || g.includes("female")) return "Female";
  if (g.startsWith("m") || g.includes("male")) return "Male";
  return raw;
}

function allergyLabel(data: Record<string, unknown>, intake: Record<string, unknown>): string {
  const clinic = str(data.clinicAllergies);
  if (clinic) return clinic;
  const parts = [
    intake.importantAllergies,
    intake.medicationAllergies,
    intake.otherAllergies,
    intake.allergies,
    data.allergies,
  ]
    .map((x) => str(x))
    .filter(Boolean);
  return [...new Set(parts)].join(", ") || "None declared";
}

function parseEmergency(raw: string): { name: string; phone: string } {
  const text = raw.trim();
  if (!text) return { name: "", phone: "" };
  const phoneMatch = text.match(/(?:\+?94|0)?[\s-]?\d[\d\s-]{7,14}\d/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : "";
  let name = text;
  if (phone) {
    name = text.replace(phone, "").replace(/[-–,|/]+/g, " ").replace(/\s+/g, " ").trim();
  }
  return { name: name || text, phone };
}

function emergencyFromProfile(
  data: Record<string, unknown>,
  intake: Record<string, unknown>
): { name: string; phone: string } {
  const list = Array.isArray(data.emergencyContacts) ? data.emergencyContacts : [];
  for (const item of list) {
    if (typeof item === "string" && item.trim()) return parseEmergency(item);
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const name = str(row.name || row.contactName || row.fullName);
      const phone = str(row.phone || row.mobile || row.mobileNo || row.number);
      if (name || phone) return { name, phone };
    }
  }
  const fromIntake = str(intake.emergencyContact || intake.safetyEmergencyContact);
  if (fromIntake) return parseEmergency(fromIntake);
  return { name: "", phone: "" };
}

function medicalHistoryFromIntake(intake: Record<string, unknown>): string[] {
  if (Array.isArray(intake.conditions)) {
    return (intake.conditions as unknown[]).map((x) => str(x)).filter(Boolean);
  }
  const parts = [
    intake.existingConditions,
    intake.previousSurgeries,
    intake.previousSeriousIllnesses,
    intake.familyHistory,
    intake.currentMedications,
  ]
    .map((x) => str(x))
    .filter(Boolean);
  return parts.length ? parts : [];
}

function intakeVaccines(intake: Record<string, unknown>): VaccineRecord[] {
  const date = isoDate(intake.mostRecentVaccinationDate) || "—";
  const rows: VaccineRecord[] = [];
  const add = (vaccineName: string, detail: unknown) => {
    const dose = str(detail);
    if (!dose) return;
    rows.push({
      vaccineName,
      date,
      dose,
      batchNumber: "",
      status: "Completed",
    });
  };
  add("COVID-19", intake.covidVaccination);
  add("Influenza", intake.influenzaVaccination);
  add("Other immunisations", intake.otherImmunisations);
  return rows;
}

function mergeVaccines(primary: VaccineRecord[], extra: VaccineRecord[]): VaccineRecord[] {
  const byKey = new Map<string, VaccineRecord>();
  for (const row of [...extra, ...primary]) {
    byKey.set(`${row.vaccineName}|${row.date}|${row.dose}`.toLowerCase(), row);
  }
  return [...byKey.values()];
}

function mapVaultToLab(id: string, data: Record<string, unknown>): LabResult | null {
  const kind = str(data.kind || "lab").toLowerCase();
  if (kind === "vaccine") return null;
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  const result = metrics
    .map((m) => {
      const row = asRecord(m);
      const name = str(row.name);
      const value = str(row.value);
      return name && value ? `${name}: ${value}` : value || name;
    })
    .filter(Boolean)
    .join("; ")
    || str(data.clinicalComments || data.result);
  const metricStatuses = metrics.map((m) => str(asRecord(m).status).toLowerCase());
  const critical = data.critical === true || metricStatuses.includes("critical");
  const abnormal = critical || metricStatuses.includes("attention") || metricStatuses.includes("abnormal");
  return {
    id,
    testName: str(data.title) || "Lab report",
    date: isoDate(data.date) || "—",
    status: critical ? "CRITICAL" : abnormal ? "ABNORMAL" : "COMPLETED",
    result: result || "See report",
    remarks: str(data.clinicalComments || data.issuedBy),
    category: str(data.category) || "Pathology",
    labName: str(data.facility || data.issuedBy),
    abnormalFlag: abnormal,
    criticalAlert: critical,
    suwasiriSyncedAt: isoDate(data.syncedAt || data.date) || undefined,
  };
}

async function fetchLabs(patientId: string): Promise<LabResult[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "vault"), where("patientId", "==", patientId))
  );
  return snap.docs
    .map((d) => mapVaultToLab(d.id, d.data() as Record<string, unknown>))
    .filter((row): row is LabResult => Boolean(row))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

async function fetchVaccines(patientId: string): Promise<VaccineRecord[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "vaccinations"), where("patientId", "==", patientId))
  );
  return mapVaccinations(
    snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
  );
}

export function mapUserDocToPatient(id: string, data: Record<string, unknown>): Patient {
  const intake = asRecord(data.healthIntake);
  const dob = isoDate(data.dateOfBirth || intake.dateOfBirth);
  const nic = str(data.NIC || data.nic || intake.medicareDetails);
  const barcode = str(data.barcodeNumber || data.ceylonHealthId) || generateSuwasiriHealthId(id, nic || id);
  const emergency = emergencyFromProfile(data, intake);
  const phone = str(data.mobileNo || data.phone || intake.contactDetails);
  const address = str(intake.address || data.region);
  const height = Number(str(intake.heightCm));
  const weight = Number(str(intake.weightKg));
  return {
    id,
    name: displayName(data, intake),
    age: ageFromDob(dob),
    gender: genderFromIntake(data, intake),
    dateOfBirth: dob || undefined,
    nic: nic || undefined,
    address: address || undefined,
    bloodType: str(data.bloodGroup || intake.bloodGroup) || "Not recorded",
    allergies: allergyLabel(data, intake),
    phone,
    email: str(data.email),
    image: "",
    notes: "Synced from Suwasiri Unique Health ID",
    history: [],
    activeMedications: str(intake.currentMedications)
      ? [str(intake.currentMedications)]
      : [],
    medicalHistory: medicalHistoryFromIntake(intake),
    vaccineRecords: intakeVaccines(intake),
    labResults: [],
    prescriptionsList: [],
    suwasiriBarcode: barcode || undefined,
    medicareNumber: nic || barcode || undefined,
    ihiNumber: nic || undefined,
    emergencyContactName: emergency.name || undefined,
    emergencyContactPhone: emergency.phone || undefined,
    heightCm: Number.isFinite(height) && height > 0 ? height : undefined,
    weightKg: Number.isFinite(weight) && weight > 0 ? weight : undefined,
  };
}

async function nameFromAppointments(patientId: string): Promise<string> {
  try {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "appointments"), where("patientId", "==", patientId))
    );
    for (const d of snap.docs) {
      const n = str((d.data() as Record<string, unknown>).patientName);
      if (n && !isPlaceholderPatientName(n)) return n;
    }
  } catch (err) {
    console.warn("Appointment name for Unique Health ID:", err);
  }
  return "";
}

async function enrichPatient(id: string, data: Record<string, unknown>): Promise<Patient> {
  const base = mapUserDocToPatient(id, data);
  const [labs, vaccines, bookedName] = await Promise.all([
    fetchLabs(id).catch((err) => {
      console.warn("Unique Health ID labs:", err);
      return [] as LabResult[];
    }),
    fetchVaccines(id).catch((err) => {
      console.warn("Unique Health ID vaccines:", err);
      return [] as VaccineRecord[];
    }),
    isPlaceholderPatientName(base.name) ? nameFromAppointments(id) : Promise.resolve(""),
  ]);
  return {
    ...base,
    name: pickRealPatientName(base.name, bookedName) || base.name,
    labResults: labs,
    vaccineRecords: mergeVaccines(vaccines, base.vaccineRecords || []),
  };
}

async function readQuery(q: ReturnType<typeof query>) {
  try {
    return await getDocsFromServer(q);
  } catch {
    return await getDocs(q);
  }
}

function healthIdsOnUser(id: string, data: Record<string, unknown>): string[] {
  const nic = str(data.NIC || data.nic);
  return [
    str(data.barcodeNumber),
    str(data.ceylonHealthId),
    nic,
    generateSuwasiriHealthId(id, nic || id),
  ]
    .map(normalizeHealthId)
    .filter(Boolean);
}

function userMatchesHealthId(id: string, data: Record<string, unknown>, upper: string): boolean {
  if (normalizeHealthId(id) === upper) return true;
  return healthIdsOnUser(id, data).includes(upper);
}

export function patientVisibleAtHospital(p: Patient, hospitalId: string): boolean {
  if (p.accessStatus === "DELETED") return false;
  const ids = p.syncedHospitalIds && p.syncedHospitalIds.length > 0
    ? p.syncedHospitalIds
    : [p.hospitalId || "hosp-primecare"];
  return ids.includes(hospitalId);
}

async function queryByField(field: string, value: string): Promise<Patient | null> {
  if (!value) return null;
  try {
    const snap = await readQuery(
      query(collection(getFirebaseDb(), "users"), where(field, "==", value))
    );
    if (snap.empty) return null;
    const first = snap.docs[0];
    return enrichPatient(first.id, first.data() as Record<string, unknown>);
  } catch (err) {
    console.warn(`Unique Health ID query ${field}:`, err);
    return null;
  }
}

export async function loadSuwasiriUserFile(patientId: string): Promise<Patient | null> {
  if (!patientId || !isFirebaseConfigured()) return null;
  if (!getFirebaseAuth().currentUser) return null;
  try {
    const snap = await getDoc(doc(getFirebaseDb(), "users", patientId));
    if (!snap.exists()) return null;
    return enrichPatient(snap.id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.warn("Suwasiri user file:", err);
    return null;
  }
}

/** Look up a Suwasiri Unique Health ID / barcode on Firestore `users`, plus vault labs and vaccinations. */
export async function lookupSuwasiriHealthId(raw: string): Promise<Patient | null> {
  const code = raw.trim();
  if (!code || !isFirebaseConfigured()) return null;
  if (!getFirebaseAuth().currentUser) {
    throw new Error("Sign in to GP Care first, then look up the Unique Health ID.");
  }
  const upper = normalizeHealthId(code);
  const variants = [...new Set([code, code.toUpperCase(), upper].filter(Boolean))];

  for (const value of variants) {
    const hit =
      (await queryByField("barcodeNumber", value)) ||
      (await queryByField("ceylonHealthId", value)) ||
      (await queryByField("NIC", value)) ||
      (await queryByField("nic", value));
    if (hit) return hit;
  }

  const scanned = await scanUsersForHealthId(upper);
  if (scanned) return scanned;

  try {
    const direct = await getDoc(doc(getFirebaseDb(), "users", code));
    if (direct.exists()) {
      return enrichPatient(direct.id, direct.data() as Record<string, unknown>);
    }
  } catch (err) {
    console.warn("Unique Health ID direct doc:", err);
  }
  return null;
}

async function scanUsersForHealthId(upper: string): Promise<Patient | null> {
  try {
    const snap = await readQuery(query(collection(getFirebaseDb(), "users")));
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      if (userMatchesHealthId(d.id, data, upper)) {
        return enrichPatient(d.id, data);
      }
    }
  } catch (err) {
    console.warn("Unique Health ID user scan:", err);
  }
  return null;
}

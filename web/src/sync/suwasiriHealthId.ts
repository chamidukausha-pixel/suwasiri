import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { Patient } from "../types";

function ageFromDob(raw?: string): number {
  if (!raw) return 35;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 35;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return Math.max(0, age);
}

function genderFromIntake(data: Record<string, unknown>): string {
  const intake = (data.healthIntake || {}) as Record<string, unknown>;
  const g = String(intake.gender || data.gender || "").toLowerCase();
  if (g.startsWith("f")) return "Female";
  if (g.startsWith("m")) return "Male";
  return "Female";
}

export function mapUserDocToPatient(id: string, data: Record<string, unknown>): Patient {
  const intake = (data.healthIntake || {}) as Record<string, unknown>;
  const name = String(data.name || "Suwasiri patient");
  const barcode = String(data.barcodeNumber || data.ceylonHealthId || "");
  const dob = String(data.dateOfBirth || intake.dateOfBirth || "");
  const conditions = Array.isArray(intake.conditions)
    ? (intake.conditions as string[])
    : [];
  return {
    id,
    name,
    age: ageFromDob(dob),
    gender: genderFromIntake(data),
    dateOfBirth: dob || undefined,
    bloodType: String(data.bloodGroup || intake.bloodGroup || "O+"),
    allergies: String(intake.allergies || data.allergies || "None declared"),
    phone: String(data.mobileNo || data.phone || ""),
    email: String(data.email || ""),
    image: "",
    notes: "Synced from Suwasiri Unique Health ID",
    history: [],
    activeMedications: [],
    medicalHistory: conditions,
    vaccineRecords: [],
    labResults: [],
    prescriptionsList: [],
    suwasiriBarcode: barcode || undefined,
    medicareNumber: barcode || undefined,
  };
}

export function patientVisibleAtHospital(p: Patient, hospitalId: string): boolean {
  if (p.accessStatus === "DELETED") return false;
  const ids = p.syncedHospitalIds && p.syncedHospitalIds.length > 0
    ? p.syncedHospitalIds
    : [p.hospitalId || "hosp-primecare"];
  return ids.includes(hospitalId);
}

async function queryByField(field: string, value: string): Promise<Patient | null> {
  const db = getFirebaseDb();
  const snap = await getDocs(query(collection(db, "users"), where(field, "==", value)));
  if (snap.empty) return null;
  const first = snap.docs[0];
  return mapUserDocToPatient(first.id, first.data() as Record<string, unknown>);
}

/** Look up a Suwasiri Unique Health ID / barcode on Firestore `users`. */
export async function lookupSuwasiriHealthId(raw: string): Promise<Patient | null> {
  const code = raw.trim();
  if (!code || !isFirebaseConfigured()) return null;
  const upper = code.toUpperCase();
  try {
    const byBarcode = await queryByField("barcodeNumber", code);
    if (byBarcode) return byBarcode;
    const byBarcodeU = code === upper ? null : await queryByField("barcodeNumber", upper);
    if (byBarcodeU) return byBarcodeU;
    const byCeylon = await queryByField("ceylonHealthId", code);
    if (byCeylon) return byCeylon;
    const byCeylonU = await queryByField("ceylonHealthId", upper);
    if (byCeylonU) return byCeylonU;
    const scanned = await scanUsersForHealthId(upper);
    if (scanned) return scanned;
    const direct = await getDoc(doc(getFirebaseDb(), "users", code));
    if (direct.exists()) {
      return mapUserDocToPatient(direct.id, direct.data() as Record<string, unknown>);
    }
  } catch (err) {
    console.warn("Unique Health ID lookup:", err);
  }
  return null;
}

async function scanUsersForHealthId(upper: string): Promise<Patient | null> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, "users"));
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const barcode = String(data.barcodeNumber || "").trim().toUpperCase();
    const ceylon = String(data.ceylonHealthId || "").trim().toUpperCase();
    if (barcode === upper || ceylon === upper || d.id.toUpperCase() === upper) {
      return mapUserDocToPatient(d.id, data);
    }
  }
  return null;
}

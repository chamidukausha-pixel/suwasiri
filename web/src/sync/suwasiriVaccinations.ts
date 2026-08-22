import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { Patient } from "../types";
import { BRANCH_COLOMBO, HOSPITAL_PRIMECARE } from "../tenancy";

export interface SuwasiriVaccineBookingRow {
  id: string;
  patientId: string;
  patientName: string;
  vaccineName: string;
  facilityName: string;
  slot: string;
  status: string;
}

function mapRow(
  id: string,
  data: Record<string, unknown>
): SuwasiriVaccineBookingRow | null {
  const patientId = String(data.patientId || "").trim();
  if (!patientId) return null;
  return {
    id,
    patientId,
    patientName: String(data.patientName || "").trim(),
    vaccineName: String(data.vaccineName || data.name || "").trim(),
    facilityName: String(data.facilityName || "").trim(),
    slot: String(data.slot || data.bookedAt || "").trim(),
    status: String(data.status || "confirmed"),
  };
}

/** Build a roster patient so vaccine-only Suwasiri members appear under their own name. */
export function stubPatientFromVaccine(row: SuwasiriVaccineBookingRow): Patient {
  const name = row.patientName.trim() || "Patient";
  return {
    id: row.patientId,
    name,
    age: 0,
    gender: "Unknown",
    bloodType: "—",
    allergies: "NKDA",
    phone: "",
    email: "",
    image: "",
    notes: [
      "Vaccine booked via Suwasiri App",
      row.vaccineName ? `Vaccine: ${row.vaccineName}` : "",
      row.facilityName ? `Facility: ${row.facilityName}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    history: [],
    activeMedications: [],
    medicalHistory: [],
    vaccineRecords: [],
    labResults: [],
    prescriptionsList: [],
    hospitalId: HOSPITAL_PRIMECARE,
    branchId: BRANCH_COLOMBO,
    medicalCenter: row.facilityName || undefined,
    suwasiriBarcode: row.patientId,
  };
}

export function subscribeSuwasiriVaccinePatients(
  onChange: (patients: Patient[]) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured()) return undefined;
  try {
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, "vaccinations"),
      (snap) => {
        const byId = new Map<string, Patient>();
        for (const docSnap of snap.docs) {
          const row = mapRow(docSnap.id, docSnap.data() as Record<string, unknown>);
          if (!row) continue;
          const existing = byId.get(row.patientId);
          const stub = stubPatientFromVaccine(row);
          if (!existing) {
            byId.set(row.patientId, stub);
            continue;
          }
          if (
            row.patientName &&
            (existing.name.toLowerCase() === "patient" ||
              existing.name.toLowerCase() === "suwasiri patient")
          ) {
            byId.set(row.patientId, { ...existing, name: row.patientName });
          }
        }
        onChange([...byId.values()]);
      },
      (err) => console.warn("Suwasiri vaccine patient sync:", err.message)
    );
  } catch (err) {
    console.warn("Suwasiri vaccine patient sync unavailable", err);
    return undefined;
  }
}

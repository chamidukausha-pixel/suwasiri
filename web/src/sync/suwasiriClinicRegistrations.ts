import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { Patient } from "../types";

export interface ClinicRegistrationPatch {
  hospitalId: string;
  hospitalName: string;
  historyLines: string[];
  notes: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string {
  return String(value ?? "").trim();
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
  return {
    ...patient,
    medicalHistory: merged,
    notes: patch.notes || patient.notes,
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
      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, unknown>;
        const patientId = str(data.patientId);
        if (!patientId) continue;
        const reg = asRecord(data.registration);
        const hospitalName = str(data.hospitalName) || str(reg.hospitalName);
        const historyLines = [
          `New patient registration · ${hospitalName}`,
          ...historyFromRegistration(reg),
        ];
        onChange(patientId, {
          hospitalId: str(data.hospitalId),
          hospitalName,
          historyLines,
          notes: `Suwasiri new-patient intake at ${hospitalName}`,
        });
      }
    },
    (err) => console.warn("clinic_patient_registrations:", err.message)
  );
}

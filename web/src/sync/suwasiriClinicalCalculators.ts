import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { ClinicalCalculationResult, ObservationRecord } from "../types";

export interface ClinicalCalculatorSnapshot {
  patientId: string;
  heightCm?: number;
  weightKg?: number;
  lastSystolicBp?: number;
  lastDiastolicBp?: number;
  waistCm?: number;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string[];
  observationsHistory?: ObservationRecord[];
  clinicalCalculations?: ClinicalCalculationResult[];
  updatedAt?: string;
  updatedBy?: string;
}

export async function loadClinicalCalculatorSnapshot(
  patientId: string
): Promise<ClinicalCalculatorSnapshot | null> {
  if (!isFirebaseConfigured() || !patientId) return null;
  try {
    const snap = await getDoc(doc(getFirebaseDb(), "clinical_calculations", patientId));
    if (!snap.exists()) return null;
    return { patientId, ...(snap.data() as Omit<ClinicalCalculatorSnapshot, "patientId">) };
  } catch (err) {
    console.warn("Clinical calculator snapshot load:", err);
    return null;
  }
}

export async function saveClinicalCalculatorSnapshot(
  snapshot: ClinicalCalculatorSnapshot
): Promise<void> {
  if (!isFirebaseConfigured() || !snapshot.patientId) return;
  try {
    await setDoc(
      doc(getFirebaseDb(), "clinical_calculations", snapshot.patientId),
      {
        ...snapshot,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Clinical calculator snapshot save:", err);
  }
}

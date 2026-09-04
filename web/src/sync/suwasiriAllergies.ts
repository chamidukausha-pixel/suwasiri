import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

const NKDA = "NKDA";

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function storedAllergyLabel(raw: string): string {
  const value = (raw || "").trim();
  if (!value) return NKDA;
  const n = value.toLowerCase().replace(/[.]/g, "");
  if (/^(none|none declared|none known|no known allergies|no known drug allergies|nka|nil)$/.test(n)) {
    return NKDA;
  }
  return value;
}

/** Merges GP Care allergies onto the Suwasiri Unique Health ID profile. */
export async function syncPatientAllergiesToSuwasiri(opts: {
  patientId: string;
  allergies: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const patientId = (opts.patientId || "").trim();
  if (!patientId) return false;
  const allergies = storedAllergyLabel(opts.allergies);
  const cleared = allergies === NKDA;

  const db = getFirebaseDb();
  const ref = doc(db, "users", patientId);
  const payload: Record<string, unknown> = {
    clinicAllergies: allergies,
    allergiesUpdatedAt: new Date().toISOString(),
  };
  try {
    const snap = await getDoc(ref);
    const intake = asRecord(snap.data()?.healthIntake);
    payload.healthIntake = {
      ...intake,
      importantAllergies: allergies,
      ...(cleared ? { medicationAllergies: "", otherAllergies: "" } : {}),
    };
  } catch (err) {
    console.warn("Allergy profile read:", err);
  }

  await setDoc(ref, payload, { merge: true });
  return true;
}

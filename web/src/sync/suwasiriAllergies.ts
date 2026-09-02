import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

/** Merges GP Care allergies onto the Suwasiri Unique Health ID profile. */
export async function syncPatientAllergiesToSuwasiri(opts: {
  patientId: string;
  allergies: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const patientId = (opts.patientId || "").trim();
  if (!patientId) return false;
  const allergies = (opts.allergies || "").trim();

  const db = getFirebaseDb();
  await setDoc(
    doc(db, "users", patientId),
    {
      clinicAllergies: allergies,
      allergiesUpdatedAt: new Date().toISOString(),
      ...(allergies ? { healthIntake: { importantAllergies: allergies } } : {}),
    },
    { merge: true }
  );
  return true;
}

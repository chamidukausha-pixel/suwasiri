import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

/** Matches Suwasiri Doctors category filter so GP Care staff appear under the same specialty. */
export const GP_CARE_DOCTOR_CATEGORIES = [
  "Physician / Consultant Physician",
  "Cardiologist",
  "Neurologist",
  "Pediatrician",
  "Dermatologist",
  "Psychiatrist",
  "Endocrinologist",
  "Nephrologist",
  "Oncologist",
  "Rheumatologist",
  "Hematologist",
  "Chest Physician / Pulmonologist",
  "General Practitioner",
  "Physiotherapist",
  "Orthopedic Surgeon",
  "Gastroenterologist",
  "Ophthalmologist",
  "ENT Surgeon",
  "Obstetrician / Gynecologist",
  "Urologist",
  "Dental Surgeon",
  "General Surgeon",
  "Radiologist",
] as const;

export async function publishClinicDoctorToSuwasiri(opts: {
  id: string;
  name: string;
  specialty: string;
  clinicName: string;
  region?: string;
  email?: string;
  phone?: string;
  hospitalId?: string;
  branchId?: string;
}): Promise<void> {
  if (!isFirebaseConfigured() || !opts.name.trim() || !opts.clinicName.trim()) return;
  const displayName = /^dr\.?\s/i.test(opts.name) ? opts.name.trim() : `Dr. ${opts.name.trim()}`;
  await setDoc(
    doc(getFirebaseDb(), "clinic_doctors", opts.id),
    {
      name: displayName,
      specialty: opts.specialty || "General Practitioner",
      hospital: opts.clinicName,
      clinicName: opts.clinicName,
      region: opts.region || "Colombo",
      email: opts.email || "",
      phone: opts.phone || "",
      hospitalId: opts.hospitalId || "",
      branchId: opts.branchId || "",
      rating: 4.8,
      yearsExperience: 8,
      feeLkr: 3500,
      source: "gp_care",
      active: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

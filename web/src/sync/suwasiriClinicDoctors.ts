import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

export function clinicDoctorDocId(staffId: string) {
  const slug = staffId.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  return `clinic-${slug || Date.now()}`;
}

/** Publish a GP Care doctor so Suwasiri Doctors tab can list them under that clinic + specialty. */
export async function publishClinicDoctorToSuwasiri(opts: {
  staffId: string;
  name: string;
  specialty: string;
  hospitalName: string;
  branchName?: string;
  region?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const name = opts.name.trim();
  const specialty = opts.specialty.trim();
  if (!name || !specialty) return;
  const displayName = /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  const hospital = opts.hospitalName.trim() || "GP Care Clinic";
  const id = clinicDoctorDocId(opts.staffId);
  await setDoc(
    doc(getFirebaseDb(), "clinic_doctors", id),
    {
      name: displayName,
      specialty,
      hospital,
      address: opts.branchName || hospital,
      region: opts.region || "Colombo",
      rating: 4.8,
      yearsExperience: 8,
      feeLkr: 3500,
      nextAvailable: "Mon–Fri · 09:00–17:00",
      bio: `${specialty} at ${hospital}. Book via Suwasiri.`,
      email: opts.email || "",
      phone: opts.phone || "",
      source: "gp_care",
      staffId: opts.staffId,
      active: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

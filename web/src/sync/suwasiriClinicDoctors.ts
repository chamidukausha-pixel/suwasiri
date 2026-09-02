import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { Branch, StaffProvider } from "../types";

const EMPTY_ROSTER: StaffProvider["roster"] = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
};

export function mapClinicDoctorDoc(id: string, data: Record<string, unknown>): StaffProvider {
  const hours =
    data.rosterHours && typeof data.rosterHours === "object"
      ? (data.rosterHours as StaffProvider["rosterHours"])
      : undefined;
  return {
    id,
    hospitalId: String(data.hospitalId || ""),
    branchIds: data.branchId ? [String(data.branchId)] : [],
    name: String(data.name || "Doctor"),
    role: "Doctor",
    specialty: String(data.specialty || "General Practice"),
    providerNumber: "",
    email: String(data.email || ""),
    phone: String(data.phone || ""),
    assignedRoom: String(data.address || data.hospital || "Clinic"),
    roster: EMPTY_ROSTER,
    rosterHours: hours,
    active: data.active !== false,
  };
}

export function subscribeClinicDoctors(
  onChange: (doctors: StaffProvider[]) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured()) return undefined;
  try {
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, "clinic_doctors"),
      (snap) => {
        onChange(snap.docs.map((d) => mapClinicDoctorDoc(d.id, d.data() as Record<string, unknown>)));
      },
      (err) => {
        console.warn("Clinic doctor sync:", err.message);
      }
    );
  } catch (err) {
    console.warn("Clinic doctor sync unavailable", err);
    return undefined;
  }
}

export function staffDoctorStub(opts: {
  id: string;
  name: string;
  specialty?: string;
  hospitalId?: string;
}): StaffProvider {
  return {
    id: opts.id,
    hospitalId: opts.hospitalId,
    name: opts.name,
    role: "Doctor",
    specialty: opts.specialty || "General Practice",
    providerNumber: "",
    email: "",
    phone: "",
    assignedRoom: "Clinic",
    roster: EMPTY_ROSTER,
    active: true,
  };
}

export function clinicDoctorDocId(staffId: string) {
  const slug = staffId.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  return `clinic-${slug || Date.now()}`;
}

/** Stable Suwasiri doctor id so app + GP Care share the same appointment_slots lock. */
export function suwasiriDoctorDocId(opts: { staffId?: string; doctorName?: string }): string {
  const staff = (opts.staffId || "").trim();
  if (/^(d-|clinic-)/i.test(staff)) return staff;
  const name = (opts.doctorName || "")
    .toLowerCase()
    .replace(/^dr\.?\s*/, "")
    .trim();
  if (name.includes("priyantha silva")) return "d-priyantha-silva";
  if (name.includes("anoja senanayake") || name.includes("anoja")) return "d-anoja-senanayake";
  if (name.includes("kasun jayawardena") || (name.includes("kasun") && name.includes("jayawardena"))) {
    return "d-kasun-jayawardena";
  }
  const slug = name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slug) return `d-${slug}`;
  return clinicDoctorDocId(opts.staffId || "gp");
}

function rosterLabel(rosterHours?: StaffProvider["rosterHours"], roster?: StaffProvider["roster"]): string {
  if (rosterHours && Object.keys(rosterHours).length) {
    const days = Object.entries(rosterHours)
      .filter(([, h]) => h?.start && h?.end)
      .map(([day, h]) => `${day.slice(0, 3)} ${h!.start}–${h!.end}`);
    if (days.length) return days.join(" · ");
  }
  if (roster) {
    const on = Object.entries(roster)
      .filter(([, v]) => v)
      .map(([d]) => d.slice(0, 3));
    if (on.length) return `${on.join("/")} · clinic hours`;
  }
  return "Mon–Fri · 09:00–17:00";
}

/** Publish a GP Care doctor so Suwasiri Doctors tab can list them under that clinic + specialty. */
export async function publishClinicDoctorToSuwasiri(opts: {
  staffId: string;
  name: string;
  specialty: string;
  hospitalName: string;
  hospitalId?: string;
  branchName?: string;
  branchId?: string;
  region?: string;
  email?: string;
  phone?: string;
  rosterHours?: StaffProvider["rosterHours"];
  roster?: StaffProvider["roster"];
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const name = opts.name.trim();
  const specialty = opts.specialty.trim();
  if (!name || !specialty) return;
  const displayName = /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  const hospital = opts.hospitalName.trim() || "GP Care Clinic";
  const id = suwasiriDoctorDocId({ staffId: opts.staffId, doctorName: displayName });
  const hours = opts.rosterHours
    ? Object.fromEntries(
        Object.entries(opts.rosterHours)
          .filter(([, h]) => h?.start && h?.end)
          .map(([day, h]) => [day, { start: h!.start, end: h!.end }])
      )
    : {};
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
      nextAvailable: rosterLabel(opts.rosterHours, opts.roster),
      bio: `${specialty} at ${hospital}. Book via Suwasiri.`,
      email: opts.email || "",
      phone: opts.phone || "",
      source: "gp_care",
      staffId: opts.staffId,
      hospitalId: opts.hospitalId || "",
      branchId: opts.branchId || "",
      rosterHours: hours,
      active: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function publishClinicCenterToSuwasiri(opts: {
  hospitalId: string;
  name: string;
  region?: string;
  address?: string;
  branchName?: string;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const name = opts.name.trim();
  if (!name) return;
  await setDoc(
    doc(getFirebaseDb(), "clinic_centers", opts.hospitalId),
    {
      name,
      region: opts.region || "Colombo",
      address: opts.address || opts.branchName || `${opts.region || "Colombo"}, Sri Lanka`,
      hospitalId: opts.hospitalId,
      source: "gp_care",
      active: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function republishStaffDoctorsToSuwasiri(opts: {
  staff: StaffProvider[];
  hospitalName: string;
  hospitalId: string;
  branches: Branch[];
  region?: string;
}): Promise<void> {
  const doctors = opts.staff.filter(
    (s) => s.active !== false && /doctor|medical officer/i.test(s.role || "")
  );
  for (const s of doctors) {
    const branch = opts.branches.find((b) => (s.branchIds || []).includes(b.id)) || opts.branches[0];
    try {
      await publishClinicDoctorToSuwasiri({
        staffId: s.id,
        name: s.name,
        specialty: s.specialty || "General Practitioner",
        hospitalName: branch?.name || opts.hospitalName,
        hospitalId: opts.hospitalId,
        branchName: branch?.name,
        branchId: branch?.id,
        region: opts.region || "Colombo",
        email: s.email,
        phone: s.phone,
        rosterHours: s.rosterHours,
        roster: s.roster,
      });
    } catch (err) {
      console.warn("Could not republish clinic doctor to Suwasiri:", err);
    }
  }
}

import {
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
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
  const roster =
    data.roster && typeof data.roster === "object"
      ? ({ ...EMPTY_ROSTER, ...(data.roster as StaffProvider["roster"]) } as StaffProvider["roster"])
      : EMPTY_ROSTER;
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
    roster,
    rosterHours: hours,
    photoUrl: String(data.photoUrl || ""),
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
        onChange(
          snap.docs
            .filter((d) => (d.data() as Record<string, unknown>).active !== false)
            .map((d) => mapClinicDoctorDoc(d.id, d.data() as Record<string, unknown>))
        );
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
    photoUrl: "",
    active: true,
  };
}

export function doctorWorksAtClinic(d: StaffProvider, hospitalId: string): boolean {
  if (d.active === false) return false;
  if (d.role && !/doctor|medical officer/i.test(d.role)) return false;
  if (!(d.hospitalId || "").trim()) return true;
  return d.hospitalId === hospitalId;
}

export function clinicDoctorDocId(staffId: string) {
  const slug = staffId.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  return `clinic-${slug || Date.now()}`;
}

/** Stable Suwasiri doctor id so app + GP Care share the same appointment_slots lock. */
export function suwasiriDoctorDocId(opts: { staffId?: string; doctorName?: string }): string {
  const staff = (opts.staffId || "").trim();
  const name = (opts.doctorName || "")
    .toLowerCase()
    .replace(/^dr\.?\s*/, "")
    .trim();
  // Name aliases first — a published slug like d-chamidu-kaushal-rathnayake
  // must still lock the same slots as the catalog id.
  if (name.includes("chamidu") && (name.includes("rathnayake") || name.includes("kaushal"))) {
    return "d-chamidu-rathnayake";
  }
  if (name.includes("priyantha silva")) return "d-priyantha-silva";
  if (name.includes("anoja senanayake") || name.includes("anoja")) return "d-anoja-senanayake";
  if (name.includes("kasun jayawardena") || (name.includes("kasun") && name.includes("jayawardena"))) {
    return "d-kasun-jayawardena";
  }
  if (/^(d-|clinic-)/i.test(staff)) return staff;
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
  photoUrl?: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const name = opts.name.trim();
  const specialty = opts.specialty.trim();
  if (!name || !specialty) return false;
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
  const payload: Record<string, unknown> = {
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
    active: true,
    updatedAt: new Date().toISOString(),
  };
  // Never publish {} — merge would wipe hours the clinic already saved.
  if (Object.keys(hours).length > 0) {
    payload.rosterHours = hours;
  }
  if (opts.roster) {
    payload.roster = opts.roster;
  }
  if (opts.photoUrl !== undefined) {
    payload.photoUrl = opts.photoUrl ? opts.photoUrl : deleteField();
  }
  await setDoc(doc(getFirebaseDb(), "clinic_doctors", id), payload, { merge: true });
  return true;
}

async function markClinicDoctorInactive(id: string): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "clinic_doctors", id),
    { active: false, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

/** Hide a resigned doctor on Suwasiri Doctors / booking (keeps the Firestore id for later re-add). */
export async function unpublishClinicDoctorFromSuwasiri(opts: {
  staffId: string;
  doctorName?: string;
  hospitalId?: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const ids = new Set<string>();
  ids.add(suwasiriDoctorDocId({ staffId: opts.staffId, doctorName: opts.doctorName }));
  try {
    const db = getFirebaseDb();
    if (opts.staffId) {
      const byStaff = await getDocs(query(collection(db, "clinic_doctors"), where("staffId", "==", opts.staffId)));
      byStaff.docs.forEach((d) => ids.add(d.id));
    }
  } catch (err) {
    console.warn("Lookup clinic doctor to unpublish:", err);
  }
  await Promise.allSettled(
    [...ids].filter((id) => id.length > 0).map((id) => markClinicDoctorInactive(id))
  );
  return true;
}

export async function publishClinicCenterToSuwasiri(opts: {
  hospitalId: string;
  name: string;
  region?: string;
  address?: string;
  branchName?: string;
  logoUrl?: string;
  active?: boolean;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const name = opts.name.trim();
  if (!name) return false;
  const payload: Record<string, unknown> = {
    name,
    region: opts.region || "Colombo",
    address: opts.address || opts.branchName || `${opts.region || "Colombo"}, Sri Lanka`,
    hospitalId: opts.hospitalId,
    source: "gp_care",
    active: opts.active !== false,
    status: opts.active === false ? "SUSPENDED" : "ACTIVE",
    updatedAt: new Date().toISOString(),
  };
  if (opts.logoUrl !== undefined) {
    payload.logoUrl = opts.logoUrl ? opts.logoUrl : deleteField();
  }
  await setDoc(doc(getFirebaseDb(), "clinic_centers", opts.hospitalId), payload, { merge: true });
  return true;
}

/** Hide a suspended medical centre and its doctors from the Suwasiri app until reactivated. */
export async function unpublishHospitalFromSuwasiri(hospitalId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !hospitalId) return false;
  await setDoc(
    doc(getFirebaseDb(), "clinic_centers", hospitalId),
    { active: false, status: "SUSPENDED", updatedAt: new Date().toISOString() },
    { merge: true }
  );
  try {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "clinic_doctors"), where("hospitalId", "==", hospitalId))
    );
    await Promise.allSettled(snap.docs.map((d) => markClinicDoctorInactive(d.id)));
  } catch (err) {
    console.warn("Could not hide clinic doctors after suspend:", err);
  }
  return true;
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
  const keepStaffIds = new Set(doctors.map((s) => s.id));
  for (const s of doctors) {
    const branch = opts.branches.find((b) => (s.branchIds || []).includes(b.id)) || opts.branches[0];
    try {
      await publishClinicDoctorToSuwasiri({
        staffId: s.id,
        name: s.name,
        specialty: s.specialty || "General Practitioner",
        hospitalName: opts.hospitalName || branch?.name || "GP Care Clinic",
        hospitalId: opts.hospitalId,
        branchName: branch?.name,
        branchId: branch?.id,
        region: opts.region || "Colombo",
        email: s.email,
        phone: s.phone,
        rosterHours: s.rosterHours,
        roster: s.roster,
        photoUrl: s.photoUrl || "",
      });
    } catch (err) {
      console.warn("Could not republish clinic doctor to Suwasiri:", err);
    }
  }
  if (!opts.hospitalId || !isFirebaseConfigured()) return;
  try {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "clinic_doctors"), where("hospitalId", "==", opts.hospitalId))
    );
    await Promise.allSettled(
      snap.docs
        .filter((d) => {
          const data = d.data() as Record<string, unknown>;
          if (data.active === false) return false;
          if (data.source && data.source !== "gp_care") return false;
          const staffId = String(data.staffId || "");
          return staffId.length > 0 && !keepStaffIds.has(staffId);
        })
        .map((d) => markClinicDoctorInactive(d.id))
    );
  } catch (err) {
    console.warn("Could not hide resigned clinic doctors on Suwasiri:", err);
  }
}

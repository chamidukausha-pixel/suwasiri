import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import { HOSPITAL_PRIMECARE, BRANCH_COLOMBO } from "../tenancy";
import type { Appointment, Patient } from "../types";
import { suwasiriDoctorDocId } from "./suwasiriClinicDoctors";

/** Sri Lanka has no DST; clinic wall-clock is always UTC+05:30. */
function colomboWallTime(dateKey: string, hours: number, minutes: number): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const iso = `${y}-${String(m || 1).padStart(2, "0")}-${String(d || 1).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`;
  return new Date(iso);
}

export function parseSlot(apt: Appointment): Date | null {
  if (apt.timeSlot) {
    const parsed = new Date(apt.timeSlot);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (!apt.date) return null;
  const { hours, minutes } = parseClock(apt.time || "09:00 AM");
  return colomboWallTime(apt.date, hours, minutes);
}

export function compareAppointmentTime(a: Appointment, b: Appointment): number {
  const da = parseSlot(a)?.getTime() ?? 0;
  const db = parseSlot(b)?.getTime() ?? 0;
  return da - db;
}

/** Lobby / doctor queue order: reception place first, then booked time. */
export function compareLobbyPlace(a: Appointment, b: Appointment): number {
  const aHas = typeof a.queuePlace === "number";
  const bHas = typeof b.queuePlace === "number";
  if (aHas && bHas && a.queuePlace !== b.queuePlace) {
    return (a.queuePlace as number) - (b.queuePlace as number);
  }
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  return compareAppointmentTime(a, b);
}

export async function persistLobbyQueuePlaces(
  places: Array<{ id: string; queuePlace: number }>,
  firestoreIds: Iterable<string>
): Promise<void> {
  if (!isFirebaseConfigured() || places.length === 0) return;
  const allowed = new Set(firestoreIds);
  const db = getFirebaseDb();
  await Promise.all(
    places
      .filter((p) => allowed.has(p.id))
      .map(({ id, queuePlace }) =>
        updateDoc(doc(db, "appointments", id), { queuePlace }).catch(() => undefined)
      )
  );
}

function mapStatus(raw: unknown): Appointment["status"] {
  const s = String(raw || "").toLowerCase();
  if (s === "checked in") return "CHECKED IN";
  if (s === "in exam room") return "IN EXAM ROOM";
  if (s === "completed") return "COMPLETED";
  if (s === "cancelled" || s === "canceled") return "CANCELLED";
  return "SCHEDULED";
}

function isVideoConsult(data: Record<string, unknown>): boolean {
  const mode = String(data.consultMode || "").toLowerCase();
  const type = String(data.type || "").toLowerCase();
  return (
    data.isTelehealth === true ||
    mode === "video" ||
    mode.includes("tele") ||
    type.includes("telehealth") ||
    type.includes("video")
  );
}

export function mapFirestoreAppointment(
  id: string,
  data: Record<string, unknown>
): Appointment {
  const video = isVideoConsult(data);
  const specialty = String(data.specialty || "");
  let date = String(data.date || "");
  let time = String(data.time || "");
  const timeSlotRaw = data.timeSlot ? String(data.timeSlot) : "";
  if ((!date || !time) && timeSlotRaw) {
    const slot = new Date(timeSlotRaw);
    if (!Number.isNaN(slot.getTime())) {
      if (!date) {
        const y = slot.getFullYear();
        const m = String(slot.getMonth() + 1).padStart(2, "0");
        const d = String(slot.getDate()).padStart(2, "0");
        date = `${y}-${m}-${d}`;
      }
      if (!time) {
        time = slot.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }
  }
  return {
    id,
    patientId: String(data.patientId || ""),
    time,
    reason:
      String(data.reason || "") ||
      (video ? `Video consultation · ${specialty}` : `Clinic visit · ${specialty}`),
    status: mapStatus(data.status),
    date,
    type: video ? "Telehealth Video" : (data.type as Appointment["type"]) || "Standard GP Consult",
    doctorName: String(data.doctorName || ""),
    isTelehealth: video,
    feeAmount: typeof data.feeAmount === "number" ? data.feeAmount : undefined,
    medicareClaimStatus: "PRIVATE_PAID",
    source: data.source === "gp_care" ? "gp_care" : "suwasiri_app",
    hospitalId: String(data.hospitalId || HOSPITAL_PRIMECARE),
    branchId: String(data.branchId || BRANCH_COLOMBO),
    specialty,
    token: data.token ? String(data.token) : undefined,
    consultMode: video ? "video" : "clinic",
    patientName: String(data.patientName || ""),
    patientPhone: String(data.patientPhone || ""),
    patientEmail: String(data.patientEmail || ""),
    clinicName: String(data.clinicName || data.hospital || ""),
    timeSlot: timeSlotRaw || undefined,
    paymentMethod: data.paymentMethod ? String(data.paymentMethod) : undefined,
    paymentStatus: data.paymentStatus ? String(data.paymentStatus) : undefined,
    paidBySuwasiri: data.paidBySuwasiri === true,
    suwasiriReceiptUrl: data.suwasiriReceiptUrl ? String(data.suwasiriReceiptUrl) : undefined,
    queuePlace: typeof data.queuePlace === "number" ? data.queuePlace : undefined,
  };
}

export function appointmentPatientName(apt: Appointment, patient?: Patient | null): string {
  const fromApt = (apt.patientName || "").trim();
  if (fromApt && fromApt.toLowerCase() !== "suwasiri patient") return fromApt;
  const fromPat = (patient?.name || "").trim();
  if (fromPat && fromPat.toLowerCase() !== "suwasiri patient") return fromPat;
  const email = (apt.patientEmail || patient?.email || "").split("@")[0].trim();
  if (email) {
    return email
      .replace(/[._]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return "Patient";
}

/** Keep the Suwasiri booking name on the clinic file (e.g. Chamidu Kaushal Rathnayake). */
export function overlayBookingIdentity(apt: Appointment, patient: Patient): Patient {
  const displayName = appointmentPatientName(apt, patient);
  return {
    ...patient,
    name: displayName,
    phone: patient.phone || apt.patientPhone || "",
    email: patient.email || apt.patientEmail || "",
    medicalCenter: patient.medicalCenter || apt.clinicName,
  };
}

export function stubPatientFromBooking(apt: Appointment): Patient {
  return {
    id: apt.patientId,
    name: appointmentPatientName(apt),
    age: 0,
    gender: "Unknown",
    bloodType: "—",
    allergies: "NKDA",
    phone: apt.patientPhone || "",
    email: apt.patientEmail || "",
    image: "",
    notes: [
      `Booked via Suwasiri App`,
      apt.clinicName ? `Clinic: ${apt.clinicName}` : "",
      apt.token ? `Token ${apt.token}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    history: [],
    activeMedications: [],
    medicalHistory: [],
    vaccineRecords: [],
    labResults: [],
    prescriptionsList: [],
    hospitalId: apt.hospitalId || HOSPITAL_PRIMECARE,
    branchId: apt.branchId || BRANCH_COLOMBO,
    medicalCenter: apt.clinicName,
    preferredGp: apt.doctorName,
    suwasiriBarcode: apt.patientId,
  };
}

export function mergePatients(clinic: Patient[], mobile: Patient[]): Patient[] {
  const byId = new Map<string, Patient>();
  for (const p of clinic) byId.set(p.id, p);
  for (const p of mobile) {
    const existing = byId.get(p.id);
    if (!existing) {
      byId.set(p.id, p);
      continue;
    }
    const name = (p.name || "").trim();
    if (name && name.toLowerCase() !== "suwasiri patient") {
      byId.set(p.id, {
        ...existing,
        name,
        phone: p.phone || existing.phone,
        email: p.email || existing.email,
      });
    }
  }
  return [...byId.values()];
}

export function mergeAppointments(clinic: Appointment[], mobile: Appointment[]): Appointment[] {
  const ids = new Set(mobile.map((a) => a.id));
  return [...mobile, ...clinic.filter((a) => !ids.has(a.id))];
}

export function isVideoBooking(apt: Appointment): boolean {
  const mode = String(apt.consultMode || "").toLowerCase();
  return Boolean(
    apt.isTelehealth ||
    apt.type === "Telehealth Video" ||
    mode === "video" ||
    mode.includes("tele")
  );
}

/** Doctor may press Call start from 2 minutes before the slot (e.g. 9:30 → 9:28), not earlier. */
export const TELEHEALTH_CALL_LEAD_MS = 2 * 60 * 1000;
const TELEHEALTH_CALL_CLOSE_MS = 3 * 60 * 60 * 1000;

export function isVideoBookingOnDate(apt: Appointment, dateKey: string): boolean {
  if (!isVideoBooking(apt)) return false;
  if (apt.status === "COMPLETED" || apt.status === "CANCELLED") return false;
  return apt.date === dateKey;
}

export function telehealthCallOpensAt(apt: Appointment): Date | null {
  const start = parseSlot(apt);
  if (!start) return null;
  return new Date(start.getTime() - TELEHEALTH_CALL_LEAD_MS);
}

/** True only inside [slot − 2 minutes, slot + 3 hours]. */
export function canStartTelehealthCall(apt: Appointment, now = new Date()): boolean {
  if (!isVideoBooking(apt)) return false;
  if (apt.status === "COMPLETED" || apt.status === "CANCELLED") return false;
  const start = parseSlot(apt);
  if (!start) return false;
  const open = start.getTime() - TELEHEALTH_CALL_LEAD_MS;
  const close = start.getTime() + TELEHEALTH_CALL_CLOSE_MS;
  const t = now.getTime();
  return t >= open && t <= close;
}

/** @deprecated Use canStartTelehealthCall — window is now 2 minutes before the slot. */
export function isDueTelehealth(apt: Appointment, now = new Date()): boolean {
  return canStartTelehealthCall(apt, now);
}

export function subscribeSuwasiriAppointments(
  onChange: (appointments: Appointment[], patients: Patient[]) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured()) return undefined;
  try {
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, "appointments"),
      (snap) => {
        const appointments = snap.docs.map((doc) =>
          mapFirestoreAppointment(doc.id, doc.data() as Record<string, unknown>)
        );
        const patients = appointments
          .filter((a) => a.source === "suwasiri_app" && a.patientId)
          .map(stubPatientFromBooking);
        onChange(appointments, patients);
      },
      (err) => {
        console.warn("Suwasiri appointment sync:", err.message);
      }
    );
  } catch (err) {
    console.warn("Suwasiri appointment sync unavailable", err);
    return undefined;
  }
}

export async function updateSuwasiriAppointmentStatus(
  appointmentId: string,
  status: Appointment["status"]
): Promise<void> {
  if (!isFirebaseConfigured() || !appointmentId) return;
  const db = getFirebaseDb();
  await updateDoc(doc(db, "appointments", appointmentId), { status });
}

/** Map GP Care staff id / name → Suwasiri doctor catalog id (shared slot locks). */
export function suwasiriDoctorCatalogId(opts: {
  staffUserId?: string;
  doctorName?: string;
}): string {
  return suwasiriDoctorDocId({
    staffId: opts.staffUserId,
    doctorName: opts.doctorName,
  });
}

/** Accepts "10:00 AM", "03:00 PM", or 24-hour "15:00" / "09:00". */
export function parseClock(timeLabel: string): { hours: number; minutes: number } {
  const t = timeLabel.trim();
  const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toUpperCase() === "PM") hours += 12;
    return { hours, minutes: Number(ampm[2]) };
  }
  const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    return { hours: Number(h24[1]) % 24, minutes: Number(h24[2]) };
  }
  return { hours: 9, minutes: 0 };
}

export function formatAmPm(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function slotLockId(doctorId: string, dateKey: string, timeLabel: string): string {
  const { hours, minutes } = parseClock(timeLabel);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${doctorId}_${dateKey}_${hh}-${mm}`;
}

function timeSlotIso(dateKey: string, timeLabel: string): string {
  const { hours, minutes } = parseClock(timeLabel);
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hours, minutes, 0, 0).toISOString();
}

/**
 * Clinic books a slot into the same Firestore collections as Suwasiri App,
 * so mobile shows the time as Booked and cannot double-book.
 */
export async function bookGpCareSlotToFirestore(opts: {
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  date: string;
  time: string;
  reason: string;
  doctorId: string;
  doctorName: string;
  hospitalId?: string;
  branchId?: string;
  clinicName?: string;
  specialty?: string;
  consultMode?: "clinic" | "video";
  isTelehealth?: boolean;
}): Promise<{ ok: true; appointmentId: string } | { ok: false; reason: string }> {
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: "Firebase not configured" };
  }
  const video = opts.isTelehealth === true || opts.consultMode === "video";
  const { hours, minutes } = parseClock(opts.time);
  const timeAmPm = formatAmPm(hours, minutes);
  const db = getFirebaseDb();
  const lockId = slotLockId(opts.doctorId, opts.date, timeAmPm);
  const lockRef = doc(db, "appointment_slots", lockId);
  const existing = await getDoc(lockRef);
  if (existing.exists()) {
    return { ok: false, reason: "This doctor date/time is already booked" };
  }
  const appointmentId = `gp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const iso = timeSlotIso(opts.date, timeAmPm);
  const specialty = opts.specialty || "";
  await setDoc(lockRef, {
    doctorId: opts.doctorId,
    doctorName: opts.doctorName,
    timeSlot: iso,
    date: opts.date,
    time: timeAmPm,
    appointmentId,
    patientId: opts.patientId,
    patientName: opts.patientName,
    source: "gp_care",
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(db, "appointments", appointmentId), {
    patientId: opts.patientId,
    patientName: opts.patientName,
    patientEmail: opts.patientEmail || "",
    patientPhone: opts.patientPhone || "",
    doctorId: opts.doctorId,
    doctorName: opts.doctorName,
    specialty,
    timeSlot: iso,
    date: opts.date,
    time: timeAmPm,
    reason: opts.reason,
    type: video ? "Telehealth Video" : "Standard GP Consult",
    isTelehealth: video,
    status: "upcoming",
    consultMode: video ? "video" : "clinic",
    hospital: opts.clinicName || "PrimeCare Medical Centre - Colombo Central",
    clinicName: opts.clinicName || "PrimeCare Medical Centre - Colombo Central",
    hospitalId: opts.hospitalId || HOSPITAL_PRIMECARE,
    branchId: opts.branchId || BRANCH_COLOMBO,
    source: "gp_care",
    token: `TKN-${Date.now() % 10000}`,
    paymentStatus: "PENDING",
    bookedAt: new Date().toISOString(),
  });
  return { ok: true, appointmentId };
}

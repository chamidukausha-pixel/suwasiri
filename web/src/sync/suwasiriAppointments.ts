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
import type { Appointment, Patient, StaffProvider } from "../types";
import { suwasiriDoctorDocId } from "./suwasiriClinicDoctors";
import { isPlaceholderPatientName, pickRealPatientName } from "./suwasiriHealthId";

/** Sri Lanka has no DST; clinic wall-clock is always UTC+05:30. */
function colomboWallTime(dateKey: string, hours: number, minutes: number): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const iso = `${y}-${String(m || 1).padStart(2, "0")}-${String(d || 1).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`;
  return new Date(iso);
}

function colomboDateKeyFromInstant(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function colomboClockFromInstant(value: Date): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const hours = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minutes = Number(parts.find((p) => p.type === "minute")?.value || "0");
  return { hours, minutes };
}

/** YYYY-MM-DD clinic date, even when Firestore stored an ISO datetime. */
export function appointmentDateKey(apt: { date?: string; timeSlot?: string }): string {
  const raw = String(apt.date || "").trim();
  const ymd = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymd) return ymd[1];
  if (apt.timeSlot) {
    const parsed = new Date(apt.timeSlot);
    if (!Number.isNaN(parsed.getTime())) return colomboDateKeyFromInstant(parsed);
  }
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return colomboDateKeyFromInstant(parsed);
  }
  return raw;
}

export function parseClockStrict(timeLabel: string): { hours: number; minutes: number } | null {
  const t = (timeLabel || "").trim().replace(/\./g, ":").replace(/\s+/g, " ");
  const ampm = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toUpperCase() === "PM") hours += 12;
    return { hours, minutes: Number(ampm[2]) };
  }
  const glued = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(AM|PM)$/i);
  if (glued) {
    let hours = Number(glued[1]) % 12;
    if (glued[3].toUpperCase() === "PM") hours += 12;
    return { hours, minutes: Number(glued[2]) };
  }
  const h24 = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24) return { hours: Number(h24[1]) % 24, minutes: Number(h24[2]) };
  return null;
}

export function appointmentClock(apt: { time?: string; timeSlot?: string }): { hours: number; minutes: number } | null {
  const fromLabel = parseClockStrict(apt.time || "");
  if (fromLabel) return fromLabel;
  if (apt.timeSlot) {
    const parsed = new Date(apt.timeSlot);
    if (!Number.isNaN(parsed.getTime())) return colomboClockFromInstant(parsed);
  }
  return null;
}

export function formatTime24(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseSlot(apt: Appointment): Date | null {
  const dateKey = appointmentDateKey(apt);
  const clock = appointmentClock(apt);
  if (dateKey && clock) return colomboWallTime(dateKey, clock.hours, clock.minutes);
  if (apt.timeSlot) {
    const parsed = new Date(apt.timeSlot);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
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
  const timeSlotRaw = data.timeSlot ? String(data.timeSlot) : "";
  const provisional = {
    date: String(data.date || ""),
    time: String(data.time || ""),
    timeSlot: timeSlotRaw || undefined,
  };
  const date = appointmentDateKey(provisional);
  const clock = appointmentClock(provisional);
  const time = clock ? formatAmPm(clock.hours, clock.minutes) : String(data.time || "");
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
    doctorId: data.doctorId ? String(data.doctorId) : undefined,
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
    receiptApproved:
      data.receiptApproved === true ? true : data.receiptApproved === false ? false : undefined,
    patientAge: typeof data.patientAge === "number" ? data.patientAge : Number(data.patientAge) || undefined,
    patientGender: data.patientGender ? String(data.patientGender) : undefined,
    queuePlace: typeof data.queuePlace === "number" ? data.queuePlace : undefined,
  };
}

export function appointmentPatientName(apt: Appointment, patient?: Patient | null): string {
  const email = (apt.patientEmail || patient?.email || "").split("@")[0].trim();
  const fromEmail =
    email && !email.includes("phone.suwasiri")
      ? email
          .replace(/[._]+/g, " ")
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "";
  return pickRealPatientName(apt.patientName, patient?.name, fromEmail);
}

/** Keep the Suwasiri booking name on the clinic file (e.g. Chamidu Kaushal Rathnayake). */
export function overlayBookingIdentity(apt: Appointment, patient: Patient): Patient {
  const displayName = appointmentPatientName(apt, patient);
  const fileGender = (patient.gender || "").trim();
  const genderOk = Boolean(fileGender) && !/^(unknown|not recorded)$/i.test(fileGender);
  return {
    ...patient,
    name: displayName,
    phone: patient.phone || apt.patientPhone || "",
    email: patient.email || apt.patientEmail || "",
    medicalCenter: patient.medicalCenter || apt.clinicName,
    age: patient.age > 0 ? patient.age : (apt.patientAge && apt.patientAge > 0 ? apt.patientAge : patient.age),
    gender: genderOk ? patient.gender : (apt.patientGender || patient.gender),
  };
}

export function stubPatientFromBooking(apt: Appointment): Patient {
  return {
    id: apt.patientId,
    name: appointmentPatientName(apt),
    age: apt.patientAge && apt.patientAge > 0 ? apt.patientAge : 0,
    gender: apt.patientGender || "Unknown",
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
    const name = pickRealPatientName(existing.name, p.name) || existing.name || p.name;
    byId.set(p.id, {
      ...existing,
      name,
      phone: existing.phone || p.phone,
      email: existing.email || p.email,
      age: existing.age > 0 ? existing.age : p.age,
      gender:
        existing.gender && !/^(unknown|not recorded)$/i.test(existing.gender)
          ? existing.gender
          : p.gender || existing.gender,
    });
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
  return appointmentDateKey(apt) === dateKey;
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
    let fromAppointments: Appointment[] = [];
    let fromLocks: Appointment[] = [];
    const emit = () => {
      const byId = new Map<string, Appointment>();
      for (const a of fromLocks) byId.set(a.id, a);
      for (const a of fromAppointments) byId.set(a.id, a);
      const appointments = [...byId.values()];
      const patients = appointments
        .filter((a) => a.source === "suwasiri_app" && a.patientId)
        .map(stubPatientFromBooking);
      onChange(appointments, patients);
    };
    const unsubAppt = onSnapshot(
      collection(db, "appointments"),
      (snap) => {
        fromAppointments = snap.docs.map((row) =>
          mapFirestoreAppointment(row.id, row.data() as Record<string, unknown>)
        );
        emit();
      },
      (err) => {
        console.warn("Suwasiri appointment sync:", err.message);
      }
    );
    const unsubLocks = onSnapshot(
      collection(db, "appointment_slots"),
      (snap) => {
        fromLocks = snap.docs.map((row) => {
          const data = row.data() as Record<string, unknown>;
          return mapFirestoreAppointment(String(data.appointmentId || row.id), {
            ...data,
            status: data.status || "upcoming",
            source: data.source || "suwasiri_app",
            reason: data.reason || "Booked",
          });
        });
        emit();
      },
      (err) => {
        console.warn("Suwasiri slot lock sync:", err.message);
      }
    );
    return () => {
      unsubAppt();
      unsubLocks();
    };
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

export async function updateSuwasiriAppointmentPayment(
  appointmentId: string,
  patch: {
    paymentStatus: string;
    paymentMethod?: string;
    paidBySuwasiri?: boolean;
    suwasiriReceiptUrl?: string;
    receiptApproved?: boolean;
  }
): Promise<void> {
  if (!isFirebaseConfigured() || !appointmentId) return;
  const db = getFirebaseDb();
  await updateDoc(doc(db, "appointments", appointmentId), {
    paymentStatus: patch.paymentStatus,
    ...(patch.paymentMethod ? { paymentMethod: patch.paymentMethod } : {}),
    ...(patch.paidBySuwasiri !== undefined ? { paidBySuwasiri: patch.paidBySuwasiri } : {}),
    ...(patch.suwasiriReceiptUrl ? { suwasiriReceiptUrl: patch.suwasiriReceiptUrl } : {}),
    ...(patch.receiptApproved !== undefined ? { receiptApproved: patch.receiptApproved } : {}),
  });
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

export function normalizeDoctorName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/^dr\.?\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** First + last token so "Chamidu Rathnayake" ≡ "Chamidu Kaushal Rathnayake". */
export function doctorPersonKey(name: string): string {
  const parts = normalizeDoctorName(name).split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  return `${parts[0]}|${parts[parts.length - 1]}`;
}

export function matchSessionDoctor(
  doctors: StaffProvider[],
  session?: { id?: string; name?: string; email?: string } | null
): StaffProvider | undefined {
  if (!session) return undefined;
  const byId = doctors.find((d) => d.userId === session.id || d.id === session.id);
  if (byId) return byId;
  if (session.email) {
    const email = session.email.toLowerCase();
    const byEmail = doctors.find((d) => (d.email || "").toLowerCase() === email);
    if (byEmail) return byEmail;
  }
  const n = normalizeDoctorName(session.name || "");
  if (!n) return undefined;
  return doctors.find((d) => normalizeDoctorName(d.name) === n);
}

const OPEN_ROSTER: StaffProvider["roster"] = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
};

/** Use when the signed-in clinician is not in the published clinic-doctor list. */
export function staffUserAsDoctor(
  session: { id?: string; name?: string; email?: string } | null | undefined,
  hospitalId: string
): StaffProvider | undefined {
  if (!session?.id && !session?.name) return undefined;
  const name = (session.name || "").trim();
  if (!name) return undefined;
  return {
    id: session.id || `doc-${normalizeDoctorName(name).replace(/\s+/g, "-")}`,
    userId: session.id,
    hospitalId,
    name,
    role: "Doctor",
    specialty: "General Practice",
    providerNumber: "",
    email: session.email || "",
    phone: "",
    assignedRoom: "",
    roster: OPEN_ROSTER,
    active: true,
  };
}

function looksLikeSuwasiriUid(id: string): boolean {
  return id.length >= 16 && !/^\d{3,5}-LK$/i.test(id) && !id.startsWith("apt-") && !id.startsWith("p-");
}

/** Firestore `appointments.patientId` must be the Suwasiri uid so Home/Call show the booking. */
export function suwasiriPatientIdForClinicFile(
  patient: Patient | undefined,
  extras: Patient[] = []
): string {
  if (!patient?.id) return "";
  if (looksLikeSuwasiriUid(patient.id)) return patient.id;
  const pool = extras.filter((p) => p.id !== patient.id && looksLikeSuwasiriUid(p.id));
  const barcode = (patient.suwasiriBarcode || "").trim().toUpperCase();
  if (barcode) {
    const hit = pool.find((p) => (p.suwasiriBarcode || "").trim().toUpperCase() === barcode);
    if (hit) return hit.id;
  }
  return patient.id;
}

export function appointmentBelongsToPatient(apt: Appointment, patient: Patient): boolean {
  if (apt.patientId === patient.id) return true;
  const barcode = (patient.suwasiriBarcode || "").trim().toUpperCase();
  if (barcode && (apt.patientId || "").toUpperCase() === barcode) return true;
  return false;
}

/** Ids that all mean the same published clinician (catalog vs Platform Console slug). */
export function doctorIdentityIds(opts: { doctorName?: string; doctorStaffId?: string }): string[] {
  const ids = new Set<string>();
  if (opts.doctorStaffId) ids.add(opts.doctorStaffId);
  ids.add(
    suwasiriDoctorCatalogId({
      staffUserId: opts.doctorStaffId,
      doctorName: opts.doctorName,
    })
  );
  const n = normalizeDoctorName(opts.doctorName || "");
  if (n.includes("chamidu") && (n.includes("rathnayake") || n.includes("kaushal"))) {
    ids.add("d-chamidu-rathnayake");
    ids.add("d-chamidu-kaushal-rathnayake");
  }
  return [...ids].filter(Boolean);
}

/** True when an appointment belongs to the selected clinic doctor. */
export function isSameDoctor(opts: {
  doctorName: string;
  doctorStaffId?: string;
  appointment: Appointment;
}): boolean {
  const apt = opts.appointment;
  const selectedIds = new Set(doctorIdentityIds({ doctorName: opts.doctorName, doctorStaffId: opts.doctorStaffId }));
  const aptIds = doctorIdentityIds({
    doctorName: apt.doctorName,
    doctorStaffId: apt.doctorId,
  });
  if (aptIds.some((id) => selectedIds.has(id))) return true;

  const na = normalizeDoctorName(opts.doctorName);
  const nb = normalizeDoctorName(apt.doctorName || "");
  if (na && nb && na === nb) return true;
  const ta = na.split(" ").filter(Boolean);
  const tb = nb.split(" ").filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta[ta.length - 1] !== tb[tb.length - 1]) return false;
  const firstA = new Set(ta.slice(0, -1));
  const firstB = tb.slice(0, -1);
  if (firstA.size === 0 || firstB.length === 0) return true;
  return firstB.some((t) => firstA.has(t));
}

export function isActiveBooking(apt: Appointment): boolean {
  return apt.status !== "CANCELLED" && apt.status !== "COMPLETED";
}

export function bookingOnSlot(
  appointments: Appointment[],
  opts: { doctorName: string; doctorStaffId?: string; dateKey: string; time: string }
): Appointment | undefined {
  const wanted = parseClockStrict(opts.time) || parseClock(opts.time);
  return appointments.find((a) => {
    if (!isActiveBooking(a) || appointmentDateKey(a) !== opts.dateKey) return false;
    if (!isSameDoctor({ doctorName: opts.doctorName, doctorStaffId: opts.doctorStaffId, appointment: a })) {
      return false;
    }
    const t = appointmentClock(a);
    if (!t) return false;
    return t.hours === wanted.hours && t.minutes === wanted.minutes;
  });
}

export function bookingsForDoctorOnDate(
  appointments: Appointment[],
  opts: { doctorName: string; doctorStaffId?: string; dateKey: string }
): Appointment[] {
  return appointments
    .filter(
      (a) =>
        isActiveBooking(a) &&
        appointmentDateKey(a) === opts.dateKey &&
        isSameDoctor({
          doctorName: opts.doctorName,
          doctorStaffId: opts.doctorStaffId,
          appointment: a,
        })
    )
    .slice()
    .sort(compareAppointmentTime);
}

/** Accepts "10:00 AM", "03:00 PM", or 24-hour "15:00" / "09:00". */
export function parseClock(timeLabel: string): { hours: number; minutes: number } {
  return parseClockStrict(timeLabel) || { hours: 9, minutes: 0 };
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

function slotLockIdsForDoctor(opts: {
  doctorId: string;
  doctorName: string;
  dateKey: string;
  timeLabel: string;
}): string[] {
  return doctorIdentityIds({
    doctorStaffId: opts.doctorId,
    doctorName: opts.doctorName,
  }).map((id) => slotLockId(id, opts.dateKey, opts.timeLabel));
}

function timeSlotIso(dateKey: string, timeLabel: string): string {
  const { hours, minutes } = parseClock(timeLabel);
  const [y, m, d] = dateKey.split("-").map(Number);
  return `${y}-${String(m || 1).padStart(2, "0")}-${String(d || 1).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`;
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
  patientAge?: number;
  patientGender?: string;
}): Promise<{ ok: true; appointmentId: string } | { ok: false; reason: string }> {
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: "Firebase not configured" };
  }
  const video = opts.isTelehealth === true || opts.consultMode === "video";
  const { hours, minutes } = parseClock(opts.time);
  const timeAmPm = formatAmPm(hours, minutes);
  const db = getFirebaseDb();
  const canonicalDoctorId = suwasiriDoctorCatalogId({
    staffUserId: opts.doctorId,
    doctorName: opts.doctorName,
  });
  const lockIds = slotLockIdsForDoctor({
    doctorId: opts.doctorId,
    doctorName: opts.doctorName,
    dateKey: opts.date,
    timeLabel: timeAmPm,
  });
  for (const id of lockIds) {
    const existing = await getDoc(doc(db, "appointment_slots", id));
    if (existing.exists()) {
      return { ok: false, reason: "This doctor date/time is already booked" };
    }
  }
  const lockId = slotLockId(canonicalDoctorId, opts.date, timeAmPm);
  const lockRef = doc(db, "appointment_slots", lockId);
  const appointmentId = `gp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const iso = timeSlotIso(opts.date, timeAmPm);
  const specialty = opts.specialty || "";
  await setDoc(lockRef, {
    doctorId: canonicalDoctorId,
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
    doctorId: canonicalDoctorId,
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
    patientAge: opts.patientAge,
    patientGender: opts.patientGender || "",
    bookedAt: new Date().toISOString(),
  });
  return { ok: true, appointmentId };
}

import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import { HOSPITAL_PRIMECARE, BRANCH_COLOMBO } from "../tenancy";
import type { Appointment, Patient } from "../types";

export function parseSlot(apt: Appointment): Date | null {
  if (apt.timeSlot) {
    const parsed = new Date(apt.timeSlot);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (!apt.date) return null;
  const match = (apt.time || "09:00 AM").trim().match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );
  let hours = 9;
  let minutes = 0;
  if (match) {
    hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    minutes = Number(match[2]);
  }
  const [y, m, d] = apt.date.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hours, minutes, 0, 0);
}

export function compareAppointmentTime(a: Appointment, b: Appointment): number {
  const da = parseSlot(a)?.getTime() ?? 0;
  const db = parseSlot(b)?.getTime() ?? 0;
  return da - db;
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
    source: "suwasiri_app",
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
  };
}

export function stubPatientFromBooking(apt: Appointment): Patient {
  return {
    id: apt.patientId,
    name: apt.patientName || "Suwasiri patient",
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
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return [...byId.values()];
}

export function mergeAppointments(clinic: Appointment[], mobile: Appointment[]): Appointment[] {
  const ids = new Set(mobile.map((a) => a.id));
  return [...mobile, ...clinic.filter((a) => !ids.has(a.id))];
}

/** Video consult is listed in the telehealth room from slot time until the call starts (or 3h). */
export function isDueTelehealth(apt: Appointment, now = new Date()): boolean {
  if (!apt.isTelehealth && apt.type !== "Telehealth Video") return false;
  if (apt.status === "COMPLETED" || apt.status === "CANCELLED") return false;
  const start = parseSlot(apt);
  if (!start) return false;
  const close = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return now.getTime() >= start.getTime() && now.getTime() <= close.getTime();
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

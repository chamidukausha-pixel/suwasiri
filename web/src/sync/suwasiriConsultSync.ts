import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

export interface ConsultNoteRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  clinicName: string;
  title: string;
  body: string;
  date: string;
  appointmentId?: string;
  source: string;
}

export interface TelehealthChatMessage {
  id: string;
  sender: "doctor" | "patient" | "system";
  senderName: string;
  text: string;
  at: number;
}

export async function saveConsultationNote(opts: {
  patientId: string;
  patientName: string;
  doctor: string;
  clinicName?: string;
  body: string;
  appointmentId?: string;
  title?: string;
}): Promise<void> {
  if (!isFirebaseConfigured() || !opts.patientId || !opts.body.trim()) return;
  await addDoc(collection(getFirebaseDb(), "consultation_notes"), {
    patientId: opts.patientId,
    patientName: opts.patientName,
    doctor: opts.doctor,
    clinicName: opts.clinicName || "Sri Lankan GP Care",
    title: opts.title?.trim() || "Live consultation notes",
    body: opts.body.trim(),
    date: new Date().toISOString(),
    appointmentId: opts.appointmentId || "",
    source: "gp_care",
  });
}

export function subscribeConsultationNotes(
  patientId: string,
  onChange: (notes: ConsultNoteRecord[]) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured() || !patientId) return undefined;
  try {
    return onSnapshot(
      query(
        collection(getFirebaseDb(), "consultation_notes"),
        where("patientId", "==", patientId)
      ),
      (snap) => {
        const notes = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              patientId: String(data.patientId || ""),
              patientName: String(data.patientName || ""),
              doctor: String(data.doctor || ""),
              clinicName: String(data.clinicName || ""),
              title: String(data.title || "Consultation notes"),
              body: String(data.body || ""),
              date: String(data.date || ""),
              appointmentId: data.appointmentId ? String(data.appointmentId) : undefined,
              source: String(data.source || "gp_care"),
            } satisfies ConsultNoteRecord;
          })
          .sort((a, b) => b.date.localeCompare(a.date));
        onChange(notes);
      }
    );
  } catch {
    return undefined;
  }
}

export async function sendTelehealthChatMessage(opts: {
  appointmentId: string;
  sender: "doctor" | "patient";
  senderName: string;
  text: string;
}): Promise<void> {
  if (!isFirebaseConfigured() || !opts.appointmentId || !opts.text.trim()) return;
  await addDoc(
    collection(getFirebaseDb(), "telehealth_sessions", opts.appointmentId, "messages"),
    {
      sender: opts.sender,
      senderName: opts.senderName,
      text: opts.text.trim(),
      at: Date.now(),
    }
  );
}

export function subscribeTelehealthChat(
  appointmentId: string,
  onChange: (messages: TelehealthChatMessage[]) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured() || !appointmentId) return undefined;
  try {
    return onSnapshot(
      collection(getFirebaseDb(), "telehealth_sessions", appointmentId, "messages"),
      (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            sender: (data.sender as TelehealthChatMessage["sender"]) || "system",
            senderName: String(data.senderName || data.sender || ""),
            text: String(data.text || ""),
            at: typeof data.at === "number" ? data.at : Date.now(),
          };
        });
        msgs.sort((a, b) => a.at - b.at);
        onChange(msgs);
      }
    );
  } catch {
    return undefined;
  }
}

import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

/** Writes a notification the named Suwasiri patient sees in the app tray. */
export async function pushSuwasiriNotification(opts: {
  patientId: string;
  title: string;
  body: string;
  type?: "appointment" | "system" | "labResult" | "vaccine" | "sync" | "dose";
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const patientId = (opts.patientId || "").trim();
  if (!patientId || !opts.title.trim()) return false;
  const id = `gpcare-n-${patientId}-${Date.now()}`;
  await setDoc(doc(collection(getFirebaseDb(), "notifications"), id), {
    patientId,
    userId: patientId,
    title: opts.title.trim(),
    body: (opts.body || "").trim(),
    type: opts.type || "system",
    timestamp: new Date().toISOString(),
    read: false,
    source: "gp_care",
  });
  return true;
}

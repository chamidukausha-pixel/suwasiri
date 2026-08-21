import {
  collection,
  doc,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

export interface SuwasiriMedicineLine {
  name: string;
  instructions?: string;
  duration?: string;
}

/** Parse "Amoxicillin 500mg Capsule [1 capsule TDS, for 5 days, After Meal]". */
export function parseMedicineLine(raw: string): SuwasiriMedicineLine {
  const text = raw.trim();
  const match = text.match(/^(.*?)\s*\[(.*)\]\s*$/);
  if (!match) return { name: text };
  const inside = match[2].split(",").map((s) => s.trim()).filter(Boolean);
  return {
    name: match[1].trim() || text,
    instructions: inside[0] || "",
    duration: inside.slice(1).join(", "),
  };
}

export async function issuePrescriptionsToSuwasiri(opts: {
  patientId: string;
  doctorName: string;
  clinicName: string;
  medicines: Array<string | SuwasiriMedicineLine>;
  sessionId?: string;
  rxNumber?: string;
  prescriberNumber?: string;
}): Promise<{ count: number; code: string } | null> {
  if (!isFirebaseConfigured()) return null;
  const patientId = (opts.patientId || "").trim();
  if (!patientId) return null;
  const lines = opts.medicines
    .map((m) => (typeof m === "string" ? parseMedicineLine(m) : m))
    .filter((m) => m.name.trim());
  if (lines.length === 0) return null;

  const db = getFirebaseDb();
  const code =
    opts.rxNumber ||
    `EP-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const issuedAt = new Date().toISOString();
  const doctor = opts.doctorName.trim() || "Dr. Priyantha Silva";
  const clinic = opts.clinicName.trim() || "PrimeCare Medical Centre - Colombo Central";
  const sessionId = opts.sessionId || `gp-care-${Date.now()}`;
  const prescriberNumber = opts.prescriberNumber || "12908";

  await Promise.all(
    lines.map(async (line, index) => {
      const id = `gpcare-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`;
      await setDoc(doc(collection(db, "prescriptions"), id), {
        patientId,
        medicine: line.name,
        doctor,
        code,
        active: true,
        schedule: line.instructions || "",
        doseBadge: line.duration || "1",
        sessionId,
        sentToPharmacare: false,
        updating: false,
        issuedAt,
        clinicName: clinic,
        prescriberNumber,
        source: "gp_care",
      });
    })
  );

  return { count: lines.length, code };
}

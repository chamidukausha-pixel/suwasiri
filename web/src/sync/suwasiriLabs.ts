import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { LabResult } from "../types";

/** Writes a reviewed GP Care pathology report into Suwasiri Vault (Lab reports). */
export async function issueLabReportToSuwasiri(opts: {
  patientId: string;
  doctorName: string;
  clinicName?: string;
  lab: LabResult;
  comment?: string;
  critical?: boolean;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const patientId = (opts.patientId || "").trim();
  if (!patientId || !opts.lab) return false;

  const lab = opts.lab;
  const critical = Boolean(opts.critical || lab.criticalAlert || lab.status === "CRITICAL");
  const abnormal = Boolean(lab.abnormalFlag || lab.status === "ABNORMAL" || critical);
  const metricStatus = critical ? "critical" : abnormal ? "attention" : "normal";
  const comments = (opts.comment || lab.remarks || "").trim();
  const id = `gpcare-lab-${lab.id || Date.now()}`;

  const db = getFirebaseDb();
  await setDoc(doc(collection(db, "vault"), id), {
    patientId,
    title: lab.testName,
    issuedBy: opts.doctorName.trim() || "Sri Lankan GP Care",
    date: lab.date ? new Date(lab.date).toISOString() : new Date().toISOString(),
    category: lab.category || "Pathology",
    facility: lab.labName || opts.clinicName || "Sri Lankan GP Care",
    requestedBy: opts.doctorName.trim() || "GP",
    kind: "lab",
    clinicalComments: comments,
    source: "gp_care",
    critical: critical,
    metrics: [
      {
        name: lab.testName,
        value: lab.result,
        status: metricStatus,
        normalRange: "",
      },
    ],
  });
  return true;
}

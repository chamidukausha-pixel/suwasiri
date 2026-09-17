import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

export type ClinicCriticalAlert = {
  id: string;
  patientId: string;
  patientName: string;
  testType?: string;
  specimenId?: string;
  suwasiriBarcode?: string;
  source?: string;
  updatedAt?: string;
};

function normalizeAlert(id: string, raw: Record<string, unknown>): ClinicCriticalAlert | null {
  const patientId = String(raw.patientId || "").trim();
  const patientName = String(raw.patientName || "").trim();
  if (!patientId && !patientName) return null;
  return {
    id,
    patientId,
    patientName,
    testType: String(raw.testType || ""),
    specimenId: String(raw.specimenId || ""),
    suwasiriBarcode: String(raw.suwasiriBarcode || ""),
    source: String(raw.source || "lankalab"),
    updatedAt: String(raw.updatedAt || ""),
  };
}

/** Live LankaLab critical flags so an already-open GP Care session turns the chart red. */
export function subscribeClinicCriticalAlerts(
  onAlert: (alert: ClinicCriticalAlert) => void
): () => void {
  if (!isFirebaseConfigured()) return () => undefined;
  try {
    return onSnapshot(collection(getFirebaseDb(), "clinic_critical_alerts"), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added" && change.type !== "modified") return;
        const alert = normalizeAlert(change.doc.id, change.doc.data() as Record<string, unknown>);
        if (alert) onAlert(alert);
      });
    });
  } catch {
    return () => undefined;
  }
}

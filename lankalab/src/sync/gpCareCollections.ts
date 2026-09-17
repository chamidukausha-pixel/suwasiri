import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

export type ClinicCollectionLog = {
  id: string;
  clinicName: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  sampleCount: number;
  status: "PENDING" | "COLLECTED" | "DELIVERED";
  collectedAt: string;
  deliveredAt: string;
  labName?: string;
  labAddress?: string;
  issuedPersonName?: string;
  issuedDate?: string;
  dispatchNumber?: string;
  source?: string;
};

const GP_CARE_COLLECTIONS_URL =
  import.meta.env.VITE_GP_CARE_URL || "http://localhost:3000/api/lankalab-clinic-collections";

function normalizeCard(raw: any): ClinicCollectionLog | null {
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const status = raw.status === "DELIVERED" || raw.status === "COLLECTED" || raw.status === "PENDING"
    ? raw.status
    : "COLLECTED";
  return {
    id,
    clinicName: String(raw.clinicName || "GP Care Clinic"),
    driverName: String(raw.driverName || ""),
    driverPhone: String(raw.driverPhone || ""),
    vehicleNo: String(raw.vehicleNo || ""),
    sampleCount: Number(raw.sampleCount) || 1,
    status,
    collectedAt: String(raw.collectedAt || ""),
    deliveredAt: String(raw.deliveredAt || ""),
    labName: raw.labName || "",
    labAddress: raw.labAddress || "",
    issuedPersonName: raw.issuedPersonName || "",
    issuedDate: raw.issuedDate || "",
    dispatchNumber: raw.dispatchNumber || "",
    source: raw.source || "gp_care",
  };
}

async function fetchFromGpCare(): Promise<ClinicCollectionLog[]> {
  const res = await fetch(GP_CARE_COLLECTIONS_URL);
  if (!res.ok) throw new Error("GP Care collections unavailable");
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map(normalizeCard).filter(Boolean) as ClinicCollectionLog[];
}

/** Live GP Care Sample Dispatch bags for the Clinic Sample Collection Log. */
export function subscribeGpCareClinicCollections(
  onRows: (rows: ClinicCollectionLog[]) => void
): () => void {
  let stopped = false;
  const apply = (rows: ClinicCollectionLog[]) => {
    if (!stopped) onRows(rows);
  };

  const poll = () => {
    fetchFromGpCare().then(apply).catch(() => undefined);
  };
  poll();
  const timer = window.setInterval(poll, 4000);

  let unsubFs: (() => void) | undefined;
  if (isFirebaseConfigured()) {
    try {
      unsubFs = onSnapshot(collection(getFirebaseDb(), "clinic_sample_dispatches"), (snap) => {
        const rows = snap.docs.map((d) => normalizeCard({ id: d.id, ...d.data() })).filter(Boolean) as ClinicCollectionLog[];
        if (rows.length) apply(rows);
      });
    } catch {
      unsubFs = undefined;
    }
  }

  return () => {
    stopped = true;
    window.clearInterval(timer);
    unsubFs?.();
  };
}

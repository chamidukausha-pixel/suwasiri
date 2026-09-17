import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";

export type LankaLabCollectionCard = {
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
  hospitalId?: string;
  patientName?: string;
  source?: string;
};

/** Publishes a GP Care specimen bag onto Firestore for LankaLab Transit Logistics. */
export async function publishSampleDispatchToLankaLab(row: LankaLabCollectionCard): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const id = (row.id || "").trim();
  if (!id) return false;
  const db = getFirebaseDb();
  await setDoc(
    doc(collection(db, "clinic_sample_dispatches"), id),
    {
      ...row,
      sampleCount: Number(row.sampleCount) || 1,
      source: "gp_care",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return true;
}

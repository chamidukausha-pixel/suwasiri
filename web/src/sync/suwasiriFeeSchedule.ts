import { doc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { FeeScheduleItem } from "../types";

export async function publishFeeScheduleToSuwasiri(opts: {
  hospitalId?: string;
  hospitalName?: string;
  items: FeeScheduleItem[];
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  if (!getFirebaseAuth().currentUser) return false;
  const payload = {
    hospitalId: (opts.hospitalId || "").trim() || "global",
    hospitalName: opts.hospitalName || "",
    items: opts.items.map((item) => ({
      id: item.id,
      mbsItemNumber: item.mbsItemNumber || "",
      description: item.description || "",
      category: item.category || "",
      suwasiriService: item.suwasiriService || "",
      privateFee: Number(item.privateFee) || 0,
      mbsScheduleFee: Number(item.mbsScheduleFee) || 0,
    })),
    source: "gp_care",
    updatedAt: new Date().toISOString(),
  };
  const db = getFirebaseDb();
  const hospitalId = (opts.hospitalId || "").trim();
  if (hospitalId && hospitalId !== "global") {
    await setDoc(doc(db, "clinic_fee_schedules", hospitalId), payload);
  } else {
    await setDoc(doc(db, "clinic_fee_schedules", "global"), { ...payload, hospitalId: "global" });
  }
  return true;
}

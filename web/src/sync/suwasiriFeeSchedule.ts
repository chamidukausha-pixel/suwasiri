import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { FeeScheduleItem } from "../types";

export async function publishFeeScheduleToSuwasiri(opts: {
  hospitalId?: string;
  hospitalName?: string;
  items: FeeScheduleItem[];
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const hospitalId = (opts.hospitalId || "").trim() || "global";
  await setDoc(doc(getFirebaseDb(), "clinic_fee_schedules", hospitalId), {
    hospitalId,
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
  });
  return true;
}

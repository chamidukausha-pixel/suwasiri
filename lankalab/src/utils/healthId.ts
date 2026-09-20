import type { LabOrder } from "../types";

/** Stable Unique Suwasiri Health ID shown on the specimen line and used for Vault sync. */
export function uniqueHealthId(order: Pick<LabOrder, "suwasiriBarcode" | "phone" | "email" | "patientName" | "specimenId">): string {
  const existing = (order.suwasiriBarcode || "").trim();
  if (existing) return existing;
  const seed = `${order.phone || ""}|${order.email || ""}|${order.patientName || ""}|${order.specimenId || ""}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  const body = unsigned.toString(16).toUpperCase().padStart(8, "0");
  const check = String(unsigned % 97).padStart(2, "0");
  return `SW${body}${check}`;
}

export function patientNameTone(name: string) {
  const tones = [
    "text-sky-700",
    "text-emerald-700",
    "text-violet-700",
    "text-rose-700",
    "text-amber-700",
    "text-cyan-700",
    "text-indigo-700",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h += name.charCodeAt(i);
  return tones[h % tones.length];
}

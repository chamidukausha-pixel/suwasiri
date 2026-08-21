import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { Patient, VaccineRecord } from "../types";

export interface SuwasiriChartPatch {
  vaccineRecords: VaccineRecord[];
}

function formatChartDate(raw: unknown): string {
  const value = String(raw || "").trim();
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapVaccinations(
  docs: Array<{ id: string; data: Record<string, unknown> }>
): VaccineRecord[] {
  return docs
    .map((doc) => {
      const d = doc.data;
      const name =
        String(d.vaccineName || "").trim() ||
        String(d.name || "").trim() ||
        String(d.facilityName || "").trim() ||
        "Vaccination";
      return {
        vaccineName: name,
        date: formatChartDate(d.slot || d.date || d.bookedAt),
        dose: String(d.doseLabel || d.dose || "Booked dose"),
        batchNumber: String(d.batchNumber || d.ceylonHealthId || doc.id),
        status: String(d.status || "confirmed").replace(/_/g, " "),
        site: String(d.facilityName || d.facility || d.address || ""),
        providerNumber: String(d.issuer || d.facilityName || ""),
        airSyncStatus: "SYNCED_TO_AIR" as const,
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function applySuwasiriChart(
  patient: Patient,
  patch?: SuwasiriChartPatch | null
): Patient {
  if (!patch?.vaccineRecords.length) return patient;
  const byKey = new Map<string, VaccineRecord>();
  for (const record of patient.vaccineRecords || []) {
    byKey.set(`${record.vaccineName}|${record.date}`, record);
  }
  for (const record of patch.vaccineRecords) {
    byKey.set(`${record.vaccineName}|${record.date}`, { ...record, airSyncStatus: "SYNCED_TO_AIR" });
  }
  return {
    ...patient,
    vaccineRecords: [...byKey.values()],
  };
}

export function subscribeSuwasiriPatientChart(
  patientId: string,
  onChange: (patch: SuwasiriChartPatch) => void
): Unsubscribe | undefined {
  if (!isFirebaseConfigured() || !patientId) return undefined;
  const db = getFirebaseDb();

  return onSnapshot(
    query(collection(db, "vaccinations"), where("patientId", "==", patientId)),
    (snap) => {
      const vaxDocs = snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as Record<string, unknown>,
      }));
      onChange({ vaccineRecords: mapVaccinations(vaxDocs) });
    },
    (err) => console.warn("Suwasiri vaccination history:", err.message)
  );
}

export function subscribeSuwasiriPatientCharts(
  patientIds: string[],
  onChange: (patientId: string, patch: SuwasiriChartPatch) => void
): Unsubscribe | undefined {
  const ids = [...new Set(patientIds.filter(Boolean))];
  if (ids.length === 0) return undefined;
  const unsubs = ids
    .map((id) => subscribeSuwasiriPatientChart(id, (patch) => onChange(id, patch)))
    .filter((u): u is Unsubscribe => Boolean(u));
  return () => unsubs.forEach((u) => u());
}

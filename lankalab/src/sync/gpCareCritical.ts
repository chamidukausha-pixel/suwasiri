import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { LabOrder } from "../types";

export const GP_CARE_ORIGIN =
  import.meta.env.VITE_GP_CARE_ORIGIN || "http://localhost:3000";

export type CriticalFlagResult = {
  ok: boolean;
  patientId?: string;
  patientName?: string;
  profileUrl?: string;
  error?: string;
};

export async function publishCriticalAlertToFirestore(payload: Record<string, unknown>): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const id = String(payload.id || `ll-${Date.now()}`);
  const db = getFirebaseDb();
  await setDoc(
    doc(collection(db, "clinic_critical_alerts"), id),
    { ...payload, source: "lankalab", updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

/** Marks the matching GP Care chart critical and opens that patient profile. */
export async function flagCriticalToGpCare(order: LabOrder): Promise<CriticalFlagResult> {
  const body = {
    patientName: order.patientName,
    suwasiriBarcode: order.suwasiriBarcode,
    phone: order.phone,
    age: order.age,
    gender: order.gender,
    email: order.email,
    testType: order.testType,
    specimenId: order.specimenId,
    orderId: order.id,
    results: order.results,
    notes: order.notes,
    connectedClinic: order.connectedClinic,
  };

  const fallbackUrl = `${GP_CARE_ORIGIN}/?openPatientName=${encodeURIComponent(order.patientName)}&critical=1`;

  try {
    const res = await fetch(`${GP_CARE_ORIGIN}/api/lankalab-critical`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const patientId = String(data.patientId || "");
    const profileUrl = String(
      data.profileUrl ||
        (patientId
          ? `${GP_CARE_ORIGIN}/?openPatient=${encodeURIComponent(patientId)}&critical=1`
          : fallbackUrl)
    );

    window.open(profileUrl, "gp-care-patient");

    void publishCriticalAlertToFirestore({
      id: `ll-${order.specimenId || order.id}`,
      patientId,
      patientName: data.patientName || order.patientName,
      testType: order.testType,
      specimenId: order.specimenId,
      suwasiriBarcode: order.suwasiriBarcode || "",
      notes: order.notes || "",
    }).catch(() => undefined);

    if (!res.ok) {
      return {
        ok: false,
        patientId,
        profileUrl,
        error: String(data.error || `GP Care returned ${res.status}`),
      };
    }
    return {
      ok: true,
      patientId,
      patientName: String(data.patientName || order.patientName),
      profileUrl,
    };
  } catch (err: unknown) {
    window.open(fallbackUrl, "gp-care-patient");
    const message = err instanceof Error ? err.message : "GP Care is not reachable on port 3000.";
    return { ok: false, error: message, profileUrl: fallbackUrl };
  }
}

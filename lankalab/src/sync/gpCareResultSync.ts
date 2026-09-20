import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { LabOrder } from "../types";
import { splitInvestigations } from "../data/medicalTests";
import { uniqueHealthId } from "../utils/healthId";
import { GP_CARE_ORIGIN, publishCriticalAlertToFirestore } from "./gpCareCritical";

export type ResultSyncOutcome = {
  ok: boolean;
  patientId?: string;
  patientName?: string;
  clinicName?: string;
  profileUrl?: string;
  suwasiriPatientId?: string;
  error?: string;
};

function orderPayload(order: LabOrder, critical: boolean) {
  return {
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
    critical,
  };
}

async function findSuwasiriUser(order: LabOrder): Promise<{ id: string; barcode?: string } | null> {
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseDb();
  const users = collection(db, "users");
  const barcode = uniqueHealthId(order);
  const phone = (order.phone || "").trim();
  const attempts = [
    barcode ? query(users, where("barcodeNumber", "==", barcode), limit(1)) : null,
    barcode ? query(users, where("ceylonHealthId", "==", barcode), limit(1)) : null,
    phone ? query(users, where("mobileNo", "==", phone), limit(1)) : null,
    phone ? query(users, where("mobileNo", "==", phone.replace(/\s/g, "")), limit(1)) : null,
  ].filter(Boolean);

  for (const q of attempts) {
    try {
      const snap = await getDocs(q!);
      if (snap.empty) continue;
      const d = snap.docs[0];
      const data = d.data();
      return {
        id: d.id,
        barcode: String(data.barcodeNumber || data.ceylonHealthId || barcode || ""),
      };
    } catch {
      /* portal may not be signed in */
    }
  }
  return null;
}

function slugTest(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "test";
}

export async function publishLabReportToSuwasiriVault(opts: {
  patientId: string;
  order: LabOrder;
  critical?: boolean;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const patientId = (opts.patientId || "").trim();
  if (!patientId) return false;
  const order = opts.order;
  const healthId = uniqueHealthId(order);
  const critical = Boolean(opts.critical || order.flaggedCritical || order.status === "CRITICAL");
  const tests = splitInvestigations(order.testType);
  const names = tests.length ? tests : [order.testType];
  const metrics = (order.results || []).map((row) => ({
    name: row.parameter,
    value: `${row.value} ${row.unit}`.trim(),
    status: critical || row.isAbnormal ? (critical ? "critical" : "attention") : "normal",
    normalRange: row.referenceRange || "",
  }));

  for (const testName of names) {
    const id = `lankalab-lab-${order.specimenId || order.id}-${slugTest(testName)}`;
    const testMetrics = metrics.filter((m) =>
      m.name.toLowerCase().includes(testName.toLowerCase().slice(0, 8))
    );
    await setDoc(
      doc(collection(getFirebaseDb(), "vault"), id),
      {
        patientId,
        barcodeNumber: healthId,
        title: testName,
        issuedBy: "LankaLab",
        date: new Date().toISOString(),
        category: "Pathology",
        facility: "LankaLab - Colombo Central",
        requestedBy: order.connectedClinic || "LankaLab",
        kind: "lab",
        clinicalComments: order.notes || "",
        source: "lankalab",
        critical,
        metrics: (testMetrics.length ? testMetrics : metrics).length
          ? testMetrics.length
            ? testMetrics
            : metrics
          : [{ name: testName, value: "Report filed", status: critical ? "critical" : "normal", normalRange: "" }],
      },
      { merge: true }
    );
  }
  return true;
}

/** File a completed (non-critical) report onto the requesting GP Care clinic. */
export async function syncResultToGpCareClinic(order: LabOrder): Promise<ResultSyncOutcome> {
  try {
    const res = await fetch(`${GP_CARE_ORIGIN}/api/lankalab-result-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload(order, false)),
    });
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      return { ok: false, error: String(data.error || `GP Care returned ${res.status}`) };
    }
    return {
      ok: true,
      patientId: String(data.patientId || ""),
      patientName: String(data.patientName || order.patientName),
      clinicName: String(data.clinicName || order.connectedClinic || ""),
      profileUrl: String(data.profileUrl || ""),
      suwasiriPatientId: String(data.suwasiriPatientId || ""),
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "GP Care is not reachable on port 3000.",
    };
  }
}

/** Write each selected test onto that Suwasiri patient's Vault → Lab reports. */
export async function syncResultToSuwasiriVault(order: LabOrder, patientId?: string): Promise<ResultSyncOutcome> {
  const healthId = uniqueHealthId(order);
  const found = await findSuwasiriUser({ ...order, suwasiriBarcode: healthId });
  const id = (found?.id || patientId || healthId).trim();
  if (!id) {
    return { ok: false, error: "No Unique Health ID / Suwasiri barcode on this order." };
  }
  try {
    await publishLabReportToSuwasiriVault({
      patientId: id,
      order: { ...order, suwasiriBarcode: found?.barcode || healthId },
      critical: false,
    });
    return { ok: true, suwasiriPatientId: found?.barcode || healthId, patientName: order.patientName };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not write Suwasiri Vault.",
    };
  }
}

export async function flagCompletedCritical(order: LabOrder): Promise<ResultSyncOutcome> {
  try {
    const res = await fetch(`${GP_CARE_ORIGIN}/api/lankalab-result-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload(order, true)),
    });
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const patientId = String(data.patientId || "");
    const profileUrl = String(
      data.profileUrl ||
        (patientId
          ? `${GP_CARE_ORIGIN}/?openPatient=${encodeURIComponent(patientId)}&critical=1`
          : `${GP_CARE_ORIGIN}/?openPatientName=${encodeURIComponent(order.patientName)}&critical=1`)
    );
    window.open(profileUrl, "gp-care-patient");
    void publishCriticalAlertToFirestore({
      id: `ll-${order.specimenId || order.id}`,
      patientId,
      patientName: data.patientName || order.patientName,
      testType: order.testType,
      specimenId: order.specimenId,
      suwasiriBarcode: order.suwasiriBarcode || "",
    }).catch(() => undefined);
    if (!res.ok) {
      return { ok: false, patientId, profileUrl, error: String(data.error || `GP Care returned ${res.status}`) };
    }
    return {
      ok: true,
      patientId,
      patientName: String(data.patientName || order.patientName),
      clinicName: String(data.clinicName || order.connectedClinic || ""),
      profileUrl,
    };
  } catch (err: unknown) {
    window.open(
      `${GP_CARE_ORIGIN}/?openPatientName=${encodeURIComponent(order.patientName)}&critical=1`,
      "gp-care-patient"
    );
    return {
      ok: false,
      error: err instanceof Error ? err.message : "GP Care is not reachable on port 3000.",
    };
  }
}

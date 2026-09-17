import React, { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Mail,
  Phone,
  Printer,
  Smartphone,
} from "lucide-react";
import type { LabOrder } from "../types";
import {
  callPatient,
  downloadLabReport,
  emailLabReport,
  printLabReport,
  textLabReport,
} from "../utils/labReportShare";
import {
  flagCompletedCritical,
  syncResultToGpCareClinic,
  syncResultToSuwasiriVault,
} from "../sync/gpCareResultSync";
import { syncClinicAndTextPatient } from "../sync/completeNotify";

type Props = {
  order: LabOrder;
  onPatch: (orderId: string, patch: Partial<LabOrder>) => void;
};

export default function LabOrderActions({ order, onPatch }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const critical = Boolean(order.flaggedCritical || order.status === "CRITICAL" || order.priority === "Critical");

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    try {
      await work();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title={`Sync to ${order.connectedClinic || "the requesting medical centre"} and message ${order.phone || "the patient"}`}
        disabled={busy !== null}
        onClick={() =>
          void run("done", async () => {
            const { clinic } = await syncClinicAndTextPatient(order);
            if (clinic.ok) {
              onPatch(order.id, { gpCareSyncedAt: new Date().toISOString() });
            } else {
              alert(
                clinic.error ||
                  `Could not sync to ${order.connectedClinic || "the requesting medical centre"}. Start GP Care on http://localhost:3000.`
              );
            }
          })
        }
        className="px-1.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase inline-flex items-center gap-0.5"
      >
        <CheckCircle2 className="w-3 h-3" />
        {busy === "done" ? "…" : "Completed"}
      </button>
      <button
        type="button"
        title="Download report"
        disabled={busy !== null}
        onClick={() => downloadLabReport(order)}
        className="p-1.5 rounded-md bg-sky-100 text-sky-800 hover:bg-sky-200"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Print report"
        disabled={busy !== null}
        onClick={() => printLabReport(order)}
        className="p-1.5 rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
      >
        <Printer className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title={`Sync with ${order.connectedClinic || "GP Care clinic"}`}
        disabled={busy !== null}
        onClick={() =>
          void run("clinic", async () => {
            const result = await syncResultToGpCareClinic(order);
            if (!result.ok) {
              alert(result.error || "Could not sync to GP Care.");
              return;
            }
            onPatch(order.id, { gpCareSyncedAt: new Date().toISOString() });
            alert(`Synced to ${result.clinicName || "Sri Lankan GP Care"} under ${result.patientName}.`);
          })
        }
        className={`px-1.5 py-1 rounded-md text-[8px] font-black uppercase inline-flex items-center gap-0.5 ${
          order.gpCareSyncedAt ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-900 hover:bg-teal-200"
        }`}
      >
        <Building2 className="w-3 h-3" />
        {busy === "clinic" ? "…" : "Clinic"}
      </button>
      {!critical && (
        <button
          type="button"
          title="Sync to patient Suwasiri app · Vault → Lab reports"
          disabled={busy !== null}
          onClick={() =>
            void run("vault", async () => {
              let vaultId = order.suwasiriBarcode || "";
              if (!order.gpCareSyncedAt) {
                const clinic = await syncResultToGpCareClinic(order);
                if (clinic.ok) {
                  onPatch(order.id, { gpCareSyncedAt: new Date().toISOString() });
                  vaultId = clinic.suwasiriPatientId || vaultId;
                }
              }
              const vault = await syncResultToSuwasiriVault(order, vaultId);
              if (!vault.ok) {
                alert(vault.error || "Could not sync to Suwasiri Vault.");
                return;
              }
              onPatch(order.id, { suwasiriSyncedAt: new Date().toISOString() });
              alert(`Sent to ${order.patientName}'s Suwasiri Vault → Lab reports.`);
            })
          }
          className={`px-1.5 py-1 rounded-md text-[8px] font-black uppercase inline-flex items-center gap-0.5 ${
            order.suwasiriSyncedAt ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
          }`}
        >
          <Smartphone className="w-3 h-3" />
          {busy === "vault" ? "…" : "App"}
        </button>
      )}
      <button
        type="button"
        title="Mark critical — open GP Care patient file in red"
        disabled={busy !== null}
        onClick={() =>
          void run("crit", async () => {
            onPatch(order.id, { flaggedCritical: true, priority: "Critical" });
            const result = await flagCompletedCritical({ ...order, flaggedCritical: true, priority: "Critical" });
            if (!result.ok) {
              alert(result.error || "Opened GP Care. Start it on http://localhost:3000 if needed.");
            }
          })
        }
        className="px-1.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[8px] font-black uppercase inline-flex items-center gap-0.5"
      >
        <AlertTriangle className="w-3 h-3" />
        {busy === "crit" ? "…" : "Critical"}
      </button>
      <button
        type="button"
        title={critical ? "Email critical report" : `Email ${order.email || "patient"}`}
        onClick={() => emailLabReport(order, { critical })}
        className={`p-1.5 rounded-md ${critical ? "bg-red-100 text-red-800 hover:bg-red-200" : "bg-violet-100 text-violet-800 hover:bg-violet-200"}`}
      >
        <Mail className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title={critical ? "Text / SMS critical alert" : `Call or text ${order.phone || "patient"}`}
        onClick={() => (critical ? textLabReport(order, { critical: true }) : callPatient(order))}
        className={`p-1.5 rounded-md ${critical ? "bg-red-100 text-red-800 hover:bg-red-200" : "bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
      >
        <Phone className="w-3.5 h-3.5" />
      </button>
      {critical && (
        <button
          type="button"
          title="Send SMS"
          onClick={() => textLabReport(order, { critical: true })}
          className="px-1.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200 text-[8px] font-black uppercase"
        >
          SMS
        </button>
      )}
    </div>
  );
}

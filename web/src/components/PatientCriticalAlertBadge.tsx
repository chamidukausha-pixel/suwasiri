import React from "react";
import { AlertTriangle } from "lucide-react";
import type { Patient } from "../types";

export function hasCriticalPathologyAlert(patient?: Patient | null): boolean {
  return Boolean(
    patient?.labResults?.some((lr) => lr.criticalAlert) ||
      patient?.clinicalDocuments?.some((d) => d.status === "ACTION_REQUIRED")
  );
}

/** Red-alert flag under a patient name after the doctor marks a report critical. */
export default function PatientCriticalAlertBadge({
  patient,
  show,
}: {
  patient?: Patient | null;
  show?: boolean;
}) {
  if (!(show ?? hasCriticalPathologyAlert(patient))) return null;
  return (
    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white border-2 border-red-900 uppercase tracking-wide shadow-xs">
      <AlertTriangle className="w-3 h-3" />
      Red alert · Critical
    </span>
  );
}

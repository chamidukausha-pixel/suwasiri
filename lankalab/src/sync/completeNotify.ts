import type { LabOrder } from "../types";
import { textLabReport } from "../utils/labReportShare";
import { syncResultToGpCareClinic, type ResultSyncOutcome } from "./gpCareResultSync";

export async function syncClinicAndTextPatient(order: LabOrder): Promise<{
  clinic: ResultSyncOutcome;
  smsOpened: boolean;
}> {
  const completed = { ...order, status: "COMPLETED" as const };
  const clinic = await syncResultToGpCareClinic(completed);
  const smsOpened = Boolean(textLabReport(completed));
  return { clinic, smsOpened };
}

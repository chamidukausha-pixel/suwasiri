import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "../firebase";
import type { MedicalCertificateRecord } from "../types";

export function certificateTitleFromStatus(
  status: MedicalCertificateRecord["status"]
): string {
  if (status === "FIT_FOR_DUTY") return "Medical Fitness Certificate";
  if (status === "FIT_FOR_LIGHT_DUTY") return "Light Duty Medical Certificate";
  return "Sick Leave / Medical Certificate";
}

export function buildCertificateBody(opts: {
  patientName: string;
  diagnosis: string;
  status: string;
  numDays: number;
  startDate: string;
  endDate: string;
  remarks?: string;
}): string {
  const fitness = opts.status.replace(/_/g, " ");
  const remarks = (opts.remarks || "").trim();
  return [
    `This is to certify that ${opts.patientName} was examined at Sri Lankan GP Care.`,
    `Clinical diagnosis: ${opts.diagnosis}.`,
    `Certified status: ${fitness}.`,
    `Recommended rest / leave: ${opts.numDays} day(s), from ${opts.startDate} to ${opts.endDate} inclusive.`,
    remarks ? `Additional instructions: ${remarks}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Writes a GP Care medical certificate to the named Suwasiri patient only. */
export async function issueMedicalCertificateToSuwasiri(opts: {
  patientId: string;
  patientName: string;
  certificate: MedicalCertificateRecord;
  clinicName?: string;
}): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const patientId = (opts.patientId || "").trim();
  if (!patientId) return false;

  const cert = opts.certificate;
  const title = certificateTitleFromStatus(cert.status);
  const body = buildCertificateBody({
    patientName: opts.patientName,
    diagnosis: cert.diagnosis,
    status: cert.status,
    numDays: cert.numDays,
    startDate: cert.startDate,
    endDate: cert.endDate,
    remarks: cert.additionalRemarks,
  });

  const db = getFirebaseDb();
  await setDoc(doc(collection(db, "medical_certificates"), cert.id), {
    patientId,
    patientName: opts.patientName,
    title,
    doctor: cert.doctorName,
    doctorRegNo: cert.doctorRegNo,
    clinicName: opts.clinicName || "Sri Lankan GP Care",
    certificateNo: cert.id,
    issuedAt: new Date().toISOString(),
    date: cert.date,
    diagnosis: cert.diagnosis,
    status: cert.status,
    startDate: cert.startDate,
    endDate: cert.endDate,
    numDays: cert.numDays,
    additionalRemarks: cert.additionalRemarks || "",
    body,
    source: "gp_care",
  });
  return true;
}

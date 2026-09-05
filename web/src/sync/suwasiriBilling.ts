import type { Appointment, Billing, Patient } from "../types";

export function isPdfReceipt(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.startsWith("data:application/pdf") ||
    u.includes(".pdf") ||
    u.includes("application/pdf")
  );
}

export function isInvoiceSettled(inv: {
  status?: string;
  paymentStatus?: string;
}): boolean {
  const pay = String(inv.paymentStatus || "").toUpperCase();
  if (pay === "PAID" || pay === "SETTLED" || pay === "BULK_BILLED") return true;
  const s = String(inv.status || "").toUpperCase();
  return s === "PAID" || s === "SETTLED" || s === "BULK_BILLED";
}

export function isPaidViaSuwasiriApp(inv: {
  paidBySuwasiri?: boolean;
  paymentMethod?: string;
}): boolean {
  const method = String(inv.paymentMethod || "");
  if (/^cash$/i.test(method)) return false;
  if (inv.paidBySuwasiri) return true;
  return /suwasiri|debit|card|slip|manual|online/i.test(method);
}

/** Receptionist-facing payment status. */
export function invoicePaymentLabel(inv: {
  status?: string;
  paymentStatus?: string;
  paidBySuwasiri?: boolean;
  paymentMethod?: string;
}): string {
  if (!isInvoiceSettled(inv)) return "Not settled";
  if (/^cash$/i.test(String(inv.paymentMethod || ""))) return "Settled";
  if (isPaidViaSuwasiriApp(inv)) return "Paid by Suwasiri App";
  return "Settled";
}

export function invoiceAppointmentId(inv: {
  id?: string;
  appointmentId?: string;
}): string | undefined {
  if (inv.appointmentId) return inv.appointmentId;
  const id = String(inv.id || "");
  if (id.startsWith("booked-")) return id.slice("booked-".length);
  return undefined;
}

export function appointmentAgeGender(
  apt: Appointment,
  patient?: Patient | null
): { age?: number; gender?: string } {
  const fromFile = patient?.age && patient.age > 0 ? patient.age : undefined;
  const age = fromFile || (apt.patientAge && apt.patientAge > 0 ? apt.patientAge : undefined);
  const fileGender = (patient?.gender || "").trim();
  const aptGender = (apt.patientGender || "").trim();
  const fileGenderOk =
    Boolean(fileGender) && !/^(unknown|not recorded|—|-)$/i.test(fileGender);
  const gender = fileGenderOk ? fileGender : aptGender || fileGender || undefined;
  return { age, gender };
}

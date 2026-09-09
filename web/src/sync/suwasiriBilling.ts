import type { Appointment, Billing, Patient } from "../types";
import { appointmentDateKey } from "./suwasiriAppointments";

export type PaymentLedgerRow = Billing & {
  appointmentTime?: string;
  paymentStatus?: string;
  receiptApproved?: boolean;
};

export function isPdfReceipt(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.startsWith("data:application/pdf") ||
    u.includes(".pdf") ||
    u.includes("application/pdf")
  );
}

export function isCashPayment(inv: { paymentMethod?: string }): boolean {
  return /^cash$/i.test(String(inv.paymentMethod || ""));
}

export function isBankSlipPayment(inv: {
  paymentMethod?: string;
  suwasiriReceiptUrl?: string | null;
}): boolean {
  if (isCashPayment(inv)) return false;
  if (inv.suwasiriReceiptUrl) return true;
  return /slip|manual|bank/i.test(String(inv.paymentMethod || ""));
}

export function isDirectDebitPayment(inv: {
  paidBySuwasiri?: boolean;
  paymentMethod?: string;
  suwasiriReceiptUrl?: string | null;
}): boolean {
  if (isBankSlipPayment(inv) || isCashPayment(inv)) return false;
  const method = String(inv.paymentMethod || "");
  if (/debit|card|online|eftpos|credit|suwasiri pay/i.test(method)) return true;
  return Boolean(inv.paidBySuwasiri) && !inv.suwasiriReceiptUrl;
}

/** Bank slip uploaded in Suwasiri or at reception — not collected until receptionist Approves. */
export function isReceiptAwaitingApproval(inv: {
  receiptApproved?: boolean;
  suwasiriReceiptUrl?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
}): boolean {
  if (inv.receiptApproved === true) return false;
  if (isCashPayment(inv)) return false;
  return isBankSlipPayment(inv);
}

export function isInvoiceSettled(inv: {
  status?: string;
  paymentStatus?: string;
  paidBySuwasiri?: boolean;
  paymentMethod?: string;
  suwasiriReceiptUrl?: string | null;
  receiptApproved?: boolean;
}): boolean {
  if (isReceiptAwaitingApproval(inv)) return false;
  if (inv.receiptApproved === true) return true;
  const pay = String(inv.paymentStatus || "").toUpperCase();
  if (pay === "PAID" || pay === "SETTLED" || pay === "BULK_BILLED") return true;
  const s = String(inv.status || "").toUpperCase();
  if (s === "PAID" || s === "SETTLED" || s === "BULK_BILLED") return true;
  if (isDirectDebitPayment(inv) && inv.paidBySuwasiri) return true;
  return false;
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
  suwasiriReceiptUrl?: string | null;
  receiptApproved?: boolean;
}): string {
  if (isReceiptAwaitingApproval(inv)) return "Slip awaiting approval";
  if (inv.receiptApproved === true) return "Approved";
  if (!isInvoiceSettled(inv)) return "Pending payment";
  if (isCashPayment(inv)) return "Settled";
  if (isBankSlipPayment(inv)) return "Approved";
  if (isDirectDebitPayment(inv) || isPaidViaSuwasiriApp(inv)) return "Paid by Suwasiri App";
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

function matchInvoiceForAppointment(billing: Billing[], apt: Appointment): Billing | undefined {
  const byId = billing.find((inv) => inv.appointmentId && inv.appointmentId === apt.id);
  if (byId) return byId;
  const date = appointmentDateKey(apt) || apt.date;
  return billing.find(
    (inv) =>
      !inv.appointmentId &&
      inv.date === date &&
      ((inv.patientId && inv.patientId === apt.patientId) || inv.patientName === apt.patientName)
  );
}

/** Same invoice list Receipts & Invoices and Reports & Analytics share. */
export function buildPaymentLedger(
  appointments: Appointment[],
  billing: Billing[],
  patients: Patient[]
): PaymentLedgerRow[] {
  const used = new Set<string>();
  const rows: PaymentLedgerRow[] = [];
  for (const apt of appointments) {
    const match = matchInvoiceForAppointment(billing, apt);
    const p = patients.find((x) => x.id === apt.patientId);
    const name = apt.patientName || p?.name || "Patient";
    const date = appointmentDateKey(apt) || apt.date;
    const cashSettled = isCashPayment(match || apt);
    const merged: PaymentLedgerRow = match
      ? {
          ...match,
          patientName: match.patientName || name,
          date: match.date || date,
          appointmentTime: apt.time,
          appointmentId: match.appointmentId || apt.id,
          suwasiriReceiptUrl: match.suwasiriReceiptUrl || apt.suwasiriReceiptUrl,
          paymentMethod: cashSettled
            ? "Cash"
            : (match.paymentMethod || (apt.paymentMethod as Billing["paymentMethod"])),
          paymentStatus: match.paymentStatus || apt.paymentStatus,
          receiptApproved: match.receiptApproved ?? apt.receiptApproved,
          paidBySuwasiri: Boolean(match.paidBySuwasiri || apt.paidBySuwasiri) && !cashSettled,
          amount: match.amount || apt.feeAmount || 3500,
        }
      : {
          id: `booked-${apt.id}`,
          patientName: name,
          patientId: apt.patientId,
          amount: apt.feeAmount || 3500,
          service: apt.reason || (apt.isTelehealth ? "GP Video Consult" : "GP Consultation"),
          status: "PENDING",
          date,
          appointmentTime: apt.time,
          appointmentId: apt.id,
          paymentMethod: apt.paymentMethod as Billing["paymentMethod"],
          paidBySuwasiri: Boolean(apt.paidBySuwasiri) && !cashSettled,
          suwasiriReceiptUrl: apt.suwasiriReceiptUrl,
          paymentStatus: apt.paymentStatus,
          receiptApproved: apt.receiptApproved,
        };
    if (match) used.add(match.id);
    const settled = isInvoiceSettled(merged);
    merged.status = settled
      ? merged.status === "BULK_BILLED"
        ? "BULK_BILLED"
        : "PAID"
      : merged.status === "OVERDUE"
        ? "OVERDUE"
        : "PENDING";
    rows.push(merged);
  }
  for (const inv of billing) {
    if (!used.has(inv.id)) rows.push(inv);
  }
  return rows.sort((a, b) => {
    const au = isInvoiceSettled(a) ? 1 : 0;
    const bu = isInvoiceSettled(b) ? 1 : 0;
    if (au !== bu) return au - bu;
    const dateCmp = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCmp !== 0) return dateCmp;
    return String(a.appointmentTime || "").localeCompare(String(b.appointmentTime || ""));
  });
}

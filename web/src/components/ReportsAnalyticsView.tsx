import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Activity,
  HeartPulse,
  Syringe,
  AlertCircle,
  FileCheck,
  Download,
  Filter,
  Layers,
  Sparkles,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { Patient, Appointment, Billing, RecallRecord } from "../types";
import ClinicMonthCalendar from "./ClinicMonthCalendar";
import { formatDateKey, formatLongDate } from "../utils/clinicCalendar";
import {
  invoicePaymentLabel,
  isCashPayment,
  isDirectDebitPayment,
  isInvoiceSettled,
  isReceiptAwaitingApproval,
  type PaymentLedgerRow,
} from "../sync/suwasiriBilling";

interface Props {
  patients?: Patient[];
  appointments?: Appointment[];
  billingList?: Billing[];
  invoiceRows?: PaymentLedgerRow[];
  recalls?: RecallRecord[];
}

const APPOINTMENT_TRENDS_DATA = [
  { day: "Mon", booked: 38, completed: 35, cancelled: 2, dna: 1 },
  { day: "Tue", booked: 42, completed: 39, cancelled: 2, dna: 1 },
  { day: "Wed", booked: 40, completed: 37, cancelled: 2, dna: 1 },
  { day: "Thu", booked: 45, completed: 42, cancelled: 1, dna: 2 },
  { day: "Fri", booked: 48, completed: 44, cancelled: 3, dna: 1 },
  { day: "Sat", booked: 28, completed: 27, cancelled: 1, dna: 0 }
];

const DOCTOR_WORKLOAD_DATA = [
  { name: "Dr. Priyantha Silva (SLMC-48291)", patients: 154, hours: 40, revenue: 580000 },
  { name: "Dr. Anura Senanayake (SLMC-51029)", patients: 132, hours: 36, revenue: 495000 },
  { name: "Dr. K. Perera (SLMC-56410)", patients: 98, hours: 28, revenue: 367500 },
  { name: "Nurse K. Weerasinghe (SLNC-19402)", patients: 82, hours: 34, revenue: 145000 }
];

const CHRONIC_REGISTRIES_DATA = [
  {
    disease: "Type 2 Diabetes Mellitus (MoH PEN 1)",
    cohort: 420,
    upToDateCarePlan: 358,
    targetHbA1cMet: 295,
    recallsDue: 38
  },
  {
    disease: "Hypertension & Cardiovascular Risk (MoH PEN 2)",
    cohort: 580,
    upToDateCarePlan: 490,
    targetHbA1cMet: 475,
    recallsDue: 46
  },
  {
    disease: "Bronchial Asthma & COPD",
    cohort: 210,
    upToDateCarePlan: 182,
    targetHbA1cMet: 178,
    recallsDue: 19
  },
  {
    disease: "Chronic Kidney Disease (CKD / CKDu Registry)",
    cohort: 145,
    upToDateCarePlan: 132,
    targetHbA1cMet: 118,
    recallsDue: 14
  }
];

export default function ReportsAnalyticsView({
  patients = [],
  appointments = [],
  billingList = [],
  invoiceRows,
  recalls = []
}: Props) {
  const [reportTab, setReportTab] = useState<"PRACTICE" | "CLINICAL">("PRACTICE");
  const [timeRange, setTimeRange] = useState<"THIS_MONTH" | "LAST_QUARTER" | "YEAR_TO_DATE">("THIS_MONTH");
  const todayKey = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const ledger: PaymentLedgerRow[] = invoiceRows ?? billingList;

  const dateInRange = (iso?: string) => {
    if (!iso || iso.length < 7) return false;
    const y = Number(iso.slice(0, 4));
    const m = Number(iso.slice(5, 7));
    const now = new Date();
    if (timeRange === "YEAR_TO_DATE") {
      return y === 2026 && iso.slice(0, 10) <= todayKey;
    }
    if (timeRange === "THIS_MONTH") {
      return y === now.getFullYear() && m === now.getMonth() + 1;
    }
    const q = Math.floor(now.getMonth() / 3);
    let lastQ = q - 1;
    let year = now.getFullYear();
    if (lastQ < 0) {
      lastQ = 3;
      year -= 1;
    }
    const startM = lastQ * 3 + 1;
    const endM = startM + 2;
    return y === year && m >= startM && m <= endM;
  };

  const rangeLabel =
    timeRange === "THIS_MONTH"
      ? new Date().toLocaleString("en-LK", { month: "long", year: "numeric" })
      : timeRange === "YEAR_TO_DATE"
      ? `Year to date 2026 (1 Jan – ${formatLongDate(todayKey)})`
      : (() => {
          const now = new Date();
          const q = Math.floor(now.getMonth() / 3);
          let lastQ = q - 1;
          let year = now.getFullYear();
          if (lastQ < 0) {
            lastQ = 3;
            year -= 1;
          }
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const start = lastQ * 3;
          return `${months[start]}–${months[start + 2]} ${year}`;
        })();

  const isRegisteredPatient = (patientId?: string, patientName?: string) => {
    if (patientId && patients.some((p) => p.id === patientId)) return true;
    const name = (patientName || "").trim().toLowerCase();
    if (!name) return false;
    return patients.some((p) => (p.name || "").trim().toLowerCase() === name);
  };

  const rangeBilling = ledger.filter((inv) => dateInRange(inv.date) && isRegisteredPatient(inv.patientId, inv.patientName));
  const rangeAppointments = appointments.filter((a) => dateInRange(a.date) && isRegisteredPatient(a.patientId, a.patientName));
  const rangeCollected = rangeBilling.filter((b) => isInvoiceSettled(b)).reduce((sum, b) => sum + (b.amount || 0), 0);
  const rangeOutstanding = rangeBilling.filter((b) => !isInvoiceSettled(b)).reduce((sum, b) => sum + (b.amount || 0), 0);
  const rangeCompleted = rangeAppointments.filter((a) => a.status === "COMPLETED");
  const rangeDna = rangeAppointments.filter((a) => /dna|no.?show|cancelled/i.test(a.status || "")).length;

  const collectedTotal = rangeCollected;
  const outstandingTotal = rangeOutstanding;
  const completedConsultsAll = rangeCompleted.length;
  const dnaAppointments = rangeDna;

  const dayInvoices = ledger.filter(
    (inv) => inv.date === selectedDate && isRegisteredPatient(inv.patientId, inv.patientName)
  );
  const dayAppointments = appointments.filter(
    (a) => a.date === selectedDate && isRegisteredPatient(a.patientId, a.patientName)
  );
  const dayCompleted = dayAppointments.filter((a) => a.status === "COMPLETED");
  const dayCollected = dayInvoices.filter((b) => isInvoiceSettled(b)).reduce((sum, b) => sum + (b.amount || 0), 0);
  const dayOutstanding = dayInvoices.filter((b) => !isInvoiceSettled(b)).reduce((sum, b) => sum + (b.amount || 0), 0);
  const dayInvoiceTotal = dayInvoices.reduce((sum, b) => sum + (b.amount || 0), 0);
  const dayRegisteredPatients = patients.filter((p) =>
    dayInvoices.some(
      (inv) => inv.patientId === p.id || (inv.patientName || "").trim().toLowerCase() === p.name.trim().toLowerCase()
    ) ||
    dayAppointments.some(
      (a) => a.patientId === p.id || (a.patientName || "").trim().toLowerCase() === p.name.trim().toLowerCase()
    )
  );

  const paymentBucket = (inv: PaymentLedgerRow) => {
    if (!isInvoiceSettled(inv) || isReceiptAwaitingApproval(inv)) return "pending";
    if (isCashPayment(inv)) return "cash";
    if (inv.receiptApproved === true || /slip|manual|bank/i.test(String(inv.paymentMethod || ""))) return "slip";
    if (isDirectDebitPayment(inv)) return "debit";
    return "debit";
  };
  const sumBucket = (rows: PaymentLedgerRow[], bucket: string) =>
    rows.filter((r) => paymentBucket(r) === bucket).reduce((sum, b) => sum + (b.amount || 0), 0);
  const revenueBreakdown = [
    { name: "Cash settle (counter)", value: sumBucket(rangeBilling, "cash"), color: "#00334f" },
    { name: "Suwasiri debit / card", value: sumBucket(rangeBilling, "debit"), color: "#10b981" },
    { name: "Bank slip approved", value: sumBucket(rangeBilling, "slip"), color: "#0284c7" },
    { name: "Pending payment", value: sumBucket(rangeBilling, "pending"), color: "#f59e0b" },
  ];
  const revenueChartData = revenueBreakdown.filter((item) => item.value > 0);
  const pieData = revenueChartData.length > 0 ? revenueChartData : revenueBreakdown;

  const registeredKeysByDate: Record<string, Set<string>> = {};
  const addRegisteredDate = (date?: string, patientId?: string, patientName?: string) => {
    if (!date || !isRegisteredPatient(patientId, patientName)) return;
    const key = patientId || (patientName || "").trim().toLowerCase();
    if (!key) return;
    if (!registeredKeysByDate[date]) registeredKeysByDate[date] = new Set();
    registeredKeysByDate[date].add(key);
  };
  appointments.forEach((a) => addRegisteredDate(a.date, a.patientId, a.patientName));
  ledger.forEach((inv) => addRegisteredDate(inv.date, inv.patientId, inv.patientName));
  const countsByDate = Object.fromEntries(
    Object.entries(registeredKeysByDate).map(([date, keys]) => [date, keys.size])
  );

  const totalPatients = patients.length || 0;
  const totalConsultsMonth = completedConsultsAll;
  const dnaRate = rangeAppointments.length ? `${((dnaAppointments / rangeAppointments.length) * 100).toFixed(1)}%` : "0%";
  const avgWaitTimeMinutes = 8.5;
  const totalRevenueMonth = collectedTotal;
  const outstandingInvoices = outstandingTotal;

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildReportText = () => {
    const lines = [
      "Sri Lankan GP Care — Practice Performance Report",
      `Period: ${rangeLabel}`,
      `Generated: ${todayKey}`,
      "",
      `Collected (paid): Rs. ${rangeCollected.toLocaleString()}`,
      `Pending payments: Rs. ${rangeOutstanding.toLocaleString()}`,
      `Invoices in period: ${rangeBilling.length}`,
      `Completed consults: ${rangeCompleted.length}`,
      `Booked appointments: ${rangeAppointments.length}`,
      `DNA / cancelled: ${rangeDna}`,
      "",
      "INVOICES (Receipts & Invoices)",
      "Date,Patient,Service,Payment,Amount",
      ...rangeBilling.map((b) => `${b.date},${b.patientName},${(b.service || "").replace(/,/g, " ")},${invoicePaymentLabel(b)},${b.amount}`),
      "",
      "COMPLETED CONSULTS",
      "Date,Time,Patient,Reason,Status",
      ...rangeCompleted.map((a) => `${a.date},${a.time},${a.patientName || a.patientId},${(a.reason || "").replace(/,/g, " ")},${a.status}`),
    ];
    return lines.join("\n");
  };

  const exportExcel = () => {
    const csv = [
      "Type,Date,Patient,Detail,Status,Amount (LKR)",
      ...rangeBilling.map((b) => `Invoice,${b.date},"${b.patientName}","${(b.service || "").replace(/"/g, "'")}",${invoicePaymentLabel(b)},${b.amount}`),
      ...rangeCompleted.map((a) => `Completed consult,${a.date},"${a.patientName || a.patientId}","${(a.reason || "").replace(/"/g, "'")}",${a.status},`),
    ].join("\n");
    downloadBlob("\uFEFF" + csv, `GP_Care_Report_${timeRange}.csv`, "text/csv;charset=utf-8");
  };

  const exportNotepad = () => {
    downloadBlob(buildReportText(), `GP_Care_Report_${timeRange}.txt`, "text/plain;charset=utf-8");
  };

  const exportPdf = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      alert("Allow pop-ups to export PDF, then use Print → Save as PDF.");
      return;
    }
    const htmlBody = buildReportText().replace(/</g, "&lt;").replace(/\n/g, "<br/>");
    w.document.write(`<!DOCTYPE html><html><head><title>GP Care Report ${rangeLabel}</title>
      <style>body{font-family:Georgia,serif;color:#00334f;padding:28px;max-width:800px;margin:0 auto}
      h1{font-size:18px} pre,div.report{font-size:12px;line-height:1.45}</style></head>
      <body><h1>Practice Performance Report</h1><p>${rangeLabel}</p><div class="report">${htmlBody}</div></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00334f] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#00334f] tracking-tight">
                  Practice Performance & Clinical Quality Analytics
                </h1>
                <span className="text-xs bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                  Sri Lanka National Standard (LKR)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive KPIs: Patient volume, cancellations, DNA rates, waiting times, Sri Lankan Rupee (Rs.) revenue distribution, MoH PEN chronic disease registers, and EPI vaccination rates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setTimeRange("THIS_MONTH")}
                className={`px-3 py-1 rounded-md transition ${
                  timeRange === "THIS_MONTH" ? "bg-white text-[#00334f] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange("LAST_QUARTER")}
                className={`px-3 py-1 rounded-md transition ${
                  timeRange === "LAST_QUARTER" ? "bg-white text-[#00334f] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Last Quarter
              </button>
              <button
                onClick={() => setTimeRange("YEAR_TO_DATE")}
                className={`px-3 py-1 rounded-md transition ${
                  timeRange === "YEAR_TO_DATE" ? "bg-white text-[#00334f] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                YTD 2026
              </button>
            </div>

            <button
              type="button"
              onClick={exportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={exportNotepad}
              className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Notepad
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setReportTab("PRACTICE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === "PRACTICE"
                ? "bg-[#00334f] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            1. Practice & Financial Reports (Rs. LKR)
          </button>

          <button
            onClick={() => setReportTab("CLINICAL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === "CLINICAL"
                ? "bg-[#00334f] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            2. MoH NCD Registries & Preventive Health (Sri Lanka)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 border rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-[#00334f]">Daily financial situation</h3>
                <p className="text-[11px] text-slate-500">
                  {formatLongDate(selectedDate)} — registered patients on Patient Clinical Records only (collected vs pending).
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Collected</span>
                <div className="text-lg font-black text-emerald-900">Rs. {dayCollected.toLocaleString()}</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-amber-900">Pending payments</span>
                <div className="text-lg font-black text-amber-950">Rs. {dayOutstanding.toLocaleString()}</div>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-sky-800">Registered patients</span>
                <div className="text-lg font-black text-sky-950">{dayRegisteredPatients.length}</div>
                <p className="text-[10px] text-slate-500">On this date</p>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-violet-800">Completed consults</span>
                <div className="text-lg font-black text-violet-950">{dayCompleted.length}</div>
                <p className="text-[10px] text-slate-500">Rs. {dayInvoiceTotal.toLocaleString()} invoiced</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2 font-bold">Registered patient</th>
                    <th className="p-2 font-bold">Payment</th>
                    <th className="p-2 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dayRegisteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400 italic">
                        No registered patients on {formatLongDate(selectedDate)}.
                      </td>
                    </tr>
                  ) : (
                    dayRegisteredPatients.map((p) => {
                      const inv = dayInvoices.find(
                        (row) =>
                          row.patientId === p.id ||
                          (row.patientName || "").trim().toLowerCase() === p.name.trim().toLowerCase()
                      );
                      const apt = dayAppointments.find(
                        (a) =>
                          a.patientId === p.id ||
                          (a.patientName || "").trim().toLowerCase() === p.name.trim().toLowerCase()
                      );
                      const pending = inv ? !isInvoiceSettled(inv) : false;
                      return (
                        <tr key={p.id} className={pending ? "bg-amber-50/80" : ""}>
                          <td className="p-2">
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="block text-[10px] text-slate-500">
                              {[p.gender, p.age ? `${p.age} yrs` : "", inv?.service || apt?.reason]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </td>
                          <td className={`p-2 font-bold ${pending ? "text-amber-900" : "text-emerald-800"}`}>
                            {inv ? invoicePaymentLabel(inv) : apt?.status === "COMPLETED" ? "COMPLETED" : "Booked"}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {inv ? `Rs. ${inv.amount.toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <ClinicMonthCalendar
            year={calendarMonth.year}
            month={calendarMonth.month}
            selectedDate={selectedDate}
            todayKey={todayKey}
            countsByDate={countsByDate}
            onSelectDate={setSelectedDate}
            onChangeMonth={(year, month) => setCalendarMonth({ year, month })}
            onJumpToToday={() => {
              const n = new Date();
              setCalendarMonth({ year: n.getFullYear(), month: n.getMonth() });
              setSelectedDate(formatDateKey(n));
            }}
          />
        </div>
      </div>

      <div className="bg-white p-5 border rounded-xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="font-bold text-sm text-[#00334f]">Results for {rangeLabel}</h2>
            <p className="text-[11px] text-slate-500">
              Registered patients only. Synced with Receipts & Invoices: cash settle, Suwasiri debit/card, approved bank slips, and pending payments.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Collected</span>
            <div className="text-lg font-black text-emerald-900">Rs. {rangeCollected.toLocaleString()}</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase text-amber-900">Pending payments</span>
            <div className="text-lg font-black text-amber-950">Rs. {rangeOutstanding.toLocaleString()}</div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase text-sky-800">Invoices</span>
            <div className="text-lg font-black text-sky-950">{rangeBilling.length}</div>
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase text-violet-800">Completed consults</span>
            <div className="text-lg font-black text-violet-950">{rangeCompleted.length}</div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-56 overflow-y-auto border rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 sticky top-0">
              <tr>
                <th className="p-2 font-bold">Date</th>
                <th className="p-2 font-bold">Registered patient / service</th>
                <th className="p-2 font-bold">Payment</th>
                <th className="p-2 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rangeBilling.length === 0 && rangeCompleted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">No registered-patient invoices or completed consults in this period.</td>
                </tr>
              ) : (
                <>
                  {rangeBilling.map((inv) => (
                    <tr key={inv.id} className={!isInvoiceSettled(inv) ? "bg-amber-50/80" : ""}>
                      <td className="p-2 font-mono text-slate-500">{inv.date}</td>
                      <td className="p-2">
                        <span className="font-bold text-slate-900">{inv.patientName}</span>
                        <span className="block text-[10px] text-slate-500">{inv.service}</span>
                      </td>
                      <td className={`p-2 font-bold ${!isInvoiceSettled(inv) ? "text-amber-900" : "text-emerald-800"}`}>
                        {invoicePaymentLabel(inv)}
                      </td>
                      <td className="p-2 text-right font-mono">Rs. {inv.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {rangeCompleted.map((apt) => (
                    <tr key={`rc-${apt.id}`} className="bg-violet-50/50">
                      <td className="p-2 font-mono text-slate-500">{apt.date}</td>
                      <td className="p-2">
                        <span className="font-bold text-slate-900">{apt.patientName || apt.patientId}</span>
                        <span className="block text-[10px] text-slate-500">Completed · {apt.time} · {apt.reason}</span>
                      </td>
                      <td className="p-2 font-bold text-emerald-800">COMPLETED</td>
                      <td className="p-2 text-right text-slate-400">—</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. PRACTICE & OPERATIONAL REPORTS */}
      {/* ============================================================ */}
      {reportTab === "PRACTICE" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Registered</span>
              <div className="text-2xl font-black text-[#00334f] mt-1">{totalPatients}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">All registered patients to date</p>
            </div>

            <div className="bg-white p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Consults Completed</span>
              <div className="text-2xl font-black text-sky-900 mt-1">{totalConsultsMonth}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">From appointment queue (Completed)</p>
            </div>

            <div className="bg-white p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">DNA (Did Not Attend)</span>
              <div className="text-2xl font-black text-rose-900 mt-1">{dnaAppointments}</div>
              <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Rate: {dnaRate} (Optimal)</p>
            </div>

            <div className="bg-white p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avg Waiting Time</span>
              <div className="text-2xl font-black text-amber-900 mt-1">{avgWaitTimeMinutes}m</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">&lt;10m Clinic SLA Target</p>
            </div>

            <div className="bg-white p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Revenue</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">Rs. {totalRevenueMonth.toLocaleString()}</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Cash, debit, and approved slips</p>
            </div>

            <div className="bg-white p-4 border rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pending payments</span>
              <div className="text-2xl font-black text-amber-900 mt-1">Rs. {outstandingInvoices.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Counter unpaid + slips awaiting approval</p>
            </div>
          </div>

          {/* Charts Row: Appointment Weekly Volume + Revenue Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Weekly Appointments Bar Chart */}
            <div className="lg:col-span-7 bg-white p-6 border rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#00334f]">Weekly Appointment Traffic & Completion (Mon - Sat)</h3>
                  <p className="text-[11px] text-slate-500">Booked vs Completed vs Cancelled vs DNA</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={APPOINTMENT_TRENDS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="completed" name="Completed Consults" fill="#00334f" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="dna" name="DNA (No Show)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Distribution Pie Chart */}
            <div className="lg:col-span-5 bg-white p-6 border rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#00334f]">Billing from Receipts & Invoices (Rs. LKR)</h3>
                  <p className="text-[11px] text-slate-500">Cash settle, Suwasiri debit/card, approved bank slips, and pending payments</p>
                </div>
              </div>

              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {revenueBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-800">Rs. {item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Doctor Workload Distribution Table */}
          <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
            <div className="border-b pb-3 font-bold text-sm text-[#00334f] flex items-center justify-between">
              <span>Doctor Clinical Workload & Revenue Performance Distribution</span>
              <span className="text-xs text-slate-500 font-normal">Registered Sri Lanka Medical Council (SLMC) Clinicians</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b">
                    <th className="p-3 font-bold">Medical Practitioner</th>
                    <th className="p-3 font-bold text-right">Consults (Month)</th>
                    <th className="p-3 font-bold text-right">Clinical Hours</th>
                    <th className="p-3 font-bold text-right">Patients / Hour</th>
                    <th className="p-3 font-bold text-right">Generated Revenue (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {DOCTOR_WORKLOAD_DATA.map((doc) => (
                    <tr key={doc.name} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{doc.name}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">{doc.patients}</td>
                      <td className="p-3 text-right text-slate-600">{doc.hours} hrs</td>
                      <td className="p-3 text-right font-bold text-[#00334f]">
                        {(doc.patients / doc.hours).toFixed(1)} / hr
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-800">
                        Rs. {doc.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CLINICAL REGISTRIES & PREVENTIVE HEALTH */}
      {/* ============================================================ */}
      {reportTab === "CLINICAL" && (
        <div className="space-y-6">
          {/* Chronic Disease Registries Table */}
          <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#00334f] flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  Sri Lanka MoH PEN Non-Communicable Disease Registries & Care Protocols
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Package of Essential NCD Interventions (WHO / Ministry of Health Sri Lanka) population tracking, glycemic/BP target compliance, and periodic follow-up recalls.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b">
                    <th className="p-3 font-bold">MoH PEN Clinical Cohort</th>
                    <th className="p-3 font-bold text-right">Active Registered</th>
                    <th className="p-3 font-bold text-right">Annual Care Protocol Up-to-Date</th>
                    <th className="p-3 font-bold text-right">Target Met (HbA1c &lt; 7.0% / BP &lt; 130/80)</th>
                    <th className="p-3 font-bold text-right">Overdue Clinic Recalls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {CHRONIC_REGISTRIES_DATA.map((reg) => (
                    <tr key={reg.disease} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#00334f]">{reg.disease}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">{reg.cohort} pts</td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-emerald-800">
                          {reg.upToDateCarePlan} ({Math.round((reg.upToDateCarePlan / reg.cohort) * 100)}%)
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-sky-800">
                        {reg.targetHbA1cMet} ({Math.round((reg.targetHbA1cMet / reg.cohort) * 100)}%)
                      </td>
                      <td className="p-3 text-right">
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          {reg.recallsDue} Due
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Screening & Immunisation Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Syringe className="w-4 h-4 text-sky-600" />
                National Immunization Programme (EPI Sri Lanka)
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Infant Schedule (BCG / Pentavalent / MMR)</span>
                  <span className="text-emerald-700 font-bold">98.4% (MoH Target 95%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-[98.4%]" />
                </div>

                <div className="flex justify-between font-semibold text-slate-700 pt-2">
                  <span>Rubella / HPV Immunisation (School Cohort)</span>
                  <span className="text-emerald-700 font-bold">92.6%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full w-[92.6%]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Activity className="w-4 h-4 text-purple-600" />
                Preventive Health & NCD Screenings (MoH / WWC)
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Cervical Screening (Pap / VIA 35y & 45y)</span>
                  <span className="text-purple-800 font-bold">81.2% Up-to-Date</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-[81.2%]" />
                </div>

                <div className="flex justify-between font-semibold text-slate-700 pt-2">
                  <span>Cardiovascular & Diabetes Risk Screening (35y+)</span>
                  <span className="text-purple-800 font-bold">76.5% Screened</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full w-[76.5%]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Specialist Referral & Lab Turnaround (SLMC)
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Consultant eReferrals Dispatched</span>
                  <span className="text-emerald-700 font-bold">99.2% &lt; 24 hrs</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700 pt-2">
                  <span>Urgent Lab Critical Alert Turnaround</span>
                  <span className="text-emerald-700 font-bold">100% Notified &lt; 1 hr</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700 pt-2">
                  <span>NMRA e-Prescription Fulfillment</span>
                  <span className="text-emerald-700 font-bold">96.8% Digital Dispense</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

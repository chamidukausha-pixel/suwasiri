import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Eye,
  FileCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Send,
  Lock,
  CreditCard,
  UserCheck,
  Sparkles,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { AuditLogEntry, Patient } from "../types";

interface Props {
  patients?: Patient[];
  logs?: AuditLogEntry[];
  onExportCsv?: () => void;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-109",
    timestamp: "2026-08-15 09:35:12",
    user: "Dr. Priyantha Silva",
    role: "Doctor",
    action: "Sent specialist referral",
    category: "REFERRAL",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    details: "Dispatched HealthLink EDI eReferral to Dr. K. Perera (Cardiology) with attached ECG & lipid panel.",
    ipAddress: "203.143.22.84"
  },
  {
    id: "log-108",
    timestamp: "2026-08-15 09:34:05",
    user: "Dr. Priyantha Silva",
    role: "Doctor",
    action: "Viewed pathology result",
    category: "PATHOLOGY",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    details: "Reviewed Fasting Blood Glucose (6.8 mmol/L) & HbA1c (6.8%). Acknowledged and filed to patient chart.",
    ipAddress: "203.143.22.84"
  },
  {
    id: "log-107",
    timestamp: "2026-08-15 09:33:18",
    user: "Dr. Priyantha Silva",
    role: "Doctor",
    action: "Created electronic prescription",
    category: "PRESCRIPTION",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    details: "Prescribed Metformin 500mg BD (Qty 100, 5 repeats) with Active Script List (ASL) eScript QR token generated.",
    ipAddress: "203.143.22.84"
  },
  {
    id: "log-106",
    timestamp: "2026-08-15 09:32:41",
    user: "Dr. Priyantha Silva",
    role: "Doctor",
    action: "Added diagnosis",
    category: "DIAGNOSIS",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    details: "Added coded diagnosis: Type 2 diabetes mellitus without complications (ICD-10: E11.9, SNOMED: 44054006).",
    ipAddress: "203.143.22.84"
  },
  {
    id: "log-105",
    timestamp: "2026-08-15 09:31:02",
    user: "Dr. Priyantha Silva",
    role: "Doctor",
    action: "Viewed patient record",
    category: "PATIENT_RECORD",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    details: "Opened full 16-Tab clinical EMR record for scheduled consultation #APT-992.",
    ipAddress: "203.143.22.84"
  },
  {
    id: "log-104",
    timestamp: "2026-08-15 09:15:30",
    user: "Sarah Perera",
    role: "Receptionist",
    action: "Checked in patient",
    category: "PATIENT_RECORD",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    details: "Patient arrived at reception and marked as 'WAITING IN LOBBY' for Dr. Priyantha Silva.",
    ipAddress: "203.143.22.85"
  },
  {
    id: "log-103",
    timestamp: "2026-08-15 09:02:11",
    user: "Dr. Anoja Senanayake",
    role: "Doctor",
    action: "Accessed My Health Record (MHR)",
    category: "MHR_ACCESS",
    patientId: "1028-LK",
    patientName: "Sunil Jayawardena",
    details: "Downloaded National Shared Health Summary from My Health Record gateway (PCEHR API).",
    ipAddress: "203.143.22.86"
  },
  {
    id: "log-102",
    timestamp: "2026-08-15 08:45:00",
    user: "Sarah Perera",
    role: "Receptionist",
    action: "Processed Medicare Bulk-Bill Claim",
    category: "BILLING",
    patientId: "4491-LK",
    patientName: "Kamala Wickramasinghe",
    details: "Submitted Medicare Benefits Schedule (MBS) Item 23 ($42.85) via Services Australia ECLIPSE portal.",
    ipAddress: "203.143.22.85"
  },
  {
    id: "log-101",
    timestamp: "2026-08-15 08:30:00",
    user: "Dr. Priyantha Silva",
    role: "Doctor",
    action: "Staff Login with 2FA TOTP",
    category: "AUTHENTICATION",
    details: "Authenticated via MFA TOTP token from Clinic Terminal 1. Session token issued.",
    ipAddress: "203.143.22.84"
  }
];

export default function AuditLogView({
  patients = [],
  logs = INITIAL_AUDIT_LOGS
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.patientId && log.patientId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || log.category === categoryFilter;
    const matchesUser = userFilter === "ALL" || log.user === userFilter;
    const matchesRole = roleFilter === "ALL" || log.role === roleFilter;

    return matchesSearch && matchesCategory && matchesUser && matchesRole;
  });

  const handleExportCsv = () => {
    const headers = "ID,Timestamp,User,Role,Category,Action,PatientID,PatientName,Details,IPAddress\n";
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.category}","${l.action}","${l.patientId || ""}","${l.patientName || ""}","${l.details.replace(/"/g, '""')}","${l.ipAddress || ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clinical_audit_trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00334f] text-white flex items-center justify-center shadow-xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#00334f] tracking-tight">
                Comprehensive Clinical & Medico-Legal Audit Trail
              </h1>
              <p className="text-xs text-slate-500">
                Tamper-evident, time-indexed event log capturing every clinical view, diagnosis, prescription, lab review, and referral.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Export Audit CSV (AHPRA / HIPAA)
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search action, patient, practitioner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#00334f]"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-700 bg-white"
            >
              <option value="ALL">All Categories ({logs.length})</option>
              <option value="PATIENT_RECORD">Patient Record Access</option>
              <option value="PRESCRIPTION">Prescription Generated</option>
              <option value="DIAGNOSIS">Diagnosis Added</option>
              <option value="PATHOLOGY">Pathology Results</option>
              <option value="REFERRAL">Referral Dispatched</option>
              <option value="BILLING">Billing & Medicare</option>
              <option value="MHR_ACCESS">My Health Record (MHR)</option>
              <option value="AUTHENTICATION">Authentication & Security</option>
            </select>
          </div>

          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-700 bg-white"
            >
              <option value="ALL">All Practitioners</option>
              <option value="Dr. Priyantha Silva">Dr. Priyantha Silva (Doctor)</option>
              <option value="Dr. Anoja Senanayake">Dr. Anoja Senanayake (Doctor)</option>
              <option value="Sarah Perera">Sarah Perera (Receptionist)</option>
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-700 bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="Doctor">Doctor</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Nurse">Nurse</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Feed */}
      <div className="bg-white border rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Chronological Clinical Event Stream ({filteredLogs.length} Records)</span>
          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable Cryptographic Log
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
          {filteredLogs.map((log) => {
            const timeOnly = log.timestamp.split(" ")[1] || log.timestamp;
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="p-4 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="text-center shrink-0 w-16 pt-0.5">
                    <span className="font-mono font-black text-slate-800 text-xs block">{timeOnly}</span>
                    <span className="text-[10px] text-slate-400 block">{log.timestamp.split(" ")[0]}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#00334f]">{log.user}</span>
                      <span className="bg-slate-200 px-1.5 py-0.2 rounded text-[10px] font-semibold text-slate-700">
                        {log.role}
                      </span>
                      <span className="font-semibold text-slate-800">• {log.action}</span>
                      {log.patientName && (
                        <span className="text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {log.patientName} ({log.patientId})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 sm:self-center">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      log.category === "PRESCRIPTION"
                        ? "bg-sky-100 text-sky-800"
                        : log.category === "DIAGNOSIS"
                        ? "bg-purple-100 text-purple-800"
                        : log.category === "PATHOLOGY"
                        ? "bg-amber-100 text-amber-800"
                        : log.category === "REFERRAL"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {log.category.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 hidden lg:inline-block">
                    IP: {log.ipAddress || "203.143.22.84"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#00334f]" />
                <h3 className="font-bold text-sm text-[#00334f]">Audit Log Event Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="font-semibold text-slate-800">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-bold text-sky-800">{selectedLog.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Staff User</span>
                  <span className="font-semibold text-slate-800">{selectedLog.user} ({selectedLog.role})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">IP Address</span>
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress || "203.143.22.84"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Clinical Action Summary:</span>
                <p className="font-bold text-slate-900 bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                  {selectedLog.action}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Full Technical Event Payload:</span>
                <p className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-lg leading-relaxed whitespace-pre-wrap">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

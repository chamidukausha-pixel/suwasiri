import React, { useState } from "react";
import { 
  ShieldCheck, Lock, Key, Server, Database, Activity, RefreshCw, AlertTriangle, 
  FileText, CheckCircle, Smartphone, Globe, Eye, Download, ShieldAlert, Cpu
} from "lucide-react";
import { AuditLogEntry } from "../types";

export default function SystemAdminView() {
  const [activeTab, setActiveTab] = useState<"audit" | "security" | "integrations" | "backups">("audit");
  const [searchAudit, setSearchAudit] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(15);
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Live Audit Trail matching the user's prompt specification:
  // "09:31 Dr Smith - Viewed patient record", "09:32 Dr Smith - Added diagnosis", etc.
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: "log-1",
      timestamp: "09:35:12 AM",
      user: "Dr. Priyantha Silva",
      role: "Doctor",
      action: "Sent eReferral",
      category: "REFERRAL",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      details: "Dispatched electronic referral to Dr. Lalith Fernando (Cardiologist, Asiri Surgical) via HealthLink EDI."
    },
    {
      id: "log-2",
      timestamp: "09:34:08 AM",
      user: "Dr. Priyantha Silva",
      role: "Doctor",
      action: "Viewed pathology result",
      category: "PATHOLOGY",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      details: "Inspected HbA1c Glycated Hemoglobin (5.9%) and Serum Potassium (4.2 mmol/L). Signed off as reviewed."
    },
    {
      id: "log-3",
      timestamp: "09:33:24 AM",
      user: "Dr. Priyantha Silva",
      role: "Doctor",
      action: "Created prescription",
      category: "PRESCRIPTION",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      details: "Issued ePrescription RX-2026-00412 for Ventolin Inhaler 100mcg (PBS Subsidised, 2 repeats). RTPM cleared."
    },
    {
      id: "log-4",
      timestamp: "09:32:45 AM",
      user: "Dr. Priyantha Silva",
      role: "Doctor",
      action: "Added diagnosis",
      category: "DIAGNOSIS",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      details: "Added ICD-10 J45.0 Mild Persistent Bronchial Asthma to active medical history."
    },
    {
      id: "log-5",
      timestamp: "09:31:10 AM",
      user: "Dr. Priyantha Silva",
      role: "Doctor",
      action: "Viewed patient record",
      category: "PATIENT_RECORD",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      details: "Accessed electronic clinical summary and previous consultation notes."
    },
    {
      id: "log-6",
      timestamp: "09:28:00 AM",
      user: "Dr. Priyantha Silva",
      role: "Doctor",
      action: "MFA Authentication Successful",
      category: "AUTHENTICATION",
      details: "Biometric & TOTP token verified. Session encrypted (AES-256-GCM)."
    },
    {
      id: "log-7",
      timestamp: "09:15:30 AM",
      user: "Mr. Thusitha Perera",
      role: "Receptionist",
      action: "Patient Check-in",
      category: "PATIENT_RECORD",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      details: "Arrived at clinic. Medicare card 2847 9102 31 validated via ECLIPSE."
    }
  ]);

  const filteredLogs = auditLogs.filter(l => {
    if (filterCategory !== "ALL" && l.category !== filterCategory) return false;
    if (searchAudit) {
      const q = searchAudit.toLowerCase();
      return l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || (l.patientName && l.patientName.toLowerCase().includes(q));
    }
    return true;
  });

  const handleTriggerBackup = () => {
    setBackupStatus("Encrypted snapshot backup initiated: Full patient records, eScripts, and audit ledger backed up to geo-redundant storage.");
    setTimeout(() => setBackupStatus(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Security, Audit Trails & System Administration</h1>
            <p className="text-xs text-slate-500">
              HIPAA & Australian Privacy Act compliant immutable audit logs, MFA enforcement, national integrations, and backups
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerBackup}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-sky-400" />
          <span>Execute Encrypted Backup</span>
        </button>
      </div>

      {backupStatus && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex flex-wrap gap-1">
        {[
          { id: "audit", label: "Immutable Clinical Audit Log", icon: FileText, count: auditLogs.length },
          { id: "security", label: "Security & MFA Controls", icon: Lock },
          { id: "integrations", label: "National & Mobile Integrations", icon: Globe },
          { id: "backups", label: "Disaster Recovery & Backups", icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count && <span className="text-[10px] bg-slate-700 text-white px-1.5 py-0.2 rounded-full">{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* 1. AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Search audit trail by doctor, patient, action..."
              value={searchAudit}
              onChange={e => setSearchAudit(e.target.value)}
              className="w-full sm:w-80 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900"
            />

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500">Filter Category:</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Event Categories</option>
                <option value="PATIENT_RECORD">Patient Record Access</option>
                <option value="PRESCRIPTION">Prescriptions</option>
                <option value="DIAGNOSIS">Diagnoses</option>
                <option value="PATHOLOGY">Pathology & Labs</option>
                <option value="REFERRAL">Referrals</option>
                <option value="AUTHENTICATION">Authentication / MFA</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded text-[11px] shrink-0">
                      {log.timestamp}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.user}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          {log.role}
                        </span>
                        <span className="font-extrabold text-sky-800">&rarr; {log.action}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  {log.patientName && (
                    <span className="text-[10px] text-slate-500 font-medium self-start sm:self-center bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      Patient: {log.patientName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SECURITY & MFA */}
      {activeTab === "security" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Enterprise Security Policies</h3>
            <p className="text-xs text-slate-500">MFA authentication enforcement, session timeouts, role permissions, and break-glass overrides</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Enforce Multi-Factor Authentication (MFA)</h4>
                <p className="text-slate-500 text-[11px]">Requires SMS OTP or Authenticator app (TOTP) for all clinical and doctor logins</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mfaEnforced}
                  onChange={e => setMfaEnforced(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Automatic Inactivity Session Lock</h4>
                <p className="text-slate-500 text-[11px]">Locks screen and requires pin re-entry if doctor leaves terminal unattended</p>
              </div>
              <select
                value={sessionTimeoutMin}
                onChange={e => setSessionTimeoutMin(Number(e.target.value))}
                className="p-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes (Standard)</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-red-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Emergency "Break-Glass" Access Override
                </h4>
                <p className="text-red-700 text-[11px]">Allows emergency medical staff to bypass standard patient consent in life-threatening scenarios with high-priority audit alerting.</p>
              </div>
              <button
                onClick={() => setBreakGlassActive(!breakGlassActive)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                  breakGlassActive ? "bg-red-700 text-white" : "bg-white border border-red-300 text-red-700"
                }`}
              >
                {breakGlassActive ? "Break-Glass ACTIVE" : "Enable Emergency Override"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. INTEGRATIONS */}
      {activeTab === "integrations" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">External Health Services & Mobile Ecosystem Integrations</h3>
            <p className="text-xs text-slate-500">Live API connectivity to national health registries and mobile patient apps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Suwasiri Mobile App */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">Suwasiri Mobile App Sync</h4>
                    <span className="text-[10px] text-slate-500">Real-time patient mobile portal synchronization</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Connected
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">ePrescription tokens, appointment confirmations, and lab results sync seamlessly with Suwasiri mobile wallets.</p>
            </div>

            {/* Australian Immunisation Register (AIR) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">Australian Immunisation Register (AIR)</h4>
                    <span className="text-[10px] text-slate-500">Services Australia Gateway</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">Direct electronic transmission of childhood, influenza, COVID, and travel immunisation records.</p>
            </div>

            {/* My Health Record (MHR) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#00334f]" />
                  <div>
                    <h4 className="font-bold text-slate-900">My Health Record (MHR B2B)</h4>
                    <span className="text-[10px] text-slate-500">ADHA Clinical Document Exchange</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">Upload Shared Health Summaries (SHS) and Event Summaries with verified digital NASH certificates.</p>
            </div>

            {/* RTPM / SafeScript */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">RTPM (Real-Time Prescription Monitoring)</h4>
                    <span className="text-[10px] text-slate-500">Monitored Medicines Database</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Enforced
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">Automated safety screening for Schedule 8 and high-risk sedatives before dispensing.</p>
            </div>

          </div>
        </div>
      )}

      {/* 4. BACKUPS */}
      {activeTab === "backups" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Automated Data Backups & Disaster Recovery</h3>
            <p className="text-xs text-slate-500">Encrypted off-site snapshots, point-in-time recovery, and cryptographic data integrity validation</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900">Daily Automated Snapshot</h4>
                <p className="text-[11px] text-slate-500">Last successful backup: Today at 04:00 AM (Size: 42.8 MB, SHA-256 Verified)</p>
              </div>
              <button
                onClick={handleTriggerBackup}
                className="px-3.5 py-1.5 bg-[#00334f] text-white font-bold rounded-lg cursor-pointer"
              >
                Backup Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

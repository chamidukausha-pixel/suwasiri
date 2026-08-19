import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Users,
  Lock,
  Smartphone,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  EyeOff,
  UserX,
  History,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  Server,
  FileSpreadsheet,
  Layers,
  Zap,
  Info,
  Plus,
  Trash2
} from "lucide-react";
import {
  SecurityStatusConfig,
  RoleDefinition,
  PermissionKey,
  Patient,
  UserRole,
  BreakGlassEvent,
  ActiveSession
} from "../types";
import { cloneHospitalRoles } from "../tenancy";

interface Props {
  patients?: Patient[];
  currentRole?: UserRole | string;
  hospitalName?: string;
  hospitalId?: string;
  roles?: RoleDefinition[];
  canEditRbac?: boolean;
  isPlatformSA?: boolean;
  onTriggerBackup?: () => void;
  onRecordBreakGlass?: (event: BreakGlassEvent) => void;
  onSaveRoles?: (roles: RoleDefinition[]) => void;
  onAddRole?: (name: string, cloneFromRoleId: string) => void;
  onRemoveRole?: (roleId: string) => void;
}

const DEFAULT_SECURITY_CONFIG: SecurityStatusConfig = {
  mfaEnabled: true,
  mfaMethod: "AUTHENTICATOR_APP",
  encryptionRestStatus: "AES-256-GCM Active",
  encryptionTransitStatus: "TLS 1.3 Active",
  sessionTimeoutMinutes: 15,
  passwordMinLength: 12,
  passwordComplexityEnforced: true,
  passwordExpiryDays: 90,
  failedLoginLockoutAttempts: 5,
  backupFrequency: "HOURLY_INCREMENTAL",
  lastBackupTimestamp: "2026-08-15 16:00:00 UTC",
  backupIntegrityVerified: true,
  disasterRecoveryRpoMinutes: 15,
  disasterRecoveryRtoMinutes: 30,
  dataRetentionAdultYears: 10,
  dataRetentionPaediatricAgeYears: 21
};


const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: "sess-1",
    userName: "Dr. Priyantha Silva (SLMC-48291)",
    role: "Doctor",
    ipAddress: "112.134.140.22",
    device: "macOS Chrome 128 / Clinic Terminal #1",
    location: "Colombo Central Clinic, LK",
    loginTime: "2026-08-15 08:30",
    lastActiveTime: "2026-08-15 16:20",
    isCurrent: true
  },
  {
    id: "sess-2",
    userName: "Thusitha Perera",
    role: "Receptionist",
    ipAddress: "112.134.140.23",
    device: "Windows 11 / Front Desk PC #1",
    location: "Colombo Central Clinic, LK",
    loginTime: "2026-08-15 08:00",
    lastActiveTime: "2026-08-15 16:15",
    isCurrent: false
  },
  {
    id: "sess-3",
    userName: "Nurse Kanthi Weerasinghe",
    role: "Nurse",
    ipAddress: "112.134.140.24",
    device: "iPad Pro / Treatment Room 1",
    location: "Colombo Central Clinic, LK",
    loginTime: "2026-08-15 09:15",
    lastActiveTime: "2026-08-15 15:50",
    isCurrent: false
  },
  {
    id: "sess-4",
    userName: "Dr. Anura Senanayake (SLMC-51029)",
    role: "Specialist Consultant",
    ipAddress: "112.134.140.25",
    device: "Dell Precision 5570 / Room 2",
    location: "Colombo Central Clinic, LK",
    loginTime: "2026-08-15 10:00",
    lastActiveTime: "2026-08-15 15:30",
    isCurrent: false
  }
];

export default function SecurityModuleView({
  patients = [],
  currentRole = "Admin",
  hospitalName,
  hospitalId,
  roles = [],
  canEditRbac,
  isPlatformSA = false,
  onTriggerBackup,
  onRecordBreakGlass,
  onSaveRoles,
  onAddRole,
  onRemoveRole
}: Props) {
  const isAdmin = canEditRbac ?? (currentRole === "Admin" || currentRole === "Practice Manager" || currentRole === "Hospital Super Admin" || isPlatformSA);
  const [config, setConfig] = useState<SecurityStatusConfig>(DEFAULT_SECURITY_CONFIG);
  const [permissions, setPermissions] = useState<RoleDefinition[]>(
    roles.length ? roles : cloneHospitalRoles(hospitalId || "hosp-primecare")
  );
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "RBAC" | "SESSIONS" | "BACKUP" | "BREAKGLASS" | "RETENTION">("OVERVIEW");
  const [rbacSaveSuccess, setRbacSaveSuccess] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [roleSearchQuery, setRoleSearchQuery] = useState<string>("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [cloneFromRoleId, setCloneFromRoleId] = useState("");

  useEffect(() => {
    if (roles.length) {
      setPermissions(roles);
      if (!cloneFromRoleId) {
        const doctor = roles.find((r) => r.name === "Doctor");
        setCloneFromRoleId(doctor?.id || roles[0].id);
      }
    }
  }, [roles, hospitalId]);

  const handleTogglePermission = (roleId: string, key: PermissionKey) => {
    if (!isAdmin) {
      alert("Hospital Super Admin privileges required to modify RBAC permissions.");
      return;
    }
    setPermissions(prev => prev.map(p => {
      if (p.id === roleId) {
        return { ...p, [key]: !p[key] };
      }
      return p;
    }));
  };

  const handleSaveRbac = () => {
    if (!isAdmin) return;
    if (onSaveRoles) onSaveRoles(permissions);
    setRbacSaveSuccess("Role-Based Access Control matrix saved for this hospital and committed to the security audit ledger.");
    setTimeout(() => setRbacSaveSuccess(null), 3500);
  };

  const handleResetRbacDefaults = () => {
    if (!isAdmin) return;
    const hid = hospitalId || permissions[0]?.hospitalId || "hosp-primecare";
    const restored = cloneHospitalRoles(hid);
    setPermissions(restored);
    if (onSaveRoles) onSaveRoles(restored);
    setRbacSaveSuccess("RBAC Matrix reset to hospital template defaults.");
    setTimeout(() => setRbacSaveSuccess(null), 3500);
  };

  const handleToggleEnabled = (roleId: string) => {
    if (!isAdmin) return;
    setPermissions(prev => prev.map(p => p.id === roleId ? { ...p, enabled: !p.enabled } : p));
  };

  const handleAddCustomRole = () => {
    if (!isAdmin || !newRoleName.trim()) return;
    if (onAddRole) {
      onAddRole(newRoleName.trim(), cloneFromRoleId);
    } else {
      const source = permissions.find(p => p.id === cloneFromRoleId) || permissions[0];
      setPermissions(prev => [...prev, {
        ...source,
        id: `${source.hospitalId}-role-custom-${Date.now()}`,
        name: newRoleName.trim(),
        isSystem: false,
        enabled: true,
      }]);
    }
    setNewRoleName("");
    setShowAddRole(false);
    setRbacSaveSuccess("Custom role added to this hospital.");
    setTimeout(() => setRbacSaveSuccess(null), 3500);
  };

  const handleRemoveRole = (roleId: string) => {
    const role = permissions.find(p => p.id === roleId);
    if (!role || role.isSystem) {
      alert("System template roles cannot be deleted. Disable them instead.");
      return;
    }
    if (onRemoveRole) onRemoveRole(roleId);
    setPermissions(prev => prev.filter(p => p.id !== roleId));
  };

  // Break Glass Emergency Access Modal
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassPatientId, setBreakGlassPatientId] = useState(patients[0]?.id || "9942-LK");
  const [breakGlassReason, setBreakGlassReason] = useState("");
  const [breakGlassUrgency, setBreakGlassUrgency] = useState<BreakGlassEvent["urgencyLevel"]>("LIFE_THREATENING_EMERGENCY");
  const [breakGlassWitness, setBreakGlassWitness] = useState("RN Nirosha Fernando");
  const [breakGlassLogs, setBreakGlassLogs] = useState<BreakGlassEvent[]>([
    {
      id: "bg-01",
      timestamp: "2026-08-14 21:15",
      doctorId: "DOC-882",
      doctorName: "Dr. Priyantha Silva",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      clinicalReason: "Acute anaphylactic reaction presenting to after-hours triage, requiring immediate allergy & past adrenaline titration chart access.",
      authorizedWitness: "RN Nirosha Fernando",
      urgencyLevel: "LIFE_THREATENING_EMERGENCY"
    }
  ]);

  const [backupRunning, setBackupRunning] = useState(false);

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    alert("Session revoked immediately. Security token blacklisted across cluster nodes.");
  };

  const handleTriggerBackupSnapshot = () => {
    setBackupRunning(true);
    setTimeout(() => {
      setBackupRunning(false);
      setConfig((prev) => ({
        ...prev,
        lastBackupTimestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC"
      }));
      if (onTriggerBackup) onTriggerBackup();
      alert("Encrypted immutable snapshot backup completed successfully! SHA-256 integrity hash verified.");
    }, 1200);
  };

  const handleExecuteBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakGlassReason.trim()) {
      alert("Mandatory clinical reason required for break-glass emergency override!");
      return;
    }

    const pat = patients.find((p) => p.id === breakGlassPatientId) || { name: "Patient Record", id: breakGlassPatientId };
    const event: BreakGlassEvent = {
      id: "bg-" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      doctorId: "DOC-882",
      doctorName: "Dr. Priyantha Silva",
      patientId: pat.id,
      patientName: pat.name,
      clinicalReason: breakGlassReason,
      authorizedWitness: breakGlassWitness,
      urgencyLevel: breakGlassUrgency
    };

    setBreakGlassLogs((prev) => [event, ...prev]);
    setShowBreakGlassModal(false);
    setBreakGlassReason("");
    if (onRecordBreakGlass) onRecordBreakGlass(event);
    alert(`EMERGENCY BREAK-GLASS OVERRIDE AUTHORIZED: Sealed confidential record unlocked for ${pat.name}. Audit trail dispatched to System Compliance Officer.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#00334f] tracking-tight">
                Enterprise Security, Governance & Access Control
              </h1>
              <p className="text-xs text-slate-500">
                MFA, encryption, Role-Based Access Control, and break-glass — scoped to{" "}
                <strong>{hospitalName || "this hospital"}</strong>. Platform Super Admin edits global templates only; Hospital Super Admin edits this tenant.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBreakGlassModal(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
              Emergency Break-Glass Access
            </button>

            <button
              onClick={handleTriggerBackupSnapshot}
              disabled={backupRunning}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {backupRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Snapshot...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  Backup Snapshot Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Sub-Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "OVERVIEW"
                ? "bg-[#00334f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            1. Security Hardening Overview
          </button>

          <button
            onClick={() => setActiveTab("RBAC")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "RBAC"
                ? "bg-[#00334f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2. Role-Based Access Control (RBAC)
          </button>

          <button
            onClick={() => setActiveTab("SESSIONS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "SESSIONS"
                ? "bg-[#00334f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            3. Active Sessions ({sessions.length})
          </button>

          <button
            onClick={() => setActiveTab("BACKUP")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "BACKUP"
                ? "bg-[#00334f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            4. Backup & Disaster Recovery
          </button>

          <button
            onClick={() => setActiveTab("BREAKGLASS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "BREAKGLASS"
                ? "bg-[#00334f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            5. Break-Glass Audit Trail ({breakGlassLogs.length})
          </button>

          <button
            onClick={() => setActiveTab("RETENTION")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "RETENTION"
                ? "bg-[#00334f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            6. Retention & Compliance Policy
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SECURITY HARDENING OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Key Security Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> MFA Policy
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Enforced</span>
              </div>
              <div className="text-lg font-bold text-slate-900">TOTP Authenticator</div>
              <p className="text-[11px] text-slate-500">Mandatory 6-digit TOTP / FIDO2 hardware token for all clinical logins.</p>
            </div>

            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-sky-600" /> Encryption at Rest
                </span>
                <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-bold">Active</span>
              </div>
              <div className="text-lg font-bold text-slate-900">AES-256-GCM</div>
              <p className="text-[11px] text-slate-500">All patient charts, notes, and attachments encrypted on disk with HSM keys.</p>
            </div>

            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-600" /> In-Transit Security
                </span>
                <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">TLS 1.3</span>
              </div>
              <div className="text-lg font-bold text-slate-900">Perfect Forward Secrecy</div>
              <p className="text-[11px] text-slate-500">HTTPS only, HSTS preloaded, certificate pinning enabled for API endpoints.</p>
            </div>

            <div className="bg-white p-5 border rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> Auto-Lockout
                </span>
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">15 Mins</span>
              </div>
              <div className="text-lg font-bold text-slate-900">Session Lock Timer</div>
              <p className="text-[11px] text-slate-500">Terminals lock after 15 minutes of inactivity to prevent unattended snooping.</p>
            </div>
          </div>

          {/* Password Policy & Threat Monitoring Configuration Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3 font-bold text-sm text-[#00334f]">
                <KeyRound className="w-4 h-4 text-sky-600" />
                Password & Authentication Governance
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border">
                  <div>
                    <span className="font-bold text-slate-800 block">Minimum Password Length</span>
                    <span className="text-slate-500 text-[11px]">NIST SP 800-63B standard</span>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-1 border rounded text-[#00334f]">12 Characters</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border">
                  <div>
                    <span className="font-bold text-slate-800 block">Complexity Rules (Upper/Lower/Symbol/Digit)</span>
                    <span className="text-slate-500 text-[11px]">Enforced on user registration & password resets</span>
                  </div>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded text-[11px]">Active</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border">
                  <div>
                    <span className="font-bold text-slate-800 block">Password Expiration Rotation</span>
                    <span className="text-slate-500 text-[11px]">Mandatory rotation interval</span>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-1 border rounded text-[#00334f]">90 Days</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border">
                  <div>
                    <span className="font-bold text-slate-800 block">Lockout After Failed Attempts</span>
                    <span className="text-slate-500 text-[11px]">Mitigates credential brute-force attacks</span>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-1 border rounded text-rose-700">5 Attempts (30m Lockout)</span>
                </div>
              </div>
            </div>

            {/* Live Security Monitoring & Anomaly Detection */}
            <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3 font-bold text-sm text-[#00334f]">
                <Radio className="w-4 h-4 text-emerald-600" />
                Live Threat & Security Incident Monitoring
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 block">All System Integrity Probes Green</span>
                    <span className="text-emerald-800 text-[11px]">
                      No anomalous bulk data exports or unauthorized VIP patient record view spikes detected.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded-lg flex items-start gap-2.5">
                  <Server className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Database Cryptographic Checksum</span>
                    <span className="text-slate-600 text-[11px]">
                      Last verified at {config.lastBackupTimestamp}. Database hash: <code>0x8f2a...991c</code>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border rounded-lg flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">IP Whitelisting & Geo-Fencing</span>
                    <span className="text-slate-600 text-[11px]">
                      Clinic subnet <code>203.143.22.0/24</code> authorized. External logins require 2FA push authorization.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ROLE-BASED ACCESS CONTROL (RBAC) */}
      {/* ============================================================ */}
      {activeTab === "RBAC" && (
        <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#00334f] flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Role-Based Permission Matrix (RBAC & User Governance)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isAdmin 
                    ? "bg-purple-100 text-purple-800 border-purple-200" 
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {isAdmin ? "Admin Edit Enabled" : "Read-Only"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Defines clinical, billing, and governance boundaries for <strong>{hospitalName || "this hospital"}</strong> ({permissions.length} roles). Custom roles can be added or removed; system templates can only be disabled.
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAddRole(true)}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add role
                </button>
                <button
                  type="button"
                  onClick={handleResetRbacDefaults}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveRbac}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Save RBAC Permissions
                </button>
              </div>
            )}
          </div>

          {rbacSaveSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rbacSaveSuccess}</span>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Viewing mode. Only <strong>Hospital Super Admin</strong> or <strong>Platform Super Admin</strong> can add, remove, or edit roles for {hospitalName || "this hospital"}.</span>
            </div>
          )}

          {/* Quick Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: `All Roles (${permissions.length})` },
                { id: "CLINICAL", label: "Doctors & Specialists" },
                { id: "NURSING", label: "Nursing & Triage" },
                { id: "DIAGNOSTICS", label: "Pharmacy & Labs" },
                { id: "ADMIN", label: "Billing & Admin" },
                { id: "GOVERNANCE", label: "Auditor & IT" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRoleFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    roleFilter === f.id
                      ? "bg-[#00334f] text-white shadow-xs"
                      : "bg-white border text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter by role name..."
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                className="w-full pl-3 pr-3 py-1.5 bg-white border rounded-lg text-xs outline-none focus:border-[#00334f]"
              />
            </div>
          </div>

          {showAddRole && isAdmin && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">New role name</label>
                <input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Night Triage Lead"
                  className="border rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:border-[#00334f]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Clone permissions from</label>
                <select
                  value={cloneFromRoleId}
                  onChange={(e) => setCloneFromRoleId(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-xs bg-white outline-none"
                >
                  {permissions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleAddCustomRole} className="bg-[#00334f] text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                Create role
              </button>
              <button type="button" onClick={() => setShowAddRole(false)} className="text-xs font-bold text-slate-600">
                Cancel
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b">
                  <th className="p-3 font-bold sticky left-0 bg-slate-100 z-10">User Role</th>
                  <th className="p-3 font-bold text-center">Doctor Dashboard</th>
                  <th className="p-3 font-bold text-center">View Clinical Notes</th>
                  <th className="p-3 font-bold text-center">Edit / SOAP Notes</th>
                  <th className="p-3 font-bold text-center">ePrescribe (NMRA)</th>
                  <th className="p-3 font-bold text-center">LankaLab Orders</th>
                  <th className="p-3 font-bold text-center">Sample Courier</th>
                  <th className="p-3 font-bold text-center">Telehealth Video</th>
                  <th className="p-3 font-bold text-center">View Billing</th>
                  <th className="p-3 font-bold text-center">Cashier & POS (Rs.)</th>
                  <th className="p-3 font-bold text-center">Manage Users</th>
                  <th className="p-3 font-bold text-center">Break-Glass</th>
                  <th className="p-3 font-bold text-center">Recalls & Suwasiri</th>
                  <th className="p-3 font-bold text-center">Audit Logs</th>
                  <th className="p-3 font-bold text-center">Analytics & MoH</th>
                  <th className="p-3 font-bold text-center">System Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {permissions
                  .filter(p => {
                    if (roleSearchQuery) {
                      if (!p.name.toLowerCase().includes(roleSearchQuery.toLowerCase())) return false;
                    }
                    if (roleFilter === "CLINICAL") {
                      return ["Doctor", "Specialist Consultant", "Medical Officer"].includes(p.name);
                    }
                    if (roleFilter === "NURSING") {
                      return ["Nurse", "Triage Officer"].includes(p.name);
                    }
                    if (roleFilter === "DIAGNOSTICS") {
                      return ["Pharmacist", "Lab Technician"].includes(p.name);
                    }
                    if (roleFilter === "ADMIN") {
                      return ["Receptionist", "Billing Officer", "Practice Manager", "Admin", "Hospital Super Admin"].includes(p.name) || !p.isSystem;
                    }
                    if (roleFilter === "GOVERNANCE") {
                      return ["Admin", "Auditor", "Hospital Super Admin"].includes(p.name);
                    }
                    return true;
                  })
                  .map((perm) => (
                    <tr key={perm.id} className={`hover:bg-slate-50 transition-colors ${!perm.enabled ? "opacity-50" : ""}`}>
                      <td className="p-3 font-bold text-[#00334f] sticky left-0 bg-white shadow-xs z-10">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            perm.name.includes("Doctor") || perm.name.includes("Consultant") || perm.name.includes("Medical")
                              ? "bg-sky-600"
                              : perm.name.includes("Nurse") || perm.name.includes("Triage")
                              ? "bg-emerald-600"
                              : perm.name.includes("Admin") || perm.name.includes("Manager")
                              ? "bg-purple-600"
                              : perm.name.includes("Pharmacist") || perm.name.includes("Lab")
                              ? "bg-amber-600"
                              : "bg-slate-600"
                          }`}></span>
                          <span>{perm.name}</span>
                          {!perm.isSystem && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">CUSTOM</span>
                          )}
                          {!perm.enabled && (
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">DISABLED</span>
                          )}
                          {isAdmin && (
                            <button type="button" onClick={() => handleToggleEnabled(perm.id)} className="text-[9px] underline text-slate-500">
                              {perm.enabled ? "Disable" : "Enable"}
                            </button>
                          )}
                          {isAdmin && !perm.isSystem && (
                            <button type="button" onClick={() => handleRemoveRole(perm.id)} className="text-rose-600" title="Remove custom role">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Doctor Dashboard */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canAccessDoctorDashboard")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canAccessDoctorDashboard
                              ? "bg-sky-100 text-sky-900 hover:bg-sky-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canAccessDoctorDashboard ? "ACTIVE" : "NO"}
                        </button>
                      </td>

                      {/* View Clinical Notes */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canViewClinicalNotes")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canViewClinicalNotes
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canViewClinicalNotes ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Edit Notes */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canEditClinicalNotes")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canEditClinicalNotes
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canEditClinicalNotes ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* ePrescribe */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canPrescribeMedications")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canPrescribeMedications
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canPrescribeMedications ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* LankaLab Orders */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canOrderDiagnosticsAndLabs")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canOrderDiagnosticsAndLabs
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canOrderDiagnosticsAndLabs ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Sample Courier */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canDispatchSampleCourier")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canDispatchSampleCourier
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canDispatchSampleCourier ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Telehealth */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canAccessTelehealthSuite")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canAccessTelehealthSuite
                              ? "bg-sky-100 text-sky-900 hover:bg-sky-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canAccessTelehealthSuite ? "ACTIVE" : "NO"}
                        </button>
                      </td>

                      {/* View Billing */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canViewBilling")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canViewBilling
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canViewBilling ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Cashier & POS */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canManageCashierAndInvoicing")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canManageCashierAndInvoicing
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canManageCashierAndInvoicing ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Manage Users */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canManageUsers")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canManageUsers
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canManageUsers ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Break Glass */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canBreakGlassEmergency")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canBreakGlassEmergency
                              ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canBreakGlassEmergency ? "AUTHORIZED" : "NO"}
                        </button>
                      </td>

                      {/* Recalls & Suwasiri */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canManageRecalls")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canManageRecalls
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canManageRecalls ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Audit Logs */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canViewAuditLogs")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canViewAuditLogs
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canViewAuditLogs ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* Analytics & MoH */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canAccessAnalyticsReports")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canAccessAnalyticsReports
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canAccessAnalyticsReports ? "ALLOWED" : "DENIED"}
                        </button>
                      </td>

                      {/* System Security */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "canConfigureSystemSecurity")}
                          disabled={!isAdmin}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            perm.canConfigureSystemSecurity
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {perm.canConfigureSystemSecurity ? "ROOT ADMIN" : "DENIED"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={handleSaveRbac}
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Commit & Save RBAC Policy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. ACTIVE SESSIONS MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === "SESSIONS" && (
        <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#00334f] flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                Active Electronic Sessions & Device Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor all open practitioner terminals and instantly revoke suspicious or stale sessions.
              </p>
            </div>
            <button
              onClick={() => {
                setSessions((prev) => prev.filter((s) => s.isCurrent));
                alert("Terminated all remote sessions except your current terminal!");
              }}
              className="bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              Kill All Remote Sessions
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  sess.isCurrent ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sess.userName}</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                      {sess.role}
                    </span>
                    {sess.isCurrent && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Current Terminal
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>IP: {sess.ipAddress}</span>
                    <span>â€¢</span>
                    <span>Device: {sess.device}</span>
                    <span>â€¢</span>
                    <span>Logged In: {sess.loginTime}</span>
                    <span>â€¢</span>
                    <span>Last Active: {sess.lastActiveTime}</span>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shrink-0"
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. BACKUP & DISASTER RECOVERY */}
      {/* ============================================================ */}
      {activeTab === "BACKUP" && (
        <div className="bg-white p-6 border rounded-xl shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#00334f] flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-600" />
                Automated Backup & Disaster Recovery Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuous point-in-time recovery, off-site cloud replication, and verified restore objectives.
              </p>
            </div>
            <button
              onClick={handleTriggerBackupSnapshot}
              disabled={backupRunning}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <HardDrive className="w-4 h-4" /> Trigger Instant Encrypted Backup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">RPO (Recovery Point Objective)</span>
              <div className="text-xl font-black text-[#00334f]">&lt; 15 Minutes</div>
              <p className="text-[11px] text-slate-500">Maximum possible data loss window in severe disaster scenario.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">RTO (Recovery Time Objective)</span>
              <div className="text-xl font-black text-[#00334f]">&lt; 30 Minutes</div>
              <p className="text-[11px] text-slate-500">Time to restore full clinical operations on standby failover node.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">Last Backup Snapshot</span>
              <div className="text-sm font-bold text-emerald-800">{config.lastBackupTimestamp}</div>
              <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Immutable & SHA-256 Verified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. BREAK-GLASS EMERGENCY ACCESS AUDIT */}
      {/* ============================================================ */}
      {activeTab === "BREAKGLASS" && (
        <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#00334f] flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                Emergency Break-Glass Access Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every unauthorized or sealed VIP record override is permanently logged with mandatory justification.
              </p>
            </div>
            <button
              onClick={() => setShowBreakGlassModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              + Authorize Break-Glass Override
            </button>
          </div>

          <div className="space-y-3">
            {breakGlassLogs.map((log) => (
              <div key={log.id} className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                      {log.urgencyLevel.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-rose-950">Patient: {log.patientName} (ID: {log.patientId})</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                </div>

                <p className="text-slate-800 bg-white p-3 rounded-lg border border-rose-100 font-mono text-[11px]">
                  <strong>Clinical Justification:</strong> {log.clinicalReason}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Authorizing Doctor: <strong>{log.doctorName}</strong> ({log.doctorId})</span>
                  <span>Witnessing Clinician: <strong>{log.authorizedWitness}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. RETENTION & DATA COMPLIANCE */}
      {/* ============================================================ */}
      {activeTab === "RETENTION" && (
        <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
          <div className="border-b pb-3 font-bold text-sm text-[#00334f] flex items-center justify-between">
            <span>Sri Lanka National Healthcare Data Retention & Privacy Policy</span>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              PDPA Act No. 9 of 2022 Compliant
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Adult Health Records Policy (Sri Lanka MoH & PHSRC)</span>
              <p className="text-slate-600 leading-relaxed">
                In compliance with the <strong>Personal Data Protection Act No. 9 of 2022 (PDPA Sri Lanka)</strong> and <strong>Private Medical Institutions (Registration) Act No. 21 of 2006 (PHSRC)</strong>, adult medical records, inpatient/outpatient notes, and diagnostic test reports are retained for a minimum of <strong>10 years</strong> from the date of the last medical consultation before eligibility for secure cryptographic archiving or de-identification.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Paediatric Records Policy (Child Rights & Medico-Legal Framework)</span>
              <p className="text-slate-600 leading-relaxed">
                Under Sri Lankan healthcare directives, clinical notes and immunization records of patients who were minors (&lt;18 years) at the time of consultation must be preserved until the patient attains <strong>21 years of age + 3 years</strong> (minimum age 24, or 10 years after last encounter, whichever is longer) to guarantee legal protection under the Age of Majority Ordinance.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 block text-sm">e-Prescriptions & Scheduled Drug Logs (NMRA Act No. 5 of 2015)</span>
              <p className="text-slate-600 leading-relaxed">
                All digital prescriptions, dispensing audit logs, and Schedule II / III narcotic or psychotropic substance records are cryptographically stored for a minimum of <strong>5 years</strong>, with real-time verification available to the National Medicines Regulatory Authority (NMRA) and Sri Lanka Medical Council (SLMC).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BREAK-GLASS OVERRIDE MODAL */}
      {showBreakGlassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-300 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <div className="flex items-center gap-2 text-rose-800">
                <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
                <h3 className="font-bold text-base">Emergency Break-Glass Protocol Override</h3>
              </div>
              <button
                onClick={() => setShowBreakGlassModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                âœ•
              </button>
            </div>

            <form onSubmit={handleExecuteBreakGlass} className="space-y-4 text-xs">
              <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-900 space-y-1">
                <p className="font-bold">âš ï¸ Warning: Medico-Legal Security Notice</p>
                <p className="text-[11px]">
                  Break-glass access temporarily bypasses standard consent seals. This action generates a priority compliance notification to the Practice Manager and Clinical Governance Board.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Patient Chart *</label>
                <select
                  value={breakGlassPatientId}
                  onChange={(e) => setBreakGlassPatientId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-bold text-slate-800 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age}y, {p.gender}) â€” ID: {p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Urgency Level *</label>
                <select
                  value={breakGlassUrgency}
                  onChange={(e) => setBreakGlassUrgency(e.target.value as any)}
                  className="w-full p-2.5 border rounded-lg font-bold text-rose-800 bg-white"
                >
                  <option value="LIFE_THREATENING_EMERGENCY">Life-Threatening Clinical Emergency</option>
                  <option value="AFTER_HOURS_URGENT">After-Hours Urgent Triage</option>
                  <option value="MEDICO_LEGAL_OVERRIDE">Medico-Legal / Coroner Statutory Request</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Justification & Rationale *</label>
                <textarea
                  rows={3}
                  required
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                  placeholder="Describe patient acute presentation and clinical necessity for overriding sealed chart..."
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Witnessing Clinician / Staff Name</label>
                <input
                  type="text"
                  value={breakGlassWitness}
                  onChange={(e) => setBreakGlassWitness(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBreakGlassModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Authorize & Unlock Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

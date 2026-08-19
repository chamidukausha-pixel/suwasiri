import React from "react";
import { ShieldCheck, Building2, MapPin, LogOut } from "lucide-react";
import type { Branch, Hospital, RoleDefinition, StaffMembership } from "../types";

interface Props {
  displayName: string;
  hospitals: Hospital[];
  branches: Branch[];
  roles: RoleDefinition[];
  memberships: StaffMembership[];
  userId: string;
  hospitalId: string;
  branchId: string;
  roleId: string;
  isPlatformSA: boolean;
  isPatientOnly: boolean;
  onSelectHospital: (hospitalId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onSignOut: () => void;
}

export default function RoleSwitcher({
  displayName,
  hospitals,
  branches,
  roles,
  memberships,
  userId,
  hospitalId,
  branchId,
  roleId,
  isPlatformSA,
  isPatientOnly,
  onSelectHospital,
  onSelectBranch,
  onSignOut,
}: Props) {
  const userMemberships = memberships.filter((m) => m.userId === userId && m.active);
  const hospitalOptions = hospitals.filter((h) => userMemberships.some((m) => m.hospitalId === h.id));
  const membership = userMemberships.find((m) => m.hospitalId === hospitalId);
  const role = roles.find((r) => r.id === roleId);
  const assignedBranches = branches.filter((b) => membership?.branchIds.includes(b.id));

  return (
    <div className="bg-slate-100 p-2 border-b flex flex-wrap justify-between items-center text-xs px-6 gap-3 print:hidden">
      <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-slate-600" />
        <span>Signed in</span>
        <span className="normal-case tracking-normal font-semibold text-slate-800">{displayName}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-sans">
        {!isPlatformSA && !isPatientOnly && hospitalOptions.length > 0 && (
          <label className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={hospitalId}
              onChange={(e) => onSelectHospital(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-[#00334f] max-w-[240px]"
            >
              {hospitalOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.status === "SUSPENDED" ? "(suspended)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {!isPlatformSA && !isPatientOnly && assignedBranches.length > 0 && (
          <label className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={branchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-[#00334f] max-w-[280px]"
            >
              {assignedBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <span className="px-2 py-1 rounded bg-[#00334f] text-white font-bold">
          {isPlatformSA ? "Platform Super Admin" : isPatientOnly ? "Patient" : role?.name || "No staff role"}
        </span>

        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-1 px-2 py-1 border border-slate-300 rounded bg-white font-bold text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

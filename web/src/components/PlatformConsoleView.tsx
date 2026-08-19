import React, { useState } from "react";
import { Building2, Plus, ShieldAlert, UserCheck } from "lucide-react";
import type { Hospital, RoleDefinition, StaffMembership, StaffUser } from "../types";

interface Props {
  hospitals: Hospital[];
  staffUsers: StaffUser[];
  memberships: StaffMembership[];
  roles: RoleDefinition[];
  onCreateHospital: (name: string) => void;
  onToggleHospitalStatus: (hospitalId: string, status: "ACTIVE" | "SUSPENDED") => void;
}

export default function PlatformConsoleView({
  hospitals,
  staffUsers,
  memberships,
  roles,
  onCreateHospital,
  onToggleHospitalStatus,
}: Props) {
  const [newName, setNewName] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#00334f]">Platform Super Admin</h1>
            <p className="text-xs text-slate-500">
              Create and suspend hospital tenants. Clinical charts stay isolated inside each hospital — this console has no routine EMR access.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-700" />
              Hospital tenants
            </h2>
            <p className="text-xs text-slate-500">Each hospital receives cloned RBAC templates. Staff may hold memberships in more than one hospital.</p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              onCreateHospital(newName.trim());
              setNewName("");
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New hospital name"
              className="border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#00334f]"
            />
            <button type="submit" className="bg-[#00334f] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Create hospital
            </button>
          </form>
        </div>

        <div className="grid gap-3">
          {hospitals.map((h) => {
            const hsaRoleIds = roles.filter((r) => r.hospitalId === h.id && r.name === "Hospital Super Admin").map((r) => r.id);
            const admins = memberships
              .filter((m) => m.hospitalId === h.id && hsaRoleIds.includes(m.roleId) && m.active)
              .map((m) => staffUsers.find((u) => u.id === m.userId)?.name)
              .filter(Boolean);
            return (
              <div key={h.id} className="border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-slate-900">{h.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{h.id}</p>
                  <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Hospital Super Admin: {admins.length ? admins.join(", ") : "Not assigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    h.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {h.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleHospitalStatus(h.id, h.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                    className="text-xs font-bold border px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    {h.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Building2, Plus, ShieldAlert, UserCheck, Users } from "lucide-react";
import type { Branch, Hospital, RoleDefinition, StaffMembership, StaffProvider, StaffUser } from "../types";
import { DOCTOR_SPECIALTIES } from "../catalogs/doctorSpecialties";
import { SRI_LANKA_DISTRICTS } from "../catalogs/sriLankaDistricts";

interface Props {
  hospitals: Hospital[];
  staffUsers: StaffUser[];
  memberships: StaffMembership[];
  roles: RoleDefinition[];
  branches: Branch[];
  staffDirectory: StaffProvider[];
  onCreateHospital: (name: string, district: string) => void;
  onToggleHospitalStatus: (hospitalId: string, status: "ACTIVE" | "SUSPENDED") => void;
  onCreateStaff: (payload: {
    hospitalId: string;
    name: string;
    email: string;
    roleName: string;
    branchIds: string[];
    phone?: string;
    specialty?: string;
  }) => Promise<void> | void;
  onRemoveStaff: (payload: { staffId: string; hospitalId: string }) => Promise<void> | void;
}

const STAFF_ROLES = ["Doctor", "Receptionist", "Nurse", "Practice Manager", "Hospital Super Admin", "Pharmacist"];

export default function PlatformConsoleView({
  hospitals,
  staffUsers,
  memberships,
  roles,
  branches,
  staffDirectory,
  onCreateHospital,
  onToggleHospitalStatus,
  onCreateStaff,
  onRemoveStaff,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newDistrict, setNewDistrict] = useState("Colombo");
  const [openHospitalId, setOpenHospitalId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState("Doctor");
  const [staffSpecialty, setStaffSpecialty] = useState<string>("Cardiologist");
  const [staffBranches, setStaffBranches] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#00334f]">Operations & Governance portal</h1>
            <p className="text-xs text-slate-500">
              Platform Super Admin: create hospital tenants, add employees, and remove staff who have resigned from a clinic. New medical centres and doctors sync to the Suwasiri app so patients can search by doctor name, clinic name, and district.
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
            <p className="text-xs text-slate-500">Click a hospital name to add staff. New centres and doctors appear in the Suwasiri app.</p>
          </div>
          <form
            className="flex flex-wrap gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              onCreateHospital(newName.trim(), newDistrict);
              setNewName("");
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New medical centre / hospital name"
              className="border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#00334f]"
            />
            <select
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#00334f]"
            >
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
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
            const hospitalStaff = staffDirectory.filter((s) => s.hospitalId === h.id && s.active !== false);
            const hospitalBranches = branches.filter((b) => b.hospitalId === h.id);
            const hospitalRoles = roles.filter((r) => r.hospitalId === h.id && r.enabled && r.name !== "Patient");
            const open = openHospitalId === h.id;
            return (
              <div key={h.id} className="border rounded-xl overflow-hidden">
                <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setOpenHospitalId(open ? null : h.id);
                      setStaffBranches(hospitalBranches.map((b) => b.id));
                    }}
                  >
                    <p className="font-bold text-sm text-slate-900 hover:underline">{h.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{h.id}{h.district ? ` · ${h.district}` : ""}</p>
                    <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      Hospital Super Admin: {admins.length ? admins.join(", ") : "Not assigned"}
                    </p>
                    <p className="text-[11px] text-sky-800 mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {hospitalStaff.length} employees · click name to add or remove staff
                    </p>
                  </button>
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

                {open && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#00334f] uppercase tracking-wider mb-2">Employees at this clinic</h3>
                      {hospitalStaff.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No staff yet. Add a doctor, receptionist, or nurse below.</p>
                      ) : (
                        <div className="grid gap-1.5">
                          {hospitalStaff.map((s) => (
                            <div key={s.id} className="bg-white border rounded-lg px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900">{s.name}</span>
                                <span className="text-slate-500 ml-2">{s.role}{s.specialty ? ` · ${s.specialty}` : ""} · {s.email}</span>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Remove ${s.name} after resignation from ${h.name}? They will no longer appear in Practice Manager or login for this clinic.`)) return;
                                  await onRemoveStaff({ staffId: s.id, hospitalId: h.id });
                                }}
                                className="text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded"
                              >
                                Remove (resigned)
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <form
                      className="bg-white border rounded-xl p-3 space-y-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!staffName.trim() || !staffEmail.trim()) return;
                        if (staffRole === "Doctor" && !staffSpecialty) {
                          alert("Please choose a doctor category / specialty.");
                          return;
                        }
                        setSaving(true);
                        try {
                          await onCreateStaff({
                            hospitalId: h.id,
                            name: staffName.trim(),
                            email: staffEmail.trim(),
                            roleName: staffRole,
                            branchIds: staffBranches.length ? staffBranches : hospitalBranches.map((b) => b.id),
                            phone: staffPhone.trim() || undefined,
                            specialty: staffRole === "Doctor" ? staffSpecialty : undefined,
                          });
                          setStaffName("");
                          setStaffEmail("");
                          setStaffPhone("");
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      <p className="text-[11px] font-bold text-slate-700 uppercase">Add staff to {h.name}</p>
                      <p className="text-[10px] text-sky-800">Doctors sync to Suwasiri (search by name, {h.district || "district"}, and this clinic name).</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="Full name (e.g. Dr. Priyantha Silva)"
                          className="border rounded-lg px-3 py-1.5 text-xs"
                        />
                        <input
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          placeholder="Work email (used to log in)"
                          className="border rounded-lg px-3 py-1.5 text-xs"
                        />
                        <input
                          value={staffPhone}
                          onChange={(e) => setStaffPhone(e.target.value)}
                          placeholder="Phone (optional)"
                          className="border rounded-lg px-3 py-1.5 text-xs"
                        />
                        <select
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value)}
                          className="border rounded-lg px-3 py-1.5 text-xs"
                        >
                          {(hospitalRoles.length ? hospitalRoles.map((r) => r.name) : STAFF_ROLES).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        {staffRole === "Doctor" && (
                          <select
                            value={staffSpecialty}
                            onChange={(e) => setStaffSpecialty(e.target.value)}
                            className="border rounded-lg px-3 py-1.5 text-xs sm:col-span-2"
                            required
                          >
                            {DOCTOR_SPECIALTIES.map((spec) => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hospitalBranches.map((b) => {
                          const on = staffBranches.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() =>
                                setStaffBranches((prev) =>
                                  prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                                )
                              }
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                on ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-white text-slate-500"
                              }`}
                            >
                              {b.name}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#00334f] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {saving ? "Saving…" : "Add to portal"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

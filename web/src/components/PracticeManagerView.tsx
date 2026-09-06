import React, { useEffect, useState } from "react";
import { 
  Building2, Users, Calendar, DollarSign, Clock, FileCode, CheckCircle, 
  Plus, Edit, Trash2, MapPin, Stethoscope, Shield, ShieldCheck, Mail, Smartphone,
  Check, Save, RefreshCw, AlertCircle
} from "lucide-react";
import { StaffProvider, FeeScheduleItem, Hospital, Branch, RoleDefinition, RosterWeekday, SuwasiriFeeService } from "../types";
import { DEFAULT_FEE_SCHEDULE, FEE_CATEGORIES, SUWASIRI_FEE_SERVICES } from "../catalogs/feeSchedule";
import { DOCTOR_SPECIALTIES } from "../catalogs/doctorSpecialties";
import ClinicImageField from "./ClinicImageField";
import { publishFeeScheduleToSuwasiri } from "../sync/suwasiriFeeSchedule";

interface Props {
  currentRole?: string;
  canManage?: boolean;
  hospital?: Hospital;
  branches?: Branch[];
  roles?: RoleDefinition[];
  staffList?: StaffProvider[];
  onSaveStaff?: (staff: StaffProvider[]) => void;
  onCreateStaff?: (payload: {
    hospitalId: string;
    name: string;
    email: string;
    roleName: string;
    branchIds: string[];
    phone?: string;
    specialty?: string;
    photoUrl?: string;
  }) => Promise<void> | void;
  onRemoveStaff?: (payload: { staffId: string; hospitalId: string }) => Promise<void> | void;
  onUpdateStaffPhoto?: (payload: { staffId: string; hospitalId: string; photoUrl: string }) => Promise<void> | void;
  onCreateBranch?: (payload: { name: string; address: string; phone?: string; rooms: string[] }) => void;
  onUpdateBranch?: (payload: Partial<Branch> & { id: string }) => void;
  onDeleteBranch?: (id: string) => void;
}

export default function PracticeManagerView({
  currentRole = "Admin",
  canManage,
  hospital,
  branches = [],
  roles = [],
  staffList: staffProp,
  onSaveStaff,
  onCreateStaff,
  onRemoveStaff,
  onUpdateStaffPhoto,
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"staff" | "fees" | "roster" | "templates" | "locations">("roster");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const isAdmin = canManage ?? (
    currentRole === "Admin" ||
    currentRole === "Practice Manager" ||
    currentRole === "Hospital Super Admin" ||
    currentRole === "Platform Super Admin"
  );

  const [staffList, setStaffList] = useState<StaffProvider[]>(staffProp || []);

  useEffect(() => {
    if (staffProp) setStaffList(staffProp);
  }, [staffProp]);

  // Fee Schedule & Sri Lankan Private Practice / PHSRC Consultation Items
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleItem[]>(DEFAULT_FEE_SCHEDULE);
  const [showAddFee, setShowAddFee] = useState(false);
  const [newFee, setNewFee] = useState({
    mbsItemNumber: "",
    description: "",
    category: "Standard Consult" as FeeScheduleItem["category"],
    suwasiriService: "" as SuwasiriFeeService,
    mbsScheduleFee: 1500,
    mbsBenefit: 500,
    privateFee: 2000,
  });
  const [savingFees, setSavingFees] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "General Practitioner",
    photoUrl: "",
  });

  useEffect(() => {
    fetch("/api/clinical-state")
      .then((r) => r.json())
      .then((data) => {
        const byHospital = hospital?.id && data.feeSchedules?.[hospital.id];
        const items = Array.isArray(byHospital) && byHospital.length
          ? byHospital
          : Array.isArray(data.feeSchedule) ? data.feeSchedule : [];
        if (items.length) {
          setFeeSchedule(items);
          void publishFeeScheduleToSuwasiri({
            hospitalId: hospital?.id,
            hospitalName: hospital?.name,
            items,
          }).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, [hospital?.id]);

  const persistFeeSchedule = async (next: FeeScheduleItem[]) => {
    const withGap = next.map((f) => ({
      ...f,
      bulkBillable: false,
      gapFee: Number(f.privateFee || 0) - Number(f.mbsBenefit || 0),
    }));
    setFeeSchedule(withGap);
    setSavingFees(true);
    try {
      const res = await fetch("/api/fee-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeSchedule: withGap, hospitalId: hospital?.id }),
      });
      const data = await res.json();
      if (data.feeSchedule) setFeeSchedule(data.feeSchedule);
      const synced = await publishFeeScheduleToSuwasiri({
        hospitalId: hospital?.id,
        hospitalName: hospital?.name,
        items: data.feeSchedule || withGap,
      });
      if (!synced) {
        alert("Fees saved here, but they did not reach the Suwasiri app. Sign in with Firebase staff email and try again.");
      }
    } catch {
      alert("Could not save fee schedule.");
    } finally {
      setSavingFees(false);
    }
  };

  const updateFeeField = (id: string, field: keyof FeeScheduleItem, value: string | number) => {
    const next = feeSchedule.map((f) => {
      if (f.id !== id) return f;
      const updated = { ...f, [field]: value };
      updated.gapFee = Number(updated.privateFee || 0) - Number(updated.mbsBenefit || 0);
      updated.bulkBillable = false;
      return updated;
    });
    setFeeSchedule(next);
  };

  // Templates
  const [smsTemplate, setSmsTemplate] = useState("Reminder: You have an appointment at PrimeCare GP on {Date} at {Time} with {Doctor}. Please reply YES to confirm or call 011-234-5678.");
  const [emailTemplate, setEmailTemplate] = useState("Dear {PatientName},\n\nThis is a clinical preventive health recall reminder from Colombo Central Practice. Our clinical records indicate you are due for: {RecallReason}.\n\nPlease book an appointment with {Doctor} via our patient portal or contact us directly.\n\nWarm regards,\nClinical Team");

  // Roster day toggling
  const handleToggleDay = (staffId: string, day: keyof StaffProvider["roster"]) => {
    if (!isAdmin) {
      alert("Administrator privileges required to modify staff rosters. Please switch role to Admin.");
      return;
    }
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        const nextOn = !s.roster[day];
        const hours = { ...(s.rosterHours || {}) };
        if (nextOn) {
          hours[day] = hours[day] || { start: day === "saturday" || day === "sunday" ? "09:00" : "16:00", end: day === "saturday" || day === "sunday" ? "13:00" : "18:00" };
        } else {
          delete hours[day];
        }
        return {
          ...s,
          roster: {
            ...s.roster,
            [day]: nextOn
          },
          rosterHours: hours
        };
      }
      return s;
    }));
  };

  const handleUpdateHours = (staffId: string, day: RosterWeekday, field: "start" | "end", value: string) => {
    if (!isAdmin) return;
    setStaffList((prev) => prev.map((s) => {
      if (s.id !== staffId) return s;
      return {
        ...s,
        rosterHours: {
          ...(s.rosterHours || {}),
          [day]: {
            start: s.rosterHours?.[day]?.start || "09:00",
            end: s.rosterHours?.[day]?.end || "17:00",
            [field]: value,
          },
        },
      };
    }));
  };

  const handleUpdateRoom = (staffId: string, newRoom: string) => {
    if (!isAdmin) {
      alert("Administrator privileges required to reallocate rooms.");
      return;
    }
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, assignedRoom: newRoom } : s));
  };

  const handleAutoSelectAllDays = () => {
    if (!isAdmin) return;
    setStaffList(prev => prev.map(s => ({
      ...s,
      roster: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      }
    })));
    triggerSaveSuccess("Full 7-day coverage auto-selected for all staff members!");
  };

  const handleSaveRoster = () => {
    if (onSaveStaff) onSaveStaff(staffList);
    triggerSaveSuccess("Weekly staff rosters and room allocations saved successfully to Clinic Database!");
  };

  const updateStaffRole = (staffId: string, roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    setStaffList((prev) => prev.map((s) => s.id === staffId ? { ...s, roleId, role: role?.name || s.role } : s));
  };

  const toggleStaffBranch = (staffId: string, branchId: string) => {
    setStaffList((prev) => prev.map((s) => {
      if (s.id !== staffId) return s;
      const current = s.branchIds || [];
      const next = current.includes(branchId) ? current.filter((id) => id !== branchId) : [...current, branchId];
      return { ...s, branchIds: next };
    }));
  };

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchRooms, setNewBranchRooms] = useState("Consultation Room 1");

  const triggerSaveSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6" id="practice_manager_root">
      
      {/* Top Banner */}
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-serif font-bold text-[#00334f]">
                      {hospital?.name || "Practice"} — staff, branches & weekly roster
                    </h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isAdmin 
                      ? "bg-purple-100 text-purple-800 border-purple-200" 
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    {isAdmin ? "Admin Full Control" : "Read-Only Mode"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                    Configure clinical staffing, weekly rosters, consultation room allocations, and branches for {hospital?.name || "this hospital"}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-lg font-bold">
              Role: {currentRole}
            </span>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
          {[
            { id: "roster", label: "Weekly Rosters & Rooms (Admin Control)", icon: Calendar },
            { id: "staff", label: "Staff & Practitioners", icon: Users },
            { id: "fees", label: "MBS & Private Fees", icon: DollarSign },
            { id: "templates", label: "Automated Templates", icon: Mail },
            { id: "locations", label: "Locations & Rooms", icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#00334f] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Success Toast */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{saveSuccessMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">Synced to Live DB</span>
        </div>
      )}

      {/* 1. WEEKLY ROSTERS & ROOMS (ADMIN CONTROLLED) */}
      {activeSubTab === "roster" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Weekly Clinical Staff Roster & Room Scheduling
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin control for weekly doctor shifts, room allocations, and coverage planning.
              </p>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSelectAllDays}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  Auto-Select All (Mon–Sun)
                </button>

                <button
                  type="button"
                  onClick={handleSaveRoster}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Weekly Rosters
                </button>
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Viewing mode. To edit weekly rosters and reassign rooms, switch your active role to <strong>Admin</strong> in the top bar.</span>
            </div>
          )}

          {/* Roster Grid */}
          <div className="space-y-3">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{staff.name}</span>
                    <span className="bg-[#00334f] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      {staff.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {staff.specialty || "Clinical Operations"} • {staff.email}
                  </p>
                  
                  {/* Room Allocation Select */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600">Assigned Room:</span>
                    {isAdmin ? (
                      <select
                        value={staff.assignedRoom}
                        onChange={(e) => handleUpdateRoom(staff.id, e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-medium text-slate-800 outline-none focus:border-[#00334f]"
                      >
                        <option value="Consultation Room 1">Consultation Room 1</option>
                        <option value="Consultation Room 2">Consultation Room 2</option>
                        <option value="Treatment & Procedure Room">Treatment & Procedure Room</option>
                        <option value="Front Desk Reception">Front Desk Reception</option>
                        <option value="Practice Admin Office">Practice Admin Office</option>
                        <option value="Telehealth Digital Suite">Telehealth Digital Suite</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-slate-800">{staff.assignedRoom}</span>
                    )}
                  </div>
                </div>

                {/* Day Buttons + hours */}
                <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => {
                    const fullDay = day === "mon" ? "monday" : day === "tue" ? "tuesday" : day === "wed" ? "wednesday" : day === "thu" ? "thursday" : day === "fri" ? "friday" : day === "sat" ? "saturday" : "sunday";
                    const isWorking = staff.roster[fullDay];
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(staff.id, fullDay)}
                        disabled={!isAdmin}
                        className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold text-[10px] uppercase transition-all ${
                          isWorking
                            ? "bg-[#00334f] text-white shadow-xs hover:bg-[#0c4a6e]"
                            : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                        } ${!isAdmin ? "cursor-default" : "cursor-pointer"}`}
                        title={isAdmin ? `Click to toggle ${day.toUpperCase()} for ${staff.name}` : undefined}
                      >
                        <span>{day}</span>
                        {isWorking && <Check className="w-2.5 h-2.5 text-sky-300" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as RosterWeekday[]).filter((d) => staff.roster[d]).map((d) => (
                    <label key={d} className="flex items-center gap-1 text-[10px] text-slate-600 bg-white border rounded px-1.5 py-0.5">
                      <span className="font-bold uppercase">{d.slice(0, 3)}</span>
                      <input
                        type="time"
                        disabled={!isAdmin}
                        value={staff.rosterHours?.[d]?.start || "09:00"}
                        onChange={(e) => handleUpdateHours(staff.id, d, "start", e.target.value)}
                        className="text-[10px] border rounded px-1 py-0.5"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        disabled={!isAdmin}
                        value={staff.rosterHours?.[d]?.end || "17:00"}
                        onChange={(e) => handleUpdateHours(staff.id, d, "end", e.target.value)}
                        className="text-[10px] border rounded px-1 py-0.5"
                      />
                    </label>
                  ))}
                </div>
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={handleSaveRoster}
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save & Commit Weekly Schedule
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. STAFF & PRACTITIONERS */}
      {activeSubTab === "staff" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Clinical Staff Directory</h3>
              <p className="text-xs text-slate-500">Add or remove doctors here. They appear on this list and in the Suwasiri app; remove hides them immediately.</p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddingDoctor((v) => !v)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add doctor</span>
                </button>
                <button 
                  onClick={() => {
                    if (onSaveStaff) onSaveStaff(staffList);
                    triggerSaveSuccess("Staff roles and branch assignments saved.");
                  }}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save staff assignments</span>
                </button>
              </div>
            )}
          </div>

          {addingDoctor && isAdmin && hospital && (
            <form
              className="p-4 bg-emerald-50 border-b border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newDoctor.name.trim() || !newDoctor.email.trim()) {
                  alert("Doctor name and email are required.");
                  return;
                }
                if (!onCreateStaff) return;
                await onCreateStaff({
                  hospitalId: hospital.id,
                  name: newDoctor.name.trim(),
                  email: newDoctor.email.trim(),
                  roleName: "Doctor",
                  branchIds: branches.map((b) => b.id),
                  phone: newDoctor.phone.trim() || undefined,
                  specialty: newDoctor.specialty,
                  photoUrl: newDoctor.photoUrl || undefined,
                });
                setNewDoctor({ name: "", email: "", phone: "", specialty: "General Practitioner", photoUrl: "" });
                setAddingDoctor(false);
                triggerSaveSuccess("Doctor added. They now appear in Staff & Practitioners and on Suwasiri.");
              }}
            >
              <input
                required
                value={newDoctor.name}
                onChange={(e) => setNewDoctor((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name (e.g. Dr. Priyantha Silva)"
                className="border rounded-lg px-3 py-1.5"
              />
              <input
                required
                type="email"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor((p) => ({ ...p, email: e.target.value }))}
                placeholder="Work email"
                className="border rounded-lg px-3 py-1.5"
              />
              <input
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone (optional)"
                className="border rounded-lg px-3 py-1.5"
              />
              <select
                value={newDoctor.specialty}
                onChange={(e) => setNewDoctor((p) => ({ ...p, specialty: e.target.value }))}
                className="border rounded-lg px-3 py-1.5"
              >
                {DOCTOR_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              <div className="md:col-span-2">
                <ClinicImageField
                  label="Doctor photo (shown in Suwasiri booking)"
                  value={newDoctor.photoUrl}
                  storagePath={`clinic_media/pending/doctor-${Date.now()}.jpg`}
                  onChange={(url) => setNewDoctor((p) => ({ ...p, photoUrl: url }))}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-[#00334f] text-white px-3 py-1.5 rounded-lg font-bold">
                  Add doctor to this clinic
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Branches</th>
                  <th className="py-3 px-4">Assigned Room</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-slate-500 italic">
                      No staff at this clinic yet. Add a doctor above — they will appear here and in the Suwasiri app.
                    </td>
                  </tr>
                )}
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 border shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          {/doctor|medical officer/i.test(s.role || "") && isAdmin && hospital && onUpdateStaffPhoto && (
                            <div className="mt-1">
                              <ClinicImageField
                                label="Photo"
                                value={s.photoUrl || ""}
                                storagePath={`clinic_media/doctors/${s.id}/photo.jpg`}
                                onChange={(url) => void onUpdateStaffPhoto({ staffId: s.id, hospitalId: hospital.id, photoUrl: url })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin && roles.length > 0 ? (
                        <select
                          value={s.roleId || ""}
                          onChange={(e) => updateStaffRole(s.id, e.target.value)}
                          className="bg-white border rounded px-2 py-0.5 text-[10px] font-semibold"
                        >
                          {roles.filter((r) => r.enabled && r.name !== "Patient").map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                          {s.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {branches.map((b) => {
                          const on = (s.branchIds || []).includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              disabled={!isAdmin}
                              onClick={() => toggleStaffBranch(s.id, b.id)}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                on ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-white text-slate-400 border-slate-200"
                              }`}
                            >
                              {b.name.replace("PrimeCare Medical Centre - ", "").replace("PrimeCare Specialist Branch - ", "").replace("Southern Coast Clinic - ", "")}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{s.assignedRoom}</td>
                    <td className="py-3 px-4 text-slate-600">{s.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          Active
                        </span>
                        {isAdmin && hospital && onRemoveStaff && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Remove ${s.name} from ${hospital.name}? They will disappear from this list, weekly rosters, and the Suwasiri app.`)) return;
                              await onRemoveStaff({ staffId: s.id, hospitalId: hospital.id });
                            }}
                            className="text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FEES & MBS SCHEDULE */}
      {activeSubTab === "fees" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-sky-50 border-b border-sky-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">MBS Schedule & Private Billing Fees</h3>
              <p className="text-xs text-slate-500">Add or delete items and map them to Suwasiri (medical certificate, repeat prescription, review results). The app shows only that private fee for those bookings.</p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void persistFeeSchedule(feeSchedule)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingFees ? "Saving…" : "Save fees"}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddFee((v) => !v)}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add MBS Item</span>
                </button>
              </div>
            )}
          </div>

          {showAddFee && isAdmin && (
            <form
              className="p-4 bg-violet-50 border-b border-violet-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newFee.mbsItemNumber.trim() || !newFee.description.trim()) {
                  alert("Item number and description are required.");
                  return;
                }
                const item: FeeScheduleItem = {
                  id: `fee-${Date.now()}`,
                  mbsItemNumber: newFee.mbsItemNumber.trim(),
                  description: newFee.description.trim(),
                  category: newFee.category,
                  suwasiriService: newFee.suwasiriService,
                  mbsScheduleFee: Number(newFee.mbsScheduleFee) || 0,
                  mbsBenefit: Number(newFee.mbsBenefit) || 0,
                  privateFee: Number(newFee.privateFee) || 0,
                  gapFee: Number(newFee.privateFee) - Number(newFee.mbsBenefit),
                  bulkBillable: false,
                };
                void persistFeeSchedule([...feeSchedule, item]);
                setNewFee({
                  mbsItemNumber: "",
                  description: "",
                  category: "Standard Consult",
                  suwasiriService: "",
                  mbsScheduleFee: 1500,
                  mbsBenefit: 500,
                  privateFee: 2000,
                });
                setShowAddFee(false);
              }}
            >
              <input
                required
                value={newFee.mbsItemNumber}
                onChange={(e) => setNewFee((p) => ({ ...p, mbsItemNumber: e.target.value }))}
                placeholder="MBS item (e.g. SL-OPD-07)"
                className="border rounded-lg px-2 py-1.5"
              />
              <input
                required
                value={newFee.description}
                onChange={(e) => setNewFee((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="border rounded-lg px-2 py-1.5 md:col-span-2"
              />
              <select
                value={newFee.category}
                onChange={(e) => setNewFee((p) => ({ ...p, category: e.target.value as FeeScheduleItem["category"] }))}
                className="border rounded-lg px-2 py-1.5"
              >
                {FEE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={newFee.suwasiriService}
                onChange={(e) => setNewFee((p) => ({ ...p, suwasiriService: e.target.value as SuwasiriFeeService }))}
                className="border rounded-lg px-2 py-1.5 md:col-span-2"
              >
                {SUWASIRI_FEE_SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <input
                type="number"
                min={0}
                value={newFee.mbsScheduleFee}
                onChange={(e) => setNewFee((p) => ({ ...p, mbsScheduleFee: Number(e.target.value) }))}
                placeholder="Schedule fee (LKR)"
                className="border rounded-lg px-2 py-1.5"
              />
              <input
                type="number"
                min={0}
                value={newFee.privateFee}
                onChange={(e) => setNewFee((p) => ({ ...p, privateFee: Number(e.target.value) }))}
                placeholder="Private fee (LKR)"
                className="border rounded-lg px-2 py-1.5"
              />
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" className="bg-[#00334f] text-white px-3 py-1.5 rounded-lg font-bold">
                  Add item
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">MBS Item</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Suwasiri booking</th>
                  <th className="py-3 px-4">MBS Schedule Fee</th>
                  <th className="py-3 px-4">Private Fee</th>
                  <th className="py-3 px-4">Out-of-Pocket Gap</th>
                  {isAdmin && <th className="py-3 px-4"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeSchedule.map((f) => (
                  <tr key={f.id} className="hover:bg-sky-50/40">
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <input
                          value={f.mbsItemNumber}
                          onChange={(e) => updateFeeField(f.id, "mbsItemNumber", e.target.value)}
                          className="font-mono font-black text-slate-900 w-28 border rounded px-1.5 py-1"
                        />
                      ) : (
                        <span className="font-mono font-black text-slate-900">{f.mbsItemNumber}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <input
                          value={f.description}
                          onChange={(e) => updateFeeField(f.id, "description", e.target.value)}
                          className="font-bold text-slate-800 w-full min-w-[12rem] border rounded px-1.5 py-1"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{f.description}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <select
                          value={f.category}
                          onChange={(e) => updateFeeField(f.id, "category", e.target.value)}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-semibold border"
                        >
                          {FEE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                          {f.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <select
                          value={f.suwasiriService || ""}
                          onChange={(e) => updateFeeField(f.id, "suwasiriService", e.target.value)}
                          className="text-[10px] bg-violet-50 text-violet-800 px-2 py-1 rounded font-semibold border border-violet-100"
                        >
                          {SUWASIRI_FEE_SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-600">
                          {SUWASIRI_FEE_SERVICES.find((s) => s.value === (f.suwasiriService || ""))?.label}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <input
                          type="number"
                          min={0}
                          value={f.mbsScheduleFee}
                          onChange={(e) => updateFeeField(f.id, "mbsScheduleFee", Number(e.target.value))}
                          className="font-mono font-bold text-emerald-700 w-24 border rounded px-1.5 py-1"
                        />
                      ) : (
                        <span className="font-mono font-bold text-emerald-700">Rs. {f.mbsScheduleFee.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <input
                          type="number"
                          min={0}
                          value={f.privateFee}
                          onChange={(e) => updateFeeField(f.id, "privateFee", Number(e.target.value))}
                          className="font-mono font-bold text-slate-900 w-24 border rounded px-1.5 py-1"
                        />
                      ) : (
                        <span className="font-mono font-bold text-slate-900">Rs. {f.privateFee.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-amber-700">
                      {f.gapFee > 0 ? `Rs. ${f.gapFee.toFixed(2)}` : "Rs. 0.00 (No Gap)"}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`Delete ${f.mbsItemNumber}? Suwasiri will stop using this fee.`)) return;
                            void persistFeeSchedule(feeSchedule.filter((item) => item.id !== f.id));
                          }}
                          className="text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TEMPLATES */}
      {activeSubTab === "templates" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Automated Patient Communication Templates</h3>
            <p className="text-xs text-slate-500">Customizable dynamic templates for SMS reminders, recall letters, and email summaries</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-600" />
                SMS Appointment Reminder Template:
              </label>
              <textarea
                rows={3}
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs outline-none focus:border-[#00334f]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Available placeholders: {"{PatientName}"}, {"{Doctor}"}, {"{Date}"}, {"{Time}"}, {"{ClinicName}"}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-purple-600" />
                Clinical Recall & Preventive Health Email Template:
              </label>
              <textarea
                rows={4}
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs outline-none focus:border-[#00334f]"
              />
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => triggerSaveSuccess("Communication templates saved successfully!")}
                className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg cursor-pointer hover:bg-[#0c4a6e]"
              >
                Save Communication Templates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LOCATIONS & ROOMS */}
      {activeSubTab === "locations" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Hospital branches & clinical rooms</h3>
            <p className="text-xs text-slate-500">
              Sites inside {hospital?.name || "this hospital"}. Staff can be assigned to one or many branches. Clinical data never crosses hospitals.
            </p>
          </div>

          {isAdmin && (
            <div className="bg-slate-50 border rounded-xl p-4 grid md:grid-cols-4 gap-3">
              <input value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Branch name" className="border rounded-lg px-3 py-1.5 bg-white" />
              <input value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} placeholder="Address" className="border rounded-lg px-3 py-1.5 bg-white" />
              <input value={newBranchPhone} onChange={(e) => setNewBranchPhone(e.target.value)} placeholder="Phone" className="border rounded-lg px-3 py-1.5 bg-white" />
              <div className="flex gap-2">
                <input value={newBranchRooms} onChange={(e) => setNewBranchRooms(e.target.value)} placeholder="Rooms (comma separated)" className="border rounded-lg px-3 py-1.5 bg-white flex-1" />
                <button
                  type="button"
                  onClick={() => {
                    if (!newBranchName.trim()) return;
                    onCreateBranch?.({
                      name: newBranchName.trim(),
                      address: newBranchAddress,
                      phone: newBranchPhone,
                      rooms: newBranchRooms.split(",").map((r) => r.trim()).filter(Boolean),
                    });
                    setNewBranchName("");
                    setNewBranchAddress("");
                    setNewBranchPhone("");
                    triggerSaveSuccess("Branch created.");
                  }}
                  className="bg-[#00334f] text-white px-3 py-1.5 rounded-lg font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <div key={branch.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <h4 className="font-bold text-sm text-slate-900">{branch.name}</h4>
                  </div>
                  {isAdmin && (
                    <button type="button" className="text-rose-600" onClick={() => onDeleteBranch?.(branch.id)} title="Remove branch">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-slate-600 text-[11px]">{branch.address} {branch.phone ? `• Ph: ${branch.phone}` : ""}</p>
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <p className="font-bold text-slate-700 text-[11px]">Configured Rooms:</p>
                  {isAdmin ? (
                    <input
                      defaultValue={(branch.rooms || []).join(", ")}
                      onBlur={(e) => onUpdateBranch?.({
                        id: branch.id,
                        rooms: e.target.value.split(",").map((r) => r.trim()).filter(Boolean),
                      })}
                      className="w-full border rounded px-2 py-1 bg-white text-[11px]"
                    />
                  ) : (
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {(branch.rooms || []).map((room) => <li key={room}>{room}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

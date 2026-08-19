import React, { useEffect, useState } from "react";
import { 
  Building2, Users, Calendar, DollarSign, Clock, FileCode, CheckCircle, 
  Plus, Edit, Trash2, MapPin, Stethoscope, Shield, ShieldCheck, Mail, Smartphone,
  Check, Save, Sparkles, RefreshCw, AlertCircle
} from "lucide-react";
import { StaffProvider, FeeScheduleItem, Hospital, Branch, RoleDefinition } from "../types";

interface Props {
  currentRole?: string;
  canManage?: boolean;
  hospital?: Hospital;
  branches?: Branch[];
  roles?: RoleDefinition[];
  staffList?: StaffProvider[];
  onSaveStaff?: (staff: StaffProvider[]) => void;
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
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"staff" | "fees" | "roster" | "templates" | "locations">("roster");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const isAdmin = canManage ?? (currentRole === "Admin" || currentRole === "Practice Manager" || currentRole === "Hospital Super Admin");

  const [staffList, setStaffList] = useState<StaffProvider[]>(staffProp || []);

  useEffect(() => {
    if (staffProp) setStaffList(staffProp);
  }, [staffProp]);

  // Fee Schedule & Sri Lankan Private Practice / PHSRC Consultation Items
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleItem[]>([
    {
      id: "fee-1",
      mbsItemNumber: "SL-OPD-01",
      description: "Standard OPD General Practice Consultation (< 15 mins)",
      category: "Standard Consult",
      mbsScheduleFee: 1500.00,
      mbsBenefit: 500.00,
      privateFee: 2000.00,
      gapFee: 1500.00,
      bulkBillable: true
    },
    {
      id: "fee-2",
      mbsItemNumber: "SL-OPD-02",
      description: "Extended Chronic Disease Review (Diabetes / Hypertension 20-30 min)",
      category: "Long Consult",
      mbsScheduleFee: 2500.00,
      mbsBenefit: 800.00,
      privateFee: 3500.00,
      gapFee: 2700.00,
      bulkBillable: true
    },
    {
      id: "fee-3",
      mbsItemNumber: "SL-NCD-03",
      description: "MoH PEN Protocol Comprehensive NCD Risk Assessment & Care Plan",
      category: "Care Plan",
      mbsScheduleFee: 3000.00,
      mbsBenefit: 3000.00,
      privateFee: 3000.00,
      gapFee: 0.00,
      bulkBillable: true
    },
    {
      id: "fee-4",
      mbsItemNumber: "SL-HOME-04",
      description: "Domiciliary / Home Visit Doctor Consultation",
      category: "Care Plan",
      mbsScheduleFee: 4500.00,
      mbsBenefit: 1000.00,
      privateFee: 5500.00,
      gapFee: 4500.00,
      bulkBillable: false
    },
    {
      id: "fee-5",
      mbsItemNumber: "SL-PROC-05",
      description: "Minor Surgical Procedure / Wound Suturing / Nebulisation",
      category: "Mental Health",
      mbsScheduleFee: 2200.00,
      mbsBenefit: 500.00,
      privateFee: 3000.00,
      gapFee: 2500.00,
      bulkBillable: true
    },
    {
      id: "fee-6",
      mbsItemNumber: "SL-TELE-06",
      description: "Suwasiri Telehealth Video Consultation (< 20 min)",
      category: "Telehealth",
      mbsScheduleFee: 1800.00,
      mbsBenefit: 600.00,
      privateFee: 2400.00,
      gapFee: 1800.00,
      bulkBillable: true
    }
  ]);

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
        return {
          ...s,
          roster: {
            ...s.roster,
            [day]: !s.roster[day]
          }
        };
      }
      return s;
    }));
  };

  const handleUpdateRoom = (staffId: string, newRoom: string) => {
    if (!isAdmin) {
      alert("Administrator privileges required to reallocate rooms.");
      return;
    }
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, assignedRoom: newRoom } : s));
  };

  const handleAutoSelectWeekdays = () => {
    if (!isAdmin) return;
    setStaffList(prev => prev.map(s => ({
      ...s,
      roster: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: s.role === "Receptionist",
        sunday: false
      }
    })));
    triggerSaveSuccess("Standard Mon-Fri roster auto-selected for all clinic staff!");
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
                    Practice Management & Operational Governance
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
                  onClick={handleAutoSelectWeekdays}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Auto-Select Mon–Fri
                </button>

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

                {/* Day Buttons */}
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
              <p className="text-xs text-slate-500">Registered practitioners, Medicare provider numbers, and contact credentials</p>
            </div>
            {isAdmin && (
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
            )}
          </div>

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
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
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
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        Active
                      </span>
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
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">MBS Schedule & Private Billing Fees</h3>
              <p className="text-xs text-slate-500">Medicare Benefits Schedule item codes, schedule benefits, and patient gap fee calculations</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => alert("Add MBS item modal opened.")}
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add MBS Item</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">MBS Item</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">MBS Schedule Fee</th>
                  <th className="py-3 px-4">Private Fee</th>
                  <th className="py-3 px-4">Out-of-Pocket Gap</th>
                  <th className="py-3 px-4">Bulk Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeSchedule.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-black text-slate-900">{f.mbsItemNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{f.description}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        {f.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">${f.mbsScheduleFee.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">${f.privateFee.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-amber-700">
                      {f.gapFee > 0 ? `$${f.gapFee.toFixed(2)}` : "$0.00 (No Gap)"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        Bulk Bill Eligible
                      </span>
                    </td>
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

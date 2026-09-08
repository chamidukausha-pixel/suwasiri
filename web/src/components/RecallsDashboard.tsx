import React, { useState } from "react";
import { 
  BellRing, AlertTriangle, CheckCircle, Send, Calendar, Phone, Mail, 
  Smartphone, Filter, Search, Plus, Clock, UserCheck, Sparkles, Check, RefreshCw,
  Activity, Syringe, FlaskConical, Heart
} from "lucide-react";
import { RecallRecord, Patient } from "../types";

interface Props {
  patients: Patient[];
  recalls: RecallRecord[];
  onSendNotification: (recallId: string, method: "SMS" | "Email" | "App Notification") => void;
  onBookAppointment: (recall: RecallRecord, consultMode?: "clinic" | "video") => void;
  onCreateRecall: (newRecall: Partial<RecallRecord>) => void;
  onMarkComplete: (recallId: string) => void;
}

export default function RecallsDashboard({
  patients,
  recalls,
  onSendNotification,
  onBookAppointment,
  onCreateRecall,
  onMarkComplete
}: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New recall form
  const [newPatientId, setNewPatientId] = useState<string>(patients[0]?.id || "");
  const [newCategory, setNewCategory] = useState<RecallRecord["category"]>("Diabetes Review");
  const [newUrgency, setNewUrgency] = useState<RecallRecord["urgency"]>("HIGH");
  const [newDueDate, setNewDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [newNotes, setNewNotes] = useState<string>("Routine 6-monthly HbA1c and lipid check required.");

  const activeRecalls = recalls.filter(r => r.status !== "COMPLETED" && r.status !== "CANCELLED");

  // Category counts matching the user's specific clinical benchmark
  const categories = [
    {
      id: "All",
      label: "All Active Recalls",
      count: activeRecalls.length,
      card: "from-sky-800 via-blue-800 to-teal-800",
      Icon: BellRing,
    },
    {
      id: "Diabetes Review",
      label: "Diabetes Review",
      count: activeRecalls.filter((r) => r.category === "Diabetes Review").length,
      card: "from-teal-800 via-emerald-800 to-cyan-900",
      Icon: Activity,
    },
    {
      id: "Immunisation",
      label: "Immunisation Due",
      count: activeRecalls.filter((r) => r.category === "Immunisation").length,
      card: "from-emerald-800 via-teal-700 to-green-900",
      Icon: Syringe,
    },
    {
      id: "Cervical Screening",
      label: "Cervical Screening",
      count: activeRecalls.filter((r) => r.category === "Cervical Screening").length,
      card: "from-blue-800 via-sky-800 to-teal-900",
      Icon: UserCheck,
    },
    {
      id: "Pathology Follow-up",
      label: "Pathology Follow-up",
      count: activeRecalls.filter((r) => r.category === "Pathology Follow-up").length,
      card: "from-cyan-900 via-teal-800 to-sky-900",
      Icon: FlaskConical,
    },
    {
      id: "Care Plan Review",
      label: "Care Plan Review",
      count: activeRecalls.filter((r) => r.category === "Care Plan Review").length,
      card: "from-teal-700 via-sky-800 to-blue-900",
      Icon: Heart,
    },
  ];

  const filteredRecalls = activeRecalls.filter(r => {
    if (activeCategory !== "All" && r.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.patientName.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selPat = patients.find(p => p.id === newPatientId);
    if (!selPat) return;

    onCreateRecall({
      patientId: selPat.id,
      patientName: selPat.name,
      patientPhone: selPat.phone,
      patientEmail: selPat.email,
      category: newCategory,
      urgency: newUrgency,
      dueDate: newDueDate,
      status: "DUE",
      notes: newNotes,
      assignedDoctor: "Dr. Priyantha Silva"
    });

    setShowCreateModal(false);
    setSuccessToast(`Clinical recall created for ${selPat.name}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleNotify = (recall: RecallRecord, method: "SMS" | "Email" | "App Notification") => {
    const live = patients.find(p => p.id === recall.patientId);
    const phone = (live?.phone || recall.patientPhone || "").replace(/\s+/g, "");
    const email = live?.email || recall.patientEmail || "";
    const body = encodeURIComponent(
      `PrimeCare reminder: ${recall.patientName}, please book your ${recall.category} (${recall.notes}). Due ${recall.dueDate}.`
    );
    if (method === "SMS") {
      if (!phone) {
        setSuccessToast(`No registered phone number for ${recall.patientName}`);
        setTimeout(() => setSuccessToast(null), 3000);
        return;
      }
      window.open(`sms:${phone}?body=${body}`, "_self");
    }
    if (method === "Email") {
      if (!email) {
        setSuccessToast(`No registered email for ${recall.patientName}`);
        setTimeout(() => setSuccessToast(null), 3000);
        return;
      }
      window.open(`mailto:${email}?subject=${encodeURIComponent("Clinic recall reminder")}&body=${body}`);
    }
    onSendNotification(recall.id, method);
    setSuccessToast(
      method === "SMS"
        ? `SMS sent and ${recall.patientName} was notified in the Suwasiri app`
        : `Sent ${method} recall reminder to ${recall.patientName} via ${email}`
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle className="w-4 h-4 text-teal-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Front Desk Recalls & Reminders</h1>
            <p className="text-xs text-slate-500">
              Receptionist queue: SMS or email using the patient’s registered phone and email, rebook a suitable doctor, then mark the recall complete
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-800 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Patient Recall</span>
        </button>
      </div>

      {/* Benchmark Category Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const Icon = cat.Icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`bg-gradient-to-br ${cat.card} p-4 rounded-xl text-left text-white shadow-md hover:shadow-lg transition cursor-pointer ${
                isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-100 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-1 gap-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider leading-tight">{cat.label}</span>
                <Icon className="w-5 h-5 text-white/90 shrink-0" />
              </div>
              <div className="text-3xl font-black">{cat.count}</div>
              <p className="text-[11px] text-white/85 mt-1 font-semibold">Patients pending</p>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, recall reason, or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#00334f]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Showing {filteredRecalls.length} recalls</span>
        </div>
      </div>

      {/* Recalls List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#e8f3f0] text-teal-900 font-bold uppercase tracking-wider text-[10px] border-b border-teal-100">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Recall Category</th>
                <th className="py-3 px-4">Urgency & Due Date</th>
                <th className="py-3 px-4">Clinical Reason</th>
                <th className="py-3 px-4">Contact Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecalls.map(r => {
                const isOverdue = new Date(r.dueDate) < new Date();
                return (
                  <tr key={r.id} className={`hover:bg-teal-50/50 transition-colors ${r.urgency === "HIGH" && r.category === "Pathology Follow-up" ? "bg-sky-50" : ""}`}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{r.patientName}</div>
                      <div className="text-[10px] font-normal text-slate-500">{r.patientPhone} • {r.patientEmail}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {r.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          r.urgency === "HIGH" ? "bg-teal-800 text-teal-50" : "bg-sky-100 text-sky-800"
                        }`}>
                          {r.urgency}
                        </span>
                        <span className={`font-mono text-xs font-semibold ${isOverdue ? "text-sky-900 font-bold" : "text-slate-600"}`}>
                          {r.dueDate} {isOverdue && "⚠️ OVERDUE"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      <p className="line-clamp-2">{r.notes}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned: {r.assignedDoctor}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === "DUE" ? "bg-sky-100 text-sky-800" :
                          r.status === "SMS_SENT" ? "bg-teal-100 text-teal-800" :
                          r.status === "BOOKED" ? "bg-blue-100 text-blue-800" :
                          "bg-emerald-100 text-emerald-800"
                        }`}>
                          {r.status.replace("_", " ")}
                        </span>
                        {r.lastContactedDate && (
                          <p className="text-[9px] text-slate-400">Last: {r.lastContactedDate} ({r.contactMethod})</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Send SMS */}
                        <button
                          onClick={() => handleNotify(r, "SMS")}
                          title={`SMS to registered number ${r.patientPhone}`}
                          className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded border border-sky-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>SMS</span>
                        </button>

                        <button
                          onClick={() => handleNotify(r, "Email")}
                          title={`Email to registered address ${r.patientEmail}`}
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </button>

                        <button
                          onClick={() => {
                            const live = patients.find(p => p.id === r.patientId);
                            const phone = (live?.phone || r.patientPhone || "").replace(/\s+/g, "");
                            if (!phone) {
                              setSuccessToast(`No registered phone number for ${r.patientName}`);
                              setTimeout(() => setSuccessToast(null), 3000);
                              return;
                            }
                            window.open(`tel:${phone}`, "_self");
                            setSuccessToast(`Calling ${r.patientName} at ${phone}`);
                            setTimeout(() => setSuccessToast(null), 3000);
                          }}
                          title={`Call ${r.patientPhone}`}
                          className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>

                        <button
                          onClick={() => onBookAppointment(r, "clinic")}
                          title="Rebook in-person clinic visit"
                          className="p-1.5 bg-teal-800 text-white hover:bg-teal-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>In person</span>
                        </button>
                        <button
                          onClick={() => onBookAppointment(r, "video")}
                          title="Rebook video / online consult"
                          className="p-1.5 bg-sky-800 text-white hover:bg-sky-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Video</span>
                        </button>

                        {/* Mark Complete */}
                        <button
                          onClick={() => onMarkComplete(r.id)}
                          title="Mark Recall Completed"
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-300 text-[11px] font-bold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Recall Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-teal-800 text-white px-5 py-3.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-teal-200" />
                <h3 className="font-bold text-sm">Add Clinical Recall / Health Reminder</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient:</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender}, {p.age}y) — {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recall Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Diabetes Review">Diabetes Review (HbA1c)</option>
                    <option value="Immunisation">Immunisation Due</option>
                    <option value="Cervical Screening">Cervical Screening Test (CST)</option>
                    <option value="Pathology Follow-up">Pathology Abnormal Follow-up</option>
                    <option value="Care Plan Review">Care Plan Review (MBS 721/723)</option>
                    <option value="Cardiovascular Check">Cardiovascular Risk Assessment</option>
                    <option value="Bowel Screening">Bowel Cancer Screening (FOBT)</option>
                    <option value="Skin Cancer Check">Annual Skin Cancer Check</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urgency:</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="HIGH">High (Within 1-2 Weeks)</option>
                    <option value="MEDIUM">Medium (Within 1 Month)</option>
                    <option value="ROUTINE">Routine (Scheduled Interval)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recall Due Date:</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes & Instructions:</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  placeholder="Specify clinical rationale, test parameters, or appointment requirements..."
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Recall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

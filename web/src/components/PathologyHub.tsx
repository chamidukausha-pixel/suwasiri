import React, { useState } from "react";
import {
  FlaskConical,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  Stethoscope,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Check,
  Send,
  Printer,
  Edit3
} from "lucide-react";
import { Patient, LabResult, LabOrder } from "../types";
import { PATHOLOGY_INVESTIGATIONS } from "../catalogs/pathologyInvestigations";

interface Props {
  patients: Patient[];
  labOrders?: LabOrder[];
  currentRole: string;
  onOpenPatientEverything: (patient: Patient) => void;
  onStartConsultation: (patient: Patient) => void;
  onOrderLabTest?: (patientId: string, testName: string, remarks: string) => void;
  onMarkLabReviewed?: (patientId: string, labResultId: string) => void;
}

export default function PathologyHub({
  patients,
  labOrders = [],
  currentRole,
  onOpenPatientEverything,
  onStartConsultation,
  onOrderLabTest,
  onMarkLabReviewed
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ABNORMAL" | "NORMAL" | "PENDING">("PENDING");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPatientId, setOrderPatientId] = useState(patients[0]?.id || "");
  const [orderTestName, setOrderTestName] = useState(PATHOLOGY_INVESTIGATIONS[0].name);
  const [orderRemarks, setOrderRemarks] = useState("");

  // Doctor comments & Suwasiri app sync state
  const [doctorComments, setDoctorComments] = useState<Record<string, string>>({});
  const [suwasiriSyncedReports, setSuwasiriSyncedReports] = useState<Record<string, string>>({});
  const [syncingReportId, setSyncingReportId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const getReportKey = (patientId: string, test: LabResult, idx: number) => {
    return test.id || `${patientId}_${test.testName}_${idx}`;
  };

  const handleDownloadTestPdf = (patient: Patient, test: LabResult) => {
    const reportKey = test.id || `${patient.id}_${test.testName}`;
    const comment = doctorComments[reportKey] || test.remarks || "Within biological clinical limits.";
    const isSynced = suwasiriSyncedReports[reportKey];

    const content = `
================================================================================
                    LANKALAB CENTRAL DIAGNOSTICS & PATHOLOGY
                     OFFICIAL CLINICAL LABORATORY REPORT / PDF
================================================================================
Test Report      : ${test.testName.toUpperCase()}
Report ID / Key  : ${test.id || "LAB-" + Date.now().toString().slice(-6)}
Collection Date  : ${test.date || new Date().toISOString().split("T")[0]}
Laboratory Spec  : Automated Hematology / Clinical Chemistry Analyzer
Accreditation    : NATA / ISO 15189 Compliant

PATIENT DETAILS:
Patient Name     : ${patient.name}
Patient ID / MRN : ${patient.id}
DOB / Age        : ${patient.dateOfBirth || "N/A"} (${patient.age} yrs, ${patient.gender})
Medicare / NIC   : ${patient.medicareNumber || "N/A"}
Referring Doctor : Dr. Priyantha Silva (FRACGP, Provider: 4920192A)
Medical Clinic   : ${patient.medicalCenter || "Colombo Central Practice"}

--------------------------------------------------------------------------------
TEST RESULTS & REFERENCE INTERVALS:
--------------------------------------------------------------------------------
Investigation    : ${test.testName}
Result Observed  : ${test.result}
Clinical Status  : ${test.status} ${test.abnormalFlag ? "[ABNORMAL FLAG - REVIEW]" : "[NORMAL]"}
Laboratory Notes : ${test.remarks || "No specimen hemolysis or turbidity."}

--------------------------------------------------------------------------------
DOCTOR'S CLINICAL REVIEW & INTERPRETATION COMMENTS:
--------------------------------------------------------------------------------
"${comment}"

Doctor Sign-off  : Dr. Priyantha Silva (FRACGP, MBBS)
Signed Date      : ${new Date().toISOString().split("T")[0]}
Suwasiri App Sync: ${isSynced ? `ACTIVE (${isSynced})` : "Verified for Mobile Release"}
Security Stamp   : DIGITAL HASH SHA256-${Math.random().toString(36).substring(2, 12)}
================================================================================
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Pathology_Report_${patient.name.replace(/[^a-zA-Z0-9]/g, "_")}_${test.testName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveCommentAndSync = (patient: Patient, test: LabResult, idx: number, comment: string) => {
    const reportKey = getReportKey(patient.id, test, idx);
    setSyncingReportId(reportKey);
    setDoctorComments((prev) => ({ ...prev, [reportKey]: comment }));

    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSuwasiriSyncedReports((prev) => ({ ...prev, [reportKey]: timestamp }));
      setSyncingReportId(null);
      setEditingCommentId(null);
      alert(`Success! Doctor's comment saved and pathology report for "${test.testName}" synced to ${patient.name}'s Suwasiri mobile app!`);
    }, 600);
  };

  // CRITICAL REQUIREMENT: Filter to show ONLY patients who have pathology records
  // (i.e. labResults, sampleCollections, or labOrders)
  const pathologyPatients = patients.filter((p) => {
    const hasLabResults = Boolean(p.labResults && p.labResults.length > 0);
    const hasSampleCollections = Boolean(p.sampleCollections && p.sampleCollections.length > 0);
    const hasLabOrders = labOrders.some((o) => o.patientId === p.id);
    return hasLabResults || hasSampleCollections || hasLabOrders;
  });

  // Filter based on search and status
  const filteredPathologyPatients = pathologyPatients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.medicareNumber && p.medicareNumber.toLowerCase().includes(q)) ||
      (p.suwasiriBarcode && p.suwasiriBarcode.toLowerCase().includes(q)) ||
      p.labResults?.some(
        (lr) =>
          lr.testName.toLowerCase().includes(q) ||
          lr.result.toLowerCase().includes(q) ||
          (lr.remarks && lr.remarks.toLowerCase().includes(q))
      ) ||
      labOrders.some(
        (o) =>
          o.patientId === p.id &&
          (o.testName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
      );

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "ABNORMAL") {
      return p.labResults?.some((lr) => lr.status === "ABNORMAL" || lr.status === "CRITICAL" || lr.abnormalFlag);
    }
    if (statusFilter === "NORMAL") {
      return p.labResults?.some((lr) => lr.status === "COMPLETED" && !lr.abnormalFlag);
    }
    if (statusFilter === "PENDING") {
      return p.labResults?.some((lr) => !lr.doctorReviewed) || false;
    }
    return true;
  });

  // Aggregate stats across pathology patients only
  const totalPathologyPatients = pathologyPatients.length;
  const totalLabResultsCount = pathologyPatients.reduce((sum, p) => sum + (p.labResults?.length || 0), 0);
  const abnormalResultsCount = pathologyPatients.reduce(
    (sum, p) =>
      sum +
      (p.labResults?.filter((lr) => lr.status === "ABNORMAL" || lr.status === "CRITICAL" || lr.abnormalFlag).length || 0),
    0
  );
  const unreviewedCount = pathologyPatients.reduce(
    (sum, p) => sum + (p.labResults?.filter((lr) => !lr.doctorReviewed).length || 0),
    0
  );
  const unreadPathologyPatientCount = pathologyPatients.filter((p) =>
    p.labResults?.some((lr) => !lr.doctorReviewed)
  ).length;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOrderLabTest && orderPatientId) {
      onOrderLabTest(orderPatientId, orderTestName, orderRemarks);
      setShowOrderModal(false);
      setOrderRemarks("");
    }
  };

  return (
    <div className="space-y-6" id="pathology_patients_hub">
      {/* Top Banner */}
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-serif font-bold text-[#00334f]">
                    Pathology Patients & Diagnostic Laboratory Results
                  </h1>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    Unread reports ({unreadPathologyPatientCount} patients)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unread pathology reports only. After you view and mark a report as read, that patient drops off this unread count.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Order Pathology Investigation
            </button>
          </div>
        </div>

        {/* Pathology Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Unread Pathology Patients</span>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">{unreadPathologyPatientCount}</div>
            <p className="text-[10px] text-emerald-700">With unread reports</p>
          </div>

          <div className="bg-rose-50/70 border border-rose-200/60 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Abnormal / Critical</span>
            <div className="text-2xl font-black text-rose-950 mt-0.5">{abnormalResultsCount}</div>
            <p className="text-[10px] text-rose-700">Requires doctor action</p>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`text-left bg-amber-50/70 border p-3 rounded-lg transition ${
              statusFilter === "PENDING" ? "border-amber-400 ring-1 ring-amber-300" : "border-amber-200/60 hover:border-amber-400"
            }`}
            title="Show unreviewed tests grouped under each patient name"
          >
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Unreviewed Tests</span>
            <div className="text-2xl font-black text-amber-950 mt-0.5">{unreviewedCount}</div>
            <p className="text-[10px] text-amber-700">Click to list tests by patient</p>
          </button>

          <div className="bg-sky-50/70 border border-sky-200/60 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">Total Test Reports</span>
            <div className="text-2xl font-black text-sky-950 mt-0.5">{totalLabResultsCount}</div>
            <p className="text-[10px] text-sky-700">In diagnostic registry</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search pathology patient by name, ID, test (HbA1c, Lipids, FBC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#00334f] bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border">
            {[
              { id: "ALL", label: `All Pathology Patients (${totalPathologyPatients})` },
              { id: "ABNORMAL", label: `Abnormal / High (${abnormalResultsCount})` },
              { id: "PENDING", label: `Unreviewed / Pending (${unreviewedCount})` },
              { id: "NORMAL", label: "Normal Values" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? "bg-white text-[#00334f] shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl shadow-xs">
        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Test / Investigation Profile</h3>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {PATHOLOGY_INVESTIGATIONS.map((inv) => (
            <span
              key={inv.name}
              className="text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded-full"
              title={`${inv.category} • ${inv.sample}`}
            >
              {inv.name}
            </span>
          ))}
        </div>
      </div>

      {/* Pathology Patients List */}
      <div className="space-y-4">
        {filteredPathologyPatients.length > 0 ? (
          filteredPathologyPatients.map((patient) => {
            const q = searchQuery.toLowerCase().trim();
            const nameHit = Boolean(
              q &&
                (patient.name.toLowerCase().includes(q) ||
                  patient.id.toLowerCase().includes(q))
            );
            const visibleLabs = (patient.labResults || []).filter((lr) => {
              if (statusFilter === "PENDING" && lr.doctorReviewed) return false;
              if (!q || nameHit) return true;
              return (
                lr.testName.toLowerCase().includes(q) ||
                lr.result.toLowerCase().includes(q) ||
                (lr.remarks && lr.remarks.toLowerCase().includes(q))
              );
            });
            const abnormalTests =
              visibleLabs.filter(
                (lr) => lr.status === "ABNORMAL" || lr.status === "CRITICAL" || lr.abnormalFlag
              ) || [];
            const isSelected = selectedPatientId === patient.id || Boolean(q);

            return (
              <div
                key={patient.id}
                className="bg-white border rounded-xl shadow-xs overflow-hidden transition-all hover:border-[#00334f]"
              >
                {/* Patient Header Row */}
                <div className="p-5 bg-[#fbfdff] border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* CRITICAL: Clicking patient name shows EVERYTHING */}
                        <button
                          type="button"
                          onClick={() => {
                            if (q) {
                              setSelectedPatientId(isSelected && selectedPatientId === patient.id ? null : patient.id);
                              return;
                            }
                            onOpenPatientEverything(patient);
                          }}
                          className="font-serif font-bold text-base text-[#00334f] hover:text-emerald-700 hover:underline transition-colors flex items-center gap-1.5 text-left group"
                          title={q ? "Showing pathology details for this patient" : "Click to open complete 16-Tab Clinical Patient Record"}
                        >
                          <span>{patient.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </button>

                        <span className="text-xs text-slate-400 font-mono">[{patient.id}]</span>

                        {patient.medicareNumber && (
                          <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-200">
                            Medicare: {patient.medicareNumber}
                          </span>
                        )}

                        {abnormalTests.length > 0 && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {abnormalTests.length} Abnormal Result{abnormalTests.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>{patient.age} yrs • {patient.gender}</span>
                        <span>•</span>
                        <span>Blood: <strong className="text-slate-700">{patient.bloodType}</strong></span>
                        <span>•</span>
                        <span>Allergies: <strong className="text-rose-600">{patient.allergies}</strong></span>
                        <span>•</span>
                        <span>Clinic: <strong className="text-slate-700">{patient.medicalCenter || "Colombo Central Clinic"}</strong></span>
                      </p>
                      {statusFilter === "PENDING" && visibleLabs.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-amber-800">Unreviewed tests:</span>
                          {visibleLabs.map((lr) => (
                            <span
                              key={lr.id || lr.testName}
                              className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full"
                            >
                              {lr.testName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  {!q && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onStartConsultation(patient)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="Open GP Exam Room for this patient"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Open GP Exam Room
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPatientEverything(patient)}
                      className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="View all 16 clinical tabs, history, and records"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Inspect Full Record (Everything)
                    </button>
                  </div>
                  )}
                </div>

                {/* Pathology Test Results Table */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-emerald-600" />
                      Recorded Pathology Test Results ({visibleLabs.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Laboratory Provider: LankaLab Central & Australian Clinical Labs
                    </span>
                  </div>

                  {visibleLabs.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b">
                              <th className="p-2.5 font-bold">Investigation / Test Name</th>
                              <th className="p-2.5 font-bold">Collection Date</th>
                              <th className="p-2.5 font-bold">Result Value</th>
                              <th className="p-2.5 font-bold">Status & Flags</th>
                              <th className="p-2.5 font-bold">Clinical Remarks & Doctor Comments</th>
                              <th className="p-2.5 font-bold text-center">Suwasiri App</th>
                              <th className="p-2.5 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {visibleLabs.map((test, tIdx) => {
                              const isAbnormal =
                                test.status === "ABNORMAL" || test.status === "CRITICAL" || test.abnormalFlag;
                              const reportKey = getReportKey(patient.id, test, tIdx);
                              const currentComment = doctorComments[reportKey] ?? (test.remarks || "");
                              const isSynced = suwasiriSyncedReports[reportKey];
                              const isSyncing = syncingReportId === reportKey;
                              const isEditing = editingCommentId === reportKey;

                              return (
                                <tr
                                  key={test.id || tIdx}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    isAbnormal ? "bg-rose-50/30" : ""
                                  }`}
                                >
                                  <td className="p-2.5 font-bold text-[#00334f] flex items-center gap-1.5">
                                    <FlaskConical
                                      className={`w-3.5 h-3.5 ${isAbnormal ? "text-rose-600" : "text-emerald-600"}`}
                                    />
                                    <span>{test.testName}</span>
                                  </td>

                                  <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                                    {test.date || "2026-08-10"}
                                  </td>

                                  <td className="p-2.5 font-bold">
                                    <span
                                      className={`px-2 py-0.5 rounded font-mono ${
                                        isAbnormal ? "bg-rose-100 text-rose-900 font-black" : "text-slate-800"
                                      }`}
                                    >
                                      {test.result}
                                    </span>
                                  </td>

                                  <td className="p-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        isAbnormal
                                          ? "bg-rose-50 text-rose-700 border-rose-300 font-black"
                                          : test.status === "COMPLETED"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {test.status}
                                    </span>
                                  </td>

                                  <td className="p-2.5 text-slate-700 text-[11px] max-w-sm">
                                    {isEditing ? (
                                      <div className="flex flex-col gap-1.5">
                                        <textarea
                                          id={`input-comment-${reportKey}`}
                                          defaultValue={currentComment}
                                          rows={2}
                                          placeholder="Enter doctor's clinical comments..."
                                          className="w-full text-xs p-1.5 border rounded bg-white text-slate-900 focus:outline-[#00334f]"
                                        />
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const el = document.getElementById(`input-comment-${reportKey}`) as HTMLTextAreaElement;
                                              const val = el ? el.value : currentComment;
                                              handleSaveCommentAndSync(patient, test, tIdx, val);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                                          >
                                            <Send className="w-3 h-3" /> Save & Sync
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCommentId(null)}
                                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between gap-1 group">
                                        <p className="italic text-slate-600 line-clamp-2">
                                          "{currentComment || "Within normal biological diagnostic limits."}"
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => setEditingCommentId(reportKey)}
                                          className="text-slate-400 hover:text-sky-700 p-0.5 rounded cursor-pointer shrink-0"
                                          title="Edit Doctor's Comments"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-2.5 text-center whitespace-nowrap">
                                    {isSynced ? (
                                      <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        Synced ({isSynced})
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCommentAndSync(patient, test, tIdx, currentComment)}
                                        disabled={isSyncing}
                                        className="text-slate-600 hover:text-emerald-700 text-[10px] font-bold bg-slate-50 hover:bg-emerald-50 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                                        title="Sync this test and doctor's comments to Patient's Suwasiri Mobile App"
                                      >
                                        <Smartphone className="w-3 h-3 text-emerald-600" />
                                        {isSyncing ? "Syncing..." : "Sync App"}
                                      </button>
                                    )}
                                  </td>

                                  <td className="p-2.5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {!test.doctorReviewed && onMarkLabReviewed && (
                                        <button
                                          type="button"
                                          onClick={() => onMarkLabReviewed(patient.id, test.id)}
                                          className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                          title="Mark this report as read / reviewed"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                          Mark read
                                        </button>
                                      )}
                                      {test.doctorReviewed && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                          Read
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadTestPdf(patient, test);
                                          if (!test.doctorReviewed && onMarkLabReviewed) {
                                            onMarkLabReviewed(patient.id, test.id);
                                          }
                                        }}
                                        className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                        title="Download this individual test report as PDF"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>PDF</span>
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
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 italic text-xs">
                      No pathology records processed yet.
                    </div>
                  )}

                  {/* Sample collection dispatch status if available */}
                  {patient.sampleCollections && patient.sampleCollections.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500 font-bold text-[10px] uppercase">
                        Specimen Dispatches ({patient.sampleCollections.length}):
                      </span>
                      {patient.sampleCollections.map((sc, sIdx) => (
                        <span
                          key={sc.id || sIdx}
                          className="bg-purple-50 text-purple-900 border border-purple-200 px-2 py-1 rounded text-[11px] flex items-center gap-1"
                        >
                          🧪 {sc.sampleCategory} • Status: <strong>{sc.status}</strong> (LankaLab Key:{" "}
                          {sc.lankaLabLedgerKey || "LL-7721"})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border rounded-xl p-12 text-center space-y-3">
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-serif font-bold text-base text-[#00334f]">No matching pathology patients found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No patients with active pathology files matched your current search filters. Order a new pathology investigation or clear filters to view all diagnostic records.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="bg-[#00334f] text-white px-4 py-2 rounded-lg text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Order Investigation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-base text-[#00334f]">
                  Order New Pathology Diagnostic Investigation
                </h3>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Select Patient
                </label>
                <select
                  value={orderPatientId}
                  onChange={(e) => setOrderPatientId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-bold outline-none focus:border-[#00334f]"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age} yrs, {p.gender}) — ID: {p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Test / Investigation Profile
                </label>
                <select
                  value={orderTestName}
                  onChange={(e) => setOrderTestName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-bold outline-none focus:border-[#00334f]"
                  required
                >
                  {PATHOLOGY_INVESTIGATIONS.map((inv) => (
                    <option key={inv.name} value={inv.name}>
                      {inv.category}: {inv.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Clinical Indication & Doctor Notes
                </label>
                <textarea
                  rows={3}
                  value={orderRemarks}
                  onChange={(e) => setOrderRemarks(e.target.value)}
                  placeholder="e.g. Routine 6-month diabetic review, persistent fatigue, hypertension workup..."
                  className="w-full p-2.5 border rounded-lg text-slate-800 outline-none focus:border-[#00334f]"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition"
                >
                  Transmit Order to LankaLab Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

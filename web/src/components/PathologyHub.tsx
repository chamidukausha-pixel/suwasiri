import React, { useState } from "react";
import {
  FlaskConical,
  Search,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Plus,
  Download,
  Send,
  Edit3,
  Eye,
  X
} from "lucide-react";
import { Patient, LabResult, LabOrder } from "../types";
import { PATHOLOGY_INVESTIGATIONS } from "../catalogs/pathologyInvestigations";
import PatientSexAgeBadge from "./PatientSexAgeBadge";
import PatientCriticalAlertBadge from "./PatientCriticalAlertBadge";

interface Props {
  patients: Patient[];
  labOrders?: LabOrder[];
  currentRole: string;
  onStartConsultation: (patient: Patient) => void;
  onOrderLabTest?: (patientId: string, testName: string, remarks: string, patientName?: string) => void;
  onReviewLab?: (patient: Patient, lab: LabResult, opts?: { critical?: boolean; comment?: string }) => void;
}

export default function PathologyHub({
  patients,
  labOrders = [],
  currentRole,
  onStartConsultation,
  onOrderLabTest,
  onReviewLab
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPatientId, setOrderPatientId] = useState("");
  const [orderTestName, setOrderTestName] = useState(PATHOLOGY_INVESTIGATIONS[0].name);
  const [orderRemarks, setOrderRemarks] = useState("");

  // Doctor comments & Suwasiri app sync state
  const [doctorComments, setDoctorComments] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<{ patient: Patient; test: LabResult } | null>(null);

  const getReportKey = (patientId: string, test: LabResult, idx: number) => {
    return test.id || `${patientId}_${test.testName}_${idx}`;
  };

  const reportComment = (patient: Patient, test: LabResult) => {
    const reportKey = test.id || `${patient.id}_${test.testName}`;
    return doctorComments[reportKey] || test.remarks || "Within biological clinical limits.";
  };

  const buildReportText = (patient: Patient, test: LabResult) => {
    const comment = reportComment(patient, test);
    return `
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
Suwasiri App Sync: ACTIVE (Vault Lab reports)
================================================================================
    `.trim();
  };

  const markReportCompleted = (patient: Patient, test: LabResult) => {
    onReviewLab?.(patient, test, { comment: reportComment(patient, test) });
    setViewingReport((prev) =>
      prev && prev.patient.id === patient.id && prev.test.id === test.id ? null : prev
    );
  };

  const handleDownloadTestPdf = (patient: Patient, test: LabResult) => {
    const content = buildReportText(patient, test);

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

  const unreadPatients = patients.filter((p) =>
    p.labResults?.some((lr) => !lr.doctorReviewed)
  );
  const unreadPathologyPatientCount = unreadPatients.length;

  const filteredPathologyPatients = unreadPatients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.medicareNumber && p.medicareNumber.toLowerCase().includes(q)) ||
      (p.suwasiriBarcode && p.suwasiriBarcode.toLowerCase().includes(q)) ||
      p.labResults?.some(
        (lr) =>
          !lr.doctorReviewed &&
          (lr.testName.toLowerCase().includes(q) ||
            lr.result.toLowerCase().includes(q) ||
            (lr.remarks && lr.remarks.toLowerCase().includes(q)))
      ) ||
      labOrders.some(
        (o) =>
          o.patientId === p.id &&
          (o.testName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
      )
    );
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOrderLabTest && orderPatientId) {
      const named = patients.find((p) => p.id === orderPatientId)?.name;
      onOrderLabTest(orderPatientId, orderTestName, orderRemarks, named);
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
                  Unread reports only. After you review a result it leaves this list, is stored under Pathology history on the patient file, and syncs to Suwasiri Vault → Lab reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOrderPatientId("");
                setShowOrderModal(true);
              }}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Order Pathology Investigation
            </button>
          </div>
        </div>

        {/* Unread Pathology colourful dashboard */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 rounded-xl shadow-md text-white">
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-50">Unread Pathology</span>
            <div className="text-4xl font-black mt-1">{unreadPathologyPatientCount}</div>
            <p className="text-[12px] text-amber-50 mt-1 font-semibold">
              Patients with unread reports. Review (or mark Critical / Alert) to lower this count.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search unread pathology by name, ID, or test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#00334f] bg-slate-50 focus:bg-white"
            />
          </div>
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
              if (lr.doctorReviewed) return false;
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
                      <h2 className="font-serif font-bold text-base text-[#00334f]">{patient.name}</h2>
                      <PatientSexAgeBadge gender={patient.gender} age={patient.age} />
                      <PatientCriticalAlertBadge patient={patient} />
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-mono">[{patient.id}]</span>

                        {patient.medicareNumber && (
                          <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-200">
                            Medicare: {patient.medicareNumber}
                          </span>
                        )}

                        {abnormalTests.length > 0 && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {abnormalTests.length} Abnormal Result{abnormalTests.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Blood: <strong className="text-slate-700">{patient.bloodType}</strong></span>
                        <span>•</span>
                        <span>Allergies: <strong className="text-rose-600">{patient.allergies}</strong></span>
                        <span>•</span>
                        <span>Clinic: <strong className="text-slate-700">{patient.medicalCenter || "Colombo Central Clinic"}</strong></span>
                      </p>
                      {visibleLabs.length > 0 && (
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
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onStartConsultation(patient)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="Open GP Exam Room — completed reports live under Pathology history"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Open GP Exam Room
                    </button>
                  </div>
                </div>

                {/* Pathology Test Results Table */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-emerald-600" />
                      Recorded unread results ({visibleLabs.length})
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
                              <th className="p-2.5 font-bold text-right">View</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {visibleLabs.map((test, tIdx) => {
                              const isAbnormal =
                                test.status === "ABNORMAL" || test.status === "CRITICAL" || test.abnormalFlag;
                              const reportKey = getReportKey(patient.id, test, tIdx);
                              const currentComment = doctorComments[reportKey] ?? (test.remarks || "");
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
                                              setDoctorComments((prev) => ({ ...prev, [reportKey]: val }));
                                              setEditingCommentId(null);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                                          >
                                            <Send className="w-3 h-3" /> Save comment
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

                                  <td className="p-2.5 text-right whitespace-nowrap">
                                    <div className="flex flex-col items-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setViewingReport({ patient, test })}
                                        className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="View this pathology report"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => markReportCompleted(patient, test)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Completed: leave unread list and file under Pathology history"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Completed
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onReviewLab?.(patient, test, { critical: true, comment: currentComment })}
                                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Mark critical / alert: red-alert this patient, notify Recalls & Reminders so reception can call and rebook"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        Critical / Alert
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadTestPdf(patient, test)}
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
            <h3 className="font-serif font-bold text-base text-[#00334f]">No unread pathology reports</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Completed results leave this inbox and are filed under the patient’s GP Exam Room → Pathology history (and Suwasiri Vault → Lab reports).
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="bg-[#00334f] text-white px-4 py-2 rounded-lg text-xs font-bold"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start gap-3 border-b px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Pathology report</p>
                <h3 className="font-serif font-bold text-base text-[#00334f]">
                  {viewingReport.test.testName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingReport.patient.name} · {viewingReport.patient.id} · {viewingReport.test.date || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto p-5 text-[11px] leading-relaxed font-mono text-slate-800 whitespace-pre-wrap bg-slate-50">
              {buildReportText(viewingReport.patient, viewingReport.test)}
            </pre>
            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">
              <button
                type="button"
                onClick={() => handleDownloadTestPdf(viewingReport.patient, viewingReport.test)}
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded text-[11px] font-bold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                type="button"
                onClick={() => markReportCompleted(viewingReport.patient, viewingReport.test)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[11px] font-bold inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Select Patient — the notification is filed under this name
                </label>
                <select
                  value={orderPatientId}
                  onChange={(e) => setOrderPatientId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-bold outline-none focus:border-[#00334f]"
                  required
                >
                  <option value="">Choose the patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age} yrs, {p.gender}) — ID: {p.id}
                    </option>
                  ))}
                </select>
                {orderPatientId ? (
                  <p className="text-[11px] font-bold text-emerald-800 mt-1">
                    Request will notify Sample Dispatch Hub under {patients.find((p) => p.id === orderPatientId)?.name}.
                  </p>
                ) : null}
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

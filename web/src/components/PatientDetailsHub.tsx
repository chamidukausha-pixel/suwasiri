import React, { useState, FormEvent, useEffect } from "react";
import { 
  FileText, Syringe, FlaskConical, Plus, Clipboard, Loader2, Play, Check, Trash2, Printer, AlertCircle, Sparkles,
  Mail, RefreshCw, Calendar, ShieldCheck, CheckCircle, Activity, Heart
} from "lucide-react";
import { Patient, VaccineRecord, LabResult, PrescriptionRecord, LabOrder, SampleCollection } from "../types";

interface Props {
  patient: Patient;
  labOrders: LabOrder[];
  drugsDatabase: string[];
  currentRole: string;
  onClose: () => void;
  onAddHistoryItem: (patientId: string, currentHistory: string[]) => void;
  onAddVaccine: (patientId: string, vaccine: VaccineRecord) => void;
  onOrderLabTest: (patientId: string, testName: string, remarks: string) => void;
  onProcessLabResult: (orderId: string, resultVal: string) => void;
  onRenderPrescription: (rx: PrescriptionRecord) => void;
  onStateUpdate?: (updatedState: any) => void;
  onWalkInCheckIn?: (patient: Patient) => void;
  initialSubTab?: "history" | "vaccines" | "labs" | "prescriptions" | "mc" | "samples";
}

export default function PatientDetailsHub({
  patient,
  labOrders,
  drugsDatabase,
  currentRole,
  onClose,
  onAddHistoryItem,
  onAddVaccine,
  onOrderLabTest,
  onProcessLabResult,
  onRenderPrescription,
  onStateUpdate,
  onWalkInCheckIn,
  initialSubTab,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"history" | "vaccines" | "labs" | "prescriptions" | "mc" | "samples">(initialSubTab || "history");

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, patient.id]);

  // Medical history states
  const [newHistInput, setNewHistInput] = useState("");

  // Vaccines states
  const [vaccName, setVaccName] = useState("");
  const [vaccDate, setVaccDate] = useState(new Date().toISOString().split("T")[0]);
  const [vaccDose, setVaccDose] = useState("1st Dose");
  const [vaccBatch, setVaccBatch] = useState("");

  // Lab orders states
  const [selectedLabTest, setSelectedLabTest] = useState("Full Blood Count (FBC)");
  const [labRemarks, setLabRemarks] = useState("");
  const [typedLabResultVal, setTypedLabResultVal] = useState("");
  const [simulatingOrderId, setSimulatingOrderId] = useState<string | null>(null);

  const matchedPatientOrders = labOrders.filter(o => o.patientId === patient.id);

  // Medical Certificate States
  const [mcDiagnosis, setMcDiagnosis] = useState("");
  const [mcStartDate, setMcStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [mcEndDate, setMcEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [mcNumDays, setMcNumDays] = useState(1);
  const [mcStatus, setMcStatus] = useState<"UNFIT_FOR_WORK" | "FIT_FOR_LIGHT_DUTY" | "FIT_FOR_DUTY">("UNFIT_FOR_WORK");
  const [mcRemarks, setMcRemarks] = useState("");
  const [mcDocName, setMcDocName] = useState("Dr. Priyantha Silva");
  const [mcDocReg, setMcDocReg] = useState("SLMC-48291");
  const [mcRecipientEmail, setMcRecipientEmail] = useState(patient.email || "");

  // Syncing & Email actions states
  const [syncingCertId, setSyncingCertId] = useState<string | null>(null);
  const [syncingPortal, setSyncingPortal] = useState<"suwasiri" | "lankalab" | null>(null);
  const [emailingCertId, setEmailingCertId] = useState<string | null>(null);
  const [selectedEmailBody, setSelectedEmailBody] = useState<string | null>(null);
  const [draftingErr, setDraftingErr] = useState("");

  // Sample collection States
  const [newSampleCategory, setNewSampleCategory] = useState<"Blood" | "Urinal" | "Both Blood & Urinal">("Blood");
  const [loggingSample, setLoggingSample] = useState(false);
  const [dispatchName, setDispatchName] = useState("");
  const [dispatchPhone, setDispatchPhone] = useState("");
  const [dispatchId, setDispatchId] = useState("");
  const [dispatchLab, setDispatchLab] = useState("LankaLab - Colombo General");
  const [deliveringSampleId, setDeliveringSampleId] = useState<string | null>(null);
  const [doingActionId, setDoingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (mcStartDate && mcEndDate) {
      const start = new Date(mcStartDate);
      const end = new Date(mcEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setMcNumDays(diffDays > 0 ? diffDays : 1);
      }
    }
  }, [mcStartDate, mcEndDate]);

  // Sync recipient email if patient prop updates
  useEffect(() => {
    if (patient.email) {
      setMcRecipientEmail(patient.email);
    }
  }, [patient.email]);

  const handleCreateHistory = (e: FormEvent) => {
    e.preventDefault();
    if (!newHistInput.trim()) return;
    onAddHistoryItem(patient.id, [...patient.medicalHistory, newHistInput.trim()]);
    setNewHistInput("");
  };

  const handleCreateVaccine = (e: FormEvent) => {
    e.preventDefault();
    if (!vaccName.trim()) return;
    const item: VaccineRecord = {
      vaccineName: vaccName.trim(),
      date: vaccDate,
      dose: vaccDose,
      batchNumber: vaccBatch || `VAC-B-${Math.floor(100 + Math.random()*900)}`,
      status: "Completed"
    };
    onAddVaccine(patient.id, item);
    setVaccName("");
    setVaccBatch("");
  };

  const handleTriggerLabOrder = () => {
    onOrderLabTest(patient.id, selectedLabTest, labRemarks || "Requested by Dr. Priyantha Silva");
    setLabRemarks("");
  };

  const triggerAnalyzeOrderSample = (order: LabOrder) => {
    setSimulatingOrderId(order.id);
    let autoResult = "Serum Potassium: 4.0 mmol/L (Normal range, Reference: 3.5 - 5.1 mmol/L)";
    if (order.testName.includes("Dengue")) {
      autoResult = "Dengue NS1 Antigen Antigen: NEGATIVE (Non-reactive)";
    } else if (order.testName.includes("Full Blood Count")) {
      autoResult = "White Blood Count (WBC): 6.8 x10^3/uL, Hemoglobin: 13.5 g/dL, Platelets count: 220 x10^3/uL (Normal limits)";
    } else if (order.testName.includes("Glucose")) {
      autoResult = "Fasting Blood Glucose: 98 mg/dL (Normal limit range)";
    } else if (order.testName.includes("Lipid")) {
      autoResult = "Cholesterol: 195 mg/dL (Normal), Triglycerides: 130 mg/dL, LDL-C: 110 mg/dL";
    }

    setTypedLabResultVal(autoResult);
  };

  const handleConfirmLabResultCertification = (orderId: string) => {
    onProcessLabResult(orderId, typedLabResultVal || "Analyzed within healthy boundaries.");
    setSimulatingOrderId(null);
    setTypedLabResultVal("");
  };

  const [mcLoading, setMcLoading] = useState(false);

  const handleCreateMedicalCertificate = async (e: FormEvent) => {
    e.preventDefault();
    if (!mcDiagnosis.trim()) return;
    setMcLoading(true);
    setDraftingErr("");
    try {
      const res = await fetch(`/api/patients/${patient.id}/medical-certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: mcDiagnosis.trim(),
          startDate: mcStartDate,
          endDate: mcEndDate,
          numDays: mcNumDays,
          status: mcStatus,
          doctorName: mcDocName,
          doctorRegNo: mcDocReg,
          additionalRemarks: mcRemarks,
          recipientEmail: mcRecipientEmail
        })
      });
      if (!res.ok) {
        throw new Error("Failed to create medical certificate");
      }
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
      setMcDiagnosis("");
      setMcRemarks("");
    } catch (err: any) {
      setDraftingErr(err.message || "Unknown error creating certificate");
    } finally {
      setMcLoading(false);
    }
  };

  const handleSendMCEmail = async (certId: string) => {
    setEmailingCertId(certId);
    setDraftingErr("");
    try {
      const res = await fetch(`/api/medical-certificates/${patient.id}/${certId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        throw new Error("Failed to compile or transmit e-mail dispatch.");
      }
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
      setSelectedEmailBody(data.emailBody);
    } catch (err: any) {
      alert("Error sending certificate email: " + err.message);
    } finally {
      setEmailingCertId(null);
    }
  };

  const handleSyncSuwasiri = async (certId: string) => {
    setSyncingCertId(certId);
    setSyncingPortal("suwasiri");
    try {
      const res = await fetch(`/api/medical-certificates/${patient.id}/${certId}/sync-suwasiri`, {
        method: "POST"
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
    } catch (err) {
      alert("Suwasiri App synchronization gateway is temporarily offline or refused connection.");
    } finally {
      setSyncingCertId(null);
      setSyncingPortal(null);
    }
  };

  const handleSyncLankaLab = async (certId: string) => {
    setSyncingCertId(certId);
    setSyncingPortal("lankalab");
    try {
      const res = await fetch(`/api/medical-certificates/${patient.id}/${certId}/sync-lankalab`, {
        method: "POST"
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
    } catch (err) {
      alert("LankaLab portal database index gateway is temporarily offline.");
    } finally {
      setSyncingCertId(null);
      setSyncingPortal(null);
    }
  };

  const handleLogSampleCollection = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingSample(true);
    try {
      const res = await fetch("/api/sample-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          sampleCategory: newSampleCategory
        })
      });
      if (!res.ok) throw new Error("Could not log sample selection core reference");
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
      alert(`Successfully registered ${newSampleCategory} sample logging record!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoggingSample(false);
    }
  };

  const handleCollectSample = async (id: string) => {
    setDoingActionId(id);
    try {
      const res = await fetch(`/api/sample-collections/${id}/collect`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Could not transition sample collection status");
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDoingActionId(null);
    }
  };

  const handleDeliverSampleAndSync = async (id: string) => {
    if (!dispatchName.trim()) {
      alert("Please provide the courier / delivery person's full name to issue dispatcher certificates.");
      return;
    }
    setDoingActionId(id);
    try {
      const res = await fetch(`/api/sample-collections/${id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPersonName: dispatchName,
          deliveryPersonPhone: dispatchPhone,
          deliveryPersonId: dispatchId,
          labName: dispatchLab
        })
      });
      if (!res.ok) throw new Error("Could not process LankaLab portal handshake");
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
      setDeliveringSampleId(null);
      setDispatchName("");
      setDispatchPhone("");
      setDispatchId("");
      alert(`Success! Handed over to dispatcher ${dispatchName} & securely synced with LankaLab diagnostics framework.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDoingActionId(null);
    }
  };

  // Patient Details & Demographics Editing States
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);
  const [editName, setEditName] = useState(patient.name);
  const [editAge, setEditAge] = useState(patient.age);
  const [editGender, setEditGender] = useState(patient.gender);
  const [editBloodType, setEditBloodType] = useState(patient.bloodType || "O+");
  const [editAllergies, setEditAllergies] = useState(patient.allergies || "None declared");
  const [editPhone, setEditPhone] = useState(patient.phone || "+94 77 000 0000");
  const [editEmail, setEditEmail] = useState(patient.email || "patient@gmail.com");
  const [editMedicalCenter, setEditMedicalCenter] = useState(patient.medicalCenter || "Colombo Central Clinic");
  const [editSaving, setEditSaving] = useState(false);

  // Sync edits when properties change
  useEffect(() => {
    setEditName(patient.name);
    setEditAge(patient.age);
    setEditGender(patient.gender);
    setEditBloodType(patient.bloodType || "O+");
    setEditAllergies(patient.allergies || "None declared");
    setEditPhone(patient.phone || "+94 77 000 0000");
    setEditEmail(patient.email || "patient@gmail.com");
    setEditMedicalCenter(patient.medicalCenter || "Colombo Central Clinic");
  }, [patient]);

  const handleSaveDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          age: editAge,
          gender: editGender,
          bloodType: editBloodType,
          allergies: editAllergies,
          phone: editPhone,
          email: editEmail,
          medicalCenter: editMedicalCenter
        })
      });
      if (!res.ok) {
        throw new Error("Failed to preserve updated demographics in central registry.");
      }
      const data = await res.json();
      if (onStateUpdate) {
        onStateUpdate(data.state);
      }
      setIsEditingDemographics(false);
    } catch (err: any) {
      alert("Error saving patient demographics: " + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 overflow-y-auto flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white border rounded-lg shadow-xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Hub Header */}
        <div className="bg-[#00334f] text-white p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            {patient.image ? (
              <img
                src={patient.image}
                alt={patient.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-sky-200 text-slate-800 font-bold flex items-center justify-center text-sm shrink-0">
                {patient.name.split(" ").map(n => n[0]).join("")}
              </div>
            )}
            
            {!isEditingDemographics ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                  <h2 className="font-serif font-bold text-lg leading-tight">{patient.name}</h2>
                  <span className="bg-sky-900 border border-sky-700/80 text-sky-100 font-bold text-[9px] px-2 py-0.5 rounded">
                    ⚕ Center: {patient.medicalCenter || "Colombo Central Clinic"}
                  </span>
                </div>
                <p className="text-xs text-sky-200">
                  Patient File: #{patient.id} • {patient.gender}, {patient.age} yrs • Blood Group: {patient.bloodType} • Phone: {patient.phone} • Email: {patient.email}
                </p>
                <p className="text-[10px] text-sky-300 italic">
                  Allergies: <span className="text-rose-300 font-bold">{patient.allergies || "None declared"}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveDemographics} className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full text-xs text-slate-800">
                <div className="col-span-2 lg:col-span-2">
                  <label className="block text-[9px] font-bold text-sky-100">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-sky-100">Age</label>
                  <input
                    type="number"
                    required
                    value={editAge}
                    onChange={(e) => setEditAge(parseInt(e.target.value) || 0)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-sky-100">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-sky-100">Blood Type</label>
                  <select
                    value={editBloodType}
                    onChange={(e) => setEditBloodType(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-sky-100">Phone</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-sky-100">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-sky-100">Medical Center Location</label>
                  <select
                    value={editMedicalCenter}
                    onChange={(e) => setEditMedicalCenter(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs font-semibold text-emerald-800"
                  >
                    <option value="Colombo Central Clinic">Colombo Central Clinic</option>
                    <option value="Kandy Wellness Center">Kandy Wellness Center</option>
                    <option value="Galle GP Care">Galle GP Care</option>
                    <option value="Jaffna Medical Hub">Jaffna Medical Hub</option>
                  </select>
                </div>
                <div className="col-span-2 lg:col-span-2">
                  <label className="block text-[9px] font-bold text-sky-100">Sensitivity / Allergies</label>
                  <input
                    type="text"
                    value={editAllergies}
                    onChange={(e) => setEditAllergies(e.target.value)}
                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                  />
                </div>
                <div className="col-span-2 flex items-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 px-3 rounded text-xs transition duration-150 disabled:opacity-50"
                  >
                    {editSaving ? "Saving..." : "Save Demographics"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDemographics(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold p-1 px-3 rounded text-xs transition duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {onWalkInCheckIn && !isEditingDemographics && (
              <button
                type="button"
                onClick={() => onWalkInCheckIn(patient)}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 px-3 py-1.5 rounded transition-all flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Check-In Walk-In (Book)
              </button>
            )}
            {!isEditingDemographics && (
              <button
                onClick={() => setIsEditingDemographics(true)}
                className="text-xs font-bold text-white bg-sky-700 hover:bg-sky-600 border border-sky-500/50 px-3 py-1.5 rounded transition-all"
              >
                Edit Demographics & Center
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>

        {/* Hub Tab Navs */}
        <div className="bg-slate-100 border-b flex px-4">
          <button
            onClick={() => { setActiveSubTab("history"); setSimulatingOrderId(null); }}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "history" ? "border-[#00334f] text-[#00334f]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Medical History
          </button>
          <button
            onClick={() => { setActiveSubTab("vaccines"); setSimulatingOrderId(null); }}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "vaccines" ? "border-[#00334f] text-[#00334f]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Syringe className="w-4 h-4" />
            Vaccination logs
          </button>
          <button
            onClick={() => { setActiveSubTab("labs"); setSimulatingOrderId(null); }}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "labs" ? "border-[#00334f] text-[#00334f]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Lab reports & Orders ({patient.labResults ? patient.labResults.length : 0})
          </button>
          <button
            onClick={() => { setActiveSubTab("prescriptions"); setSimulatingOrderId(null); }}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "prescriptions" ? "border-[#00334f] text-[#00334f]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            e-Prescriptions List ({patient.prescriptionsList ? patient.prescriptionsList.length : 0})
          </button>
          <button
            onClick={() => { setActiveSubTab("mc"); setSimulatingOrderId(null); }}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "mc" ? "border-[#00334f] text-[#00334f]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Heart className="w-4 h-4" />
            Medical Certificates ({patient.medicalCertificatesList ? patient.medicalCertificatesList.length : 0})
          </button>
          <button
            onClick={() => { setActiveSubTab("samples"); setSimulatingOrderId(null); }}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "samples" ? "border-[#00334f] text-[#00334f]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FlaskConical className="w-4 h-4 text-rose-500" />
            Sample Collections ({patient.sampleCollections ? patient.sampleCollections.length : 0})
          </button>
        </div>

        {/* Tab content panel */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[60vh]">
          {/* TAB: MEDICAL HISTORY */}
          {activeSubTab === "history" && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded text-xs text-amber-900 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <p className="font-bold">Cautionary Allergies registered on system:</p>
                  <p className="mt-1 font-semibold text-red-600 font-sans text-sm">{patient.allergies || "No allergen alerts recorded."}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Persistent Medical System Conditions</h3>
                <div className="space-y-1.5 pr-2">
                  {patient.medicalHistory && patient.medicalHistory.map((item, index) => (
                    <div key={index} className="bg-slate-50 border p-3 rounded text-xs font-semibold text-slate-700 flex justify-between items-center">
                      <span>• {item}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold">Standard GP Record</span>
                    </div>
                  ))}
                  {(!patient.medicalHistory || patient.medicalHistory.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No previous clinical history logged on this patient.</p>
                  )}
                </div>
              </div>

              {/* SECTION: CLINIC ISSUED MEDICINES & SUWASIRI PORTAL AUTO-SYNC */}
              <div className="border bg-[#ebf5f3]/50 border-emerald-200/60 p-4 rounded-lg space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-2">
                  <div>
                    <h3 className="font-black text-xs uppercase text-[#0d3f2a] tracking-wider">Issued Medicines by Clinic</h3>
                    <p className="text-[10px] text-slate-500">Live active medicinal records synced dynamically with patient's Suwasiri mobile app profile.</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full self-start">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Suwasiri Portal Synced</span>
                  </div>
                </div>

                <div className="space-y-2 pr-1">
                  {patient.prescriptionsList && patient.prescriptionsList.map((rx) => (
                    <div key={rx.id} className="bg-white border rounded p-3 relative hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-center border-b pb-1.5 mb-2">
                        <span className="font-bold text-xs text-[#00334f]">ID: {rx.rxNumber}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Issued: {rx.date}</span>
                      </div>
                      <div className="space-y-2">
                        {rx.items && rx.items.map((item, itemIdx) => {
                          const rxMatch = item.match(/^(.*?)\[(.*?)\]$/);
                          const parsed = rxMatch ? {
                            name: rxMatch[1].trim(),
                            desc: rxMatch[2].split(",")[0]?.trim() || "",
                            days: rxMatch[2].split(",")[1]?.replace(/for|days/g, "")?.trim() || "",
                            meal: rxMatch[2].split(",")[2]?.trim() || ""
                          } : null;

                          return (
                            <div key={itemIdx} className="bg-slate-50/50 p-2 rounded flex flex-col gap-1 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">• {parsed ? parsed.name : item}</span>
                                <span className="text-[8.5px] bg-[#006f66]/10 text-[#006f66] px-1 px-1.5 rounded font-black font-sans leading-none uppercase">Synced</span>
                              </div>
                              {parsed && (
                                <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-500 pt-0.5 leading-none">
                                  <span>Dosage: <strong className="text-slate-700">{parsed.desc}</strong></span>
                                  <span>Duration: <strong className="text-slate-700">{parsed.days} Days</strong></span>
                                  <span>Meal: <strong className="text-[#006f66] font-bold">{parsed.meal}</strong></span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {(!patient.prescriptionsList || patient.prescriptionsList.length === 0) && (
                    <div className="text-center py-4 bg-white border border-dashed rounded text-slate-400 text-xs italic">
                      No medications issued on file yet. Prescribe standard formulations in active consultation lobby to auto-sync.
                    </div>
                  )}
                </div>
              </div>

              {/* Add history condition form (Clinicians only) */}
              {currentRole !== "Receptionist" && (
                <form onSubmit={handleCreateHistory} className="border-t pt-4 space-y-2">
                  <h4 className="font-bold text-xs text-slate-700 uppercase">Input New Medical Condition</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Chronic Kidney Disease, Grade II (Diagnosed 2023)"
                      className="flex-grow p-2 border text-xs rounded bg-slate-50 outline-none focus:border-[#00334f]"
                      value={newHistInput}
                      onChange={(e) => setNewHistInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#00334f] text-white px-4 text-xs font-bold rounded hover:bg-[#0c4a6e] transition-colors"
                    >
                      Record Item
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: VACCINATION LOGS */}
          {activeSubTab === "vaccines" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-3">Immunization Sequence Tracker</h3>
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="p-2 font-bold text-slate-700">Vaccine Designation</th>
                      <th className="p-2 font-bold text-slate-700">Administration Date</th>
                      <th className="p-2 font-bold text-slate-700">Dosage Stage</th>
                      <th className="p-2 font-bold text-slate-700">Batch Number</th>
                      <th className="p-2 font-bold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-600">
                    {patient.vaccineRecords && patient.vaccineRecords.map((vac, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-[#00334f]">{vac.vaccineName}</td>
                        <td className="p-2 font-semibold">{vac.date}</td>
                        <td className="p-2">{vac.dose}</td>
                        <td className="p-2 font-mono text-[11px] text-slate-500">{vac.batchNumber}</td>
                        <td className="p-2">
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded">
                            {vac.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!patient.vaccineRecords || patient.vaccineRecords.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">No registered immunization logs located in health card.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add vaccine record */}
              {currentRole !== "Receptionist" && (
                <form onSubmit={handleCreateVaccine} className="border-t pt-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 uppercase">Input Administered Immunization shot</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500">Vaccine Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hepatitis B Booster"
                        className="w-full p-2 border text-xs bg-slate-50 rounded"
                        value={vaccName}
                        onChange={(e) => setVaccName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500">Date Administered</label>
                      <input
                        type="date"
                        required
                        className="w-full p-2 border text-xs bg-slate-50 rounded"
                        value={vaccDate}
                        onChange={(e) => setVaccDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500">Dose Level</label>
                      <select
                        className="w-full p-2 border text-xs bg-slate-50 rounded outline-none"
                        value={vaccDose}
                        onChange={(e) => setVaccDose(e.target.value)}
                      >
                        <option value="1st Dose">1st Dose</option>
                        <option value="2nd Dose">2nd Dose</option>
                        <option value="Booster Shot">Booster Shot</option>
                        <option value="Single Dose Sequence">Single Dose sequence</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500">Batch Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. HEP-992-B"
                        className="w-full p-2 border text-xs bg-slate-50 rounded"
                        value={vaccBatch}
                        onChange={(e) => setVaccBatch(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 text-xs font-bold rounded transition-colors"
                  >
                    Commit Immunization Record
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB: LAB REPORTS & INTEGRATED ORDER QUEUE */}
          {activeSubTab === "labs" && (
            <div className="space-y-6">
              {/* Existing Lab Results */}
              <div>
                <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Diagnostic Laboratory Report history</h3>
                <div className="space-y-2 pr-2">
                  {patient.labResults && patient.labResults.map((lab) => (
                    <div key={lab.id} className="border p-3 rounded shadow-sm bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-bold text-xs text-[#00334f]">{lab.testName}</span>
                        <span className="text-[10px] text-slate-500">{lab.date}</span>
                      </div>
                      <div className="mt-2 text-xs font-semibold grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                        <p><span className="text-slate-500">Result metric:</span> <span className="font-bold text-emerald-700">{lab.result}</span></p>
                        <p><span className="text-slate-500">Medical Signature:</span> Completed & Certified</p>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-1.5 pt-1 border-t">Remarks: {lab.remarks}</p>
                    </div>
                  ))}
                  {(!patient.labResults || patient.labResults.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No past clinical lab results logged in patient database files.</p>
                  )}
                </div>
              </div>

              {/* Integrated lab ordering and Analyzer Simulation */}
              {currentRole !== "Receptionist" && (
                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded border">
                  {/* Left: order trigger form */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-[#00334f] uppercase flex items-center gap-1">
                      <FlaskConical className="w-4 h-4 text-[#00334f]" />
                      Order Lab test
                    </h4>
                    <p className="text-[10px] text-slate-500">Order diagnostics which sends specimen requests to path-labs.</p>
                    
                    <div className="space-y-2 text-xs">
                      <label className="block text-[10px] font-bold text-slate-500">Pathology Test Profile</label>
                      <select
                        className="w-full p-2 border bg-white rounded outline-none"
                        value={selectedLabTest}
                        onChange={(e) => setSelectedLabTest(e.target.value)}
                      >
                        <option value="Full Blood Count (FBC)">Full Blood Count (FBC)</option>
                        <option value="C-Reactive Protein (CRP)">C-Reactive Protein (CRP)</option>
                        <option value="Dengue NS1 Antigen Antigen Panel">Dengue NS1 Antigen Antigen Panel</option>
                        <option value="Fasting Blood Glucose (FBG)">Fasting Blood Glucose (FBG)</option>
                        <option value="Serum Renal Function Profile">Serum Renal Function Profile</option>
                        <option value="Complete Lipid Profile">Complete Lipid Profile</option>
                      </select>

                      <label className="block text-[10px] font-bold text-slate-500 mt-2">Special Specimen notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Urgent review, high fever suspected dengue"
                        className="w-full p-2 border bg-white rounded"
                        value={labRemarks}
                        onChange={(e) => setLabRemarks(e.target.value)}
                      />

                      <button
                        type="button"
                        onClick={handleTriggerLabOrder}
                        className="bg-[#00334f] text-white px-4 py-2 font-bold rounded text-xs hover:bg-[#0c4a6e]"
                      >
                        Issue Path-lab request Order
                      </button>
                    </div>
                  </div>

                  {/* Right: Path-lab instrument simulator queue tracker */}
                  <div className="space-y-3 border-l pl-4">
                    <h4 className="font-bold text-xs text-orange-600 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      Specimen Diagnostic Device Simulator
                    </h4>
                    <p className="text-[10px] text-slate-500">Simulate path-labs sample testing, chemical compilation and automatic result feed-back.</p>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {matchedPatientOrders.map((ord) => (
                        <div key={ord.id} className="p-2 border rounded bg-white text-[11px] space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-[#00334f]">{ord.testName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">#{ord.id.substring(0,6)}</span>
                          </div>
                          <p className="text-slate-500 font-mono text-[9px]">Date: {ord.dateOrdered} • {ord.remarks}</p>
                          
                          <div className="flex justify-between items-center text-xs mt-2 pt-1 border-t border-dashed">
                            <span className="bg-orange-100 text-orange-800 text-[9px] px-1.5 rounded font-extrabold">{ord.status}</span>
                            {ord.status !== "COMPLETED" && (
                              <button
                                type="button"
                                onClick={() => triggerAnalyzeOrderSample(ord)}
                                className="bg-orange-600 text-white px-2 py-0.5 text-[10px] rounded font-bold hover:bg-orange-700"
                              >
                                Test Sample
                              </button>
                            )}
                          </div>

                          {/* Specific analyzer form */}
                          {simulatingOrderId === ord.id && (
                            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs space-y-2 animate-in slide-in">
                              <p className="font-bold text-orange-800 text-[10px]">Test Outcome (Configure Mock value):</p>
                              <input
                                type="text"
                                className="w-full p-1 border text-xs bg-white"
                                value={typedLabResultVal}
                                onChange={(e) => setTypedLabResultVal(e.target.value)}
                              />
                              <p className="text-[9px] text-slate-400 italic">Tip: Including 'abnormal' triggers a clinical dashboard alert.</p>
                              <button
                                type="button"
                                onClick={() => handleConfirmLabResultCertification(ord.id)}
                                className="bg-[#00334f] text-white px-2.5 py-1 text-[10px] rounded font-bold w-full"
                              >
                                Transmit Certified Report to Health Card
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {matchedPatientOrders.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No outstanding pathology specimens ordered for this patient today.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PRESCRIPTIONS LIST */}
          {activeSubTab === "prescriptions" && (
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-sm text-[#00334f] border-b pb-1">Historical eRx Certified Files</h3>
              <div className="space-y-3">
                {patient.prescriptionsList && patient.prescriptionsList.map((rx) => (
                  <div key={rx.id} className="border p-3 rounded shadow-sm bg-white hover:border-[#00334f] transition-all flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#00334f]">ID: {rx.rxNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Issued: {rx.date}</span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-[#006f66] block tracking-wider">Prescribed Treatment Formulas & Food Relations:</span>
                        <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-emerald-500">
                          {rx.items.map((item, i) => {
                            const match = item.match(/^(.*?)\[(.*?)\]$/);
                            if (match) {
                              const name = match[1].trim();
                              const details = match[2].trim().split(",");
                              const instr = details[0] ? details[0].trim() : "";
                              const days = details[1] ? details[1].replace(/for|days/g, "").trim() : "";
                              const meal = details[2] ? details[2].trim() : "";
                              return (
                                <div key={i} className="text-xs">
                                  <span className="font-bold text-slate-800">{name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium ml-2">
                                    — {instr} • Food Timing: <span className="font-bold text-[#006f66] bg-teal-50 px-1 py-0.5 rounded text-[9px]">{meal}</span> • Duration: <span className="bg-slate-150 text-slate-700 font-bold px-1 py-0.5 rounded text-[9px] font-mono">{days ? `${days} Days` : "Course"}</span>
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="text-xs text-slate-700 font-medium">
                                💊 {item}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-1.5 bg-slate-50 px-2 py-0.5 rounded border border-dashed text-[10px]">Directions: {rx.dosageInstructions}</p>
                    </div>
                    <button
                      onClick={() => onRenderPrescription(rx)}
                      className="bg-[#00334f] hover:bg-[#0c4a6e] text-white p-2.5 rounded transition-all flex items-center justify-center gap-1 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      e-Prescription Slip
                    </button>
                  </div>
                ))}

                {(!patient.prescriptionsList || patient.prescriptionsList.length === 0) && (
                  <p className="text-xs text-slate-400 italic text-center py-12">No permanent active prescription files logged on this patient. Open clinical lobby consult to issue new formulas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: MEDICAL CERTIFICATES (MC) */}
          {activeSubTab === "mc" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Alert message if draft error */}
              {draftingErr && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{draftingErr}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COMPOSE SECTION */}
                {currentRole !== "Receptionist" ? (
                  <div className="lg:col-span-12 xl:col-span-5 bg-slate-50 p-4 rounded border space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-serif font-bold text-sm text-[#00334f] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                        Draft New Medical Certificate
                      </h4>
                      <p className="text-[10px] text-slate-500">Draft a GP certified medical certificate. Calculates days automatically and enables live cloud syncing.</p>
                    </div>

                    <form onSubmit={handleCreateMedicalCertificate} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500">Diagnosis / Medical Leave Reason</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acute Bronchitis, suspected Dengue virus, severe muscle strain"
                          className="w-full p-2 border bg-white rounded outline-none focus:border-[#00334f]"
                          value={mcDiagnosis}
                          onChange={(e) => setMcDiagnosis(e.target.value)}
                        />
                        {/* Quick suggestions */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Viral URTI & Fever", "Suspected Dengue Infection", "Acute Bronchitis", "Mechanical Lower Back Strain", "Post-Op Rest Guidelines"].map((sugg) => (
                            <button
                              type="button"
                              key={sugg}
                              onClick={() => setMcDiagnosis(sugg)}
                              className="text-[9px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded font-medium text-slate-700"
                            >
                              + {sugg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Leave Start Date</label>
                          <input
                            type="date"
                            required
                            className="w-full p-2 border bg-white rounded text-xs"
                            value={mcStartDate}
                            onChange={(e) => setMcStartDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Leave End Date</label>
                          <input
                            type="date"
                            required
                            className="w-full p-2 border bg-white rounded text-xs"
                            value={mcEndDate}
                            onChange={(e) => setMcEndDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Recommended Leave</label>
                          <div className="bg-sky-50 border border-sky-200 p-2 text-center rounded font-extrabold text-[#00334f] text-xs font-mono">
                            {mcNumDays} Day(s) Leave
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Fitness Condition</label>
                          <select
                            className="w-full p-2 border bg-white rounded outline-none text-xs"
                            value={mcStatus}
                            onChange={(e) => setMcStatus(e.target.value as any)}
                          >
                            <option value="UNFIT_FOR_WORK">UNFIT FOR WORK (Full Leave)</option>
                            <option value="FIT_FOR_LIGHT_DUTY">FIT FOR LIGHT DUTY (Alternative Tasks)</option>
                            <option value="FIT_FOR_DUTY">FIT FOR DUTY (Full Clearance)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500">Patient's Recipient Email</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. fatima.z@gmail.com"
                          className="w-full p-2 border bg-white rounded outline-none text-xs"
                          value={mcRecipientEmail}
                          onChange={(e) => setMcRecipientEmail(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500">Certified Clinician</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            className="p-2 border bg-slate-100 rounded text-[10px] text-slate-600 font-semibold"
                            value={mcDocName}
                            disabled
                          />
                          <input
                            type="text"
                            required
                            className="p-2 border bg-slate-100 rounded text-[10px] text-slate-600 font-semibold"
                            value={mcDocReg}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500">Additional Instructions & Remarks</label>
                        <textarea
                          placeholder="e.g. Strict rest, avoid heavy lifting, maintain fluid intake."
                          className="w-full p-2 border bg-white rounded outline-none min-h-16 text-xs"
                          value={mcRemarks}
                          onChange={(e) => setMcRemarks(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={mcLoading}
                        className="w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white p-2.5 rounded font-bold flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50"
                      >
                        {mcLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Drafting Certificate...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Sign & Issue Leave Certificate
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : null}

                {/* HISTORICAL LOGS SECTION */}
                <div className={`${currentRole !== "Receptionist" ? "lg:col-span-12 xl:col-span-7" : "lg:col-span-12"} space-y-4`}>
                  <div className="border-b pb-2">
                    <h4 className="font-serif font-bold text-sm text-[#00334f] flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      GP Certified Medical Certificates Historical Records
                    </h4>
                    <p className="text-[10px] text-slate-500">Manage digital medical leaves, patient email certificates, and Lanka Health Net synchronizations.</p>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {(patient.medicalCertificatesList || []).map((mc) => (
                      <div key={mc.id} className="border-2 border-slate-300 rounded-lg bg-slate-50/40 hover:border-[#00334f] hover:shadow-md transition-all overflow-hidden p-1">
                        
                        {/* OFFICIAL MEDICAL CERTIFICATE FRAME */}
                        <div className="bg-white border text-xs relative overflow-hidden p-6 font-serif select-none shadow-sm rounded-md space-y-4">
                          
                          {/* Crest Watermark & Official Header */}
                          <div className="text-center border-b pb-3 border-double border-slate-300 space-y-1">
                            <span className="font-sans text-[8px] tracking-widest font-black text-slate-400 block">DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA</span>
                            <h4 className="font-black text-sm tracking-wide text-slate-800 uppercase">
                              Official Medical Certificate of Health Leave
                            </h4>
                            <p className="font-sans text-[9px] text-slate-500 font-bold">
                              Sri Lankan GP Care Group Clinical Registry | ID: <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{mc.id}</span>
                            </p>
                          </div>

                          {/* Certificate Body text */}
                          <div className="text-slate-800 leading-relaxed space-y-3 font-medium text-[11px] py-2">
                            <p>
                              This is to certify that I, the undersigned medical practitioner of <strong className="text-slate-900">Sri Lankan GP Care</strong>, have clinically examined the citizen patient:
                            </p>
                            
                            <div className="bg-slate-50 border border-slate-200/60 p-3 rounded font-sans text-xs space-y-1">
                              <p className="flex justify-between">
                                <span className="text-slate-400 uppercase font-bold text-[9px]">Patient Name:</span>
                                <strong className="text-slate-900 font-serif text-sm">{patient.name}</strong>
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-slate-700">
                                <p className="flex justify-between">
                                  <span className="text-slate-400 uppercase font-bold text-[9px]">Age / Gender:</span>
                                  <strong>{patient.age} Yrs / {patient.gender}</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-400 uppercase font-bold text-[9px]">Contact:</span>
                                  <strong>{patient.phone}</strong>
                                </p>
                              </div>
                            </div>

                            <p>
                              In my professional clinical opinion, the patient is diagnosed with:
                              <br />
                              <strong className="text-rose-900 block mt-1 text-xs font-sans pl-2 border-l-2 border-rose-500">
                                ⚕ {mc.diagnosis}
                              </strong>
                            </p>

                            <p>
                              Based on physical symptoms and baseline medical assessments, they are certified as being:
                              <br />
                              <span className={`inline-block mt-1 font-sans text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                mc.status === "UNFIT_FOR_WORK" ? "bg-red-100 text-red-800 border border-red-200" :
                                mc.status === "FIT_FOR_LIGHT_DUTY" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                {mc.status.replace(/_/g, ' ')}
                              </span>
                            </p>

                            <p>
                              Therefore, I recommend a total rest duration of <strong className="text-[#00334f] font-sans">{mc.numDays} day(s)</strong> with effect from <strong className="text-slate-800 font-sans">{mc.startDate}</strong> to <strong className="text-slate-800 font-sans">{mc.endDate}</strong> inclusive, to facilitate clinical recovery before resumption of active duty.
                            </p>
                          </div>

                          {/* Signature & Registry Info */}
                          <div className="border-t border-dashed pt-4 flex justify-between items-end text-[10px] font-sans">
                            <div className="space-y-0.5 text-slate-500">
                              <p className="font-extrabold uppercase text-[8px] text-slate-400 tracking-wider">Verification Authority</p>
                              <p className="text-slate-700 font-bold bg-[#e7eeff] px-2 py-0.5 rounded border border-[#ccd9fc] inline-block">Digitally Autographed Secure File</p>
                              <p className="font-mono text-[9px]">Registry Stamp Date: {mc.date}</p>
                            </div>

                            <div className="text-right space-y-1">
                              <div className="font-serif italic font-bold text-slate-800 text-xs border-b border-slate-350 pb-1">
                                {mc.doctorName}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                SLMC Registered No: <span className="font-bold text-slate-700">{mc.doctorRegNo}</span>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Leave details actions and emails notes */}
                        <div className="p-3 text-xs bg-slate-150/40 border-t space-y-3 font-sans">
                          <p className="text-[10px] text-slate-600 bg-amber-50/70 p-2.5 border border-amber-100 rounded-md flex items-start gap-1.5 leading-relaxed">
                            <span className="text-base leading-none">💡</span>
                            <div>
                              <strong className="text-amber-950 font-bold block">Patient Email Body Guidelines Included:</strong>
                              {mc.additionalRemarks ? (
                                <span className="italic">"{mc.additionalRemarks}"</span>
                              ) : (
                                <span className="text-slate-400">No additional custom advice was provided. Default recovery guidelines and certificate details will be transmitted.</span>
                              )}
                              <span className="block mt-1 font-bold text-slate-500 text-[9px] uppercase tracking-wide">
                                Note: These clinical remarks are kept separate from the official certificate, and are added to the email body.
                              </span>
                            </div>
                          </p>

                          {/* Action Items */}
                          <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-between">
                            <button
                              type="button"
                              disabled={emailingCertId === mc.id}
                              onClick={() => handleSendMCEmail(mc.id)}
                              className="text-[10px] font-bold px-3 py-1.5 rounded transition bg-[#00334f] hover:bg-[#0c4a6e] text-white flex items-center justify-center gap-1.5"
                            >
                              {emailingCertId === mc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : mc.emailStatus === "SENT" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                              {mc.emailStatus === "SENT" ? "Transmitted! Click to Re-send Email" : "Compile Draft & Email to Patient"}
                            </button>

                            <div className="flex flex-wrap gap-2">
                              {/* Suwasiri National Health App Sync */}
                              <button
                                type="button"
                                disabled={syncingCertId === mc.id && syncingPortal === "suwasiri"}
                                onClick={() => handleSyncSuwasiri(mc.id)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition flex items-center gap-1.5 justify-center ${
                                  mc.suwasiriSyncStatus === "SYNCED"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-250 cursor-default"
                                    : "bg-orange-50 hover:bg-orange-100 text-orange-850 border border-orange-200"
                                }`}
                              >
                                {syncingCertId === mc.id && syncingPortal === "suwasiri" ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : mc.suwasiriSyncStatus === "SYNCED" ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                                )}
                                {mc.suwasiriSyncStatus === "SYNCED" ? "Suwasiri Status: SYNCED" : "Sync Suwasiri App"}
                              </button>

                              {/* LankaLab Portal System Sync */}
                              <button
                                type="button"
                                disabled={syncingCertId === mc.id && syncingPortal === "lankalab"}
                                onClick={() => handleSyncLankaLab(mc.id)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition flex items-center gap-1.5 justify-center ${
                                  mc.lankalabSyncStatus === "SYNCED"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-250 cursor-default"
                                    : "bg-teal-50 hover:bg-teal-100 text-teal-850 border border-teal-200"
                                }`}
                              >
                                {syncingCertId === mc.id && syncingPortal === "lankalab" ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : mc.lankalabSyncStatus === "SYNCED" ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                                )}
                                {mc.lankalabSyncStatus === "SYNCED" ? "LankaLab: REGISTERED" : "Sync LankaLab Portal"}
                              </button>
                            </div>
                          </div>

                          {/* Sync times */}
                          {(mc.suwasiriSyncTime || mc.lankalabSyncTime) && (
                            <div className="font-mono text-[9px] text-slate-400 pt-2 flex flex-col gap-0.5 border-t border-dashed">
                              {mc.suwasiriSyncTime && <span>• Suwasiri central cloud register synchronized at: {mc.suwasiriSyncTime}</span>}
                              {mc.lankalabSyncTime && <span>• LankaLab portal central diagnostics index synced at: {mc.lankalabSyncTime}</span>}
                            </div>
                          )}

                        </div>
                      </div>
                    ))}

                    {(!patient.medicalCertificatesList || patient.medicalCertificatesList.length === 0) && (
                      <div className="text-center py-12 border border-dashed rounded text-xs text-slate-400 italic">
                        No certified medical certificates issued on this file yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* EMAIL DRAFT TRANSCRIPT OVERLAY */}
              {selectedEmailBody && (
                <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 animate-in fade-in">
                  <div className="bg-white border rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#00334f] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Certified Patient Email Transcript & Medical Rest Draft
                        </h4>
                        <p className="text-[10px] text-slate-500">Review email content composed dynamically with live GP signing certificates.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border p-4 rounded max-h-96 overflow-y-auto text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                      {selectedEmailBody}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t">
                      <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 border border-emerald-100 rounded">
                        <Check className="w-3.5 h-3.5" /> Transmitted to {patient.email || "patient@gmail.com"}
                      </span>
                      <div className="flex gap-2">
                        <button
                           type="button"
                           onClick={() => {
                             const printWindow = window.open("", "_blank");
                             if (printWindow) {
                               printWindow.document.write(`<pre style="font-family: Arial, sans-serif; padding: 20px; white-space: pre-wrap;">${selectedEmailBody}</pre>`);
                               printWindow.document.close();
                               printWindow.print();
                             }
                           }}
                           className="bg-slate-200 text-slate-800 px-4 py-2 font-bold rounded hover:bg-slate-300"
                        >
                          Print Copy / Save PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEmailBody(null)}
                          className="bg-[#00334f] text-white px-4 py-2 font-bold rounded hover:bg-[#0c4a6e]"
                        >
                          Close Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: SAMPLE COLLECTIONS */}
          {activeSubTab === "samples" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 border rounded-lg">
                <div>
                  <h3 className="font-serif font-bold text-[#00334f] text-sm">Laboratory Sample Tracking & LankaLab Gateway</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Collect and dispatch Blood/Urinal clinical samples directly linked to central LankaLab portal synchronization.</p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span> LankaLab Network Active
                </span>
              </div>

              {/* LOG NEW COLLECTION FORM */}
              <div className="bg-white border rounded-lg p-5 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1 border-b pb-2">
                  <span>➕</span> Register New Patient Sample Log
                </h4>
                <form onSubmit={handleLogSampleCollection} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Patient Registry Name</label>
                    <input
                      type="text"
                      className="bg-slate-100 p-2 border rounded w-full text-xs font-medium cursor-not-allowed"
                      value={patient.name}
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Sample Collection Category</label>
                    <select
                      value={newSampleCategory}
                      onChange={(e: any) => setNewSampleCategory(e.target.value)}
                      className="p-2 border rounded w-full text-xs"
                    >
                      <option value="Blood">Blood Sample</option>
                      <option value="Urinal">Urinal Sample</option>
                      <option value="Both Blood & Urinal">Both Blood & Urinal</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={loggingSample}
                      className="w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white text-xs font-bold py-2 px-4 rounded transition duration-150 disabled:opacity-50"
                    >
                      {loggingSample ? "Registering..." : "Log Patient Sample"}
                    </button>
                  </div>
                </form>
              </div>

              {/* COLLECTIONS INDEX */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5 pt-2">
                  <span>📋</span> Live Sample Collections Log ({patient.sampleCollections ? patient.sampleCollections.length : 0})
                </h4>

                <div className="space-y-3">
                  {patient.sampleCollections && patient.sampleCollections.map((sample: any) => (
                    <div key={sample.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-slate-50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{sample.id}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              sample.sampleCategory.includes("Blood") && sample.sampleCategory.includes("Urinal")
                                ? "bg-purple-100 text-purple-800"
                                : sample.sampleCategory.includes("Blood")
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              🧪 {sample.sampleCategory}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Recorded for: <strong className="text-slate-800">{patient.name}</strong> (National File: {patient.id})</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* STATUS BADGES */}
                          {sample.status === "PENDING" && (
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-250 px-2.5 py-1 rounded">
                              ⏳ Awaiting Collection
                            </span>
                          )}
                          {sample.status === "COLLECTED" && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded">
                              💉 Sample Collected
                            </span>
                          )}
                          {sample.status === "DELIVERED" && (
                            <span className="text-xs font-bold text-[#00334f] bg-sky-50 border border-blue-200 px-2.5 py-1 rounded">
                              🚀 Dispatched & Synced
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* COURIER INFO IF DELIVERED */}
                        {sample.status === "DELIVERED" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Courier / Dispatch Details</p>
                              <p className="text-slate-700">👤 Dispatcher: <strong className="text-slate-900">{sample.deliveryPersonName}</strong></p>
                              <p className="text-slate-700">📞 Phone: <span className="font-semibold">{sample.deliveryPersonPhone}</span></p>
                              <p className="text-slate-700">🪪 License/ID: <span className="font-mono text-slate-650">{sample.deliveryPersonId}</span></p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Destination & LankaLab Ledger Key</p>
                              <p className="text-slate-700">🏥 Partner Lab: <strong className="text-rose-900">{sample.labName}</strong></p>
                              <p className="text-slate-700">🕒 Delivered At: <span className="font-semibold text-slate-800">{sample.deliveredTime}</span></p>
                              <p className="text-slate-700 flex items-center gap-1.5">
                                🔑 Ledger Key: <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded">{sample.lankaLabLedgerKey}</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 flex flex-col gap-1">
                            {sample.collectedTime && <p className="text-emerald-700">✓ Collected by shift nurse at: <strong>{sample.collectedTime}</strong></p>}
                            {!sample.collectedTime && <p className="italic text-amber-600">• Specimen has not been drawn/collected under clinical environment yet.</p>}
                          </div>
                        )}

                        {/* WORKFLOW BUTTONS */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed">
                          {sample.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={doingActionId !== null}
                              onClick={() => handleCollectSample(sample.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 rounded transition flex items-center gap-1.5"
                            >
                              {doingActionId === sample.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "✓ Mark Collected"
                              )}
                            </button>
                          )}

                          {sample.status === "COLLECTED" && deliveringSampleId !== sample.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeliveringSampleId(sample.id);
                                setDispatchLab("LankaLab - Colombo General");
                              }}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-1.5 px-4 rounded transition"
                            >
                              📦 Issue to Lab Delivery Person
                            </button>
                          )}

                          {/* INLINE DISPATCH INPUT FORM */}
                          {sample.status === "COLLECTED" && deliveringSampleId === sample.id && (
                            <div className="w-full bg-slate-50 p-4 border rounded-lg space-y-3 animate-in slide-in-from-top-2">
                              <div className="flex justify-between items-center border-b pb-2">
                                <h5 className="text-[11px] font-bold uppercase text-slate-700">Enter Courier Dispatch Details</h5>
                                <button
                                  type="button"
                                  onClick={() => setDeliveringSampleId(null)}
                                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Delivery Person Name *</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ruwan Kumara"
                                    value={dispatchName}
                                    onChange={(e) => setDispatchName(e.target.value)}
                                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Mobile Phone</label>
                                  <input
                                    type="text"
                                    placeholder="+94 77 123 4567"
                                    value={dispatchPhone}
                                    onChange={(e) => setDispatchPhone(e.target.value)}
                                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">License ID / Vehicle No</label>
                                  <input
                                    type="text"
                                    placeholder="EP WP-8910 / B733"
                                    value={dispatchId}
                                    onChange={(e) => setDispatchId(e.target.value)}
                                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Partner LankaLab Branch *</label>
                                  <select
                                    value={dispatchLab}
                                    onChange={(e: any) => setDispatchLab(e.target.value)}
                                    className="p-1 px-2 border rounded bg-white w-full text-xs"
                                  >
                                    <option value="LankaLab - Colombo General">LankaLab - Colombo General</option>
                                    <option value="LankaLab - Kandy Diagnostics">LankaLab - Kandy Diagnostics</option>
                                    <option value="LankaLab - Galle Pathology Center">LankaLab - Galle Pathology Center</option>
                                    <option value="LankaLab - Jaffna Public Diagnostics">LankaLab - Jaffna Public Diagnostics</option>
                                    <option value="LankaLab - Negombo Quick Labs">LankaLab - Negombo Quick Labs</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  disabled={doingActionId !== null}
                                  onClick={() => handleDeliverSampleAndSync(sample.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded transition flex items-center gap-1"
                                >
                                  {doingActionId === sample.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    "🚀 Handover & Sync LankaLab Portal"
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!patient.sampleCollections || patient.sampleCollections.length === 0) && (
                    <div className="text-center py-12 border border-dashed rounded-lg text-xs text-slate-400 italic bg-white">
                      💡 No Blood or Urinal specimen collections registered on this patient's medical registry page yet. Use the form above to log one!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

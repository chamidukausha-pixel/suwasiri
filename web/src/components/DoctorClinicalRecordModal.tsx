import React, { useState, useEffect } from "react";
import { 
  FileText, Stethoscope, Clock, Pill, AlertTriangle, Activity, Syringe, 
  FlaskConical, Image, Send, Heart, Folder, Database, Calendar, DollarSign, 
  X, Plus, Check, Calculator, Copy, ShieldAlert, Sparkles, User, Printer,
  Phone, Mail, ArrowRight, CheckCircle, Search, Trash2, Edit3, ShieldCheck
} from "lucide-react";
import { 
  Patient, VaccineRecord, LabResult, PrescriptionRecord, LabOrder, 
  ImagingRecord, ReferralRecord, CarePlanRecord, MyHealthRecordDoc, 
  ObservationRecord, Appointment, Billing, DoctorConsultationActivity 
} from "../types";
import { 
  calculateBmi, calculateAustralianCvdRisk, calculateAusdrisk, 
  calculateEgfrCkdEpi, classifyBloodPressure, calculatePregnancyEdd, 
  calculatePaediatricDose 
} from "../utils/clinicalCalculators";
import ClinicalCalculatorsModal from "./ClinicalCalculatorsModal";
import { issuePrescriptionsToSuwasiri } from "../sync/suwasiriPrescriptions";

interface Props {
  patient: Patient;
  appointments: Appointment[];
  billingList: Billing[];
  currentRole: string;
  onClose: () => void;
  onUpdatePatient: (updated: Patient) => void;
  onUpdateAppointment?: (updated: Appointment) => void;
  onRenderPrescription?: (rx: PrescriptionRecord) => void;
  onLaunchTelehealth?: (apt: Appointment) => void;
}

export type ClinicalTab = 
  | "summary"
  | "consultation"
  | "history"
  | "diagnoses"
  | "medications"
  | "allergies"
  | "observations"
  | "immunisations"
  | "pathology"
  | "imaging"
  | "referrals"
  | "careplans"
  | "documents"
  | "myhealthrecord"
  | "appointments"
  | "billing";

export default function DoctorClinicalRecordModal({
  patient,
  appointments,
  billingList,
  currentRole,
  onClose,
  onUpdatePatient,
  onUpdateAppointment,
  onRenderPrescription,
  onLaunchTelehealth
}: Props) {
  const [activeTab, setActiveTab] = useState<ClinicalTab>("summary");
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    patientAppointments[0]?.id || ""
  );
  const [consultModality, setConsultModality] = useState<"In-Person OPD" | "Telehealth Video" | "Home Visit" | "Emergency Triage">("In-Person OPD");
  const [consultFeeLkr, setConsultFeeLkr] = useState<number>(2500);

  // SOAP Consultation Note States
  const [soapReason, setSoapReason] = useState("Routine GP Follow-up & Review");
  const [soapSubjective, setSoapSubjective] = useState(
    "Patient attends for scheduled follow-up. Reports good general wellness. Mild morning joint stiffness and occasional dry cough. No chest tightness, shortness of breath, or fever."
  );
  const [soapObjective, setSoapObjective] = useState(
    "Alert and orientated. Chest: Clear bilaterally, vesicular breath sounds. CVS: Dual heart sounds, no murmurs. Abdomen: Soft, non-tender. BP: 130/82 mmHg, Pulse: 72 bpm, SpO2: 98% on room air."
  );
  const [soapAssessment, setSoapAssessment] = useState(
    "1. Bronchial Asthma (mild, well-controlled)\n2. Essential Hypertension (stable on monotherapy)\n3. Osteoarthritis (stable, advised gentle range of motion exercises)"
  );
  const [soapPlan, setSoapPlan] = useState(
    "1. Continue regular Ventolin PRN\n2. Repeat FBC and fasting lipid profile in 3 months\n3. Review in clinic in 6 weeks or sooner if symptoms escalate\n4. Reassure regarding lifestyle and hydration"
  );

  // Live Anthropometry & Observations with AUTO BMI calculation
  const [obsHeightCm, setObsHeightCm] = useState<number>(168);
  const [obsWeightKg, setObsWeightKg] = useState<number>(70);
  const [obsSystolic, setObsSystolic] = useState<number>(128);
  const [obsDiastolic, setObsDiastolic] = useState<number>(80);
  const [obsPulse, setObsPulse] = useState<number>(72);
  const [obsTemp, setObsTemp] = useState<number>(36.8);
  const [obsSpO2, setObsSpO2] = useState<number>(98);
  const [obsBgl, setObsBgl] = useState<number>(5.6);
  const [autoBmi, setAutoBmi] = useState(() => calculateBmi(168, 70));

  // Auto-calculate BMI on height or weight change
  useEffect(() => {
    setAutoBmi(calculateBmi(obsHeightCm, obsWeightKg));
  }, [obsHeightCm, obsWeightKg]);

  // Diagnoses list state
  const [newDiagnosisInput, setNewDiagnosisInput] = useState("");
  const [newIcd10, setNewIcd10] = useState("J45.9");

  // Medication add state
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("Take 1 tablet daily in the morning");
  const [newMedRepeats, setNewMedRepeats] = useState(2);

  // Allergy add state
  const [newAllergyInput, setNewAllergyInput] = useState("");

  // Pathology Request State
  const [pathTestSelection, setPathTestSelection] = useState("Full Blood Count (FBC)");
  const [pathClinicalNotes, setPathClinicalNotes] = useState("Routine monitoring / fatigue screening");

  // Imaging Request State
  const [imagingModality, setImagingModality] = useState<ImagingRecord["modality"]>("X-ray");
  const [imagingBodyPart, setImagingBodyPart] = useState("Chest PA & Lateral");
  const [imagingIndication, setImagingIndication] = useState("Persistent cough > 2 weeks, exclude focal consolidation");

  // Referral State
  const [refSpecialist, setRefSpecialist] = useState("Dr. Lalith Fernando (Cardiologist)");
  const [refSpecialty, setRefSpecialty] = useState("Cardiology");
  const [refClinicalSummary, setRefClinicalSummary] = useState("Thank you for reviewing this patient regarding cardiovascular risk stratification and echocardiogram evaluation.");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Add observation record
  const handleSaveObservation = () => {
    const newObs: ObservationRecord = {
      id: `obs-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      heightCm: obsHeightCm,
      weightKg: obsWeightKg,
      bmi: autoBmi?.bmi,
      bmiCategory: autoBmi?.category,
      systolicBp: obsSystolic,
      diastolicBp: obsDiastolic,
      pulse: obsPulse,
      temperature: obsTemp,
      spO2: obsSpO2,
      bloodGlucoseMmol: obsBgl,
      recordedBy: "Dr. Priyantha Silva"
    };

    const updated = {
      ...patient,
      observationsHistory: [newObs, ...(patient.observationsHistory || [])]
    };
    onUpdatePatient(updated);
    showToast(`Recorded Observations: BMI ${autoBmi?.bmi} kg/m² (${autoBmi?.category}), BP ${obsSystolic}/${obsDiastolic} mmHg`);
  };

  // Add Diagnosis
  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagnosisInput.trim()) return;

    const newDiag = {
      id: `diag-${Date.now()}`,
      condition: newDiagnosisInput.trim(),
      icd10Code: newIcd10,
      dateDiagnosed: new Date().toISOString().split("T")[0],
      status: "ACTIVE" as const
    };

    const updated = {
      ...patient,
      medicalHistory: [...patient.medicalHistory, `${newDiagnosisInput} (${newIcd10})`],
      diagnosesList: [...(patient.diagnosesList || []), newDiag]
    };
    onUpdatePatient(updated);
    setNewDiagnosisInput("");
    showToast(`Added Diagnosis: ${newDiag.condition}`);
  };

  // Add Medication
  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newRx: PrescriptionRecord = {
      id: `rx-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      items: [`${newMedName} - ${newMedDose}`],
      dosageInstructions: newMedDose,
      rxNumber: `RX-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      signatureUrl: "Dr. P. Silva (SLMC-48291)",
      repeats: newMedRepeats,
      pbsType: "PBS_SUBSIDISED",
      ePrescriptionToken: `TOKEN-QR-${Math.floor(100000 + Math.random() * 900000)}`,
      aslStatus: "ACTIVE_IN_ASL",
      rtpmStatus: "RTPM_CLEARED"
    };

    const updated = {
      ...patient,
      activeMedications: [...patient.activeMedications, `${newMedName} (${newMedDose})`],
      prescriptionsList: [newRx, ...patient.prescriptionsList]
    };
    onUpdatePatient(updated);
    setNewMedName("");
    showToast(`Issued ePrescription with QR Token for ${newMedName}`);
    void issuePrescriptionsToSuwasiri({
      patientId: patient.id,
      doctorName: "Dr. Priyantha Silva",
      clinicName: patient.medicalCenter || "PrimeCare Medical Centre - Colombo Central",
      medicines: [`${newMedName} [${newMedDose}]`],
      rxNumber: newRx.rxNumber,
      sessionId: appointments.find((a) => a.patientId === patient.id && a.status !== "COMPLETED")?.id,
      prescriberNumber: "12908",
    });
  };

  // Add Pathology Order
  const handleOrderPathology = (e: React.FormEvent) => {
    e.preventDefault();
    const newLab: LabResult = {
      id: `lab-${Date.now()}`,
      testName: pathTestSelection,
      date: new Date().toISOString().split("T")[0],
      status: "PENDING",
      result: "Sample dispatched to LankaLab Pathology",
      remarks: pathClinicalNotes,
      doctorReviewed: false
    };

    const updated = {
      ...patient,
      labResults: [newLab, ...patient.labResults]
    };
    onUpdatePatient(updated);
    showToast(`Pathology eRequest submitted: ${pathTestSelection}`);
  };

  // Add Imaging Order
  const handleOrderImaging = (e: React.FormEvent) => {
    e.preventDefault();
    const newImg: ImagingRecord = {
      id: `img-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      modality: imagingModality,
      bodyPart: imagingBodyPart,
      clinicalIndication: imagingIndication,
      dateOrdered: new Date().toISOString().split("T")[0],
      status: "ORDERED",
      radiologistReport: "Pending imaging examination at diagnostic centre"
    };

    const updated = {
      ...patient,
      imagingRecords: [newImg, ...(patient.imagingRecords || [])]
    };
    onUpdatePatient(updated);
    showToast(`Imaging eRequest generated: ${imagingModality} - ${imagingBodyPart}`);
  };

  // Add Referral
  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef: ReferralRecord = {
      id: `ref-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      specialistName: refSpecialist,
      specialty: refSpecialty,
      clinicAddress: "Asiri Surgical Specialist Suites, Colombo 05",
      dateCreated: new Date().toISOString().split("T")[0],
      clinicalSummary: refClinicalSummary,
      urgency: "ROUTINE",
      status: "SENT_E_REFERRAL",
      attachedDocuments: ["Shared Health Summary.pdf", "Recent Pathology Results.pdf"],
      referringDoctor: "Dr. Priyantha Silva",
      doctorProviderNo: "4829102A"
    };

    const updated = {
      ...patient,
      referralsList: [newRef, ...(patient.referralsList || [])]
    };
    onUpdatePatient(updated);
    showToast(`eReferral dispatched to ${refSpecialist}`);
  };

  // 16 Tabs matching Bp Premier specification
  const clinicalTabs = [
    { id: "summary", label: "Summary", icon: User },
    { id: "consultation", label: "Consultation (SOAP)", icon: Stethoscope },
    { id: "history", label: "Medical History", icon: Clock },
    { id: "diagnoses", label: "Diagnoses", icon: FileText },
    { id: "medications", label: "Medications (Rx)", icon: Pill },
    { id: "allergies", label: "Allergies", icon: AlertTriangle },
    { id: "observations", label: "Observations & BMI", icon: Activity },
    { id: "immunisations", label: "Immunisations (AIR)", icon: Syringe },
    { id: "pathology", label: "Pathology", icon: FlaskConical },
    { id: "imaging", label: "Imaging", icon: Image },
    { id: "referrals", label: "Referrals", icon: Send },
    { id: "careplans", label: "Care Plans", icon: Heart },
    { id: "documents", label: "Documents", icon: Folder },
    { id: "myhealthrecord", label: "My Health Record", icon: Database },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "billing", label: "Billing", icon: DollarSign }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-6 right-6 z-50 bg-[#00334f] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-[#00334f] text-white px-6 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black text-sm">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base">{patient.name}</h2>
                <span className="text-[10px] bg-sky-200/20 text-sky-200 font-bold px-2 py-0.5 rounded-full border border-sky-300/30">
                  ID: {patient.id}
                </span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  Medicare: {patient.medicareNumber || "2847 9102 31"}
                </span>
              </div>
              <p className="text-xs text-sky-100">
                {patient.gender}, {patient.age} yrs • DOB: {patient.dateOfBirth || "1974-06-15"} • Blood: {patient.bloodType} • Allergies: <strong className="text-red-300">{patient.allergies || "None"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalculatorModal(true)}
              className="bg-sky-700 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-300" />
              <span>Clinical Calculators</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 16 Bp Premier Tabs Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex overflow-x-auto gap-1 shrink-0 scrollbar-thin">
          {clinicalTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#00334f] text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Active Medical History & Diagnoses */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#00334f]" />
                    Active Medical Diagnoses
                  </h3>
                  <ul className="space-y-1.5 text-xs">
                    {patient.medicalHistory.map((h, i) => (
                      <li key={i} className="p-2 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-800">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Current Active Medications */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Current Medications
                  </h3>
                  <ul className="space-y-1.5 text-xs">
                    {patient.activeMedications.length > 0 ? (
                      patient.activeMedications.map((m, i) => (
                        <li key={i} className="p-2 bg-emerald-50/50 rounded border border-emerald-200 font-semibold text-emerald-950">
                          {m}
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">No regular medications prescribed.</li>
                    )}
                  </ul>
                </div>

                {/* Vitals & Recent Observations */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-rose-500" />
                      Live Anthropometry & Vitals
                    </h3>
                    <button
                      onClick={() => setActiveTab("observations")}
                      className="text-[11px] font-bold text-[#00334f] hover:underline"
                    >
                      Update &rarr;
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-slate-500 font-medium">Height & Weight:</span>
                      <span className="font-bold text-slate-800">{obsHeightCm} cm / {obsWeightKg} kg</span>
                    </div>
                    {autoBmi && (
                      <div className={`flex justify-between p-2 rounded border font-bold ${autoBmi.color}`}>
                        <span>Calculated BMI:</span>
                        <span>{autoBmi.bmi} kg/m² ({autoBmi.category})</span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-slate-500 font-medium">Blood Pressure:</span>
                      <span className="font-bold text-slate-800">{obsSystolic}/{obsDiastolic} mmHg</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CONSULTATION (SOAP) */}
          {activeTab === "consultation" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    Doctor Clinical Consultation & Activity Record
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live SOAP clinical encounter logger with active appointment linkage, SLMC compliance, and MoH record sync
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCalculatorModal(true)}
                    className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-sky-300" />
                    <span>Insert Calculator Score</span>
                  </button>
                </div>
              </div>

              {/* Consultation Encounter Metadata Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
                <div>
                  <label className="block font-bold text-sky-950 text-[11px] mb-1">Encounter / Appointment Link:</label>
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    className="w-full p-2 bg-white border border-sky-300 rounded-lg font-bold text-sky-900 text-xs"
                  >
                    {patientAppointments.length > 0 ? (
                      patientAppointments.map(apt => (
                        <option key={apt.id} value={apt.id}>
                          {apt.date} ({apt.time}) - {apt.reason} [{apt.status}]
                        </option>
                      ))
                    ) : (
                      <option value="walkin-apt">Walk-in Unscheduled Consultation (Today)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-sky-950 text-[11px] mb-1">Consultation Modality:</label>
                  <select
                    value={consultModality}
                    onChange={(e: any) => setConsultModality(e.target.value)}
                    className="w-full p-2 bg-white border border-sky-300 rounded-lg font-semibold text-slate-800 text-xs"
                  >
                    <option value="In-Person OPD">In-Person OPD (Clinic Exam Room)</option>
                    <option value="Telehealth Video">Telehealth Video (Suwasiri Cloud)</option>
                    <option value="Home Visit">Home Visit / Domiciliary</option>
                    <option value="Emergency Triage">Emergency Triage / Urgent Care</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-sky-950 text-[11px] mb-1">Consultation Fee (LKR):</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-bold text-slate-500 text-xs">Rs.</span>
                    <input
                      type="number"
                      value={consultFeeLkr}
                      onChange={(e) => setConsultFeeLkr(Number(e.target.value))}
                      className="w-full pl-9 pr-2 py-1.5 bg-white border border-sky-300 rounded-lg font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Visit / Chief Complaint:</label>
                  <input
                    type="text"
                    value={soapReason}
                    onChange={e => setSoapReason(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quick Clinical Template:</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value === "asthma") {
                        setSoapSubjective("Asthma follow-up: Assessed inhaler technique, night wakening 0x/week, daytime symptoms <2x/week. No oral steroid courses recently.");
                        setSoapAssessment("Well-controlled bronchial asthma.");
                      } else if (e.target.value === "diabetes") {
                        setSoapSubjective("Type 2 DM routine review: Compliant with Metformin. Home BGL fasting 5.5-6.8 mmol/L. No hypoglycaemic episodes.");
                        setSoapAssessment("Type 2 Diabetes Mellitus - adequate glycaemic control.");
                      } else if (e.target.value === "htn") {
                        setSoapSubjective("Hypertension routine check: No dizziness, headache, or visual blurring. Compliant with Losartan 50mg daily.");
                        setSoapAssessment("Essential Hypertension - stable blood pressure control.");
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="">Choose a Template...</option>
                    <option value="asthma">Asthma Follow-up Template</option>
                    <option value="diabetes">Diabetes Review Template</option>
                    <option value="htn">Hypertension Review Template</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subjective (History of Presenting Complaint):</label>
                  <textarea
                    rows={4}
                    value={soapSubjective}
                    onChange={e => setSoapSubjective(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Objective (Physical Examination & Observations):</label>
                  <textarea
                    rows={4}
                    value={soapObjective}
                    onChange={e => setSoapObjective(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment (Working Diagnoses & ICD-10):</label>
                  <textarea
                    rows={3}
                    value={soapAssessment}
                    onChange={e => setSoapAssessment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan & Management (Rx, Investigations, Follow-up):</label>
                  <textarea
                    rows={3}
                    value={soapPlan}
                    onChange={e => setSoapPlan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SLMC Registration: <strong>12908 (Dr. Priyantha Silva)</strong></span>
                </div>
                <button
                  onClick={() => {
                    const newHistItem = {
                      date: new Date().toISOString().split("T")[0],
                      reason: soapReason,
                      doctor: "Dr. Priyantha Silva",
                      notes: `S: ${soapSubjective}\nO: ${soapObjective}\nA: ${soapAssessment}\nP: ${soapPlan}`
                    };

                    const targetAptId = selectedAppointmentId || patientAppointments[0]?.id || `apt-${Date.now()}`;

                    const newActivity: DoctorConsultationActivity = {
                      appointmentId: targetAptId,
                      patientId: patient.id,
                      patientName: patient.name,
                      doctorName: "Dr. Priyantha Silva",
                      doctorSlmcNo: "12908",
                      consultationDate: new Date().toISOString().split("T")[0],
                      startTime: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      endTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      durationMinutes: 15,
                      status: "COMPLETED",
                      modality: consultModality,
                      vitalsRecorded: {
                        bp: `${obsSystolic}/${obsDiastolic}`,
                        pulse: obsPulse,
                        temp: obsTemp,
                        spo2: obsSpO2,
                        weightKg: obsWeightKg,
                        heightCm: obsHeightCm,
                        bmi: autoBmi?.bmi
                      },
                      chiefComplaints: soapReason,
                      soapNotes: {
                        subjective: soapSubjective,
                        objective: soapObjective,
                        assessment: soapAssessment,
                        plan: soapPlan
                      },
                      primaryDiagnosis: soapAssessment.split("\n")[0] || "Routine Medical Review",
                      icd10Code: newIcd10 || "Z00.0",
                      prescriptionsIssued: patient.prescriptionsList?.map(p => p.items.join(", ")) || [],
                      labInvestigationsOrdered: patient.labResults?.map(l => l.testName) || [],
                      billingAmountLkr: consultFeeLkr,
                      paymentStatus: "PAID",
                      doctorClinicalRemarks: "Consultation finalized and clinical notes verified by Attending Medical Officer.",
                      lastUpdated: new Date().toISOString()
                    };

                    const updatedPatient = {
                      ...patient,
                      history: [newHistItem, ...patient.history]
                    };
                    onUpdatePatient(updatedPatient);

                    // Update corresponding appointment
                    if (onUpdateAppointment) {
                      const existingApt = appointments.find(a => a.id === targetAptId);
                      if (existingApt) {
                        onUpdateAppointment({
                          ...existingApt,
                          status: "COMPLETED",
                          feeAmount: consultFeeLkr,
                          consultationActivity: newActivity
                        });
                      }
                    }

                    showToast("⚡ Doctor Consultation Activity signed & updated for appointment!");
                  }}
                  className="px-6 py-2.5 bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Sign & Save Doctor Consultation Activities</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL HISTORY */}
          {activeTab === "history" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900">Comprehensive Past Medical History</h3>
              <div className="divide-y divide-slate-100">
                {patient.history.map((h, i) => (
                  <div key={i} className="py-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{h.reason}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{h.date} • {h.doctor}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line">{h.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSES */}
          {activeTab === "diagnoses" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Active & Resolved Medical Diagnoses (ICD-10)</h3>
              </div>

              <form onSubmit={handleAddDiagnosis} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block font-bold text-slate-700 mb-1">Diagnosis / Condition Name:</label>
                  <input
                    type="text"
                    value={newDiagnosisInput}
                    onChange={e => setNewDiagnosisInput(e.target.value)}
                    placeholder="e.g. Type 2 Diabetes Mellitus"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block font-bold text-slate-700 mb-1">ICD-10 Code:</label>
                  <input
                    type="text"
                    value={newIcd10}
                    onChange={e => setNewIcd10(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg cursor-pointer shrink-0"
                >
                  Add Diagnosis
                </button>
              </form>

              <div className="divide-y divide-slate-100">
                {patient.medicalHistory.map((d, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-slate-900">{d}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MEDICATIONS (Rx) */}
          {activeTab === "medications" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Medication Management & Electronic Prescribing (eRx)</h3>
                  <p className="text-slate-500">PBS authority tracking, Active Script List, and RTPM SafeScript validation</p>
                </div>
              </div>

              <form onSubmit={handleAddMedication} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Medication Name & Strength:</label>
                    <input
                      type="text"
                      value={newMedName}
                      onChange={e => setNewMedName(e.target.value)}
                      placeholder="e.g. Atorvastatin 20mg Tablet"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dosage Instructions:</label>
                    <input
                      type="text"
                      value={newMedDose}
                      onChange={e => setNewMedDose(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Repeats Authorized:</label>
                    <select
                      value={newMedRepeats}
                      onChange={e => setNewMedRepeats(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value={0}>0 (Single Supply)</option>
                      <option value={1}>1 Repeat</option>
                      <option value={2}>2 Repeats</option>
                      <option value={5}>5 Repeats (Chronic)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Issue ePrescription</span>
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {patient.prescriptionsList.map(rx => (
                  <div key={rx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{rx.items.join(", ")}</p>
                      <p className="text-slate-500 text-[11px]">Rx No: {rx.rxNumber} • {rx.date} • {rx.pbsType || "PBS Subsidised"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                        ASL Active
                      </span>
                      {onRenderPrescription && (
                        <button
                          onClick={() => onRenderPrescription(rx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print Rx</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ALLERGIES */}
          {activeTab === "allergies" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Patient Allergies & Adverse Drug Reactions</h3>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Declared Severe Allergies:</span>
                </div>
                <p className="text-red-900 font-extrabold text-sm">{patient.allergies || "No Known Allergies"}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-700">Update / Add Allergy:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllergyInput}
                    onChange={e => setNewAllergyInput(e.target.value)}
                    placeholder="e.g. Penicillin, Aspirin, Sulfa drugs..."
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                  <button
                    onClick={() => {
                      if (!newAllergyInput.trim()) return;
                      const updatedAllergies = patient.allergies ? `${patient.allergies}, ${newAllergyInput.trim()}` : newAllergyInput.trim();
                      const updated = { ...patient, allergies: updatedAllergies };
                      onUpdatePatient(updated);
                      setNewAllergyInput("");
                      showToast(`Added Allergy: ${newAllergyInput}`);
                    }}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Add Allergy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: OBSERVATIONS & LIVE BMI CALCULATION */}
          {activeTab === "observations" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Clinical Observations & Automatic Anthropometry Calculator</h3>
                <p className="text-slate-500">Entering patient height and weight automatically computes BMI and ideal weight range</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Height (cm):</label>
                  <input
                    type="number"
                    value={obsHeightCm}
                    onChange={e => setObsHeightCm(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weight (kg):</label>
                  <input
                    type="number"
                    value={obsWeightKg}
                    onChange={e => setObsWeightKg(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Systolic / Diastolic BP:</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={obsSystolic}
                      onChange={e => setObsSystolic(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      placeholder="Sys"
                    />
                    <input
                      type="number"
                      value={obsDiastolic}
                      onChange={e => setObsDiastolic(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      placeholder="Dia"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pulse & SpO2:</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={obsPulse}
                      onChange={e => setObsPulse(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      placeholder="BPM"
                    />
                    <input
                      type="number"
                      value={obsSpO2}
                      onChange={e => setObsSpO2(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      placeholder="SpO2 %"
                    />
                  </div>
                </div>
              </div>

              {/* Live Computed Card */}
              {autoBmi && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${autoBmi.color}`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase opacity-75">Live Computed Body Mass Index (BMI)</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black">{autoBmi.bmi}</span>
                      <span className="text-xs font-bold">kg/m²</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-white/70 rounded-full border ml-2">
                        {autoBmi.category}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 opacity-90">{autoBmi.advice}</p>
                  </div>

                  <button
                    onClick={handleSaveObservation}
                    className="px-4 py-2 bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold rounded-lg shadow-xs cursor-pointer shrink-0"
                  >
                    Commit Observations
                  </button>
                </div>
              )}

              {/* History Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Observation Logs History</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(patient.observationsHistory || []).map(o => (
                    <div key={o.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{o.date} at {o.time}</span>
                        <p className="text-slate-600">
                          BMI: <strong>{o.bmi} kg/m²</strong> ({o.bmiCategory}) • BP: <strong>{o.systolicBp}/{o.diastolicBp}</strong> • Pulse: {o.pulse} bpm • SpO2: {o.spO2}%
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">By: {o.recordedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: IMMUNISATIONS */}
          {activeTab === "immunisations" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Australian Immunisation Register (AIR) Records</h3>
                  <p className="text-slate-500">Childhood schedule, COVID-19, seasonal influenza, and travel vaccines</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {patient.vaccineRecords.map((v, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{v.vaccineName}</p>
                      <p className="text-slate-500">{v.dose} • Batch: {v.batchNumber} • Date: {v.date}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ✓ AIR Transmitted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: PATHOLOGY */}
          {activeTab === "pathology" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Electronic Pathology Ordering & Incoming Results</h3>
              </div>

              <form onSubmit={handleOrderPathology} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Pathology Test (Favourites):</label>
                    <select
                      value={pathTestSelection}
                      onChange={e => setPathTestSelection(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Full Blood Count (FBC)">Full Blood Count (FBC)</option>
                      <option value="Glycated Hemoglobin (HbA1c)">Glycated Hemoglobin (HbA1c)</option>
                      <option value="Lipid Profile (Chol, HDL, LDL, Trig)">Lipid Profile</option>
                      <option value="Urea, Electrolytes & Creatinine (EUC/eGFR)">EUC & eGFR Kidney Function</option>
                      <option value="Liver Function Tests (LFTs)">Liver Function Tests (LFTs)</option>
                      <option value="Thyroid Function (TSH, FT4)">Thyroid Stimulating Hormone (TSH)</option>
                      <option value="Iron Studies & Ferritin">Iron Studies & Ferritin</option>
                      <option value="Urinalysis & Micro/Culture">Urine Micro & Culture (MSU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clinical Indication:</label>
                    <input
                      type="text"
                      value={pathClinicalNotes}
                      onChange={e => setPathClinicalNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Send Electronic Pathology Request
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {patient.labResults.map(res => (
                  <div key={res.id} className="py-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{res.testName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{res.date}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{res.result}</p>
                    <p className="text-slate-500 italic text-[11px]">{res.remarks}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: IMAGING */}
          {activeTab === "imaging" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Diagnostic Imaging Requests (X-ray, CT, MRI, Ultrasound)</h3>
              </div>

              <form onSubmit={handleOrderImaging} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Modality:</label>
                    <select
                      value={imagingModality}
                      onChange={e => setImagingModality(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="X-ray">X-ray</option>
                      <option value="CT">Computed Tomography (CT Scan)</option>
                      <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="Mammography">Mammography</option>
                      <option value="Bone Densitometry">Bone Densitometry (DEXA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Region / Body Part:</label>
                    <input
                      type="text"
                      value={imagingBodyPart}
                      onChange={e => setImagingBodyPart(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clinical Indication:</label>
                    <input
                      type="text"
                      value={imagingIndication}
                      onChange={e => setImagingIndication(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Generate Imaging eRequest
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {(patient.imagingRecords || []).map(img => (
                  <div key={img.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{img.modality} — {img.bodyPart}</p>
                      <p className="text-slate-500 text-[11px]">Indication: {img.clinicalIndication} • Ordered: {img.dateOrdered}</p>
                    </div>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                      {img.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: REFERRALS */}
          {activeTab === "referrals" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Specialist Directory & eReferrals Network</h3>
              </div>

              <form onSubmit={handleCreateReferral} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specialist & Specialty:</label>
                    <select
                      value={refSpecialist}
                      onChange={e => {
                        setRefSpecialist(e.target.value);
                        if (e.target.value.includes("Cardiologist")) setRefSpecialty("Cardiology");
                        else if (e.target.value.includes("Endocrinologist")) setRefSpecialty("Endocrinology");
                        else setRefSpecialty("Orthopaedics");
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Dr. Lalith Fernando (Cardiologist)">Dr. Lalith Fernando (Cardiologist) — Asiri Surgical</option>
                      <option value="Dr. Chandima De Silva (Endocrinologist)">Dr. Chandima De Silva (Endocrinologist) — Lanka Hospital</option>
                      <option value="Dr. Nalin Wickramasinghe (Orthopaedic Surgeon)">Dr. Nalin Wickramasinghe (Orthopaedic Surgeon) — National Hospital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clinical Reason & Objectives:</label>
                    <input
                      type="text"
                      value={refClinicalSummary}
                      onChange={e => setRefClinicalSummary(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Send Electronic eReferral
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {(patient.referralsList || []).map(ref => (
                  <div key={ref.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{ref.specialistName} ({ref.specialty})</p>
                      <p className="text-slate-500 text-[11px]">{ref.clinicalSummary} • {ref.dateCreated}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      eReferral Dispatched
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: CARE PLANS */}
          {activeTab === "careplans" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Chronic Disease Management & Care Plans</h3>
                  <p className="text-slate-500">GP Management Plans (MBS 721), Team Care Arrangements (MBS 723), and Mental Health Plans (MBS 2715)</p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-purple-950 text-sm">Active GP Management Plan (MBS Item 721)</h4>
                    <p className="text-purple-800 text-[11px]">Primary Conditions: Bronchial Asthma, Hypertension, Osteoarthritis</p>
                  </div>
                  <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded">
                    Active (Reviewed 6m)
                  </span>
                </div>
                <div className="pt-2 border-t border-purple-200 flex justify-between text-purple-900 text-[11px]">
                  <span>Review Due Date: <strong>2026-10-15</strong></span>
                  <span>Allied Health Entitlement: <strong>5 / 5 visits available</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900">Clinical Documents & Correspondence</h3>
              <div className="divide-y divide-slate-100">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="font-bold text-slate-900">Hospital Discharge Summary - Colombo South Teaching Hospital</p>
                      <p className="text-slate-400 text-[10px]">2025-11-20 • PDF Document • 2.4 MB</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-[#00334f] hover:underline">View PDF</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: MY HEALTH RECORD */}
          {activeTab === "myhealthrecord" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">My Health Record (ADHA National Portal)</h3>
                  <p className="text-slate-500">Direct query of Shared Health Summaries, Event Summaries, and national dispense history</p>
                </div>
                <button
                  onClick={() => showToast("Shared Health Summary (SHS) uploaded to My Health Record.")}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg font-bold"
                >
                  Upload Shared Health Summary
                </button>
              </div>

              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-sky-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  <span>NASH Digital Certificate Verified • IHI: {patient.ihiNumber || "8003 6088 3312 9014"}</span>
                </div>
                <p className="text-sky-800 text-[11px]">Authorized to access national health records with active patient consent.</p>
              </div>
            </div>
          )}

          {/* TAB 15: APPOINTMENTS & CONSULTATION ACTIVITIES */}
          {activeTab === "appointments" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    Appointment History & Doctor Consultation Activities
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Detailed log of all OPD encounters, completed SOAP clinical assessments, doctor vitals, and billing settlements
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {appointments.filter(a => a.patientId === patient.id).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic">No appointment history found for this patient.</div>
                ) : (
                  appointments.filter(a => a.patientId === patient.id).map(a => (
                    <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{a.reason}</span>
                            <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                              {a.type || "Standard GP Consult"}
                            </span>
                            {a.room && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                                Room: {a.room}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            📅 {a.date} at {a.time} • Doctor: {a.doctorName || "Dr. Priyantha Silva"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            a.status === "COMPLETED" 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : a.status === "IN EXAM ROOM"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-200 text-slate-700"
                          }`}>
                            {a.status === "COMPLETED" ? "✔ COMPLETED" : a.status}
                          </span>
                          {a.feeAmount && (
                            <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              Rs. {a.feeAmount.toLocaleString()}.00
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Doctor Consultation Activity Breakdown */}
                      {a.consultationActivity ? (
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-2 text-[#00334f] font-bold">
                              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                              <span>Clinical Consultation Summary (SLMC Reg: {a.consultationActivity.doctorSlmcNo || "12908"})</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[10px]">
                              Modality: <strong>{a.consultationActivity.modality}</strong>
                            </span>
                          </div>

                          {/* Recorded Vitals */}
                          {a.consultationActivity.vitalsRecorded && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">Blood Pressure</span>
                                <span className="font-bold text-slate-800">{a.consultationActivity.vitalsRecorded.bp || "128/80"} mmHg</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">Pulse / Heart Rate</span>
                                <span className="font-bold text-slate-800">{a.consultationActivity.vitalsRecorded.pulse || 72} bpm</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">Temperature</span>
                                <span className="font-bold text-slate-800">{a.consultationActivity.vitalsRecorded.temp || 36.8}°C</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">BMI / Weight</span>
                                <span className="font-bold text-emerald-700">{a.consultationActivity.vitalsRecorded.bmi || "24.8"} kg/m² ({a.consultationActivity.vitalsRecorded.weightKg || 70}kg)</span>
                              </div>
                            </div>
                          )}

                          {/* SOAP Notes extract */}
                          {a.consultationActivity.soapNotes && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                              <div className="p-2 bg-sky-50/50 rounded border border-sky-100">
                                <span className="font-bold text-sky-950 block text-[10px]">Assessment & Working Diagnosis:</span>
                                <p className="text-slate-700 whitespace-pre-line font-medium mt-0.5">{a.consultationActivity.soapNotes.assessment}</p>
                              </div>
                              <div className="p-2 bg-emerald-50/50 rounded border border-emerald-100">
                                <span className="font-bold text-emerald-950 block text-[10px]">Clinical Plan & Management:</span>
                                <p className="text-slate-700 whitespace-pre-line font-medium mt-0.5">{a.consultationActivity.soapNotes.plan}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-dashed">
                            <span>Status: <strong className="text-emerald-700 font-bold">{a.consultationActivity.status}</strong> • Payment: <strong className="text-slate-700">{a.consultationActivity.paymentStatus}</strong></span>
                            <span>Signed on: {new Date(a.consultationActivity.lastUpdated).toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                          <span>Pending doctor clinical encounter notes for this appointment.</span>
                          <button
                            onClick={() => {
                              setSelectedAppointmentId(a.id);
                              setActiveTab("consultation");
                            }}
                            className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1 rounded font-bold text-xs cursor-pointer"
                          >
                            Open Consultation Note
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 16: BILLING */}
          {activeTab === "billing" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900">Medicare ECLIPSE Claims & Patient Accounts</h3>
              <div className="divide-y divide-slate-100">
                {billingList.map(b => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{b.service}</p>
                      <p className="text-slate-500 text-[11px]">{b.date} • {b.paymentMethod || "Medicare Bulk Bill"}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-900">${b.amount.toFixed(2)}</span>
                      <p className="text-[10px] text-emerald-700 font-semibold">{b.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            PrimeCare Clinical EMR • Benchmarked to Bp Premier & MedicalDirector standard
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close Record
          </button>
        </div>

      </div>

      {/* Clinical Calculators Modal */}
      {showCalculatorModal && (
        <ClinicalCalculatorsModal
          patient={patient}
          onClose={() => setShowCalculatorModal(false)}
          onSaveToConsultation={(text) => {
            setSoapObjective(prev => `${prev}\n${text}`);
            showToast("Calculated score inserted into SOAP Objective notes.");
          }}
        />
      )}

    </div>
  );
}

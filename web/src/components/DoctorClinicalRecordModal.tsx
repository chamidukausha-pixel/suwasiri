import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, Stethoscope, Clock, Pill, AlertTriangle, Activity, Syringe, 
  FlaskConical, Image, Send, Heart, Folder, Database, Calendar, DollarSign, 
  X, Plus, Check, Calculator, Copy, ShieldAlert, Sparkles, User, Printer,
  Phone, Mail, ArrowRight, CheckCircle, Search, Trash2, Edit3, ShieldCheck, GripVertical, ChevronDown,
  Camera, Upload, Eye
} from "lucide-react";
import { 
  Patient, VaccineRecord, LabResult, PrescriptionRecord, LabOrder, 
  ImagingRecord, ReferralRecord, CarePlanRecord, MyHealthRecordDoc, 
  ObservationRecord,   Appointment, Billing, DoctorConsultationActivity,
  ClinicalDocument, MedicalCertificateRecord, StaffProvider
} from "../types";
import { 
  calculateBmi, calculateAustralianCvdRisk, calculateAusdrisk, 
  calculateEgfrCkdEpi, classifyBloodPressure, calculatePregnancyEdd, 
  calculatePaediatricDose 
} from "../utils/clinicalCalculators";
import { PATHOLOGY_INVESTIGATIONS } from "../catalogs/pathologyInvestigations";
import ClinicalCalculatorsModal from "./ClinicalCalculatorsModal";
import PatientSexAgeBadge from "./PatientSexAgeBadge";
import PatientCriticalAlertBadge from "./PatientCriticalAlertBadge";
import { clinicExamSessionId, issuePrescriptionsToSuwasiri } from "../sync/suwasiriPrescriptions";
import { saveConsultationNote } from "../sync/suwasiriConsultSync";
import { issueLabReportToSuwasiri, issueImagingReportToSuwasiri } from "../sync/suwasiriLabs";
import { issueVaccineHistoryToSuwasiri } from "../sync/suwasiriVaccinations";
import { issueMedicalCertificateToSuwasiri } from "../sync/suwasiriCertificates";
import { pushSuwasiriNotification } from "../sync/suwasiriNotifications";
import ReceptionBookingScheduler from "./ReceptionBookingScheduler";
import { appointmentBelongsToPatient, staffUserAsDoctor } from "../sync/suwasiriAppointments";

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
  embedded?: boolean;
  clinicName?: string;
  sessionDoctorName?: string;
  sessionDoctor?: StaffProvider;
  linkedAppointmentId?: string;
  onBookAppointment?: (payload: {
    patientId: string;
    date: string;
    time: string;
    reason: string;
    consultMode?: "clinic" | "video";
    paymentMethod?: string;
    doctorName?: string;
    doctorStaffId?: string;
  }) => Promise<void> | void;
  onOrderPathology?: (testName: string, remarks: string) => void;
  initialTab?: ClinicalTab;
  hideClose?: boolean;
  /** Hide live booking / fee / modality (reception and super admin file view). */
  hideActiveConsultDetails?: boolean;
  /** viewport = exam-room page height; fill = parent height; natural = grow with content (parent scrolls). */
  heightMode?: "viewport" | "fill" | "natural";
  /** Live e-Rx / Active Clinical Consultation block under SOAP (doctor exam room only). */
  consultationFooter?: React.ReactNode;
}

export default function DoctorClinicalRecordModal({
  patient,
  appointments,
  billingList,
  currentRole,
  onClose,
  onUpdatePatient,
  onUpdateAppointment,
  onRenderPrescription,
  onLaunchTelehealth,
  embedded = false,
  clinicName,
  sessionDoctorName,
  sessionDoctor,
  linkedAppointmentId,
  onBookAppointment,
  onOrderPathology,
  initialTab,
  hideClose = false,
  hideActiveConsultDetails = false,
  heightMode = "viewport",
  consultationFooter,
}: Props) {
  const issuedDoctor = sessionDoctorName || "Dr. Priyantha Silva";
  const issuedClinic = clinicName || patient.medicalCenter || "PrimeCare Medical Centre - Colombo Central";
  const bookingDoctor =
    sessionDoctor ||
    staffUserAsDoctor(
      sessionDoctorName ? { name: sessionDoctorName } : undefined,
      patient.hospitalId || ""
    );

  const [activeTab, setActiveTab] = useState<ClinicalTab>(initialTab || (embedded ? "consultation" : "summary"));
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const patientAppointments = appointments.filter((a) => appointmentBelongsToPatient(a, patient));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    patientAppointments[0]?.id || ""
  );
  const [consultModality, setConsultModality] = useState<"In-Person OPD" | "Telehealth Video" | "Home Visit" | "Emergency Triage">("In-Person OPD");
  const [consultFeeLkr, setConsultFeeLkr] = useState<number>(2500);

  // SOAP Consultation Note States
  const [soapReason, setSoapReason] = useState("");
  const [soapSubjective, setSoapSubjective] = useState(embedded ? "" : "Patient attends for scheduled follow-up. Reports good general wellness. Mild morning joint stiffness and occasional dry cough. No chest tightness, shortness of breath, or fever.");
  const [soapObjective, setSoapObjective] = useState(embedded ? "" : "Alert and orientated. Chest: Clear bilaterally, vesicular breath sounds. CVS: Dual heart sounds, no murmurs. Abdomen: Soft, non-tender. BP: 130/82 mmHg, Pulse: 72 bpm, SpO2: 98% on room air.");
  const [soapAssessment, setSoapAssessment] = useState(embedded ? "" : "1. Bronchial Asthma (mild, well-controlled)\n2. Essential Hypertension (stable on monotherapy)\n3. Osteoarthritis (stable, advised gentle range of motion exercises)");
  const [soapPlan, setSoapPlan] = useState(embedded ? "" : "1. Continue regular Ventolin PRN\n2. Repeat FBC and fasting lipid profile in 3 months\n3. Review in clinic in 6 weeks or sooner if symptoms escalate\n4. Reassure regarding lifestyle and hydration");

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

  useEffect(() => {
    setAutoBmi(calculateBmi(obsHeightCm, obsWeightKg));
  }, [obsHeightCm, obsWeightKg]);

  useEffect(() => {
    setActiveTab(initialTab || (embedded ? "consultation" : "summary"));
  }, [patient.id, initialTab, embedded]);

  useEffect(() => {
    const current =
      patientAppointments.find((a) => a.id === linkedAppointmentId) ||
      patientAppointments.find((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED") ||
      patientAppointments[0];
    if (!current) return;
    setSelectedAppointmentId(current.id);
    const video = Boolean(
      current.isTelehealth ||
      current.type === "Telehealth Video" ||
      String(current.consultMode || "").toLowerCase().includes("video")
    );
    setConsultModality(video ? "Telehealth Video" : "In-Person OPD");
    setConsultFeeLkr(typeof current.feeAmount === "number" ? current.feeAmount : 2500);
    if (current.reason) setSoapReason(current.reason);
    else setSoapReason("");
    const soap = current.consultationActivity?.soapNotes;
    const match = (patient.history || []).find((h) => h.appointmentId === current.id);
    if (soap) {
      setSoapSubjective(soap.subjective || "");
      setSoapObjective(soap.objective || "");
      setSoapAssessment(soap.assessment || "");
      setSoapPlan(soap.plan || "");
      setDoctorNote(soap.plan || soap.subjective || soap.assessment || "");
    } else if (match?.soapSubjective || match?.soapObjective || match?.soapAssessment || match?.soapPlan) {
      if (match.reason) setSoapReason(match.reason);
      setSoapSubjective(match.soapSubjective || "");
      setSoapObjective(match.soapObjective || "");
      setSoapAssessment(match.soapAssessment || "");
      setSoapPlan(match.soapPlan || "");
      setDoctorNote(match.soapPlan || match.soapSubjective || match.notes || "");
    } else {
      setSoapSubjective("");
      setSoapObjective("");
      setSoapAssessment("");
      setSoapPlan("");
      setDoctorNote("");
    }
  }, [patient.id, linkedAppointmentId]);

  useEffect(() => {
    const apt = patientAppointments.find((a) => a.id === selectedAppointmentId);
    if (apt?.reason) setSoapReason(apt.reason);
    if (apt) {
      const soap = apt.consultationActivity?.soapNotes;
      if (soap) {
        setSoapSubjective(soap.subjective || "");
        setSoapObjective(soap.objective || "");
        setSoapAssessment(soap.assessment || "");
        setSoapPlan(soap.plan || "");
        setDoctorNote(soap.plan || soap.subjective || soap.assessment || "");
        return;
      }
    }
    const match = (patient.history || []).find((h) => h.appointmentId === selectedAppointmentId);
    if (match?.soapSubjective || match?.soapObjective || match?.soapAssessment || match?.soapPlan) {
      if (match.reason) setSoapReason(match.reason);
      setSoapSubjective(match.soapSubjective || "");
      setSoapObjective(match.soapObjective || "");
      setSoapAssessment(match.soapAssessment || "");
      setSoapPlan(match.soapPlan || "");
      setDoctorNote(match.soapPlan || match.soapSubjective || match.notes || "");
    }
  }, [selectedAppointmentId]);

  useEffect(() => {
    if (embedded && (activeTab === "history" || activeTab === "diagnoses" || activeTab === "observations" || activeTab === "billing")) {
      setActiveTab("consultation");
    }
  }, [embedded, activeTab]);

  // Diagnoses list state
  const [newDiagnosisInput, setNewDiagnosisInput] = useState("");
  const [newIcd10, setNewIcd10] = useState("J45.9");

  // Medication add state
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("Take 1 tablet daily in the morning");
  const [newMedRepeats, setNewMedRepeats] = useState(2);

  // Allergy add / edit state
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [editingAllergyIndex, setEditingAllergyIndex] = useState<number | null>(null);
  const [editingAllergyDraft, setEditingAllergyDraft] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [refEmail, setRefEmail] = useState("lalith.fernando@asiri.lk");
  const [docEmail, setDocEmail] = useState("");
  const [docPhone, setDocPhone] = useState("");
  const [examAddDocMode, setExamAddDocMode] = useState<"chooser" | "scan" | "drop" | null>(null);
  const [examDropActive, setExamDropActive] = useState(false);
  const examFileInputRef = useRef<HTMLInputElement>(null);
  const examScanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "documents") setExamAddDocMode("chooser");
  }, [activeTab]);
  const [historyLinkOpen, setHistoryLinkOpen] = useState(false);
  const [dragNavId, setDragNavId] = useState<string | null>(null);

  const DEFAULT_EXAM_ORDER: ClinicalTab[] = [
    "consultation", "allergies", "immunisations", "pathology",
    "imaging", "referrals", "careplans", "documents", "appointments",
  ];
  const [examNavOrder, setExamNavOrder] = useState<ClinicalTab[]>(() => {
    try {
      const raw = localStorage.getItem("suwasiri-exam-nav-order");
      if (!raw) return DEFAULT_EXAM_ORDER;
      const parsed = JSON.parse(raw) as string[];
      const valid = parsed.filter((id): id is ClinicalTab => DEFAULT_EXAM_ORDER.includes(id as ClinicalTab));
      return [...valid, ...DEFAULT_EXAM_ORDER.filter((id) => !valid.includes(id))];
    } catch {
      return DEFAULT_EXAM_ORDER;
    }
  });

  // Pathology Request State
  const [pathTestSelection, setPathTestSelection] = useState(PATHOLOGY_INVESTIGATIONS[0].name);
  const [pathClinicalNotes, setPathClinicalNotes] = useState("Routine monitoring / fatigue screening");
  const [viewingPathLab, setViewingPathLab] = useState<LabResult | null>(null);
  const [pathNoteDrafts, setPathNoteDrafts] = useState<Record<string, string>>({});
  const [savingPathNoteId, setSavingPathNoteId] = useState<string | null>(null);

  // Imaging Request State
  const [imagingModality, setImagingModality] = useState<ImagingRecord["modality"]>("X-ray");
  const [imagingBodyPart, setImagingBodyPart] = useState("Chest PA & Lateral");
  const [imagingIndication, setImagingIndication] = useState("Persistent cough > 2 weeks, exclude focal consolidation");

  const [vaxName, setVaxName] = useState("");
  const [vaxDate, setVaxDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [vaxDose, setVaxDose] = useState("1st Dose");
  const [vaxBatch, setVaxBatch] = useState("");
  const [vaxSaving, setVaxSaving] = useState(false);

  const [mcDiagnosis, setMcDiagnosis] = useState("");
  const [mcStartDate, setMcStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mcEndDate, setMcEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mcNumDays, setMcNumDays] = useState(1);
  const [mcStatus, setMcStatus] = useState<MedicalCertificateRecord["status"]>("UNFIT_FOR_WORK");
  const [mcRemarks, setMcRemarks] = useState("");
  const [mcSaving, setMcSaving] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<MedicalCertificateRecord | null>(null);
  const [viewingImaging, setViewingImaging] = useState<ImagingRecord | null>(null);
  const [imagingReportDrafts, setImagingReportDrafts] = useState<Record<string, string>>({});

  const MC_LEAVE_REASONS = [
    "Viral fever / acute febrile illness",
    "Upper respiratory tract infection",
    "Influenza-like illness / COVID-19",
    "Dengue fever / suspected dengue",
    "Gastroenteritis",
    "Injury / trauma",
    "Musculoskeletal pain / backache",
    "Migraine / headache",
    "Asthma / COPD exacerbation",
    "Hypertension / cardiac review",
    "Skin infection / cellulitis",
    "Pregnancy-related rest",
    "Post-operative recovery",
    "Mental health / work stress",
    "School / exam medical leave",
    "Fitness to return to work / school",
    "Other (see additional remarks)",
  ];

  useEffect(() => {
    if (!mcStartDate || !mcEndDate) return;
    const start = new Date(mcStartDate);
    const end = new Date(mcEndDate);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    setMcNumDays(diff > 0 ? diff : 1);
  }, [mcStartDate, mcEndDate]);

  // Referral State
  const [refSpecialist, setRefSpecialist] = useState("Dr. Lalith Fernando (Cardiologist)");
  const [refSpecialty, setRefSpecialty] = useState("Cardiology");
  const [refClinicalSummary, setRefClinicalSummary] = useState("Thank you for reviewing this patient regarding cardiovascular risk stratification and echocardiogram evaluation.");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const allergyItems = (patient.allergies || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      const n = s.toLowerCase().replace(/[.]/g, "");
      return !/^(nkda|none|none declared|none known|no known allergies|no known drug allergies|nka|nil)$/.test(n);
    });

  const persistAllergies = (items: string[]) => {
    const joined = items.length ? items.join(", ") : "NKDA";
    onUpdatePatient({ ...patient, allergies: joined });
  };

  const isVideoApt = (apt: Appointment) =>
    Boolean(apt.isTelehealth || apt.type === "Telehealth Video" || String(apt.consultMode || "").toLowerCase().includes("video"));
  const encounterLabel = (apt: Appointment) =>
    `${apt.date} (${apt.time}) - ${apt.type || "Standard GP Consult"}${isVideoApt(apt) ? " - Video consultation" : ""}`;
  const currentBooking =
    patientAppointments.find((a) => a.id === linkedAppointmentId) ||
    patientAppointments.find((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED") ||
    patientAppointments[0] ||
    null;
  const pastAppointments = [...patientAppointments].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const viewingApt = patientAppointments.find((a) => a.id === selectedAppointmentId) || currentBooking;
  const bookingFeeLkr = currentBooking && typeof currentBooking.feeAmount === "number" ? currentBooking.feeAmount : consultFeeLkr;
  const viewingPastEncounter = Boolean(currentBooking && viewingApt && viewingApt.id !== currentBooking.id);
  const dayKey = (value?: string) => (value || "").slice(0, 10);

  const loadEncounter = (apt: Appointment) => {
    setSelectedAppointmentId(apt.id);
    setHistoryLinkOpen(false);
    setSoapReason(apt.reason || "");
    const soap = apt.consultationActivity?.soapNotes;
    const hist = (patient.history || []).find((h) => h.appointmentId === apt.id);
    if (soap) {
      setSoapSubjective(soap.subjective || "");
      setSoapObjective(soap.objective || "");
      setSoapAssessment(soap.assessment || "");
      setSoapPlan(soap.plan || "");
      setDoctorNote(soap.plan || soap.subjective || soap.assessment || "");
    } else if (hist) {
      setSoapSubjective(hist.soapSubjective || "");
      setSoapObjective(hist.soapObjective || "");
      setSoapAssessment(hist.soapAssessment || "");
      setSoapPlan(hist.soapPlan || "");
      setDoctorNote(hist.soapPlan || hist.soapSubjective || hist.notes || "");
    } else {
      setSoapSubjective("");
      setSoapObjective("");
      setSoapAssessment("");
      setSoapPlan("");
      setDoctorNote("");
    }
    showToast(`Opened encounter ${apt.date} (${apt.time})`);
  };

  const fileClinicalDocFromFile = (file: File, scanned: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      const doc: ClinicalDocument = {
        id: (scanned ? "scan-" : "doc-") + Date.now(),
        patientId: patient.id,
        patientName: patient.name,
        title: file.name.replace(/\.[^/.]+$/, "") || (scanned ? "Scanned document" : "Uploaded document"),
        category: "Clinical Correspondence",
        fileType: scanned ? "SCANNED_DOC" : file.type.includes("png") ? "IMAGE_PNG" : file.type.includes("pdf") ? "PDF" : "IMAGE_JPEG",
        fileSizeKb: Math.round(file.size / 1024) || 1,
        fileUrl: String(reader.result || ""),
        uploadedBy: scanned ? "Clinic scanner" : "GP Exam Room",
        uploadedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
        allocatedDoctor: issuedDoctor,
        status: "PENDING_DOCTOR_REVIEW",
        versionHistory: [
          {
            versionNumber: 1,
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
            author: issuedDoctor,
            notes: scanned ? "Scanned into chart" : "Drag-and-drop / browse",
            fileSizeKb: Math.round(file.size / 1024) || 1,
          },
        ],
        tags: [scanned ? "Scanned" : "Uploaded"],
        signatureStatus: "UNSIGNED",
      };
      onUpdatePatient({ ...patient, clinicalDocuments: [doc, ...(patient.clinicalDocuments || [])] });
      setExamAddDocMode("chooser");
      showToast(`Filed “${doc.title}” to Documents history.`);
    };
    reader.readAsDataURL(file);
  };

  const printDocument = (title: string, body: string) => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      showToast("Allow pop-ups to print this document.");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body { font-family: Georgia, serif; color: #00334f; padding: 28px; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
        pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 13px; line-height: 1.5; }
      </style></head><body>
      <h1>${title}</h1>
      <div class="meta">${patient.name} · ${issuedDoctor} · ${issuedClinic}</div>
      <pre>${body.replace(/</g, "&lt;")}</pre>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const sendByEmail = (to: string, subject: string, body: string) => {
    const dest = (to || patient.email || "").trim();
    if (!dest) {
      showToast("Enter an email address first.");
      return;
    }
    window.open(`mailto:${encodeURIComponent(dest)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    showToast(`Email draft opened for ${dest}`);
  };

  const sendByPhone = (phone: string, body: string) => {
    const dest = (phone || patient.phone || "").replace(/\s/g, "");
    if (!dest) {
      showToast("Enter a phone number first.");
      return;
    }
    window.open(`sms:${dest}?body=${encodeURIComponent(body.slice(0, 300))}`, "_blank");
    showToast(`Message draft opened for ${dest}`);
  };

  const appendClinicalHistory = (row: {
    reason: string;
    notes: string;
    appointmentId?: string;
    soapSubjective?: string;
    soapObjective?: string;
    soapAssessment?: string;
    soapPlan?: string;
  }) => ([
    {
      date: new Date().toISOString().split("T")[0],
      reason: row.reason,
      doctor: issuedDoctor,
      notes: row.notes,
      clinicName: issuedClinic,
      appointmentId: row.appointmentId || selectedAppointmentId || undefined,
      soapSubjective: row.soapSubjective,
      soapObjective: row.soapObjective,
      soapAssessment: row.soapAssessment,
      soapPlan: row.soapPlan,
    },
    ...(patient.history || []),
  ]);

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
      heightCm: obsHeightCm,
      weightKg: obsWeightKg,
      lastSystolicBp: obsSystolic,
      lastDiastolicBp: obsDiastolic,
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
      diagnosesList: [...(patient.diagnosesList || []), newDiag],
      history: appendClinicalHistory({
        reason: `Diagnosis: ${newDiag.condition}`,
        notes: `ICD-10 ${newDiag.icd10Code || "—"}. Added to the active problem list.`,
      }),
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
    const videoConsult =
      consultModality === "Telehealth Video" ||
      Boolean(
        viewingApt?.isTelehealth ||
        viewingApt?.type === "Telehealth Video" ||
        String(viewingApt?.consultMode || "").toLowerCase().includes("video")
      );
    const sessionId = videoConsult
      ? (linkedAppointmentId || selectedAppointmentId || viewingApt?.id)
      : clinicExamSessionId(selectedAppointmentId || linkedAppointmentId);
    showToast(
      videoConsult
        ? `Issued e-Rx for ${newMedName} — synced to Suwasiri Call → E-Prescription`
        : `Issued e-Rx for ${newMedName} — synced to Suwasiri Vault → E-Prescription`
    );
    void issuePrescriptionsToSuwasiri({
      patientId: patient.id,
      doctorName: issuedDoctor,
      clinicName: issuedClinic,
      medicines: [`${newMedName} [${newMedDose}]`],
      rxNumber: newRx.rxNumber,
      sessionId,
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
      labResults: [newLab, ...(patient.labResults || [])]
    };
    onUpdatePatient(updated);
    onOrderPathology?.(pathTestSelection, pathClinicalNotes);
    showToast(`Pathology eRequest submitted: ${pathTestSelection}`);
  };

  const pathReportText = (res: LabResult) =>
    [
      "LANKALAB CENTRAL DIAGNOSTICS & PATHOLOGY",
      "Official clinical laboratory report",
      "",
      `Patient: ${patient.name}`,
      `Patient ID: ${patient.id}`,
      `Age / sex: ${patient.age} yrs, ${patient.gender}`,
      `Clinic: ${issuedClinic}`,
      `Doctor: ${issuedDoctor}`,
      "",
      `Investigation: ${res.testName}`,
      `Report ID: ${res.id}`,
      `Collection date: ${res.date}`,
      `Result: ${res.result}`,
      `Status: ${res.status}${res.abnormalFlag ? " [ABNORMAL]" : ""}`,
      `Laboratory notes: ${res.remarks || "—"}`,
      `Doctor notes: ${pathNoteDrafts[res.id] ?? res.doctorNotes ?? "—"}`,
    ].join("\n");

  const savePathologyNote = (labId: string) => {
    const note = (pathNoteDrafts[labId] ?? "").trim();
    const nextLabs = (patient.labResults || []).map((lr) =>
      lr.id === labId ? { ...lr, doctorNotes: note } : lr
    );
    onUpdatePatient({ ...patient, labResults: nextLabs });
    setSavingPathNoteId(labId);
    const lab = nextLabs.find((lr) => lr.id === labId);
    if (lab) {
      void issueLabReportToSuwasiri({
        patientId: patient.id,
        doctorName: issuedDoctor,
        clinicName: issuedClinic,
        lab: { ...lab, remarks: note || lab.remarks, category: lab.category || "Pathology" },
        comment: note,
      });
    }
    showToast("Pathology note saved and synced to Suwasiri Vault → Lab reports.");
    window.setTimeout(() => setSavingPathNoteId(null), 1200);
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
    showToast(`Imaging synced to Suwasiri Vault → Lab reports: ${imagingModality} — ${imagingBodyPart}`);
    void issueImagingReportToSuwasiri({
      patientId: patient.id,
      doctorName: issuedDoctor,
      clinicName: issuedClinic,
      imaging: newImg,
    });
  };

  const imagingReportText = (img: ImagingRecord) =>
    [
      "IMAGING REPORT",
      `Patient: ${patient.name}`,
      `Patient ID: ${patient.id}`,
      `Study: ${img.modality} — ${img.bodyPart}`,
      `Ordered: ${img.dateOrdered}`,
      img.dateCompleted ? `Reported: ${img.dateCompleted}` : "",
      `Status: ${img.status}`,
      `Indication: ${img.clinicalIndication}`,
      `Report: ${img.radiologistReport || img.findings || "Pending imaging laboratory report"}`,
      `Clinic: ${issuedClinic}`,
      `Doctor: ${issuedDoctor}`,
    ]
      .filter(Boolean)
      .join("\n");

  const fileIssuedImagingReport = (img: ImagingRecord) => {
    const report = (imagingReportDrafts[img.id] || img.radiologistReport || "").trim();
    if (!report) {
      showToast("Enter the imaging laboratory report before filing it.");
      return;
    }
    const filed: ImagingRecord = {
      ...img,
      status: "REPORT_READY",
      radiologistReport: report,
      findings: report,
      dateCompleted: new Date().toISOString().split("T")[0],
      doctorReviewed: true,
      reviewedBy: issuedDoctor,
    };
    onUpdatePatient({
      ...patient,
      imagingRecords: (patient.imagingRecords || []).map((row) => (row.id === img.id ? filed : row)),
    });
    void issueImagingReportToSuwasiri({
      patientId: patient.id,
      doctorName: issuedDoctor,
      clinicName: issuedClinic,
      imaging: filed,
    });
    setViewingImaging(filed);
    showToast(`Issued ${img.modality} report filed under ${patient.name} and synced to Suwasiri Vault → Lab reports.`);
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
    showToast(`Referral sent to ${refSpecialist}. ${patient.name} was notified in Suwasiri.`);
    void pushSuwasiriNotification({
      patientId: patient.id,
      title: "Specialist referral issued",
      body: `${issuedDoctor} referred you to ${refSpecialist} (${refSpecialty}). Open Suwasiri for the clinic details.`,
      type: "appointment",
    });
  };

  // Tabs — exam room hides Summary, Medications, My Health Record
  const clinicalTabs = [
    { id: "summary", label: "Summary", icon: User, box: "bg-slate-100 border-slate-300 text-slate-800", active: "bg-gradient-to-r from-slate-600 to-slate-800 text-white border-slate-700" },
    { id: "consultation", label: "Consultation", icon: Stethoscope, box: "bg-sky-100 border-sky-300 text-sky-900", active: "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-600" },
    { id: "history", label: "Medical History", icon: Clock, box: "bg-amber-100 border-amber-300 text-amber-950", active: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-500" },
    { id: "diagnoses", label: "Diagnoses", icon: FileText, box: "bg-indigo-100 border-indigo-300 text-indigo-950", active: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-indigo-600" },
    { id: "medications", label: "Medications (Rx)", icon: Pill, box: "bg-emerald-100 border-emerald-300 text-emerald-950", active: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600" },
    { id: "allergies", label: "Allergies", icon: AlertTriangle, box: "bg-rose-100 border-rose-300 text-rose-950", active: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-600" },
    { id: "observations", label: "Observations & BMI", icon: Activity, box: "bg-teal-100 border-teal-300 text-teal-950", active: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-teal-600" },
    { id: "immunisations", label: "Immunisations (AIR)", icon: Syringe, box: "bg-lime-100 border-lime-300 text-lime-950", active: "bg-gradient-to-r from-lime-500 to-green-600 text-white border-lime-600" },
    { id: "pathology", label: "Pathology", icon: FlaskConical, box: "bg-purple-100 border-purple-300 text-purple-950", active: "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white border-purple-600" },
    { id: "imaging", label: "Imaging", icon: Image, box: "bg-cyan-100 border-cyan-300 text-cyan-950", active: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white border-cyan-600" },
    { id: "referrals", label: "Referrals", icon: Send, box: "bg-orange-100 border-orange-300 text-orange-950", active: "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-600" },
    { id: "careplans", label: "Care Plans", icon: Heart, box: "bg-pink-100 border-pink-300 text-pink-950", active: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-600" },
    { id: "documents", label: "Medical Certificate", icon: Folder, box: "bg-blue-100 border-blue-300 text-blue-950", active: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600" },
    { id: "myhealthrecord", label: "My Health Record", icon: Database, box: "bg-slate-100 border-slate-300 text-slate-800", active: "bg-gradient-to-r from-slate-500 to-slate-700 text-white border-slate-600" },
    { id: "appointments", label: "Appointments", icon: Calendar, box: "bg-violet-100 border-violet-300 text-violet-950", active: "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-violet-600" },
    { id: "billing", label: "Billing", icon: DollarSign, box: "bg-yellow-100 border-yellow-300 text-yellow-950", active: "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 border-yellow-500" },
  ] as const;

  const hiddenExamTabs = new Set(["summary", "medications", "myhealthrecord", "history", "diagnoses", "observations", "billing"]);
  const visibleTabs = embedded
    ? examNavOrder
        .map((id) => clinicalTabs.find((t) => t.id === id))
        .filter((t): t is typeof clinicalTabs[number] => Boolean(t))
        .filter((t) => !hiddenExamTabs.has(t.id))
    : clinicalTabs;

  const frame = (
      <div className={`bg-white border border-slate-300 flex flex-col ${
        heightMode === "natural"
          ? "w-full rounded-2xl shadow-sm overflow-hidden"
          : heightMode === "fill"
          ? "w-full h-full max-h-full rounded-2xl shadow-sm overflow-hidden"
          : embedded
          ? "w-full h-[calc(100vh-8.5rem)] max-h-[calc(100vh-8.5rem)] rounded-2xl shadow-sm overflow-hidden"
          : "rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] animate-in fade-in zoom-in duration-150 overflow-hidden"
      }`}>
        
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
              <h2 className="font-extrabold text-base">{patient.name}</h2>
              <PatientSexAgeBadge gender={patient.gender} age={patient.age} />
              <PatientCriticalAlertBadge patient={patient} />
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-sky-200/20 text-sky-200 font-bold px-2 py-0.5 rounded-full border border-sky-300/30">
                  ID: {patient.id}
                </span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  {patient.nic ? `NIC: ${patient.nic}` : `ID: ${patient.medicareNumber || patient.suwasiriBarcode || patient.id}`}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-1">
                DOB: {patient.dateOfBirth || "—"} • Blood: {patient.bloodType} • Allergies: <strong className="text-red-300">{patient.allergies || "None"}</strong>
                {patient.phone ? ` • Phone: ${patient.phone}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalculatorModal(true)}
              className="bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer border border-teal-300/40"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Clinical Calculators</span>
            </button>

            {hideClose ? null : (
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            )}
          </div>
        </div>

        {embedded && (
          <div className="bg-[#00273c] px-5 py-2.5 flex flex-wrap items-center gap-2 shrink-0 border-t border-white/10">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-300/80 mr-1">Under this file</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-500 text-white shadow-xs">
              <AlertTriangle className="w-3 h-3" />
              Allergies: {patient.allergies || "None declared"}
            </span>
            {(patient.diagnosesList || []).filter((d) => d.status === "ACTIVE").slice(0, 3).map((d) => (
              <span key={d.id} className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500 text-white">
                {d.condition}
              </span>
            ))}
            {(patient.medicalHistory || []).slice(0, 2).map((h, i) => (
              <span key={`${h}-${i}`} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-400 text-amber-950 max-w-[220px] truncate">
                {h}
              </span>
            ))}
            {(patient.activeMedications || []).slice(0, 2).map((m) => (
              <span key={m} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white max-w-[200px] truncate">
                {m}
              </span>
            ))}
          </div>
        )}

        {!embedded && (
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex overflow-x-auto gap-1 shrink-0 scrollbar-thin">
          {visibleTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ClinicalTab)}
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
        )}

        <div className={embedded ? `flex ${heightMode === "natural" ? "" : "flex-1 min-h-0"}` : "contents"}>
        {embedded && (
          <aside className={`w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-3 space-y-2 ${heightMode === "natural" ? "" : "overflow-y-auto"}`}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1 pb-1">Clinical sections</p>
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  draggable
                  onDragStart={() => setDragNavId(t.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragNavId || dragNavId === t.id) return;
                    const next = [...examNavOrder];
                    const from = next.indexOf(dragNavId as ClinicalTab);
                    const to = next.indexOf(t.id as ClinicalTab);
                    if (from < 0 || to < 0) return;
                    next.splice(from, 1);
                    next.splice(to, 0, dragNavId as ClinicalTab);
                    setExamNavOrder(next);
                    localStorage.setItem("suwasiri-exam-nav-order", JSON.stringify(next));
                    setDragNavId(null);
                  }}
                  onClick={() => setActiveTab(t.id as ClinicalTab)}
                  className={`w-full text-left rounded-xl border-2 px-3 py-2.5 text-xs font-extrabold flex items-center gap-2 transition shadow-xs cursor-grab active:cursor-grabbing ${
                    isActive ? `${t.active} ring-2 ring-offset-1 ring-slate-300` : `${t.box} hover:brightness-95`
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Body Content Area */}
        <div className={`${heightMode === "natural" ? "" : "overflow-y-auto flex-1 min-h-0"} ${embedded ? "p-5 bg-slate-50/80" : "p-6 bg-slate-50/50"}`}>
          
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
                    {patient.activeMedications && patient.activeMedications.length > 0 ? (
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
            <div className="space-y-5">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="border-b pb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  Doctor Clinical Consultation
                </h3>
                <p className="text-xs text-slate-500">
                  Write one doctor note for this visit. Completed notes sync to Suwasiri Vault.
                </p>
              </div>

              {viewingPastEncounter && viewingApt && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-950">
                  <span>Showing only issued details and medicines from {viewingApt.date} ({viewingApt.time}). Modality and fee stay with today’s booking.</span>
                  {currentBooking && (
                    <button
                      type="button"
                      onClick={() => loadEncounter(currentBooking)}
                      className="px-2 py-1 rounded-md bg-white border border-amber-300 text-amber-900"
                    >
                      Back to current booking
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit / Chief Complaint:</label>
                <input
                  type="text"
                  value={soapReason}
                  onChange={e => setSoapReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  readOnly={viewingPastEncounter}
                />
              </div>

              <div className="rounded-xl border-2 border-sky-300 bg-sky-50 overflow-hidden">
                <div className="px-3 py-2">
                  <span className="block font-extrabold text-slate-900 text-[11px]">Doctor notes</span>
                  <span className="block text-[10px] text-slate-600">Clinical notes for this visit — synced to Suwasiri Vault when you press Completed</span>
                </div>
                <div className="px-3 pb-3">
                  <textarea
                    rows={10}
                    value={doctorNote}
                    onChange={(e) => setDoctorNote(e.target.value)}
                    className="w-full h-56 overflow-y-auto p-2 bg-white border border-slate-200 rounded-lg text-xs resize-none"
                    placeholder="Write the consultation note…"
                    readOnly={viewingPastEncounter}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SLMC • <strong>{issuedDoctor}</strong> • {issuedClinic}</span>
                </div>
                {!viewingPastEncounter && (
                <button
                  onClick={() => {
                    const diagnosisLine = (patient.diagnosesList || [])
                      .map((d) => `${d.condition}${d.icd10Code ? ` (${d.icd10Code})` : ""}`)
                      .join("; ");
                    const newHistItem = {
                      date: new Date().toISOString().split("T")[0],
                      reason: soapReason || "Clinical consultation",
                      doctor: issuedDoctor,
                      notes: doctorNote.trim() || soapReason || "Consultation completed",
                      clinicName: issuedClinic,
                      appointmentId: selectedAppointmentId || undefined,
                      soapSubjective: doctorNote,
                      soapObjective: diagnosisLine,
                      soapAssessment: diagnosisLine,
                      soapPlan: doctorNote,
                    };

                    const targetAptId = selectedAppointmentId || patientAppointments[0]?.id || `apt-${Date.now()}`;

                    const newActivity: DoctorConsultationActivity = {
                      appointmentId: targetAptId,
                      patientId: patient.id,
                      patientName: patient.name,
                      doctorName: issuedDoctor,
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
                        subjective: doctorNote,
                        objective: diagnosisLine,
                        assessment: diagnosisLine,
                        plan: doctorNote
                      },
                      primaryDiagnosis: (patient.diagnosesList || [])[0]?.condition || "Routine Medical Review",
                      icd10Code: (patient.diagnosesList || [])[0]?.icd10Code || newIcd10 || "Z00.0",
                      prescriptionsIssued: (patient.prescriptionsList || [])
                        .filter((rx) => dayKey(rx.date) === (viewingApt?.date || new Date().toISOString().split("T")[0]))
                        .flatMap((rx) => rx.items),
                      labInvestigationsOrdered: patient.labResults?.map(l => l.testName) || [],
                      billingAmountLkr: bookingFeeLkr,
                      paymentStatus: "PAID",
                      doctorClinicalRemarks: "Consultation finalized and clinical notes verified by Attending Medical Officer.",
                      lastUpdated: new Date().toISOString()
                    };

                    const alreadyTodayObs = (patient.observationsHistory || []).some(
                      (o) => o.date === newHistItem.date
                    );
                    const completeObs = {
                      id: `obs-${Date.now()}`,
                      date: newHistItem.date,
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
                      recordedBy: issuedDoctor,
                    };

                    const updatedPatient = {
                      ...patient,
                      notes: soapPlan,
                      heightCm: obsHeightCm,
                      weightKg: obsWeightKg,
                      lastSystolicBp: obsSystolic,
                      lastDiastolicBp: obsDiastolic,
                      history: [newHistItem, ...(patient.history || [])],
                      medicalHistory: [
                        `[${newHistItem.date}] ${issuedDoctor} · ${issuedClinic} · ${soapReason || "Consultation"} | ${doctorNote || "—"}`,
                        ...(patient.medicalHistory || []),
                      ],
                      observationsHistory: alreadyTodayObs
                        ? patient.observationsHistory
                        : [completeObs, ...(patient.observationsHistory || [])],
                    };
                    onUpdatePatient(updatedPatient);

                    void saveConsultationNote({
                      patientId: patient.id,
                      patientName: patient.name,
                      doctor: issuedDoctor,
                      clinicName: issuedClinic,
                      title: "Doctor notes",
                      body: doctorNote.trim() || soapReason || "Consultation completed",
                      appointmentId: targetAptId,
                    });

                    // Update corresponding appointment
                    if (onUpdateAppointment) {
                      const existingApt =
                        appointments.find((a) => a.id === targetAptId) ||
                        appointments.find((a) => a.patientId === patient.id && a.status !== "COMPLETED");
                      if (existingApt) {
                        onUpdateAppointment({
                          ...existingApt,
                          status: "COMPLETED",
                          feeAmount: bookingFeeLkr,
                          consultationActivity: newActivity
                        });
                      }
                    }

                    showToast("Consultation completed. Notes synced to Suwasiri Vault → Doctor notes & treatment.");
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed</span>
                </button>
                )}
              </div>
            </div>
            {consultationFooter}
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
              <div>
                <h3 className="font-bold text-sm text-slate-900">Patient Allergies &amp; Adverse Drug Reactions</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Edit or delete any listed allergy. Changes save on this file, the header badge, and {patient.name}’s Suwasiri Unique Health ID.
                </p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-red-800 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Declared allergies</span>
                  </div>
                  {allergyItems.length > 0 && (
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-white border border-red-300 text-red-800 font-bold rounded-lg"
                      onClick={() => {
                        if (!window.confirm(`Clear all allergies for ${patient.name}? The file will show NKDA.`)) return;
                        persistAllergies([]);
                        setEditingAllergyIndex(null);
                        setEditingAllergyDraft("");
                        showToast("Allergies cleared — NKDA on this file and Suwasiri Profile");
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {allergyItems.length === 0 ? (
                  <p className="text-red-900 font-extrabold text-sm">No Known Allergies (NKDA)</p>
                ) : (
                  <ul className="space-y-2">
                    {allergyItems.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex flex-wrap items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-2"
                      >
                        {editingAllergyIndex === index ? (
                          <>
                            <input
                              autoFocus
                              value={editingAllergyDraft}
                              onChange={(e) => setEditingAllergyDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                e.preventDefault();
                                const next = editingAllergyDraft.trim();
                                if (!next) return;
                                persistAllergies(allergyItems.map((a, i) => (i === index ? next : a)));
                                setEditingAllergyIndex(null);
                                setEditingAllergyDraft("");
                                showToast("Allergy updated on this file and Suwasiri Profile");
                              }}
                              className="flex-1 min-w-[140px] p-2 bg-white border border-red-200 rounded-lg font-semibold text-sm"
                            />
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-red-700 text-white font-bold rounded-lg"
                              onClick={() => {
                                const next = editingAllergyDraft.trim();
                                if (!next) return;
                                persistAllergies(allergyItems.map((a, i) => (i === index ? next : a)));
                                setEditingAllergyIndex(null);
                                setEditingAllergyDraft("");
                                showToast("Allergy updated on this file and Suwasiri Profile");
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-white border font-bold rounded-lg"
                              onClick={() => {
                                setEditingAllergyIndex(null);
                                setEditingAllergyDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 min-w-[120px] text-red-900 font-extrabold text-sm">{item}</span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-red-200 text-red-800 font-bold rounded-lg"
                              onClick={() => {
                                setEditingAllergyIndex(index);
                                setEditingAllergyDraft(item);
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-red-200 text-red-800 font-bold rounded-lg"
                              onClick={() => {
                                if (!window.confirm(`Remove “${item}” from ${patient.name}’s allergies?`)) return;
                                persistAllergies(allergyItems.filter((_, i) => i !== index));
                                if (editingAllergyIndex === index) {
                                  setEditingAllergyIndex(null);
                                  setEditingAllergyDraft("");
                                }
                                showToast(`Removed ${item}`);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-700">Add allergy</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllergyInput}
                    onChange={(e) => setNewAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      if (!newAllergyInput.trim()) return;
                      persistAllergies([...allergyItems, newAllergyInput.trim()]);
                      setNewAllergyInput("");
                      showToast(`Added allergy — shown under ${patient.name} on Suwasiri Profile`);
                    }}
                    placeholder="e.g. Penicillin, Aspirin, Sulfa drugs..."
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAllergyInput.trim()) return;
                      persistAllergies([...allergyItems, newAllergyInput.trim()]);
                      setNewAllergyInput("");
                      showToast(`Added allergy — shown under ${patient.name} on Suwasiri Profile`);
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
                  <h3 className="font-bold text-sm text-slate-900">Immunisation records</h3>
                  <p className="text-slate-500">Record a clinic dose to sync it to Suwasiri Vault → Vaccine history.</p>
                </div>
              </div>

              <form
                className="p-4 bg-lime-50 rounded-xl border border-lime-200 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!vaxName.trim() || vaxSaving) return;
                  setVaxSaving(true);
                  const record: VaccineRecord = {
                    vaccineName: vaxName.trim(),
                    date: vaxDate,
                    dose: vaxDose,
                    batchNumber: vaxBatch.trim() || `GP-${Date.now()}`,
                    status: "completed",
                    site: issuedClinic,
                    providerNumber: issuedDoctor,
                    airSyncStatus: "SYNCED_TO_AIR",
                  };
                  onUpdatePatient({
                    ...patient,
                    vaccineRecords: [record, ...(patient.vaccineRecords || [])],
                  });
                  try {
                    await issueVaccineHistoryToSuwasiri({
                      patientId: patient.id,
                      patientName: patient.name,
                      vaccineName: record.vaccineName,
                      date: record.date,
                      doseLabel: record.dose,
                      batchNumber: record.batchNumber,
                      doctorName: issuedDoctor,
                      clinicName: issuedClinic,
                    });
                    showToast(`${record.vaccineName} synced to Suwasiri Vault → Vaccine history`);
                    setVaxName("");
                    setVaxBatch("");
                  } catch {
                    showToast("Could not sync immunisation to Suwasiri. Check Firebase.");
                  } finally {
                    setVaxSaving(false);
                  }
                }}
              >
                <h4 className="font-extrabold text-lime-950 text-xs uppercase tracking-wide">Record immunisation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vaccine</label>
                    <input value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder="e.g. Influenza 2026, Tdap" className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date</label>
                    <input type="date" value={vaxDate} onChange={(e) => setVaxDate(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dose</label>
                    <input value={vaxDose} onChange={(e) => setVaxDose(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batch</label>
                    <input value={vaxBatch} onChange={(e) => setVaxBatch(e.target.value)} placeholder="Optional batch number" className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={vaxSaving} className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg disabled:opacity-60">
                    {vaxSaving ? "Syncing…" : "Record & sync to Suwasiri"}
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {(patient.vaccineRecords || []).map((v, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{v.vaccineName}</p>
                      <p className="text-slate-500">{v.dose} • {v.site || v.batchNumber} • Date: {v.date}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {v.status || "Suwasiri App"}
                    </span>
                  </div>
                ))}
                {(!patient.vaccineRecords || patient.vaccineRecords.length === 0) && (
                  <p className="text-slate-400 italic py-4">No Suwasiri vaccination logs for this patient yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: PATHOLOGY */}
          {activeTab === "pathology" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Pathology</h3>
                <p className="text-slate-500 text-[11px]">Previous reports stay under Pathology history. Request a new test for Sample Dispatch Hub.</p>
              </div>

              <form onSubmit={handleOrderPathology} className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                <h4 className="font-extrabold text-purple-950 text-xs uppercase tracking-wide">Request a pathology test</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Investigation:</label>
                    <select
                      value={pathTestSelection}
                      onChange={e => setPathTestSelection(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      {PATHOLOGY_INVESTIGATIONS.map((t) => (
                        <option key={t.name} value={t.name}>{t.category} — {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clinical indication:</label>
                    <input
                      type="text"
                      value={pathClinicalNotes}
                      onChange={e => setPathClinicalNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg">
                    Request pathology test
                  </button>
                </div>
              </form>

              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide mb-2">Pathology history</h4>
                <p className="text-[11px] text-slate-500 mb-2">Reports marked Completed on Pathology leave the unread inbox and are filed here. Open a report to view it and add a doctor note.</p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-[28rem] overflow-y-auto">
                  {(patient.labResults || []).length === 0 ? (
                    <p className="text-slate-400 italic p-4">No previous pathology reports on this file yet.</p>
                  ) : (patient.labResults || []).map((res) => {
                    const body = pathReportText(res);
                    const critical = Boolean(res.criticalAlert);
                    const reviewed = Boolean(res.doctorReviewed);
                    const draft = pathNoteDrafts[res.id] ?? res.doctorNotes ?? "";
                    return (
                      <div key={res.id} className={`p-3 space-y-2 ${critical ? "bg-red-50" : "bg-white"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-bold text-slate-900">{res.testName}</span>
                            {critical && (
                              <span className="ml-1.5 text-[9px] font-black uppercase bg-red-600 text-white px-1.5 py-0.5 rounded">Red alert</span>
                            )}
                            {reviewed && !critical && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Completed</span>
                            )}
                            <p className="font-semibold text-slate-800 mt-0.5">{res.result}</p>
                            <p className="text-slate-500 italic text-[11px]">{res.remarks}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-slate-400 font-mono text-[11px] block">{res.date}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${critical ? "text-red-800 bg-red-100" : "text-purple-800 bg-purple-50"}`}>{res.status}</span>
                          </div>
                        </div>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Doctor note</span>
                          <textarea
                            rows={2}
                            value={draft}
                            onChange={(e) => setPathNoteDrafts((prev) => ({ ...prev, [res.id]: e.target.value }))}
                            placeholder="Add a clinical note on this report…"
                            className="mt-1 w-full p-2 border border-purple-200 rounded-lg bg-purple-50/50 text-[11px] outline-none focus:border-purple-400"
                          />
                        </label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button type="button" onClick={() => setViewingPathLab(res)} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[10px]"><Eye className="w-3 h-3" /> View</button>
                          <button
                            type="button"
                            onClick={() => savePathologyNote(res.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                          >
                            {savingPathNoteId === res.id ? "Saved" : "Save note"}
                          </button>
                          <button type="button" onClick={() => printDocument(res.testName, body)} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[10px]"><Printer className="w-3 h-3" /> Print</button>
                          <button type="button" onClick={() => sendByEmail(patient.email, `Pathology: ${res.testName}`, body)} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded font-bold text-[10px]"><Mail className="w-3 h-3" /> Email</button>
                          <button type="button" onClick={() => sendByPhone(patient.phone, `${res.testName} ${res.date}: ${res.result}`)} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded font-bold text-[10px]"><Phone className="w-3 h-3" /> Phone</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {viewingPathLab && (
                <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full border shadow-xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-start gap-3 border-b px-5 py-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Pathology report</p>
                        <h3 className="font-serif font-bold text-base text-[#00334f]">{viewingPathLab.testName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{patient.name} · {viewingPathLab.date}</p>
                      </div>
                      <button type="button" onClick={() => setViewingPathLab(null)} className="text-slate-400 hover:text-slate-700 p-1" title="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="flex-1 overflow-y-auto p-5 text-[11px] leading-relaxed font-mono text-slate-800 whitespace-pre-wrap bg-slate-50">
                      {pathReportText(viewingPathLab)}
                    </pre>
                    <div className="border-t px-5 py-3 space-y-2">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Doctor note</span>
                        <textarea
                          rows={2}
                          value={pathNoteDrafts[viewingPathLab.id] ?? viewingPathLab.doctorNotes ?? ""}
                          onChange={(e) => setPathNoteDrafts((prev) => ({ ...prev, [viewingPathLab.id]: e.target.value }))}
                          className="mt-1 w-full p-2 border border-purple-200 rounded-lg text-[11px] outline-none focus:border-purple-400"
                        />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            savePathologyNote(viewingPathLab.id);
                            setViewingPathLab(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[11px] font-bold"
                        >
                          Save note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: IMAGING */}
          {activeTab === "imaging" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Imaging</h3>
                <p className="text-slate-500 text-[11px]">Previous reports stay under Imaging history. Request a new study from here.</p>
              </div>

              <form onSubmit={handleOrderImaging} className="p-4 bg-cyan-50 rounded-xl border border-cyan-200 space-y-3">
                <h4 className="font-extrabold text-cyan-950 text-xs uppercase tracking-wide">Request an imaging study</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Modality:</label>
                    <select
                      value={imagingModality}
                      onChange={e => setImagingModality(e.target.value as ImagingRecord["modality"])}
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
                    <label className="block font-bold text-slate-700 mb-1">Region / body part:</label>
                    <input type="text" value={imagingBodyPart} onChange={e => setImagingBodyPart(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clinical indication:</label>
                    <input type="text" value={imagingIndication} onChange={e => setImagingIndication(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg">Request imaging</button>
                </div>
              </form>

              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide mb-2">Imaging history</h4>
                <p className="text-[11px] text-slate-500 mb-2">Requests stay on this patient. When the imaging laboratory issues the report, file it here — then View, Print, and it syncs to Suwasiri Vault → Lab reports.</p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-[28rem] overflow-y-auto">
                  {(patient.imagingRecords || []).length === 0 ? (
                    <p className="text-slate-400 italic p-4">No previous imaging reports on this file yet.</p>
                  ) : (patient.imagingRecords || []).map((img) => {
                    const body = imagingReportText(img);
                    const issued = img.status === "COMPLETED" || img.status === "REPORT_READY";
                    const draft = imagingReportDrafts[img.id] ?? (issued ? (img.radiologistReport || img.findings || "") : "");
                    return (
                      <div key={img.id} className="p-3 bg-white space-y-2">
                        <div className="flex justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900">{img.modality} — {img.bodyPart}</p>
                            <p className="text-slate-500 text-[11px]">Indication: {img.clinicalIndication} • Ordered: {img.dateOrdered} • {patient.name}</p>
                            {issued && img.radiologistReport && <p className="text-slate-700 mt-1">{img.radiologistReport}</p>}
                          </div>
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded h-fit">{img.status}</span>
                        </div>
                        {!issued && (
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Imaging laboratory report</span>
                            <textarea
                              rows={2}
                              value={draft}
                              onChange={(e) => setImagingReportDrafts((prev) => ({ ...prev, [img.id]: e.target.value }))}
                              placeholder="Paste the issued imaging report for this patient…"
                              className="mt-1 w-full p-2 border border-cyan-200 rounded-lg bg-cyan-50/50 text-[11px] outline-none focus:border-cyan-400"
                            />
                          </label>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button type="button" onClick={() => setViewingImaging(img)} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[10px]"><Eye className="w-3 h-3" /> View</button>
                          {!issued && (
                            <button type="button" onClick={() => fileIssuedImagingReport(img)} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]">File issued report</button>
                          )}
                          <button type="button" onClick={() => printDocument(`${img.modality} ${img.bodyPart}`, body)} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[10px]"><Printer className="w-3 h-3" /> Print</button>
                          <button type="button" onClick={() => sendByEmail(patient.email, `Imaging: ${img.modality} ${img.bodyPart}`, body)} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded font-bold text-[10px]"><Mail className="w-3 h-3" /> Email</button>
                          <button type="button" onClick={() => sendByPhone(patient.phone, `${img.modality} ${img.bodyPart} (${img.dateOrdered}): ${img.status}`)} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded font-bold text-[10px]"><Phone className="w-3 h-3" /> Phone</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {viewingImaging && (
                <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full border shadow-xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-start gap-3 border-b px-5 py-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">Imaging report</p>
                        <h3 className="font-serif font-bold text-base text-[#00334f]">{viewingImaging.modality} — {viewingImaging.bodyPart}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{patient.name} · {viewingImaging.dateOrdered}</p>
                      </div>
                      <button type="button" onClick={() => setViewingImaging(null)} className="text-slate-400 hover:text-slate-700 p-1" title="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="flex-1 overflow-y-auto p-5 text-[11px] leading-relaxed font-mono text-slate-800 whitespace-pre-wrap bg-slate-50">
                      {imagingReportText(viewingImaging)}
                    </pre>
                    <div className="border-t px-5 py-3 flex justify-end gap-2">
                      <button type="button" onClick={() => printDocument(`${viewingImaging.modality} ${viewingImaging.bodyPart}`, imagingReportText(viewingImaging))} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[11px]"><Printer className="w-3.5 h-3.5" /> Print</button>
                      <button type="button" onClick={() => setViewingImaging(null)} className="px-3 py-1.5 bg-[#00334f] text-white rounded font-bold text-[11px]">Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 11: REFERRALS */}
          {activeTab === "referrals" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Specialist eReferrals</h3>
                <p className="text-slate-500 text-[11px]">Refer a specialist. The Suwasiri patient is notified in the app.</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Cardiology review", specialist: "Dr. Lalith Fernando (Cardiologist)", specialty: "Cardiology", email: "lalith.fernando@asiri.lk", summary: "Thank you for reviewing this patient regarding cardiovascular risk stratification and echocardiogram evaluation." },
                  { label: "Endocrinology / diabetes", specialist: "Dr. Chandima De Silva (Endocrinologist)", specialty: "Endocrinology", email: "chandima.desilva@lankahospitals.com", summary: "Thank you for reviewing glycaemic control, complications screening, and further endocrine work-up." },
                  { label: "Orthopaedics", specialist: "Dr. Nalin Wickramasinghe (Orthopaedic Surgeon)", specialty: "Orthopaedics", email: "nalin.w@nhsl.lk", summary: "Thank you for assessing this musculoskeletal presentation and advising on imaging or operative options." },
                  { label: "Dermatology", specialist: "Dr. Anoja Senanayake (Dermatologist)", specialty: "Dermatology", email: "anoja.s@primecare.lk", summary: "Thank you for reviewing this skin lesion / chronic dermatosis and advising on biopsy or therapy." },
                  { label: "Mental health", specialist: "Dr. Ruwan Perera (Psychiatrist)", specialty: "Psychiatry", email: "ruwan.perera@ncmh.lk", summary: "Thank you for psychiatric assessment and shared-care advice for this patient." },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setRefSpecialist(tpl.specialist);
                      setRefSpecialty(tpl.specialty);
                      setRefClinicalSummary(tpl.summary);
                      setRefEmail(tpl.email);
                    }}
                    className="text-[10px] bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold px-2 py-1 rounded-lg border border-orange-200"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreateReferral} className="p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specialist & specialty:</label>
                    <select
                      value={refSpecialist}
                      onChange={e => {
                        setRefSpecialist(e.target.value);
                        if (e.target.value.includes("Cardiologist")) { setRefSpecialty("Cardiology"); setRefEmail("lalith.fernando@asiri.lk"); }
                        else if (e.target.value.includes("Endocrinologist")) { setRefSpecialty("Endocrinology"); setRefEmail("chandima.desilva@lankahospitals.com"); }
                        else if (e.target.value.includes("Dermatologist")) { setRefSpecialty("Dermatology"); setRefEmail("anoja.s@primecare.lk"); }
                        else if (e.target.value.includes("Psychiatrist")) { setRefSpecialty("Psychiatry"); setRefEmail("ruwan.perera@ncmh.lk"); }
                        else { setRefSpecialty("Orthopaedics"); setRefEmail("nalin.w@nhsl.lk"); }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Dr. Lalith Fernando (Cardiologist)">Dr. Lalith Fernando (Cardiologist) — Asiri Surgical</option>
                      <option value="Dr. Chandima De Silva (Endocrinologist)">Dr. Chandima De Silva (Endocrinologist) — Lanka Hospital</option>
                      <option value="Dr. Nalin Wickramasinghe (Orthopaedic Surgeon)">Dr. Nalin Wickramasinghe (Orthopaedic Surgeon) — National Hospital</option>
                      <option value="Dr. Anoja Senanayake (Dermatologist)">Dr. Anoja Senanayake (Dermatologist) — PrimeCare</option>
                      <option value="Dr. Ruwan Perera (Psychiatrist)">Dr. Ruwan Perera (Psychiatrist) — NCMH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specialist email:</label>
                    <input type="email" value={refEmail} onChange={(e) => setRefEmail(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical reason & objectives:</label>
                  <textarea rows={3} value={refClinicalSummary} onChange={e => setRefClinicalSummary(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium" />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const body = `REFERRAL LETTER\n\nTo: ${refSpecialist} (${refSpecialty})\nEmail: ${refEmail}\nFrom: ${issuedDoctor}\nClinic: ${issuedClinic}\nPatient: ${patient.name}, ${patient.age} yrs, ${patient.gender}\nAllergies: ${patient.allergies || "NKDA"}\n\nDear Colleague,\n\n${refClinicalSummary}\n\nYours sincerely,\n${issuedDoctor}`;
                      printDocument(`Referral — ${refSpecialist}`, body);
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg inline-flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print letter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const body = `Dear ${refSpecialist},\n\nPlease find this GP referral for ${patient.name} (${patient.age} yrs).\n\n${refClinicalSummary}\n\n${issuedDoctor}\n${issuedClinic}`;
                      sendByEmail(refEmail, `eReferral: ${patient.name} — ${refSpecialty}`, body);
                    }}
                    className="px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold rounded-lg inline-flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email specialist
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#00334f] text-white font-bold rounded-lg">
                    Save eReferral
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(patient.referralsList || []).map((ref) => {
                  const body = `REFERRAL LETTER\nTo: ${ref.specialistName} (${ref.specialty})\nPatient: ${patient.name}\nDate: ${ref.dateCreated}\n\n${ref.clinicalSummary}\n\n${ref.referringDoctor || issuedDoctor}\n${issuedClinic}`;
                  return (
                    <div key={ref.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{ref.specialistName} ({ref.specialty})</p>
                        <p className="text-slate-500 text-[11px]">{ref.clinicalSummary} • {ref.dateCreated}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => printDocument(`Referral ${ref.specialistName}`, body)} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded font-bold text-[10px]"><Printer className="w-3 h-3" /> Print</button>
                        <button type="button" onClick={() => sendByEmail(refEmail, `eReferral: ${patient.name}`, body)} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-900 rounded font-bold text-[10px]"><Mail className="w-3 h-3" /> Email</button>
                      </div>
                    </div>
                  );
                })}
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
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Medical Certificate</h3>
                  <p className="text-slate-500 text-[11px]">Issue a certificate for {patient.name}. It is saved here, can be viewed and printed, and syncs to Suwasiri Vault → Medical certificates.</p>
                </div>
                {examAddDocMode !== "chooser" && (
                <button
                  type="button"
                  onClick={() => setExamAddDocMode("chooser")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00334f] text-white rounded-lg font-bold text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Attach supporting file
                </button>
                )}
              </div>

              <form
                className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!mcDiagnosis.trim() || mcSaving) return;
                  setMcSaving(true);
                  const newMC: MedicalCertificateRecord = {
                    id: `MC-${patient.id}-${Date.now()}`,
                    date: new Date().toISOString().split("T")[0],
                    diagnosis: mcDiagnosis.trim(),
                    startDate: mcStartDate,
                    endDate: mcEndDate,
                    numDays: mcNumDays,
                    status: mcStatus,
                    doctorName: issuedDoctor,
                    doctorRegNo: "SLMC-48291",
                    additionalRemarks: mcRemarks,
                    emailStatus: "NOT_SENT",
                    recipientEmail: patient.email || "",
                    suwasiriSyncStatus: "SYNCING",
                    lankalabSyncStatus: "NOT_SYNCED",
                  };
                  try {
                    const synced = await issueMedicalCertificateToSuwasiri({
                      patientId: patient.id,
                      patientName: patient.name,
                      certificate: newMC,
                      clinicName: issuedClinic,
                    });
                    newMC.suwasiriSyncStatus = synced ? "SYNCED" : "FAILED";
                    if (synced) newMC.suwasiriSyncTime = new Date().toISOString();
                    onUpdatePatient({
                      ...patient,
                      medicalCertificatesList: [newMC, ...(patient.medicalCertificatesList || [])],
                    });
                    showToast(
                      synced
                        ? "Medical certificate issued to Suwasiri Vault → Medical certificates"
                        : "Saved on the file. Could not reach Suwasiri Vault."
                    );
                    setMcDiagnosis("");
                    setMcRemarks("");
                  } catch {
                    showToast("Could not issue the medical certificate.");
                  } finally {
                    setMcSaving(false);
                  }
                }}
              >
                <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wide">Issue medical certificate</h4>
                <p className="text-[11px] text-slate-600">The diagnosis / leave reason is printed on the certificate and sent to {patient.name}’s Suwasiri Vault.</p>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diagnosis / leave reason category</label>
                  <select
                    required
                    value={MC_LEAVE_REASONS.includes(mcDiagnosis) ? mcDiagnosis : (mcDiagnosis ? "Other (see additional remarks)" : "")}
                    onChange={(e) => setMcDiagnosis(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="">Select a category…</option>
                    {MC_LEAVE_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                <input
                  required
                  value={mcDiagnosis}
                  onChange={(e) => setMcDiagnosis(e.target.value)}
                  placeholder="Diagnosis / leave reason shown on the certificate"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="date" value={mcStartDate} onChange={(e) => setMcStartDate(e.target.value)} className="p-2 bg-white border rounded-lg" />
                  <input type="date" value={mcEndDate} onChange={(e) => setMcEndDate(e.target.value)} className="p-2 bg-white border rounded-lg" />
                  <select value={mcStatus} onChange={(e) => setMcStatus(e.target.value as MedicalCertificateRecord["status"])} className="p-2 bg-white border rounded-lg font-semibold">
                    <option value="UNFIT_FOR_WORK">Unfit for work</option>
                    <option value="FIT_FOR_LIGHT_DUTY">Fit for light duty</option>
                    <option value="FIT_FOR_DUTY">Fit for duty</option>
                  </select>
                </div>
                <p className="text-[11px] font-bold text-[#00334f]">{mcNumDays} day(s)</p>
                <textarea value={mcRemarks} onChange={(e) => setMcRemarks(e.target.value)} rows={2} placeholder="Additional instructions (optional)" className="w-full p-2 bg-white border rounded-lg" />
                <div className="flex justify-end">
                  <button type="submit" disabled={mcSaving} className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg disabled:opacity-60">
                    {mcSaving ? "Issuing…" : "Issue certificate"}
                  </button>
                </div>
              </form>

              {examAddDocMode && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
                  <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                    <h4 className="font-bold text-base text-[#00334f]">Add document.</h4>
                    <button
                      type="button"
                      onClick={() => setExamAddDocMode(null)}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="border-t border-slate-200 px-5 py-4 space-y-3">
                    <p className="text-[11px] text-slate-500">
                      File to {patient.name}’s Documents history.
                    </p>
                    <input
                      ref={examScanInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) fileClinicalDocFromFile(file, true);
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={examFileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) fileClinicalDocFromFile(file, false);
                        e.target.value = "";
                      }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => examScanInputRef.current?.click()}
                        className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-left"
                      >
                        <Camera className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" />
                        <span>
                          <span className="block font-bold text-amber-950 text-sm">Scan</span>
                          <span className="text-[11px] text-amber-800/90">
                            Acquire from a connected scanner, webcam, or phone camera.
                          </span>
                        </span>
                      </button>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => examFileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") examFileInputRef.current?.click();
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setExamDropActive(true);
                        }}
                        onDragLeave={() => setExamDropActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setExamDropActive(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) fileClinicalDocFromFile(file, false);
                        }}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-left cursor-pointer ${
                          examDropActive
                            ? "border-[#00334f] bg-sky-100"
                            : "border-sky-200 bg-sky-50"
                        }`}
                      >
                        <Upload className="w-6 h-6 text-[#00334f] shrink-0 mt-0.5" />
                        <span>
                          <span className="block font-bold text-[#00334f] text-sm">Drag and drop / Browse</span>
                          <span className="text-[11px] text-slate-500">
                            Drop a PDF or image here, or browse your computer.
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Send-to email</label>
                  <input type="email" defaultValue={patient.email} onChange={(e) => setDocEmail(e.target.value)} placeholder={patient.email || "patient@email.com"} className="w-full p-2 border rounded-lg bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Send-to phone</label>
                  <input type="tel" defaultValue={patient.phone} onChange={(e) => setDocPhone(e.target.value)} placeholder={patient.phone || "+94 …"} className="w-full p-2 border rounded-lg bg-white" />
                </div>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {[
                  ...(patient.clinicalDocuments || []).map((d) => ({
                    id: d.id,
                    title: d.title,
                    meta: `${d.category} • ${d.uploadedDate} • ${d.fileType.replace(/_/g, " ")}`,
                    body: `${d.title}\nCategory: ${d.category}\nUploaded: ${d.uploadedDate}\nBy: ${d.uploadedBy}\nPatient: ${patient.name}\n${d.summaryNotes || d.ocrExtractedText || ""}`,
                  })),
                  ...(patient.myHealthRecordDocs || []).map((d) => ({
                    id: d.id,
                    title: d.title,
                    meta: `${d.docType} • ${d.facility || issuedClinic}`,
                    body: `${d.title}\nType: ${d.docType}\nAuthor: ${d.author}\nFacility: ${d.facility}\nPatient: ${patient.name}`,
                  })),
                  ...(patient.medicalCertificatesList || []).map((c) => ({
                    id: c.id,
                    title: `Medical certificate — ${c.diagnosis}`,
                    meta: `${c.date} • ${c.status} • ${c.numDays} day(s)`,
                    body: `MEDICAL CERTIFICATE\nPatient: ${patient.name}\nDiagnosis: ${c.diagnosis}\nLeave: ${c.startDate} to ${c.endDate} (${c.numDays} days)\nStatus: ${c.status}\nDoctor: ${c.doctorName} (${c.doctorRegNo})\n${c.additionalRemarks || ""}`,
                  })),
                ].map((doc) => (
                  <div key={doc.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-red-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{doc.title}</p>
                        <p className="text-slate-400 text-[10px]">{doc.meta}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button type="button" onClick={() => {
                        const cert = (patient.medicalCertificatesList || []).find((c) => c.id === doc.id);
                        if (cert) setViewingCertificate(cert);
                        else printDocument(doc.title, doc.body);
                      }} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[10px]"><Eye className="w-3 h-3" /> View</button>
                      <button type="button" onClick={() => printDocument(doc.title, doc.body)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[10px]"><Printer className="w-3 h-3" /> Print</button>
                      <button type="button" onClick={() => sendByEmail(docEmail || patient.email, doc.title, doc.body)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 text-sky-900 rounded font-bold text-[10px]"><Mail className="w-3 h-3" /> Email</button>
                      <button type="button" onClick={() => sendByPhone(docPhone || patient.phone, `${doc.title} is ready at ${issuedClinic}`)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-900 rounded font-bold text-[10px]"><Phone className="w-3 h-3" /> Phone</button>
                    </div>
                  </div>
                ))}
                {(patient.clinicalDocuments || []).length === 0 &&
                  (patient.myHealthRecordDocs || []).length === 0 &&
                  (patient.medicalCertificatesList || []).length === 0 && (
                    <div className="p-5 text-center text-slate-500 italic">No medical certificates on this file yet.</div>
                  )}
              </div>
              {viewingCertificate && (
                <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full border shadow-xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-start gap-3 border-b px-5 py-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Medical certificate</p>
                        <h3 className="font-serif font-bold text-base text-[#00334f]">{patient.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{viewingCertificate.diagnosis} · {viewingCertificate.date}</p>
                      </div>
                      <button type="button" onClick={() => setViewingCertificate(null)} className="text-slate-400 hover:text-slate-700 p-1" title="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="flex-1 overflow-y-auto p-5 text-[11px] leading-relaxed font-mono text-slate-800 whitespace-pre-wrap bg-slate-50">
{`MEDICAL CERTIFICATE
Patient: ${patient.name}
Diagnosis / leave reason: ${viewingCertificate.diagnosis}
Certified status: ${viewingCertificate.status.replace(/_/g, " ")}
Leave: ${viewingCertificate.startDate} to ${viewingCertificate.endDate} (${viewingCertificate.numDays} days)
Doctor: ${viewingCertificate.doctorName} (${viewingCertificate.doctorRegNo})
Clinic: ${issuedClinic}
${viewingCertificate.additionalRemarks || ""}`}
                    </pre>
                    <div className="border-t px-5 py-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => printDocument(`Medical certificate — ${viewingCertificate.diagnosis}`, `MEDICAL CERTIFICATE\nPatient: ${patient.name}\nDiagnosis: ${viewingCertificate.diagnosis}\nLeave: ${viewingCertificate.startDate} to ${viewingCertificate.endDate} (${viewingCertificate.numDays} days)\nStatus: ${viewingCertificate.status}\nDoctor: ${viewingCertificate.doctorName} (${viewingCertificate.doctorRegNo})\n${viewingCertificate.additionalRemarks || ""}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[11px]"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button type="button" onClick={() => setViewingCertificate(null)} className="px-3 py-1.5 bg-[#00334f] text-white rounded font-bold text-[11px]">Close</button>
                    </div>
                  </div>
                </div>
              )}
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
                    Appointments &amp; clinic calendar
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    {bookingDoctor && onBookAppointment && !hideActiveConsultDetails
                      ? `Book a follow-up with ${bookingDoctor.name} only. The right-hand times are this doctor’s available and booked slots — other clinic doctors are not shown. Confirm writes to ${patient.name}’s Suwasiri Home (blue in-person / purple video) and the reception / clinic calendars.`
                      : hideActiveConsultDetails
                        ? "Appointment history for this file."
                        : "Sign in as a clinic doctor to book a follow-up on your own available times."}
                  </p>
                </div>
              </div>

              {(() => {
                const upcoming = [...patientAppointments]
                  .filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED")
                  .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
                const next = upcoming[0];
                if (!next) return null;
                return (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-800">Next appointment</p>
                    <p className="text-sm font-bold text-[#00334f]">{next.date} at {next.time}</p>
                    <p className="text-[11px] text-slate-600">{next.reason || next.type} · {next.doctorName || bookingDoctor?.name || issuedDoctor}</p>
                  </div>
                );
              })()}

              {onBookAppointment && bookingDoctor && !hideActiveConsultDetails && (
                <ReceptionBookingScheduler
                  embedded
                  lockDoctor
                  lockPatient
                  patients={[patient]}
                  doctors={[bookingDoctor]}
                  appointments={appointments}
                  initialPatientId={patient.id}
                  includeToday
                  onClose={() => undefined}
                  onConfirm={async (payload) => {
                    await onBookAppointment({
                      patientId: payload.patientId,
                      date: payload.date,
                      time: payload.time,
                      reason: payload.reason,
                      consultMode: payload.consultMode,
                      doctorName: payload.doctorName,
                      doctorStaffId: payload.doctorStaffId,
                    });
                  }}
                />
              )}

              <div className="space-y-4">
                {patientAppointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic">No appointment history found for this patient.</div>
                ) : (
                  patientAppointments.map(a => (
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
                            {a.paymentMethod ? ` • Payment: ${a.paymentMethod}` : ""}
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
            {embedded ? "Return to Exam Dashboard" : "Close Record"}
          </button>
        </div>
      </div>
  );

  return (
    <>
      {embedded ? frame : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3">
          {frame}
        </div>
      )}
      {showCalculatorModal && (
        <ClinicalCalculatorsModal
          patient={patient}
          calculatedBy={issuedDoctor}
          onClose={() => setShowCalculatorModal(false)}
          onSaveToConsultation={(text) => {
            setDoctorNote(prev => `${prev}\n${text}`.trim());
            showToast("Calculated score inserted into doctor notes.");
          }}
          onPersistPatient={(updated) => {
            onUpdatePatient({
              ...updated,
              medicalCenter: updated.medicalCenter || issuedClinic,
              history: (updated.history || []).map((h, i) =>
                i === 0 ? { ...h, clinicName: h.clinicName || issuedClinic, doctor: h.doctor || issuedDoctor } : h
              ),
            });
            showToast("Calculator details saved to medical history.");
          }}
        />
      )}
    </>
  );
}

import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Camera,
  FolderOpen,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  FileCheck,
  ShieldCheck,
  Tag,
  UserCheck,
  Sparkles,
  History,
  FileSpreadsheet,
  FileImage,
  Layers,
  Copy,
  Printer,
  Stethoscope,
  Smartphone,
  Check,
  Share2,
  ExternalLink,
  Plus
} from "lucide-react";
import { ClinicalDocument, DocumentCategory, DocumentTemplate, Patient } from "../types";

interface Props {
  patients: Patient[];
  documents?: ClinicalDocument[];
  onUploadDocument?: (doc: ClinicalDocument) => void;
  onAllocateDocument?: (docId: string, patientId: string, doctorName: string) => void;
  onUpdateStatus?: (docId: string, status: ClinicalDocument["status"]) => void;
  onDigitalSign?: (docId: string, doctorName: string) => void;
  onOpenPatientEverything?: (patient: Patient) => void;
  onStartConsultation?: (patient: Patient) => void;
}

const SAMPLE_TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl-1",
    title: "Specialist Referral Letter",
    category: "Specialist Letters",
    description: "Standard Australian GP specialist referral with clinical history, medications, and request.",
    placeholders: ["[Patient Name]", "[DOB]", "[Medicare No]", "[Specialist Name]", "[Clinical Reason]", "[Current Medications]"],
    contentTemplate: `RE: CLINICAL REFERRAL & OPINION REQUEST
Date: [Date]
To: [Specialist Name], Specialist Clinic

Dear Colleague,

Thank you for seeing [Patient Name] (DOB: [DOB], Medicare: [Medicare No]), whom I am referring for specialist assessment and ongoing management regarding [Clinical Reason].

CLINICAL BACKGROUND & CURRENT FINDINGS:
The patient presents with progressive symptoms over recent months. Recent examination reveals stable vitals with targeted pathology attached.

CURRENT MEDICATIONS & ALLERGIES:
Medications: [Current Medications]
Allergies: NKDA / As recorded

I would appreciate your specialist evaluation, management plan, and correspondence regarding further intervention.

Kind regards,
Dr. Priyantha Silva (FRACGP, MBBS)
Provider No: 4920192A • Colombo Central Clinic`
  },
  {
    id: "tpl-2",
    title: "Medical Certificate (Unfit for Work/Study)",
    category: "Medical Certificates",
    description: "Legally compliant medical certificate for employee illness or university special consideration.",
    placeholders: ["[Patient Name]", "[Start Date]", "[End Date]", "[Status]", "[Doctor Name]"],
    contentTemplate: `CONFIDENTIAL MEDICAL CERTIFICATE

This is to certify that I have examined:
Patient Name: [Patient Name]
Date of Consultation: [Date]

In my professional clinical opinion, this patient is suffering from a medical condition and will be [Status] from [Start Date] up to and including [End Date].

They are expected to be fit to resume normal duties on the following working day.

Medical Practitioner: [Doctor Name]
AHPRA / SLMC Reg: MED-0099421 • Provider: 4920192A`
  },
  {
    id: "tpl-3",
    title: "Hospital Discharge Clinical Summary",
    category: "Discharge Summaries",
    description: "Inpatient episode summary, discharge diagnoses, medication changes, and GP follow-up plan.",
    placeholders: ["[Patient Name]", "[Admission Date]", "[Discharge Date]", "[Discharge Diagnosis]", "[Plan]"],
    contentTemplate: `EPISODE DISCHARGE SUMMARY

Patient: [Patient Name]
Admission: [Admission Date] • Discharge: [Discharge Date]
Principal Discharge Diagnosis: [Discharge Diagnosis]

INPATIENT COURSE & PROCEDURES:
Patient was admitted following acute presentation. Managed with intravenous therapy and stabilization. Symptoms resolved prior to discharge.

MEDICATION CHANGES AT DISCHARGE:
- Ongoing regular therapy continued
- New discharge medications initiated with script provided

FOLLOW-UP PLAN FOR GP:
- Review in general practice within 7 days
- Repeat renal function (U&Es) in 2 weeks
- Contact clinic if recurrence of symptoms occurs.`
  },
  {
    id: "tpl-4",
    title: "Fitness to Drive Medical Assessment",
    category: "Clinical Correspondence",
    description: "Commercial and private driver licensing medical evaluation form.",
    placeholders: ["[Patient Name]", "[Visual Acuity]", "[Cardiovascular Status]", "[Neurological Status]"],
    contentTemplate: `AUSTROADS COMMERCIAL / PRIVATE FITNESS TO DRIVE REPORT

Patient: [Patient Name]
Assessment Date: [Date]

CLINICAL CRITERIA EVALUATION:
1. Visual Acuity (Snellen with correction): [Visual Acuity] (Pass)
2. Cardiovascular Assessment: [Cardiovascular Status] (Stable, No syncope)
3. Neurological / Epilepsy Assessment: [Neurological Status] (No seizures)
4. Sleep Apnoea / Cognitive Assessment: Satisfactory

RECOMMENDATION:
[X] Unconditionally Fit for Private Vehicle Driver Licensing
[ ] Fit subject to annual medical review and corrective lenses`
  }
];

const INITIAL_DOCUMENTS: ClinicalDocument[] = [
  {
    id: "doc-101",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    title: "Lanka Hospitals Pathology Report - Fasting Lipids & HbA1c",
    category: "Pathology Reports",
    fileType: "PDF",
    fileSizeKb: 420,
    uploadedBy: "E-Health Link Inbound",
    uploadedDate: "2026-08-14 09:45",
    allocatedDoctor: "Dr. Priyantha Silva",
    status: "PENDING_DOCTOR_REVIEW",
    versionHistory: [
      { versionNumber: 1, timestamp: "2026-08-14 09:45", author: "HealthLink EDI", notes: "Inbound HL7 ePathology ingest", fileSizeKb: 420 }
    ],
    tags: ["Pathology", "HbA1c", "Lipids", "Urgent Review"],
    summaryNotes: "HbA1c: 6.8% (Good control). Fasting Cholesterol: 5.8 mmol/L.",
    ocrExtractedText: "LANKA HOSPITALS PATHOLOGY\nPatient: Fatima Zahra (38y/F)\nHbA1c: 6.8% (Reference: 4.0 - 6.0%)\nTotal Cholesterol: 5.8 mmol/L\nHDL: 1.2 mmol/L | LDL: 3.8 mmol/L\nDoctor Notes: Statin review recommended.",
    signatureStatus: "UNSIGNED"
  },
  {
    id: "doc-102",
    patientId: "1028-LK",
    patientName: "Sunil Jayawardena",
    title: "Cardiology Specialist Consultation Letter - Dr. K. Perera",
    category: "Specialist Letters",
    fileType: "PDF",
    fileSizeKb: 680,
    uploadedBy: "Reception Desk (Scanned)",
    uploadedDate: "2026-08-12 14:20",
    allocatedDoctor: "Dr. Priyantha Silva",
    status: "REVIEWED_NORMAL",
    versionHistory: [
      { versionNumber: 1, timestamp: "2026-08-12 14:20", author: "Sarah Perera (Reception)", notes: "Scanned paper correspondence", fileSizeKb: 680 }
    ],
    tags: ["Cardiology", "Echo", "Angiogram", "Follow-up"],
    summaryNotes: "Echocardiogram: LVEF 58%, normal LV systolic function. Continue current beta-blocker.",
    signatureStatus: "SIGNED_DIGITALLY",
    signedBy: "Dr. Priyantha Silva",
    signedDate: "2026-08-13 10:15"
  },
  {
    id: "doc-103",
    patientId: "4491-LK",
    patientName: "Kamala Wickramasinghe",
    title: "Chest X-Ray & Ultrasound Abdomen Imaging Report",
    category: "Imaging Reports",
    fileType: "IMAGE_JPEG",
    fileSizeKb: 1250,
    uploadedBy: "Nawaloka Imaging PACs",
    uploadedDate: "2026-08-10 11:30",
    allocatedDoctor: "Dr. Anoja Senanayake",
    status: "REVIEWED_NORMAL",
    versionHistory: [
      { versionNumber: 1, timestamp: "2026-08-10 11:30", author: "DICOM PACs Gateway", notes: "Radiologist digital release", fileSizeKb: 1250 }
    ],
    tags: ["X-Ray", "Ultrasound", "Normal Lungs"],
    summaryNotes: "Chest clear. No focal consolidation or effusion. Abdomen: mild fatty liver, otherwise normal.",
    signatureStatus: "SIGNED_DIGITALLY",
    signedBy: "Dr. Anoja Senanayake",
    signedDate: "2026-08-10 16:40"
  },
  {
    id: "doc-104",
    patientId: "9942-LK",
    patientName: "Fatima Zahra",
    title: "Medical Certificate - Unfit for Duty (Upper Resp Infection)",
    category: "Medical Certificates",
    fileType: "PDF",
    fileSizeKb: 180,
    uploadedBy: "Dr. Priyantha Silva",
    uploadedDate: "2026-08-01 10:00",
    allocatedDoctor: "Dr. Priyantha Silva",
    status: "REVIEWED_NORMAL",
    versionHistory: [
      { versionNumber: 1, timestamp: "2026-08-01 10:00", author: "Dr. Priyantha Silva", notes: "Generated & signed via EMR", fileSizeKb: 180 }
    ],
    tags: ["Certificate", "Sick Leave", "Signed"],
    signatureStatus: "SIGNED_DIGITALLY",
    signedBy: "Dr. Priyantha Silva",
    signedDate: "2026-08-01 10:05"
  },
  {
    id: "doc-105",
    patientId: "UNALLOCATED",
    patientName: "Unassigned Inbound Document",
    title: "National Cervical Screening Registry (NCSR) Inbound Result",
    category: "Clinical Correspondence",
    fileType: "PDF",
    fileSizeKb: 310,
    uploadedBy: "NCSR Direct Ingest",
    uploadedDate: "2026-08-15 08:30",
    allocatedDoctor: "Dr. Priyantha Silva",
    status: "ACTION_REQUIRED",
    versionHistory: [
      { versionNumber: 1, timestamp: "2026-08-15 08:30", author: "NCSR Server", notes: "Inbound screening match", fileSizeKb: 310 }
    ],
    tags: ["NCSR", "Unallocated", "Urgent Allocation"],
    summaryNotes: "HPV 16/18 Not Detected. Liquid cytology negative. 5-year routine recall.",
    ocrExtractedText: "NCSR SCREENING REPORT\nName: Fatima Zahra (DOB: 12/05/1988)\nHPV DNA: NOT DETECTED\nRecommendation: Return to 5-yearly routine screening."
  }
];

export default function DocumentManagementHub({
  patients,
  documents: initialDocs = INITIAL_DOCUMENTS,
  onUploadDocument,
  onAllocateDocument,
  onUpdateStatus,
  onDigitalSign,
  onOpenPatientEverything,
  onStartConsultation
}: Props) {
  const [documents, setDocuments] = useState<ClinicalDocument[]>(initialDocs);
  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(documents[0] || null);
  const [viewLayout, setViewLayout] = useState<"PATIENT_GROUPED" | "ALL_DOCS">("PATIENT_GROUPED");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [patientFilter, setPatientFilter] = useState<string>("ALL");

  // Upload & Scanner Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [viewingDocModal, setViewingDocModal] = useState<ClinicalDocument | null>(null);
  const [suwasiriSyncedDocs, setSuwasiriSyncedDocs] = useState<Record<string, string>>({});
  const [syncingDocId, setSyncingDocId] = useState<string | null>(null);

  // New Upload Form State
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("Clinical Correspondence");
  const [newDocPatientId, setNewDocPatientId] = useState(patients[0]?.id || "");
  const [newDocDoctor, setNewDocDoctor] = useState("Dr. Priyantha Silva");
  const [newDocNotes, setNewDocNotes] = useState("");
  const [newDocTags, setNewDocTags] = useState("");
  const [newDocIsConfidential, setNewDocIsConfidential] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(350);

  // Scanner Simulation State
  const [scannerStatus, setScannerStatus] = useState<"READY" | "SCANNING" | "CROPPING" | "COMPLETED">("READY");
  const [scanContrast, setScanContrast] = useState(100);
  const [scanDpi, setScanDpi] = useState("300 DPI");

  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate>(SAMPLE_TEMPLATES[0]);
  const [templateCustomizedContent, setTemplateCustomizedContent] = useState(SAMPLE_TEMPLATES[0].contentTemplate);
  const [templatePatientId, setTemplatePatientId] = useState(patients[0]?.id || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.summaryNotes && doc.summaryNotes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || doc.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
    const matchesPatient = patientFilter === "ALL" || doc.patientId === patientFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPatient;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setUploadedFileSize(Math.round(file.size / 1024));
      if (!newDocTitle) {
        setNewDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedPatient = patients.find((p) => p.id === newDocPatientId);
    const newDoc: ClinicalDocument = {
      id: "doc-" + Date.now(),
      patientId: newDocPatientId,
      patientName: assignedPatient ? assignedPatient.name : "Unassigned Patient",
      title: newDocTitle || "Uploaded Clinical Document",
      category: newDocCategory,
      fileType: uploadedFileName.endsWith(".png") || uploadedFileName.endsWith(".jpg") ? "IMAGE_JPEG" : "PDF",
      fileSizeKb: uploadedFileSize || 450,
      uploadedBy: "Practitioner Portal",
      uploadedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      allocatedDoctor: newDocDoctor,
      status: "PENDING_DOCTOR_REVIEW",
      versionHistory: [
        {
          versionNumber: 1,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: newDocDoctor,
          notes: "Initial upload & indexing",
          fileSizeKb: uploadedFileSize || 450
        }
      ],
      tags: newDocTags ? newDocTags.split(",").map((t) => t.trim()) : ["Uploaded", newDocCategory],
      summaryNotes: newDocNotes,
      isConfidential: newDocIsConfidential,
      signatureStatus: "UNSIGNED"
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setShowUploadModal(false);
    // Reset form
    setNewDocTitle("");
    setNewDocNotes("");
    setNewDocTags("");
    setUploadedFileName("");
    if (onUploadDocument) onUploadDocument(newDoc);
    alert(`Document "${newDoc.title}" successfully uploaded and linked to ${newDoc.patientName}!`);
  };

  const handleSimulateScan = () => {
    setScannerStatus("SCANNING");
    setTimeout(() => {
      setScannerStatus("CROPPING");
      setTimeout(() => {
        setScannerStatus("COMPLETED");
      }, 900);
    }, 1200);
  };

  const handleSaveScannedDocument = () => {
    const assignedPatient = patients.find((p) => p.id === newDocPatientId) || patients[0];
    const newDoc: ClinicalDocument = {
      id: "scan-" + Date.now(),
      patientId: assignedPatient.id,
      patientName: assignedPatient.name,
      title: `Scanned Physical Record - ${new Date().toLocaleDateString()}`,
      category: "Specialist Letters",
      fileType: "SCANNED_DOC",
      fileSizeKb: 890,
      uploadedBy: "Flatbed TWAIN Scanner",
      uploadedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      allocatedDoctor: "Dr. Priyantha Silva",
      status: "PENDING_DOCTOR_REVIEW",
      versionHistory: [
        {
          versionNumber: 1,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: "Optical Document Scanner",
          notes: `Scan resolution: ${scanDpi}, Auto-contrast applied`,
          fileSizeKb: 890
        }
      ],
      tags: ["Scanned", "TWAIN", "Optical"],
      summaryNotes: "Physical paper correspondence scanned into digital patient chart.",
      ocrExtractedText: "SCANNED OPTICAL CORRESPONDENCE\nClinical notes retrieved via flatbed scanner.\nApproved for medical chart inclusion.",
      signatureStatus: "UNSIGNED"
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setShowScannerModal(false);
    setScannerStatus("READY");
    alert(`Scanned document successfully digitized and allocated to ${newDoc.patientName}!`);
  };

  const handleApplyTemplate = (tpl: DocumentTemplate) => {
    setSelectedTemplate(tpl);
    const pat = patients.find((p) => p.id === templatePatientId) || patients[0];
    let populated = tpl.contentTemplate
      .replace(/\[Patient Name\]/g, pat.name)
      .replace(/\[DOB\]/g, pat.dateOfBirth || "12/05/1988")
      .replace(/\[Medicare No\]/g, pat.medicareNumber || "2948 10294 1")
      .replace(/\[Date\]/g, new Date().toLocaleDateString())
      .replace(/\[Start Date\]/g, new Date().toLocaleDateString())
      .replace(/\[End Date\]/g, new Date(Date.now() + 86400000 * 3).toLocaleDateString())
      .replace(/\[Status\]/g, "UNFIT FOR REGULAR DUTIES")
      .replace(/\[Doctor Name\]/g, "Dr. Priyantha Silva (FRACGP)")
      .replace(/\[Specialist Name\]/g, "Dr. K. Perera (Consultant Cardiologist)")
      .replace(/\[Clinical Reason\]/g, "Exertional dyspnoea and worsening blood pressure")
      .replace(/\[Current Medications\]/g, pat.activeMedications ? pat.activeMedications.join(", ") : "Metformin 500mg, Telmisartan 40mg");
    setTemplateCustomizedContent(populated);
  };

  const handleSaveTemplateAsDocument = () => {
    const pat = patients.find((p) => p.id === templatePatientId) || patients[0];
    const newDoc: ClinicalDocument = {
      id: "doc-tpl-" + Date.now(),
      patientId: pat.id,
      patientName: pat.name,
      title: `${selectedTemplate.title} - ${new Date().toLocaleDateString()}`,
      category: selectedTemplate.category,
      fileType: "E_CORRESPONDENCE",
      fileSizeKb: 140,
      uploadedBy: "Template Generator",
      uploadedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      allocatedDoctor: "Dr. Priyantha Silva",
      status: "REVIEWED_NORMAL",
      versionHistory: [
        {
          versionNumber: 1,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: "Dr. Priyantha Silva",
          notes: `Created from template: ${selectedTemplate.title}`,
          fileSizeKb: 140
        }
      ],
      tags: ["Template", selectedTemplate.category, "Generated"],
      summaryNotes: `Generated template document for ${pat.name}`,
      ocrExtractedText: templateCustomizedContent,
      signatureStatus: "SIGNED_DIGITALLY",
      signedBy: "Dr. Priyantha Silva",
      signedDate: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setShowTemplateModal(false);
    alert(`Generated document "${newDoc.title}" and filed to patient record!`);
  };

  const handleSignDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              signatureStatus: "SIGNED_DIGITALLY",
              signedBy: "Dr. Priyantha Silva (FRACGP, MBBS)",
              signedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
              status: "REVIEWED_NORMAL",
              versionHistory: [
                ...d.versionHistory,
                {
                  versionNumber: d.versionHistory.length + 1,
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  author: "Dr. Priyantha Silva",
                  notes: "Digitally signed with AHPRA cryptographic signature token",
                  fileSizeKb: d.fileSizeKb
                }
              ]
            }
          : d
      )
    );
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc((prev) =>
        prev
          ? {
              ...prev,
              signatureStatus: "SIGNED_DIGITALLY",
              signedBy: "Dr. Priyantha Silva (FRACGP, MBBS)",
              signedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
              status: "REVIEWED_NORMAL"
            }
          : null
      );
    }
    if (onDigitalSign) onDigitalSign(docId, "Dr. Priyantha Silva");
    alert("Document successfully signed with Australian Digital Health Agency cryptographic verification token!");
  };

  const handleAllocate = (docId: string, newPatientId: string) => {
    const targetPatient = patients.find((p) => p.id === newPatientId);
    if (!targetPatient) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              patientId: targetPatient.id,
              patientName: targetPatient.name,
              status: "PENDING_DOCTOR_REVIEW",
              versionHistory: [
                ...d.versionHistory,
                {
                  versionNumber: d.versionHistory.length + 1,
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  author: "Dr. Priyantha Silva",
                  notes: `Reallocated from unassigned to ${targetPatient.name}`,
                  fileSizeKb: d.fileSizeKb
                }
              ]
            }
          : d
      )
    );
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc((prev) =>
        prev
          ? {
              ...prev,
              patientId: targetPatient.id,
              patientName: targetPatient.name,
              status: "PENDING_DOCTOR_REVIEW"
            }
          : null
      );
    }
    if (onAllocateDocument) onAllocateDocument(docId, targetPatient.id, "Dr. Priyantha Silva");
    alert(`Document allocated to ${targetPatient.name}'s EMR record!`);
  };

  const handleSyncToSuwasiri = (doc: ClinicalDocument) => {
    setSyncingDocId(doc.id);
    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSuwasiriSyncedDocs((prev) => ({ ...prev, [doc.id]: timestamp }));
      setSyncingDocId(null);
      alert(`Success! Document "${doc.title}" has been securely synced to ${doc.patientName}'s Suwasiri mobile application.`);
    }, 700);
  };

  const handleDownloadPdf = (doc: ClinicalDocument) => {
    const patientObj = patients.find((p) => p.id === doc.patientId);
    const content = `
================================================================================
                    COLOMBO CENTRAL CLINICAL PRACTICE & EMR
                     Official Clinical Document Record / PDF
================================================================================
Document Title   : ${doc.title}
Document Category: ${doc.category}
File Reference   : ${doc.id}
Uploaded Date    : ${doc.uploadedDate}
Allocated Doctor : ${doc.allocatedDoctor}
Clinical Status  : ${doc.status}

PATIENT INFORMATION:
Patient Name     : ${doc.patientName}
Patient ID       : ${doc.patientId}
Date of Birth    : ${patientObj?.dateOfBirth || "N/A"}
Medicare / NIC   : ${patientObj?.medicareNumber || "N/A"}
Allergies Recorded: ${patientObj?.allergies || "None"}

--------------------------------------------------------------------------------
DOCUMENT BODY & EXTRACTED CLINICAL TEXT:
--------------------------------------------------------------------------------
${doc.ocrExtractedText || doc.summaryNotes || "Clinical document recorded in certified electronic health record system."}

--------------------------------------------------------------------------------
AUDIT & DIGITAL SIGNATURE VERIFICATION:
--------------------------------------------------------------------------------
Signature Status : ${doc.signatureStatus === "SIGNED_DIGITALLY" ? "VERIFIED DIGITAL SIGNATURE" : "UNSIGNED PENDING"}
Signed By        : ${doc.signedBy || "Dr. Priyantha Silva (FRACGP, MBBS)"}
Signed Date      : ${doc.signedDate || doc.uploadedDate}
Verification Hash: SHA256:${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}
================================================================================
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}_${doc.patientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="bg-white p-6 border rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#00334f] text-white flex items-center justify-center">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#00334f] tracking-tight">
                  Clinical Document Management & Electronic Ingest
                </h1>
                <p className="text-xs text-slate-500">
                  Import, scan, index, allocate, and digitally sign correspondence, specialist letters, pathology & radiology reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              Document Templates
            </button>

            <button
              onClick={() => setShowScannerModal(true)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Camera className="w-4 h-4 text-amber-600" />
              Scan Documents (TWAIN)
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload PDF / Image
            </button>
          </div>
        </div>

        {/* Filter Toolbar & View Layout Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6 pt-4 border-t border-slate-100 items-center">
          <div className="relative md:col-span-4">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, patient, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#00334f]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-700 bg-white"
            >
              <option value="ALL">All Categories ({documents.length})</option>
              <option value="Pathology Reports">Pathology Reports</option>
              <option value="Imaging Reports">Imaging Reports</option>
              <option value="Specialist Letters">Specialist Letters</option>
              <option value="Clinical Correspondence">Clinical Correspondence</option>
              <option value="Medical Certificates">Medical Certificates</option>
              <option value="Discharge Summaries">Discharge Summaries</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_DOCTOR_REVIEW">Pending Review</option>
              <option value="REVIEWED_NORMAL">Reviewed & Normal</option>
              <option value="ACTION_REQUIRED">Action Required</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-1 bg-slate-100 p-1 rounded-lg border">
            <button
              type="button"
              onClick={() => setViewLayout("PATIENT_GROUPED")}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                viewLayout === "PATIENT_GROUPED"
                  ? "bg-white text-[#00334f] shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Under Patient Names
            </button>
            <button
              type="button"
              onClick={() => setViewLayout("ALL_DOCS")}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                viewLayout === "ALL_DOCS"
                  ? "bg-white text-[#00334f] shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Documents
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DOCUMENTS GROUPED UNDER PATIENT NAMES (Doctor-requested view) */}
      {viewLayout === "PATIENT_GROUPED" ? (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-sky-700 shrink-0" />
              <p className="text-xs text-sky-900">
                <strong>Patient-Centric Document Index:</strong> Documents organized strictly under each patient. Click any <span className="font-bold underline cursor-pointer">Patient's Name</span> to view their complete 16-tab clinical file (everything) or launch the GP Exam Room.
              </p>
            </div>
            <span className="text-xs font-bold text-sky-800 shrink-0">
              {filteredDocs.length} Documents Indexed
            </span>
          </div>

          {/* Registered Patients Master Document Index (Always visible for all registered clinic patients) */}
          {(() => {
            const registeredPatientsList = patients.map((p) => {
              const pDocs = filteredDocs.filter((d) => d.patientId === p.id);
              return { patient: p, docs: pDocs };
            });

            // Also check unassigned docs
            const unassignedDocs = filteredDocs.filter((d) => d.patientId === "UNALLOCATED");

            return (
              <div className="space-y-5">
                {registeredPatientsList.map(({ patient, docs }) => (
                  <div
                    key={patient.id}
                    className="bg-white border rounded-xl shadow-xs overflow-hidden transition-all hover:border-[#00334f]"
                  >
                    {/* Patient Header Row - Clickable patient name, IN EXAM ROOM button, and quick actions */}
                    <div className="p-4 bg-[#fbfdff] border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00334f] text-white font-serif font-bold text-xs flex items-center justify-center shrink-0">
                          {patient.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Patient name triggers Full Record view */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenPatientEverything) {
                                  onOpenPatientEverything(patient);
                                } else if (onStartConsultation) {
                                  onStartConsultation(patient);
                                }
                              }}
                              className="font-serif font-bold text-base text-[#00334f] hover:text-sky-700 hover:underline transition-colors flex items-center gap-1.5 text-left group cursor-pointer"
                              title="Click to view complete 16-Tab Clinical Record (shows everything)"
                            >
                              <span>{patient.name}</span>
                              <span className="text-[11px] font-sans font-normal text-sky-600 group-hover:underline">
                                (Registered Patient)
                              </span>
                            </button>
                            <span className="text-xs text-slate-400 font-mono">[{patient.id}]</span>
                            {patient.medicareNumber && (
                              <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-200">
                                Medicare: {patient.medicareNumber}
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border">
                              {docs.length} Document{docs.length !== 1 ? "s" : ""} Available
                            </span>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-emerald-600" />
                              Suwasiri Linked
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {patient.age} yrs • {patient.gender} • Blood: {patient.bloodType} • Allergies: <span className="text-rose-600 font-medium">{patient.allergies}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* IN EXAM ROOM button requested by user */}
                        {onStartConsultation && (
                          <button
                            type="button"
                            onClick={() => onStartConsultation(patient)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                            title="Launch GP Examination Room for this patient"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>IN EXAM ROOM</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setNewDocPatientId(patient.id);
                            setShowUploadModal(true);
                          }}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Doc
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenPatientEverything) {
                              onOpenPatientEverything(patient);
                            }
                          }}
                          className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Full File
                        </button>
                      </div>
                    </div>

                    {/* Patient's Documents List */}
                    {docs.length === 0 ? (
                      <div className="p-4 bg-slate-50/50 text-center py-5">
                        <p className="text-xs text-slate-500 italic">No external documents filed yet for {patient.name}.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewDocPatientId(patient.id);
                            setShowUploadModal(true);
                          }}
                          className="mt-2 text-xs font-bold text-sky-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" /> Upload Clinical PDF or Scan Paper Document
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {docs.map((doc) => {
                          const isSelected = selectedDoc?.id === doc.id;
                          const isSynced = suwasiriSyncedDocs[doc.id];
                          return (
                            <div
                              key={doc.id}
                              className={`p-3.5 rounded-lg border transition text-left flex flex-col justify-between ${
                                isSelected
                                  ? "bg-sky-50/70 border-[#00334f] shadow-xs ring-1 ring-[#00334f]"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        doc.category === "Pathology Reports"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : doc.category === "Imaging Reports"
                                          ? "bg-sky-100 text-sky-800"
                                          : doc.category === "Specialist Letters"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-slate-100 text-slate-800"
                                      }`}
                                    >
                                      {doc.fileType === "PDF" ? "PDF" : doc.fileType === "SCANNED_DOC" ? "SCN" : "IMG"}
                                    </div>
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                                      {doc.category}
                                    </span>
                                  </div>

                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                      doc.status === "REVIEWED_NORMAL"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : doc.status === "ACTION_REQUIRED"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {doc.status.replace(/_/g, " ")}
                                  </span>
                                </div>

                                <h4
                                  onClick={() => setViewingDocModal(doc)}
                                  className="text-xs font-bold text-slate-900 mt-2 line-clamp-1 hover:text-sky-700 cursor-pointer hover:underline"
                                  title="Click to open full document view"
                                >
                                  {doc.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Uploaded: {doc.uploadedDate} • {doc.fileSizeKb} KB
                                </p>
                                {doc.summaryNotes && (
                                  <p className="text-[11px] text-slate-600 italic mt-1.5 line-clamp-2">
                                    "{doc.summaryNotes}"
                                  </p>
                                )}

                                {isSynced && (
                                  <div className="mt-2 text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                    <Smartphone className="w-3 h-3 text-emerald-600" />
                                    <span>Synced to Suwasiri App ({isSynced})</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                {doc.signatureStatus === "SIGNED_DIGITALLY" ? (
                                  <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Signed
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSignDocument(doc.id);
                                    }}
                                    className="text-purple-700 hover:text-purple-900 font-bold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                                  >
                                    <ShieldCheck className="w-3 h-3" /> Sign Digitally
                                  </button>
                                )}

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSyncToSuwasiri(doc)}
                                    disabled={syncingDocId === doc.id}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-emerald-200"
                                    title="Sync document to Patient's Suwasiri Mobile App"
                                  >
                                    <Smartphone className="w-3 h-3" />
                                    {syncingDocId === doc.id ? "Syncing..." : isSynced ? "Re-sync" : "Sync App"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setViewingDocModal(doc)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Open document viewer"
                                  >
                                    <Eye className="w-3 h-3" /> View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(doc)}
                                    className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer hover:bg-slate-100 rounded"
                                    title="Download Document PDF"
                                  >
                                    <Download className="w-3.5 h-3.5 text-sky-700" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Unassigned section if any */}
                {unassignedDocs.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                          Unallocated Documents ({unassignedDocs.length}) — Action Required
                        </h3>
                      </div>
                      <span className="text-[11px] text-amber-800 font-medium">
                        Assign to patient files below
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unassignedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-xs space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900">{doc.title}</h4>
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Unassigned
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{doc.uploadedDate} • {doc.category}</p>
                          <div className="pt-2 border-t flex items-center gap-2">
                            <select
                              className="text-[11px] p-1 border rounded bg-white flex-1 outline-none"
                              onChange={(e) => {
                                if (e.target.value) handleAllocate(doc.id, e.target.value);
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Allocate to Patient...</option>
                              {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.id})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setViewLayout("ALL_DOCS");
                              }}
                              className="bg-slate-100 p-1.5 rounded text-slate-700"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Documents List */}
          <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Matching Documents ({filteredDocs.length})
            </span>
            <span className="text-[11px] text-slate-400">Click to preview & allocate</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="bg-white border rounded-xl p-8 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">No documents found matching query</p>
                <p className="text-xs">Try resetting search filters or upload a new clinical PDF.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isUnassigned = doc.patientId === "UNALLOCATED";

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#e7eeff] border-[#00334f] shadow-xs"
                        : isUnassigned
                        ? "bg-amber-50/70 border-amber-200 hover:border-amber-400"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            doc.category === "Pathology Reports"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.category === "Imaging Reports"
                              ? "bg-sky-100 text-sky-800"
                              : doc.category === "Specialist Letters"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {doc.fileType === "PDF" ? "PDF" : doc.fileType === "SCANNED_DOC" ? "SCN" : "IMG"}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{doc.title}</h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className={isUnassigned ? "text-amber-800 font-bold" : "font-medium text-slate-700"}>
                              {doc.patientName}
                            </span>
                            <span>•</span>
                            <span>{doc.uploadedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            doc.status === "REVIEWED_NORMAL"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.status === "ACTION_REQUIRED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {doc.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/80 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {doc.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.signatureStatus === "SIGNED_DIGITALLY" && (
                          <span className="flex items-center gap-0.5 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Signed
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{doc.fileSizeKb} KB</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Document Inspector & Preview */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="bg-white border rounded-xl p-6 shadow-xs space-y-6">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                      {selectedDoc.category}
                    </span>
                    <span className="text-xs text-slate-400">ID: #{selectedDoc.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-[#00334f] mt-1.5">{selectedDoc.title}</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Allocated Patient: <strong className="text-slate-900">{selectedDoc.patientName}</strong> (ID: {selectedDoc.patientId})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowVersionHistoryModal(true)}
                    className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    v{selectedDoc.versionHistory.length} History
                  </button>

                  {selectedDoc.signatureStatus !== "SIGNED_DIGITALLY" ? (
                    <button
                      onClick={() => handleSignDocument(selectedDoc.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Sign Digitally
                    </button>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      AHPRA Verified Signature
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Allocation Warning / Selector if Unassigned */}
              {selectedDoc.patientId === "UNALLOCATED" && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Unallocated Inbound Document — Allocate to Patient EMR Chart
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select
                      id="reallocate-select"
                      className="flex-1 text-xs p-2 border rounded-lg bg-white font-semibold text-slate-800 outline-none"
                      defaultValue={patients[0]?.id}
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.age}y, DOB: {p.dateOfBirth || "1988"}) - ID: {p.id}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const sel = document.getElementById("reallocate-select") as HTMLSelectElement;
                        if (sel) handleAllocate(selectedDoc.id, sel.value);
                      }}
                      className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      Allocate & File
                    </button>
                  </div>
                </div>
              )}

              {/* Document Meta Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Uploaded By</span>
                  <span className="font-semibold text-slate-700">{selectedDoc.uploadedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Upload Date</span>
                  <span className="font-semibold text-slate-700">{selectedDoc.uploadedDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Doctor In Charge</span>
                  <span className="font-semibold text-slate-700">{selectedDoc.allocatedDoctor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">File Specifications</span>
                  <span className="font-semibold text-slate-700">
                    {selectedDoc.fileType} • {selectedDoc.fileSizeKb} KB
                  </span>
                </div>
              </div>

              {/* Document Visual Preview & OCR Text Panel */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Clinical Viewer & OCR Extracted Body</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDoc.ocrExtractedText || selectedDoc.summaryNotes || "");
                        alert("Extracted document content copied to clipboard!");
                      }}
                      className="hover:text-[#00334f] text-slate-500 text-[11px] flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" /> Copy Text
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="hover:text-[#00334f] text-slate-500 text-[11px] flex items-center gap-1 font-semibold"
                    >
                      <Printer className="w-3 h-3" /> Print
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap select-text">
                  {selectedDoc.ocrExtractedText || (
                    <div className="text-slate-300">
                      ========================================================================{"\n"}
                      DOCUMENT REPOSITORY RECORD: {selectedDoc.title.toUpperCase()}
                      {"\n"}
                      PATIENT: {selectedDoc.patientName} | CATEGORY: {selectedDoc.category}
                      {"\n"}
                      ========================================================================{"\n\n"}
                      {selectedDoc.summaryNotes || "Document content verified and archived in electronic chart."}
                      {"\n\n"}
                      --- DIGITAL AUDIT STAMP ---{"\n"}
                      Status: {selectedDoc.status}{"\n"}
                      Sign-off: {selectedDoc.signedBy || "Awaiting Doctor Verification"}{"\n"}
                      Timestamp: {selectedDoc.signedDate || selectedDoc.uploadedDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Review Actions & Notes Form */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Doctor Clinical Review Notes & Action Instructions
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={selectedDoc.summaryNotes || ""}
                    placeholder="e.g. Reviewed with patient. HbA1c stable, repeat in 6 months."
                    className="flex-1 text-xs p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                    id="doc-review-notes"
                  />
                  <button
                    onClick={() => {
                      const inp = document.getElementById("doc-review-notes") as HTMLInputElement;
                      if (inp) {
                        setDocuments((prev) =>
                          prev.map((d) =>
                            d.id === selectedDoc.id
                              ? { ...d, summaryNotes: inp.value, status: "REVIEWED_NORMAL" }
                              : d
                          )
                        );
                        setSelectedDoc((prev) =>
                          prev ? { ...prev, summaryNotes: inp.value, status: "REVIEWED_NORMAL" } : null
                        );
                        alert("Review notes saved and document marked as Reviewed!");
                      }
                    }}
                    className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Save Review
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">Select a clinical document on the left to inspect</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* MODAL 1: UPLOAD DOCUMENT FORM */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#00334f]" />
                <h3 className="font-bold text-base text-[#00334f]">Upload Clinical Document / Electronic Ingest</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sky-300 hover:border-[#00334f] bg-sky-50/50 hover:bg-sky-50/80 p-6 rounded-xl text-center cursor-pointer transition space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                <FileSpreadsheet className="w-8 h-8 mx-auto text-sky-600" />
                <p className="text-xs font-bold text-slate-800">
                  {uploadedFileName ? `Selected: ${uploadedFileName} (${uploadedFileSize} KB)` : "Click to select PDF or image file (or drag & drop)"}
                </p>
                <p className="text-[11px] text-slate-500">Supports PDF, PNG, JPEG, DICOM reports up to 25MB</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="e.g. Lipid Profile & Renal Function"
                    className="w-full text-xs p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Category *</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as DocumentCategory)}
                    className="w-full text-xs p-2.5 border rounded-lg outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="Clinical Correspondence">Clinical Correspondence</option>
                    <option value="Specialist Letters">Specialist Letters</option>
                    <option value="Pathology Reports">Pathology Reports</option>
                    <option value="Imaging Reports">Imaging Reports</option>
                    <option value="Medical Certificates">Medical Certificates</option>
                    <option value="Referral Documents">Referral Documents</option>
                    <option value="Discharge Summaries">Discharge Summaries</option>
                    <option value="Patient Consents">Patient Consents</option>
                    <option value="Insurance / WorkCover">Insurance / WorkCover</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assign to Patient *</label>
                  <select
                    value={newDocPatientId}
                    onChange={(e) => setNewDocPatientId(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-lg outline-none bg-white font-semibold text-slate-700"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Allocated Practitioner</label>
                  <input
                    type="text"
                    value={newDocDoctor}
                    onChange={(e) => setNewDocDoctor(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-lg outline-none bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newDocTags}
                  onChange={(e) => setNewDocTags(e.target.value)}
                  placeholder="e.g. Pathology, Urgent, Cholesterol"
                  className="w-full text-xs p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Summary / Clinical Impressions</label>
                <textarea
                  rows={2}
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  placeholder="Enter key findings, impressions, or follow-up plans..."
                  className="w-full text-xs p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="conf-check"
                  checked={newDocIsConfidential}
                  onChange={(e) => setNewDocIsConfidential(e.target.checked)}
                  className="rounded text-[#00334f]"
                />
                <label htmlFor="conf-check" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Mark as Confidential / Sensitive Record (VIP Protection)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00334f] hover:bg-[#0c4a6e] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save & Ingest Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TWAIN SCANNER SIMULATION */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#00334f]">Optical TWAIN Document Scanner</h3>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl p-8 text-center text-white space-y-3 relative overflow-hidden">
                {scannerStatus === "READY" && (
                  <div>
                    <Camera className="w-12 h-12 mx-auto text-amber-400 mb-2 opacity-80" />
                    <p className="text-xs font-bold">Place document on flatbed scanner and click "Scan Now"</p>
                    <p className="text-[11px] text-slate-400">Scanner: Canon imageFORMULA DR-C225 II (Online)</p>
                  </div>
                )}

                {scannerStatus === "SCANNING" && (
                  <div className="space-y-2">
                    <div className="w-full h-1.5 bg-amber-500 animate-pulse rounded-full" />
                    <p className="text-xs font-bold text-amber-400">Scanning optical document at {scanDpi}...</p>
                    <p className="text-[10px] text-slate-400">Acquiring TWAIN raster stream...</p>
                  </div>
                )}

                {scannerStatus === "CROPPING" && (
                  <div className="space-y-2">
                    <div className="w-full h-1.5 bg-sky-500 animate-pulse rounded-full" />
                    <p className="text-xs font-bold text-sky-400">Auto-deskewing & applying OCR...</p>
                  </div>
                )}

                {scannerStatus === "COMPLETED" && (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                    <p className="text-xs font-bold text-emerald-300">Scan Complete! High-res digital copy generated.</p>
                    <p className="text-[10px] text-slate-300">Page 1 of 1 • 890 KB • 300 DPI</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Resolution (DPI)</label>
                  <select
                    value={scanDpi}
                    onChange={(e) => setScanDpi(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="150 DPI">150 DPI (Fast)</option>
                    <option value="300 DPI">300 DPI (Clinical Standard)</option>
                    <option value="600 DPI">600 DPI (High Resolution)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Allocate Patient</label>
                  <select
                    value={newDocPatientId}
                    onChange={(e) => setNewDocPatientId(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowScannerModal(false)}
                  className="px-4 py-2 border text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {scannerStatus !== "COMPLETED" ? (
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    disabled={scannerStatus === "SCANNING" || scannerStatus === "CROPPING"}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Scan Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveScannedDocument}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save to Patient Chart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DOCUMENT TEMPLATES SUITE */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-[#00334f]">Clinical Correspondence Templates</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedTemplate.id === tpl.id
                      ? "bg-purple-50 border-purple-500 shadow-xs"
                      : "bg-white border-slate-200 hover:border-purple-200"
                  }`}
                >
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{tpl.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                </button>
              ))}
            </div>

            {/* Target Patient */}
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs font-bold text-slate-700">Apply to Patient:</span>
              <select
                value={templatePatientId}
                onChange={(e) => {
                  setTemplatePatientId(e.target.value);
                  handleApplyTemplate(selectedTemplate);
                }}
                className="text-xs p-1.5 border rounded-lg bg-white font-bold text-[#00334f]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Template Editor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Customized Template Body (Edit before generating document)
              </label>
              <textarea
                rows={10}
                value={templateCustomizedContent}
                onChange={(e) => setTemplateCustomizedContent(e.target.value)}
                className="w-full text-xs font-mono p-3 border rounded-xl bg-slate-900 text-slate-100 outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplateAsDocument}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" /> Save as Official Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VERSION HISTORY MODAL */}
      {showVersionHistoryModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-sm text-[#00334f]">Document Version History</h3>
              </div>
              <button
                onClick={() => setShowVersionHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedDoc.versionHistory.map((ver) => (
                <div key={ver.versionNumber} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Version {ver.versionNumber}.0</span>
                    <span className="text-[10px] text-slate-500">{ver.timestamp}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{ver.notes}</p>
                  <div className="text-[10px] text-slate-400 mt-1">Author: {ver.author} • {ver.fileSizeKb} KB</div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowVersionHistoryModal(false)}
                className="px-4 py-1.5 bg-[#00334f] text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PATIENT CLINICAL DOCUMENT FULL INSPECTOR & ACTIONS MODAL */}
      {viewingDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                    {viewingDocModal.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Ref: #{viewingDocModal.id}</span>
                  {suwasiriSyncedDocs[viewingDocModal.id] && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      Synced to Suwasiri ({suwasiriSyncedDocs[viewingDocModal.id]})
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-[#00334f] mt-1">{viewingDocModal.title}</h2>
                <p className="text-xs text-slate-600">
                  Patient: <strong className="text-slate-900">{viewingDocModal.patientName}</strong> (ID: {viewingDocModal.patientId}) • Uploaded: {viewingDocModal.uploadedDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* IN EXAM ROOM button */}
                {(() => {
                  const targetPatient = patients.find((p) => p.id === viewingDocModal.patientId);
                  return (
                    targetPatient && onStartConsultation && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDocModal(null);
                          onStartConsultation(targetPatient);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Launch GP Examination Room for this patient"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>IN EXAM ROOM</span>
                      </button>
                    )
                  );
                })()}

                <button
                  onClick={() => setViewingDocModal(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Action Bar: PDF Download, Suwasiri App Sync, Sign */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(viewingDocModal)}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download as PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSyncToSuwasiri(viewingDocModal)}
                  disabled={syncingDocId === viewingDocModal.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{syncingDocId === viewingDocModal.id ? "Syncing..." : "Sync with Suwasiri APP"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {viewingDocModal.signatureStatus === "SIGNED_DIGITALLY" ? (
                  <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Digital Signature
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSignDocument(viewingDocModal.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Sign Digitally
                  </button>
                )}
              </div>
            </div>

            {/* Document Body & Extracted Text Viewer */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 border-b flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Official Document Content & OCR Record</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingDocModal.ocrExtractedText || viewingDocModal.summaryNotes || "");
                      alert("Document text copied to clipboard!");
                    }}
                    className="hover:text-[#00334f] text-slate-500 text-[11px] flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="hover:text-[#00334f] text-slate-500 text-[11px] flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Printer className="w-3 h-3" /> Print
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-[340px] overflow-y-auto whitespace-pre-wrap select-text">
                {viewingDocModal.ocrExtractedText || (
                  <div className="text-slate-200">
                    ========================================================================{"\n"}
                    DOCUMENT: {viewingDocModal.title.toUpperCase()}{"\n"}
                    PATIENT : {viewingDocModal.patientName} (ID: {viewingDocModal.patientId}){"\n"}
                    CATEGORY: {viewingDocModal.category}{"\n"}
                    ========================================================================{"\n\n"}
                    {viewingDocModal.summaryNotes || "Document content verified and archived in electronic chart."}{"\n\n"}
                    --- AUDIT STAMP ---{"\n"}
                    Uploaded Date : {viewingDocModal.uploadedDate}{"\n"}
                    Allocated GP  : {viewingDocModal.allocatedDoctor}{"\n"}
                    Signed Status : {viewingDocModal.signatureStatus === "SIGNED_DIGITALLY" ? "VERIFIED DIGITALLY" : "UNSIGNED"}{"\n"}
                    Signed Doctor : {viewingDocModal.signedBy || "Dr. Priyantha Silva (FRACGP)"}{"\n"}
                    Suwasiri Sync : {suwasiriSyncedDocs[viewingDocModal.id] ? `Active (${suwasiriSyncedDocs[viewingDocModal.id]})` : "Ready to Sync"}
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Review Notes Form */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-bold text-slate-700 block">
                Doctor Review Comments & Notes (Auto-saved & syncable with Suwasiri App)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={viewingDocModal.summaryNotes || ""}
                  placeholder="Doctor's clinical review notes..."
                  className="flex-1 text-xs p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                  id="modal-doc-review-notes"
                />
                <button
                  onClick={() => {
                    const inp = document.getElementById("modal-doc-review-notes") as HTMLInputElement;
                    if (inp) {
                      setDocuments((prev) =>
                        prev.map((d) =>
                          d.id === viewingDocModal.id
                            ? { ...d, summaryNotes: inp.value, status: "REVIEWED_NORMAL" }
                            : d
                        )
                      );
                      setViewingDocModal((prev) =>
                        prev ? { ...prev, summaryNotes: inp.value, status: "REVIEWED_NORMAL" } : null
                      );
                      alert("Comments saved! Document marked as Reviewed and updated for Suwasiri sync.");
                    }
                  }}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Comments
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setViewingDocModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

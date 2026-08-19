import React, { useState } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Bot,
  BrainCircuit,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  Send,
  Copy,
  RefreshCw,
  PlusCircle,
  Stethoscope,
  Pill,
  HeartPulse,
  Flame,
  Activity,
  Layers
} from "lucide-react";
import { Patient, AIScribeSession, AIPatientSummary, AIChatSuggestion } from "../types";

interface Props {
  patients: Patient[];
  activePatient?: Patient;
  onSelectPatient?: (patient: Patient) => void;
  onCommitSoapToChart?: (patientId: string, soap: AIScribeSession["generatedSoap"]) => void;
  onApplyPrescriptionSuggestion?: (patientId: string, rx: { drug: string; dose: string; frequency: string }) => void;
  onApplyRecallSuggestion?: (patientId: string, recallTitle: string) => void;
}

const SAMPLE_TRANSCRIPTS = [
  {
    title: "62yo Diabetic & Hypertension Review",
    transcript:
      "Doctor: Good morning Mr. Sunil Jayawardena, how have you been feeling since we started the Telmisartan 40mg?\nPatient: Doctor, my blood pressure numbers have been good at home, around 130 over 80, but I feel a bit dizzy in the morning when I get out of bed quickly. Also my feet feel slightly tingly at night.\nDoctor: Let's check your blood pressure now. Sitting BP is 132/82 mmHg, heart rate 72 regular. Chest is clear on auscultation, no ankle oedema. Monofilament test on both feet shows reduced light touch sensation on the left first metatarsal head. Fasting HbA1c from last week was 8.2%, which is higher than our target of 7.0%. eGFR is 62 mL/min.\nDoctor: I recommend increasing Metformin to 1000mg twice daily with food, adding Dapagliflozin 10mg once daily for renal/cardiovascular protection, referring you for an urgent Diabetic Retinal Eye Screening and Podiatry assessment, and re-checking HbA1c and urine microalbumin in 3 months."
  },
  {
    title: "Acute Respiratory & Asthmatic Exacerbation",
    transcript:
      "Doctor: Hello Fatima, you look quite breathless today. When did the coughing start?\nPatient: It started three nights ago with a sore throat, but today my chest feels tight and my blue inhaler isn't giving me relief.\nDoctor: Let's examine your respiratory system. Oxygen saturation is 94% on room air, respiratory rate 22 breaths per minute, heart rate 98. On chest auscultation there is widespread expiratory wheeze bilaterally with no focal crackles. Peak Flow rate is 280 L/min, down from your baseline of 420 L/min.\nDoctor: Assessment is Moderate Acute Asthma Exacerbation secondary to viral upper respiratory tract infection. We will administer 5mg Salbutamol via nebuliser now in clinic, start a 5-day course of Oral Prednisolone 40mg daily, step up your Seretide 250/25 to two puffs twice daily, and review you in 48 hours with an updated Asthma Action Plan."
  }
];

export default function AIFeaturesHub({
  patients,
  activePatient: initialPatient,
  onSelectPatient,
  onCommitSoapToChart,
  onApplyPrescriptionSuggestion,
  onApplyRecallSuggestion
}: Props) {
  const [selectedPatient, setSelectedPatient] = useState<Patient>(initialPatient || patients[0]);
  const [activeSubTab, setActiveSubTab] = useState<"SCRIBE" | "SUMMARY" | "ASSISTANT">("SCRIBE");

  // Scribe State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [rawTranscript, setRawTranscript] = useState(SAMPLE_TRANSCRIPTS[0].transcript);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [generatedSoap, setGeneratedSoap] = useState<AIScribeSession["generatedSoap"] | null>({
    subjective:
      "62-year-old male with known Type 2 Diabetes and Hypertension presenting for regular chronic disease review. Reports good home BP readings (~130/80 mmHg) but experiences mild orthostatic lightheadedness in mornings. Notes bilateral nocturnal lower limb paraesthesia/tingling.",
    objective:
      "Vitals: BP 132/82 mmHg sitting, HR 72 bpm regular, SpO2 98% RA, BMI 28.4 kg/m².\nCardiovascular: Dual heart sounds, no murmurs. No peripheral ankle oedema.\nRespiratory: Chest clear to auscultation bilaterally.\nNeurological (Diabetic Foot Exam): Reduced 10g monofilament sensation over left 1st metatarsal head. DP and PT pulses palpable.\nRecent Labs: Fasting HbA1c 8.2% (elevated, target < 7.0%), eGFR 62 mL/min/1.73m², Urine ACR 4.2 mg/mmol (microalbuminuria).",
    assessment:
      "1. Suboptimally controlled Type 2 Diabetes Mellitus with early peripheral sensory neuropathy (E11.40).\n2. Controlled Essential Hypertension (I10) with mild orthostatic symptoms.\n3. Mild diabetic microalbuminuria (Stage G2 A2).",
    plan:
      "1. Meds: Titrate Metformin to 1000mg BD. Initiate Dapagliflozin (Forxiga) 10mg OD for cardiovascular/renal risk mitigation.\n2. Pathology: Order repeat HbA1c, U&Es, and Urine Microalbumin:Creatinine ratio in 12 weeks.\n3. Referrals: Optometry / Ophthalmology (Diabetic Retinal Photography) and Podiatry (High-risk foot care).\n4. Recalls: Book 3-month GP Chronic Disease Management review (MBS Item 721 review).",
    suggestedDiagnoses: [
      { icd10: "E11.40", description: "Type 2 diabetes mellitus with diabetic neuropathy", confidence: 96 },
      { icd10: "I10", description: "Essential (primary) hypertension", confidence: 98 }
    ],
    suggestedPrescriptions: [
      { drug: "Metformin Hydrochloride", dose: "1000mg", frequency: "1 tab BD with meals", reason: "Glycaemic optimisation" },
      { drug: "Dapagliflozin (Forxiga)", dose: "10mg", frequency: "1 tab OD morning", reason: "SGLT2i renal & cardiovascular protection" }
    ],
    suggestedPathology: ["HbA1c Glycated Haemoglobin", "Urinary Albumin:Creatinine Ratio (ACR)", "eGFR & Serum Creatinine"],
    suggestedRecalls: ["3-Month Diabetes Glycaemic Review", "Annual Diabetic Retinal Screening", "Diabetic Podiatry Assessment"]
  });

  const [soapEditableSubjective, setSoapEditableSubjective] = useState(generatedSoap?.subjective || "");
  const [soapEditableObjective, setSoapEditableObjective] = useState(generatedSoap?.objective || "");
  const [soapEditableAssessment, setSoapEditableAssessment] = useState(generatedSoap?.assessment || "");
  const [soapEditablePlan, setSoapEditablePlan] = useState(generatedSoap?.plan || "");
  const [isApproved, setIsApproved] = useState(false);

  // AI Patient Summary State
  const [patientSummary, setPatientSummary] = useState<AIPatientSummary>({
    patientId: selectedPatient.id,
    patientAge: selectedPatient.age || 62,
    patientGender: selectedPatient.gender || "Male",
    keyConditions: ["Type 2 Diabetes Mellitus (E11.9)", "Primary Essential Hypertension (I10)", "Diabetic Peripheral Neuropathy"],
    activeMedicationsCount: selectedPatient.activeMedications ? selectedPatient.activeMedications.length : 5,
    recentCriticalOrAbnormalResults: [
      { test: "HbA1c Glycated Haemoglobin", result: "8.2%", date: "2026-08-10", flag: "HIGH" },
      { test: "Fasting Serum Triglycerides", result: "2.4 mmol/L", date: "2026-08-10", flag: "HIGH" },
      { test: "Urine Microalbumin:Creatinine Ratio", result: "4.2 mg/mmol", date: "2026-08-10", flag: "HIGH" }
    ],
    outstandingCareGapsAndRecalls: [
      { title: "Diabetes 6-Month Review", urgency: "HIGH", recommendedInterval: "Overdue by 14 days", rationale: "HbA1c > 8.0% requires medication titration" },
      { title: "Diabetic Retinal Eye Screening", urgency: "HIGH", recommendedInterval: "Due every 2 years", rationale: "Prevent diabetic retinopathy progression" },
      { title: "Diabetic Kidney Health Check (UACR + eGFR)", urgency: "MEDIUM", recommendedInterval: "Due in 3 weeks", rationale: "Monitor microalbuminuria staging" }
    ],
    aiExecutiveInsight:
      "62-year-old patient with multi-morbidity. Glycaemic control has drifted above target (HbA1c 8.2%). Microalbuminuria and sensory foot changes indicate early microvascular involvement. Consider adding an SGLT2 inhibitor (e.g. Dapagliflozin) for renal protection and organising retinal screening.",
    interactionRisks: [
      { severity: "MODERATE", title: "Metformin + Radiocontrast", explanation: "Withhold 48h prior to contrast imaging if eGFR < 60." },
      { severity: "LOW", title: "Telmisartan + NSAIDs", explanation: "Avoid long-term ibuprofen to prevent triple-whammy acute kidney injury." }
    ]
  });

  // AI Assistant Chat & Suggestions
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: "user" | "ai"; text: string; actionSuggestion?: AIChatSuggestion }>
  >([
    {
      sender: "ai",
      text: `Hello Doctor! I have indexed ${selectedPatient.name}'s EMR record. How can I assist you with today's consultation, referral drafting, or clinical decision support?`
    }
  ]);

  const handleSimulateRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
      const interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 12) {
            clearInterval(interval);
            setIsRecording(false);
            return 12;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setIsRecording(false);
    }
  };

  const handleGenerateSoapFromTranscript = () => {
    setIsGeneratingSoap(true);
    setIsApproved(false);
    setTimeout(() => {
      setIsGeneratingSoap(false);
      setSoapEditableSubjective(generatedSoap?.subjective || "");
      setSoapEditableObjective(generatedSoap?.objective || "");
      setSoapEditableAssessment(generatedSoap?.assessment || "");
      setSoapEditablePlan(generatedSoap?.plan || "");
    }, 900);
  };

  const handleApproveAndCommitSoap = () => {
    setIsApproved(true);
    if (onCommitSoapToChart && generatedSoap) {
      onCommitSoapToChart(selectedPatient.id, {
        subjective: soapEditableSubjective,
        objective: soapEditableObjective,
        assessment: soapEditableAssessment,
        plan: soapEditablePlan,
        suggestedDiagnoses: generatedSoap.suggestedDiagnoses,
        suggestedPrescriptions: generatedSoap.suggestedPrescriptions,
        suggestedPathology: generatedSoap.suggestedPathology,
        suggestedRecalls: generatedSoap.suggestedRecalls
      });
    }
    alert(`Doctor approval verified! Structured SOAP consultation record and care plan successfully committed to ${selectedPatient.name}'s official medical chart.`);
  };

  const handleSendAssistantQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantPrompt.trim()) return;

    const userQ = assistantPrompt;
    setChatHistory((prev) => [...prev, { sender: "user", text: userQ }]);
    setAssistantPrompt("");
    setAssistantLoading(true);

    setTimeout(() => {
      setAssistantLoading(false);
      let reply = "";
      let suggestion: AIChatSuggestion | undefined;

      const lower = userQ.toLowerCase();
      if (lower.includes("referral") || lower.includes("letter") || lower.includes("ophthalmology") || lower.includes("podiatry")) {
        reply = `I have drafted an electronic specialist referral letter for ${selectedPatient.name} based on today's clinical findings:`;
        suggestion = {
          id: "sug-1",
          type: "REFERRAL_DRAFT",
          title: "Draft Referral: Diabetic Retinopathy & Podiatry Screening",
          content: `RE: SPECIALIST REFERRAL FOR DIABETIC EYE & FOOT ASSESSMENT\nPatient: ${selectedPatient.name} (Age: ${selectedPatient.age}, Medicare: ${selectedPatient.medicareNumber || "2948 10294 1"})\nClinical Summary: Patient with Type 2 Diabetes has recent HbA1c 8.2% and left 1st metatarsal decreased monofilament sensation. Requesting dilated fundoscopic evaluation and diabetic neurovascular foot examination.\nCurrent Meds: ${selectedPatient.activeMedications ? selectedPatient.activeMedications.join(", ") : "Metformin, Telmisartan"}.`,
          applied: false
        };
      } else if (lower.includes("missing") || lower.includes("gap") || lower.includes("information")) {
        reply = `Missing clinical information & compliance gaps identified for ${selectedPatient.name}:\n1. Urinary Albumin:Creatinine Ratio (UACR) is overdue by 3 weeks.\n2. Eye check: No dilated retinal photography recorded in past 24 months.\n3. Influenza Booster: Fluarix Tetra vaccine overdue for current winter season.`;
      } else if (lower.includes("instruction") || lower.includes("leaflet") || lower.includes("patient")) {
        reply = `Here is a clear, patient-friendly take-home summary in plain English for ${selectedPatient.name}:`;
        suggestion = {
          id: "sug-2",
          type: "PATIENT_LEAFLET",
          title: "Patient Take-Home Summary & Action Plan",
          content: `DEAR ${selectedPatient.name.toUpperCase()},\n\nToday Dr. Silva reviewed your diabetes and blood pressure:\n1. Medications: Continue Telmisartan 40mg each morning. Take Metformin 1000mg with breakfast and dinner. Start the new Dapagliflozin 10mg tablet in the morning.\n2. Daily Care: Inspect the skin on both feet every night with a mirror. Report any cuts, redness, or blisters immediately.\n3. Next Steps: Book an eye check with the optometrist, and return for a blood test in 12 weeks.`,
          applied: false
        };
      } else {
        reply = `Based on ${selectedPatient.name}'s clinical records, their current diabetes control (HbA1c 8.2%) warrants adding an SGLT2i (Dapagliflozin) or GLP-1 RA per RACGP guidelines, alongside blood pressure monitoring and repeat renal function staging in 12 weeks.`;
      }

      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: reply, actionSuggestion: suggestion }
      ]);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#00334f] via-[#094568] to-[#0d5985] p-6 rounded-2xl text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-sky-400/20 text-sky-200 border border-sky-300/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                AI Clinical Advantage & Decision Support
              </span>
              <span className="text-xs text-sky-200/80">RACGP Guideline Grounded</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Medical Scribe, Patient Executive Summary & Clinical Assistant
            </h1>
            <p className="text-xs text-sky-100/80 max-w-2xl">
              Turn natural doctor-patient consultations into structured, legally defensible SOAP notes, instant care-gap summaries, and verified ePrescriptions with doctor-in-the-loop sign-off.
            </p>
          </div>

          {/* Patient Selector */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-xs flex flex-col gap-1.5 min-w-[240px]">
            <span className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Active Patient Context:</span>
            <select
              value={selectedPatient.id}
              onChange={(e) => {
                const found = patients.find((p) => p.id === e.target.value);
                if (found) {
                  setSelectedPatient(found);
                  if (onSelectPatient) onSelectPatient(found);
                }
              }}
              className="bg-white text-slate-900 font-bold rounded-lg p-2 text-xs outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}y, {p.gender})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15">
          <button
            onClick={() => setActiveSubTab("SCRIBE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === "SCRIBE"
                ? "bg-white text-[#00334f] shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Mic className="w-4 h-4 text-sky-600" />
            1. AI Medical Scribe (Consultation → SOAP)
          </button>

          <button
            onClick={() => setActiveSubTab("SUMMARY")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === "SUMMARY"
                ? "bg-white text-[#00334f] shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-purple-600" />
            2. AI Patient Executive Summary
          </button>

          <button
            onClick={() => setActiveSubTab("ASSISTANT")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === "ASSISTANT"
                ? "bg-white text-[#00334f] shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            3. AI Clinical Copilot & Drafts
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: AI MEDICAL SCRIBE */}
      {/* ============================================================ */}
      {activeSubTab === "SCRIBE" && (
        <div className="space-y-6">
          {/* Architecture Workflow Bar */}
          <div className="bg-white p-4 border rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 overflow-x-auto gap-2">
              <span className="flex items-center gap-1.5 text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg">
                <Mic className="w-3.5 h-3.5" /> Doctor Consultation
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex items-center gap-1.5 text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg">
                <Bot className="w-3.5 h-3.5" /> Voice / Text Stream
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" /> AI SOAP Note
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex items-center gap-1.5 text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg">
                <FileCheck className="w-3.5 h-3.5" /> Doctor Reviews
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Doctor Approves → Medical Record
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Audio/Transcript Ingest */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 border rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Live Consultation Audio & Dictation
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {isRecording ? `00:${recordingSeconds < 10 ? "0" : ""}${recordingSeconds}` : "Idle"}
                  </span>
                </div>

                {/* Microphone Recording Button */}
                <div className="p-4 rounded-xl border text-center space-y-3 bg-slate-50">
                  <button
                    type="button"
                    onClick={handleSimulateRecording}
                    className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition-all shadow-md ${
                      isRecording
                        ? "bg-rose-600 text-white animate-pulse scale-105"
                        : "bg-[#00334f] hover:bg-[#0c4a6e] text-white"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isRecording ? "Listening to consultation audio stream..." : "Click to Start Ambient Consultation Recording"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Encrypted local audio transcription with medical terminology recognition
                    </p>
                  </div>
                </div>

                {/* Sample Consultation Transcript Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Or Load Clinical Dialogue Demo:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {SAMPLE_TRANSCRIPTS.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRawTranscript(t.transcript)}
                        className="text-left text-xs p-2 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition"
                      >
                        <span className="font-bold text-[#00334f] block">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Raw Transcript Area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Consultation Raw Transcript</label>
                  <textarea
                    rows={8}
                    value={rawTranscript}
                    onChange={(e) => setRawTranscript(e.target.value)}
                    className="w-full text-xs p-3 border rounded-xl outline-none font-mono bg-slate-900 text-slate-100 leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSoapFromTranscript}
                  disabled={isGeneratingSoap}
                  className="w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {isGeneratingSoap ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Parsing Clinical Speech & Structuring SOAP...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate Structured SOAP Note
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Structured SOAP Review & Doctor Approval */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-5 border rounded-xl shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#00334f] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-600" />
                      Generated SOAP Note — Doctor Review & Verification
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Doctor must review and approve all AI generated notes before final EMR write.
                    </p>
                  </div>

                  {isApproved ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Doctor Approved
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Awaiting Doctor Review
                    </span>
                  )}
                </div>

                {/* SOAP Sections */}
                <div className="space-y-3 text-xs">
                  {/* Subjective */}
                  <div>
                    <label className="font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider block mb-1">
                      S — Subjective (History of Presenting Complaint)
                    </label>
                    <textarea
                      rows={3}
                      value={soapEditableSubjective}
                      onChange={(e) => setSoapEditableSubjective(e.target.value)}
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider block mb-1">
                      O — Objective (Examination & Labs)
                    </label>
                    <textarea
                      rows={4}
                      value={soapEditableObjective}
                      onChange={(e) => setSoapEditableObjective(e.target.value)}
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <label className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider block mb-1">
                      A — Assessment (Diagnoses & Staging)
                    </label>
                    <textarea
                      rows={3}
                      value={soapEditableAssessment}
                      onChange={(e) => setSoapEditableAssessment(e.target.value)}
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="font-bold text-rose-900 bg-rose-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider block mb-1">
                      P — Plan (Prescriptions, Referrals, Recalls)
                    </label>
                    <textarea
                      rows={3}
                      value={soapEditablePlan}
                      onChange={(e) => setSoapEditablePlan(e.target.value)}
                      className="w-full p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
                    />
                  </div>
                </div>

                {/* Suggested Prescriptions & Recalls Quick Add */}
                {generatedSoap && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      AI Extracted Clinical Actions (Click to Apply):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {generatedSoap.suggestedPrescriptions.map((rx, i) => (
                        <div key={i} className="bg-white p-2.5 border rounded-lg flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#00334f] block">{rx.drug} {rx.dose}</span>
                            <span className="text-[10px] text-slate-500">{rx.frequency}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (onApplyPrescriptionSuggestion) onApplyPrescriptionSuggestion(selectedPatient.id, rx);
                              alert(`Prescription for ${rx.drug} added to pending scripts!`);
                            }}
                            className="text-[10px] bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold px-2 py-1 rounded border border-sky-200"
                          >
                            + Prescribe
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {generatedSoap.suggestedRecalls.map((rec, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (onApplyRecallSuggestion) onApplyRecallSuggestion(selectedPatient.id, rec);
                            alert(`Recall for "${rec}" queued for patient!`);
                          }}
                          className="text-[10px] bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1"
                        >
                          + Queue Recall: {rec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval & Commit Button */}
                <div className="pt-2 flex items-center justify-between border-t">
                  <span className="text-[11px] text-slate-500">
                    Signing Practitioner: <strong>Dr. Priyantha Silva (FRACGP)</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleApproveAndCommitSoap}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Doctor Approve & Commit to Medical Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: AI PATIENT EXECUTIVE SUMMARY */}
      {/* ============================================================ */}
      {activeSubTab === "SUMMARY" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border rounded-xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-purple-600" />
                  <h2 className="text-lg font-bold text-[#00334f]">
                    AI Patient Executive Clinical Summary
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant real-time synthesis of chronic disease registries, abnormal pathology, and overdue care gaps.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-50 text-purple-800 font-bold px-3 py-1.5 rounded-lg border border-purple-200">
                  {selectedPatient.name} ({selectedPatient.age}y, {selectedPatient.gender})
                </span>
              </div>
            </div>

            {/* AI Executive Insight Card */}
            <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Clinical Synthesis & Trajectory
              </div>
              <p className="text-xs text-purple-950 leading-relaxed">
                {patientSummary.aiExecutiveInsight}
              </p>
            </div>

            {/* 4 Structured Summary Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Conditions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-500" /> Active Conditions
                  </span>
                  <span className="text-slate-400 font-mono">({patientSummary.keyConditions.length})</span>
                </div>
                <ul className="text-xs space-y-1.5">
                  {patientSummary.keyConditions.map((cond, idx) => (
                    <li key={idx} className="bg-white p-2 rounded-lg border border-slate-200 font-medium text-slate-800">
                      {cond}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Medications */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-sky-600" /> Active Medications
                  </span>
                  <span className="text-slate-400 font-mono">({patientSummary.activeMedicationsCount})</span>
                </div>
                <ul className="text-xs space-y-1.5">
                  {(selectedPatient.activeMedications || [
                    "Metformin 500mg BD",
                    "Telmisartan 40mg OD",
                    "Atorvastatin 20mg nocte"
                  ]).map((med, idx) => (
                    <li key={idx} className="bg-white p-2 rounded-lg border border-slate-200 font-medium text-slate-800">
                      {med}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Recent Abnormal Results */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-600" /> Recent Results
                  </span>
                  <span className="text-amber-800 text-[10px] font-bold">Requires Action</span>
                </div>
                <ul className="text-xs space-y-1.5">
                  {patientSummary.recentCriticalOrAbnormalResults.map((res, idx) => (
                    <li key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">{res.test}</span>
                        <span className="text-[10px] text-slate-400">{res.date}</span>
                      </div>
                      <span className="text-xs font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {res.result} ↑
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Outstanding Preventive Care Gaps */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" /> Outstanding Care Gaps
                  </span>
                  <span className="text-rose-800 text-[10px] font-bold">3 Due</span>
                </div>
                <ul className="text-xs space-y-1.5">
                  {patientSummary.outstandingCareGapsAndRecalls.map((gap, idx) => (
                    <li key={idx} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{gap.title}</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                          {gap.urgency}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{gap.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Interaction Risks & Safety Guardrails */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Prescribing & Drug Safety Interaction Alerts:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patientSummary.interactionRisks.map((risk, idx) => (
                  <div key={idx} className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 block">{risk.title}</span>
                      <span className="text-amber-800 text-[11px]">{risk.explanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: AI CLINICAL COPILOT & DRAFTS */}
      {/* ============================================================ */}
      {activeSubTab === "ASSISTANT" && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-lg font-bold text-[#00334f]">AI Clinical Assistant & Draft Engine</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Query clinical histories, identify missing information, prepare referral letters, and draft patient take-home leaflets.
                </p>
              </div>

              {/* Quick Prompt Chips */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setAssistantPrompt("Identify all missing information and clinical care gaps")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold transition text-[11px]"
                >
                  Missing Gaps
                </button>
                <button
                  onClick={() => setAssistantPrompt("Prepare ophthalmology referral draft for diabetic retinopathy")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold transition text-[11px]"
                >
                  Draft Eye Referral
                </button>
                <button
                  onClick={() => setAssistantPrompt("Prepare patient instructions leaflet for home blood pressure and foot care")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold transition text-[11px]"
                >
                  Patient Leaflet
                </button>
              </div>
            </div>

            {/* Chat Feed */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                      msg.sender === "user"
                        ? "bg-[#00334f] text-white"
                        : "bg-white text-slate-800 border border-slate-200 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px] opacity-80">
                      {msg.sender === "user" ? <span>Doctor</span> : <span className="text-emerald-700 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Clinical Assistant</span>}
                    </div>

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.actionSuggestion && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 space-y-2 mt-2">
                        <div className="flex items-center justify-between font-bold text-xs text-[#00334f]">
                          <span>{msg.actionSuggestion.title}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.actionSuggestion?.content || "");
                              alert("Draft content copied to clipboard for EMR insertion!");
                            }}
                            className="hover:text-sky-700 flex items-center gap-1 text-[11px] text-slate-500"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <div className="p-3 bg-white border rounded-lg font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {msg.actionSuggestion.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {assistantLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    Reviewing patient record and preparing clinical response...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAssistantQuery} className="flex gap-2">
              <input
                type="text"
                value={assistantPrompt}
                onChange={(e) => setAssistantPrompt(e.target.value)}
                placeholder={`Ask AI about ${selectedPatient.name}'s medications, guidelines, referral drafts, or interaction checks...`}
                className="flex-1 text-xs p-3 border rounded-xl outline-none focus:border-[#00334f]"
              />
              <button
                type="submit"
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" /> Send Query
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

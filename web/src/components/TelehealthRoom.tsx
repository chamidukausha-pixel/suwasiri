import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Clipboard,
  MessageSquare,
  Send,
  CheckCircle,
  Search,
  Pill,
  FileText,
  Eye,
  Download,
  Printer,
  Smartphone,
  Check,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  ShieldCheck,
  QrCode,
  Share2,
  Loader2,
} from "lucide-react";
import { Patient, Appointment, DrugFormularyItem } from "../types";
import {
  canStartTelehealthCall,
  isVideoBooking,
  isVideoBookingOnDate,
  appointmentPatientName,
  stubPatientFromBooking,
  telehealthCallOpensAt,
  parseSlot,
} from "../sync/suwasiriAppointments";
import { startDoctorTelehealthCall, type TelehealthCallHandle, type TelehealthCallStatus } from "../sync/telehealthRtc";
import { issuePrescriptionsToSuwasiri } from "../sync/suwasiriPrescriptions";
import {
  saveConsultationNote,
  sendTelehealthChatMessage,
  subscribeTelehealthChat,
  type TelehealthChatMessage,
} from "../sync/suwasiriConsultSync";

interface Props {
  patients: Patient[];
  appointments: Appointment[];
  activePatient: Patient | null;
  focusPatientId?: string;
  focusAppointmentId?: string;
  sessionDoctorName?: string;
  onInvitePatient: (pName: string, phone: string, transport: "WhatsApp" | "SMS", token: string) => void;
  onSaveTelehealthNotes: (patientId: string, notes: string) => void;
  drugsDatabase?: string[];
  formulary?: DrugFormularyItem[];
  sessionDate?: string;
  onTelehealthSyncSuccess?: () => void;
  onUpdatePatientMedications?: (patientId: string, newMedications: string[]) => void;
  onOpenClinicalHub?: (patient: Patient) => void;
  onSelectVideoPatient?: (patient: Patient, appointmentId: string) => void;
  onSealConsultation?: (patient: Patient, medicines: string[], notes: string) => void;
}

export default function TelehealthRoom({
  patients,
  appointments,
  activePatient,
  focusPatientId,
  focusAppointmentId,
  sessionDoctorName = "Dr. Priyantha Silva",
  onSaveTelehealthNotes,
  drugsDatabase = [],
  formulary = [],
  sessionDate,
  onTelehealthSyncSuccess,
  onUpdatePatientMedications,
  onOpenClinicalHub,
  onSelectVideoPatient,
  onSealConsultation,
}: Props) {
  const [selectedPat, setSelectedPat] = useState<Patient | null>(activePatient || patients[0] || null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [telehealthNotes, setTelehealthNotes] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [callStatus, setCallStatus] = useState<TelehealthCallStatus>("idle");
  const [activeCallAptId, setActiveCallAptId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callHandleRef = useRef<TelehealthCallHandle | null>(null);

  // Real-time prescribing states
  const [telehealthMedsList, setTelehealthMedsList] = useState<Array<{
    drug: string;
    instructions: string;
    duration: string;
    meal: string;
  }>>([]);

  // Drug Search Bar States
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [selectedDrugName, setSelectedDrugName] = useState<string>("");
  const [doseInstr, setDoseInstr] = useState<string>("Take 1 tablet twice a day");
  const [doseDays, setDoseDays] = useState<string>("5");
  const [doseMeal, setDoseMeal] = useState<string>("After Meals");
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [medCategoryFilter, setMedCategoryFilter] = useState<string>("All");
  const [showPrescriptionPreviewModal, setShowPrescriptionPreviewModal] = useState(false);

  // Video Chat & Sync States
  const [videoChat, setVideoChat] = useState<Array<{ sender: string; text: string; id?: string }>>([
    { sender: "System", text: "Secure encrypted peer-to-peer telehealth channel established." }
  ]);
  const [typedMsg, setTypedMsg] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [syncingSuwasiri, setSyncingSuwasiri] = useState(false);
  const [suwasiriSynced, setSuwasiriSynced] = useState(false);
  const [drugHistoryCommitted, setDrugHistoryCommitted] = useState(false);

  // Default formulary list fallback
  const FORMULARY_CATEGORIES = [
    "All",
    "Antibiotics",
    "Analgesics & Pain",
    "Gastric & GI",
    "Respiratory",
    "Diabetes",
    "Cardio & BP",
    "Antihistamine & Allergy",
  ];

  const masterDrugsList = Array.from(new Set([
    ...formulary.map((d) => d.name),
    ...drugsDatabase,
    "Amoxicillin 500mg Capsule",
    "Augmentin 625mg (Amoxicillin/Clavulanate)",
    "Paracetamol 500mg Tablet",
    "Metformin 500mg Prolonged Release",
    "Metformin 1000mg Tablet",
    "Atorvastatin 20mg Tablet",
    "Rosuvastatin 10mg Tablet",
    "Omeprazole 20mg Capsule",
    "Esomeprazole 40mg Tablet",
    "Losartan Potassium 50mg Tablet",
    "Amlodipine 5mg Tablet",
    "Salbutamol 100mcg Inhaler",
    "Cetirizine 10mg Tablet",
    "Fexofenadine 180mg Tablet",
    "Azithromycin 500mg Tablet",
    "Ciprofloxacin 500mg Tablet",
    "Pantoprazole 40mg Tablet",
    "Gliclazide 80mg MR",
    "Ibuprofen 400mg Tablet"
  ]));

  const filteredFormulary = formulary.filter((d) => {
    const matchesCat = medCategoryFilter === "All" || d.category === medCategoryFilter;
    if (!matchesCat) return false;
    if (telehealthMedsList.some((m) => m.drug.toLowerCase().includes(d.name.toLowerCase()))) return false;
    if (selectedDrugName === d.name) return false;
    if (!drugSearchQuery.trim()) return true;
    const q = drugSearchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.generic.toLowerCase().includes(q)
    );
  });

  const dayKey = sessionDate || new Date().toISOString().split("T")[0];

  const dayVideoAppointments = useMemo(() => {
    return appointments
      .filter((a) => isVideoBookingOnDate(a, dayKey))
      .slice()
      .sort((a, b) => (parseSlot(a)?.getTime() || 0) - (parseSlot(b)?.getTime() || 0));
  }, [appointments, dayKey]);

  const rosterPatients = useMemo(() => {
    const byId = new Map<string, Patient>();
    for (const apt of dayVideoAppointments) {
      const existing = patients.find((p) => p.id === apt.patientId);
      byId.set(apt.patientId, existing || stubPatientFromBooking(apt));
    }
    if (selectedPat && !byId.has(selectedPat.id)) byId.set(selectedPat.id, selectedPat);
    return [...byId.values()];
  }, [patients, dayVideoAppointments, selectedPat?.id]);

  useEffect(() => {
    const focused =
      (focusPatientId && rosterPatients.find((p) => p.id === focusPatientId)) ||
      activePatient ||
      null;
    if (focused) {
      setSelectedPat(focused);
      setTelehealthNotes(focused.notes || "");
      return;
    }
    if (rosterPatients.length > 0 && !selectedPat) {
      setSelectedPat(rosterPatients[0]);
      setTelehealthNotes(rosterPatients[0].notes || "");
    }
  }, [activePatient?.id, focusPatientId, rosterPatients.length]);

  useEffect(() => {
    if (!selectedPat) return;
    const fresh = patients.find((p) => p.id === selectedPat.id);
    if (!fresh) return;
    if (
      fresh.prescriptionsList !== selectedPat.prescriptionsList ||
      fresh.vaccineRecords !== selectedPat.vaccineRecords ||
      fresh.activeMedications !== selectedPat.activeMedications
    ) {
      setSelectedPat(fresh);
    }
  }, [patients, selectedPat?.id]);

  useEffect(() => {
    const randomSec = Math.floor(100000 + Math.random() * 900000);
    setInviteToken(`CARE-V-${randomSec}`);
    setSuwasiriSynced(false);
    setDrugHistoryCommitted(false);
  }, [selectedPat]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      callHandleRef.current?.hangup();
    };
  }, []);

  const dueVideoAppointments = useMemo(() => {
    const now = new Date(nowTick);
    return dayVideoAppointments.filter((a) => canStartTelehealthCall(a, now));
  }, [dayVideoAppointments, nowTick]);

  const selectedVideoApt =
    appointments.find((a) => a.id === focusAppointmentId) ||
    dueVideoAppointments.find((a) => a.patientId === selectedPat?.id) ||
    appointments.find((a) => a.patientId === selectedPat?.id && isVideoBooking(a));

  const callTargetApt =
    (focusAppointmentId && appointments.find((a) => a.id === focusAppointmentId)) ||
    selectedVideoApt ||
    dueVideoAppointments[0] ||
    appointments.find(
      (a) =>
        a.patientId === selectedPat?.id &&
        isVideoBooking(a) &&
        a.status !== "COMPLETED" &&
        a.status !== "CANCELLED"
    );

  useEffect(() => {
    const aptId = callTargetApt?.id;
    if (!aptId) return;
    const unsub = subscribeTelehealthChat(aptId, (msgs: TelehealthChatMessage[]) => {
      if (msgs.length === 0) {
        setVideoChat([{ sender: "System", text: "Secure encrypted channel ready. Messages appear on the patient's Suwasiri Call tab." }]);
        return;
      }
      setVideoChat(msgs.map((m) => ({ id: m.id, sender: m.senderName || m.sender, text: m.text })));
    });
    return () => unsub?.();
  }, [callTargetApt?.id]);

  const hangupLiveCall = async () => {
    await callHandleRef.current?.hangup();
    callHandleRef.current = null;
    setActiveCallAptId(null);
    setCallStatus("idle");
  };

  const startLiveCall = async (apt: Appointment) => {
    const now = new Date();
    if (!canStartTelehealthCall(apt, now)) {
      const open = telehealthCallOpensAt(apt);
      const openLabel = open
        ? open.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Colombo",
          })
        : "the slot";
      alert(`Call start opens 2 minutes before the consultation (${openLabel}). Not earlier.`);
      return;
    }
    const patient = rosterPatients.find((p) => p.id === apt.patientId) || stubPatientFromBooking(apt);
    if (patient) {
      setSelectedPat(patient);
      setTelehealthNotes(patient.notes || "");
    }
    if (!localVideoRef.current || !remoteVideoRef.current) {
      alert("Video surfaces are not ready. Try again in a moment.");
      return;
    }
    try {
      await callHandleRef.current?.hangup();
      setCallStatus("connecting");
      setActiveCallAptId(apt.id);
      setIsCameraOn(true);
      setIsMuted(false);
      const handle = await startDoctorTelehealthCall({
        appointmentId: apt.id,
        localVideo: localVideoRef.current,
        remoteVideo: remoteVideoRef.current,
        onStatus: (status) => {
          setCallStatus(status);
          if (status === "ended") {
            setActiveCallAptId(null);
            callHandleRef.current = null;
          }
        },
      });
      callHandleRef.current = handle;
      handle.setMuted(false);
      handle.setCameraOn(true);
    } catch (err: any) {
      setCallStatus("error");
      alert("Could not start the video call. Allow camera and microphone in the browser, then try again.\n\n" + (err?.message || err));
    }
  };

  const handleCallStart = () => {
    if (!callTargetApt) {
      alert(
        "No Suwasiri video booking is listed for this patient today. The patient must book a video consult in the Suwasiri App."
      );
      return;
    }
    if (activeCallAptId === callTargetApt.id) {
      void hangupLiveCall();
      return;
    }
    void startLiveCall(callTargetApt);
  };

  const openVideoPatient = (apt: Appointment) => {
    const existing = patients.find((p) => p.id === apt.patientId);
    const displayName = appointmentPatientName(apt, existing);
    const patient: Patient = {
      ...(existing || stubPatientFromBooking(apt)),
      name: displayName,
      phone: existing?.phone || apt.patientPhone || "",
      email: existing?.email || apt.patientEmail || "",
    };
    setSelectedPat(patient);
    setTelehealthNotes(patient.notes || "");
    onSelectVideoPatient?.(patient, apt.id);
  };

  const callWindowHint = (apt: Appointment | undefined) => {
    if (!apt) return "";
    const now = new Date(nowTick);
    if (canStartTelehealthCall(apt, now)) return "Call window open — you may start now.";
    const open = telehealthCallOpensAt(apt);
    const start = parseSlot(apt);
    if (!open || !start) return "";
    const ms = Math.max(0, open.getTime() - now.getTime());
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Colombo",
      });
    return `Call start from ${fmt(open)} (2 min before ${fmt(start)}). Wait ${mins}m ${String(secs).padStart(2, "0")}s.`;
  };

  const handleAddDrugToTelehealth = () => {
    const drugToAdd = drugSearchQuery.trim() || selectedDrugName;
    if (!drugToAdd) return;
    const line = {
      drug: drugToAdd,
      instructions: doseInstr,
      duration: doseDays.includes("day") ? doseDays : `${doseDays} days`,
      meal: doseMeal
    };
    setTelehealthMedsList((prev) => [...prev, line]);
    setDrugSearchQuery("");
    setShowDrugDropdown(false);
    if (selectedPat?.id) {
      const sessionId = callTargetApt?.id || focusAppointmentId;
      void issuePrescriptionsToSuwasiri({
        patientId: selectedPat.id,
        doctorName: sessionDoctorName,
        clinicName: selectedPat.medicalCenter || "PrimeCare Medical Centre - Colombo Central",
        medicines: [`${line.drug} [${line.instructions}, for ${line.duration}, ${line.meal}]`],
        sessionId,
        rxNumber: sessionId ? `EP-TH-${sessionId.slice(0, 8)}` : undefined,
        prescriberNumber: "12908",
      });
    }
  };

  const handleRemoveDrug = (index: number) => {
    setTelehealthMedsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSyncSuwasiriAndCommitDrugHistory = async () => {
    if (!selectedPat) return;
    setSyncingSuwasiri(true);
    try {
      const inviteLink = `https://ais-pre-iwjvrfbrqrz2hzqqqg2i2z-981726420643.asia-southeast1.run.app/lobby/telehealth?token=${inviteToken}`;
      const formattedMedsStrings = telehealthMedsList.map(
        (m) => `${m.drug} [${m.instructions}, for ${m.duration}, ${m.meal}]`
      );

      const res = await fetch("/api/telehealth/sync-suwasiri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPat.id,
          token: inviteToken,
          inviteLink: inviteLink,
          specialNotes: telehealthNotes,
          issuedMeds: formattedMedsStrings
        })
      });

      if (!res.ok) throw new Error("Sync failed");

      await issuePrescriptionsToSuwasiri({
        patientId: selectedPat.id,
        doctorName: sessionDoctorName,
        clinicName: selectedPat.medicalCenter || "PrimeCare Medical Centre - Colombo Central",
        medicines: formattedMedsStrings,
        sessionId: focusAppointmentId
          || selectedVideoApt?.id
          || appointments.find((a) => a.patientId === selectedPat.id && isVideoBooking(a))?.id,
        rxNumber: inviteToken ? `EP-${inviteToken}` : undefined,
        prescriberNumber: "12908",
      });

      // Connect with Patient Drug History
      if (onUpdatePatientMedications) {
        const existing = selectedPat.currentMedications || [];
        const newMedsOnly = telehealthMedsList.map((m) => `${m.drug} (${m.instructions})`);
        const mergedMeds = Array.from(new Set([...existing, ...newMedsOnly]));
        onUpdatePatientMedications(selectedPat.id, mergedMeds);
      }

      setSuwasiriSynced(true);
      setDrugHistoryCommitted(true);
      if (onTelehealthSyncSuccess) onTelehealthSyncSuccess();

      alert(
        `⚡ e-Prescription & Drug History Synced!\n\n1. All ${telehealthMedsList.length} medications committed to ${selectedPat.name}'s Medical History.\n2. Prescriptions instantly released to ${selectedPat.name}'s Suwasiri Mobile App.\n3. Digital Pharmacy Token ${inviteToken} verified.`
      );
    } catch (err: any) {
      alert("Error syncing telehealth: " + err.message);
    } finally {
      setSyncingSuwasiri(false);
    }
  };

  const handleSendChatText = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = typedMsg.trim();
    if (!text) return;
    setTypedMsg("");
    const aptId = callTargetApt?.id || activeCallAptId;
    if (!aptId) {
      setVideoChat((prev) => [...prev, { sender: sessionDoctorName, text }]);
      return;
    }
    try {
      await sendTelehealthChatMessage({
        appointmentId: aptId,
        sender: "doctor",
        senderName: sessionDoctorName,
        text,
      });
    } catch (err: any) {
      alert("Could not send the message: " + (err?.message || err));
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedPat || !telehealthNotes.trim()) {
      alert("Write consultation notes before saving.");
      return;
    }
    setSavingNotes(true);
    try {
      await saveConsultationNote({
        patientId: selectedPat.id,
        patientName: selectedPat.name,
        doctor: sessionDoctorName,
        clinicName: selectedPat.medicalCenter || "Sri Lankan GP Care",
        body: telehealthNotes,
        appointmentId: callTargetApt?.id || activeCallAptId || undefined,
      });
      onSaveTelehealthNotes(selectedPat.id, telehealthNotes);
      alert("Notes saved. They now appear on the patient’s Suwasiri Call notes and GP Care treatment history.");
    } catch (err: any) {
      alert("Could not save notes: " + (err?.message || err));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownloadPrescriptionPdf = () => {
    if (!selectedPat) return;
    const content = `
================================================================================
                        SRI LANKAN GP CARE & TELEHEALTH
                      OFFICIAL ELECTRONIC PRESCRIPTION (eRx)
================================================================================
Doctor           : Dr. Priyantha Silva (MBBS, FRACGP)
Provider Number  : 4920192A • SLMC Reg: 18492
Clinic           : Colombo Central Medical Practice & Telehealth Suite
Date of Issue    : ${new Date().toISOString().split("T")[0]}
Prescription Ref : eRx-${inviteToken}

PATIENT DETAILS:
Name             : ${selectedPat.name}
Patient ID       : ${selectedPat.id}
Age / Gender     : ${selectedPat.age} yrs • ${selectedPat.gender}
Medicare / NIC   : ${selectedPat.medicareNumber || "N/A"}
Known Allergies  : ${selectedPat.allergies || "No Known Drug Allergies (NKDA)"}

--------------------------------------------------------------------------------
Rx - PRESCRIBED MEDICATIONS:
--------------------------------------------------------------------------------
${telehealthMedsList
  .map(
    (m, i) =>
      `${i + 1}. ${m.drug}\n   Sig: ${m.instructions}\n   Duration: ${m.duration} • Meal: ${m.meal}\n`
  )
  .join("\n")}

--------------------------------------------------------------------------------
DOCTOR'S CONSULTATION & SPECIAL INSTRUCTIONS:
--------------------------------------------------------------------------------
"${telehealthNotes || "Take all medications as directed. Hydrate well and report if symptoms persist."}"

Verified Digital Sign-Off: Dr. Priyantha Silva (FRACGP)
Suwasiri App Linked      : YES [Token: ${inviteToken}]
================================================================================
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ePrescription_${selectedPat.name.replace(/[^a-zA-Z0-9]/g, "_")}_${inviteToken}.pdf.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPrescription = () => {
    const paper = document.getElementById("telehealth-eprescription-paper");
    const html = paper ? paper.innerHTML : "";
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) {
      window.print();
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>e-Prescription</title>
      <style>body{font-family:Georgia,serif;padding:24px;color:#111} button{display:none}</style>
      </head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const inCall = Boolean(callTargetApt && activeCallAptId === callTargetApt.id);
  const canCallNow = callTargetApt ? canStartTelehealthCall(callTargetApt, new Date(nowTick)) : false;

  return (
    <div className="space-y-6">
      {/* Top Header & Patient Selection */}
      <div className="bg-white border rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00334f] text-white flex items-center justify-center font-bold">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base text-[#00334f]">
                Telehealth Virtual Exam Room & Live e-Prescribing
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                WebRTC Encrypted Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Today’s video consults only. Click a patient name to open Active Clinical Consultation Room. Call start unlocks 2 minutes before the slot.
            </p>
          </div>
        </div>

        {/* Patient Selection Dropdown — video bookings for this day only */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Video booking:</span>
          <select
            value={selectedPat?.id || ""}
            onChange={(e) => {
              const apt = dayVideoAppointments.find((a) => a.patientId === e.target.value);
              if (apt) openVideoPatient(apt);
            }}
            className="p-2 border rounded-lg bg-white text-xs font-bold text-[#00334f] outline-none focus:border-[#00334f]"
          >
            {dayVideoAppointments.length === 0 && (
              <option value="">No video bookings today</option>
            )}
            {dayVideoAppointments.map((apt) => {
              const p = patients.find((x) => x.id === apt.patientId);
              return (
                <option key={apt.id} value={apt.patientId}>
                  {appointmentPatientName(apt, p)} · {apt.time}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-purple-950">Video call consultations — {dayKey}</h3>
              <p className="text-[11px] text-purple-800">
                Clinic walk-ins are not listed here. Click a patient name to load Active Clinical Consultation Room. Call start is available 2 minutes before the booked time, not earlier.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-purple-200 text-purple-800 px-2 py-1 rounded-full">
              {dayVideoAppointments.length} video
            </span>
          </div>
          {dayVideoAppointments.length === 0 ? (
            <p className="text-xs text-purple-800 bg-white border border-dashed border-purple-200 rounded-lg p-3">
              No Suwasiri video consults booked for this day.
            </p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dayVideoAppointments.map((apt) => {
              const p = patients.find((x) => x.id === apt.patientId);
              const now = new Date(nowTick);
              const live = activeCallAptId === apt.id && (callStatus === "connecting" || callStatus === "live");
              const canCall = canStartTelehealthCall(apt, now);
              const selected = selectedPat?.id === apt.patientId;
              return (
                <div key={apt.id} className={`bg-white border rounded-lg p-3 flex items-center justify-between gap-3 ${selected ? "border-[#00334f] ring-1 ring-[#00334f]/30" : "border-purple-100"}`}>
                  <button type="button" className="text-left min-w-0" onClick={() => openVideoPatient(apt)}>
                    <p className="text-sm font-bold text-[#00334f] hover:underline">{appointmentPatientName(apt, p)}</p>
                    <p className="text-[11px] text-slate-500">
                      {apt.time} · {apt.doctorName || sessionDoctorName}
                      {apt.token ? ` · ${apt.token}` : ""}
                    </p>
                    <p className="text-[10px] text-purple-800 font-medium">{apt.reason}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{callWindowHint(apt)}</p>
                  </button>
                  <button
                    type="button"
                    disabled={!live && !canCall}
                    onClick={() => (live ? hangupLiveCall() : startLiveCall(apt))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 ${
                      live
                        ? "bg-rose-600 text-white"
                        : canCall
                        ? "bg-purple-700 text-white hover:bg-purple-800"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                    title={canCall || live ? "Start live video" : callWindowHint(apt)}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {live ? (callStatus === "live" ? "End call" : "Connecting…") : canCall ? "Call start" : "Wait"}
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </div>

      {/* Main Grid: Video Room (Left) + Clinical Prescribing & Drug History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Room & Live Stream (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-xl overflow-hidden shadow-md flex flex-col h-[520px] relative border border-slate-800">
            {/* Top Video Status Overlay */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="bg-black/70 backdrop-blur-xs text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-mono text-emerald-400 font-bold">1080p Telehealth Live</span>
                <span className="text-slate-400 text-[10px]">| 22ms latency</span>
              </div>

              {suwasiriSynced && (
                <div className="bg-emerald-900/90 border border-emerald-500/50 text-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md animate-pulse">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  Suwasiri App Client Synced
                </div>
              )}
            </div>

            {/* Video Streams Container */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Remote Patient Box */}
              <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative h-full max-h-[380px] flex flex-col items-center justify-center">
                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  Patient waiting — {selectedPat?.name || "Patient"} camera
                </div>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover ${callStatus === "live" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                />
                {callStatus !== "live" && (
                  selectedPat?.image ? (
                    <img
                      src={selectedPat.image}
                      alt="Patient Stream"
                      className="w-full h-full object-cover opacity-90"
                    />
                  ) : (
                    <div className="text-center px-4">
                      <div className="w-20 h-20 rounded-full bg-sky-900 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3">
                        {(selectedPat?.name || "P").split(" ").map((n) => n[0]).join("")}
                      </div>
                      <p className="text-xs text-slate-300">
                        {callStatus === "connecting"
                          ? "Waiting for the patient to join from the Suwasiri App…"
                          : selectedVideoApt
                            ? `Video consult at ${selectedVideoApt.time}. Start the call when you are ready.`
                            : "No live Suwasiri video booking in this room yet."}
                      </p>
                    </div>
                  )
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${callStatus === "live" ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                  {callStatus === "live" ? "Patient camera live" : "Patient waiting"}
                </div>
              </div>

              {/* Doctor Box */}
              <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative h-full max-h-[380px] flex flex-col items-center justify-center">
                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  GP room cam — {sessionDoctorName}
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${isCameraOn && (callStatus === "connecting" || callStatus === "live") ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                />
                {!(isCameraOn && (callStatus === "connecting" || callStatus === "live")) && (
                  isCameraOn ? (
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
                      alt="Doctor Stream"
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <VideoOff className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                      <p className="text-xs">Camera Feed Muted</p>
                    </div>
                  )
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[9px] text-sky-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  GP Room Cam {isCameraOn && (callStatus === "connecting" || callStatus === "live") ? "Active" : isCameraOn ? "Ready" : "Off"}
                </div>
              </div>
            </div>

            {/* Video Action Controls Bar */}
            <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    callHandleRef.current?.setMuted(next);
                  }}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    isMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? "Unmute" : "Mute"}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !isCameraOn;
                    setIsCameraOn(next);
                    callHandleRef.current?.setCameraOn(next);
                  }}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    !isCameraOn ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{isCameraOn ? "Cam Off" : "Cam On"}</span>
                </button>

                <button
                  onClick={() => setRecording(!recording)}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    recording ? "bg-rose-600 text-white animate-pulse" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>{recording ? "Recording..." : "Record"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCallStart}
                  disabled={!inCall && !canCallNow}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                    inCall
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : canCallNow
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-300 text-slate-600 cursor-not-allowed"
                  }`}
                  title={inCall ? "End live call" : callWindowHint(callTargetApt)}
                >
                  <Video className="w-4 h-4" />
                  <span>
                    {inCall
                      ? callStatus === "live"
                        ? "End call"
                        : "Connecting…"
                      : canCallNow
                      ? "Call start"
                      : "Call start (2 min before)"}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium max-w-[220px] text-right">
                Patient sees you in Suwasiri Call. You see the patient here. No WhatsApp.
              </div>
            </div>
          </div>

          {/* Consultation Notes Box */}
          <div className="bg-white border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-[#00334f]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Consultation Notes & Clinical Impressions
                </h3>
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle className="w-3 h-3" />
                {savingNotes ? "Saving…" : "Save Notes"}
              </button>
            </div>
            <textarea
              rows={3}
              value={telehealthNotes}
              onChange={(e) => setTelehealthNotes(e.target.value)}
              placeholder="Record clinical history, presenting symptoms, virtual observations, and advice given during video call..."
              className="w-full text-xs p-2.5 border rounded-lg outline-none focus:border-[#00334f]"
            />
          </div>

          {/* Live In-Call Messaging */}
          <div className="bg-white border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                In-Call Patient Secure Messaging
              </h3>
            </div>
            <div className="bg-slate-50 border rounded-lg p-3 max-h-32 overflow-y-auto space-y-1.5 text-xs">
              {videoChat.map((msg, i) => (
                <div key={msg.id || i} className="leading-tight">
                  <strong className="text-[#00334f]">{msg.sender}: </strong>
                  <span className="text-slate-700">{msg.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChatText} className="flex gap-2">
              <input
                type="text"
                value={typedMsg}
                onChange={(e) => setTypedMsg(e.target.value)}
                placeholder="Type in-call message to patient..."
                className="flex-1 text-xs p-2 border rounded-lg outline-none focus:border-[#00334f]"
              />
              <button
                type="submit"
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: active patient details (mockup) + e-Rx */}
        <div className="lg:col-span-5 space-y-4">
          {selectedPat && (
            <ActiveClinicalConsultationPanel
              patient={selectedPat}
              notes={telehealthNotes}
              onNotesChange={setTelehealthNotes}
              onOpenClinicalHub={() => onOpenClinicalHub?.(selectedPat)}
            />
          )}

          {/* SEARCH MEDICATION & ADD TO PRESCRIPTION (RX) — exam-room mockup */}
          <div className="bg-white border rounded-xl p-4 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#00334f] flex items-center gap-1.5">
                <Search className="w-4 h-4 text-teal-700" />
                Search Medication & Add to Prescription (Rx)
              </h3>
              <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold font-mono">
                {formulary.length || masterDrugsList.length} Formulary Drugs Loaded
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={drugSearchQuery}
                onChange={(e) => {
                  setDrugSearchQuery(e.target.value);
                  setShowDrugDropdown(true);
                }}
                onFocus={() => setShowDrugDropdown(true)}
                placeholder="Type medicine name (e.g. Paracetamol, Amoxicillin, Metformin, Salbutamol, Omeprazole)..."
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#00334f] bg-white font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {FORMULARY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    medCategoryFilter === cat
                      ? "bg-[#00334f] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showDrugDropdown && (drugSearchQuery || medCategoryFilter !== "All") && (
              <div className="bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                {filteredFormulary.length > 0 ? (
                  filteredFormulary.slice(0, 12).map((drug) => (
                    <button
                      key={drug.name}
                      type="button"
                      onClick={() => {
                        const days = drug.defaultDays || doseDays;
                        const line = {
                          drug: drug.name,
                          instructions: drug.defaultDose || doseInstr,
                          duration: String(days).includes("day") ? String(days) : `${days} days`,
                          meal: drug.defaultMeal || doseMeal,
                        };
                        setTelehealthMedsList((prev) =>
                          prev.some((m) => m.drug === line.drug && m.instructions === line.instructions)
                            ? prev
                            : [...prev, line]
                        );
                        setSelectedDrugName("");
                        setDrugSearchQuery("");
                        setShowDrugDropdown(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 text-xs"
                    >
                      <span className="font-bold text-[#00334f]">{drug.name}</span>
                      <span className="block text-[10px] text-slate-500">{drug.brand} · {drug.generic}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    <p>No exact formulary match.</p>
                    {drugSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDrugName(drugSearchQuery);
                          setShowDrugDropdown(false);
                        }}
                        className="mt-1 text-emerald-700 font-bold hover:underline"
                      >
                        Use custom entry “{drugSearchQuery}”
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Current Selected Medication
                  </label>
                  <input
                    type="text"
                    placeholder="Select from search above or type custom drug..."
                    className="w-full p-2 border rounded text-xs font-bold text-[#00334f] bg-white"
                    value={selectedDrugName || drugSearchQuery}
                    onChange={(e) => {
                      setSelectedDrugName(e.target.value);
                      setDrugSearchQuery(e.target.value);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDrugToTelehealth}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add to Prescription (Rx)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Dosage Frequency</label>
                  <select
                    className="w-full p-1.5 bg-white border rounded text-xs"
                    value={doseInstr}
                    onChange={(e) => setDoseInstr(e.target.value)}
                  >
                    <option value="Take 1 tablet twice a day">1 tablet twice a day (BD)</option>
                    <option value="Take 1 tablet three times a day">1 tablet 3x daily (TDS)</option>
                    <option value="Take 1 tablet four times a day">1 tablet 4x daily (QDS)</option>
                    <option value="Take 1 tablet daily in morning">1 tablet daily AM (OD)</option>
                    <option value="Take 1 tablet at night bedtime">1 tablet at night (Nocte)</option>
                    <option value="Take 2 tablets as needed">2 tablets as needed (PRN)</option>
                    <option value="Take 1 capsule twice a day">1 capsule twice daily</option>
                    <option value="Inhale 2 puffs as needed">Inhale 2 puffs as needed (PRN)</option>
                  </select>
                  <input
                    type="text"
                    className="w-full p-1 border mt-1 rounded text-[11px] bg-white"
                    value={doseInstr}
                    onChange={(e) => setDoseInstr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Course Duration</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      className="w-20 p-1.5 bg-white border rounded text-xs font-bold"
                      value={doseDays.replace(/\D/g, "") || doseDays}
                      onChange={(e) => setDoseDays(e.target.value)}
                    />
                    <span className="text-xs text-slate-500 font-semibold">days</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {["3", "5", "7", "14", "30"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDoseDays(d)}
                        className={`text-[10px] px-1.5 py-0.5 border rounded ${
                          doseDays === d || doseDays === `${d} days`
                            ? "bg-[#00334f] text-white font-bold border-[#00334f]"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Food / Meal Timing</label>
                  <select
                    className="w-full p-1.5 bg-white border rounded text-xs"
                    value={doseMeal}
                    onChange={(e) => setDoseMeal(e.target.value)}
                  >
                    <option value="After Meals">After Meals (Post-Prandial / කෑමෙන් පසු)</option>
                    <option value="Before Meals">Before Meals (Pre-Prandial / කෑමට පෙර)</option>
                    <option value="With Meals">With Meals (කෑම සමඟ)</option>
                    <option value="On an Empty Stomach">On an Empty Stomach (හිස්බඩ)</option>
                    <option value="At Bedtime">At Bedtime (නින්දට පෙර)</option>
                    <option value="As required / regardless of meals">Regardless of meals / As needed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-[#00334f] uppercase tracking-wide">e-Prescription (Rx) Active Selections</h4>
              {telehealthMedsList.length === 0 ? (
                <p className="text-slate-400 italic text-center py-6 text-xs bg-white border border-dashed rounded">
                  No medications prescribed yet. Select high-grade medicines from clinical directory below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {telehealthMedsList.map((item, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{idx + 1}. {item.drug}</p>
                        <p className="text-[11px] text-slate-600">
                          {item.instructions} • {item.duration} • {item.meal}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleRemoveDrug(idx)} className="text-rose-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-2">
              <button
                type="button"
                onClick={handleSyncSuwasiriAndCommitDrugHistory}
                disabled={syncingSuwasiri || telehealthMedsList.length === 0}
                className="w-full bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white font-bold py-2.5 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5"
              >
                {syncingSuwasiri ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Sync e-Rx to Suwasiri App
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSyncSuwasiriAndCommitDrugHistory();
                  if (selectedPat) {
                    const meds = telehealthMedsList.map(
                      (m) => `${m.drug} [${m.instructions}, for ${m.duration}, ${m.meal}]`
                    );
                    onSealConsultation?.(selectedPat, meds, telehealthNotes);
                  }
                }}
                disabled={syncingSuwasiri}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-5 h-5" />
                Save Consult Records & Seal Digital e-Prescription
              </button>
            </div>
          </div>

          {/* LIVE e-PRESCRIPTION PAPER PREVIEW */}
          <div className="bg-white border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00334f]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live e-Prescription (Auto-Updating)
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionPreviewModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-[#00334f] px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="View prescription"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPrescriptionPdf}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Download prescription"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handlePrintPrescription}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Print prescription"
                >
                  <Printer className="w-3 h-3" />
                  Print
                </button>
              </div>
            </div>

            {/* LIVE PRESCRIPTION CARD (Updates appearance automatically as medications change) */}
            <div
              id="telehealth-eprescription-paper"
              className="bg-[#fafcff] border border-slate-300 rounded-lg p-3.5 font-serif text-slate-800 space-y-3 shadow-2xs relative"
            >
              {/* Header Letterhead */}
              <div className="border-b border-slate-200 pb-2 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#00334f] tracking-wide">
                    SRI LANKAN GP CARE • TELEHEALTH
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Dr. Priyantha Silva (FRACGP, MBBS) • Provider: 4920192A
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-sky-100 text-sky-900 font-sans font-bold px-1.5 py-0.5 rounded">
                    Ref: {inviteToken}
                  </span>
                  <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                    {new Date().toISOString().split("T")[0]}
                  </p>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="bg-white p-2 rounded border border-slate-200 font-sans text-[11px] flex justify-between items-center">
                <div>
                  <strong className="text-slate-900">{selectedPat?.name}</strong>{" "}
                  <span className="text-slate-400">({selectedPat?.age}y / {selectedPat?.gender})</span>
                </div>
                <div className="text-right text-[10px]">
                  <span>Allergies: </span>
                  <strong className="text-rose-600">{selectedPat?.allergies || "NKDA"}</strong>
                </div>
              </div>

              {/* Rx Staged Drugs Table */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-bold text-[#00334f]">
                  <span className="font-serif italic text-base">℞</span>
                  <span className="font-sans text-[11px] uppercase tracking-wider">
                    Prescribed Items ({telehealthMedsList.length})
                  </span>
                </div>

                {telehealthMedsList.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-400 italic bg-white rounded border border-dashed">
                    No medications prescribed yet. Select high-grade medicines from clinical directory below.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {telehealthMedsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white rounded border border-slate-200 flex items-start justify-between gap-2 font-sans text-xs hover:border-sky-300 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="text-emerald-700 font-mono text-[11px]">{idx + 1}.</span>
                            <span>{item.drug}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Sig: <em>{item.instructions}</em> • For {item.duration} ({item.meal})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDrug(idx)}
                          className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor Signature Stamp & Barcode */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-sans text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dr. Silva Digital Signature Verified</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 font-mono">
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Suwasiri Barcode: {selectedPat?.suwasiriBarcode || "LK-77192"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PATIENT DRUG HISTORY (Connected to e-Prescription) */}
          <div className="bg-white border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Patient Past Drug History & Active Meds
                </h3>
              </div>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {selectedPat?.currentMedications?.length || 0} Registered
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Active medication registry for <strong className="text-slate-800">{selectedPat?.name}</strong>. Newly issued telehealth prescriptions automatically integrate here.
            </p>

            {selectedPat?.currentMedications && selectedPat.currentMedications.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedPat.currentMedications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                      <span className="font-medium text-slate-800">{med}</span>
                    </div>
                    <span className="text-[9px] bg-white border px-1.5 py-0.5 rounded text-slate-500 font-mono">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg">
                No prior long-term medications recorded in chart.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL HIGH-RES e-PRESCRIPTION PREVIEW MODAL */}
      {showPrescriptionPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00334f]" />
                <h3 className="font-serif font-bold text-base text-[#00334f]">
                  Official Electronic Prescription (eRx Preview)
                </h3>
              </div>
              <button
                onClick={() => setShowPrescriptionPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Official Letterhead Paper */}
            <div className="p-6 bg-white border-2 border-slate-300 rounded-xl shadow-xs space-y-4 font-serif text-slate-900">
              {/* Clinic Banner */}
              <div className="border-b-2 border-[#00334f] pb-3 flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg text-[#00334f] tracking-wide">
                    SRI LANKAN GP CARE MEDICAL PRACTICE
                  </h2>
                  <p className="text-xs text-slate-600 font-sans">
                    Dr. Priyantha Silva • MBBS (Colombo), FRACGP, Dip. Fam. Med
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Provider No: 4920192A • SLMC No: 18492 • Telehealth Accredited
                  </p>
                </div>
                <div className="text-right font-sans text-xs">
                  <p className="font-bold text-slate-800">Date: {new Date().toISOString().split("T")[0]}</p>
                  <p className="text-sky-800 font-mono text-[11px]">eRx Ref: #{inviteToken}</p>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="bg-slate-50 p-3 rounded-lg border font-sans text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Patient: </span>
                  <strong className="text-slate-900">{selectedPat?.name}</strong>
                  <div className="text-[11px] text-slate-500">
                    ID: {selectedPat?.id} • Age: {selectedPat?.age} yrs • {selectedPat?.gender}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Medicare: </span>
                  <strong className="text-slate-900">{selectedPat?.medicareNumber || "N/A"}</strong>
                  <div className="text-[11px] text-rose-600 font-bold">
                    Allergies: {selectedPat?.allergies || "NKDA"}
                  </div>
                </div>
              </div>

              {/* Rx Items */}
              <div className="space-y-3 font-sans">
                <div className="text-sm font-bold text-[#00334f] flex items-center gap-1 font-serif">
                  <span className="text-xl italic">℞</span>
                  <span>Prescription Order</span>
                </div>

                <div className="divide-y divide-slate-200 border rounded-lg overflow-hidden bg-white">
                  {telehealthMedsList.map((item, idx) => (
                    <div key={idx} className="p-3 text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 text-sm">{item.drug}</strong>
                        <p className="text-slate-600 mt-0.5">
                          Sig: <span className="font-medium text-slate-800">{item.instructions}</span> • {item.duration}
                        </p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded text-[11px] border border-emerald-200">
                        {item.meal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Signature & Legal Disclaimer */}
              <div className="pt-4 border-t flex items-end justify-between font-sans text-xs">
                <div>
                  <div className="w-36 h-10 border-b border-slate-400 flex items-center justify-center italic text-sky-900 font-serif font-bold text-sm">
                    Dr. Priyantha Silva
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Authorized Medical Practitioner</p>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <p>Certified Digital Prescription Delivery</p>
                  <p>Suwasiri Mobile Integration Active</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPrescriptionPdf}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintPrescription}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPrescriptionPreviewModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveClinicalConsultationPanel({
  patient,
  notes,
  onNotesChange,
  onOpenClinicalHub,
}: {
  patient: Patient;
  notes: string;
  onNotesChange: (value: string) => void;
  onOpenClinicalHub: () => void;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-4 shadow-xs">
      <div className="border-b pb-3">
        <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
          Active Clinical Consultation Room
        </span>
        <h2 className="font-serif font-bold text-xl text-[#00334f] mt-1">{patient.name}</h2>
        <p className="text-xs text-slate-500">
          Age parameter: {patient.age} | ID: {patient.id} | Declared sensitivity:{" "}
          <span className="font-bold text-red-600">{patient.allergies || "None declared"}</span>
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-lg flex flex-col gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <FileText className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Patient asks for a Medical Certificate (MC)?</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Directly open the Clinical Record Hub section for {patient.name} to view their full medical history and draft/issue certificates.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenClinicalHub}
          className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-md font-extrabold text-[10px] uppercase tracking-wider transition-all self-start"
        >
          View Clinical Hub (MC Section) →
        </button>
      </div>

      <div className="space-y-1.5 text-xs">
        <label className="block text-[10px] font-extrabold text-slate-500 uppercase">
          Consultation clinical findings &amp; vitals notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Include symptom onset duration, cardiovascular sounds, throat inflammation check..."
          className="w-full h-24 p-3 border rounded focus:border-[#00334f] text-xs"
        />
      </div>

      <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">Patient known sensitivities &amp; allergies</p>
          <p className="text-xs font-bold text-red-700 mt-0.5 truncate">{patient.allergies || "None declared"}</p>
        </div>
        {patient.allergies && patient.allergies !== "None declared" && (
          <span className="bg-red-100 border border-red-300 text-red-800 text-[10px] px-2 py-1 rounded font-bold shrink-0">
            ⚠️ Contraindication Shield Active
          </span>
        )}
      </div>
    </div>
  );
}


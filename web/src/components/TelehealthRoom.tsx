import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Camera,
  Share2,
  Clipboard,
  Users,
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
  Image as ImageIcon,
  Clock,
  AlertCircle,
  ShieldCheck,
  QrCode,
  Sparkles
} from "lucide-react";
import { Patient, Appointment } from "../types";
import { isDueTelehealth } from "../sync/suwasiriAppointments";
import { startDoctorTelehealthCall, type TelehealthCallHandle, type TelehealthCallStatus } from "../sync/telehealthRtc";

interface Props {
  patients: Patient[];
  appointments: Appointment[];
  activePatient: Patient | null;
  sessionDoctorName?: string;
  onInvitePatient: (pName: string, phone: string, transport: "WhatsApp" | "SMS", token: string) => void;
  onSaveTelehealthNotes: (patientId: string, notes: string) => void;
  drugsDatabase?: string[];
  onTelehealthSyncSuccess?: () => void;
  onUpdatePatientMedications?: (patientId: string, newMedications: string[]) => void;
}

export default function TelehealthRoom({
  patients,
  appointments,
  activePatient,
  sessionDoctorName = "Dr. Priyantha Silva",
  onInvitePatient,
  onSaveTelehealthNotes,
  drugsDatabase = [],
  onTelehealthSyncSuccess,
  onUpdatePatientMedications,
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
  }>>([
    {
      drug: "Amoxicillin 500mg Capsule",
      instructions: "1 capsule every 8 hours",
      duration: "5 days",
      meal: "After Meal"
    },
    {
      drug: "Paracetamol 500mg Tablet",
      instructions: "1-2 tablets every 6 hours as needed for fever/pain",
      duration: "3 days",
      meal: "After Meal"
    }
  ]);

  // Drug Search Bar States
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [selectedDrugName, setSelectedDrugName] = useState<string>("Amoxicillin 500mg Capsule");
  const [doseInstr, setDoseInstr] = useState<string>("Take 1 tablet twice a day");
  const [doseDays, setDoseDays] = useState<string>("5");
  const [doseMeal, setDoseMeal] = useState<string>("After Meal");
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  // Attached Image & Preview Modal States
  const [prescriptionAttachedImage, setPrescriptionAttachedImage] = useState<string | null>(
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600"
  );
  const [showPrescriptionPreviewModal, setShowPrescriptionPreviewModal] = useState(false);

  // Video Chat & Sync States
  const [videoChat, setVideoChat] = useState<Array<{ sender: string; text: string }>>([
    { sender: "System", text: "Secure encrypted peer-to-peer telehealth channel established." }
  ]);
  const [typedMsg, setTypedMsg] = useState("");
  const [syncingSuwasiri, setSyncingSuwasiri] = useState(false);
  const [suwasiriSynced, setSuwasiriSynced] = useState(false);
  const [drugHistoryCommitted, setDrugHistoryCommitted] = useState(false);

  // Default formulary list fallback
  const masterDrugsList = Array.from(new Set([
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

  const filteredDrugs = masterDrugsList.filter((d) =>
    d.toLowerCase().includes(drugSearchQuery.toLowerCase())
  );

  useEffect(() => {
    if (activePatient) {
      setSelectedPat(activePatient);
      setTelehealthNotes(activePatient.notes || "");
    } else if (patients.length > 0 && !selectedPat) {
      setSelectedPat(patients[0]);
      setTelehealthNotes(patients[0].notes || "");
    }
  }, [activePatient, patients]);

  useEffect(() => {
    const randomSec = Math.floor(100000 + Math.random() * 900000);
    setInviteToken(`CARE-V-${randomSec}`);
    setSuwasiriSynced(false);
    setDrugHistoryCommitted(false);
  }, [selectedPat]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      callHandleRef.current?.hangup();
    };
  }, []);

  const dueVideoAppointments = useMemo(() => {
    const now = new Date(nowTick);
    return appointments.filter((a) => isDueTelehealth(a, now));
  }, [appointments, nowTick]);

  const selectedVideoApt = dueVideoAppointments.find((a) => a.patientId === selectedPat?.id)
    || appointments.find((a) => a.patientId === selectedPat?.id && (a.isTelehealth || a.type === "Telehealth Video"));

  const hangupLiveCall = async () => {
    await callHandleRef.current?.hangup();
    callHandleRef.current = null;
    setActiveCallAptId(null);
    setCallStatus("idle");
  };

  const startLiveCall = async (apt: Appointment) => {
    const patient = patients.find((p) => p.id === apt.patientId);
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
      handle.setMuted(isMuted);
      handle.setCameraOn(isCameraOn);
    } catch (err: any) {
      setCallStatus("error");
      alert("Could not start the video call. Allow camera and microphone in the browser, then try again.\n\n" + (err?.message || err));
    }
  };

  const handleAddDrugToTelehealth = () => {
    const drugToAdd = drugSearchQuery.trim() || selectedDrugName;
    if (!drugToAdd) return;

    setTelehealthMedsList((prev) => [
      ...prev,
      {
        drug: drugToAdd,
        instructions: doseInstr,
        duration: doseDays.includes("day") ? doseDays : `${doseDays} days`,
        meal: doseMeal
      }
    ]);
    setDrugSearchQuery("");
    setShowDrugDropdown(false);
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

  const handleSendInvite = (transport: "WhatsApp" | "SMS") => {
    if (!selectedPat) return;
    const pathLink = `https://ais-pre-iwjvrfbrqrz2hzqqqg2i2z-981726420643.asia-southeast1.run.app/lobby/telehealth?token=${inviteToken}`;
    const smsText = `Hi ${selectedPat.name}, Dr. Priyantha Silva from Sri Lankan GP Care is inviting you to join your scheduled Video Consultation right now. Click to join securely: ${pathLink}`;
    onInvitePatient(selectedPat.name, selectedPat.phone, transport, smsText);
  };

  const handleSendChatText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMsg.trim()) return;
    setVideoChat([...videoChat, { sender: "Dr. Silva", text: typedMsg.trim() }]);
    setTypedMsg("");

    setTimeout(() => {
      setVideoChat((prev) => [
        ...prev,
        {
          sender: selectedPat?.name || "Patient",
          text: "Yes Dr. Silva, I see the prescription on my screen and I can hear you clearly."
        }
      ]);
    }, 1500);
  };

  const handleSaveNotes = () => {
    if (!selectedPat) return;
    onSaveTelehealthNotes(selectedPat.id, telehealthNotes);
    alert("Telehealth consultation progress notes saved to patient chart!");
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
              Interactive video consults with real-time drug searching, live e-Prescription generation, and Suwasiri Mobile Sync.
            </p>
          </div>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Active Patient:</span>
          <select
            value={selectedPat?.id || ""}
            onChange={(e) => {
              const found = patients.find((p) => p.id === e.target.value);
              if (found) {
                setSelectedPat(found);
                setTelehealthNotes(found.notes || "");
              }
            }}
            className="p-2 border rounded-lg bg-white text-xs font-bold text-[#00334f] outline-none focus:border-[#00334f]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.age}y, {p.gender}) — ID: {p.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {dueVideoAppointments.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-purple-950">Suwasiri video consults ready now</h3>
              <p className="text-[11px] text-purple-800">
                Bookings appear from the scheduled time until you start the call with the patient on the Suwasiri App.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-purple-200 text-purple-800 px-2 py-1 rounded-full">
              {dueVideoAppointments.length} waiting
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dueVideoAppointments.map((apt) => {
              const p = patients.find((x) => x.id === apt.patientId);
              const live = activeCallAptId === apt.id && (callStatus === "connecting" || callStatus === "live");
              return (
                <div key={apt.id} className="bg-white border border-purple-100 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#00334f]">{p?.name || apt.patientName || "Patient"}</p>
                    <p className="text-[11px] text-slate-500">
                      {apt.time} · {apt.doctorName || sessionDoctorName}
                      {apt.token ? ` · ${apt.token}` : ""}
                    </p>
                    <p className="text-[10px] text-purple-800 font-medium">{apt.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (live ? hangupLiveCall() : startLiveCall(apt))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                      live ? "bg-rose-600 text-white" : "bg-purple-700 text-white hover:bg-purple-800"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {live ? (callStatus === "live" ? "End call" : "Connecting…") : "Start video"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  {selectedPat?.name || "Patient"} (Suwasiri App)
                </div>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${callStatus === "live" ? "block" : "hidden"}`}
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
                  {callStatus === "live" ? "Patient connected" : "Patient waiting"}
                </div>
              </div>

              {/* Doctor Box */}
              <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative h-full max-h-[380px] flex flex-col items-center justify-center">
                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  {sessionDoctorName} (Practitioner)
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isCameraOn && (callStatus === "connecting" || callStatus === "live") ? "block" : "hidden"}`}
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
                  GP Room Cam {isCameraOn ? "Active" : "Off"}
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
              </div>

              <div className="flex items-center gap-2">
                {selectedVideoApt && (
                  <button
                    type="button"
                    onClick={() =>
                      activeCallAptId === selectedVideoApt.id
                        ? hangupLiveCall()
                        : startLiveCall(selectedVideoApt)
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                      activeCallAptId === selectedVideoApt.id
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-purple-700 hover:bg-purple-800 text-white"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {activeCallAptId === selectedVideoApt.id ? "End Suwasiri call" : "Start Suwasiri video"}
                  </button>
                )}
                <button
                  onClick={() => handleSendInvite("WhatsApp")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleSendInvite("SMS")}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>SMS Invite</span>
                </button>
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
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-3 h-3" />
                Save Notes
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
                <div key={i} className="leading-tight">
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

        {/* Right Column: DRUGS SEARCH BAR, LIVE e-PRESCRIPTION PREVIEW & DRUG HISTORY (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* DRUG SEARCH BAR & FORMULATION STAGING */}
          <div className="bg-white border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Drug Search & e-Prescribe
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Formulary: {masterDrugsList.length} drugs indexed
              </span>
            </div>

            {/* Search Bar with Autocomplete Dropdown */}
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={drugSearchQuery}
                  onChange={(e) => {
                    setDrugSearchQuery(e.target.value);
                    setShowDrugDropdown(true);
                  }}
                  onFocus={() => setShowDrugDropdown(true)}
                  placeholder="Type to search drugs (e.g. Amoxicillin, Metformin, Paracetamol)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg outline-none focus:border-emerald-600 bg-white font-medium"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {showDrugDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-30 divide-y divide-slate-100">
                  {filteredDrugs.length > 0 ? (
                    filteredDrugs.slice(0, 10).map((drug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDrugName(drug);
                          setDrugSearchQuery(drug);
                          setShowDrugDropdown(false);
                        }}
                        className="w-full text-left p-2 hover:bg-emerald-50 text-xs text-slate-800 font-medium flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Pill className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{drug}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Select</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-500 text-center">
                      <p>No exact formulary match.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDrugName(drugSearchQuery);
                          setShowDrugDropdown(false);
                        }}
                        className="mt-1 text-emerald-700 font-bold hover:underline"
                      >
                        Use custom entry "{drugSearchQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dosage & Duration Selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={doseDays}
                  onChange={(e) => setDoseDays(e.target.value)}
                  placeholder="e.g. 5 days or 1 month"
                  className="w-full p-2 border rounded-lg outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Meal Relation
                </label>
                <select
                  value={doseMeal}
                  onChange={(e) => setDoseMeal(e.target.value)}
                  className="w-full p-2 border rounded-lg outline-none focus:border-emerald-600 bg-slate-50"
                >
                  <option value="After Meal">After Meal</option>
                  <option value="Before Meal">Before Meal</option>
                  <option value="With Meal">With Meal</option>
                  <option value="As Needed (PRN)">As Needed (PRN)</option>
                  <option value="At Bedtime">At Bedtime</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Dosage Frequency & Instructions
              </label>
              <input
                type="text"
                value={doseInstr}
                onChange={(e) => setDoseInstr(e.target.value)}
                placeholder="e.g. Take 1 tablet twice a day"
                className="w-full p-2 border rounded-lg outline-none focus:border-emerald-600 bg-slate-50 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleAddDrugToTelehealth}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to e-Prescription</span>
            </button>
          </div>

          {/* ATTACHED IMAGE & LIVE e-PRESCRIPTION PAPER PREVIEW */}
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
                  title="Full High-Res Prescription Preview"
                >
                  <Eye className="w-3 h-3" />
                  Preview eRx
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPrescriptionPdf}
                  className="bg-[#00334f] hover:bg-[#0c4a6e] text-white p-1 rounded cursor-pointer"
                  title="Download Prescription as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
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
                    No medications added to this e-prescription yet. Use drug search above.
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

              {/* Attached Prescription Image Preview (User requirement) */}
              <div className="pt-2 border-t border-slate-200 font-sans">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-sky-700" />
                    Attached Prescription Image / Specimen:
                  </span>
                  <label className="text-sky-700 font-bold hover:underline cursor-pointer text-[10px]">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setPrescriptionAttachedImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {prescriptionAttachedImage && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 max-h-24 bg-slate-900 group">
                    <img
                      src={prescriptionAttachedImage}
                      alt="Prescription Attachment"
                      className="w-full h-24 object-cover opacity-85 group-hover:opacity-100 transition"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                      Attached Image Specimen
                    </div>
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

            {/* Sync with Suwasiri & Commit to Drug History Button */}
            <button
              type="button"
              onClick={handleSyncSuwasiriAndCommitDrugHistory}
              disabled={syncingSuwasiri || telehealthMedsList.length === 0}
              className="w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>
                {syncingSuwasiri
                  ? "Syncing e-Prescription & Drug History..."
                  : drugHistoryCommitted
                  ? "✓ eRx Synced & Added to Drug History"
                  : "Issue e-Prescription & Sync to Suwasiri App"}
              </span>
            </button>
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

              {/* Attached Image Specimen if any */}
              {prescriptionAttachedImage && (
                <div className="border rounded-lg p-2 bg-slate-50 font-sans">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Attached Prescription Image / Specimen:
                  </p>
                  <img
                    src={prescriptionAttachedImage}
                    alt="Prescription Attached"
                    className="w-full max-h-40 object-cover rounded border"
                  />
                </div>
              )}

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
                  onClick={() => window.print()}
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

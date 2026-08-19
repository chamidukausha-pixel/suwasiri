import React, { useState } from "react";
import { 
  User, Calendar, Clock, Pill, AlertTriangle, Syringe, FlaskConical, FileText, 
  ShieldCheck, MessageSquare, Video, CheckCircle, ChevronRight, Search, 
  MapPin, Plus, Lock, Smartphone, Mail, Sparkles, Check, RefreshCw, X, Eye, 
  Share2, ArrowRight, Bell, Shield, HeartPulse, CreditCard
} from "lucide-react";
import { Patient, Appointment, LabResult, PrescriptionRecord, VaccineRecord, RecallRecord, ClinicMessage } from "../types";

interface Props {
  patient: Patient;
  patientsList: Patient[];
  appointments: Appointment[];
  recalls: RecallRecord[];
  onBookAppointment: (apt: Partial<Appointment>) => void;
  onCancelAppointment: (aptId: string) => void;
  onSendMessage: (msg: Partial<ClinicMessage>) => void;
  onUpdatePatientDetails?: (updatedPatient: Patient) => void;
  onLaunchTelehealth?: (apt: Appointment) => void;
  onSelectPatient?: (patient: Patient) => void;
  onOpenGpExam?: (patient: Patient) => void;
  onOpenDoctorClinicalRecord?: (patient: Patient) => void;
}

export default function PatientPortalView({
  patient,
  patientsList,
  appointments,
  recalls,
  onBookAppointment,
  onCancelAppointment,
  onSendMessage,
  onUpdatePatientDetails,
  onLaunchTelehealth,
  onSelectPatient,
  onOpenGpExam,
  onOpenDoctorClinicalRecord
}: Props) {
  const [activePatientTab, setActivePatientTab] = useState<
    "dashboard" | "appointments" | "records" | "medications" | "pathology" | "imaging" | "vaccines" | "recalls" | "profile" | "messages"
  >("dashboard");

  // Live Patient Search Overlay State
  const [portalSearchQuery, setPortalSearchQuery] = useState("");
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState("Dr. Priyantha Silva (FRACGP, MBBS)");
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState("10:30 AM");
  const [bookingType, setBookingType] = useState<Appointment["type"]>("Standard GP Consult");
  const [bookingReason, setBookingReason] = useState("Regular follow-up & prescription renewal");
  const [isTelehealthBooking, setIsTelehealthBooking] = useState(false);
  const [requestWaitlist, setRequestWaitlist] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Message compose state
  const [msgSubject, setMsgSubject] = useState("Prescription Refill Request");
  const [msgBody, setMsgBody] = useState("");

  // Profile Edit States
  const [editMedicare, setEditMedicare] = useState(patient.medicareNumber || "2847 9102 31");
  const [editMedicareRef, setEditMedicareRef] = useState(patient.medicareRefNumber || "1");
  const [editIhi, setEditIhi] = useState(patient.ihiNumber || "8003 6088 3312 9014");
  const [editEmergencyName, setEditEmergencyName] = useState(patient.emergencyContactName || "Tariq Zahra");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(patient.emergencyContactPhone || "+94 77 982 1100");
  const [editNextOfKin, setEditNextOfKin] = useState(patient.nextOfKinName || "Tariq Zahra (Spouse)");
  const [editPreferredGp, setEditPreferredGp] = useState(patient.preferredGp || "Dr. Priyantha Silva");
  const [editConsentSms, setEditConsentSms] = useState(patient.consentSmsReminder ?? true);
  const [editConsentMhr, setEditConsentMhr] = useState(patient.consentMyHealthRecordUpload ?? true);

  const myAppointments = appointments.filter(a => a.patientId === patient.id);
  const upcomingAppointments = myAppointments.filter(a => a.status === "SCHEDULED" || a.status === "CHECKED IN");
  const pastAppointments = myAppointments.filter(a => a.status === "COMPLETED" || a.status === "CANCELLED");
  const myRecalls = recalls.filter(r => r.patientId === patient.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    onBookAppointment({
      patientId: patient.id,
      date: bookingDate,
      time: bookingTime,
      reason: bookingReason,
      type: bookingType,
      status: "SCHEDULED",
      doctorName: bookingDoctor,
      isTelehealth: isTelehealthBooking,
      waitingListRequested: requestWaitlist
    });

    setShowBookingModal(false);
    showToast(`Appointment confirmed with ${bookingDoctor} on ${bookingDate} at ${bookingTime}`);
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) return;

    onSendMessage({
      sender: patient.name,
      senderRole: "Patient",
      channel: "Patient Portal",
      isPatientMessage: true,
      patientId: patient.id,
      subject: msgSubject,
      text: msgBody,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });

    setMsgBody("");
    showToast("Message sent securely to the clinical care team.");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Patient = {
      ...patient,
      medicareNumber: editMedicare,
      medicareRefNumber: editMedicareRef,
      ihiNumber: editIhi,
      emergencyContactName: editEmergencyName,
      emergencyContactPhone: editEmergencyPhone,
      nextOfKinName: editNextOfKin,
      preferredGp: editPreferredGp,
      consentSmsReminder: editConsentSms,
      consentMyHealthRecordUpload: editConsentMhr
    };

    if (onUpdatePatientDetails) {
      onUpdatePatientDetails(updated);
    }
    showToast("Personal health & Medicare profile updated successfully.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00334f] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Patient Portal Header Banner */}
      <div className="bg-gradient-to-r from-[#00334f] via-[#0c4a6e] to-[#0369a1] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 p-1 backdrop-blur-xs shrink-0 flex items-center justify-center text-white text-xl font-black">
              {patient.image ? (
                <img src={patient.image} alt={patient.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                patient.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold">{patient.name}</h1>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  MFA Verified
                </span>
                <span className="text-[10px] bg-sky-300/20 text-sky-200 font-bold px-2 py-0.5 rounded-full border border-sky-300/30">
                  IHI: {patient.ihiNumber || "8003 6088 3312 9014"}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-1">
                {patient.gender}, {patient.age} yrs • DOB: {patient.dateOfBirth || "1974-06-15"} • Medicare: {patient.medicareNumber || "2847 9102 31"} [{patient.medicareRefNumber || "1"}] • Preferred GP: {patient.preferredGp || "Dr. Priyantha Silva"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => setActivePatientTab("messages")}
              className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-xs cursor-pointer transition-all"
            >
              <MessageSquare className="w-4 h-4 text-sky-200" />
              <span>Message Clinic</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE SEARCH OVERLAY & DIRECTORY SWITCHER */}
      <div className="bg-white rounded-xl border border-sky-200 p-3 shadow-xs space-y-2 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#00334f]">Patient Portal Live Search & Cross-Module Switcher</h3>
              <p className="text-[10px] text-slate-500">
                Search by name, ID/NIC, phone, lab tests, ePrescriptions, or allergies with categorized match badges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 border border-blue-200">NAME</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 border border-emerald-200">IDENTITY</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-800 border border-purple-200">LAB</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 border border-teal-200">ERX</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-800 border border-rose-200">ALLERGY</span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={portalSearchQuery}
            onChange={(e) => {
              setPortalSearchQuery(e.target.value);
              setShowSearchOverlay(true);
            }}
            onFocus={() => setShowSearchOverlay(true)}
            placeholder="Type patient name, ID (e.g. 9942-LK), Medicare, phone, drug (e.g. Metformin), lab (e.g. HbA1c), or allergy..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {portalSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setPortalSearchQuery("");
                setShowSearchOverlay(false);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Search Overlay Results Dropdown */}
        {showSearchOverlay && portalSearchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border-2 border-sky-300 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100">
            {(() => {
              const q = portalSearchQuery.toLowerCase().trim();
              const matched = patientsList.map((p) => {
                const matchCategories: string[] = [];
                if (p.name.toLowerCase().includes(q)) matchCategories.push("NAME");
                if (
                  p.id.toLowerCase().includes(q) ||
                  (p.medicareNumber && p.medicareNumber.toLowerCase().includes(q)) ||
                  (p.ihiNumber && p.ihiNumber.toLowerCase().includes(q)) ||
                  (p.phone && p.phone.toLowerCase().includes(q)) ||
                  (p.email && p.email.toLowerCase().includes(q))
                ) {
                  matchCategories.push("IDENTITY");
                }
                if (
                  p.labResults?.some(
                    (l) => l.testName?.toLowerCase().includes(q) || l.result?.toLowerCase().includes(q)
                  )
                ) {
                  matchCategories.push("LAB");
                }
                if (
                  p.activeMedications?.some((m) => m.toLowerCase().includes(q)) ||
                  p.prescriptionsList?.some((pr) => pr.items?.some((it) => it.toLowerCase().includes(q)))
                ) {
                  matchCategories.push("ERX");
                }
                if (p.allergies && p.allergies.toLowerCase().includes(q)) {
                  matchCategories.push("ALLERGY");
                }
                return { patient: p, matchCategories };
              }).filter((item) => item.matchCategories.length > 0);

              if (matched.length === 0) {
                return (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-50">
                    No registered patients found matching "{portalSearchQuery}".
                  </div>
                );
              }

              return matched.map(({ patient: p, matchCategories }) => (
                <div
                  key={p.id}
                  className={`p-3 hover:bg-sky-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    patient.id === p.id ? "bg-sky-50/40" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-slate-900 text-xs font-bold">{p.name}</strong>
                      <span className="font-mono text-[11px] text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded font-bold">
                        {p.id}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({p.age} yrs • {p.gender} • DOB: {p.dateOfBirth || "N/A"})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold">Matched Categories:</span>
                      {matchCategories.map((cat) => (
                        <span
                          key={cat}
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border uppercase tracking-wider ${
                            cat === "NAME"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : cat === "IDENTITY"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : cat === "LAB"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : cat === "ERX"
                              ? "bg-teal-100 text-teal-800 border-teal-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {cat}
                        </span>
                      ))}
                      {p.allergies && (
                        <span className="text-[10px] text-rose-700 font-semibold ml-1">
                          Allergies: {p.allergies}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* One-Click Navigation Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPatient?.(p);
                        setShowSearchOverlay(false);
                        setPortalSearchQuery("");
                      }}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3 h-3" />
                      <span>Switch Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenDoctorClinicalRecord?.(p);
                        setShowSearchOverlay(false);
                        setPortalSearchQuery("");
                      }}
                      className="px-2.5 py-1.5 bg-[#00334f] hover:bg-[#0c4a6e] text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-sky-300" />
                      <span>16-Tab Chart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenGpExam?.(p);
                        setShowSearchOverlay(false);
                        setPortalSearchQuery("");
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <HeartPulse className="w-3 h-3 text-emerald-200" />
                      <span>GP Exam Room</span>
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Patient Portal Secondary Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex flex-wrap gap-1">
        {[
          { id: "dashboard", label: "My Health Dashboard", icon: HeartPulse },
          { id: "appointments", label: "Appointments", icon: Calendar, count: upcomingAppointments.length },
          { id: "records", label: "Medical History", icon: FileText },
          { id: "medications", label: "Active Medications", icon: Pill, count: patient.activeMedications?.length },
          { id: "pathology", label: "Pathology Results", icon: FlaskConical, count: patient.labResults?.length },
          { id: "vaccines", label: "Immunisation Status (AIR)", icon: Syringe, count: patient.vaccineRecords?.length },
          { id: "recalls", label: "Health Reminders", icon: Bell, count: myRecalls.length },
          { id: "profile", label: "Medicare & Personal Details", icon: User },
          { id: "messages", label: "Messages & Requests", icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activePatientTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePatientTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#00334f] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. DASHBOARD */}
      {activePatientTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* Quick Health Alerts banner if any */}
          {patient.allergies && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-900">Declared Medical Allergies</h4>
                  <p className="text-xs text-red-700 font-semibold">{patient.allergies}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                Active Medical Alert
              </span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Upcoming Visits</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{upcomingAppointments.length}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {upcomingAppointments[0] ? `Next: ${upcomingAppointments[0].date} (${upcomingAppointments[0].time})` : "No visits scheduled"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Active Prescriptions</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{patient.activeMedications?.length || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">ePrescription Tokens active</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Pathology Reports</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{patient.labResults?.length || 0}</p>
              <p className="text-[11px] text-sky-600 font-semibold mt-1">All doctor reviewed</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">AIR Vaccinations</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{patient.vaccineRecords?.length || 0}</p>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">Synced with MyGov / AIR</p>
            </div>
          </div>

          {/* Next Upcoming Appointment Focus Card */}
          {upcomingAppointments.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00334f]" />
                  Next Scheduled Appointment
                </h3>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                  Confirmed
                </span>
              </div>

              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{upcomingAppointments[0].reason}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {upcomingAppointments[0].doctorName || "Dr. Priyantha Silva"} • {upcomingAppointments[0].type || "Standard GP Consult"}
                  </p>
                  <p className="text-xs font-bold text-sky-900 mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {upcomingAppointments[0].date} at {upcomingAppointments[0].time}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {upcomingAppointments[0].isTelehealth && (
                    <button
                      onClick={() => onLaunchTelehealth?.(upcomingAppointments[0])}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Telehealth Video</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Reschedule
                  </button>

                  <button
                    onClick={() => {
                      onCancelAppointment(upcomingAppointments[0].id);
                      showToast("Appointment cancelled successfully.");
                    }}
                    className="px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Two column breakdown: Medications & Recent Labs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Medications Preview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#00334f]" />
                  Active Medications & eScripts
                </h3>
                <button
                  onClick={() => setActivePatientTab("medications")}
                  className="text-xs font-bold text-[#00334f] hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {patient.activeMedications && patient.activeMedications.length > 0 ? (
                  patient.activeMedications.map((med, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900">{med}</p>
                        <span className="text-[10px] text-slate-500 font-medium">PBS Subsidy Eligible • Repeated 2x</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        Active Script
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3">No regular medications on file.</p>
                )}
              </div>
            </div>

            {/* Pathology Lab Results Preview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#00334f]" />
                  Recent Pathology Lab Results
                </h3>
                <button
                  onClick={() => setActivePatientTab("pathology")}
                  className="text-xs font-bold text-[#00334f] hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {patient.labResults && patient.labResults.length > 0 ? (
                  patient.labResults.slice(0, 3).map((res) => (
                    <div key={res.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{res.testName}</span>
                        <span className="text-[10px] font-mono text-slate-400">{res.date}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{res.result}</p>
                      <p className="text-[10px] text-slate-500 italic">{res.remarks}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3">No pathology results recorded.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. APPOINTMENTS TAB */}
      {activePatientTab === "appointments" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Your Appointment History</h2>
              <p className="text-xs text-slate-500">Manage bookings, telehealth appointments, and cancellation list requests</p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Consult</span>
            </button>
          </div>

          {/* Upcoming Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Upcoming Consultations</h3>
            </div>
            <div className="divide-y divide-slate-100 p-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(apt => (
                  <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{apt.reason}</span>
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                          {apt.type || "Standard Consult"}
                        </span>
                        {apt.isTelehealth && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <Video className="w-3 h-3" /> Telehealth
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Doctor: <span className="font-semibold">{apt.doctorName || "Dr. Priyantha Silva"}</span> • Date: <span className="font-bold">{apt.date} at {apt.time}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.isTelehealth && (
                        <button
                          onClick={() => onLaunchTelehealth?.(apt)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video Call</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onCancelAppointment(apt.id);
                          showToast("Appointment cancelled.");
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No upcoming appointments scheduled.</p>
              )}
            </div>
          </div>

          {/* Past Consultations */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Past Consultations & Visits</h3>
            </div>
            <div className="divide-y divide-slate-100 p-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map(apt => (
                  <div key={apt.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{apt.reason}</p>
                      <p className="text-slate-500 text-[11px]">{apt.date} • {apt.doctorName || "Dr. Priyantha Silva"}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                      {apt.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No past visits recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MEDICATIONS TAB */}
      {activePatientTab === "medications" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Your Current Medications & ePrescriptions</h2>
                <p className="text-xs text-slate-500">Active Script List (ASL) tokens and repetition entitlements</p>
              </div>
              <button
                onClick={() => {
                  setActivePatientTab("messages");
                  setMsgSubject("Repeat Prescription Request");
                  setMsgBody("Dear Doctor, I would like to request a repeat ePrescription token for my regular medication.");
                }}
                className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
              >
                Request Repeat Script
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.activeMedications?.map((med, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{med}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Prescribed by Dr. Priyantha Silva</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Valid eScript
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                    <span>Token: <strong className="font-mono text-slate-800">QR-RX-{7721 + idx}</strong></span>
                    <button
                      onClick={() => showToast(`ePrescription token QR code sent to your SMS (${patient.phone})`)}
                      className="text-xs font-bold text-[#00334f] hover:underline cursor-pointer"
                    >
                      Send Token SMS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. PATHOLOGY TAB */}
      {activePatientTab === "pathology" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Diagnostic Pathology & Lab Reports</h2>
            <p className="text-xs text-slate-500">Official laboratory results verified by your General Practitioner</p>
          </div>

          <div className="divide-y divide-slate-100">
            {patient.labResults?.map(res => (
              <div key={res.id} className="py-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{res.testName}</h3>
                    <p className="text-xs text-slate-500">Collected: {res.date} • Lab: LankaLab / St. John Pathology</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    GP Signed & Reviewed
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200">
                  {res.result}
                </div>
                <p className="text-xs text-slate-600 italic">Doctor's Remark: {res.remarks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. IMMUNISATIONS (AIR) TAB */}
      {activePatientTab === "vaccines" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Australian Immunisation Register (AIR) Status</h2>
              <p className="text-xs text-slate-500">Official vaccination history synchronized with national immunization databases</p>
            </div>
            <button
              onClick={() => showToast("Immunisation History Certificate downloaded.")}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              Download AIR Certificate
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {patient.vaccineRecords?.map((vac, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{vac.vaccineName}</h4>
                  <p className="text-slate-500">{vac.dose} • Batch: {vac.batchNumber} • Date: {vac.date}</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                  ✓ AIR Registered
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RECALLS TAB */}
      {activePatientTab === "recalls" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Preventive Health Reminders & Recalls</h2>
            <p className="text-xs text-slate-500">Upcoming screening intervals, immunisation boosters, and chronic care reviews</p>
          </div>

          <div className="space-y-3">
            {myRecalls.length > 0 ? (
              myRecalls.map(r => (
                <div key={r.id} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900">{r.category}</span>
                    <p className="text-xs text-slate-700 mt-1">{r.notes}</p>
                    <p className="text-[11px] font-bold text-red-700 mt-1">Due Date: {r.dueDate}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowBookingModal(true);
                      setBookingReason(`Recall Follow-up: ${r.category}`);
                    }}
                    className="bg-[#00334f] hover:bg-[#0c4a6e] text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">All Preventive Health Checks are Up to Date!</p>
                <p className="text-slate-400 mt-1">No outstanding clinical recalls on file.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. PROFILE & MEDICARE DETAILS TAB */}
      {activePatientTab === "profile" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Medicare Details & Consent Settings</h2>
            <p className="text-xs text-slate-500">Manage IHI numbers, emergency contacts, Next of Kin, and digital health consent</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicare Card Number:</label>
                <input
                  type="text"
                  value={editMedicare}
                  onChange={e => setEditMedicare(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Individual Ref No (IRN):</label>
                <input
                  type="text"
                  value={editMedicareRef}
                  onChange={e => setEditMedicareRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Individual Healthcare Identifier (IHI):</label>
                <input
                  type="text"
                  value={editIhi}
                  onChange={e => setEditIhi(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Contact Name & Phone:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editEmergencyName}
                    onChange={e => setEditEmergencyName(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    placeholder="Contact Name"
                  />
                  <input
                    type="text"
                    value={editEmergencyPhone}
                    onChange={e => setEditEmergencyPhone(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    placeholder="Phone"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next of Kin & Relationship:</label>
                <input
                  type="text"
                  value={editNextOfKin}
                  onChange={e => setEditNextOfKin(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred General Practitioner:</label>
              <input
                type="text"
                value={editPreferredGp}
                onChange={e => setEditPreferredGp(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-800">Consent & Privacy Authorizations</h3>
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editConsentSms}
                  onChange={e => setEditConsentSms(e.target.checked)}
                  className="rounded"
                />
                <span>Consent to receive SMS appointment reminders and clinical recall notices</span>
              </label>
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editConsentMhr}
                  onChange={e => setEditConsentMhr(e.target.checked)}
                  className="rounded"
                />
                <span>Authorize automatic upload of Shared Health Summaries to My Health Record</span>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Details & Consent
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. MESSAGES TAB */}
      {activePatientTab === "messages" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Secure Clinic Communication Hub</h2>
            <p className="text-xs text-slate-500">Send direct enquiries, repeat script requests, or medical certificate renewals</p>
          </div>

          <form onSubmit={handleSendMessageSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject / Enquiry Category:</label>
              <select
                value={msgSubject}
                onChange={e => setMsgSubject(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Prescription Refill Request">Repeat Prescription (eScript) Request</option>
                <option value="Medical Certificate Request">Medical Certificate Extension</option>
                <option value="Pathology Result Enquiry">Pathology Lab Result Clarification</option>
                <option value="Appointment Booking Request">Specialist / Allied Health Referral Enquiry</option>
                <option value="General Clinical Question">General Clinical Enquiry</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Message to the Care Team:</label>
              <textarea
                rows={4}
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                placeholder="Write your clinical or administrative enquiry here..."
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Secure Message</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#00334f] text-white px-5 py-3.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-sm">Book General Practice Appointment</h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select General Practitioner:</label>
                <select
                  value={bookingDoctor}
                  onChange={e => setBookingDoctor(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Dr. Priyantha Silva (FRACGP, MBBS)">Dr. Priyantha Silva (FRACGP, MBBS) — Preferred GP</option>
                  <option value="Dr. Anoja Senanayake (MBBS, DCH)">Dr. Anoja Senanayake (MBBS, DCH) — Paediatrics & Women's Health</option>
                  <option value="Dr. K. Jayasuriya (MBBS, FRACGP)">Dr. K. Jayasuriya (MBBS, FRACGP) — Chronic Disease & Skin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date:</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot:</label>
                  <select
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:15 AM">11:15 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:15 PM">04:15 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultation Type:</label>
                <select
                  value={bookingType}
                  onChange={e => setBookingType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Standard GP Consult">Standard GP Consult (15 min - MBS Item 23)</option>
                  <option value="Long Consult (20+ min)">Long Consult (20+ min - MBS Item 36)</option>
                  <option value="Telehealth Video">Telehealth Video Consult (MBS Item 91891)</option>
                  <option value="Care Plan Review">Chronic Disease Management Plan (MBS Item 721)</option>
                  <option value="Immunisation">Vaccination & Immunisation Clinic</option>
                  <option value="Skin Check">Comprehensive Skin Check</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit:</label>
                <input
                  type="text"
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  placeholder="e.g. Asthma check, sore throat, blood test results..."
                  required
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTelehealthBooking}
                    onChange={e => setIsTelehealthBooking(e.target.checked)}
                    className="rounded"
                  />
                  <span>Conduct this consultation via secure Telehealth Video</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestWaitlist}
                    onChange={e => setRequestWaitlist(e.target.checked)}
                    className="rounded"
                  />
                  <span>Add to Cancellation / Earlier Slot Waiting-List</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

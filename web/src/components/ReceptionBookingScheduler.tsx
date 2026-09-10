import React, { useEffect, useMemo, useState } from "react";
import { Check, GripVertical, Phone, Video, X } from "lucide-react";
import type { Appointment, Patient, StaffProvider } from "../types";
import { bookingOnSlot } from "../sync/suwasiriAppointments";
import DoctorDaySlotsPanel from "./DoctorDaySlotsPanel";
import { slotTimesForDoctor } from "../sync/clinicSlots";

const REASONS = ["Follow up", "New symptom", "Test results", "Prescription"];

const SAGE = "#8FA88E";
const CORAL = "#E85D4C";
const REASON_BLUE = "#5C9CEC";

function upcomingDates(days = 183, includeToday = false): { key: string; date: Date }[] {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  const start = includeToday ? 0 : 1;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(n);
    d.setDate(d.getDate() + i + start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, date: d };
  });
}

function weekday(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function monthName(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "long" });
}

function initials(name: string) {
  const clean = name.replace(/^Dr\.?\s*/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "D";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function slotTaken(
  appointments: Appointment[],
  doctor: StaffProvider | undefined,
  dateKey: string,
  time24: string
) {
  if (!doctor) return false;
  return Boolean(
    bookingOnSlot(appointments, {
      doctorName: doctor.name,
      doctorStaffId: doctor.id,
      dateKey,
      time: time24,
    })
  );
}

export interface ReceptionBookPayload {
  patientId: string;
  date: string;
  time: string;
  reason: string;
  doctorName: string;
  doctorStaffId?: string;
  specialty: string;
  consultMode: "clinic" | "video";
  isWalkInOverflow?: boolean;
}

interface Props {
  patients: Patient[];
  doctors: StaffProvider[];
  appointments: Appointment[];
  initialPatientId?: string;
  initialDate?: string;
  initialReason?: string;
  includeToday?: boolean;
  walkInMode?: boolean;
  walkInOverflowUsed?: number;
  initialConsultMode?: "clinic" | "video";
  lockPatient?: boolean;
  lockDoctor?: boolean;
  embedded?: boolean;
  /** Show the same available/booked grid without creating a booking (reception file view). */
  viewOnly?: boolean;
  onClose: () => void;
  onConfirm: (payload: ReceptionBookPayload) => Promise<void> | void;
}

export default function ReceptionBookingScheduler({
  patients,
  doctors,
  appointments,
  initialPatientId,
  initialDate,
  initialReason,
  initialConsultMode = "clinic",
  includeToday = false,
  walkInMode = false,
  walkInOverflowUsed = 0,
  lockPatient = false,
  lockDoctor = false,
  embedded = false,
  viewOnly = false,
  onClose,
  onConfirm,
}: Props) {
  const rosterSeed = doctors.length > 0 ? doctors : [];
  const [roster, setRoster] = useState<StaffProvider[]>(rosterSeed);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(rosterSeed[0]?.id || "");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (doctors.length === 0) return;
    setRoster(doctors);
    setSelectedDoctorId((prev) => (doctors.some((d) => d.id === prev) ? prev : doctors[0].id));
  }, [doctors]);
  const dates = useMemo(() => upcomingDates(183, includeToday), [includeToday]);
  const [dateKey, setDateKey] = useState<string>(() => {
    if (initialDate && dates.some((d) => d.key === initialDate)) return initialDate;
    return dates[0]?.key || "";
  });
  const [time24, setTime24] = useState<string>("10:00");
  const [reason, setReason] = useState<string>(() => {
    const match = REASONS.find((r) => (initialReason || "").toLowerCase().includes(r.toLowerCase()));
    return match || "Follow up";
  });
  const [consultMode, setConsultMode] = useState<"clinic" | "video">(initialConsultMode);
  const [patientId, setPatientId] = useState<string>(initialPatientId || patients[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctor = roster.find((d) => d.id === selectedDoctorId) || roster[0];
  const selectedDate = dates.find((d) => d.key === dateKey)?.date || dates[0]?.date;
  const patient = patients.find((p) => p.id === patientId);
  const daySlotTimes = slotTimesForDoctor(doctor, dateKey, appointments);

  useEffect(() => {
    const times = slotTimesForDoctor(doctor, dateKey, appointments);
    const firstFree = times.find((t) => !slotTaken(appointments, doctor, dateKey, t));
    setTime24((prev) => {
      if (times.includes(prev) && !slotTaken(appointments, doctor, dateKey, prev)) return prev;
      return firstFree || prev;
    });
  }, [doctor?.id, dateKey, appointments]);

  const freeCount = (key: string) => {
    if (!doctor) return 0;
    return slotTimesForDoctor(doctor, key, appointments).filter(
      (t) => !slotTaken(appointments, doctor, key, t)
    ).length;
  };

  const openSlots = doctor ? freeCount(dateKey) : 0;
  const overflowLeft = Math.max(0, 5 - walkInOverflowUsed);

  const confirmOverflow = async () => {
    if (!doctor || !patientId || !dateKey) return;
    if (overflowLeft <= 0) {
      setError("This session already has 5 walk-in patients at the end of the list.");
      return;
    }
    const overflowTimes = ["18:00", "18:15", "18:30", "18:45", "19:00"];
    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        patientId,
        date: dateKey,
        time: overflowTimes[Math.min(walkInOverflowUsed, overflowTimes.length - 1)],
        reason: "Walk-in overflow — end of session",
        doctorName: doctor.name,
        doctorStaffId: doctor.id,
        specialty: doctor.specialty || "General Practice",
        consultMode: "clinic",
        isWalkInOverflow: true,
      });
    } catch (err: any) {
      setError(err?.message || "Could not add walk-in.");
      setSaving(false);
    }
    setSaving(false);
  };
  const onDragStart = (index: number) => setDragIndex(index);
  const onDropOn = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setRoster((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const confirm = async () => {
    if (!doctor || !patientId || !dateKey || !time24) {
      setError("Select a patient, doctor, date, and time.");
      return;
    }
    if (slotTaken(appointments, doctor, dateKey, time24)) {
      setError("That slot is already booked. Choose another time.");
      return;
    }
    if (!daySlotTimes.includes(time24)) {
      setError("That time is outside this doctor’s saved weekly hours. Pick an available slot.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        patientId,
        date: dateKey,
        time: time24,
        reason: consultMode === "video" ? `Video consultation · ${reason}` : reason,
        doctorName: doctor.name,
        doctorStaffId: doctor.id,
        specialty: doctor.specialty || "General Practice",
        consultMode,
      });
      setSaving(false);
    } catch (err: any) {
      setError(err?.message || "Could not confirm booking.");
      setSaving(false);
    }
  };

  const inner = (
        <div className="p-4 space-y-4">
          {!lockDoctor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A]">
                {viewOnly ? "Doctors at this clinic" : "Doctors at this clinic — drag to reorder"}
              </p>
              <div className="space-y-1.5">
                {roster.map((d, i) => (
                  <div
                    key={d.id}
                    draggable={!viewOnly}
                    onDragStart={() => { if (!viewOnly) onDragStart(i); }}
                    onDragOver={(e) => { if (!viewOnly) e.preventDefault(); }}
                    onDrop={() => { if (!viewOnly) onDropOn(i); }}
                    onClick={() => setSelectedDoctorId(d.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${viewOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} ${
                      selectedDoctorId === d.id
                        ? "border-[#6F8B6E] bg-[#8FA88E]/20"
                        : "border-[#E4E2DE] bg-white"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: selectedDoctorId === d.id ? SAGE : "#5C9CEC" }}
                    >
                      {initials(d.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{d.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{d.specialty || d.role}</p>
                    </div>
                  </div>
                ))}
                {roster.length === 0 && (
                  <p className="text-xs text-slate-500">No doctors registered at this medical centre.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-[#E4E2DE] p-4 flex gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0"
                style={{ background: SAGE }}
              >
                {doctor ? initials(doctor.name) : "GP"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#1A1A1A]">{doctor?.name || "Select a doctor"}</p>
                <p className="text-xs text-slate-500">
                  {doctor?.specialty || "General Practice"} — {doctor?.assignedRoom || "Clinic"}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-slate-700">
                  <span>★ 4.9</span>
                  <span>12 yrs</span>
                  <span>Rs 3,500</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {viewOnly && (
            <p className="text-xs text-slate-600 bg-white border border-[#E4E2DE] rounded-xl px-3 py-2">
              Same available and booked times the doctor sees. Weekly hours are saved in Practice Manager.
            </p>
          )}

          {lockDoctor && doctor && (
            <div className="bg-white rounded-2xl border border-[#E4E2DE] p-4 flex gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0"
                style={{ background: SAGE }}
              >
                {initials(doctor.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#1A1A1A]">{doctor.name}</p>
                <p className="text-xs text-slate-500">
                  {doctor.specialty || "General Practice"} — your slots only. Other doctors at this clinic are not shown.
                </p>
              </div>
            </div>
          )}

          {!viewOnly && <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] block mb-1">Patient</label>
            {lockPatient ? (
              <div className="w-full p-2.5 bg-white border border-[#E4E2DE] rounded-xl text-sm font-semibold text-slate-800">
                {patient?.name || "Patient"}
              </div>
            ) : (
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E4E2DE] rounded-xl text-sm font-semibold"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.phone || p.email || p.id}
                </option>
              ))}
            </select>
            )}
            {patient && (
              <p className="text-[11px] text-slate-500 mt-1">
                {patient.age}y · {patient.gender} · {patient.phone} · {patient.email}
              </p>
            )}
          </div>}

          {!viewOnly && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConsultMode("clinic")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                consultMode === "clinic" ? "text-white border-transparent" : "bg-white border-[#E4E2DE] text-slate-700"
              }`}
              style={consultMode === "clinic" ? { background: "#5C9CEC" } : undefined}
            >
              In person
            </button>
            <button
              type="button"
              onClick={() => setConsultMode("video")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                consultMode === "video" ? "text-white border-transparent" : "bg-white border-[#E4E2DE] text-slate-700"
              }`}
              style={consultMode === "video" ? { background: "#7C5CFC" } : undefined}
            >
              <Video className="w-3.5 h-3.5" />
              Video consultation
            </button>
          </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3 space-y-3">
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              {dates.map(({ key, date }) => {
                const selected = key === dateKey;
                const free = freeCount(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDateKey(key)}
                    className="w-[68px] py-2.5 rounded-2xl text-center border shrink-0"
                    style={
                      selected
                        ? { background: SAGE, borderColor: "#6F8B6E", color: "#fff" }
                        : { background: "#fff", borderColor: "#E4E2DE" }
                    }
                  >
                    <div className={`text-[10px] font-bold ${selected ? "text-white/90" : "text-slate-400"}`}>
                      {weekday(date)}
                    </div>
                    <div className="text-lg font-black leading-tight">{date.getDate()}</div>
                    <div className={`text-[9px] font-semibold ${selected ? "text-white/90" : "text-emerald-700"}`}>
                      {free} free
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          <div className="lg:col-span-2">
          <DoctorDaySlotsPanel
            doctor={doctor}
            dateKey={dateKey}
            appointments={appointments}
            selectedTime={viewOnly ? undefined : time24}
            onSelectTime={viewOnly ? undefined : setTime24}
            selectable={!viewOnly}
          />
          </div>
          </div>

          {!viewOnly && (
          <>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-2">Reason for visit</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => {
                const selected = r === reason;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={
                      selected
                        ? { background: REASON_BLUE, color: "#fff", borderColor: REASON_BLUE }
                        : { background: "#fff", color: "#1A1A1A", borderColor: "#E4E2DE" }
                    }
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E2DE] p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">
                {selectedDate ? `${weekday(selectedDate)} ${selectedDate.getDate()} ${monthName(selectedDate)} at ${time24}` : ""}
              </p>
              <p className="text-xs text-slate-500">
                {reason} — 15 minute slot · {consultMode === "video" ? "Video" : "In person"}
              </p>
            </div>
            <p className="text-sm font-black text-[#1A1A1A]">Rs 3,500</p>
          </div>

          {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}

          {walkInMode && openSlots === 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-bold text-amber-950">No free slots on this date</p>
              <p className="text-xs text-amber-900">
                Reception can add up to 5 walk-in patients at the end of this session only. Used {walkInOverflowUsed} of 5.
              </p>
              <button
                type="button"
                disabled={saving || overflowLeft <= 0 || !doctor}
                onClick={confirmOverflow}
                className="w-full py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: CORAL }}
              >
                {overflowLeft <= 0 ? "Walk-in list full (5/5)" : `Add walk-in at end of session (${overflowLeft} left)`}
              </button>
            </div>
          )}

          {!(walkInMode && openSlots === 0) && (
          <button
            type="button"
            disabled={saving || !doctor}
            onClick={confirm}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: CORAL }}
          >
            <Check className="w-4 h-4" />
            {saving ? "Booking…" : "Confirm booking"}
          </button>
          )}
          </>
          )}
        </div>
  );

  const shell = (
    <div
      className={embedded ? "rounded-2xl border border-slate-200 overflow-hidden" : "w-full max-w-4xl max-h-[96vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200"}
      style={{ background: "#FAF9F7" }}
    >
      {!embedded && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[#E4E2DE] bg-[#FAF9F7]/95 backdrop-blur">
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-[#1A1A1A]">
            {walkInMode ? "Check walk-in availability" : "Book scheduler appointment slot"}
          </h2>
          <Phone className="w-5 h-5 text-slate-400" />
        </div>
      )}
      {inner}
    </div>
  );

  if (embedded) return shell;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
      {shell}
    </div>
  );
}

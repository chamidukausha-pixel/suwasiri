import React from "react";
import type { Appointment, StaffProvider } from "../types";
import {
  appointmentPatientName,
  bookingOnSlot,
  bookingsForDoctorOnDate,
  formatAmPm,
  parseClock,
} from "../sync/suwasiriAppointments";

export const CLINIC_SLOT_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:15", "11:45",
  "13:00", "13:30", "14:30", "15:00", "15:30", "16:15", "16:45", "17:45",
];

const CORAL = "#E85D4C";

export function longClinicDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function parseDateKey(dateKey: string): Date | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

interface Props {
  doctor?: StaffProvider;
  dateKey: string;
  appointments: Appointment[];
  selectedTime?: string;
  onSelectTime?: (time24: string) => void;
  selectable?: boolean;
}

export default function DoctorDaySlotsPanel({
  doctor,
  dateKey,
  appointments,
  selectedTime,
  onSelectTime,
  selectable = true,
}: Props) {
  const date = parseDateKey(dateKey);
  const dateLabel = date ? longClinicDate(date) : dateKey;
  const booked = doctor
    ? bookingsForDoctorOnDate(appointments, {
        doctorName: doctor.name,
        doctorStaffId: doctor.id,
        dateKey,
      })
    : [];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-2">
          Available times — {doctor?.name || "select a doctor"}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CLINIC_SLOT_TIMES.map((t) => {
            const row = doctor
              ? bookingOnSlot(appointments, {
                  doctorName: doctor.name,
                  doctorStaffId: doctor.id,
                  dateKey,
                  time: t,
                })
              : undefined;
            const taken = Boolean(row);
            const selected = selectable && t === selectedTime && !taken;
            return (
              <button
                key={t}
                type="button"
                disabled={taken || !selectable || !doctor}
                onClick={() => onSelectTime?.(t)}
                title={taken && row ? `Booked: ${appointmentPatientName(row)}` : taken ? "Booked" : "Available"}
                className="py-2 rounded-xl text-xs font-bold border leading-tight"
                style={
                  taken
                    ? { background: "#F0EFED", color: "#8A8A8A", borderColor: "#E4E2DE" }
                    : selected
                      ? { background: CORAL, color: "#fff", borderColor: CORAL }
                      : { background: "#fff", color: "#1A1A1A", borderColor: "#E4E2DE" }
                }
              >
                <span className={taken ? "line-through" : undefined}>{t}</span>
                {taken && (
                  <span className="block text-[8px] font-bold uppercase tracking-wide mt-0.5 text-rose-700">
                    Booked
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-2">
          Booked times under {doctor?.name || "this doctor"}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
        {booked.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E2DE] divide-y divide-[#E4E2DE] overflow-hidden">
            {booked.map((apt) => {
              const { hours, minutes } = parseClock(apt.time || "");
              const who = appointmentPatientName(apt);
              const via = apt.source === "suwasiri_app" ? "Suwasiri App" : "GP Care";
              return (
                <div key={apt.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">{formatAmPm(hours, minutes)}</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{who}</p>
                    <p className="text-[10px] text-slate-500">
                      {via}
                      {apt.consultMode === "video" || apt.isTelehealth ? " · Video" : " · In person"}
                      {apt.reason ? ` · ${apt.reason}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                    Booked
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 bg-white border border-dashed border-[#E4E2DE] rounded-2xl px-3 py-3">
            No bookings on this date for this doctor. All listed times are available.
          </p>
        )}
      </div>
    </div>
  );
}

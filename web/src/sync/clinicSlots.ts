import type { Appointment, RosterWeekday, StaffProvider } from "../types";
import {
  appointmentClock,
  bookingsForDoctorOnDate,
  formatTime24,
  parseClock,
} from "./suwasiriAppointments";

/** Fallback clinic template when a doctor has no saved weekly hours. */
export const CLINIC_SLOT_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:15", "11:45",
  "13:00", "13:30", "14:30", "15:00", "15:30", "16:15", "16:45", "17:45",
];

const JS_DAY_TO_ROSTER: RosterWeekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function parseDateKey(dateKey: string): Date | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function rosterWeekdayFromDateKey(dateKey: string): RosterWeekday | null {
  const date = parseDateKey(dateKey);
  if (!date) return null;
  return JS_DAY_TO_ROSTER[date.getDay()] || null;
}

function clockMinutes(hhmm: string): number {
  const c = parseClock(hhmm);
  return c.hours * 60 + c.minutes;
}

function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return formatTime24(hours, minutes);
}

/** 15-minute slots from start (inclusive) until end (exclusive). */
export function slotsInHourRange(start: string, end: string, step = 15): string[] {
  const a = clockMinutes(start);
  const b = clockMinutes(end);
  if (!(a < b)) return [];
  const out: string[] = [];
  for (let m = a; m < b; m += step) out.push(fromMinutes(m));
  return out;
}

export function hasRosterHours(doctor?: StaffProvider | null): boolean {
  if (!doctor?.rosterHours) return false;
  return Object.values(doctor.rosterHours).some((h) => Boolean(h?.start && h?.end));
}

function bookedClockTimes(booked: Appointment[]): string[] {
  return booked
    .map((apt) => {
      const clock = appointmentClock(apt) || parseClock(apt.time || "");
      return formatTime24(clock.hours, clock.minutes);
    })
    .filter(Boolean);
}

/**
 * Available times for one doctor on one date.
 * Uses Practice Manager weekly hours when saved; always includes that day's bookings
 * so receptionist and doctor see the same occupied slots.
 */
export function slotTimesForDoctor(
  doctor: StaffProvider | undefined,
  dateKey: string,
  appointments: Appointment[] = []
): string[] {
  const day = rosterWeekdayFromDateKey(dateKey);
  const booked = doctor
    ? bookingsForDoctorOnDate(appointments, {
        doctorName: doctor.name,
        doctorStaffId: doctor.id,
        dateKey,
      })
    : [];
  const extra = bookedClockTimes(booked);
  const hours = day && doctor?.rosterHours ? doctor.rosterHours[day] : undefined;
  const dayOn = day ? doctor?.roster?.[day] : undefined;

  let list: string[];
  if (hours?.start && hours?.end) {
    list = slotsInHourRange(hours.start, hours.end);
  } else if (hasRosterHours(doctor) || dayOn === false) {
    list = [];
  } else {
    list = [...CLINIC_SLOT_TIMES];
  }

  const merged = Array.from(new Set([...list, ...extra]));
  merged.sort((a, b) => clockMinutes(a) - clockMinutes(b));
  return merged;
}

export function freeSlotCountForDoctor(
  doctor: StaffProvider | undefined,
  dateKey: string,
  appointments: Appointment[],
  isTaken: (time24: string) => boolean
): number {
  return slotTimesForDoctor(doctor, dateKey, appointments).filter((t) => !isTaken(t)).length;
}

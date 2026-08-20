import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  dateKeyInMonth,
  formatColomboClock,
  formatLongDate,
  formatMonthTitle,
  monthDayCells,
  shiftMonth,
} from "../utils/clinicCalendar";

interface Props {
  year: number;
  month: number;
  selectedDate: string;
  todayKey: string;
  countsByDate: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
  onJumpToToday: () => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ClinicMonthCalendar({
  year,
  month,
  selectedDate,
  todayKey,
  countsByDate,
  onSelectDate,
  onChangeMonth,
  onJumpToToday,
}: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cells = monthDayCells(year, month);
  const title = formatMonthTitle(year, month);
  const isCurrentMonth = todayKey.startsWith(
    `${year}-${String(month + 1).padStart(2, "0")}`
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden lg:sticky lg:top-4">
      <div className="px-3 py-3 border-b bg-[#f0f3ff]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#00334f] text-white flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm text-[#00334f] truncate">{title}</h3>
              <p className="text-[10px] font-mono font-bold text-emerald-700 tabular-nums">
                {formatColomboClock(now)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = shiftMonth(year, month, -1);
                onChangeMonth(next.year, next.month);
              }}
              className="p-1 rounded border bg-white text-slate-700 hover:border-[#00334f]"
              title="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onJumpToToday}
              className={`px-1.5 py-1 rounded text-[9px] font-bold border ${
                isCurrentMonth && selectedDate === todayKey
                  ? "bg-[#00334f] text-white border-[#00334f]"
                  : "bg-white text-[#00334f] border-slate-200 hover:bg-slate-50"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const next = shiftMonth(year, month, 1);
                onChangeMonth(next.year, next.month);
              }}
              className="p-1 rounded border bg-white text-slate-700 hover:border-[#00334f]"
              title="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-2.5 space-y-2">
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wider text-slate-400 py-0.5">
              {d}
            </div>
          ))}
          {cells.map((day, idx) => {
            if (day == null) {
              return <div key={`empty-${idx}`} className="min-h-[36px] rounded bg-slate-50/70" />;
            }
            const key = dateKeyInMonth(year, month, day);
            const count = countsByDate[key] || 0;
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(key)}
                className={`min-h-[36px] rounded border p-0.5 text-center transition ${
                  isSelected
                    ? "bg-[#00334f] border-[#00334f] text-white"
                    : isToday
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100"
                    : "bg-white border-slate-200 hover:border-[#00334f] hover:bg-[#f0f3ff]"
                }`}
              >
                <span className={`block text-[11px] font-black leading-none ${isSelected ? "text-white" : "text-slate-800"}`}>
                  {day}
                </span>
                {count > 0 && (
                  <span className={`block text-[8px] font-bold leading-none mt-0.5 ${isSelected ? "text-sky-100" : "text-sky-700"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 px-0.5">
          <strong className="text-[#00334f]">{formatLongDate(selectedDate)}</strong>
        </p>
      </div>
    </div>
  );
}

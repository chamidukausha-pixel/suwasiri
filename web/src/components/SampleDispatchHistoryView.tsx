import React, { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import ClinicMonthCalendar from "./ClinicMonthCalendar";
import { formatDateKey, formatLongDate } from "../utils/clinicCalendar";
import { downloadDispatchSlipPdf, printDispatchSlip } from "../utils/dispatchSlip";

export type DispatchHistorySample = {
  id: string;
  patientId: string;
  patientName: string;
  sampleCategory?: string;
  testName?: string;
  status: "PENDING" | "COLLECTED" | "DELIVERED";
  collectedTime?: string;
  collectedDate?: string;
  deliveredTime?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  deliveryPersonId?: string;
  sampleCount?: number;
  labName?: string;
  labAddress?: string;
  issuedPersonName?: string;
  issuedDate?: string;
  issuedFileIds?: string[];
  dispatchNumber?: string;
  lankaLabSyncStatus?: string;
};

function sampleDispatchDayKey(sample: DispatchHistorySample): string {
  if (sample.collectedDate && /^\d{4}-\d{2}-\d{2}$/.test(sample.collectedDate)) {
    return sample.collectedDate;
  }
  const stamp = sample.collectedTime || sample.issuedDate || "";
  const iso = stamp.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(stamp);
  if (!Number.isNaN(parsed.getTime())) return formatDateKey(parsed);
  return "";
}

interface Props {
  samples: DispatchHistorySample[];
  selectedDate: string;
  todayKey: string;
  calendarYear: number;
  calendarMonth: number;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
  onJumpToToday: () => void;
  clinicName?: string;
  focusDispatchNumber?: string | null;
}

export default function SampleDispatchHistoryView({
  samples,
  selectedDate,
  todayKey,
  calendarYear,
  calendarMonth,
  onSelectDate,
  onChangeMonth,
  onJumpToToday,
  clinicName,
  focusDispatchNumber,
}: Props) {
  const [openNumber, setOpenNumber] = useState<string | null>(focusDispatchNumber || null);

  useEffect(() => {
    if (focusDispatchNumber) setOpenNumber(focusDispatchNumber);
  }, [focusDispatchNumber]);

  const historySamples = samples.filter((s) => s.status === "COLLECTED" || s.status === "DELIVERED");
  const countsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sample of historySamples) {
      const key = sampleDispatchDayKey(sample);
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [historySamples]);

  const dayRows = historySamples.filter((s) => sampleDispatchDayKey(s) === selectedDate);

  const files = useMemo(() => {
    const map = new Map<string, DispatchHistorySample[]>();
    for (const sample of dayRows) {
      const number = sample.dispatchNumber || sample.id;
      const list = map.get(number) || [];
      list.push(sample);
      map.set(number, list);
    }
    return Array.from(map.entries()).map(([number, items]) => ({ number, items }));
  }, [dayRows]);

  const activeNumber = openNumber && files.some((f) => f.number === openNumber)
    ? openNumber
    : focusDispatchNumber && files.some((f) => f.number === focusDispatchNumber)
      ? focusDispatchNumber
      : null;
  const activeFile = files.find((f) => f.number === activeNumber);

  const printFile = (items: DispatchHistorySample[], number: string) => {
    const first = items[0];
    printDispatchSlip({
      dispatchNumber: number,
      issuedDate: first?.issuedDate || selectedDate,
      clinicName: clinicName || first?.labName || "GP Care Clinic",
      driverName: first?.deliveryPersonName || "—",
      driverPhone: first?.deliveryPersonPhone || "—",
      vehicleNo: first?.deliveryPersonId || "—",
      vialCount: Number(first?.sampleCount) || items.length,
      labName: first?.labName || "—",
      labAddress: first?.labAddress || "",
      issuedPersonName: first?.issuedPersonName || "—",
      lines: items.map((s) => ({
        patientName: s.patientName,
        fileId: s.patientId,
        investigation: s.testName || s.sampleCategory || "—",
      })),
    });
  };

  return (
    <div id="sample-dispatch-history" className="p-6 bg-white border rounded shadow-sm space-y-4">
      <div className="border-b pb-3">
        <h3 className="font-serif font-bold text-base text-[#00334f] uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4" />
          Sample Dispatch History
        </h3>
        <p className="text-[11px] text-slate-500">
          Click a date, then click a dispatch file number to review driver, vials, patients, and investigations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4">
          <ClinicMonthCalendar
            year={calendarYear}
            month={calendarMonth}
            selectedDate={selectedDate}
            todayKey={todayKey}
            countsByDate={countsByDate}
            onSelectDate={onSelectDate}
            onChangeMonth={onChangeMonth}
            onJumpToToday={onJumpToToday}
          />
        </div>
        <div className="xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#00334f]">{formatLongDate(selectedDate)}</p>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {files.length} file{files.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[#00334f] font-bold">
                  <th className="p-2.5">Dispatch file</th>
                  <th className="p-2.5">Patients</th>
                  <th className="p-2.5">Driver / vehicle</th>
                  <th className="p-2.5">Vials</th>
                  <th className="p-2.5">Lab</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {files.map((file) => {
                  const first = file.items[0];
                  const open = file.number === activeNumber;
                  return (
                    <tr
                      key={file.number}
                      className={`cursor-pointer ${open ? "bg-sky-50" : "hover:bg-slate-50"}`}
                      onClick={() => setOpenNumber(open ? null : file.number)}
                    >
                      <td className="p-2.5 font-mono font-bold text-[#00334f]">{file.number}</td>
                      <td className="p-2.5">{file.items.length}</td>
                      <td className="p-2.5">
                        <div>{first?.deliveryPersonName || "—"}</div>
                        <div className="text-[10px] font-mono text-slate-500">{first?.deliveryPersonId}</div>
                      </td>
                      <td className="p-2.5 font-mono">{first?.sampleCount || file.items.length}</td>
                      <td className="p-2.5">{first?.labName || "—"}</td>
                      <td className="p-2.5">
                        {file.items.every((s) => s.status === "DELIVERED") ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">DELIVERED</span>
                        ) : (
                          <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded">ISSUED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {files.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 italic text-slate-400">
                      No dispatch files on {formatLongDate(selectedDate)}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {activeFile && (
            <div className="border border-sky-200 bg-sky-50/50 rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase text-[#00334f]">Dispatch file {activeFile.number}</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => printFile(activeFile.items, activeFile.number)}
                    className="text-[10px] font-bold bg-white border rounded px-2 py-1"
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const first = activeFile.items[0];
                      downloadDispatchSlipPdf({
                        dispatchNumber: activeFile.number,
                        issuedDate: first?.issuedDate || selectedDate,
                        clinicName: clinicName || "GP Care Clinic",
                        driverName: first?.deliveryPersonName || "—",
                        driverPhone: first?.deliveryPersonPhone || "—",
                        vehicleNo: first?.deliveryPersonId || "—",
                        vialCount: Number(first?.sampleCount) || activeFile.items.length,
                        labName: first?.labName || "—",
                        labAddress: first?.labAddress || "",
                        issuedPersonName: first?.issuedPersonName || "—",
                        lines: activeFile.items.map((s) => ({
                          patientName: s.patientName,
                          fileId: s.patientId,
                          investigation: s.testName || s.sampleCategory || "—",
                        })),
                      });
                    }}
                    className="text-[10px] font-bold bg-white border rounded px-2 py-1"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                <div>Driver: <strong>{activeFile.items[0]?.deliveryPersonName || "—"}</strong></div>
                <div>Phone: <strong>{activeFile.items[0]?.deliveryPersonPhone || "—"}</strong></div>
                <div>Vehicle: <strong>{activeFile.items[0]?.deliveryPersonId || "—"}</strong></div>
                <div>Vials: <strong>{activeFile.items[0]?.sampleCount || activeFile.items.length}</strong></div>
                <div>Issued person: <strong>{activeFile.items[0]?.issuedPersonName || "—"}</strong></div>
                <div>Issued date: <strong>{activeFile.items[0]?.issuedDate || selectedDate}</strong></div>
                <div className="md:col-span-3">Lab: <strong>{activeFile.items[0]?.labName || "—"}</strong></div>
              </div>
              <table className="w-full text-left text-xs bg-white border rounded">
                <thead>
                  <tr className="bg-slate-50 font-bold text-[#00334f]">
                    <th className="p-2">Patient name</th>
                    <th className="p-2">File ID</th>
                    <th className="p-2">Investigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeFile.items.map((sample) => (
                    <tr key={sample.id}>
                      <td className="p-2 font-semibold">{sample.patientName}</td>
                      <td className="p-2 font-mono">{sample.patientId}</td>
                      <td className="p-2">{sample.testName || sample.sampleCategory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Pencil,
  Eye,
  Mail,
  Smartphone,
  Calendar,
} from "lucide-react";
import type { LabOrder } from "../types";
import { MEDICAL_TESTS } from "../data/medicalTests";
import MedicalTestTable from "./pathology/MedicalTestTable";
import EnterResultsPage from "./EnterResultsPage";
import LabReportPreview from "./LabReportPreview";
import { syncResultToGpCareClinic, syncResultToSuwasiriVault } from "../sync/gpCareResultSync";
import { uniqueHealthId } from "../utils/healthId";

type ResultRow = NonNullable<LabOrder["results"]>[number];
type ResultExtra = { notes: string; remarks: string; advice: string; interpretation?: string };

export type LabPanel =
  | "today"
  | "packages"
  | "panels"
  | "categories"
  | "database"
  | "interpretations"
  | "count";

function bucket(order: LabOrder) {
  if (order.status === "PENDING") return "new";
  if (order.status === "PROCESSING" || order.status === "CRITICAL") return "progress";
  if (order.status === "COMPLETED" && order.gpCareSyncedAt) return "signed";
  if (order.status === "COMPLETED") return "final";
  return "new";
}

const PACKAGES = [
  { name: "Master Health Check", tests: "FBC, LFT, KFT, Lipid, HbA1c", price: "LKR 12,500" },
  { name: "Fever Panel", tests: "FBC, CRP, Dengue NS1, Blood culture", price: "LKR 8,900" },
  { name: "Cardiac Screen", tests: "Troponin, Lipid, HbA1c", price: "LKR 9,800" },
];

const PANELS = [
  { name: "LFT panel", tests: "AST, ALT, ALP, Bilirubin, Albumin" },
  { name: "KFT panel", tests: "Urea, Creatinine, eGFR, Electrolytes" },
  { name: "CBC with absolute counts", tests: "Hb, WBC, Platelets, Diff" },
];

function toYmd(d: Date) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

function formatYmd(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return y && m && d ? `${d}/${m}/${y}` : ymd;
}

function splitPatientName(name: string) {
  const cleaned = String(name || "")
    .replace(/^(Mr\.|Mrs\.|Ms\.|Miss|Master|Dr\.|Baby|Rev\.)\s+/i, "")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

function orderNames(order: LabOrder) {
  const parsed = splitPatientName(order.patientName);
  return {
    first: (order.firstName || parsed.first).trim(),
    last: (order.lastName || parsed.last).trim(),
  };
}

function orderDob(order: LabOrder) {
  if (order.dateOfBirth) return order.dateOfBirth;
  const asOf = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date();
  const born = new Date(asOf);
  born.setFullYear(born.getFullYear() - (order.age || 0));
  return toYmd(born);
}

function reportDay(order: LabOrder) {
  const src = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date(order.orderTimestamp);
  if (Number.isNaN(src.getTime())) return "";
  return toYmd(src);
}

function reportDateTime(order: LabOrder) {
  const src = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date(order.orderTimestamp);
  if (Number.isNaN(src.getTime())) {
    return { date: "—", time: order.orderTime || "—" };
  }
  return {
    date: src.toLocaleDateString("en-GB"),
    time: src.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { ymd: string | null; day: number | null }[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ ymd: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ ymd, day: d });
  }
  return cells;
}

export default function LabModule({
  orders,
  panel,
  onSaveResults,
  onFinalResults,
  onSignOffResults,
  onView,
  onPatch,
}: {
  orders: LabOrder[];
  panel: LabPanel;
  onSaveResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onFinalResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onSignOffResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onView: (order: LabOrder) => void;
  onPatch?: (orderId: string, patch: Partial<LabOrder>) => void;
}) {
  if (panel === "today") {
    return (
      <TodaysReports
        orders={orders}
        onSaveResults={onSaveResults}
        onFinalResults={onFinalResults}
        onSignOffResults={onSignOffResults}
        onView={onView}
        onPatch={onPatch}
      />
    );
  }
  if (panel === "packages") {
    return (
      <SimplePage title="Test packages" hint="Bundled investigations offered at the desk">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase text-slate-400">
            <tr>
              <th className="py-2">Package</th>
              <th className="py-2">Includes</th>
              <th className="py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {PACKAGES.map((p) => (
              <tr key={p.name} className="border-t">
                <td className="py-2.5 font-semibold">{p.name}</td>
                <td className="py-2.5 text-slate-600">{p.tests}</td>
                <td className="py-2.5">{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SimplePage>
    );
  }
  if (panel === "panels") {
    return (
      <SimplePage title="Test panels" hint="Grouped assays used on Today's reports">
        <ul className="divide-y">
          {PANELS.map((p) => (
            <li key={p.name} className="py-3">
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-slate-500">{p.tests}</p>
            </li>
          ))}
        </ul>
      </SimplePage>
    );
  }
  if (panel === "categories") {
    const cats = Array.from(new Set(MEDICAL_TESTS.map((t) => t.dept)));
    return (
      <SimplePage title="Test categories" hint="English medical-test grouping">
        <div className="grid sm:grid-cols-2 gap-3">
          {cats.map((c) => (
            <div key={c} className="border rounded-xl p-4">
              <p className="font-bold text-sm">{c}</p>
              <p className="text-xs text-slate-500">{MEDICAL_TESTS.filter((t) => t.dept === c).length} tests</p>
            </div>
          ))}
        </div>
      </SimplePage>
    );
  }
  if (panel === "database") {
    return (
      <SimplePage title="Test database" hint="English abbreviations, full forms and purpose">
        <MedicalTestTable selectable={false} />
      </SimplePage>
    );
  }
  if (panel === "interpretations") {
    return (
      <SimplePage title="Interpretations" hint="Reference ranges used when entering results">
        <div className="space-y-3">
          {MEDICAL_TESTS.map((t) => (
            <div key={t.code} className="border rounded-xl p-3">
              <p className="text-sm font-semibold">
                {t.code} — {t.fullForm}
              </p>
              <p className="text-xs text-slate-600 mt-1">{t.purpose}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.params
                  .filter((p) => p.ref)
                  .slice(0, 4)
                  .map((p) => `${p.name} ${p.ref}${p.unit ? ` ${p.unit}` : ""}`)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </SimplePage>
    );
  }
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.testType] = (acc[o.testType] || 0) + 1;
    return acc;
  }, {});
  return (
    <SimplePage title="Test count" hint="Volume by investigation on this node">
      {Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, n]) => (
          <div key={name} className="flex justify-between py-2 border-b text-sm">
            <span>{name}</span>
            <span className="font-black text-primary">{n}</span>
          </div>
        ))}
    </SimplePage>
  );
}

function SimplePage({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">{hint}</p>
      </div>
      <div className="bg-white border border-[#c1c7cf] rounded-xl p-4">{children}</div>
    </div>
  );
}

function ReportsMonthCalendar({
  date,
  onDate,
  counts,
  completedCounts,
}: {
  date: string;
  onDate: (ymd: string) => void;
  counts: Record<string, number>;
  completedCounts: Record<string, number>;
}) {
  const selected = new Date(`${date}T12:00:00`);
  const [cursor, setCursor] = useState({ y: selected.getFullYear(), m: selected.getMonth() });
  useEffect(() => {
    const s = new Date(`${date}T12:00:00`);
    setCursor({ y: s.getFullYear(), m: s.getMonth() });
  }, [date]);
  const today = toYmd(new Date());
  const title = new Date(cursor.y, cursor.m, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
  const cells = monthCells(cursor.y, cursor.m);

  return (
    <aside className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden xl:sticky xl:top-4">
      <div className="px-3 py-3 border-b bg-[#0B1220] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F97316]" />
          <p className="text-sm font-bold">{title}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
            className="p-1 rounded hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
            className="p-1 rounded hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 text-[10px] font-bold uppercase text-slate-400 text-center mb-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.ymd) return <span key={`e${i}`} />;
            const n = counts[c.ymd] || 0;
            const done = completedCounts[c.ymd] || 0;
            const on = c.ymd === date;
            const isToday = c.ymd === today;
            return (
              <button
                key={c.ymd}
                type="button"
                onClick={() => onDate(c.ymd!)}
                className={`h-9 rounded-md text-[12px] font-semibold relative ${
                  on ? "bg-[#F97316] text-white" : isToday ? "bg-sky-50 text-sky-800" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                {c.day}
                {n > 0 && !on && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500" />}
                {done > 0 && !on && <span className="absolute bottom-0.5 left-[58%] w-1 h-1 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => onDate(today)} className="mt-3 w-full text-[11px] font-semibold text-sky-700 border rounded-md py-1.5 hover:bg-sky-50">
          Jump to today
        </button>
        <p className="text-[10px] text-slate-400 mt-2">Click a date to see that day’s ongoing and completed reports.</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Ongoing
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed
          </span>
        </div>
      </div>
    </aside>
  );
}

function TodaysReports({
  orders,
  onSaveResults,
  onFinalResults,
  onSignOffResults,
  onView,
  onPatch,
}: {
  orders: LabOrder[];
  onSaveResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onFinalResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onSignOffResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onView: (order: LabOrder) => void;
  onPatch?: (orderId: string, patch: Partial<LabOrder>) => void;
}) {
  const [filter, setFilter] = useState<"all" | "progress" | "final" | "signed">("all");
  const [lastNameQ, setLastNameQ] = useState("");
  const [dobQ, setDobQ] = useState("");
  const [date, setDate] = useState(toYmd(new Date()));
  const [oldestFirst, setOldestFirst] = useState(true);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<LabOrder | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const enteringOrder = enteringId ? orders.find((o) => o.id === enteringId) : undefined;
  const searching = Boolean(lastNameQ.trim() || dobQ);

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const completedCounts: Record<string, number> = {};
    orders.forEach((o) => {
      const day = reportDay(o);
      if (!day) return;
      counts[day] = (counts[day] || 0) + 1;
      if (o.status === "COMPLETED") completedCounts[day] = (completedCounts[day] || 0) + 1;
    });
    return { counts, completedCounts };
  }, [orders]);

  const scoped = useMemo(() => {
    const last = lastNameQ.trim().toLowerCase();
    const dob = dobQ.trim();
    return orders.filter((o) => {
      const names = orderNames(o);
      if (last) {
        const hit = names.last.toLowerCase();
        if (!(hit === last || hit.startsWith(last))) return false;
      }
      if (dob && orderDob(o) !== dob) return false;
      if (!searching && reportDay(o) !== date) return false;
      return true;
    });
  }, [orders, lastNameQ, dobQ, date, searching]);

  const counts = useMemo(() => {
    const next = { all: scoped.length, progress: 0, final: 0, signed: 0 };
    scoped.forEach((o) => {
      const b = bucket(o);
      if (b === "progress" || b === "final" || b === "signed") next[b] += 1;
    });
    return next;
  }, [scoped]);

  const rows = useMemo(() => {
    const list = scoped.filter((o) => filter === "all" || bucket(o) === filter);
    const sorted = [...list].sort((a, b) => {
      const ta = a.orderTimestamp instanceof Date ? a.orderTimestamp.getTime() : 0;
      const tb = b.orderTimestamp instanceof Date ? b.orderTimestamp.getTime() : 0;
      return oldestFirst ? ta - tb : tb - ta;
    });
    return sorted;
  }, [scoped, filter, oldestFirst]);

  const printed = scoped.filter((o) => o.status === "COMPLETED").length;
  const tabs: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "progress", label: "In progress" },
    { id: "final", label: "Final" },
    { id: "signed", label: "Signed off" },
  ];

  const pickDate = (ymd: string) => {
    setDate(ymd);
    setLastNameQ("");
    setDobQ("");
  };

  const syncApp = async (order: LabOrder) => {
    if (!onPatch) {
      onView(order);
      return;
    }
    setSyncingId(order.id);
    try {
      const healthId = uniqueHealthId(order);
      const tagged = { ...order, suwasiriBarcode: healthId };
      onPatch(order.id, { suwasiriBarcode: healthId });
      let vaultId = healthId;
      if (!order.gpCareSyncedAt) {
        const clinic = await syncResultToGpCareClinic(tagged);
        if (clinic.ok) {
          onPatch(order.id, { gpCareSyncedAt: new Date().toISOString(), suwasiriBarcode: clinic.suwasiriPatientId || healthId });
          vaultId = clinic.suwasiriPatientId || healthId;
        }
      }
      const vault = await syncResultToSuwasiriVault(tagged, vaultId);
      if (!vault.ok) {
        alert(vault.error || "Could not sync to Suwasiri Vault.");
        return;
      }
      onPatch(order.id, { suwasiriSyncedAt: new Date().toISOString(), suwasiriBarcode: vault.suwasiriPatientId || healthId });
    } finally {
      setSyncingId(null);
    }
  };

  const searchHint = lastNameQ.trim()
    ? `${rows.length} report${rows.length === 1 ? "" : "s"} for last name “${lastNameQ.trim()}”`
    : dobQ
      ? `${rows.length} person${rows.length === 1 ? "" : "s"} born ${formatYmd(dobQ)}`
      : `${rows.length} report${rows.length === 1 ? "" : "s"} on ${formatYmd(date)}`;

  return (
    <div className="bg-white min-h-[70vh] -m-2 p-4">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
        <div>
      <div className="flex flex-wrap items-center gap-3 text-[12px] mb-3">
        <label className="inline-flex items-center gap-1.5 border border-slate-200 rounded-md px-2 py-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Last name</span>
          <input
            value={lastNameQ}
            onChange={(e) => setLastNameQ(e.target.value)}
            placeholder="Perera"
            className="outline-none w-28 font-semibold text-slate-800"
          />
        </label>
        <label className="inline-flex items-center gap-1.5 border border-slate-200 rounded-md px-2 py-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">DOB</span>
          <input type="date" value={dobQ} onChange={(e) => setDobQ(e.target.value)} className="outline-none font-semibold text-slate-800" />
        </label>
        {(lastNameQ || dobQ) && (
          <button
            type="button"
            onClick={() => {
              setLastNameQ("");
              setDobQ("");
            }}
            className="text-[11px] font-semibold text-sky-800"
          >
            Clear search
          </button>
        )}
        <span className="ml-auto text-slate-500">
          Sort by:{" "}
          <button type="button" onClick={() => setOldestFirst((v) => !v)} className="font-semibold text-slate-800">
            {oldestFirst ? "Oldest first" : "Newest first"}
          </button>
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Printer className="w-3.5 h-3.5" /> {printed}/{scoped.length} Printed
        </span>
      </div>

      <p className="text-[12px] font-semibold text-slate-600 mb-2">{searchHint}</p>

      <div className="flex items-center gap-5 border-b border-slate-200 text-[13px]">
        {tabs.map((t) => {
          const tone =
            t.id === "progress"
              ? { on: "border-emerald-600 text-emerald-800", count: "text-emerald-600" }
              : t.id === "final"
                ? { on: "border-blue-600 text-blue-800", count: "text-blue-600" }
                : t.id === "signed"
                  ? { on: "border-emerald-600 text-emerald-800", count: "text-emerald-600" }
                  : { on: "border-slate-700 text-slate-800", count: "text-slate-500" };
          return (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`pb-2 -mb-px border-b-2 font-semibold ${filter === t.id ? tone.on : "border-transparent text-slate-500"}`}
          >
            {t.label} <span className={filter === t.id ? tone.count : "text-slate-400"}>{counts[t.id]}</span>
          </button>
          );
        })}
      </div>

      <table className="w-full mt-2 text-left text-[12px]">
        <thead className="text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-2 font-medium">Reg. no.</th>
            <th className="py-2 font-medium">Date / time</th>
            <th className="py-2 font-medium">Patient</th>
            <th className="py-2 font-medium">DOB</th>
            <th className="py-2 font-medium">Referred by</th>
            <th className="py-2 font-medium">Tests</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-slate-400">
                No ongoing or completed reports{searching ? " match this search" : ` on ${formatYmd(date)}`}.
              </td>
            </tr>
          )}
          {rows.map((o) => {
            const b = bucket(o);
            const names = orderNames(o);
            const when = reportDateTime(o);
            const status =
              b === "signed" ? (
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Signed off</span>
              ) : b === "final" ? (
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Final</span>
              ) : b === "progress" ? (
                <span className="text-[10px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">In progress</span>
              ) : (
                <span className="text-[10px] font-bold uppercase bg-sky-600 text-white px-2 py-0.5 rounded">New</span>
              );
            return (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="py-3">
                  <div className="text-sky-700 font-semibold">#{o.specimenId.replace("LNK-", "")}</div>
                  <div className="text-[10px] text-slate-400">L{o.id}</div>
                </td>
                <td className="py-3 text-slate-700">
                  <div className="font-semibold">{when.date}</div>
                  <div className="text-[11px] text-slate-500">{when.time}</div>
                </td>
                <td className="py-3">
                  <div className="font-medium text-sky-800">
                    {names.first || o.patientName}
                    {names.last ? <span className="text-slate-800"> {names.last}</span> : null}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {o.age} YRS / {o.gender[0]}
                  </div>
                </td>
                <td className="py-3 text-slate-600 whitespace-nowrap">{formatYmd(orderDob(o))}</td>
                <td className="py-3 text-slate-600">{o.connectedClinic || "—"}</td>
                <td className="py-3 max-w-[220px]">{o.testType}</td>
                <td className="py-3">{status}</td>
                <td className="py-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-sky-700">
                    <button type="button" onClick={() => setEnteringId(o.id)} className="inline-flex items-center gap-1 font-semibold">
                      <Pencil className="w-3.5 h-3.5" /> Enter
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewing(o)}
                      className="inline-flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      type="button"
                      title="Open the lab report and email the referring doctor"
                      onClick={() => setViewing(o)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-100 text-violet-800"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button
                      type="button"
                      title="Sync to this patient’s Suwasiri Vault → Lab reports"
                      disabled={syncingId === o.id}
                      onClick={() => void syncApp(o)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        o.suwasiriSyncedAt ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> {syncingId === o.id ? "…" : "App"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
        <ReportsMonthCalendar date={date} onDate={pickDate} counts={dayCounts.counts} completedCounts={dayCounts.completedCounts} />
      </div>

      {enteringOrder && (
        <EnterResultsPage
          order={enteringOrder}
          onCancel={() => setEnteringId(null)}
          onSave={(results, extra) => onSaveResults(enteringOrder, results, extra)}
          onFinal={(results, extra) => {
            onFinalResults(enteringOrder, results, extra);
          }}
          onSignOff={(results, extra) => {
            onSignOffResults(enteringOrder, results, extra);
            setEnteringId(null);
          }}
        />
      )}

      {viewing && <LabReportPreview order={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

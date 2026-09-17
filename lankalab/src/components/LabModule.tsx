import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, BarChart3, Printer, Pencil, Eye, MoreHorizontal } from "lucide-react";
import type { LabOrder } from "../types";
import { testCatalogItems } from "../data/mockData";
import EnterResultsPage from "./EnterResultsPage";

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

export default function LabModule({
  orders,
  panel,
  onSaveResults,
  onFinalResults,
  onSignOffResults,
  onView,
}: {
  orders: LabOrder[];
  panel: LabPanel;
  onSaveResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onFinalResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onSignOffResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onView: (order: LabOrder) => void;
}) {
  if (panel === "today") {
    return (
      <TodaysReports
        orders={orders}
        onSaveResults={onSaveResults}
        onFinalResults={onFinalResults}
        onSignOffResults={onSignOffResults}
        onView={onView}
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
    const cats = Array.from(new Set(testCatalogItems.map((t) => t.category)));
    return (
      <SimplePage title="Test categories" hint="Catalog grouping">
        <div className="grid sm:grid-cols-2 gap-3">
          {cats.map((c) => (
            <div key={c} className="border rounded-xl p-4">
              <p className="font-bold text-sm">{c}</p>
              <p className="text-xs text-slate-500">{testCatalogItems.filter((t) => t.category === c).length} tests</p>
            </div>
          ))}
        </div>
      </SimplePage>
    );
  }
  if (panel === "database") {
    return (
      <SimplePage title="Test database" hint="Full investigation list">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase text-slate-400">
            <tr>
              <th className="py-2">Code</th>
              <th className="py-2">Name</th>
              <th className="py-2">Category</th>
              <th className="py-2">TAT</th>
            </tr>
          </thead>
          <tbody>
            {testCatalogItems.map((t) => (
              <tr key={t.code} className="border-t">
                <td className="py-2 font-mono text-sky-700">{t.code}</td>
                <td className="py-2">{t.name}</td>
                <td className="py-2">{t.category}</td>
                <td className="py-2">{t.turnaroundTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SimplePage>
    );
  }
  if (panel === "interpretations") {
    return (
      <SimplePage title="Interpretations" hint="Clinical notes stored with each assay">
        <div className="space-y-3">
          {testCatalogItems.slice(0, 12).map((t) => (
            <div key={t.code} className="border rounded-xl p-3">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-slate-600 mt-1">{t.clinicalSignificance}</p>
              <p className="text-[11px] text-slate-400 mt-1">Ref: {t.referenceValue}</p>
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

function TodaysReports({
  orders,
  onSaveResults,
  onFinalResults,
  onSignOffResults,
  onView,
}: {
  orders: LabOrder[];
  onSaveResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onFinalResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onSignOffResults: (order: LabOrder, results: ResultRow[], extra: ResultExtra) => void;
  onView: (order: LabOrder) => void;
}) {
  const [filter, setFilter] = useState<"all" | "new" | "progress" | "final" | "signed">("all");
  const [q, setQ] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [oldestFirst, setOldestFirst] = useState(true);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const enteringOrder = enteringId ? orders.find((o) => o.id === enteringId) : undefined;

  const counts = useMemo(() => {
    const next = { all: orders.length, new: 0, progress: 0, final: 0, signed: 0 };
    orders.forEach((o) => {
      next[bucket(o)] += 1;
    });
    return next;
  }, [orders]);

  const rows = useMemo(() => {
    const n = q.toLowerCase();
    const list = orders.filter((o) => {
      if (filter !== "all" && bucket(o) !== filter) return false;
      if (!n) return true;
      return (
        o.patientName.toLowerCase().includes(n) ||
        o.specimenId.toLowerCase().includes(n) ||
        o.testType.toLowerCase().includes(n) ||
        (o.connectedClinic || "").toLowerCase().includes(n)
      );
    });
    return oldestFirst ? list : [...list].reverse();
  }, [orders, filter, q, oldestFirst]);

  const printed = orders.filter((o) => o.status === "COMPLETED").length;
  const tabs: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "progress", label: "In progress" },
    { id: "final", label: "Final" },
    { id: "signed", label: "Signed off" },
  ];

  const shiftDate = (days: number) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="bg-white min-h-[70vh] -m-2 p-4">
      <div className="flex flex-wrap items-center gap-3 text-[12px] mb-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in page" className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-md w-48" />
        </div>
        <div className="inline-flex items-center border border-slate-200 rounded-md overflow-hidden">
          <button type="button" onClick={() => shiftDate(-1)} className="px-2 py-1.5 hover:bg-slate-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <label className="px-2 py-1.5 border-x border-slate-200 inline-flex items-center gap-1">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="outline-none" />
          </label>
          <button type="button" onClick={() => shiftDate(1)} className="px-2 py-1.5 hover:bg-slate-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <select className="border border-slate-200 rounded-md px-2 py-1.5">
          <option>Go to</option>
          <option>New</option>
          <option>Signed off</option>
        </select>
        <button type="button" className="inline-flex items-center gap-1 border border-slate-200 rounded-md px-2 py-1.5 font-semibold text-sky-800">
          <BarChart3 className="w-3.5 h-3.5" /> Stats
        </button>
        <span className="ml-auto text-slate-500">
          Sort by:{" "}
          <button type="button" onClick={() => setOldestFirst((v) => !v)} className="font-semibold text-slate-800">
            {oldestFirst ? "Oldest first" : "Newest first"}
          </button>
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Printer className="w-3.5 h-3.5" /> {printed}/{orders.length} Printed
        </span>
      </div>

      <div className="flex items-center gap-5 border-b border-slate-200 text-[13px]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`pb-2 -mb-px border-b-2 ${filter === t.id ? "border-sky-600 text-sky-800 font-semibold" : "border-transparent text-slate-500"}`}
          >
            {t.label} <span className="text-slate-400">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <table className="w-full mt-2 text-left text-[12px]">
        <thead className="text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-2 font-medium">Reg. no.</th>
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Patient</th>
            <th className="py-2 font-medium">Referred by</th>
            <th className="py-2 font-medium">Tests</th>
            <th className="py-2 font-medium">CC</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const b = bucket(o);
            const status =
              b === "signed" ? (
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Signed off</span>
              ) : b === "final" ? (
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Final</span>
              ) : b === "progress" ? (
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">In progress</span>
              ) : (
                <span className="text-[10px] font-bold uppercase bg-sky-600 text-white px-2 py-0.5 rounded">New</span>
              );
            const time = o.orderTime.replace("Today, ", "");
            return (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="py-3">
                  <div className="text-sky-700 font-semibold">#{o.specimenId.replace("LNK-", "")}</div>
                  <div className="text-[10px] text-slate-400">L{o.id}</div>
                </td>
                <td className="py-3 text-slate-600">{time}</td>
                <td className="py-3">
                  <div className="font-medium text-sky-800">{o.patientName}</div>
                  <div className="text-[11px] text-slate-400">
                    {o.age} YRS / {o.gender[0]}
                  </div>
                </td>
                <td className="py-3 text-slate-600">{o.connectedClinic || "—"}</td>
                <td className="py-3 max-w-[220px]">{o.testType}</td>
                <td className="py-3 text-slate-500">{o.wardOrDept || "Main"}</td>
                <td className="py-3">{status}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2 text-sky-700">
                    <button type="button" onClick={() => setEnteringId(o.id)} className="inline-flex items-center gap-1 font-semibold">
                      <Pencil className="w-3.5 h-3.5" /> Enter results
                    </button>
                    <button type="button" onClick={() => onView(o)} className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
    </div>
  );
}

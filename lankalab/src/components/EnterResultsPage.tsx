import React, { useMemo, useState } from "react";
import { Pencil, Plus, User, History, FileSearch, Activity, Check, Printer } from "lucide-react";
import type { LabOrder } from "../types";

type ResultRow = NonNullable<LabOrder["results"]>[number];

type FormulaId = "abs-neu" | "abs-lym" | "abs-eos" | "abs-mono" | "abs-bas" | "nlr";

type Param = {
  id: string;
  name: string;
  unit: string;
  ref: string;
  indent?: boolean;
  formula?: FormulaId;
  formulaExpr?: string;
};

type Panel = { department: string; title: string; params: Param[] };

const CBC: Panel = {
  department: "HAEMATOLOGY",
  title: "CBC (WITH ABSOLUTE COUNTS)",
  params: [
    { id: "hb", name: "Hemoglobin", unit: "g/dl", ref: "12 - 15" },
    { id: "esr", name: "ESR", unit: "mm/hr", ref: "0 - 15" },
    { id: "tlc", name: "Total Leukocyte Count", unit: "cumm", ref: "4,800 - 10,800" },
    { id: "diff", name: "Differential Leukocyte Count", unit: "", ref: "" },
    { id: "neu", name: "Neutrophils", unit: "%", ref: "40 - 80", indent: true },
    { id: "lym", name: "Lymphocyte", unit: "%", ref: "20 - 40", indent: true },
    { id: "eos", name: "Eosinophils", unit: "%", ref: "1 - 6", indent: true },
    { id: "mono", name: "Monocytes", unit: "%", ref: "2 - 10", indent: true },
    { id: "bas", name: "Basophils", unit: "%", ref: "< 2", indent: true },
    { id: "diff-abs", name: "Differential Leukocyte Count (Absolute count)", unit: "", ref: "" },
    {
      id: "abs-neu",
      name: "Neutrophils",
      unit: "x10^3/µL",
      ref: "2 - 7",
      indent: true,
      formula: "abs-neu",
      formulaExpr: "(TLC × Neutrophils %) ÷ 100 ÷ 1000",
    },
    {
      id: "abs-lym",
      name: "Lymphocytes",
      unit: "x10^3/µL",
      ref: "1 - 3",
      indent: true,
      formula: "abs-lym",
      formulaExpr: "(TLC × Lymphocyte %) ÷ 100 ÷ 1000",
    },
    {
      id: "abs-eos",
      name: "Eosinophils",
      unit: "x10^3/µL",
      ref: "0.02 - 0.5",
      indent: true,
      formula: "abs-eos",
      formulaExpr: "(TLC × Eosinophils %) ÷ 100 ÷ 1000",
    },
    {
      id: "abs-mono",
      name: "Monocytes",
      unit: "x10^3/µL",
      ref: "0.1 - 1",
      indent: true,
      formula: "abs-mono",
      formulaExpr: "(TLC × Monocytes %) ÷ 100 ÷ 1000",
    },
    {
      id: "abs-bas",
      name: "Basophils",
      unit: "x10^3/µL",
      ref: "0.02 - 0.1",
      indent: true,
      formula: "abs-bas",
      formulaExpr: "(TLC × Basophils %) ÷ 100 ÷ 1000",
    },
    {
      id: "nlr",
      name: "Neutrophil Lymphocyte Ratio",
      unit: "",
      ref: "",
      formula: "nlr",
      formulaExpr: "Neutrophils % ÷ Lymphocyte %",
    },
    { id: "plt", name: "Platelet Count", unit: "lakhs/cumm", ref: "1.5 - 4.1" },
    { id: "rbc", name: "Total RBC Count", unit: "million/cumm", ref: "3.9 - 4.8" },
    { id: "hct", name: "Hematocrit Value, HCT", unit: "%", ref: "36 - 46" },
    { id: "mcv", name: "Mean Corpuscular Volume, MCV", unit: "fL", ref: "83 - 101" },
    { id: "rdw-cv", name: "R.D.W. - CV (Optional)", unit: "%", ref: "11.6 - 14" },
    { id: "rdw-sd", name: "R.D.W. - SD (Optional)", unit: "fL", ref: "39 - 46" },
  ],
};

const KFT: Panel = {
  department: "BIOCHEMISTRY",
  title: "KFT WITHOUT EGFR",
  params: [
    { id: "bun", name: "BUN", unit: "mg/dl", ref: "7.9 - 20" },
    { id: "urea", name: "Serum Urea", unit: "mg/dl", ref: "13 - 40" },
    { id: "creat", name: "Serum Creatinine", unit: "mg/dl", ref: "0.55 - 1.02" },
    { id: "ca", name: "Serum Calcium", unit: "mg/dl", ref: "8.8 - 10.6" },
    { id: "k", name: "Serum Potassium", unit: "mmol/L", ref: "3.5 - 5.1" },
    { id: "na", name: "Serum Sodium", unit: "mmol/L", ref: "136 - 146" },
  ],
};

const LFT: Panel = {
  department: "BIOCHEMISTRY",
  title: "LIVER FUNCTION TEST",
  params: [
    { id: "ast", name: "AST (SGOT)", unit: "U/L", ref: "0 - 40" },
    { id: "alt", name: "ALT (SGPT)", unit: "U/L", ref: "0 - 41" },
    { id: "alp", name: "Alkaline Phosphatase", unit: "U/L", ref: "40 - 129" },
    { id: "bili-t", name: "Total Bilirubin", unit: "mg/dl", ref: "0.1 - 1.2" },
    { id: "alb", name: "Albumin", unit: "g/dl", ref: "3.5 - 5.2" },
  ],
};

function panelsFor(testType: string): Panel[] {
  const t = testType.toLowerCase();
  const out: Panel[] = [CBC, KFT];
  if (/lft|liver|bilirubin/.test(t)) out.push(LFT);
  return out;
}

function isAbnormal(value: string, ref: string) {
  const n = Number(value);
  if (!value || !Number.isFinite(n) || !ref) return false;
  const nums = ref.replace(/,/g, "").match(/[\d.]+/g)?.map(Number) || [];
  if (ref.includes("<") && nums[0] != null) return n >= nums[0];
  if (nums.length >= 2) return n < nums[0] || n > nums[1];
  return false;
}

function parseNum(raw: string | undefined) {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(String(raw).replace(/[% ,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Convert TLC in cumm (e.g. 4800) or already ×10³/µL (e.g. 4.8) to ×10³/µL. */
function tlcAsThousands(tlc: string | undefined) {
  const w = parseNum(tlc);
  if (w == null || w <= 0) return null;
  return w > 200 ? w / 1000 : w;
}

/** Absolute count (×10³/µL) = TLC (cumm) × differential % / 100 / 1000 */
function absFrom(tlc: string | undefined, pct: string | undefined) {
  const wbc = tlcAsThousands(tlc);
  const p = parseNum(pct);
  if (wbc == null || p == null) return "";
  return ((wbc * p) / 100).toFixed(2);
}

function nlrFrom(neu: string | undefined, lym: string | undefined) {
  const n = parseNum(neu);
  const l = parseNum(lym);
  if (n == null || l == null || l === 0) return "";
  return (n / l).toFixed(2);
}

type InterpDraft = {
  creatIntro: string;
  incCreatTitle: string;
  incCreat: string;
  decCreatTitle: string;
  decCreat: string;
  bunIntro: string;
  incBunTitle: string;
  incBun: string;
  decBunTitle: string;
  decBun: string;
};

const DEFAULT_INTERP: InterpDraft = {
  creatIntro:
    "Creatinine is a nitrogenous waste product formed in muscle from creatine phosphate. Endogenous production of creatinine is proportional to muscle mass and body weight.",
  incCreatTitle: "Causes of Increased Serum Creatinine Level",
  incCreat: "1. Pre-renal, renal, and post-renal azotemia\n2. Large amount of dietary meat\n3. Active acromegaly and gigantism",
  decCreatTitle: "Causes of Decreased Serum Creatinine Level",
  decCreat: "1. Pregnancy\n2. Increasing age (reduction in muscle mass)",
  bunIntro:
    "BUN/creatinine ratio is used to discriminate pre-renal and post-renal azotemia from renal azotemia. Normal ratio is 12:1 to 20:1.",
  incBunTitle: "Causes of Increased BUN/Creatinine Ratio (>20:1)",
  incBun:
    "1. Increased BUN with normal serum creatinine:\n   a) Pre-renal azotemia  b) High protein diet  c) Increased protein catabolism  d) Gastrointestinal hemorrhage\n2. Increase of both BUN and serum creatinine with a disproportionately greater increase of BUN:\n   a) Post-renal azotemia (Obstruction to the outflow of urine).",
  decBunTitle: "Causes of Decreased BUN/Creatinine Ratio (<10:1)",
  decBun: "1. Acute tubular necrosis\n2. Low protein diet, starvation\n3. Severe liver disease",
};

function interpPlain(i: InterpDraft) {
  return [i.creatIntro, `${i.incCreatTitle}\n${i.incCreat}`, `${i.decCreatTitle}\n${i.decCreat}`, i.bunIntro, `${i.incBunTitle}\n${i.incBun}`, `${i.decBunTitle}\n${i.decBun}`].join("\n\n");
}

function formatStamp(d: Date) {
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", "");
}

function formatYmd(ymd: string, time?: string) {
  if (!ymd) return "—";
  const [y, m, day] = ymd.split("-");
  const datePart = `${day}/${m}/${y}`;
  if (!time) return datePart;
  const [hh, mm] = time.split(":").map(Number);
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${datePart} ${String(h12).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")} ${ap}`;
}

function formatShownValue(id: string, value: string) {
  if (id === "tlc") {
    const n = parseNum(value);
    if (n != null && n >= 1000) return n.toLocaleString("en-US");
  }
  return value;
}

function flagSide(value: string, ref: string) {
  if (!isAbnormal(value, ref)) return null;
  const nums = ref.replace(/,/g, "").match(/[\d.]+/g)?.map(Number) || [];
  const n = Number(value);
  if (ref.includes("<") && nums[0] != null) return n >= nums[0] ? "H" : null;
  if (nums.length >= 2 && n < nums[0]) return "L";
  return "H";
}

type ResultExtra = { notes: string; remarks: string; advice: string; interpretation?: string };

export default function EnterResultsPage({
  order,
  onCancel,
  onSave,
  onFinal,
  onSignOff,
}: {
  order: LabOrder;
  onCancel: () => void;
  onSave: (results: ResultRow[], extra: ResultExtra) => void;
  onFinal: (results: ResultRow[], extra: ResultExtra) => void;
  onSignOff: (results: ResultRow[], extra: ResultExtra) => void;
}) {
  const panels = useMemo(() => panelsFor(order.testType), [order.testType]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    (order.results || []).forEach((r) => {
      const pname = r.parameter.toLowerCase();
      const hit = panels.flatMap((p) => p.params).find((p) => {
        const n = p.name.toLowerCase();
        return (
          n === pname ||
          pname.includes(n) ||
          n.includes(pname) ||
          (p.id === "hb" && pname.includes("hemoglobin")) ||
          (p.id === "tlc" && (pname.includes("wbc") || pname.includes("leukocyte") || pname.includes("white blood"))) ||
          (p.id === "esr" && pname.includes("esr"))
        );
      });
      if (hit) seed[hit.id] = r.value;
    });
    return seed;
  });
  const [notes, setNotes] = useState("");
  const [remarks, setRemarks] = useState("");
  const [advice, setAdvice] = useState("");
  const [showInterp, setShowInterp] = useState(true);
  const [editInterp, setEditInterp] = useState(false);
  const [interp, setInterp] = useState<InterpDraft>(DEFAULT_INTERP);
  const [skipInterp, setSkipInterp] = useState(false);
  const [showExtract, setShowExtract] = useState(false);
  const [printReady, setPrintReady] = useState(true);
  const [samePage, setSamePage] = useState(true);
  const [collected, setCollected] = useState("");
  const [receivedOn, setReceivedOn] = useState(new Date().toISOString().slice(0, 10));
  const [reportedOn, setReportedOn] = useState(new Date().toISOString().slice(0, 10));
  const [reportedTime, setReportedTime] = useState(new Date().toTimeString().slice(0, 5));

  const setVal = (id: string, v: string) => setValues((prev) => ({ ...prev, [id]: v }));

  const derived = useMemo(
    () => ({
      "abs-neu": absFrom(values.tlc, values.neu),
      "abs-lym": absFrom(values.tlc, values.lym),
      "abs-eos": absFrom(values.tlc, values.eos),
      "abs-mono": absFrom(values.tlc, values.mono),
      "abs-bas": absFrom(values.tlc, values.bas),
      nlr: nlrFrom(values.neu, values.lym),
    }),
    [values.tlc, values.neu, values.lym, values.eos, values.mono, values.bas]
  );

  const display = (p: Param) => {
    if (p.formula) return derived[p.formula];
    return values[p.id] || "";
  };

  const diffTotal = ["neu", "lym", "eos", "mono", "bas"].reduce((s, k) => s + (parseNum(values[k]) || 0), 0);

  const collectResults = (): ResultRow[] =>
    panels.flatMap((panel) =>
      panel.params
        .filter((p) => p.unit || p.formula)
        .map((p) => {
          const value = display(p);
          return {
            parameter: p.name,
            value,
            unit: p.unit,
            referenceRange: p.ref,
            isAbnormal: isAbnormal(value, p.ref),
          };
        })
        .filter((r) => r.value)
    );

  const extra: ResultExtra = { notes, remarks, advice, interpretation: interpPlain(interp) };
  const stamp = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date();
  const reg = order.specimenId.replace("LNK-", "");

  if (showExtract) {
    return (
      <FinalExtract
        order={order}
        panels={panels}
        display={display}
        interp={interp}
        setInterp={setInterp}
        editInterp={editInterp}
        setEditInterp={setEditInterp}
        skipInterp={skipInterp}
        collected={collected}
        receivedOn={receivedOn}
        reportedOn={reportedOn}
        reportedTime={reportedTime}
        stamp={stamp}
        reg={reg}
        extra={extra}
        onEditValues={() => setShowExtract(false)}
        onSave={() => onSave(collectResults(), extra)}
        onSignOff={() => onSignOff(collectResults(), extra)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[85] bg-white overflow-y-auto">
      <div className="min-h-full pb-20">
        <div className="border-b px-4 py-2 flex gap-4 text-[12px] text-sky-800 font-semibold">
          <button type="button" onClick={() => setNotes((n) => n || " ")} className="inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add notes
          </button>
          <button type="button" onClick={() => setRemarks((n) => n || " ")} className="inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add remarks
          </button>
          <button type="button" onClick={() => setAdvice((n) => n || " ")} className="inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add advices
          </button>
          <button type="button" onClick={onCancel} className="ml-auto text-slate-600 font-bold">
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px]">
          <div className="p-5">
            <div className="border rounded-lg p-3 text-[12px] grid sm:grid-cols-3 gap-x-6 gap-y-1 mb-5">
              <p>
                <span className="text-slate-500">Patient Name:</span> <b>{order.patientName}</b>
              </p>
              <p className="inline-flex items-center gap-1">
                <span className="text-slate-500">Registered on:</span> {stamp.toLocaleDateString("en-GB")} {stamp.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="sm:row-span-3 justify-self-end font-mono text-xs border px-2 py-1 text-center leading-tight">
                <span className="block text-[10px] tracking-[0.35em] text-slate-800">||||| |||| |||</span>
                {reg}
              </p>
              <p>
                <span className="text-slate-500">Age / Sex:</span> {order.age} YRS / {order.gender[0]}
              </p>
              <p className="inline-flex items-center gap-1">
                <span className="text-slate-500">Collected on:</span>
                <input type="date" value={collected} onChange={(e) => setCollected(e.target.value)} className="border rounded px-1" />
              </p>
              <p>
                <span className="text-slate-500">Referred By:</span> {order.connectedClinic || "—"}
              </p>
              <p className="inline-flex items-center gap-1">
                <span className="text-slate-500">Received on:</span>
                <input type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} className="border rounded px-1" />
              </p>
              <p>
                <span className="text-slate-500">Reg. no.</span> {reg}
              </p>
              <p className="inline-flex items-center gap-1">
                <span className="text-slate-500">Reported on:</span>
                <input type="date" value={reportedOn} onChange={(e) => setReportedOn(e.target.value)} className="border rounded px-1" />
                <input type="time" value={reportedTime} onChange={(e) => setReportedTime(e.target.value)} className="border rounded px-1" />
              </p>
            </div>

            {panels.map((panel) => (
              <section key={panel.title} className="mb-8">
                <h2 className="text-center text-lg font-black tracking-wide">{panel.department}</h2>
                <p className="text-center text-sm font-semibold mb-2">{panel.title}</p>
                <div className="flex flex-wrap gap-3 justify-center text-[11px] text-sky-800 mb-3">
                  <label className="inline-flex items-center gap-1">
                    <input type="checkbox" checked={printReady} onChange={(e) => setPrintReady(e.target.checked)} /> Print ready
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input type="checkbox" checked={samePage} onChange={(e) => setSamePage(e.target.checked)} /> Keep in same page
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input type="checkbox" /> Print from new page
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input type="checkbox" checked={skipInterp} onChange={(e) => setSkipInterp(e.target.checked)} /> Skip interpretation
                  </label>
                </div>
                <div className="grid grid-cols-[1fr_160px_80px_120px] gap-x-2 text-[11px] font-bold uppercase text-slate-500 px-1 mb-1">
                  <span>Test</span>
                  <span>Value</span>
                  <span>Unit</span>
                  <span>Reference</span>
                </div>
                {panel.params.map((p) => {
                  const val = display(p);
                  const header = !p.unit && !p.formula;
                  if (header) {
                    return (
                      <div key={p.id} className="mt-3 mb-1">
                        <p className="text-[13px] font-semibold text-slate-800">{p.name}</p>
                        {p.id === "diff-abs" && (
                          <p className="text-[11px] text-sky-800 pl-0 sm:pl-6 mt-0.5">
                            Formula: Absolute (×10³/µL) = TLC (cumm) × differential % ÷ 100 ÷ 1000
                          </p>
                        )}
                      </div>
                    );
                  }
                  const computed = Boolean(p.formula);
                  const flag = isAbnormal(val, p.ref);
                  const low = flag && Number(val) < (p.ref.replace(/,/g, "").match(/[\d.]+/g)?.map(Number)[0] ?? Infinity);
                  return (
                    <React.Fragment key={p.id}>
                      <div className={`grid grid-cols-[1fr_160px_80px_120px] gap-x-2 items-center py-1 ${p.indent ? "pl-6" : ""}`}>
                        <span className={`text-[13px] inline-flex items-center gap-1 ${flag ? "font-black text-rose-700" : "text-slate-800"}`}>
                          <Pencil className="w-3 h-3 text-slate-400" /> {p.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {computed && (
                            <span title={p.formulaExpr || "Calculated"} className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded px-1">
                              f
                            </span>
                          )}
                          {flag && val && (
                            <span className="text-[10px] font-black text-rose-700">{low ? "L" : "H"}</span>
                          )}
                          <input
                            value={val}
                            onChange={(e) => !computed && setVal(p.id, e.target.value)}
                            readOnly={computed}
                            title={computed ? p.formulaExpr : undefined}
                            placeholder={p.id === "tlc" ? "e.g. 4800" : computed ? "auto" : ""}
                            className={`w-full border rounded px-2 py-1 text-sm ${
                              computed
                                ? "border-amber-400 bg-amber-50/40"
                                : flag
                                  ? "border-amber-400 text-rose-700 font-bold"
                                  : "border-slate-200"
                            } ${flag ? "text-rose-700 font-bold" : ""}`}
                          />
                          <button
                            type="button"
                            title={computed ? p.formulaExpr || "Apply formula" : "Add"}
                            className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-center leading-6 shrink-0"
                          >
                            +
                          </button>
                        </span>
                        <span className="text-[12px] text-slate-600">{p.unit}</span>
                        <span className="text-[12px] text-slate-600 inline-flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-slate-400" /> {p.ref}
                        </span>
                      </div>
                      {p.id === "bas" && (
                        <p className="text-[12px] text-slate-600 mt-1 mb-2 pl-6">
                          Total: {diffTotal || 0}
                          {diffTotal > 0 && diffTotal !== 100 ? <span className="text-rose-600 font-bold"> (should be 100)</span> : null}
                        </p>
                      )}
                    </React.Fragment>
                  );
                })}
              </section>
            ))}

            <div className="flex flex-wrap gap-2 text-[12px] text-sky-800 font-semibold mb-3">
              <button type="button" onClick={() => { setShowInterp(true); setSkipInterp(false); }} className="inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add interpretation
              </button>
            </div>

            {showInterp && !skipInterp && (
              <InterpEditor interp={interp} setInterp={setInterp} editing={editInterp} onToggleEdit={() => setEditInterp((v) => !v)} />
            )}

            {(notes !== "" || remarks !== "" || advice !== "") && (
              <div className="space-y-2 mb-6">
                {notes !== "" && (
                  <label className="block text-[12px] font-bold">
                    Notes
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full border rounded p-2 text-sm min-h-[70px]" />
                  </label>
                )}
                {remarks !== "" && (
                  <label className="block text-[12px] font-bold">
                    Remarks
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 w-full border rounded p-2 text-sm min-h-[70px]" />
                  </label>
                )}
                {advice !== "" && (
                  <label className="block text-[12px] font-bold">
                    Advices
                    <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} className="mt-1 w-full border rounded p-2 text-sm min-h-[70px]" />
                  </label>
                )}
              </div>
            )}
            <p className="text-[12px] font-semibold text-slate-500 mb-2">More details</p>
            <textarea className="w-full border rounded p-2 text-sm min-h-[80px] mb-4" placeholder="More details" />
          </div>

          <aside className="border-l p-3 space-y-2 text-[12px] bg-slate-50">
            <p className="text-[11px] font-bold uppercase text-slate-400">Sidebar</p>
            <div className="bg-white border rounded-lg p-2">
              <p className="font-semibold inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Patient info
              </p>
              <p className="text-slate-600 mt-1">{order.patientName}</p>
            </div>
            <div className="bg-white border rounded-lg p-2">
              <p className="font-semibold inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-600" /> Doctor info
              </p>
              <p className="text-slate-600 mt-1">{order.connectedClinic || "Walk-in"}</p>
            </div>
            <div className="bg-white border rounded-lg p-2">
              <p className="font-semibold inline-flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-pink-600" /> Patient history
              </p>
              <p className="text-slate-600 mt-1">{order.notes || "No prior notes."}</p>
            </div>
            <div className="bg-white border rounded-lg p-2">
              <p className="font-semibold inline-flex items-center gap-1">
                <FileSearch className="w-3.5 h-3.5 text-emerald-600" /> Recent lab reports
              </p>
              <p className="text-slate-600 mt-1">{order.testType}</p>
            </div>
            <div className="bg-white border rounded-lg p-2">
              <p className="font-semibold inline-flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-600" /> Report activities
              </p>
              <p className="text-slate-600 mt-1">Entering results now</p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex items-center gap-2 z-[90] print:hidden">
        <button type="button" onClick={() => onSignOff(collectResults(), extra)} className="px-4 py-2 bg-sky-700 text-white rounded text-sm font-semibold">
          Sign off
        </button>
        <button
          type="button"
          onClick={() => {
            onFinal(collectResults(), extra);
            setEditInterp(false);
            setShowExtract(true);
          }}
          className="px-4 py-2 border border-sky-700 text-sky-800 rounded text-sm font-semibold inline-flex items-center gap-1"
        >
          <Check className="w-4 h-4" /> Final
        </button>
        <button type="button" onClick={() => onSave(collectResults(), extra)} className="px-4 py-2 border rounded text-sm font-semibold">
          Save only
        </button>
      </div>
    </div>
  );
}

function InterpEditor({
  interp,
  setInterp,
  editing,
  onToggleEdit,
}: {
  interp: InterpDraft;
  setInterp: React.Dispatch<React.SetStateAction<InterpDraft>>;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  const set = (key: keyof InterpDraft, value: string) => setInterp((prev) => ({ ...prev, [key]: value }));
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2 print:hidden">
        <h3 className="font-semibold">Interpretations</h3>
        <button type="button" onClick={onToggleEdit} className="inline-flex items-center gap-1 text-sky-800 text-[12px] font-semibold">
          <Pencil className="w-3.5 h-3.5" /> {editing ? "Done" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div className="space-y-3 print:hidden">
          <textarea value={interp.creatIntro} onChange={(e) => set("creatIntro", e.target.value)} className="w-full border rounded p-2 text-[13px] min-h-[70px]" />
          <div className="grid md:grid-cols-2 gap-2">
            <label className="text-[12px] font-bold">
              <input value={interp.incCreatTitle} onChange={(e) => set("incCreatTitle", e.target.value)} className="w-full border rounded px-2 py-1 mb-1 font-bold" />
              <textarea value={interp.incCreat} onChange={(e) => set("incCreat", e.target.value)} className="w-full border rounded p-2 min-h-[110px] font-normal" />
            </label>
            <label className="text-[12px] font-bold">
              <input value={interp.decCreatTitle} onChange={(e) => set("decCreatTitle", e.target.value)} className="w-full border rounded px-2 py-1 mb-1 font-bold" />
              <textarea value={interp.decCreat} onChange={(e) => set("decCreat", e.target.value)} className="w-full border rounded p-2 min-h-[110px] font-normal" />
            </label>
          </div>
          <textarea value={interp.bunIntro} onChange={(e) => set("bunIntro", e.target.value)} className="w-full border rounded p-2 text-[13px] min-h-[70px]" />
          <div className="grid md:grid-cols-2 gap-2">
            <label className="text-[12px] font-bold">
              <input value={interp.incBunTitle} onChange={(e) => set("incBunTitle", e.target.value)} className="w-full border rounded px-2 py-1 mb-1 font-bold" />
              <textarea value={interp.incBun} onChange={(e) => set("incBun", e.target.value)} className="w-full border rounded p-2 min-h-[130px] font-normal" />
            </label>
            <label className="text-[12px] font-bold">
              <input value={interp.decBunTitle} onChange={(e) => set("decBunTitle", e.target.value)} className="w-full border rounded px-2 py-1 mb-1 font-bold" />
              <textarea value={interp.decBun} onChange={(e) => set("decBun", e.target.value)} className="w-full border rounded p-2 min-h-[130px] font-normal" />
            </label>
          </div>
        </div>
      ) : (
        <InterpView interp={interp} />
      )}
    </section>
  );
}

function InterpView({ interp }: { interp: InterpDraft }) {
  return (
    <div className="text-[13px]">
      <p className="mb-2">
        <b>Creatinine</b> {interp.creatIntro.replace(/^Creatinine\s+/i, "")}
      </p>
      <table className="w-full text-[12px] border mb-4">
        <thead>
          <tr className="bg-slate-50">
            <th className="border p-2 text-left font-semibold">{interp.incCreatTitle}</th>
            <th className="border p-2 text-left font-semibold">{interp.decCreatTitle}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2 align-top whitespace-pre-wrap">{interp.incCreat}</td>
            <td className="border p-2 align-top whitespace-pre-wrap">{interp.decCreat}</td>
          </tr>
        </tbody>
      </table>
      <p className="mb-2">
        <b>BUN/Serum Creatinine Ratio</b> {interp.bunIntro.replace(/^BUN\/(Serum )?Creatinine Ratio\s*/i, "")}
      </p>
      <table className="w-full text-[12px] border">
        <thead>
          <tr className="bg-slate-50">
            <th className="border p-2 text-left font-semibold">{interp.incBunTitle}</th>
            <th className="border p-2 text-left font-semibold">{interp.decBunTitle}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2 align-top whitespace-pre-wrap">{interp.incBun}</td>
            <td className="border p-2 align-top whitespace-pre-wrap">{interp.decBun}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FakeQr({ text }: { text: string }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return Array.from({ length: 21 * 21 }, (_, i) => ((h >>> (i % 16)) + i * 13) % 7 !== 0);
  }, [text]);
  return (
    <div className="text-center">
      <div className="grid border border-slate-800 mx-auto" style={{ gridTemplateColumns: "repeat(21, 5px)", width: 105, height: 105 }}>
        {cells.map((on, i) => (
          <span key={i} className={on ? "bg-slate-900" : "bg-white"} />
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-1">Scan to download</p>
    </div>
  );
}

function FinalExtract({
  order,
  panels,
  display,
  interp,
  setInterp,
  editInterp,
  setEditInterp,
  skipInterp,
  collected,
  receivedOn,
  reportedOn,
  reportedTime,
  stamp,
  reg,
  extra,
  onEditValues,
  onSave,
  onSignOff,
  onCancel,
}: {
  order: LabOrder;
  panels: Panel[];
  display: (p: Param) => string;
  interp: InterpDraft;
  setInterp: React.Dispatch<React.SetStateAction<InterpDraft>>;
  editInterp: boolean;
  setEditInterp: (v: boolean | ((p: boolean) => boolean)) => void;
  skipInterp: boolean;
  collected: string;
  receivedOn: string;
  reportedOn: string;
  reportedTime: string;
  stamp: Date;
  reg: string;
  extra: ResultExtra;
  onEditValues: () => void;
  onSave: () => void;
  onSignOff: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[85] bg-slate-200 overflow-y-auto">
      <div className="max-w-4xl mx-auto my-4 bg-white shadow-lg px-8 py-6 pb-24 print:shadow-none print:my-0 print:max-w-none">
        <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-3">
          <div className="text-[13px] space-y-0.5">
            <p className="text-lg font-black">{order.patientName}</p>
            <p>
              <span className="text-slate-500">Age / Sex</span> : {order.age} YRS / {order.gender[0]}
            </p>
            <p>
              <span className="text-slate-500">Referred by</span> : {order.connectedClinic || "—"}
            </p>
            <p>
              <span className="text-slate-500">Reg. no.</span> : <b>{reg}</b>
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-[12px] text-right space-y-0.5">
              <div className="h-8 w-40 mx-auto mb-1 bg-[repeating-linear-gradient(90deg,#111_0_2px,#fff_2px_4px)]" />
              <p className="text-center font-mono text-[11px]">{reg}</p>
              <p>
                <span className="text-slate-500">Registered on</span> : {formatStamp(stamp)}
              </p>
              <p>
                <span className="text-slate-500">Collected on</span> : {formatYmd(collected) === "—" ? formatStamp(stamp).slice(0, 10) : formatYmd(collected)}
              </p>
              <p>
                <span className="text-slate-500">Received on</span> : {formatYmd(receivedOn)}
              </p>
              <p>
                <span className="text-slate-500">Reported on</span> : {formatYmd(reportedOn, reportedTime)}
              </p>
            </div>
            <FakeQr text={order.specimenId} />
          </div>
        </div>

        {panels.map((panel) => {
            const rows = panel.params.filter((p, idx, arr) => {
              if (p.unit || p.formula) return Boolean(display(p));
              for (let i = idx + 1; i < arr.length; i++) {
                const n = arr[i];
                if (!n.unit && !n.formula) break;
                if (display(n)) return true;
              }
              return false;
            });
          const hasLeaf = rows.some((p) => p.unit || p.formula);
          if (!hasLeaf) return null;
          return (
            <section key={panel.title} className="mt-5">
              <p className="text-center text-[11px] tracking-[0.2em] text-slate-400">✦ {panel.department} ✦</p>
              <p className="text-center text-[12px] text-slate-500 mb-2">✦ {panel.title} ✦</p>
              <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr] text-[11px] font-bold uppercase border-y border-slate-300 py-1">
                <span>Test</span>
                <span>Value</span>
                <span>Unit</span>
                <span>Reference</span>
              </div>
              {rows.map((p) => {
                const header = !p.unit && !p.formula;
                if (header) {
                  return (
                    <p key={p.id} className="text-[12px] font-bold uppercase tracking-wide mt-2 mb-0.5">
                      {p.name}
                    </p>
                  );
                }
                const val = formatShownValue(p.id, display(p));
                if (!val) return null;
                const side = flagSide(display(p), p.ref);
                const abnormal = Boolean(side);
                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr] text-[13px] py-0.5 ${p.indent ? "pl-6" : ""} ${abnormal ? "font-black" : ""}`}
                  >
                    <span className="uppercase">
                      {abnormal ? <b>{p.name}</b> : p.name}
                    </span>
                    <span className={abnormal ? "font-black" : ""}>
                      {side ? <span className="mr-2">{side}</span> : null}
                      {val}
                    </span>
                    <span>{p.unit}</span>
                    <span className={abnormal ? "font-black" : ""}>{p.ref}</span>
                  </div>
                );
              })}
            </section>
          );
        })}

        {!skipInterp && (
          <div className="mt-8">
            <InterpEditor interp={interp} setInterp={setInterp} editing={editInterp} onToggleEdit={() => setEditInterp((v) => !v)} />
          </div>
        )}
        {(extra.notes.trim() || extra.remarks.trim() || extra.advice.trim()) && (
          <div className="mt-4 text-[13px] space-y-1">
            {extra.notes.trim() && (
              <p>
                <b>Notes:</b> {extra.notes}
              </p>
            )}
            {extra.remarks.trim() && (
              <p>
                <b>Remarks:</b> {extra.remarks}
              </p>
            )}
            {extra.advice.trim() && (
              <p>
                <b>Advices:</b> {extra.advice}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex items-center gap-2 z-[90] print:hidden">
        <button type="button" onClick={onEditValues} className="px-3 py-2 border rounded text-sm font-semibold">
          Edit values
        </button>
        <button type="button" onClick={() => window.print()} className="px-3 py-2 border rounded text-sm font-semibold inline-flex items-center gap-1">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button type="button" onClick={onSave} className="px-3 py-2 border rounded text-sm font-semibold">
          Save only
        </button>
        <button type="button" onClick={onSignOff} className="px-4 py-2 bg-sky-700 text-white rounded text-sm font-semibold">
          Sign off
        </button>
        <button type="button" onClick={onCancel} className="ml-auto text-slate-600 text-sm font-bold">
          Close
        </button>
      </div>
    </div>
  );
}

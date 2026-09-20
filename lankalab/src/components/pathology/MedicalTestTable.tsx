import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MEDICAL_TESTS, catalogSearchHaystack, type MedicalTest } from "../../data/medicalTests";

export default function MedicalTestTable({
  selectedCodes,
  onToggle,
  selectable = true,
}: {
  selectedCodes?: Set<string>;
  onToggle?: (test: MedicalTest) => void;
  selectable?: boolean;
}) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return MEDICAL_TESTS;
    return MEDICAL_TESTS.filter((t) => catalogSearchHaystack(t).includes(n));
  }, [q]);

  return (
    <div className="border-2 border-sky-700 rounded-xl overflow-hidden bg-white">
      <div className="bg-sky-700 text-white px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div>
          <p className="text-[13px] font-black tracking-wide">Medical tests</p>
          <p className="text-[10px] text-sky-100">
            {selectable ? "English only — click a row to add the test to this bill" : "English abbreviations, full forms and purpose"}
          </p>
        </div>
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, name or purpose"
            className="pl-8 pr-3 py-1.5 rounded-md text-xs text-slate-900 w-64 outline-none"
          />
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="sticky top-0 bg-sky-600 text-white text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 font-bold">Abbreviation</th>
              <th className="px-3 py-2 font-bold">Full form</th>
              <th className="px-3 py-2 font-bold">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const on = selectedCodes?.has(t.code);
              return (
                <tr
                  key={t.code}
                  onClick={() => selectable && onToggle?.(t)}
                  className={`border-t border-slate-100 ${
                    selectable ? "cursor-pointer" : ""
                  } ${on ? "bg-emerald-50" : "hover:bg-sky-50"}`}
                >
                  <td className="px-3 py-2 font-black text-sky-800">{t.code}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{t.fullForm}</td>
                  <td className="px-3 py-2 text-slate-600">{t.purpose}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  No English test matches that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

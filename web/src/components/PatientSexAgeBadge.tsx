import React from "react";

/** Highlighted sex and age shown under a patient name. */
export default function PatientSexAgeBadge({
  gender,
  age,
}: {
  gender?: string;
  age?: number | string;
}) {
  const sex = (gender || "—").trim() || "—";
  const yrs = age === 0 || age ? String(age) : "—";
  return (
    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-300 text-amber-950 border-2 border-amber-500 shadow-xs">
      {sex} · {yrs} yrs
    </span>
  );
}

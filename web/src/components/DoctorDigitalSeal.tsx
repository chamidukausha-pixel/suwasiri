import React from "react";

/** Digital signature + circular SLMC stamp shown on issued e-prescriptions. */
export default function DoctorDigitalSeal({
  doctorName,
  clinicName = "Sri Lankan GP Care",
  slmcNo = "12908",
  date,
  token,
  compact = false,
}: {
  doctorName: string;
  clinicName?: string;
  slmcNo?: string;
  date: string;
  token?: string;
  compact?: boolean;
}) {
  const shortClinic = clinicName.length > 22 ? "GP CARE" : clinicName.toUpperCase();
  const scriptName = doctorName.replace(/^Dr\.\s*/i, "");
  const size = compact ? "w-16 h-16" : "w-24 h-24";

  return (
    <div className={`pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 items-end ${compact ? "text-[10px]" : "text-xs"}`}>
      <div className="flex items-end gap-2">
        <svg viewBox="0 0 132 132" className={`${size} shrink-0`} aria-label="Digital stamp seal">
          <circle cx="66" cy="66" r="62" fill="#fef2f2" stroke="#b91c1c" strokeWidth="4" />
          <circle cx="66" cy="66" r="52" fill="none" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="66" y="38" textAnchor="middle" fill="#b91c1c" fontSize="7" fontWeight="800" letterSpacing="1.2">SLMC DIGITAL SEAL</text>
          <text x="66" y="62" textAnchor="middle" fill="#7f1d1d" fontSize="9" fontWeight="800">{shortClinic}</text>
          <text x="66" y="76" textAnchor="middle" fill="#b91c1c" fontSize="7.5" fontWeight="700">Reg. {slmcNo}</text>
          <text x="66" y="94" textAnchor="middle" fill="#991b1b" fontSize="6.5" fontWeight="700">{date}</text>
          <text x="66" y="108" textAnchor="middle" fill="#b91c1c" fontSize="6" fontWeight="800">DIGITALLY STAMPED</text>
        </svg>
        <div className="text-[9px] text-slate-500">
          <p className="font-bold text-slate-800">Official digital stamp</p>
          <p>SLMC-verified clinic seal</p>
          {token ? <p className="text-emerald-700 font-semibold">Token: {token}</p> : null}
        </div>
      </div>
      <div className="text-right">
        <p
          className={`${compact ? "text-xl" : "text-3xl"} leading-none text-[#143048] mb-1`}
          style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive" }}
        >
          {scriptName}
        </p>
        <div className={`inline-block border-t border-slate-400 pt-1 ${compact ? "min-w-[120px]" : "min-w-[180px]"}`}>
          <p className="text-[10px] text-slate-800 font-extrabold">{doctorName}</p>
          <p className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider">Digitally signed</p>
          <p className="text-[9px] text-slate-500">SLMC {slmcNo} · {clinicName}</p>
        </div>
      </div>
    </div>
  );
}

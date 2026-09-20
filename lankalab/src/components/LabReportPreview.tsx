import React, { useMemo, useState } from "react";
import { Mail, Printer, X } from "lucide-react";
import type { LabOrder } from "../types";
import { emailLabReportToDoctor, resolveReferringDoctor } from "../utils/labReportShare";

function formatStamp(d: Date) {
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function LabReportPreview({ order, onClose }: { order: LabOrder; onClose: () => void }) {
  const doctor = useMemo(() => resolveReferringDoctor(order), [order]);
  const [to, setTo] = useState(doctor?.email || "");
  const stamp = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date(order.orderTimestamp);
  const reported = order.completedAt ? new Date(order.completedAt) : stamp;
  const reg = order.specimenId.replace("LNK-", "");
  const results = order.results || [];
  const critical = order.status === "CRITICAL" || order.flaggedCritical || order.priority === "Critical";

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/50 overflow-y-auto print:bg-white print:static">
      <div className="max-w-3xl mx-auto my-6 bg-white shadow-2xl print:shadow-none print:my-0 print:max-w-none">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-white print:hidden">
          <p className="text-sm font-bold text-slate-900 mr-auto">Lab report preview</p>
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            Doctor email
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="doctor@clinic.lk"
              className="border rounded-md px-2 py-1 w-52 font-medium text-slate-800"
            />
          </label>
          <button
            type="button"
            onClick={() => emailLabReportToDoctor(order, { email: to || undefined, critical })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 text-white text-[12px] font-bold"
          >
            <Mail className="w-3.5 h-3.5" /> Email doctor
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <article className="px-8 py-7 text-slate-900">
          <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Colombo Central Patholab</p>
              <h1 className="text-xl font-black mt-0.5">Laboratory report</h1>
              <p className="text-[12px] text-slate-500 mt-1">Specimen {order.specimenId}</p>
            </div>
            <div className="text-right">
              <div className="h-8 w-40 mx-auto mb-1 bg-[repeating-linear-gradient(90deg,#111_0_2px,#fff_2px_4px)]" />
              <p className="font-mono text-[11px] text-center">{reg}</p>
            </div>
          </div>

          {critical && (
            <p className="mt-3 text-[12px] font-black uppercase bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded">
              Critical — notify the referring doctor immediately
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[13px] mt-4">
            <p>
              <span className="text-slate-500">Patient</span> : <b>{order.patientName}</b>
            </p>
            <p>
              <span className="text-slate-500">Registered on</span> : {formatStamp(stamp)}
            </p>
            <p>
              <span className="text-slate-500">Age / Sex</span> : {order.age} YRS / {order.gender[0]}
            </p>
            <p>
              <span className="text-slate-500">Reported on</span> : {formatStamp(reported)}
            </p>
            <p>
              <span className="text-slate-500">Referred by</span> : <b>{order.connectedClinic || doctor?.name || "—"}</b>
            </p>
            <p>
              <span className="text-slate-500">Doctor email</span> : {to || doctor?.email || "—"}
            </p>
            <p>
              <span className="text-slate-500">Test</span> : <b>{order.testType}</b>
            </p>
            <p>
              <span className="text-slate-500">Health ID</span> : {order.suwasiriBarcode || "—"}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-center text-[11px] tracking-[0.2em] text-slate-400 mb-2">✦ Results ✦</p>
            <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr_1fr_0.6fr] text-[11px] font-bold uppercase border-y border-slate-300 py-1.5">
              <span>Parameter</span>
              <span>Value</span>
              <span>Unit</span>
              <span>Reference</span>
              <span>Flag</span>
            </div>
            {results.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-400">Results have not been entered yet.</p>
            ) : (
              results.map((row) => (
                <div
                  key={`${row.parameter}-${row.value}`}
                  className={`grid grid-cols-[1.4fr_0.8fr_0.6fr_1fr_0.6fr] text-[13px] py-1.5 border-b border-slate-100 ${
                    row.isAbnormal ? "font-black text-red-800" : ""
                  }`}
                >
                  <span>{row.parameter}</span>
                  <span>{row.value}</span>
                  <span>{row.unit}</span>
                  <span>{row.referenceRange}</span>
                  <span>{row.isAbnormal ? "Abnormal" : "Normal"}</span>
                </div>
              ))
            )}
          </div>

          {order.notes && (
            <p className="mt-5 text-[13px] text-slate-600">
              <b>Notes:</b> {order.notes}
            </p>
          )}

          <p className="mt-8 text-[11px] text-slate-400">
            Generated by LankaLab Portal for clinician review. This preview does not include billing or payment.
          </p>
        </article>
      </div>
    </div>
  );
}

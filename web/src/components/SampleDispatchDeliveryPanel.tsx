import React, { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { DEFAULT_PARTNER_LABS, type PartnerLab } from "../catalogs/partnerLabs";
import { formatDateKey, formatLongDate } from "../utils/clinicCalendar";
import {
  downloadDispatchSlipPdf,
  draftDispatchNumber,
  printDispatchSlip,
  type DispatchSlipLine,
} from "../utils/dispatchSlip";

export type DeliverySample = {
  id: string;
  patientId: string;
  patientName: string;
  testName?: string;
  sampleCategory?: string;
};

export type BatchDeliverPayload = {
  sampleIds: string[];
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  sampleCount: number;
  issuedPersonName: string;
  issuedDate: string;
  labName: string;
  labAddress: string;
};

interface Props {
  selectedSamples: DeliverySample[];
  partnerLabs: PartnerLab[];
  clinicName: string;
  defaultIssuedPerson?: string;
  busy?: boolean;
  onRemove: (sampleId: string) => void;
  onSave: (payload: BatchDeliverPayload) => void | Promise<void>;
}

export default function SampleDispatchDeliveryPanel({
  selectedSamples,
  partnerLabs,
  clinicName,
  defaultIssuedPerson,
  busy,
  onRemove,
  onSave,
}: Props) {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vialCount, setVialCount] = useState(String(Math.max(1, selectedSamples.length) || 1));
  const [issuedPersonName, setIssuedPersonName] = useState(defaultIssuedPerson || "");
  const [issuedDate, setIssuedDate] = useState(formatDateKey(new Date()));
  const [labName, setLabName] = useState(partnerLabs[0]?.name || DEFAULT_PARTNER_LABS[0].name);
  const [labAddress, setLabAddress] = useState(partnerLabs[0]?.address || DEFAULT_PARTNER_LABS[0].address);
  const [addingLab, setAddingLab] = useState(false);
  const [draftNumber] = useState(() => draftDispatchNumber());

  useEffect(() => {
    setVialCount(String(Math.max(1, selectedSamples.length) || 1));
  }, [selectedSamples.length]);

  useEffect(() => {
    if (!defaultIssuedPerson) return;
    setIssuedPersonName((prev) => (prev.trim() ? prev : defaultIssuedPerson));
  }, [defaultIssuedPerson]);

  const lines: DispatchSlipLine[] = useMemo(
    () =>
      selectedSamples.map((s) => ({
        patientName: s.patientName,
        fileId: s.patientId,
        investigation: s.testName || s.sampleCategory || "—",
      })),
    [selectedSamples]
  );

  const buildSlip = () => ({
    dispatchNumber: draftNumber,
    issuedDate,
    clinicName,
    driverName: driverName.trim() || "—",
    driverPhone: driverPhone.trim() || "—",
    vehicleNo: vehicleNo.trim() || "—",
    vialCount: Math.max(1, Number(vialCount) || selectedSamples.length || 1),
    labName: labName.trim() || DEFAULT_PARTNER_LABS[0].name,
    labAddress: labAddress.trim(),
    issuedPersonName: issuedPersonName.trim() || "—",
    lines,
  });

  const submit = () => {
    if (!selectedSamples.length) {
      alert("Click Delivered on at least one specimen in the table above.");
      return;
    }
    if (!driverName.trim() || !driverPhone.trim() || !vehicleNo.trim() || !issuedPersonName.trim() || !issuedDate || !labName.trim()) {
      alert("Please enter driver name, phone, vehicle, issued person, issued date, and lab name.");
      return;
    }
    void Promise.resolve(
      onSave({
        sampleIds: selectedSamples.map((s) => s.id),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        vehicleNo: vehicleNo.trim(),
        sampleCount: Math.max(1, Number(vialCount) || selectedSamples.length || 1),
        issuedPersonName: issuedPersonName.trim(),
        issuedDate,
        labName: labName.trim(),
        labAddress: labAddress.trim(),
      })
    ).catch(() => undefined);
  };

  return (
    <div id="sample-dispatch-delivery" className="p-6 bg-white border rounded shadow-sm space-y-4">
      <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif font-bold text-base text-[#00334f] uppercase tracking-wider">
            Delivery & dispatch file
          </h3>
          <p className="text-[11px] text-slate-500">
            Click <strong>Delivered</strong> on specimens above. Vials update automatically. Save delivery to send this numbered file to Sample Dispatch History and LankaLab.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#00334f] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full self-start">
          Draft file {draftNumber}
        </span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase text-slate-500">Descriptions — patient name & investigation</h4>
          <span className="text-[10px] font-bold text-slate-500">{selectedSamples.length} selected</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[#00334f] font-bold border-b">
              <th className="p-2.5">#</th>
              <th className="p-2.5">Patient name</th>
              <th className="p-2.5">File ID</th>
              <th className="p-2.5">Investigation</th>
              <th className="p-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {selectedSamples.map((sample, index) => (
              <tr key={sample.id}>
                <td className="p-2.5 text-slate-400">{index + 1}</td>
                <td className="p-2.5 font-semibold text-slate-800">{sample.patientName}</td>
                <td className="p-2.5 font-mono font-bold text-[#00334f]">{sample.patientId}</td>
                <td className="p-2.5">{sample.testName || sample.sampleCategory || "—"}</td>
                <td className="p-2.5 text-right">
                  <button type="button" onClick={() => onRemove(sample.id)} className="text-[10px] font-bold text-rose-700 underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {selectedSamples.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center italic text-slate-400">
                  Click Delivered before Delete on each specimen to add it here. Three employees → 3 vials.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-sky-200 bg-sky-50/70 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Deliver driver name *</span>
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" placeholder="e.g. Suresh Bandara" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Driver phone number *</span>
            <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" placeholder="+94 77 444 8812" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Vehicle number *</span>
            <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" placeholder="WP LH-7210" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">How many vials *</span>
            <input type="number" min={1} value={vialCount} onChange={(e) => setVialCount(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" />
            <span className="text-[10px] text-slate-400">Auto-counted from Delivered clicks ({selectedSamples.length}).</span>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Issued person name *</span>
            <input value={issuedPersonName} onChange={(e) => setIssuedPersonName(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" placeholder="Name of person the sample was issued to" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Issued date *</span>
            <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Lab name *</span>
            {!addingLab ? (
              <select
                value={labName}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__add__") {
                    setAddingLab(true);
                    setLabName("");
                    setLabAddress("");
                    return;
                  }
                  setLabName(next);
                  const found = partnerLabs.find((l) => l.name === next);
                  if (found) setLabAddress(found.address);
                }}
                className="w-full border rounded px-2 py-1.5 bg-white"
              >
                {partnerLabs.map((lab) => (
                  <option key={lab.name} value={lab.name}>{lab.name}</option>
                ))}
                <option value="__add__">+ Add lab name and address</option>
              </select>
            ) : (
              <input value={labName} onChange={(e) => setLabName(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" placeholder="New lab name" />
            )}
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Lab address / location</span>
            <input value={labAddress} onChange={(e) => setLabAddress(e.target.value)} className="w-full border rounded px-2 py-1.5 bg-white" placeholder="Street, city" />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => printDispatchSlip(buildSlip())}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#00334f] font-bold text-xs px-3 py-1.5 rounded"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            type="button"
            onClick={() => downloadDispatchSlipPdf(buildSlip())}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#00334f] font-bold text-xs px-3 py-1.5 rounded"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            type="button"
            disabled={busy || selectedSamples.length === 0}
            onClick={submit}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded"
          >
            {busy ? "Saving…" : "Save delivery"}
          </button>
        </div>
      </div>
    </div>
  );
}

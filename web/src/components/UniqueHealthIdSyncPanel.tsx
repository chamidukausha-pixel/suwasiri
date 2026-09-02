import {
  Barcode,
  CheckCircle,
  FlaskConical,
  Loader2,
  Syringe,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import type { Patient } from "../types";

function dash(value?: string | number | null): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text || "—";
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-emerald-700/80 font-bold">{label}</p>
      <p className="text-[11px] font-semibold text-slate-800 break-words">{dash(value)}</p>
    </div>
  );
}

interface UniqueHealthIdSyncPanelProps {
  barcodeSearchText: string;
  onBarcodeChange: (value: string) => void;
  loading: boolean;
  saving: boolean;
  preview: Patient | null;
  error: string;
  onLookup: (raw: string) => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onClear: () => void;
}

export default function UniqueHealthIdSyncPanel({
  barcodeSearchText,
  onBarcodeChange,
  loading,
  saving,
  preview,
  error,
  onLookup,
  onSave,
  onClear,
}: UniqueHealthIdSyncPanelProps) {
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onLookup(barcodeSearchText);
  };

  return (
    <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-4 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white font-black p-1 px-1.5 rounded text-[9px] tracking-wider animate-pulse font-mono">
            SUWASIRI LIVE
          </div>
          <h3 className="font-serif font-extrabold text-xs text-emerald-800">
            Suwasiri Unique Health ID sync
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          Enter the number from the patient’s Unique Health ID card, review their file, then Save
        </span>
      </div>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4.5 h-4.5" />
          <input
            type="text"
            required
            placeholder="Unique Health ID (e.g. SW3C6F5B5A27 for Chamidu, SW6CF9340271 for Sakuni)"
            className="w-full pl-10 pr-4 py-2 border border-emerald-300 rounded text-xs bg-white text-emerald-900 placeholder-emerald-600/40 font-bold tracking-wider uppercase focus:ring-1 focus:ring-emerald-500 outline-none"
            value={barcodeSearchText}
            onChange={(e) => onBarcodeChange(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Looking up…
            </>
          ) : (
            <>
              <Barcode className="w-3.5 h-3.5" />
              Sync to Portal
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className="text-emerald-800 font-bold uppercase tracking-wider text-[8px]">Try a Unique Health ID:</span>
        {[
          { code: "SW3C6F5B5A27", name: "Chamidu" },
          { code: "SW6CF9340271", name: "Sakuni" },
        ].map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => onBarcodeChange(item.code)}
            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-850 border border-emerald-200/60 p-1 px-1.5 rounded transition text-[9px] font-mono font-semibold"
          >
            {item.code} ({item.name})
          </button>
        ))}
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {preview && (
        <div className="bg-white border border-emerald-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">Suwasiri patient file</p>
              <h4 className="font-serif font-bold text-sm text-[#00334f]">{preview.name}</h4>
              {preview.suwasiriBarcode && (
                <p className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                  {preview.suwasiriBarcode}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClear}
              className="text-slate-500 hover:text-slate-800 p-1"
              aria-label="Clear looked-up patient"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Name" value={preview.name} />
            <Field label="Age" value={preview.age} />
            <Field label="Gender" value={preview.gender} />
            <Field label="Date of birth" value={preview.dateOfBirth} />
            <Field label="Blood group" value={preview.bloodType} />
            <Field label="NIC number" value={preview.nic} />
            <Field label="Phone" value={preview.phone} />
            <Field label="Email" value={preview.email} />
            <Field label="Emergency contact" value={preview.emergencyContactName} />
            <Field label="Emergency phone" value={preview.emergencyContactPhone} />
          </div>
          <Field label="Address" value={preview.address} />
          <Field label="Allergies" value={preview.allergies} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-slate-100 rounded p-2 bg-slate-50/80">
              <p className="text-[9px] uppercase tracking-wider text-emerald-700/80 font-bold flex items-center gap-1 mb-1">
                <Syringe className="w-3 h-3" /> Vaccine history
              </p>
              {(preview.vaccineRecords || []).length === 0 ? (
                <p className="text-[11px] text-slate-500">No vaccine history on this Unique Health ID yet.</p>
              ) : (
                <ul className="space-y-1 max-h-28 overflow-y-auto">
                  {preview.vaccineRecords.map((v, i) => (
                    <li key={`${v.vaccineName}-${v.date}-${i}`} className="text-[11px] text-slate-800">
                      <span className="font-semibold">{v.vaccineName}</span>
                      <span className="text-slate-500"> · {dash(v.date)} · {dash(v.dose)} · {dash(v.status)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border border-slate-100 rounded p-2 bg-slate-50/80">
              <p className="text-[9px] uppercase tracking-wider text-emerald-700/80 font-bold flex items-center gap-1 mb-1">
                <FlaskConical className="w-3 h-3" /> Previous lab reports
              </p>
              {(preview.labResults || []).length === 0 ? (
                <p className="text-[11px] text-slate-500">No lab reports in this patient’s Suwasiri Vault yet.</p>
              ) : (
                <ul className="space-y-1 max-h-28 overflow-y-auto">
                  {preview.labResults.map((lab) => (
                    <li key={lab.id} className="text-[11px] text-slate-800">
                      <span className="font-semibold">{lab.testName}</span>
                      <span className="text-slate-500"> · {dash(lab.date)} · {dash(lab.result)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 rounded text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Save to Patient Clinical Records
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

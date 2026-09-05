import React, { useState } from "react";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { uploadClinicImage } from "../utils/clinicMedia";

interface Props {
  label: string;
  value?: string;
  storagePath: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function ClinicImageField({ label, value, storagePath, onChange, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-2 min-w-0">
      {value ? (
        <img src={value} alt="" className="w-12 h-12 rounded-lg object-cover border bg-white shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg border bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
          <ImageIcon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-600">{label}</p>
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          <label className={`text-[10px] font-bold border px-2 py-1 rounded ${disabled || busy ? "opacity-50" : "bg-white hover:bg-slate-50 cursor-pointer"}`}>
            {busy ? "Uploading…" : value ? "Change" : "Add"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setBusy(true);
                try {
                  onChange(await uploadClinicImage(storagePath, file));
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Could not use that picture.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded flex items-center gap-0.5"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

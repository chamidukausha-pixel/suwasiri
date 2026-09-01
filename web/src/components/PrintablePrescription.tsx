import React from "react";
import { Printer, X, Shield } from "lucide-react";
import { Patient, PrescriptionRecord } from "../types";
import DoctorDigitalSeal from "./DoctorDigitalSeal";

interface Props {
  patient: Patient;
  prescription: PrescriptionRecord;
  onClose: () => void;
  doctorName?: string;
  clinicName?: string;
  slmcNo?: string;
}

export default function PrintablePrescription({
  patient,
  prescription,
  onClose,
  doctorName = "Dr. Priyantha Silva",
  clinicName = "Sri Lankan GP Care",
  slmcNo = "12908",
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  const parseMedicineInstruction = (item: string) => {
    const match = item.match(/^(.*?)\[(.*?)\]$/);
    if (match) {
      const medName = match[1].trim();
      const detailsStr = match[2].trim();
      const parts = detailsStr.split(",");
      const instruction = parts[0] ? parts[0].trim() : "";
      const days = parts[1] ? parts[1].replace(/for|days/g, "").trim() : "";
      const meal = parts[2] ? parts[2].trim() : "";
      return {
        formatted: true,
        name: medName,
        instruction,
        days: days ? `${days} Days` : "",
        meal
      };
    }
    return {
      formatted: false,
      name: item,
      instruction: "",
      days: "",
      meal: ""
    };
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 overflow-y-auto flex items-center justify-center p-4 z-50 animate-in fade-in">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription_sheet, #prescription_sheet * {
            visibility: visible;
          }
          #prescription_sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="bg-white border-2 border-slate-400 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
        {/* Controls Toolbar (Non-printable screen only) */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="font-serif font-bold text-sm">SLMC Certified e-Prescription (Rx)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Prescription
            </button>
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 p-1.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prescription Paper Sheet */}
        <div className="p-8 bg-paper font-sans text-slate-900 flex-1 overflow-y-auto" id="prescription_sheet">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h2 className="font-serif font-bold text-2xl text-slate-800 tracking-tight">SRI LANKAN GP CARE</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">General Practice Clinic</p>
              <p className="text-[11px] text-slate-500 mt-1">First Lane, Colombo 03, Sri Lanka</p>
              <p className="text-[11px] text-slate-500">Tel: +94 11 234 5678 | info@gpcare.lk</p>
            </div>
            <div className="text-right">
              <h3 className="font-serif font-bold text-base text-slate-800">{doctorName}</h3>
              <p className="text-[11px] text-slate-500">M.B.B.S (Colombo), M.D (Family Medicine)</p>
              <p className="text-[10px] font-bold text-emerald-700 mt-0.5">SLMC Active Registration No: {slmcNo}</p>
              <p className="text-[10px] text-slate-400 mt-1">Rx Secure Token: {prescription.rxNumber}</p>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border p-3 rounded mb-6 text-xs">
            <div>
              <p className="text-slate-500">Patient Full Name:</p>
              <p className="font-bold text-sm text-slate-800">{patient.name}</p>
              <p className="mt-1">
                <span className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-300 text-amber-950 border-2 border-amber-500">
                  {patient.gender} · {patient.age} yrs
                </span>
              </p>
            </div>
            <div>
              <p className="text-slate-500">Allergies Declared:</p>
              <p className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                {patient.allergies || "None Declared"}
              </p>
              <p className="text-slate-500 mt-1.5">Date Prescribed:</p>
              <p className="font-semibold text-slate-800">{prescription.date}</p>
            </div>
          </div>

          {/* Rx Emblem & Medicine List */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-1">
              <span className="font-serif font-bold text-3xl italic text-slate-800">℞</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Prescribed Pharmaceuticals</span>
            </div>

            <div className="space-y-4 min-h-[160px]">
              {prescription.items && prescription.items.map((item, idx) => {
                const parsed = parseMedicineInstruction(item);
                return (
                  <div key={idx} className="border-l-4 border-emerald-500 bg-emerald-50/20 p-3 rounded-r shadow-xs">
                    <div className="flex flex-wrap items-baseline gap-2 pb-1 border-b border-dashed border-slate-200">
                      <span className="font-bold text-sm text-slate-900">{parsed.name}</span>
                      <span className="text-[8px] uppercase tracking-wide bg-emerald-100 text-[#006f66] px-1.5 py-0.5 rounded font-bold">
                        ✔ Suwasiri Synced
                      </span>
                    </div>

                    {parsed.formatted ? (
                      <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                        <div className="bg-white border p-1.5 rounded">
                          <span className="text-[8px] text-slate-400 block font-bold uppercase mb-0.5">Dosage</span>
                          <span className="font-semibold text-slate-800 text-xs">{parsed.instruction}</span>
                        </div>
                        <div className="bg-white border p-1.5 rounded">
                          <span className="text-[8px] text-slate-400 block font-bold uppercase mb-0.5">Duration</span>
                          <span className="font-semibold text-slate-900 text-xs">{parsed.days}</span>
                        </div>
                        <div className="bg-white border p-1.5 rounded">
                          <span className="text-[8px] text-slate-400 block font-bold uppercase mb-0.5">Meals Relation</span>
                          <span className="font-bold text-teal-700 text-xs">{parsed.meal}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 italic mt-1">{item}</p>
                    )}
                  </div>
                );
              })}
              {(!prescription.items || prescription.items.length === 0) && (
                <p className="text-xs text-slate-400 italic">No medicinal inventory items logged.</p>
              )}
            </div>

            {/* Directions & Instructions */}
            <div className="bg-slate-50 p-4 border rounded text-xs">
              <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Dosage Protocols & Diet Directions:</p>
              <p className="text-slate-600 font-serif leading-relaxed italic">{prescription.dosageInstructions || "Utilize according to standard directions."}</p>
            </div>
          </div>

          <div className="mt-10">
            <DoctorDigitalSeal
              doctorName={doctorName}
              clinicName={clinicName}
              slmcNo={slmcNo}
              date={prescription.date}
              token={prescription.ePrescriptionToken || prescription.rxNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

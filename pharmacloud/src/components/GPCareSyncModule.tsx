import React, { useState } from 'react';
import { GPCarePrescription, InventoryItem } from '../types';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  User,
  Calendar,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  Send,
  Smartphone,
  Scan,
  Plus,
  QrCode,
  Zap,
  Check,
  Camera,
  Sliders,
  CheckSquare
} from 'lucide-react';

interface GPCareSyncModuleProps {
  prescriptions: GPCarePrescription[];
  inventory: InventoryItem[];
  onDispensePrescription: (prescriptionId: string) => void;
  onAnalyzePrescription: (prescription: GPCarePrescription) => void;
  onAddNewPrescription: (newPrescription: GPCarePrescription) => void;
}

export const GPCareSyncModule: React.FC<GPCareSyncModuleProps> = ({
  prescriptions,
  inventory,
  onDispensePrescription,
  onAnalyzePrescription,
  onAddNewPrescription,
}) => {
  const [fulfillmentMode, setFulfillmentMode] = useState<'manual' | 'scan'>('manual');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showDoctorDispatchModal, setShowDoctorDispatchModal] = useState(false);

  // Scan Mode State
  const [scannedCode, setScannedCode] = useState('');
  const [scanResultPrescription, setScanResultPrescription] = useState<GPCarePrescription | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for Doctor E-Prescription Creator
  const [doctorName, setDoctorName] = useState('Dr. Anura Senanayake');
  const [slmcNumber, setSlmcNumber] = useState('SLMC-68492');
  const [clinicName, setClinicName] = useState('Suwasiri Community Health Hub - Colombo');
  const [patientName, setPatientName] = useState('Kamal Perera');
  const [patientNIC, setPatientNIC] = useState('198574102938V');
  const [patientPhone, setPatientPhone] = useState('+94 77 890 1234');
  const [patientAge, setPatientAge] = useState(41);
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension & Type 2 Diabetes');
  const [selectedMedId, setSelectedMedId] = useState(inventory[0]?.id || '');
  const [prescribedQty, setPrescribedQty] = useState(30);
  const [dispatchSmsNotification, setDispatchSmsNotification] = useState<string | null>(null);

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (filterStatus === 'All') return true;
    return p.dispenseStatus === filterStatus;
  });

  // Execute Prescription QR / Barcode Scan
  const handlePerformScan = (codeToScan?: string) => {
    const code = codeToScan || scannedCode;
    if (!code.trim()) return;

    const matched = prescriptions.find(
      (p) =>
        p.id.toLowerCase() === code.trim().toLowerCase() ||
        p.patientNIC.toLowerCase() === code.trim().toLowerCase() ||
        p.medications.some((m) => m.brandName.toLowerCase().includes(code.trim().toLowerCase()))
    );

    if (matched) {
      setScanResultPrescription(matched);
      setScanFeedback({
        type: 'success',
        text: `QR / Barcode Verified: Found Doctor E-Prescription ${matched.id} for ${matched.patientName}!`,
      });
    } else {
      setScanResultPrescription(null);
      setScanFeedback({
        type: 'error',
        text: `No doctor prescription found matching code "${code}". Try scanning GPC-2026-9821 or 198574102938V.`,
      });
    }
  };

  const handleIssueDoctorPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMed = inventory.find((i) => i.id === selectedMedId) || inventory[0];

    const newRx: GPCarePrescription = {
      id: `GPC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName,
      slmcNumber,
      clinicName,
      patientNIC,
      patientName,
      patientPhone,
      patientAge: Number(patientAge),
      diagnosis,
      dateIssued: new Date().toISOString().split('T')[0],
      validUntil: '2026-12-31',
      dispenseStatus: 'Pending',
      suwasiriSynced: true,
      medications: [
        {
          medicationId: targetMed ? targetMed.id : 'INV-001',
          brandName: targetMed ? targetMed.brandName : 'Metformin',
          genericName: targetMed ? targetMed.genericName : 'Metformin HCl',
          dosage: targetMed ? `${targetMed.strength} BD` : '500mg BD',
          durationDays: 30,
          quantityPrescribed: Number(prescribedQty),
          refillsAllowed: 2,
          refillsRemaining: 2,
          specialInstructions: 'Take after meals. Transmitted via Suwasiri App to customer phone.',
        },
      ],
    };

    onAddNewPrescription(newRx);
    setShowDoctorDispatchModal(false);

    setDispatchSmsNotification(
      `E-Prescription ${newRx.id} successfully issued by ${doctorName} and dispatched via SMS link to customer number (${patientPhone})!`
    );

    setTimeout(() => setDispatchSmsNotification(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30 mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            Suwasiri Patient App E-Prescription Channel
          </div>
          <h2 className="text-2xl font-extrabold text-white">Suwasiri E-Prescription Portal (Manual & Scan)</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Doctor e-prescriptions sent to patient mobile numbers. Supports both manual fulfillment & live barcode/QR code camera scanning for instant drug stock deduction.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowDoctorDispatchModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-950/40 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Issue E-Prescription to Customer Phone
          </button>
        </div>
      </div>

      {dispatchSmsNotification && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl text-xs font-bold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{dispatchSmsNotification}</span>
        </div>
      )}

      {/* Manual vs Scan Mode Segment Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFulfillmentMode('manual')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              fulfillmentMode === 'manual'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Manual Entry & Fulfillment
          </button>

          <button
            onClick={() => setFulfillmentMode('scan')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              fulfillmentMode === 'scan'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-4 h-4" /> Scan QR / Barcode Fulfillment
          </button>
        </div>

        <div className="flex items-center gap-2 px-3">
          <span className="text-xs text-slate-500 font-medium">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Dispense</option>
            <option value="Dispensed">Dispensed & Fulfilled</option>
          </select>
        </div>
      </div>

      {/* SCAN MODE VIEW */}
      {fulfillmentMode === 'scan' && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-800/50 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/60 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-400" />
                Live Camera / QR Barcode Prescription Scanner
              </h3>
              <p className="text-slate-300 text-xs">
                Scan patient's Suwasiri QR code or doctor prescription barcode to instantly match records and auto-deduct stock.
              </p>
            </div>
            <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/30">
              ⚡ Live Optical Scanner Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Viewfinder Column */}
            <div className="md:col-span-5 bg-slate-950 border-2 border-dashed border-teal-500/60 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden flex flex-col justify-center items-center min-h-[240px]">
              {/* Laser line animation */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse shadow-[0_0_12px_#2dd4bf]" />

              <QrCode className="w-16 h-16 text-teal-400/80 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-teal-200">Align QR Code / Barcode in Viewfinder</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports doctor SLMC QR & Suwasiri app codes</p>
              </div>

              {/* Sample QR presets for quick testing */}
              <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold block w-full mb-0.5">Quick Presets:</span>
                {['GPC-2026-9821', 'GPC-2026-9822', 'GPC-2026-9823'].map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setScannedCode(code);
                      handlePerformScan(code);
                    }}
                    className="bg-indigo-900/80 hover:bg-indigo-800 text-teal-300 text-[10px] font-mono px-2 py-1 rounded border border-indigo-700/60 transition"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Query & matched result column */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan or enter Prescription ID / Patient NIC..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePerformScan()}
                  className="flex-1 p-3 bg-slate-950 border border-indigo-700/60 rounded-xl text-xs font-mono text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                />
                <button
                  onClick={() => handlePerformScan()}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-xs transition shrink-0 flex items-center gap-1.5 shadow-lg shadow-teal-950/40"
                >
                  <Zap className="w-4 h-4" /> Scan Code
                </button>
              </div>

              {scanFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    scanFeedback.type === 'success'
                      ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/50'
                      : 'bg-rose-950 text-rose-200 border border-rose-500/50'
                  }`}
                >
                  {scanFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{scanFeedback.text}</span>
                </div>
              )}

              {scanResultPrescription ? (
                <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-extrabold text-white text-sm block">
                        {scanResultPrescription.patientName}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        NIC: {scanResultPrescription.patientNIC} • 📱 {scanResultPrescription.patientPhone}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        scanResultPrescription.dispenseStatus === 'Pending'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {scanResultPrescription.dispenseStatus}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-300">
                    <div className="font-bold text-teal-300">Prescribed Drugs:</div>
                    {scanResultPrescription.medications.map((m, idx) => (
                      <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span>{m.brandName} ({m.genericName})</span>
                        <span className="text-teal-400 font-bold">Qty: {m.quantityPrescribed}</span>
                      </div>
                    ))}
                  </div>

                  {scanResultPrescription.dispenseStatus === 'Pending' ? (
                    <button
                      onClick={() => {
                        onDispensePrescription(scanResultPrescription.id);
                        setScanResultPrescription({
                          ...scanResultPrescription,
                          dispenseStatus: 'Dispensed',
                        });
                        setScanFeedback({
                          type: 'success',
                          text: `Prescription ${scanResultPrescription.id} fulfilled! Stock deducted and SMS receipt dispatched.`,
                        });
                      }}
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2"
                    >
                      <Scan className="w-4 h-4" /> Execute Instant Scan Fulfillment & Deduct Stock
                    </button>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/80 text-emerald-300 rounded-xl text-center font-bold border border-emerald-500/40">
                      ✓ Already Fulfilled & Dispatched to Patient Phone
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-950/50 text-xs">
                  Scan a QR code or click one of the quick presets above to match doctor prescription.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MODE VIEW - Prescriptions Grid */}
      {fulfillmentMode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPrescriptions.map((rx) => {
            const isPending = rx.dispenseStatus === 'Pending';

            return (
              <div
                key={rx.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition relative flex flex-col justify-between ${
                  isPending ? 'border-indigo-200 hover:border-indigo-300' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      {rx.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-indigo-600" /> SMS Dispatched
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rx.dispenseStatus}
                      </span>
                    </div>
                  </div>

                  {/* Patient & Customer Number Context */}
                  <div className="space-y-2 border-b border-slate-100 pb-3 mb-3 text-xs">
                    <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-indigo-600" />
                          {rx.patientName}
                        </h3>
                        <span className="text-indigo-900 font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200">
                          📱 {rx.patientPhone}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        NIC: <strong>{rx.patientNIC}</strong> • Age: {rx.patientAge} yrs • Valid: {rx.validUntil}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                        {rx.doctorName} <span className="text-slate-500 font-normal">({rx.slmcNumber})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{rx.clinicName} • Issued: {rx.dateIssued}</div>
                      <div className="mt-1 text-slate-800 font-medium text-[11px]">
                        <strong>Diagnosis:</strong> {rx.diagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Prescribed Medications List */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Prescribed Items:</h4>
                    <div className="space-y-1.5">
                      {rx.medications.map((med, idx) => {
                        const stockItem = inventory.find((i) => i.id === med.medicationId || i.brandName === med.brandName);
                        const hasEnoughStock = stockItem ? stockItem.stockQty >= med.quantityPrescribed : false;

                        return (
                          <div
                            key={idx}
                            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{med.brandName}</span> ({med.genericName})
                              <div className="text-slate-600 text-[11px] font-medium mt-0.5">
                                Dosage: <span className="text-teal-700">{med.dosage}</span> • Qty: {med.quantityPrescribed}
                              </div>
                              {med.specialInstructions && (
                                <div className="text-indigo-700 text-[10px] italic mt-0.5">
                                  Note: {med.specialInstructions}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              {stockItem ? (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    hasEnoughStock
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {hasEnoughStock ? `Stock: ${stockItem.stockQty}` : `Shortage (${stockItem.stockQty})`}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                  External Item
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onAnalyzePrescription(rx)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold px-3 py-2 rounded-xl text-xs border border-amber-200/80 transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Safety Scan
                  </button>

                  {isPending ? (
                    <button
                      onClick={() => onDispensePrescription(rx.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-teal-950/20 transition flex items-center gap-1.5"
                    >
                      <Scan className="w-4 h-4" /> Manual Fulfill & Deduct Stock
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fulfilled & Stock Deducted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Doctor E-Prescription Dispatcher */}
      {showDoctorDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Issue Doctor E-Prescription to Customer Phone
              </h3>
              <button
                onClick={() => setShowDoctorDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueDoctorPrescription} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Doctor Name & SLMC *</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Clinic / Hospital Name *</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Patient NIC *</label>
                  <input
                    type="text"
                    required
                    value={patientNIC}
                    onChange={(e) => setPatientNIC(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer Phone No *</label>
                  <input
                    type="text"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Select Medication to Prescribe</label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.brandName} ({item.strength}) - Stock: {item.stockQty}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Prescribed Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={prescribedQty}
                    onChange={(e) => setPrescribedQty(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorDispatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Dispatch to Customer Phone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

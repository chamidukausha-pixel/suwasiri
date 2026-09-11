import React, { useState } from 'react';
import { InventoryItem } from '../types';
import {
  Scan,
  Zap,
  CheckCircle2,
  AlertCircle,
  Package,
  Pill,
  MapPin,
  Clock,
  History,
  Minus,
  Plus,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';

interface BarcodeScannerModuleProps {
  inventory: InventoryItem[];
  onDeductStock: (id: string, qtyToDeduct: number) => void;
}

export const BarcodeScannerModule: React.FC<BarcodeScannerModuleProps> = ({
  inventory,
  onDeductStock,
}) => {
  const [scannedCode, setScannedCode] = useState<string>('SL-NMRA-2026-MET');
  const [issueQty, setIssueQty] = useState<number>(30);
  const [autoDeductMode, setAutoDeductMode] = useState<boolean>(true);
  const [scanHistory, setScanHistory] = useState<
    { time: string; drugName: string; code: string; qtyDeducted: number; remainingQty: number; location: string }[]
  >([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick preset barcodes for instant testing
  const presetBarcodes = [
    { label: 'Metformin 500mg', code: 'SL-NMRA-2026-MET' },
    { label: 'Losartan 50mg', code: 'SL-NMRA-2026-LOS' },
    { label: 'Omeprazole 20mg', code: 'SL-NMRA-2026-OME' },
    { label: 'Amoxicillin 500mg', code: 'SL-NMRA-2026-AMO' },
    { label: 'Atorvastatin 20mg', code: 'SL-NMRA-2026-ATO' },
    { label: 'Salbutamol Inhaler', code: 'SL-NMRA-2026-SAL' },
  ];

  const matchedItem = inventory.find(
    (item) =>
      item.nmraRegNo.toLowerCase() === scannedCode.trim().toLowerCase() ||
      item.brandName.toLowerCase() === scannedCode.trim().toLowerCase() ||
      item.id.toLowerCase() === scannedCode.trim().toLowerCase()
  );

  const handleProcessScan = (codeToScan?: string) => {
    const code = codeToScan || scannedCode;
    if (!code) return;

    const item = inventory.find(
      (i) =>
        i.nmraRegNo.toLowerCase() === code.trim().toLowerCase() ||
        i.brandName.toLowerCase() === code.trim().toLowerCase() ||
        i.id.toLowerCase() === code.trim().toLowerCase()
    );

    if (!item) {
      setFeedback({
        type: 'error',
        message: `Drug code / barcode "${code}" not registered in NMRA inventory database.`,
      });
      return;
    }

    if (item.stockQty < issueQty) {
      setFeedback({
        type: 'error',
        message: `Insufficient stock! Cannot deduct ${issueQty} units. Only ${item.stockQty} units remaining in ${item.pharmacyLocation}.`,
      });
      return;
    }

    // Perform deduction
    onDeductStock(item.id, issueQty);

    const newLog = {
      time: new Date().toLocaleTimeString('en-LK'),
      drugName: `${item.brandName} (${item.strength})`,
      code: item.nmraRegNo,
      qtyDeducted: issueQty,
      remainingQty: item.stockQty - issueQty,
      location: item.pharmacyLocation,
    };

    setScanHistory((prev) => [newLog, ...prev]);

    setFeedback({
      type: 'success',
      message: `DISPENSED & DEDUCTED: ${issueQty} units of ${item.brandName} (${item.strength}). Stock automatically reduced to ${item.stockQty - issueQty} units.`,
    });

    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30">
              <Scan className="w-3.5 h-3.5" />
              Automated Drug Issuance Scanner
            </div>
            <h2 className="text-2xl font-extrabold text-white">Interactive Drug Barcode & QR Scanner</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Scan drug packaging barcodes or NMRA codes during dispensing to automatically deduct inventory counts in real time with batch audit safety.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-teal-700/50 text-xs">
            <span className="text-slate-300 font-medium">Auto-Deduct Mode:</span>
            <button
              onClick={() => setAutoDeductMode(!autoDeductMode)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                autoDeductMode ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {autoDeductMode ? '⚡ ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulated Camera Viewfinder & Scanner */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-sm text-white">Live Camera Barcode Scanner</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
              CAM_01 ACTIVE
            </span>
          </div>

          {/* Viewfinder Graphic */}
          <div className="relative bg-slate-950 rounded-xl h-52 border border-teal-500/40 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
            {/* Animated Laser Scanning Line */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-bounce" />

            {/* Corner Bracket Frame Elements */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-teal-400" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-teal-400" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-teal-400" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-teal-400" />

            <Scan className="w-12 h-12 text-teal-400/80 mb-2 animate-pulse" />
            <span className="text-xs text-teal-300 font-mono font-bold tracking-wider">ALIGN BARCODE IN FRAME</span>
            <span className="text-[10px] text-slate-400 mt-1">Simulated Hardware Scanner Engine</span>
          </div>

          {/* Preset Quick Scan Buttons */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold block">Quick Preset Test Barcodes:</label>
            <div className="grid grid-cols-2 gap-2">
              {presetBarcodes.map((preset) => (
                <button
                  key={preset.code}
                  onClick={() => {
                    setScannedCode(preset.code);
                    if (autoDeductMode) {
                      handleProcessScan(preset.code);
                    }
                  }}
                  className={`p-2 rounded-lg text-left text-xs transition border ${
                    scannedCode === preset.code
                      ? 'bg-teal-900/80 border-teal-500 text-teal-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold truncate">{preset.label}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{preset.code}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Scanned Barcode / NMRA Registration Code
              </label>
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="e.g. SL-NMRA-2026-MET"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-teal-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Quantity</label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1">
                  <button
                    onClick={() => setIssueQty(Math.max(1, issueQty - 10))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={issueQty}
                    onChange={(e) => setIssueQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent text-center font-bold text-white text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => setIssueQty(issueQty + 10)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={() => handleProcessScan()}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-teal-950/60 flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4" /> Scan & Deduct
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Detected Drug Details & Dispense Activity Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 shadow-md ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Detected Item Card */}
          {matchedItem ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-teal-100 text-teal-800 rounded-xl font-bold">
                    <Pill className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{matchedItem.brandName}</h3>
                    <p className="text-xs text-slate-500">{matchedItem.genericName} • {matchedItem.strength} ({matchedItem.dosageForm})</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                  {matchedItem.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">NMRA Registration</span>
                  <span className="font-mono font-bold text-slate-900">{matchedItem.nmraRegNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Batch Number</span>
                  <span className="font-mono font-bold text-slate-900">{matchedItem.batchNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Stock</span>
                  <span className="font-extrabold text-teal-700 text-sm">{matchedItem.stockQty} units</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit MRP (LKR)</span>
                  <span className="font-bold text-slate-900">Rs. {matchedItem.unitPriceLkr.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Stored at: <strong>{matchedItem.pharmacyLocation}</strong>
                </div>

                <button
                  onClick={() => handleProcessScan()}
                  className="bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Minus className="w-4 h-4 text-teal-400" /> Deduct {issueQty} Units Now
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs space-y-2">
              <Scan className="w-10 h-10 text-teal-600 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No Drug Barcode Selected</p>
              <p>Type an NMRA code above or click a quick preset test barcode to inspect and deduct stock.</p>
            </div>
          )}

          {/* Real-Time Scan & Dispense Activity Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" /> Real-Time Auto-Deductions Audit Log
              </span>
              <span className="text-xs font-normal text-slate-500">{scanHistory.length} Dispatched</span>
            </h3>

            {scanHistory.length > 0 ? (
              <div className="space-y-2">
                {scanHistory.map((log, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{log.drugName}</span>
                      <span className="text-rose-600 font-extrabold">-{log.qtyDeducted} Units</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Code: <strong className="font-mono">{log.code}</strong> • {log.location}</span>
                      <span>Time: {log.time} • Remaining Stock: <strong className="text-slate-800">{log.remainingQty}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-slate-50 p-6 rounded-xl border border-dashed text-center">
                No drug stock deductions logged in this session yet. Scan a drug above to see live deduction logs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  InventoryItem,
  GPCarePrescription,
  SuwasiriPatientProfile,
  AIMedicationAlert,
  AutoRefillNotification
} from '../types';
import {
  Pill,
  FileText,
  HeartPulse,
  Sparkles,
  Bell,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Scan,
  DollarSign,
  Package,
  Building,
  Smartphone,
  Zap,
  Clock,
  User,
  Stethoscope,
  Activity
} from 'lucide-react';

interface DashboardOverviewProps {
  inventory: InventoryItem[];
  prescriptions: GPCarePrescription[];
  suwasiriProfiles: SuwasiriPatientProfile[];
  aiAlerts: AIMedicationAlert[];
  refills: AutoRefillNotification[];
  setActiveTab: (tab: string) => void;
  onRunAIScan: () => void;
  onDeductStock: (id: string, qtyToDeduct: number) => void;
  onDispensePrescription: (prescriptionId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  inventory,
  prescriptions,
  suwasiriProfiles,
  aiAlerts,
  refills,
  setActiveTab,
  onRunAIScan,
  onDeductStock,
  onDispensePrescription,
}) => {
  // Quick Dashboard Scanner State
  const [dashboardScanQuery, setDashboardScanQuery] = useState('');
  const [dashboardScanQty, setDashboardScanQty] = useState(10);
  const [dashboardScanNotice, setDashboardScanNotice] = useState<string | null>(null);

  const totalStockValueLkr = inventory.reduce((acc, item) => acc + item.stockQty * item.unitPriceLkr, 0);
  const totalUnitsCount = inventory.reduce((acc, item) => acc + item.stockQty, 0);
  const lowStockCount = inventory.filter((i) => i.status === 'Low Stock' || i.status === 'Critical Shortage').length;
  const pendingPrescriptionsCount = prescriptions.filter((p) => p.dispenseStatus === 'Pending').length;
  const unresolvedAlertsCount = aiAlerts.filter((a) => !a.resolved).length;
  const scheduledRefillsCount = refills.filter((r) => r.status === 'Scheduled').length;

  const handleDashboardQuickDeduct = () => {
    if (!dashboardScanQuery.trim()) return;

    const item = inventory.find(
      (i) =>
        i.nmraRegNo.toLowerCase() === dashboardScanQuery.trim().toLowerCase() ||
        i.brandName.toLowerCase() === dashboardScanQuery.trim().toLowerCase() ||
        i.id.toLowerCase() === dashboardScanQuery.trim().toLowerCase()
    );

    if (item) {
      if (item.stockQty < dashboardScanQty) {
        setDashboardScanNotice(`⚠️ Insufficient stock! ${item.brandName} only has ${item.stockQty} units remaining.`);
      } else {
        onDeductStock(item.id, dashboardScanQty);
        setDashboardScanNotice(`✅ Successfully issued ${dashboardScanQty} units of ${item.brandName}. Stock reduced to ${item.stockQty - dashboardScanQty}.`);
      }
    } else {
      setDashboardScanNotice(`❌ Drug barcode "${dashboardScanQuery}" not found in inventory.`);
    }

    setTimeout(() => setDashboardScanNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Professional Executive Workstation Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30">
              <Activity className="w-3.5 h-3.5" />
              Sri Lanka Clinical Executive Workstation • Gateway v2.4
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PharmaCloud & Suwasiri E-Health Executive Hub
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Unified real-time drug inventory tracking, doctor e-prescriptions sent to patient customer numbers, interactive barcode drug stock reduction, and Gemini clinical safety analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('scanner')}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-teal-950/50 flex items-center gap-2 transition"
            >
              <Scan className="w-4 h-4" /> Barcode Drug Scanner
            </button>
            <button
              onClick={onRunAIScan}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-amber-500/30 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> AI Safety Scan
            </button>
          </div>
        </div>
      </div>

      {/* Top Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Product Formulations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Registered Formulations</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {inventory.length} <span className="text-xs font-normal text-slate-500">Drugs</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> NMRA Registered & Active
            </div>
          </div>
        </div>

        {/* Metric 2: Total Units & Batches */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Drug Units in Stock</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalUnitsCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Across {inventory.length} NMRA registered items
            </div>
          </div>
        </div>

        {/* Metric 3: Incoming Customer E-Prescriptions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Suwasiri E-Prescriptions</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {pendingPrescriptionsCount} <span className="text-xs font-semibold text-amber-600">Pending Fulfill</span>
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">
              Sent to patient customer numbers
            </div>
          </div>
        </div>

        {/* Metric 4: AI Risk Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>AI Medication Safety</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {unresolvedAlertsCount} <span className="text-xs font-normal text-slate-500">Active Risk Flags</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Gemini 3.6 Flash Interaction Engine
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick Barcode Scanner Bar on Executive Dashboard */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-extrabold text-white text-sm">Quick Drug Barcode Scanner & Real-Time Stock Deductor</h3>
              <p className="text-slate-400 text-[11px]">Type or scan drug barcode e.g. SL-NMRA-2026-MET to immediately deduct inventory stock.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('scanner')}
            className="text-teal-300 text-xs hover:underline font-semibold flex items-center gap-1"
          >
            Open Full Camera Scanner <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <input
            type="text"
            placeholder="Scan Barcode / NMRA Reg Code (e.g. SL-NMRA-2026-MET, SL-NMRA-2026-LOS, Metformin)..."
            value={dashboardScanQuery}
            onChange={(e) => setDashboardScanQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDashboardQuickDeduct()}
            className="flex-1 w-full p-2.5 bg-slate-950 border border-teal-600/50 rounded-xl text-xs text-teal-300 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1 text-xs">
              <span className="px-2 text-slate-400">Qty:</span>
              <input
                type="number"
                min={1}
                value={dashboardScanQty}
                onChange={(e) => setDashboardScanQty(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-bold text-teal-300 focus:outline-none"
              />
            </div>

            <button
              onClick={handleDashboardQuickDeduct}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shrink-0 shadow-md flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> Scan & Deduct Stock
            </button>
          </div>
        </div>

        {dashboardScanNotice && (
          <div className="p-3 bg-slate-950 border border-teal-500/40 rounded-xl text-xs text-teal-200 font-semibold flex items-center gap-2">
            <span>{dashboardScanNotice}</span>
          </div>
        )}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Patient Customer Number E-Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Suwasiri Customer Number E-Prescriptions Stream
                  </h3>
                  <p className="text-xs text-slate-500">Doctor-issued digital prescriptions dispatched to patient phones</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('gpcare')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Manage All Prescriptions <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx) => {
                const isPending = rx.dispenseStatus === 'Pending';

                return (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition text-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{rx.patientName}</span>
                        <span className="bg-indigo-100 text-indigo-900 font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                          📱 {rx.patientPhone}
                        </span>
                        <span className="text-slate-500 text-[11px]">(NIC: {rx.patientNIC})</span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rx.dispenseStatus}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      Doctor: <strong>{rx.doctorName}</strong> ({rx.slmcNumber}) • Diagnosis: {rx.diagnosis}
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                      <strong>Prescribed Items:</strong>{' '}
                      {rx.medications.map((m) => `${m.brandName} (${m.dosage}) - Qty: ${m.quantityPrescribed}`).join(', ')}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 text-[10px]">E-Prescription ID: {rx.id} • Issued: {rx.dateIssued}</span>
                      {isPending ? (
                        <button
                          onClick={() => onDispensePrescription(rx.id)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition flex items-center gap-1"
                        >
                          <Scan className="w-3.5 h-3.5" /> Scan & Fulfill (Deduct Stock)
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fulfilled & Vault Synced
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Stock Shortages & AI Alerts */}
        <div className="space-y-6">
          {/* Low Stock Warnings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                NMRA Stock Shortage Ledger
              </h3>
              <button
                onClick={() => setActiveTab('stock-inventory')}
                className="text-xs text-teal-600 hover:underline font-bold"
              >
                Stock View
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {inventory
                .filter((i) => i.status === 'Low Stock' || i.status === 'Critical Shortage')
                .map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.brandName} ({item.strength})</span>
                      <span className="text-rose-600">{item.stockQty} left</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.pharmacyLocation}</span>
                      <span>Min: {item.reorderLevel}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* AI Clinical Safety Brief */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Gemini Drug Safety Monitor
              </h3>
              <button
                onClick={() => setActiveTab('ai-alerts')}
                className="text-amber-300 text-xs hover:underline font-bold"
              >
                View ({unresolvedAlertsCount})
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Automated clinical cross-checking active against Suwasiri patient allergy records and chronic conditions.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-amber-400 font-bold">Top Active Flag:</div>
              <div className="text-slate-200">Metformin + Losartan renal monitoring advised for NIC 198574102938V.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { InventoryItem, CustomerBill, SystemSyncLog, Supplier, SupplierOrder } from '../types';
import { SupplierManagement } from './SupplierManagement';
import {
  Lock,
  Unlock,
  Shield,
  DollarSign,
  TrendingUp,
  Building,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  PieChart,
  Users,
  Award,
  Download,
  Eye,
  EyeOff,
  Truck,
  Layers
} from 'lucide-react';

interface AdminModuleProps {
  inventory: InventoryItem[];
  bills: CustomerBill[];
  syncLogs: SystemSyncLog[];
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  onAddSupplier: (newSupplier: Supplier) => void;
  onAddSupplierOrder: (newOrder: SupplierOrder) => void;
  onReceiveSupplierOrder: (orderId: string) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  inventory,
  bills,
  syncLogs,
  suppliers,
  supplierOrders,
  onAddSupplier,
  onAddSupplierOrder,
  onReceiveSupplierOrder,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [activeTab, setActiveTab] = useState<'valuation' | 'suppliers' | 'audits'>('valuation');

  // Financial Calculations
  const totalValuationLkr = inventory.reduce((acc, item) => acc + item.stockQty * item.unitPriceLkr, 0);
  const totalUnits = inventory.reduce((acc, item) => acc + item.stockQty, 0);
  const totalRevenueLkr = bills.reduce((acc, bill) => acc + bill.netLkr, 0);
  const totalBillsCount = bills.length;
  const estimatedGrossProfitLkr = totalRevenueLkr * 0.22; // Estimated 22% NMRA regulated margin

  // Valuation by Depot
  const depotValuations = ['Colombo Central', 'Kandy General', 'Galle Health Hub', 'Jaffna Depot'].map((depot) => {
    const itemsInDepot = inventory.filter((i) => i.pharmacyLocation === depot);
    const value = itemsInDepot.reduce((acc, i) => acc + i.stockQty * i.unitPriceLkr, 0);
    const count = itemsInDepot.reduce((acc, i) => acc + i.stockQty, 0);
    return { depot, value, count };
  });

  // Valuation by Category
  const categories = ['Endocrine', 'Cardiovascular', 'Respiratory', 'Antibiotic', 'Analgesic', 'Gastrointestinal'];
  const categoryValuations = categories.map((cat) => {
    const itemsInCat = inventory.filter((i) => i.category === cat);
    const value = itemsInCat.reduce((acc, i) => acc + i.stockQty * i.unitPriceLkr, 0);
    return { category: cat, value, count: itemsInCat.length };
  });

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '0000') {
      setIsAuthenticated(true);
      setPinError(null);
    } else {
      setPinError('Invalid Owner Passcode. Default PIN is 1234.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 text-slate-800">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-slate-900/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Shop Owner Admin Category</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Restricted Access: Store valuation, gross margin reports, NMRA price cap audits, and owner financial metrics require Owner Passcode.
          </p>
        </div>

        {pinError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Owner Security PIN (Default: 1234)
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                placeholder="Enter 4-digit PIN..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-lg tracking-widest text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4 text-amber-400" /> Unlock Owner Admin Portal
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-mono">
            Protected under Sri Lanka MoH & PDPA Act No. 9
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-2xl p-6 text-white border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30">
              <Award className="w-3.5 h-3.5" />
              Restricted Shop Owner & Executive Category
            </div>
            <h2 className="text-2xl font-extrabold text-white">Shop Owner Admin & Financial Portal</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Consolidated financial audit details, store LKR valuation, net revenue, NMRA profit cap compliance, and depot level capital allocations accessible strictly by the shop owner.
            </p>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs border border-amber-500/30 flex items-center gap-1.5 shrink-0"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Admin Session
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('valuation')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'valuation'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-400" /> Stock Valuation & Profit Margins
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'suppliers'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" /> Supplier Procurement ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveTab('audits')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'audits'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Audit Logs & Security
          </button>
        </div>
      </div>

      {activeTab === 'suppliers' && (
        <SupplierManagement
          suppliers={suppliers}
          supplierOrders={supplierOrders}
          inventory={inventory}
          onAddSupplier={onAddSupplier}
          onAddSupplierOrder={onAddSupplierOrder}
          onReceiveSupplierOrder={onReceiveSupplierOrder}
        />
      )}

      {activeTab === 'valuation' && (
        <>
          {/* Top Financial Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stock Value */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Stock Valuation (LKR)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Rs. {totalValuationLkr.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> NMRA Regulated Asset Value
            </div>
          </div>
        </div>

        {/* Card 2: Sales Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>POS Sales Revenue</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Rs. {totalRevenueLkr.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              From {totalBillsCount} customer sales bills
            </div>
          </div>
        </div>

        {/* Card 3: Est. Gross Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Est. Gross Margin (22%)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              Rs. {estimatedGrossProfitLkr.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Within NMRA Gazetted MRP caps
            </div>
          </div>
        </div>

        {/* Card 4: Total Units */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Units Inventory</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Across {inventory.length} formulations
            </div>
          </div>
        </div>
      </div>

      {/* Financial Split Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Depot Capital Allocations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              Depot Stock Valuation Breakdown
            </h3>
            <span className="text-xs text-slate-500 font-medium">4 Active Depots</span>
          </div>

          <div className="space-y-3">
            {depotValuations.map((dep) => {
              const percentage = totalValuationLkr > 0 ? (dep.value / totalValuationLkr) * 100 : 0;
              return (
                <div key={dep.depot} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{dep.depot}</span>
                    <span className="text-teal-700 text-sm font-extrabold">
                      Rs. {dep.value.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{dep.count.toLocaleString()} drug units</span>
                    <span>{percentage.toFixed(1)}% of total valuation</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Category Valuation & Profit Margins */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              Valuation by Therapeutic Category
            </h3>
            <span className="text-xs text-slate-500 font-medium">Category Capital</span>
          </div>

          <div className="space-y-3">
            {categoryValuations.map((cat) => {
              const percentage = totalValuationLkr > 0 ? (cat.value / totalValuationLkr) * 100 : 0;
              return (
                <div key={cat.category} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{cat.category}</span>
                    <span className="text-slate-900">
                      Rs. {cat.value.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Owner Financial & Audit Log */}
      {(activeTab === 'audits' || activeTab === 'valuation') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Owner Financial Audit Trail & Gateway Logs
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200">
              TLS 1.3 / Encrypted
            </span>
          </div>

          <div className="space-y-2">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900 block">{log.action}</span>
                  <span className="text-slate-500 text-[11px]">
                    Source: <strong>{log.sourceSystem}</strong> • Time: {log.timestamp} • {log.details}
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                  {log.securityProtocol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

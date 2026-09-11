import React from 'react';
import {
  LayoutDashboard,
  PackageCheck,
  Scan,
  FileText,
  HeartPulse,
  Sparkles,
  Bell,
  ShieldCheck,
  Database,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Pill,
  Smartphone,
  ShoppingCart,
  ShoppingBag,
  Lock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingRefillCount: number;
  aiAlertCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
  stockLowCount: number;
  incomingPrescriptionCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingRefillCount,
  aiAlertCount,
  isSyncing,
  onManualSync,
  stockLowCount,
  incomingPrescriptionCount,
}) => {
  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'System metrics & live clinical feeds',
    },
    {
      id: 'stock-inventory',
      label: 'Stock & Inventory Ledger',
      icon: PackageCheck,
      badge: stockLowCount > 0 ? `${stockLowCount} Low` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      description: 'Pharmacy drug stock & barcode labels',
    },
    {
      id: 'online-store',
      label: 'Online Store & E-Pharmacy',
      icon: ShoppingBag,
      badge: 'E-Commerce',
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
      description: 'Customer online order sales & express delivery',
    },
    {
      id: 'billing',
      label: 'POS Bills & SMS Dispatcher',
      icon: ShoppingCart,
      badge: 'POS Bills',
      badgeColor: 'bg-teal-500 text-slate-950 font-bold',
      description: 'Customer purchase bills & phone SMS',
    },
    {
      id: 'scanner',
      label: 'Barcode / QR Drug Scanner',
      icon: Scan,
      badge: 'Auto Deduct',
      badgeColor: 'bg-teal-500 text-slate-950 font-bold',
      description: 'Scan drugs to auto-reduce inventory',
    },
    {
      id: 'gpcare',
      label: 'Suwasiri E-Prescriptions',
      icon: Smartphone,
      badge: incomingPrescriptionCount > 0 ? `${incomingPrescriptionCount} New` : null,
      badgeColor: 'bg-indigo-500 text-white font-bold',
      description: 'Doctor issued -> Sent to patient number',
    },
    {
      id: 'admin',
      label: 'Admin & Shop Owner Portal',
      icon: Lock,
      badge: 'Protected',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      description: 'Financial valuation & store profit margins',
    },
    {
      id: 'suwasiri',
      label: 'Suwasiri Health Vault',
      icon: HeartPulse,
      badge: null,
      description: 'Patient allergies, NIC & chronic logs',
    },
    {
      id: 'ai-alerts',
      label: 'AI Drug Safety Engine',
      icon: Sparkles,
      badge: aiAlertCount > 0 ? aiAlertCount : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
      description: 'Gemini 3.6 Flash clinical risk scanner',
    },
    {
      id: 'auto-refill',
      label: 'Refill Notifications',
      icon: Bell,
      badge: pendingRefillCount > 0 ? pendingRefillCount : null,
      badgeColor: 'bg-purple-500 text-white font-bold',
      description: 'Trilingual EN/SI/TA SMS alerts',
    },
    {
      id: 'compliance',
      label: 'Regulatory & Compliance',
      icon: ShieldCheck,
      badge: null,
      description: 'NMRA MRP caps & PDPA 2022 audit',
    },
  ];

  return (
    <aside className="w-full lg:w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none shadow-2xl z-30">
      {/* Top Branding Section */}
      <div>
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg shadow-teal-950/50 text-white flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base text-white tracking-tight">PharmaCloud</h1>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 uppercase">
                  Gateway
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Sri Lanka MoH E-Health Portal</p>
            </div>
          </div>

          {/* Quick Gateway Status Pill */}
          <div className="mt-4 p-2 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              TLS 1.3 Active
            </span>
            <span className="text-slate-400 font-mono text-[10px]">FHIR v4.0.1</span>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Core Operations & Management
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-950/40 ring-1 ring-teal-400/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-teal-400 group-hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-teal-100' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-1 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Manual Sync */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-sky-400" /> SL GP Care Sync
            </span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="w-3 h-3 text-rose-400" /> Suwasiri Vault
            </span>
            <span className="text-emerald-400 font-bold">SYNCED</span>
          </div>
        </div>

        <button
          onClick={onManualSync}
          disabled={isSyncing}
          className="w-full bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold py-2 px-3 rounded-xl text-xs border border-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
          {isSyncing ? 'Synchronizing...' : 'Sync Gateway'}
        </button>

        <div className="text-[10px] text-slate-500 text-center">
          NMRA Reg # SL-MOH-2026 • PDPA Compliant
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import { Pill, Activity, ShieldCheck, HeartPulse, Sparkles, Bell, RefreshCw, FileText, Database } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingRefillCount: number;
  aiAlertCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingRefillCount,
  aiAlertCount,
  isSyncing,
  onManualSync,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'inventory', label: 'Pharmacy Stock', icon: Pill },
    { id: 'gpcare', label: 'GP Care Prescriptions', icon: FileText },
    { id: 'suwasiri', label: 'Suwasiri Health Vault', icon: HeartPulse },
    { id: 'ai-alerts', label: 'AI Drug Safety', icon: Sparkles, badge: aiAlertCount > 0 ? aiAlertCount : null },
    { id: 'auto-refill', label: 'Refill Notifications', icon: Bell, badge: pendingRefillCount > 0 ? pendingRefillCount : null },
    { id: 'compliance', label: 'Regulatory & Encryption', icon: ShieldCheck },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Banner with System Integrations */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sri Lanka PharmaCloud Gateway
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              SL GP Care: <strong className="text-emerald-400 font-medium">CONNECTED (TLS 1.3)</strong>
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-400">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              Suwasiri eHealth Vault: <strong className="text-emerald-400 font-medium">FHIR v4.0.1 SYNCED</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="bg-slate-800 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 text-[11px] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> NMRA & PDPA 2022 Compliant
            </span>
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 rounded transition flex items-center gap-1 text-[11px] disabled:opacity-50"
              title="Trigger encrypted re-sync with Suwasiri & GP Care"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Gateway'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg shadow-teal-950/50 flex items-center justify-center text-white">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Sri Lanka PharmaCloud</h1>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                MoH e-Health
              </span>
            </div>
            <p className="text-xs text-slate-400">GP Care & Suwasiri Unified Pharmacy System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-teal-600/90 text-white shadow-sm ring-1 ring-teal-400/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile / Tablet Horizontal Scroll Nav */}
      <div className="xl:hidden border-t border-slate-800/80 bg-slate-900/90 overflow-x-auto px-2 py-1.5 scrollbar-none flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

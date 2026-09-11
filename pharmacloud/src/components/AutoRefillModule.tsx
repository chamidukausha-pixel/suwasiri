import React, { useState } from 'react';
import { AutoRefillNotification, GPCarePrescription } from '../types';
import { Bell, Send, CheckCircle2, Languages, Sparkles, MessageSquare, Phone, Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react';

interface AutoRefillModuleProps {
  refills: AutoRefillNotification[];
  prescriptions: GPCarePrescription[];
  onDispatchNotification: (refillId: string) => void;
  onAddRefill: (refill: AutoRefillNotification) => void;
}

export const AutoRefillModule: React.FC<AutoRefillModuleProps> = ({
  refills,
  prescriptions,
  onDispatchNotification,
  onAddRefill,
}) => {
  const [activeTabLang, setActiveTabLang] = useState<'en' | 'si' | 'ta'>('en');
  const [selectedRefillId, setSelectedRefillId] = useState<string>(refills[0]?.id || '');
  const [dispatchLogs, setDispatchLogs] = useState<{ time: string; recipient: string; channel: string; text: string }[]>([]);
  const [isGeneratingAiMessage, setIsGeneratingAiMessage] = useState(false);

  const activeRefill = refills.find((r) => r.id === selectedRefillId) || refills[0];

  const handleGenerateAiTrilingualMessage = async () => {
    if (!activeRefill) return;
    setIsGeneratingAiMessage(true);

    try {
      const response = await fetch('/api/ai/generate-refill-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: activeRefill.patientName,
          phone: activeRefill.patientPhone,
          meds: activeRefill.medicationName,
          daysRemaining: activeRefill.daysRemaining,
          pharmacyName: activeRefill.suggestedPharmacy,
        }),
      });

      const data = await response.json();
      if (data.en && data.si && data.ta) {
        activeRefill.messageDrafts = {
          en: data.en,
          si: data.si,
          ta: data.ta,
        };
      }
    } catch (err) {
      console.error('Failed to generate trilingual message:', err);
    } finally {
      setIsGeneratingAiMessage(false);
    }
  };

  const handleSendSms = (refill: AutoRefillNotification) => {
    onDispatchNotification(refill.id);

    const activeLangText = refill.messageDrafts[activeTabLang] || refill.messageDrafts.en;
    const newLog = {
      time: new Date().toLocaleTimeString('en-LK'),
      recipient: `${refill.patientName} (${refill.patientPhone})`,
      channel: 'SMS Gateway (Dialog / Mobitel / Hutch Sri Lanka)',
      text: activeLangText,
    };

    setDispatchLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 rounded-2xl p-6 text-white border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/30">
              <Bell className="w-3.5 h-3.5" />
              Automated Trilingual Patient Notification System
            </div>
            <h2 className="text-2xl font-extrabold text-white">Automated Prescription Refill Engine</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Predictive refill notifications tailored in English, Sinhala (සිංහල), and Tamil (தமிழ்) sent automatically when patient medication supplies approach 2-3 days depletion.
            </p>
          </div>

          <button
            onClick={handleGenerateAiTrilingualMessage}
            disabled={isGeneratingAiMessage}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingAiMessage ? 'animate-spin' : ''}`} />
            {isGeneratingAiMessage ? 'Composing AI Script...' : 'AI Re-Compose Trilingual Messages'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Scheduled Refill Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Impending Refills Queue ({refills.length})
          </h3>

          <div className="space-y-2.5">
            {refills.map((refill) => {
              const isSelected = activeRefill?.id === refill.id;
              const isSent = refill.status === 'Sent' || refill.status === 'Confirmed';

              return (
                <div
                  key={refill.id}
                  onClick={() => setSelectedRefillId(refill.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{refill.patientName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSent ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {refill.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    Meds: <strong className="text-slate-900">{refill.medicationName}</strong>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {refill.daysRemaining} days left ({refill.estimatedDepletionDate})
                    </span>
                    <span className="text-slate-500 font-medium">Lang: {refill.preferredLanguage}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Message Previewer & Dispatch Logs */}
        <div className="lg:col-span-2 space-y-6">
          {activeRefill ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Trilingual Refill Dispatcher - {activeRefill.patientName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: <strong>{activeRefill.patientPhone}</strong> • Target Depot: {activeRefill.suggestedPharmacy}
                  </p>
                </div>

                {/* Language Switcher Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setActiveTabLang('en')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeTabLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setActiveTabLang('si')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeTabLang === 'si' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    සිංහල (Sinhala)
                  </button>
                  <button
                    onClick={() => setActiveTabLang('ta')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeTabLang === 'ta' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>
              </div>

              {/* Message Script Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner space-y-3 relative border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Languages className="w-4 h-4 text-purple-400" />
                    Language Format: {activeTabLang.toUpperCase()} Script
                  </span>
                  <span className="text-emerald-400 font-semibold">SMS & WhatsApp Compliant</span>
                </div>

                <div className="text-sm font-sans leading-relaxed text-slate-100 py-2 min-h-[80px]">
                  {activeRefill.messageDrafts[activeTabLang] || activeRefill.messageDrafts.en}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Stock Status: {activeRefill.stockAvailable ? '✅ Reserved in Inventory' : '⚠️ Order Required'}</span>
                  <button
                    onClick={() => handleSendSms(activeRefill)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Dispatch SMS / WhatsApp Alert
                  </button>
                </div>
              </div>

              {/* System Dispatch Logs */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">SMS Gateway Transmission Activity Logs</h4>
                {dispatchLogs.length > 0 ? (
                  <div className="space-y-2">
                    {dispatchLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>{log.time} • {log.recipient}</span>
                          <span className="text-emerald-600 font-bold">DELIVERED</span>
                        </div>
                        <div className="text-slate-800 font-medium">{log.text}</div>
                        <div className="text-slate-400 text-[10px] italic">Route: {log.channel}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">
                    No active messages dispatched in this session. Click "Dispatch SMS / WhatsApp Alert" to transmit alerts to Sri Lankan patients.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              Select a patient refill reminder from the queue to inspect trilingual message drafts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

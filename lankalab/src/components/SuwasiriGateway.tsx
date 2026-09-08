import React, { useState } from 'react';
import { LabOrder } from '../types';
import { 
  QrCode, 
  Search, 
  Smartphone, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Send, 
  Printer, 
  ExternalLink,
  Building2,
  Phone,
  User,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';

interface SuwasiriGatewayProps {
  orders: LabOrder[];
  onSelectOrder?: (order: LabOrder) => void;
  onNavigateToOverview?: () => void;
}

export default function SuwasiriGateway({ 
  orders, 
  onSelectOrder,
  onNavigateToOverview 
}: SuwasiriGatewayProps) {
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState('Today, 08:30 AM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find patients with barcodes
  const patientsWithBarcode = orders.filter(o => o.suwasiriBarcode);

  // Search matches
  const filteredOrders = barcodeSearch.trim()
    ? orders.filter(o => 
        (o.suwasiriBarcode && o.suwasiriBarcode.toLowerCase().includes(barcodeSearch.toLowerCase())) ||
        o.patientName.toLowerCase().includes(barcodeSearch.toLowerCase()) ||
        o.specimenId.toLowerCase().includes(barcodeSearch.toLowerCase())
      )
    : patientsWithBarcode;

  // Selected patient for deep-dive
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patientsWithBarcode[0]?.id || orders[0]?.id || ''
  );

  const activePatient = orders.find(o => o.id === selectedPatientId) || orders[0];

  const handleSimulateScan = (code: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setBarcodeSearch(code);
      const match = orders.find(o => o.suwasiriBarcode === code);
      if (match) {
        setSelectedPatientId(match.id);
        showToast(`Barcode ${code} recognized! Matched to ${match.patientName}.`);
      } else {
        showToast(`Barcode ${code} scanned. No direct patient record in cache.`);
      }
    }, 750);
  };

  const handlePushToSuwasiri = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast(`Diagnostic results successfully pushed to ${activePatient.patientName}'s Suwasiri Citizen App!`);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-[#003b5c] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-center">
          <QrCode className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ministry of Health Sri Lanka • Digital Health Node</span>
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight text-white flex items-center gap-2.5">
              Suwasiri Digital Health Gateway
            </h1>
            <p className="text-xs text-teal-100 max-w-xl leading-relaxed">
              Find any citizen patient instantly by their unified Suwasiri barcode number. Seamlessly synchronize verified diagnostic pathology reports directly with their GP Clinic and Suwasiri Citizen Mobile App.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-2 rounded-xl text-right">
              <span className="text-[10px] text-teal-200 uppercase font-bold block">Gateway Node</span>
              <span className="font-mono text-xs font-bold text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                ACTIVE (COL-09)
              </span>
            </div>

            <button
              onClick={() => {
                setSyncStatus('syncing');
                setTimeout(() => {
                  setSyncStatus('idle');
                  setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                  showToast('National Health Gateway sync verified. All patient tokens refreshed.');
                }, 1000);
              }}
              disabled={syncStatus === 'syncing'}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'syncing' ? 'Pinging...' : 'Sync Gateway'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Search & Scan Bar */}
      <div className="bg-white border border-[#c1c7cf] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Main search field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Scan or enter Suwasiri Barcode (e.g. SUW-COL-8891) or patient name..."
              className="w-full pl-9 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
            />
            {barcodeSearch && (
              <button 
                onClick={() => setBarcodeSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Simulate Laser Scan Button */}
          <button
            onClick={() => handleSimulateScan('SUW-COL-8891')}
            disabled={isScanning}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <QrCode className="w-4 h-4 text-teal-300" />
            <span>{isScanning ? 'Reading Optical...' : 'Simulate Barcode Scan'}</span>
          </button>
        </div>

        {/* Quick Click Sample Barcodes */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Quick Sample Barcodes:</span>
          {patientsWithBarcode.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setBarcodeSearch(p.suwasiriBarcode || '');
                setSelectedPatientId(p.id);
                showToast(`Loaded ${p.patientName} (${p.suwasiriBarcode})`);
              }}
              className={`px-2 py-1 rounded font-mono font-bold border text-[10px] transition-all cursor-pointer ${
                barcodeSearch === p.suwasiriBarcode
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {p.suwasiriBarcode} ({p.patientName.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left is Patient List / Search Results, Right is Patient Gateway Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Registered Patients with Suwasiri Barcode */}
        <div className="lg:col-span-5 bg-white border border-[#c1c7cf] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-[#f0f3ff] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Suwasiri Registry Records ({filteredOrders.length})
              </h3>
              <p className="text-[11px] text-slate-500">Select any citizen to inspect electronic tokens</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold font-mono px-2 py-0.5 rounded">
              Lanka MOH
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No patient found matching "{barcodeSearch}"</p>
                <p className="text-[11px] text-slate-400 mt-1">Check barcode number or verify spelling.</p>
              </div>
            ) : (
              filteredOrders.map(patient => {
                const isSelected = patient.id === activePatient.id;
                return (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`p-3.5 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{patient.patientName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {patient.age}y • {patient.gender}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                          <QrCode className="w-3 h-3 text-emerald-700" />
                          {patient.suwasiriBarcode || 'Not Registered'}
                        </span>
                        <span className="text-[11px] text-slate-600 truncate max-w-[140px]">
                          {patient.testType}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 truncate">
                        🏥 {patient.connectedClinic || 'National Referral Network'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        patient.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        patient.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {patient.status}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">#{patient.specimenId}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Citizen Gateway Health Portal Profile */}
        <div className="lg:col-span-7 space-y-4">
          {activePatient ? (
            <div className="bg-white border-2 border-emerald-700/80 rounded-xl overflow-hidden shadow-md">
              
              {/* Header card */}
              <div className="bg-emerald-800 text-white p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-700 px-2 py-0.5 rounded text-emerald-100 border border-emerald-500">
                        Citizen Health Record
                      </span>
                      <span className="text-[10px] text-emerald-200 font-mono">
                        Reg: #{activePatient.id}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-serif mt-1 text-white">
                      {activePatient.patientName}
                    </h2>
                    <p className="text-xs text-emerald-100 font-medium mt-0.5">
                      {activePatient.age} Years Old • {activePatient.gender} • Room/Ward: {activePatient.wardOrDept || 'OPD'}
                    </p>
                  </div>

                  {/* Big Barcode Card */}
                  <div className="bg-white text-slate-900 px-3 py-2 rounded-lg shadow border border-emerald-300 text-center self-start sm:self-auto">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                      Suwasiri Unified Barcode
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-800 block my-0.5 tracking-wider">
                      {activePatient.suwasiriBarcode || 'UNASSIGNED'}
                    </span>
                    {/* Simulated barcode bars */}
                    <div className="flex justify-center items-center gap-0.5 h-6 px-1 bg-slate-100 rounded">
                      <span className="w-1 h-5 bg-slate-900"></span>
                      <span className="w-0.5 h-5 bg-slate-900"></span>
                      <span className="w-1.5 h-5 bg-slate-900"></span>
                      <span className="w-0.5 h-5 bg-slate-900"></span>
                      <span className="w-1 h-5 bg-slate-900"></span>
                      <span className="w-2 h-5 bg-slate-900"></span>
                      <span className="w-0.5 h-5 bg-slate-900"></span>
                      <span className="w-1.5 h-5 bg-slate-900"></span>
                      <span className="w-0.5 h-5 bg-slate-900"></span>
                      <span className="w-1 h-5 bg-slate-900"></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Synchronizer Status Banner */}
              <div className="bg-emerald-50 border-b border-emerald-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">GP Care Network</span>
                  <span className="font-bold text-primary truncate block mt-0.5">
                    {activePatient.connectedClinic || 'National General Hospital'}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-semibold">● Linked & Synchronized</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Suwasiri Citizen App</span>
                  <span className="font-bold text-slate-800 font-mono block mt-0.5">
                    {activePatient.phone || '+94 77 123 4567'}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-semibold">● App Installed (v2.4)</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Ministry Cloud Sync</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {lastSyncedTime}
                  </span>
                  <span className="text-[9px] text-teal-700 font-semibold">● AES-256 Token Valid</span>
                </div>
              </div>

              {/* Patient Order Assays & Measured Parameters */}
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-700" />
                      Active Lab Test & Quantitative Assays
                    </h4>
                    <span className="text-xs font-semibold text-slate-600 font-mono">
                      Specimen: #{activePatient.specimenId}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{activePatient.testType}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        activePatient.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        activePatient.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Status: {activePatient.status}
                      </span>
                    </div>
                    {activePatient.notes && (
                      <p className="text-[11px] text-slate-600 italic">
                        Clinician referral notes: "{activePatient.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantitative Parameters if present */}
                {activePatient.results && activePatient.results.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-[#f0f3ff] text-slate-700 font-bold text-[10px] uppercase">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-2">Assay Parameter</th>
                          <th className="px-3 py-2 text-right">Measured</th>
                          <th className="px-3 py-2 text-right">Standard Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activePatient.results.map((r, idx) => (
                          <tr key={idx} className={r.isAbnormal ? 'bg-red-50 text-red-700 font-bold' : 'hover:bg-slate-50'}>
                            <td className="px-3 py-1.5 font-sans">{r.parameter}</td>
                            <td className="px-3 py-1.5 text-right font-bold">
                              {r.value} <span className="text-[9px] font-normal text-slate-400">{r.unit}</span>
                            </td>
                            <td className="px-3 py-1.5 text-right text-slate-500">{r.referenceRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Gateway Push & Interoperability Action Buttons */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={handlePushToSuwasiri}
                    disabled={syncStatus === 'syncing'}
                    className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-200" />
                    <span>Push to Citizen App</span>
                  </button>

                  <button
                    onClick={() => {
                      showToast(`Thermal Barcode Sticker printed for ${activePatient.patientName} (${activePatient.suwasiriBarcode})`);
                    }}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-300" />
                    <span>Print Thermal Barcode</span>
                  </button>

                  {onNavigateToOverview && (
                    <button
                      onClick={() => {
                        if (onSelectOrder) onSelectOrder(activePatient);
                        onNavigateToOverview();
                      }}
                      className="py-2.5 px-3 bg-[#dee8ff] hover:bg-[#c9daff] text-primary text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-primary/20 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <span>View in Main Lab List</span>
                    </button>
                  )}
                </div>

                {/* Interoperability Security Notice */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    All transmissions over the Suwasiri Health Cloud are cryptographically verified according to Sri Lanka National Health Data Standards. Patient results are delivered instantly with end-to-end encryption.
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#c1c7cf] rounded-xl p-8 text-center text-slate-500">
              <p className="text-xs">Select a patient from the list to display their Suwasiri Unified Citizen profile.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

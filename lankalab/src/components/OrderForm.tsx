import React, { useState } from 'react';
import { LabOrder, TestStatus } from '../types';
import { 
  Check, 
  X, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  Globe, 
  Smartphone, 
  Info,
  Database
} from 'lucide-react';

const SUWASIRI_REGISTRY = [
  {
    barcode: 'SUWA-98210',
    patientName: 'Kamala Gunawardena',
    age: 62,
    gender: 'Female' as const,
    phone: '+94 71 888 9911',
    email: 'kamala.guna@gov.lk',
    wardOrDept: 'Ward 4 (Cardiology)',
    connectedClinic: 'Colombo National Medical Clinic',
  },
  {
    barcode: 'SUWA-24901',
    patientName: 'Anura Perera',
    age: 45,
    gender: 'Male' as const,
    phone: '+94 77 123 4567',
    email: 'anura.perera@mail.lk',
    wardOrDept: 'OPD Clinic A',
    connectedClinic: 'Kandy General Medical Clinic',
  },
  {
    barcode: 'SUWA-65408',
    patientName: 'Dilani Rodrigo',
    age: 38,
    gender: 'Female' as const,
    phone: '+94 72 999 1111',
    email: 'dilani.rodrigo@health.lk',
    wardOrDept: 'Family Medicine Clinic',
    connectedClinic: 'Ceylon Endocrine & Family Care',
  },
  {
    barcode: 'SUWA-10294',
    patientName: 'Sunil Mendis',
    age: 53,
    gender: 'Male' as const,
    phone: '+94 70 543 2100',
    email: 'sunil.mendis@wellness.lk',
    wardOrDept: 'Wellness Outpatients',
    connectedClinic: 'Nawala Preventive Health Center',
  },
  {
    barcode: 'SUWA-77725',
    patientName: 'Priyantha de Silva',
    age: 33,
    gender: 'Male' as const,
    phone: '+94 77 345 6789',
    email: 'priyantha.silva@lanka.lk',
    wardOrDept: 'OPD General Practice',
    connectedClinic: 'Gampaha Family Care Clinic',
  }
];

interface OrderFormProps {
  onClose: () => void;
  onAddOrder: (newOrder: LabOrder) => void;
}

export default function OrderForm({ onClose, onAddOrder }: OrderFormProps) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number>(45);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [testType, setTestType] = useState('FBC + ESR');
  const [wardOrDept, setWardOrDept] = useState('');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Critical'>('Routine');
  const [notes, setNotes] = useState('');
  const [simulateAbnormal, setSimulateAbnormal] = useState(false);
  
  // Suwasiri State
  const [suwasiriBarcode, setSuwasiriBarcode] = useState('');
  const [connectedClinic, setConnectedClinic] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const triggerSuwasiriSync = (barcodeStr: string) => {
    if (!barcodeStr.trim()) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    
    setTimeout(() => {
      const match = SUWASIRI_REGISTRY.find(
        p => p.barcode.toLowerCase() === barcodeStr.trim().toLowerCase()
      );

      if (match) {
        setPatientName(match.patientName);
        setAge(match.age);
        setGender(match.gender);
        setPhone(match.phone);
        setEmail(match.email);
        setWardOrDept(match.wardOrDept);
        setConnectedClinic(match.connectedClinic);
        setSyncStatus('success');
      } else {
        // Fallback generator for custom barcode
        const formattedName = barcodeStr.startsWith('SUWA-') ? `Lankan Patient (${barcodeStr})` : `Patient ${barcodeStr}`;
        setPatientName(formattedName);
        setAge(35);
        setGender('Male');
        setPhone('+94 77 000 0000');
        setEmail(`${barcodeStr.toLowerCase()}@suwasiri.lk`);
        setWardOrDept('OPD General');
        setConnectedClinic('National Health Service Clinic');
        setSyncStatus('success');
      }
      setIsSyncing(false);
    }, 900);
  };


  const testTypes = [
    'FBC + ESR',
    'Cardiac Enzymes (Troponin)',
    'Lipid Profile',
    'HbA1c + Fasting Glucose',
    'Liver Function Test (LFT)',
    'Kidney Function Test / Renal Profile'
  ];

  // Helper to generate simulated parameters based on the selected test and if user wants abnormal values
  const getSimulatedResults = (test: string, abnormal: boolean) => {
    switch (test) {
      case 'FBC + ESR':
        return [
          { 
            parameter: 'Hemoglobin', 
            value: abnormal ? '11.2' : '14.5', 
            unit: 'g/dL', 
            referenceRange: '13.5 - 17.5', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'White Blood Cells (WBC)', 
            value: abnormal ? '15.4' : '7.2', 
            unit: 'x10^9/L', 
            referenceRange: '4.0 - 11.0', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'ESR (Sedimentation Rate)', 
            value: abnormal ? '35' : '8', 
            unit: 'mm/hr', 
            referenceRange: '0 - 15', 
            isAbnormal: abnormal 
          }
        ];
      case 'Cardiac Enzymes (Troponin)':
        return [
          { 
            parameter: 'Cardiac Troponin I', 
            value: abnormal ? '1.85' : '0.01', 
            unit: 'ng/mL', 
            referenceRange: '< 0.04', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'CK-MB', 
            value: abnormal ? '12.8' : '2.1', 
            unit: 'ng/mL', 
            referenceRange: '< 5.0', 
            isAbnormal: abnormal 
          }
        ];
      case 'Lipid Profile':
        return [
          { 
            parameter: 'Total Cholesterol', 
            value: abnormal ? '245' : '182', 
            unit: 'mg/dL', 
            referenceRange: '< 200', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'HDL (Good Cholesterol)', 
            value: abnormal ? '35' : '52', 
            unit: 'mg/dL', 
            referenceRange: '> 40', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'LDL (Bad Cholesterol)', 
            value: abnormal ? '164' : '95', 
            unit: 'mg/dL', 
            referenceRange: '< 100', 
            isAbnormal: abnormal 
          }
        ];
      case 'HbA1c + Fasting Glucose':
        return [
          { 
            parameter: 'HbA1c', 
            value: abnormal ? '7.1' : '5.3', 
            unit: '%', 
            referenceRange: '4.0 - 5.6', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'Fasting Plasma Glucose', 
            value: abnormal ? '138' : '88', 
            unit: 'mg/dL', 
            referenceRange: '70 - 99', 
            isAbnormal: abnormal 
          }
        ];
      case 'Liver Function Test (LFT)':
        return [
          { 
            parameter: 'ALT (Alanine Transaminase)', 
            value: abnormal ? '92' : '32', 
            unit: 'U/L', 
            referenceRange: '7 - 56', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'AST (Aspartate Transaminase)', 
            value: abnormal ? '78' : '25', 
            unit: 'U/L', 
            referenceRange: '10 - 40', 
            isAbnormal: abnormal 
          },
          { 
            parameter: 'Total Bilirubin', 
            value: abnormal ? '2.4' : '0.6', 
            unit: 'mg/dL', 
            referenceRange: '0.1 - 1.2', 
            isAbnormal: abnormal 
          }
        ];
      default:
        return [
          { 
            parameter: 'General Parameter', 
            value: abnormal ? 'High' : 'Normal', 
            unit: '', 
            referenceRange: 'Normal range', 
            isAbnormal: abnormal 
          }
        ];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    // Build unique Specimen ID
    const randomSpecimen = `LNK-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Set Status depending on Priority
    let initialStatus: TestStatus = 'PENDING';
    if (priority === 'Critical') {
      initialStatus = 'CRITICAL';
    } else if (priority === 'Urgent') {
      initialStatus = 'PROCESSING';
    }

    const newOrder: LabOrder = {
      id: String(Date.now()),
      patientName,
      age: Number(age),
      gender,
      testType,
      orderTime: 'Just now',
      orderTimestamp: new Date(),
      specimenId: randomSpecimen,
      status: initialStatus,
      priority,
      wardOrDept: wardOrDept || 'OPD Clinic',
      notes,
      results: getSimulatedResults(testType, simulateAbnormal || priority === 'Critical'),
      phone: phone || '+94 77 000 0000',
      email: email || 'patient@health.lk',
      suwasiriBarcode: suwasiriBarcode || undefined,
      connectedClinic: connectedClinic || undefined
    };

    onAddOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-outline-variant max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderRadius: '0.5rem' }} // matches Level 1 rounded shape
      >
        {/* Header */}
        <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-2xl">science</span>
            <h3 className="font-bold text-lg">Create New Laboratory Order</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-white rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Suwasiri Barcode Entry Section */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-primary shrink-0" />
                Suwasiri Patient Unified Registry
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Lanka EHR Gateway
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-tight">
                Scan or Enter Suwasiri patient barcode *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-bold select-none">[|||||]</span>
                  <input
                    type="text"
                    className="w-full pl-12 pr-3 py-2 border border-slate-350 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs text-primary placeholder-slate-400"
                    placeholder="e.g. SUWA-98210"
                    value={suwasiriBarcode}
                    onChange={(e) => setSuwasiriBarcode(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => triggerSuwasiriSync(suwasiriBarcode)}
                  disabled={!suwasiriBarcode.trim() || isSyncing}
                  className="px-4 py-2 bg-primary hover:bg-sky-950 text-white text-xs font-bold rounded-md shadow-sm transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span>Sync Details</span>
                </button>
              </div>
            </div>

            {/* Quick Presets list */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Click a barcode preset to mock scan:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUWASIRI_REGISTRY.map(r => (
                  <button
                    key={r.barcode}
                    type="button"
                    onClick={() => {
                      setSuwasiriBarcode(r.barcode);
                      triggerSuwasiriSync(r.barcode);
                    }}
                    className="bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-[10px] font-mono px-2 py-0.5 rounded transition-all text-slate-700"
                  >
                    🔍 {r.barcode} ({r.patientName.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Sync Feedback UI */}
            {isSyncing && (
              <div className="bg-sky-50 text-primary p-2.5 rounded border border-sky-100 flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
                <span>Connecting with medical networks. Authenticating Suwasiri tokens...</span>
              </div>
            )}

            {syncStatus === 'success' && !isSyncing && (
              <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded border border-emerald-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>Integrated Network Verification Confirmed!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-700">
                  Demographics resolved. Document uploads will automatically link to <b>{connectedClinic}</b> and synchronization triggers have been configured for the patient's <b>Suwasiri Mobile App</b>.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Patient Name */}
            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Patient Full Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-[#c1c7cf] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. Bandara Jayasooriya"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>

            {/* Connected Clinic */}
            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1 text-slate-700">
                <Globe className="w-3.5 h-3.5 text-[#006497]" />
                Respective Clinic Link (Locks GP sync destination)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[#c1c7cf] rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[#006497] font-semibold"
                placeholder="e.g. Kandy General Medical Clinic"
                value={connectedClinic}
                onChange={(e) => setConnectedClinic(e.target.value)}
              />
            </div>

            {/* Age & Gender */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Patient Age *</label>
              <input
                type="number"
                required
                min="0"
                max="130"
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Gender *</label>
              <select
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Test Selection */}
            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Required Laboratory Test *</label>
              <select
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
              >
                {testTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Ward / Dept */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Ward or Department</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. Ward 4 (Cardiology) or OPD"
                value={wardOrDept}
                onChange={(e) => setWardOrDept(e.target.value)}
              />
            </div>

            {/* Order Priority */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Clinical Urgency</label>
              <select
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-slate-800"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="Routine" className="text-blue-600">🟢 Routine (Standard turnaround)</option>
                <option value="Urgent" className="text-orange-600">🟡 Urgent (Priority processing)</option>
                <option value="Critical" className="text-red-600">🔴 Critical (Immediate Alert Flag)</option>
              </select>
            </div>

            {/* Clinician Notes */}
            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Intake Diagnoses / Clinician Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Indicate key medical history, symptoms, or suspicion factors..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Simulation Toggle */}
          <div className="bg-sky-50 border border-sky-200 rounded p-4 flex gap-3 mt-4">
            <input 
              type="checkbox" 
              id="simulate" 
              checked={simulateAbnormal} 
              onChange={() => setSimulateAbnormal(!simulateAbnormal)} 
              className="mt-1 h-4.5 w-4.5 rounded text-primary border-outline focus:ring-primary"
            />
            <label htmlFor="simulate" className="cursor-pointer">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-secondary" /> Pre-simulate Pathological Values
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Automatically loads borderline/abnormal assays so you can test clinical alerts and run the <b>Gemini Assistant</b> instantly.
              </p>
            </label>
          </div>
        </form>

        {/* Buttons Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-outline-variant rounded-md text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-md hover:bg-sky-950 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4.5 h-4.5" /> Dispatch Order
          </button>
        </div>
      </div>
    </div>
  );
}

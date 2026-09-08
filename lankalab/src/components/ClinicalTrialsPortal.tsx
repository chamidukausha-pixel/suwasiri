import React, { useState, useEffect } from 'react';
import { 
  ClinicalTrialProtocol, 
  TrialWorkflowStep, 
  TrialFinancialInvoice 
} from '../types';
import { 
  initialTrialProtocols, 
  initialTrialWorkflowSteps, 
  initialTrialInvoices 
} from '../data/mockData';
import { 
  ShieldCheck, 
  EyeOff, 
  Eye, 
  AlertTriangle, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download, 
  Lock, 
  Unlock, 
  Barcode, 
  Activity, 
  Layers, 
  Beaker, 
  DollarSign, 
  RefreshCw, 
  Search, 
  Check, 
  Building2, 
  Play, 
  Pause
} from 'lucide-react';

export default function ClinicalTrialsPortal() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'labelPrinting' | 'blinding' | 'exclusions' | 'compliance' | 'finance'>('workflows');
  
  // Protocols State
  const [protocols, setProtocols] = useState<ClinicalTrialProtocol[]>(initialTrialProtocols);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('TRI-ONCO-2024-01');

  // Protocol-Guided Workflow State
  const [workflowSteps, setWorkflowSteps] = useState<TrialWorkflowStep[]>(initialTrialWorkflowSteps);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(3); // Step 4 (Centrifugation) is active
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [clottingTimerDone, setClottingTimerDone] = useState<boolean>(true);

  // On-Demand Label Printing State
  const [labelSubjectId, setLabelSubjectId] = useState<string>('SUBJ-2024-8840');
  const [labelVisitCode, setLabelVisitCode] = useState<string>('VISIT-03 (Day 14)');
  const [labelMatrix, setLabelMatrix] = useState<string>('EDTA Plasma (PK Aliquot)');
  const [labelAliquotNum, setLabelAliquotNum] = useState<string>('A1 / 4');
  const [labelPrintSuccess, setLabelPrintSuccess] = useState<boolean>(false);

  // Data Blinding Solutions State
  const [isBlindedView, setIsBlindedView] = useState<boolean>(true);
  const [dsmbPasscode, setDsmbPasscode] = useState<string>('');
  const [isDsmbAuthorized, setIsDsmbAuthorized] = useState<boolean>(false);
  const [unblindAuditLog, setUnblindAuditLog] = useState<string[]>([]);
  const [dsmbError, setDsmbError] = useState<boolean>(false);

  // Exclusion Flagging State
  const [testExclusionParam, setTestExclusionParam] = useState<string>('Platelets');
  const [testExclusionVal, setTestExclusionVal] = useState<string>('');
  const [simulatedExclusionAlert, setSimulatedExclusionAlert] = useState<{ isViolation: boolean; message: string } | null>(null);

  // Financial Management State
  const [invoices, setInvoices] = useState<TrialFinancialInvoice[]>(initialTrialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<TrialFinancialInvoice>(initialTrialInvoices[0]);
  const [invoiceDownloadSuccess, setInvoiceDownloadSuccess] = useState<boolean>(false);

  const activeProtocol = protocols.find(p => p.protocolId === selectedProtocolId) || protocols[0];

  // Timer logic for centrifuge or clotting
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleStartTimer = (mins: number) => {
    setTimerSeconds(mins * 60);
    setIsTimerRunning(true);
  };

  const handlePrintTrialLabel = () => {
    setLabelPrintSuccess(true);
    setTimeout(() => setLabelPrintSuccess(false), 4000);
  };

  const handleDsmbAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (dsmbPasscode === 'DSMB99' || dsmbPasscode.length >= 5) {
      setIsDsmbAuthorized(true);
      setIsBlindedView(false);
      setDsmbError(false);
      setUnblindAuditLog(prev => [
        `[${new Date().toLocaleTimeString()}] DSMB Key Verified by Safety Chair (Dr. C. Jayasuriya) for Protocol ${selectedProtocolId}`,
        ...prev
      ]);
    } else {
      setDsmbError(true);
    }
  };

  const handleEvaluateExclusion = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(testExclusionVal);
    if (isNaN(val)) {
      setSimulatedExclusionAlert({ isViolation: false, message: 'Please input a valid diagnostic numerical value.' });
      return;
    }

    if (testExclusionParam === 'Platelets') {
      if (val < 100) {
        setSimulatedExclusionAlert({
          isViolation: true,
          message: `PROTOCOL EXCLUSION FLAGGED: Platelet count of ${val} x10^9/L violates protocol safety criteria (< 100 x10^9/L). Sample flagged; notify Principal Investigator and Medical Monitor immediately.`
        });
      } else {
        setSimulatedExclusionAlert({
          isViolation: false,
          message: `CRITERIA SATISFIED: Platelet count ${val} x10^9/L complies with trial inclusion thresholds (≥ 100 x10^9/L).`
        });
      }
    } else if (testExclusionParam === 'Creatinine') {
      if (val > 156) {
        setSimulatedExclusionAlert({
          isViolation: true,
          message: `PROTOCOL EXCLUSION FLAGGED: Serum Creatinine of ${val} µmol/L exceeds 1.5x Upper Limit of Normal (> 156 µmol/L). Renal exclusion triggered.`
        });
      } else {
        setSimulatedExclusionAlert({
          isViolation: false,
          message: `CRITERIA SATISFIED: Serum Creatinine ${val} µmol/L complies with normal baseline protocol limits.`
        });
      }
    } else if (testExclusionParam === 'Troponin') {
      if (val > 0.04) {
        setSimulatedExclusionAlert({
          isViolation: true,
          message: `CRITICAL CARDIOVASCULAR EXCLUSION: Troponin I of ${val} ng/mL indicates myocardial injury (> 0.04 ng/mL cutoff). Subject study arm halted pending safety review.`
        });
      } else {
        setSimulatedExclusionAlert({
          isViolation: false,
          message: `CRITERIA SATISFIED: Troponin I ${val} ng/mL is within non-elevated safety limits.`
        });
      }
    }
  };

  const handleDownloadInvoice = () => {
    setInvoiceDownloadSuccess(true);
    setTimeout(() => setInvoiceDownloadSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Medway Clinical Trials Portal */}
      <div className="bg-white border border-[#c1c7cf] rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-purple-100 text-purple-900 uppercase tracking-wider">
              Medway Clinical Trials Digital Workflow Backbone
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              ICH E6(R2) &amp; FDA 21 CFR Part 11 Validated
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
            Commercial Clinical Trials Operations Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Digital workflow management for pharmaceutical, biotechnology, and academic research organizations. Replaces manual paper test kits with automated protocol-guided collection, on-demand cryo-labeling, scientific data blinding, automated exclusion triggers, and volume-linked invoicing.
          </p>
        </div>

        {/* Quick Protocol Selector & Metrics */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-purple-50/60 border border-purple-200 p-3 rounded-xl shrink-0">
          <div>
            <label className="text-[10px] font-bold text-purple-900 uppercase block mb-1">Active Study Protocol</label>
            <select
              value={selectedProtocolId}
              onChange={(e) => setSelectedProtocolId(e.target.value)}
              className="bg-white border border-purple-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              {protocols.map(p => (
                <option key={p.protocolId} value={p.protocolId}>
                  {p.protocolId} ({p.sponsor.split('/')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          <div className="border-l border-purple-200 pl-3 space-y-0.5 text-xs">
            <span className="text-[10px] text-purple-700 font-bold uppercase block">Enrolled Subjects</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              {activeProtocol.activeSubjects} Patients
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for the 6 Medway Clinical Trial Pillars */}
      <div className="flex flex-wrap gap-2 border-b border-[#c1c7cf] pb-2">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'workflows'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Protocol-Guided Workflows</span>
        </button>

        <button
          onClick={() => setActiveTab('labelPrinting')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'labelPrinting'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>2. On-Demand Label Printing</span>
        </button>

        <button
          onClick={() => setActiveTab('blinding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'blinding'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <EyeOff className="w-4 h-4 text-emerald-400" />
          <span>3. Data Blinding Solutions</span>
        </button>

        <button
          onClick={() => setActiveTab('exclusions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'exclusions'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>4. Exclusion Flagging</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'compliance'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>5. Auditing &amp; Compliance</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'finance'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>6. Simplified Financial Management</span>
        </button>
      </div>

      {/* ===================== TAB 1: PROTOCOL-GUIDED WORKFLOWS ===================== */}
      {activeTab === 'workflows' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Digitized Step-by-Step Specimen Collection Lifecycle
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Eliminates the risk, cost, and shelf-life expiration of manual pre-assembled physical test kits by orchestrating live on-screen collection protocols.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Current Lifecycle Phase:</span>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded font-bold text-xs">
                  Step {currentStepIdx + 1} of {workflowSteps.length}
                </span>
              </div>
            </div>

            {/* Stepper Progression Track */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {workflowSteps.map((step, idx) => {
                const isCurrent = idx === currentStepIdx;
                const isPassed = idx < currentStepIdx;

                return (
                  <div
                    key={step.stepNumber}
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-purple-50 border-purple-600 shadow-sm ring-1 ring-purple-600'
                        : isPassed
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Step 0{step.stepNumber}</span>
                      {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{step.title}</h4>
                  </div>
                );
              })}
            </div>

            {/* Active Step Details Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center">
                    {workflowSteps[currentStepIdx].stepNumber}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{workflowSteps[currentStepIdx].title}</h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Protocol: {activeProtocol.protocolId} • {activeProtocol.trialTitle}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                  Required Volume: {workflowSteps[currentStepIdx].requiredVolume}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Clinical Action Directive:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {workflowSteps[currentStepIdx].instruction}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Consumable &amp; Hardware Profile:</span>
                    <p className="text-slate-700 font-mono text-[11px]">
                      {workflowSteps[currentStepIdx].tubeDetails}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Step specific interactive instruments */}
                  {currentStepIdx === 2 && (
                    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Clotting Incubation Countdown (30 Mins)</span>
                      <div className="text-3xl font-extrabold font-mono text-purple-800">
                        {timerSeconds > 0 ? (
                          `${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`
                        ) : (
                          '00:00 (Clotted)'
                        )}
                      </div>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleStartTimer(30)}
                          className="px-3 py-1.5 bg-purple-700 text-white rounded text-xs font-bold hover:bg-purple-800"
                        >
                          Start 30m Timer
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStepIdx === 3 && (
                    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Centrifugation Parameters Log</span>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Speed</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">2,000 RCF</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Duration</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">15 Mins</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Temperature</span>
                          <span className="text-xs font-bold text-emerald-700 font-mono">4°C ± 1°C</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">
                        Calibrated digital sensor attached to Thermo Sorvall X4R centrifuge confirmed within tolerance.
                      </p>
                    </div>
                  )}

                  {currentStepIdx === 4 && (
                    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Cryo-Storage Biobank Allocation</span>
                      <div className="text-xs space-y-1 font-mono text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <p>Freezer ID: <b>ULT-FREEZER-04 (-80°C)</b></p>
                        <p>Rack Assignment: <b>RACK-B14</b></p>
                        <p>Aliquot Positions: <b>Box 3, Pos 01-04</b></p>
                      </div>
                    </div>
                  )}

                  {currentStepIdx <= 1 && (
                    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Subject Accession Details</span>
                      <div className="text-xs space-y-1 text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <p>Subject Code: <b>SUBJ-LK-2024-081</b></p>
                        <p>Cohort Arm: <b>Arm A (Adjuvant Immunotherapy)</b></p>
                        <p>ICF Verification: <b>Signed 14 Aug 2026 (e-Sign Valid)</b></p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progression buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  disabled={currentStepIdx === 0}
                  onClick={() => setCurrentStepIdx(idx => Math.max(0, idx - 1))}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  ← Previous Step
                </button>

                <button
                  onClick={() => {
                    if (currentStepIdx < workflowSteps.length - 1) {
                      setCurrentStepIdx(idx => idx + 1);
                    } else {
                      alert('Specimen collection lifecycle completed! Accession verified and uploaded to trial database.');
                    }
                  }}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>{currentStepIdx === workflowSteps.length - 1 ? 'Complete Collection' : 'Verify & Proceed to Next Step →'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: ON-DEMAND LABEL PRINTING ===================== */}
      {activeTab === 'labelPrinting' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Form: Label Generator (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-purple-600" />
                    Point-of-Collection Specimen Label Generator
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Generates cryo-adhesive thermal labels directly at collection to eliminate transcription &amp; matching errors
                  </p>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded font-mono">
                  Zebra Cryo-Standard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject Screening ID</label>
                  <input
                    type="text"
                    value={labelSubjectId}
                    onChange={(e) => setLabelSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Protocol Visit Code</label>
                  <input
                    type="text"
                    value={labelVisitCode}
                    onChange={(e) => setLabelVisitCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Specimen Matrix</label>
                  <select
                    value={labelMatrix}
                    onChange={(e) => setLabelMatrix(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="EDTA Plasma (PK Aliquot)">EDTA Plasma (PK Aliquot)</option>
                    <option value="Serum Clot Activator">Serum Clot Activator</option>
                    <option value="Citrate Plasma (Coag)">Citrate Plasma (Coag)</option>
                    <option value="Buffy Coat (DNA Banking)">Buffy Coat (DNA Banking)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Aliquot Sequence</label>
                  <input
                    type="text"
                    value={labelAliquotNum}
                    onChange={(e) => setLabelAliquotNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handlePrintTrialLabel}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Cryo-Adhesive Label (Thermal 2D)</span>
                </button>
              </div>

              {labelPrintSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Label dispatched to Point-of-Collection Zebra GK420t cryo-thermal printer.</span>
                </div>
              )}
            </div>

            {/* Right: Live Label Preview (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Cryo-Vial Label Preview (50mm × 20mm)
              </h4>

              <div className="bg-slate-100 p-6 rounded-xl flex items-center justify-center">
                <div className="w-72 bg-white border-2 border-dashed border-slate-400 p-3 rounded shadow-sm font-mono text-[10px] space-y-1.5 text-slate-900">
                  <div className="flex justify-between border-b border-slate-300 pb-1">
                    <span className="font-extrabold text-[9px] text-purple-900">{selectedProtocolId}</span>
                    <span className="font-bold text-[8px] bg-slate-200 px-1 rounded">CRYO -80°C</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-xs">{labelSubjectId}</p>
                    <p className="text-[9px] text-slate-600 font-sans">{labelVisitCode}</p>
                  </div>
                  <div className="flex items-center justify-between py-1 bg-slate-50 border border-slate-200 px-2 rounded">
                    <div className="space-y-0.5 text-[9px]">
                      <span className="font-bold block">{labelMatrix}</span>
                      <span className="text-slate-500">SEQ: {labelAliquotNum}</span>
                    </div>
                    <Barcode className="w-12 h-6 text-slate-800" />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 pt-0.5">
                    <span>CENTRAL LAB: LANKALAB</span>
                    <span>EXP: 2029-12</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                <b>Cryo-Adhesive Rating:</b> Tested to withstand vapor-phase liquid nitrogen (-196°C) and -80°C ultra-low mechanical freezers without peeling.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================== TAB 3: DATA BLINDING SOLUTIONS ===================== */}
      {activeTab === 'blinding' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-purple-600" />
                  Trial Protocol Data Blinding Solutions
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Protects the scientific integrity of blind or double-blind studies by masking experimental biomarkers from clinical trial sites while granting secure audit access to Data Safety Monitoring Boards (DSMB).
                </p>
              </div>

              {/* Blinding Mode Switch */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setIsBlindedView(true)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                    isBlindedView ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Investigator Blinded View</span>
                </button>

                <button
                  onClick={() => {
                    if (isDsmbAuthorized) setIsBlindedView(false);
                    else alert('Please enter authorized DSMB Key below to unblind experimental arms.');
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                    !isBlindedView ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>DSMB Unblinded View</span>
                </button>
              </div>
            </div>

            {/* Simulated Clinical Trial Cohort Table with Masked / Unmasked Parameters */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Subject ID</th>
                    <th className="py-2.5 px-3">Protocol Arm</th>
                    <th className="py-2.5 px-3">Safety Baseline (FBC)</th>
                    <th className="py-2.5 px-3">Renal Safety (Creatinine)</th>
                    <th className="py-2.5 px-3">Investigational Biomarker (PK/PD)</th>
                    <th className="py-2.5 px-3 text-right">Blinding Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">SUBJ-001</td>
                    <td className="py-3 px-3 font-semibold">
                      {isBlindedView ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">
                          [ARM MASKED]
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          Active Arm A (300mg)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">Hb 13.8 g/dL (Normal)</td>
                    <td className="py-3 px-3 font-mono">78 µmol/L (Clear)</td>
                    <td className="py-3 px-3 font-mono">
                      {isBlindedView ? (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          ██████ BLINDED
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900">42.5 ng/mL (Peak)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded font-bold text-[10px]">
                        Protocol Blind
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">SUBJ-002</td>
                    <td className="py-3 px-3 font-semibold">
                      {isBlindedView ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">
                          [ARM MASKED]
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                          Placebo Arm B (Saline)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">Hb 14.1 g/dL (Normal)</td>
                    <td className="py-3 px-3 font-mono">82 µmol/L (Clear)</td>
                    <td className="py-3 px-3 font-mono">
                      {isBlindedView ? (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          ██████ BLINDED
                        </span>
                      ) : (
                        <span className="font-bold text-slate-500">&lt; 0.05 ng/mL (BQL)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded font-bold text-[10px]">
                        Protocol Blind
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DSMB Unblind Authorization Box */}
            {!isDsmbAuthorized ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Data Safety Monitoring Board (DSMB) Unblind Key Verification
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Unblinding is restricted to authorized safety auditors investigating serious adverse events (SAEs).
                </p>

                <form onSubmit={handleDsmbAuthorize} className="flex flex-col sm:flex-row items-center gap-2 max-w-md">
                  <input
                    type="password"
                    placeholder="Enter DSMB Token (demo: DSMB99)"
                    value={dsmbPasscode}
                    onChange={(e) => setDsmbPasscode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                  >
                    Authenticate DSMB
                  </button>
                </form>

                {dsmbError && (
                  <p className="text-xs text-rose-600 font-bold">
                    Authentication failed. Please use demo DSMB Key: <b>DSMB99</b>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-amber-700" />
                    <span className="font-bold">DSMB Unblinded Access Mode Active for Safety Review</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsDsmbAuthorized(false);
                      setIsBlindedView(true);
                    }}
                    className="text-amber-800 underline hover:text-amber-950 font-semibold"
                  >
                    Re-enforce Blinded Shield
                  </button>
                </div>
                {unblindAuditLog.length > 0 && (
                  <p className="text-[11px] font-mono text-amber-800">
                    Audit Entry: {unblindAuditLog[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: EXCLUSION FLAGGING ===================== */}
      {activeTab === 'exclusions' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Automated Protocol Exclusion Flagging Engine
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Automatically flags patient samples that violate trial criteria to halt unauthorized dose administration and trigger safety committee notifications.
              </p>
            </div>

            {/* Protocol Defined Exclusion Limits */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                Active Protocol Exclusion Boundaries ({selectedProtocolId}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {activeProtocol.exclusionCriteria.map((crit, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border border-rose-200 text-rose-900 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Exclusion Evaluator */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Interactive Protocol Exclusion Evaluator Simulator
              </h4>

              <form onSubmit={handleEvaluateExclusion} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Safety Parameter</label>
                  <select
                    value={testExclusionParam}
                    onChange={(e) => setTestExclusionParam(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="Platelets">Platelet Count (&lt; 100 x10^9/L cutoff)</option>
                    <option value="Creatinine">Serum Creatinine (&gt; 156 µmol/L cutoff)</option>
                    <option value="Troponin">Cardiac Troponin I (&gt; 0.04 ng/mL cutoff)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Measured Value</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 85, 172, 0.08"
                    value={testExclusionVal}
                    onChange={(e) => setTestExclusionVal(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold transition-all shadow-xs"
                  >
                    Evaluate Protocol Boundary
                  </button>
                </div>
              </form>

              {simulatedExclusionAlert && (
                <div className={`p-3 rounded-lg border text-xs font-semibold ${
                  simulatedExclusionAlert.isViolation
                    ? 'bg-rose-100 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  {simulatedExclusionAlert.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: AUDITING & COMPLIANCE ===================== */}
      {activeTab === 'compliance' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Regulatory Auditing &amp; HL7 Protocol Alignment
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Comprehensive digital auditing trails, full HL7 data alignment, and secure electronic data transmissions tailored to strict regulatory mandates (FDA 21 CFR Part 11, ICH GCP E6 R2).
                </p>
              </div>

              <button
                onClick={() => alert('Certificate of GCP Conformity exported with SHA-256 digital signature.')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export GxP Audit Trail (PDF)</span>
              </button>
            </div>

            {/* Compliance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  FDA 21 CFR Part 11 E-Signatures
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Cryptographically sealed pathologist and technician sign-offs with tamper-evident audit logging.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ICH GCP E6(R2) Data Integrity
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ALCOA+ standard compliant (Attributable, Legible, Contemporaneous, Original, Accurate).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  HL7 v2.4 / FHIR Protocol Export
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Structured ORU_R01 messages with specialized clinical trial PRT and OBX protocol segments.
                </p>
              </div>
            </div>

            {/* Raw HL7 Message Viewer with Protocol Segment */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-[10px] uppercase font-bold text-purple-400">HL7 ORU_R01 Protocol Transmission Packet</span>
                <span>SHA-256: e3b0c44298fc1c149afbf4c8996fb924</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre leading-relaxed text-slate-300">
{`MSH|^~\\&|LANKALAB_LIS|CENTRAL_COLOMBO|PHARMA_EDC|ASTRAZENECA|20260905144500||ORU^R01|MSG-CT-901|P|2.4
PID|1||SUBJ-2024-8840^^^TRIAL_ONCO_01||PERERA^ANURA||19790512|M
PV1|1|O|||||||ONC_INVESTIGATOR^DR_JAYASURIYA
ORC|NW|ORD-CT-881|||||||20260905084500
OBR|1|ORD-CT-881||TRI-PK01^Pharmacokinetic Assay^LN|||20260905085000|||||||||||||||20260905144500|||F
OBX|1|NM|PK-CMAX^Peak Plasma Concentration||42.5|ng/mL|0.0-100.0|N|||F
PRT|1|CT^Clinical Trial Protocol|TRI-ONCO-2024-01^AstraZeneca Adjuvant Arm A`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: SIMPLIFIED FINANCIAL MANAGEMENT ===================== */}
      {activeTab === 'finance' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Simplified Financial Management &amp; Pathology Volume Invoicing
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Automated and streamlined invoicing capabilities attached directly to the processed pathology volumes, visit milestones, and biobank storage.
                </p>
              </div>

              <button
                onClick={handleDownloadInvoice}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sponsor Invoicing Packet</span>
              </button>
            </div>

            {invoiceDownloadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Itemized invoice #{selectedInvoice.invoiceId} compiled and dispatched to Pharma Accounting Ledger.</span>
              </div>
            )}

            {/* Invoices List and Itemized Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Invoices List (4 cols) */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Study Billing Accounts
                </span>
                {invoices.map(inv => (
                  <div
                    key={inv.invoiceId}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedInvoice.invoiceId === inv.invoiceId
                        ? 'bg-purple-50/70 border-purple-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono font-bold text-purple-900">{inv.invoiceId}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        inv.status === 'AUDITED_AND_PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{inv.sponsor.split('/')[0].trim()}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{inv.billingPeriod}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Total Billed:</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        LKR {inv.totalLkr.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Itemized Invoice Detail (8 cols) */}
              <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Selected Statement</span>
                    <h4 className="text-base font-bold text-slate-900 font-mono">{selectedInvoice.invoiceId}</h4>
                    <p className="text-xs text-slate-600">
                      Sponsor: <b>{selectedInvoice.sponsor}</b> • Protocol: <b>{selectedInvoice.protocolId}</b>
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-500 block">Due Date</span>
                    <span className="font-bold text-slate-800">{selectedInvoice.dueDate}</span>
                  </div>
                </div>

                {/* Table of volume-linked services */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Service Code &amp; Description</th>
                        <th className="py-2.5 px-3 text-center">Volume (Units)</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate (LKR)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{item.description}</span>
                            <span className="text-[10px] font-mono text-slate-400">{item.serviceCode}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {item.unitsProcessed}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {item.unitPriceLkr.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {item.subtotalLkr.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total and settlement summary */}
                <div className="pt-2 flex justify-between items-center text-xs">
                  <div className="text-[11px] text-slate-500">
                    Payment Gateway: Electronic Bank Transfer (LankaPay Commercial Settlement)
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Volume Invoice Amount</span>
                    <span className="text-lg font-extrabold text-emerald-800 font-mono">
                      LKR {selectedInvoice.totalLkr.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

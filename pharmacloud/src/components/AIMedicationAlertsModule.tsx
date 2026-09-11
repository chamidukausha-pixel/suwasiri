import React, { useState } from 'react';
import { AIMedicationAlert, GPCarePrescription, SuwasiriPatientProfile } from '../types';
import { Sparkles, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, Send, ArrowRight, BookOpen, Stethoscope, FileText } from 'lucide-react';

interface AIMedicationAlertsModuleProps {
  alerts: AIMedicationAlert[];
  prescriptions: GPCarePrescription[];
  suwasiriProfiles: SuwasiriPatientProfile[];
  onResolveAlert: (alertId: string) => void;
}

export const AIMedicationAlertsModule: React.FC<AIMedicationAlertsModuleProps> = ({
  alerts,
  prescriptions,
  suwasiriProfiles,
  onResolveAlert,
}) => {
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>(prescriptions[0]?.id || '');
  const [customMedList, setCustomMedList] = useState<string>('Metformin 500mg, Losartan 50mg, Omeprazole 20mg');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  const activePrescription = prescriptions.find((p) => p.id === selectedPrescriptionId);
  const matchingPatientProfile = suwasiriProfiles.find((s) => s.nic === activePrescription?.patientNIC);

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        patientNIC: activePrescription?.patientNIC || '198574102938V',
        prescriptionMeds: activePrescription
          ? activePrescription.medications.map((m) => ({ name: m.brandName, dosage: m.dosage }))
          : [{ name: customMedList, dosage: 'Daily' }],
        patientAllergies: matchingPatientProfile?.knownAllergies || ['Sulfa Drugs'],
        patientConditions: matchingPatientProfile?.chronicDiseases || ['Type 2 Diabetes', 'Hypertension'],
        customQuery: customQuery || undefined,
      };

      const response = await fetch('/api/ai/medication-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setAiAnalysisResult(data);
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 rounded-2xl p-6 text-white border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini 3.6 Flash Clinical Engine
            </div>
            <h2 className="text-2xl font-extrabold text-white">AI-Driven Medication Safety & Interaction Analyzer</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Automated cross-checking of prescribed drugs against patient allergies, chronic conditions in Suwasiri Health Vault, and NMRA drug safety monographs.
            </p>
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing via Gemini AI...' : 'Run Live Clinical Scan'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Scanner Controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-amber-600" />
            Prescription Safety Configurator
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select Active GP Care Prescription</label>
              <select
                value={selectedPrescriptionId}
                onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                {prescriptions.map((rx) => (
                  <option key={rx.id} value={rx.id}>
                    {rx.id} - {rx.patientName} ({rx.patientNIC})
                  </option>
                ))}
              </select>
            </div>

            {activePrescription && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="text-slate-900 font-bold">{activePrescription.patientName}</div>
                <div className="text-slate-600">Diagnosis: {activePrescription.diagnosis}</div>
                <div className="text-teal-700 font-medium">
                  Meds: {activePrescription.medications.map((m) => `${m.brandName} (${m.dosage})`).join(', ')}
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Additional Pharmacist Query / Notes</label>
              <textarea
                rows={3}
                placeholder="e.g. Patient asks if taking grapefruit juice with Losartan is safe, or if Omeprazole alters absorption..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <button
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isAnalyzing ? 'Processing AI Models...' : 'Execute Gemini Analysis'}
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Live AI Analysis Output & Active System Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Output Card */}
          {aiAnalysisResult ? (
            <div className="bg-white rounded-xl border border-amber-200 shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      aiAnalysisResult.overallSafetyStatus === 'SAFE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : aiAnalysisResult.overallSafetyStatus === 'HIGH_RISK'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    STATUS: {aiAnalysisResult.overallSafetyStatus}
                  </span>
                  <span className="text-slate-500 text-xs">Clinical Evaluation Complete</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Gemini 3.6 Flash</span>
              </div>

              <p className="text-slate-800 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border">
                <strong>AI Summary:</strong> {aiAnalysisResult.summary}
              </p>

              {/* Detected Alerts */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Identified Interactions & Risk Warnings:</h4>
                {aiAnalysisResult.alerts?.map((alt: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        {alt.type}: {alt.medicationPair}
                      </span>
                      <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-slate-800"><strong>Description:</strong> {alt.description}</p>
                    <p className="text-slate-800"><strong>Clinical Impact:</strong> {alt.clinicalImpact}</p>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-teal-900 font-medium">
                      <strong>AI Pharmacist Recommendation:</strong> {alt.aiRecommendation}
                    </div>
                  </div>
                ))}
              </div>

              {/* Refill Insights */}
              {aiAnalysisResult.refillInsights && (
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1 text-xs">
                  <h4 className="font-bold text-amber-400">AI Refill & Adherence Insight:</h4>
                  <p className="text-slate-300">{aiAnalysisResult.refillInsights.prediction}</p>
                  <p className="text-teal-300 font-medium">Advice: {aiAnalysisResult.refillInsights.patientAdvice}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs space-y-2">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-semibold text-slate-700">Ready to Analyze Prescription</p>
              <p>Click "Run Live Clinical Scan" above to initiate Gemini AI safety audit across drug pairings, allergies, and Suwasiri health profiles.</p>
            </div>
          )}

          {/* Existing Flagged Alerts in System */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Active Pharmacy Risk Ledger ({alerts.filter((a) => !a.resolved).length})</span>
              <span className="text-xs font-normal text-slate-500">Live Suwasiri Real-time Alerts</span>
            </h3>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition ${
                    alert.resolved
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-amber-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{alert.medicationPair}</span>
                      <span className="text-slate-500 text-[11px]">({alert.patientName})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-slate-700">{alert.description}</p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                    <strong className="text-teal-800">AI Action Plan:</strong> {alert.aiRecommendation}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-400 text-[10px]">Logged: {alert.timestamp}</span>
                    {!alert.resolved ? (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        Acknowledge & Resolve Flag
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, FormEvent } from 'react';
import { 
  LabOrder, 
  DiagnosticReportFormat, 
  SupplementaryTestRequest, 
  QuickShareLog, 
  MQLinkRecord 
} from '../types';
import { 
  initialSupplementaryRequests, 
  initialQuickShareLogs, 
  initialCumulativeHistories,
  initialMQLinkRecords 
} from '../data/mockData';
import { 
  Search, 
  Share2, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileText, 
  RefreshCw, 
  Send, 
  ExternalLink, 
  Copy, 
  Download, 
  PlusCircle, 
  History, 
  Laptop, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface ResultDeliveryManagerProps {
  orders: LabOrder[];
  onUpdateOrderStatus?: (orderId: string, newStatus: LabOrder['status']) => void;
}

export default function ResultDeliveryManager({ orders, onUpdateOrderStatus }: ResultDeliveryManagerProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'PROCESSING' | 'COMPLETED'>('ALL');
  const [reportFormat, setReportFormat] = useState<DiagnosticReportFormat>('STANDARD');
  
  // Supplementary tests state
  const [supplementaryRequests, setSupplementaryRequests] = useState<SupplementaryTestRequest[]>(initialSupplementaryRequests);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [newAddOnTestName, setNewAddOnTestName] = useState('Serum Ferritin & Iron Studies');
  const [newAddOnReason, setNewAddOnReason] = useState('Patient exhibits microcytic red cell indices. Clarify iron stores from existing stored EDTA/Serum aliquot.');
  const [addOnSuccessMsg, setAddOnSuccessMsg] = useState<string | null>(null);

  // Quick Share MDT state
  const [quickShareLogs, setQuickShareLogs] = useState<QuickShareLog[]>(initialQuickShareLogs);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareRecipient, setShareRecipient] = useState('Dr. Nalin Perera (Cath Lab Interventional Cardiologist)');
  const [shareRole, setShareRole] = useState('Interventional Cardiologist');
  const [shareMethod, setShareMethod] = useState<'DIRECT_PRACTITIONER' | 'MDT_PANEL' | 'ENCRYPTED_LINK'>('MDT_PANEL');
  const [shareExpiry, setShareExpiry] = useState<number>(24);
  const [shareNote, setShareNote] = useState('Urgent MDT review requested regarding acute Troponin-I kinetic surge.');
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  // Confidential unlock state
  const [isConfidentialUnlocked, setIsConfidentialUnlocked] = useState(false);
  const [confidentialPasscode, setConfidentialPasscode] = useState('');
  const [confidentialError, setConfidentialError] = useState(false);

  // MQLink EDI state
  const [mqRecords, setMqRecords] = useState<MQLinkRecord[]>(initialMQLinkRecords);
  const [isPollingMQ, setIsPollingMQ] = useState(false);
  const [mqSuccessAlert, setMqSuccessAlert] = useState<string | null>(null);
  const [selectedPms, setSelectedPms] = useState<string>('ALL');

  // Selected Order
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  // Filtering
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.specimenId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.testType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.connectedClinic && o.connectedClinic.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Cumulative data for selected patient
  const cumulativeData = selectedOrder ? initialCumulativeHistories[selectedOrder.patientName] : undefined;

  // Active supplementary requests for selected order
  const orderAddOns = supplementaryRequests.filter(s => s.orderId === selectedOrder?.id);

  // Submit supplementary test
  const handleAddSupplementaryTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const newReq: SupplementaryTestRequest = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      orderId: selectedOrder.id,
      testName: newAddOnTestName,
      requestedBy: 'Dr. Sunil Wickramasinghe (Portal Session)',
      clinicalReason: newAddOnReason,
      specimenId: selectedOrder.specimenId,
      tubeColor: 'Bio-Archive Specimen Rack #4',
      status: 'LAB_CONFIRMED',
      requestedAt: 'Just now'
    };

    setSupplementaryRequests(prev => [newReq, ...prev]);
    setIsAddOnModalOpen(false);
    setAddOnSuccessMsg(`Supplementary test "${newAddOnTestName}" authorized directly on existing specimen #${selectedOrder.specimenId}. Laboratory accession updated without requiring a new referral.`);
    setTimeout(() => setAddOnSuccessMsg(null), 6000);
  };

  // Submit Quick Share
  const handleQuickShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const newShare: QuickShareLog = {
      id: `QSH-${Date.now().toString().slice(-3)}`,
      orderId: selectedOrder.id,
      patientName: selectedOrder.patientName,
      sharedWith: shareRecipient,
      recipientRole: shareRole,
      shareMethod: shareMethod,
      expiryHours: shareExpiry,
      sharedAt: 'Just now',
      passcodeProtected: true,
      notes: shareNote,
      accessCount: 0
    };

    setQuickShareLogs(prev => [newShare, ...prev]);
    setIsShareModalOpen(false);
    setShareSuccessMsg(`Diagnostic package securely shared with ${shareRecipient}. Encrypted token active for ${shareExpiry} hours with audit tracking.`);
    setTimeout(() => setShareSuccessMsg(null), 5000);
  };

  // Handle Confidential Unlock
  const handleUnlockConfidential = (e: React.FormEvent) => {
    e.preventDefault();
    if (confidentialPasscode === '1234' || confidentialPasscode.length >= 4) {
      setIsConfidentialUnlocked(true);
      setConfidentialError(false);
    } else {
      setConfidentialError(true);
    }
  };

  // Trigger MQLink Poll
  const handleTriggerMQLinkPoll = () => {
    setIsPollingMQ(true);
    setTimeout(() => {
      setIsPollingMQ(false);
      setMqSuccessAlert('MQLink Daemon poll successful: 4 HL7 v2.4 packages confirmed and downloaded to practice desktop PMS.');
      setTimeout(() => setMqSuccessAlert(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner - Medway Real-Time Online Portal */}
      <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 text-blue-900 uppercase tracking-wider">
              Medway Secure Clinician Portal
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-Time Online Access Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
            Electronic Result Delivery &amp; Management
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            One central portal to access, review, and handle all patient diagnostic data in real-time. Eliminates hardcopy or faxed delays with flexible test ordering, MDT quick sharing, cumulative reporting, and automated MQLink EDI integration into desktop PMS.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddOnModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-primary text-primary hover:bg-primary/5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-primary" />
            <span>Add Supplementary Test</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 bg-primary hover:bg-[#0c4a6e] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>MDT Quick Share</span>
          </button>

          <button
            onClick={handleTriggerMQLinkPoll}
            disabled={isPollingMQ}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPollingMQ ? 'animate-spin' : ''}`} />
            <span>{isPollingMQ ? 'Syncing...' : 'Poll MQLink EDI'}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {addOnSuccessMsg && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{addOnSuccessMsg}</span>
        </div>
      )}

      {shareSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shareSuccessMsg}</span>
        </div>
      )}

      {mqSuccessAlert && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Laptop className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{mqSuccessAlert}</span>
        </div>
      )}

      {/* Main Grid: Left Column (Worklist & Queue) + Right Column (Medway Result Delivery Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Real-Time Patient Worklist (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Live Patient Results ({filteredOrders.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                Live Feed
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, specimen ID, clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {(['ALL', 'CRITICAL', 'PROCESSING', 'COMPLETED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    statusFilter === st 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredOrders.map(order => {
                const isSelected = order.id === selectedOrderId;
                const hasAddOns = supplementaryRequests.some(s => s.orderId === order.id);

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsConfidentialUnlocked(false);
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-primary shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{order.patientName}</span>
                          <span className="text-[10px] text-slate-500">({order.age}y {order.gender[0]})</span>
                        </div>
                        <p className="text-[11px] text-primary font-medium">{order.testType}</p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        order.status === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : order.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="font-mono">#{order.specimenId}</span>
                      <div className="flex items-center gap-1.5">
                        {hasAddOns && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold text-[9px]">
                            +Add-On
                          </span>
                        )}
                        <span>{order.orderTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No diagnostic records match current search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Connected Practice Management Software (PMS) Status Widget */}
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-purple-600" />
                Connected Practice Software
              </h4>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                MQLink v4.2 Active
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Diagnostic data automatically translates into HL7 and PIT formats for synchronized clinic electronic charts:
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {['Best Practice (BP)', 'MedicalDirector', 'EMIS Health', 'SystmOne', 'Genie Solutions', 'Medtech 32'].map(pms => (
                <div key={pms} className="bg-slate-50 border border-slate-200 p-1.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{pms}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Diagnostic Portal & Result Delivery (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {selectedOrder ? (
            <div className="bg-white border border-[#c1c7cf] rounded-xl shadow-sm overflow-hidden">
              
              {/* Header: Patient Banner & Format Selector */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 font-sans">
                        {selectedOrder.patientName}
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        • {selectedOrder.age} yrs • {selectedOrder.gender}
                      </span>
                      <span className="text-xs bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded font-semibold">
                        Specimen: #{selectedOrder.specimenId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ordering Clinic: <b>{selectedOrder.connectedClinic || 'Central Medical Center'}</b> • Dispatched: {selectedOrder.orderTime}
                    </p>
                  </div>

                  {/* Flexible Report Format Selector */}
                  <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-lg shrink-0 text-xs">
                    {(['STANDARD', 'PRIVATE', 'CONFIDENTIAL', 'CUMULATIVE', 'INTERIM'] as DiagnosticReportFormat[]).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setReportFormat(fmt)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                          reportFormat === fmt
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Format Explanatory Banner */}
                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      {reportFormat === 'STANDARD' && 'Standard authorized pathology report with full diagnostic indices.'}
                      {reportFormat === 'PRIVATE' && 'Private Reporting: View restricted exclusively to the credentialed ordering physician.'}
                      {reportFormat === 'CONFIDENTIAL' && 'Confidential Mode: Sensitive biomarker data masked. Requires session authorization.'}
                      {reportFormat === 'CUMULATIVE' && 'Cumulative Reporting: Longitudinal delta trends across multiple patient visits.'}
                      {reportFormat === 'INTERIM' && 'Interim Reporting: Real-time preliminary release while confirmation cultures/assays run.'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Audit Token: SHA-256 Validated
                  </span>
                </div>
              </div>

              {/* Body Content based on selected Report Format */}
              <div className="p-5 space-y-6">

                {/* Format 1: STANDARD REPORT */}
                {reportFormat === 'STANDARD' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Assay Diagnostic Values ({selectedOrder.testType})
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Methodology: Chemiluminescence &amp; Flow Cytometry
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Parameter</th>
                            <th className="py-2.5 px-3">Measured Result</th>
                            <th className="py-2.5 px-3">Units</th>
                            <th className="py-2.5 px-3">Reference Interval</th>
                            <th className="py-2.5 px-3 text-right">Status Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedOrder.results && selectedOrder.results.length > 0 ? (
                            selectedOrder.results.map((res, idx) => (
                              <tr key={idx} className={res.isAbnormal ? 'bg-amber-50/40 font-medium' : ''}>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{res.parameter}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{res.value}</td>
                                <td className="py-2.5 px-3 text-slate-600">{res.unit}</td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono">{res.referenceRange}</td>
                                <td className="py-2.5 px-3 text-right">
                                  {res.isAbnormal ? (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                      ABNORMAL
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                      NORMAL
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                                Assay results are currently processing on automated laboratory analyzers.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selectedOrder.notes && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-slate-700 block">Pathologist Clinical Comments:</span>
                        <p className="text-slate-600 italic">"{selectedOrder.notes}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Format 2: PRIVATE REPORT */}
                {reportFormat === 'PRIVATE' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-900">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span className="font-bold text-xs uppercase tracking-wider">Private Clinician-Only Encrypted View</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        This diagnostic report is designated as <b>Private</b> under Australian Medway &amp; Sri Lanka MOH clinical governance protocols. Only authenticated ordering practitioners (Dr. Sunil Wickramasinghe / Dr. K. L. Fernando) or authorized delegates may view this record.
                      </p>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2 font-mono">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Authorized Clinician:</span>
                        <span className="font-bold text-slate-900">Dr. Sunil Wickramasinghe (SLMC #44091)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Security Clearance:</span>
                        <span className="text-emerald-700 font-bold">Verified Direct Access</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Access Record:</span>
                        <span className="text-slate-700">Logged to audit node #AUDIT-PVT-2026-99</span>
                      </div>
                    </div>

                    {/* Render standard results under verified session */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Parameter</th>
                            <th className="py-2.5 px-3">Value</th>
                            <th className="py-2.5 px-3">Reference Range</th>
                            <th className="py-2.5 px-3 text-right">Private Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedOrder.results?.map((res, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{res.parameter}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{res.value} {res.unit}</td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono">{res.referenceRange}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                                  Private Access
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Format 3: CONFIDENTIAL REPORT */}
                {reportFormat === 'CONFIDENTIAL' && (
                  <div className="space-y-4">
                    {!isConfidentialUnlocked ? (
                      <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div className="max-w-md mx-auto">
                          <h4 className="text-sm font-bold text-slate-900">Sensitive Diagnostic Data Protected</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            This report contains protected genetic, infectious serology, or oncology markers. To access, please re-authenticate with your clinician session PIN.
                          </p>
                        </div>

                        <form onSubmit={handleUnlockConfidential} className="max-w-xs mx-auto flex items-center gap-2">
                          <input
                            type="password"
                            placeholder="Enter 4-digit PIN (1234)"
                            value={confidentialPasscode}
                            onChange={(e) => setConfidentialPasscode(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                          >
                            Unlock
                          </button>
                        </form>

                        {confidentialError && (
                          <p className="text-xs text-rose-600 font-bold">
                            Invalid PIN. Use clinician demo PIN: <b>1234</b>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                          <div className="flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-emerald-700" />
                            <span className="font-bold">Confidential Record Unlocked via Session Re-Authentication</span>
                          </div>
                          <button
                            onClick={() => setIsConfidentialUnlocked(false)}
                            className="text-xs text-emerald-800 underline hover:text-emerald-950 font-semibold"
                          >
                            Re-lock Record
                          </button>
                        </div>

                        {/* Unlocked Table */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                              <tr>
                                <th className="py-2.5 px-3">Confidential Parameter</th>
                                <th className="py-2.5 px-3">Value</th>
                                <th className="py-2.5 px-3">Reference Range</th>
                                <th className="py-2.5 px-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedOrder.results?.map((res, idx) => (
                                <tr key={idx}>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">{res.parameter}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{res.value} {res.unit}</td>
                                  <td className="py-2.5 px-3 text-slate-500 font-mono">{res.referenceRange}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                                      CONFIDENTIAL DECRYPTED
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Format 4: CUMULATIVE RESULTS (HISTORICAL DELTA TRENDS) */}
                {reportFormat === 'CUMULATIVE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-4 h-4 text-primary" />
                          Cumulative Longitudinal Pathology Trends
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cross-visit delta comparisons over previous 6–12 months to evaluate therapy response &amp; organ kinetics
                        </p>
                      </div>
                    </div>

                    {cumulativeData && cumulativeData.length > 0 ? (
                      <div className="space-y-4">
                        {cumulativeData.map((hist, idx) => (
                          <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-900 text-xs">{hist.parameter}</span>
                                <span className="text-[11px] text-slate-500 ml-1.5">({hist.unit})</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                                Ref Range: {hist.referenceRange}
                              </span>
                            </div>

                            {/* History Timeline Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {hist.history.map((pt, pIdx) => {
                                const isLatest = pIdx === hist.history.length - 1;
                                return (
                                  <div 
                                    key={pIdx} 
                                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                                      isLatest 
                                        ? 'bg-white border-primary shadow-xs' 
                                        : 'bg-white border-slate-200'
                                    }`}
                                  >
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                      <span className="font-semibold">{pt.visitLabel}</span>
                                      <span>{pt.date}</span>
                                    </div>
                                    <div className="flex items-baseline justify-between pt-1">
                                      <span className="text-base font-bold font-mono text-slate-900">
                                        {pt.displayValue}
                                      </span>
                                      {pt.isAbnormal ? (
                                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-bold text-[9px] flex items-center gap-0.5">
                                          <TrendingUp className="w-3 h-3" /> Abnormal
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] flex items-center gap-0.5">
                                          <TrendingDown className="w-3 h-3" /> Target
                                        </span>
                                      )}
                                    </div>
                                    {pt.notes && (
                                      <p className="text-[10px] text-slate-600 italic pt-1 border-t border-slate-100">
                                        {pt.notes}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        No previous historical visits logged for this patient. Current order represents primary baseline.
                      </div>
                    )}
                  </div>
                )}

                {/* Format 5: INTERIM RESULTS */}
                {reportFormat === 'INTERIM' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <div>
                          <span className="font-bold block">Interim Diagnostic Release (Preliminary Report)</span>
                          <span className="text-[11px] text-amber-800">
                            Immediate results released to assist urgent bedside decisions while secondary confirmations remain in progress.
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono text-[10px] font-bold rounded">
                        PARTIAL TAT
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Assay Parameter</th>
                            <th className="py-2.5 px-3">Value</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedOrder.results?.map((res, idx) => (
                            <tr key={idx} className="bg-emerald-50/30">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{res.parameter}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{res.value} {res.unit}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] flex items-center gap-1 w-max">
                                  <CheckCircle2 className="w-3 h-3" /> Released (Preliminary)
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-[11px] text-slate-600">
                                Bedside review cleared
                              </td>
                            </tr>
                          ))}
                          
                          {/* Simulated pending parameters */}
                          <tr className="bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-700">Extended Culture &amp; Antibiotic Sensitivity</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono italic">Pending 48h Incubation</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] flex items-center gap-1 w-max">
                                <Clock className="w-3 h-3" /> Incubating (ETA 24h)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[11px] text-slate-500">
                              Auto-updates via MQLink
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Supplementary Add-On Tests Section for Current Order */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-purple-600" />
                        Supplementary Add-On Tests On Existing Specimen
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Add extra tests directly without ordering a new venipuncture or separate referral
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddOnModalOpen(true)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Request Add-On</span>
                    </button>
                  </div>

                  {orderAddOns.length > 0 ? (
                    <div className="space-y-2">
                      {orderAddOns.map(addOn => (
                        <div key={addOn.id} className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{addOn.testName}</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              addOn.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              addOn.status === 'IN_PROCESSING' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {addOn.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            <b>Clinical Indication:</b> {addOn.clinicalReason}
                          </p>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-purple-100">
                            <span>Specimen: {addOn.tubeColor}</span>
                            <span>Requested: {addOn.requestedAt} by {addOn.requestedBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                      No supplementary add-ons active for this specimen. Clinicians may add extra assays while the physical tube remains archived in the laboratory.
                    </p>
                  )}
                </div>

                {/* Quick Share Audit Trail for Current Order */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-emerald-600" />
                        Multidisciplinary Team (MDT) Quick Share Activity
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Secure cryptographic transmissions to consulting specialists and hospital MDT boards
                      </p>
                    </div>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share with Specialist</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {quickShareLogs.filter(q => q.orderId === selectedOrder.id).map(share => (
                      <div key={share.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">
                            Shared with: {share.sharedWith} ({share.recipientRole})
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                            Token Active ({share.expiryHours}h)
                          </span>
                        </div>
                        {share.notes && (
                          <p className="text-[11px] text-slate-600 italic">
                            Consult note: "{share.notes}"
                          </p>
                        )}
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                          <span>Dispatched: {share.sharedAt} • PIN Protected: Yes</span>
                          <span>Consult Access Count: {share.accessCount || 1} times</span>
                        </div>
                      </div>
                    ))}

                    {quickShareLogs.filter(q => q.orderId === selectedOrder.id).length === 0 && (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                        No active external MDT shares for this record. Use Quick Share to route to consulting clinicians.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-[#c1c7cf] rounded-xl text-slate-500">
              Select a patient from the left worklist to inspect their diagnostic results.
            </div>
          )}

        </div>

      </div>

      {/* ===================== MODAL 1: ADD SUPPLEMENTARY TEST ===================== */}
      {isAddOnModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#c1c7cf] rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Add Supplementary Test (No New Referral Needed)
                </h3>
              </div>
              <button 
                onClick={() => setIsAddOnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-xs space-y-1">
              <p className="font-bold text-purple-900">Target Specimen: #{selectedOrder.specimenId} ({selectedOrder.patientName})</p>
              <p className="text-slate-600 text-[11px]">
                Existing collection tube is archived in laboratory cold storage. Requesting an add-on assay authorizes the analyzer to re-aspirate the stored sample without patient venipuncture.
              </p>
            </div>

            <form onSubmit={handleAddSupplementaryTest} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Select Supplementary Assay
                </label>
                <select
                  value={newAddOnTestName}
                  onChange={(e) => setNewAddOnTestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Serum Ferritin & Iron Studies">Serum Ferritin &amp; Iron Studies (Iron Deficiency Anemia)</option>
                  <option value="NT-proBNP (Heart Failure Marker)">NT-proBNP (Acute Heart Failure Decompensation)</option>
                  <option value="High-Sensitivity CRP (hs-CRP)">High-Sensitivity CRP (Vascular Inflammation)</option>
                  <option value="Free T4 & FT3 Confirmation">Free T4 &amp; FT3 Reflex Confirmation</option>
                  <option value="Estimated GFR & Serum Creatinine">Estimated GFR &amp; Renal Re-check</option>
                  <option value="Vitamin B12 & Folate">Vitamin B12 &amp; Folate Immunoassay</option>
                  <option value="D-Dimer Quantitative Assay">D-Dimer Coagulation Assay</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Clinical Indication / Reason for Add-On
                </label>
                <textarea
                  rows={3}
                  value={newAddOnReason}
                  onChange={(e) => setNewAddOnReason(e.target.value)}
                  placeholder="Explain why this supplementary test is required..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Ordering Practitioner: </span>
                Dr. Sunil Wickramasinghe (SLMC #44091)
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOnModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Authorize Supplementary Assay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: MDT QUICK SHARE ===================== */}
      {isShareModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#c1c7cf] rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  MDT Quick Share (Collaborative Care)
                </h3>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs space-y-1">
              <p className="font-bold text-emerald-900">Sharing Patient: {selectedOrder.patientName} (#{selectedOrder.specimenId})</p>
              <p className="text-slate-600 text-[11px]">
                Built-in secure data exchange permits multidisciplinary clinical teams to seamlessly review diagnostic findings with end-to-end token encryption.
              </p>
            </div>

            <form onSubmit={handleQuickShareSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Recipient Specialist / Care Team
                </label>
                <select
                  value={shareRecipient}
                  onChange={(e) => {
                    setShareRecipient(e.target.value);
                    if (e.target.value.includes('Cardiologist')) setShareRole('Cardiology Specialist');
                    else if (e.target.value.includes('Oncology')) setShareRole('Oncology MDT Board');
                    else setShareRole('Consulting Specialist');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Dr. Nalin Perera (Cath Lab Interventional Cardiologist)">Dr. Nalin Perera (Cath Lab Interventional Cardiologist)</option>
                  <option value="Dr. Chamari Abeyratne (Consultant Hematologist)">Dr. Chamari Abeyratne (Consultant Hematologist)</option>
                  <option value="National Hospital Nephrology MDT Board">National Hospital Nephrology MDT Board</option>
                  <option value="Colombo General Surgical Oncology Panel">Colombo General Surgical Oncology Panel</option>
                  <option value="External Consulting General Practitioner">External Consulting General Practitioner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Sharing Channel
                  </label>
                  <select
                    value={shareMethod}
                    onChange={(e) => setShareMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="MDT_PANEL">MDT Review Panel</option>
                    <option value="DIRECT_PRACTITIONER">Direct Clinician Inbox</option>
                    <option value="ENCRYPTED_LINK">Encrypted Time-Limited Link</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Token Expiration
                  </label>
                  <select
                    value={shareExpiry}
                    onChange={(e) => setShareExpiry(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value={12}>12 Hours (STAT Consult)</option>
                    <option value={24}>24 Hours (Standard)</option>
                    <option value={48}>48 Hours (Weekend MDT)</option>
                    <option value={168}>7 Days (Outpatient Review)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  MDT Consultation Brief / Clinical Note
                </label>
                <textarea
                  rows={3}
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="Attach clinical notes for the multidisciplinary discussion..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Security: <b>256-bit AES + 4-digit One-Time PIN</b></span>
                <span className="text-emerald-700 font-bold">Audit Enforced</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Secure MDT Share</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

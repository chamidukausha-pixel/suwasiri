import React, { useState, FormEvent } from 'react';
import { 
  testCatalogItems, 
  initialConsumables, 
  initialMQLinkRecords, 
  initialTrialProtocols,
  initialOrders 
} from '../data/mockData';
import { TestCatalogItem, ConsumableItem, MQLinkRecord, ClinicalTrialProtocol, LabOrder } from '../types';
import ResultDeliveryManager from './ResultDeliveryManager';
import ClinicalTrialsPortal from './ClinicalTrialsPortal';
import { 
  Search, 
  Beaker, 
  Clock, 
  ShieldAlert, 
  Printer, 
  Layers, 
  Activity, 
  FileCheck2, 
  PackageCheck, 
  Microscope, 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  EyeOff, 
  ShoppingCart, 
  RefreshCw, 
  ExternalLink,
  Plus,
  Minus,
  Check,
  Building2,
  Syringe,
  Barcode,
  Share2,
  FileText
} from 'lucide-react';

interface TestCatalogProps {
  orders?: LabOrder[];
  initialSubTab?: 'catalog' | 'medway' | 'mqlink' | 'trials' | 'procurement' | 'digitalPath';
}

export default function TestCatalog({ orders, initialSubTab = 'catalog' }: TestCatalogProps) {
  const [catalogSubTab, setCatalogSubTab] = useState<'catalog' | 'medway' | 'mqlink' | 'trials' | 'procurement' | 'digitalPath'>(initialSubTab);
  
  // Test Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubDept, setSelectedSubDept] = useState<string>('All');
  
  // Consumables & Label Printing State
  const [consumables] = useState<ConsumableItem[]>(initialConsumables);
  const [consumablesCategory, setConsumablesCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  const [labelPatientName, setLabelPatientName] = useState('Anura Perera');
  const [labelBarcode, setLabelBarcode] = useState('SUWA-2024-88401');
  const [labelTubeType, setLabelTubeType] = useState('EDTA Lavender 3.0mL');
  const [labelPrintSuccess, setLabelPrintSuccess] = useState(false);

  // MQLink State
  const [mqRecords, setMqRecords] = useState<MQLinkRecord[]>(initialMQLinkRecords);
  const [selectedMqRecord, setSelectedMqRecord] = useState<MQLinkRecord | null>(initialMQLinkRecords[0]);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Clinical Trials State
  const [trialProtocols, setTrialProtocols] = useState<ClinicalTrialProtocol[]>(initialTrialProtocols);
  const [testExclusionValue, setTestExclusionValue] = useState<string>('');
  const [selectedExclusionParam, setSelectedExclusionParam] = useState<string>('Platelets');
  const [exclusionResult, setExclusionResult] = useState<{ isExcluded: boolean; message: string } | null>(null);

  // Digital Pathology zoom state
  const [wsiZoom, setWsiZoom] = useState<'10x' | '20x' | '40x'>('20x');

  const subDepartments = [
    'All',
    'Haematology & Blood Transfusion',
    'General Biochemistry & Endocrinology',
    'Digital Pathology & Cellular Diagnostics',
    'Clinical Trials & Protocol Testing'
  ];

  const filteredItems = testCatalogItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.clinicalSignificance.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.hl7Code && item.hl7Code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedSubDept === 'All' || item.subDepartment === selectedSubDept || item.category.includes(selectedSubDept);
    return matchesSearch && matchesDept;
  });

  const getTubeBg = (color: string) => {
    const lower = color.toLowerCase();
    if (lower.includes('lavender')) return 'bg-purple-600 text-white';
    if (lower.includes('light blue') || lower.includes('citrate')) return 'bg-sky-500 text-white';
    if (lower.includes('red')) return 'bg-rose-600 text-white';
    if (lower.includes('yellow') || lower.includes('gold')) return 'bg-amber-400 text-slate-900 font-bold';
    if (lower.includes('grey') || lower.includes('gray')) return 'bg-gray-400 text-slate-900';
    if (lower.includes('cassette') || lower.includes('formalin')) return 'bg-slate-700 text-white';
    return 'bg-blue-600 text-white';
  };

  const handleAddToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const totalCartCost = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = consumables.find(c => c.id === id);
    return sum + (item ? item.unitPriceLkr * Number(qty) : 0);
  }, 0);

  const handlePrintLabel = () => {
    setLabelPrintSuccess(true);
    setTimeout(() => setLabelPrintSuccess(false), 3500);
  };

  const handleSyncMQLink = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportNotification('MQLink daemon synced 4 encrypted result packages. Audit hash SHA-256 confirmed.');
      setTimeout(() => setImportNotification(null), 5000);
    }, 1200);
  };

  const handleEvaluateExclusion = (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(testExclusionValue);
    if (isNaN(val)) {
      setExclusionResult({ isExcluded: false, message: 'Enter a valid numeric diagnostic value to evaluate.' });
      return;
    }

    if (selectedExclusionParam === 'Platelets') {
      if (val < 100) {
        setExclusionResult({
          isExcluded: true,
          message: `PROTOCOL EXCLUSION FLAGGED: Platelet count ${val} x10^9/L is below trial minimum cutoff (< 100 x10^9/L). Subject must be screened out or referred to Safety Committee.`
        });
      } else {
        setExclusionResult({
          isExcluded: false,
          message: `CRITERIA MET: Platelet count ${val} x10^9/L is within allowable protocol boundaries (≥ 100 x10^9/L).`
        });
      }
    } else if (selectedExclusionParam === 'Creatinine') {
      if (val > 156) {
        setExclusionResult({
          isExcluded: true,
          message: `PROTOCOL EXCLUSION FLAGGED: Serum Creatinine ${val} µmol/L exceeds 1.5x Upper Limit of Normal (>156 µmol/L).`
        });
      } else {
        setExclusionResult({
          isExcluded: false,
          message: `CRITERIA MET: Serum Creatinine ${val} µmol/L satisfies protocol renal inclusion thresholds.`
        });
      }
    } else if (selectedExclusionParam === 'Troponin') {
      if (val > 0.04) {
        setExclusionResult({
          isExcluded: true,
          message: `CRITICAL EXCLUSION: Troponin ${val} ng/mL indicates ongoing myocardial necrosis. Immediate exclusion flag raised.`
        });
      } else {
        setExclusionResult({
          isExcluded: false,
          message: `CRITERIA MET: Troponin ${val} ng/mL is below cardiac threshold.`
        });
      }
    }
  };

  const filteredConsumables = consumablesCategory === 'ALL' 
    ? consumables 
    : consumables.filter(c => c.category === consumablesCategory);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#c1c7cf] rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 text-blue-900 uppercase tracking-wider">
              Pathology Services &amp; GP Diagnostics
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              KMPN &amp; Medway Standard
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
            Diagnostic Testing Parameter Catalog
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Comprehensive diagnostic capabilities covering Haematology &amp; Blood Transfusion, General Biochemistry &amp; Endocrinology, Digital Telepathology, and specialized Clinical Trial Blinding &amp; Exclusion management.
          </p>
        </div>

        {/* Quick Specimen & Delivery Metrics */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs shrink-0">
          <div className="text-center px-2 border-r border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Assays</span>
            <span className="text-base font-extrabold text-slate-900">{testCatalogItems.length} Profiled</span>
          </div>
          <div className="text-center px-2 border-r border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">MQLink Gate</span>
            <span className="text-base font-extrabold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </span>
          </div>
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Trial Protocols</span>
            <span className="text-base font-extrabold text-purple-700">2 Active</span>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#c1c7cf] pb-2">
        <button
          onClick={() => setCatalogSubTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            catalogSubTab === 'catalog'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Beaker className="w-4 h-4" />
          <span>Testing Parameters &amp; Sub-Departments</span>
        </button>

        <button
          onClick={() => setCatalogSubTab('medway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            catalogSubTab === 'medway'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Electronic Result Delivery (Medway)</span>
        </button>

        <button
          onClick={() => setCatalogSubTab('trials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            catalogSubTab === 'trials'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Clinical Trials Portal</span>
        </button>

        <button
          onClick={() => setCatalogSubTab('mqlink')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            catalogSubTab === 'mqlink'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-500" />
          <span>MQLink &amp; Practice Software EDI</span>
        </button>

        <button
          onClick={() => setCatalogSubTab('procurement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            catalogSubTab === 'procurement'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-amber-500" />
          <span>Consumables Procurement &amp; Label Printing</span>
        </button>

        <button
          onClick={() => setCatalogSubTab('digitalPath')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            catalogSubTab === 'digitalPath'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Microscope className="w-4 h-4 text-sky-500" />
          <span>Digital Pathology &amp; Regional LIS Upgrades</span>
        </button>
      </div>

      {/* ===================== TAB 1: TESTING PARAMETERS & SUB-DEPARTMENTS ===================== */}
      {catalogSubTab === 'catalog' && (
        <div className="space-y-5">
          
          {/* Filters & Search */}
          <div className="bg-white border border-[#c1c7cf] p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search assay, code (e.g. FBC, TROP, LFT, WSI), HL7 code..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <span>Displaying:</span>
                <span className="font-bold text-slate-900">{filteredItems.length} laboratory assays</span>
              </div>
            </div>

            {/* Sub-Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 shrink-0">Sub-Departments:</span>
              {subDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedSubDept(dept)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSubDept === dept
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.code} 
                className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm hover:border-primary transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-primary/10 text-primary rounded uppercase">
                          {item.code}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          {item.subDepartment || item.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{item.name}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${getTubeBg(item.containerColor)}`}>
                        {item.containerColor}
                      </span>
                      {item.fastingRequired && (
                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Fasting Req.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specimen details strip */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-slate-100 my-2.5 text-xs bg-slate-50/70 px-3 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                        <Beaker className="w-3 h-3 text-primary" /> Specimen
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate block" title={item.specimenType}>
                        {item.specimenType}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" /> TAT
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">{item.turnaroundTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Min. Volume</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{item.specimenVolume || '2.5 mL'}</span>
                    </div>
                  </div>

                  {/* Reference intervals */}
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs space-y-1 mb-3">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-700" /> Reference Intervals / Targets
                    </span>
                    <p className="font-mono text-slate-900 font-semibold text-[11px] leading-relaxed">
                      {item.referenceValue}
                    </p>
                  </div>

                  {/* Clinical indications */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-900">Clinical Indication: </span>
                    {item.clinicalSignificance}
                  </p>
                </div>

                {/* Footer HL7 tag & protocol readiness */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                    <span className="font-bold uppercase text-slate-400">HL7:</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{item.hl7Code || `${item.code}^LAB`}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isClinicalTrialReady && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[9px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Clinical Trial Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="lg:col-span-2 py-12 text-center bg-white border border-[#c1c7cf] rounded-xl">
                <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800">No laboratory assays found matching criteria</p>
                <p className="text-xs text-slate-500">Try adjusting your search queries or department filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: MQLINK & REAL-TIME RESULT DELIVERY ===================== */}
      {catalogSubTab === 'mqlink' && (
        <div className="space-y-6">
          {/* Overview Banner */}
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    MQLink &amp; Electronic Result Delivery Gateway
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Real-Time Service Online
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Enables GP medical practices to seamlessly view, import, and acknowledge diagnostic results directly into electronic practice management software (Best Practice, MedicalDirector, EMIS Health, SystmOne, Genie).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncMQLink}
                  disabled={isImporting}
                  className="px-3.5 py-2 bg-primary hover:bg-[#0c4a6e] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Polling MQLink Gate...' : 'Trigger MQLink Poll'}</span>
                </button>
              </div>
            </div>

            {importNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importNotification}</span>
              </div>
            )}

            {/* Architecture highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  Real-Time Result Delivery
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Direct encrypted delivery of pathology reports as soon as authorized by the supervising pathologist.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Integrated Auditing Tracks
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Timestamped cryptographic audit trails verify every transfer, acknowledgement (ACK), and clinic import step.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" />
                  HL7 v2.4 &amp; FHIR Ingestion
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Automatic translation into standardized HL7 ORU_R01 messages and encrypted PIT container files.
                </p>
              </div>
            </div>
          </div>

          {/* Master Table of Results Delivered via MQLink */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white border border-[#c1c7cf] rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  MQLink Active Delivery Feed
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Channel: <b>lk-path-mqlink://gateway.lankalab.lk:443</b>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Patient &amp; Test</th>
                      <th className="py-2.5 px-3">Practitioner / Clinic</th>
                      <th className="py-2.5 px-3">Format</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mqRecords.map((rec) => (
                      <tr 
                        key={rec.id}
                        onClick={() => setSelectedMqRecord(rec)}
                        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                          selectedMqRecord?.id === rec.id ? 'bg-blue-50/80 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{rec.patientName}</span>
                          <span className="text-[11px] text-slate-500">{rec.testName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{rec.doctorName}</span>
                          <span className="text-[11px] text-slate-500 truncate block max-w-[170px]">{rec.clinicName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px] font-bold">
                            {rec.fileFormat}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {rec.status === 'DELIVERED' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              DELIVERED
                            </span>
                          )}
                          {rec.status === 'IMPORTED' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                              IMPORTED
                            </span>
                          )}
                          {rec.status === 'AUDITED' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                              AUDITED
                            </span>
                          )}
                          {rec.status === 'FLAGGED' && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] flex items-center gap-1 w-max">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> FLAGGED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Encrypted ${rec.fileFormat} diagnostic package downloaded for ${rec.patientName}.`);
                            }}
                            className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                            title="Download encrypted package"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Track Inspection Panel */}
            <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Integrated Audit Track Inspector
              </h4>

              {selectedMqRecord ? (
                <div className="space-y-3.5 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Selected Transmission</span>
                    <p className="font-bold text-slate-900">{selectedMqRecord.patientName} — {selectedMqRecord.testName}</p>
                    <p className="text-[11px] text-slate-600">HL7 Message ID: <code className="text-primary font-mono">{selectedMqRecord.hl7MessageId}</code></p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Cryptographic Audit Verification Log
                    </span>
                    <div className="space-y-2 relative pl-3 border-l-2 border-slate-200">
                      {selectedMqRecord.auditTrack.map((step, idx) => (
                        <div key={idx} className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => alert(`Certificate of Authenticity generated for HL7 Message ${selectedMqRecord.hl7MessageId}.`)}
                      className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Signed Audit Log (PDF)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">
                  Select any transmission record to inspect audit chain.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: ELECTRONIC RESULT DELIVERY (MEDWAY) ===================== */}
      {catalogSubTab === 'medway' && (
        <ResultDeliveryManager orders={orders || initialOrders} />
      )}

      {/* ===================== TAB: CLINICAL TRIALS PORTAL ===================== */}
      {catalogSubTab === 'trials' && (
        <ClinicalTrialsPortal />
      )}

      {/* ===================== TAB 4: CONSUMABLES PROCUREMENT & LABEL PRINTING ===================== */}
      {catalogSubTab === 'procurement' && (
        <div className="space-y-6">
          
          {/* Top Split: On-Demand Label Generator + Account Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* On Demand Barcode & Specimen Label Generator */}
            <div className="lg:col-span-2 bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">On-Demand Specimen Label Printing</h3>
                    <p className="text-[11px] text-slate-500">Prints compliant barcodes for Zebra and thermal label printers</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded font-bold">
                  Format: 50mm x 25mm Cryo-Adhesive
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={labelPatientName}
                    onChange={(e) => setLabelPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Barcode / Suwasiri ID</label>
                  <input
                    type="text"
                    value={labelBarcode}
                    onChange={(e) => setLabelBarcode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tube &amp; Additive</label>
                  <select
                    value={labelTubeType}
                    onChange={(e) => setLabelTubeType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="EDTA Lavender 3.0mL">EDTA Lavender 3.0mL (FBC)</option>
                    <option value="SST Gold/Yellow 4.0mL">SST Gold/Yellow 4.0mL (Biochem)</option>
                    <option value="Citrate Blue 2.7mL">Citrate Light Blue 2.7mL (Coag)</option>
                    <option value="Fluoride Grey 2.0mL">Fluoride Grey 2.0mL (Glucose)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Label Preview */}
              <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-center">
                <div className="w-80 bg-white border-2 border-dashed border-slate-400 p-3 rounded-md shadow-sm space-y-2 font-mono text-[11px] text-slate-900">
                  <div className="flex justify-between items-center border-b border-slate-300 pb-1">
                    <span className="font-bold text-[10px]">LANKALAB PATHOLAB</span>
                    <span className="text-[9px] bg-slate-200 px-1 rounded font-bold">STAT LAB</span>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-extrabold uppercase">{labelPatientName}</p>
                    <p className="text-[10px] text-slate-600 font-sans">{labelTubeType}</p>
                  </div>
                  <div className="py-1 text-center bg-slate-50 border border-slate-200 rounded">
                    <Barcode className="w-40 h-8 mx-auto text-slate-800" />
                    <span className="text-[10px] font-mono tracking-widest font-bold">{labelBarcode}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>COL: {new Date().toLocaleDateString()}</span>
                    <span>ROOM: GP-SUITE-01</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handlePrintLabel}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Specimen Label (Thermal)</span>
                </button>
              </div>

              {labelPrintSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Barcode label job dispatched to Zebra ZD420 thermal printer on port 9100.</span>
                </div>
              )}
            </div>

            {/* Clinic Procurement Profile & Order Cart */}
            <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  Clinic Procurement Account
                </h4>
                <p className="text-xs font-bold text-primary mt-1">Colombo Central GP Clinic</p>
                <span className="text-[10px] text-slate-500">Account ID: <b>ACC-LK-COL-4091</b></span>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Current Order Basket
                </span>

                {Object.keys(cart).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center italic">
                    Your consumables basket is empty. Select items below to order supplies.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = consumables.find(c => c.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                          <div className="max-w-[140px]">
                            <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500">LKR {item.unitPriceLkr.toLocaleString()} x {qty}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleRemoveFromCart(id)} className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold">
                              -
                            </button>
                            <span className="font-bold w-4 text-center">{qty}</span>
                            <button onClick={() => handleAddToCart(id)} className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold">
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Total Procurement:</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    LKR {totalCartCost.toLocaleString()}
                  </span>
                </div>

                <button
                  disabled={Object.keys(cart).length === 0}
                  onClick={() => {
                    setIsOrderSubmitted(true);
                    setCart({});
                    setTimeout(() => setIsOrderSubmitted(false), 5000);
                  }}
                  className="w-full py-2.5 bg-primary hover:bg-[#0c4a6e] text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Submit Bulk Order to LankaLab Depot</span>
                </button>

                {isOrderSubmitted && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px] font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Order placed! Dispatched via LankaLab Clinical Courier with tracking.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bulk Consumables & Vaccines Procurement Catalog */}
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bulk Consumables &amp; Vaccine Procurement Catalog
                </h3>
                <p className="text-xs text-slate-500">Order tubes, needles, biohazard transport kits, and cold-chain vaccines</p>
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {['ALL', 'TUBES', 'NEEDLES', 'BIOHAZARD', 'VACCINES', 'SWABS'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setConsumablesCategory(cat)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      consumablesCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredConsumables.map((item) => (
                <div key={item.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between hover:border-primary transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
                      {item.isVaccine ? (
                        <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[9px] font-extrabold rounded flex items-center gap-1">
                          <Syringe className="w-2.5 h-2.5" /> Cold Chain 2-8°C
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-2">Pack: {item.packSize}</span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">PRICE</span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        LKR {item.unitPriceLkr.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item.id)}
                      className="px-2.5 py-1.5 bg-primary hover:bg-[#0c4a6e] text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: DIGITAL PATHOLOGY & REGIONAL LIS UPGRADES ===================== */}
      {catalogSubTab === 'digitalPath' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wider">
                  Medway Maritime Hospital &amp; KMPN Upgrade Architecture
                </span>
                <span className="text-xs text-slate-500">Unified LIS &amp; Whole Slide Imaging (WSI)</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Digital Pathology Network &amp; Remote Telepathology Workflows
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Replicating the diagnostic upgrades of the Kent and Medway Pathology Network (KMPN) and Medway Maritime Hospital, LankaLab utilizes an interconnected Laboratory Information System (LIS) and digital slide scanning to deliver instant sub-specialist reviews across regional hospitals.
              </p>
            </div>

            {/* Network Nodes status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Unified Regional LIS</span>
                <p className="font-bold text-slate-900">CliniSys / WinPath Core Node</p>
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Shared Record Sync
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">High-Throughput Slide Scanners</span>
                <p className="font-bold text-slate-900">Hamamatsu NanoZoomer S360</p>
                <span className="text-sky-700 font-bold flex items-center gap-1 text-[11px]">
                  <Microscope className="w-3.5 h-3.5" /> 40x Optical Resolution
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Regional Telepathology Consult</span>
                <p className="font-bold text-slate-900">Sub-Specialist Second Opinion</p>
                <span className="text-purple-700 font-bold flex items-center gap-1 text-[11px]">
                  <Activity className="w-3.5 h-3.5" /> &lt; 2 Hour Turnaround
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Whole Slide Image (WSI) Digital Telepathology Mock Viewer */}
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-primary" />
                  Live Whole Slide Telepathology Canvas (Specimen: BX-2024-9912)
                </h4>
                <p className="text-[11px] text-slate-500">Patient: Kamala Jayawardena • Staining: Hematoxylin &amp; Eosin (H&amp;E) + HER2 IHC</p>
              </div>

              {/* Magnification controls */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Zoom:</span>
                {(['10x', '20x', '40x'] as const).map((zoom) => (
                  <button
                    key={zoom}
                    onClick={() => setWsiZoom(zoom)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      wsiZoom === zoom ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {zoom}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Stage Visualization */}
            <div className="relative h-64 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
              <div className={`transition-all duration-500 flex items-center justify-center ${
                wsiZoom === '10x' ? 'scale-75' : wsiZoom === '20x' ? 'scale-100' : 'scale-150'
              }`}>
                {/* Simulated biological cytology microscopic cell field */}
                <div className="w-80 h-52 bg-gradient-to-br from-pink-950/80 via-purple-900/60 to-rose-950/80 rounded-full blur-sm relative flex items-center justify-center p-6 border-4 border-pink-400/30">
                  <div className="w-12 h-12 rounded-full bg-pink-500/40 border-2 border-pink-300 animate-pulse absolute top-6 left-12"></div>
                  <div className="w-8 h-8 rounded-full bg-purple-400/50 border border-purple-200 absolute bottom-8 right-20"></div>
                  <div className="w-16 h-16 rounded-full bg-rose-400/40 border-2 border-rose-300 absolute top-10 right-10"></div>
                  <div className="w-6 h-6 rounded-full bg-pink-300/60 absolute bottom-12 left-28"></div>
                </div>
              </div>

              {/* Overlay telemetry badges */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded text-[10px] font-mono space-y-0.5">
                <div>Scan: NanoZoomer S360</div>
                <div>Res: 0.23 µm/pixel • {wsiZoom} Mode</div>
                <div className="text-emerald-400 font-bold">KMPN Network Node: Synced</div>
              </div>

              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded text-[10px] font-mono">
                Consultant: Dr. Jayasuriya (FRCPath)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900 block">Automated AI Morphometric Profiling</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Nuclear pleomorphism within benign margins. Mitotic index &lt; 2 per 10 HPF. HER2 receptor membrane staining: Negative (Score 0).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900 block">Multi-Disciplinary Team (MDT) Distribution</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Telepathology slides automatically replicated to Medway Maritime Hospital Regional MDT review queue for Thursday 08:30 GMT case discussion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

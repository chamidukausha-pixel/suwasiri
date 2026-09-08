import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  QrCode, 
  Printer, 
  DollarSign, 
  BellRing, 
  Server, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  Shield, 
  FileText,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function SettingsSection() {
  const [activeTab, setActiveTab] = useState<'facility' | 'suwasiri' | 'printer' | 'billing' | 'alerts' | 'diagnostics'>('suwasiri');
  const [savedToast, setSavedToast] = useState(false);

  // Form States
  const [labName, setLabName] = useState('Colombo Central Patholab & Diagnostics');
  const [regNo, setRegNo] = useState('SL-MOH-LAB-2024-COL09');
  const [labDirector, setLabDirector] = useState('Dr. Anoma Jayasuriya, MBBS, FRCPath');
  const [phone, setPhone] = useState('+94 11 269 1111');
  const [email, setEmail] = useState('lis-admin@lankalab.lk');
  const [address, setAddress] = useState('No. 42, De Saram Place, Colombo 10, Western Province, Sri Lanka');

  // Suwasiri Gateway Settings
  const [gatewayEndpoint, setGatewayEndpoint] = useState('https://gateway.suwasiri.health.gov.lk/v2');
  const [apiKey, setApiKey] = useState('suw_live_sec_9941_lk_central_colombo');
  const [autoSyncReports, setAutoSyncReports] = useState(true);
  const [barcodeStandard, setBarcodeStandard] = useState('CODE_128');
  const [smsGatewayProvider, setSmsGatewayProvider] = useState('Dialog Axiata Health Gateway');

  // Printer Settings
  const [printerModel, setPrinterModel] = useState('Zebra ZD220 Direct Thermal (USB/LAN)');
  const [labelSize, setLabelSize] = useState('50mm x 25mm Specimen Vial Standard');
  const [autoPrintBarcode, setAutoPrintBarcode] = useState(true);
  const [printDuplicateForDoctor, setPrintDuplicateForDoctor] = useState(false);

  // Billing Settings
  const [defaultCurrency, setDefaultCurrency] = useState('LKR (Rs.)');
  const [gpDiscountPercent, setGpDiscountPercent] = useState('10');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-LK-COL-');
  const [taxRate, setTaxRate] = useState('0'); // Diagnostics exempt in SL

  // Alert Settings
  const [criticalSmsAlerts, setCriticalSmsAlerts] = useState(true);
  const [doctorPhoneThreshold, setDoctorPhoneThreshold] = useState('+94 77 000 1122');
  const [soundAlerts, setSoundAlerts] = useState(true);

  const handleSaveSettings = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>LankaLab system settings saved and synchronized successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-[#c1c7cf] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-primary tracking-tight">
              Pathology &amp; Gateway Settings
            </h1>
          </div>
          <p className="text-xs text-[#41474e] mt-1">
            Configure Colombo Central Patholab parameters, Suwasiri Digital Health Gateway, thermal barcode printers, and finance rules.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-primary hover:bg-[#0c4a6e] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow transition-all cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#c1c7cf] bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('suwasiri')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'suwasiri'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Suwasiri Gateway &amp; Barcode</span>
        </button>

        <button
          onClick={() => setActiveTab('facility')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'facility'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-primary" />
          <span>Lab Facility Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('printer')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'printer'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4 text-slate-700" />
          <span>Barcode &amp; Thermal Printer</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'billing'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-teal-700" />
          <span>Billing &amp; Finance</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BellRing className="w-4 h-4 text-red-600" />
          <span>Critical Alerts &amp; SMS</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'diagnostics'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4 text-purple-600" />
          <span>Equipment &amp; Health Checks</span>
        </button>
      </div>

      {/* Main Settings Body */}
      <div className="bg-white border border-[#c1c7cf] border-t-0 rounded-b-xl p-6 shadow-sm">
        
        {/* TAB 1: Suwasiri Gateway */}
        {activeTab === 'suwasiri' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 bg-emerald-100 text-emerald-800 rounded">
                    <QrCode className="w-4 h-4" />
                  </span>
                  Suwasiri Digital Health Gateway Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connects LankaLab directly with the Ministry of Health Sri Lanka Citizen Portal &amp; Unified Barcode Registry.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Node LK-COL09 Online
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Central Health Cloud Gateway API</label>
                <input 
                  type="text" 
                  value={gatewayEndpoint}
                  onChange={(e) => setGatewayEndpoint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Lab Secret Authorization Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Default Barcode Encoding Standard</label>
                <select 
                  value={barcodeStandard}
                  onChange={(e) => setBarcodeStandard(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-600 font-semibold"
                >
                  <option value="CODE_128">Code 128 (High Density - Recommended)</option>
                  <option value="DATA_MATRIX">Data Matrix 2D (Miniature Tubes)</option>
                  <option value="QR_CODE">Suwasiri QR Code (Encrypted Citizen Token)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Patient SMS Provider</label>
                <select 
                  value={smsGatewayProvider}
                  onChange={(e) => setSmsGatewayProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-600 font-semibold"
                >
                  <option>Dialog Axiata Health Gateway (Instant Delivery)</option>
                  <option>SLTMobitel mHealth SMS Enterprise</option>
                  <option>Airtel Sri Lanka Medical Alert Relay</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <label className="font-bold text-slate-800 text-xs block uppercase tracking-wider">
                Automated Synchronization Rules
              </label>

              <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Auto-Push Verified Lab Reports to Citizen Suwasiri App</p>
                  <p className="text-[11px] text-slate-500">When pathologist approves final test, push PDF and assay table directly to patient mobile.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={autoSyncReports}
                  onChange={(e) => setAutoSyncReports(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">EHR Sync to Referring GP Medical Clinic</p>
                  <p className="text-[11px] text-slate-500">Automatically post finalized orders to GP Care Portal in Colombo and suburbs.</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Facility Profile */}
        {activeTab === 'facility' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Laboratory Institution Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official headers printed on all pathology certificates, receipts, and clinical reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Lab Facility Name</label>
                <input 
                  type="text" 
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Ministry of Health Registration No.</label>
                <input 
                  type="text" 
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Consultant Pathologist &amp; Lab Director</label>
                <input 
                  type="text" 
                  value={labDirector}
                  onChange={(e) => setLabDirector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Central Pathology Hotline</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-700">Physical Diagnostic Center Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Barcode & Printer */}
        {activeTab === 'printer' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-700" />
                Specimen Tube &amp; Barcode Printer Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware parameters for Zebra, TSC, and Brother thermal label printers at specimen collection counters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Thermal Printer Device</label>
                <input 
                  type="text" 
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Standard Specimen Label Size</label>
                <select 
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold"
                >
                  <option>50mm x 25mm Specimen Vial Standard (EDTA / Serum)</option>
                  <option>40mm x 20mm Micro-tube / Pediatric</option>
                  <option>60mm x 30mm Microbiology Culture Swab</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-900">Auto-Print Barcode on New Order Registration</p>
                  <p className="text-[11px] text-slate-500">Immediately dispatches 2 barcode labels to Zebra printer when patient is checked in.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={autoPrintBarcode}
                  onChange={(e) => setAutoPrintBarcode(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-900">Print Doctor Referral Duplicate Tag</p>
                  <p className="text-[11px] text-slate-500">Prints an extra barcode receipt to attach to clinician requisition slip.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={printDuplicateForDoctor}
                  onChange={(e) => setPrintDuplicateForDoctor(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Billing & Finance */}
        {activeTab === 'billing' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-700" />
                Finance &amp; Operational Expenses Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Default currency, GP clinic commission rates, official invoice sequences, and receipt footers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Default Currency</label>
                <input 
                  type="text" 
                  value={defaultCurrency}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 font-bold font-mono text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Invoice Number Prefix</label>
                <input 
                  type="text" 
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">GP Clinic Referral Commission (%)</label>
                <input 
                  type="number" 
                  value={gpDiscountPercent}
                  onChange={(e) => setGpDiscountPercent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Diagnostic VAT / SSCL Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white"
                />
                <span className="text-[10px] text-slate-500">Pathology services currently zero-rated under Sri Lanka medical exemptions.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Critical Alerts */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-red-600" />
                Critical Panic Value &amp; Physician Alert Rules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated SMS and audio triggers when diagnostic assay exceeds vital thresholds (e.g. Troponin &gt; 0.04 ng/mL, K+ &gt; 6.0 mmol/L).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Emergency On-Call Clinician Hotline</label>
                <input 
                  type="text" 
                  value={doctorPhoneThreshold}
                  onChange={(e) => setDoctorPhoneThreshold(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Critical Alert Tone &amp; Volume</label>
                <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold">
                  <option>Urgent Hospital Beep (ISO 60601-1-8 standard)</option>
                  <option>Continuous Chime until Acknowledged</option>
                  <option>Muted (Visual Flash Only)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between p-3.5 bg-red-50/60 border border-red-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-red-900">Auto-Dispatch Critical SMS to Ordering Physician</p>
                  <p className="text-[11px] text-red-700">Dispatches priority alert SMS immediately when abnormal result is registered.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={criticalSmsAlerts}
                  onChange={(e) => setCriticalSmsAlerts(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-900">Audible Alarm on Laboratory Dashboard</p>
                  <p className="text-[11px] text-slate-500">Play alert sound inside Patholab operations room when new critical order arrives.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Diagnostics & Equipment */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" />
                Laboratory Analyzer Hardware &amp; System Health
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Status of connected automated biochemistry, hematology, and immunoassay analyzers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Sysmex XN-550</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">CONNECTED</span>
                </div>
                <p className="text-[11px] text-slate-500">Automated 5-Part Hematology Analyzer</p>
                <p className="text-[10px] text-slate-400 font-mono">Port: COM3 (115200 baud) • ASTM E1394</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Beckman AU480</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">CONNECTED</span>
                </div>
                <p className="text-[11px] text-slate-500">Clinical Chemistry Analyzer</p>
                <p className="text-[10px] text-slate-400 font-mono">IP: 192.168.1.140 • HL7 v2.5</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Roche Cobas e411</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">CONNECTED</span>
                </div>
                <p className="text-[11px] text-slate-500">Electrochemiluminescence Immunoassay</p>
                <p className="text-[10px] text-slate-400 font-mono">IP: 192.168.1.145 • Bi-directional</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-emerald-900">LIS Database Integrity &amp; Sync State</p>
                <p className="text-[11px] text-emerald-700">All local SQLite and Cloud Run caches synchronized. Zero pending packet drops.</p>
              </div>
              <button 
                onClick={() => alert("Diagnostics ping successful: All 3 analyzer endpoints responded in 4ms.")}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Run Hardware Ping
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

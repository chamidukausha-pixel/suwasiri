import React, { useState, useMemo, useEffect } from 'react';
import { 
  initialOrders, 
  initialRoutes, 
  initialNotifications, 
} from './data/mockData';
import { LabOrder, CourierRoute, UrgentNotification, TestStatus } from './types';
import OrderForm from './components/OrderForm';
import IntegrationHub from './components/IntegrationHub';
import BillingDashboard from './components/BillingDashboard';
import LabModule from './components/LabModule';
import SuwasiriGateway from './components/SuwasiriGateway';
import SettingsSection from './components/SettingsSection';
import ResultDeliveryManager from './components/ResultDeliveryManager';
import EnterResultsPage from './components/EnterResultsPage';
import ClinicalTrialsPortal from './components/ClinicalTrialsPortal';
import { subscribeGpCareClinicCollections, type ClinicCollectionLog } from './sync/gpCareCollections';
import { flagCriticalToGpCare } from './sync/gpCareCritical';
import { flagCompletedCritical } from './sync/gpCareResultSync';
import { syncClinicAndTextPatient } from './sync/completeNotify';
import LabOrderActions from './components/LabOrderActions';
import { downloadLabReport, printLabReport } from './utils/labReportShare';
import { uniqueHealthId } from './utils/healthId';
import LoginView, { clearLankaLabSession, readLankaLabSession } from './components/LoginView';
import PathologyDesk, { type DeskTab } from './components/pathology/PathologyDesk';
import NewBillPage from './components/pathology/NewBillPage';
import BusinessHub from './components/BusinessHub';
import ManageHub from './components/ManageHub';
import PortalClock from './components/PortalClock';
import { 
  Activity, 
  Search, 
  Settings, 
  Plus, 
  Truck, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Eye, 
  MoreVertical, 
  Download, 
  Share2, 
  CheckCircle, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  MessageSquare, 
  Copy, 
  Check, 
  Send, 
  HelpCircle, 
  RotateCcw,
  User,
  Info,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(() => readLankaLabSession()?.email || null);
  // Sidebar Tabs state
  const [activeTab, setActiveTab] = useState<DeskTab>('overview');

  // Application Data States
  const [orders, setOrders] = useState<LabOrder[]>(initialOrders);
  const [routes, setRoutes] = useState<CourierRoute[]>(initialRoutes);
  const [notifications, setNotifications] = useState<UrgentNotification[]>(initialNotifications);

  const SEED_COLLECTIONS: ClinicCollectionLog[] = [
    {
      id: 'COL-1',
      clinicName: 'Colombo National Medical Clinic',
      driverName: 'Suresh Bandara',
      driverPhone: '+94 77 444 8812',
      vehicleNo: 'WP LH-7210',
      sampleCount: 14,
      status: 'PENDING',
      collectedAt: '',
      deliveredAt: ''
    },
    {
      id: 'COL-2',
      clinicName: 'Kandy General Medical Clinic',
      driverName: 'Nalin Samarasinghe',
      driverPhone: '+94 71 222 3341',
      vehicleNo: 'CP CE-1192',
      sampleCount: 8,
      status: 'COLLECTED',
      collectedAt: 'Today, 09:15 AM',
      deliveredAt: ''
    },
    {
      id: 'COL-3',
      clinicName: 'Ceylon Endocrine & Family Care',
      driverName: 'Priyantha de Silva',
      driverPhone: '+94 72 999 1111',
      vehicleNo: 'WP QA-6508',
      sampleCount: 6,
      status: 'DELIVERED',
      collectedAt: 'Today, 07:30 AM',
      deliveredAt: 'Today, 08:45 AM'
    }
  ];

  // Sri Lankan Clinic Sample Collections (seed + live GP Care Sample Dispatch)
  const [seedCollections, setSeedCollections] = useState<ClinicCollectionLog[]>(SEED_COLLECTIONS);
  const [gpCareCollections, setGpCareCollections] = useState<ClinicCollectionLog[]>([]);
  const collections = [...gpCareCollections, ...seedCollections.filter((s) => !gpCareCollections.some((g) => g.id === s.id))];

  useEffect(() => subscribeGpCareClinicCollections(setGpCareCollections), []);

  const patchCollection = (id: string, patch: Partial<ClinicCollectionLog>) => {
    setGpCareCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setSeedCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  
  // Selection and Interaction states
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(
    initialOrders.find((o) => o.status === 'COMPLETED') || null
  );
  const [selectedRoute, setSelectedRoute] = useState<CourierRoute>(initialRoutes[0]);
  const [globalSearch, setGlobalSearch] = useState('');

  // New Order Modal
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [labMenuOpen, setLabMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deliveryEnteringId, setDeliveryEnteringId] = useState<string | null>(null);

  // Gemini AI Consultation & Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiReportId, setAiReportId] = useState<string | null>(null); // Track which order has been analyzed

  // Clinical Chat Context
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string; timestamp: string }[]>([
    {
      role: 'ai',
      text: "Welcome to LankaLab Clinical Advisor. Select any lab order. I will ingest the measured assay metrics and answer queries regarding patient symptoms, potential diagnoses, or recommendation parameters.",
      timestamp: 'Just now'
    }
  ]);
  const [isConsulting, setIsConsulting] = useState(false);
  
  // Search query state specifically for the order table
  const [orderTableSearch, setOrderTableSearch] = useState('');

  // Active Row menu dropdown states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Copy-to-clipboard state
  const [copiedText, setCopiedText] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // On selecting a customer, automatically clear or set previous reports for that order
  useEffect(() => {
    if (selectedOrder) {
      setAiReport(null);
      setAiReportId(null);
      // reset chat history to initial state + custom context for this patient
      setChatHistory([
        {
          role: 'ai',
          text: `I've loaded the lab telemetry for ${selectedOrder.patientName} (${selectedOrder.age}y, ${selectedOrder.gender}) with specimen ID ${selectedOrder.specimenId}. You can trigger the Pathology Report AI analysis above, or ask me specific clinical questions here.`,
          timestamp: 'Now active'
        }
      ]);
    }
  }, [selectedOrder]);

  // Recalculate metrics dynamically based on current state
  const metrics = useMemo(() => {
    const queued = orders.filter(o => o.status !== 'COMPLETED');
    const critical = queued.filter(o => o.status === 'CRITICAL').length;
    const completed = orders.filter(o => o.status === 'COMPLETED').length;
    const transit = routes.reduce((sum, r) => sum + r.totalSamples, 0);
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const processing = orders.filter((o) => o.status === 'PROCESSING').length;
    return { critical, queued: queued.length, pending, processing, completed, transit };
  }, [orders, routes]);

  // Handle adding new order
  const handleAddOrder = (newOrder: LabOrder) => {
    setOrders([newOrder, ...orders]);
    
    // If it's critical, we also send an urgent notification immediately
    if (newOrder.priority === 'Critical' || newOrder.status === 'CRITICAL') {
      const newNotif: UrgentNotification = {
        id: String(Date.now()),
        type: 'CRITICAL',
        title: 'CRITICAL ALERT Triggered',
        message: `${newOrder.testType} for ${newOrder.patientName} (${newOrder.wardOrDept}) registered as critical. Immediate action required.`,
        timeAgo: 'Just now',
        timestamp: new Date()
      };
      setNotifications([newNotif, ...notifications]);
    } else if (newOrder.priority === 'Urgent') {
      const newNotif: UrgentNotification = {
        id: String(Date.now()),
        type: 'WARNING',
        title: 'URGENT DISPATCHED',
        message: `${newOrder.testType} specimen received for ${newOrder.patientName}. Turned for prioritised processing.`,
        timeAgo: 'Just now',
        timestamp: new Date()
      };
      setNotifications([newNotif, ...notifications]);
    }
  };

  // Status transition handlers to allow interactive simulation
  const updateOrderStatus = (orderId: string, newStatus: TestStatus) => {
    // If results don't exist and are completed, populate them
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        let updatedOrder = { ...order, status: newStatus };
        if (newStatus === 'COMPLETED') {
          updatedOrder.completedAt = order.completedAt || new Date().toISOString();
        }
        if (newStatus === 'COMPLETED' && (!order.results || order.results.length === 0)) {
          // Add default simulation results
          updatedOrder.results = [
            { parameter: 'General Assay Benchmark', value: '94.2', unit: 'U/L', referenceRange: '60 - 110', isAbnormal: false }
          ];
        }
        return updatedOrder;
      }
      return order;
    }));

    // Generate notification for status change
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (orderToUpdate) {
      const isCompleted = newStatus === 'COMPLETED';
      const isCritical = newStatus === 'CRITICAL';
      const promptTitle = isCritical ? 'CRITICAL TRIGGERED' : isCompleted ? 'TEST COMPLETED' : 'STATUS UPDATED';
      const promptType = isCritical ? 'CRITICAL' : isCompleted ? 'INFO' : 'WARNING';
      
      const newNotif: UrgentNotification = {
        id: String(Date.now()),
        type: promptType,
        title: promptTitle,
        message: `Order for ${orderToUpdate.patientName} (${orderToUpdate.testType}) changed status to ${newStatus}.`,
        timeAgo: 'Just now',
        timestamp: new Date()
      };
      setNotifications([newNotif, ...notifications]);
    }
    if (newStatus === 'COMPLETED') {
      const completed = orders.find(o => o.id === orderId);
      if (completed) setSelectedOrder({ ...completed, status: 'COMPLETED' });
    }
    setActiveMenuId(null);
  };

  const notifyCompletedOrder = async (order: LabOrder) => {
    const { clinic } = await syncClinicAndTextPatient(order);
    if (clinic.ok) {
      patchOrder(order.id, { gpCareSyncedAt: new Date().toISOString() });
    } else {
      alert(
        clinic.error ||
          `Could not sync to ${order.connectedClinic || 'the requesting medical centre'}. Start GP Care on http://localhost:3000.`
      );
    }
  };

  const completeAssayAndNotify = async (orderId: string) => {
    const current = orders.find((o) => o.id === orderId);
    if (!current) return null;
    const updated: LabOrder = {
      ...current,
      status: 'COMPLETED',
      completedAt: current.completedAt || new Date().toISOString(),
      results:
        current.results && current.results.length > 0
          ? current.results
          : [{ parameter: 'General Assay Benchmark', value: '94.2', unit: 'U/L', referenceRange: '60 - 110', isAbnormal: false }],
    };
    updateOrderStatus(orderId, 'COMPLETED');
    await notifyCompletedOrder(updated);
    return updated;
  };

  const patchOrder = (orderId: string, patch: Partial<LabOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, ...patch } : prev));
  };

  const persistEnteredResults = (
    order: LabOrder,
    results: NonNullable<LabOrder['results']>,
    extra: { notes: string; remarks: string; advice: string; interpretation?: string },
    mode: 'save' | 'final' | 'sign'
  ) => {
    const extraNote = [extra.notes, extra.remarks, extra.advice, extra.interpretation]
      .map((s) => (s || "").trim())
      .filter(Boolean)
      .join('\n');
    const notes = extraNote ? [order.notes, extraNote].filter(Boolean).join('\n') : order.notes;
    const nextResults = results.length > 0 ? results : order.results;
    if (mode === 'save') {
      patchOrder(order.id, { results: nextResults, notes, status: 'PROCESSING' });
      return;
    }
    const updated: LabOrder = {
      ...order,
      results: nextResults,
      notes,
      status: 'COMPLETED',
      completedAt: order.completedAt || new Date().toISOString(),
      ...(mode === 'sign' ? { gpCareSyncedAt: new Date().toISOString() } : {}),
    };
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    setNotifications((prev) => [
      {
        id: String(Date.now()),
        type: 'INFO',
        title: mode === 'sign' ? 'REPORT SIGNED OFF' : 'TEST COMPLETED',
        message: `Order for ${order.patientName} (${order.testType}) is now completed.`,
        timeAgo: 'Just now',
        timestamp: new Date(),
      },
      ...prev,
    ]);
    if (mode === 'final' || mode === 'sign') {
      setSelectedOrder(updated);
      setCurrentPage(1);
    }
    if (mode === 'sign') {
      setActiveTab('overview');
    }
  };

  const handleMarkCritical = async (order: LabOrder) => {
    if (order.status === 'COMPLETED') {
      patchOrder(order.id, { flaggedCritical: true, priority: 'Critical' });
      const result = await flagCompletedCritical({ ...order, flaggedCritical: true, priority: 'Critical' });
      if (!result.ok) {
        alert(result.error || 'Could not reach Sri Lankan GP Care. Start it on http://localhost:3000.');
      }
      return;
    }
    updateOrderStatus(order.id, 'CRITICAL');
    const result = await flagCriticalToGpCare(order);
    if (!result.ok) {
      alert(result.error || 'Could not reach Sri Lankan GP Care. Start it on http://localhost:3000.');
    }
  };

  const matchesOrderQuery = (o: LabOrder, query: string) => {
    if (!query) return true;
    return o.patientName.toLowerCase().includes(query) ||
      o.testType.toLowerCase().includes(query) ||
      o.specimenId.toLowerCase().includes(query) ||
      (o.wardOrDept || '').toLowerCase().includes(query) ||
      (o.suwasiriBarcode || '').toLowerCase().includes(query);
  };

  // Overview Active Lab Orders: completed assays only
  const filteredOrders = useMemo(() => {
    const query = (globalSearch || orderTableSearch).toLowerCase();
    return orders.filter(o => o.status === 'COMPLETED' && matchesOrderQuery(o, query));
  }, [orders, globalSearch, orderTableSearch]);

  // Pending Results worklist: everything still in queue
  const pendingQueue = useMemo(() => {
    const query = globalSearch.toLowerCase();
    return orders.filter(o => o.status !== 'COMPLETED' && matchesOrderQuery(o, query));
  }, [orders, globalSearch]);

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  // Trigger Gemini Pathologist Report Analysis
  const triggerAiAnalysis = async (order: LabOrder) => {
    setIsAnalyzing(true);
    setAiReport(null);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      
      if (!response.ok) {
        throw new Error('Analysis request failed. Please look at server console logs.');
      }
      const data = await response.json();
      setAiReport(data.analysis);
      setAiReportId(order.id);
    } catch (err: any) {
      console.error(err);
      // Load sample mock report in case API key is missing, so user doesn't hit a wall
      setAiReport(`### 🔬 Executive Pathology Summary
The lab results indicate a significantly elevated level indicating pathology. This patient profile requires prompt inspection and integration with overall symptoms.

### ⚠️ Alarm Findings & Critical Risks
- **Result Warning**: Elevated values exceed normal physiological reference thresholds.
- **Cardiovascular / Organic Burden**: Potential hazard of acute symptoms or ischemia.

### 📋 Next Diagnostic & Clinical Steps
1. Correlate immediately with symptoms, patient history, and physical indicators.
2. Schedule a repeat assay to monitor progress and clearance rates.
3. Initiate diagnostic ECG or supplementary liver/kidney imaging assays.

### 📝 Clinician Note Draft (Ready to Copy)
*Patient: ${order.patientName} (${order.age}y ${order.gender})*. Specimen ID: ${order.specimenId}. Checked with LankaLab Diagnostics Division. Recommended clinical follow-up is requested.`);
      setAiReportId(order.id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit diagnostic chat message to the Clinical Advisor
  const handleChatConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedOrder) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage, timestamp: 'Just now' }]);
    setIsConsulting(true);

    try {
      const response = await fetch('/api/gemini/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          patientContext: {
            patientName: selectedOrder.patientName,
            age: selectedOrder.age,
            gender: selectedOrder.gender,
            testType: selectedOrder.testType,
            status: selectedOrder.status,
            priority: selectedOrder.priority,
            notes: selectedOrder.notes,
            results: selectedOrder.results,
            wardOrDept: selectedOrder.wardOrDept
          }
        })
      });

      if (!response.ok) {
        throw new Error('Consultation request failed.');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.response, timestamp: 'Just now' }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: "My apologies, I cannot reach the server consultation engine. However, based on standard guidelines: please ensure immediate follow-up on critical flags, cross-check other patient chart records, and repeat the assay if results do not align with physical findings.",
        timestamp: 'Just now'
      }]);
    } finally {
      setIsConsulting(false);
    }
  };

  const copyClinicianDraftNote = (text: string) => {
    // Regex or simple split to find draft note
    const lines = text.split('\n');
    const draftIndex = lines.findIndex(l => l.includes('Clinician Note Draft') || l.includes('📝'));
    let rawNote = text;
    if (draftIndex !== -1) {
      rawNote = lines.slice(draftIndex + 1).join('\n').trim();
    }
    
    navigator.clipboard.writeText(rawNote);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Simple markdown renderer for AI text blocks to avoid external packages
  const renderFormattedMarkdown = (markdownText: string) => {
    const lines = markdownText.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        const title = line.replace('### ', '');
        return (
          <h4 key={idx} className="font-bold text-primary border-b border-primary/20 pb-1 mt-4 mb-2 flex items-center gap-1.5 text-sm uppercase tracking-wider">
            {title}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        const title = line.replace('## ', '');
        return (
          <h3 key={idx} className="font-bold text-primary mt-5 mb-2 text-base">
            {title}
          </h3>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        const parts = content.split(/\*\*(.*?)\*\*/);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 mb-1 leading-relaxed">
            {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-slate-900 font-bold">{p}</strong> : p)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        const content = line.trim().replace(/^\d+\.\s/, '');
        return (
          <div key={idx} className="flex gap-2.5 ml-2 mb-1.5 items-start text-xs text-slate-700">
            <span className="font-bold text-primary text-[11px] bg-primary-container px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5">
              {line.trim().match(/^\d+/)?.[0]}
            </span>
            <p className="leading-relaxed">{content}</p>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/);
        return (
          <p key={idx} className="text-xs text-slate-700 leading-relaxed mb-1">
            {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-slate-900 font-bold">{p}</strong> : p)}
          </p>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed mb-1">
          {line}
        </p>
      );
    });
  };

  const sideNav = (on: boolean, tone: 'red' | 'green' | 'blue') => {
    const idle = { red: 'text-red-200 hover:bg-red-500/20', green: 'text-emerald-200 hover:bg-emerald-500/20', blue: 'text-sky-200 hover:bg-sky-500/20' }[tone];
    const active = { red: 'bg-red-600/30 text-white border-r-4 border-red-400', green: 'bg-emerald-600/30 text-white border-r-4 border-emerald-400', blue: 'bg-sky-600/30 text-white border-r-4 border-sky-400' }[tone];
    return `w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-bold text-xs transition-all ${on ? active : idle}`;
  };
  const sideIcon = (on: boolean, tone: 'red' | 'green' | 'blue') => {
    const idle = { red: 'text-red-300 bg-red-500/15', green: 'text-emerald-300 bg-emerald-500/15', blue: 'text-sky-300 bg-sky-500/15' }[tone];
    const active = { red: 'text-white bg-red-500', green: 'text-white bg-emerald-500', blue: 'text-white bg-sky-500' }[tone];
    return `material-symbols-outlined text-base p-1 rounded-md shrink-0 ${on ? active : idle}`;
  };
  const sideBadge = (tone: 'red' | 'green' | 'blue') =>
    ({
      red: 'text-[10px] bg-red-500/25 text-red-100 px-1.5 py-0.5 rounded font-mono font-bold',
      green: 'text-[10px] bg-emerald-500/25 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold',
      blue: 'text-[10px] bg-sky-500/25 text-sky-100 px-1.5 py-0.5 rounded font-mono font-bold',
    })[tone];
  const sideSub = (on: boolean, tone: 'red' | 'green' | 'blue') => {
    const idle = { red: 'text-red-200/80 hover:bg-red-500/15', green: 'text-emerald-200/80 hover:bg-emerald-500/15', blue: 'text-sky-200/80 hover:bg-sky-500/15' }[tone];
    const active = { red: 'bg-red-500/35 text-white', green: 'bg-emerald-500/35 text-white', blue: 'bg-sky-500/35 text-white' }[tone];
    return `w-full text-left px-2 py-1.5 rounded-md text-[11px] font-bold ${on ? active : idle}`;
  };

  if (!sessionEmail) {
    return <LoginView onSignedIn={(email) => setSessionEmail(email)} />;
  }

  if (activeTab === 'newbill') {
    return (
      <NewBillPage
        orders={orders}
        onCreate={(order) => {
          handleAddOrder(order);
        }}
        onClose={() => setActiveTab('results')}
        onSettings={() => setActiveTab('settings')}
        onEnterResults={(order) => {
          setDeliveryEnteringId(order.id);
          setActiveTab('results');
        }}
      />
    );
  }

  if (activeTab === 'cases') {
    return (
      <PathologyDesk
        orders={orders}
        search={globalSearch}
        onSearch={setGlobalSearch}
        tab={activeTab}
        onTab={setActiveTab}
        onAddOrder={(order) => {
          handleAddOrder(order);
          setActiveTab('cases');
        }}
        onSignOut={() => {
          clearLankaLabSession();
          setSessionEmail(null);
        }}
        sessionEmail={sessionEmail}
        pages={{}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] font-sans antialiased flex flex-col">
      
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 border-b border-[#c1c7cf] bg-[#f0f3ff]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <span className="material-symbols-outlined text-primary text-3.5xl">science</span>
              <div className="flex flex-col">
                <span className="font-semibold text-lg md:text-xl text-primary tracking-tight leading-none">LankaLab Portal</span>
                <span className="text-[9px] text-[#41474e] font-sans font-bold tracking-wider uppercase leading-none mt-1">Colombo Central Patholab</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('newbill')}
              className="hidden sm:flex bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-black tracking-wide items-center gap-1 text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" /> NEW BILLS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Main search bar */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72787f] w-4.5 h-4.5" />
            <input 
              type="text" 
              placeholder="Search Patients or Orders..." 
              className="pl-10 pr-4 py-2 bg-[#ffffff] border border-[#c1c7cf] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64 text-xs font-semibold"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                // Switch back to overview tab to show results if user filters
                if (activeTab !== 'overview') {
                  setActiveTab('overview');
                }
              }}
            />
            {globalSearch && (
              <button 
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#72787f] hover:text-red-500 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full hover:bg-slate-200 transition-colors relative ${activeTab === 'settings' ? 'bg-[#dee8ff]' : ''}`}
            title="Settings"
          >
            <Settings className="w-5 h-5 text-[#41474e]" />
          </button>

          <div className="flex items-center gap-2 ml-2 cursor-pointer border-l border-slate-300 pl-3">
            <span className="hidden xl:inline text-xs font-bold text-slate-800" title={sessionEmail}>Colombo Patholab</span>
            <button
              type="button"
              onClick={() => {
                clearLankaLabSession();
                setSessionEmail(null);
              }}
              className="hidden md:inline text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              Sign out
            </button>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAagFZasBjBNaLXItGQGgsZmbbcO1iqF-mFNfEWpid65IIwJTBQud9ZUg13neKs-y1CS7O6urGUzKNUxs-Q6ox2FjgbwG23u7wh-2Ir-77-cDoHZH9tuz_qNdD5fi1KZq3zukShz86-wOAKNuPdA1uP_-aUpystOKOsR1UrZ93lXtWacI2AR8SbXwicTVDKQUhYLuASsTAph2tM3FfD68wJlmoj3hzcRTzkqeWY2CqCY61f1zE-oCh_IRkgmuVCtfQGVSzWzOwhTrw" 
              alt="Clinician headshot" 
              className="w-9 h-9 rounded-full object-cover border border-[#c1c7cf] sm:block hover:ring-2 hover:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 shrink-0 flex mt-16 relative">
        
        {/* SideNavBar */}
        <aside className="h-[calc(100vh-64px)] w-60 fixed left-0 top-16 border-r border-white/10 bg-[#0B1220] flex flex-col py-6 px-3 z-40 hidden md:flex">
          <div className="mb-6 px-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-white font-sans text-sm tracking-wide uppercase">GP Suite</h2>
            </div>
            <p className="text-slate-400 font-sans text-[10px] font-bold tracking-wider">DIAGNOSTICS DIVISION</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
            <button 
              onClick={() => setActiveTab('overview')}
              className={sideNav(activeTab === 'overview', 'green')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(activeTab === 'overview', 'green')}>dashboard</span>
                <span>Operations Overview</span>
              </div>
              <span className={sideBadge('green')}>
                {orders.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('results')}
              className={sideNav(activeTab === 'results', 'blue')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(activeTab === 'results', 'blue')}>mark_email_read</span>
                <span>Electronic Result Delivery</span>
              </div>
              <span className={sideBadge('blue')}>
                Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLabMenuOpen((v) => !v);
                setFinanceOpen(false);
                setManageOpen(false);
                setSettingsOpen(false);
              }}
              className={sideNav(String(activeTab).startsWith('lab-') || activeTab === 'pending', 'green')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(String(activeTab).startsWith('lab-') || activeTab === 'pending', 'green')}>biotech</span>
                <span>Lab</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${labMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {labMenuOpen && (
              <div className="pl-9 pr-1 space-y-0.5 pb-2">
                {(
                  [
                    ['lab-today', "Today's reports"],
                    ['lab-packages', 'Test packages'],
                    ['lab-panels', 'Test panels'],
                    ['lab-categories', 'Test categories'],
                    ['lab-database', 'Test database'],
                    ['lab-interpretations', 'Interpretations'],
                    ['lab-count', 'Test count'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={sideSub(activeTab === id, 'green')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => setActiveTab('logistics')}
              className={sideNav(activeTab === 'logistics', 'blue')}
            >
              <span className="flex items-center gap-2.5">
                <span className={sideIcon(activeTab === 'logistics', 'blue')}>local_shipping</span>
                <span>Transit Logistics Monitor</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFinanceOpen((v) => !v);
                setLabMenuOpen(false);
                setManageOpen(false);
                setSettingsOpen(false);
              }}
              className={sideNav(activeTab === 'billing' || String(activeTab).startsWith('biz-'), 'green')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(activeTab === 'billing' || String(activeTab).startsWith('biz-'), 'green')}>payments</span>
                <span>Finance &amp; Invoices</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${financeOpen ? 'rotate-180' : ''}`} />
            </button>
            {financeOpen && (
              <div className="pl-9 pr-1 space-y-0.5 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={sideSub(activeTab === 'billing', 'green')}
                >
                  Invoices
                </button>
                {(
                  [
                    ['biz-daily', 'Daily Business'],
                    ['biz-expenses', 'Expenses'],
                    ['biz-dues', 'Due Report'],
                    ['biz-activities', 'Activities'],
                    ['biz-referrals', 'Referral Business'],
                    ['biz-analysis', 'Business Analysis'],
                    ['biz-export', 'Data Export'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={sideSub(activeTab === id, 'green')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Suwasiri Digital Health Gateway section */}
            <button 
              onClick={() => setActiveTab('suwasiri')}
              className={sideNav(activeTab === 'suwasiri', 'blue')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(activeTab === 'suwasiri', 'blue')}>qr_code_scanner</span>
                <span>Suwasiri Gateway</span>
              </div>
              <span className={sideBadge('blue')}>
                MOH
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setManageOpen((v) => !v);
                setFinanceOpen(false);
                setLabMenuOpen(false);
                setSettingsOpen(false);
              }}
              className={sideNav(String(activeTab).startsWith('manage-'), 'blue')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(String(activeTab).startsWith('manage-'), 'blue')}>manage_accounts</span>
                <span>Manage</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${manageOpen ? 'rotate-180' : ''}`} />
            </button>
            {manageOpen && (
              <div className="pl-9 pr-1 space-y-0.5 pb-2">
                {(
                  [
                    ['manage-logins', 'Employee login'],
                    ['manage-doctors', 'Doctor access'],
                    ['manage-employees', 'Employee'],
                    ['manage-diagnofy', 'Diagnofy'],
                    ['manage-browser', 'Browser security'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={sideSub(activeTab === id, 'blue')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSettingsOpen((v) => !v);
                setLabMenuOpen(false);
                setFinanceOpen(false);
                setManageOpen(false);
              }}
              className={sideNav(activeTab === 'settings' || activeTab === 'trials' || activeTab === 'integration', 'blue')}
            >
              <div className="flex items-center gap-2.5">
                <span className={sideIcon(activeTab === 'settings' || activeTab === 'trials' || activeTab === 'integration', 'blue')}>settings</span>
                <span>Settings</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>
            {settingsOpen && (
              <div className="pl-9 pr-1 space-y-0.5 pb-2">
                <button type="button" onClick={() => setActiveTab('settings')} className={sideSub(activeTab === 'settings', 'blue')}>
                  Lab settings
                </button>
                <button type="button" onClick={() => setActiveTab('trials')} className={sideSub(activeTab === 'trials', 'blue')}>
                  Clinical Trials Portal
                </button>
                <button type="button" onClick={() => setActiveTab('integration')} className={sideSub(activeTab === 'integration', 'blue')}>
                  GP &amp; Mobile Sync
                </button>
              </div>
            )}
          </nav>

          <div className="mt-auto space-y-1 pt-4 border-t border-white/10">
            {/* Quick stats panel inside sidebar */}
            <div className="bg-white/5 border border-white/10 rounded p-2.5 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SYSTEM INSTANCE</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-200 font-semibold">Gemini Patholabs:</span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                alert("LankaLab Support Team can be reached 24/7 at support@lankalab.lk or toll-free hotlines.");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-bold text-xs transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
            <button 
              onClick={() => {
                alert("Loading historic diagnostics archives (2020-2025)... To fetch earlier archives, please connect central Sri Lanka ministry servers.");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-bold text-xs transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Past Archives</span>
            </button>
          </div>
        </aside>

        {/* Content Canvas */}
        <main className="flex-1 md:ml-60 p-6 overflow-x-hidden min-h-[calc(100vh-64px)] pb-24">
          
          {/* Active Tab: Overview (Main Workspace) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 xl:pr-[200px]">
              <div className="hidden xl:block fixed top-[72px] right-5 z-40">
                <PortalClock compact />
              </div>
              
              {/* Header block */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-sky-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent tracking-tight">Lab Operations Dashboard</h1>
                  <p className="text-indigo-700/80 text-xs mt-1 font-medium">Completed assays on this board · pending work lives in Lab → Today&apos;s reports</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-900 border border-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                    <span>Live System Status: Optimal</span>
                  </div>
                  <div className="xl:hidden">
                    <PortalClock compact />
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div 
                  onClick={() => setActiveTab('lab-today')}
                  className="cursor-pointer bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 border-2 border-sky-500 p-4 rounded-xl shadow-md hover:ring-2 hover:ring-sky-500/50 hover:shadow-lg transition-all relative overflow-hidden group"
                >
                  <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-35 transition-opacity text-sky-600">
                    <Clock className="w-16 h-16" />
                  </div>
                  <h3 className="text-[11px] font-black text-sky-800 uppercase tracking-wider mb-1">PENDING</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3.5xl font-bold font-sans text-sky-600">{metrics.pending}</span>
                    <span className="text-xs text-sky-700 font-semibold">not started</span>
                  </div>
                  <p className="text-[11px] text-sky-900/80 mt-2 font-medium">Open Lab → Today&apos;s reports to start the queue</p>
                </div>

                <div 
                  onClick={() => setActiveTab('lab-today')}
                  className="cursor-pointer bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 border-2 border-emerald-500 p-4 rounded-xl shadow-md hover:ring-2 hover:ring-emerald-500/50 hover:shadow-lg transition-all relative overflow-hidden group"
                >
                  <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-35 transition-opacity text-emerald-600">
                    <Truck className="w-16 h-16" />
                  </div>
                  <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-1">PROCESSING</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3.5xl font-bold font-sans text-emerald-600">{metrics.processing}</span>
                    <span className="text-xs text-emerald-700 font-semibold">in bench</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 mt-2 font-medium">Assays being entered — still on Today&apos;s reports</p>
                </div>

              </div>

              {/* Main Content Layout Split: Table + Clinical Assistant side-by-side */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Active Orders List & Table (Takes up 7 or 12 depending on sidebar active) */}
                <div className="xl:col-span-7 space-y-6">
                  
                  <div className="bg-white border-2 border-emerald-200 rounded-xl overflow-hidden shadow-md">
                    {/* Header bar controls */}
                    <div className="px-5 py-4 border-b border-emerald-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gradient-to-r from-emerald-100 via-teal-50 to-sky-100">
                      <div>
                        <h2 className="text-base font-bold text-emerald-900 font-headline-md">Active Lab Orders</h2>
                        <p className="text-[11px] text-emerald-800">Completed tests only. Pending assays are on Lab → Today&apos;s reports.</p>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Order-specific search field */}
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search list..." 
                            className="bg-white border border-[#c1c7cf] rounded-md px-2 py-1 text-[11px] w-28 focus:outline-none focus:ring-1 focus:ring-primary"
                            value={orderTableSearch}
                            onChange={(e) => {
                              setOrderTableSearch(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs">
                        <thead className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold">
                          <tr>
                            <th className="px-4 py-3 text-left">Patient Name</th>
                            <th className="px-3 py-3 text-left">Test Type</th>
                            <th className="px-3 py-3 text-left">Order Time</th>
                            <th className="px-3 py-3 text-left font-mono">Specimen ID</th>
                            <th className="px-3 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c1c7cf]">
                          {paginatedOrders.map((order) => {
                            const isSelected = selectedOrder?.id === order.id;
                            const isCriticalStatus = order.status === 'CRITICAL' || Boolean(order.flaggedCritical);
                            const isCompletedStatus = order.status === 'COMPLETED';
                            const isPendingStatus = order.status === 'PENDING';
                            const isProcessingStatus = order.status === 'PROCESSING';
                            
                            // Initialize initials bg
                            const avatarChar = order.patientName ? order.patientName.split(' ').map(n=>n[0]).join('').substring(0,2) : 'PT';

                            return (
                              <tr 
                                key={order.id}
                                className={`transition-all cursor-pointer group border-l-4 ${
                                  isCriticalStatus
                                    ? 'bg-red-50 hover:bg-red-100/90 border-red-600'
                                    : isPendingStatus
                                      ? 'bg-sky-50 hover:bg-sky-100/80 border-sky-500'
                                      : isProcessingStatus
                                        ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-500'
                                        : isCompletedStatus
                                          ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-400'
                                          : 'hover:bg-[#e7eeff] border-transparent'
                                } ${isSelected ? 'font-semibold ring-1 ring-inset ring-primary/30' : ''}`}
                                onClick={() => setSelectedOrder(order)}
                              >
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isCriticalStatus ? 'bg-red-600 text-white' :
                                      isPendingStatus ? 'bg-sky-500 text-white' :
                                      isProcessingStatus ? 'bg-emerald-500 text-white' :
                                      isCompletedStatus ? 'bg-emerald-600 text-white' :
                                      'bg-sky-100 text-primary-container'
                                    }`}>
                                      {avatarChar}
                                    </div>
                                    <div>
                                      <div className="flex items-center flex-wrap gap-1.5">
                                        <p className={`text-xs ${isCriticalStatus ? 'text-red-700 font-bold' : isPendingStatus ? 'text-sky-900 font-bold' : isProcessingStatus ? 'text-emerald-900 font-bold' : 'text-primary font-semibold'}`}>
                                          {order.patientName}
                                        </p>
                                        {order.suwasiriBarcode && (
                                          <span className="px-1.5 py-0.5 text-[8px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono font-bold rounded inline-flex items-center gap-0.5">
                                            <span>[||]</span> {order.suwasiriBarcode}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-normal block leading-tight">
                                        {order.age} yrs • {order.gender}
                                      </span>
                                      {order.connectedClinic && (
                                        <span className="text-[8.5px] text-[#006497] font-bold block truncate max-w-[160px] mt-0.5" title={order.connectedClinic}>
                                          🏥 {order.connectedClinic}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-3 py-3.5 font-medium text-slate-900">
                                  {order.testType}
                                </td>

                                <td className={`px-3 py-3.5 text-xs ${isCriticalStatus ? 'text-red-600 font-bold' : isPendingStatus ? 'text-sky-800 font-semibold' : isProcessingStatus ? 'text-emerald-800 font-semibold' : 'text-slate-600'}`}>
                                  {order.orderTime}
                                </td>

                                <td className="px-3 py-3.5 font-mono text-[11px] text-slate-500">
                                  #{order.specimenId}
                                </td>

                                <td className="px-3 py-3.5">
                                  {order.status === 'PROCESSING' && (
                                    <span className="px-2 py-0.5 rounded-full border border-emerald-500 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider">
                                      Processing
                                    </span>
                                  )}
                                  {order.status === 'CRITICAL' && (
                                    <span className="px-2 py-0.5 rounded-full border border-red-500 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                      CRITICAL
                                    </span>
                                  )}
                                  {order.status === 'PENDING' && (
                                    <span className="px-2 py-0.5 rounded-full border border-sky-500 bg-sky-500 text-white text-[9px] font-black uppercase tracking-wider">
                                      Pending
                                    </span>
                                  )}
                                  {order.status === 'COMPLETED' && (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      order.flaggedCritical
                                        ? 'border border-red-500 bg-red-600 text-white animate-pulse'
                                        : 'border border-emerald-400 bg-emerald-500 text-white'
                                    }`}>
                                      {order.flaggedCritical ? 'Critical' : 'Completed'}
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3.5 text-right relative" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isCompletedStatus ? (
                                      <LabOrderActions order={order} onPatch={patchOrder} />
                                    ) : isCriticalStatus && order.status === 'CRITICAL' ? (
                                      <button
                                        type="button"
                                        title="Re-open critical profile in GP Care"
                                        onClick={() => void handleMarkCritical(order)}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1 animate-pulse"
                                      >
                                        <ExternalLink className="w-3 h-3" /> GP Care
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        title="Flag critical and open GP Care patient profile"
                                        onClick={() => void handleMarkCritical(order)}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1"
                                      >
                                        <AlertTriangle className="w-3 h-3" /> Critical
                                      </button>
                                    )}

                                    {/* Inline action configuration dropdown trigger */}
                                    <button 
                                      onClick={() => setActiveMenuId(activeMenuId === order.id ? null : order.id)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Simulated Micro-Action dropdown */}
                                  {activeMenuId === order.id && (
                                    <div className="absolute right-4 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 text-left w-44 overflow-hidden">
                                      <p className="text-[9px] text-[#41474e] px-2.5 py-1 border-b uppercase font-bold tracking-wider bg-slate-50">Simulate Status</p>
                                      <button 
                                        onClick={() => updateOrderStatus(order.id, 'PENDING')} 
                                        className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-150 flex items-center gap-1"
                                      >
                                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Set Pending
                                      </button>
                                      <button 
                                        onClick={() => updateOrderStatus(order.id, 'PROCESSING')} 
                                        className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-150 flex items-center gap-1"
                                      >
                                        <span className="w-2 h-2 rounded-full bg-orange-400"></span> Set Processing
                                      </button>
                                      <button 
                                        onClick={() => void handleMarkCritical(order)} 
                                        className="w-full text-left px-3 py-1.5 text-[11px] text-red-600 font-bold hover:bg-red-50 flex items-center gap-1"
                                      >
                                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Set Critical
                                      </button>
                                      <button 
                                        onClick={() => void completeAssayAndNotify(order.id)} 
                                        className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-150 flex items-center gap-1"
                                      >
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Set Completed
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredOrders.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-500 class-dense">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                                <p className="font-semibold text-xs text-emerald-900">No completed laboratory assays on this board</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {metrics.queued > 0
                                    ? `${metrics.queued} test(s) are still in the pending queue.`
                                    : 'Validate an assay on Lab → Today\'s reports to list it here.'}
                                </p>
                                {metrics.queued > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('lab-today')}
                                    className="mt-3 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-black rounded-lg uppercase"
                                  >
                                    Open Today&apos;s reports
                                  </button>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-5 py-3 border-t border-[#c1c7cf] flex justify-between items-center text-[11px] text-slate-600 bg-slate-50 font-medium">
                      <span>
                        Showing {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                        {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1 border border-slate-300 rounded hover:bg-white transition-all disabled:opacity-40 text-xs text-slate-700 font-semibold"
                        >
                          Previous
                        </button>
                        
                        <span className="px-3 py-1 text-xs font-bold text-primary bg-primary-container rounded">
                          {currentPage}
                        </span>
                        
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1 border border-slate-300 rounded hover:bg-white transition-all disabled:opacity-40 text-xs text-slate-700 font-semibold"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right Side: Deep-Dive Clinician Diagnostic & AI Consultant Panel (Takes up 5 columns) */}
                <div className="xl:col-span-5 space-y-6">
                  
                  {/* Selected Patient Details Panel */}
                  {selectedOrder ? (
                    <div className="bg-white border-2 border-primary rounded-xl overflow-hidden shadow-md flex flex-col">
                      
                      {/* Panel header: Custom Clinical Indigo Banner */}
                      <div className="bg-primary text-on-primary px-5 py-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300">CLINICAL PARAMETER CHART</span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-white mt-0.5 leading-snug">
                            {selectedOrder.patientName}
                          </h3>
                          <p className="text-[11px] text-indigo-100 mt-1 font-medium italic">
                            Specimen: #{selectedOrder.specimenId} · Health ID: {uniqueHealthId(selectedOrder)} • Room: {selectedOrder.wardOrDept}
                          </p>
                        </div>

                        {selectedOrder.status === 'CRITICAL' && (
                          <span className="px-2 py-1 bg-red-600 text-white border border-red-400 text-[10px] font-bold uppercase tracking-wider rounded animate-pulse shadow-md">
                            Crit Alert
                          </span>
                        )}
                      </div>

                      {/* Profile details capsule banner */}
                      <div className="bg-[#dee8ff] border-b border-[#c1c7cf] px-5 py-2.5 grid grid-cols-3 text-center gap-1 text-[11px] font-bold text-slate-700">
                        <div className="border-r border-slate-300">
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Age / Gender</p>
                          <p className="text-slate-800">{selectedOrder.age} yrs • {selectedOrder.gender}</p>
                        </div>
                        <div className="border-r border-slate-300">
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Urgency</p>
                          <p className={`font-bold ${
                            selectedOrder.priority === 'Critical' ? 'text-red-600' : selectedOrder.priority === 'Urgent' ? 'text-orange-600' : 'text-primary'
                          }`}>
                            {selectedOrder.priority}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Assay Code</p>
                          <p className="text-slate-800 truncate">{selectedOrder.testType.split(' ')[0]}</p>
                        </div>
                      </div>

                      {/* Patient Notes */}
                      <div className="px-5 py-3 border-b border-[#c1c7cf] bg-slate-50">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Clinician Intake Note Details :</p>
                        <p className="font-serif text-xs text-slate-700 leading-relaxed mt-1 italic">
                          "{selectedOrder.notes || 'No custom clinician referral tags listed.'}"
                        </p>
                      </div>

                      {/* Measured parameters tabular display */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">lab_profile</span>
                            Measured Diagnostics Metrics
                          </h4>
                          
                          {selectedOrder.results && selectedOrder.results.length > 0 ? (
                            <div className="border border-[#c1c7cf] rounded overflow-hidden">
                              <table className="w-full text-left font-mono text-[11px]">
                                <thead className="bg-[#f0f3ff] text-slate-700 font-bold text-[10px] uppercase">
                                  <tr className="border-b border-[#c1c7cf]">
                                    <th className="px-3 py-1.5">Parameter</th>
                                    <th className="px-3 py-1.5 text-right">Value</th>
                                    <th className="px-3 py-1.5 text-right">Ref Range</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                  {selectedOrder.results.map((res, index) => (
                                    <tr 
                                      key={index} 
                                      className={`hover:bg-slate-50/50 ${res.isAbnormal ? 'bg-red-50 text-red-700 font-semibold' : ''}`}
                                    >
                                      <td className="px-3 py-2 flex items-center gap-1 font-sans">
                                        {res.isAbnormal && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                                        <span className="truncate max-w-[130px]">{res.parameter}</span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <span className={`font-bold ${res.isAbnormal ? 'text-red-700' : 'text-slate-900'}`}>
                                          {res.value}
                                        </span>
                                        <span className="text-[10px] text-slate-400 ml-1 font-sans">{res.unit}</span>
                                      </td>
                                      <td className="px-2 py-2 text-right text-slate-500">
                                        {res.referenceRange}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-4 rounded border border-amber-300 bg-amber-50 text-amber-800 flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-base mt-0.5">hourglass_empty</span>
                              <div>
                                <p className="font-bold text-xs">Specimen Currently In Queue</p>
                                <p className="text-[11px] leading-relaxed opacity-90">
                                  This specimen is undergoing active chemical assaying. Quantitative metrics will populate soon.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedOrder.status === 'COMPLETED' && (
                          <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/80 space-y-2">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                              Report actions
                            </span>
                            <LabOrderActions order={selectedOrder} onPatch={patchOrder} />
                          </div>
                        )}

                        {/* CLINICAL ACTIONS PANEL */}
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Direct Lab &amp; Specimen Actions
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                              onClick={() => printLabReport(selectedOrder)}
                              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Print report</span>
                            </button>
                            <button
                              onClick={() => downloadLabReport(selectedOrder)}
                              className="px-2.5 py-2 bg-[#dee8ff] hover:bg-[#c9daff] text-primary rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download report</span>
                            </button>
                          </div>
                        </div>

                        {/* SUWASIRI APPS STATUS CARD */}
                        {selectedOrder.suwasiriBarcode && (
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4.5 space-y-3 shadow-inner">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                                Suwasiri Digital Health Gateway
                              </h4>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                Connected 🔗
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                              <div className="bg-white border border-emerald-150 p-2.5 rounded-lg shadow-sm">
                                <span className="text-[9px] text-zinc-500 uppercase font-black block leading-none">Barcode App Mapped</span>
                                <span className="font-mono text-emerald-700 font-bold mt-1 block">
                                  {selectedOrder.suwasiriBarcode}
                                </span>
                              </div>
                              <div className="bg-white border border-emerald-150 p-2.5 rounded-lg shadow-sm">
                                <span className="text-[9px] text-zinc-500 uppercase font-black block leading-none">GP Care Medical Clinic</span>
                                <span className="text-primary font-bold mt-1 block truncate" title={selectedOrder.connectedClinic}>
                                  {selectedOrder.connectedClinic || 'National Registry Node'}
                                </span>
                              </div>
                            </div>

                            <div className="text-[10px] text-zinc-700 space-y-1.5 pt-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                <p>GP EHR Sync ready: Document locks auto-post to <b>{selectedOrder.connectedClinic}</b>.</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                <p>Patient app push ready: Barcode <b>{selectedOrder.suwasiriBarcode}</b> authenticated &amp; active.</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-[#c1c7cf] rounded-xl p-6 text-center shadow-sm">
                      <p className="text-slate-500 text-xs">Select any lab order in the table to load clinician analytics and pathology interpreters.</p>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* Active Tab: Electronic Result Delivery & Management (Medway) */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">Electronic Result Delivery &amp; Management</h1>
                  <p className="text-on-surface-variant text-xs mt-1">New bills appear here until results are entered and signed off. Completed cases move to Operations Overview.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-[#41474e] hover:bg-white bg-slate-50 transition-all flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                </button>
              </div>
              <ResultDeliveryManager
                orders={orders}
                onEnterResults={(order) => setDeliveryEnteringId(order.id)}
                onCompletedNavigate={(order) => {
                  void (async () => {
                    const completed = await completeAssayAndNotify(order.id);
                    const next = completed || { ...order, status: 'COMPLETED' as const };
                    const completedIds = orders
                      .map((o) => (o.id === order.id ? next : o))
                      .filter((o) => o.status === 'COMPLETED')
                      .map((o) => o.id);
                    const index = completedIds.indexOf(order.id);
                    setSelectedOrder(next);
                    setOrderTableSearch('');
                    setGlobalSearch('');
                    setCurrentPage(index >= 0 ? Math.floor(index / itemsPerPage) + 1 : 1);
                    setActiveTab('overview');
                  })();
                }}
              />
            </div>
          )}

          {/* Active Tab: Clinical Trials Portal */}
          {activeTab === 'trials' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">Clinical Trials Operations Portal</h1>
                  <p className="text-on-surface-variant text-xs mt-1">Protocol-Guided Workflows, Blinding Solutions, Automated Exclusions &amp; Invoicing</p>
                </div>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-[#41474e] hover:bg-white bg-slate-50 transition-all flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                </button>
              </div>
              <ClinicalTrialsPortal />
            </div>
          )}

          {(activeTab === 'lab-today' || activeTab === 'lab-packages' || activeTab === 'lab-panels' || activeTab === 'lab-categories' || activeTab === 'lab-database' || activeTab === 'lab-interpretations' || activeTab === 'lab-count') && (
            <LabModule
              orders={orders}
              panel={
                activeTab === 'lab-packages'
                  ? 'packages'
                  : activeTab === 'lab-panels'
                    ? 'panels'
                    : activeTab === 'lab-categories'
                      ? 'categories'
                      : activeTab === 'lab-database'
                        ? 'database'
                        : activeTab === 'lab-interpretations'
                          ? 'interpretations'
                          : activeTab === 'lab-count'
                            ? 'count'
                            : 'today'
              }
              onSaveResults={(order, results, extra) => persistEnteredResults(order, results, extra, 'save')}
              onFinalResults={(order, results, extra) => persistEnteredResults(order, results, extra, 'final')}
              onSignOffResults={(order, results, extra) => persistEnteredResults(order, results, extra, 'sign')}
              onView={(order) => {
                setSelectedOrder(order);
                setActiveTab('results');
              }}
              onPatch={patchOrder}
            />
          )}

          {/* Active Tab: Pending Results */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b-2 border-amber-200 pb-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-red-600 bg-clip-text text-transparent tracking-tight">Pending &amp; Queue Worklist</h1>
                  <p className="text-amber-800/80 text-xs mt-1 font-medium">Pending, processing, and critical assays — completed tests move to Active Lab Orders</p>
                </div>
                <button 
                  onClick={() => setIsNewOrderOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 rounded-lg text-xs font-bold hover:from-amber-300 hover:to-orange-400 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Dispatch Specimen
                </button>
              </div>

              <div className="bg-white border-2 border-amber-200 rounded-xl overflow-hidden shadow-md">
                <div className="px-5 py-4 bg-gradient-to-r from-amber-100 via-orange-50 to-red-50 border-b border-amber-200 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-amber-950">High-Priority Queue Telemetry</h4>
                  <span className="text-[10px] font-black uppercase bg-amber-400 text-amber-950 px-2 py-0.5 rounded">{pendingQueue.length} in queue</span>
                </div>
                
                <div className="divide-y divide-amber-100">
                  {pendingQueue.map(o => (
                    <div key={o.id} className={`p-5 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 border-l-4 ${
                      o.status === 'CRITICAL' ? 'bg-red-50 border-red-600' :
                      o.status === 'PROCESSING' ? 'bg-emerald-50 border-emerald-500' :
                      'bg-sky-50 border-sky-500'
                    }`}>
                      
                      <div className="flex gap-4 items-start col-span-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          o.status === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                          o.status === 'PROCESSING' ? 'bg-emerald-500 text-white' :
                          'bg-sky-500 text-white'
                        }`}>
                          {o.patientName ? o.patientName.split(' ').map(n=>n[0]).join('') : 'PT'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-sm ${o.status === 'CRITICAL' ? 'text-red-700' : o.status === 'PENDING' ? 'text-sky-900' : o.status === 'PROCESSING' ? 'text-emerald-900' : 'text-primary'}`}>{o.patientName}</h4>
                            <span className="text-[10px] text-slate-500 font-medium">({o.age}y {o.gender})</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                              o.priority === 'Critical' ? 'bg-red-100 text-red-700' : o.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {o.priority}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-800 font-bold mt-1">Assay Profile: {o.testType}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Dispatched: {o.orderTime} • Specimen ID: <span className="font-mono text-xs font-semibold text-slate-700">#{o.specimenId}</span></p>
                          
                          {o.notes && (
                            <p className="text-xs font-serif text-[#41474e] mt-2 italic bg-white/70 p-2.5 rounded border border-gray-150">
                              "{o.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end justify-between self-end md:self-auto gap-2 text-right">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Current Phase</span>
                          <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide inline-block mt-1 ${
                            o.status === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' : o.status === 'PROCESSING' ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        
                        {/* Simulation trigger */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => void completeAssayAndNotify(o.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded shadow-sm transition-all"
                          >
                            ✓ Validate Assay
                          </button>
                          <button
                            onClick={() => void handleMarkCritical(o)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-all inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" /> {o.status === 'CRITICAL' ? 'Open GP Care' : 'Critical'}
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}

                  {pendingQueue.length === 0 && (
                    <div className="py-12 text-center text-slate-500">
                      <p className="font-bold text-xs">All diagnosed assays successfully approved &amp; validated.</p>
                      <button 
                        onClick={() => setOrders(initialOrders)} 
                        className="mt-2 text-xs text-primary font-bold hover:underline"
                      >
                        Reset Mock Orders
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Active Tab: Logistics */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">Active Transit Logistics Map</h1>
                  <p className="text-on-surface-variant text-xs mt-1">Cold-chain specimen tracking and ETA projections from Colombo clinics to Patholabs</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      alert("Pinging active GPS dispatch devices regarding route updates...");
                    }}
                    className="px-3 py-1.5 border border-slate-350 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-all"
                  >
                    Ping Dispatch Couriers
                  </button>
                </div>
              </div>

              {/* Extended Map Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Map Canvas (col-span-8) */}
                <div className="lg:col-span-8 bg-slate-100 border border-slate-300 rounded-xl overflow-hidden relative min-h-[500px] flex flex-col justify-between shadow-sm">
                  
                  {/* Floating map controls */}
                  <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur shadow-md rounded-lg p-3 border border-slate-200 max-w-sm">
                    <h4 className="font-bold text-primary text-xs flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      GPS Satellite Active
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Visualizing live Ceylon Medical Couriers (CMC) cold-baskets</p>
                  </div>

                  {/* High Quality Map Image */}
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH7OxXiaF90hH-A_5RZLqtY8_U6IhJ5O1XHjYiVjyKpuZVxY4j-Ccfli-ptvC4h0PM_bm_BR6TCDNaLx4UkJgv2BZKTdlM987e3ypbsUNy-mkbOOz-5R183TEEvmc3olwCklwHfkWp6pdGpHKigMQQKnfXmUL3VfOcS9qLPyxlCOdx1fSVb3Fky8FR8RZCUr0g4mfO3uOCirfW4VwpXBxZxZbt0hs4hzhWsqyoW4o80ybg4vfNgS86deN5oQ-PxX2pQEbt5HKXEo0" 
                    alt="Extended Sri Lanka / Colombo Logistics Map" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Satellite indicators on roads */}
                  <div className="absolute top-1/4 left-1/3 -translate-x-1/2 z-10">
                    <span className="w-5 h-5 bg-teal-600 border-2 border-white rounded-full inline-block animate-ping"></span>
                    <span className="w-4 h-4 bg-teal-600 border-2 border-white rounded-full inline-block -mt-5"></span>
                  </div>

                  <div className="absolute bottom-1/3 right-1/4 z-10">
                    <span className="w-5 h-5 bg-secondary border-2 border-white rounded-full inline-block animate-ping"></span>
                    <span className="w-4 h-4 bg-secondary border-2 border-white rounded-full inline-block -mt-5"></span>
                  </div>

                  {/* Current Active Courier card overlay */}
                  <div className="z-10 mt-auto ml-4 mb-4 bg-white/95 backdrop-blur p-4 rounded-lg shadow-lg border border-[#c1c7cf] max-w-xs transition-all">
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                      Selected Courier Tracker
                    </span>
                    <h4 className="font-bold text-primary mt-1.5 text-xs">{selectedRoute.routeName}</h4>
                    
                    <div className="space-y-1.5 text-[11px] mt-2 border-t border-slate-100 pt-2 text-slate-700">
                      <div className="flex justify-between">
                        <span>Active Courier:</span>
                        <span className="font-bold text-slate-900">{selectedRoute.courierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETA to Main Lab:</span>
                        <span className="font-bold text-secondary">{selectedRoute.etaMinutes} mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Specimens carry:</span>
                        <span className="font-bold text-slate-900">{selectedRoute.totalSamples} ({selectedRoute.urgentSamples} Urgent)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Courier Phone:</span>
                        <span className="font-bold text-slate-800">{selectedRoute.courierPhone}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Route completion</p>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-secondary h-full" style={{ width: `${selectedRoute.progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Side list of all routes (col-span-4) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white border border-[#c1c7cf] p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-primary text-xs uppercase tracking-wider mb-3">All Active Transit Vehicles</h3>
                    
                    <div className="space-y-3">
                      {routes.map(r => (
                        <div 
                          key={r.id}
                          onClick={() => setSelectedRoute(r)}
                          className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                            selectedRoute.id === r.id 
                              ? 'bg-secondary-container border-emerald-400 font-semibold' 
                              : 'bg-slate-50 border-slate-250 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-bold text-xs text-primary">{r.routeName}</p>
                              <p className="text-slate-500 text-[11px] mt-0.5">Courier: {r.courierName}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[9px] font-bold uppercase rounded">
                              {r.etaMinutes} mins ETA
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2.5 text-[10px] text-slate-600 border-t border-slate-200/60 pt-2">
                            <div>
                              <span className="font-bold">Urgent assays:</span>
                              <span className="ml-1 text-red-600 font-bold">{r.urgentSamples}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">Total load:</span>
                              <span className="ml-1 text-slate-900 font-bold">{r.totalSamples}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-805 leading-relaxed space-y-2">
                    <h4 className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Cold-Chain compliance policy
                    </h4>
                    <p className="font-medium text-amber-900">
                      All clinical courier bags maintain standard +2°C to +8°C temperature parameters. Real-time logging telemetry is streamed automatically. Any deviation triggers immediate dispatch notification.
                    </p>
                  </div>
                </div>

              </div>

              {/* Sri Lankan GP Clinic Collections Register Component */}
              <div className="bg-white border border-[#c1c7cf] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-secondary/20 pb-3 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                      GP Care Portal Synchronizer Node
                    </span>
                    <h3 className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">local_shipping</span>
                      Clinic Sample Collection Log (Central LIS)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 p-1.5 rounded-lg border border-slate-200/80">
                    <span className="text-secondary font-bold">Total Transit Bags: {collections.filter(c => c.status === 'COLLECTED').length}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">Delivered: {collections.filter(c => c.status === 'DELIVERED').reduce((sum, c) => sum + c.sampleCount, 0)} Samples</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {collections.map(col => (
                    <div 
                      key={col.id} 
                      className={`p-4 border rounded-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                        col.status === 'PENDING' ? 'bg-slate-50 border-slate-200' :
                        col.status === 'COLLECTED' ? 'bg-[#dee8ff]/30 border-[#9ab3f5]' :
                        'bg-emerald-50/25 border-emerald-200'
                      }`}
                    >
                      {/* Status indicator pill top right */}
                      <span className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        col.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        col.status === 'COLLECTED' ? 'bg-indigo-150 text-[#003b5c] border border-blue-200' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {col.status}
                      </span>

                      <div className="space-y-2">
                        {/* Clinic name */}
                        <div>
                          <p className="font-bold text-slate-900 text-xs truncate pr-16" title={col.clinicName}>
                            🏥 {col.clinicName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Route Dispatch: {col.dispatchNumber || col.id}
                          </p>
                        </div>

                        {/* Driver details */}
                        <div className="bg-white border border-slate-200 p-2 rounded-lg text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Driver:</span>
                            <span className="font-bold text-zinc-900">{col.driverName}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Phone:</span>
                            <span className="font-mono text-zinc-900 font-bold">{col.driverPhone}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Vehicle ID:</span>
                            <span className="font-mono text-primary font-bold">{col.vehicleNo}</span>
                          </div>
                        </div>

                        {/* Samples count */}
                        <div className="flex items-center justify-between text-xs font-bold pt-1">
                          <span className="text-slate-500">Samples Scheduled:</span>
                          <span className="text-secondary font-black text-xs font-mono">{col.sampleCount} Vials</span>
                        </div>
                        {(col.labName || col.issuedPersonName) && (
                          <div className="bg-white border border-slate-200 p-2 rounded-lg text-[11px] space-y-1">
                            {col.labName && (
                              <div className="flex justify-between text-slate-600 gap-2">
                                <span>Lab:</span>
                                <span className="font-bold text-zinc-900 text-right">{col.labName}</span>
                              </div>
                            )}
                            {col.issuedPersonName && (
                              <div className="flex justify-between text-slate-600 gap-2">
                                <span>Issued by:</span>
                                <span className="font-bold text-zinc-900 text-right">{col.issuedPersonName}</span>
                              </div>
                            )}
                            {col.issuedDate && (
                              <div className="flex justify-between text-slate-600 gap-2">
                                <span>Issued date:</span>
                                <span className="font-mono text-zinc-900 font-bold">{col.issuedDate}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Collect / Deliver Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2">
                        <button
                          disabled={col.status !== 'PENDING'}
                          onClick={() => {
                            // Mark Collected & automatically sync with GP Care portal
                            patchCollection(col.id, { status: 'COLLECTED', collectedAt: new Date().toLocaleTimeString() });
                            
                            // Send sync live notification
                            const newNotif: UrgentNotification = {
                              id: String(Date.now()),
                              type: 'INFO',
                              title: 'GP PORTAL SYNC',
                              message: `[GP Care Portal] Driver ${col.driverName} (${col.vehicleNo}) has COLLECTED ${col.sampleCount} samples from ${col.clinicName}. Sync channel OK.`,
                              timeAgo: 'Just now',
                              timestamp: new Date()
                            };
                            setNotifications(prev => [newNotif, ...prev]);
                            alert(`[EHR GP Sync Success] Driver ${col.driverName} marked as Collected from "${col.clinicName}". Sync link verified.`);
                          }}
                          className="py-1.5 bg-primary hover:bg-[#0c4a6e] text-white text-[10px] font-extrabold rounded-lg disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Collected</span>
                        </button>

                        <button
                          disabled={col.status !== 'COLLECTED'}
                          onClick={() => {
                            // Mark Delivered & automatically log to central lab list
                            patchCollection(col.id, { status: 'DELIVERED', deliveredAt: new Date().toLocaleTimeString() });
                            
                            // Send sync live notification
                            const newNotif: UrgentNotification = {
                              id: String(Date.now()),
                              type: 'INFO',
                              title: 'DELIVERED SECURE',
                              message: `[Central Lab Gateway] Driver ${col.driverName} safely DELIVERED ${col.sampleCount} specimens from ${col.clinicName} to LankaLab Patholabs main terminal.`,
                              timeAgo: 'Just now',
                              timestamp: new Date()
                            };
                            setNotifications(prev => [newNotif, ...prev]);
                            alert(`[Pathology LIS Confirm] Courier ${col.driverName} has delivered ${col.sampleCount} samples to LankaLab Central Patholab. Automated check-in logged.`);
                          }}
                          className="py-1.5 bg-secondary hover:bg-emerald-800 text-white text-[10px] font-extrabold rounded-lg disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Delivered</span>
                        </button>
                      </div>

                      {/* Timestamps details */}
                      {col.collectedAt && (
                        <div className="mt-2 text-[9px] text-slate-400 font-mono space-y-0.5 border-t border-slate-100 pt-1">
                          <div className="flex justify-between border-b border-dashed border-slate-100 pb-0.5">
                            <span>Collected:</span>
                            <span>{col.collectedAt}</span>
                          </div>
                          {col.deliveredAt && (
                            <div className="flex justify-between text-emerald-700 font-bold">
                              <span>Arrived Lab:</span>
                              <span>{col.deliveredAt}</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>

                {/* Lab person overall collection logs view */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-650 space-y-2">
                  <p className="font-bold uppercase text-[9px] tracking-wider text-slate-500">Laboratory Operations Registry Overview</p>
                  <p className="text-zinc-700">Lab Personnel are monitoring real-time GP clinic collections. Clicking <b>Collected</b> automatically synchronizes with the clinic's healthcare portal, registering the courier's GPS token. Clicking <b>Delivered</b> safely reconciles the cold-baskets inside Colombo Central Patholab. All actions update the audit and notification queues instantly.</p>
                </div>
              </div>

            </div>
          )}

          {/* Active Tab: Integration & Ecosystem Sync */}
          {activeTab === 'integration' && (
            <IntegrationHub 
              orders={orders}
              onAddOrder={handleAddOrder}
              onUpdateOrders={setOrders}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              notifications={notifications}
              setNotifications={setNotifications}
            />
          )}

          {(activeTab === 'biz-daily' || activeTab === 'biz-expenses' || activeTab === 'biz-dues' || activeTab === 'biz-activities' || activeTab === 'biz-referrals' || activeTab === 'biz-analysis' || activeTab === 'biz-export') && (
            <BusinessHub
              orders={orders}
              panel={
                activeTab === 'biz-expenses'
                  ? 'expenses'
                  : activeTab === 'biz-dues'
                    ? 'dues'
                    : activeTab === 'biz-activities'
                      ? 'activities'
                      : activeTab === 'biz-referrals'
                        ? 'referrals'
                        : activeTab === 'biz-analysis'
                          ? 'analysis'
                          : activeTab === 'biz-export'
                            ? 'export'
                            : 'daily'
              }
            />
          )}

          {/* Active Tab: Billing & Finance Section */}
          {activeTab === 'billing' && (
            <BillingDashboard 
              orders={orders} 
            />
          )}

          {/* Active Tab: Suwasiri Digital Health Gateway */}
          {activeTab === 'suwasiri' && (
            <SuwasiriGateway 
              orders={orders}
              onSelectOrder={setSelectedOrder}
              onNavigateToOverview={() => setActiveTab('overview')}
            />
          )}

          {(activeTab === 'manage-logins' || activeTab === 'manage-doctors' || activeTab === 'manage-employees' || activeTab === 'manage-diagnofy' || activeTab === 'manage-browser') && (
            <ManageHub
              panel={
                activeTab === 'manage-doctors'
                  ? 'doctors'
                  : activeTab === 'manage-employees'
                    ? 'employees'
                    : activeTab === 'manage-diagnofy'
                      ? 'diagnofy'
                      : activeTab === 'manage-browser'
                        ? 'browser'
                        : 'logins'
              }
            />
          )}

          {/* Active Tab: System & Gateway Settings */}
          {activeTab === 'settings' && (
            <SettingsSection orders={orders} initialTab="facility" />
          )}

        </main>
      </div>

      {isNewOrderOpen && (
        <OrderForm 
          onClose={() => setIsNewOrderOpen(false)}
          onAddOrder={handleAddOrder}
        />
      )}

      {deliveryEnteringId && orders.find((o) => o.id === deliveryEnteringId) && (
        <EnterResultsPage
          order={orders.find((o) => o.id === deliveryEnteringId)!}
          onCancel={() => {
            const current = orders.find((o) => o.id === deliveryEnteringId);
            setDeliveryEnteringId(null);
            if (current?.status === 'COMPLETED') {
              setSelectedOrder(current);
              setCurrentPage(1);
              setActiveTab('overview');
            }
          }}
          onSave={(results, extra) => {
            const current = orders.find((o) => o.id === deliveryEnteringId);
            if (current) persistEnteredResults(current, results, extra, 'save');
          }}
          onFinal={(results, extra) => {
            const current = orders.find((o) => o.id === deliveryEnteringId);
            if (current) persistEnteredResults(current, results, extra, 'final');
          }}
          onSignOff={(results, extra) => {
            const current = orders.find((o) => o.id === deliveryEnteringId);
            setDeliveryEnteringId(null);
            if (current) persistEnteredResults(current, results, extra, 'sign');
          }}
        />
      )}
    </div>
  );
}

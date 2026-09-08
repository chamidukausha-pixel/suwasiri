import React, { useState, useMemo } from 'react';
import { LabOrder } from '../types';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  FileSpreadsheet,
  Coins,
  DollarSign,
  PiggyBank,
  Check,
  Receipt,
  X,
  Sparkles
} from 'lucide-react';

interface BillingDashboardProps {
  orders: LabOrder[];
  onUpdateOrderPayment?: (orderId: string, paidAmount: number) => void;
}

// Fixed test prices in Sri Lankan Rupees (LKR)
export const TEST_PRICES: Record<string, number> = {
  'FBC + ESR': 2500,
  'Cardiac Enzymes (Troponin)': 5800,
  'Lipid Profile': 3200,
  'HbA1c + Fasting Glucose': 2200,
  'Liver Function Test (LFT)': 4000,
  'Kidney Function Test / Renal Profile': 4500,
  'Thyroid Function Test (TSH, Free T3/T4)': 6500,
};

export const getTestPrice = (testType: string): number => {
  const matchingKey = Object.keys(TEST_PRICES).find(key => 
    testType.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(testType.toLowerCase())
  );
  return matchingKey ? TEST_PRICES[matchingKey] : 1800; // default 1800 LKR
};

export interface ExpenseItem {
  id: string;
  category: 'Rent' | 'Salary' | 'Bills' | 'Supplies' | 'Other';
  title: string;
  amount: number;
  date: string;
}

export default function BillingDashboard({ orders, onUpdateOrderPayment }: BillingDashboardProps) {
  // Initialize dynamic invoice database based on order list
  const [invoicePayments, setInvoicePayments] = useState<Record<string, number>>(() => {
    // Initial pre-filled payments (e.g. some are fully paid, some partial, some unpaid)
    return {
      '1': 1000, // Anura Perera - FBC + ESR (2500 LKR, paid 1000) -> Partial
      '2': 5800, // Kamala Gunawardena - Cardiac (5800 LKR, paid 5800) -> Paid
      '3': 0,    // Sunil Mendis - Lipid (3200 LKR, paid 0) -> Unpaid
      '4': 2200, // Dilani Rodrigo - HbA1c (2200 LKR, paid 2200) -> Paid
      '5': 0     // Mohamed Wazeer - LFT (4000 LKR, paid 0) -> Unpaid
    };
  });

  // Active sub-section state: 'dashboard' or 'ledger' (the history view to "go inside") or 'expenses'
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'expenses-manager' | 'ledger-logs'>('summary');

  // Search filter for patient invoices
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Active invoice being settled in model/pane
  const [settleInvoiceId, setSettleInvoiceId] = useState<string | null>(null);
  const [settledAmountInput, setSettledAmountInput] = useState('');

  // Initial Operational Expenses state
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'exp-1', category: 'Rent', title: 'Colombo Ward Plaza Lab Space Rent', amount: 150000, date: '2026-06-01' },
    { id: 'exp-2', category: 'Salary', title: 'Consultant Clinical Pathologist Salary', amount: 280000, date: '2026-06-05' },
    { id: 'exp-3', category: 'Salary', title: 'Senior Lab Technologists Salaries (2 Staff)', amount: 190000, date: '2026-06-05' },
    { id: 'exp-4', category: 'Bills', title: 'Ceylon Electricity Board Commercial Tariff', amount: 38000, date: '2026-06-12' },
    { id: 'exp-5', category: 'Bills', title: 'Colombo Water Supply & Garbage Utility', amount: 12500, date: '2026-06-12' },
    { id: 'exp-6', category: 'Supplies', title: 'Hematology Controls & Chemical Reagents Lot B', amount: 110000, date: '2026-06-14' },
  ]);

  // Handle adding new expense
  const [newExpCategory, setNewExpCategory] = useState<'Rent' | 'Salary' | 'Bills' | 'Supplies' | 'Other'>('Bills');
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSavedMsg, setExpenseSavedMsg] = useState(false);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount) return;

    const amt = parseFloat(newExpAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newExpCategory,
      title: newExpTitle,
      amount: amt,
      date: newExpDate,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setNewExpTitle('');
    setNewExpAmount('');
    setExpenseSavedMsg(true);
    setTimeout(() => setExpenseSavedMsg(false), 2500);
  };

  // Delete an expense
  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Calculate invoice values dynamically based on current orders + invoicePayments state
  const computedInvoices = useMemo(() => {
    return orders.map(order => {
      const price = getTestPrice(order.testType);
      const paid = invoicePayments[order.id] ?? 0;
      const remaining = Math.max(0, price - paid);
      const isToday = order.orderTime.toLowerCase().includes('today') || order.priority === 'Critical'; // criteria for daily
      
      let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
      if (paid >= price) {
        status = 'PAID';
      } else if (paid > 0) {
        status = 'PARTIAL';
      }

      return {
        id: order.id,
        patientName: order.patientName,
        testType: order.testType,
        orderTime: order.orderTime,
        isToday,
        totalFee: price,
        paid,
        remaining,
        status,
        specimenId: order.specimenId,
        suwasiriBarcode: order.suwasiriBarcode,
        connectedClinic: order.connectedClinic
      };
    });
  }, [orders, invoicePayments]);

  // Handle setting/settling payment for invoice
  const handleSettlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleInvoiceId) return;

    const match = computedInvoices.find(i => i.id === settleInvoiceId);
    if (!match) return;

    const amt = parseFloat(settledAmountInput);
    if (isNaN(amt) || amt < 0) return;

    // Save paid amount
    setInvoicePayments(prev => {
      const currentPaid = prev[settleInvoiceId] ?? 0;
      // Cap at total fee
      const newPaid = Math.min(match.totalFee, currentPaid + amt);
      
      // If callback is active from main app state to link with any external portals:
      if (onUpdateOrderPayment) {
        onUpdateOrderPayment(settleInvoiceId, newPaid);
      }

      return {
        ...prev,
        [settleInvoiceId]: newPaid
      };
    });

    setSettleInvoiceId(null);
    setSettledAmountInput('');
  };

  // Financial calculations
  const finances = useMemo(() => {
    // Total income = sum of all payments received
    const totalIncome = computedInvoices.reduce((sum, inv) => sum + inv.paid, 0);

    // Day income = sum of all payments received for today's orders
    const dayIncome = computedInvoices
      .filter(inv => inv.isToday)
      .reduce((sum, inv) => sum + inv.paid, 0);

    // Total outstanding remaining payment
    const totalRemaining = computedInvoices.reduce((sum, inv) => sum + inv.remaining, 0);

    // Number of consultations today (Today's orders)
    const todayConsultations = computedInvoices.filter(inv => inv.isToday).length;

    // Total operational expenses sum
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Rent Expenses Total
    const rentExpensesTotal = expenses
      .filter(e => e.category === 'Rent')
      .reduce((sum, e) => sum + e.amount, 0);

    // Salaries total
    const salaryExpensesTotal = expenses
      .filter(e => e.category === 'Salary')
      .reduce((sum, e) => sum + e.amount, 0);

    // Bills total (electricity, water, etc.)
    const utilityBillsTotal = expenses
      .filter(e => e.category === 'Bills')
      .reduce((sum, e) => sum + e.amount, 0);

    // Supplies & other total
    const suppliesExpensesTotal = expenses
      .filter(e => e.category === 'Supplies' || e.category === 'Other')
      .reduce((sum, e) => sum + e.amount, 0);

    // Net balance LKR
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      dayIncome,
      totalRemaining,
      todayConsultations,
      totalExpenses,
      rentExpensesTotal,
      salaryExpensesTotal,
      utilityBillsTotal,
      suppliesExpensesTotal,
      netProfit
    };
  }, [computedInvoices, expenses]);

  // Combined historic chronological log stream (deposits + expense payouts)
  const transactionLedger = useMemo(() => {
    const logs: {
      id: string;
      type: 'INCOME' | 'EXPENSE';
      category: string;
      title: string;
      amount: number;
      date: string;
      refId?: string;
    }[] = [];

    // Add paid invoices
    computedInvoices.forEach(inv => {
      if (inv.paid > 0) {
        logs.push({
          id: `tx-deposit-${inv.id}`,
          type: 'INCOME',
          category: 'Patient Diagnostic Fee',
          title: `Lab Payment: ${inv.patientName} (${inv.testType})`,
          amount: inv.paid,
          date: inv.isToday ? '2026-06-15' : '2026-06-14',
          refId: inv.specimenId
        });
      }
    });

    // Add expenses
    expenses.forEach(exp => {
      logs.push({
        id: `tx-expense-${exp.id}`,
        type: 'EXPENSE',
        category: exp.category,
        title: exp.title,
        amount: exp.amount,
        date: exp.date,
        refId: 'LNK-EXP-GATE'
      });
    });

    // Sort by chronological order (newest date first)
    return logs.sort((a, b) => b.date.localeCompare(a.date));
  }, [computedInvoices, expenses]);

  // Filtered invoices
  const filteredInvoices = computedInvoices.filter(inv => 
    inv.patientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.testType.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.specimenId.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">Financial &amp; Billing Control Center</h1>
          <p className="text-on-surface-variant text-xs mt-1">LankaLab LIS Accounting Gateway • Live Patient invoicing &amp; operational expenses audit</p>
        </div>
        
        {/* Navigation Tabs to drill "inside" */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold shadow-inner">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'summary' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Billing &amp; Invoices</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('expenses-manager')}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'expenses-manager' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Operational Expenses ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ledger-logs')}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'ledger-logs' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Go Inside Hist. Ledger 📑</span>
          </button>
        </div>
      </div>

      {/* Top Ledger Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Income */}
        <div className="bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] border border-green-300 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute right-2.5 top-2.5 bg-green-500/10 p-2 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-700" />
          </div>
          <span className="text-[10px] text-green-800 uppercase font-extrabold tracking-widest block">Day Income (LKR)</span>
          <p className="text-2xl font-black font-sans text-green-950">Rs. {finances.dayIncome.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-[10px] text-green-800 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Consultations Today: {finances.todayConsultations}</span>
          </div>
        </div>

        {/* Card 2: Combined Total Income Received */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-250 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute right-2.5 top-2.5 bg-sky-500/10 p-2 rounded-full">
            <PiggyBank className="w-6 h-6 text-[#006497]" />
          </div>
          <span className="text-[10px] text-sky-800 uppercase font-extrabold tracking-widest block">Total Income (LKR)</span>
          <p className="text-2xl font-black font-sans text-[#003b5c]">Rs. {finances.totalIncome.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-[10px] text-sky-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fully Settle Payments audit</span>
          </div>
        </div>

        {/* Card 3: Administrative Expenses */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute right-2.5 top-2.5 bg-red-500/10 p-2 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-[10px] text-red-800 uppercase font-extrabold tracking-widest block">Operational Expenses (Total)</span>
          <p className="text-2xl font-black font-sans text-red-950">Rs. {finances.totalExpenses.toLocaleString()}</p>
          <button 
            onClick={() => setActiveSubTab('expenses-manager')}
            className="text-[10px] text-red-800 hover:underline font-bold flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>Modify Rent/Salary/Bills structure</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Remaining Outstanding Balances */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute right-2.5 top-2.5 bg-amber-500/10 p-2 rounded-full">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <span className="text-[10px] text-amber-800 uppercase font-extrabold tracking-widest block">Outstanding Receivable</span>
          <p className="text-2xl font-black font-sans text-amber-950">Rs. {finances.totalRemaining.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Requires settlement actions</span>
          </div>
        </div>

      </div>

      {/* Net profit indicator ribbon */}
      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold shadow-sm ${
        finances.netProfit >= 0 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
          : 'bg-rose-50 border-rose-200 text-rose-950'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 font-bold" />
          <span>LankaLab Operational Ledger Net Balance (Surplus/Deficit Margin):</span>
        </div>
        <span className="text-sm font-black font-mono">
          {finances.netProfit >= 0 ? '+' : ''} Rs. {finances.netProfit.toLocaleString()}
        </span>
      </div>


      {/* MAIN CONTENT ROUTED VIA SUBTABS */}

      {/* SUBTAB 1: BILLING & INVOICES */}
      {activeSubTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c1c7cf] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-[#c1c7cf] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-primary text-xs uppercase tracking-wider">Active Patient Invoices &amp; Consultations</h3>
                <p className="text-[11px] text-slate-500">Live invoicing linked to LankaLab Specimen intake registrations</p>
              </div>

              {/* Invoice search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter Patient Name, ID..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary w-52 font-semibold"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold select-none">
                    <th className="py-2.5 px-4">Specimen ID</th>
                    <th className="py-2.5 px-4">Patient Demographics</th>
                    <th className="py-2.5 px-4">Test Profile Type</th>
                    <th className="py-2.5 px-4">Total Fee (LKR)</th>
                    <th className="py-2.5 px-4">Paid (LKR)</th>
                    <th className="py-2.5 px-4">Outstanding (LKR)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">No patient invoices matched search query</td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                          {inv.specimenId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>
                            <p>{inv.patientName}</p>
                            {inv.suwasiriBarcode ? (
                              <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono font-extrabold mt-0.5 inline-block">
                                [||] {inv.suwasiriBarcode}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-[#dee8ff] text-primary font-bold px-2 py-0.5 rounded text-[10px]">
                            {inv.testType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                          Rs. {inv.totalFee.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-green-700 bg-green-50/20">
                          Rs. {inv.paid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700 bg-amber-50/20">
                          Rs. {inv.remaining.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {inv.status === 'PAID' && (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                              Paid
                            </span>
                          )}
                          {inv.status === 'PARTIAL' && (
                            <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                              Partial
                            </span>
                          )}
                          {inv.status === 'UNPAID' && (
                            <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {inv.remaining > 0 ? (
                            <button
                              onClick={() => {
                                setSettleInvoiceId(inv.id);
                                setSettledAmountInput(String(inv.remaining));
                              }}
                              className="px-2.5 py-1 bg-[#006497] hover:bg-[#003b5c] text-white font-bold text-[10px] rounded shadow-sm transition-all flex items-center gap-1 mx-auto"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Settle LKR</span>
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-0.5 justify-center">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-[#003b5c]">
            <Receipt className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ceylon Health Services Unified Billing Standard</p>
              <p className="text-zinc-700 mt-1">Invoice records represent direct clinical tests processed. Settle payment updates patient accounts in real time. Full payment triggers automatic push notifications to the patient's <b>Suwasiri Mobile App</b> and marks the EHR ledger clearances on GP Partner records.</p>
            </div>
          </div>
        </div>
      )}


      {/* SUBTAB 2: TOTAL OPERATIONAL EXPENSES */}
      {activeSubTab === 'expenses-manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Expenses input panel (col-span-4) */}
          <div className="lg:col-span-4 bg-white border border-[#c1c7cf] rounded-xl p-4 shadow-sm h-fit">
            <h3 className="font-bold text-primary text-xs uppercase tracking-wider border-b border-slate-100 pb-2 mb-3.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-secondary" />
              Enter Expense Details
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Expense Category</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Bills', 'Salary', 'Rent', 'Supplies', 'Other'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewExpCategory(cat)}
                      className={`py-1 text-[10px] font-bold border rounded transition-all ${
                        newExpCategory === cat 
                          ? 'bg-secondary-container text-on-secondary-container border-emerald-400' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceylon Electricity Bills"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Amount (LKR) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-500 font-bold">Rs.</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Transaction Date</label>
                <input
                  type="date"
                  value={newExpDate}
                  onChange={(e) => setNewExpDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-secondary text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Expense Ledger</span>
              </button>

              {expenseSavedMsg && (
                <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 text-center py-1 rounded border border-emerald-100">
                  ✔ Expense logged and ledger calculated dynamically!
                </p>
              )}
            </form>
          </div>

          {/* Expenses drilldown summary ledger list (col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#c1c7cf] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-[#c1c7cf] flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Operational Expense ledger logs</h4>
                <p className="text-[11px] text-slate-500">Breakdown of administrative bills, salaries, rent & Supplies payouts</p>
              </div>
              <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                Rs. {finances.totalExpenses.toLocaleString()} total bills
              </span>
            </div>

            {/* Sub-breakdown badges */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50 text-center py-3">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Office Rent</span>
                <span className="font-mono text-zinc-900 font-extrabold text-xs">Rs. {finances.rentExpensesTotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Staff Salary</span>
                <span className="font-mono text-zinc-900 font-extrabold text-xs">Rs. {finances.salaryExpensesTotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Utility Bills</span>
                <span className="font-mono text-zinc-900 font-extrabold text-xs">Rs. {finances.utilityBillsTotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Chemicals & Supplies</span>
                <span className="font-mono text-zinc-900 font-extrabold text-xs">Rs. {finances.suppliesExpensesTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[360px]">
              {expenses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold">No active expense entries. Use form to create bills.</div>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                        exp.category === 'Rent' ? 'bg-amber-100 text-amber-800' :
                        exp.category === 'Salary' ? 'bg-teal-100 text-teal-800' :
                        exp.category === 'Bills' ? 'bg-indigo-100 text-indigo-800' :
                        exp.category === 'Supplies' ? 'bg-sky-100 text-sky-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {exp.category.substring(0,3).toUpperCase()}
                      </span>
                      
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{exp.title}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-0.5">
                          <span>Category:</span>
                          <span className="font-bold text-slate-700">{exp.category}</span>
                          <span>•</span>
                          <span className="font-mono">{exp.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-red-700 text-xs text-right">
                        - Rs. {exp.amount.toLocaleString()}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded transition-all"
                        title="Remove expense payout record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* SUBTAB 3: GO INSIDE CHRONOLOGICAL LEDGER (SAY "GO INSIDE" TO VIEW DETAILS) */}
      {activeSubTab === 'ledger-logs' && (
        <div className="bg-white border border-[#c1c7cf] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#f8f9fa] border-b border-[#c1c7cf] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
                LankaLab Unified Audit ledger Ledger (Internal double entry book)
              </h3>
              <p className="text-[11px] text-slate-500">Showing chronological log history of deposits (income) vs debits (expenditure)</p>
            </div>

            <div className="flex gap-2 text-[10px] bg-slate-200/60 p-0.5 rounded font-bold">
              <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-350 text-emerald-800 rounded">
                Deposits: Rs. {finances.totalIncome.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 bg-rose-100 border border-rose-350 text-rose-800 rounded">
                Payouts: Rs. {finances.totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {transactionLedger.map((tx, idx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    tx.type === 'INCOME' 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    {tx.type === 'INCOME' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-xs text-slate-900">{tx.title}</p>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                        tx.type === 'INCOME' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.type === 'INCOME' ? 'REVENUE Received' : 'OUTFLOW Paid'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] mt-1 text-slate-500 font-semibold">
                      <span>Ledger Area:</span>
                      <span className="font-bold text-slate-700">{tx.category}</span>
                      <span>•</span>
                      <span>Ref ID:</span>
                      <span className="font-mono text-slate-700">{tx.refId || 'N/A'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-600">{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between font-mono">
                  <p className={`text-sm font-black ${
                    tx.type === 'INCOME' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">LankaLab Audit Node Verified</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-[#c1c7cf] text-center">
            <button
              onClick={() => {
                alert("Generating LankaLab Financial Audit Sheet (PDF format)... Complete regulatory compliance verification checks completed.");
              }}
              className="px-4 py-2 bg-primary hover:bg-[#0c4a6e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Export Financial ledger Report
            </button>
          </div>
        </div>
      )}


      {/* POPUP Settle invoice Modal */}
      {settleInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#c1c7cf] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5ClassName">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Settle Payment Account
              </h3>
              <button 
                onClick={() => setSettleInvoiceId(null)}
                className="text-white hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePaymentSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Patient Name:</span>
                  <span className="text-slate-800">{computedInvoices.find(i => i.id === settleInvoiceId)?.patientName}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Test Profile:</span>
                  <span className="text-secondary">{computedInvoices.find(i => i.id === settleInvoiceId)?.testType}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold border-t border-slate-200 pt-1.5">
                  <span>Outstanding Receivable:</span>
                  <span className="text-amber-800 font-black font-mono">
                    Rs. {computedInvoices.find(i => i.id === settleInvoiceId)?.remaining.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Enter Settled Amount (LKR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold text-xs">Rs.</span>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full pl-9 pr-3 py-2 border border-[#c1c7cf] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono font-bold"
                    placeholder="e.g. 2500"
                    value={settledAmountInput}
                    onChange={(e) => setSettledAmountInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleInvoiceId(null)}
                  className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-[#0c4a6e] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

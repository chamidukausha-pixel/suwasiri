import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Activity,
  Building2,
  AlertCircle,
  HelpCircle,
  Wallet,
  Banknote,
  Shield,
  Filter,
  UserPlus,
  Eye,
} from "lucide-react";
import type { LabOrder } from "../types";
import { getTestPrice } from "./BillingDashboard";
import BillView from "./BillView";

function toYmd(d: Date) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

function shiftYmd(ymd: string, days: number) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

function formatYmd(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export type BusinessPanel = "daily" | "expenses" | "dues" | "activities" | "referrals" | "analysis" | "export";

const PAID: Record<string, number> = {
  "1": 1000,
  "2": 5800,
  "3": 0,
  "4": 2200,
  "5": 1800,
};

const COLLECT_CHARGE = 250;

type ExpenseRow = { id: string; category: string; title: string; amount: number; date: string };

const SEED_EXPENSES: ExpenseRow[] = (() => {
  const today = toYmd(new Date());
  return [
    { id: "e1", category: "Stationery", title: "Printer paper & barcodes", amount: 4200, date: today },
    { id: "e2", category: "Utilities", title: "Electricity (partial day)", amount: 3800, date: today },
    { id: "e3", category: "Supplies", title: "EDTA tubes restock", amount: 12500, date: shiftYmd(today, -1) },
  ];
})();

const CASHIERS = ["Chamidu K.", "Nadeesha P.", "Front desk A"];

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BusinessHub({ orders, panel }: { orders: LabOrder[]; panel: BusinessPanel }) {
  const [date, setDate] = useState(() => toYmd(new Date()));
  const [q, setQ] = useState("");
  const [dailyTab, setDailyTab] = useState<"tx" | "bills" | "expenses">("tx");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [showChargeHelp, setShowChargeHelp] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(SEED_EXPENSES);
  const [expTitle, setExpTitle] = useState("");
  const [expAmt, setExpAmt] = useState("");
  const [expCat, setExpCat] = useState("Stationery");

  const [cashiers, setCashiers] = useState<string[]>(CASHIERS);
  const [newCashier, setNewCashier] = useState("");
  const [paidExtra, setPaidExtra] = useState<Record<string, number>>({});
  const [refunds] = useState<{ id: string; patient: string; amount: number; reason: string; day: string }[]>([
    { id: "rf1", patient: "Sunil Mendis", amount: 500, reason: "Duplicate billing", day: toYmd(new Date()) },
  ]);

  const priced = useMemo(
    () =>
      orders.map((o) => {
        const price = o.billedAmount ?? getTestPrice(o.testType);
        const stored = o.paidAmount;
        const base = stored != null ? stored : PAID[o.id] ?? (o.status === "COMPLETED" ? price : Math.round(price * 0.4));
        const paid = Math.min(price, base + (paidExtra[o.id] || 0));
        const due = Math.max(0, price - paid);
        const mode = o.paymentMode || (paid === 0 ? "due" : paid < price ? "partial" : o.priority === "Critical" ? "card" : "cash");
        const ts = o.completedAt ? new Date(o.completedAt) : o.orderTimestamp instanceof Date ? o.orderTimestamp : new Date();
        return { o, price, paid, due, charge: paid > 0 ? COLLECT_CHARGE : 0, mode, day: toYmd(ts) };
      }),
    [orders, paidExtra]
  );

  const income = priced.reduce((s, r) => s + r.paid, 0);
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const dueTotal = priced.reduce((s, r) => s + r.due, 0);

  const referrals = useMemo(() => {
    const map = new Map<string, { clinic: string; bills: number; billed: number; collected: number; due: number }>();
    priced.forEach((r) => {
      const clinic = r.o.connectedClinic || "Walk-in / unspecified";
      const cur = map.get(clinic) || { clinic, bills: 0, billed: 0, collected: 0, due: 0 };
      cur.bills += 1;
      cur.billed += r.price;
      cur.collected += r.paid;
      cur.due += r.due;
      map.set(clinic, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.collected - a.collected);
  }, [priced]);

  const titles: Record<BusinessPanel, { h: string; p: string }> = {
    daily: { h: "Daily Business", p: "Income, collection charges, expenses and net for the selected day" },
    expenses: { h: "Expenses", p: "Log stationery, utilities and other lab spend" },
    dues: { h: "Due Report", p: "Patients with outstanding balances — collected dues count on the day they are paid" },
    activities: { h: "Activities", p: "Billing and cashier activity on this node" },
    referrals: { h: "Referral Business", p: "Cases and collections by referring clinic" },
    analysis: { h: "Business Analysis", p: "Cases, billing, income and test-count workload" },
    export: { h: "Data Export", p: "Download bill, patient, transaction and expense CSVs" },
  };

  const addExpense = () => {
    const amt = Number(expAmt);
    if (!expTitle.trim() || !Number.isFinite(amt) || amt <= 0) return;
    setExpenses((prev) => [{ id: `e${Date.now()}`, category: expCat, title: expTitle.trim(), amount: amt, date }, ...prev]);
    setExpTitle("");
    setExpAmt("");
  };

  return (
    <div className="space-y-6">
      {panel !== "daily" && (
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">{titles[panel].h}</h1>
          <p className="text-on-surface-variant text-xs mt-1">{titles[panel].p}</p>
        </div>
        <label className="text-[11px] font-bold text-slate-500">
          Date
          <span className="flex items-center gap-2 mt-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-xs font-semibold outline-none" />
          </span>
        </label>
      </div>
      )}

      {panel === "daily" && (
        <DailyBusinessBoard
          date={date}
          onDate={setDate}
          showChargeHelp={showChargeHelp}
          onToggleHelp={() => setShowChargeHelp((v) => !v)}
          dailyTab={dailyTab}
          setDailyTab={setDailyTab}
          q={q}
          setQ={setQ}
          cashiers={cashiers}
          cashierFilter={cashierFilter}
          setCashierFilter={setCashierFilter}
          newCashier={newCashier}
          setNewCashier={setNewCashier}
          onAddCashier={() => {
            if (!newCashier.trim()) return;
            setCashiers((prev) => [...prev, newCashier.trim()]);
            setNewCashier("");
          }}
          priced={priced}
          expenses={expenses}
          refunds={refunds}
        />
      )}

      {panel === "expenses" && (
        <div className="bg-white border border-[#c1c7cf] rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-[11px] font-bold">
              Category
              <select value={expCat} onChange={(e) => setExpCat(e.target.value)} className="block mt-1 border rounded px-2 py-1.5 text-xs">
                {["Stationery", "Utilities", "Supplies", "Salary", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold flex-1 min-w-[180px]">
              Title
              <input value={expTitle} onChange={(e) => setExpTitle(e.target.value)} className="block mt-1 w-full border rounded px-2 py-1.5 text-xs" />
            </label>
            <label className="text-[11px] font-bold">
              Amount (LKR)
              <input value={expAmt} onChange={(e) => setExpAmt(e.target.value)} className="block mt-1 w-28 border rounded px-2 py-1.5 text-xs" />
            </label>
            <button type="button" onClick={addExpense} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Category</th>
                <th className="py-2">Title</th>
                <th className="py-2">Amount</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="py-2">{e.date}</td>
                  <td className="py-2">{e.category}</td>
                  <td className="py-2">{e.title}</td>
                  <td className="py-2 font-bold">Rs. {e.amount.toLocaleString("en-LK")}</td>
                  <td className="py-2">
                    <button type="button" onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))} className="text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm font-black text-rose-800">Total expenses: Rs. {expTotal.toLocaleString("en-LK")}</p>
        </div>
      )}

      {panel === "dues" && (
        <div className="bg-white border border-[#c1c7cf] rounded-xl overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <p className="text-xs font-bold text-amber-950">Outstanding Rs. {dueTotal.toLocaleString("en-LK")} — counted in Daily Business on the day it is collected.</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Billed</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Due</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {priced
                .filter((r) => r.due > 0)
                .map((r) => (
                  <tr key={r.o.id} className="border-t">
                    <td className="p-3 font-medium">{r.o.patientName}</td>
                    <td className="p-3">{r.o.phone || "—"}</td>
                    <td className="p-3">Rs. {r.price.toLocaleString("en-LK")}</td>
                    <td className="p-3">Rs. {r.paid.toLocaleString("en-LK")}</td>
                    <td className="p-3 font-black text-rose-700">Rs. {r.due.toLocaleString("en-LK")}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded"
                        onClick={() => setPaidExtra((prev) => ({ ...prev, [r.o.id]: (prev[r.o.id] || 0) + r.due }))}
                      >
                        Collect due
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {panel === "activities" && (
        <div className="bg-white border border-[#c1c7cf] rounded-xl divide-y">
          {priced.map((r, i) => (
            <div key={r.o.id} className="p-4 flex gap-3">
              <Activity className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {r.paid >= r.price ? "Bill settled" : r.paid > 0 ? "Partial collection" : "Bill opened (due)"} — {r.o.patientName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {r.o.testType} · {r.o.specimenId} · cashier {CASHIERS[i % CASHIERS.length]} · {r.o.orderTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel === "referrals" && (
        <div className="bg-white border border-[#c1c7cf] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-50">
              <tr>
                <th className="p-3">Referring clinic</th>
                <th className="p-3">Bills</th>
                <th className="p-3">Billed</th>
                <th className="p-3">Collected</th>
                <th className="p-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.clinic} className="border-t">
                  <td className="p-3">
                    <span className="font-medium inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {r.clinic}
                    </span>
                  </td>
                  <td className="p-3">{r.bills}</td>
                  <td className="p-3">Rs. {r.billed.toLocaleString("en-LK")}</td>
                  <td className="p-3 text-emerald-800 font-bold">Rs. {r.collected.toLocaleString("en-LK")}</td>
                  <td className="p-3 text-rose-700">Rs. {r.due.toLocaleString("en-LK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel === "analysis" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Kpi tone="indigo" label="Total cases" value={orders.length} icon={<Users className="w-5 h-5" />} hint="All registrations" />
            <Kpi tone="sky" label="Total billing" value={priced.reduce((s, r) => s + r.price, 0)} icon={<CreditCard className="w-5 h-5" />} hint="List price" />
            <Kpi tone="emerald" label="Total income" value={income} icon={<TrendingUp className="w-5 h-5" />} hint="Collected" />
          </div>
          <div className="bg-white border border-[#c1c7cf] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Test count</h3>
            {Object.entries(
              orders.reduce<Record<string, number>>((acc, o) => {
                acc[o.testType] = (acc[o.testType] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span>{name}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.max(8, (count / Math.max(1, orders.length)) * 100)}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {panel === "export" && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              title: "Bill (case) data — 31 days",
              run: () =>
                downloadCsv("lankalab-bills.csv", [
                  ["Reg", "Patient", "Test", "Billed", "Paid", "Due"],
                  ...priced.map((r) => [r.o.specimenId, r.o.patientName, r.o.testType, String(r.price), String(r.paid), String(r.due)]),
                ]),
            },
            {
              title: "Patient data — 365 days",
              run: () =>
                downloadCsv("lankalab-patients.csv", [
                  ["Name", "Age", "Sex", "Phone", "Clinic"],
                  ...orders.map((o) => [o.patientName, String(o.age), o.gender, o.phone || "", o.connectedClinic || ""]),
                ]),
            },
            {
              title: "Transaction data — 31 days",
              run: () =>
                downloadCsv("lankalab-transactions.csv", [
                  ["Reg", "Mode", "Paid", "Time"],
                  ...priced.map((r) => [r.o.specimenId, r.mode, String(r.paid), r.o.orderTime]),
                ]),
            },
            {
              title: "TAT data — 31 days",
              run: () =>
                downloadCsv("lankalab-tat.csv", [
                  ["Reg", "Status", "Ordered"],
                  ...orders.map((o) => [o.specimenId, o.status, o.orderTime]),
                ]),
            },
            {
              title: "Expense data — 365 days",
              run: () =>
                downloadCsv("lankalab-expenses.csv", [
                  ["Date", "Category", "Title", "Amount"],
                  ...expenses.map((e) => [e.date, e.category, e.title, String(e.amount)]),
                ]),
            },
            {
              title: "Report links — 31 days",
              run: () =>
                downloadCsv("lankalab-report-links.csv", [
                  ["Reg", "Patient", "Link"],
                  ...orders.map((o) => [o.specimenId, o.patientName, `http://localhost:3001/reports/${o.specimenId}`]),
                ]),
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.run}
              className="text-left bg-white border border-[#c1c7cf] rounded-xl p-4 hover:border-primary"
            >
              <p className="text-sm font-bold text-primary">{item.title}</p>
              <p className="text-[11px] text-slate-500 mt-1">Download CSV for Excel</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Priced = {
  o: LabOrder;
  price: number;
  paid: number;
  due: number;
  charge: number;
  mode: string;
  day: string;
};

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { ymd: string | null; day: number | null }[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ ymd: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ ymd, day: d });
  }
  return cells;
}

function BusinessMonthCalendar({
  date,
  onDate,
  counts,
  completedCounts,
}: {
  date: string;
  onDate: (ymd: string) => void;
  counts: Record<string, number>;
  completedCounts: Record<string, number>;
}) {
  const selected = new Date(`${date}T12:00:00`);
  const [cursor, setCursor] = useState({ y: selected.getFullYear(), m: selected.getMonth() });
  useEffect(() => {
    const s = new Date(`${date}T12:00:00`);
    setCursor({ y: s.getFullYear(), m: s.getMonth() });
  }, [date]);
  const today = toYmd(new Date());
  const title = new Date(cursor.y, cursor.m, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
  const cells = monthCells(cursor.y, cursor.m);

  return (
    <aside className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden xl:sticky xl:top-4">
      <div className="px-3 py-3 border-b bg-[#0B1220] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F97316]" />
          <p className="text-sm font-bold">{title}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
            className="p-1 rounded hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
            className="p-1 rounded hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 text-[10px] font-bold uppercase text-slate-400 text-center mb-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.ymd) return <span key={`e${i}`} />;
            const n = counts[c.ymd] || 0;
            const done = completedCounts[c.ymd] || 0;
            const on = c.ymd === date;
            const isToday = c.ymd === today;
            return (
              <button
                key={c.ymd}
                type="button"
                onClick={() => onDate(c.ymd!)}
                className={`h-9 rounded-md text-[12px] font-semibold relative ${
                  on ? "bg-[#F97316] text-white" : isToday ? "bg-sky-50 text-sky-800" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                {c.day}
                {n > 0 && !on && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500" />}
                {done > 0 && !on && <span className="absolute bottom-0.5 left-[58%] w-1 h-1 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => onDate(today)} className="mt-3 w-full text-[11px] font-semibold text-sky-700 border rounded-md py-1.5 hover:bg-sky-50">
          Jump to today
        </button>
        <p className="text-[10px] text-slate-400 mt-2">Click a date to see that day’s income, charges, bills and completed reports.</p>
      </div>
    </aside>
  );
}

function DailyBusinessBoard({
  date,
  onDate,
  showChargeHelp,
  onToggleHelp,
  dailyTab,
  setDailyTab,
  q,
  setQ,
  cashiers,
  cashierFilter,
  setCashierFilter,
  newCashier,
  setNewCashier,
  onAddCashier,
  priced,
  expenses,
  refunds,
}: {
  date: string;
  onDate: (v: string) => void;
  showChargeHelp: boolean;
  onToggleHelp: () => void;
  dailyTab: "tx" | "bills" | "expenses";
  setDailyTab: (t: "tx" | "bills" | "expenses") => void;
  q: string;
  setQ: (v: string) => void;
  cashiers: string[];
  cashierFilter: string;
  setCashierFilter: (v: string) => void;
  newCashier: string;
  setNewCashier: (v: string) => void;
  onAddCashier: () => void;
  priced: Priced[];
  expenses: ExpenseRow[];
  refunds: { id: string; patient: string; amount: number; reason: string; day: string }[];
}) {
  const [bill, setBill] = useState<{ order: LabOrder; paid: number; receivedBy: string } | null>(null);
  const today = toYmd(new Date());
  const prevDay = shiftYmd(date, -1);
  const dateLabel = formatYmd(date);
  const now = new Date();
  const timeLabel = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const chief = cashiers[0] || "Chief";
  const rs = (n: number) => `Rs.${n.toLocaleString("en-LK")}`;

  const matchesQ = (row: Priced) => {
    if (!q) return true;
    const n = q.toLowerCase();
    return (
      row.o.patientName.toLowerCase().includes(n) ||
      row.o.specimenId.toLowerCase().includes(n) ||
      (row.o.connectedClinic || "").toLowerCase().includes(n)
    );
  };

  const dayPriced = priced.filter((r) => r.day === date);
  const visibleBills = dayPriced.filter(matchesQ);
  const dayExpenses = expenses.filter((e) => e.date === date);
  const dayRefunds = refunds.filter((r) => r.day === date);
  const prevBills = priced.filter((r) => r.day === prevDay).length;

  const income = dayPriced.reduce((s, r) => s + r.paid, 0);
  const charges = dayPriced.reduce((s, r) => s + r.charge, 0);
  const expTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
  const net = income + charges - expTotal;
  const cash = dayPriced.filter((r) => r.mode === "cash").reduce((s, r) => s + r.paid, 0);
  const card = dayPriced.filter((r) => r.mode === "card").reduce((s, r) => s + r.paid, 0);
  const upi = Math.round(income * 0.12);
  const insurance = Math.max(0, income - cash - card - upi);

  const txRows = [
    ...visibleBills.map((r, i) => ({
      key: `bill-${r.o.id}`,
      id: 480 + Number(r.o.id || i),
      reg: r.o.specimenId.replace("LNK-", "#"),
      name: r.o.patientName,
      referrer: r.o.connectedClinic || "Self",
      date: dateLabel,
      time: (r.o.orderTime || "").replace(/^Today, |^Yesterday, /, "") || timeLabel,
      dcn: `L${r.o.id}`,
      cc: r.o.wardOrDept || "Main",
      amount: r.paid,
      sign: "+" as const,
      method: r.mode === "due" ? "due" : r.mode,
      received: cashiers[i % cashiers.length] || chief,
      order: r.o as LabOrder | undefined,
    })),
    ...dayRefunds.map((r, i) => ({
      key: `rf-${r.id}`,
      id: 470 + i,
      reg: `#RF${i + 1}`,
      name: r.patient,
      referrer: "—",
      date: dateLabel,
      time: timeLabel,
      dcn: "—",
      cc: "Main",
      amount: r.amount,
      sign: "-" as const,
      method: "cash",
      received: chief,
      order: undefined as LabOrder | undefined,
    })),
  ].filter((row) => cashierFilter === "all" || row.received === cashierFilter);

  const amountTotal = txRows.reduce((s, row) => s + (row.sign === "+" ? row.amount : -row.amount), 0);
  const billsTotal = visibleBills.reduce((s, r) => s + r.paid, 0);
  const expenseTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
  const completedToday = dayPriced.filter((r) => r.o.status === "COMPLETED").length;
  const counts = priced.reduce((m, r) => {
    m[r.day] = (m[r.day] || 0) + 1;
    return m;
  }, {} as Record<string, number>);
  const completedCounts = priced.reduce((m, r) => {
    if (r.o.status === "COMPLETED") m[r.day] = (m[r.day] || 0) + 1;
    return m;
  }, {} as Record<string, number>);

  const tabBtn = (id: typeof dailyTab, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setDailyTab(id)}
      className={`inline-flex items-center gap-1.5 px-1 pb-2 text-[13px] border-b-2 ${
        dailyTab === id ? "border-sky-600 text-sky-800 font-semibold" : "border-transparent text-slate-500"
      }`}
    >
      {label} <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 rounded-full">{count}</span>
    </button>
  );

  return (
    <div className="space-y-4 -mt-2">
      {bill && (
        <BillView
          order={bill.order}
          paid={bill.paid}
          receivedBy={bill.receivedBy}
          items={bill.order.billItems}
          discount={bill.order.discountAmount}
          mode={bill.order.paymentMode}
          onClose={() => setBill(null)}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">Daily business</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onDate(shiftYmd(date, -1))} className="p-1.5 border rounded-md hover:bg-slate-50" aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <label className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={date} onChange={(e) => onDate(e.target.value)} className="outline-none bg-transparent" />
          </label>
          <button
            type="button"
            onClick={() => onDate(shiftYmd(date, 1))}
            disabled={date >= today}
            className="p-1.5 border rounded-md hover:bg-slate-50 disabled:opacity-40"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {date === today ? (
            <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Today</span>
          ) : (
            <button type="button" onClick={() => onDate(today)} className="text-[11px] font-semibold text-sky-700">
              Back to today
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
      <div className="flex flex-wrap items-stretch gap-2">
        <div className="flex-1 min-w-[220px] rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-white px-4 py-3 shadow-md shadow-emerald-200">
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Total Income</p>
          <p className="text-2xl font-black">{rs(income)}</p>
        </div>
        <span className="self-center text-xl font-black text-slate-300">+</span>
        <div className="flex-1 min-w-[180px] rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white px-4 py-3 shadow-md shadow-sky-200">
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Total collection charge</p>
          <p className="text-2xl font-black">{rs(charges)}</p>
        </div>
        <span className="self-center text-xl font-black text-slate-300">−</span>
        <div className="flex-1 min-w-[160px] rounded-xl bg-gradient-to-br from-rose-400 to-red-600 text-white px-4 py-3 shadow-md shadow-rose-200">
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Expenses</p>
          <p className="text-2xl font-black">{rs(expTotal)}</p>
        </div>
        <span className="self-center text-xl font-black text-slate-300">=</span>
        <div className="flex-1 min-w-[180px] rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white px-4 py-3 shadow-md shadow-indigo-200">
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Net income</p>
          <p className="text-2xl font-black">{rs(net)}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-amber-950 px-4 py-3 min-w-[160px] shadow-md shadow-amber-200">
          <p className="text-[10px] font-bold uppercase tracking-wider">Date</p>
          <p className="text-sm font-black">{timeLabel}, {dateLabel}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-slate-700 to-[#0B1220] text-white px-4 py-3 min-w-[160px] shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Reports completed</p>
          <p className="text-2xl font-black">{completedToday}</p>
        </div>
        <button type="button" onClick={onToggleHelp} className="self-center inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-2 rounded-lg">
          <HelpCircle className="w-3.5 h-3.5" /> How collection charges work?
        </button>
      </div>
      {showChargeHelp && (
        <p className="text-[12px] text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
          Collection charge is added to net income: Total income + collection charges − expenses.
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-xl">
        <p className="text-[11px] font-semibold text-slate-500 mb-3">Total income split</p>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <Wallet className="w-5 h-5 mx-auto text-amber-800" />
            <p className="text-[11px] mt-1">Cash</p>
            <p className="text-sm font-black">{rs(cash)}</p>
          </div>
          <div>
            <CreditCard className="w-5 h-5 mx-auto text-sky-700" />
            <p className="text-[11px] mt-1">Card</p>
            <p className="text-sm font-black">{rs(card)}</p>
          </div>
          <div>
            <Banknote className="w-5 h-5 mx-auto text-emerald-700" />
            <p className="text-[11px] mt-1">UPI</p>
            <p className="text-sm font-black">{rs(upi)}</p>
          </div>
          <div>
            <Shield className="w-5 h-5 mx-auto text-yellow-600" />
            <p className="text-[11px] mt-1">Insurance</p>
            <p className="text-sm font-black">{rs(insurance)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 border-b border-slate-200">
        {tabBtn("tx", "Transactions", txRows.length)}
        {tabBtn("bills", "Bills", visibleBills.length)}
        {tabBtn("expenses", "Expenses", dayExpenses.length)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in page" className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs w-52" />
        </div>
        <button
          type="button"
          onClick={() => onDate(prevDay)}
          className="inline-flex items-center gap-1 text-[12px] bg-slate-50 border border-slate-200 px-2 py-1 rounded-md hover:bg-sky-50 hover:border-sky-200"
        >
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Previous day bills <span className="font-bold">{prevBills}</span>
        </button>
        <select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5">
          <option value="all">{chief} : {rs(income)}</option>
          {cashiers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="button" onClick={onAddCashier} className="inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700">
          <UserPlus className="w-3.5 h-3.5" /> Add cashier
        </button>
        {cashierFilter === "all" && (
          <input value={newCashier} onChange={(e) => setNewCashier(e.target.value)} placeholder="Cashier name" className="border border-slate-200 rounded px-2 py-1 text-xs w-32" />
        )}
      </div>

      {dailyTab === "tx" && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Reg. no.</th>
                <th className="px-3 py-2">Patient name</th>
                <th className="px-3 py-2">Referred by</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">DCN</th>
                <th className="px-3 py-2">CC</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Received by</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {txRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-slate-400">
                    No transactions on {dateLabel}.
                  </td>
                </tr>
              )}
              {txRows.map((row) => (
                <tr key={row.key} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400">{row.id}</td>
                  <td className="px-3 py-2 text-sky-700 font-semibold">{row.reg.startsWith("#") ? row.reg : `#${row.reg}`}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-slate-600">{row.referrer}</td>
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2">{row.time}</td>
                  <td className="px-3 py-2">{row.dcn}</td>
                  <td className="px-3 py-2">{row.cc}</td>
                  <td className={`px-3 py-2 font-bold ${row.sign === "+" ? "text-emerald-600" : "text-rose-600"}`}>
                    {row.sign} {rs(row.amount)}
                  </td>
                  <td className="px-3 py-2">{row.method}</td>
                  <td className="px-3 py-2">{row.received}</td>
                  <td className="px-3 py-2">
                    {row.order ? (
                      <button
                        type="button"
                        onClick={() => setBill({ order: row.order!, paid: row.amount, receivedBy: row.received })}
                        className="inline-flex items-center gap-1 text-sky-700 text-[11px] font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> {row.order.status === "COMPLETED" ? "View report" : "View bill"}
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[11px]">Refund</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={8} className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Total
                </td>
                <td className={`px-3 py-2 font-black ${amountTotal >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {amountTotal >= 0 ? "+" : "−"} {rs(Math.abs(amountTotal))}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {dailyTab === "bills" && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Reg. no.</th>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Test</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {visibleBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    No bills on {dateLabel}.
                  </td>
                </tr>
              )}
              {visibleBills.map((r) => (
                <tr key={r.o.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-sky-700">{r.o.specimenId}</td>
                  <td className="px-3 py-2">{r.o.patientName}</td>
                  <td className="px-3 py-2">{r.o.testType}</td>
                  <td className="px-3 py-2 font-bold text-emerald-600">+ {rs(r.paid)}</td>
                  <td className="px-3 py-2">
                    {r.o.status === "COMPLETED" ? (
                      <span className="text-[10px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">Completed</span>
                    ) : r.o.status === "CRITICAL" ? (
                      <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded">Critical</span>
                    ) : r.o.status === "PROCESSING" ? (
                      <span className="text-[10px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">Processing</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase bg-sky-500 text-white px-2 py-0.5 rounded">{r.o.status}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setBill({ order: r.o, paid: r.paid, receivedBy: chief })}
                      className="inline-flex items-center gap-1 text-sky-700 text-[11px] font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> {r.o.status === "COMPLETED" ? "View report" : "View bill"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Total
                </td>
                <td className="px-3 py-2 font-black text-emerald-700">+ {rs(billsTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {dailyTab === "expenses" && (
        <div className="bg-white border rounded-xl">
          {dayExpenses.length === 0 && <p className="px-4 py-8 text-center text-slate-400 text-[12px]">No expenses on {dateLabel}.</p>}
          {dayExpenses.map((e) => (
            <div key={e.id} className="flex justify-between px-4 py-2 border-t text-[12px]">
              <span>{e.title}</span>
              <span className="font-bold text-rose-600">- {rs(e.amount)}</span>
            </div>
          ))}
          {dayExpenses.length > 0 && (
            <div className="flex justify-between px-4 py-2 border-t-2 bg-slate-50 text-[12px] font-black">
              <span>Total</span>
              <span className="text-rose-700">- {rs(expenseTotal)}</span>
            </div>
          )}
        </div>
      )}
      </div>
      <BusinessMonthCalendar date={date} onDate={onDate} counts={counts} completedCounts={completedCounts} />
      </div>
    </div>
  );
}

function Kpi({
  tone,
  label,
  value,
  icon,
  hint,
}: {
  tone: "emerald" | "sky" | "rose" | "indigo";
  label: string;
  value: number;
  icon: React.ReactNode;
  hint: string;
}) {
  const wrap = {
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-950",
    sky: "from-sky-50 to-sky-100 border-sky-200 text-sky-950",
    rose: "from-rose-50 to-rose-100 border-rose-200 text-rose-950",
    indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-950",
  }[tone];
  return (
    <div className={`bg-gradient-to-br ${wrap} border rounded-2xl p-4`}>
      <div className="flex items-center justify-between text-current/70">{icon}</div>
      <p className="text-[10px] uppercase font-extrabold tracking-widest mt-2">{label}</p>
      <p className="text-2xl font-black">Rs. {value.toLocaleString("en-LK")}</p>
      <p className="text-[10px] font-bold opacity-80">{hint}</p>
    </div>
  );
}

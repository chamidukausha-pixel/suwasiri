import React, { useEffect, useState } from "react";
import { Printer, FileText, Pencil, MessageCircle, Settings, X, CheckCircle2, User, History, FileSearch } from "lucide-react";
import type { LabOrder } from "../types";
import { getTestPrice } from "./BillingDashboard";

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function chunkToWords(n: number) {
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`.trim();
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " and " + chunkToWords(n % 100) : ""}`;
}

export function amountInWords(n: number) {
  if (!n) return "Zero rupees only";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts = [
    crore ? `${chunkToWords(crore)} Crore` : "",
    lakh ? `${chunkToWords(lakh)} Lakh` : "",
    thousand ? `${chunkToWords(thousand)} Thousand` : "",
    rest ? chunkToWords(rest) : "",
  ].filter(Boolean);
  return `${parts.join(" ")} rupees only`;
}

function investigations(testType: string) {
  const parts = testType.split(/\s*(?:,|\+|\/)\s*/).map((s) => s.trim()).filter(Boolean);
  const names = parts.length ? parts : [testType];
  return names.map((name) => ({ name, amount: getTestPrice(name) }));
}

export default function BillView({
  order,
  paid,
  receivedBy,
  onClose,
  items: itemProp,
  discount: discountProp,
  mode = "cash",
  onEnterResults,
}: {
  order: LabOrder;
  paid: number;
  receivedBy: string;
  onClose: () => void;
  items?: { name: string; amount: number }[];
  discount?: number;
  mode?: string;
  onEnterResults?: () => void;
}) {
  const [toast, setToast] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setToast(false), 2800);
    return () => window.clearTimeout(t);
  }, []);
  const items = itemProp && itemProp.length ? itemProp : investigations(order.testType);
  const total = items.reduce((s, i) => s + i.amount, 0);
  const discount = discountProp ?? Math.max(0, total - paid);
  const stamped = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date();
  const date = stamped.toLocaleDateString("en-GB");
  const time =
    order.orderTime && !/^just now$/i.test(order.orderTime)
      ? order.orderTime.replace(/^Today, |^Yesterday, /, "")
      : stamped.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const reg = order.specimenId.replace("LNK-", "");
  const phoneDigits = (order.phone || "").replace(/\D/g, "");
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`LankaLab bill ${reg} ${order.patientName}`)}`;

  const printBill = () => {
    const node = document.getElementById("lankalab-bill-paper");
    if (!node) return;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<html><head><title>Bill ${reg}</title><style>body{font-family:Georgia,serif;padding:24px;color:#111} table{width:100%;border-collapse:collapse} td,th{padding:4px 0}</style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const wa = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`LankaLab bill #${reg} for ${order.patientName}. Amount paid Rs.${paid}.`)}`;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 overflow-y-auto">
      <div className="min-h-full bg-[#f7f8fb]">
        <header className="sticky top-0 z-10 bg-white border-b px-5 py-2.5 flex items-center justify-between text-[12px]">
          <p className="text-slate-500">
            Dashboard <span className="mx-1">›</span> <span className="text-sky-700 font-semibold">Bill - #{reg}</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Welcome SMS sent
            </span>
            <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>
        <div className="px-5 py-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 bg-white border-b">
          <span className="border rounded px-2 py-0.5">Version 2</span>
          <span>Page size : A5</span>
          <span>Orientation : Portrait</span>
        </div>
        {toast && (
          <div className="fixed top-4 right-6 z-[90] bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Case registered.
            <button type="button" onClick={() => setToast(false)} className="ml-1 opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px_180px] gap-4 max-w-[1400px] mx-auto">
          <div>
            <div id="lankalab-bill-paper" className="bg-white border shadow-sm p-8 text-[13px] text-slate-800">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <p className="text-lg font-semibold">pathology lab centre</p>
                  <p className="text-[11px] text-slate-500">Phone no.: +94 11 234 5600</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sky-800 tracking-wide">LankaLab</p>
                  <p className="text-[10px] text-slate-400">Colombo Central Patholab</p>
                </div>
              </div>
              <div className="flex justify-between items-start py-4">
                <div>
                  <p className="font-semibold">Bill / Reg. no {reg}</p>
                  <div className="mt-2 w-10 h-10 border flex items-center justify-center text-xs font-bold">L{order.id}</div>
                </div>
                <img src={qr} alt="Bill QR" className="w-[90px] h-[90px] border" />
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-[12px] mb-4">
                <p><span className="text-slate-500">Name :</span> {order.patientName}</p>
                <p><span className="text-slate-500">Referred by :</span> {order.connectedClinic || "Self"}</p>
                <p><span className="text-slate-500">Age / Sex :</span> {order.age} YRS / {order.gender[0]}</p>
                <p><span className="text-slate-500">Date :</span> {date}</p>
                <p><span className="text-slate-500">Mobile number :</span> {order.phone || "—"}</p>
                <p><span className="text-slate-500">Received by :</span> {receivedBy}</p>
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-y">
                    <th className="text-left py-1 font-semibold">S. NO.</th>
                    <th className="text-left py-1 font-semibold">INVESTIGATIONS</th>
                    <th className="text-right py-1 font-semibold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.name + i}>
                      <td className="py-1">{i + 1}.</td>
                      <td className="py-1">{it.name}</td>
                      <td className="py-1 text-right">Rs.{it.amount.toLocaleString("en-LK")}</td>
                    </tr>
                  ))}
                  <tr>
                    <td />
                    <td className="text-right py-1">Total amount</td>
                    <td className="text-right py-1">Rs.{total.toLocaleString("en-LK")}</td>
                  </tr>
                  <tr>
                    <td />
                    <td className="text-right py-1">Discount</td>
                    <td className="text-right py-1">Rs.{discount.toLocaleString("en-LK")}</td>
                  </tr>
                  <tr>
                    <td />
                    <td className="text-right py-1 font-semibold">Amount paid</td>
                    <td className="text-right py-1 font-semibold">Rs.{paid.toLocaleString("en-LK")}</td>
                  </tr>
                  <tr>
                    <td />
                    <td className="text-right py-1">Amount Paid (in words):</td>
                    <td className="text-right py-1 italic">{amountInWords(paid)}</td>
                  </tr>
                </tbody>
              </table>
              {order.results && order.results.length > 0 && (
                <div className="mt-6">
                  <p className="text-center text-[11px] tracking-[0.2em] text-slate-400">✦ LABORATORY REPORT ✦</p>
                  <p className="text-center text-[12px] font-semibold mb-2">{order.testType}</p>
                  {order.status === "COMPLETED" && (
                    <p className="text-center text-[11px] text-emerald-700 font-bold mb-2">COMPLETED</p>
                  )}
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-y">
                        <th className="text-left py-1 font-semibold">TEST</th>
                        <th className="text-left py-1 font-semibold">VALUE</th>
                        <th className="text-left py-1 font-semibold">UNIT</th>
                        <th className="text-left py-1 font-semibold">REFERENCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.results.map((r) => (
                        <tr key={r.parameter} className={r.isAbnormal ? "font-black" : ""}>
                          <td className="py-0.5">{r.parameter}</td>
                          <td className="py-0.5">{r.value}</td>
                          <td className="py-0.5">{r.unit}</td>
                          <td className="py-0.5">{r.referenceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-center text-slate-400 mt-8">~~~~ Thank You ~~~~</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button type="button" onClick={printBill} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-700 text-white rounded text-xs font-semibold">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button type="button" onClick={printBill} className="inline-flex items-center gap-1 px-3 py-1.5 border rounded text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" /> Print PDF
              </button>
              {order.status !== "COMPLETED" && (
              <button type="button" onClick={onEnterResults || onClose} className="inline-flex items-center gap-1 px-3 py-1.5 border rounded text-xs font-semibold">
                <Pencil className="w-3.5 h-3.5" /> Enter results
              </button>
              )}
              <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp bill
              </a>
              <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500">
                <Settings className="w-3.5 h-3.5" /> Print Settings
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-3 text-xs">
              <p className="text-slate-500">SMS credits remaining</p>
              <p className="text-2xl font-black text-emerald-700">94</p>
            </div>
            <div className="bg-white border rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">Transaction history</p>
              <table className="w-full text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1">Time</th>
                    <th className="text-left py-1">Amount</th>
                    <th className="text-left py-1">Received by</th>
                    <th className="text-left py-1">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{date}</td>
                    <td>{time}</td>
                    <td className="text-emerald-600 font-bold">+ Rs.{paid.toLocaleString("en-LK")}</td>
                    <td>{receivedBy}</td>
                    <td className="capitalize">{mode}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-white border rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">Activities</p>
              <table className="w-full text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1">Time</th>
                    <th className="text-left py-1">Summary</th>
                    <th className="text-left py-1">By</th>
                  </tr>
                </thead>
                <tbody>
                  {discount > 0 && (
                    <tr>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td>Discount amount Rs. {discount.toLocaleString("en-LK")}</td>
                      <td>{receivedBy}</td>
                    </tr>
                  )}
                  <tr>
                    <td>{date}</td>
                    <td>{time}</td>
                    <td>Case registered for {order.patientName}</td>
                    <td>{receivedBy}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-white border rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">Request a review from the patient</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold">Ask review</button>
                <button type="button" className="text-xs font-semibold text-sky-700">Setup google review</button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white border rounded-xl p-3 text-xs">
              <p className="font-semibold inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> Doctor info</p>
              <p className="text-slate-500 mt-1">{order.connectedClinic || "Walk-in"}</p>
            </div>
            <div className="bg-white border rounded-xl p-3 text-xs">
              <p className="font-semibold inline-flex items-center gap-1"><History className="w-3.5 h-3.5" /> Patient history</p>
              <p className="text-slate-500 mt-1">{order.notes || "No prior notes."}</p>
            </div>
            <div className="bg-white border rounded-xl p-3 text-xs">
              <p className="font-semibold inline-flex items-center gap-1"><FileSearch className="w-3.5 h-3.5" /> Recent lab reports</p>
              <p className="text-slate-500 mt-1">{order.testType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

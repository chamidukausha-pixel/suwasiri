import React, { useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  Scan,
  ImageIcon,
  Settings,
  Plus,
  Search,
  Check,
  Heart,
  Activity,
  Brain,
  Bone,
  Building2,
  Zap,
  Smile,
  CircleDot,
  HeartPulse,
  Mail,
  Pencil,
  X,
  List,
  User,
} from "lucide-react";
import type { LabOrder } from "../../types";
import RateListPage from "./RateListPage";
import { type DeptId, linesForDept, loadRateStore } from "./rateCatalog";
import { MEDICAL_TESTS, matchMedicalTest, type MedicalTest } from "../../data/medicalTests";
import { uniqueHealthId } from "../../utils/healthId";
import MedicalTestTable from "./MedicalTestTable";
import BillView from "../BillView";

type Line = { name: string; price: number };

const DEPTS: {
  id: DeptId;
  label: string;
  Icon: React.ElementType;
  tile: string;
  heading: string;
  chip: string;
  panel: string;
}[] = [
  { id: "LAB", label: "LAB", Icon: FlaskConical, tile: "bg-teal-700 text-white border-teal-900", heading: "text-teal-950", chip: "bg-teal-700 text-white border-teal-800", panel: "border-teal-800" },
  { id: "USG", label: "USG", Icon: Scan, tile: "bg-sky-700 text-white border-sky-900", heading: "text-sky-950", chip: "bg-sky-700 text-white border-sky-800", panel: "border-sky-800" },
  { id: "DIGITAL XRAY", label: "DIGITAL XRAY", Icon: ImageIcon, tile: "bg-indigo-700 text-white border-indigo-900", heading: "text-indigo-950", chip: "bg-indigo-700 text-white border-indigo-800", panel: "border-indigo-800" },
  { id: "XRAY", label: "XRAY", Icon: Bone, tile: "bg-slate-800 text-white border-slate-950", heading: "text-slate-950", chip: "bg-slate-800 text-white border-slate-900", panel: "border-slate-800" },
  { id: "OUTSOURCE LAB", label: "OUTSOURCE LAB", Icon: Building2, tile: "bg-amber-600 text-white border-amber-800", heading: "text-amber-950", chip: "bg-amber-600 text-white border-amber-800", panel: "border-amber-800" },
  { id: "ECG", label: "ECG", Icon: Heart, tile: "bg-rose-700 text-white border-rose-900", heading: "text-rose-950", chip: "bg-rose-700 text-white border-rose-800", panel: "border-rose-800" },
  { id: "CT SCAN", label: "CT SCAN", Icon: CircleDot, tile: "bg-cyan-700 text-white border-cyan-900", heading: "text-cyan-950", chip: "bg-cyan-700 text-white border-cyan-800", panel: "border-cyan-800" },
  { id: "MRI", label: "MRI", Icon: Brain, tile: "bg-violet-700 text-white border-violet-900", heading: "text-violet-950", chip: "bg-violet-700 text-white border-violet-800", panel: "border-violet-800" },
  { id: "EPS", label: "EPS", Icon: Zap, tile: "bg-yellow-500 text-yellow-950 border-yellow-700", heading: "text-yellow-950", chip: "bg-yellow-500 text-yellow-950 border-yellow-700", panel: "border-yellow-700" },
  { id: "OPG", label: "OPG", Icon: Smile, tile: "bg-lime-700 text-white border-lime-900", heading: "text-lime-950", chip: "bg-lime-700 text-white border-lime-800", panel: "border-lime-800" },
  { id: "CARDIOLOGY", label: "CARDIOLOGY", Icon: HeartPulse, tile: "bg-red-700 text-white border-red-900", heading: "text-red-950", chip: "bg-red-700 text-white border-red-800", panel: "border-red-800" },
  { id: "EEG", label: "EEG", Icon: Activity, tile: "bg-emerald-700 text-white border-emerald-900", heading: "text-emerald-950", chip: "bg-emerald-700 text-white border-emerald-800", panel: "border-emerald-800" },
  { id: "MAMMOGRAPHY", label: "MAMMOGRAPHY", Icon: CircleDot, tile: "bg-pink-700 text-white border-pink-900", heading: "text-pink-950", chip: "bg-pink-700 text-white border-pink-800", panel: "border-pink-800" },
];

const TITLES = ["Mr.", "Mrs.", "Ms.", "Miss", "Master", "Dr.", "Baby", "Rev."];
const COLLECTION_CENTRES = ["Main", "Branch", "Home collection"];
const SAMPLE_AGENTS = ["", "Clinic courier", "In-house phlebotomy", "External rider"];

function lastRegNo(orders: LabOrder[]) {
  const nums = orders.map((o) => Number(String(o.specimenId).replace(/\D/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? Math.max(...nums) : 1016;
}

function toYmd(d: Date) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

function ymdFromAge(age: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - (age || 0));
  return toYmd(d);
}

function ageFromDob(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const born = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const md = now.getMonth() - born.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < born.getDate())) age -= 1;
  return Math.max(0, age);
}

function patientDob(order: LabOrder) {
  if (order.dateOfBirth) {
    const [y, m, d] = order.dateOfBirth.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date();
  const born = new Date(d);
  born.setFullYear(born.getFullYear() - (order.age || 0));
  return born.toLocaleDateString("en-GB");
}

function splitName(name: string) {
  const parts = name.replace(/^(Mr\.|Mrs\.|Ms\.|Miss|Master|Dr\.|Baby|Rev\.)\s+/i, "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

export default function NewBillPage({
  orders,
  onCreate,
  onClose,
  onSettings,
  onEnterResults,
}: {
  orders: LabOrder[];
  onCreate: (order: LabOrder) => void;
  onClose: () => void;
  onSettings: () => void;
  onEnterResults?: (order: LabOrder) => void;
}) {
  const [phone, setPhone] = useState("");
  const [picked, setPicked] = useState<LabOrder | null>(null);
  const [title, setTitle] = useState("Mrs.");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<LabOrder["gender"]>("Female");
  const [ageY, setAgeY] = useState("");
  const [ageM, setAgeM] = useState("");
  const [ageD, setAgeD] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [openDepts, setOpenDepts] = useState<DeptId[]>(["LAB"]);
  const [lines, setLines] = useState<Record<string, Line[]>>({ LAB: [] });
  const [deptPaid, setDeptPaid] = useState<Record<string, string>>({});
  const [deptDisc, setDeptDisc] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<DeptId | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [rateDept, setRateDept] = useState<DeptId | null>(null);
  const [rateRev, setRateRev] = useState(0);
  const [created, setCreated] = useState<{
    order: LabOrder;
    items: { name: string; amount: number }[];
    paid: number;
    discount: number;
    mode: string;
  } | null>(null);
  const [sampleAt, setSampleAt] = useState<DeptId | null>("LAB");
  const [discount, setDiscount] = useState("0");
  const [received, setReceived] = useState("");
  const [mode, setMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [onlineReport, setOnlineReport] = useState(false);
  const [referrers, setReferrers] = useState<{ id: number; name: string }[]>(() => {
    const fromOrders = orders.map((o) => o.connectedClinic).filter((v): v is string => Boolean(v));
    const names = Array.from(new Set(["Dr. SAUBHIK BHAUMIK", "PrimeCare Medical Centre", ...fromOrders]));
    return names.map((name, i) => ({ id: i + 1, name }));
  });
  const [referredBy, setReferredBy] = useState("Dr. SAUBHIK BHAUMIK");
  const [centre, setCentre] = useState("Main");
  const [agent, setAgent] = useState("");
  const [extra, setExtra] = useState<"email" | "address" | "nic" | "history" | null>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nic, setNic] = useState("");

  const matches = useMemo(() => {
    const q = phone.replace(/\s/g, "").toLowerCase();
    if (q.length < 2) return [];
    const seen = new Set<string>();
    return orders
      .filter((o) => {
        const digits = (o.phone || "").replace(/\s/g, "").toLowerCase();
        const hit = digits.includes(q) || (o.patientName || "").toLowerCase().includes(q);
        if (!hit || seen.has(o.patientName)) return false;
        seen.add(o.patientName);
        return true;
      })
      .slice(0, 20);
  }, [orders, phone]);

  const deptMeta = (id: DeptId) => DEPTS.find((d) => d.id === id)!;
  const selectedCodes = useMemo(() => {
    const codes = Object.values(lines)
      .flat()
      .map((l) => matchMedicalTest(l.name)?.code)
      .filter((c): c is string => Boolean(c));
    return new Set(codes);
  }, [lines]);

  const deptTotal = (id: string) => (lines[id] || []).reduce((s, l) => s + l.price, 0);
  const grandTotal = openDepts.reduce((s, id) => s + deptTotal(id), 0);
  const discN = Number(discount) || 0;
  const recvN = received === "" ? grandTotal - discN : Number(received) || 0;
  const balance = Math.max(0, grandTotal - discN - recvN);

  const pickPatient = (o: LabOrder) => {
    setPicked(o);
    setPhone(o.phone || phone);
    setGender(o.gender);
    setEmail(o.email || "");
    setAgeY(String(o.age || ""));
    setDateOfBirth(o.dateOfBirth || (o.age ? ymdFromAge(o.age) : ""));
    const { first, last } = splitName(o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.patientName);
    setFirstName(o.firstName || first);
    setLastName(o.lastName || last);
    if (/mrs/i.test(o.patientName) || o.gender === "Female") setTitle("Mrs.");
    else if (o.gender === "Male") setTitle("Mr.");
    if (o.connectedClinic) setReferredBy(o.connectedClinic);
  };

  const toggleDept = (id: DeptId) => {
    setOpenDepts((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setLines((prev) => (prev[id] ? prev : { ...prev, [id]: [] }));
  };

  const closeDept = (id: DeptId) => {
    setOpenDepts((prev) => prev.filter((d) => d !== id));
    if (sampleAt === id) setSampleAt(null);
  };

  const addLine = (id: DeptId, line: Line) => {
    setLines((prev) => {
      const cur = prev[id] || [];
      if (cur.some((x) => x.name === line.name)) return prev;
      const next = { ...prev, [id]: [...cur, line] };
      const tot = next[id].reduce((s, l) => s + l.price, 0);
      setDeptPaid((p) => ({ ...p, [id]: String(tot) }));
      return next;
    });
    setAdding(null);
    setAddQuery("");
  };

  const removeLine = (id: DeptId, name: string) => {
    setLines((prev) => {
      const nextItems = (prev[id] || []).filter((x) => x.name !== name);
      setDeptPaid((p) => ({ ...p, [id]: String(nextItems.reduce((s, l) => s + l.price, 0)) }));
      return { ...prev, [id]: nextItems };
    });
  };

  const toggleMedicalTest = (t: MedicalTest) => {
    const existing = (Object.entries(lines) as [DeptId, Line[]][]).flatMap(([dept, items]) =>
      items
        .filter((x) => matchMedicalTest(x.name)?.code === t.code)
        .map((x) => ({ dept, name: x.name }))
    );
    if (existing[0]) {
      removeLine(existing[0].dept, existing[0].name);
      return;
    }
    toggleDept(t.dept);
    addLine(t.dept, { name: t.billName, price: t.fee });
  };

  useEffect(() => {
    const on = () => setRateRev((n) => n + 1);
    window.addEventListener("lankalab-rates", on);
    return () => window.removeEventListener("lankalab-rates", on);
  }, []);

  const applyCatalogPrices = () => {
    const store = loadRateStore();
    setLines((prev) => {
      const next = { ...prev };
      (Object.keys(next) as DeptId[]).forEach((dept) => {
        const prices = linesForDept(store, dept);
        next[dept] = (next[dept] || []).map((l) => {
          const hit = prices.find((p) => p.name === l.name);
          return hit ? { name: hit.name, price: hit.price } : l;
        });
      });
      return next;
    });
    setRateRev((n) => n + 1);
  };

  const closeRates = () => {
    applyCatalogPrices();
    setRateDept(null);
  };

  const create = () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name) {
      alert("Enter the patient first name, or search a mobile number and pick a file.");
      return;
    }
    const allTests = openDepts.flatMap((id) => lines[id] || []);
    if (allTests.length === 0) {
      alert("Add at least one investigation.");
      return;
    }
    const specimen = `LNK-${lastRegNo(orders) + 1}`;
    const testType = allTests.map((t) => t.name).join(" + ");
    const dob = dateOfBirth || picked?.dateOfBirth || ymdFromAge(Number(ageY) || picked?.age || 0);
    const age = Number(ageY) || (dob ? ageFromDob(dob) : 0) || picked?.age || 0;
    const now = new Date();
    const order: LabOrder = {
      id: String(Date.now()),
      patientName: `${title} ${name}`.replace(/\s+/g, " ").trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dob,
      age,
      gender,
      testType,
      orderTime: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      orderTimestamp: now,
      specimenId: specimen,
      status: "PENDING",
      priority: "Routine",
      wardOrDept: sampleAt || openDepts[0] || centre,
      notes:
        [
          remarks,
          onlineReport ? "Online report requested" : "",
          address && `Address: ${address}`,
          nic && `NIC: ${nic}`,
          ageM && `${ageM} months`,
          ageD && `${ageD} days`,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      phone: picked?.phone || (phone ? (phone.startsWith("+") ? phone : `+94 ${phone}`) : undefined),
      email: email || picked?.email,
      suwasiriBarcode:
        picked?.suwasiriBarcode ||
        uniqueHealthId({
          suwasiriBarcode: "",
          phone: picked?.phone || (phone ? (phone.startsWith("+") ? phone : `+94 ${phone}`) : undefined),
          email: email || picked?.email,
          patientName: `${title} ${name}`.replace(/\s+/g, " ").trim(),
          specimenId: specimen,
        }),
      connectedClinic: referredBy || picked?.connectedClinic,
      results: [],
      billedAmount: allTests.reduce((s, t) => s + t.price, 0),
      paidAmount: recvN,
      discountAmount: discN,
      paymentMode: mode,
      billItems: allTests.map((t) => ({ name: t.name, amount: t.price })),
    };
    onCreate(order);
    setCreated({
      order,
      items: allTests.map((t) => ({ name: t.name, amount: t.price })),
      paid: recvN,
      discount: discN,
      mode,
    });
  };

  const field = "w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm font-semibold text-slate-950 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-200 bg-white";

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {created && (
        <BillView
          order={created.order}
          paid={created.paid}
          receivedBy="Chief"
          items={created.items}
          discount={created.discount}
          mode={created.mode}
          onClose={() => {
            setCreated(null);
            onClose();
          }}
          onEnterResults={() => {
            const billed = created.order;
            setCreated(null);
            if (onEnterResults) onEnterResults(billed);
            else onClose();
          }}
        />
      )}
      {rateDept && (
        <RateListPage
          dept={rateDept}
          onClose={closeRates}
          onPick={(name, fee) => {
            addLine(rateDept, { name, price: fee });
            closeRates();
          }}
        />
      )}
      <header className="h-12 flex items-center justify-between px-6 sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="text-[13px] font-black tracking-wide inline-flex items-center gap-1.5 bg-[#0a2547] hover:bg-[#123a6b] text-white px-3 py-1.5 rounded-full shadow-sm">
            <Plus className="w-4 h-4" /> NEW BILL
          </button>
          <span className="text-[15px] font-bold text-slate-950">New bill</span>
        </div>
        <p className="text-[12px] font-bold text-slate-900">
          Last Reg. no. {lastRegNo(orders)}
          <span className="mx-2 text-slate-300">|</span>
          Courtesy limit: 200 patients/d
        </p>
      </header>

      <div className="px-6 py-5 pb-28 max-w-6xl">
        <h2 className="text-[16px] font-bold text-slate-950 mb-4">Patient details</h2>

        <div className="max-w-md mb-5 relative">
          <label className="text-[12px] font-bold text-slate-900 block mb-1">Mobile number</label>
          <div className="flex">
            <span className="px-3 py-1.5 border border-r-0 rounded-l-md bg-slate-200 text-sm font-bold text-slate-950">+94</span>
            <div className="relative flex-1">
              <input
                value={phone.replace(/^\+94\s?/, "")}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPicked(null);
                }}
                className={`${field} rounded-l-none pr-9`}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                {picked ? <Check className="w-4 h-4 text-emerald-600" /> : <Search className="w-4 h-4" />}
              </span>
            </div>
          </div>
          {matches.length > 0 && !picked && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl overflow-hidden">
              {matches.map((o) => (
                <button key={o.id} type="button" onClick={() => pickPatient(o)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-600 hover:text-white">
                  <div className="font-medium">{o.patientName}</div>
                  <div className="text-[11px] opacity-80">
                    {o.age} YRS / {o.gender[0]} {patientDob(o)}
                  </div>
                </button>
              ))}
              <p className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50">Note: Only recent 20 records are shown here.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <label className="text-[12px] font-bold text-slate-900">
            <span className="text-rose-500">*</span> Title
            <select value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mt-1 w-24`}>
              {TITLES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-[12px] font-bold text-slate-900">
            <span className="text-rose-500">*</span> First name
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`${field} mt-1 w-44`} />
          </label>
          <label className="text-[12px] font-bold text-slate-900">
            Last name
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${field} mt-1 w-44`} />
          </label>
          <div className="flex items-center gap-2 pb-0.5">
            <span className="text-[12px] font-bold text-slate-900">
              <span className="text-rose-500">*</span> Sex
            </span>
            {(["Male", "Female", "Other"] as const).map((g) => {
              const on = gender === g;
              const tone =
                g === "Male"
                  ? on
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                  : g === "Female"
                    ? on
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-pink-50 text-pink-800 border-pink-200"
                    : on
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-violet-50 text-violet-800 border-violet-200";
              return (
                <button key={g} type="button" onClick={() => setGender(g)} className={`inline-flex items-center gap-1.5 uppercase tracking-wide text-[11px] font-bold px-2.5 py-1.5 rounded-full border ${tone}`}>
                  <User className="w-3.5 h-3.5" /> {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="text-[12px] font-bold text-slate-900">
            Date of birth
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                const next = e.target.value;
                setDateOfBirth(next);
                if (next) setAgeY(String(ageFromDob(next)));
              }}
              className={`${field} mt-1 w-40`}
            />
          </label>
          <label className="text-[12px] font-bold text-slate-900">
            <span className="text-rose-500">*</span> Age
            <input
              value={ageY}
              onChange={(e) => {
                setAgeY(e.target.value);
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) setDateOfBirth(ymdFromAge(n));
              }}
              className={`${field} mt-1 w-20`}
            />
          </label>
          <label className="text-[12px] font-bold text-slate-900">
            Months
            <input value={ageM} onChange={(e) => setAgeM(e.target.value)} className={`${field} mt-1 w-20`} />
          </label>
          <label className="text-[12px] font-bold text-slate-900">
            Days
            <input value={ageD} onChange={(e) => setAgeD(e.target.value)} className={`${field} mt-1 w-20`} />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-950 mb-3">
          <input type="checkbox" checked={onlineReport} onChange={(e) => setOnlineReport(e.target.checked)} className="accent-sky-600" />
          Online report requested
        </label>
        <div className="flex flex-wrap gap-4 mb-3 text-[12px]">
          {([
            ["email", "Email"],
            ["address", "Address"],
            ["nic", "NIC"],
            ["history", "Patient history"],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" className="inline-flex items-center gap-1 font-bold text-sky-900" onClick={() => setExtra(extra === key ? null : key)}>
              <Plus className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        {extra === "email" && <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Patient email" className={`${field} max-w-md mb-4`} />}
        {extra === "address" && <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={`${field} max-w-xl mb-4`} />}
        {extra === "nic" && <input value={nic} onChange={(e) => setNic(e.target.value)} placeholder="National Identity Card number" className={`${field} max-w-md mb-4`} />}
        {extra === "history" && <p className="text-[12px] font-semibold text-slate-900 mb-4 max-w-xl">{picked?.notes || "Select a patient to see prior notes from their last visit."}</p>}

        <h2 className="text-[16px] font-bold text-slate-950 mt-6 mb-4">Case details</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-4 max-w-5xl mb-2">
          <div>
            <label className="text-[12px] font-bold text-slate-900 block mb-1">
              <span className="text-rose-500">*</span> Referred By
            </label>
            <div className="flex items-end gap-3">
              <select value={referredBy} onChange={(e) => setReferredBy(e.target.value)} className={`${field} flex-1`}>
                <option value="">Select referrer</option>
                {referrers.map((r) => (
                  <option key={r.id} value={r.name}>
                    ID: {r.id}, {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt("New referrer name");
                  if (!name?.trim()) return;
                  const next = { id: referrers.length + 1, name: name.trim() };
                  setReferrers((prev) => [...prev, next]);
                  setReferredBy(next.name);
                }}
                className="shrink-0 text-[12px] font-semibold text-sky-700 border border-sky-300 px-2.5 py-1.5 rounded-md inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>
            <div className="flex gap-4 mt-2 text-[12px] text-sky-700">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3" /> Manage referrers
              </span>
              <span className="inline-flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Edit referrer
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[12px] font-bold text-slate-900 block mb-1">
                <span className="text-rose-500">*</span> Collection centre
              </label>
              <select value={centre} onChange={(e) => setCentre(e.target.value)} className={field}>
                {COLLECTION_CENTRES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-900 block mb-1">Sample collection agent</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className={field}>
                {SAMPLE_AGENTS.map((a) => (
                  <option key={a || "none"} value={a}>
                    {a || "—"}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 mt-1 text-[11px] text-sky-700">
                <span className="inline-flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Add new
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Pencil className="w-3 h-3" /> Edit
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-6">
          {DEPTS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleDept(d.id)}
              className={`w-[92px] h-[78px] border-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[9px] font-black tracking-wide shadow-sm ${d.tile} ${
                openDepts.includes(d.id) ? "ring-4 ring-offset-1 ring-black/25 brightness-110" : ""
              }`}
            >
              <d.Icon className="w-5 h-5" />
              {d.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <MedicalTestTable selectedCodes={selectedCodes} onToggle={toggleMedicalTest} />
        </div>

        <div className="space-y-4">
          {openDepts.map((id) => {
            const meta = deptMeta(id);
            const items = lines[id] || [];
            const tot = deptTotal(id);
            const paid = Number(deptPaid[id] ?? tot) || 0;
            const disc = Number(deptDisc[id] || 0) || 0;
            const due = Math.max(0, tot - paid - disc);
            const catalog = linesForDept(loadRateStore(), id);
            const extras = MEDICAL_TESTS.filter((t) => t.dept === id).map((t) => ({ name: t.billName, price: t.fee }));
            const merged = [...extras, ...catalog.filter((c) => !extras.some((e) => e.name === c.name))];
            void rateRev;
            const filtered = merged.filter((t) => !addQuery || t.name.toLowerCase().includes(addQuery.toLowerCase()));
            return (
              <div key={id} className={`border-2 rounded-xl p-4 ${meta.panel}`}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px_140px] gap-3 items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={() => closeDept(id)} className="text-slate-700 hover:text-rose-700">
                        <X className="w-4 h-4" />
                      </button>
                      <p className={`text-[13px] font-black px-2 py-0.5 rounded ${meta.tile}`}>{id === "LAB" ? "Lab" : id} Investigations</p>
                    </div>
                    <div className="min-h-[52px] border border-slate-200 rounded-lg p-2 flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span key={item.name} className={`inline-flex items-center gap-1 text-[11px] border rounded-full px-2 py-0.5 ${meta.chip}`}>
                          <button type="button" onClick={() => removeLine(id, item.name)}>
                            <X className="w-3 h-3" />
                          </button>
                          {item.name} (Rs.{item.price})
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] relative">
                      <button type="button" onClick={() => { setAdding(adding === id ? null : id); setRateDept(null); }} className="text-sky-900 font-bold inline-flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add New
                      </button>
                      <button type="button" onClick={() => { setRateDept(id); setAdding(null); }} className="text-sky-900 font-bold inline-flex items-center gap-1">
                        <List className="w-3.5 h-3.5" /> Ratelist
                      </button>
                      <span className="ml-auto font-bold text-slate-900">
                        Total: Rs. {tot.toLocaleString("en-LK")} , Due: Rs. {due.toLocaleString("en-LK")}
                      </span>
                      {adding === id && (
                        <div className="absolute left-0 top-7 z-20 w-80 bg-white border shadow-xl rounded-lg overflow-hidden">
                          <input autoFocus value={addQuery} onChange={(e) => setAddQuery(e.target.value)} placeholder="Search tests…" className="w-full border-b px-3 py-2 text-xs outline-none" />
                          <div className="max-h-48 overflow-y-auto">
                            {filtered.map((t) => (
                              <button key={t.name} type="button" onClick={() => addLine(id, t)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-sky-50">
                                {t.name} (Rs.{t.price})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {id === "LAB" && (
                      <button
                        type="button"
                        onClick={() => setSampleAt("LAB")}
                        className={`mt-2 text-[12px] px-3 py-1 rounded-full border ${sampleAt === "LAB" ? "border-sky-500 text-sky-800 bg-sky-50" : "border-dashed border-slate-300 text-slate-500"}`}
                      >
                        Sample collected at
                      </button>
                    )}
                  </div>
                  <label className="text-[12px] font-bold text-slate-900">
                    <span className="text-rose-500">*</span> Paid
                    <input value={deptPaid[id] ?? String(tot)} onChange={(e) => setDeptPaid((p) => ({ ...p, [id]: e.target.value }))} className={`${field} mt-1`} />
                  </label>
                  <label className="text-[12px] font-bold text-slate-900">
                    <span className="text-rose-500">*</span> Discount
                    <input value={deptDisc[id] ?? "0"} onChange={(e) => setDeptDisc((p) => ({ ...p, [id]: e.target.value }))} className={`${field} mt-1`} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5 grid grid-cols-[160px_1fr] gap-x-8 gap-y-2 max-w-xl text-[13px]">
          <p className="font-bold text-slate-950 col-span-2 mb-1">Payment Details:</p>
          <span className="font-semibold text-slate-900">Total: Rs.</span>
          <span className="font-semibold">{grandTotal.toLocaleString("en-LK")}</span>
          <span className="font-semibold text-slate-900">Discount:</span>
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} className={`${field} max-w-[160px]`} />
          <span className="font-semibold text-slate-900">Amount received</span>
          <input value={received === "" ? String(Math.max(0, grandTotal - discN)) : received} onChange={(e) => setReceived(e.target.value)} className={`${field} max-w-[160px]`} />
          <span className="text-rose-600 font-semibold">Balance: Rs.</span>
          <span className="text-rose-600 font-bold inline-flex items-center gap-1">
            {balance.toLocaleString("en-LK")} {balance === 0 && <Check className="w-4 h-4 text-sky-600" />}
          </span>
          <span className="font-semibold text-slate-900">Mode:</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={`${field} max-w-[160px]`}>
            <option value="cash">cash</option>
            <option value="card">card</option>
            <option value="upi">upi</option>
            <option value="insurance">insurance</option>
          </select>
          <span className="font-semibold text-slate-900">Remarks:</span>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className={field} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-3 flex items-center justify-between z-30">
        <button type="button" onClick={create} className="px-8 py-2 bg-[#0a2547] text-white rounded-lg text-sm font-bold hover:bg-[#123a6b]">
          Create
        </button>
        <button type="button" onClick={onSettings} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50">
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>
    </div>
  );
}

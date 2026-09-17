import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FlaskConical,
  Scan,
  ImageIcon,
  Settings,
  Plus,
  ChevronDown,
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
  UserPlus,
  Pencil,
} from "lucide-react";
import type { LabOrder } from "../../types";
import { testCatalogItems } from "../../data/mockData";
import { getTestPrice } from "../BillingDashboard";

export type DeskTab =
  | "cases"
  | "newbill"
  | "overview"
  | "results"
  | "trials"
  | "pending"
  | "lab-today"
  | "lab-packages"
  | "lab-panels"
  | "lab-categories"
  | "lab-database"
  | "lab-interpretations"
  | "lab-count"
  | "logistics"
  | "notifications"
  | "integration"
  | "billing"
  | "biz-daily"
  | "biz-expenses"
  | "biz-dues"
  | "biz-activities"
  | "biz-referrals"
  | "biz-analysis"
  | "biz-export"
  | "manage-logins"
  | "manage-doctors"
  | "manage-employees"
  | "manage-diagnofy"
  | "manage-browser"
  | "suwasiri"
  | "settings";

function caseBucket(order: LabOrder) {
  if (order.status === "PENDING") return "new";
  if (order.status === "PROCESSING" || order.status === "CRITICAL") return "progress";
  if (order.status === "COMPLETED" && order.gpCareSyncedAt) return "signed";
  if (order.status === "COMPLETED") return "final";
  return "new";
}

const INVESTIGATIONS = [
  { name: "Full Blood Count (FBC / CBC)", label: "CBC (with absolute counts) (Rs.500)" },
  { name: "FBC + ESR", label: "CBC with ESR (Rs.2,500)" },
  { name: "Full Blood Count (FBC / CBC)", label: "CBC with GBP (Rs.1,800)" },
  { name: "Full Blood Count (FBC / CBC)", label: "Complete Blood Count (CBC) (Rs.1,800)" },
  ...testCatalogItems.map((item) => ({
    name: item.name,
    label: `${item.name} (Rs.${getTestPrice(item.name).toLocaleString("en-LK")})`,
  })),
  { name: "Liver Function Test (LFT)", label: "LFT (Rs.4,000)" },
  { name: "Kidney Function Test / Renal Profile", label: "KFT without eGFR (Rs.4,500)" },
];

const DEPTS: { id: string; label: string; Icon: React.ElementType }[] = [
  { id: "LAB", label: "LAB", Icon: FlaskConical },
  { id: "USG", label: "USG", Icon: Scan },
  { id: "DIGITAL XRAY", label: "DIGITAL XRAY", Icon: ImageIcon },
  { id: "XRAY", label: "XRAY", Icon: Bone },
  { id: "OUTSOURCE LAB", label: "OUTSOURCE LAB", Icon: Building2 },
  { id: "ECG", label: "ECG", Icon: Heart },
  { id: "CT SCAN", label: "CT SCAN", Icon: CircleDot },
  { id: "MRI", label: "MRI", Icon: Brain },
  { id: "EPS", label: "EPS", Icon: Zap },
  { id: "OPG", label: "OPG", Icon: Smile },
  { id: "CARDIOLOGY", label: "CARDIOLOGY", Icon: HeartPulse },
  { id: "EEG", label: "EEG", Icon: Activity },
  { id: "MAMMOGRAPHY", label: "MAMMOGRAPHY", Icon: CircleDot },
];

const COLLECTION_CENTRES = ["Main", "Branch", "Home collection"];
const SAMPLE_AGENTS = ["", "Clinic courier", "In-house phlebotomy", "External rider"];

function lastRegNo(orders: LabOrder[]) {
  const nums = orders.map((o) => Number(String(o.specimenId).replace(/\D/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? Math.max(...nums) : 1016;
}

function patientDob(order: LabOrder) {
  const d = order.orderTimestamp instanceof Date ? order.orderTimestamp : new Date();
  const born = new Date(d);
  born.setFullYear(born.getFullYear() - (order.age || 0));
  return born.toLocaleDateString("en-GB");
}

const navBtn = (on: boolean) =>
  `w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 ${
    on ? "bg-sky-50 text-sky-800 font-semibold" : "text-slate-600 hover:bg-slate-50"
  }`;

export default function PathologyDesk({
  orders,
  search,
  onSearch,
  tab,
  onTab,
  onAddOrder,
  onSignOut,
  sessionEmail,
  pages,
}: {
  orders: LabOrder[];
  search: string;
  onSearch: (value: string) => void;
  tab: DeskTab;
  onTab: (tab: DeskTab) => void;
  onAddOrder: (order: LabOrder) => void;
  onSignOut: () => void;
  sessionEmail: string;
  pages: Partial<Record<DeskTab, React.ReactNode>>;
}) {
  const [labOpen, setLabOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "new" | "progress" | "final" | "signed">("all");

  const counts = useMemo(() => {
    const next = { all: orders.length, new: 0, progress: 0, final: 0, signed: 0 };
    orders.forEach((o) => {
      next[caseBucket(o)] += 1;
    });
    return next;
  }, [orders]);

  const q = search.toLowerCase();
  const rows = orders.filter((o) => {
    if (filter !== "all" && caseBucket(o) !== filter) return false;
    if (!q) return true;
    return (
      o.patientName.toLowerCase().includes(q) ||
      o.specimenId.toLowerCase().includes(q) ||
      o.testType.toLowerCase().includes(q) ||
      (o.connectedClinic || "").toLowerCase().includes(q) ||
      (o.phone || "").includes(q)
    );
  });

  const hideSidebar = tab === "newbill";

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex">
      {!hideSidebar && (
      <aside className="w-52 shrink-0 border-r border-slate-200 h-screen sticky top-0 hidden md:flex flex-col bg-white">
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-[11px] text-slate-400 truncate">Pathology lab centre</p>
          <button type="button" onClick={() => onTab("newbill")} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-black tracking-wide text-white bg-[#0a2547] hover:bg-[#123a6b] px-2.5 py-1.5 rounded-lg shadow-sm">
            <Plus className="w-4 h-4" /> NEW BILL
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <button type="button" onClick={() => onTab("overview")} className={navBtn(tab === "overview")}>
            <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
          </button>
          <button type="button" onClick={() => { setBizOpen((v) => !v); setLabOpen(false); setManageOpen(false); }} className={`${navBtn(tab.startsWith("biz-") || tab === "billing")} justify-between`}>
            <span className="inline-flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-slate-400" /> Business
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ${bizOpen ? "rotate-180" : ""}`} />
          </button>
          {bizOpen && (
            <div className="pl-9 pr-2 space-y-0.5 pb-1">
              <button type="button" onClick={() => onTab("biz-daily")} className={navBtn(tab === "biz-daily")}>Daily Business</button>
              <button type="button" onClick={() => onTab("biz-expenses")} className={navBtn(tab === "biz-expenses")}>Expenses</button>
              <button type="button" onClick={() => onTab("biz-dues")} className={navBtn(tab === "biz-dues")}>Due Report</button>
              <button type="button" onClick={() => onTab("biz-activities")} className={navBtn(tab === "biz-activities")}>Activities</button>
              <button type="button" onClick={() => onTab("biz-referrals")} className={navBtn(tab === "biz-referrals")}>Referral Business</button>
              <button type="button" onClick={() => onTab("biz-analysis")} className={navBtn(tab === "biz-analysis")}>Business Analysis</button>
              <button type="button" onClick={() => onTab("biz-export")} className={navBtn(tab === "biz-export")}>Data Export</button>
            </div>
          )}
          <button type="button" onClick={() => { setLabOpen((v) => !v); setBizOpen(false); setManageOpen(false); }} className={`${navBtn(tab.startsWith("lab-") || tab === "cases" || tab === "results")} justify-between`}>
            <span className="inline-flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-slate-400" /> Lab
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ${labOpen ? "rotate-180" : ""}`} />
          </button>
          {labOpen && (
            <div className="pl-9 pr-2 space-y-0.5 pb-1">
              <button type="button" onClick={() => onTab("lab-today")} className={navBtn(tab === "lab-today")}>
                Today&apos;s reports
              </button>
              <button type="button" onClick={() => onTab("lab-packages")} className={navBtn(tab === "lab-packages")}>Test packages</button>
              <button type="button" onClick={() => onTab("lab-panels")} className={navBtn(tab === "lab-panels")}>Test panels</button>
              <button type="button" onClick={() => onTab("lab-categories")} className={navBtn(tab === "lab-categories")}>Test categories</button>
              <button type="button" onClick={() => onTab("lab-database")} className={navBtn(tab === "lab-database")}>Test database</button>
              <button type="button" onClick={() => onTab("lab-interpretations")} className={navBtn(tab === "lab-interpretations")}>Interpretations</button>
              <button type="button" onClick={() => onTab("lab-count")} className={navBtn(tab === "lab-count")}>Test count</button>
              <button type="button" onClick={() => onTab("newbill")} className="w-full text-left px-3 py-2 text-[12px] font-black tracking-wide rounded-md text-white bg-[#0a2547] hover:bg-[#123a6b]">
                NEW BILLS
              </button>
              <button type="button" onClick={() => onTab("results")} className={navBtn(tab === "results")}>
                Result delivery
              </button>
            </div>
          )}
          <button type="button" onClick={() => onTab("logistics")} className={navBtn(tab === "logistics")}>
            <Scan className="w-4 h-4 text-slate-400" /> Logistics
          </button>
          <button type="button" onClick={() => onTab("suwasiri")} className={navBtn(tab === "suwasiri")}>
            <ImageIcon className="w-4 h-4 text-slate-400" /> Suwasiri
          </button>
          <button type="button" onClick={() => { setManageOpen((v) => !v); setBizOpen(false); setLabOpen(false); }} className={`${navBtn(tab.startsWith("manage-") || tab === "settings")} justify-between`}>
            <span className="inline-flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-slate-400" /> Manage
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ${manageOpen ? "rotate-180" : ""}`} />
          </button>
          {manageOpen && (
            <div className="pl-9 pr-2 space-y-0.5 pb-1">
              <button type="button" onClick={() => onTab("manage-logins")} className={navBtn(tab === "manage-logins")}>Employee login</button>
              <button type="button" onClick={() => onTab("manage-doctors")} className={navBtn(tab === "manage-doctors")}>Doctor access</button>
              <button type="button" onClick={() => onTab("manage-employees")} className={navBtn(tab === "manage-employees")}>Employee</button>
              <button type="button" onClick={() => onTab("manage-diagnofy")} className={navBtn(tab === "manage-diagnofy")}>Diagnofy</button>
              <button type="button" onClick={() => onTab("manage-browser")} className={navBtn(tab === "manage-browser")}>Browser security</button>
            </div>
          )}
        </nav>
      </aside>
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="h-12 border-b border-slate-200 flex items-center justify-between px-5 sticky top-0 bg-white z-20">
          {hideSidebar ? (
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-black tracking-wide text-white bg-[#0a2547] hover:bg-[#123a6b] px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Plus className="w-4 h-4" /> NEW BILL
              </span>
              <button type="button" onClick={() => onTab("cases")} className="text-[12px] text-slate-400 hover:text-slate-700">
                Close
              </button>
            </div>
          ) : (
          <button type="button" onClick={() => onTab("newbill")} className="text-[12px] font-black tracking-wide text-white bg-[#0a2547] hover:bg-[#123a6b] px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow-sm">
            <Plus className="w-4 h-4" /> NEW BILL
          </button>
          )}
          {!hideSidebar && (
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search in page"
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs w-56 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
          )}
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            {hideSidebar && (
              <span>
                Last Reg. no. {lastRegNo(orders)} <span className="mx-1.5 text-slate-300">|</span> Courtesy limit: 200 patients/d
              </span>
            )}
            <span className="truncate max-w-[160px]" title={sessionEmail}>{sessionEmail}</span>
            <button type="button" onClick={onSignOut} className="font-semibold hover:text-slate-800">
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1">
          {tab === "cases" && (
            <CasesBoard counts={counts} filter={filter} setFilter={setFilter} rows={rows} />
          )}
          {tab === "newbill" && <NewBillForm orders={orders} onCreate={onAddOrder} onSettings={() => onTab("settings")} />}
          {tab !== "cases" && tab !== "newbill" && (
            <div className="p-4 bg-slate-50 min-h-full">{pages[tab] || <p className="text-sm text-slate-500 p-6">Open New bills or New bill.</p>}</div>
          )}
        </main>
      </div>
    </div>
  );
}

function CasesBoard({
  counts,
  filter,
  setFilter,
  rows,
}: {
  counts: Record<"all" | "new" | "progress" | "final" | "signed", number>;
  filter: "all" | "new" | "progress" | "final" | "signed";
  setFilter: (f: "all" | "new" | "progress" | "final" | "signed") => void;
  rows: LabOrder[];
}) {
  const tabs: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "progress", label: "In progress" },
    { id: "final", label: "Final" },
    { id: "signed", label: "Signed off" },
  ];
  return (
    <div className="px-5 py-4">
      <h1 className="text-[15px] font-black tracking-wide text-[#0a2547] mb-3">NEW BILLS</h1>
      <div className="flex items-center gap-5 border-b border-slate-200 text-[13px]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`pb-2 -mb-px border-b-2 ${filter === t.id ? "border-sky-600 text-sky-800 font-semibold" : "border-transparent text-slate-500"}`}
          >
            {t.label} <span className="text-slate-400">{counts[t.id]}</span>
          </button>
        ))}
      </div>
      <table className="w-full mt-3 text-left text-[12px]">
        <thead className="text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-2 font-medium">Reg. no.</th>
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Patient</th>
            <th className="py-2 font-medium">Referred by</th>
            <th className="py-2 font-medium">Tests</th>
            <th className="py-2 font-medium">CC</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const b = caseBucket(o);
            const label = b === "signed" ? "Signed off" : b === "final" ? "Final" : b === "progress" ? (o.status === "CRITICAL" ? "Critical" : "In progress") : "New";
            return (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="py-2.5 font-mono text-sky-700">#{o.specimenId.replace("LNK-", "")}</td>
                <td className="py-2.5 text-slate-500">{o.orderTime}</td>
                <td className="py-2.5">
                  <div className="font-medium">{o.patientName}</div>
                  <div className="text-[11px] text-slate-400">
                    {o.age} YRS / {o.gender[0]}
                  </div>
                </td>
                <td className="py-2.5 text-slate-600">{o.connectedClinic || "—"}</td>
                <td className="py-2.5">{o.testType}</td>
                <td className="py-2.5 text-slate-500">{o.wardOrDept || "Main"}</td>
                <td className="py-2.5 text-sky-700">{label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NewBillForm({
  orders,
  onCreate,
  onSettings,
}: {
  orders: LabOrder[];
  onCreate: (order: LabOrder) => void;
  onSettings: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [picked, setPicked] = useState<LabOrder | null>(null);
  const [gender, setGender] = useState<LabOrder["gender"]>("Female");
  const [testQuery, setTestQuery] = useState("");
  const [testLabel, setTestLabel] = useState("");
  const [testType, setTestType] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [dept, setDept] = useState("LAB");
  const [paid, setPaid] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [payAmount, setPayAmount] = useState("0");
  const [received, setReceived] = useState("0");
  const [collectCharge, setCollectCharge] = useState("0");
  const [mode, setMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [onlineReport, setOnlineReport] = useState(false);
  const [referrers, setReferrers] = useState<string[]>(() => {
    const fromOrders = orders.map((o) => o.connectedClinic).filter((v): v is string => Boolean(v));
    return Array.from(new Set(["PrimeCare Medical Centre", ...fromOrders]));
  });
  const [referredBy, setReferredBy] = useState("");
  const [centre, setCentre] = useState("Main");
  const [agent, setAgent] = useState("");
  const [extra, setExtra] = useState<"email" | "address" | "nic" | "history" | null>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nic, setNic] = useState("");

  const matches = useMemo(() => {
    const q = phone.replace(/\s/g, "");
    if (q.length < 3) return [];
    const seen = new Set<string>();
    return orders.filter((o) => {
      const digits = (o.phone || "").replace(/\s/g, "");
      const hit = digits.includes(q) || (o.patientName || "").toLowerCase().includes(phone.toLowerCase());
      if (!hit || seen.has(o.patientName)) return false;
      seen.add(o.patientName);
      return true;
    }).slice(0, 20);
  }, [orders, phone]);

  const tests = INVESTIGATIONS.filter(
    (t) => !testQuery || t.label.toLowerCase().includes(testQuery.toLowerCase()) || t.name.toLowerCase().includes(testQuery.toLowerCase())
  );
  const price = testType ? getTestPrice(testType) : 0;
  const balance = Math.max(0, (Number(payAmount) || price) - Number(discount || 0) - Number(received || 0));

  const pickPatient = (o: LabOrder) => {
    setPicked(o);
    setPhone(o.phone || phone);
    setGender(o.gender);
    setEmail(o.email || "");
    if (o.connectedClinic) setReferredBy(o.connectedClinic);
  };

  const create = () => {
    if (!picked) {
      alert("Search the mobile number and select a patient file.");
      return;
    }
    if (!testType) {
      alert("Select a lab investigation.");
      return;
    }
    const specimen = `LNK-${Math.floor(10000 + Math.random() * 90000)}`;
    onCreate({
      id: String(Date.now()),
      patientName: picked.patientName,
      age: picked.age,
      gender,
      testType,
      orderTime: "Just now",
      orderTimestamp: new Date(),
      specimenId: specimen,
      status: "PENDING",
      priority: "Routine",
      wardOrDept: dept === "LAB" ? centre : dept,
      notes: [remarks, onlineReport ? "Online report requested" : "", address && `Address: ${address}`, nic && `NIC: ${nic}`]
        .filter(Boolean)
        .join(" · ") || undefined,
      phone: picked.phone || phone,
      email: email || picked.email,
      suwasiriBarcode: picked.suwasiriBarcode,
      connectedClinic: referredBy || picked.connectedClinic,
      results: [],
    });
  };

  const field = "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1.5 text-sm focus:outline-none focus:border-sky-500";
  const pillLink = "inline-flex items-center gap-1 text-[12px] text-sky-700 hover:underline";

  return (
    <div className="px-8 py-6 pb-24">
      <h2 className="text-[15px] font-medium text-slate-800 mb-4">
        <span className="inline-flex w-5 h-5 mr-2 rounded-full border border-slate-300 text-[11px] text-slate-500 items-center justify-center align-middle">1</span>
        Patient details
      </h2>

      <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-3">
        <div className="relative w-full max-w-md">
          <label className="text-[11px] text-slate-500 block mb-1">Mobile number</label>
          <div className="relative">
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPicked(null);
              }}
              placeholder="+94 …"
              className={`${field} pr-14`}
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
              {picked && <Check className="w-4 h-4 text-emerald-600" />}
              <Search className="w-4 h-4" />
            </span>
          </div>
          {matches.length > 0 && !picked && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl overflow-hidden">
              {matches.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pickPatient(o)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-600 hover:text-white"
                >
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

        <div className="flex items-center gap-5 text-[12px] text-slate-600 pt-6">
          <span className="text-slate-400">Sex *</span>
          {(["Male", "Female", "Other"] as const).map((g) => (
            <label key={g} className="inline-flex items-center gap-1.5 uppercase tracking-wide">
              <input type="radio" checked={gender === g} onChange={() => setGender(g)} className="accent-sky-600" />
              {g}
            </label>
          ))}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-[13px] text-slate-600 mb-3">
        <input type="checkbox" checked={onlineReport} onChange={(e) => setOnlineReport(e.target.checked)} className="accent-sky-600" />
        Online report requested
      </label>
      <div className="flex flex-wrap gap-5 mb-3">
        <button type="button" className={pillLink} onClick={() => setExtra(extra === "email" ? null : "email")}>
          <Plus className="w-3.5 h-3.5" /> Email
        </button>
        <button type="button" className={pillLink} onClick={() => setExtra(extra === "address" ? null : "address")}>
          <Plus className="w-3.5 h-3.5" /> Address
        </button>
        <button type="button" className={pillLink} onClick={() => setExtra(extra === "nic" ? null : "nic")}>
          <Plus className="w-3.5 h-3.5" /> NIC
        </button>
        <button type="button" className={pillLink} onClick={() => setExtra(extra === "history" ? null : "history")}>
          <Plus className="w-3.5 h-3.5" /> Patient history
        </button>
      </div>
      {extra === "email" && (
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Patient email" className={`${field} max-w-md mb-4`} />
      )}
      {extra === "address" && (
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={`${field} max-w-xl mb-4`} />
      )}
      {extra === "nic" && (
        <input value={nic} onChange={(e) => setNic(e.target.value)} placeholder="National Identity Card number" className={`${field} max-w-md mb-4`} />
      )}
      {extra === "history" && (
        <p className="text-[12px] text-slate-500 mb-4 max-w-xl">
          {picked?.notes || "Select a patient to see prior notes from their last visit."}
        </p>
      )}

      <h2 className="text-[15px] font-medium text-slate-800 mb-4 mt-6">
        <span className="inline-flex w-5 h-5 mr-2 rounded-full border border-slate-300 text-[11px] text-slate-500 items-center justify-center align-middle">2</span>
        Case details
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-4 max-w-5xl mb-2">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Referred by</label>
          <div className="flex items-end gap-3">
            <select value={referredBy} onChange={(e) => setReferredBy(e.target.value)} className={`${field} flex-1`}>
              <option value="">Select referrer</option>
              {referrers.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("New referrer name");
                if (!name?.trim()) return;
                setReferrers((prev) => Array.from(new Set([...prev, name.trim()])));
                setReferredBy(name.trim());
              }}
              className="shrink-0 text-[12px] font-semibold text-sky-700 inline-flex items-center gap-1 pb-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add new
            </button>
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-[11px] text-sky-700 inline-flex items-center gap-1"><Mail className="w-3 h-3" /> Manage referrers</span>
            <span className="text-[11px] text-sky-700 inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit referrer</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Collection centre</label>
            <select value={centre} onChange={(e) => setCentre(e.target.value)} className={field}>
              {COLLECTION_CENTRES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Sample collection agent</label>
            <select value={agent} onChange={(e) => setAgent(e.target.value)} className={field}>
              {SAMPLE_AGENTS.map((a) => (
                <option key={a || "none"} value={a}>{a || "—"}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 my-6">
        {DEPTS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDept(d.id)}
            className={`w-[88px] h-[72px] border rounded flex flex-col items-center justify-center gap-1.5 text-[9px] font-semibold tracking-wide ${
              dept === d.id ? "border-sky-600 text-sky-800 bg-sky-50" : "border-slate-200 text-sky-700"
            }`}
          >
            <d.Icon className="w-4 h-4" />
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4 max-w-5xl text-[12px] text-slate-600">
        <div className="relative">
          <label className="text-[11px] text-slate-500 block mb-1">Lab investigations</label>
          <input
            value={testQuery || testLabel}
            onChange={(e) => {
              setTestQuery(e.target.value);
              setShowTests(true);
            }}
            onFocus={() => setShowTests(true)}
            placeholder="Type to search…"
            className={field}
          />
          {showTests && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl max-h-56 overflow-y-auto">
              {tests.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTestType(t.name);
                    setTestLabel(t.label);
                    setTestQuery("");
                    setShowTests(false);
                    if (!Number(payAmount)) setPayAmount(String(getTestPrice(t.name)));
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${t.label === testLabel ? "bg-blue-600 text-white" : "hover:bg-blue-600 hover:text-white"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <label>
            Paid
            <input value={paid} onChange={(e) => setPaid(e.target.value)} className={`${field} mt-0.5`} />
          </label>
          <label>
            Discount
            <input value={discount} onChange={(e) => setDiscount(e.target.value)} className={`${field} mt-0.5`} />
          </label>
        </div>
        <label>
          Payment amount
          <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={`${field} mt-0.5`} />
        </label>
        <div className="grid grid-cols-2 gap-6">
          <label>
            Amount received
            <input value={received} onChange={(e) => setReceived(e.target.value)} className={`${field} mt-0.5`} />
          </label>
          <label>
            Collection Charge
            <input value={collectCharge} onChange={(e) => setCollectCharge(e.target.value)} className={`${field} mt-0.5`} />
          </label>
        </div>
        <p className="text-red-600 font-medium">Balance: Rs. {balance.toLocaleString("en-LK")}</p>
        <span />
        <label className="max-w-[200px]">
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={`${field} mt-0.5`}>
            <option value="cash">cash</option>
            <option value="card">card</option>
          </select>
        </label>
        <span />
        <label className="lg:col-span-1 max-w-md">
          Remarks
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className={`${field} mt-0.5`} />
        </label>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-3 flex items-center justify-between">
        <button type="button" onClick={create} className="px-8 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-sm">
          Create
        </button>
        <button type="button" onClick={onSettings} className="px-6 py-2 border border-blue-500 text-blue-600 rounded-full text-sm font-semibold inline-flex items-center gap-1.5">
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>
    </div>
  );
}

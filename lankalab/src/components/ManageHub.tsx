import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  UserPlus,
  Users,
  Stethoscope,
  Brain,
  Shield,
  Eye,
  EyeOff,
  Save,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

export type ManagePanel = "logins" | "doctors" | "employees" | "diagnofy" | "browser";

const STORE_KEY = "lankalab-manage-v1";

export type Perms = {
  setupLab: boolean;
  exportData: boolean;
  viewTestCounts: boolean;
  manageDoctorPortal: boolean;
  manageBilling: boolean;
  cannotRemoveInvestigations: boolean;
  cannotChangeDiscount: boolean;
  cannotCancelBill: boolean;
  manageLabReports: boolean;
  signLabReports: boolean;
  editLabReports: boolean;
  manageTestDatabase: boolean;
  printDeliverReports: boolean;
  printDueReports: boolean;
  viewBusinessReports: boolean;
  viewBusinessAnalysis: boolean;
  viewReferralBusiness: boolean;
  viewCaseWiseBusiness: boolean;
  manageUsg: boolean;
  manageXray: boolean;
  patientHistoryLimit: string;
  businessHistoryLimit: string;
};

export type StaffLogin = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  status: "active" | "blocked";
  loginReady: boolean;
  registeredOn: string;
  isOwner: boolean;
  permissions: Perms;
};

type HrEmployee = { id: string; name: string; role: string; dept: string; phone: string; email: string };
type DoctorAccess = { id: string; name: string; clinic: string; email: string; access: boolean; lastSeen: string };

const FULL_PERMS: Perms = {
  setupLab: true,
  exportData: true,
  viewTestCounts: true,
  manageDoctorPortal: true,
  manageBilling: true,
  cannotRemoveInvestigations: false,
  cannotChangeDiscount: false,
  cannotCancelBill: false,
  manageLabReports: true,
  signLabReports: true,
  editLabReports: true,
  manageTestDatabase: true,
  printDeliverReports: true,
  printDueReports: true,
  viewBusinessReports: true,
  viewBusinessAnalysis: true,
  viewReferralBusiness: true,
  viewCaseWiseBusiness: true,
  manageUsg: true,
  manageXray: true,
  patientHistoryLimit: "",
  businessHistoryLimit: "",
};

function todayLabel() {
  return new Date().toLocaleDateString("en-GB");
}

function fullName(row: StaffLogin) {
  return `${row.firstName} ${row.lastName}`.trim();
}

const SEED_LOGINS: StaffLogin[] = [
  {
    id: "e1",
    firstName: "Chamidu",
    lastName: "Kausha",
    mobile: "+94 77 123 4567",
    email: "chamidukausha@gmail.com",
    status: "active",
    loginReady: true,
    registeredOn: "14/03/2026",
    isOwner: true,
    permissions: { ...FULL_PERMS },
  },
  {
    id: "e2",
    firstName: "Nadeesha",
    lastName: "Perera",
    mobile: "+94 71 555 1234",
    email: "nadeesha.perera@lankalab.lk",
    status: "active",
    loginReady: false,
    registeredOn: todayLabel(),
    isOwner: false,
    permissions: { ...FULL_PERMS, setupLab: false, exportData: false, cannotChangeDiscount: true },
  },
];

const SEED_HR: HrEmployee[] = [
  { id: "h1", name: "Chamidu Kausha", role: "Account owner", dept: "Admin", phone: "+94 77 123 4567", email: "chamidukausha@gmail.com" },
  { id: "h2", name: "Nadeesha Perera", role: "Front desk", dept: "Reception", phone: "+94 71 555 1234", email: "nadeesha.perera@lankalab.lk" },
  { id: "h3", name: "Isuru Fernando", role: "Phlebotomist", dept: "Collection", phone: "+94 76 220 8899", email: "isuru.fernando@lankalab.lk" },
  { id: "h4", name: "Thilini Jayasuriya", role: "Lab technician", dept: "Haematology", phone: "+94 75 441 0909", email: "thilini.j@lankalab.lk" },
];

const SEED_DOCTORS: DoctorAccess[] = [
  { id: "d1", name: "Dr. Ambika Perera", clinic: "Kandy General Medical Clinic", email: "ambika@kgmc.lk", access: true, lastSeen: "Today" },
  { id: "d2", name: "Dr. Saubhik Bhaumik", clinic: "PrimeCare Medical Centre", email: "saubhik@primecare.lk", access: true, lastSeen: "Yesterday" },
  { id: "d3", name: "Dr. Nalin Perera", clinic: "Colombo National Medical Clinic", email: "nalin@cnmc.lk", access: false, lastSeen: "Never" },
];

type Persist = {
  logins: StaffLogin[];
  hr: HrEmployee[];
  doctors: DoctorAccess[];
  diagnofy: { enabled: boolean; autoSuggest: boolean; who: string[] };
  browser: { timeoutMin: number; chromeOnly: boolean; reauthBilling: boolean; failedLock: number; devices: string[] };
};

function loadPersist(): Persist | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Persist) : null;
  } catch {
    return null;
  }
}

function CheckRow({
  checked,
  onChange,
  label,
  hint,
  indent,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  indent?: boolean;
}) {
  return (
    <label className={`flex items-start gap-2 text-[13px] text-slate-700 ${indent ? "ml-6" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-sky-600" />
      <span>
        {label}
        {hint && <span className="block text-[11px] text-slate-400 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export default function ManageHub({ panel }: { panel: ManagePanel }) {
  const saved = loadPersist();
  const [logins, setLogins] = useState<StaffLogin[]>(saved?.logins || SEED_LOGINS);
  const [hr, setHr] = useState<HrEmployee[]>(saved?.hr || SEED_HR);
  const [doctors, setDoctors] = useState<DoctorAccess[]>(saved?.doctors || SEED_DOCTORS);
  const [diagnofy, setDiagnofy] = useState(saved?.diagnofy || { enabled: true, autoSuggest: false, who: ["e1"] });
  const [browser, setBrowser] = useState(
    saved?.browser || { timeoutMin: 30, chromeOnly: false, reauthBilling: true, failedLock: 5, devices: ["Chrome · Colombo desk", "Edge · Owner laptop"] }
  );
  const [view, setView] = useState<"list" | "add" | "existing" | "configure">("list");
  const [loginTab, setLoginTab] = useState<"active" | "blocked">("active");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState("");
  const [emailHints, setEmailHints] = useState(false);

  const [draftPerms, setDraftPerms] = useState<Perms>(FULL_PERMS);
  const [limitPatient, setLimitPatient] = useState(false);
  const [limitBiz, setLimitBiz] = useState(false);

  const [hrName, setHrName] = useState("");
  const [hrRole, setHrRole] = useState("Technician");
  const [hrDept, setHrDept] = useState("Lab");
  const [hrPhone, setHrPhone] = useState("");
  const [hrEmail, setHrEmail] = useState("");

  useEffect(() => {
    const payload: Persist = { logins, hr, doctors, diagnofy, browser };
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  }, [logins, hr, doctors, diagnofy, browser]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setView("list");
    setEditingId(null);
  }, [panel]);

  const flash = (msg: string) => setToast(msg);

  const listed = logins.filter((r) => r.status === loginTab);
  const editing = logins.find((r) => r.id === editingId) || null;
  const existingCandidates = hr.filter((h) => !logins.some((l) => l.email.toLowerCase() === h.email.toLowerCase()));

  const openAdd = (prefill?: Partial<StaffLogin> & { name?: string }) => {
    setFormError("");
    if (prefill?.name) {
      const [fn, ...rest] = prefill.name.split(" ");
      setFirstName(fn || "");
      setLastName(rest.join(" "));
    } else {
      setFirstName(prefill?.firstName || "");
      setLastName(prefill?.lastName || "");
    }
    setEmail(prefill?.email || "");
    setMobile((prefill?.mobile || "").replace(/^\+94\s?/, "") || "");
    setPassword("");
    setPassword2("");
    setView("add");
  };

  const submitEmployee = () => {
    if (!firstName.trim()) return setFormError("First name is required.");
    if (!email.trim() || !email.includes("@")) return setFormError("A valid email is required.");
    if (!mobile.trim()) return setFormError("Mobile number is required.");
    if (password.length < 6) return setFormError("Password must be at least 6 characters.");
    if (password !== password2) return setFormError("Password confirmation does not match.");
    if (logins.some((l) => l.email.toLowerCase() === email.trim().toLowerCase())) {
      return setFormError("That email already has a login.");
    }
    const row: StaffLogin = {
      id: `e${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim().startsWith("+") ? mobile.trim() : `+94 ${mobile.trim()}`,
      email: email.trim(),
      status: "active",
      loginReady: true,
      registeredOn: todayLabel(),
      isOwner: false,
      permissions: { ...FULL_PERMS },
    };
    setLogins((prev) => [...prev, row]);
    if (!hr.some((h) => h.email.toLowerCase() === row.email.toLowerCase())) {
      setHr((prev) => [...prev, { id: `h${Date.now()}`, name: fullName(row), role: "Staff", dept: "Lab", phone: row.mobile, email: row.email }]);
    }
    flash("Employee login created.");
    setView("list");
    setLoginTab("active");
  };

  const openConfigure = (row: StaffLogin) => {
    setEditingId(row.id);
    setDraftPerms({ ...row.permissions });
    setLimitPatient(Boolean(row.permissions.patientHistoryLimit));
    setLimitBiz(Boolean(row.permissions.businessHistoryLimit));
    setView("configure");
  };

  const savePerms = () => {
    if (!editingId) return;
    setLogins((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? {
              ...r,
              loginReady: true,
              permissions: {
                ...draftPerms,
                patientHistoryLimit: limitPatient ? draftPerms.patientHistoryLimit || "90" : "",
                businessHistoryLimit: limitBiz ? draftPerms.businessHistoryLimit || "31" : "",
              },
            }
          : r
      )
    );
    flash("Permissions saved.");
    setView("list");
  };

  const setP = <K extends keyof Perms>(key: K, value: Perms[K]) => setDraftPerms((p) => ({ ...p, [key]: value }));

  if (panel === "logins" && view === "add") {
    const hints = hr.filter((h) => firstName && h.name.toLowerCase().includes(firstName.toLowerCase())).slice(0, 4);
    return (
      <Shell toast={toast}>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Dashboard / Manage employee / New</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Add employee</h1>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl space-y-3">
          <Field label="First name" required>
            <div className="relative">
              <input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setEmailHints(true);
                }}
                onFocus={() => setEmailHints(true)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {emailHints && hints.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-slate-900 text-white rounded-lg shadow-xl text-xs overflow-hidden">
                  {hints.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-700"
                      onClick={() => {
                        const [fn, ...rest] = h.name.split(" ");
                        setFirstName(fn);
                        setLastName(rest.join(" "));
                        setEmail(h.email);
                        setMobile(h.phone.replace(/^\+94\s?/, ""));
                        setEmailHints(false);
                      }}
                    >
                      <span className="font-semibold">{h.name}</span>
                      <span className="block text-slate-300">{h.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Last name">
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Email" required>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Mobile number" required>
            <div className="flex">
              <span className="px-3 py-2 border border-r-0 rounded-l-lg bg-slate-50 text-sm text-slate-500">+94</span>
              <input
                value={mobile.replace(/^\+94\s?/, "")}
                onChange={(e) => setMobile(e.target.value)}
                className="flex-1 border rounded-r-lg px-3 py-2 text-sm"
              />
            </div>
          </Field>
          <Field label="Password" required>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm pr-9"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Password confirmation" required>
            <input type={showPw ? "text" : "password"} value={password2} onChange={(e) => setPassword2(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          {formError && <p className="text-xs text-rose-600">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={submitEmployee} className="px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-semibold">
              Add Employee
            </button>
            <button type="button" onClick={() => setView("list")} className="px-4 py-2 text-sm text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (panel === "logins" && view === "existing") {
    return (
      <Shell toast={toast}>
        <button type="button" onClick={() => setView("list")} className="text-xs text-sky-700 mb-3">
          ← Back to employee logins
        </button>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Existing employee</h1>
        <p className="text-xs text-slate-500 mb-4">Grant a portal login to someone already on the staff list.</p>
        <div className="bg-white border rounded-2xl divide-y max-w-xl">
          {existingCandidates.length === 0 && <p className="p-6 text-sm text-slate-400">Every staff member already has a login.</p>}
          {existingCandidates.map((h) => (
            <button key={h.id} type="button" onClick={() => openAdd({ name: h.name, email: h.email, mobile: h.phone })} className="w-full text-left px-4 py-3 hover:bg-slate-50">
              <p className="text-sm font-semibold">{h.name}</p>
              <p className="text-[11px] text-slate-500">
                {h.role} · {h.dept} · {h.email}
              </p>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (panel === "logins" && view === "configure" && editing) {
    return (
      <Shell toast={toast}>
        <button type="button" onClick={() => setView("list")} className="text-xs text-sky-700 mb-3">
          ← Back to employee logins
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Configure permissions for {fullName(editing).toLowerCase()}</h1>
        <p className="text-xs text-slate-500 mb-4">{editing.email}</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <PermCard title="Access permissions" tone="rose" icon={<Users className="w-4 h-4" />}>
            <CheckRow checked={draftPerms.setupLab} onChange={(v) => setP("setupLab", v)} label="Can setup lab" />
            <CheckRow checked={draftPerms.exportData} onChange={(v) => setP("exportData", v)} label="Can export data" />
            <CheckRow checked={draftPerms.viewTestCounts} onChange={(v) => setP("viewTestCounts", v)} label="Can view lab test counts" />
            <CheckRow checked={draftPerms.manageDoctorPortal} onChange={(v) => setP("manageDoctorPortal", v)} label="Can manage doctor portal" />
            <button type="button" onClick={() => setLimitPatient((v) => !v)} className="text-[12px] text-sky-700 font-semibold mt-1">
              + Add limit to patient record history
            </button>
            {limitPatient && (
              <input
                value={draftPerms.patientHistoryLimit}
                onChange={(e) => setP("patientHistoryLimit", e.target.value)}
                placeholder="Days (e.g. 90)"
                className="mt-1 border rounded px-2 py-1 text-xs w-32"
              />
            )}
          </PermCard>
          <PermCard title="Billing permissions" tone="sky" icon={<Pencil className="w-4 h-4" />}>
            <CheckRow checked={draftPerms.manageBilling} onChange={(v) => setP("manageBilling", v)} label="Can manage patient registration and billing" />
            <CheckRow
              indent
              checked={draftPerms.cannotRemoveInvestigations}
              onChange={(v) => setP("cannotRemoveInvestigations", v)}
              label="Cannot remove investigations from case"
            />
            <CheckRow indent checked={draftPerms.cannotChangeDiscount} onChange={(v) => setP("cannotChangeDiscount", v)} label="Cannot change discount" />
            <CheckRow indent checked={draftPerms.cannotCancelBill} onChange={(v) => setP("cannotCancelBill", v)} label="Cannot cancel bill" />
          </PermCard>
          <PermCard title="Lab report permissions" tone="violet" icon={<Shield className="w-4 h-4" />}>
            <CheckRow checked={draftPerms.manageLabReports} onChange={(v) => setP("manageLabReports", v)} label="Can manage lab reports" />
            <CheckRow checked={draftPerms.signLabReports} onChange={(v) => setP("signLabReports", v)} label="Can sign lab reports" />
            <CheckRow checked={draftPerms.editLabReports} onChange={(v) => setP("editLabReports", v)} label="Can edit lab reports" />
            <CheckRow checked={draftPerms.manageTestDatabase} onChange={(v) => setP("manageTestDatabase", v)} label="Can manage lab test database" />
            <CheckRow checked={draftPerms.printDeliverReports} onChange={(v) => setP("printDeliverReports", v)} label="Can print and deliver lab reports" />
            <CheckRow checked={draftPerms.printDueReports} onChange={(v) => setP("printDueReports", v)} label="Can print due reports" />
          </PermCard>
          <PermCard title="Business report permissions" tone="indigo" icon={<Users className="w-4 h-4" />}>
            <CheckRow
              checked={draftPerms.viewBusinessReports}
              onChange={(v) => setP("viewBusinessReports", v)}
              label="Can view business reports"
              hint="If unchecked, employee will not be able to see daily business or any business report"
            />
            <CheckRow checked={draftPerms.viewBusinessAnalysis} onChange={(v) => setP("viewBusinessAnalysis", v)} label="Can view business analysis" />
            <CheckRow checked={draftPerms.viewReferralBusiness} onChange={(v) => setP("viewReferralBusiness", v)} label="Can view referral business" />
            <CheckRow checked={draftPerms.viewCaseWiseBusiness} onChange={(v) => setP("viewCaseWiseBusiness", v)} label="Can view case wise business" />
            <button type="button" onClick={() => setLimitBiz((v) => !v)} className="text-[12px] text-sky-700 font-semibold mt-1">
              + Add limit to business report history
            </button>
            {limitBiz && (
              <input
                value={draftPerms.businessHistoryLimit}
                onChange={(e) => setP("businessHistoryLimit", e.target.value)}
                placeholder="Days (e.g. 31)"
                className="mt-1 border rounded px-2 py-1 text-xs w-32"
              />
            )}
          </PermCard>
          <PermCard title="USG report permissions" tone="fuchsia" icon={<Stethoscope className="w-4 h-4" />}>
            <CheckRow checked={draftPerms.manageUsg} onChange={(v) => setP("manageUsg", v)} label="Can manage usg reports" />
          </PermCard>
          <PermCard title="Digital X-ray report permissions" tone="emerald" icon={<Brain className="w-4 h-4" />}>
            <CheckRow checked={draftPerms.manageXray} onChange={(v) => setP("manageXray", v)} label="Can manage digital xray reports" />
          </PermCard>
        </div>
        <button type="button" onClick={savePerms} className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-sky-700 text-white rounded-lg text-sm font-semibold">
          <Save className="w-4 h-4" /> Save
        </button>
      </Shell>
    );
  }

  if (panel === "logins") {
    return (
      <Shell toast={toast}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Manage employee logins</h1>
            <span className="text-[11px] text-sky-700 border border-sky-200 rounded px-2 py-0.5">Watch Video</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => openAdd()} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold">
              <UserPlus className="w-3.5 h-3.5" /> New employee
            </button>
            <button type="button" onClick={() => setView("existing")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-800 text-white rounded-lg text-xs font-semibold">
              <Users className="w-3.5 h-3.5" /> Existing employee
            </button>
          </div>
        </div>
        <div className="flex gap-5 border-b text-[13px] mb-3">
          {(["active", "blocked"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLoginTab(id)}
              className={`pb-2 -mb-px border-b-2 capitalize ${loginTab === id ? "border-sky-600 text-sky-800 font-semibold" : "border-transparent text-slate-500"}`}
            >
              {id} <span className="text-slate-400">{logins.filter((r) => r.status === id).length}</span>
            </button>
          ))}
        </div>
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">S. no.</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Mobile number</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Reg. on</th>
                <th className="px-3 py-2">Permissions</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listed.map((row, i) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400">{i + 1}.</td>
                  <td className="px-3 py-2 font-medium">
                    <input
                      value={fullName(row)}
                      onChange={(e) => {
                        const parts = e.target.value.trim().split(/\s+/);
                        const firstName = parts[0] || "";
                        const lastName = parts.slice(1).join(" ");
                        setLogins((prev) => prev.map((r) => (r.id === row.id ? { ...r, firstName, lastName } : r)));
                      }}
                      className="border-b border-transparent hover:border-slate-200 focus:border-sky-400 outline-none bg-transparent w-40 font-medium"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.mobile}
                      onChange={(e) => setLogins((prev) => prev.map((r) => (r.id === row.id ? { ...r, mobile: e.target.value } : r)))}
                      className="border-b border-transparent hover:border-slate-200 focus:border-sky-400 outline-none bg-transparent w-36"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      title="Toggle login ready"
                      onClick={() => !row.isOwner && setLogins((prev) => prev.map((r) => (r.id === row.id ? { ...r, loginReady: !r.loginReady } : r)))}
                    >
                      {row.loginReady ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.email}
                      onChange={(e) => setLogins((prev) => prev.map((r) => (r.id === row.id ? { ...r, email: e.target.value } : r)))}
                      className="border-b border-transparent hover:border-slate-200 focus:border-sky-400 outline-none bg-transparent w-52"
                    />
                  </td>
                  <td className="px-3 py-2">{row.status === "active" && row.loginReady ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}</td>
                  <td className="px-3 py-2">{row.registeredOn}</td>
                  <td className="px-3 py-2">
                    {row.isOwner ? (
                      <span className="text-slate-500">Account owner</span>
                    ) : (
                      <button type="button" onClick={() => openConfigure(row)} className="text-sky-700 font-semibold inline-flex items-center gap-1">
                        Configure
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 relative">
                    <button type="button" onClick={() => setMenuId(menuId === row.id ? null : row.id)} className="p-1 rounded hover:bg-slate-100" disabled={row.isOwner}>
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                    {menuId === row.id && !row.isOwner && (
                      <div className="absolute right-2 z-10 bg-white border rounded-lg shadow-lg text-xs w-36">
                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => openConfigure(row)}>
                          Configure
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-50"
                          onClick={() => {
                            setLogins((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: r.status === "active" ? "blocked" : "active" } : r)));
                            setMenuId(null);
                            flash(row.status === "active" ? "Login blocked." : "Login restored.");
                          }}
                        >
                          {row.status === "active" ? "Block" : "Unblock"}
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setLogins((prev) => prev.filter((r) => r.id !== row.id));
                            setMenuId(null);
                            flash("Login removed.");
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Shell>
    );
  }

  if (panel === "doctors") {
    return (
      <Shell toast={toast}>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Doctor access</h1>
        <p className="text-xs text-slate-500 mb-4">Referring clinicians who can open reports on the doctor portal.</p>
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Doctor</th>
                <th className="px-3 py-2">Clinic</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Access</th>
                <th className="px-3 py-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{d.name}</td>
                  <td className="px-3 py-2">{d.clinic}</td>
                  <td className="px-3 py-2">
                    <input
                      value={d.email}
                      onChange={(e) => setDoctors((prev) => prev.map((x) => (x.id === d.id ? { ...x, email: e.target.value } : x)))}
                      className="border-b border-transparent focus:border-sky-400 outline-none w-52"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDoctors((prev) => prev.map((x) => (x.id === d.id ? { ...x, access: !x.access } : x)));
                        flash("Doctor access updated.");
                      }}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${d.access ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                    >
                      {d.access ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{d.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Shell>
    );
  }

  if (panel === "employees") {
    return (
      <Shell toast={toast}>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Employee</h1>
        <p className="text-xs text-slate-500 mb-4">Staff directory used when granting an existing-employee login.</p>
        <div className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
          <label className="text-[11px] font-bold">
            Name
            <input value={hrName} onChange={(e) => setHrName(e.target.value)} className="block mt-1 border rounded px-2 py-1.5 text-xs w-40" />
          </label>
          <label className="text-[11px] font-bold">
            Role
            <input value={hrRole} onChange={(e) => setHrRole(e.target.value)} className="block mt-1 border rounded px-2 py-1.5 text-xs w-36" />
          </label>
          <label className="text-[11px] font-bold">
            Dept
            <input value={hrDept} onChange={(e) => setHrDept(e.target.value)} className="block mt-1 border rounded px-2 py-1.5 text-xs w-32" />
          </label>
          <label className="text-[11px] font-bold">
            Phone
            <input value={hrPhone} onChange={(e) => setHrPhone(e.target.value)} className="block mt-1 border rounded px-2 py-1.5 text-xs w-36" />
          </label>
          <label className="text-[11px] font-bold">
            Email
            <input value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} className="block mt-1 border rounded px-2 py-1.5 text-xs w-48" />
          </label>
          <button
            type="button"
            onClick={() => {
              if (!hrName.trim() || !hrEmail.trim()) return;
              setHr((prev) => [...prev, { id: `h${Date.now()}`, name: hrName.trim(), role: hrRole, dept: hrDept, phone: hrPhone, email: hrEmail.trim() }]);
              setHrName("");
              setHrPhone("");
              setHrEmail("");
              flash("Employee added to directory.");
            }}
            className="px-3 py-1.5 bg-sky-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Dept</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {hr.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="px-3 py-2">
                    <input value={h.name} onChange={(e) => setHr((prev) => prev.map((x) => (x.id === h.id ? { ...x, name: e.target.value } : x)))} className="outline-none w-40" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={h.role} onChange={(e) => setHr((prev) => prev.map((x) => (x.id === h.id ? { ...x, role: e.target.value } : x)))} className="outline-none w-32" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={h.dept} onChange={(e) => setHr((prev) => prev.map((x) => (x.id === h.id ? { ...x, dept: e.target.value } : x)))} className="outline-none w-28" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={h.phone} onChange={(e) => setHr((prev) => prev.map((x) => (x.id === h.id ? { ...x, phone: e.target.value } : x)))} className="outline-none w-36" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={h.email} onChange={(e) => setHr((prev) => prev.map((x) => (x.id === h.id ? { ...x, email: e.target.value } : x)))} className="outline-none w-52" />
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setHr((prev) => prev.filter((x) => x.id !== h.id))} className="text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Shell>
    );
  }

  if (panel === "diagnofy") {
    return (
      <Shell toast={toast}>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Diagnofy</h1>
        <p className="text-xs text-slate-500 mb-4">AI assist on lab reports. Edits stay on this workstation.</p>
        <div className="bg-white border rounded-2xl p-5 max-w-xl space-y-4">
          <CheckRow
            checked={diagnofy.enabled}
            onChange={(v) => {
              setDiagnofy((d) => ({ ...d, enabled: v }));
              flash("Diagnofy setting saved.");
            }}
            label="Enable Diagnofy on this lab node"
          />
          <CheckRow checked={diagnofy.autoSuggest} onChange={(v) => setDiagnofy((d) => ({ ...d, autoSuggest: v }))} label="Auto-suggest interpretations when a report is signed" />
          <p className="text-[11px] font-bold uppercase text-slate-400">Staff who may run Diagnofy</p>
          {logins.map((l) => (
            <CheckRow
              key={l.id}
              checked={diagnofy.who.includes(l.id)}
              onChange={(v) => setDiagnofy((d) => ({ ...d, who: v ? [...d.who, l.id] : d.who.filter((id) => id !== l.id) }))}
              label={fullName(l)}
            />
          ))}
        </div>
      </Shell>
    );
  }

  return (
    <Shell toast={toast}>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Browser security</h1>
      <p className="text-xs text-slate-500 mb-4">Session and device rules for employee logins.</p>
      <div className="bg-white border rounded-2xl p-5 max-w-xl space-y-4">
        <label className="text-[11px] font-bold block">
          Idle timeout (minutes)
          <input
            type="number"
            value={browser.timeoutMin}
            onChange={(e) => setBrowser((b) => ({ ...b, timeoutMin: Number(e.target.value) || 0 }))}
            className="block mt-1 border rounded px-2 py-1.5 text-sm w-28"
          />
        </label>
        <CheckRow checked={browser.chromeOnly} onChange={(v) => setBrowser((b) => ({ ...b, chromeOnly: v }))} label="Allow Chrome only" />
        <CheckRow checked={browser.reauthBilling} onChange={(v) => setBrowser((b) => ({ ...b, reauthBilling: v }))} label="Re-enter password before cancelling a bill" />
        <label className="text-[11px] font-bold block">
          Lock after failed logins
          <input
            type="number"
            value={browser.failedLock}
            onChange={(e) => setBrowser((b) => ({ ...b, failedLock: Number(e.target.value) || 0 }))}
            className="block mt-1 border rounded px-2 py-1.5 text-sm w-28"
          />
        </label>
        <p className="text-[11px] font-bold uppercase text-slate-400">Trusted devices</p>
        {browser.devices.map((dev, i) => (
          <div key={dev} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
            <span>{dev}</span>
            <button type="button" onClick={() => setBrowser((b) => ({ ...b, devices: b.devices.filter((_, j) => j !== i) }))} className="text-rose-600 text-xs">
              Revoke
            </button>
          </div>
        ))}
        <button type="button" onClick={() => flash("Browser security saved.")} className="px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-semibold">
          Save
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children, toast }: { children: React.ReactNode; toast: string }) {
  return (
    <div className="space-y-2">
      {toast && (
        <div className="fixed top-4 right-6 z-[90] bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-medium text-slate-600">
      {required && <span className="text-rose-500 mr-0.5">*</span>}
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function PermCard({ title, tone, icon, children }: { title: string; tone: string; icon: React.ReactNode; children: React.ReactNode }) {
  const wrap: Record<string, string> = {
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    indigo: "bg-indigo-50 text-indigo-600",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
      <p className="font-semibold text-sm text-slate-800 inline-flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${wrap[tone]}`}>{icon}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

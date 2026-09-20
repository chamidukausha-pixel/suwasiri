import { testCatalogItems } from "../../data/mockData";
import { MEDICAL_TESTS } from "../../data/medicalTests";
import { getTestPrice } from "../BillingDashboard";

export type DeptId =
  | "LAB"
  | "USG"
  | "DIGITAL XRAY"
  | "XRAY"
  | "OUTSOURCE LAB"
  | "ECG"
  | "CT SCAN"
  | "MRI"
  | "EPS"
  | "OPG"
  | "CARDIOLOGY"
  | "EEG"
  | "MAMMOGRAPHY";

export type EntryType = "Test" | "Package" | "Panel" | "Bill only";
export type RateGender = "Both" | "Male" | "Female";

export type RateEntry = {
  id: string;
  name: string;
  entryType: EntryType;
  fee: number;
  revenueShare: number;
  gender: RateGender;
  active: boolean;
};

export type NamedList = { id: string; name: string; dept: DeptId };

const STORE = "lankalab-ratelist-v1";

function rid() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function asEntry(name: string, fee: number, entryType: EntryType = "Test"): RateEntry {
  const type: EntryType = /panel/i.test(name) ? "Panel" : /package|master health|fever panel|cardiac screen/i.test(name) ? "Package" : entryType;
  return {
    id: rid(),
    name,
    entryType: type,
    fee,
    revenueShare: Math.round(fee * 0.5),
    gender: "Both",
    active: true,
  };
}

function catalogSeed(dept: DeptId): RateEntry[] {
  return MEDICAL_TESTS.filter((t) => t.dept === dept).map((t) => asEntry(t.billName, t.fee));
}

const LAB_SEED: RateEntry[] = [
  ...catalogSeed("LAB"),
  ...(
    [
      ["AEC", 100],
      ["AFB", 100],
      ["AFP", 100],
      ["A/G Ratio", 100],
      ["AMH", 100],
      ["AMH Panel", 100],
      ["Ammonia", 100],
      ["Dengue (Card Method)", 100],
      ["G6PD", 100],
      ["CBC (with absolute counts)", 500],
      ["FBC + ESR", 2500],
      ["HbA1c + Fasting Glucose", 2200],
      ["KFT without eGFR", 100],
      ...testCatalogItems.map((item) => [item.name, getTestPrice(item.name)] as const),
    ] as const
  ).map(([name, fee]) => asEntry(String(name), Number(fee), String(name).toLowerCase().includes("panel") ? "Panel" : "Test")),
];

const SEED_BY_DEPT: Record<DeptId, RateEntry[]> = {
  LAB: LAB_SEED,
  USG: [...catalogSeed("USG"), asEntry("2d Echo", 1800), asEntry("Upper Abdomen", 400), asEntry("KUB", 1500), asEntry("Pelvis", 1800), asEntry("Thyroid USG", 2200), asEntry("Obstetric scan", 2500)],
  "DIGITAL XRAY": [...catalogSeed("DIGITAL XRAY"), asEntry("Chest PA", 1200), asEntry("KUB X-ray", 1400), asEntry("Cervical spine", 1800), asEntry("Lumbar spine", 2000)],
  XRAY: [asEntry("Chest PA", 900), asEntry("Hand AP/Lat", 800), asEntry("Knee AP/Lat", 1100)],
  "OUTSOURCE LAB": [...catalogSeed("OUTSOURCE LAB"), asEntry("Histopathology block", 4500), asEntry("GeneXpert", 6200)],
  ECG: [...catalogSeed("ECG"), asEntry("12-lead ECG", 800), asEntry("ECG with report", 1200)],
  "CT SCAN": [...catalogSeed("CT SCAN"), asEntry("CT Brain", 12000), asEntry("CT Chest", 18000)],
  MRI: [...catalogSeed("MRI"), asEntry("MRI Brain", 28000), asEntry("MRI Lumbar spine", 32000)],
  EPS: [...catalogSeed("EPS"), asEntry("EP study", 8500)],
  OPG: [asEntry("OPG", 2500), asEntry("Lateral cephalogram", 2800)],
  CARDIOLOGY: [asEntry("2d Echo", 1800), asEntry("TMT", 4500), asEntry("Holter 24h", 6500)],
  EEG: [...catalogSeed("EEG"), asEntry("EEG routine", 5500)],
  MAMMOGRAPHY: [asEntry("Bilateral mammogram", 7200)],
};

export type RateStore = {
  lists: NamedList[];
  activeListId: Record<DeptId, string>;
  rows: Record<string, RateEntry[]>;
};

function seedStore(): RateStore {
  const lists: NamedList[] = [];
  const activeListId = {} as Record<DeptId, string>;
  const rows: Record<string, RateEntry[]> = {};
  (Object.keys(SEED_BY_DEPT) as DeptId[]).forEach((dept) => {
    const id = `default-${dept}`;
    lists.push({ id, name: "Default ratelist", dept });
    activeListId[dept] = id;
    rows[id] = SEED_BY_DEPT[dept].map((r) => ({ ...r, id: rid() }));
  });
  return { lists, activeListId, rows };
}

function mergeCatalogTests(store: RateStore): RateStore {
  let changed = false;
  (Object.keys(SEED_BY_DEPT) as DeptId[]).forEach((dept) => {
    const listId = store.activeListId[dept];
    if (!listId) return;
    const rows = store.rows[listId] || [];
    const extras = MEDICAL_TESTS.filter((t) => t.dept === dept).filter((t) => {
      const keys = [t.billName, t.code, t.fullForm].map((s) => s.toLowerCase());
      return !rows.some((r) => keys.some((k) => r.name.toLowerCase() === k || r.name.toLowerCase().includes(k)));
    });
    if (!extras.length) return;
    store.rows[listId] = [...rows, ...extras.map((t) => asEntry(t.billName, t.fee))];
    changed = true;
  });
  if (changed) {
    try {
      localStorage.setItem(STORE, JSON.stringify(store));
    } catch {
      /* ignore quota */
    }
  }
  return store;
}

export function loadRateStore(): RateStore {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return seedStore();
    const parsed = JSON.parse(raw) as RateStore;
    if (!parsed?.lists?.length) return seedStore();
    return mergeCatalogTests(parsed);
  } catch {
    return seedStore();
  }
}

export function saveRateStore(store: RateStore) {
  localStorage.setItem(STORE, JSON.stringify(store));
  window.dispatchEvent(new Event("lankalab-rates"));
}

export function linesForDept(store: RateStore, dept: DeptId) {
  const listId = store.activeListId[dept];
  return (store.rows[listId] || []).filter((r) => r.active).map((r) => ({ name: r.name, price: r.fee }));
}

export { rid };

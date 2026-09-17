import React, { useMemo, useState } from "react";
import { Download, Printer, Plus, Search, Pencil, MoreHorizontal, X } from "lucide-react";
import {
  type DeptId,
  type EntryType,
  type NamedList,
  type RateEntry,
  type RateStore,
  loadRateStore,
  rid,
  saveRateStore,
} from "./rateCatalog";

const FILTERS: (EntryType | "all")[] = ["all", "Test", "Package", "Panel", "Bill only"];

export default function RateListPage({
  dept,
  onClose,
  onPick,
}: {
  dept: DeptId;
  onClose: () => void;
  onPick?: (name: string, fee: number) => void;
}) {
  const [store, setStore] = useState<RateStore>(() => loadRateStore());
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const [bulk, setBulk] = useState("");
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");

  const persist = (next: RateStore) => {
    setStore(next);
    saveRateStore(next);
  };

  const lists = store.lists.filter((l) => l.dept === dept);
  const listId = store.activeListId[dept] || lists[0]?.id;
  const rows = store.rows[listId] || [];

  const shown = useMemo(() => {
    return rows.filter((r) => {
      if (tab === "active" ? !r.active : r.active) return false;
      if (filter !== "all" && r.entryType !== filter) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, tab, filter, q]);

  const patchRow = (id: string, patch: Partial<RateEntry>) => {
    persist({
      ...store,
      rows: {
        ...store.rows,
        [listId]: (store.rows[listId] || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    });
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const addList = () => {
    const name = window.prompt("Ratelist name", "Branch ratelist");
    if (!name?.trim()) return;
    const id = rid();
    const copy = (store.rows[listId] || []).map((r) => ({ ...r, id: rid() }));
    persist({
      ...store,
      lists: [...store.lists, { id, name: name.trim(), dept }],
      activeListId: { ...store.activeListId, [dept]: id },
      rows: { ...store.rows, [id]: copy },
    });
    flash("Ratelist added.");
  };

  const addEntry = (entryType: EntryType) => {
    const name = window.prompt(`${entryType} name`);
    if (!name?.trim()) return;
    const fee = Number(window.prompt("Fee (Rs.)", "100")) || 0;
    const row: RateEntry = {
      id: rid(),
      name: name.trim(),
      entryType,
      fee,
      revenueShare: Math.round(fee * 0.5),
      gender: "Both",
      active: true,
    };
    persist({
      ...store,
      rows: { ...store.rows, [listId]: [row, ...(store.rows[listId] || [])] },
    });
    setTab("active");
    flash("Price added.");
  };

  const updateAllShare = () => {
    const pct = Number(bulk);
    if (!Number.isFinite(pct)) return;
    persist({
      ...store,
      rows: {
        ...store.rows,
        [listId]: (store.rows[listId] || []).map((r) => ({ ...r, revenueShare: Math.round((r.fee * pct) / 100) })),
      },
    });
    flash("Revenue share updated.");
  };

  const downloadCsv = () => {
    const body = [["Name", "Entry type", "Fee", "Revenue share", "For gender", "Status"], ...shown.map((r) => [r.name, r.entryType, String(r.fee), String(r.revenueShare), r.gender, r.active ? "Active" : "Inactive"])]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${dept.toLowerCase()}-ratelist.csv`;
    a.click();
  };

  const printList = () => {
    const w = window.open("", "_blank", "width=900,height=800");
    if (!w) return;
    w.document.write(
      `<html><head><title>${dept} ratelist</title><style>body{font-family:sans-serif;padding:24px} table{width:100%;border-collapse:collapse} td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;font-size:12px}</style></head><body><h2>${dept} ratelist</h2><table><tr><th>Name</th><th>Type</th><th>Fee</th><th>Share</th><th>Gender</th></tr>${shown
        .map((r) => `<tr><td>${r.name}</td><td>${r.entryType}</td><td>Rs.${r.fee}</td><td>${r.revenueShare}</td><td>${r.gender}</td></tr>`)
        .join("")}</table></body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const selectList = (id: string) => persist({ ...store, activeListId: { ...store.activeListId, [dept]: id } });

  const activeCount = rows.filter((r) => r.active).length;
  const inactiveCount = rows.filter((r) => !r.active).length;

  return (
    <div className="fixed inset-0 z-[90] bg-white overflow-y-auto">
      {toast && (
        <div className="fixed top-4 right-6 z-[100] bg-slate-800 text-white text-xs px-3 py-2 rounded-lg">{toast}</div>
      )}
      <header className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Ratelist <span className="mx-1">/</span> {dept} ratelist
          </p>
          <h1 className="text-2xl font-bold text-slate-950">{dept === "LAB" ? "Lab" : dept} ratelist</h1>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-bold text-slate-700 border rounded-lg px-3 py-1.5 hover:bg-slate-50 inline-flex items-center gap-1">
          <X className="w-4 h-4" /> Back to bill
        </button>
      </header>

      <div className="px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select value={listId} onChange={(e) => selectList(e.target.value)} className="border rounded-md px-3 py-1.5 text-sm font-semibold min-w-[180px]">
            {lists.map((l: NamedList) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={addList} className="text-sky-800 text-sm font-bold inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add ratelist
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-1 border rounded-lg px-3 py-1.5 text-xs font-bold">
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
            <button type="button" onClick={() => addEntry("Test")} className="inline-flex items-center gap-1 bg-sky-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold">
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
            <div className="relative">
              <button type="button" onClick={() => setMenu((v) => !v)} className="border rounded-lg px-2 py-1.5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg text-xs w-44 z-10">
                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => { addEntry("Bill only"); setMenu(false); }}>
                    Add bill-only entry
                  </button>
                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => { addEntry("Package"); setMenu(false); }}>
                    Add package
                  </button>
                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => { addEntry("Panel"); setMenu(false); }}>
                    Add panel
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={printList} className="inline-flex items-center gap-1 border rounded-lg px-3 py-1.5 text-xs font-bold">
              <Printer className="w-3.5 h-3.5" /> Print ratelist
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8 pr-3 py-1.5 border rounded-md text-sm w-48" />
          </div>
          <span className="text-[12px] font-semibold text-slate-800">Bulk update revenue share by percentage:</span>
          <input value={bulk} onChange={(e) => setBulk(e.target.value)} className="w-16 border rounded px-2 py-1 text-sm" />
          <span className="text-sm">%</span>
          <button type="button" onClick={updateAllShare} className="text-xs font-bold border rounded-md px-2 py-1">
            Update all
          </button>
        </div>

        <p className="text-[12px] text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5">
          Note: Bill-only entries can be added from the three-dot menu beside the add new option.
        </p>
        <p className="text-[12px] text-rose-800 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5">
          Use TAB button to change the rates one by one.
        </p>

        <div className="flex items-center gap-5 border-b text-[13px]">
          <button type="button" onClick={() => setTab("active")} className={`pb-2 -mb-px border-b-2 font-semibold ${tab === "active" ? "border-sky-600 text-sky-900" : "border-transparent text-slate-600"}`}>
            Active <span className="text-slate-400">{activeCount}</span>
          </button>
          <button type="button" onClick={() => setTab("inactive")} className={`pb-2 -mb-px border-b-2 font-semibold ${tab === "inactive" ? "border-sky-600 text-sky-900" : "border-transparent text-slate-600"}`}>
            Inactive <span className="text-slate-400">{inactiveCount}</span>
          </button>
        </div>

        <div className="flex gap-4 text-[12px] font-bold text-slate-700">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={filter === f ? "text-sky-800 underline" : ""}>
              {f === "all" ? "Tests" : f === "Test" ? "Tests" : f === "Bill only" ? "Bill only" : `${f}s`}
            </button>
          ))}
        </div>

        <div className="border rounded-xl overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-wide text-slate-500 bg-slate-50">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Entry type</th>
                <th className="px-3 py-2">Fee</th>
                <th className="px-3 py-2">Revenue share amount</th>
                <th className="px-3 py-2">For gender</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      <input
                        value={r.name}
                        onChange={(e) => patchRow(r.id, { name: e.target.value })}
                        className="font-semibold outline-none bg-transparent min-w-[140px]"
                      />
                      <Pencil className="w-3 h-3 text-slate-400" />
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select value={r.entryType} onChange={(e) => patchRow(r.id, { entryType: e.target.value as EntryType })} className="text-xs border rounded px-1 py-0.5">
                      {(["Test", "Package", "Panel", "Bill only"] as const).map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      <input
                        value={r.fee}
                        onChange={(e) => patchRow(r.id, { fee: Number(e.target.value) || 0 })}
                        className="w-20 border rounded px-1.5 py-0.5 outline-none"
                      />
                      <Pencil className="w-3 h-3 text-slate-400" />
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={r.revenueShare}
                      onChange={(e) => patchRow(r.id, { revenueShare: Number(e.target.value) || 0 })}
                      className="w-24 border rounded px-1.5 py-1 outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select value={r.gender} onChange={(e) => patchRow(r.id, { gender: e.target.value as RateEntry["gender"] })} className="border rounded px-2 py-1 text-xs">
                      <option>Both</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {onPick && r.active && (
                      <button type="button" onClick={() => onPick(r.name, r.fee)} className="text-sky-800 font-bold mr-3">
                        Use
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => patchRow(r.id, { active: !r.active })}
                      className="text-slate-600 font-semibold mr-2"
                    >
                      {r.active ? "Remove" : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

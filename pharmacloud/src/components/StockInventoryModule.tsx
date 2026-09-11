import React, { useState } from 'react';
import { InventoryItem } from '../types';
import {
  Search,
  Plus,
  Filter,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Building,
  RefreshCw,
  Scan,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowDownRight,
  Minus,
  Check,
  Zap,
  Sparkles,
  Printer,
  QrCode
} from 'lucide-react';

interface StockInventoryModuleProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (newItem: InventoryItem) => void;
  onUpdateStock: (id: string, qtyToAdd: number) => void;
  onDeductStock: (id: string, qtyToDeduct: number) => void;
}

export const StockInventoryModule: React.FC<StockInventoryModuleProps> = ({
  inventory,
  onAddInventoryItem,
  onUpdateStock,
  onDeductStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Barcode Label Generation State
  const [selectedLabelItem, setSelectedLabelItem] = useState<InventoryItem | null>(null);
  const [labelQuantity, setLabelQuantity] = useState<number>(6);

  // Quick Barcode Scan State inside stock page
  const [quickBarcodeQuery, setQuickBarcodeQuery] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState<number>(10);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for adding item
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [nmraRegNo, setNmraRegNo] = useState('SL-NMRA-2026-');
  const [category, setCategory] = useState<InventoryItem['category']>('Endocrine');
  const [dosageForm, setDosageForm] = useState<InventoryItem['dosageForm']>('Tablet');
  const [strength, setStrength] = useState('500mg');
  const [stockQty, setStockQty] = useState(500);
  const [unitPriceLkr, setUnitPriceLkr] = useState(25.00);
  const [batchNumber, setBatchNumber] = useState('BAT2026A01');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [pharmacyLocation, setPharmacyLocation] = useState<InventoryItem['pharmacyLocation']>('Colombo Central');

  // Calculate Unified Stock Valuation Metrics
  const totalStockValueLkr = inventory.reduce((sum, item) => sum + item.stockQty * item.unitPriceLkr, 0);
  const totalUnitsInStock = inventory.reduce((sum, item) => sum + item.stockQty, 0);
  const lowStockItemsCount = inventory.filter((item) => item.stockQty <= item.reorderLevel).length;

  const categoriesList = ['All', 'Endocrine', 'Cardiovascular', 'Respiratory', 'Antibiotic', 'Analgesic', 'Gastrointestinal'];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nmraRegNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || item.pharmacyLocation === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Handle Quick Barcode Dispense
  const handleExecuteQuickScan = () => {
    if (!quickBarcodeQuery.trim()) return;

    const matchedItem = inventory.find(
      (item) =>
        item.nmraRegNo.toLowerCase() === quickBarcodeQuery.trim().toLowerCase() ||
        item.brandName.toLowerCase() === quickBarcodeQuery.trim().toLowerCase() ||
        item.id.toLowerCase() === quickBarcodeQuery.trim().toLowerCase()
    );

    if (matchedItem) {
      if (matchedItem.stockQty < scannedQuantity) {
        setScanMessage({
          type: 'error',
          text: `Insufficient stock! Requested ${scannedQuantity} units, but only ${matchedItem.stockQty} remaining for ${matchedItem.brandName}.`,
        });
      } else {
        onDeductStock(matchedItem.id, scannedQuantity);
        setScanMessage({
          type: 'success',
          text: `SUCCESS: Deducted ${scannedQuantity} units of ${matchedItem.brandName} (${matchedItem.strength}). Remaining stock: ${matchedItem.stockQty - scannedQuantity} units.`,
        });
      }
    } else {
      setScanMessage({
        type: 'error',
        text: `Barcode / Drug code "${quickBarcodeQuery}" not found in Pharmacy Stock Ledger.`,
      });
    }

    setTimeout(() => setScanMessage(null), 5000);
  };

  // SVG Barcode Line Renderer helper
  const renderBarcodeSVG = (nmraCode: string) => {
    // Deterministic barcode pattern generation based on string chars
    const bars: boolean[] = [];
    // Start pattern
    bars.push(true, false, true, true, false);
    for (let i = 0; i < nmraCode.length; i++) {
      const code = nmraCode.charCodeAt(i);
      bars.push(code % 2 === 0, code % 3 === 0, true, false, code % 5 === 0);
    }
    // Stop pattern
    bars.push(true, true, false, true, true);

    return (
      <svg className="w-full h-12" viewBox={`0 0 ${bars.length * 4} 40`} preserveAspectRatio="none">
        {bars.map((isBar, idx) =>
          isBar ? <rect key={idx} x={idx * 4} y="0" width="3" height="40" fill="#0f172a" /> : null
        )}
      </svg>
    );
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !genericName) return;

    const newItem: InventoryItem = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      brandName,
      genericName,
      nmraRegNo,
      category,
      dosageForm,
      strength,
      packSize: 100,
      stockQty: Number(stockQty),
      reorderLevel: 200,
      unitPriceLkr: Number(unitPriceLkr),
      batchNumber,
      expiryDate,
      pharmacyLocation,
      status: stockQty < 200 ? 'Low Stock' : 'In Stock',
    };

    onAddInventoryItem(newItem);
    setShowAddModal(false);

    // Auto-trigger Barcode Label Generation for newly registered NMRA item
    setSelectedLabelItem(newItem);

    setBrandName('');
    setGenericName('');
  };

  return (
    <div className="space-y-6">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30">
              <Package className="w-3.5 h-3.5" />
              Pharmacy Operational Stock Ledger
            </div>
            <h2 className="text-2xl font-extrabold text-white">Unified Pharmacy Stock & Drug Quantity Ledger</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Consolidated real-time tracking of pharmacy drug inventory quantities, NMRA registration codes, multi-depot stock levels, batch expiry dates, and barcode barcode label printing. (Financial valuation is protected under Admin Portal).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add NMRA Registered Stock
            </button>
          </div>
        </div>
      </div>

      {/* Operational Stock KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Drug Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Drugs Count</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {inventory.length} <span className="text-xs text-slate-500 font-normal">Formulations</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All Regulated by NMRA Sri Lanka
            </div>
          </div>
        </div>

        {/* Card 2: Total Units in Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Drug Units In Stock</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalUnitsInStock.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Across {inventory.length} registered drug formulations
            </div>
          </div>
        </div>

        {/* Card 3: Stock Shortages */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock / Shortages</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {lowStockItemsCount} <span className="text-xs font-normal text-slate-500">items below reorder</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Requires automated replenishment order
            </div>
          </div>
        </div>

        {/* Card 4: Multi-Depot Locations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Depots</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              4 Depots
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Colombo, Kandy, Galle & Jaffna Hubs
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Barcode Drug Dispenser Scanner Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-5 border border-teal-700/50 text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-teal-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-lg border border-teal-500/30">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Quick Barcode Scanner & Instant Stock Deductor</h3>
              <p className="text-slate-300 text-[11px]">Scan or enter NMRA Reg / Drug Code to automatically deduct pharmacy stock when issuing.</p>
            </div>
          </div>
          <span className="bg-teal-400/20 text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-teal-400/30">
            ⚡ Instant Real-Time Deduct
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <Scan className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Scan Barcode / Enter Drug NMRA Code (e.g. SL-NMRA-2026-MET, SL-NMRA-2026-LOS, Metformin)..."
              value={quickBarcodeQuery}
              onChange={(e) => setQuickBarcodeQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuickScan()}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-teal-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-950 border border-teal-700/60 rounded-xl p-1 text-xs text-slate-300">
              <span className="px-2 text-[11px] text-slate-400">Qty:</span>
              <input
                type="number"
                min={1}
                value={scannedQuantity}
                onChange={(e) => setScannedQuantity(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-bold text-teal-300 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExecuteQuickScan}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shrink-0 shadow-lg shadow-teal-950/50 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> Scan & Deduct
            </button>
          </div>
        </div>

        {scanMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              scanMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-200 border border-rose-500/50'
            }`}
          >
            {scanMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by brand name, generic name, NMRA code, or batch no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700"
          >
            <option value="All">All Categories</option>
            {categoriesList.filter((c) => c !== 'All').map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700"
          >
            <option value="All">All Pharmacy Depots</option>
            <option value="Colombo Central">Colombo Central Depot</option>
            <option value="Kandy General">Kandy General Depot</option>
            <option value="Galle Health Hub">Galle Health Hub</option>
            <option value="Jaffna Depot">Jaffna Regional Depot</option>
          </select>
        </div>
      </div>

      {/* Unified Pharmacy Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Medication & Generic Name</th>
                <th className="p-3.5">NMRA Reg & Batch</th>
                <th className="p-3.5">Category & Location</th>
                <th className="p-3.5">Unit Price & Total Value (LKR)</th>
                <th className="p-3.5">Current Stock Level</th>
                <th className="p-3.5 text-right">Interactive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredInventory.map((item) => {
                const itemTotalValue = item.stockQty * item.unitPriceLkr;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{item.brandName}</div>
                      <div className="text-slate-500 text-[11px]">
                        {item.genericName} • {item.strength} ({item.dosageForm})
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] block w-max mb-0.5">
                        {item.nmraRegNo}
                      </span>
                      <span className="text-slate-500 text-[10px]">Batch: {item.batchNumber}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium inline-block mb-1">
                        {item.category}
                      </span>
                      <div className="text-slate-600 flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        {item.pharmacyLocation}
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-slate-900">
                      <div>Rs. {item.unitPriceLkr.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ unit</span></div>
                      <div className="text-emerald-700 text-[11px] font-extrabold mt-0.5">
                        Val: Rs. {itemTotalValue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.stockQty}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.stockQty < item.reorderLevel ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((item.stockQty / (item.reorderLevel * 3)) * 100, 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedLabelItem(item)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded text-xs border border-indigo-200 transition inline-flex items-center gap-1"
                        title="Print NMRA PDF Barcode Label"
                      >
                        <Printer className="w-3 h-3" /> Label
                      </button>

                      <button
                        onClick={() => {
                          if (item.stockQty >= 10) {
                            onDeductStock(item.id, 10);
                          } else {
                            alert('Insufficient stock to deduct 10 units!');
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-2 py-1 rounded text-xs border border-rose-200 transition inline-flex items-center gap-1"
                        title="Issue drug & deduct 10 units"
                      >
                        <Minus className="w-3 h-3" /> Issue -10
                      </button>

                      <button
                        onClick={() => onUpdateStock(item.id, 500)}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold px-2 py-1 rounded text-xs border border-teal-200 transition inline-flex items-center gap-1"
                        title="Restock 500 units"
                      >
                        <Plus className="w-3 h-3" /> Restock +500
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding new NMRA item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                Register New NMRA Stock Item
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metfor-500"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin Hydrochloride"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">NMRA Registration No *</label>
                  <input
                    type="text"
                    required
                    value={nmraRegNo}
                    onChange={(e) => setNmraRegNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Therapeutic Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Endocrine">Endocrine</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Analgesic">Analgesic</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Strength</label>
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Price in LKR (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPriceLkr}
                    onChange={(e) => setUnitPriceLkr(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Depot Location</label>
                  <select
                    value={pharmacyLocation}
                    onChange={(e) => setPharmacyLocation(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Colombo Central">Colombo Central</option>
                    <option value="Kandy General">Kandy General</option>
                    <option value="Galle Health Hub">Galle Health Hub</option>
                    <option value="Jaffna Depot">Jaffna Depot</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                >
                  Save NMRA Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Barcode Label Generator Modal */}
      {selectedLabelItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    NMRA Printable PDF Barcode Labels
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Generating 2" x 1" barcode stickers using NMRA Reg: <strong>{selectedLabelItem.nmraRegNo}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLabelItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Label Quantity Selector */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Select Print Sticker Quantity:</span>
              <div className="flex items-center gap-2">
                {[1, 6, 12, 24].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setLabelQuantity(qty)}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      labelQuantity === qty
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {qty} Label{qty > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Printable Label Grid Preview */}
            <div className="border border-slate-300 rounded-2xl p-4 bg-slate-100/70 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: labelQuantity }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm font-sans space-y-1 text-[10px] text-slate-900 relative overflow-hidden"
                  >
                    <div className="font-bold uppercase tracking-wider text-teal-800 text-[11px] truncate">
                      {selectedLabelItem.brandName} ({selectedLabelItem.strength})
                    </div>
                    <div className="text-slate-600 truncate">{selectedLabelItem.genericName}</div>

                    {/* Dynamic Barcode Graphics */}
                    <div className="py-1">
                      {renderBarcodeSVG(selectedLabelItem.nmraRegNo)}
                    </div>

                    <div className="font-mono text-center font-extrabold text-[11px] bg-slate-100 py-0.5 rounded text-slate-800">
                      {selectedLabelItem.nmraRegNo}
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>B: {selectedLabelItem.batchNumber}</span>
                      <span>Exp: {selectedLabelItem.expiryDate}</span>
                      <span className="font-bold text-emerald-700">Rs. {selectedLabelItem.unitPriceLkr.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Ready for high-resolution thermal & PDF printing
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLabelItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Barcode Labels ({labelQuantity})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

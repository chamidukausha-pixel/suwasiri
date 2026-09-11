import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, Filter, AlertCircle, CheckCircle2, ShieldCheck, MapPin, Building, RefreshCw } from 'lucide-react';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (newItem: InventoryItem) => void;
  onUpdateStock: (id: string, qtyToAdd: number) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  onAddInventoryItem,
  onUpdateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
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
    // Reset
    setBrandName('');
    setGenericName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Real-Time Pharmacy Stock & NMRA Ledger</h2>
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full border border-teal-200">
              SL NMRA Regulated
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Batch & expiry tracking across Sri Lankan pharmacy depots with regulated MRP pricing in LKR (Rs.).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add NMRA Registered Medication
        </button>
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
            <option value="Endocrine">Endocrine</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Respiratory">Respiratory</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Analgesic">Analgesic</option>
            <option value="Gastrointestinal">Gastrointestinal</option>
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

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Medication & Generic Name</th>
                <th className="p-3.5">NMRA Reg & Batch</th>
                <th className="p-3.5">Category & Location</th>
                <th className="p-3.5">Price (LKR)</th>
                <th className="p-3.5">Stock Level</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{item.brandName}</div>
                    <div className="text-slate-500 text-[11px]">{item.genericName} • {item.strength} ({item.dosageForm})</div>
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
                    Rs. {item.unitPriceLkr.toFixed(2)}
                    <span className="text-[10px] font-normal text-slate-400 block">per unit</span>
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

                  <td className="p-3.5 font-medium text-slate-700">
                    {item.expiryDate}
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onUpdateStock(item.id, 500)}
                      className="bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold px-2.5 py-1 rounded text-xs border border-slate-200 transition inline-flex items-center gap-1"
                      title="Add 500 units to stock"
                    >
                      <Plus className="w-3 h-3" /> +500 Qty
                    </button>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

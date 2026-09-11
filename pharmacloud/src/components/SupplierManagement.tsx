import React, { useState } from 'react';
import { Supplier, SupplierOrder, InventoryItem } from '../types';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  DollarSign,
  PackageCheck,
  Clock,
  Star,
  CheckCircle2,
  FileText,
  AlertCircle,
  Send,
  ArrowRight
} from 'lucide-react';

interface SupplierManagementProps {
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  inventory: InventoryItem[];
  onAddSupplier: (newSupplier: Supplier) => void;
  onAddSupplierOrder: (newOrder: SupplierOrder) => void;
  onReceiveSupplierOrder: (orderId: string) => void;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  suppliers,
  supplierOrders,
  inventory,
  onAddSupplier,
  onAddSupplierOrder,
  onReceiveSupplierOrder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'orders'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  // Form State for New Supplier
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nmraLicenseNo, setNmraLicenseNo] = useState('NMRA/IMP/2026/');
  const [category, setCategory] = useState('Endocrine & Diabetes Care');
  const [leadTimeDays, setLeadTimeDays] = useState(3);

  // Form State for Purchase Order
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedMedId, setSelectedMedId] = useState(inventory[0]?.id || '');
  const [poQty, setPoQty] = useState(1000);
  const [poUnitCost, setPoUnitCost] = useState(12.00);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nmraLicenseNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson) return;

    const newSup: Supplier = {
      id: `SUP-${100 + suppliers.length + 1}`,
      companyName,
      contactPerson,
      email,
      phone,
      address,
      nmraLicenseNo,
      category,
      rating: 4.8,
      leadTimeDays: Number(leadTimeDays),
      activeContractsCount: 1,
      status: 'Active',
    };

    onAddSupplier(newSup);
    setShowAddSupplierModal(false);
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    const med = inventory.find((i) => i.id === selectedMedId) || inventory[0];

    const totalLkr = Number(poQty) * Number(poUnitCost);

    const newPO: SupplierOrder = {
      id: `PO-2026-${Math.floor(800 + Math.random() * 200)}`,
      supplierId: sup.id,
      supplierName: sup.companyName,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + sup.leadTimeDays * 86400000).toISOString().split('T')[0],
      items: [
        {
          brandName: med ? med.brandName : 'Metfor-500',
          genericName: med ? `${med.genericName} (${med.strength})` : 'Metformin HCl 500mg',
          quantity: Number(poQty),
          unitCostLkr: Number(poUnitCost),
        },
      ],
      totalLkr,
      status: 'Purchase Order Issued',
      paymentTerms: '30 Days Net',
    };

    onAddSupplierOrder(newPO);
    setShowAddOrderModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Supplier Sub-Header Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'directory'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Suppliers Directory ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'orders'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Supply Contracts & POs ({supplierOrders.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {activeSubTab === 'directory' ? (
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Register Drug Supplier
            </button>
          ) : (
            <button
              onClick={() => setShowAddOrderModal(true)}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-4 h-4" /> Issue Supplier Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* DIRECTORY VIEW */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drug suppliers by name, category, NMRA import license, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((sup) => (
              <div key={sup.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {sup.id}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1">{sup.companyName}</h3>
                    <p className="text-xs text-teal-700 font-semibold">{sup.category}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> {sup.rating}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Contact: <strong>{sup.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.address}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">NMRA Import License</span>
                    <span className="font-mono font-bold text-slate-800">{sup.nmraLicenseNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Lead Time</span>
                    <span className="font-bold text-slate-800">{sup.leadTimeDays} Days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS VIEW */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {supplierOrders.map((po) => {
              const isReceived = po.status === 'Received & Injected to Stock';

              return (
                <div key={po.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-900 text-amber-400 px-2.5 py-1 rounded-md">
                        {po.id}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{po.supplierName}</h4>
                        <span className="text-[11px] text-slate-500">Ordered: {po.orderDate} • Delivery: {po.expectedDelivery}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isReceived
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordered Stock Items:</h5>
                    <div className="space-y-1.5">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{item.brandName}</span>
                            <span className="text-slate-500 text-[11px] block">{item.genericName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 block">{item.quantity.toLocaleString()} units</span>
                            <span className="text-[11px] text-slate-500">@ Rs. {item.unitCostLkr.toFixed(2)} / unit</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Total Purchase Cost:</span>
                      <div className="text-lg font-extrabold text-slate-900">
                        Rs. {po.totalLkr.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {!isReceived && (
                      <button
                        onClick={() => onReceiveSupplierOrder(po.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition"
                      >
                        <PackageCheck className="w-4 h-4" /> Receive Shipment & Auto-Inject into Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Register Drug Supplier
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Company / Importer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lanka Medical Importers Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rohan Wickramasinghe"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 11 268 9100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="procurement@lankamedical.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">NMRA License No *</label>
                  <input
                    type="text"
                    required
                    value={nmraLicenseNo}
                    onChange={(e) => setNmraLicenseNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Address in Sri Lanka..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Save & Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" /> Issue Supplier Purchase Order
              </h3>
              <button onClick={() => setShowAddOrderModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAddOrderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Medication to Order *</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.brandName} ({i.genericName}) - Current Stock: {i.stockQty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Order Quantity (Units) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={poQty}
                    onChange={(e) => setPoQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit Wholesale Cost (LKR) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    required
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Calculated Total PO Cost:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  Rs. {(Number(poQty) * Number(poUnitCost)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

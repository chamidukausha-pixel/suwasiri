import React, { useState } from 'react';
import { InventoryItem, CustomerBill, BillItem } from '../types';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Scan,
  User,
  DollarSign,
  Printer,
  QrCode,
  Sparkles,
  Zap
} from 'lucide-react';

interface BillingModuleProps {
  inventory: InventoryItem[];
  bills: CustomerBill[];
  onAddBill: (newBill: CustomerBill) => void;
  onDeductStock: (id: string, qtyToDeduct: number) => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  inventory,
  bills,
  onAddBill,
  onDeductStock,
}) => {
  // POS Cart State
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('Nimal Bandara');
  const [customerPhone, setCustomerPhone] = useState('+94 77 890 1234');
  const [customerNIC, setCustomerNIC] = useState('198810293810V');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Suwasiri Pay' | 'Insurance'>('Cash');

  // Interactive Modal / SMS Dispatcher State
  const [dispatchedSmsNotice, setDispatchedSmsNotice] = useState<{
    phone: string;
    billId: string;
    netLkr: number;
    itemsCount: number;
    smsText: string;
  } | null>(null);

  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<CustomerBill | null>(null);

  // Search items to add
  const searchResults = inventory.filter(
    (i) =>
      i.brandName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      i.genericName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      i.nmraRegNo.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find((c) => c.item.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stockQty) {
        alert(`Cannot add more! Stock for ${item.brandName} is limited to ${item.stockQty} units.`);
        return;
      }
      setCart(
        cart.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      if (item.stockQty < 1) {
        alert(`Stock for ${item.brandName} is empty!`);
        return;
      }
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === id) {
            const newQty = c.quantity + delta;
            if (newQty > c.item.stockQty) {
              alert(`Cannot exceed stock limit of ${c.item.stockQty} units.`);
              return c;
            }
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.item.id !== id));
  };

  // Financial Subtotals
  const subtotalLkr = cart.reduce((sum, c) => sum + c.quantity * c.item.unitPriceLkr, 0);
  const discountLkr = (subtotalLkr * discountPercent) / 100;
  const netLkr = subtotalLkr - discountLkr;

  const handleCheckoutAndDispatchBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty! Please add products before dispatching bill.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Customer Phone Number is required to dispatch SMS bill!');
      return;
    }

    const newBillId = `INV-BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const billItems: BillItem[] = cart.map((c) => ({
      inventoryId: c.item.id,
      brandName: c.item.brandName,
      genericName: c.item.genericName,
      dosageForm: c.item.dosageForm,
      strength: c.item.strength,
      unitPriceLkr: c.item.unitPriceLkr,
      quantity: c.quantity,
      subtotalLkr: c.quantity * c.item.unitPriceLkr,
    }));

    const newBill: CustomerBill = {
      id: newBillId,
      customerName,
      customerPhone,
      customerNIC: customerNIC || undefined,
      items: billItems,
      totalLkr: subtotalLkr,
      discountLkr,
      netLkr,
      paymentMethod,
      timestamp: new Date().toLocaleString('en-LK'),
      smsDispatched: true,
      pharmacistName: 'Dr. K. Perera (SLMC-8921)',
    };

    // Deduct stock for each item in cart
    cart.forEach((c) => {
      onDeductStock(c.item.id, c.quantity);
    });

    onAddBill(newBill);

    // SMS Draft text for dispatch
    const smsDraft = `PharmaCloud Digital Bill: Dear ${customerName}, your purchase of ${cart.length} item(s) totalling Rs. ${netLkr.toFixed(2)} at Colombo Central Pharmacy is complete. View itemized receipt: https://suwasiri.health.lk/bill/${newBillId}`;

    setDispatchedSmsNotice({
      phone: customerPhone,
      billId: newBillId,
      netLkr,
      itemsCount: cart.length,
      smsText: smsDraft,
    });

    // Reset Cart
    setCart([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30">
              <ShoppingCart className="w-3.5 h-3.5" />
              Customer POS Billing & SMS Receipt Dispatcher
            </div>
            <h2 className="text-2xl font-extrabold text-white">POS Customer Billing & SMS Bill Portal</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Scan or select pharmacy products purchased by customers, automatically calculate NMRA regulated LKR totals, deduct inventory stock, and instantly send SMS bill links directly to customer mobile numbers.
            </p>
          </div>
        </div>
      </div>

      {/* POS Working Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Drug Product Selector */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-600" /> Select Drug Items for Purchase
            </h3>
            <span className="text-xs text-slate-500">{inventory.length} Available</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Brand, Generic, or NMRA Reg code..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-200/80 transition flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{item.brandName}</div>
                  <div className="text-slate-500 text-[11px]">
                    {item.genericName} • {item.strength}
                  </div>
                  <div className="text-emerald-700 font-extrabold mt-0.5">
                    Rs. {item.unitPriceLkr.toFixed(2)} / unit • Stock: {item.stockQty}
                  </div>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  disabled={item.stockQty < 1}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (7 cols): Customer Bill & Phone SMS Dispatcher */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCheckoutAndDispatchBill} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Current Customer Purchase Bill
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {cart.length} Item(s)
              </span>
            </div>

            {/* Cart Items Table */}
            {cart.length > 0 ? (
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60 max-h-60 overflow-y-auto">
                {cart.map((c) => {
                  const itemSubtotal = c.quantity * c.item.unitPriceLkr;
                  return (
                    <div
                      key={c.item.id}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 block truncate">{c.item.brandName}</span>
                        <span className="text-slate-500 text-[11px]">
                          Rs. {c.item.unitPriceLkr.toFixed(2)} x {c.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(c.item.id, -1)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-900">{c.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(c.item.id, 1)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-slate-900 w-20 text-right">
                          Rs. {itemSubtotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(c.item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl text-xs space-y-1">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">Customer Bill Cart is Empty</p>
                <p>Click "Add" on any product on the left panel to build the bill.</p>
              </div>
            )}

            {/* Customer Details & Phone Number Inputs */}
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-3 text-xs">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-600" /> Customer Phone Number & SMS Receipt Dispatch
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 XXX XXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">NIC (Optional)</label>
                  <input
                    type="text"
                    value={customerNIC}
                    onChange={(e) => setCustomerNIC(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Calculation & Payment Mode */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal (LKR):</span>
                <span className="font-bold text-slate-900">Rs. {subtotalLkr.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Discount (%):</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-20 p-1 bg-white border border-slate-200 rounded text-right font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Payment Mode:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="p-1 bg-white border border-slate-200 rounded font-medium text-slate-900"
                >
                  <option value="Cash">Cash Payment</option>
                  <option value="Card">Visa / MasterCard</option>
                  <option value="Suwasiri Pay">Suwasiri Pay App</option>
                  <option value="Insurance">Health Insurance</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-slate-900 text-sm">
                <span>Net Payable Bill (LKR):</span>
                <span className="text-teal-700 text-base">Rs. {netLkr.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cart.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-teal-950/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Complete Sale & Send Bill Link to Customer Phone ({customerPhone})
            </button>
          </form>

          {/* Customer Bills History Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between border-b pb-3">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" /> Dispatched Customer Bills History
              </span>
              <span className="text-xs text-slate-500">{bills.length} Total Bills</span>
            </h3>

            <div className="space-y-2">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span>{bill.customerName}</span>
                      <span className="bg-indigo-100 text-indigo-900 font-mono text-[11px] px-2 py-0.5 rounded">
                        📱 {bill.customerPhone}
                      </span>
                      <span className="text-slate-400 font-normal">({bill.id})</span>
                    </div>

                    <div className="text-slate-600 text-[11px] mt-1">
                      {bill.items.map((i) => `${i.brandName} x${i.quantity}`).join(', ')} • Paid via {bill.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-teal-800 text-sm">
                      Rs. {bill.netLkr.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setSelectedBillForReceipt(bill)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2.5 py-1 rounded text-xs transition flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched SMS Confirmation Popup Modal */}
      {dispatchedSmsNotice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">SMS Bill Dispatched to Customer!</h3>
              <p className="text-slate-600 text-xs">
                Bill <strong>{dispatchedSmsNotice.billId}</strong> (Rs. {dispatchedSmsNotice.netLkr.toFixed(2)}) has been dispatched to <strong>{dispatchedSmsNotice.phone}</strong> and stock auto-deducted.
              </p>
            </div>

            {/* Simulated Phone SMS Screen */}
            <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-xs space-y-2 shadow-inner border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-teal-400 border-b border-slate-800 pb-1">
                <span>📱 OUTGOING SMS TRANSMISSION</span>
                <span>TO: {dispatchedSmsNotice.phone}</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                "{dispatchedSmsNotice.smsText}"
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setDispatchedSmsNotice(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                Close & Return to POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Printable Receipt Modal */}
      {selectedBillForReceipt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600" /> Itemized Customer Receipt
              </h3>
              <button
                onClick={() => setSelectedBillForReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
              <div className="text-center border-b pb-2 space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">PHARMACOLOUD & SUWASIRI HEALTH</h4>
                <p className="text-slate-500 text-[10px]">Colombo Central Main Depot • Reg # SL-MOH-2026</p>
                <p className="text-slate-700 font-bold">Receipt #{selectedBillForReceipt.id}</p>
              </div>

              <div className="space-y-1 text-slate-700 text-[11px]">
                <div>Customer: <strong>{selectedBillForReceipt.customerName}</strong></div>
                <div>Phone: <strong>{selectedBillForReceipt.customerPhone}</strong></div>
                <div>Date: {selectedBillForReceipt.timestamp}</div>
                <div>Pharmacist: {selectedBillForReceipt.pharmacistName}</div>
              </div>

              <div className="border-t border-b py-2 space-y-1">
                {selectedBillForReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-900">
                    <span>{item.brandName} x{item.quantity}</span>
                    <span>Rs. {item.subtotalLkr.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-slate-900 font-bold">
                <div>Subtotal: Rs. {selectedBillForReceipt.totalLkr.toFixed(2)}</div>
                {selectedBillForReceipt.discountLkr > 0 && (
                  <div className="text-rose-600">Discount: -Rs. {selectedBillForReceipt.discountLkr.toFixed(2)}</div>
                )}
                <div className="text-sm text-teal-800">Net Total: Rs. {selectedBillForReceipt.netLkr.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

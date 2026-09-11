import React, { useState } from 'react';
import { OnlineProduct, OnlineOrder, InventoryItem } from '../types';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Truck,
  MapPin,
  Upload,
  FileText,
  Clock,
  ShieldCheck,
  Star,
  Sparkles,
  Phone,
  User,
  CreditCard,
  Send,
  Building,
  AlertCircle,
  Eye,
  Scan
} from 'lucide-react';

interface OnlineStoreModuleProps {
  products: OnlineProduct[];
  orders: OnlineOrder[];
  inventory: InventoryItem[];
  onPlaceOrder: (order: OnlineOrder) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OnlineOrder['status']) => void;
  onDeductStock: (inventoryId: string, qty: number) => void;
}

export const OnlineStoreModule: React.FC<OnlineStoreModuleProps> = ({
  products,
  orders,
  inventory,
  onPlaceOrder,
  onUpdateOrderStatus,
  onDeductStock,
}) => {
  const [viewMode, setViewMode] = useState<'storefront' | 'orders'>('storefront');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<OnlineProduct | null>(null);

  // Cart State
  const [cart, setCart] = useState<{ product: OnlineProduct; qty: number }[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('Kasun Kalhara');
  const [customerPhone, setCustomerPhone] = useState('+94 77 456 7890');
  const [deliveryAddress, setDeliveryAddress] = useState('No. 45, Temple Road, Nugegoda, Colombo');
  const [deliveryMethod, setDeliveryMethod] = useState<OnlineOrder['deliveryMethod']>('Home Express Delivery');
  const [paymentMethod, setPaymentMethod] = useState<OnlineOrder['paymentMethod']>('Suwasiri Pay');
  const [prescriptionAttached, setPrescriptionAttached] = useState(false);
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [orderSuccessNotice, setOrderSuccessNotice] = useState<string | null>(null);

  const categories = ['All', 'Endocrine', 'Cardiovascular', 'Respiratory', 'Antibiotic', 'Analgesic', 'Gastrointestinal'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: OnlineProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: OnlineProduct; qty: number }[]
    );
  };

  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.unitPriceLkr * i.qty, 0);
  const deliveryFee = deliveryMethod === 'Home Express Delivery' ? 250 : 0;
  const cartNetTotal = cartSubtotal + deliveryFee;

  const requiresPrescriptionInCart = cart.some((i) => i.product.requiresPrescription);

  const handleSimulatePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionAttached(true);
      setPrescriptionFileName(e.target.files[0].name);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (requiresPrescriptionInCart && !prescriptionAttached) {
      alert('One or more items in your cart require a valid prescription. Please upload your prescription photo before proceeding.');
      return;
    }

    const newOrder: OnlineOrder = {
      id: `ORD-ONL-2026-${Math.floor(550 + Math.random() * 400)}`,
      customerName,
      customerPhone,
      deliveryAddress: deliveryMethod === 'Click & Store Pickup' ? 'Colombo Central Pharmacy Counter' : deliveryAddress,
      deliveryMethod,
      paymentMethod,
      prescriptionUploaded: prescriptionAttached,
      prescriptionImageName: prescriptionFileName || undefined,
      items: cart.map((i) => ({
        productId: i.product.id,
        brandName: `${i.product.brandName} (${i.product.strength})`,
        quantity: i.qty,
        unitPriceLkr: i.product.unitPriceLkr,
        subtotalLkr: i.product.unitPriceLkr * i.qty,
      })),
      totalLkr: cartSubtotal,
      deliveryFeeLkr: deliveryFee,
      netLkr: cartNetTotal,
      status: requiresPrescriptionInCart ? 'Pending Verification' : 'Pharmacist Approved',
      orderTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    onPlaceOrder(newOrder);

    // Automatically deduct inventory stock if auto-approved
    if (!requiresPrescriptionInCart) {
      cart.forEach((i) => {
        onDeductStock(i.product.inventoryId, i.qty);
      });
    }

    setCart([]);
    setShowCheckoutModal(false);
    setShowCartDrawer(false);

    setOrderSuccessNotice(
      `🎉 Online Order ${newOrder.id} placed successfully! An SMS confirmation with live tracking link has been dispatched to ${customerPhone}.`
    );

    setTimeout(() => setOrderSuccessNotice(null), 7000);
  };

  return (
    <div className="space-y-6">
      {/* Module Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30 mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Suwasiri E-Pharmacy Customer Storefront & Online Sales
          </div>
          <h2 className="text-2xl font-extrabold text-white">Online E-Pharmacy Storefront & Delivery</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Browse registered medicines with images, add to cart, upload prescription photos, order home express delivery or store pickup, and track live pharmacist order dispatches.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('storefront')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'storefront' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Customer Storefront
          </button>
          <button
            onClick={() => setViewMode('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'orders' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" /> Pharmacist Orders Manager ({orders.length})
          </button>
        </div>
      </div>

      {orderSuccessNotice && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl text-xs font-bold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{orderSuccessNotice}</span>
        </div>
      )}

      {/* STOREFRONT VIEW */}
      {viewMode === 'storefront' && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Category Filter, Cart Button */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search online pharmacy store by medicine name, generic ingredient, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCartDrawer(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-2 shrink-0 relative"
            >
              <ShoppingCart className="w-4 h-4" /> View Cart
              {cart.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Product Grid with Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.imageUrl}
                      alt={prod.brandName}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                        {prod.category}
                      </span>
                      {prod.requiresPrescription ? (
                        <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full border border-rose-400 shadow">
                          Rx Required
                        </span>
                      ) : (
                        <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full border border-emerald-400 shadow">
                          OTC Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-base">{prod.brandName}</h3>
                      <span className="text-xs font-bold text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {prod.strength}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium italic">{prod.genericName}</p>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                {/* Footer Price & Add to Cart */}
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Unit Price</span>
                    <span className="text-base font-extrabold text-slate-900">
                      Rs. {prod.unitPriceLkr.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProduct(prod)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => addToCart(prod)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                    >
                      <Plus className="w-4 h-4 text-teal-400" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHARMACIST ORDERS MANAGER VIEW */}
      {viewMode === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                Customer Online E-Pharmacy Orders Ledger
              </h3>
              <span className="text-xs text-slate-500 font-medium">{orders.length} Total Incoming Orders</span>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-900 text-teal-300 px-2.5 py-1 rounded-md">
                        {ord.id}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500">📱 {ord.customerPhone} • {ord.orderTimestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-900 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        {ord.deliveryMethod}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                          ord.status === 'Pending Verification'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : ord.status === 'Pharmacist Approved'
                            ? 'bg-sky-100 text-sky-900 border border-sky-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <strong>Delivery Location:</strong> {ord.deliveryAddress}
                    </div>
                    <div>
                      <strong>Payment Method:</strong> {ord.paymentMethod} •{' '}
                      {ord.prescriptionUploaded ? (
                        <span className="text-emerald-700 font-bold">✓ Prescription Photo Attached</span>
                      ) : (
                        <span className="text-slate-500">No Rx required</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">Ordered Products:</span>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                        <span>{it.brandName} x {it.quantity}</span>
                        <span className="font-bold">Rs. {it.subtotalLkr.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 flex justify-between font-extrabold text-slate-900">
                      <span>Total Net Amount:</span>
                      <span className="text-teal-700">Rs. {ord.netLkr.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {ord.status === 'Pending Verification' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(ord.id, 'Pharmacist Approved');
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Verify Prescription & Approve
                      </button>
                    )}

                    {ord.status === 'Pharmacist Approved' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(ord.id, 'Out for Express Delivery');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch Express Delivery Driver
                      </button>
                    )}

                    {ord.status === 'Out for Express Delivery' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(ord.id, 'Delivered');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer / Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl flex flex-col justify-between space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" /> Your E-Pharmacy Cart
                </h3>
                <button onClick={() => setShowCartDrawer(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Your cart is empty. Add medicines from the storefront above.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900">{item.product.brandName}</span>
                        <span className="text-slate-500 text-[11px] block">{item.product.strength} • Rs. {item.product.unitPriceLkr.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3 text-slate-700" />
                        </button>
                        <span className="font-extrabold text-slate-900 w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>Rs. {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Express Delivery Fee:</span>
                    <span>Rs. {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t">
                    <span>Total Amount:</span>
                    <span className="text-teal-700">Rs. {cartNetTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCartDrawer(false);
                    setShowCheckoutModal(true);
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" /> Online Order Checkout
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Delivery Option</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Home Express Delivery">Home Express Delivery (Rs. 250)</option>
                    <option value="Click & Store Pickup">Click & Store Pickup (Rs. 0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Suwasiri Pay">Suwasiri Pay (E-Wallet)</option>
                    <option value="Card Online">Card Online</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              {/* Prescription Attachment Section */}
              {requiresPrescriptionInCart && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Rx Prescription Photo Upload Required</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Your cart contains prescription-only medication. Please upload a clear photo of your doctor's e-prescription or physical script.
                  </p>

                  <label className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-lg cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{prescriptionAttached ? `Attached: ${prescriptionFileName}` : 'Choose Prescription Photo'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleSimulatePrescriptionUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

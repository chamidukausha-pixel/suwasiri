import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { StockInventoryModule } from './components/StockInventoryModule';
import { BarcodeScannerModule } from './components/BarcodeScannerModule';
import { GPCareSyncModule } from './components/GPCareSyncModule';
import { SuwasiriHealthModule } from './components/SuwasiriHealthModule';
import { AIMedicationAlertsModule } from './components/AIMedicationAlertsModule';
import { AutoRefillModule } from './components/AutoRefillModule';
import { RegulatoryComplianceModule } from './components/RegulatoryComplianceModule';
import { AdminModule } from './components/AdminModule';
import { BillingModule } from './components/BillingModule';
import { OnlineStoreModule } from './components/OnlineStoreModule';

import {
  initialInventory,
  initialGPCarePrescriptions,
  initialSuwasiriProfiles,
  initialAIMedicationAlerts,
  initialAutoRefills,
  initialSystemSyncLogs,
  initialCustomerBills,
  initialSuppliers,
  initialSupplierOrders,
  initialOnlineProducts,
  initialOnlineOrders,
} from './data/mockData';

import {
  InventoryItem,
  GPCarePrescription,
  SuwasiriPatientProfile,
  AIMedicationAlert,
  AutoRefillNotification,
  SystemSyncLog,
  CustomerBill,
  Supplier,
  SupplierOrder,
  OnlineProduct,
  OnlineOrder,
} from './types';
import { CheckCircle2, ShieldCheck, Sparkles, RefreshCw, User, Lock, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [prescriptions, setPrescriptions] = useState<GPCarePrescription[]>(initialGPCarePrescriptions);
  const [suwasiriProfiles, setSuwasiriProfiles] = useState<SuwasiriPatientProfile[]>(initialSuwasiriProfiles);
  const [aiAlerts, setAiAlerts] = useState<AIMedicationAlert[]>(initialAIMedicationAlerts);
  const [refills, setRefills] = useState<AutoRefillNotification[]>(initialAutoRefills);
  const [syncLogs, setSyncLogs] = useState<SystemSyncLog[]>(initialSystemSyncLogs);
  const [bills, setBills] = useState<CustomerBill[]>(initialCustomerBills);

  // Supplier & Online E-Pharmacy State
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>(initialSupplierOrders);
  const [onlineProducts, setOnlineProducts] = useState<OnlineProduct[]>(initialOnlineProducts);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>(initialOnlineOrders);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncBannerMessage, setSyncBannerMessage] = useState<string | null>(null);

  // Manual Gateway Sync Action
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncBannerMessage('Gateway re-synchronized with Sri Lanka GP Care & Suwasiri eHealth Vault (TLS 1.3 / AES-256 Verified).');

      const newLog: SystemSyncLog = {
        id: `SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceSystem: 'Suwasiri eHealth Portal',
        action: 'Manual encrypted Gateway verification sync executed by Chief Pharmacist',
        timestamp: new Date().toLocaleString('en-LK'),
        recordsProcessed: inventory.length + prescriptions.length,
        status: 'ENCRYPTED_SYNC',
        securityProtocol: 'TLS 1.3 / AES-256-GCM',
        details: 'Bi-directional payload checksum verified. Zero discrepancies found.',
      };

      setSyncLogs((prev) => [newLog, ...prev]);

      setTimeout(() => {
        setSyncBannerMessage(null);
      }, 5000);
    }, 1200);
  };

  // Handlers for Inventory
  const handleAddInventoryItem = (newItem: InventoryItem) => {
    setInventory((prev) => [newItem, ...prev]);
  };

  const handleUpdateStock = (id: string, qtyToAdd: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.stockQty + qtyToAdd;
          return {
            ...item,
            stockQty: newQty,
            status: newQty > item.reorderLevel ? 'In Stock' : 'Low Stock',
          };
        }
        return item;
      })
    );
  };

  // Automatic Real-Time Stock Deduction (Barcode Scanner / Dispense)
  const handleDeductStock = (id: string, qtyToDeduct: number) => {
    let deductedItemName = '';
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id || item.nmraRegNo.toLowerCase() === id.toLowerCase()) {
          deductedItemName = item.brandName;
          const updatedQty = Math.max(0, item.stockQty - qtyToDeduct);
          return {
            ...item,
            stockQty: updatedQty,
            status: updatedQty > item.reorderLevel ? 'In Stock' : updatedQty === 0 ? 'Critical Shortage' : 'Low Stock',
          };
        }
        return item;
      })
    );

    // Audit Log Entry
    const deductLog: SystemSyncLog = {
      id: `SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceSystem: 'PharmaCloud Vault',
      action: `Barcode Auto-Deduction: Issued ${qtyToDeduct} units of ${deductedItemName || id}`,
      timestamp: new Date().toLocaleString('en-LK'),
      recordsProcessed: 1,
      status: 'SUCCESS',
      securityProtocol: 'TLS 1.3 / AES-256-GCM',
      details: `Inventory stock reduced automatically via barcode scanner.`,
    };
    setSyncLogs((prev) => [deductLog, ...prev]);
  };

  // Handler for Dispensing Doctor E-Prescription
  const handleDispensePrescription = (prescriptionId: string) => {
    const rx = prescriptions.find((p) => p.id === prescriptionId);
    if (!rx) return;

    // Deduct stock in inventory
    setInventory((prev) =>
      prev.map((item) => {
        const matchingPrescribedMed = rx.medications.find(
          (m) => m.medicationId === item.id || m.brandName.toLowerCase() === item.brandName.toLowerCase()
        );

        if (matchingPrescribedMed) {
          const updatedQty = Math.max(0, item.stockQty - matchingPrescribedMed.quantityPrescribed);
          return {
            ...item,
            stockQty: updatedQty,
            status: updatedQty < item.reorderLevel ? 'Low Stock' : 'In Stock',
          };
        }
        return item;
      })
    );

    // Update prescription status
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === prescriptionId ? { ...p, dispenseStatus: 'Dispensed' } : p))
    );

    // Add log
    const dispenseLog: SystemSyncLog = {
      id: `SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceSystem: 'Sri Lanka GP Care',
      action: `Fulfilled E-Prescription ${rx.id} for ${rx.patientName} (NIC: ${rx.patientNIC}, Tel: ${rx.patientPhone})`,
      timestamp: new Date().toLocaleString('en-LK'),
      recordsProcessed: rx.medications.length,
      status: 'SUCCESS',
      securityProtocol: 'FHIR v4.0.1 REST API',
      details: 'Updated Suwasiri patient profile, sent SMS receipt to customer phone, and reduced local stock.',
    };
    setSyncLogs((prev) => [dispenseLog, ...prev]);

    setSyncBannerMessage(`E-Prescription ${rx.id} fulfilled! Stock auto-reduced & SMS receipt sent to ${rx.patientPhone}.`);
    setTimeout(() => setSyncBannerMessage(null), 5000);
  };

  const handleAddNewPrescription = (newRx: GPCarePrescription) => {
    setPrescriptions((prev) => [newRx, ...prev]);
  };

  // Handler for AI Prescription Analysis shortcut
  const handleAnalyzePrescriptionShortcut = (rx: GPCarePrescription) => {
    setActiveTab('ai-alerts');
  };

  // Handler for resolving AI Alert
  const handleResolveAlert = (alertId: string) => {
    setAiAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  };

  // Handler for dispatching Refill Notification
  const handleDispatchNotification = (refillId: string) => {
    setRefills((prev) =>
      prev.map((r) =>
        r.id === refillId
          ? {
              ...r,
              status: 'Sent',
              lastSentTimestamp: new Date().toLocaleString('en-LK'),
            }
          : r
      )
    );
  };

  const handleAddBill = (newBill: CustomerBill) => {
    setBills((prev) => [newBill, ...prev]);
  };

  // Supplier Management Handlers
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
  };

  const handleAddSupplierOrder = (newOrder: SupplierOrder) => {
    setSupplierOrders((prev) => [newOrder, ...prev]);
  };

  const handleReceiveSupplierOrder = (orderId: string) => {
    const order = supplierOrders.find((o) => o.id === orderId);
    if (!order) return;

    // Ingest stock items into pharmacy inventory
    order.items.forEach((item) => {
      const match = inventory.find(
        (inv) => inv.brandName.toLowerCase() === item.brandName.toLowerCase()
      );
      if (match) {
        handleUpdateStock(match.id, item.quantity);
      }
    });

    setSupplierOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Received & Injected to Stock' } : o))
    );

    const receiveLog: SystemSyncLog = {
      id: `SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceSystem: 'Supplier Procurement Portal',
      action: `Ingested Purchase Order ${order.id} from ${order.supplierName}`,
      timestamp: new Date().toLocaleString('en-LK'),
      recordsProcessed: order.items.length,
      status: 'SUCCESS',
      securityProtocol: 'TLS 1.3 Audit Verified',
      details: 'Automated inventory ingestion complete. Units added to active depot stock.',
    };
    setSyncLogs((prev) => [receiveLog, ...prev]);
  };

  // Online Store Order Handlers
  const handlePlaceOnlineOrder = (newOrder: OnlineOrder) => {
    setOnlineOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOnlineOrderStatus = (orderId: string, newStatus: OnlineOrder['status']) => {
    setOnlineOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const stockLowCount = inventory.filter((i) => i.status === 'Low Stock' || i.status === 'Critical Shortage').length;
  const incomingPrescriptionCount = prescriptions.filter((p) => p.dispenseStatus === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col lg:flex-row selection:bg-teal-500 selection:text-white">
      {/* Left Hand Side Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingRefillCount={refills.filter((r) => r.status === 'Scheduled').length}
        aiAlertCount={aiAlerts.filter((a) => !a.resolved).length}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        stockLowCount={stockLowCount}
        incomingPrescriptionCount={incomingPrescriptionCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Pharmacist Workstation Context */}
        <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-lg border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Depot: Colombo Central Main Hub
            </div>
            <span className="text-slate-600 hidden md:inline">|</span>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-teal-400" /> Duty Pharmacist: <strong className="text-white">Dr. K. Perera (SLMC-8921)</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Gateway Sync'}
            </button>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-xs font-semibold">
              MoH License Verified
            </span>
          </div>
        </header>

        {/* Sync Banner Notification */}
        {syncBannerMessage && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 shadow-inner flex items-center justify-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{syncBannerMessage}</span>
          </div>
        )}

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              inventory={inventory}
              prescriptions={prescriptions}
              suwasiriProfiles={suwasiriProfiles}
              aiAlerts={aiAlerts}
              refills={refills}
              setActiveTab={setActiveTab}
              onRunAIScan={() => setActiveTab('ai-alerts')}
              onDeductStock={handleDeductStock}
              onDispensePrescription={handleDispensePrescription}
            />
          )}

          {(activeTab === 'stock-inventory' || activeTab === 'inventory') && (
            <StockInventoryModule
              inventory={inventory}
              onAddInventoryItem={handleAddInventoryItem}
              onUpdateStock={handleUpdateStock}
              onDeductStock={handleDeductStock}
            />
          )}

          {activeTab === 'billing' && (
            <BillingModule
              inventory={inventory}
              bills={bills}
              onAddBill={handleAddBill}
              onDeductStock={handleDeductStock}
            />
          )}

          {activeTab === 'scanner' && (
            <BarcodeScannerModule
              inventory={inventory}
              onDeductStock={handleDeductStock}
            />
          )}

          {activeTab === 'gpcare' && (
            <GPCareSyncModule
              prescriptions={prescriptions}
              inventory={inventory}
              onDispensePrescription={handleDispensePrescription}
              onAnalyzePrescription={handleAnalyzePrescriptionShortcut}
              onAddNewPrescription={handleAddNewPrescription}
            />
          )}

          {activeTab === 'admin' && (
            <AdminModule
              inventory={inventory}
              bills={bills}
              syncLogs={syncLogs}
              suppliers={suppliers}
              supplierOrders={supplierOrders}
              onAddSupplier={handleAddSupplier}
              onAddSupplierOrder={handleAddSupplierOrder}
              onReceiveSupplierOrder={handleReceiveSupplierOrder}
            />
          )}

          {activeTab === 'online-store' && (
            <OnlineStoreModule
              products={onlineProducts}
              orders={onlineOrders}
              inventory={inventory}
              onPlaceOrder={handlePlaceOnlineOrder}
              onUpdateOrderStatus={handleUpdateOnlineOrderStatus}
              onDeductStock={handleDeductStock}
            />
          )}

          {activeTab === 'suwasiri' && (
            <SuwasiriHealthModule
              profiles={suwasiriProfiles}
              onAddNewProfile={(newProfile) => setSuwasiriProfiles((prev) => [newProfile, ...prev])}
            />
          )}

          {activeTab === 'ai-alerts' && (
            <AIMedicationAlertsModule
              alerts={aiAlerts}
              prescriptions={prescriptions}
              suwasiriProfiles={suwasiriProfiles}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {activeTab === 'auto-refill' && (
            <AutoRefillModule
              refills={refills}
              prescriptions={prescriptions}
              onDispatchNotification={handleDispatchNotification}
              onAddRefill={(newRefill) => setRefills((prev) => [newRefill, ...prev])}
            />
          )}

          {activeTab === 'compliance' && (
            <RegulatoryComplianceModule logs={syncLogs} />
          )}
        </main>

        {/* Page Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-xs mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sri Lanka Ministry of Health E-Health Network • PharmaCloud Gateway v2.4</span>
            </div>

            <div className="flex items-center gap-3 text-slate-500">
              <span>NMRA MRP Regulated</span>
              <span>•</span>
              <span>PDPA Act No. 9 (2022) Compliant</span>
              <span>•</span>
              <span>FHIR v4.0.1 Interoperable</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

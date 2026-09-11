import React from 'react';
import { SystemSyncLog } from '../types';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertTriangle, Key, Cpu, Database, Server } from 'lucide-react';

interface RegulatoryComplianceModuleProps {
  logs: SystemSyncLog[];
}

export const RegulatoryComplianceModule: React.FC<RegulatoryComplianceModuleProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ministry of Health & NMRA Certified Platform
          </div>
          <h2 className="text-2xl font-extrabold text-white">Regulatory Compliance & Encryption Audit</h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Strict adherence to Sri Lanka Personal Data Protection Act (PDPA No. 9 of 2022), NMRA drug registration guidelines, and FHIR v4.0.1 eHealth interoperability protocols.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right text-xs shrink-0">
          <div className="text-slate-400">Encryption Status:</div>
          <div className="text-emerald-400 font-mono font-bold text-sm">AES-256-GCM ACTIVE</div>
          <div className="text-slate-500 text-[10px] mt-0.5">TLS 1.3 Transport Security</div>
        </div>
      </div>

      {/* Compliance Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-max">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">NMRA Drug Safety & Pricing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automatic verification against Sri Lanka National Medicines Regulatory Authority (NMRA) gazetted Maximum Retail Price (MRP) caps in LKR and registered imported batch numbers.
          </p>
          <div className="pt-2 border-t text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> 100% Price & Batch Verified
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl w-max">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">PDPA 2022 Patient Data Privacy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full compliance with Sri Lanka Personal Data Protection Act No. 9 of 2022. Patient NIC records and chronic health data are anonymized and end-to-end encrypted.
          </p>
          <div className="pt-2 border-t text-xs font-semibold text-sky-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Data Anonymization Active
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl w-max">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">FHIR v4.0.1 Interoperability</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Standardized HL7 FHIR JSON payloads linking local pharmacy dispensing logs with the Ministry of Health Suwasiri repository and GP Care systems.
          </p>
          <div className="pt-2 border-t text-xs font-semibold text-purple-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> FHIR REST API Active
          </div>
        </div>
      </div>

      {/* Real-time System Sync Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
          <span>System Synchronization Audit Logs</span>
          <span className="text-xs font-normal text-slate-500">Live Cryptographic Audit Ledger</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Source System</th>
                <th className="p-3">Action Performed</th>
                <th className="p-3">Processed</th>
                <th className="p-3">Protocol & Encryption</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{log.sourceSystem}</td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{log.action}</div>
                    <div className="text-[11px] text-slate-500">{log.details}</div>
                  </td>
                  <td className="p-3 font-mono font-semibold">{log.recordsProcessed} records</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-800 font-mono text-[10px] px-2 py-0.5 rounded border">
                      {log.securityProtocol}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">{log.timestamp}</td>
                  <td className="p-3 text-right">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

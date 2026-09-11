import React, { useState } from 'react';
import { SuwasiriPatientProfile } from '../types';
import { HeartPulse, Search, ShieldCheck, AlertTriangle, UserCheck, Lock, Activity, FileJson, Building } from 'lucide-react';

interface SuwasiriHealthModuleProps {
  profiles: SuwasiriPatientProfile[];
  onAddNewProfile: (profile: SuwasiriPatientProfile) => void;
}

export const SuwasiriHealthModule: React.FC<SuwasiriHealthModuleProps> = ({
  profiles,
  onAddNewProfile,
}) => {
  const [searchNic, setSearchNic] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<SuwasiriPatientProfile | null>(profiles[0] || null);

  const filteredProfiles = profiles.filter((p) =>
    p.nic.toLowerCase().includes(searchNic.toLowerCase()) ||
    p.fullName.toLowerCase().includes(searchNic.toLowerCase()) ||
    p.district.toLowerCase().includes(searchNic.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Suwasiri E-Health Central Patient Vault</h2>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              FHIR v4.0.1 Compliant
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Ministry of Health Sri Lanka national health data repository linking chronic conditions, allergy registries, and primary care records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>PDPA Act No. 9 Encrypted</span>
        </div>
      </div>

      {/* Main Grid: Search/List on Left, Detailed FHIR Profile on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Search List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient NIC or Name..."
              value={searchNic}
              onChange={(e) => setSearchNic(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indexed Patient Records ({filteredProfiles.length})</h3>
            <div className="space-y-2">
              {filteredProfiles.map((patient) => {
                const isSelected = selectedProfile?.nic === patient.nic;
                return (
                  <button
                    key={patient.nic}
                    onClick={() => setSelectedProfile(patient)}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{patient.fullName}</span>
                      <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {patient.district}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>NIC: <strong className="text-slate-900">{patient.nic}</strong></span>
                      <span className="text-rose-700 font-semibold text-[11px]">{patient.bloodGroup}</span>
                    </div>

                    {patient.knownAllergies.length > 0 && patient.knownAllergies[0] !== 'None Reported' && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-700 font-medium mt-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Allergies: {patient.knownAllergies.join(', ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Patient FHIR Vault Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProfile ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Profile Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl text-white shadow-md">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedProfile.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      DOB: {selectedProfile.dateOfBirth} • Gender: {selectedProfile.gender} • Blood Group: <strong className="text-rose-600">{selectedProfile.bloodGroup}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> FHIR Vault Active
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">Last Synced: {selectedProfile.lastEHealthSync}</div>
                </div>
              </div>

              {/* Data Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Allergies Card */}
                <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 space-y-2">
                  <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Documented Drug & Food Allergies
                  </h4>
                  {selectedProfile.knownAllergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.knownAllergies.map((allergy, i) => (
                        <span key={i} className="bg-rose-200/80 text-rose-950 font-semibold px-2 py-1 rounded-md">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500">No known drug allergies logged in Suwasiri repository.</span>
                  )}
                </div>

                {/* Chronic Diseases */}
                <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-200/80 space-y-2">
                  <h4 className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-600" />
                    Chronic Conditions & Diagnoses
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.chronicDiseases.map((dis, i) => (
                      <span key={i} className="bg-sky-200/80 text-sky-950 font-semibold px-2 py-1 rounded-md">
                        {dis}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Prescriptions */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 text-sm">Active Long-term Medication Regimen</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  {selectedProfile.activeMedications.map((med, i) => (
                    <div key={i} className="flex items-center justify-between border-b last:border-0 pb-1.5 last:pb-0">
                      <span className="font-medium text-slate-900">{med}</span>
                      <span className="text-teal-700 font-semibold text-[11px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Active Continuous
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Encrypted Vault Fingerprint */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Encrypted Suwasiri Hash Fingerprint:
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">SHA-256 Validated</span>
                </div>
                <div className="font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all text-[11px]">
                  {selectedProfile.encryptedRecordHash}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              Select a patient from the Suwasiri directory to inspect encrypted clinical record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

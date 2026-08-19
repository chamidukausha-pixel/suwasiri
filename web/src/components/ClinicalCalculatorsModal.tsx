import React, { useState, useEffect } from "react";
import { 
  Calculator, Activity, Heart, Scale, Baby, Droplet, Stethoscope, CheckCircle, 
  AlertTriangle, X, ShieldAlert, Sparkles, Plus, Copy, Check, Search, User, Shield
} from "lucide-react";
import { 
  calculateBmi, calculateAustralianCvdRisk, calculateAusdrisk, 
  calculateEgfrCkdEpi, classifyBloodPressure, calculatePregnancyEdd, 
  calculatePaediatricDose, BmiResult, CvdRiskResult, AusdriskResult, 
  EgfrResult, BpStagingResult, PregnancyEddResult, PaediatricDoseResult 
} from "../utils/clinicalCalculators";
import { Patient } from "../types";

interface Props {
  patient?: Patient | null;
  patients?: Patient[];
  onClose: () => void;
  onSaveToConsultation?: (summaryText: string) => void;
}

export default function ClinicalCalculatorsModal({ patient, patients = [], onClose, onSaveToConsultation }: Props) {
  const [activePatient, setActivePatient] = useState<Patient | null>(patient || patients[0] || null);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [activeCalcTab, setActiveCalcTab] = useState<"bmi" | "cvd" | "ausdrisk" | "egfr" | "bp" | "pregnancy" | "paediatric">("bmi");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // BMI States
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(72);
  const [bmiResult, setBmiResult] = useState<BmiResult | null>(null);

  // CVD Risk States
  const [cvdAge, setCvdAge] = useState<number>(activePatient?.age || 52);
  const [cvdGender, setCvdGender] = useState<"Male" | "Female">(activePatient?.gender === "Male" ? "Male" : "Female");
  const [cvdSystolic, setCvdSystolic] = useState<number>(135);
  const [cvdSmoker, setCvdSmoker] = useState<boolean>(false);
  const [cvdDiabetes, setCvdDiabetes] = useState<boolean>(activePatient?.medicalHistory?.some(m => m.toLowerCase().includes("diabet")) || false);
  const [cvdTotalChol, setCvdTotalChol] = useState<number>(5.4);
  const [cvdHdlChol, setCvdHdlChol] = useState<number>(1.2);
  const [cvdOnBpMeds, setCvdOnBpMeds] = useState<boolean>(true);
  const [cvdResult, setCvdResult] = useState<CvdRiskResult | null>(null);

  // AUSDRISK States
  const [ausAge, setAusAge] = useState<number>(activePatient?.age || 52);
  const [ausGender, setAusGender] = useState<"Male" | "Female">(activePatient?.gender === "Male" ? "Male" : "Female");
  const [ausAsian, setAusAsian] = useState<boolean>(true);
  const [ausFamHist, setAusFamHist] = useState<boolean>(false);
  const [ausHighBg, setAusHighBg] = useState<boolean>(false);
  const [ausBpMeds, setAusBpMeds] = useState<boolean>(true);
  const [ausSmoker, setAusSmoker] = useState<boolean>(false);
  const [ausInactivity, setAusInactivity] = useState<boolean>(false);
  const [ausWaist, setAusWaist] = useState<number>(92);
  const [ausdriskResult, setAusdriskResult] = useState<AusdriskResult | null>(null);

  // eGFR States
  const [creatinineVal, setCreatinineVal] = useState<number>(88); // umol/L
  const [egfrAge, setEgfrAge] = useState<number>(activePatient?.age || 52);
  const [egfrGender, setEgfrGender] = useState<"Male" | "Female">(activePatient?.gender === "Male" ? "Male" : "Female");
  const [egfrResult, setEgfrResult] = useState<EgfrResult | null>(null);

  // BP Staging States
  const [bpSystolic, setBpSystolic] = useState<number>(138);
  const [bpDiastolic, setBpDiastolic] = useState<number>(88);
  const [bpResult, setBpResult] = useState<BpStagingResult | null>(null);

  // Pregnancy States
  const [lmpDate, setLmpDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 70); // approx 10 weeks ago
    return d.toISOString().split("T")[0];
  });
  const [cycleDays, setCycleDays] = useState<number>(28);
  const [pregResult, setPregResult] = useState<PregnancyEddResult | null>(null);

  // Paediatric Dosing States
  const [paedDrug, setPaedDrug] = useState<"Paracetamol" | "Ibuprofen" | "Amoxicillin" | "Cephalexin">("Paracetamol");
  const [paedWeight, setPaedWeight] = useState<number>(14);
  const [paedResult, setPaedResult] = useState<PaediatricDoseResult | null>(null);

  // Sync active patient changes
  useEffect(() => {
    if (patient) {
      setActivePatient(patient);
    }
  }, [patient]);

  useEffect(() => {
    if (activePatient) {
      setCvdAge(activePatient.age || 52);
      setCvdGender(activePatient.gender === "Male" ? "Male" : "Female");
      setAusAge(activePatient.age || 52);
      setAusGender(activePatient.gender === "Male" ? "Male" : "Female");
      setEgfrAge(activePatient.age || 52);
      setEgfrGender(activePatient.gender === "Male" ? "Male" : "Female");
      setCvdDiabetes(activePatient.medicalHistory?.some(m => m.toLowerCase().includes("diabet")) || false);
    }
  }, [activePatient]);

  // Auto-calculate on changes
  useEffect(() => {
    setBmiResult(calculateBmi(heightCm, weightKg));
  }, [heightCm, weightKg]);

  // Derived auto-calculated ideal weight targets based on Height (cm) & Gender
  const heightM = heightCm > 0 ? heightCm / 100 : 1.7;
  const heightInches = heightCm / 2.54;
  const inchesOver5Ft = Math.max(0, heightInches - 60);

  // General WHO Healthy Range (BMI 18.5 - 24.9)
  const minNormalWeight = Number((18.5 * (heightM * heightM)).toFixed(1));
  const maxNormalWeight = Number((24.9 * (heightM * heightM)).toFixed(1));
  const targetMedianWeight = Number((21.7 * (heightM * heightM)).toFixed(1));
  const weightDifferenceFromTarget = Number((weightKg - targetMedianWeight).toFixed(1));

  // Male Ideal Body Weight (Devine formula: 50.0kg + 2.3kg per inch over 5ft; WHO Male BMI 20.0-25.0)
  const maleIdealWeight = Number((50.0 + (2.3 * inchesOver5Ft)).toFixed(1));
  const maleMinNormal = Number((20.0 * (heightM * heightM)).toFixed(1));
  const maleMaxNormal = Number((25.0 * (heightM * heightM)).toFixed(1));
  const maleDiff = Number((weightKg - maleIdealWeight).toFixed(1));

  // Female Ideal Body Weight (Devine formula: 45.5kg + 2.3kg per inch over 5ft; WHO Female BMI 19.0-24.0)
  const femaleIdealWeight = Number((45.5 + (2.3 * inchesOver5Ft)).toFixed(1));
  const femaleMinNormal = Number((19.0 * (heightM * heightM)).toFixed(1));
  const femaleMaxNormal = Number((24.0 * (heightM * heightM)).toFixed(1));
  const femaleDiff = Number((weightKg - femaleIdealWeight).toFixed(1));

  // Filtered patients for search bar
  const searchedPatients = patients.filter(p => {
    const q = patientSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.medicareNumber && p.medicareNumber.toLowerCase().includes(q)) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setCvdResult(calculateAustralianCvdRisk({
      age: cvdAge,
      gender: cvdGender,
      systolicBp: cvdSystolic,
      smoker: cvdSmoker,
      diabetes: cvdDiabetes,
      totalCholesterolMmol: cvdTotalChol,
      hdlCholesterolMmol: cvdHdlChol,
      onBpMeds: cvdOnBpMeds
    }));
  }, [cvdAge, cvdGender, cvdSystolic, cvdSmoker, cvdDiabetes, cvdTotalChol, cvdHdlChol, cvdOnBpMeds]);

  useEffect(() => {
    setAusdriskResult(calculateAusdrisk({
      age: ausAge,
      gender: ausGender,
      ethnicityAsianOrIndig: ausAsian,
      familyHistoryDiabetes: ausFamHist,
      historyHighBloodGlucose: ausHighBg,
      onBpMeds: ausBpMeds,
      smoker: ausSmoker,
      physicalActivityUnder25Hrs: ausInactivity,
      waistCircumferenceCm: ausWaist
    }));
  }, [ausAge, ausGender, ausAsian, ausFamHist, ausHighBg, ausBpMeds, ausSmoker, ausInactivity, ausWaist]);

  useEffect(() => {
    setEgfrResult(calculateEgfrCkdEpi(creatinineVal, egfrAge, egfrGender));
  }, [creatinineVal, egfrAge, egfrGender]);

  useEffect(() => {
    setBpResult(classifyBloodPressure(bpSystolic, bpDiastolic));
  }, [bpSystolic, bpDiastolic]);

  useEffect(() => {
    setPregResult(calculatePregnancyEdd(lmpDate, cycleDays));
  }, [lmpDate, cycleDays]);

  useEffect(() => {
    setPaedResult(calculatePaediatricDose(paedDrug, paedWeight));
  }, [paedDrug, paedWeight]);

  const handleCopySummary = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    if (onSaveToConsultation) {
      onSaveToConsultation(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3">
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#00334f] text-white px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-sky-300" />
            <div>
              <h2 className="font-bold text-sm">Clinical Decision Calculators Suite</h2>
              <p className="text-[11px] text-sky-200">
                {activePatient ? `Active File: ${activePatient.name} (${activePatient.age}y, ${activePatient.gender}) • ID: ${activePatient.id}` : "General Practice Decision Support"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigators */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: "bmi", label: "BMI & Anthropometry", icon: Scale },
            { id: "cvd", label: "Aus CVD Absolute Risk", icon: Heart },
            { id: "ausdrisk", label: "AUSDRISK (Diabetes)", icon: Activity },
            { id: "egfr", label: "eGFR / CKD-EPI", icon: Droplet },
            { id: "bp", label: "BP Staging (ACC/AHA)", icon: Stethoscope },
            { id: "pregnancy", label: "Pregnancy / EDD", icon: Sparkles },
            { id: "paediatric", label: "Paediatric Dosing", icon: Baby }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCalcTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCalcTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-[#00334f] text-white shadow-xs" 
                    : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Calculator Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: BMI & ANTHROPOMETRY WITH PATIENT SEARCH & AUTO-CALCULATED IDEAL WEIGHT */}
          {activeCalcTab === "bmi" && (
            <div className="space-y-5">
              {/* Patient Search Bar in BMI Section */}
              <div className="bg-[#f0f7ff] border border-sky-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-700 shrink-0" />
                    <h3 className="text-xs font-bold text-[#00334f] uppercase tracking-wider">
                      Search Registered Patient by Name or ID Number
                    </h3>
                  </div>
                  <span className="text-[11px] text-sky-800 font-semibold">
                    {patients.length > 0 ? `${patients.length} Registered Patients in Clinic` : "Live Registry"}
                  </span>
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={patientSearchQuery}
                        onChange={(e) => {
                          setPatientSearchQuery(e.target.value);
                          setShowPatientDropdown(true);
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                        placeholder="Type Patient Name, ID (e.g. 9942-LK), Medicare Number, or Phone..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-sky-300 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-600 font-medium"
                      />
                      <Search className="w-4 h-4 text-sky-500 absolute left-3 top-2.5" />
                      {patientSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPatientSearchQuery("")}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown list of matching patients */}
                  {showPatientDropdown && searchedPatients.length > 0 && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchedPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActivePatient(p);
                            setShowPatientDropdown(false);
                            setPatientSearchQuery(`${p.name} (${p.id})`);
                          }}
                          className={`p-2.5 hover:bg-sky-50 cursor-pointer flex items-center justify-between text-xs transition ${
                            activePatient?.id === p.id ? "bg-sky-50 font-bold" : ""
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-[11px] text-slate-500 ml-2 font-mono">[{p.id}]</span>
                            <span className="text-[10px] text-slate-500 ml-2">({p.age}y, {p.gender})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.medicareNumber && (
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                Med: {p.medicareNumber}
                              </span>
                            )}
                            <span className="text-[10px] text-sky-700 font-bold">Select File →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Patient Overview Card */}
                {activePatient && (
                  <div className="bg-white p-3.5 rounded-lg border border-sky-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Patient</span>
                      <strong className="text-slate-900 text-sm">{activePatient.name}</strong>
                      <p className="text-[11px] text-slate-500">{activePatient.age} yrs • {activePatient.gender} • Blood: {activePatient.bloodType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient ID & Medicare</span>
                      <span className="font-mono font-bold text-sky-800">{activePatient.id}</span>
                      <p className="text-[11px] text-slate-500">{activePatient.medicareNumber || "Private Account"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Allergies</span>
                      <span className="text-rose-700 font-semibold">{activePatient.allergies || "No Known Drug Allergies"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Medical Conditions</span>
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-2">{activePatient.notes || activePatient.medicalHistory?.join(", ") || "Routine General Health"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Measurements & Auto-Calculations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Measurements</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Auto-Target Calculation Active
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Height (cm):</label>
                      <span className="text-[11px] text-sky-700 font-bold font-mono">{(heightCm / 100).toFixed(2)} meters</span>
                    </div>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#00334f] outline-none"
                    />
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {[150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200].map(h => (
                        <button 
                          key={h} 
                          onClick={() => setHeightCm(h)} 
                          className={`text-[10px] px-2 py-0.5 rounded font-mono cursor-pointer transition ${
                            heightCm === h ? "bg-[#00334f] text-white font-bold" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                          }`}
                        >
                          {h}cm
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Current Weight (kg):</label>
                      <span className="text-[11px] text-slate-500 font-mono">{(weightKg * 2.20462).toFixed(1)} lbs</span>
                    </div>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#00334f] outline-none"
                    />
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {[50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 105, 115].map(w => (
                        <button 
                          key={w} 
                          onClick={() => setWeightKg(w)} 
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono cursor-pointer transition ${
                            weightKg === w ? "bg-[#00334f] text-white font-bold" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                          }`}
                        >
                          {w}kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AUTO-CALCULATED IDEAL WEIGHT TARGET PANEL WITH MALE & FEMALE BREAKDOWN */}
                  <div className="bg-white p-3.5 rounded-lg border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00334f]">
                        <Scale className="w-4 h-4 text-sky-600" />
                        <span>Auto-Calculated Target Weight for Height ({heightCm} cm)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(heightCm / 2.54 / 12).toFixed(1)} ft ({Math.floor(heightCm / 2.54 / 12)}'{Math.round((heightCm / 2.54) % 12)}")
                      </span>
                    </div>

                    {/* Male and Female Target Weight Cards */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Male IBW & Healthy Range */}
                      <div className={`p-2.5 rounded-lg border transition ${
                        activePatient?.gender === "Male" ? "bg-blue-50/90 border-blue-300 ring-2 ring-blue-400" : "bg-blue-50/50 border-blue-200"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-blue-900 flex items-center gap-1">
                            <span>👨 Male Target</span>
                            {activePatient?.gender === "Male" && (
                              <span className="bg-blue-200 text-blue-800 text-[8px] px-1 rounded font-bold">Patient</span>
                            )}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-slate-600">Devine Ideal:</span>
                            <strong className="text-blue-950 text-sm font-mono font-black">{maleIdealWeight} kg</strong>
                          </div>
                          <div className="flex items-baseline justify-between text-[10px]">
                            <span className="text-slate-500">Normal Range:</span>
                            <span className="text-slate-800 font-semibold font-mono">{maleMinNormal} – {maleMaxNormal} kg</span>
                          </div>
                          <div className="text-[9px] text-blue-700 font-medium pt-0.5 border-t border-blue-200/60">
                            Variance: <strong className="font-mono">{maleDiff > 0 ? `+${maleDiff}` : maleDiff} kg</strong>
                          </div>
                        </div>
                      </div>

                      {/* Female IBW & Healthy Range */}
                      <div className={`p-2.5 rounded-lg border transition ${
                        activePatient?.gender === "Female" ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-400" : "bg-rose-50/50 border-rose-200"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-rose-900 flex items-center gap-1">
                            <span>👩 Female Target</span>
                            {activePatient?.gender === "Female" && (
                              <span className="bg-rose-200 text-rose-800 text-[8px] px-1 rounded font-bold">Patient</span>
                            )}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-slate-600">Devine Ideal:</span>
                            <strong className="text-rose-950 text-sm font-mono font-black">{femaleIdealWeight} kg</strong>
                          </div>
                          <div className="flex items-baseline justify-between text-[10px]">
                            <span className="text-slate-500">Normal Range:</span>
                            <span className="text-slate-800 font-semibold font-mono">{femaleMinNormal} – {femaleMaxNormal} kg</span>
                          </div>
                          <div className="text-[9px] text-rose-700 font-medium pt-0.5 border-t border-rose-200/60">
                            Variance: <strong className="font-mono">{femaleDiff > 0 ? `+${femaleDiff}` : femaleDiff} kg</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overall WHO Standard Reference */}
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-500 font-semibold">WHO Standard Healthy Range: </span>
                        <strong className="text-slate-900 font-mono">{minNormalWeight} – {maxNormalWeight} kg</strong>
                        <span className="text-[10px] text-slate-500 ml-1">(BMI 18.5 – 24.9)</span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-800">
                        Median: <span className="font-mono">{targetMedianWeight} kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {bmiResult && (
                  <div className={`p-5 rounded-xl border flex flex-col justify-between ${bmiResult.color}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75">Body Mass Index (WHO)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-black">{bmiResult.bmi}</span>
                        <span className="text-sm font-bold">kg/m²</span>
                        <span className="ml-auto text-xs font-extrabold px-2.5 py-1 rounded-full bg-white/70 shadow-xs border">
                          {bmiResult.category}
                        </span>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-current/20 space-y-2 text-xs">
                        <div className="bg-white/60 p-2.5 rounded-lg border border-current/10 space-y-1">
                          <p className="font-bold text-slate-900">
                            Weight Patient Needs to Maintain: <span className="text-emerald-800 underline font-extrabold">{minNormalWeight} – {maxNormalWeight} kg</span>
                          </p>
                          <p className="text-[11px] text-slate-700">
                            Median Target: <strong>{targetMedianWeight} kg</strong> (Current variance: <strong>{weightDifferenceFromTarget > 0 ? `+${weightDifferenceFromTarget}` : weightDifferenceFromTarget} kg</strong>)
                          </p>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{bmiResult.advice}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[Clinical Observation - ${activePatient ? activePatient.name : "Patient"}] Height: ${heightCm}cm, Weight: ${weightKg}kg, BMI: ${bmiResult.bmi} kg/m² (${bmiResult.category}). Ideal Weight Target to Maintain: ${minNormalWeight} - ${maxNormalWeight} kg (Target: ${targetMedianWeight} kg).`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Australian Absolute CVD Risk */}
          {activeCalcTab === "cvd" && (
            <div className="space-y-5">
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg text-xs text-sky-900">
                <strong>Australian National Heart Foundation Guidelines:</strong> Estimates 5-year probability of experiencing a major cardiovascular event (stroke, myocardial infarction, or vascular death).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Age:</label>
                      <input type="number" value={cvdAge} onChange={e => setCvdAge(Number(e.target.value))} className="w-full p-1.5 bg-white border rounded text-xs mt-1" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Gender:</label>
                      <select value={cvdGender} onChange={e => setCvdGender(e.target.value as any)} className="w-full p-1.5 bg-white border rounded text-xs mt-1">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Systolic BP (mmHg):</label>
                      <input type="number" value={cvdSystolic} onChange={e => setCvdSystolic(Number(e.target.value))} className="w-full p-1.5 bg-white border rounded text-xs mt-1" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Total Chol (mmol/L):</label>
                      <input type="number" step="0.1" value={cvdTotalChol} onChange={e => setCvdTotalChol(Number(e.target.value))} className="w-full p-1.5 bg-white border rounded text-xs mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">HDL Chol (mmol/L):</label>
                      <input type="number" step="0.1" value={cvdHdlChol} onChange={e => setCvdHdlChol(Number(e.target.value))} className="w-full p-1.5 bg-white border rounded text-xs mt-1" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={cvdOnBpMeds} onChange={e => setCvdOnBpMeds(e.target.checked)} className="rounded" />
                        <span>On Antihypertensives</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={cvdSmoker} onChange={e => setCvdSmoker(e.target.checked)} className="rounded" />
                      <span>Current Smoker</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={cvdDiabetes} onChange={e => setCvdDiabetes(e.target.checked)} className="rounded" />
                      <span>Known Diabetes</span>
                    </label>
                  </div>
                </div>

                {cvdResult && (
                  <div className={`p-5 rounded-xl border flex flex-col justify-between ${cvdResult.color}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">5-Year Absolute CVD Risk</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-black">{cvdResult.riskScorePercent}%</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 border shadow-xs ml-auto">
                          {cvdResult.riskCategory}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/20 space-y-2 text-xs">
                        <p className="font-bold">Recommended Management Protocol:</p>
                        <p className="text-[11px] leading-relaxed opacity-95">{cvdResult.recommendedAction}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[CVD Risk Assessment] 5-Year Absolute Risk: ${cvdResult.riskScorePercent}% (${cvdResult.riskCategory}). SBP: ${cvdSystolic}mmHg, Chol/HDL: ${(cvdTotalChol / cvdHdlChol).toFixed(1)}. Recommendation: ${cvdResult.recommendedAction}`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUSDRISK (Australian Type 2 Diabetes Risk) */}
          {activeCalcTab === "ausdrisk" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <h4 className="font-bold text-slate-800">AUSDRISK Questionnaire Criteria</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">Age: {ausAge} yrs</label>
                      <input type="range" min="20" max="85" value={ausAge} onChange={e => setAusAge(Number(e.target.value))} className="w-full accent-[#00334f]" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Waist: {ausWaist} cm</label>
                      <input type="range" min="60" max="140" value={ausWaist} onChange={e => setAusWaist(Number(e.target.value))} className="w-full accent-[#00334f]" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={ausAsian} onChange={e => setAusAsian(e.target.checked)} className="rounded" />
                      <span>Asian, Aboriginal, Torres Strait, or Pacific Islander descent (+2 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={ausFamHist} onChange={e => setAusFamHist(e.target.checked)} className="rounded" />
                      <span>Parent/sibling diagnosed with diabetes (+3 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={ausHighBg} onChange={e => setAusHighBg(e.target.checked)} className="rounded" />
                      <span>Past history of elevated glucose/gestational DM (+6 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={ausBpMeds} onChange={e => setAusBpMeds(e.target.checked)} className="rounded" />
                      <span>Taking blood pressure medications (+2 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={ausSmoker} onChange={e => setAusSmoker(e.target.checked)} className="rounded" />
                      <span>Smokes tobacco daily (+2 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={ausInactivity} onChange={e => setAusInactivity(e.target.checked)} className="rounded" />
                      <span>Less than 2.5 hours/week physical activity (+2 pts)</span>
                    </label>
                  </div>
                </div>

                {ausdriskResult && (
                  <div className={`p-5 rounded-xl border flex flex-col justify-between ${ausdriskResult.color}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">AUSDRISK Point Score</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-black">{ausdriskResult.score}</span>
                        <span className="text-xs font-bold">points</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 border shadow-xs ml-auto">
                          {ausdriskResult.riskTier}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/20 space-y-2 text-xs">
                        <p className="font-semibold">5-Year Type 2 DM Probability: <span className="font-bold">{ausdriskResult.fiveYearProb}</span></p>
                        <p className="text-[11px] leading-relaxed opacity-95">{ausdriskResult.recommendations}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[AUSDRISK Assessment] Score: ${ausdriskResult.score} pts (${ausdriskResult.riskTier}). 5-Year Probability: ${ausdriskResult.fiveYearProb}. Action: ${ausdriskResult.recommendations}`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: eGFR / CKD-EPI */}
          {activeCalcTab === "egfr" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800">CKD-EPI (2021) Renal Formula</h4>
                  
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Serum Creatinine (µmol/L):</label>
                    <input
                      type="number"
                      value={creatinineVal}
                      onChange={e => setCreatinineVal(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-lg text-sm font-bold"
                    />
                    <div className="flex gap-2 mt-1.5">
                      {[60, 80, 95, 120, 160, 220, 350].map(c => (
                        <button key={c} onClick={() => setCreatinineVal(c)} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {c} µmol/L
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="font-semibold text-slate-700">Patient Age:</label>
                      <input type="number" value={egfrAge} onChange={e => setEgfrAge(Number(e.target.value))} className="w-full p-1.5 bg-white border rounded text-xs mt-1" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Biological Sex:</label>
                      <select value={egfrGender} onChange={e => setEgfrGender(e.target.value as any)} className="w-full p-1.5 bg-white border rounded text-xs mt-1">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                {egfrResult && (
                  <div className={`p-5 rounded-xl border flex flex-col justify-between ${egfrResult.color}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">Estimated GFR (CKD-EPI)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-black">{egfrResult.egfr}</span>
                        <span className="text-sm font-bold">mL/min/1.73m²</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border shadow-xs ml-auto">
                          {egfrResult.stage}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/20 space-y-2 text-xs">
                        <p className="font-bold">Clinical Action & Dosing Guard:</p>
                        <p className="text-[11px] leading-relaxed opacity-95">{egfrResult.actionProtocol}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[eGFR Renal Assessment] eGFR: ${egfrResult.egfr} mL/min/1.73m² (${egfrResult.stage}). Creatinine: ${creatinineVal} µmol/L. Protocol: ${egfrResult.actionProtocol}`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Blood Pressure Staging */}
          {activeCalcTab === "bp" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800">Blood Pressure Readings</h4>
                  
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Systolic BP (mmHg):</label>
                    <input
                      type="number"
                      value={bpSystolic}
                      onChange={e => setBpSystolic(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-lg text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Diastolic BP (mmHg):</label>
                    <input
                      type="number"
                      value={bpDiastolic}
                      onChange={e => setBpDiastolic(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-lg text-sm font-bold"
                    />
                  </div>
                </div>

                {bpResult && (
                  <div className={`p-5 rounded-xl border flex flex-col justify-between ${bpResult.color}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">Classification (ACC/AHA)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black">{bpSystolic} / {bpDiastolic}</span>
                        <span className="text-sm font-bold">mmHg</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border shadow-xs ml-auto">
                          {bpResult.classification}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/20 space-y-2 text-xs">
                        <p className="font-bold">Guideline Recommendation:</p>
                        <p className="text-[11px] leading-relaxed opacity-95">{bpResult.managementPlan}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[BP Staging] ${bpSystolic}/${bpDiastolic} mmHg (${bpResult.classification}). Action: ${bpResult.managementPlan}`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Pregnancy / EDD */}
          {activeCalcTab === "pregnancy" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800">Naegele's Obstetric Calculator</h4>
                  
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">First Day of Last Menstrual Period (LMP):</label>
                    <input
                      type="date"
                      value={lmpDate}
                      onChange={e => setLmpDate(e.target.value)}
                      className="w-full p-2 bg-white border rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Average Menstrual Cycle Length (Days):</label>
                    <input
                      type="number"
                      value={cycleDays}
                      onChange={e => setCycleDays(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {pregResult && (
                  <div className="p-5 rounded-xl border bg-pink-50/80 border-pink-200 text-pink-950 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">Estimated Date of Delivery (EDD)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black">{pregResult.eddDateStr}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border shadow-xs ml-auto">
                          {pregResult.currentTrimester}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-pink-200 space-y-1.5 text-xs">
                        <p className="font-bold">Current Gestation: <span className="text-sm font-black">{pregResult.gestationalWeeks} weeks + {pregResult.gestationalDays} days</span></p>
                        <p className="font-bold text-[10px] text-pink-900 uppercase">Antenatal Milestones:</p>
                        <ul className="text-[10px] space-y-0.5 list-disc pl-4 text-pink-900">
                          {pregResult.scheduleCheckpoints.slice(0, 3).map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[Obstetric Assessment] EDD: ${pregResult.eddDateStr}, Gestational Age: ${pregResult.gestationalWeeks}w + ${pregResult.gestationalDays}d (${pregResult.currentTrimester}). LMP: ${lmpDate}.`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Paediatric Dosing */}
          {activeCalcTab === "paediatric" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800">Paediatric Weight-Based Dosing</h4>
                  
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Select Medication:</label>
                    <select
                      value={paedDrug}
                      onChange={e => setPaedDrug(e.target.value as any)}
                      className="w-full p-2 bg-white border rounded-lg text-xs font-bold"
                    >
                      <option value="Paracetamol">Paracetamol (15 mg/kg Q4-6H)</option>
                      <option value="Ibuprofen">Ibuprofen (10 mg/kg Q6-8H)</option>
                      <option value="Amoxicillin">Amoxicillin (30-50 mg/kg/day TDS)</option>
                      <option value="Cephalexin">Cephalexin (25 mg/kg/day BD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Child's Weight (kg):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={paedWeight}
                      onChange={e => setPaedWeight(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-lg text-sm font-bold"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      {[6, 8, 10, 12, 14, 18, 22, 28].map(w => (
                        <button key={w} onClick={() => setPaedWeight(w)} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {w}kg
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {paedResult && (
                  <div className="p-5 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-950 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">Calculated Dose</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black">{paedResult.recommendedDoseMg} mg</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border shadow-xs ml-auto">
                          {paedResult.drugName}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-emerald-200 space-y-1.5 text-xs">
                        <p className="font-semibold">Frequency: <span className="font-bold">{paedResult.frequency}</span></p>
                        <p className="font-semibold">Liquid Formulation: <span className="font-bold text-emerald-800">{paedResult.syrupDispenseMl}</span></p>
                        <p className="text-[10px] text-emerald-800">Max 24h limit: {paedResult.maxDailyMg} mg</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySummary(`[Paediatric Dose] ${paedResult.drugName} ${paedResult.recommendedDoseMg}mg for ${paedWeight}kg child. Frequency: ${paedResult.frequency}. Formulation: ${paedResult.syrupDispenseMl}`)}
                      className="mt-4 w-full bg-[#00334f] hover:bg-[#0c4a6e] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotification ? "Saved to Consultation Notes!" : "Insert into Clinical Notes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            Clinical Decision Support aligned with RACGP, Heart Foundation, & Kidney Health Australia standards.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

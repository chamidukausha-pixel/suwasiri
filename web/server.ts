import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  BRANCH_COLOMBO,
  DEFAULT_BRANCHES,
  DEFAULT_HOSPITALS,
  DEFAULT_MEMBERSHIPS,
  DEFAULT_ROLES,
  DEFAULT_STAFF_DIRECTORY,
  DEFAULT_STAFF_USERS,
  HOSPITAL_PRIMECARE,
  SOUTHERN_DEMO_PATIENT,
  USER_PLATFORM_CHAMIDU,
  cloneHospitalRoles,
  roleIdFor,
} from "./src/tenancy";
import { DEFAULT_FEE_SCHEDULE } from "./src/catalogs/feeSchedule";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize store file path
const DATA_FILE = path.join(process.cwd(), "patient_store.json");

/** Unread inbox samples for Pathology & Diagnoses. Migrated onto existing patient_store.json by id. */
const SAMPLE_UNREAD_PATHOLOGY: Record<string, Array<Record<string, unknown>>> = {
  "9942-LK": [
    {
      id: "lab-unread-fatima-tsh",
      testName: "Thyroid Function (TSH)",
      date: "2026-08-28",
      status: "ABNORMAL",
      result: "TSH 6.8 mIU/L (High, Ref: 0.4 – 4.0)",
      remarks: "Subclinical hypothyroidism. Correlate with fatigue and weight change.",
      abnormalFlag: true,
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Endocrine",
    },
    {
      id: "lab-unread-fatima-fbc",
      testName: "Full Blood Count (FBC)",
      date: "2026-08-28",
      status: "COMPLETED",
      result: "Hb 12.4 g/dL · WBC 6.1 ×10⁹/L · Plt 268 ×10⁹/L",
      remarks: "Within reference intervals. No anaemia.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Haematology",
    },
  ],
  "8821-LK": [
    {
      id: "lab-unread-arjuna-acr",
      testName: "Urine Albumin/Creatinine Ratio",
      date: "2026-08-27",
      status: "COMPLETED",
      result: "ACR 1.8 mg/mmol (Normal, Ref: < 3.0)",
      remarks: "No microalbuminuria. Occupational health screen.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Renal",
    },
  ],
  "3210-LK": [
    {
      id: "lab-unread-anura-crp",
      testName: "C-Reactive Protein (CRP)",
      date: "2026-08-29",
      status: "ABNORMAL",
      result: "CRP 28 mg/L (Elevated, Ref: < 5)",
      remarks: "Supports ongoing inflammation with persistent cough. Consider dengue/viral panel if fever returns.",
      abnormalFlag: true,
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Inflammation",
    },
    {
      id: "lab-unread-anura-dengue",
      testName: "Dengue NS1 Antigen",
      date: "2026-08-29",
      status: "COMPLETED",
      result: "NS1 Not Detected",
      remarks: "Negative at this collection. Repeat if fever persists beyond day 3.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Infectious disease",
    },
  ],
  "1092-LK": [
    {
      id: "lab-unread-rohan-hba1c",
      testName: "Glycated Hemoglobin (HbA1c)",
      date: "2026-08-27",
      status: "ABNORMAL",
      result: "HbA1c 8.9% (High, target < 7.0%)",
      remarks: "Worsening glycaemic control. Review metformin, diet, and neuropathy symptoms.",
      abnormalFlag: true,
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Diabetes",
    },
  ],
  "4412-LK": [
    {
      id: "lab-unread-sunethra-lft",
      testName: "Liver Function Tests (LFT)",
      date: "2026-08-26",
      status: "COMPLETED",
      result: "ALT 32 U/L · AST 28 U/L · ALP 88 U/L · Bilirubin 0.8 mg/dL",
      remarks: "Post-cholecystectomy LFTs within normal limits.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Hepatology",
    },
  ],
  "2198-LK": [
    {
      id: "lab-unread-mahesh-trop",
      testName: "High-sensitivity Troponin I",
      date: "2026-08-29",
      status: "CRITICAL",
      result: "hs-TnI 412 ng/L (Critical, Ref: < 34)",
      remarks: "Possible acute coronary syndrome. Urgent clinical review and recall if not already in clinic.",
      abnormalFlag: true,
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Cardiac",
    },
    {
      id: "lab-unread-mahesh-ue",
      testName: "Urea & Electrolytes",
      date: "2026-08-29",
      status: "COMPLETED",
      result: "Na 138 · K 4.1 · Urea 5.2 · Creatinine 98 µmol/L",
      remarks: "Renal function stable on amlodipine.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Renal",
    },
  ],
  "6322-LK": [
    {
      id: "lab-unread-ruwan-lipid",
      testName: "Fasting Lipid Profile",
      date: "2026-08-28",
      status: "ABNORMAL",
      result: "LDL 168 mg/dL (High) · HDL 38 mg/dL · Triglycerides 210 mg/dL",
      remarks: "On lisinopril. Cardiovascular risk — consider statin discussion.",
      abnormalFlag: true,
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Cardiometabolic",
    },
  ],
  "1827-LK": [
    {
      id: "lab-unread-suresh-fbc",
      testName: "Full Blood Count (FBC)",
      date: "2026-08-27",
      status: "COMPLETED",
      result: "Hb 13.1 g/dL · WBC 5.8 ×10⁹/L · Plt 241 ×10⁹/L",
      remarks: "Routine screen. No cytopenia.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Haematology",
    },
  ],
  "3693-LK": [
    {
      id: "lab-unread-chamidu-fbs",
      testName: "Fasting Blood Sugar (FBS)",
      date: "2026-08-29",
      status: "ABNORMAL",
      result: "FBS 118 mg/dL (Impaired, Ref: 70 – 100)",
      remarks: "Impaired fasting glucose. Lifestyle advice and repeat in 3 months.",
      abnormalFlag: true,
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Diabetes",
    },
  ],
  "7701-LK": [
    {
      id: "lab-unread-ishara-tsh",
      testName: "Thyroid Function (Free T4 + TSH)",
      date: "2026-08-26",
      status: "COMPLETED",
      result: "TSH 1.9 mIU/L · FT4 1.2 ng/dL (Euthyroid)",
      remarks: "Thyroid axis normal.",
      doctorReviewed: false,
      labName: "LankaLab - Colombo 03",
      category: "Endocrine",
    },
  ],
};

function mergeUnreadPathologySamples(labResults: any[] | undefined, patientId: string): { labs: any[]; changed: boolean } {
  const samples = SAMPLE_UNREAD_PATHOLOGY[patientId] || [];
  const labs = Array.isArray(labResults) ? [...labResults] : [];
  let changed = false;
  for (const sample of samples) {
    if (!labs.some((lr) => lr && lr.id === sample.id)) {
      labs.unshift(sample);
      changed = true;
    }
  }
  return { labs, changed };
}

// Default initial state matching the mockup and specifications with expanded features
const INITIAL_STATE = {
  patients: [
    {
      id: "9942-LK",
      name: "Fatima Zahra",
      age: 52,
      gender: "Female",
      bloodType: "O+",
      allergies: "Penicillin, Sulfa Drugs",
      phone: "+94 77 123 4567",
      email: "fatima.z@gmail.com",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA47qS69AH5bvNCTnM-s0ZmRfxT4b3TbhXqCQbKjGKdUQZIts0tigMpwXRs4gxDDQI2tMVt7rl_9OLS48MrOGHDE9t2CueGtB1mdu8J2ffYWnxYdsGezHdob2vIARibFl3kTyNsha4YX21oU_3gizPOwjQPBG4uecZbWMGRNFkGZ2IDSNTnvjAf4oqKNzT4RC5YwvSEzCqmW226XGDSHHoNUxQzDNLvZUOgu4ccp8GpGejTZEDoJ3yiq8xzz9yNf5-fUV3zs6H85Q0",
      notes: "Known history of mild asthma. Prefers afternoon consultations. Patient has chronic knee osteoarthrosis.",
      history: [
        { date: "2026-04-10", reason: "Asthma Check-up", doctor: "Dr. Priyantha Silva", notes: "Symptom control is good. Prescribed inhaler renewal." },
        { date: "2026-03-12", reason: "Joint Pain Consultation", doctor: "Dr. Priyantha Silva", notes: "Right knee mild swelling. Advised NSAIDs with caution." }
      ],
      activeMedications: ["Ventolin Inhaler on-demand", "Paracetamol 500mg PRN"],
      // Advanced Medical Fields
      medicalHistory: [
        "Bronchial Asthma (Mild persistent, diagnosed 2012)",
        "Osteoarthritis of the Right Knee (Chronic, onset 2021)",
        "Essential Hypertension (Controlled, diagnosed 2024)"
      ],
      vaccineRecords: [
        { vaccineName: "BCG (Tuberculosis)", date: "1974-06-15", dose: "Single Dose", batchNumber: "BCG-992-K", status: "Completed" },
        { vaccineName: "MMR (Measles, Mumps, Rubella)", date: "1978-02-10", dose: "1st Dose", batchNumber: "MMR-023-M", status: "Completed" },
        { vaccineName: "COVID-19 Sinopharm", date: "2021-08-15", dose: "1st & 2nd Dose", batchNumber: "COV-SP-443", status: "Completed" },
        { vaccineName: "Influenza (Seasonal Quadrivalent)", date: "2025-11-20", dose: "Annual Booster", batchNumber: "FLU-25-A", status: "Completed" }
      ],
      labResults: [
        ...SAMPLE_UNREAD_PATHOLOGY["9942-LK"],
        { id: "lab-res-1", testName: "HbA1c Glycated Hemoglobin", date: "2026-04-10", status: "COMPLETED", result: "5.9% (Pre-diabetic, Ref: < 5.7%)", remarks: "Consistent with dietary habits. Advised reduction in simple carbohydrates.", doctorReviewed: true },
        { id: "lab-res-2", testName: "Serum Potassium", date: "2026-03-12", status: "COMPLETED", result: "4.2 mmol/L (Normal, Ref: 3.5 - 5.1)", remarks: "In normal range. Heart rhythm safe.", doctorReviewed: true },
        { id: "lab-res-3", testName: "Cholesterol Profile", date: "2025-12-05", status: "COMPLETED", result: "Chol: 215 mg/dL (Borderline), HDL: 48 mg/dL, LDL: 132 mg/dL", remarks: "Advised standard dietary changes, coconut oil intake limitations.", doctorReviewed: true }
      ],
      prescriptionsList: [
        { id: "rx-991", date: "2026-04-10", items: ["Ventolin Inhaler 100mcg - 2 puffs as required"], dosageInstructions: "For asthma relief on demand. Max 8 puffs daily.", rxNumber: "RX-2026-00412", signatureUrl: "Dr. P. Silva" },
        { id: "rx-992", date: "2026-03-12", items: ["Paracetamol 500mg - 2 tablets TDS"], dosageInstructions: "Analgesic cover for knee stiffness. Use after meals.", rxNumber: "RX-2026-00219", signatureUrl: "Dr. P. Silva" }
      ]
    },
    {
      id: "8821-LK",
      name: "Arjuna Perera",
      age: 44,
      gender: "Male",
      bloodType: "A+",
      allergies: "None",
      phone: "+94 71 987 6543",
      email: "arjuna.perera@gmail.com",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2IKFH8hDm7_KI7CkT6UoWrS5wEXLQyqcR2Irx6_vPrCRNMgRem0vyC_iGOKT8oT0kL5kH6py_hOzsqBjsT9XXpuHHJRG7qtCi1U82a_5njOzAm1iF2Uj0glw-gyO6HpVTJYqfMlvR4qPCWdGsa2wIx8mRRxV_K5W5JpBkq3ZgHkYGag3RJpsmlAIz4XDPFYP8G5rjrRtOKvM436igClPRf34aPTLJSwBlZseCbdiWOozzpTmjU7g7T-yg0ABUDGHpnON2ogUJOMA",
      notes: "Complained of lower back pain following lifting heavy cargo. Works in logistics warehouse.",
      history: [
        { date: "2026-05-18", reason: "Annual Health Assessment", doctor: "Dr. Priyantha Silva", notes: "Overall healthy. Normal ECG, blood glucose, cholesterol." }
      ],
      activeMedications: [],
      medicalHistory: [
        "Mechanical Lower Back Strain (chronic occupational hazards)",
        "No major chronic diseases declared"
      ],
      vaccineRecords: [
        { vaccineName: "Tetanus Toxoid Booster", date: "2024-05-18", dose: "Booster", batchNumber: "TE-990-T", status: "Completed" },
        { vaccineName: "COVID-19 AstraZeneca", date: "2021-06-11", dose: "1st & 2nd Dose", batchNumber: "COV-AZ-112", status: "Completed" }
      ],
      labResults: [
        ...SAMPLE_UNREAD_PATHOLOGY["8821-LK"],
        { id: "lab-res-4", testName: "Lipid Profile & Glucose FBG", date: "2026-05-18", status: "COMPLETED", result: "FBG: 92 mg/dL (Normal), Total Chol: 184 mg/dL (Normal)", remarks: "Excellent cardiovascular biomarkers.", doctorReviewed: true }
      ],
      prescriptionsList: []
    },
    {
      id: "3210-LK",
      name: "Anura Kumara",
      age: 38,
      gender: "Male",
      bloodType: "B+",
      allergies: "Dust, Pollen",
      phone: "+94 72 234 5678",
      email: "anura.k@gmail.com",
      image: "",
      notes: "Persistent Cough (2 weeks). Slight evening temperature, dry throat.",
      history: [
        { date: "2025-11-05", reason: "Sore Throat", doctor: "Dr. Priyantha Silva", notes: "Acute pharyngitis, resolved with warm saline gargles." }
      ],
      activeMedications: [],
      medicalHistory: [
        "Allergic Sinitus & Rhinitis (seasonal, triggered by dust)",
        "Past childhood history of bronchitis"
      ],
      vaccineRecords: [
        { vaccineName: "Hepatitis B Recombinant", date: "2022-10-15", dose: "Full 3-dose series", batchNumber: "HEP-B-33", status: "Completed" },
        { vaccineName: "COVID-19 Pfizer", date: "2021-12-02", dose: "Booster", batchNumber: "COV-PZ-998", status: "Completed" }
      ],
      labResults: [
        ...SAMPLE_UNREAD_PATHOLOGY["3210-LK"],
        { id: "lab-res-5", testName: "Full Blood Count (FBC)", date: "2025-11-05", status: "COMPLETED", result: "WBC: 7.8 x10^3/uL (Normal), Platelets: 245 x10^3/uL", remarks: "Pharyngitis, non-bacterial baseline indicators.", doctorReviewed: true }
      ],
      prescriptionsList: []
    },
    {
      id: "1092-LK",
      name: "Rohan Ratnayake",
      age: 61,
      gender: "Male",
      bloodType: "AB-",
      allergies: "Aspirin",
      phone: "+94 77 543 2109",
      email: "rohan.r@gmail.com",
      image: "",
      notes: "Acute Diabetic Review. Type 2 diabetes on Metformin. Patient complains of occasional numbness in toes.",
      history: [
        { date: "2026-01-14", reason: "Diabetic Review & Bloods", doctor: "Dr. Priyantha Silva", notes: "HbA1c was 7.4%. Reiterated lifestyle modifications and exercise regimen." }
      ],
      activeMedications: ["Metformin 1000mg BD", "Atorvastatin 10mg Nocte"],
      medicalHistory: [
        "Type 2 Diabetes Mellitus (diagnosed 2018)",
        "Hypercholesterolemia (onset 2020)",
        "Diabetic Peripheral Sensory Neuropathy (mild, toes only)"
      ],
      vaccineRecords: [
        { vaccineName: "Pneumococcal Conjugate (PCV13)", date: "2025-01-14", dose: "Single Elderly Dose", batchNumber: "PNE-71-D", status: "Completed" },
        { vaccineName: "COVID-19 Sinopharm", date: "2021-09-01", dose: "Completed", batchNumber: "COV-SP-445", status: "Completed" }
      ],
      labResults: [
        ...SAMPLE_UNREAD_PATHOLOGY["1092-LK"],
        { id: "lab-res-6", testName: "Glycated Hemoglobin (HbA1c)", date: "2026-01-14", status: "COMPLETED", result: "7.4% (Elevated, Ref: < 5.7%)", remarks: "Suboptimal glycemic control. Metformin dose titrated up.", doctorReviewed: true },
        { id: "lab-res-7", testName: "Serum Lipid profile", date: "2026-01-14", status: "COMPLETED", result: "Total Chol: 248 mg/dL (High), LDL-C: 154 mg/dL", remarks: "Atorvastatin cover initiated at 10mg nightly to prevent risk.", doctorReviewed: true }
      ],
      prescriptionsList: [
        { id: "rx-109", date: "2026-01-14", items: ["Metformin 1000mg - 1 BD", "Atorvastatin 10mg - 1 Nocte"], dosageInstructions: "Metformin with meals; Atorvastatin at bedtime.", rxNumber: "RX-2026-08119", signatureUrl: "Dr. P. Silva" }
      ]
    },
    {
      id: "4412-LK",
      name: "Sunethra Devi",
      age: 49,
      gender: "Female",
      bloodType: "O-",
      allergies: "None",
      phone: "+94 76 111 2222",
      email: "sunethra.d@gmail.com",
      image: "",
      notes: "Post-Op Follow-up for laparoscopic cholecystectomy (3 weeks post-surgery). Normal appetite, incisions healed cleanly.",
      history: [
        { date: "2026-05-20", reason: "Pre-Op Assessment", doctor: "Dr. Priyantha Silva", notes: "Fit for general anesthesia, baseline labs normal." }
      ],
      activeMedications: [],
      medicalHistory: [
        "Gallbladder Cholelithiasis (Surgically resolved - May 2026)",
        "No previous drug allergies or systemic conditions"
      ],
      vaccineRecords: [
        { vaccineName: "COVID-19 Pfizer", date: "2021-12-15", dose: "2 Doses + 1 Booster", batchNumber: "COV-PF-40", status: "Completed" }
      ],
      labResults: [
        ...SAMPLE_UNREAD_PATHOLOGY["4412-LK"],
        { id: "lab-res-8", testName: "Pre-Op Complete Blood Count", date: "2026-05-20", status: "COMPLETED", result: "WBC: 6.4, Hemoglobin: 12.8 g/dL, Platelets: 290", remarks: "Excellent hematology limits. Cleared for elective theater.", doctorReviewed: true }
      ],
      prescriptionsList: []
    },
    {
      id: "2198-LK",
      name: "Mahesh Jayawardena",
      age: 55,
      gender: "Male",
      bloodType: "A-",
      allergies: "Shellfish",
      phone: "+94 75 333 4444",
      email: "mahesh.j@gmail.com",
      image: "",
      notes: "Hypertension Monitoring. Advised on low sodium diet, exercise.",
      history: [
        { date: "2026-02-02", reason: "BP Assessment", doctor: "Dr. Priyantha Silva", notes: "BP readings stabilized around 135/85 mmHg." }
      ],
      activeMedications: ["Amlodipine 5mg OD"],
      medicalHistory: [
        "Primary Essential Hypertension (diagnosed 2023)",
        "Moderate hyperuricaemia (risk of gout)"
      ],
      vaccineRecords: [
        { vaccineName: "COVID-19 AstraZeneca", date: "2021-07-28", dose: "Completed", batchNumber: "COV-AZ-88", status: "Completed" }
      ],
      labResults: [
        ...SAMPLE_UNREAD_PATHOLOGY["2198-LK"],
        { id: "lab-res-9", testName: "Serum Uric Acid & Creatinine", date: "2026-02-02", status: "COMPLETED", result: "Uric Acid: 7.2 mg/dL (Slightly elevated, Ref: 3.5 - 7.0), Creatinine: 1.0 mg/dL", remarks: "Keep hydration high. Monitor joint pains.", doctorReviewed: true }
      ],
      prescriptionsList: [
        { id: "rx-219", date: "2026-02-02", items: ["Amlodipine 5mg - 1 OD"], dosageInstructions: "Take in the morning with a full glass of water.", rxNumber: "RX-2026-0129", signatureUrl: "Dr. P. Silva" }
      ]
    },
    SOUTHERN_DEMO_PATIENT
  ],
  clinicCalendarSeedAug2026: true,
  appointments: [
    {
      id: "apt-1",
      patientId: "3210-LK",
      time: "09:15 AM",
      reason: "Persistent Cough (2 weeks)",
      status: "IN EXAM ROOM",
      date: "2026-08-20",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-2",
      patientId: "1092-LK",
      time: "09:45 AM",
      reason: "Acute Diabetic Review",
      status: "CHECKED IN",
      date: "2026-08-20",
      type: "Care Plan Review",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-3",
      patientId: "4412-LK",
      time: "10:00 AM",
      reason: "Post-Op Follow-up",
      status: "SCHEDULED",
      date: "2026-08-20",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-4",
      patientId: "2198-LK",
      time: "10:15 AM",
      reason: "Hypertension Monitoring",
      status: "SCHEDULED",
      date: "2026-08-20",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-5",
      patientId: "9942-LK",
      time: "11:00 AM",
      reason: "Asthma inhaler technique review",
      status: "SCHEDULED",
      date: "2026-08-20",
      type: "Long Consult (20+ min)",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-6",
      patientId: "8821-LK",
      time: "08:30 AM",
      reason: "Lower back strain review",
      status: "SCHEDULED",
      date: "2026-08-21",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-7",
      patientId: "9942-LK",
      time: "09:00 AM",
      reason: "Spirometry and asthma action plan",
      status: "SCHEDULED",
      date: "2026-08-25",
      type: "Long Consult (20+ min)",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-8",
      patientId: "2198-LK",
      time: "10:30 AM",
      reason: "Blood pressure and ECG",
      status: "SCHEDULED",
      date: "2026-08-25",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-30a",
      patientId: "3210-LK",
      time: "09:00 AM",
      reason: "Cough follow-up and chest review",
      status: "SCHEDULED",
      date: "2026-08-30",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-30b",
      patientId: "9942-LK",
      time: "09:30 AM",
      reason: "Asthma plan and inhaler renewal",
      status: "SCHEDULED",
      date: "2026-08-30",
      type: "Care Plan Review",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-30c",
      patientId: "1092-LK",
      time: "10:15 AM",
      reason: "HbA1c review and medication titration",
      status: "SCHEDULED",
      date: "2026-08-30",
      type: "Care Plan Review",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-30d",
      patientId: "2198-LK",
      time: "11:00 AM",
      reason: "Hypertension check and ECG",
      status: "CHECKED IN",
      date: "2026-08-30",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-30e",
      patientId: "4412-LK",
      time: "02:00 PM",
      reason: "Post-op wound review",
      status: "SCHEDULED",
      date: "2026-08-30",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-sep-1",
      patientId: "8821-LK",
      time: "09:00 AM",
      reason: "Physiotherapy progress review",
      status: "SCHEDULED",
      date: "2026-09-02",
      type: "Standard GP Consult",
      doctorName: "Dr. Priyantha Silva"
    },
    {
      id: "apt-sep-2",
      patientId: "1092-LK",
      time: "10:00 AM",
      reason: "Diabetic diet and glucose diary",
      status: "SCHEDULED",
      date: "2026-09-03",
      type: "Care Plan Review",
      doctorName: "Dr. Priyantha Silva"
    }
  ],
  alerts: [
    {
      id: "alert-1",
      type: "CRITICAL LAB RESULT",
      title: "Nimal Sirisena - Potassium 6.2 mmol/L",
      timeLabel: "10m ago",
      text: "Requires immediate clinical intervention and review.",
      severity: "critical"
    },
    {
      id: "alert-2",
      type: "IMAGING REPORT",
      title: "K. Gunawardena - Chest X-Ray Final",
      timeLabel: "1h ago",
      text: "Abnormal findings detected: Right lower lobe consolidation.",
      severity: "high"
    }
  ],
  tasks: [
    { id: "task-1", text: "Sign-off 3 Blood Work Referrals", dueDate: "Due: 12:00 PM", completed: false },
    { id: "task-2", text: "Phone Consult: Mrs. Perera (Lab Results)", dueDate: "Due: 02:30 PM", completed: false },
    { id: "task-3", text: "Update Medication List - Patient #4412", dueDate: "Due: End of Shift", completed: false },
    { id: "task-4", text: "Check Emergency Kit Inventory", dueDate: "Completed", completed: true }
  ],
  billing: [
    { id: "bill-1", patientName: "Fatima Zahra", amount: 2500, service: "General Consultation + Prescription", status: "PAID", date: "2026-06-12", paidBySuwasiri: true },
    { id: "bill-2", patientName: "Arjuna Perera", amount: 1500, service: "GP Consultation", status: "PAID", date: "2026-06-11" },
    { id: "bill-3", patientName: "Anura Kumara", amount: 1500, service: "Clinical Review", status: "PENDING", date: "2026-06-12" },
    { id: "bill-4", patientName: "Rohan Ratnayake", amount: 3000, service: "Diabetic Consultation + Glucometer check", status: "PENDING", date: "2026-06-12" }
  ],
  // NEW Advanced global components state
  drugs: [
    "Amoxicillin 500mg Capsule (Antibiotic - Penicillin)",
    "Co-trimoxazole 480mg Tablet (Sulfa Antibiotic)",
    "Metformin 1000mg Tablet (Glucophage - Type 2 Diabetes)",
    "Metformin 500mg Tablet (Glucophage - Type 2 Diabetes)",
    "Amlodipine 5mg Tablet (Norvasc - Hypertension)",
    "Ventolin Inhaler 100mcg (Salbutamol Evohaler - Asthma)",
    "Paracetamol 500mg Tablet (Panadol - Analgesic / Fever)",
    "Losartan Potassium 50mg Tablet (Angiotensin Guard)",
    "Atorvastatin 10mg Tablet (Lipitor - Lipid lowering)",
    "Atorvastatin 20mg Tablet (Lipitor - Lipid lowering)",
    "Prednisolone 5mg Tablet (Steroid steroid cover)",
    "Cetirizine Hydrochloride 10mg Tablet (Allergy Antihistamine)",
    "Clopidogrel 75mg Tablet (Plavix - Antiplatelet)",
    "Omeprazole 20mg Capsule (Proton Pump Inhibitor for reflux)"
  ],
  notifications: [
    {
      id: "notif-1",
      patientName: "Fatima Zahra",
      recipient: "+94 77 123 4567",
      transport: "WhatsApp",
      templateType: "PRESCRIPTION_READY",
      content: "Hi Fatima, your prescription RX-2026-00412 from Sri Lankan GP Care is active and ready for dispatch. Pls contact your local chemist.",
      date: "2026-06-12 10:15 AM",
      status: "DELIVERED"
    },
    {
      id: "notif-2",
      patientName: "Arjuna Perera",
      recipient: "+94 71 987 6543",
      transport: "SMS",
      templateType: "APPOINTMENT_REMINDER",
      content: "Reminder: Your health assessment check-up with Dr. Priyantha Silva is booked for today at 11:30 AM. Pls present at reception.",
      date: "2026-06-12 08:00 AM",
      status: "DELIVERED"
    }
  ],
  clinicMessages: [
    { id: "msg-1", sender: "Ms. Sandamali Jayasekara", senderRole: "Admin", text: "Welcome to Sri Lankan GP Care secure internal messaging channel! All staff chats are clinical-compliant.", timestamp: "2026-06-12 08:15 AM", channel: "#general-clinical" },
    { id: "msg-2", sender: "Mr. Thusitha Perera", senderRole: "Receptionist", text: "Dr. Silva, Fatima Zahra has arrived and checked in for her clinic files review.", timestamp: "2026-06-12 09:10 AM", channel: "#general-clinical" },
    { id: "msg-3", sender: "Dr. Priyantha Silva", senderRole: "Doctor", text: "Excellent, Thusitha. Pls confirm if we have her latest serum potassium lab report loaded in her history card.", timestamp: "2026-06-12 09:12 AM", channel: "#general-clinical" }
  ],
  labOrders: [
    {
      id: "order-1",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      testName: "Renal Function Profile",
      dateOrdered: "2026-06-12",
      status: "COMPLETED",
      remarks: "Serum Potassium is 4.2 (Normal range). Cleared from high potassium threat limits.",
      dateCompleted: "2026-06-12"
    },
    {
      id: "order-2",
      patientId: "3210-LK",
      patientName: "Anura Kumara",
      testName: "Dengue NS1 Antigen Antigen Panel",
      dateOrdered: "2026-06-12",
      status: "COMPLETED",
      remarks: "Sample processing complete. Result: NEGATIVE.",
      dateCompleted: "2026-06-12"
    }
  ],
  expenses: [
    { id: "exp-1", category: "Medical Supplies", amount: 12500, description: "Surgical gloves, syringes, and clinical gauze restock", date: "2026-06-15" },
    { id: "exp-2", category: "Utilities", amount: 4800, description: "Monthly fiber broadband & clinical power grid surcharge", date: "2026-06-14" },
    { id: "exp-3", category: "Salaries", amount: 35000, description: "Part-time Registered Nurse shift salary (June first half)", date: "2026-06-15" }
  ],
  sampleCollections: [
    {
      id: "SC-001",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      sampleCategory: "Blood",
      status: "COLLECTED",
      collectedTime: "2026-06-15 08:30 AM",
      labName: "LankaLab - Colombo 03",
      lankaLabSyncStatus: "SYNCED",
      lankaLabLedgerKey: "LKLAB-SMP-7A9B1D"
    },
    {
      id: "SC-002",
      patientId: "8821-LK",
      patientName: "Arjuna Perera",
      sampleCategory: "Both Blood & Urinal",
      status: "PENDING",
      collectedTime: "",
      deliveredTime: "",
      deliveryPersonName: "",
      deliveryPersonPhone: "",
      deliveryPersonId: "",
      labName: "",
      lankaLabSyncStatus: "NOT_SYNCED",
      lankaLabLedgerKey: ""
    }
  ],
  hospitals: DEFAULT_HOSPITALS,
  branches: DEFAULT_BRANCHES,
  roles: DEFAULT_ROLES,
  staffUsers: DEFAULT_STAFF_USERS,
  memberships: DEFAULT_MEMBERSHIPS,
  staffDirectory: DEFAULT_STAFF_DIRECTORY,
  feeSchedule: DEFAULT_FEE_SCHEDULE,
  patientAccessRequests: [],
  recalls: [
    {
      id: "rec-1",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      patientPhone: "+94 77 982 1100",
      patientEmail: "fatima.zahra@email.lk",
      category: "Diabetes Review",
      urgency: "HIGH",
      dueDate: "2026-08-25",
      status: "DUE",
      notes: "6-monthly HbA1c, microalbuminuria check, and diabetic foot sensory exam",
      assignedDoctor: "Dr. Priyantha Silva"
    },
    {
      id: "rec-2",
      patientId: "1028-LK",
      patientName: "Sunil Jayawardena",
      patientPhone: "+94 71 345 8899",
      patientEmail: "sunil.j@email.lk",
      category: "Pathology Follow-up",
      urgency: "HIGH",
      dueDate: "2026-08-20",
      status: "DUE",
      notes: "Elevated Fasting Lipid Profile (Cholesterol 6.8 mmol/L, LDL 4.2). Review statin therapy.",
      assignedDoctor: "Dr. Priyantha Silva"
    },
    {
      id: "rec-3",
      patientId: "4491-LK",
      patientName: "Kamala Wickramasinghe",
      patientPhone: "+94 77 234 5566",
      patientEmail: "kamala.w@email.lk",
      category: "Immunisation",
      urgency: "ROUTINE",
      dueDate: "2026-09-01",
      status: "SMS_SENT",
      lastContactedDate: "2026-08-14",
      contactMethod: "SMS",
      notes: "Seasonal Influenza Vaccine (Fluarix Tetra) booster due",
      assignedDoctor: "Dr. Anoja Senanayake"
    },
    {
      id: "rec-4",
      patientId: "9942-LK",
      patientName: "Fatima Zahra",
      patientPhone: "+94 77 982 1100",
      patientEmail: "fatima.zahra@email.lk",
      category: "Cervical Screening",
      urgency: "MEDIUM",
      dueDate: "2026-09-15",
      status: "DUE",
      notes: "National Cervical Screening Program (CST) 5-yearly routine interval",
      assignedDoctor: "Dr. Anoja Senanayake"
    },
    {
      id: "rec-5",
      patientId: "1028-LK",
      patientName: "Sunil Jayawardena",
      patientPhone: "+94 71 345 8899",
      patientEmail: "sunil.j@email.lk",
      category: "Care Plan Review",
      urgency: "MEDIUM",
      dueDate: "2026-09-30",
      status: "DUE",
      notes: "Chronic Disease GPMP (Item 721) and Team Care Arrangement (Item 723) 6-month review",
      assignedDoctor: "Dr. Priyantha Silva"
    }
  ],
  auditLogs: [],
  retentionPolicies: [],
};

function isFakeSuwasiriBarcodeFile(p: any): boolean {
  return /dynamically compiled|secure id:|synced via suwasiri mobile app index/i.test(String(p?.notes || ""));
}

// Help load/save the store with automatic forward migration safeguards
function getStore() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STATE, null, 2));
    return INITIAL_STATE;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);
    let mutated = false;

    // Drop hashed dummy Unique Health ID files (wrong names like Ruwan for Chamidu’s ID).
    if (Array.isArray(data.patients)) {
      const live = data.patients.filter((p: any) => !isFakeSuwasiriBarcodeFile(p));
      if (live.length !== data.patients.length) {
        data.patients = live;
        mutated = true;
      }
    }
    if (!data.drugs) {
      data.drugs = INITIAL_STATE.drugs;
      mutated = true;
    }
    if (!data.notifications) {
      data.notifications = INITIAL_STATE.notifications;
      mutated = true;
    }
    if (!data.clinicMessages) {
      data.clinicMessages = INITIAL_STATE.clinicMessages;
      mutated = true;
    }
    if (!data.labOrders) {
      data.labOrders = INITIAL_STATE.labOrders;
      mutated = true;
    }
    if (!data.expenses) {
      data.expenses = INITIAL_STATE.expenses;
      mutated = true;
    }
    if (!data.hospitals) {
      data.hospitals = DEFAULT_HOSPITALS;
      mutated = true;
    }
    if (!data.branches) {
      data.branches = DEFAULT_BRANCHES;
      mutated = true;
    }
    if (!data.roles) {
      data.roles = DEFAULT_ROLES;
      mutated = true;
    }
    if (!data.staffUsers) {
      data.staffUsers = DEFAULT_STAFF_USERS;
      mutated = true;
    } else {
      const ownerEmail = "chamidukausha@gmail.com";
      const idx = data.staffUsers.findIndex((u: any) => String(u.email || "").toLowerCase() === ownerEmail);
      if (idx < 0) {
        data.staffUsers.unshift({
          id: USER_PLATFORM_CHAMIDU,
          name: "Chamidu Kausha",
          email: ownerEmail,
          platformRole: "platform_super_admin",
        });
        mutated = true;
      } else if (data.staffUsers[idx].platformRole !== "platform_super_admin") {
        data.staffUsers[idx].platformRole = "platform_super_admin";
        mutated = true;
      }
    }
    if (!data.memberships) {
      data.memberships = DEFAULT_MEMBERSHIPS;
      mutated = true;
    }
    if (!data.staffDirectory) {
      data.staffDirectory = DEFAULT_STAFF_DIRECTORY;
      mutated = true;
    }
    if (!Array.isArray(data.feeSchedule) || data.feeSchedule.length === 0) {
      data.feeSchedule = DEFAULT_FEE_SCHEDULE;
      mutated = true;
    } else {
      const have = new Set(
        (data.feeSchedule as any[])
          .map((f) => String(f.suwasiriService || ""))
          .filter(Boolean)
      );
      for (const item of DEFAULT_FEE_SCHEDULE) {
        if (item.suwasiriService && !have.has(item.suwasiriService)) {
          data.feeSchedule.push(item);
          mutated = true;
        }
      }
      const rx = (data.feeSchedule as any[]).find(
        (f: any) => f.id === "fee-rx" || f.suwasiriService === "repeat_prescription"
      );
      if (rx && Number(rx.privateFee) === 800) {
        rx.privateFee = 1500;
        rx.mbsScheduleFee = 1500;
        rx.gapFee = 1500;
        mutated = true;
      }
    }
    if (!Array.isArray(data.recalls)) {
      data.recalls = INITIAL_STATE.recalls;
      mutated = true;
    }
    if (!Array.isArray(data.auditLogs)) {
      data.auditLogs = [];
      mutated = true;
    }
    if (!Array.isArray(data.retentionPolicies)) {
      data.retentionPolicies = [];
      mutated = true;
    }
    if (Array.isArray(data.staffDirectory)) {
      const silva = data.staffDirectory.find((s: any) => s.id === "staff-1" || s.email === "dr.silva@primecare.lk");
      if (silva && !silva.rosterHours) {
        silva.roster = { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: true, sunday: true };
        silva.rosterHours = {
          monday: { start: "16:00", end: "18:00" },
          wednesday: { start: "16:00", end: "18:00" },
          friday: { start: "16:00", end: "18:00" },
          saturday: { start: "09:00", end: "13:00" },
          sunday: { start: "09:00", end: "13:00" },
        };
        mutated = true;
      }
    }
    if (!data.clinicCalendarSeedAug2026) {
      if (!Array.isArray(data.appointments)) data.appointments = [];
      const byId = new Map(data.appointments.map((a: any) => [a.id, a]));
      for (const seed of INITIAL_STATE.appointments) {
        const existing = byId.get(seed.id);
        if (!existing) {
          data.appointments.push(seed);
        } else if (existing.date === "2026-06-12" || !existing.date) {
          existing.date = seed.date;
          existing.time = seed.time;
          existing.reason = existing.reason || seed.reason;
          existing.type = existing.type || seed.type;
          existing.doctorName = existing.doctorName || seed.doctorName;
        }
      }
      data.clinicCalendarSeedAug2026 = true;
      mutated = true;
    }
    if (!data.patients.some((p: any) => p.id === SOUTHERN_DEMO_PATIENT.id)) {
      data.patients.push(SOUTHERN_DEMO_PATIENT);
      mutated = true;
    }
    if (!data.sampleCollections) {
      data.sampleCollections = [
        {
          id: "SC-001",
          patientId: "9942-LK",
          patientName: "Fatima Zahra",
          sampleCategory: "Blood",
          status: "COLLECTED",
          collectedTime: "2026-06-15 08:30 AM",
          labName: "LankaLab - Colombo 03",
          lankaLabSyncStatus: "SYNCED",
          lankaLabLedgerKey: "LKLAB-SMP-7A9B1D"
        },
        {
          id: "SC-002",
          patientId: "8821-LK",
          patientName: "Arjuna Perera",
          sampleCategory: "Both Blood & Urinal",
          status: "PENDING"
        }
      ];
      mutated = true;
    }
    if (!data.patientAccessRequests) {
      data.patientAccessRequests = [];
      mutated = true;
    }

    // Patient card migration check
    data.patients = data.patients.map((p: any, idx: number) => {
      let patientChanged = false;
      const initialPat = INITIAL_STATE.patients[idx] || INITIAL_STATE.patients[0];
      
      if (!p.medicalHistory) {
        p.medicalHistory = initialPat.medicalHistory || ["No systemic chronic conditions declared"];
        patientChanged = true;
      }
      if (!p.vaccineRecords) {
        p.vaccineRecords = initialPat.vaccineRecords || [];
        patientChanged = true;
      }
      if (!p.labResults) {
        p.labResults = initialPat.labResults || [];
        patientChanged = true;
      }
      const unreadMerge = mergeUnreadPathologySamples(p.labResults, p.id);
      if (unreadMerge.changed) {
        p.labResults = unreadMerge.labs;
        patientChanged = true;
      }
      if (!p.prescriptionsList) {
        p.prescriptionsList = initialPat.prescriptionsList || [];
        patientChanged = true;
      }
      if (!p.medicalCertificatesList) {
        if (p.id === "8821-LK") {
          p.medicalCertificatesList = [
            {
              id: "MC-8821-4821",
              date: "2026-05-18",
              diagnosis: "Acute Mechanical Lower Back Strain from logistics warehouse heavy cargo lifting",
              startDate: "2026-05-18",
              endDate: "2026-05-23",
              numDays: 5,
              status: "UNFIT_FOR_WORK",
              doctorName: "Dr. Priyantha Silva",
              doctorRegNo: "SLMC-48291",
              additionalRemarks: "Strict bed rest recommended. Patient is unfit to operate machinery or lift heavy objects.",
              emailStatus: "SENT",
              recipientEmail: "arjuna.perera@gmail.com",
              suwasiriSyncStatus: "SYNCED",
              suwasiriSyncTime: "2026-05-18 10:25 AM",
              lankalabSyncStatus: "SYNCED",
              lankalabSyncTime: "2026-05-18 10:28 AM"
            }
          ];
        } else {
          p.medicalCertificatesList = [];
        }
        patientChanged = true;
      }

      if (!p.hospitalId) {
        p.hospitalId = HOSPITAL_PRIMECARE;
        p.branchId = BRANCH_COLOMBO;
        patientChanged = true;
      }

      if (!p.sampleCollections) {
        p.sampleCollections = [];
        if (p.id === "9942-LK") {
          p.sampleCollections.push({
            id: "SC-001",
            patientId: "9942-LK",
            patientName: "Fatima Zahra",
            sampleCategory: "Blood",
            status: "COLLECTED",
            collectedTime: "2026-06-15 08:30 AM",
            labName: "LankaLab - Colombo 03",
            lankaLabSyncStatus: "SYNCED",
            lankaLabLedgerKey: "LKLAB-SMP-7A9B1D"
          });
        }
        if (p.id === "8821-LK") {
          p.sampleCollections.push({
            id: "SC-002",
            patientId: "8821-LK",
            patientName: "Arjuna Perera",
            sampleCategory: "Both Blood & Urinal",
            status: "PENDING"
          });
        }
        patientChanged = true;
      }

      if (patientChanged) {
        mutated = true;
      }
      return p;
    });

    if (mutated) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (e) {
    console.error("Failed to parse datastore, using default initial state", e);
    return INITIAL_STATE;
  }
}

function saveStore(data: typeof INITIAL_STATE) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// REST Endpoints
app.get("/api/clinical-state", (req, res) => {
  res.json(getStore());
});

// App reset database endpoint for admin/clinical diagnostic
app.post("/api/admin/reset-db", (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STATE, null, 2));
  res.json({ success: true, message: "Database reinitialized successfully", state: INITIAL_STATE });
});

function persistTenancy(store: any) {
  saveStore(store);
  return store;
}

app.put("/api/tenancy/roles", (req, res) => {
  const store = getStore();
  const { hospitalId, roles } = req.body || {};
  if (!hospitalId || !Array.isArray(roles)) {
    return res.status(400).json({ error: "hospitalId and roles[] required" });
  }
  store.roles = [
    ...(store.roles || []).filter((r: any) => r.hospitalId !== hospitalId),
    ...roles,
  ];
  persistTenancy(store);
  res.json({ success: true, roles: store.roles.filter((r: any) => r.hospitalId === hospitalId) });
});

app.post("/api/tenancy/roles", (req, res) => {
  const store = getStore();
  const { hospitalId, name, cloneFromRoleId } = req.body || {};
  if (!hospitalId || !name) {
    return res.status(400).json({ error: "hospitalId and name required" });
  }
  const source = (store.roles || []).find((r: any) => r.id === cloneFromRoleId)
    || (store.roles || []).find((r: any) => r.hospitalId === hospitalId && r.name === "Doctor")
    || cloneHospitalRoles(hospitalId)[1];
  const id = roleIdFor(hospitalId, `${name}-${Date.now()}`);
  const created = {
    ...source,
    id,
    hospitalId,
    name,
    isSystem: false,
    enabled: true,
  };
  store.roles = [...(store.roles || []), created];
  persistTenancy(store);
  res.json({ success: true, role: created });
});

app.delete("/api/tenancy/roles/:id", (req, res) => {
  const store = getStore();
  const role = (store.roles || []).find((r: any) => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: "Role not found" });
  if (role.isSystem) return res.status(400).json({ error: "System template roles cannot be deleted. Disable them instead." });
  const assigned = (store.memberships || []).some((m: any) => m.roleId === role.id && m.active);
  const staffAssigned = (store.staffDirectory || []).some((s: any) => s.roleId === role.id && s.active);
  if (assigned || staffAssigned) {
    return res.status(400).json({ error: "Cannot remove a custom role that still has assigned staff." });
  }
  store.roles = (store.roles || []).filter((r: any) => r.id !== role.id);
  persistTenancy(store);
  res.json({ success: true });
});

app.patch("/api/tenancy/roles/:id", (req, res) => {
  const store = getStore();
  const idx = (store.roles || []).findIndex((r: any) => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Role not found" });
  store.roles[idx] = { ...store.roles[idx], ...req.body, id: store.roles[idx].id, hospitalId: store.roles[idx].hospitalId };
  persistTenancy(store);
  res.json({ success: true, role: store.roles[idx] });
});

app.post("/api/tenancy/branches", (req, res) => {
  const store = getStore();
  const { hospitalId, name, address, phone, rooms } = req.body || {};
  if (!hospitalId || !name) return res.status(400).json({ error: "hospitalId and name required" });
  const branch = {
    id: `branch-${Date.now()}`,
    hospitalId,
    name,
    address: address || "",
    phone: phone || "",
    rooms: Array.isArray(rooms) ? rooms : [],
  };
  store.branches = [...(store.branches || []), branch];
  persistTenancy(store);
  res.json({ success: true, branch });
});

app.patch("/api/tenancy/branches/:id", (req, res) => {
  const store = getStore();
  const idx = (store.branches || []).findIndex((b: any) => b.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Branch not found" });
  store.branches[idx] = { ...store.branches[idx], ...req.body, id: store.branches[idx].id, hospitalId: store.branches[idx].hospitalId };
  persistTenancy(store);
  res.json({ success: true, branch: store.branches[idx] });
});

app.delete("/api/tenancy/branches/:id", (req, res) => {
  const store = getStore();
  const branch = (store.branches || []).find((b: any) => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: "Branch not found" });
  store.branches = (store.branches || []).filter((b: any) => b.id !== req.params.id);
  store.memberships = (store.memberships || []).map((m: any) => ({
    ...m,
    branchIds: (m.branchIds || []).filter((id: string) => id !== req.params.id),
  }));
  store.staffDirectory = (store.staffDirectory || []).map((s: any) => ({
    ...s,
    branchIds: (s.branchIds || []).filter((id: string) => id !== req.params.id),
  }));
  persistTenancy(store);
  res.json({ success: true });
});

app.put("/api/tenancy/staff-directory", (req, res) => {
  const store = getStore();
  const { hospitalId, staffDirectory } = req.body || {};
  if (!hospitalId || !Array.isArray(staffDirectory)) {
    return res.status(400).json({ error: "hospitalId and staffDirectory[] required" });
  }
  store.staffDirectory = [
    ...(store.staffDirectory || []).filter((s: any) => s.hospitalId !== hospitalId),
    ...staffDirectory,
  ];
  store.memberships = (store.memberships || []).map((m: any) => {
    const staff = staffDirectory.find((s: any) => s.userId === m.userId && (s.hospitalId || hospitalId) === m.hospitalId);
    if (!staff) return m;
    return {
      ...m,
      branchIds: staff.branchIds || m.branchIds,
      roleId: staff.roleId || m.roleId,
      active: staff.active !== false,
    };
  });
  persistTenancy(store);
  res.json({ success: true, staffDirectory: store.staffDirectory.filter((s: any) => s.hospitalId === hospitalId) });
});

app.put("/api/tenancy/memberships", (req, res) => {
  const store = getStore();
  const { memberships } = req.body || {};
  if (!Array.isArray(memberships)) {
    return res.status(400).json({ error: "memberships[] required" });
  }
  store.memberships = memberships;
  persistTenancy(store);
  res.json({ success: true, memberships: store.memberships });
});

app.post("/api/tenancy/staff", (req, res) => {
  const store = getStore();
  const { hospitalId, name, email, roleName, branchIds, phone, specialty, photoUrl } = req.body || {};
  if (!hospitalId || !name || !email || !roleName) {
    return res.status(400).json({ error: "hospitalId, name, email, and roleName required" });
  }
  const role = (store.roles || []).find((r: any) => r.hospitalId === hospitalId && r.name === roleName);
  if (!role) {
    return res.status(400).json({ error: `Role "${roleName}" not found for this hospital` });
  }
  const hospitalBranches = (store.branches || []).filter((b: any) => b.hospitalId === hospitalId);
  const assigned = Array.isArray(branchIds) && branchIds.length
    ? branchIds
    : hospitalBranches.map((b: any) => b.id);
  const existingUser = (store.staffUsers || []).find(
    (u: any) => String(u.email || "").toLowerCase() === String(email).toLowerCase()
  );
  const userId = existingUser?.id || `user-${Date.now()}`;
  if (!existingUser) {
    store.staffUsers = [...(store.staffUsers || []), { id: userId, name, email, platformRole: null }];
  }
  const membership = {
    id: `mem-${userId}-${hospitalId}-${Date.now()}`,
    userId,
    hospitalId,
    roleId: role.id,
    branchIds: assigned,
    active: true,
  };
  store.memberships = [...(store.memberships || []), membership];
  const staff = {
    id: `staff-${Date.now()}`,
    userId,
    hospitalId,
    roleId: role.id,
    branchIds: assigned,
    name,
    role: roleName,
    specialty: specialty || roleName,
    providerNumber: "PENDING",
    email,
    phone: phone || "",
    assignedRoom: roleName === "Receptionist" ? "Front Desk Reception" : "Consultation Room 1",
    photoUrl: photoUrl || "",
    roster: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
    rosterHours: {
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "17:00" },
    },
    active: true,
  };
  store.staffDirectory = [...(store.staffDirectory || []), staff];
  persistTenancy(store);
  res.json({ success: true, staffUser: store.staffUsers.find((u: any) => u.id === userId), membership, staff });
});

app.patch("/api/tenancy/staff/:id", (req, res) => {
  const store = getStore();
  const staffId = req.params.id;
  const idx = (store.staffDirectory || []).findIndex((s: any) => s.id === staffId);
  if (idx < 0) return res.status(404).json({ error: "Staff not found" });
  const current = store.staffDirectory[idx];
  const { name, email, phone, roleName, specialty, branchIds, photoUrl } = req.body || {};
  let roleId = current.roleId;
  let role = (store.roles || []).find((r: any) => r.id === roleId);
  if (roleName) {
    const found = (store.roles || []).find(
      (r: any) => r.hospitalId === current.hospitalId && r.name === roleName && r.enabled !== false
    );
    if (!found) return res.status(400).json({ error: `Role "${roleName}" not found for this hospital` });
    role = found;
    roleId = found.id;
  }
  const nextStaff = {
    ...current,
    name: name != null ? String(name).trim() : current.name,
    email: email != null ? String(email).trim() : current.email,
    phone: phone != null ? String(phone) : current.phone,
    role: role?.name || current.role,
    roleId,
    specialty: specialty != null ? specialty : current.specialty,
    branchIds: Array.isArray(branchIds) ? branchIds : current.branchIds,
    photoUrl: photoUrl != null ? photoUrl : current.photoUrl,
  };
  store.staffDirectory[idx] = nextStaff;
  if (current.userId) {
    store.staffUsers = (store.staffUsers || []).map((u: any) =>
      u.id === current.userId
        ? { ...u, name: nextStaff.name, email: nextStaff.email }
        : u
    );
    store.memberships = (store.memberships || []).map((m: any) =>
      m.userId === current.userId && m.hospitalId === current.hospitalId
        ? { ...m, roleId, branchIds: nextStaff.branchIds, active: true }
        : m
    );
  }
  persistTenancy(store);
  res.json({
    success: true,
    staff: nextStaff,
    staffDirectory: store.staffDirectory,
    staffUsers: store.staffUsers,
    memberships: store.memberships,
  });
});

app.delete("/api/tenancy/staff/:id", (req, res) => {
  const store = getStore();
  const staffId = req.params.id;
  const staff = (store.staffDirectory || []).find((s: any) => s.id === staffId);
  if (!staff) return res.status(404).json({ error: "Staff not found" });
  store.staffDirectory = (store.staffDirectory || []).filter((s: any) => s.id !== staffId);
  store.memberships = (store.memberships || []).map((m: any) =>
    m.userId === staff.userId && m.hospitalId === staff.hospitalId
      ? { ...m, active: false }
      : m
  );
  persistTenancy(store);
  res.json({ success: true, staffDirectory: store.staffDirectory, memberships: store.memberships });
});

app.put("/api/fee-schedule", (req, res) => {
  const store = getStore();
  const { feeSchedule, hospitalId } = req.body || {};
  if (!Array.isArray(feeSchedule)) {
    return res.status(400).json({ error: "feeSchedule[] required" });
  }
  const mapped = feeSchedule.map((item: any) => ({
    ...item,
    bulkBillable: false,
    gapFee: Number(item.privateFee || 0) - Number(item.mbsBenefit || 0),
    suwasiriService: item.suwasiriService || "",
  }));
  store.feeSchedule = mapped;
  if (hospitalId) {
    store.feeSchedules = store.feeSchedules || {};
    store.feeSchedules[hospitalId] = mapped;
  }
  saveStore(store);
  res.json({ success: true, feeSchedule: mapped });
});

app.put("/api/recalls", (req, res) => {
  const store = getStore();
  const { recalls } = req.body || {};
  if (!Array.isArray(recalls)) {
    return res.status(400).json({ error: "recalls[] required" });
  }
  store.recalls = recalls;
  saveStore(store);
  res.json({ success: true, recalls: store.recalls });
});

app.post("/api/audit-logs", (req, res) => {
  const store = getStore();
  const entry = req.body || {};
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = entry.timestamp || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const log = {
    id: entry.id || `log-${Date.now()}`,
    timestamp,
    user: entry.user || "Staff",
    role: entry.role || "Doctor",
    action: entry.action || "Clinical activity",
    category: entry.category || "PATIENT_RECORD",
    patientId: entry.patientId,
    patientName: entry.patientName,
    details: entry.details || "",
    ipAddress: entry.ipAddress || "clinic-lan",
  };
  store.auditLogs = [log, ...(store.auditLogs || [])].slice(0, 5000);
  saveStore(store);
  res.json({ success: true, log, auditLogs: store.auditLogs });
});

app.get("/api/retention-policies", (req, res) => {
  const store = getStore();
  res.json({ policies: store.retentionPolicies || [] });
});

app.post("/api/retention-policies", (req, res) => {
  const store = getStore();
  const { title, body, createdBy } = req.body || {};
  if (!String(title || "").trim() || !String(body || "").trim()) {
    return res.status(400).json({ error: "title and body required" });
  }
  const policy = {
    id: `ret-${Date.now()}`,
    title: String(title).trim(),
    body: String(body).trim(),
    createdAt: new Date().toISOString(),
    createdBy: createdBy || "Super Admin",
  };
  store.retentionPolicies = [policy, ...(store.retentionPolicies || [])];
  saveStore(store);
  res.json({ success: true, policy, policies: store.retentionPolicies });
});

app.patch("/api/tenancy/hospitals/:id", (req, res) => {
  const store = getStore();
  const idx = (store.hospitals || []).findIndex((h: any) => h.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Hospital not found" });
  store.hospitals[idx] = { ...store.hospitals[idx], ...req.body, id: store.hospitals[idx].id };
  persistTenancy(store);
  res.json({ success: true, hospital: store.hospitals[idx] });
});

app.post("/api/tenancy/hospitals", (req, res) => {
  const store = getStore();
  const { name, district, logoUrl, copyRolesFrom } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const id = `hosp-${Date.now()}`;
  const region = String(district || "Colombo").trim() || "Colombo";
  const hospital = { id, name, status: "ACTIVE", district: region, logoUrl: logoUrl || "" };
  const branch = {
    id: `branch-${Date.now()}`,
    hospitalId: id,
    name,
    address: `${region}, Sri Lanka`,
    phone: "",
    rooms: ["Consultation Room 1", "Front Desk Reception"],
  };
  store.hospitals = [...(store.hospitals || []), hospital];
  store.branches = [...(store.branches || []), branch];
  const cloned = cloneHospitalRoles(id);
  const sourceId = String(copyRolesFrom || "").trim();
  const extras = sourceId
    ? (store.roles || [])
        .filter((r: any) => r.hospitalId === sourceId && r.enabled !== false && !r.isSystem)
        .map((r: any, i: number) => ({
          ...r,
          id: roleIdFor(id, `${r.name}-${Date.now()}-${i}`),
          hospitalId: id,
          isSystem: false,
          enabled: true,
        }))
    : [];
  store.roles = [...(store.roles || []), ...cloned, ...extras];
  persistTenancy(store);
  res.json({
    success: true,
    hospital,
    branch,
    roles: store.roles.filter((r: any) => r.hospitalId === id),
  });
});

// Create Appointment
app.post("/api/appointments", (req, res) => {
  const store = getStore();
  const { patientId, time, reason, status, date } = req.body;
  
  if (!patientId || !time || !reason) {
    return res.status(400).json({ error: "Missing patientId, time or reason" });
  }

  const newApt = {
    id: req.body.id || `apt-${Date.now()}`,
    patientId,
    time,
    reason,
    status: status || "SCHEDULED",
    date: date || new Date().toISOString().split("T")[0],
    doctorName: req.body.doctorName,
    doctorId: req.body.doctorId || req.body.doctorStaffId,
    type: req.body.type,
    isTelehealth: !!req.body.isTelehealth,
    consultMode: req.body.consultMode || (req.body.isTelehealth ? "video" : "clinic"),
    patientName: req.body.patientName,
    patientEmail: req.body.patientEmail,
    source: req.body.source || "gp_care",
    paymentMethod: req.body.paymentMethod || "Pay at clinic",
    hospitalId: req.body.hospitalId,
    branchId: req.body.branchId,
    clinicName: req.body.clinicName,
  };

  store.appointments.push(newApt);
  
  // also add medical billing entry as pending
  const pat = store.patients.find(p => p.id === patientId);
  const patName = pat ? pat.name : "Unknown Patient";
  store.billing.push({
    id: `bill-${Date.now()}`,
    patientName: patName,
    amount: 1500,
    service: `GP Clinical Consult - ${reason}`,
    status: req.body.paymentMethod && req.body.paymentMethod !== "Pay at clinic" ? "PAID" : "PENDING",
    date: newApt.date,
    paymentMethod: req.body.paymentMethod || "Pay at clinic",
  });

  saveStore(store);
  res.status(201).json({ appointment: newApt, state: store });
});

// Update Appointment Status
app.patch("/api/appointments/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { status } = req.body;

  const aptIndex = store.appointments.findIndex(a => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  store.appointments[aptIndex].status = status;
  saveStore(store);
  res.json({ appointment: store.appointments[aptIndex], state: store });
});

// Reorder All Appointments (Change Patient Queue Places)
app.put("/api/appointments/reorder", (req, res) => {
  const store = getStore();
  const { appointments } = req.body;

  if (!appointments || !Array.isArray(appointments)) {
    return res.status(400).json({ error: "appointments array is required" });
  }

  store.appointments = appointments;
  saveStore(store);
  res.json({ success: true, appointments: store.appointments, state: store });
});

// Persist lobby queue places without replacing the full appointment list
app.put("/api/appointments/queue-places", (req, res) => {
  const store = getStore();
  const { places } = req.body;
  if (!Array.isArray(places)) {
    return res.status(400).json({ error: "places array is required" });
  }
  const placeById = new Map(
    places
      .filter((p) => p && typeof p.id === "string" && typeof p.queuePlace === "number")
      .map((p) => [p.id, p.queuePlace])
  );
  store.appointments = store.appointments.map((a) => {
    const queuePlace = placeById.get(a.id);
    return queuePlace != null ? { ...a, queuePlace } : a;
  });
  saveStore(store);
  res.json({ success: true, appointments: store.appointments, state: store });
});

// Move specific appointment up, down or to new index
app.patch("/api/appointments/:id/move", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { direction, targetIndex } = req.body;

  const currentIndex = store.appointments.findIndex(a => a.id === id);
  if (currentIndex === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  const [movedApt] = store.appointments.splice(currentIndex, 1);

  if (targetIndex !== undefined && typeof targetIndex === "number") {
    const safeTarget = Math.max(0, Math.min(store.appointments.length, targetIndex));
    store.appointments.splice(safeTarget, 0, movedApt);
  } else if (direction === "up") {
    const newIdx = Math.max(0, currentIndex - 1);
    store.appointments.splice(newIdx, 0, movedApt);
  } else if (direction === "down") {
    const newIdx = Math.min(store.appointments.length, currentIndex + 1);
    store.appointments.splice(newIdx, 0, movedApt);
  } else if (direction === "top") {
    store.appointments.unshift(movedApt);
  } else {
    store.appointments.splice(currentIndex, 0, movedApt);
  }

  saveStore(store);
  res.json({ success: true, appointments: store.appointments, state: store });
});

function mergeKeyedRows(existing: any[] | undefined, incoming: any[] | undefined, keyFn: (row: any) => string) {
  const map = new Map<string, any>();
  for (const row of existing || []) {
    if (!row) continue;
    map.set(keyFn(row), row);
  }
  for (const row of incoming || []) {
    if (!row) continue;
    map.set(keyFn(row), row);
  }
  return Array.from(map.values());
}

function isPlaceholderClinicName(name?: string): boolean {
  const n = String(name || "").trim().toLowerCase();
  return !n || n === "patient" || n === "suwasiri patient" || n === "unknown" || n === "unknown patient";
}

function applySuwasiriDemographics(target: any, body: any) {
  const {
    name, age, gender, bloodType, allergies, phone, email, notes, dateOfBirth, nic, address,
    emergencyContactName, emergencyContactPhone, suwasiriBarcode, medicalHistory, activeMedications,
    heightCm, weightKg, labResults, vaccineRecords, medicareNumber, ihiNumber,
  } = body;
  if (name && !isPlaceholderClinicName(name)) {
    target.name = name;
  }
  if (age !== undefined && age !== null && age !== "") target.age = parseInt(String(age), 10) || 0;
  if (gender) target.gender = gender;
  if (bloodType) target.bloodType = bloodType;
  if (allergies) target.allergies = allergies;
  if (phone) target.phone = phone;
  if (email) target.email = email;
  if (notes !== undefined) target.notes = notes;
  if (dateOfBirth) target.dateOfBirth = dateOfBirth;
  if (nic) {
    target.nic = nic;
    target.ihiNumber = nic;
    target.medicareNumber = medicareNumber || nic;
  } else if (medicareNumber) {
    target.medicareNumber = medicareNumber;
  }
  if (ihiNumber) target.ihiNumber = ihiNumber;
  if (address) target.address = address;
  if (emergencyContactName) target.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone) target.emergencyContactPhone = emergencyContactPhone;
  if (suwasiriBarcode) target.suwasiriBarcode = suwasiriBarcode;
  if (heightCm !== undefined) target.heightCm = Number(heightCm);
  if (weightKg !== undefined) target.weightKg = Number(weightKg);
  if (medicalHistory) {
    target.medicalHistory = Array.isArray(medicalHistory)
      ? medicalHistory
      : String(medicalHistory).split(",").map((s: string) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(activeMedications)) target.activeMedications = activeMedications;
  if (Array.isArray(labResults)) {
    target.labResults = mergeKeyedRows(target.labResults, labResults, (row) =>
      String(row.id || `${row.testName}|${row.date}`)
    );
  }
  if (Array.isArray(vaccineRecords)) {
    const cleaned = (target.vaccineRecords || []).filter((row: any) => row?.batchNumber !== "COV-RECG-77");
    target.vaccineRecords = mergeKeyedRows(cleaned, vaccineRecords, (row) =>
      `${row.vaccineName}|${row.date}|${row.dose}`
    );
  }
}

function isDummySuwasiriImport(p: any): boolean {
  return isFakeSuwasiriBarcodeFile(p);
}

function absorbClinicFile(target: any, source: any) {
  if (!source || source.id === target.id) return;
  const concat = (a: any[] | undefined, b: any[] | undefined) => [...(a || []), ...(b || [])];
  target.history = concat(target.history, source.history);
  target.prescriptionsList = concat(target.prescriptionsList, source.prescriptionsList);
  target.medicalCertificatesList = concat(target.medicalCertificatesList, source.medicalCertificatesList);
  target.sampleCollections = concat(target.sampleCollections, source.sampleCollections);
  target.clinicalDocuments = concat(target.clinicalDocuments, source.clinicalDocuments);
  target.imagingRecords = concat(target.imagingRecords, source.imagingRecords);
  target.referralsList = concat(target.referralsList, source.referralsList);
  if (!isDummySuwasiriImport(source)) {
    target.labResults = mergeKeyedRows(target.labResults, source.labResults, (row) =>
      String(row?.id || `${row?.testName}|${row?.date}`)
    );
    target.vaccineRecords = mergeKeyedRows(
      (target.vaccineRecords || []).filter((row: any) => row?.batchNumber !== "COV-RECG-77"),
      source.vaccineRecords,
      (row) => `${row?.vaccineName}|${row?.date}|${row?.dose}`
    );
  }
}

function foldDuplicateSuwasiriFiles(store: any, canonical: any) {
  const barcode = String(canonical.suwasiriBarcode || "").trim().toUpperCase();
  const kept: any[] = [];
  for (const p of store.patients || []) {
    if (!p || p.id === canonical.id) continue;
    const sameId = String(p.id || "") === String(canonical.id || "");
    const sameBarcode = barcode && String(p.suwasiriBarcode || "").trim().toUpperCase() === barcode;
    // Do NOT merge household members who share an email or NIC (Manel vs Kalyani).
    if (!sameId && !sameBarcode) {
      kept.push(p);
      continue;
    }
    if (!isDummySuwasiriImport(p)) absorbClinicFile(canonical, p);
  }
  store.patients = [canonical, ...kept];
}

// Create/Register Patients Details
app.post("/api/patients", (req, res) => {
  const store = getStore();
  const { name, age, medicalCenter, hospitalId, branchId, id: requestedId, suwasiriBarcode } = req.body;

  if (!name || isPlaceholderClinicName(name)) {
    res.status(400).json({ error: "A real patient name is required. Look up the Unique Health ID again so the Suwasiri file shows the person’s name, not “Patient”." });
    return;
  }

  const hid = hospitalId || HOSPITAL_PRIMECARE;
  const incomingSynced = Array.isArray(req.body.syncedHospitalIds)
    ? req.body.syncedHospitalIds.map((x: unknown) => String(x)).filter(Boolean)
    : [];
  if (requestedId) {
    const existing = store.patients.find((p: { id: string }) => p.id === requestedId);
    if (existing) {
      const synced = new Set(existing.syncedHospitalIds || [existing.hospitalId || HOSPITAL_PRIMECARE]);
      synced.add(hid);
      incomingSynced.forEach((id: string) => synced.add(id));
      existing.syncedHospitalIds = Array.from(synced);
      applySuwasiriDemographics(existing, req.body);
      if (medicalCenter && hid === (existing.hospitalId || HOSPITAL_PRIMECARE)) {
        existing.medicalCenter = medicalCenter;
      }
      existing.hospitalId = existing.hospitalId || hid;
      existing.branchId = existing.branchId || branchId || BRANCH_COLOMBO;
      if (req.body.accessStatus) existing.accessStatus = req.body.accessStatus;
      foldDuplicateSuwasiriFiles(store, existing);
      saveStore(store);
      return res.status(200).json({ patient: existing, state: store, isNewSync: false });
    }
  }

  const pId = requestedId || `${Math.floor(1000 + Math.random() * 9000)}-LK`;
  const parsedAge = age !== undefined && age !== null && age !== "" ? parseInt(String(age), 10) : 0;

  const newPatient: any = {
    id: pId,
    name,
    age: Number.isFinite(parsedAge) ? parsedAge : 0,
    gender: "Not recorded",
    bloodType: "Not recorded",
    allergies: "None declared",
    phone: "",
    email: "",
    image: "",
    notes: "",
    history: [],
    activeMedications: [],
    medicalHistory: [],
    vaccineRecords: [],
    labResults: [],
    prescriptionsList: [],
    medicalCertificatesList: [],
    medicalCenter: medicalCenter || "Colombo Central Clinic",
    hospitalId: hid,
    branchId: branchId || BRANCH_COLOMBO,
    suwasiriBarcode: suwasiriBarcode || undefined,
    syncedHospitalIds: incomingSynced.length ? Array.from(new Set([hid, ...incomingSynced])) : [hid],
    accessStatus: req.body.accessStatus || "ACTIVE"
  };
  applySuwasiriDemographics(newPatient, req.body);

  const barcode = String(newPatient.suwasiriBarcode || "").trim().toUpperCase();
  const sameFile = store.patients.find((p: any) => {
    if (!p || isDummySuwasiriImport(p)) return false;
    if (p.id && p.id === newPatient.id) return true;
    if (barcode && String(p.suwasiriBarcode || "").trim().toUpperCase() === barcode) return true;
    return false;
  });
  if (sameFile && sameFile.id !== newPatient.id) {
    const synced = new Set(sameFile.syncedHospitalIds || [sameFile.hospitalId || HOSPITAL_PRIMECARE]);
    synced.add(hid);
    incomingSynced.forEach((id: string) => synced.add(id));
    sameFile.syncedHospitalIds = Array.from(synced);
    applySuwasiriDemographics(sameFile, req.body);
    sameFile.hospitalId = sameFile.hospitalId || hid;
    sameFile.branchId = sameFile.branchId || branchId || BRANCH_COLOMBO;
    foldDuplicateSuwasiriFiles(store, sameFile);
    saveStore(store);
    return res.status(200).json({ patient: sameFile, state: store, isNewSync: false });
  }

  store.patients.unshift(newPatient);
  foldDuplicateSuwasiriFiles(store, newPatient);
  saveStore(store);
  res.status(201).json({ patient: newPatient, state: store });
});

// ONLINE PATIENT BOOKING & AUTO-REGISTRATION PORTAL
app.post("/api/online-booking", (req, res) => {
  const store = getStore();
  const { name, age, dateOfBirth, gender, phone, email, medicalCenter, date, time, reason } = req.body;

  let calculatedAge = parseInt(age);
  if (dateOfBirth && (!calculatedAge || isNaN(calculatedAge))) {
    const dob = new Date(dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      calculatedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        calculatedAge--;
      }
    }
  }

  if (!name || (!calculatedAge && !dateOfBirth) || !phone || !email || !medicalCenter) {
    return res.status(400).json({ error: "Missing required registration & booking fields" });
  }

  // Find or create patient
  let pat = store.patients.find(p => p.email.toLowerCase() === email.toLowerCase() || p.phone === phone);
  let isNew = false;
  
  if (!pat) {
    isNew = true;
    const pId = `${Math.floor(1000 + Math.random() * 9000)}-LK`;
    pat = {
      id: pId,
      name,
      age: calculatedAge || 30,
      dateOfBirth: dateOfBirth || "",
      gender: gender || "Male",
      bloodType: "O+",
      allergies: "None declared",
      phone,
      email,
      image: "",
      notes: "Auto-registered via Online Booking Portal.",
      history: [],
      activeMedications: [],
      medicalHistory: ["Auto-registered via Online Booking Portal"],
      vaccineRecords: [
        { vaccineName: "COVID-19 Vaccine (Standard)", date: "2021-10-10", dose: "Completed Sequence", batchNumber: "COV-RECG-77", status: "Completed" }
      ],
      labResults: [],
      prescriptionsList: [],
      medicalCertificatesList: [],
      medicalCenter: medicalCenter
    };
    store.patients.unshift(pat);
  } else {
    // update demographics if provided
    pat.name = name;
    pat.age = calculatedAge || pat.age;
    if (dateOfBirth) pat.dateOfBirth = dateOfBirth;
    pat.gender = gender || pat.gender;
    pat.medicalCenter = medicalCenter;
  }

  // Create the slot appointment
  const newApt = {
    id: `apt-${Date.now()}`,
    patientId: pat.id,
    time: time || "11:30 AM",
    reason: reason || "Online Scheduled Consultation",
    status: "SCHEDULED" as const,
    date: date || new Date().toISOString().split("T")[0]
  };
  store.appointments.push(newApt);

  // Auto-raise medical billing
  store.billing.push({
    id: `bill-${Date.now()}`,
    patientName: pat.name,
    amount: 1500,
    service: `GP Consultation (${medicalCenter})`,
    status: "PENDING",
    date: newApt.date
  });

  // BOT message to clinic secure chat layout
  store.clinicMessages.push({
    id: `msg-${Date.now()}`,
    sender: "Central Online Sync Integration",
    senderRole: "System BOT",
    text: `🎉 New Online Booking received! Patient "${pat.name}" (ID: ${pat.id}) registered at "${medicalCenter}" for slot on ${newApt.date} at ${newApt.time}. Clinical Reason: "${newApt.reason}".`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.status(201).json({ success: true, patient: pat, appointment: newApt, state: store });
});

// Unique Health ID lookup is live Firestore from Patient Clinical Records — never invent a dummy file.
app.get("/api/suwasiri/barcode/:barcodeCode", (req, res) => {
  const store = getStore();
  const rawBarcode = String(req.params.barcodeCode || "").trim().toUpperCase();
  if (!rawBarcode) {
    return res.status(400).json({ error: "No Unique Health ID specified." });
  }
  const existingPatient = store.patients.find((p: any) =>
    !isFakeSuwasiriBarcodeFile(p) &&
    ((p.suwasiriBarcode && String(p.suwasiriBarcode).toUpperCase() === rawBarcode) ||
      String(p.id).toUpperCase() === rawBarcode)
  );
  if (existingPatient) {
    return res.json({ patient: existingPatient, isNewSync: false, state: store });
  }
  return res.status(404).json({
    error: "No clinic file for that Unique Health ID. Enter it under Patient Clinical Records and Sync to Portal to load the live Suwasiri patient.",
  });
});

// Update Patient File & Add History Log (Save consultation / e-prescription / vaccination)
app.patch("/api/patients/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { 
    name,
    age,
    gender,
    bloodType,
    phone,
    email,
    medicalCenter,
    notes,
    dateOfBirth,
    nic,
    address,
    emergencyContactName,
    emergencyContactPhone,
    activeMedications, 
    allergies, 
    historyEntry,
    medicalHistory,
    newVaccineRecord,
    newLabResult,
    newPrescriptionRecord,
    reviewLabResultId,
    reviewedBy,
    markLabCritical,
    heightCm,
    weightKg,
    lastSystolicBp,
    lastDiastolicBp,
    waistCm,
    clinicalCalculations,
    observationsHistory,
    diagnosesList,
    imagingRecords,
    referralsList,
    labResults,
    vaccineRecords,
    carePlansList,
    prescriptionsList,
    history,
    clinicalDocuments,
    medicalCertificatesList
  } = req.body;

  const patIndex = store.patients.findIndex(p => p.id === id);
  if (patIndex === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const pat = store.patients[patIndex];
  
  // Demographics updating
  if (name !== undefined) pat.name = name;
  if (age !== undefined) pat.age = parseInt(String(age));
  if (gender !== undefined) pat.gender = gender;
  if (bloodType !== undefined) pat.bloodType = bloodType;
  if (phone !== undefined) pat.phone = phone;
  if (email !== undefined) pat.email = email;
  if (dateOfBirth !== undefined) pat.dateOfBirth = dateOfBirth;
  if (nic !== undefined) {
    pat.nic = nic;
    pat.ihiNumber = nic;
    if (!pat.medicareNumber) pat.medicareNumber = nic;
  }
  if (address !== undefined) pat.address = address;
  if (emergencyContactName !== undefined) pat.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone !== undefined) pat.emergencyContactPhone = emergencyContactPhone;
  if (medicalCenter !== undefined) pat.medicalCenter = medicalCenter;

  if (notes !== undefined) pat.notes = notes;
  if (activeMedications !== undefined) pat.activeMedications = activeMedications;
  if (allergies !== undefined) pat.allergies = allergies;
  
  if (medicalHistory !== undefined) {
    if (Array.isArray(medicalHistory)) {
      pat.medicalHistory = medicalHistory;
    } else {
      pat.medicalHistory = String(medicalHistory).split(",").map(s => s.trim()).filter(Boolean);
    }
  }

  if (heightCm !== undefined) pat.heightCm = Number(heightCm);
  if (weightKg !== undefined) pat.weightKg = Number(weightKg);
  if (lastSystolicBp !== undefined) pat.lastSystolicBp = Number(lastSystolicBp);
  if (lastDiastolicBp !== undefined) pat.lastDiastolicBp = Number(lastDiastolicBp);
  if (waistCm !== undefined) pat.waistCm = Number(waistCm);
  if (Array.isArray(clinicalCalculations)) pat.clinicalCalculations = clinicalCalculations;
  if (Array.isArray(observationsHistory)) pat.observationsHistory = observationsHistory;
  if (Array.isArray(diagnosesList)) pat.diagnosesList = diagnosesList;
  if (Array.isArray(imagingRecords)) pat.imagingRecords = imagingRecords;
  if (Array.isArray(referralsList)) pat.referralsList = referralsList;
  if (Array.isArray(labResults)) pat.labResults = labResults;
  if (Array.isArray(vaccineRecords)) pat.vaccineRecords = vaccineRecords;
  if (Array.isArray(carePlansList)) pat.carePlansList = carePlansList;
  if (Array.isArray(prescriptionsList)) pat.prescriptionsList = prescriptionsList;
  if (Array.isArray(history)) pat.history = history;
  if (Array.isArray(clinicalDocuments)) pat.clinicalDocuments = clinicalDocuments;
  if (Array.isArray(medicalCertificatesList)) pat.medicalCertificatesList = medicalCertificatesList;

  if (newVaccineRecord) {
    pat.vaccineRecords.push(newVaccineRecord);
  }

  if (newLabResult) {
    pat.labResults.push(newLabResult);
  }

  if (newPrescriptionRecord) {
    pat.prescriptionsList.unshift(newPrescriptionRecord);
  }

  if (reviewLabResultId && Array.isArray(pat.labResults)) {
    const lab = pat.labResults.find((lr: any) => lr.id === reviewLabResultId);
    if (lab) {
      lab.doctorReviewed = true;
      lab.reviewedBy = reviewedBy || "GP";
      lab.reviewedDate = new Date().toISOString().split("T")[0];
      if (markLabCritical) {
        lab.status = "CRITICAL";
        lab.abnormalFlag = true;
        lab.criticalAlert = true;
      }
    }
  }

  if (historyEntry) {
    const sumDate = new Date().toISOString().split("T")[0];
    const medHistoryString = `[${sumDate}] Consultation Visit: ${historyEntry.reason || "Clinical consult"} | Notes: ${historyEntry.notes}`;
    if (!pat.medicalHistory) {
      pat.medicalHistory = [];
    }
    pat.medicalHistory.push(medHistoryString);

    if (!Array.isArray(pat.history)) pat.history = [];
    if (!Array.isArray(history)) {
      pat.history.unshift({
        date: sumDate,
        reason: historyEntry.reason || "Clinical consultation",
        doctor: historyEntry.doctor || "Dr. Priyantha Silva",
        notes: historyEntry.notes || "",
        clinicName: historyEntry.clinicName || pat.medicalCenter || "",
        appointmentId: historyEntry.appointmentId,
      });
    }
  }

  saveStore(store);
  res.json({ patient: pat, state: store });
});

// Active Drug Database list CRUD
app.get("/api/drugs", (req, res) => {
  const store = getStore();
  res.json(store.drugs);
});

app.post("/api/drugs", (req, res) => {
  const store = getStore();
  const { drugName } = req.body;
  if (!drugName || typeof drugName !== "string" || !drugName.trim()) {
    return res.status(400).json({ error: "Invalid drug designation" });
  }
  
  const trimmed = drugName.trim();
  if (!store.drugs.includes(trimmed)) {
    store.drugs.push(trimmed);
  }
  saveStore(store);
  res.status(201).json({ drugs: store.drugs, success: true });
});

// WhatsApp & SMS Dispatch History Endpoint
app.get("/api/notifications", (req, res) => {
  const store = getStore();
  res.json(store.notifications);
});

app.post("/api/notifications", (req, res) => {
  const store = getStore();
  const { patientName, recipient, transport, templateType, content } = req.body;
  
  if (!patientName || !recipient || !transport || !content) {
    return res.status(400).json({ error: "Missing required dispatch fields" });
  }

  const newLog = {
    id: `notif-${Date.now()}`,
    patientName,
    recipient,
    transport, // "WhatsApp" | "SMS"
    templateType: templateType || "CUSTOM_ALERT",
    content,
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: req.body.status || "DELIVERED",
    read: Boolean(req.body.read),
    sampleId: req.body.sampleId || "",
    testName: req.body.testName || "",
    registeredBy: req.body.registeredBy || ""
  };

  store.notifications.unshift(newLog);
  saveStore(store);
  res.status(201).json({ success: true, notification: newLog, state: store });
});

app.patch("/api/notifications/:id", (req, res) => {
  const store = getStore();
  const item = store.notifications.find((n) => n.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Notification not found" });
  }
  if (req.body.status) item.status = req.body.status;
  if (typeof req.body.read === "boolean") item.read = req.body.read;
  if (req.body.registeredBy) item.registeredBy = req.body.registeredBy;
  saveStore(store);
  res.json({ success: true, notification: item, state: store });
});

// Secure Clinical Chat Logs
app.get("/api/clinical-chat", (req, res) => {
  const store = getStore();
  res.json(store.clinicMessages);
});

app.post("/api/clinical-chat", (req, res) => {
  const store = getStore();
  const { sender, senderRole, text, channel } = req.body;

  if (!sender || !text) {
    return res.status(400).json({ error: "Missing sender name or message text" });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    sender,
    senderRole: senderRole || "Doctor",
    text,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: channel || "#general-clinical"
  };

  store.clinicMessages.push(newMsg);
  saveStore(store);
  res.status(201).json({ success: true, message: newMsg, state: store });
});

// Simulated Lab Request Integrations
app.get("/api/lab-orders", (req, res) => {
  const store = getStore();
  res.json(store.labOrders);
});

app.post("/api/lab-orders", (req, res) => {
  const store = getStore();
  const { patientId, testName, remarks, sampleCategory, orderedBy, patientName: bodyName } = req.body;

  if (!patientId || !testName) {
    return res.status(400).json({ error: "Missing patientId or testName" });
  }

  const pat = store.patients.find(p => p.id === patientId);
  const patientName = String(bodyName || "").trim() || (pat ? pat.name : "");
  if (!patientName) {
    return res.status(400).json({ error: "Pathology orders must name the patient this request belongs to." });
  }

  const newOrder = {
    id: `order-${Date.now()}`,
    patientId,
    patientName,
    testName,
    dateOrdered: new Date().toISOString().split("T")[0],
    status: "LOBBY ORDERED",
    remarks: remarks || "Standard priority panel request.",
    dateCompleted: ""
  };

  store.labOrders.unshift(newOrder);

  if (!store.sampleCollections) store.sampleCollections = [];
  const newSample = {
    id: `SC-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId,
    patientName,
    sampleCategory: sampleCategory || "Blood",
    status: "PENDING",
    collectedTime: "",
    deliveredTime: "",
    deliveryPersonName: "",
    deliveryPersonPhone: "",
    deliveryPersonId: "",
    labName: "",
    lankaLabSyncStatus: "NOT_SYNCED",
    lankaLabLedgerKey: "",
    testName,
    orderedBy: orderedBy || "Doctor",
    registeredBy: ""
  };
  store.sampleCollections.unshift(newSample);
  if (pat) {
    if (!pat.sampleCollections) pat.sampleCollections = [];
    pat.sampleCollections.unshift(newSample);
  }

  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    patientName,
    recipient: "Reception / Sample Dispatch Hub",
    transport: "App Notification",
    templateType: "PATHOLOGY_ORDER",
    content: `Doctor ordered ${testName} for ${patientName}. Open Sample Dispatch Hub to register collection.`,
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "UNREAD",
    read: false,
    sampleId: newSample.id,
    testName,
    registeredBy: ""
  });

  store.clinicMessages.push({
    id: `msg-path-${Date.now()}`,
    sender: "Pathology Hub",
    senderRole: "System",
    text: `New pathology investigation "${testName}" ordered for ${patientName}. Awaiting receptionist registration at Sample Dispatch Hub.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.status(201).json({ order: newOrder, sample: newSample, state: store });
});

// Lab Results processing update simulation trigger
app.patch("/api/lab-orders/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { status, resultVal, remarks } = req.body;

  const orderIndex = store.labOrders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = store.labOrders[orderIndex];
  order.status = status || "COMPLETED";
  order.dateCompleted = new Date().toISOString().split("T")[0];
  
  if (remarks) order.remarks = remarks;

  // If status marked as completed, push lab result outcome to patient's active health results logs automatically!
  if (order.status === "COMPLETED") {
    const patIndex = store.patients.findIndex(p => p.id === order.patientId);
    if (patIndex !== -1) {
      const generatedResult = {
        id: `lab-res-gen-${Date.now()}`,
        testName: order.testName,
        date: order.dateCompleted,
        status: "COMPLETED",
        result: resultVal || "Normal range within standard parameters",
        remarks: remarks || "Completed & certified automatically via local pathology labs."
      };
      
      store.patients[patIndex].labResults.unshift(generatedResult);

      // also append dynamic urgent alert if abnormal potassium, glucose or dengue triggered
      if (String(resultVal).toLowerCase().includes("abnormal") || String(resultVal).toLowerCase().includes("positive")) {
        store.alerts.unshift({
          id: `alert-${Date.now()}`,
          type: "CRITICAL LAB RESULT",
          title: `${order.patientName} - ${order.testName}`,
          timeLabel: "Just now",
          text: `Abnormal level detected: ${resultVal}`,
          severity: "high"
        });
      }
    }
  }

  saveStore(store);
  res.json({ order, state: store });
});

// Create Clinical Checklist Task
app.post("/api/tasks", (req, res) => {
  const store = getStore();
  const { text, dueDate } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing task text" });
  }

  const newTask = {
    id: `task-${Date.now()}`,
    text,
    dueDate: dueDate || "Due: End of Shift",
    completed: false
  };

  store.tasks.unshift(newTask);
  saveStore(store);
  res.status(201).json({ task: newTask, state: store });
});

// Toggle Clinical Task Complete
app.patch("/api/tasks/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { completed } = req.body;

  const taskIndex = store.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  store.tasks[taskIndex].completed = completed;
  if (completed) {
    store.tasks[taskIndex].dueDate = "Completed";
  } else {
    store.tasks[taskIndex].dueDate = "Due: End of Shift";
  }

  saveStore(store);
  res.json({ task: store.tasks[taskIndex], state: store });
});

// Delete Clinical Task
app.delete("/api/tasks/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  
  store.tasks = store.tasks.filter(t => t.id !== id);
  saveStore(store);
  res.json({ success: true, state: store });
});

// Trigger / Create urgent clinical alert
app.post("/api/alerts", (req, res) => {
  const store = getStore();
  const { type, title, text, severity } = req.body;

  if (!type || !title) {
    return res.status(400).json({ error: "Missing type or title" });
  }

  const newAlert = {
    id: `alert-${Date.now()}`,
    type,
    title,
    timeLabel: "Just now",
    text: text || "",
    severity: severity || "high"
  };

  store.alerts.unshift(newAlert);
  saveStore(store);
  res.status(201).json({ alert: newAlert, state: store });
});

// Dismiss / Resolve Clinical Alert
app.delete("/api/alerts/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;

  store.alerts = store.alerts.filter(a => a.id !== id);
  saveStore(store);
  res.json({ success: true, state: store });
});

// Update/Complete Billing record
app.patch("/api/billing/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { status, paidBySuwasiri, paymentMethod, suwasiriReceiptUrl } = req.body;

  const billIndex = store.billing.findIndex(b => b.id === id);
  if (billIndex === -1) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  if (status) store.billing[billIndex].status = status;
  if (paidBySuwasiri !== undefined) {
    store.billing[billIndex].paidBySuwasiri = paidBySuwasiri;
  }
  if (paymentMethod) store.billing[billIndex].paymentMethod = paymentMethod;
  if (suwasiriReceiptUrl) store.billing[billIndex].suwasiriReceiptUrl = suwasiriReceiptUrl;
  saveStore(store);
  res.json({ bill: store.billing[billIndex], state: store });
});

// Create a clinic invoice (Cash Settle on a booked appointment with no bill yet)
app.post("/api/billing", (req, res) => {
  const store = getStore();
  const bill = {
    id: req.body.id || `bill-${Date.now()}`,
    patientName: req.body.patientName || "Patient",
    patientId: req.body.patientId,
    amount: Number(req.body.amount) || 3500,
    service: req.body.service || "GP Consultation",
    status: req.body.status || "PENDING",
    date: req.body.date || new Date().toISOString().slice(0, 10),
    paymentMethod: req.body.paymentMethod,
    paidBySuwasiri: req.body.paidBySuwasiri === true,
    suwasiriReceiptUrl: req.body.suwasiriReceiptUrl,
    appointmentId: req.body.appointmentId,
  };
  store.billing.push(bill);
  saveStore(store);
  res.status(201).json({ bill, state: store });
});

// Sync payment via Suwasiri App
app.post("/api/billing/:id/sync-suwasiri", (req, res) => {
  const store = getStore();
  const { id } = req.params;

  const billIndex = store.billing.findIndex(b => b.id === id);
  if (billIndex === -1) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  store.billing[billIndex].status = "PAID";
  store.billing[billIndex].paidBySuwasiri = true;

  // Post system message log
  store.clinicMessages.push({
    id: `msg-billing-sync-${Date.now()}`,
    sender: "Suwasiri Payment Service",
    senderRole: "System BOT",
    text: `💳 Payment Synced: Invoice Rs ${store.billing[billIndex].amount.toLocaleString()}.00 for "${store.billing[billIndex].patientName}" has been successfully settled via connected Suwasiri Mobile App!`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({ success: true, bill: store.billing[billIndex], state: store });
});

// Upload payment receipt for Suwasiri paid bills
app.post("/api/billing/:id/upload-receipt", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { receiptUrl, paidBySuwasiri } = req.body;

  const billIndex = store.billing.findIndex(b => b.id === id);
  if (billIndex === -1) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  store.billing[billIndex].suwasiriReceiptUrl = receiptUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=260&auto=format&fit=crop";
  store.billing[billIndex].status = "PAID";
  store.billing[billIndex].paidBySuwasiri = paidBySuwasiri !== undefined ? paidBySuwasiri : true;

  // Post system message log
  store.clinicMessages.push({
    id: `msg-billing-receipt-${Date.now()}`,
    sender: "Suwasiri Payment Service",
    senderRole: "System BOT",
    text: `🧾 Payment Receipt Uploaded: Received verified receipt image for "${store.billing[billIndex].patientName}" (Invoice: ${store.billing[billIndex].id}) paid via Suwasiri App!`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({ success: true, bill: store.billing[billIndex], state: store });
});

// EXPENSES ENDPOINTS
// Get all expenses
app.get("/api/expenses", (req, res) => {
  const store = getStore();
  res.json({ expenses: store.expenses || [] });
});

// Create an expense
app.post("/api/expenses", (req, res) => {
  const store = getStore();
  if (!store.expenses) store.expenses = [];
  const { category, amount, description, date } = req.body;
  const newExpense = {
    id: `exp-${Date.now()}`,
    category: category || "Other",
    amount: parseFloat(amount) || 0,
    description: description || "",
    date: date || new Date().toISOString().substring(0, 10)
  };
  store.expenses.push(newExpense);
  
  // Post system message log
  store.clinicMessages.push({
    id: `msg-expense-${Date.now()}`,
    sender: "Finance Monitor",
    senderRole: "System BOT",
    text: `💸 Expense Logged: Registered Rs ${newExpense.amount.toLocaleString()}.00 expense item under "${newExpense.category}" (${newExpense.description})`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({ success: true, expense: newExpense, state: store });
});

// Delete an expense
app.delete("/api/expenses/:id", (req, res) => {
  const store = getStore();
  if (!store.expenses) store.expenses = [];
  const { id } = req.params;
  const index = store.expenses.findIndex(e => e.id === id);
  if (index !== -1) {
    const deleted = store.expenses.splice(index, 1)[0];
    saveStore(store);
    res.json({ success: true, deleted, state: store });
  } else {
    res.status(404).json({ error: "Expense not found" });
  }
});

// CREATE PATIENT MEDICAL CERTIFICATE
app.post("/api/patients/:id/medical-certificates", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const { 
    diagnosis, 
    startDate, 
    endDate, 
    numDays, 
    status, 
    doctorName, 
    doctorRegNo, 
    additionalRemarks, 
    recipientEmail 
  } = req.body;

  if (!diagnosis || !startDate || !endDate || !status) {
    return res.status(400).json({ error: "Missing required medical certificate fields" });
  }

  const patIndex = store.patients.findIndex(p => p.id === id);
  if (patIndex === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const pat = store.patients[patIndex];
  if (!pat.medicalCertificatesList) {
    pat.medicalCertificatesList = [];
  }

  const newMC = {
    id: `MC-${id}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split("T")[0],
    diagnosis,
    startDate,
    endDate,
    numDays: Number(numDays) || 1,
    status,
    doctorName: doctorName || "Dr. Priyantha Silva",
    doctorRegNo: doctorRegNo || "SLMC-48291",
    additionalRemarks: additionalRemarks || "",
    emailStatus: "NOT_SENT",
    recipientEmail: recipientEmail || pat.email || "patient@gmail.com",
    suwasiriSyncStatus: "SYNCED",
    suwasiriSyncTime: new Date().toISOString(),
    lankalabSyncStatus: "NOT_SYNCED"
  };

  pat.medicalCertificatesList.unshift(newMC);
  saveStore(store);
  res.status(201).json({ certificate: newMC, state: store });
});

// GET ALL SAMPLE COLLECTIONS
app.get("/api/sample-collections", (req, res) => {
  const store = getStore();
  if (!store.sampleCollections) store.sampleCollections = [];
  res.json(store.sampleCollections);
});

// LOG NEW SAMPLE COLLECTION
app.post("/api/sample-collections", (req, res) => {
  const store = getStore();
  if (!store.sampleCollections) store.sampleCollections = [];
  
  const { patientId, sampleCategory, patientName: bodyName, testName, orderedBy } = req.body;
  if (!patientId || !sampleCategory) {
    return res.status(400).json({ error: "Missing patientId or sampleCategory" });
  }

  const patIndex = store.patients.findIndex(p => p.id === patientId);
  const pat = patIndex !== -1 ? store.patients[patIndex] : null;
  const patientName = pat ? pat.name : (bodyName || "Unknown Patient");
  if (pat && !pat.sampleCollections) pat.sampleCollections = [];

  const newSample = {
    id: `SC-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId,
    patientName,
    sampleCategory,
    status: "PENDING",
    collectedTime: "",
    deliveredTime: "",
    deliveryPersonName: "",
    deliveryPersonPhone: "",
    deliveryPersonId: "",
    labName: "",
    lankaLabSyncStatus: "NOT_SYNCED",
    lankaLabLedgerKey: "",
    testName: testName || "",
    orderedBy: orderedBy || "",
    registeredBy: ""
  };

  store.sampleCollections.unshift(newSample);
  if (pat) pat.sampleCollections.unshift(newSample);

  // Add a clinic team notification
  store.clinicMessages.push({
    id: `msg-sc-${Date.now()}`,
    sender: "Diagnostics Hub System",
    senderRole: "System",
    text: `New laboratory order logged: ${sampleCategory} sample requested for citizen patient ${patientName} (ID: ${patientId}). Status: PENDING COLLECTION.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  if (!store.notifications) store.notifications = [];
  const sampleAlert = {
    id: `notif-sc-${Date.now()}`,
    patientName,
    recipient: "Reception / Sample Dispatch Hub",
    transport: "App Notification",
    templateType: "PATHOLOGY_ORDER",
    content: `Doctor ordered ${testName || sampleCategory} (${sampleCategory}) for ${patientName}. Open Sample Dispatch Hub to register collection.`,
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "UNREAD",
    read: false,
    sampleId: newSample.id,
    testName: testName || sampleCategory,
    registeredBy: ""
  };
  store.notifications.unshift(sampleAlert);

  saveStore(store);
  res.status(201).json({ sample: newSample, state: store });
});

app.post("/api/sample-collections/:id/register", (req, res) => {
  const store = getStore();
  if (!store.sampleCollections) store.sampleCollections = [];
  const sample = store.sampleCollections.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: "Sample collection details not found" });
  }
  const registeredBy = req.body.registeredBy || "Reception";
  sample.registeredBy = registeredBy;
  const pat = store.patients.find((p) => p.id === sample.patientId);
  if (pat && Array.isArray(pat.sampleCollections)) {
    const row = pat.sampleCollections.find((ps) => ps.id === sample.id);
    if (row) row.registeredBy = registeredBy;
  }
  store.notifications.forEach((n) => {
    if (n.sampleId === sample.id) {
      n.registeredBy = registeredBy;
      n.read = true;
      n.status = "READ";
    }
  });
  saveStore(store);
  res.json({ sample, state: store });
});

app.delete("/api/sample-collections/:id", (req, res) => {
  const store = getStore();
  if (!store.sampleCollections) store.sampleCollections = [];
  const index = store.sampleCollections.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Sample collection details not found" });
  }
  const sample = store.sampleCollections[index];
  store.sampleCollections.splice(index, 1);
  const pat = store.patients.find((p) => p.id === sample.patientId);
  if (pat && Array.isArray(pat.sampleCollections)) {
    pat.sampleCollections = pat.sampleCollections.filter((ps) => ps.id !== sample.id);
  }
  saveStore(store);
  res.json({ success: true, state: store });
});

app.post("/api/patient-access-requests", (req, res) => {
  const store = getStore();
  if (!store.patientAccessRequests) store.patientAccessRequests = [];
  const { patientId, type, comment, requestedBy, hospitalId, patientSnapshot } = req.body;
  let pat = store.patients.find((p) => p.id === patientId);
  if (!pat && patientSnapshot && patientSnapshot.name) {
    pat = {
      ...patientSnapshot,
      id: patientId,
      name: patientSnapshot.name,
      hospitalId: hospitalId || patientSnapshot.hospitalId || HOSPITAL_PRIMECARE,
      accessStatus: "ACTIVE",
    };
    store.patients.unshift(pat);
  }
  if (!pat) return res.status(404).json({ error: "Patient not found" });
  if (!comment || !String(comment).trim()) {
    return res.status(400).json({ error: "A comment is required to delete or block a patient." });
  }
  const kind = type === "BLOCK" ? "BLOCK" : "DELETE";
  const reqRow = {
    id: `par-${Date.now()}`,
    patientId,
    patientName: pat.name,
    type: kind,
    comment: String(comment).trim(),
    requestedBy: requestedBy || "Reception",
    hospitalId: hospitalId || pat.hospitalId || HOSPITAL_PRIMECARE,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
  pat.accessStatus = kind === "BLOCK" ? "PENDING_BLOCK" : "PENDING_DELETE";
  pat.accessComment = reqRow.comment;
  store.patientAccessRequests.unshift(reqRow);

  const stamp = new Date().toISOString().replace("T", " ").substring(0, 16);
  const actionLabel = kind === "BLOCK" ? "block" : "delete";
  if (!store.notifications) store.notifications = [];
  store.notifications.unshift({
    id: `notif-par-${Date.now()}`,
    patientName: pat.name,
    recipient: "Operations & Governance",
    transport: "App Notification",
    templateType: "PATIENT_ACCESS_REQUEST",
    content: `${reqRow.requestedBy} requested to ${actionLabel} patient file “${pat.name}” (${pat.id}). Comment: ${reqRow.comment}`,
    date: stamp,
    status: "UNREAD",
    read: false,
    accessRequestId: reqRow.id,
  });
  if (!store.clinicMessages) store.clinicMessages = [];
  store.clinicMessages.push({
    id: `msg-par-${Date.now()}`,
    sender: "Operations Portal",
    senderRole: "System BOT",
    text: `${kind === "BLOCK" ? "🚫" : "🗑️"} Patient Clinical Records: ${reqRow.requestedBy} asked to ${actionLabel} “${pat.name}”. Open Platform Console (Operations & Governance) to approve or reject.`,
    timestamp: stamp,
    channel: "#emergency-notices"
  });

  saveStore(store);
  res.status(201).json({ request: reqRow, state: store });
});

app.patch("/api/patient-access-requests/:id", (req, res) => {
  const store = getStore();
  if (!store.patientAccessRequests) store.patientAccessRequests = [];
  const row = store.patientAccessRequests.find((r) => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Request not found" });
  const decision = req.body.status === "REJECTED" ? "REJECTED" : "APPROVED";
  row.status = decision;
  row.reviewedBy = req.body.reviewedBy || "Admin";
  const pat = store.patients.find((p) => p.id === row.patientId);
  if (pat) {
    if (decision === "REJECTED") {
      pat.accessStatus = "ACTIVE";
    } else {
      pat.accessStatus = row.type === "BLOCK" ? "BLOCKED" : "DELETED";
    }
  }
  if (store.notifications) {
    store.notifications.forEach((n) => {
      const match =
        n.templateType === "PATIENT_ACCESS_REQUEST" &&
        (n.accessRequestId === row.id || (!n.accessRequestId && n.patientName === row.patientName && n.status !== "READ"));
      if (match) {
        n.read = true;
        n.status = "READ";
      }
    });
  }
  saveStore(store);
  res.json({ request: row, state: store });
});

// MARK SAMPLE AS COLLECTED
app.post("/api/sample-collections/:id/collect", (req, res) => {
  const store = getStore();
  if (!store.sampleCollections) store.sampleCollections = [];

  const { id } = req.params;
  const index = store.sampleCollections.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Sample collection details not found" });
  }

  const sample = store.sampleCollections[index];
  const localTimeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  sample.status = "COLLECTED";
  sample.collectedTime = localTimeStr;

  if (!store.notifications) store.notifications = [];
  store.notifications.forEach((n) => {
    const forThisSample = n.sampleId && n.sampleId === sample.id;
    const legacyMatch =
      n.templateType === "PATHOLOGY_ORDER" &&
      !n.sampleId &&
      n.patientName === sample.patientName &&
      n.status !== "READ" &&
      !n.read;
    if (forThisSample || legacyMatch) {
      n.read = true;
      n.status = "READ";
    }
  });

  // Sync patient's personal registry
  const patIndex = store.patients.findIndex(p => p.id === sample.patientId);
  if (patIndex !== -1) {
    const pat = store.patients[patIndex];
    if (!pat.sampleCollections) pat.sampleCollections = [];
    const patSampleIdx = pat.sampleCollections.findIndex(ps => ps.id === id);
    if (patSampleIdx !== -1) {
      pat.sampleCollections[patSampleIdx].status = "COLLECTED";
      pat.sampleCollections[patSampleIdx].collectedTime = localTimeStr;
    } else {
      pat.sampleCollections.unshift(sample);
    }
  }

  // Clinic announcement
  store.clinicMessages.push({
    id: `msg-sc-c-${Date.now()}`,
    sender: "Diagnostics Hub System",
    senderRole: "System",
    text: `🧪 Diagnostics Alert: ${sample.sampleCategory} sample successfully COLLECTED from patient ${sample.patientName}. Ready for courier/delivery dispatch to partnered LankaLab branches.`,
    timestamp: localTimeStr,
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({ success: true, sample, state: store });
});

// MARK SAMPLE AS DELIVERED & SYNC LANKALAB PORTAL
app.post("/api/sample-collections/:id/deliver", (req, res) => {
  const store = getStore();
  if (!store.sampleCollections) store.sampleCollections = [];

  const { id } = req.params;
  const { deliveryPersonName, deliveryPersonPhone, deliveryPersonId, labName } = req.body;

  if (!deliveryPersonName || !labName) {
    return res.status(400).json({ error: "Missing delivery person details or partner lab name" });
  }

  const index = store.sampleCollections.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Sample collection details not found" });
  }

  const sample = store.sampleCollections[index];
  const localTimeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  const ledgerKey = `LKLAB-SMP-TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`;

  sample.status = "DELIVERED";
  sample.deliveredTime = localTimeStr;
  sample.deliveryPersonName = deliveryPersonName;
  sample.deliveryPersonPhone = deliveryPersonPhone || "+94 77 000 0000";
  sample.deliveryPersonId = deliveryPersonId || "N/A";
  sample.labName = labName;
  sample.lankaLabSyncStatus = "SYNCED";
  sample.lankaLabLedgerKey = ledgerKey;

  // Sync patient's personal registry
  const patIndex = store.patients.findIndex(p => p.id === sample.patientId);
  if (patIndex !== -1) {
    const pat = store.patients[patIndex];
    if (!pat.sampleCollections) pat.sampleCollections = [];
    const patSampleIdx = pat.sampleCollections.findIndex(ps => ps.id === id);
    if (patSampleIdx !== -1) {
      pat.sampleCollections[patSampleIdx].status = "DELIVERED";
      pat.sampleCollections[patSampleIdx].deliveredTime = localTimeStr;
      pat.sampleCollections[patSampleIdx].deliveryPersonName = deliveryPersonName;
      pat.sampleCollections[patSampleIdx].deliveryPersonPhone = deliveryPersonPhone || "+94 77 000 0000";
      pat.sampleCollections[patSampleIdx].deliveryPersonId = deliveryPersonId || "N/A";
      pat.sampleCollections[patSampleIdx].labName = labName;
      pat.sampleCollections[patSampleIdx].lankaLabSyncStatus = "SYNCED";
      pat.sampleCollections[patSampleIdx].lankaLabLedgerKey = ledgerKey;
    } else {
      pat.sampleCollections.unshift(sample);
    }
  }

  // Clinic team announcement
  store.clinicMessages.push({
    id: `msg-sc-d-${Date.now()}`,
    sender: "LankaLab System Gateway",
    senderRole: "System",
    text: `🚀 LankaLab Sync: Completed delivery of ${sample.sampleCategory} sample for patient ${sample.patientName} to partner dispatch facility: "${labName}". Dispatcher: ${deliveryPersonName} (Mob: ${deliveryPersonPhone || "N/A"}). Synced under Ledger Key: ${ledgerKey}.`,
    timestamp: localTimeStr,
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({ success: true, sample, state: store });
});

// DISPATCH MEDICAL CERTIFICATE TO EMAIL (WITH OPTIONAL GEMINI DRAFTING)
app.post("/api/medical-certificates/:patientId/:certId/send-email", async (req, res) => {
  const store = getStore();
  const { patientId, certId } = req.params;

  const patIndex = store.patients.findIndex(p => p.id === patientId);
  if (patIndex === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const pat = store.patients[patIndex];
  if (!pat.medicalCertificatesList) {
    return res.status(404).json({ error: "Medical certificates list is empty" });
  }

  const certIndex = pat.medicalCertificatesList.findIndex(c => c.id === certId);
  if (certIndex === -1) {
    return res.status(404).json({ error: "Medical certificate not found" });
  }

  const cert = pat.medicalCertificatesList[certIndex];
  let draftedBody = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `
You are a highly professional medical assistant at "Sri Lankan GP Care". Draft an official, complete, and highly caring clinical email transmitting the Medical Certificate of recommended rest to our patient.

Patient Name: ${pat.name}
Certificate Reference ID: ${cert.id}
Date Issued: ${cert.date}
Diagnosis / Medical Reason: ${cert.diagnosis}
Recommended Rest Duration: ${cert.startDate} to ${cert.endDate} (${cert.numDays} Days)
Employment Fitness Status: ${cert.status}
Attending Doctor: ${cert.doctorName} (SLMC Registration No: ${cert.doctorRegNo})
Special Remarks: ${cert.additionalRemarks || "None"}

Please draft the full, ready-to-display email in beautiful professional Markdown structure. Provide helpful recovery advice common to Sri Lanka, and outline the details of the medical certificate of health leave with absolute clarity. Avoid generic placeholder signatures.
`,
        config: {
          temperature: 0.2,
        }
      });
      draftedBody = response.text || "";
    } catch (err) {
      console.error("Gemini email auto-draft failed: ", err);
    }
  }

  if (!draftedBody) {
    // Elegant fallback template if Gemini key is missing or errored
    draftedBody = `
Dear ${pat.name},

Please find below the official details of your certified Medical Certificate from Sri Lankan GP Care.

--- DIGITAL CLINICAL CERTIFICATE ---
Certificate ID: ${cert.id}
Issue Date: ${cert.date}
Medical Condition / Diagnosis: ${cert.diagnosis}
Recommended Rest: From ${cert.startDate} to ${cert.endDate} (${cert.numDays} day(s))
Fitness Indicator: Undersigned is ${cert.status.replace(/_/g, ' ')}
Attending Clinician: ${cert.doctorName} (SLMC Registration: ${cert.doctorRegNo})
clinical Advice / Treatment Coverage: ${cert.additionalRemarks || "Strict bed rest, adequate hydration and proper dosage of active medications are highly recommended."}

This document serves as a digitally verified record. You may present this file directly to your employer, school, or organization to justify medical leave. If you require further clinical evaluations, please contact us or request a review session.

Sincerely,
Clinical Secretariat Office
Sri Lankan GP Care Clinic Group
`;
  }

  // Update status
  cert.emailStatus = "SENT";
  
  // Create clinical notification record
  store.notifications.unshift({
    id: `notif-email-${Date.now()}`,
    patientName: pat.name,
    recipient: cert.recipientEmail,
    transport: "Email",
    templateType: "MEDICAL_CERTIFICATE_EMAIL",
    content: draftedBody,
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "SENT"
  });

  saveStore(store);
  res.json({ success: true, emailBody: draftedBody, state: store });
});

// SYNC WITH SUWASIRI NATIONAL HEALTH PORTAL APP REGISTRY
app.post("/api/medical-certificates/:patientId/:certId/sync-suwasiri", (req, res) => {
  const store = getStore();
  const { patientId, certId } = req.params;

  const patIndex = store.patients.findIndex(p => p.id === patientId);
  if (patIndex === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const pat = store.patients[patIndex];
  if (!pat.medicalCertificatesList) {
    return res.status(404).json({ error: "Certificate list not found" });
  }

  const certIndex = pat.medicalCertificatesList.findIndex(c => c.id === certId);
  if (certIndex === -1) {
    return res.status(404).json({ error: "Certificate not found" });
  }

  const cert = pat.medicalCertificatesList[certIndex];
  const localTimeStr = new Date().toISOString().replace("T", " ").substring(0, 19);

  cert.suwasiriSyncStatus = "SYNCED";
  cert.suwasiriSyncTime = localTimeStr;

  store.clinicMessages.push({
    id: `msg-sync-${Date.now()}`,
    sender: "Suwasiri National Gateway",
    senderRole: "System BOT",
    text: `Synced rest medical card ${cert.id} with Suwasiri App. Digital Signature Verification: SHA256-${Math.random().toString(36).substring(2,15).toUpperCase()} loaded successfully.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({ 
    success: true, 
    syncTime: localTimeStr, 
    registryHash: `SWSR-TXN-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
    state: store 
  });
});

// TELEHEALTH VIDEO CONSULTATION TELEMETRY SYNC WITH SUWASIRI APP
app.post("/api/telehealth/sync-suwasiri", (req, res) => {
  const store = getStore();
  const { patientId, token, inviteLink, specialNotes, issuedMeds } = req.body;

  const pat = store.patients.find(p => p.id === patientId);
  if (!pat) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Record prescription if drugs are prescribed in telehealth
  let rxTextLine = "None issued";
  if (issuedMeds && Array.isArray(issuedMeds) && issuedMeds.length > 0) {
    const rxCheck = `RX-TH-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPrescriptionRecord = {
      id: `rx-gen-th-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      items: issuedMeds,
      dosageInstructions: "Prescribed during secure primary-care telehealth video conference session.",
      rxNumber: rxCheck,
      signatureUrl: "Dr. Priyantha Silva, SLMC: 12908"
    };
    if (!pat.prescriptionsList) pat.prescriptionsList = [];
    pat.prescriptionsList.unshift(newPrescriptionRecord);
    
    if (!pat.activeMedications) pat.activeMedications = [];
    pat.activeMedications = Array.from(new Set([...pat.activeMedications, ...issuedMeds]));
    rxTextLine = issuedMeds.join(", ");
  }

  // Update notes & append to medical history log
  if (specialNotes) {
    const sumDate = new Date().toISOString().split("T")[0];
    const clinicalSummary = `Telehealth VideoConsult Summary. Special Notes: ${specialNotes}. Prescribed treatment: ${rxTextLine}`;
    const medHistoryString = `[${sumDate}] Telehealth Visit: Video consult session | Notes: ${specialNotes}`;
    
    if (!pat.medicalHistory) pat.medicalHistory = [];
    pat.medicalHistory.push(medHistoryString);

    if (!pat.history) pat.history = [];
    pat.history.unshift({
      date: sumDate,
      reason: "Telehealth Video Consultation",
      doctor: "Dr. Priyantha Silva",
      notes: clinicalSummary
    });

    pat.notes = specialNotes;
  }

  // Create a system chat bot message
  store.clinicMessages.push({
    id: `telehealth-suwasiri-${Date.now()}`,
    sender: "Suwasiri Telehealth Gateway",
    senderRole: "System BOT",
    text: `📡 Telehealth Video Sync: Broadcasted consultation notes and e-Prescriptions (${rxTextLine}) for Patient "${pat.name}" (ID: ${pat.id}) into connected Suwasiri Mobile App! Active Secure token: ${token}.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  // Create an automated clinical alert notifying receipt of active telemetry feed
  store.alerts.push({
    id: `alert-telehealth-${Date.now()}`,
    type: "TELEHEALTH SYNC",
    title: `Telehealth Link Synced: ${pat.name}`,
    timeLabel: "Just now",
    details: `Active video consultation notes & issued drugs (${rxTextLine}) transmitted and synced successfully to patient's Suwasiri app profile under section 'Issued Medicine'.`,
    severity: "INFO"
  });

  saveStore(store);
  res.json({ success: true, state: store });
});

// SYNC WITH LANKALAB PORTAL SYSTEM INDEXING
app.post("/api/medical-certificates/:patientId/:certId/sync-lankalab", (req, res) => {
  const store = getStore();
  const { patientId, certId } = req.params;

  const patIndex = store.patients.findIndex(p => p.id === patientId);
  if (patIndex === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const pat = store.patients[patIndex];
  if (!pat.medicalCertificatesList) {
    return res.status(404).json({ error: "Certificate list not found" });
  }

  const certIndex = pat.medicalCertificatesList.findIndex(c => c.id === certId);
  if (certIndex === -1) {
    return res.status(404).json({ error: "Certificate not found" });
  }

  const cert = pat.medicalCertificatesList[certIndex];
  const localTimeStr = new Date().toISOString().replace("T", " ").substring(0, 19);

  cert.lankalabSyncStatus = "SYNCED";
  cert.lankalabSyncTime = localTimeStr;

  store.clinicMessages.push({
    id: `msg-labsync-${Date.now()}`,
    sender: "LankaLab System Gateway",
    senderRole: "System BOT",
    text: `Successfully registered consult clearance files for ${cert.id} on LankaLab portal system. Ledger key: LKLAB-${Math.random().toString(36).substring(2,11).toUpperCase()}`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.json({
    success: true,
    syncTime: localTimeStr,
    lankalabLedgerKey: `LKLAB-TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
    state: store
  });
});

// Server-side integration of Gemini API
app.post("/api/ai/analyze-consultation", async (req, res) => {
  try {
    const { patientName, allergies, activeMedications, currentNotes, prescribeMedName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured."
      });
    }

    // Initialize @google/genai SDK in server-side
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const promptMessage = `
You are a highly-experienced Chief Medical Officer and GP advising a local clinic in Sri Lanka ("Sri Lankan GP Care").
Analyze the current patient consultation details:

Patient Name: ${patientName}
Severe Allergies: ${allergies || "None declared"}
Existing Medications: ${activeMedications?.join(", ") || "None"}
Symptom/Clinical Notes: "${currentNotes || "None written yet"}"
Proposed New Medication to prescribe: "${prescribeMedName || "None suggested"}"

Please output a concise clinical review in clean Markdown format with the following:
1. **Critical Safety Check / Interaction Alert**: 
   - Explicitly warn if the proposed medication or existing drugs conflict with the patient's listed allergies. 
   - Note: If the patient is "Fatima Zahra" and any antibiotic containing "Penicillin" or "Sulfa" is typed/selected, raise an IMMEDIATE HIGH RISK cross-sensitivity warning in bold red!
2. **Clinical Symptoms Evaluation**: Discuss what the diagnostic differential represents under General Practice (e.g., if there's a cough, consider tropical bronchitis, asthma flare, or viral URTI common in Sri Lanka).
3. **Recommended Prescribing Advice**: Write exact suggested dosage regimes, duration, and specific instructions tailored for typical Sri Lankan climates/habits.
4. **Follow-up Advice**: Advise when to refer or order diagnostic tests (e.g., sputum test, Chest X-rays, blood profiles, rehydration advice for dengue prevention).

Be direct, highly professional, clean, and concise. Do not use generic fluff. No self-mentions.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        temperature: 0.1,
      }
    });

    const aiText = response.text || "No response generated by AI.";
    res.json({ analysis: aiText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "AI analysis could not complete. Please check the network context or Secrets Panel.",
      details: error.message
    });
  }
});

// Setup Vite Dev Server / Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

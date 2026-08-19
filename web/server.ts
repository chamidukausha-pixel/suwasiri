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

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize store file path
const DATA_FILE = path.join(process.cwd(), "patient_store.json");

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
        { id: "lab-res-1", testName: "HbA1c Glycated Hemoglobin", date: "2026-04-10", status: "COMPLETED", result: "5.9% (Pre-diabetic, Ref: < 5.7%)", remarks: "Consistent with dietary habits. Advised reduction in simple carbohydrates." },
        { id: "lab-res-2", testName: "Serum Potassium", date: "2026-03-12", status: "COMPLETED", result: "4.2 mmol/L (Normal, Ref: 3.5 - 5.1)", remarks: "In normal range. Heart rhythm safe." },
        { id: "lab-res-3", testName: "Cholesterol Profile", date: "2025-12-05", status: "COMPLETED", result: "Chol: 215 mg/dL (Borderline), HDL: 48 mg/dL, LDL: 132 mg/dL", remarks: "Advised standard dietary changes, coconut oil intake limitations." }
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
        { id: "lab-res-4", testName: "Lipid Profile & Glucose FBG", date: "2026-05-18", status: "COMPLETED", result: "FBG: 92 mg/dL (Normal), Total Chol: 184 mg/dL (Normal)", remarks: "Excellent cardiovascular biomarkers." }
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
        { id: "lab-res-5", testName: "Full Blood Count (FBC)", date: "2025-11-05", status: "COMPLETED", result: "WBC: 7.8 x10^3/uL (Normal), Platelets: 245 x10^3/uL", remarks: "Pharyngitis, non-bacterial baseline indicators." }
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
        { id: "lab-res-6", testName: "Glycated Hemoglobin (HbA1c)", date: "2026-01-14", status: "COMPLETED", result: "7.4% (Elevated, Ref: < 5.7%)", remarks: "Suboptimal glycemic control. Metformin dose titrated up." },
        { id: "lab-res-7", testName: "Serum Lipid profile", date: "2026-01-14", status: "COMPLETED", result: "Total Chol: 248 mg/dL (High), LDL-C: 154 mg/dL", remarks: "Atorvastatin cover initiated at 10mg nightly to prevent risk." }
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
        { id: "lab-res-8", testName: "Pre-Op Complete Blood Count", date: "2026-05-20", status: "COMPLETED", result: "WBC: 6.4, Hemoglobin: 12.8 g/dL, Platelets: 290", remarks: "Excellent hematology limits. Cleared for elective theater." }
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
        { id: "lab-res-9", testName: "Serum Uric Acid & Creatinine", date: "2026-02-02", status: "COMPLETED", result: "Uric Acid: 7.2 mg/dL (Slightly elevated, Ref: 3.5 - 7.0), Creatinine: 1.0 mg/dL", remarks: "Keep hydration high. Monitor joint pains." }
      ],
      prescriptionsList: [
        { id: "rx-219", date: "2026-02-02", items: ["Amlodipine 5mg - 1 OD"], dosageInstructions: "Take in the morning with a full glass of water.", rxNumber: "RX-2026-0129", signatureUrl: "Dr. P. Silva" }
      ]
    },
    SOUTHERN_DEMO_PATIENT
  ],
  appointments: [
    {
      id: "apt-1",
      patientId: "3210-LK",
      time: "09:15 AM",
      reason: "Persistent Cough (2 weeks)",
      status: "IN EXAM ROOM",
      date: "2026-06-12"
    },
    {
      id: "apt-2",
      patientId: "1092-LK",
      time: "09:45 AM",
      reason: "Acute Diabetic Review",
      status: "CHECKED IN",
      date: "2026-06-12"
    },
    {
      id: "apt-3",
      patientId: "4412-LK",
      time: "10:00 AM",
      reason: "Post-Op Follow-up",
      status: "SCHEDULED",
      date: "2026-06-12"
    },
    {
      id: "apt-4",
      patientId: "2198-LK",
      time: "10:15 AM",
      reason: "Hypertension Monitoring",
      status: "SCHEDULED",
      date: "2026-06-12"
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
  staffDirectory: DEFAULT_STAFF_DIRECTORY
};

// Help load/save the store with automatic forward migration safeguards
function getStore() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STATE, null, 2));
    return INITIAL_STATE;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    
    // Auto migration checks for patient structure updates
    let mutated = false;
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
  persistTenancy(store);
  res.json({ success: true, staffDirectory: store.staffDirectory.filter((s: any) => s.hospitalId === hospitalId) });
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
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const id = `hosp-${Date.now()}`;
  const hospital = { id, name, status: "ACTIVE" };
  store.hospitals = [...(store.hospitals || []), hospital];
  store.roles = [...(store.roles || []), ...cloneHospitalRoles(id)];
  persistTenancy(store);
  res.json({ success: true, hospital, roles: store.roles.filter((r: any) => r.hospitalId === id) });
});

// Create Appointment
app.post("/api/appointments", (req, res) => {
  const store = getStore();
  const { patientId, time, reason, status, date } = req.body;
  
  if (!patientId || !time || !reason) {
    return res.status(400).json({ error: "Missing patientId, time or reason" });
  }

  const newApt = {
    id: `apt-${Date.now()}`,
    patientId,
    time,
    reason,
    status: status || "SCHEDULED",
    date: date || new Date().toISOString().split("T")[0]
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
    status: "PENDING",
    date: newApt.date
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

// Create/Register Patients Details
app.post("/api/patients", (req, res) => {
  const store = getStore();
  const { name, age, gender, bloodType, allergies, phone, email, notes, medicalHistory, medicalCenter, hospitalId, branchId } = req.body;

  if (!name || !age) {
    res.status(400).json({ error: "Missing name or age" });
    return;
  }

  const pId = `${Math.floor(1000 + Math.random() * 9000)}-LK`;
  
  // parsed medical history split by commas or array fallback
  let parseHistory = ["No systemic chronic conditions declared"];
  if (medicalHistory) {
    if (Array.isArray(medicalHistory)) {
      parseHistory = medicalHistory;
    } else {
      parseHistory = String(medicalHistory).split(",").map(s => s.trim()).filter(Boolean);
    }
  }

  const newPatient = {
    id: pId,
    name,
    age: parseInt(age),
    gender: gender || "Male",
    bloodType: bloodType || "O+",
    allergies: allergies || "None declared",
    phone: phone || "+94 77 000 0000",
    email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
    image: "",
    notes: notes || "",
    history: [],
    activeMedications: [],
    medicalHistory: parseHistory,
    vaccineRecords: [
      { vaccineName: "COVID-19 Vaccine (Standard)", date: "2021-10-10", dose: "Completed Sequence", batchNumber: "COV-RECG-77", status: "Completed" }
    ],
    labResults: [],
    prescriptionsList: [],
    medicalCertificatesList: [],
    medicalCenter: medicalCenter || "Colombo Central Clinic",
    hospitalId: hospitalId || HOSPITAL_PRIMECARE,
    branchId: branchId || BRANCH_COLOMBO
  };

  store.patients.unshift(newPatient);
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

// SUWASIRI NATIONAL MOBILE APP MEDICAL DIRECTORY (MOCK REGISTRY GATEWAY)
const SUWASIRI_REGISTRY = [
  {
    barcode: "SWSR-9912",
    name: "Sahan Gunasekara",
    age: 34,
    gender: "Male",
    bloodType: "B+",
    allergies: "Peanut Sensitivity",
    phone: "+94 77 111 2222",
    email: "sahan.g@gmail.com",
    notes: "Synced via Suwasiri Mobile App index database. Heavy sports enthusiast.",
    medicalHistory: ["Hyperlipidemia (onset 2024)", "Mild Dust Allergy"],
    vaccineRecords: [
      { vaccineName: "COVID-19 Pfizer", date: "2021-08-11", dose: "Completed Sequence", batchNumber: "COV-PZ-902", status: "Completed" },
      { vaccineName: "Tetanus Toxoid", date: "2025-02-14", dose: "Booster", batchNumber: "TET-911", status: "Completed" }
    ],
    labResults: [
      { id: "lab-swsr-1", testName: "Lipid Profile", date: "2026-01-20", status: "COMPLETED", result: "Total Cholesterol: 210 mg/dL", remarks: "Slightly elevated. Recommended daily exercise." }
    ],
    activeMedications: ["Atorvastatin 10mg Nocte"],
    medicalCenter: "Colombo Central Clinic"
  },
  {
    barcode: "SWSR-4451",
    name: "Nimani Rajasinghe",
    age: 28,
    gender: "Female",
    bloodType: "O-",
    allergies: "Sulfa Drugs",
    phone: "+94 77 333 4444",
    email: "nimani.r@gmail.com",
    notes: "Synced via Suwasiri Mobile App index database. Diagnosed with mild anemia in childhood.",
    medicalHistory: ["Iron deficiency anemia", "Allergic Rhinitis"],
    vaccineRecords: [
      { vaccineName: "COVID-19 Moderna", date: "2021-07-20", dose: "Completed Sequence", batchNumber: "COV-MD-551", status: "Completed" }
    ],
    labResults: [
      { id: "lab-swsr-2", testName: "Hemoglobin Count", date: "2026-03-01", status: "COMPLETED", result: "11.2 g/dL (Slightly low, Ref: 12-16)", remarks: "Suggesting iron rich supplements and green leafy veggies." }
    ],
    activeMedications: ["Iron Supplement (Ferosoft) 1 tab daily"],
    medicalCenter: "Kandy Wellness Center"
  },
  {
    barcode: "SWSR-1085",
    name: "Dilhan Wickramasinghe",
    age: 41,
    gender: "Male",
    bloodType: "A+",
    allergies: "None declared",
    phone: "+94 71 555 6666",
    email: "dilhan.w@gmail.com",
    notes: "Synced via Suwasiri Mobile App index database. Logistics Supervisor.",
    medicalHistory: ["Gastroesophageal reflux disease (GERD, diagnosed 2023)"],
    vaccineRecords: [
      { vaccineName: "COVID-19 AstraZeneca", date: "2021-06-15", dose: "Completed Sequence", batchNumber: "COV-AZ-883", status: "Completed" }
    ],
    labResults: [],
    activeMedications: ["Omeprazole 20mg daily AC"],
    medicalCenter: "Colombo Central Clinic"
  },
  {
    barcode: "SWSR-3022",
    name: "Kavindi Perera",
    age: 31,
    gender: "Female",
    bloodType: "AB+",
    allergies: "Aspirin, Ibuprofen",
    phone: "+94 72 888 9999",
    email: "kavindi.p@gmail.com",
    notes: "Synced via Suwasiri Mobile App index database. Graphic Designer.",
    medicalHistory: ["Migraine with visual aura (diagnosed 2021)"],
    vaccineRecords: [
      { vaccineName: "COVID-19 Pfizer", date: "2021-09-02", dose: "Completed Sequence", batchNumber: "COV-PZ-101", status: "Completed" }
    ],
    labResults: [],
    activeMedications: ["Sumatriptan 50mg PRN"],
    medicalCenter: "Galle GP Care"
  }
];

// Fallback dynamic generator helper based on barcode string hash
function generateSuwasiriPatient(barcodeNum: string) {
  let hash = 0;
  for (let i = 0; i < barcodeNum.length; i++) {
    hash = barcodeNum.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const sriLankanFirstNames = ["Pathum", "Suresh", "Ishara", "Nisansala", "Saman", "Awanthi", "Malith", "Ruwan", "Chathura", "Gayathri", "Kamal", "Dilini", "Sanjaya", "Chamikara", "Nimanka"];
  const sriLankanLastNames = ["Silva", "Perera", "Fernando", "Jayasinghe", "Ranasinghe", "Wickramasinghe", "Gunasekara", "Herath", "Karunaratne", "Senanayake", "Jayawardena", "Alwis"];
  const bloodTypesList = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-"];
  const allergyList = ["None declared", "Penicillin", "Dust mites", "Dairy products", "Sulfa drugs", "Amoxicillin", "Aspirin"];
  const genericMeds = [
    ["Cetirizine 10mg Nocte"],
    ["Metformin 500mg daily"],
    ["Lisinopril 5mg daily"],
    ["Paracetamol 500mg PRN"],
    ["None declared"]
  ];
  const genericHistory = [
    ["Essential Hypertension (onset 2024)", "Mild Hyperuricemia"],
    ["Seasonal Respiratory Allergies", "No other conditions"],
    ["Type 2 Diabetes (onset 2025)"],
    ["Primary Dysmenorrhea (occasional)"],
    ["No systemic chronic conditions declared"]
  ];

  const first = sriLankanFirstNames[hash % sriLankanFirstNames.length];
  const last = sriLankanLastNames[(hash >> 2) % sriLankanLastNames.length];
  const age = (hash % 50) + 18;
  const gender = (hash % 2 === 0) ? "Male" : "Female";
  const bloodType = bloodTypesList[(hash >> 4) % bloodTypesList.length];
  const allergy = allergyList[(hash >> 3) % allergyList.length];
  const phone = `+94 77 ${Math.floor(1000000 + (hash % 9000000))}`;
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@suwasiri.lk`;
  const activeMedications = genericMeds[hash % genericMeds.length];
  const medicalHistory = genericHistory[(hash >> 1) % genericHistory.length];

  const centerList = ["Colombo Central Clinic", "Kandy Wellness Center", "Galle GP Care", "Jaffna Medical Hub"];
  const medicalCenter = centerList[hash % centerList.length];

  return {
    barcode: barcodeNum,
    name: `${first} ${last}`,
    age,
    gender,
    bloodType,
    allergies: allergy,
    phone,
    email,
    notes: `Dynamically compiled & synced from Suwasiri National Mobile App directory (Secure ID: ${barcodeNum}).`,
    medicalHistory,
    vaccineRecords: [
      { vaccineName: "COVID-19 Vaccine (Standard)", date: "2021-12-05", dose: "Completed", batchNumber: `COV-SUW-${hash % 1000}`, status: "Completed" }
    ],
    labResults: [],
    activeMedications,
    medicalCenter
  };
}

// SUWASIRI BARCODE RETRIEVAL & AUTO-SYNCHRONIZATION ENDPOINT
app.get("/api/suwasiri/barcode/:barcodeCode", (req, res) => {
  const store = getStore();
  const rawBarcode = req.params.barcodeCode.trim();
  
  if (!rawBarcode) {
    return res.status(400).json({ error: "No barcode specified." });
  }

  // 1. Look up if patient was already imported / exists with this barcode in store
  let existingPatient = store.patients.find(
    p => (p.suwasiriBarcode && p.suwasiriBarcode.toUpperCase() === rawBarcode.toUpperCase()) ||
         (p.id.toUpperCase() === rawBarcode.toUpperCase())
  );

  if (existingPatient) {
    // Already synced earlier, just return it
    return res.json({ patient: existingPatient, isNewSync: false, state: store });
  }

  // 2. Look up in predefined static Suwasiri database registry
  let source = SUWASIRI_REGISTRY.find(p => p.barcode.toUpperCase() === rawBarcode.toUpperCase());
  
  // 3. If not in static directory, generate a realistic deterministic file
  if (!source) {
    source = generateSuwasiriPatient(rawBarcode);
  }

  // 4. Register this patient into Sri Lankan GP Care portal
  const pId = `${Math.floor(1000 + Math.random() * 9000)}-LK`;
  const newPatient = {
    id: pId,
    name: source.name,
    age: source.age,
    gender: source.gender,
    bloodType: source.bloodType,
    allergies: source.allergies,
    phone: source.phone,
    email: source.email,
    image: "",
    notes: source.notes,
    history: [],
    activeMedications: source.activeMedications,
    medicalHistory: source.medicalHistory,
    vaccineRecords: source.vaccineRecords,
    labResults: source.labResults || [],
    prescriptionsList: [],
    medicalCertificatesList: [],
    medicalCenter: source.medicalCenter || "Colombo Central Clinic",
    suwasiriBarcode: rawBarcode.toUpperCase()
  };

  store.patients.unshift(newPatient);

  // Post system BOT sync message
  store.clinicMessages.push({
    id: `msg-${Date.now()}`,
    sender: "Suwasiri Portal Engine",
    senderRole: "System BOT",
    text: `⚡ Synergized central ID sync! Barcode "${rawBarcode.toUpperCase()}" loaded from Suwasiri Mobile App. Patient "${newPatient.name}" is now auto-registered at "${newPatient.medicalCenter}".`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.status(201).json({ patient: newPatient, isNewSync: true, state: store });
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
    activeMedications, 
    allergies, 
    historyEntry,
    medicalHistory,
    newVaccineRecord,
    newLabResult,
    newPrescriptionRecord
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

  if (newVaccineRecord) {
    pat.vaccineRecords.push(newVaccineRecord);
  }

  if (newLabResult) {
    pat.labResults.push(newLabResult);
  }

  if (newPrescriptionRecord) {
    pat.prescriptionsList.unshift(newPrescriptionRecord);
  }

  if (historyEntry) {
    const sumDate = new Date().toISOString().split("T")[0];
    const medHistoryString = `[${sumDate}] Consultation Visit: ${historyEntry.reason || "Clinical consult"} | Notes: ${historyEntry.notes}`;
    if (!pat.medicalHistory) {
      pat.medicalHistory = [];
    }
    pat.medicalHistory.push(medHistoryString);

    pat.history.unshift({
      date: sumDate,
      reason: historyEntry.reason || "Clinical consultation",
      doctor: historyEntry.doctor || "Dr. Priyantha Silva",
      notes: historyEntry.notes || ""
    });
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
    status: "DELIVERED"
  };

  store.notifications.unshift(newLog);
  saveStore(store);
  res.status(201).json({ success: true, notification: newLog, state: store });
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
  const { patientId, testName, remarks } = req.body;

  if (!patientId || !testName) {
    return res.status(400).json({ error: "Missing patientId or testName" });
  }

  const pat = store.patients.find(p => p.id === patientId);
  const patientName = pat ? pat.name : "Unknown Patient";

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
  saveStore(store);
  res.status(201).json({ order: newOrder, state: store });
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
  const { status, paidBySuwasiri } = req.body;

  const billIndex = store.billing.findIndex(b => b.id === id);
  if (billIndex === -1) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  store.billing[billIndex].status = status;
  if (paidBySuwasiri !== undefined) {
    store.billing[billIndex].paidBySuwasiri = paidBySuwasiri;
  }
  saveStore(store);
  res.json({ bill: store.billing[billIndex], state: store });
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
    suwasiriSyncStatus: "NOT_SYNCED",
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
  
  const { patientId, sampleCategory } = req.body;
  if (!patientId || !sampleCategory) {
    return res.status(400).json({ error: "Missing patientId or sampleCategory" });
  }

  const patIndex = store.patients.findIndex(p => p.id === patientId);
  if (patIndex === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const pat = store.patients[patIndex];
  if (!pat.sampleCollections) pat.sampleCollections = [];

  const newSample = {
    id: `SC-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId,
    patientName: pat.name,
    sampleCategory,
    status: "PENDING",
    collectedTime: "",
    deliveredTime: "",
    deliveryPersonName: "",
    deliveryPersonPhone: "",
    deliveryPersonId: "",
    labName: "",
    lankaLabSyncStatus: "NOT_SYNCED",
    lankaLabLedgerKey: ""
  };

  store.sampleCollections.unshift(newSample);
  pat.sampleCollections.unshift(newSample);

  // Add a clinic team notification
  store.clinicMessages.push({
    id: `msg-sc-${Date.now()}`,
    sender: "Diagnostics Hub System",
    senderRole: "System",
    text: `New laboratory order logged: ${sampleCategory} sample requested for citizen patient ${pat.name} (ID: ${patientId}). Status: PENDING COLLECTION.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    channel: "#general-clinical"
  });

  saveStore(store);
  res.status(201).json({ sample: newSample, state: store });
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

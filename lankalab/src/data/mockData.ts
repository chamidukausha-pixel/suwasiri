import { 
  LabOrder, 
  CourierRoute, 
  UrgentNotification, 
  TestCatalogItem,
  ConsumableItem,
  MQLinkRecord,
  ClinicalTrialProtocol,
  SupplementaryTestRequest,
  QuickShareLog,
  CumulativeParameterHistory,
  TrialWorkflowStep,
  TrialFinancialInvoice
} from '../types';

export const initialOrders: LabOrder[] = [
  {
    id: '1',
    patientName: 'Anura Perera',
    age: 45,
    gender: 'Male',
    testType: 'FBC + ESR',
    orderTime: 'Today, 08:45 AM',
    orderTimestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    specimenId: 'LNK-24901',
    status: 'PROCESSING',
    priority: 'Routine',
    wardOrDept: 'OPD Clinic A',
    notes: 'History of fatigue and intermittent low-grade fever.',
    phone: '+94 77 123 4567',
    email: 'anura.perera@mail.lk',
    suwasiriBarcode: 'SUWA-24901',
    connectedClinic: 'Kandy General Medical Clinic',
    results: [
      { parameter: 'Hemoglobin', value: '11.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: true },
      { parameter: 'White Blood Cells (WBC)', value: '10.2', unit: 'x10^9/L', referenceRange: '4.0 - 11.0', isAbnormal: false },
      { parameter: 'ESR (Sedimentation Rate)', value: '28', unit: 'mm/hr', referenceRange: '0 - 15', isAbnormal: true }
    ],
    documents: [
      {
        id: 'D1',
        fileName: 'FBC_ESR_Specimen_Receipt.pdf',
        fileSize: '450 KB',
        uploadedAt: 'Today, 08:47 AM',
        docType: 'SPECIMEN_RECEIPT',
        url: '#',
        isLinkedToGPCare: true,
        isLinkedToPatientApp: true
      }
    ]
  },
  {
    id: '2',
    patientName: 'Kamala Gunawardena',
    age: 62,
    gender: 'Female',
    testType: 'Cardiac Enzymes (Troponin)',
    orderTime: 'Today, 09:12 AM',
    orderTimestamp: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
    specimenId: 'LNK-24915',
    status: 'CRITICAL',
    priority: 'Critical',
    wardOrDept: 'Ward 4 (Cardiology)',
    notes: 'Acute sudden chest tightness with pain radiating to the left arm. Diabetic patient.',
    phone: '+94 71 888 9911',
    email: 'kamala.guna@gov.lk',
    suwasiriBarcode: 'SUWA-98210',
    connectedClinic: 'Colombo National Medical Clinic',
    results: [
      { parameter: 'Cardiac Troponin I', value: '2.54', unit: 'ng/mL', referenceRange: '< 0.04', isAbnormal: true },
      { parameter: 'CK-MB', value: '14.2', unit: 'ng/mL', referenceRange: '< 5.0', isAbnormal: true }
    ],
    documents: [
      {
        id: 'D2',
        fileName: 'Acute_Troponin_Assay_Report.pdf',
        fileSize: '680 KB',
        uploadedAt: 'Today, 09:30 AM',
        docType: 'LAB_REPORT',
        url: '#',
        parsedSummary: 'Troponin-I value of 2.54 ng/mL exceeds critical threshold indicating potential myocardial injury. Immediate cardiology review required.',
        isLinkedToGPCare: true,
        isLinkedToPatientApp: true
      },
      {
        id: 'D3',
        fileName: 'ECG_Attachment_Ward4.pdf',
        fileSize: '1.2 MB',
        uploadedAt: 'Today, 09:15 AM',
        docType: 'PRESCRIPTION',
        url: '#',
        isLinkedToGPCare: true,
        isLinkedToPatientApp: false
      }
    ]
  },
  {
    id: '3',
    patientName: 'Sunil Mendis',
    age: 53,
    gender: 'Male',
    testType: 'Lipid Profile',
    orderTime: 'Today, 07:30 AM',
    orderTimestamp: new Date(Date.now() - 9.5 * 60 * 60 * 1000), // 9.5 hours ago
    specimenId: 'LNK-24888',
    status: 'PENDING',
    priority: 'Routine',
    wardOrDept: 'Wellness Center',
    notes: 'Routine annual checkup. Fasting for 12 hours.',
    phone: '+94 70 543 2100',
    email: 'sunil.mendis@wellness.lk',
    suwasiriBarcode: 'SUWA-10294',
    connectedClinic: 'Nawala Preventive Health Center',
    documents: []
  },
  {
    id: '4',
    patientName: 'Dilani Rodrigo',
    age: 38,
    gender: 'Female',
    testType: 'HbA1c + Fasting Glucose',
    orderTime: 'Yesterday, 04:15 PM',
    orderTimestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    specimenId: 'LNK-24850',
    status: 'COMPLETED',
    priority: 'Routine',
    wardOrDept: 'Family Medicine',
    notes: 'Known pre-diabetes monitoring. Compliance reviews.',
    phone: '+94 72 999 1111',
    email: 'dilani.rodrigo@health.lk',
    suwasiriBarcode: 'SUWA-65408',
    connectedClinic: 'Ceylon Endocrine & Family Care',
    results: [
      { parameter: 'HbA1c', value: '6.4', unit: '%', referenceRange: '4.0 - 5.6', isAbnormal: true },
      { parameter: 'Fasting Plasma Glucose', value: '108', unit: 'mg/dL', referenceRange: '70 - 99', isAbnormal: true }
    ],
    documents: [
      {
        id: 'D4',
        fileName: 'HbA1c_Annual_Summary_2026.pdf',
        fileSize: '512 KB',
        uploadedAt: 'Yesterday, 05:00 PM',
        docType: 'LAB_REPORT',
        url: '#',
        parsedSummary: 'HbA1c shows borderline diabetic control (6.4%). Fasting glucose is slightly elevated at 108 mg/dL.',
        isLinkedToGPCare: true,
        isLinkedToPatientApp: true
      }
    ]
  },
  {
    id: '5',
    patientName: 'Mohamed Wazeer',
    age: 29,
    gender: 'Male',
    testType: 'Liver Function Test (LFT)',
    orderTime: 'Today, 09:55 AM',
    orderTimestamp: new Date(Date.now() - 6.5 * 60 * 60 * 1000), // 6.5 hours ago
    specimenId: 'LNK-24922',
    status: 'PENDING',
    priority: 'Routine',
    wardOrDept: 'Gastrology Outpatients',
    notes: 'Reviewing minor abdominal discomfort and medication clearance.',
    phone: '+94 77 987 6543',
    email: 'wazeer.med@gmail.lk',
    documents: []
  }
];

export const initialRoutes: CourierRoute[] = [
  {
    id: 'R1',
    routeName: 'CMC-04 (Colombo Central)',
    courierName: 'Nalin S.',
    courierPhone: '+94 77 123 4567',
    etaMinutes: 12,
    progressPercent: 75,
    totalSamples: 14,
    urgentSamples: 2,
    currentLocation: { lat: 6.9271, lng: 79.8612 }
  },
  {
    id: 'R2',
    routeName: 'KTY-02 (Kotte & Nawala)',
    courierName: 'Pradeep K.',
    courierPhone: '+94 77 987 6543',
    etaMinutes: 35,
    progressPercent: 40,
    totalSamples: 8,
    urgentSamples: 1,
    currentLocation: { lat: 6.9012, lng: 79.9074 }
  },
  {
    id: 'R3',
    routeName: 'KMW-09 (Kaduwela Express)',
    courierName: 'Ruwan D.',
    courierPhone: '+94 71 555 4321',
    etaMinutes: 5,
    progressPercent: 90,
    totalSamples: 22,
    urgentSamples: 4,
    currentLocation: { lat: 6.9389, lng: 79.9702 }
  }
];

export const initialNotifications: UrgentNotification[] = [
  {
    id: 'N1',
    type: 'CRITICAL',
    title: 'CRITICAL ALERT',
    message: 'Troponin result for Kamala Gunawardena (Ward 4) exceeds threshold. Immediate action required.',
    timeAgo: '2 mins ago',
    timestamp: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: 'N2',
    type: 'WARNING',
    title: 'SUPPLY LOW',
    message: 'Reagents for Lipid Profiling reaching critical levels. Auto-reorder triggered.',
    timeAgo: '45 mins ago',
    timestamp: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: 'N3',
    type: 'INFO',
    title: 'SYSTEM UPDATE',
    message: 'Portal maintenance scheduled for Sunday, 2:00 AM IST. Downtime: 15 mins.',
    timeAgo: '3 hours ago',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
];

export const testCatalogItems: TestCatalogItem[] = [
  // 1. Haematology & Blood Transfusion Sub-Department
  {
    code: 'FBC',
    name: 'Full Blood Count (FBC / CBC)',
    category: 'Hematology',
    subDepartment: 'Haematology & Blood Transfusion',
    specimenType: 'EDTA Whole Blood',
    containerColor: 'Lavender',
    turnaroundTime: '2-4 hours',
    referenceValue: 'WBC: 4.0-11.0 x10^9/L, RBC: 4.5-5.9 x10^12/L, Hb: 13.5-17.5 g/dL (M) / 12.0-15.5 g/dL (F), PLT: 150-400 x10^9/L',
    clinicalSignificance: 'Evaluates general biological state, screening for anemia, systemic infections, inflammatory states, and hematological malignancies.',
    specimenVolume: '3.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'FBC^FULL BLOOD COUNT^LN'
  },
  {
    code: 'COAG',
    name: 'Coagulation Screen (PT/INR, APTT, Fibrinogen)',
    category: 'Hematology',
    subDepartment: 'Haematology & Blood Transfusion',
    specimenType: 'Sodium Citrate (3.2%) Plasma',
    containerColor: 'Light Blue',
    turnaroundTime: '1-2 hours',
    referenceValue: 'PT: 11.0-13.5s, INR: 0.8-1.2 (Therapeutic 2.0-3.0), APTT: 25-35s, Fibrinogen: 2.0-4.0 g/L',
    clinicalSignificance: 'Pre-operative hemostatic assessment, anticoagulation (Warfarin/Heparin) monitoring, and diagnosis of coagulopathies and DIC.',
    specimenVolume: '2.7 mL (Exact fill required)',
    isClinicalTrialReady: true,
    hl7Code: 'COAG^COAGULATION PROFILE^LN'
  },
  {
    code: 'XM-GRP',
    name: 'Blood Group & Antibody Screen (Transfusion Safety)',
    category: 'Hematology',
    subDepartment: 'Haematology & Blood Transfusion',
    specimenType: 'EDTA Whole Blood (Pink top Transfusion Tube)',
    containerColor: 'Lavender',
    turnaroundTime: '45-90 mins',
    referenceValue: 'ABO/Rh(D) Typing verified; Atypical Red Cell Antibodies: NEGATIVE',
    clinicalSignificance: 'Critical blood transfusion compatibility testing and unexpected red cell antibody screening for planned surgeries and emergency crossmatch.',
    specimenVolume: '6.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'BGAS^BLOOD GROUP ANTIBODY^LN'
  },
  {
    code: 'D-DIMER',
    name: 'D-Dimer Quantitative Assay',
    category: 'Hematology',
    subDepartment: 'Haematology & Blood Transfusion',
    specimenType: 'Sodium Citrate Plasma',
    containerColor: 'Light Blue',
    turnaroundTime: '30-45 mins',
    referenceValue: '< 500 ng/mL FEU (Fibrinogen Equivalent Units)',
    clinicalSignificance: 'Rapid exclusion of deep vein thrombosis (DVT) and pulmonary embolism (PE); disseminated intravascular coagulation assessment.',
    specimenVolume: '2.7 mL',
    isClinicalTrialReady: true,
    hl7Code: 'DDIM^D-DIMER QUANT^LN'
  },
  {
    code: 'HEM-SICKLE',
    name: 'Sickle Cell & Hemoglobinopathy Screen (HPLC)',
    category: 'Hematology',
    subDepartment: 'Haematology & Blood Transfusion',
    specimenType: 'EDTA Whole Blood',
    containerColor: 'Lavender',
    turnaroundTime: '24-48 hours',
    referenceValue: 'HbA: 95-98%, HbA2: 1.5-3.5%, HbF: <1.0%, HbS/C/E variants: NOT DETECTED',
    clinicalSignificance: 'Detection of hemoglobin variants, Thalassemia traits, and Sickle Cell disease in accordance with NHS/SL National Screening protocols.',
    specimenVolume: '4.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'HEMV^HEMOGLOBINOPATHY^LN'
  },

  // 2. General Biochemistry & Endocrinology Sub-Department
  {
    code: 'TROP',
    name: 'High-Sensitivity Cardiac Troponin I / T',
    category: 'Biochemistry / Immunology',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum / Lithium Heparin Plasma',
    containerColor: 'Yellow (SST)',
    turnaroundTime: '25-40 mins',
    referenceValue: '< 0.04 ng/mL (99th percentile upper reference limit)',
    clinicalSignificance: 'Gold standard biomarker for myocardial necrosis, acute coronary syndrome (ACS), and acute myocardial infarction triage.',
    specimenVolume: '3.5 mL',
    isClinicalTrialReady: true,
    hl7Code: 'TROP^TROPONIN HIGH SENS^LN'
  },
  {
    code: 'KFT-UE',
    name: 'Renal Function Profile (U&Es, Creatinine, eGFR & Electrolytes)',
    category: 'Biochemistry',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum',
    containerColor: 'Yellow (SST)',
    turnaroundTime: '3-4 hours',
    referenceValue: 'Sodium: 135-145 mmol/L, Potassium: 3.5-5.0 mmol/L, Urea: 2.5-7.8 mmol/L, Creatinine: 59-104 µmol/L, eGFR: >90 mL/min/1.73m²',
    clinicalSignificance: 'Monitors renal clearance, glomerular filtration, hydration status, hypertension medications (ACEi/ARBs), and electrolyte balance.',
    specimenVolume: '4.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'UE^UREA AND ELECTROLYTES^LN'
  },
  {
    code: 'LFT',
    name: 'Liver Function Panel (LFT, Bilirubin, Enzymes & Albumin)',
    category: 'Biochemistry',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum',
    containerColor: 'Yellow (SST)',
    turnaroundTime: '3-4 hours',
    referenceValue: 'ALT: 7-56 U/L, AST: 10-40 U/L, ALP: 30-130 U/L, Total Bilirubin: 0.1-1.2 mg/dL, Albumin: 35-50 g/L, Total Protein: 60-80 g/L',
    clinicalSignificance: 'Screens for hepatic parenchymal damage, cholestasis, biliary obstruction, viral hepatitis, and metabolic synthesis integrity.',
    specimenVolume: '4.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'LFT^LIVER FUNCTION TESTS^LN'
  },
  {
    code: 'LIPID',
    name: 'Comprehensive Fasting Lipid Profile',
    category: 'Biochemistry',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum (10-12 hr fast recommended)',
    containerColor: 'Yellow (SST)',
    turnaroundTime: '4-6 hours',
    referenceValue: 'Total Cholesterol: <5.0 mmol/L, Triglycerides: <1.7 mmol/L, HDL: >1.0 mmol/L (M) / >1.2 mmol/L (F), LDL: <3.0 mmol/L',
    clinicalSignificance: 'Cardiovascular risk stratification, dyslipidemia identification, and assessment of statin therapy response.',
    specimenVolume: '4.0 mL',
    fastingRequired: true,
    isClinicalTrialReady: true,
    hl7Code: 'LIPID^LIPID PROFILE^LN'
  },
  {
    code: 'HBA1C',
    name: 'HbA1c & Glycated Hemoglobin (DCCT / IFCC)',
    category: 'Endocrinology',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'EDTA Whole Blood',
    containerColor: 'Lavender',
    turnaroundTime: '4-6 hours',
    referenceValue: 'IFCC: 20-42 mmol/mol (Normal), 42-47 mmol/mol (Pre-diabetic), ≥48 mmol/mol (Diagnostic of Diabetes)',
    clinicalSignificance: 'Assesses 3-month retrospective glycemic control for Diabetes Mellitus diagnosis and endocrinology treatment adjustment.',
    specimenVolume: '2.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'HBA1C^GLYCATED HEMOGLOBIN^LN'
  },
  {
    code: 'TFT',
    name: 'Thyroid Function Profile (TSH, Free T4, Free T3)',
    category: 'Endocrinology',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum',
    containerColor: 'Yellow (SST)',
    turnaroundTime: '6-12 hours',
    referenceValue: 'TSH: 0.27 - 4.20 mIU/L, Free T4: 12.0 - 22.0 pmol/L, Free T3: 3.1 - 6.8 pmol/L',
    clinicalSignificance: 'Diagnoses hypo- and hyperthyroidism, monitors levothyroxine titration, and pituitary-thyroid feedback axis.',
    specimenVolume: '3.5 mL',
    isClinicalTrialReady: true,
    hl7Code: 'TFT^THYROID FUNCTION TESTS^LN'
  },
  {
    code: 'TDM-DIG',
    name: 'Therapeutic Drug Monitoring: Digoxin & Lithium Assay',
    category: 'Biochemistry',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum (Non-gel Red top preferred)',
    containerColor: 'Red',
    turnaroundTime: '2-4 hours',
    referenceValue: 'Digoxin: 0.8 - 2.0 ng/mL, Lithium: 0.6 - 1.0 mmol/L (sample drawn 12h post-dose)',
    clinicalSignificance: 'Ensures therapeutic efficacy while guarding against toxicity in low therapeutic-index medications.',
    specimenVolume: '4.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'TDM^THERAPEUTIC DRUG MONITORING^LN'
  },
  {
    code: 'VIT-D',
    name: '25-Hydroxy Vitamin D Total (D2 + D3)',
    category: 'Endocrinology',
    subDepartment: 'General Biochemistry & Endocrinology',
    specimenType: 'Serum',
    containerColor: 'Yellow (SST)',
    turnaroundTime: '12-24 hours',
    referenceValue: '> 50 nmol/L (Adequate), 25-50 nmol/L (Insufficient), < 25 nmol/L (Deficient)',
    clinicalSignificance: 'Evaluates bone mineral metabolism, osteopenia/osteoporosis, and calcium homeostasis.',
    specimenVolume: '3.0 mL',
    isClinicalTrialReady: true,
    hl7Code: 'VITD^VITAMIN D TOTAL^LN'
  },

  // 3. Digital Pathology & Cellular Diagnostics (Medway / Regional Network Model)
  {
    code: 'WSI-DIGI',
    name: 'Whole Slide Imaging (WSI) Digital Telepathology',
    category: 'Cellular Pathology',
    subDepartment: 'Digital Pathology & Cellular Diagnostics',
    specimenType: 'Formalin-Fixed Paraffin-Embedded (FFPE) Slide',
    containerColor: 'Histology Cassette',
    turnaroundTime: '24-48 hours',
    referenceValue: 'Sub-micron 40x optical scan stored in Regional Kent/Medway & Colombo Digital Archive',
    clinicalSignificance: 'Enables real-time remote secondary consultation, automated algorithmic biomarker quantification, and regional multidisciplinary team (MDT) review.',
    specimenVolume: '1 Block / 2 Slides',
    isClinicalTrialReady: true,
    hl7Code: 'WSI^DIGITAL PATHOLOGY WSI^LN'
  },
  {
    code: 'HISTO-BX',
    name: 'Histopathology Biopsy & Microscopic Examination',
    category: 'Cellular Pathology',
    subDepartment: 'Digital Pathology & Cellular Diagnostics',
    specimenType: 'Biopsy tissue in 10% Neutral Buffered Formalin',
    containerColor: 'White Formalin Pot',
    turnaroundTime: '48-72 hours',
    referenceValue: 'Pathology diagnostic microscopic narrative & grading provided by Consultant Pathologist',
    clinicalSignificance: 'Definitive tissue diagnosis for suspected neoplastic lesions, chronic inflammatory diseases, and margin clearances.',
    specimenVolume: 'Tissue in 10x formalin volume',
    isClinicalTrialReady: true,
    hl7Code: 'HIST^HISTOPATHOLOGY EXAMINATION^LN'
  },

  // 4. Clinical Trial Specific Assays (Blinding Solutions & Protocol Exclusion)
  {
    code: 'TRI-PK01',
    name: 'Pharmacokinetics (PK/PD) Biomarker Protocol Assay',
    category: 'Clinical Trials',
    subDepartment: 'Clinical Trials & Protocol Testing',
    specimenType: 'Cold-Centrifuged EDTA Plasma (-80°C frozen)',
    containerColor: 'Lavender (Cryovial)',
    turnaroundTime: 'Protocol Scheduled',
    referenceValue: 'Blinded Protocol Output • Encrypted Transmission directly to Trial Sponsor CRO',
    clinicalSignificance: 'Evaluates investigational drug clearance and bio-availability with automatic protocol exclusion flagging.',
    specimenVolume: '1.0 mL aliquot x 2',
    isClinicalTrialReady: true,
    blindingEligible: true,
    hl7Code: 'PKPD^PHARMACOKINETICS TRIAL^LN'
  }
];

export const initialConsumables: ConsumableItem[] = [
  {
    id: 'C1',
    sku: 'BD-367861',
    name: 'BD Vacutainer K2-EDTA Tubes 3.0mL (Lavender Top)',
    category: 'TUBES',
    packSize: 'Box of 100 Tubes',
    inStock: true,
    unitPriceLkr: 4200,
    description: 'Siliconized glass tubes containing dipotassium EDTA additive for routine hematology & blood banking.'
  },
  {
    id: 'C2',
    sku: 'BD-367955',
    name: 'BD Vacutainer SST II Advance Gold/Yellow Gel 4.0mL',
    category: 'TUBES',
    packSize: 'Box of 100 Tubes',
    inStock: true,
    unitPriceLkr: 4850,
    description: 'Polymer gel separator with silica clot activator for biochemistry and serology determinations.'
  },
  {
    id: 'C3',
    sku: 'BD-363083',
    name: 'BD Vacutainer Sodium Citrate 3.2% 2.7mL (Light Blue Top)',
    category: 'TUBES',
    packSize: 'Box of 100 Tubes',
    inStock: true,
    unitPriceLkr: 4600,
    description: 'Buffered sodium citrate 0.109M for coagulation screening and platelet studies.'
  },
  {
    id: 'C4',
    sku: 'BD-367282',
    name: 'BD Vacutainer Safety-Lok Blood Collection Set 21G (Butterfly)',
    category: 'NEEDLES',
    packSize: 'Box of 50 Sets',
    inStock: true,
    unitPriceLkr: 6500,
    description: 'Safety-shielded butterfly needle with integrated luer adapter for gentle venipuncture.'
  },
  {
    id: 'C5',
    sku: 'BIO-BAG-09',
    name: 'Secondary Biohazard Specimen Transport Bags (Zip-Lock with Document Pouch)',
    category: 'BIOHAZARD',
    packSize: 'Pack of 500 Bags',
    inStock: true,
    unitPriceLkr: 3200,
    description: 'Heavy duty polyethylene compliant with UN3373 Biological Substance Category B transport.'
  },
  {
    id: 'C6',
    sku: 'THERM-LBL-50',
    name: 'Zebra Specimen Barcode Thermal Labels (50mm x 25mm)',
    category: 'TUBES',
    packSize: 'Roll of 1000 Labels',
    inStock: true,
    unitPriceLkr: 1850,
    description: 'Cryo-compatible thermal adhesive labels formatted for LankaLab and Suwasiri barcode standards.'
  },
  {
    id: 'C7',
    sku: 'VAX-INF-01',
    name: 'Quadrivalent Influenza Vaccine (VaxigripTetra 0.5mL Pre-filled Syringes)',
    category: 'VACCINES',
    packSize: 'Pack of 10 Doses (Cold Chain 2-8°C)',
    inStock: true,
    unitPriceLkr: 34500,
    description: 'Northern/Southern hemisphere WHO compliant quadrivalent seasonal influenza vaccine.',
    isVaccine: true
  },
  {
    id: 'C8',
    sku: 'SWAB-UTM-02',
    name: 'Universal Viral Transport Swabs (UTM with Flocked Swab)',
    category: 'SWABS',
    packSize: 'Box of 50 Kits',
    inStock: true,
    unitPriceLkr: 5200,
    description: 'Transport medium for viral culture, rapid antigens, and molecular PCR respiratory diagnostic testing.'
  }
];

export const initialMQLinkRecords: MQLinkRecord[] = [
  {
    id: 'MQL-9901',
    patientName: 'Anura Perera',
    dob: '1979-05-12',
    doctorName: 'Dr. Sunil Wickramasinghe',
    clinicName: 'Colombo Family Medical Practice',
    testName: 'Full Blood Count + Renal Profile',
    reportedAt: 'Today, 08:30 AM',
    status: 'DELIVERED',
    hl7MessageId: 'MSG-LK-2024-88401',
    auditTrack: [
      '08:15:22 - Specimen verified on Sysmex XN-550',
      '08:25:10 - Pathologist signature token attached (Dr. Jayasuriya)',
      '08:30:00 - Encrypted PIT package uploaded to MQLink Gateway',
      '08:30:04 - Acknowledged (ACK) by Best Practice PMS node #BP-COL-12'
    ],
    fileFormat: 'HL7 v2.4'
  },
  {
    id: 'MQL-9902',
    patientName: 'Kamala Jayawardena',
    dob: '1962-11-04',
    doctorName: 'Dr. K. L. Fernando',
    clinicName: 'Kandy Road Medical Center',
    testName: 'Cardiac Troponin I (High-Sensitivity)',
    reportedAt: 'Today, 09:12 AM',
    status: 'FLAGGED',
    hl7MessageId: 'MSG-LK-2024-88419',
    auditTrack: [
      '08:50:00 - STAT Specimen processed on Beckman AU480',
      '09:05:14 - Panic Threshold Triggered: Value 0.12 ng/mL (>0.04)',
      '09:08:30 - Emergency SMS dispatch to Ordering Physician (+94 77 000 1122)',
      '09:12:00 - Flagged HL7 ORU_R01 message imported to clinic EHR'
    ],
    fileFormat: 'HL7 v2.4'
  },
  {
    id: 'MQL-9903',
    patientName: 'Priyantha Bandara',
    dob: '1988-02-28',
    doctorName: 'Dr. Nilmini Ratnayake',
    clinicName: 'Moratuwa Community Clinic',
    testName: 'Lipid Profile + HbA1c Glycated Hemoglobin',
    reportedAt: 'Today, 09:45 AM',
    status: 'IMPORTED',
    hl7MessageId: 'MSG-LK-2024-88432',
    auditTrack: [
      '09:30:10 - Analyzer batch approved',
      '09:40:00 - Secure PDF and Structured HL7 generated',
      '09:45:12 - Auto-imported into MedicalDirector Practice Ledger'
    ],
    fileFormat: 'PIT Encrypted'
  },
  {
    id: 'MQL-9904',
    patientName: 'Fatima Rizvi',
    dob: '1995-09-15',
    doctorName: 'Dr. S. K. Al-Mansoor',
    clinicName: 'Wellawatte Medicare Center',
    testName: 'Thyroid Function Profile (TSH, FT4, FT3)',
    reportedAt: 'Today, 10:15 AM',
    status: 'AUDITED',
    hl7MessageId: 'MSG-LK-2024-88450',
    auditTrack: [
      '10:00:22 - Cobas e411 ECLIA verified',
      '10:12:05 - Compliance checksum SHA-256 confirmed',
      '10:15:00 - Downloaded and filed in patient electronic chart'
    ],
    fileFormat: 'PDF (Secured)'
  }
];

export const initialTrialProtocols: ClinicalTrialProtocol[] = [
  {
    protocolId: 'TRI-ONCO-2024-01',
    trialTitle: 'Phase III Randomized Study of Adjuvant Immunotherapy in Advanced Solid Tumors',
    sponsor: 'AstraZeneca Clinical Trials / Ceylon Oncology Consortium',
    phase: 'Phase III',
    blindingEnabled: true,
    exclusionCriteria: [
      'Platelet count < 100 x10^9/L',
      'Serum Creatinine > 1.5x ULN (>156 µmol/L)',
      'Total Bilirubin > 2.0 mg/dL',
      'Cardiac Troponin > 0.04 ng/mL'
    ],
    activeSubjects: 48,
    criticalFlaggedCount: 2,
    targetAssays: ['FBC', 'KFT-UE', 'LFT', 'TRI-PK01']
  },
  {
    protocolId: 'TRI-METAB-2024-08',
    trialTitle: 'Cardiovascular Outcome Trial for Novel Dual GLP-1/GIP Receptor Agonist',
    sponsor: 'Novo Nordisk Clinical Development Network',
    phase: 'Phase IIb',
    blindingEnabled: true,
    exclusionCriteria: [
      'HbA1c > 10.5% (91 mmol/mol) or < 6.5%',
      'eGFR < 30 mL/min/1.73m²',
      'Fasting Triglycerides > 5.7 mmol/L (>500 mg/dL)'
    ],
    activeSubjects: 72,
    criticalFlaggedCount: 1,
    targetAssays: ['HBA1C', 'LIPID', 'KFT-UE']
  }
];

export const initialSupplementaryRequests: SupplementaryTestRequest[] = [
  {
    id: 'SUP-401',
    orderId: '1',
    testName: 'Serum Ferritin & Iron Studies',
    requestedBy: 'Dr. Sunil Wickramasinghe (General Practitioner)',
    clinicalReason: 'Mild microcytic anemia detected on morning FBC (Hb 11.8). Clarify iron deficiency status from existing EDTA/Serum aliquot.',
    specimenId: 'LNK-24901',
    tubeColor: 'Gold SST (Serum in Lab Fridge #2)',
    status: 'IN_PROCESSING',
    requestedAt: 'Today, 10:15 AM'
  },
  {
    id: 'SUP-402',
    orderId: '2',
    testName: 'NT-proBNP (Heart Failure Marker)',
    requestedBy: 'Dr. M. S. Jayasinghe (Cardiologist)',
    clinicalReason: 'Critical Troponin I (2.54 ng/mL). Patient exhibiting bibasilar crackles; rule out acute cardiac decompensation.',
    specimenId: 'LNK-24915',
    tubeColor: 'Lavender EDTA (Hematology Rack A3)',
    status: 'LAB_CONFIRMED',
    requestedAt: 'Today, 10:45 AM'
  },
  {
    id: 'SUP-403',
    orderId: '3',
    testName: 'High-Sensitivity CRP (hs-CRP)',
    requestedBy: 'Dr. K. L. Fernando (Physician)',
    clinicalReason: 'Elevated fasting triglycerides and borderline LDL. Assess 10-year vascular inflammatory risk.',
    specimenId: 'LNK-24888',
    tubeColor: 'Gold SST (Biochemistry Automated Cold Archive)',
    status: 'COMPLETED',
    requestedAt: 'Today, 09:20 AM'
  }
];

export const initialQuickShareLogs: QuickShareLog[] = [
  {
    id: 'QSH-881',
    orderId: '2',
    patientName: 'Kamala Gunawardena',
    sharedWith: 'Dr. Nalin Perera',
    recipientRole: 'Interventional Cardiologist (Cath Lab)',
    shareMethod: 'MDT_PANEL',
    expiryHours: 24,
    sharedAt: 'Today, 09:35 AM',
    passcodeProtected: true,
    notes: 'Urgent referral for coronary angiography. STAT Troponin I elevation 2.54 ng/mL with lateral ST depression.',
    accessCount: 3
  },
  {
    id: 'QSH-882',
    orderId: '1',
    patientName: 'Anura Perera',
    sharedWith: 'Dr. Chamari Abeyratne',
    recipientRole: 'Consultant Hematologist (Kandy Hospital)',
    shareMethod: 'DIRECT_PRACTITIONER',
    expiryHours: 48,
    sharedAt: 'Today, 10:00 AM',
    passcodeProtected: true,
    notes: 'MDT Review: Persistent unexplained ESR elevation (28 mm/hr) alongside mild microcytosis.',
    accessCount: 1
  }
];

export const initialCumulativeHistories: { [patientName: string]: CumulativeParameterHistory[] } = {
  'Anura Perera': [
    {
      parameter: 'Hemoglobin',
      unit: 'g/dL',
      referenceRange: '13.5 - 17.5',
      history: [
        { date: '6 Mos Ago (12 Mar 2024)', visitLabel: 'Routine Check', numericValue: 14.2, displayValue: '14.2', isAbnormal: false },
        { date: '3 Mos Ago (14 Jun 2024)', visitLabel: 'Follow-up', numericValue: 13.1, displayValue: '13.1', isAbnormal: true, notes: 'Borderline drop' },
        { date: 'Today (05 Sep 2026)', visitLabel: 'Current Assay', numericValue: 11.8, displayValue: '11.8', isAbnormal: true, notes: 'Microcytic trend' }
      ]
    },
    {
      parameter: 'ESR (Sedimentation Rate)',
      unit: 'mm/hr',
      referenceRange: '0 - 15',
      history: [
        { date: '6 Mos Ago (12 Mar 2024)', visitLabel: 'Routine Check', numericValue: 8, displayValue: '8', isAbnormal: false },
        { date: '3 Mos Ago (14 Jun 2024)', visitLabel: 'Follow-up', numericValue: 14, displayValue: '14', isAbnormal: false },
        { date: 'Today (05 Sep 2026)', visitLabel: 'Current Assay', numericValue: 28, displayValue: '28', isAbnormal: true, notes: 'Acute elevation' }
      ]
    },
    {
      parameter: 'Serum Creatinine',
      unit: 'µmol/L',
      referenceRange: '59 - 104',
      history: [
        { date: '6 Mos Ago (12 Mar 2024)', visitLabel: 'Routine Check', numericValue: 82, displayValue: '82', isAbnormal: false },
        { date: '3 Mos Ago (14 Jun 2024)', visitLabel: 'Follow-up', numericValue: 85, displayValue: '85', isAbnormal: false },
        { date: 'Today (05 Sep 2026)', visitLabel: 'Current Assay', numericValue: 88, displayValue: '88', isAbnormal: false }
      ]
    }
  ],
  'Kamala Gunawardena': [
    {
      parameter: 'Cardiac Troponin I',
      unit: 'ng/mL',
      referenceRange: '< 0.04',
      history: [
        { date: '1 Year Ago (Annual Check)', visitLabel: 'Cardiology Baseline', numericValue: 0.01, displayValue: '< 0.01', isAbnormal: false },
        { date: 'Today, 06:00 AM (ER Admission)', visitLabel: 'ER Triage Initial', numericValue: 0.45, displayValue: '0.45', isAbnormal: true, notes: 'STAT Alert' },
        { date: 'Today, 09:12 AM (3-Hour Serial)', visitLabel: 'Delta Kinetics Assay', numericValue: 2.54, displayValue: '2.54', isAbnormal: true, notes: 'Definitive STEMI kinetic surge' }
      ]
    },
    {
      parameter: 'eGFR',
      unit: 'mL/min/1.73m²',
      referenceRange: '> 60',
      history: [
        { date: '1 Year Ago', visitLabel: 'Cardiology Baseline', numericValue: 74, displayValue: '74', isAbnormal: false },
        { date: 'Today, 09:12 AM', visitLabel: 'Acute Episode', numericValue: 52, displayValue: '52', isAbnormal: true, notes: 'Cardiorenal decline' }
      ]
    }
  ],
  'Sunil Mendis': [
    {
      parameter: 'Total Cholesterol',
      unit: 'mmol/L',
      referenceRange: '< 5.2',
      history: [
        { date: '9 Mos Ago (Dec 2023)', visitLabel: 'Baseline', numericValue: 6.8, displayValue: '6.8', isAbnormal: true },
        { date: '3 Mos Ago (Jun 2024)', visitLabel: 'Statin Rx 20mg', numericValue: 5.6, displayValue: '5.6', isAbnormal: true },
        { date: 'Today (05 Sep 2026)', visitLabel: 'Current Lipid Review', numericValue: 4.9, displayValue: '4.9', isAbnormal: false, notes: 'Target achieved' }
      ]
    },
    {
      parameter: 'HbA1c',
      unit: '%',
      referenceRange: '< 5.7',
      history: [
        { date: '9 Mos Ago (Dec 2023)', visitLabel: 'Baseline', numericValue: 7.2, displayValue: '7.2', isAbnormal: true },
        { date: '3 Mos Ago (Jun 2024)', visitLabel: 'Metformin Rx', numericValue: 6.8, displayValue: '6.8', isAbnormal: true },
        { date: 'Today (05 Sep 2026)', visitLabel: 'Current Glycemic Review', numericValue: 6.4, displayValue: '6.4', isAbnormal: true, notes: 'Substantial improvement' }
      ]
    }
  ]
};

export const initialTrialWorkflowSteps: TrialWorkflowStep[] = [
  {
    stepNumber: 1,
    title: 'Protocol & Subject Verification',
    instruction: 'Scan subject barcode, verify ICF (Informed Consent Form) signature timestamp, and confirm Protocol Visit Code (e.g. Visit 03 - Day 14 Adjuvant Arm).',
    tubeDetails: 'Digital study accession manifest generated. Pre-printed manual test kits bypassed.',
    requiredVolume: 'N/A',
    status: 'COMPLETED'
  },
  {
    stepNumber: 2,
    title: 'Protocol-Guided Order of Draw',
    instruction: 'Execute phlebotomy according to strict protocol draw sequence: 1st Light Blue Citrate (2.7mL), 2nd Gold SST (5.0mL), 3rd Lavender EDTA (3.0mL).',
    tubeDetails: 'BD Vacutainer Protocol Pack (Lot #VP-2024-884)',
    requiredVolume: '10.7 mL Total',
    inversions: '8 gentle inversions immediately post-collection. Do not shake.',
    status: 'COMPLETED'
  },
  {
    stepNumber: 3,
    title: 'Clotting & Pre-Centrifugation Hold',
    instruction: 'Keep Gold SST vertical at controlled ambient temperature (20-25°C) for strict 30-minute clotting period before rotor entry.',
    tubeDetails: 'Serum Clot Activator Tube',
    requiredVolume: '5.0 mL',
    inversions: 'Active countdown timer: 00:00 (Complete)',
    status: 'COMPLETED'
  },
  {
    stepNumber: 4,
    title: 'Refrigerated Centrifugation',
    instruction: 'Spin specimen in refrigerated swing-out rotor centrifuge at 2,000 x g for 15 minutes at exactly 4°C ± 1°C.',
    tubeDetails: 'Thermo Scientific Sorvall X4R centrifuge with calibrated digital temperature logger',
    requiredVolume: 'All collected tubes',
    centrifugeSpecs: '2,000 RCF | 15 mins | 4°C',
    status: 'ACTIVE'
  },
  {
    stepNumber: 5,
    title: 'Cryo-Aliquot & -80°C Biobank Archiving',
    instruction: 'Pipette clear serum and plasma into 4x 1.0mL sterile cryo-vials. Apply on-demand 2D DataMatrix cryo-labels. Transfer to Liquid Nitrogen or -80°C ultra-low freezer Rack #B-14 within 60 minutes.',
    tubeDetails: 'Cryo.s 2mL internal thread tubes with leak-proof silicone gasket',
    requiredVolume: '4x 1.0 mL aliquots',
    storageTarget: 'Freezer ULT-04 (Rack B-14, Box 3, Pos 1-4)',
    status: 'PENDING'
  }
];

export const initialTrialInvoices: TrialFinancialInvoice[] = [
  {
    invoiceId: 'INV-CT-2024-0091',
    protocolId: 'TRI-ONCO-2024-01',
    sponsor: 'AstraZeneca Clinical Trials / Ceylon Oncology Consortium',
    billingPeriod: 'August 2026 - Monthly Volume Cycle',
    items: [
      { serviceCode: 'CT-VISIT-SCR', description: 'Protocol Subject Screening Lab Battery (FBC, KFT, LFT, Coag)', unitsProcessed: 14, unitPriceLkr: 18500, subtotalLkr: 259000 },
      { serviceCode: 'CT-VISIT-C1D1', description: 'Cycle 1 Day 1 Biomarker Panel & Pharmacokinetics (PK) Aliquot', unitsProcessed: 18, unitPriceLkr: 24000, subtotalLkr: 432000 },
      { serviceCode: 'CT-CRYO-STOR', description: 'Ultra-low (-80°C) Specimen Biobank Cold-Chain Storage & Maintenance (Monthly fee)', unitsProcessed: 128, unitPriceLkr: 850, subtotalLkr: 108800 },
      { serviceCode: 'CT-EXP-LOG', description: 'Direct Dry-Ice Hazardous Airway Courier Transfer (Central Lab Singapore)', unitsProcessed: 2, unitPriceLkr: 65000, subtotalLkr: 130000 }
    ],
    totalLkr: 929800,
    status: 'DISPATCHED_TO_SPONSOR',
    generatedAt: '01 Sep 2026',
    dueDate: '30 Sep 2026'
  },
  {
    invoiceId: 'INV-CT-2024-0092',
    protocolId: 'TRI-METAB-2024-08',
    sponsor: 'Novo Nordisk Clinical Development Network',
    billingPeriod: 'August 2026 - Monthly Volume Cycle',
    items: [
      { serviceCode: 'CT-METAB-BAS', description: 'Baseline Metabolic Evaluation (Lipid, HbA1c, hs-CRP, U&E)', unitsProcessed: 26, unitPriceLkr: 16200, subtotalLkr: 421200 },
      { serviceCode: 'CT-GLP1-ASSAY', description: 'Specialized High-Sensitivity GLP-1 Receptor Kinetic Bioassay', unitsProcessed: 22, unitPriceLkr: 29500, subtotalLkr: 649000 },
      { serviceCode: 'CT-CRYO-STOR', description: 'Ultra-low (-80°C) Specimen Biobank Storage Aliquots', unitsProcessed: 88, unitPriceLkr: 850, subtotalLkr: 74800 }
    ],
    totalLkr: 1145000,
    status: 'AUDITED_AND_PAID',
    generatedAt: '25 Aug 2026',
    dueDate: '25 Sep 2026'
  }
];


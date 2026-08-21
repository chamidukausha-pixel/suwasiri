export interface PathologyInvestigation {
  name: string;
  category: string;
  sample: "Blood" | "Urinal" | "Both Blood & Urinal";
}

/** Shared Test / Investigation Profile used in Pathology and Sample Dispatch Hub. */
export const PATHOLOGY_INVESTIGATIONS: PathologyInvestigation[] = [
  { name: "Full Blood Count (FBC) + Differential", category: "Haematology", sample: "Blood" },
  { name: "ESR (Erythrocyte Sedimentation Rate)", category: "Haematology", sample: "Blood" },
  { name: "Blood Film / Peripheral Smear", category: "Haematology", sample: "Blood" },
  { name: "HbA1c Glycated Hemoglobin", category: "Diabetes", sample: "Blood" },
  { name: "Fasting Blood Glucose (FBG)", category: "Diabetes", sample: "Blood" },
  { name: "Random Blood Glucose", category: "Diabetes", sample: "Blood" },
  { name: "Oral Glucose Tolerance Test (OGTT)", category: "Diabetes", sample: "Blood" },
  { name: "Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)", category: "Biochemistry", sample: "Blood" },
  { name: "Renal Function Tests (Urea, Creatinine, eGFR)", category: "Biochemistry", sample: "Blood" },
  { name: "Liver Function Tests (ALT, AST, ALP, Bilirubin)", category: "Biochemistry", sample: "Blood" },
  { name: "Serum Electrolytes (Na, K, Cl)", category: "Biochemistry", sample: "Blood" },
  { name: "Serum Uric Acid", category: "Biochemistry", sample: "Blood" },
  { name: "Thyroid Function (TSH, Free T4)", category: "Endocrine", sample: "Blood" },
  { name: "Serum Ferritin & Iron Studies", category: "Haematology", sample: "Blood" },
  { name: "Vitamin D (25-OH)", category: "Biochemistry", sample: "Blood" },
  { name: "Vitamin B12 & Folate", category: "Biochemistry", sample: "Blood" },
  { name: "CRP (C-Reactive Protein)", category: "Inflammation", sample: "Blood" },
  { name: "Dengue NS1 Antigen", category: "Infectious", sample: "Blood" },
  { name: "Dengue IgM / IgG", category: "Infectious", sample: "Blood" },
  { name: "Malaria Parasite Smear", category: "Infectious", sample: "Blood" },
  { name: "COVID-19 RT-PCR", category: "Infectious", sample: "Blood" },
  { name: "Hepatitis B Surface Antigen (HBsAg)", category: "Infectious", sample: "Blood" },
  { name: "HIV 1/2 Screening", category: "Infectious", sample: "Blood" },
  { name: "Urine Full Report (UFR)", category: "Urine", sample: "Urinal" },
  { name: "Urine Culture & ABST", category: "Microbiology", sample: "Urinal" },
  { name: "Urine Microalbumin / ACR", category: "Renal", sample: "Urinal" },
  { name: "Urine Pregnancy Test (hCG)", category: "Urine", sample: "Urinal" },
  { name: "Stool Occult Blood (FOBT)", category: "Microbiology", sample: "Both Blood & Urinal" },
  { name: "PSA (Prostate Specific Antigen)", category: "Oncology", sample: "Blood" },
  { name: "Cervical Screening Test (CST - HPV)", category: "Screening", sample: "Both Blood & Urinal" },
];

export function sampleCategoryForTest(testName: string): PathologyInvestigation["sample"] {
  const found = PATHOLOGY_INVESTIGATIONS.find((t) => t.name === testName);
  if (found) return found.sample;
  const lower = testName.toLowerCase();
  if (lower.includes("urine") || lower.includes("ufr")) return "Urinal";
  if (lower.includes("stool") || lower.includes("cervical")) return "Both Blood & Urinal";
  return "Blood";
}

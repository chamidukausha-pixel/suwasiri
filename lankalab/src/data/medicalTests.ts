export type MedicalDept =
  | "LAB"
  | "USG"
  | "DIGITAL XRAY"
  | "XRAY"
  | "OUTSOURCE LAB"
  | "ECG"
  | "CT SCAN"
  | "MRI"
  | "EPS"
  | "OPG"
  | "CARDIOLOGY"
  | "EEG"
  | "MAMMOGRAPHY";

export type FormulaId = "abs-neu" | "abs-lym" | "abs-eos" | "abs-mono" | "abs-bas" | "nlr";

export type Param = {
  id: string;
  name: string;
  unit: string;
  ref: string;
  indent?: boolean;
  formula?: FormulaId;
  formulaExpr?: string;
};

export type Panel = { department: string; title: string; params: Param[] };

export type MedicalTest = {
  code: string;
  fullForm: string;
  purpose: string;
  billName: string;
  dept: MedicalDept;
  fee: number;
  aliases?: string[];
  panel?: "CBC" | "KFT" | "LFT" | "DLC";
  params: Param[];
};

const p = (id: string, name: string, unit: string, ref: string, extra?: Partial<Param>): Param => ({
  id,
  name,
  unit,
  ref,
  ...extra,
});

export const CBC_PANEL: Panel = {
  department: "HAEMATOLOGY",
  title: "CBC (WITH ABSOLUTE COUNTS)",
  params: [
    p("hb", "Hemoglobin", "g/dl", "12 - 15"),
    p("esr", "ESR", "mm/hr", "0 - 15"),
    p("tlc", "Total Leukocyte Count", "cumm", "4,800 - 10,800"),
    p("diff", "Differential Leukocyte Count", "", ""),
    p("neu", "Neutrophils", "%", "40 - 80", { indent: true }),
    p("lym", "Lymphocyte", "%", "20 - 40", { indent: true }),
    p("eos", "Eosinophils", "%", "1 - 6", { indent: true }),
    p("mono", "Monocytes", "%", "2 - 10", { indent: true }),
    p("bas", "Basophils", "%", "< 2", { indent: true }),
    p("diff-abs", "Differential Leukocyte Count (Absolute count)", "", ""),
    p("abs-neu", "Neutrophils", "x10^3/µL", "2 - 7", { indent: true, formula: "abs-neu", formulaExpr: "(TLC × Neutrophils %) ÷ 100 ÷ 1000" }),
    p("abs-lym", "Lymphocytes", "x10^3/µL", "1 - 3", { indent: true, formula: "abs-lym", formulaExpr: "(TLC × Lymphocyte %) ÷ 100 ÷ 1000" }),
    p("abs-eos", "Eosinophils", "x10^3/µL", "0.02 - 0.5", { indent: true, formula: "abs-eos", formulaExpr: "(TLC × Eosinophils %) ÷ 100 ÷ 1000" }),
    p("abs-mono", "Monocytes", "x10^3/µL", "0.1 - 1", { indent: true, formula: "abs-mono", formulaExpr: "(TLC × Monocytes %) ÷ 100 ÷ 1000" }),
    p("abs-bas", "Basophils", "x10^3/µL", "0.02 - 0.1", { indent: true, formula: "abs-bas", formulaExpr: "(TLC × Basophils %) ÷ 100 ÷ 1000" }),
    p("nlr", "Neutrophil Lymphocyte Ratio", "ratio", "", { formula: "nlr", formulaExpr: "Neutrophils % ÷ Lymphocyte %" }),
    p("plt", "Platelet Count", "lakhs/cumm", "1.5 - 4.1"),
    p("rbc", "Total RBC Count", "million/cumm", "3.9 - 4.8"),
    p("hct", "Hematocrit Value, HCT", "%", "36 - 46"),
    p("mcv", "Mean Corpuscular Volume, MCV", "fL", "83 - 101"),
    p("rdw-cv", "R.D.W. - CV (Optional)", "%", "11.6 - 14"),
    p("rdw-sd", "R.D.W. - SD (Optional)", "fL", "39 - 46"),
  ],
};

export const DLC_PANEL: Panel = {
  department: "HAEMATOLOGY",
  title: "DLC (DIFFERENTIAL LEUKOCYTE COUNT)",
  params: CBC_PANEL.params.filter((x) =>
    ["diff", "neu", "lym", "eos", "mono", "bas", "diff-abs", "abs-neu", "abs-lym", "abs-eos", "abs-mono", "abs-bas", "nlr", "tlc"].includes(x.id)
  ),
};

export const KFT_PANEL: Panel = {
  department: "BIOCHEMISTRY",
  title: "KIDNEY / RENAL FUNCTION TEST",
  params: [
    p("bun", "BUN", "mg/dl", "7.9 - 20"),
    p("urea", "Serum Urea", "mg/dl", "13 - 40"),
    p("creat", "Serum Creatinine", "mg/dl", "0.55 - 1.02"),
    p("ca", "Serum Calcium", "mg/dl", "8.8 - 10.6"),
    p("k", "Serum Potassium", "mmol/L", "3.5 - 5.1"),
    p("na", "Serum Sodium", "mmol/L", "136 - 146"),
  ],
};

export const LFT_PANEL: Panel = {
  department: "BIOCHEMISTRY",
  title: "LIVER FUNCTION TEST",
  params: [
    p("ast", "AST (SGOT)", "U/L", "0 - 40"),
    p("alt", "ALT (SGPT)", "U/L", "0 - 41"),
    p("alp", "Alkaline Phosphatase", "U/L", "40 - 129"),
    p("bili-t", "Total Bilirubin", "mg/dl", "0.1 - 1.2"),
    p("alb", "Albumin", "g/dl", "3.5 - 5.2"),
  ],
};

function test(
  code: string,
  fullForm: string,
  purpose: string,
  dept: MedicalDept,
  fee: number,
  params: Param[],
  extra?: Partial<Pick<MedicalTest, "aliases" | "panel">>
): MedicalTest {
  return {
    code,
    fullForm,
    purpose,
    billName: `${code} (${fullForm})`,
    dept,
    fee,
    params,
    ...extra,
  };
}

/** English-only medical tests from the abbreviation chart. */
export const MEDICAL_TESTS: MedicalTest[] = [
  test("CBC", "Complete Blood Count", "Blood cell count", "LAB", 500, CBC_PANEL.params, { panel: "CBC", aliases: ["FBC", "Full Blood Count", "CBC (with absolute counts)", "FBC + ESR"] }),
  test("Hb", "Hemoglobin", "Oxygen-carrying protein", "LAB", 250, [p("hb", "Hemoglobin", "g/dl", "12 - 15")], { aliases: ["Hemoglobin", "Hb level"] }),
  test("TLC", "Total Leukocyte Count", "White blood cell count", "LAB", 250, [p("tlc", "Total Leukocyte Count", "cumm", "4,800 - 10,800")], { aliases: ["WBC", "White Blood Cells"] }),
  test("DLC", "Differential Leukocyte Count", "White cell types", "LAB", 300, DLC_PANEL.params, { panel: "DLC", aliases: ["Differential Count"] }),
  test("ESR", "Erythrocyte Sedimentation Rate", "Inflammation marker", "LAB", 200, [p("esr", "ESR", "mm/hr", "0 - 15")], { aliases: ["Sedimentation Rate"] }),
  test("CRP", "C-Reactive Protein", "Inflammation protein", "LAB", 900, [p("crp", "C-Reactive Protein", "mg/L", "< 5")]),
  test("PCT", "Procalcitonin", "Sepsis marker", "LAB", 3500, [p("pct", "Procalcitonin", "ng/mL", "< 0.05")], { aliases: ["PCCT"] }),
  test("RBS", "Random Blood Sugar", "Random glucose", "LAB", 200, [p("rbs", "Random Blood Sugar", "mg/dl", "70 - 140")]),
  test("FBS", "Fasting Blood Sugar", "Fasting glucose", "LAB", 200, [p("fbs", "Fasting Blood Sugar", "mg/dl", "70 - 99")], { aliases: ["Fasting Plasma Glucose", "Fasting Glucose"] }),
  test("PPBS", "Postprandial Blood Sugar", "After-meal glucose", "LAB", 200, [p("ppbs", "Postprandial Blood Sugar", "mg/dl", "< 140")]),
  test("HbA1c", "Glycated Hemoglobin", "3-month average sugar", "LAB", 1800, [p("hba1c", "HbA1c", "%", "4.0 - 5.6")], { aliases: ["Glycated Hemoglobin", "HbA1c + Fasting Glucose"] }),
  test("LFT", "Liver Function Test", "Liver enzymes", "LAB", 4000, LFT_PANEL.params, { panel: "LFT", aliases: ["Liver Function Test (LFT)"] }),
  test("KFT", "Kidney Function Test", "Kidney function", "LAB", 3500, KFT_PANEL.params, { panel: "KFT", aliases: ["KFT without eGFR"] }),
  test("RFT", "Renal Function Test", "Kidney function", "LAB", 3500, KFT_PANEL.params, { panel: "KFT" }),
  test("BUN", "Blood Urea Nitrogen", "Kidney function", "LAB", 400, [p("bun", "BUN", "mg/dl", "7.9 - 20")]),
  test("Creatinine", "Serum Creatinine", "Kidney waste", "LAB", 400, [p("creat", "Serum Creatinine", "mg/dl", "0.55 - 1.02")], { aliases: ["Serum Creatinine"] }),
  test(
    "Lipid",
    "Lipid Profile",
    "Blood fats",
    "LAB",
    3200,
    [
      p("chol", "Total Cholesterol", "mg/dl", "< 200"),
      p("trig", "Triglycerides", "mg/dl", "< 150"),
      p("hdl", "HDL Cholesterol", "mg/dl", "> 40"),
      p("ldl", "LDL Cholesterol", "mg/dl", "< 100"),
    ],
    { aliases: ["Lipid Profile"] }
  ),
  test("PT", "Prothrombin Time", "Clotting time", "LAB", 700, [p("pt", "Prothrombin Time", "seconds", "11.0 - 13.5")]),
  test("INR", "International Normalized Ratio", "Warfarin monitoring", "LAB", 700, [p("inr", "INR", "ratio", "0.8 - 1.2")]),
  test("APTT", "Activated Partial Thromboplastin Time", "Clotting time", "LAB", 800, [p("aptt", "APTT", "seconds", "25 - 35")]),
  test(
    "ABG",
    "Arterial Blood Gas",
    "Blood gases",
    "LAB",
    2500,
    [
      p("ph", "pH", "units", "7.35 - 7.45"),
      p("pco2", "PaCO2", "mmHg", "35 - 45"),
      p("po2", "PaO2", "mmHg", "80 - 100"),
      p("hco3", "HCO3", "mmol/L", "22 - 26"),
      p("sao2", "SaO2", "%", "95 - 100"),
    ]
  ),
  test(
    "ECG",
    "Electrocardiogram",
    "Heart electrical activity",
    "ECG",
    800,
    [
      p("hr", "Heart rate", "bpm", "60 - 100"),
      p("pr", "PR interval", "ms", "120 - 200"),
      p("qrs", "QRS duration", "ms", "80 - 120"),
      p("qtc", "QTc", "ms", "350 - 450"),
      p("ecg-imp", "Impression", "finding", "Normal sinus rhythm"),
    ],
    { aliases: ["12-lead ECG", "ECG with report"] }
  ),
  test("EEG", "Electroencephalogram", "Brain electrical activity", "EEG", 5500, [p("eeg-imp", "Impression", "finding", "No epileptiform activity")], { aliases: ["EEG routine"] }),
  test("EMG", "Electromyography", "Muscle electrical activity", "EPS", 6500, [p("emg-imp", "Impression", "finding", "No myopathic / neuropathic pattern")]),
  test("CXR", "Chest X-Ray", "Chest image", "DIGITAL XRAY", 1200, [p("cxr-imp", "Impression", "finding", "No active lung lesion")], { aliases: ["Chest PA"] }),
  test("CT", "Computed Tomography", "Cross-sectional scan", "CT SCAN", 15000, [p("ct-imp", "Impression", "finding", "No acute abnormality")], { aliases: ["CT Brain", "CT Chest"] }),
  test("MRI", "Magnetic Resonance Imaging", "Soft tissue scan", "MRI", 28000, [p("mri-imp", "Impression", "finding", "No acute abnormality")], { aliases: ["MRI Brain", "MRI Lumbar spine"] }),
  test("USG", "Ultrasonography", "Ultrasound scan", "USG", 1800, [p("usg-imp", "Impression", "finding", "No significant abnormality")], { aliases: ["2d Echo", "Upper Abdomen"] }),
  test("PET", "Positron Emission Tomography", "Metabolic scan", "OUTSOURCE LAB", 45000, [p("pet-imp", "Impression", "finding", "No FDG-avid lesion")]),
  test("FNAC", "Fine Needle Aspiration Cytology", "Cell sample", "LAB", 2800, [p("fnac-imp", "Cytology report", "finding", "No malignant cells")]),
  test("Pap", "Papanicolaou Smear", "Cervical cancer screen", "LAB", 1800, [p("pap-imp", "Cytology report", "finding", "Negative for intraepithelial lesion")], { aliases: ["Pap smear"] }),
  test("PSA", "Prostate Specific Antigen", "Prostate marker", "LAB", 2200, [p("psa", "Total PSA", "ng/mL", "< 4.0")]),
  test("TSH", "Thyroid Stimulating Hormone", "Thyroid function", "LAB", 1200, [p("tsh", "TSH", "µIU/mL", "0.4 - 4.0")]),
  test("T3", "Triiodothyronine", "Thyroid hormone", "LAB", 1200, [p("t3", "Total T3", "ng/dl", "80 - 200")]),
  test("T4", "Thyroxine", "Thyroid hormone", "LAB", 1200, [p("t4", "Total T4", "µg/dl", "5.0 - 12.0")]),
  test("D-Dimer", "D-Dimer Test", "Clot marker", "LAB", 2800, [p("ddimer", "D-Dimer", "ng/mL FEU", "< 500")], { aliases: ["D-Dimer Quantitative Assay"] }),
  test("Troponin-I", "Troponin I", "Heart muscle injury", "LAB", 3200, [p("tropi", "Troponin I", "ng/mL", "< 0.04")], { aliases: ["Cardiac Troponin I", "High-Sensitivity Cardiac Troponin I"] }),
  test("CK-MB", "Creatine Kinase-MB", "Heart muscle enzyme", "LAB", 1800, [p("ckmb", "CK-MB", "ng/mL", "< 5.0")]),
  test("BNP", "B-type Natriuretic Peptide", "Heart failure marker", "LAB", 4500, [p("bnp", "BNP", "pg/mL", "< 100")]),
  test("VDRL", "Venereal Disease Research Laboratory", "Syphilis test", "LAB", 800, [p("vdrl", "VDRL", "result", "Non-reactive")]),
  test("HIV", "Human Immunodeficiency Virus Test", "HIV test", "LAB", 1500, [p("hiv", "HIV 1/2 Antibody", "result", "Non-reactive")]),
  test("HBsAg", "Hepatitis B Surface Antigen", "Hepatitis B", "LAB", 1200, [p("hbsag", "HBsAg", "result", "Non-reactive")]),
  test("HCV", "Hepatitis C Virus Test", "Hepatitis C", "LAB", 1500, [p("hcv", "Anti-HCV", "result", "Non-reactive")]),
  test("RT-PCR", "Reverse Transcription PCR", "Genetic amplification", "OUTSOURCE LAB", 8500, [p("rtpcr", "RT-PCR result", "result", "Not detected")]),
  test("NAAT", "Nucleic Acid Amplification Test", "Genetic detection", "OUTSOURCE LAB", 8500, [p("naat", "NAAT result", "result", "Not detected")]),
];

function norm(s: string) {
  return s.toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

export function splitInvestigations(testType: string) {
  return testType
    .split(/\s*(?:\+|,(?![^()]*\))|;)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function matchMedicalTest(name: string): MedicalTest | undefined {
  const n = norm(name);
  if (!n) return undefined;
  const keysOf = (t: MedicalTest) => [t.code, t.fullForm, t.billName, ...(t.aliases || [])].map(norm);
  const exact = MEDICAL_TESTS.find((t) => keysOf(t).includes(n));
  if (exact) return exact;
  return [...MEDICAL_TESTS]
    .sort((a, b) => b.code.length - a.code.length)
    .find((t) => {
      const c = norm(t.code);
      const ff = norm(t.fullForm);
      if (n.startsWith(`${c} (`) || n.startsWith(`${c} -`) || n.startsWith(`${ff} `)) return true;
      return (t.aliases || []).map(norm).some((a) => n === a || n.startsWith(`${a} `) || n.startsWith(`${a} (`));
    });
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "test";
}

export function panelsForTestType(testType: string): Panel[] {
  const parts = splitInvestigations(testType);
  const panels: Panel[] = [];
  const seen = new Set<string>();

  const add = (key: string, panel: Panel) => {
    if (seen.has(key)) return;
    seen.add(key);
    panels.push(panel);
  };

  const source = parts.length ? parts : [testType];
  for (const part of source) {
    const t = matchMedicalTest(part);
    if (!t) {
      add(`raw:${part}`, {
        department: "LABORATORY",
        title: part.toUpperCase(),
        params: [p(slug(part), part, "result", "See method")],
      });
      continue;
    }
    if (t.panel === "CBC") add("CBC", CBC_PANEL);
    else if (t.panel === "KFT") add("KFT", KFT_PANEL);
    else if (t.panel === "LFT") add("LFT", LFT_PANEL);
    else if (t.panel === "DLC") add("DLC", DLC_PANEL);
    else {
      add(t.code, {
        department: t.dept === "LAB" ? "LABORATORY" : t.dept,
        title: `${t.code} (${t.fullForm})`.toUpperCase(),
        params: t.params,
      });
    }
  }

  return panels;
}

export function catalogSearchHaystack(t: MedicalTest) {
  return `${t.code} ${t.fullForm} ${t.purpose} ${t.billName} ${(t.aliases || []).join(" ")}`.toLowerCase();
}

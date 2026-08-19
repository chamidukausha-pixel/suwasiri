// Australian & International Clinical Calculator Suite (Bp Premier benchmarked)

export interface BmiResult {
  bmi: number;
  category: "Underweight" | "Normal Weight" | "Overweight" | "Obesity Class I" | "Obesity Class II" | "Obesity Class III";
  color: string;
  advice: string;
  idealWeightRange: string;
}

export function calculateBmi(heightCm: number, weightKg: number): BmiResult | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let category: BmiResult["category"] = "Normal Weight";
  let color = "text-emerald-700 bg-emerald-50 border-emerald-300";
  let advice = "Within healthy BMI range (18.5 - 24.9 kg/m²). Maintain balanced Mediterranean-style nutrition and 150 mins/week physical activity.";

  if (bmi < 18.5) {
    category = "Underweight";
    color = "text-amber-700 bg-amber-50 border-amber-300";
    advice = "BMI below healthy threshold (< 18.5). Screen for malnutrition, malabsorption, thyroid disease, or underlying chronic conditions.";
  } else if (bmi >= 25 && bmi < 30) {
    category = "Overweight";
    color = "text-amber-800 bg-amber-50 border-amber-300";
    advice = "Overweight threshold (25.0 - 29.9). Recommend lifestyle counseling, dietary review, waist circumference monitoring, and metabolic screening.";
  } else if (bmi >= 30 && bmi < 35) {
    category = "Obesity Class I";
    color = "text-orange-700 bg-orange-50 border-orange-300";
    advice = "Moderate obesity. Recommend structured GP Management Plan (MBS 721), dietitian referral, and cardiovascular risk evaluation.";
  } else if (bmi >= 35 && bmi < 40) {
    category = "Obesity Class II";
    color = "text-red-700 bg-red-50 border-red-300";
    advice = "Severe obesity. Evaluate for obstructive sleep apnoea, metabolic syndrome, non-alcoholic fatty liver, and pharmacotherapy options.";
  } else if (bmi >= 40) {
    category = "Obesity Class III";
    color = "text-rose-900 bg-rose-100 border-rose-400";
    advice = "Morbid obesity. High risk of cardiovascular events. Multidisciplinary care team, bariatric surgical consult evaluation indicated.";
  }

  const minIdeal = (18.5 * (heightM * heightM)).toFixed(1);
  const maxIdeal = (24.9 * (heightM * heightM)).toFixed(1);
  const idealWeightRange = `${minIdeal} - ${maxIdeal} kg`;

  return { bmi, category, color, advice, idealWeightRange };
}

export interface CvdRiskResult {
  riskScorePercent: number;
  riskCategory: "Low (<10%)" | "Moderate (10-15%)" | "High (>15%)";
  color: string;
  recommendedAction: string;
}

export function calculateAustralianCvdRisk(params: {
  age: number;
  gender: "Male" | "Female";
  systolicBp: number;
  smoker: boolean;
  diabetes: boolean;
  totalCholesterolMmol: number;
  hdlCholesterolMmol: number;
  onBpMeds: boolean;
}): CvdRiskResult {
  const { age, gender, systolicBp, smoker, diabetes, totalCholesterolMmol, hdlCholesterolMmol, onBpMeds } = params;
  
  // Baseline points calculation based on Australian National Heart Foundation guidelines
  let points = 0;
  
  // Age points
  if (age >= 70) points += 10;
  else if (age >= 60) points += 7;
  else if (age >= 50) points += 4;
  else if (age >= 40) points += 2;

  // Gender
  if (gender === "Male") points += 2;

  // Systolic BP
  if (systolicBp >= 160) points += 4;
  else if (systolicBp >= 140) points += 2;
  else if (systolicBp >= 130) points += 1;

  if (onBpMeds) points += 1;

  // Smoking & Diabetes
  if (smoker) points += 3;
  if (diabetes) points += 4;

  // Chol/HDL ratio
  const ratio = totalCholesterolMmol && hdlCholesterolMmol ? totalCholesterolMmol / hdlCholesterolMmol : 4.5;
  if (ratio > 6) points += 3;
  else if (ratio > 5) points += 2;
  else if (ratio > 4) points += 1;

  // Convert points to estimated 5-year absolute CVD risk percentage
  let riskScorePercent = Math.min(Math.max(Math.round(points * 1.8), 2), 45);

  let riskCategory: CvdRiskResult["riskCategory"] = "Low (<10%)";
  let color = "text-emerald-700 bg-emerald-50 border-emerald-300";
  let recommendedAction = "Review every 2 years. Reinforce smoking cessation, Mediterranean diet, and moderate physical activity.";

  if (riskScorePercent >= 15 || (diabetes && age > 60) || systolicBp >= 180) {
    riskScorePercent = Math.max(riskScorePercent, 16);
    riskCategory = "High (>15%)";
    color = "text-red-700 bg-red-50 border-red-300";
    recommendedAction = "Immediate clinical intervention: Initiate combination statin (e.g. Atorvastatin 20-40mg) and antihypertensive therapy. Review every 6-12 weeks.";
  } else if (riskScorePercent >= 10) {
    riskCategory = "Moderate (10-15%)";
    color = "text-amber-800 bg-amber-50 border-amber-300";
    recommendedAction = "Intensify lifestyle modifications. Consider lipid-lowering and BP therapy if targets not met after 3-6 months. Re-assess in 12 months.";
  }

  return { riskScorePercent, riskCategory, color, recommendedAction };
}

export interface AusdriskResult {
  score: number;
  riskTier: "Low Risk" | "Intermediate Risk" | "High Risk";
  fiveYearProb: string;
  color: string;
  recommendations: string;
}

export function calculateAusdrisk(params: {
  age: number;
  gender: "Male" | "Female";
  ethnicityAsianOrIndig: boolean;
  familyHistoryDiabetes: boolean;
  historyHighBloodGlucose: boolean;
  onBpMeds: boolean;
  smoker: boolean;
  physicalActivityUnder25Hrs: boolean;
  waistCircumferenceCm: number;
}): AusdriskResult {
  let score = 0;

  // Age points
  if (params.age >= 65) score += 8;
  else if (params.age >= 55) score += 6;
  else if (params.age >= 45) score += 4;
  else if (params.age >= 35) score += 2;

  // Gender
  if (params.gender === "Male") score += 3;

  // Ethnicity
  if (params.ethnicityAsianOrIndig) score += 2;

  // Family History
  if (params.familyHistoryDiabetes) score += 3;

  // Past blood glucose elevation / gestational diabetes
  if (params.historyHighBloodGlucose) score += 6;

  // Antihypertensive meds
  if (params.onBpMeds) score += 2;

  // Current smoker
  if (params.smoker) score += 2;

  // Physical inactivity
  if (params.physicalActivityUnder25Hrs) score += 2;

  // Waist circumference
  if (params.gender === "Male") {
    if (params.waistCircumferenceCm >= 102) score += 7;
    else if (params.waistCircumferenceCm >= 94) score += 4;
  } else {
    if (params.waistCircumferenceCm >= 88) score += 7;
    else if (params.waistCircumferenceCm >= 80) score += 4;
  }

  let riskTier: AusdriskResult["riskTier"] = "Low Risk";
  let fiveYearProb = "1 in 100 people (Approx. 1%)";
  let color = "text-emerald-700 bg-emerald-50 border-emerald-300";
  let recommendations = "Low risk of developing type 2 diabetes in the next 5 years. Maintain healthy lifestyle. Reassess in 3 years.";

  if (score >= 12) {
    riskTier = "High Risk";
    fiveYearProb = "1 in 3 to 1 in 7 people (Approx. 15-30%)";
    color = "text-red-700 bg-red-50 border-red-300";
    recommendations = "High risk. Order fasting blood glucose (FBG) or HbA1c test immediately. Refer to accredited Life!/Diabetes Prevention Program (MBS 721/723).";
  } else if (score >= 6) {
    riskTier = "Intermediate Risk";
    fiveYearProb = "1 in 50 people (Approx. 2%)";
    color = "text-amber-800 bg-amber-50 border-amber-300";
    recommendations = "Intermediate risk. Screen fasting plasma glucose or HbA1c. Provide nutritional and physical activity counselling. Reassess annually.";
  }

  return { score, riskTier, fiveYearProb, color, recommendations };
}

export interface EgfrResult {
  egfr: number;
  stage: "Stage 1 (Normal / High)" | "Stage 2 (Mildly Decreased)" | "Stage 3a (Mild-Moderate)" | "Stage 3b (Moderate-Severe)" | "Stage 4 (Severely Decreased)" | "Stage 5 (Kidney Failure)";
  color: string;
  actionProtocol: string;
}

export function calculateEgfrCkdEpi(serumCreatinineUmolL: number, age: number, gender: "Male" | "Female"): EgfrResult | null {
  if (!serumCreatinineUmolL || !age || serumCreatinineUmolL <= 0 || age <= 0) return null;

  // Convert umol/L to mg/dL for CKD-EPI formula: mg/dL = umol/L / 88.4
  const scr = serumCreatinineUmolL / 88.4;
  const isFemale = gender === "Female";
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const genderMultiplier = isFemale ? 1.012 : 1.0;

  const minTerm = Math.pow(Math.min(scr / kappa, 1), alpha);
  const maxTerm = Math.pow(Math.max(scr / kappa, 1), -1.2);
  const ageTerm = Math.pow(0.9938, age);

  const egfr = Math.round(142 * minTerm * maxTerm * ageTerm * genderMultiplier);

  let stage: EgfrResult["stage"] = "Stage 1 (Normal / High)";
  let color = "text-emerald-700 bg-emerald-50 border-emerald-300";
  let actionProtocol = "Kidney function normal. Monitor annually if hypertensive or diabetic.";

  if (egfr < 15) {
    stage = "Stage 5 (Kidney Failure)";
    color = "text-red-900 bg-red-100 border-red-400";
    actionProtocol = "Severe kidney failure. Urgent nephrology referral for renal replacement therapy / dialysis planning. Adjust all drug dosages.";
  } else if (egfr < 30) {
    stage = "Stage 4 (Severely Decreased)";
    color = "text-red-700 bg-red-50 border-red-300";
    actionProtocol = "Severely decreased kidney function. Specialist nephrologist co-management required. Avoid NSAIDs, iodinated contrast, adjust Metformin/ACEi.";
  } else if (egfr < 45) {
    stage = "Stage 3b (Moderate-Severe)";
    color = "text-orange-800 bg-orange-50 border-orange-300";
    actionProtocol = "Moderate-to-severe CKD. Screen for proteinuria (uACR), mineral-bone disease, anemia. Review nephrotoxic medications every 3-6 months.";
  } else if (egfr < 60) {
    stage = "Stage 3a (Mild-Moderate)";
    color = "text-amber-800 bg-amber-50 border-amber-300";
    actionProtocol = "Mild-to-moderate CKD. Optimize BP (<130/80 if proteinuria present). SGLT2 inhibitor consideration for renal protection.";
  } else if (egfr < 90) {
    stage = "Stage 2 (Mildly Decreased)";
    color = "text-slate-700 bg-slate-100 border-slate-300";
    actionProtocol = "Mild decrease with normal physiological aging. Ensure cardiovascular risk factor management.";
  }

  return { egfr, stage, color, actionProtocol };
}

export interface BpStagingResult {
  classification: "Normal" | "Elevated" | "Stage 1 Hypertension" | "Stage 2 Hypertension" | "Hypertensive Crisis";
  color: string;
  managementPlan: string;
}

export function classifyBloodPressure(systolic: number, diastolic: number): BpStagingResult {
  if (systolic >= 180 || diastolic >= 120) {
    return {
      classification: "Hypertensive Crisis",
      color: "text-red-900 bg-red-100 border-red-500 font-black",
      managementPlan: "Emergency evaluation required! Check for end-organ damage (chest pain, shortness of breath, neurological symptoms, visual disturbance)."
    };
  } else if (systolic >= 140 || diastolic >= 90) {
    return {
      classification: "Stage 2 Hypertension",
      color: "text-red-700 bg-red-50 border-red-300 font-bold",
      managementPlan: "Initiate lifestyle modifications + 2 first-line antihypertensive agents of different classes (e.g. ACEi/ARB + CCB or Thiazide diuretic). Review in 1 month."
    };
  } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
    return {
      classification: "Stage 1 Hypertension",
      color: "text-amber-800 bg-amber-50 border-amber-300 font-bold",
      managementPlan: "Assess 5-year absolute CVD risk. If CVD risk >10% or known clinical CVD/diabetes, start medication; otherwise 3-6 months lifestyle trial."
    };
  } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
    return {
      classification: "Elevated",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      managementPlan: "Non-pharmacological lifestyle therapy (DASH diet, salt reduction <5g/day, weight management, aerobic exercise). Re-evaluate in 3-6 months."
    };
  } else {
    return {
      classification: "Normal",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      managementPlan: "Blood pressure is optimal (<120/<80 mmHg). Encourage healthy lifestyle and reassess annually."
    };
  }
}

export interface PregnancyEddResult {
  eddDateStr: string;
  gestationalWeeks: number;
  gestationalDays: number;
  currentTrimester: "1st Trimester (1-12w)" | "2nd Trimester (13-27w)" | "3rd Trimester (28-40w)" | "Post-Term (>40w)";
  scheduleCheckpoints: string[];
}

export function calculatePregnancyEdd(lmpDateStr: string, cycleLengthDays: number = 28): PregnancyEddResult | null {
  const lmp = new Date(lmpDateStr);
  if (isNaN(lmp.getTime())) return null;

  // Naegele's rule adjusted for cycle length: LMP + 280 days + (cycleLength - 28)
  const diffDays = cycleLengthDays - 28;
  const edd = new Date(lmp.getTime() + (280 + diffDays) * 24 * 60 * 60 * 1000);

  const today = new Date();
  const diffMs = today.getTime() - lmp.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const gestationalWeeks = Math.floor(totalDays / 7);
  const gestationalDays = totalDays % 7;

  let currentTrimester: PregnancyEddResult["currentTrimester"] = "1st Trimester (1-12w)";
  if (gestationalWeeks > 40) currentTrimester = "Post-Term (>40w)";
  else if (gestationalWeeks >= 28) currentTrimester = "3rd Trimester (28-40w)";
  else if (gestationalWeeks >= 13) currentTrimester = "2nd Trimester (13-27w)";

  const scheduleCheckpoints = [
    "10-12 Weeks: Dating ultrasound, first trimester aneuploidy screening (NIPT / combined test)",
    "18-20 Weeks: Detailed fetal morphology ultrasound scan",
    "24-28 Weeks: Gestational Diabetes Oral Glucose Tolerance Test (75g OGTT), Full Blood Count & Antibodies",
    "28 Weeks: Anti-D immunoglobulin for Rh-negative mothers",
    "35-37 Weeks: Group B Streptococcus (GBS) low vaginal-anorectal swab"
  ];

  return {
    eddDateStr: edd.toISOString().split("T")[0],
    gestationalWeeks: Math.max(gestationalWeeks, 0),
    gestationalDays: Math.max(gestationalDays, 0),
    currentTrimester,
    scheduleCheckpoints
  };
}

export interface PaediatricDoseResult {
  drugName: string;
  weightKg: number;
  recommendedDoseMg: number;
  frequency: string;
  maxDailyMg: number;
  syrupDispenseMl?: string;
}

export function calculatePaediatricDose(drug: "Paracetamol" | "Ibuprofen" | "Amoxicillin" | "Cephalexin", weightKg: number): PaediatricDoseResult {
  let recommendedDoseMg = 0;
  let frequency = "";
  let maxDailyMg = 0;
  let syrupDispenseMl = "";

  if (drug === "Paracetamol") {
    // 15 mg/kg every 4-6 hrs (max 60 mg/kg/day or 4000mg)
    recommendedDoseMg = Math.round(weightKg * 15);
    maxDailyMg = Math.min(Math.round(weightKg * 60), 4000);
    frequency = "Every 4 to 6 hours as needed (Max 4 times in 24 hours)";
    // Standard 120mg/5mL or 250mg/5mL
    const ml120 = ((recommendedDoseMg / 120) * 5).toFixed(1);
    const ml250 = ((recommendedDoseMg / 250) * 5).toFixed(1);
    syrupDispenseMl = `${ml120} mL of 120mg/5mL suspension OR ${ml250} mL of 250mg/5mL suspension`;
  } else if (drug === "Ibuprofen") {
    // 10 mg/kg every 6-8 hrs (max 30 mg/kg/day or 2400mg)
    recommendedDoseMg = Math.round(weightKg * 10);
    maxDailyMg = Math.min(Math.round(weightKg * 30), 2400);
    frequency = "Every 6 to 8 hours with or after food (Max 3 times in 24 hours)";
    const ml100 = ((recommendedDoseMg / 100) * 5).toFixed(1);
    syrupDispenseMl = `${ml100} mL of 100mg/5mL infant suspension`;
  } else if (drug === "Amoxicillin") {
    // Standard high dose: 30-50 mg/kg/day in 3 divided doses
    const dailyMg = Math.round(weightKg * 45);
    recommendedDoseMg = Math.round(dailyMg / 3);
    maxDailyMg = Math.min(dailyMg, 3000);
    frequency = "Three times daily (TDS) for 5-7 days";
    const ml125 = ((recommendedDoseMg / 125) * 5).toFixed(1);
    const ml250 = ((recommendedDoseMg / 250) * 5).toFixed(1);
    syrupDispenseMl = `${ml125} mL of 125mg/5mL syrup OR ${ml250} mL of 250mg/5mL forte syrup`;
  } else if (drug === "Cephalexin") {
    const dailyMg = Math.round(weightKg * 25);
    recommendedDoseMg = Math.round(dailyMg / 2);
    maxDailyMg = Math.min(dailyMg, 2000);
    frequency = "Twice daily (BD) for 5-7 days";
    const ml125 = ((recommendedDoseMg / 125) * 5).toFixed(1);
    syrupDispenseMl = `${ml125} mL of 125mg/5mL suspension`;
  }

  return {
    drugName: drug,
    weightKg,
    recommendedDoseMg,
    frequency,
    maxDailyMg,
    syrupDispenseMl
  };
}

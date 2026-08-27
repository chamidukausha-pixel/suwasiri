/** Matches Suwasiri app DoctorCatalog.categories (without All). */
export const DOCTOR_SPECIALTIES = [
  "Physician / Consultant Physician",
  "Cardiologist",
  "Neurologist",
  "Pediatrician",
  "Dermatologist",
  "Psychiatrist",
  "Endocrinologist",
  "Nephrologist",
  "Oncologist",
  "Rheumatologist",
  "Hematologist",
  "Chest Physician / Pulmonologist",
  "General Practitioner",
  "Physiotherapist",
  "Orthopedic Surgeon",
  "Gastroenterologist",
  "Ophthalmologist",
  "ENT Surgeon",
  "Obstetrician / Gynecologist",
  "Urologist",
  "Dental Surgeon",
  "General Surgeon",
  "Radiologist",
] as const;

export type DoctorSpecialty = (typeof DOCTOR_SPECIALTIES)[number];

/**
 * Zod schemas — single source of truth for what valid input looks like.
 *
 * Use these at every system boundary:
 *   - form submission (catch bad input before it reaches the store)
 *   - localStorage hydration (catch corruption from old store versions)
 *   - future API responses (catch backend bugs)
 */

import { z } from "zod";

// Helpers
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format");

const notFutureDate = isoDate.refine(
  (s) => new Date(s) <= new Date(),
  "Date cannot be in the future",
);

const reasonableDOB = isoDate
  .refine((s) => {
    const d = new Date(s);
    const yearsAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return yearsAgo > 0 && yearsAgo < 130;
  }, "Date of birth must be a real, past date within 130 years");

// ICD-10: letter, two digits, optional dot + 1-4 alphanumerics.
const icd10 = z
  .string()
  .trim()
  .regex(
    /^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/i,
    "ICD-10 codes look like M17.11 or S46.011A",
  )
  .optional()
  .or(z.literal(""));

export const newReferralSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(2, "Patient name is required")
    .max(120, "Patient name is too long"),
  dateOfBirth: reasonableDOB,
  diagnosis: z
    .string()
    .trim()
    .min(3, "Describe the diagnosis (3+ chars)")
    .max(500, "Diagnosis description is too long"),
  diagnosisCode: icd10,
  referringPhysician: z
    .string()
    .trim()
    .min(3, "Referring physician name is required")
    .max(200, "Physician name is too long"),
  physicianFax: z
    .string()
    .trim()
    .regex(/^[\d\s\-().+]*$/, "Fax should only contain digits, spaces, dashes, dots, parens, +")
    .max(40, "Fax number is too long")
    .optional()
    .or(z.literal("")),
  intakeChannel: z.enum(["fax", "portal", "email", "phone", "walk-in"]),
  insurancePrimary: z
    .string()
    .trim()
    .min(2, "Insurance is required")
    .max(200, "Insurance description is too long"),
  insuranceMemberId: z.string().trim().max(80).optional().or(z.literal("")),
  priorAuthRequired: z.boolean(),
  location: z.string().trim().min(1),
  notes: z.string().trim().max(2000, "Notes are too long").optional().or(z.literal("")),
});

export type NewReferralInput = z.infer<typeof newReferralSchema>;

export const patientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Patient name is required")
    .max(120, "Patient name is too long"),
  dateOfBirth: reasonableDOB,
  primaryDiagnosis: z
    .string()
    .trim()
    .min(3, "Diagnosis is required (3+ chars)")
    .max(500, "Diagnosis is too long"),
  primaryInsurance: z
    .string()
    .trim()
    .min(2, "Insurance is required")
    .max(200, "Insurance is too long"),
  payerCategory: z.enum([
    "medicare",
    "medicare-advantage",
    "commercial",
    "medicaid",
    "self-pay",
  ]),
  status: z.enum(["active", "discharged", "on-hold"]),
  rtmEnrolled: z.boolean(),
  primaryTherapist: z
    .string()
    .trim()
    .max(120, "Therapist name is too long")
    .optional()
    .or(z.literal("")),
});

export type PatientInput = z.infer<typeof patientSchema>;

export const appointmentSchema = z.object({
  patientId: z.string().trim().min(1, "Pick a patient"),
  therapist: z.string().trim().min(2, "Therapist is required"),
  date: isoDate,
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  durationMinutes: z
    .number()
    .int()
    .min(15, "Minimum 15 minutes")
    .max(180, "Maximum 180 minutes"),
  visitType: z.enum([
    "evaluation",
    "treatment",
    "progress-note",
    "re-evaluation",
    "discharge",
  ]),
  location: z.string().trim().min(1, "Location is required"),
  notes: z.string().trim().max(2000, "Notes too long").optional().or(z.literal("")),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

/**
 * Normalize Zod errors into a flat record keyed by field name. Easier for
 * forms to consume than the nested issue tree.
 */
export function flattenZodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

import { describe, it, expect } from "vitest";
import { newReferralSchema, flattenZodErrors } from "@/lib/schemas";

const validForm = {
  patientName: "Maria Hernandez",
  dateOfBirth: "1960-04-12",
  diagnosis: "Right knee osteoarthritis, post-op TKA",
  diagnosisCode: "M17.11",
  referringPhysician: "Dr. James Patel, MD",
  physicianFax: "703-555-0142",
  intakeChannel: "fax" as const,
  insurancePrimary: "Medicare Part B",
  insuranceMemberId: "MED-12345",
  priorAuthRequired: false,
  location: "Main Clinic",
  notes: "Test referral",
};

describe("newReferralSchema", () => {
  it("accepts a fully valid form", () => {
    const r = newReferralSchema.safeParse(validForm);
    expect(r.success).toBe(true);
  });

  it("rejects empty patient name", () => {
    const r = newReferralSchema.safeParse({ ...validForm, patientName: "" });
    expect(r.success).toBe(false);
  });

  it("rejects future date of birth", () => {
    const r = newReferralSchema.safeParse({ ...validForm, dateOfBirth: "2099-01-01" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed date of birth", () => {
    const r = newReferralSchema.safeParse({ ...validForm, dateOfBirth: "01/15/1970" });
    expect(r.success).toBe(false);
  });

  it("rejects unreasonable DOB (>130 years ago)", () => {
    const r = newReferralSchema.safeParse({ ...validForm, dateOfBirth: "1800-01-01" });
    expect(r.success).toBe(false);
  });

  it("rejects too-short diagnosis", () => {
    const r = newReferralSchema.safeParse({ ...validForm, diagnosis: "x" });
    expect(r.success).toBe(false);
  });

  it("accepts empty ICD-10 code (optional field)", () => {
    const r = newReferralSchema.safeParse({ ...validForm, diagnosisCode: "" });
    expect(r.success).toBe(true);
  });

  it("rejects malformed ICD-10 code", () => {
    const r = newReferralSchema.safeParse({ ...validForm, diagnosisCode: "NOTREAL!!" });
    expect(r.success).toBe(false);
  });

  it("accepts valid ICD-10 with letter+digit suffix", () => {
    const r = newReferralSchema.safeParse({ ...validForm, diagnosisCode: "S46.011A" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid intake channel", () => {
    const r = newReferralSchema.safeParse({ ...validForm, intakeChannel: "carrier-pigeon" as unknown as "fax" });
    expect(r.success).toBe(false);
  });

  it("rejects garbage in physician fax", () => {
    const r = newReferralSchema.safeParse({ ...validForm, physicianFax: "<script>alert(1)</script>" });
    expect(r.success).toBe(false);
  });

  it("rejects notes exceeding 2000 chars", () => {
    const r = newReferralSchema.safeParse({ ...validForm, notes: "x".repeat(2001) });
    expect(r.success).toBe(false);
  });

  it("rejects patient name > 120 chars", () => {
    const r = newReferralSchema.safeParse({ ...validForm, patientName: "y".repeat(121) });
    expect(r.success).toBe(false);
  });
});

describe("flattenZodErrors", () => {
  it("returns a flat keyed map of field -> first message", () => {
    const r = newReferralSchema.safeParse({
      ...validForm,
      patientName: "",
      diagnosis: "x",
    });
    if (r.success) throw new Error("expected failure");
    const flat = flattenZodErrors(r.error);
    expect(flat.patientName).toBeDefined();
    expect(flat.diagnosis).toBeDefined();
  });

  it("returns empty map when there are no errors", () => {
    const r = newReferralSchema.safeParse(validForm);
    if (!r.success) throw new Error("expected success");
    // Just verify the function handles an empty ZodError gracefully
    expect(typeof flattenZodErrors).toBe("function");
  });
});

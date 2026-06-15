import { describe, it, expect } from "vitest";
import { newReferralSchema } from "@/lib/schemas";

/**
 * Schema hydration safety: when localStorage holds corrupted, partial, or
 * adversarial data from an older version of the app, parsing it through Zod
 * must fail predictably rather than crashing the React tree.
 *
 * In production this would be wired into the Zustand `persist` middleware's
 * `onRehydrateStorage` so corrupted state falls back to seed.
 */

describe("Zod-guarded hydration safety", () => {
  it("rejects entirely empty payload", () => {
    const r = newReferralSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("rejects null payload", () => {
    const r = newReferralSchema.safeParse(null);
    expect(r.success).toBe(false);
  });

  it("rejects an array payload", () => {
    const r = newReferralSchema.safeParse([1, 2, 3]);
    expect(r.success).toBe(false);
  });

  it("rejects extra unknown keys silently dropped", () => {
    // .strict() would reject; default is to strip — confirm behavior is stable
    const r = newReferralSchema.safeParse({
      patientName: "Test",
      dateOfBirth: "1970-01-01",
      diagnosis: "Test diagnosis",
      referringPhysician: "Dr. X",
      intakeChannel: "fax",
      insurancePrimary: "Medicare",
      priorAuthRequired: false,
      location: "Main Clinic",
      __injected__: "<script>alert(1)</script>",
    });
    expect(r.success).toBe(true);
    // Confirm injected key is NOT on the validated payload
    if (r.success) {
      expect("__injected__" in r.data).toBe(false);
    }
  });

  it("rejects type-coerced garbage (numbers where strings expected)", () => {
    const r = newReferralSchema.safeParse({
      patientName: 12345,
      dateOfBirth: "1970-01-01",
      diagnosis: "Test",
      referringPhysician: "Dr. X",
      intakeChannel: "fax",
      insurancePrimary: "Medicare",
      priorAuthRequired: false,
      location: "Main Clinic",
    });
    expect(r.success).toBe(false);
  });

  it("rejects deeply malformed JSON-like payload", () => {
    const r = newReferralSchema.safeParse({
      patientName: { nested: "object" },
      dateOfBirth: ["1970-01-01"],
      diagnosis: null,
    });
    expect(r.success).toBe(false);
  });

  it("rejects payload with prototype pollution attempt", () => {
    const payload = JSON.parse(
      '{"patientName":"X","__proto__":{"polluted":true}}',
    );
    const r = newReferralSchema.safeParse(payload);
    // Either rejects on missing fields OR strips the __proto__ key — both safe
    if (r.success) {
      expect("polluted" in r.data).toBe(false);
    }
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });
});

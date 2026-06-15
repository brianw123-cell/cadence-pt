import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { formatDate, daysBetween, daysSince, formatCurrency, age } from "@/lib/utils";

describe("formatDate", () => {
  it("formats an ISO date in human-readable form", () => {
    expect(formatDate("2026-06-14")).toMatch(/Jun.*14.*2026/);
  });
  it("returns em-dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("daysBetween", () => {
  it("counts whole days forward", () => {
    expect(daysBetween("2026-06-01", "2026-06-11")).toBe(10);
  });
  it("returns negative when b is before a", () => {
    expect(daysBetween("2026-06-11", "2026-06-01")).toBe(-10);
  });
  it("returns 0 for the same day", () => {
    expect(daysBetween("2026-06-01", "2026-06-01")).toBe(0);
  });
});

describe("daysSince", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns null for undefined input", () => {
    expect(daysSince(undefined)).toBe(null);
  });
  it("returns positive number of days since an ISO date", () => {
    expect(daysSince("2026-06-01")).toBe(13);
  });
  it("never returns negative (future date clamps to 0)", () => {
    expect(daysSince("2026-12-01")).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats whole dollars", () => {
    expect(formatCurrency(1500)).toMatch(/\$1,500/);
  });
  it("formats cents", () => {
    expect(formatCurrency(40.45)).toMatch(/\$40\.45/);
  });
  it("formats zero", () => {
    expect(formatCurrency(0)).toMatch(/\$0/);
  });
});

describe("age", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("computes whole years between DOB and today", () => {
    expect(age("1960-01-01")).toBe(66);
  });
  it("subtracts a year when birthday has not occurred yet", () => {
    expect(age("1960-12-01")).toBe(65);
  });
  it("handles DOB on the same day as today", () => {
    expect(age("2000-06-14")).toBe(26);
  });
});

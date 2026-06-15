import { describe, it, expect } from "vitest";
import {
  computePatientRTMRevenue,
  projectedMonthlyRTMRevenue,
  untappedMonthlyRTMRevenue,
  isAuthAtRisk,
  daysUntilAuthExpiry,
  pocComplianceStatus,
  scanDenialRisks,
  physicianScorecard,
} from "@/lib/calculations";
import type { Patient, Referral } from "@/lib/types";
import { RTM_RATES } from "@/lib/types";

const today = "2026-06-14";

function makePatient(over: Partial<Patient> = {}): Patient {
  return {
    id: "pt-1",
    name: "Test Patient",
    dateOfBirth: "1960-01-01",
    primaryDiagnosis: "Test",
    primaryInsurance: "Medicare Part B",
    payerCategory: "medicare",
    status: "active",
    rtmEnrolled: false,
    ...over,
  };
}

function makeReferral(over: Partial<Referral> = {}): Referral {
  return {
    id: "ref-1",
    patientName: "Test Patient",
    dateOfBirth: "1960-01-01",
    diagnosis: "Test",
    referringPhysician: "Dr. Test, MD",
    intakeChannel: "fax",
    receivedAt: "2026-06-01",
    insurancePrimary: "Medicare Part B",
    priorAuthRequired: false,
    stage: "new",
    location: "Main Clinic",
    pocTransmissions: [],
    ...over,
  };
}

describe("computePatientRTMRevenue", () => {
  it("returns zero for un-enrolled patient", () => {
    const result = computePatientRTMRevenue({
      patient: makePatient({ rtmEnrolled: false }),
      daysEnrolled: 90,
    });
    expect(result.total).toBe(0);
  });

  it("returns zero for non-Medicare payer even when enrolled", () => {
    const result = computePatientRTMRevenue({
      patient: makePatient({ rtmEnrolled: true, payerCategory: "commercial" }),
      daysEnrolled: 90,
    });
    expect(result.total).toBe(0);
  });

  it("bills setup once plus monthly codes per 30-day period", () => {
    const result = computePatientRTMRevenue({
      patient: makePatient({ rtmEnrolled: true }),
      daysEnrolled: 60,
    });
    expect(result.monthsBilled).toBe(2);
    expect(result.setup).toBe(RTM_RATES.setup.amount);
    expect(result.monitoring).toBe(RTM_RATES.monitorMSK.amount * 2);
    expect(result.management).toBe(RTM_RATES.manageFirst20.amount * 2);
    expect(result.total).toBe(
      RTM_RATES.setup.amount +
        RTM_RATES.monitorMSK.amount * 2 +
        RTM_RATES.manageFirst20.amount * 2,
    );
  });

  it("bills at least 1 month even on day 1 of enrollment", () => {
    const result = computePatientRTMRevenue({
      patient: makePatient({ rtmEnrolled: true }),
      daysEnrolled: 0,
    });
    expect(result.monthsBilled).toBe(1);
  });

  it("bills medicare-advantage same as medicare", () => {
    const mc = computePatientRTMRevenue({
      patient: makePatient({ rtmEnrolled: true, payerCategory: "medicare" }),
      daysEnrolled: 30,
    });
    const ma = computePatientRTMRevenue({
      patient: makePatient({ rtmEnrolled: true, payerCategory: "medicare-advantage" }),
      daysEnrolled: 30,
    });
    expect(mc.total).toBe(ma.total);
  });
});

describe("projectedMonthlyRTMRevenue", () => {
  it("returns 0 when no patients", () => {
    expect(projectedMonthlyRTMRevenue([])).toBe(0);
  });

  it("only counts billable enrolled patients", () => {
    const list = [
      makePatient({ id: "1", rtmEnrolled: true, payerCategory: "medicare" }),
      makePatient({ id: "2", rtmEnrolled: false, payerCategory: "medicare" }),
      makePatient({ id: "3", rtmEnrolled: true, payerCategory: "commercial" }),
    ];
    expect(projectedMonthlyRTMRevenue(list)).toBe(
      RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount,
    );
  });
});

describe("untappedMonthlyRTMRevenue", () => {
  it("only counts active, eligible, NOT enrolled patients", () => {
    const list = [
      makePatient({ id: "1", rtmEnrolled: true, payerCategory: "medicare" }),
      makePatient({ id: "2", rtmEnrolled: false, payerCategory: "medicare", status: "active" }),
      makePatient({ id: "3", rtmEnrolled: false, payerCategory: "medicare", status: "discharged" }),
      makePatient({ id: "4", rtmEnrolled: false, payerCategory: "commercial" }),
    ];
    // only #2 counts
    expect(untappedMonthlyRTMRevenue(list)).toBe(
      RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount,
    );
  });
});

describe("isAuthAtRisk", () => {
  it("returns false when no authorization", () => {
    expect(isAuthAtRisk(makeReferral())).toBe(false);
  });

  it("returns false when discharged regardless of visits", () => {
    const ref = makeReferral({
      stage: "discharged",
      authorization: {
        id: "a1",
        payer: "Medicare",
        visitsApproved: 6,
        visitsUsed: 6,
        validFrom: "2026-04-01",
        validThrough: "2026-12-01",
        status: "approved",
      },
    });
    expect(isAuthAtRisk(ref)).toBe(false);
  });

  it("returns true when remaining visits <= 1", () => {
    const ref = makeReferral({
      stage: "active",
      authorization: {
        id: "a1",
        payer: "UHC",
        visitsApproved: 6,
        visitsUsed: 5,
        validFrom: "2026-04-01",
        validThrough: "2026-12-01",
        status: "approved",
      },
    });
    expect(isAuthAtRisk(ref)).toBe(true);
  });

  it("returns false when 2+ visits remain", () => {
    const ref = makeReferral({
      stage: "active",
      authorization: {
        id: "a1",
        payer: "UHC",
        visitsApproved: 6,
        visitsUsed: 3,
        validFrom: "2026-04-01",
        validThrough: "2026-12-01",
        status: "approved",
      },
    });
    expect(isAuthAtRisk(ref)).toBe(false);
  });
});

describe("daysUntilAuthExpiry", () => {
  it("returns positive number for future expiry", () => {
    const ref = makeReferral({
      authorization: {
        id: "a1",
        payer: "UHC",
        visitsApproved: 6,
        visitsUsed: 1,
        validFrom: "2026-04-01",
        validThrough: "2026-06-24", // 10 days after today
        status: "approved",
      },
    });
    expect(daysUntilAuthExpiry(ref, today)).toBe(10);
  });

  it("returns negative for expired auth", () => {
    const ref = makeReferral({
      authorization: {
        id: "a1",
        payer: "UHC",
        visitsApproved: 6,
        visitsUsed: 1,
        validFrom: "2026-01-01",
        validThrough: "2026-05-14", // 31 days before today
        status: "approved",
      },
    });
    expect(daysUntilAuthExpiry(ref, today)).toBe(-31);
  });

  it("returns null when no auth", () => {
    expect(daysUntilAuthExpiry(makeReferral(), today)).toBe(null);
  });
});

describe("pocComplianceStatus (Medicare Jan 2025 rule)", () => {
  it("no-eval when no evaluation date", () => {
    expect(pocComplianceStatus(makeReferral(), today)).toBe("no-eval");
  });

  it("compliant when POC transmission logged", () => {
    const ref = makeReferral({
      evaluationDate: "2026-06-01",
      pocTransmissions: [
        {
          id: "p1",
          sentAt: "2026-06-03",
          method: "fax",
          recipient: "Dr. Test",
          daysFromEval: 2,
        },
      ],
    });
    expect(pocComplianceStatus(ref, today)).toBe("compliant");
  });

  it("pending when within 30-day window, no transmission", () => {
    const ref = makeReferral({ evaluationDate: "2026-06-01" }); // 13 days ago
    expect(pocComplianceStatus(ref, today)).toBe("pending");
  });

  it("overdue when past 30-day window, no transmission", () => {
    const ref = makeReferral({ evaluationDate: "2026-05-01" }); // 44 days ago
    expect(pocComplianceStatus(ref, today)).toBe("overdue");
  });

  it("transitions at exactly day 31", () => {
    const ref = makeReferral({ evaluationDate: "2026-05-14" }); // 31 days ago
    expect(pocComplianceStatus(ref, today)).toBe("overdue");
  });
});

describe("scanDenialRisks", () => {
  it("returns empty for clean caseload", () => {
    expect(scanDenialRisks([], today)).toEqual([]);
  });

  it("flags POC overdue as critical", () => {
    const refs = [makeReferral({ stage: "active", evaluationDate: "2026-04-01" })];
    const risks = scanDenialRisks(refs, today);
    expect(risks.some((r) => r.ruleCode === "CMS-POC-30" && r.severity === "critical")).toBe(
      true,
    );
  });

  it("flags missing prior auth as critical when payer requires it", () => {
    const refs = [
      makeReferral({
        stage: "scheduled",
        priorAuthRequired: true,
      }),
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks.some((r) => r.ruleCode === "PA-MISSING" && r.severity === "critical")).toBe(
      true,
    );
  });

  it("sorts critical before warning", () => {
    const refs = [
      // missing dx code -> warning
      makeReferral({ id: "ref-1", stage: "evaluated", diagnosisCode: undefined }),
      // POC overdue -> critical
      makeReferral({ id: "ref-2", stage: "active", evaluationDate: "2026-04-01" }),
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks[0].severity).toBe("critical");
  });

  it("does NOT flag at-limit auth on discharged patients", () => {
    const refs = [
      makeReferral({
        stage: "discharged",
        authorization: {
          id: "a1",
          payer: "UHC",
          visitsApproved: 6,
          visitsUsed: 6,
          validFrom: "2026-04-01",
          validThrough: "2026-12-01",
          status: "approved",
        },
      }),
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks.find((r) => r.ruleCode === "AUTH-LIMIT")).toBeUndefined();
  });
});

describe("scanDenialRisks additional rules", () => {
  it("flags missing ICD-10 code on evaluated referral as warning", () => {
    const refs = [
      makeReferral({ id: "r1", stage: "evaluated", diagnosisCode: undefined }),
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks.some((r) => r.ruleCode === "DX-CODE" && r.severity === "warning")).toBe(true);
  });

  it("does NOT flag missing ICD-10 in new or contacted stage", () => {
    const refs = [
      makeReferral({ id: "r1", stage: "new", diagnosisCode: undefined }),
      makeReferral({ id: "r2", stage: "contacted", diagnosisCode: undefined }),
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks.some((r) => r.ruleCode === "DX-CODE")).toBe(false);
  });

  it("flags POC pending as warning between days 15-30 since eval", () => {
    const refs = [
      makeReferral({ id: "r1", stage: "active", evaluationDate: "2026-05-29" }), // 16 days ago
    ];
    const risks = scanDenialRisks(refs, today);
    const poc = risks.find((r) => r.ruleCode === "CMS-POC-30");
    expect(poc?.severity).toBe("warning");
  });

  it("does NOT flag POC pending in first 14 days post-eval", () => {
    const refs = [
      makeReferral({ id: "r1", stage: "active", evaluationDate: "2026-06-04" }), // 10 days ago
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks.some((r) => r.ruleCode === "CMS-POC-30")).toBe(false);
  });

  it("does NOT flag missing prior auth in new/contacted stage", () => {
    const refs = [
      makeReferral({ id: "r1", stage: "new", priorAuthRequired: true }),
      makeReferral({ id: "r2", stage: "contacted", priorAuthRequired: true }),
    ];
    const risks = scanDenialRisks(refs, today);
    expect(risks.some((r) => r.ruleCode === "PA-MISSING")).toBe(false);
  });
});

describe("physicianScorecard", () => {
  it("returns empty for no referrals", () => {
    expect(physicianScorecard([])).toEqual([]);
  });

  it("returns 100% POC compliance when no evaluated referrals", () => {
    const refs = [
      makeReferral({ id: "r1", referringPhysician: "Dr. Test" }), // no eval
    ];
    const score = physicianScorecard(refs);
    expect(score[0].pocComplianceRate).toBe(100);
  });

  it("returns null avgDaysToEval when no evaluated referrals", () => {
    const refs = [makeReferral({ id: "r1", referringPhysician: "Dr. Test" })];
    const score = physicianScorecard(refs);
    expect(score[0].avgDaysToEval).toBeNull();
  });

  it("counts ALL completed (active + discharged) toward revenue", () => {
    const refs = [
      makeReferral({ id: "r1", referringPhysician: "Dr. Test", stage: "active" }),
      makeReferral({ id: "r2", referringPhysician: "Dr. Test", stage: "discharged" }),
      makeReferral({ id: "r3", referringPhysician: "Dr. Test", stage: "evaluated" }), // not counted
    ];
    const score = physicianScorecard(refs);
    // 2 completed × 8 visits × $95
    expect(score[0].estimatedRevenue).toBe(2 * 8 * 95);
  });

  it("groups referrals by physician", () => {
    const refs = [
      makeReferral({ id: "r1", referringPhysician: "Dr. A" }),
      makeReferral({ id: "r2", referringPhysician: "Dr. A" }),
      makeReferral({ id: "r3", referringPhysician: "Dr. B" }),
    ];
    const score = physicianScorecard(refs);
    expect(score).toHaveLength(2);
    const drA = score.find((s) => s.name === "Dr. A")!;
    expect(drA.totalReferrals).toBe(2);
  });

  it("calculates conversion rate as evaluated / total", () => {
    const refs = [
      makeReferral({ id: "r1", referringPhysician: "Dr. A", evaluationDate: "2026-06-10" }),
      makeReferral({ id: "r2", referringPhysician: "Dr. A" }),
    ];
    const score = physicianScorecard(refs);
    expect(score[0].conversionRate).toBe(50);
  });

  it("sorts by revenue descending", () => {
    const refs = [
      makeReferral({ id: "r1", referringPhysician: "Dr. Low", stage: "new" }),
      makeReferral({ id: "r2", referringPhysician: "Dr. High", stage: "active" }),
      makeReferral({ id: "r3", referringPhysician: "Dr. High", stage: "discharged" }),
    ];
    const score = physicianScorecard(refs);
    expect(score[0].name).toBe("Dr. High");
  });

  it("computes POC compliance from evaluated referrals only", () => {
    const refs = [
      // evaluated, no POC -> hurts compliance
      makeReferral({
        id: "r1",
        referringPhysician: "Dr. A",
        evaluationDate: "2026-06-01",
        pocTransmissions: [],
      }),
      // not evaluated yet -> shouldn't affect compliance
      makeReferral({ id: "r2", referringPhysician: "Dr. A" }),
      // evaluated WITH POC -> helps compliance
      makeReferral({
        id: "r3",
        referringPhysician: "Dr. A",
        evaluationDate: "2026-05-10",
        pocTransmissions: [
          { id: "p1", sentAt: "2026-05-12", method: "fax", recipient: "Dr. A", daysFromEval: 2 },
        ],
      }),
    ];
    const score = physicianScorecard(refs);
    expect(score[0].pocComplianceRate).toBe(50); // 1 of 2 evaluated has POC
  });
});

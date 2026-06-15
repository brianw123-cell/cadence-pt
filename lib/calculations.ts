/**
 * Pure calculation functions extracted from UI components.
 *
 * Everything in this file:
 *   - has no React, no DOM, no localStorage dependency
 *   - takes domain data in, returns domain data out
 *   - is independently unit-testable
 *
 * If a UI page wants to display a derived metric, it should compute it via
 * these functions, not inline JSX math.
 */

import type { Referral, Patient } from "@/lib/types";
import { RTM_RATES } from "@/lib/types";

// ---------- RTM revenue ----------

export interface RTMRevenueInput {
  patient: Patient;
  daysEnrolled: number;
}

export interface RTMRevenueResult {
  setup: number;
  monitoring: number;
  management: number;
  total: number;
  monthsBilled: number;
}

/**
 * Compute total RTM revenue earned for one patient over their enrollment.
 * Only Medicare and Medicare Advantage payers are billable for RTM.
 */
export function computePatientRTMRevenue(input: RTMRevenueInput): RTMRevenueResult {
  const { patient, daysEnrolled } = input;
  const billable =
    patient.payerCategory === "medicare" || patient.payerCategory === "medicare-advantage";
  if (!patient.rtmEnrolled || !billable) {
    return { setup: 0, monitoring: 0, management: 0, total: 0, monthsBilled: 0 };
  }
  const monthsBilled = Math.max(1, Math.ceil(daysEnrolled / 30));
  const setup = RTM_RATES.setup.amount;
  const monitoring = RTM_RATES.monitorMSK.amount * monthsBilled;
  const management = RTM_RATES.manageFirst20.amount * monthsBilled;
  return {
    setup,
    monitoring,
    management,
    total: setup + monitoring + management,
    monthsBilled,
  };
}

/**
 * Projected total monthly RTM revenue across all enrolled, billable patients.
 * Used by the Dashboard and RTM landing page.
 */
export function projectedMonthlyRTMRevenue(patients: Patient[]): number {
  const billable = patients.filter(
    (p) =>
      p.rtmEnrolled &&
      (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage"),
  );
  return billable.length * (RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount);
}

/**
 * Untapped monthly RTM revenue — eligible but not enrolled.
 * Used by Dashboard to surface the upside conversation.
 */
export function untappedMonthlyRTMRevenue(patients: Patient[]): number {
  const eligible = patients.filter(
    (p) =>
      !p.rtmEnrolled &&
      p.status === "active" &&
      (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage"),
  );
  return eligible.length * (RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount);
}

// ---------- Authorization ----------

/**
 * A referral is auth-at-risk if visits remaining is 1 or fewer.
 * The NEXT visit will deny without re-authorization.
 */
export function isAuthAtRisk(referral: Referral): boolean {
  if (!referral.authorization) return false;
  if (referral.stage === "discharged") return false;
  const remaining = referral.authorization.visitsApproved - referral.authorization.visitsUsed;
  return remaining <= 1;
}

/**
 * Days until authorization expires (negative if already expired).
 * Pass a today ISO date to make the function deterministic for testing.
 */
export function daysUntilAuthExpiry(referral: Referral, today: string): number | null {
  if (!referral.authorization?.validThrough) return null;
  const expiry = new Date(referral.authorization.validThrough).getTime();
  const now = new Date(today).getTime();
  return Math.round((expiry - now) / (1000 * 60 * 60 * 24));
}

// ---------- POC transmission compliance ----------

/**
 * POC compliance status per Medicare Jan 2025 rule:
 * - The plan of care must be transmitted to the referring provider within
 *   30 days of the initial evaluation.
 *
 * Returns one of: "no-eval" | "compliant" | "pending" | "overdue"
 *
 * "today" is parameterized so callers (and tests) can be deterministic.
 */
export type POCStatus = "no-eval" | "compliant" | "pending" | "overdue";

export function pocComplianceStatus(referral: Referral, today: string): POCStatus {
  if (!referral.evaluationDate) return "no-eval";
  if (referral.pocTransmissions.length > 0) return "compliant";
  const evalTime = new Date(referral.evaluationDate).getTime();
  const todayTime = new Date(today).getTime();
  const days = Math.round((todayTime - evalTime) / (1000 * 60 * 60 * 24));
  if (days > 30) return "overdue";
  return "pending";
}

// ---------- Denial risk scan ----------

export type DenialSeverity = "critical" | "warning" | "info";
export interface DenialRisk {
  referralId: string;
  patientName: string;
  severity: DenialSeverity;
  ruleCode: string;
  title: string;
  estimatedLoss: number;
}

/**
 * Scan a list of referrals against the most common claim-denial rules.
 * "today" is parameterized for determinism.
 */
export function scanDenialRisks(referrals: Referral[], today: string): DenialRisk[] {
  const out: DenialRisk[] = [];
  for (const r of referrals) {
    const pocStatus = pocComplianceStatus(r, today);

    if (pocStatus === "overdue") {
      out.push({
        referralId: r.id,
        patientName: r.patientName,
        severity: "critical",
        ruleCode: "CMS-POC-30",
        title: "Plan of Care transmission overdue",
        estimatedLoss: 800,
      });
    } else if (pocStatus === "pending") {
      // Only escalate to warning if within last 15 days of window
      const evalTime = new Date(r.evaluationDate!).getTime();
      const todayTime = new Date(today).getTime();
      const days = Math.round((todayTime - evalTime) / (1000 * 60 * 60 * 24));
      if (days >= 15) {
        out.push({
          referralId: r.id,
          patientName: r.patientName,
          severity: "warning",
          ruleCode: "CMS-POC-30",
          title: "POC window closing",
          estimatedLoss: 800,
        });
      }
    }

    if (isAuthAtRisk(r)) {
      out.push({
        referralId: r.id,
        patientName: r.patientName,
        severity: "critical",
        ruleCode: "AUTH-LIMIT",
        title: "Authorization at limit",
        estimatedLoss: 380,
      });
    }

    if (!r.diagnosisCode && r.stage !== "new" && r.stage !== "contacted") {
      out.push({
        referralId: r.id,
        patientName: r.patientName,
        severity: "warning",
        ruleCode: "DX-CODE",
        title: "Missing ICD-10 code",
        estimatedLoss: 95,
      });
    }

    if (
      r.priorAuthRequired &&
      !r.authorization &&
      ["scheduled", "evaluated", "active"].includes(r.stage)
    ) {
      out.push({
        referralId: r.id,
        patientName: r.patientName,
        severity: "critical",
        ruleCode: "PA-MISSING",
        title: "Prior auth required, none on file",
        estimatedLoss: 380,
      });
    }
  }
  const order: Record<DenialSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ---------- Physician scorecard ----------

export interface PhysicianScore {
  name: string;
  totalReferrals: number;
  evaluated: number;
  conversionRate: number; // 0-100
  avgDaysToEval: number | null;
  estimatedRevenue: number;
  pocComplianceRate: number; // 0-100
}

export function physicianScorecard(referrals: Referral[]): PhysicianScore[] {
  const byPhysician = new Map<string, Referral[]>();
  for (const r of referrals) {
    const arr = byPhysician.get(r.referringPhysician) ?? [];
    arr.push(r);
    byPhysician.set(r.referringPhysician, arr);
  }

  const out: PhysicianScore[] = [];
  for (const [name, list] of byPhysician.entries()) {
    const evaluated = list.filter((r) => r.evaluationDate).length;
    const completed = list.filter((r) => r.stage === "active" || r.stage === "discharged").length;
    const conversionRate = list.length > 0 ? Math.round((evaluated / list.length) * 100) : 0;
    const daysList = list
      .filter((r) => r.evaluationDate)
      .map((r) => {
        const a = new Date(r.receivedAt).getTime();
        const b = new Date(r.evaluationDate!).getTime();
        return Math.round((b - a) / (1000 * 60 * 60 * 24));
      });
    const avgDaysToEval =
      daysList.length > 0 ? Math.round(daysList.reduce((s, n) => s + n, 0) / daysList.length) : null;
    const estimatedRevenue = completed * 8 * 95;
    const evalsTotal = list.filter((r) => r.evaluationDate).length;
    const evalsWithPOC = list.filter(
      (r) => r.evaluationDate && r.pocTransmissions.length > 0,
    ).length;
    const pocComplianceRate = evalsTotal > 0 ? Math.round((evalsWithPOC / evalsTotal) * 100) : 100;

    out.push({
      name,
      totalReferrals: list.length,
      evaluated,
      conversionRate,
      avgDaysToEval,
      estimatedRevenue,
      pocComplianceRate,
    });
  }
  return out.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
}

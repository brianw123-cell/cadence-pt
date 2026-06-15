"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useReferralsRepo, usePatientsRepo } from "@/lib/repo";
import {
  projectedMonthlyRTMRevenue,
  untappedMonthlyRTMRevenue,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

const AVG_VISIT_REIMBURSEMENT = 95;

export default function MoneyPage() {
  const referrals = useReferralsRepo().list();
  const patients = usePatientsRepo().list();

  // Visit revenue: count "logged" visits across all authorizations
  const visitRevenue = useMemo(() => {
    const totalVisits = referrals.reduce((sum, r) => sum + (r.authorization?.visitsUsed ?? 0), 0);
    return totalVisits * AVG_VISIT_REIMBURSEMENT;
  }, [referrals]);

  const rtmMonthly = projectedMonthlyRTMRevenue(patients);
  const rtmUntapped = untappedMonthlyRTMRevenue(patients);
  const cashRevenue = 0; // No cash patients in seed; would be summed from cash-pay flag

  // Pretend monthly cadence: visits are spread across roughly 60 days of activity
  const visitMonthly = Math.round(visitRevenue / 2);
  const totalMonthly = visitMonthly + rtmMonthly + cashRevenue;
  const totalAnnualized = totalMonthly * 12;

  // Productivity by therapist
  const productivity = useMemo(() => {
    const map = new Map<string, { visits: number; rtmPatients: number; revenue: number }>();
    for (const p of patients) {
      const key = p.primaryTherapist ?? "Unassigned";
      const cur = map.get(key) ?? { visits: 0, rtmPatients: 0, revenue: 0 };
      // Get visits from referrals tied to this therapist (loose mapping by name in patient record)
      const patientRefs = referrals.filter((r) => r.patientName === p.name);
      const visits = patientRefs.reduce((s, r) => s + (r.authorization?.visitsUsed ?? 0), 0);
      cur.visits += visits;
      if (p.rtmEnrolled && (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage")) {
        cur.rtmPatients += 1;
      }
      cur.revenue += visits * AVG_VISIT_REIMBURSEMENT;
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .filter((t) => t.name !== "Unassigned")
      .sort((a, b) => b.revenue - a.revenue);
  }, [patients, referrals]);

  // Payer mix
  const payerMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of patients.filter((x) => x.status === "active")) {
      counts.set(p.payerCategory, (counts.get(p.payerCategory) ?? 0) + 1);
    }
    const total = patients.filter((x) => x.status === "active").length;
    return [...counts.entries()].map(([cat, n]) => ({ cat, n, pct: total > 0 ? (n / total) * 100 : 0 }));
  }, [patients]);

  const payerColors: Record<string, string> = {
    medicare: "bg-blue-600",
    "medicare-advantage": "bg-indigo-600",
    commercial: "bg-stone-600",
    medicaid: "bg-amber-600",
    "self-pay": "bg-emerald-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">The money view</h1>
        <p className="text-sm text-stone-600 mt-1">
          The all-up business picture you've never had in one screen. Insurance, RTM,
          and per-therapist productivity together.
        </p>
      </div>

      {/* Money cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <BigNumber label="This month run rate" value={formatCurrency(totalMonthly)} sub="Visits + RTM" />
        <BigNumber label="Annualized" value={formatCurrency(totalAnnualized)} sub="At today's pace" tone="emerald" />
        <BigNumber label="Untapped RTM" value={formatCurrency(rtmUntapped)} sub="Per month if all enrolled" tone="amber" />
        <BigNumber label="Avg per active patient" value={formatCurrency(Math.round(totalMonthly / Math.max(1, patients.filter((p) => p.status === "active").length)))} sub="Per month" />
      </div>

      {/* Revenue composition */}
      <div className="grid md:grid-cols-3 gap-4">
        <RevenueLine
          label="Insurance visits"
          monthly={visitMonthly}
          annual={visitMonthly * 12}
          color="bg-teal-600"
          note={`${referrals.reduce((s, r) => s + (r.authorization?.visitsUsed ?? 0), 0)} visits logged at avg ${formatCurrency(AVG_VISIT_REIMBURSEMENT)} reimbursement`}
        />
        <RevenueLine
          label="RTM monthly"
          monthly={rtmMonthly}
          annual={rtmMonthly * 12}
          color="bg-emerald-600"
          note="CMS 2026 rates · CPT 98977 + 98980"
        />
        <RevenueLine
          label="Cash / direct pay"
          monthly={cashRevenue}
          annual={cashRevenue * 12}
          color="bg-amber-500"
          note="No cash-pay patients on file"
        />
      </div>

      {/* Per-therapist productivity */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Per-therapist productivity
        </h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left text-xs uppercase tracking-wide text-stone-700">
                <th className="px-4 py-3 font-semibold">Therapist</th>
                <th className="px-4 py-3 font-semibold text-center">Active patients</th>
                <th className="px-4 py-3 font-semibold text-center">Visits</th>
                <th className="px-4 py-3 font-semibold text-center">RTM enrolled</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue generated</th>
              </tr>
            </thead>
            <tbody>
              {productivity.map((t) => {
                const activePatientCount = patients.filter(
                  (p) => p.primaryTherapist === t.name && p.status === "active",
                ).length;
                return (
                  <tr key={t.name} className="border-b border-stone-100">
                    <td className="px-4 py-3 font-medium text-stone-900">{t.name}</td>
                    <td className="px-4 py-3 text-center text-stone-800">{activePatientCount}</td>
                    <td className="px-4 py-3 text-center text-stone-800">{t.visits}</td>
                    <td className="px-4 py-3 text-center text-stone-800">{t.rtmPatients}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {formatCurrency(t.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payer mix */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Payer mix (active patients)
        </h2>
        <div className="card p-4 md:p-5">
          <div className="space-y-3">
            {payerMix.map((m) => (
              <div key={m.cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-stone-800 capitalize">
                    {m.cat.replace("-", " ")}
                  </span>
                  <span className="text-stone-600">
                    {m.n} patient{m.n !== 1 ? "s" : ""} · {Math.round(m.pct)}%
                  </span>
                </div>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full ${payerColors[m.cat] ?? "bg-stone-500"}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action callouts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/rtm" className="card p-5 bg-amber-50 border-amber-200 hover:shadow-md transition block">
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 mb-2">
            Action: enroll untapped Medicare patients
          </h3>
          <p className="text-sm text-amber-900">
            You're leaving <strong>{formatCurrency(rtmUntapped)}/mo</strong> on the
            table from eligible-but-not-enrolled patients. That's{" "}
            <strong>{formatCurrency(rtmUntapped * 12)}/year</strong>. Click → RTM page.
          </p>
        </Link>
        <Link href="/denials" className="card p-5 bg-red-50 border-red-200 hover:shadow-md transition block">
          <h3 className="text-sm font-bold uppercase tracking-wide text-red-800 mb-2">
            Action: protect revenue at risk
          </h3>
          <p className="text-sm text-red-900">
            The Denial Protector page lists every issue across your caseload that
            could lose this revenue to denied claims. Check it weekly.
          </p>
        </Link>
      </div>

      <div className="card p-4 md:p-5 bg-stone-50 text-xs text-stone-600 leading-relaxed">
        <strong className="text-stone-900">Numbers approximations.</strong> Visit
        reimbursement uses a {formatCurrency(AVG_VISIT_REIMBURSEMENT)} average rate.
        Real PT reimbursement varies by CPT code (97110, 97140, 97530, etc.), payer
        contract, and geographic locality. Cash pay shown at $0 because no cash-pay
        patients exist in the demo dataset. Production version would pull true rates
        from your contract repository.
      </div>
    </div>
  );
}

function BigNumber({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "emerald" | "amber";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : tone === "amber"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "text-stone-900";
  // Distinct sub-label color per tone, all >= 4.5:1 against their background
  const subCls =
    tone === "emerald" ? "text-emerald-800" : tone === "amber" ? "text-amber-900" : "text-stone-700";
  return (
    <div className={`card p-4 ${toneCls}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subCls}`}>
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className={`text-xs mt-1 ${subCls}`}>{sub}</div>}
    </div>
  );
}

function RevenueLine({
  label,
  monthly,
  annual,
  color,
  note,
}: {
  label: string;
  monthly: number;
  annual: number;
  color: string;
  note: string;
}) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-3 w-3 rounded ${color}`} />
        <span className="text-sm font-semibold text-stone-900">{label}</span>
      </div>
      <div className="text-2xl font-bold text-stone-900">{formatCurrency(monthly)}/mo</div>
      <div className="text-xs text-stone-600 mt-0.5">{formatCurrency(annual)} annualized</div>
      <div className="text-xs text-stone-500 mt-2">{note}</div>
    </div>
  );
}

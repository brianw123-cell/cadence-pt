"use client";

import Link from "next/link";
import { useReferralsRepo, usePatientsRepo } from "@/lib/repo";
import { formatCurrency } from "@/lib/utils";
import {
  projectedMonthlyRTMRevenue,
  untappedMonthlyRTMRevenue,
  isAuthAtRisk,
  pocComplianceStatus,
} from "@/lib/calculations";

export default function Dashboard() {
  const referrals = useReferralsRepo().list();
  const patients = usePatientsRepo().list();

  const today = new Date().toISOString().slice(0, 10);
  const newToday = referrals.filter((r) => r.receivedAt === today).length;
  const inFunnel = referrals.filter(
    (r) => r.stage !== "discharged" && r.stage !== "active",
  ).length;
  const activeTreatment = referrals.filter((r) => r.stage === "active").length;
  const pocOverdue = referrals.filter((r) => pocComplianceStatus(r, today) === "overdue").length;
  const authsAtRisk = referrals.filter(isAuthAtRisk).length;
  const enrolled = patients.filter((p) => p.rtmEnrolled).length;
  const eligibleForBilling = patients.filter(
    (p) => p.rtmEnrolled && (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage"),
  ).length;
  const projectedMonthlyRTM = projectedMonthlyRTMRevenue(patients);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-teal-900">Welcome back</h1>
            <p className="text-sm text-stone-600 mt-1">
              Cadence PT — your referral funnel and RTM revenue at a glance.
            </p>
          </div>
          <div className="text-xs text-stone-500 text-right">
            <div>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
            <div className="text-teal-700 font-medium mt-1">2 locations · 4 therapists</div>
          </div>
        </div>
      </div>

      {/* Referral KPIs */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700">
            Referral lifecycle
          </h2>
          <Link href="/referrals" className="text-xs font-medium text-teal-700 hover:text-teal-900">
            View funnel →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="New today" value={newToday} tone="teal" />
          <KpiCard label="In funnel" value={inFunnel} tone="neutral" />
          <KpiCard label="Active treatment" value={activeTreatment} tone="neutral" />
          <KpiCard
            label="POC overdue (>30d)"
            value={pocOverdue}
            tone={pocOverdue > 0 ? "warning" : "neutral"}
          />
        </div>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/referrals" className="card p-5 hover:shadow-md transition block">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-red-700">
              Auth at risk
            </span>
          </div>
          <div className="text-3xl font-bold text-stone-900">{authsAtRisk}</div>
          <p className="text-sm text-stone-600 mt-1">
            Patients at or near their authorized visit limit. Re-auth before next visit
            or claims will deny.
          </p>
        </Link>
        <Link href="/billing" className="card p-5 hover:shadow-md transition block">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Projected RTM revenue this month
            </span>
          </div>
          <div className="text-3xl font-bold text-stone-900">
            {formatCurrency(projectedMonthlyRTM)}
          </div>
          <p className="text-sm text-stone-600 mt-1">
            {eligibleForBilling} Medicare patients enrolled · CMS 2026 rates · CPT 98977 +
            98980.
          </p>
        </Link>
      </div>

      {/* RTM KPIs */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700">
            RTM (Remote Therapeutic Monitoring)
          </h2>
          <Link href="/rtm" className="text-xs font-medium text-teal-700 hover:text-teal-900">
            View enrollment →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Enrolled" value={enrolled} tone="teal" />
          <KpiCard label="Medicare-billable" value={eligibleForBilling} tone="neutral" />
          <KpiCard label="Total active patients" value={patients.filter(p => p.status === "active").length} tone="neutral" />
          <KpiCard
            label="Untapped revenue / mo"
            value={formatCurrency(untappedMonthlyRTMRevenue(patients))}
            tone="accent"
          />
        </div>
      </div>

      {/* Case management quick links */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Daily workflow
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/schedule" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📅</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Schedule</div>
            <div className="text-xs text-stone-600 mt-1">Today's appointments + the next 14 days. Mark arrived, no-show, completed.</div>
          </Link>
          <Link href="/followups" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📞</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Follow-ups</div>
            <div className="text-xs text-stone-600 mt-1">Call queue: post-discharge check-ins, no-show recovery, auth expirations.</div>
          </Link>
          <Link href="/waitlist" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📋</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Waitlist</div>
            <div className="text-xs text-stone-600 mt-1">Slot just opened? Filter by day/time to find the right patient to call.</div>
          </Link>
          <Link href="/patients" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📂</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Patient cases</div>
            <div className="text-xs text-stone-600 mt-1">Every patient's complete timeline in one screen.</div>
          </Link>
        </div>
      </div>

      {/* Insights quick links */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Insights
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/patient-app" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📱</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Patient app preview</div>
            <div className="text-xs text-stone-600 mt-1">See what your patient sees on their phone every morning.</div>
          </Link>
          <Link href="/physicians" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📊</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Physician scorecard</div>
            <div className="text-xs text-stone-600 mt-1">Which referring docs drive your business and which don't.</div>
          </Link>
          <Link href="/outcomes" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">🩺</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Outcomes</div>
            <div className="text-xs text-stone-600 mt-1">PROMs over time. Proof your treatment is working.</div>
          </Link>
          <Link href="/money" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">💰</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">The money view</div>
            <div className="text-xs text-stone-600 mt-1">Visits + RTM + cash on one screen. Run rate and untapped revenue.</div>
          </Link>
          <Link href="/forecast" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">📈</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Revenue forecast</div>
            <div className="text-xs text-stone-600 mt-1">Drag sliders. Watch your 5-year revenue projection update live.</div>
          </Link>
          <Link href="/denials" className="card p-4 hover:shadow-md transition group">
            <div className="text-2xl mb-1">🛡</div>
            <div className="font-semibold text-stone-900 text-sm group-hover:text-teal-700">Denial protector</div>
            <div className="text-xs text-stone-600 mt-1">Catch claim killers before you submit, not after the denial.</div>
          </Link>
        </div>
      </div>

      {/* Why this matters */}
      <div className="card p-5 bg-teal-50 border-teal-200">
        <div className="flex items-start gap-3">
          <div className="text-teal-700 text-lg">ⓘ</div>
          <div className="text-sm text-teal-900">
            <strong>Why Cadence tracks POC transmission.</strong> Medicare's January 2025
            rule change means PTs no longer need a physician's signature on the Plan of Care
            certification — they only need to <em>document the POC was transmitted to the
            referring physician within 30 days of the initial evaluation</em>. Cadence
            timestamps every transmission so your Medicare claims are audit-ready.
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "teal" | "neutral" | "warning" | "accent";
}) {
  const tones: Record<string, string> = {
    teal: "text-teal-800",
    neutral: "text-stone-800",
    warning: "text-amber-700",
    accent: "text-accent-600",
  };
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

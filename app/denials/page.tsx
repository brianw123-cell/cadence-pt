"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useReferralsRepo } from "@/lib/repo";
import { scanDenialRisks, type DenialSeverity } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

const sevTone: Record<DenialSeverity, { bg: string; text: string; badge: string; label: string }> = {
  critical: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-900",
    badge: "bg-red-600 text-white",
    label: "CRITICAL",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-900",
    badge: "bg-amber-600 text-white",
    label: "WARNING",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-900",
    badge: "bg-blue-600 text-white",
    label: "INFO",
  },
};

const RULE_DETAIL: Record<string, string> = {
  "CMS-POC-30":
    "Medicare's January 2025 rule requires Plan of Care transmission to the referring provider within 30 days of evaluation. Missed POC transmission puts the entire course of care at denial risk.",
  "AUTH-LIMIT":
    "Patient is at or beyond authorized visit count. The next visit will deny unless re-authorization is in place. UHC Medicare Advantage requires medical-necessity review past visit 6.",
  "DX-CODE":
    "Claims must include a specific ICD-10 diagnosis code. Generic descriptions without a code will reject at the clearinghouse before reaching the payer.",
  "PA-MISSING":
    "This payer requires authorization before treatment. Any visits billed without an auth on file will be denied with no appeal path.",
};

const RULE_ACTION: Record<string, string> = {
  "CMS-POC-30": "Log POC transmission",
  "AUTH-LIMIT": "Submit re-auth request",
  "DX-CODE": "Add ICD-10 code",
  "PA-MISSING": "Request authorization",
};

export default function DenialsPage() {
  const referrals = useReferralsRepo().list();
  const today = new Date().toISOString().slice(0, 10);

  const risks = useMemo(() => scanDenialRisks(referrals, today), [referrals, today]);

  const counts = {
    critical: risks.filter((r) => r.severity === "critical").length,
    warning: risks.filter((r) => r.severity === "warning").length,
    info: risks.filter((r) => r.severity === "info").length,
  };
  const totalLoss = risks.reduce((sum, r) => sum + r.estimatedLoss, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Denial protector</h1>
        <p className="text-sm text-stone-600 mt-1">
          Real-time scan of every active patient against the top reasons Medicare and
          commercial payers deny PT claims. Fix issues before you submit, not after the
          denial.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Summary label="Critical" value={counts.critical.toString()} severity="critical" />
        <Summary label="Warnings" value={counts.warning.toString()} severity="warning" />
        <Summary label="Info" value={counts.info.toString()} severity="info" />
        <Summary
          label="Revenue at risk"
          value={formatCurrency(totalLoss)}
          severity="critical"
          subtitle="If unfixed"
        />
      </div>

      {risks.length === 0 ? (
        <div className="card p-12 text-center bg-emerald-50 border-emerald-200">
          <div className="text-5xl mb-2">✓</div>
          <h2 className="text-xl font-bold text-emerald-900 mb-1">All clear</h2>
          <p className="text-sm text-emerald-800">
            No denial-risk issues across your active caseload.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk, i) => {
            const tone = sevTone[risk.severity];
            return (
              <div key={`${risk.referralId}-${risk.ruleCode}-${i}`} className={`card p-4 md:p-5 ${tone.bg}`}>
                <div className="flex items-start gap-3 md:gap-4">
                  <span className={`badge ${tone.badge} px-2.5 flex-shrink-0`}>
                    <span className="sr-only">Severity: </span>
                    {tone.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                      <h3 className={`font-bold ${tone.text}`}>
                        {risk.title} — {risk.patientName}
                      </h3>
                      <span className="text-xs font-mono text-stone-700 flex-shrink-0">
                        {risk.ruleCode}
                      </span>
                    </div>
                    <p className={`text-sm ${tone.text} leading-relaxed`}>
                      {RULE_DETAIL[risk.ruleCode] ?? "Issue detected."}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-current/10">
                      <div className="text-xs">
                        {risk.estimatedLoss > 0 ? (
                          <span className={tone.text}>
                            <strong>Estimated loss if unfixed:</strong>{" "}
                            {formatCurrency(risk.estimatedLoss)}
                          </span>
                        ) : (
                          <span className="text-stone-600">No direct loss — prevents downstream gap</span>
                        )}
                      </div>
                      <Link
                        href={`/referrals/${risk.referralId}`}
                        className="btn-primary text-xs self-start sm:self-auto"
                      >
                        {RULE_ACTION[risk.ruleCode] ?? "Open"} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-5 bg-stone-50">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          What Cadence checks for
        </h3>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-stone-700">
          <div><strong>CMS-POC-30:</strong> Plan of Care transmitted to MD within 30 days (Jan 2025 rule)</div>
          <div><strong>AUTH-LIMIT:</strong> Visit count remaining against authorized total</div>
          <div><strong>AUTH-EXPIRY:</strong> Authorization valid-through date approaching</div>
          <div><strong>DX-CODE:</strong> Specific ICD-10 code present on patient record</div>
          <div><strong>PA-MISSING:</strong> Prior auth required by payer, none on file</div>
          <div><strong>KX-CAP:</strong> KX modifier applied when annual cap exceeded (CY2026: $2,480)</div>
          <div><strong>CQ-MOD:</strong> CQ modifier on PTA-furnished services (85% payment)</div>
          <div><strong>RTM-EVIDENCE:</strong> Documented patient interaction before RTM claim</div>
        </div>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  severity,
  subtitle,
}: {
  label: string;
  value: string;
  severity: DenialSeverity;
  subtitle?: string;
}) {
  const colors: Record<DenialSeverity, string> = {
    critical: "text-red-700",
    warning: "text-amber-700",
    info: "text-blue-700",
  };
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${colors[severity]}`}>{value}</div>
      {subtitle && <div className="text-xs text-stone-500 mt-1">{subtitle}</div>}
    </div>
  );
}

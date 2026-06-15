"use client";

import Link from "next/link";
import { useState } from "react";
import { useReferralsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { STAGE_ORDER, STAGE_LABELS, type ReferralStage, type Referral } from "@/lib/types";
import { daysSince } from "@/lib/utils";

const stageTone: Record<ReferralStage, string> = {
  new: "bg-blue-50 border-blue-200",
  contacted: "bg-indigo-50 border-indigo-200",
  verified: "bg-cyan-50 border-cyan-200",
  authorized: "bg-teal-50 border-teal-200",
  scheduled: "bg-emerald-50 border-emerald-200",
  evaluated: "bg-lime-50 border-lime-200",
  active: "bg-stone-50 border-stone-200",
  discharged: "bg-stone-100 border-stone-300",
};

const channelIcon: Record<string, string> = {
  fax: "📠",
  portal: "🖥",
  email: "✉",
  phone: "☎",
  "walk-in": "👤",
};

export default function ReferralsPage() {
  const repo = useReferralsRepo();
  const referrals = repo.list();
  const updateStage = repo.updateStage;

  const [pendingDischarge, setPendingDischarge] = useState<Referral | null>(null);

  // Group by stage
  const byStage: Record<ReferralStage, Referral[]> = {
    new: [], contacted: [], verified: [], authorized: [],
    scheduled: [], evaluated: [], active: [], discharged: [],
  };
  for (const r of referrals) byStage[r.stage].push(r);

  const advance = (r: Referral) => {
    const idx = STAGE_ORDER.indexOf(r.stage);
    const nextStage = STAGE_ORDER[idx + 1];
    if (!nextStage) return;
    if (nextStage === "discharged") {
      setPendingDischarge(r);
      return;
    }
    updateStage(r.id, nextStage);
    toast.info(`${r.patientName} moved to ${STAGE_LABELS[nextStage]}`);
  };

  const confirmDischarge = () => {
    if (!pendingDischarge) return;
    updateStage(pendingDischarge.id, "discharged");
    toast.success(`${pendingDischarge.patientName} discharged`, "Course of care complete.");
    setPendingDischarge(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Referral funnel</h1>
          <p className="text-sm text-stone-600 mt-1">
            Every inbound referral, from fax to discharge — with auto-tracked
            authorization counts and POC transmission compliance.
          </p>
        </div>
        <Link href="/referrals/new" className="btn-primary">
          + New referral
        </Link>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3 min-w-max pb-4">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="w-60 md:w-72 flex-shrink-0">
              <div className={`rounded-t-md border-x border-t px-3 py-2 ${stageTone[stage]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-stone-700">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="badge bg-white text-stone-700 border border-stone-300">
                    {byStage[stage].length}
                  </span>
                </div>
              </div>
              <div className="border-x border-b rounded-b-md border-stone-200 bg-stone-50 min-h-[300px] p-2 space-y-2">
                {byStage[stage].map((r) => (
                  <ReferralCard
                    key={r.id}
                    referral={r}
                    onAdvance={() => advance(r)}
                  />
                ))}
                {byStage[stage].length === 0 && (
                  <div className="text-xs text-stone-500 italic text-center pt-8">
                    No referrals
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {referrals.length === 0 && (
        <EmptyState
          icon="📋"
          title="No referrals yet"
          body="Add your first inbound physician order and Cadence will track every step from receipt through discharge."
          actionLabel="+ New referral"
          actionHref="/referrals/new"
        />
      )}

      <ConfirmDialog
        open={!!pendingDischarge}
        tone="default"
        title={`Discharge ${pendingDischarge?.patientName ?? "this patient"}?`}
        body="Discharging closes out this episode of care. The patient is removed from your active caseload. You can re-open a new referral for them later, but their RTM enrollment for this episode also ends and the setup fee (CPT 98975) cannot be re-billed."
        confirmLabel="Discharge"
        cancelLabel="Not yet"
        onConfirm={confirmDischarge}
        onCancel={() => setPendingDischarge(null)}
      />
    </div>
  );
}

function ReferralCard({ referral, onAdvance }: { referral: Referral; onAdvance: () => void }) {
  const age = daysSince(referral.receivedAt);
  const auth = referral.authorization;
  const visitsRemaining = auth ? auth.visitsApproved - auth.visitsUsed : null;
  const authAtRisk = visitsRemaining !== null && visitsRemaining <= 1;
  const pocOverdue =
    referral.evaluationDate &&
    referral.pocTransmissions.length === 0 &&
    (daysSince(referral.evaluationDate) ?? 0) > 30;

  return (
    <Link href={`/referrals/${referral.id}`} className="card p-3 block hover:shadow-md transition">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm text-stone-900 truncate">
          {referral.patientName}
        </span>
        <span className="text-xs text-stone-500">{channelIcon[referral.intakeChannel]}</span>
      </div>
      <div className="text-xs text-stone-600 truncate">{referral.diagnosis}</div>
      <div className="text-[11px] text-stone-500 mt-1">
        {referral.insurancePrimary}
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-stone-500">
          {age === 0 ? "today" : `${age}d ago`}
        </span>
        <div className="flex items-center gap-1">
          {authAtRisk && (
            <span className="badge bg-red-100 text-red-800">
              Auth: {visitsRemaining}/{auth!.visitsApproved}
            </span>
          )}
          {pocOverdue && (
            <span className="badge bg-amber-100 text-amber-800">POC overdue</span>
          )}
        </div>
      </div>
      {referral.stage !== "discharged" && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onAdvance();
          }}
          className="text-[11px] text-teal-700 hover:text-teal-900 mt-2 font-medium"
        >
          Advance →
        </button>
      )}
    </Link>
  );
}

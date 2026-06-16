"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useReferralsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import ReferralInfoCard from "@/components/referrals/ReferralInfoCard";
import POCTransmissionLog from "@/components/referrals/POCTransmissionLog";
import AuthorizationCard from "@/components/referrals/AuthorizationCard";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/types";
import { formatDate, age } from "@/lib/utils";

export default function ReferralDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const repo = useReferralsRepo();
  const referral = repo.get(id);

  const [pendingDischarge, setPendingDischarge] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!referral) {
    return (
      <div>
        <p>Referral not found.</p>
        <Link href="/referrals" className="text-teal-700">
          ← Back to funnel
        </Link>
      </div>
    );
  }

  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(referral.stage) + 1];

  const advance = () => {
    if (!nextStage) return;
    if (nextStage === "discharged") {
      setPendingDischarge(true);
      return;
    }
    repo.updateStage(referral.id, nextStage);
    toast.info(`${referral.patientName} moved to ${STAGE_LABELS[nextStage]}`);
  };

  const confirmDischarge = () => {
    repo.updateStage(referral.id, "discharged");
    toast.success(`${referral.patientName} discharged`, "Course of care complete.");
    setPendingDischarge(false);
  };

  return (
    <div className="max-w-5xl">
      <Link href="/referrals" className="text-sm text-teal-700 hover:text-teal-900">
        ← Back to funnel
      </Link>

      <div className="mt-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">{referral.patientName}</h1>
          <p className="text-sm text-stone-600 mt-1">
            Age {age(referral.dateOfBirth)} · DOB {formatDate(referral.dateOfBirth)} · {referral.location}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-teal-100 text-teal-800">{STAGE_LABELS[referral.stage]}</span>
          {referral.stage !== "discharged" && nextStage && (
            <button onClick={advance} className="btn-primary">
              Advance to {STAGE_LABELS[nextStage]} →
            </button>
          )}
          <Link href={`/referrals/${referral.id}/edit`} className="btn-secondary text-sm">
            ✎ Edit
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-secondary text-sm text-red-700 hover:text-red-800"
          >
            🗑 Delete
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="md:col-span-2 space-y-4">
          <ReferralInfoCard referral={referral} />
          <POCTransmissionLog
            referral={referral}
            onLogTransmission={(t) => {
              repo.addPOCTransmission(referral.id, t);
              toast.success("POC transmission logged", `Sent to ${t.recipient} via ${t.method}.`);
            }}
          />
        </div>

        <div className="space-y-4">
          <AuthorizationCard
            referral={referral}
            onSetAuthorization={(a) => {
              repo.setAuthorization(referral.id, a);
              toast.success("Authorization saved");
            }}
            onIncrementVisit={() => {
              repo.incrementVisitsUsed(referral.id);
              toast.info("Visit logged");
            }}
          />

          <div className="card p-4 bg-stone-50">
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900">Why Cadence?</strong> No PT EMR at this
              price point combines fax-based referral capture, real-time auth visit
              tracking, and the Jan 2025 POC transmission log in one workflow. Most
              practices track this in spreadsheets.
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDischarge}
        tone="default"
        title={`Discharge ${referral.patientName}?`}
        body="Discharging closes out this episode of care. The patient is removed from your active caseload. You can re-open a new referral for them later, but their RTM enrollment for this episode also ends and the setup fee (CPT 98975) cannot be re-billed."
        confirmLabel="Discharge"
        cancelLabel="Not yet"
        onConfirm={confirmDischarge}
        onCancel={() => setPendingDischarge(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title={`Delete this referral?`}
        body={`This permanently removes the referral for ${referral.patientName}, plus its authorization and Plan of Care transmission log. The patient record itself remains. This action cannot be undone.`}
        confirmLabel="Delete referral"
        cancelLabel="Cancel"
        onConfirm={() => {
          const name = referral.patientName;
          repo.remove(referral.id);
          toast.warning(`Referral for ${name} deleted`);
          router.push("/referrals");
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

import type { Referral } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReferralInfoCard({ referral }: { referral: Referral }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
        Referral details
      </h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Row
          label="Diagnosis"
          value={`${referral.diagnosis}${referral.diagnosisCode ? ` (${referral.diagnosisCode})` : ""}`}
        />
        <Row label="Referring physician" value={referral.referringPhysician} />
        <Row label="Physician fax" value={referral.physicianFax || "—"} />
        <Row label="Physician NPI" value={referral.physicianNPI || "—"} />
        <Row label="Intake channel" value={referral.intakeChannel} />
        <Row label="Received" value={formatDate(referral.receivedAt)} />
        <Row label="Primary insurance" value={referral.insurancePrimary} />
        <Row label="Member ID" value={referral.insuranceMemberId || "—"} />
        <Row
          label="Evaluation date"
          value={referral.evaluationDate ? formatDate(referral.evaluationDate) : "Not yet"}
        />
        <Row label="Prior auth required" value={referral.priorAuthRequired ? "Yes" : "No"} />
      </dl>
      {referral.notes && (
        <div className="mt-4 text-sm text-stone-700 bg-stone-50 p-3 rounded">
          <strong className="text-stone-900">Notes:</strong> {referral.notes}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-900">{value}</dd>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Referral, POCTransmission } from "@/lib/types";
import { pocComplianceStatus, type POCStatus } from "@/lib/calculations";
import { formatDate, daysSince } from "@/lib/utils";

type Method = "fax" | "secure-message" | "portal" | "email";

export default function POCTransmissionLog({
  referral,
  onLogTransmission,
}: {
  referral: Referral;
  onLogTransmission: (t: Omit<POCTransmission, "id">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>("fax");

  const today = new Date().toISOString().slice(0, 10);
  const status = pocComplianceStatus(referral, today);
  const daysSinceEval = referral.evaluationDate ? daysSince(referral.evaluationDate) : null;

  const submit = () => {
    onLogTransmission({
      sentAt: today,
      method,
      recipient: referral.referringPhysician,
      daysFromEval: daysSinceEval ?? 0,
    });
    setOpen(false);
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700">
            Plan of care transmission log
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            Medicare's Jan 2025 rule: POC must be transmitted to referring physician
            within 30 days of evaluation.
          </p>
        </div>
        <button onClick={() => setOpen(!open)} className="btn-secondary text-xs">
          {open ? "Cancel" : "+ Log transmission"}
        </button>
      </div>

      <PocStatusBanner status={status} daysSinceEval={daysSinceEval} />

      {open && (
        <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-md space-y-3">
          <div>
            <label className="label">Method</label>
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
            >
              <option value="fax">Fax</option>
              <option value="secure-message">Direct Secure Message</option>
              <option value="portal">Physician portal</option>
              <option value="email">Email</option>
            </select>
          </div>
          <button onClick={submit} className="btn-primary">
            Confirm sent — log timestamp
          </button>
        </div>
      )}

      {referral.pocTransmissions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {referral.pocTransmissions.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between text-sm border border-stone-200 rounded-md p-3"
            >
              <div>
                <div className="font-medium text-stone-900">
                  {formatDate(t.sentAt)} via {t.method}
                </div>
                <div className="text-xs text-stone-600">
                  To {t.recipient} · {t.daysFromEval} day{t.daysFromEval !== 1 ? "s" : ""} after eval
                  {t.acknowledgedAt && ` · Acknowledged ${formatDate(t.acknowledgedAt)}`}
                </div>
              </div>
              <span className="badge bg-emerald-100 text-emerald-800">
                {t.acknowledgedAt ? "Acknowledged" : "Sent"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PocStatusBanner({
  status,
  daysSinceEval,
}: {
  status: POCStatus;
  daysSinceEval: number | null;
}) {
  if (status === "no-eval") {
    return (
      <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded p-3">
        Plan of care transmission required within 30 days of initial evaluation. No
        evaluation logged yet.
      </div>
    );
  }
  if (status === "compliant") {
    return (
      <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
        ✓ POC transmitted. Medicare Plan of Care certification requirement satisfied.
      </div>
    );
  }
  if (status === "overdue") {
    return (
      <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-3">
        ⚠ POC overdue. {daysSinceEval} days since evaluation. Medicare denial risk —
        transmit immediately and document.
      </div>
    );
  }
  return (
    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
      POC transmission pending. Window: {30 - (daysSinceEval ?? 0)} days remaining
      before Medicare compliance risk.
    </div>
  );
}

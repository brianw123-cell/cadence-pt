"use client";

import { useState } from "react";
import type { Referral, Authorization } from "@/lib/types";
import { isAuthAtRisk } from "@/lib/calculations";
import { formatDate } from "@/lib/utils";

export default function AuthorizationCard({
  referral,
  onSetAuthorization,
  onIncrementVisit,
}: {
  referral: Referral;
  onSetAuthorization: (a: Omit<Authorization, "id">) => void;
  onIncrementVisit: () => void;
}) {
  const auth = referral.authorization;
  const atRisk = isAuthAtRisk(referral);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
        Authorization
      </h3>
      {auth ? (
        <ActiveAuth
          auth={auth}
          atRisk={atRisk}
          onIncrementVisit={onIncrementVisit}
        />
      ) : (
        <NewAuthForm
          defaultPayer={referral.insurancePrimary}
          onSubmit={onSetAuthorization}
        />
      )}
    </div>
  );
}

function ActiveAuth({
  auth,
  atRisk,
  onIncrementVisit,
}: {
  auth: Authorization;
  atRisk: boolean;
  onIncrementVisit: () => void;
}) {
  const pct = (auth.visitsUsed / auth.visitsApproved) * 100;
  return (
    <>
      <div className="text-xs text-stone-500 mb-1">Payer</div>
      <div className="text-sm font-medium text-stone-900 mb-3">{auth.payer}</div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-xs text-stone-500">Visits used</div>
          <div className="text-2xl font-bold text-stone-900">
            {auth.visitsUsed}{" "}
            <span className="text-base text-stone-500">/ {auth.visitsApproved}</span>
          </div>
        </div>
        <span
          className={`badge ${atRisk ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}
        >
          <span className="sr-only">Authorization status: </span>
          {atRisk ? "AT RISK" : auth.status}
        </span>
      </div>

      <div className="w-full h-2 bg-stone-100 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full ${atRisk ? "bg-red-500" : "bg-teal-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {atRisk && (
        <div className="mt-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">
          ⚠ Re-authorize before next visit. UHC Medicare Advantage requires
          medical-necessity review past visit 6.
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-stone-500">Valid from</div>
          <div className="text-stone-900">{formatDate(auth.validFrom)}</div>
        </div>
        <div>
          <div className="text-stone-500">Through</div>
          <div className="text-stone-900">{formatDate(auth.validThrough)}</div>
        </div>
      </div>

      <button
        onClick={onIncrementVisit}
        className="btn-secondary w-full mt-4 text-xs"
      >
        Log a visit (+1 used)
      </button>
    </>
  );
}

function NewAuthForm({
  defaultPayer,
  onSubmit,
}: {
  defaultPayer: string;
  onSubmit: (a: Omit<Authorization, "id">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    payer: "",
    authNumber: "",
    visitsApproved: 6,
    validFrom: new Date().toISOString().slice(0, 10),
    validThrough: new Date(Date.now() + 60 * 86400_000).toISOString().slice(0, 10),
  });

  return (
    <>
      <p className="text-sm text-stone-600 mb-3">No authorization on file.</p>
      <button onClick={() => setOpen(!open)} className="btn-primary w-full">
        {open ? "Cancel" : "+ Add authorization"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">Payer</label>
            <input
              className="input"
              value={form.payer}
              onChange={(e) => setForm({ ...form, payer: e.target.value })}
              placeholder={defaultPayer}
            />
          </div>
          <div>
            <label className="label">Auth #</label>
            <input
              className="input"
              value={form.authNumber}
              onChange={(e) => setForm({ ...form, authNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Visits approved</label>
            <input
              type="number"
              className="input"
              value={form.visitsApproved}
              onChange={(e) =>
                setForm({ ...form, visitsApproved: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <button
            onClick={() => {
              onSubmit({ ...form, visitsUsed: 0, status: "approved" });
              setOpen(false);
            }}
            className="btn-primary w-full"
          >
            Save authorization
          </button>
        </div>
      )}
    </>
  );
}

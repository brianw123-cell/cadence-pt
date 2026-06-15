"use client";

import { useMemo } from "react";
import { useReferralsRepo } from "@/lib/repo";
import { physicianScorecard } from "@/lib/calculations";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PhysiciansPage() {
  const referrals = useReferralsRepo().list();

  const rows = useMemo(() => physicianScorecard(referrals), [referrals]);

  const lastReferralByPhysician = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of referrals) {
      const cur = map.get(r.referringPhysician);
      if (!cur || r.receivedAt > cur) map.set(r.referringPhysician, r.receivedAt);
    }
    return map;
  }, [referrals]);

  const totalRevenue = rows.reduce((sum, r) => sum + r.estimatedRevenue, 0);
  const totalReferrals = rows.reduce((sum, r) => sum + r.totalReferrals, 0);
  const avgConversion = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.conversionRate, 0) / rows.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Referring physicians</h1>
        <p className="text-sm text-stone-600 mt-1">
          The data your old EMR never showed you — who drives your business and what
          they're worth. Use this to plan outreach.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Summary label="Active referrers" value={rows.length.toString()} />
        <Summary label="Total referrals tracked" value={totalReferrals.toString()} />
        <Summary label="Avg conversion to eval" value={`${avgConversion}%`} />
        <Summary
          label="Est. revenue attributed"
          value={formatCurrency(totalRevenue)}
          tone="emerald"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <caption className="sr-only">Referring physician scorecard ranked by revenue attribution</caption>
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr className="text-left text-xs uppercase tracking-wide text-stone-700">
              <th scope="col" className="px-4 py-3 font-semibold">Physician</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Referrals</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Conv. %</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Avg days to eval</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Evaluated</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">POC compliance</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Revenue</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Last sent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-900">{r.name}</td>
                <td className="px-4 py-3 text-center text-stone-800">{r.totalReferrals}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`font-semibold ${
                      r.conversionRate >= 75
                        ? "text-emerald-700"
                        : r.conversionRate >= 50
                          ? "text-amber-700"
                          : "text-red-700"
                    }`}
                  >
                    {r.conversionRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-stone-700">
                  {r.avgDaysToEval !== null ? `${r.avgDaysToEval}d` : "—"}
                </td>
                <td className="px-4 py-3 text-center text-stone-800">{r.evaluated}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`badge ${
                      r.pocComplianceRate === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.pocComplianceRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                  {formatCurrency(r.estimatedRevenue)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-stone-600">
                  {lastReferralByPhysician.get(r.name)
                    ? formatDate(lastReferralByPhysician.get(r.name)!)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5 bg-amber-50 border-amber-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 mb-2">
            Outreach prompts
          </h3>
          <ul className="text-sm text-amber-900 space-y-2">
            {rows
              .filter((r) => r.conversionRate < 75 && r.totalReferrals >= 2)
              .map((r) => (
                <li key={r.name}>
                  <strong>{r.name.split(",")[0]}</strong>: conversion is {r.conversionRate}% —
                  ask your front desk where these patients drop out.
                </li>
              ))}
            {rows
              .filter((r) => r.pocComplianceRate < 100 && r.totalReferrals >= 2)
              .map((r) => (
                <li key={`poc-${r.name}`}>
                  <strong>{r.name.split(",")[0]}</strong> has open POC transmissions — fix
                  before Medicare audit window closes.
                </li>
              ))}
            {rows.every((r) => r.conversionRate >= 75 && r.pocComplianceRate === 100) && (
              <li>All referrers are performing well. Run a thank-you campaign to your top three.</li>
            )}
          </ul>
        </div>

        <div className="card p-5 bg-teal-50 border-teal-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-teal-800 mb-2">
            Why this matters
          </h3>
          <div className="text-sm text-teal-900 leading-relaxed">
            Most PT EMRs don't tell you which referring physicians are worth your time.
            Cadence ranks them by revenue contributed, time-to-eval, and POC compliance —
            so your monthly physician-outreach lunch goes to the highest-value relationship,
            not whoever happens to be top of mind.
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className={`card p-4 ${tone === "emerald" ? "bg-emerald-50 border-emerald-200" : ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${tone === "emerald" ? "text-emerald-900" : "text-stone-900"}`}>
        {value}
      </div>
    </div>
  );
}

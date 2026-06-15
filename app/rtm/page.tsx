"use client";

import Link from "next/link";
import { usePatientsRepo, useCheckinsRepo } from "@/lib/repo";
import { RTM_RATES } from "@/lib/types";
import { age, daysSince, formatCurrency, formatDate } from "@/lib/utils";

export default function RTMPage() {
  const patientsRepo = usePatientsRepo();
  const patients = patientsRepo.list();
  const checkins = useCheckinsRepo().list();
  const enroll = patientsRepo.enrollRTM;

  const enrolled = patients.filter((p) => p.rtmEnrolled);
  const eligibleNotEnrolled = patients.filter(
    (p) =>
      !p.rtmEnrolled &&
      (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage") &&
      p.status === "active",
  );

  const billableEnrolled = enrolled.filter(
    (p) => p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage",
  );
  const monthlyRevenuePerPatient = RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount;
  const projectedMonthly = billableEnrolled.length * monthlyRevenuePerPatient;
  const untappedMonthly = eligibleNotEnrolled.length * monthlyRevenuePerPatient;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Remote Therapeutic Monitoring</h1>
        <p className="text-sm text-stone-600 mt-1">
          Enrolled patients, adherence data, and projected Medicare revenue based on CMS 2026 rates.
        </p>
      </div>

      {/* Revenue summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-1">
            Projected this month
          </div>
          <div className="text-3xl font-bold text-emerald-900">{formatCurrency(projectedMonthly)}</div>
          <div className="text-xs text-emerald-800 mt-2">
            {billableEnrolled.length} Medicare patients × {formatCurrency(monthlyRevenuePerPatient)}/mo
          </div>
        </div>
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">
            Untapped revenue
          </div>
          <div className="text-3xl font-bold text-amber-900">{formatCurrency(untappedMonthly)}</div>
          <div className="text-xs text-amber-800 mt-2">
            {eligibleNotEnrolled.length} Medicare patients eligible but not enrolled
          </div>
        </div>
        <div className="card p-5 bg-teal-50 border-teal-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-800 mb-1">
            Annualized at full enrollment
          </div>
          <div className="text-3xl font-bold text-teal-900">
            {formatCurrency((projectedMonthly + untappedMonthly) * 12)}
          </div>
          <div className="text-xs text-teal-800 mt-2">If every Medicare patient on caseload enrolled in RTM</div>
        </div>
      </div>

      {/* CMS code reference */}
      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          CMS 2026 RTM reimbursement rates (national average)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-stone-500 border-b border-stone-200">
              <tr className="text-left">
                <th className="py-2">CPT</th>
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(RTM_RATES).map((r) => (
                <tr key={r.code} className="border-b border-stone-100">
                  <td className="py-2 font-mono text-teal-700">{r.code}</td>
                  <td className="py-2 text-stone-800">{r.description}</td>
                  <td className="py-2 text-right text-stone-900 font-medium">
                    {formatCurrency(r.amount)}
                  </td>
                  <td className="py-2 text-xs text-stone-600">{r.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolled patients */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Enrolled ({enrolled.length})
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {enrolled.map((p) => {
            const patientCheckins = checkins.filter((c) => c.patientId === p.id);
            const last = patientCheckins[0];
            const adherence = patientCheckins.length > 0
              ? Math.round((patientCheckins.reduce((sum, c) => sum + c.exercisesCompleted / c.exercisesPrescribed, 0) / patientCheckins.length) * 100)
              : 0;
            const daysEnrolled = p.rtmEnrolledAt ? daysSince(p.rtmEnrolledAt) : 0;
            return (
              <Link
                key={p.id}
                href={`/rtm/${p.id}`}
                className="card p-4 hover:shadow-md transition block"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-stone-900">{p.name}</div>
                    <div className="text-xs text-stone-600">{p.primaryDiagnosis}</div>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-800">
                    {daysEnrolled}d enrolled
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-stone-100">
                  <div>
                    <div className="text-[10px] uppercase text-stone-500">Check-ins</div>
                    <div className="text-lg font-bold text-stone-900">{patientCheckins.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-stone-500">Adherence</div>
                    <div className={`text-lg font-bold ${adherence >= 70 ? "text-emerald-700" : "text-amber-700"}`}>
                      {adherence}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-stone-500">Last seen</div>
                    <div className="text-sm font-medium text-stone-900">
                      {last ? formatDate(last.date) : "—"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Eligible not enrolled */}
      {eligibleNotEnrolled.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
            Eligible but not enrolled ({eligibleNotEnrolled.length})
          </h3>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {eligibleNotEnrolled.map((p) => (
                  <tr key={p.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{p.name}</div>
                      <div className="text-xs text-stone-500">
                        Age {age(p.dateOfBirth)} · {p.primaryDiagnosis}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-700">{p.primaryInsurance}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-emerald-700 mr-3">
                        +{formatCurrency(monthlyRevenuePerPatient)}/mo
                      </span>
                      <button
                        onClick={() => enroll(p.id)}
                        className="btn-primary text-xs"
                      >
                        Enroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

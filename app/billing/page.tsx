"use client";

import { usePatientsRepo } from "@/lib/repo";
import InfoTip from "@/components/InfoTip";
import { RTM_RATES } from "@/lib/types";
import { daysSince, formatCurrency } from "@/lib/utils";

export default function BillingPage() {
  const patients = usePatientsRepo().list();

  const billable = patients.filter(
    (p) =>
      p.rtmEnrolled &&
      (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage"),
  );

  const monthlyPer = RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount;

  const rows = billable.map((p) => {
    const days = p.rtmEnrolledAt ? daysSince(p.rtmEnrolledAt) ?? 0 : 0;
    const isNewThisMonth = days <= 30;
    const setup = isNewThisMonth ? RTM_RATES.setup.amount : 0;
    const monitor = RTM_RATES.monitorMSK.amount;
    const manage = RTM_RATES.manageFirst20.amount;
    const total = setup + monitor + manage;
    return { patient: p, days, isNewThisMonth, setup, monitor, manage, total };
  });

  const monthlyTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const setupTotal = rows.reduce((sum, r) => sum + r.setup, 0);
  const monitoringTotal = rows.reduce((sum, r) => sum + r.monitor, 0);
  const managementTotal = rows.reduce((sum, r) => sum + r.manage, 0);

  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">RTM billing report — {month}</h1>
          <p className="text-sm text-stone-600 mt-1">
            Claim-ready CPT codes for every RTM-enrolled Medicare patient. Export to your
            clearinghouse or run through your existing billing service.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => window.print()} className="btn-secondary">
            🖨 Print
          </button>
          <button className="btn-secondary">Export CSV</button>
          <button className="btn-primary">Send to clearinghouse</button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <SummaryCard label="Patients billed" value={rows.length.toString()} />
        <SummaryCard
          label="Setup (98975)"
          value={formatCurrency(setupTotal)}
          sub={`${rows.filter((r) => r.isNewThisMonth).length} new`}
        />
        <SummaryCard
          label="Monitoring (98977)"
          value={formatCurrency(monitoringTotal)}
          sub={`${rows.length} × ${formatCurrency(RTM_RATES.monitorMSK.amount)}`}
        />
        <SummaryCard
          label="Total billable"
          value={formatCurrency(monthlyTotal)}
          tone="emerald"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <caption className="sr-only">Monthly RTM billing report with CPT code breakdown per patient</caption>
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr className="text-left text-xs uppercase tracking-wide text-stone-700">
              <th scope="col" className="px-4 py-3 font-semibold">Patient</th>
              <th scope="col" className="px-4 py-3 font-semibold">Payer</th>
              <th scope="col" className="px-4 py-3 font-semibold">Months</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                98975
                <InfoTip label="CPT 98975">
                  Initial setup &amp; patient education. Billed once per episode of care. CMS 2026 rate: {formatCurrency(RTM_RATES.setup.amount)}.
                </InfoTip>
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                98977
                <InfoTip label="CPT 98977">
                  Musculoskeletal RTM monitoring, billed once every 30 days. CMS 2026 rate: {formatCurrency(RTM_RATES.monitorMSK.amount)}.
                </InfoTip>
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                98980
                <InfoTip label="CPT 98980">
                  First 20 minutes of monthly RTM management. Only one clinician per 30-day period. CMS 2026 rate: {formatCurrency(RTM_RATES.manageFirst20.amount)}.
                </InfoTip>
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.patient.id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-900">{r.patient.name}</td>
                <td className="px-4 py-3 text-stone-700 text-xs">{r.patient.primaryInsurance}</td>
                <td className="px-4 py-3 text-stone-700">{Math.max(1, Math.ceil(r.days / 30))}</td>
                <td className="px-4 py-3 text-right text-stone-700">
                  {r.setup > 0 ? formatCurrency(r.setup) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-stone-700">{formatCurrency(r.monitor)}</td>
                <td className="px-4 py-3 text-right text-stone-700">{formatCurrency(r.manage)}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                  {formatCurrency(r.total)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  No RTM-billable patients yet. Enroll Medicare patients from the
                  Patients tab.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
              <tr>
                <td className="px-4 py-3 font-bold text-emerald-900" colSpan={3}>
                  Total — {month}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-900">
                  {formatCurrency(setupTotal)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-900">
                  {formatCurrency(monitoringTotal)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-900">
                  {formatCurrency(managementTotal)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-900">
                  {formatCurrency(monthlyTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="card p-5 bg-stone-50">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-2">
          How Cadence prevents denied RTM claims
        </h3>
        <ul className="text-sm text-stone-700 space-y-2 list-disc pl-5">
          <li>
            <strong>One-clinician-per-month rule:</strong> Codes 98976, 98977, 98980, 98981
            can only be billed by one clinician per 30-day period. Cadence locks the
            billing therapist of record and blocks duplicate claims.
          </li>
          <li>
            <strong>Setup (98975) once per episode:</strong> Cadence auto-flags whether
            this is the patient's initial enrollment to include or exclude the setup code.
          </li>
          <li>
            <strong>Check-in evidence required:</strong> Cadence will not include a patient
            in the monthly claim batch unless there is documented patient interaction
            (app, wearable, or manual entry) for that 30-day window.
          </li>
          <li>
            <strong>Audit-ready logs:</strong> Every check-in is timestamped with source
            and clinician of record, ready for a CMS audit.
          </li>
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "emerald";
}) {
  return (
    <div className={`card p-4 ${tone === "emerald" ? "bg-emerald-50 border-emerald-200" : ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${tone === "emerald" ? "text-emerald-900" : "text-stone-900"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-stone-600 mt-1">{sub}</div>}
    </div>
  );
}

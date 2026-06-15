"use client";

import { useState, useMemo } from "react";
import { usePatientsRepo } from "@/lib/repo";
import { RTM_RATES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function ForecastPage() {
  const patients = usePatientsRepo().list();

  const currentEnrolled = patients.filter(
    (p) =>
      p.rtmEnrolled &&
      (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage"),
  ).length;

  const eligibleNotEnrolled = patients.filter(
    (p) =>
      !p.rtmEnrolled &&
      (p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage") &&
      p.status === "active",
  ).length;

  const [newPerMonth, setNewPerMonth] = useState(5);
  const [avgMonths, setAvgMonths] = useState(4);
  const [adherenceRate, setAdherenceRate] = useState(85);

  const monthlyPer = RTM_RATES.monitorMSK.amount + RTM_RATES.manageFirst20.amount;
  const setupOnce = RTM_RATES.setup.amount;

  // Build a 12-month projection
  const projection = useMemo(() => {
    const months = 12;
    const enrolled: number[] = [currentEnrolled];
    const monthRevenue: number[] = [];
    const cumulative: number[] = [];
    let cumSum = 0;

    for (let m = 1; m <= months; m++) {
      const newThisMonth = newPerMonth;
      // Patients that have completed their avg term drop off
      const dropping = m > avgMonths ? Math.min(newPerMonth, enrolled[m - 1]) : 0;
      const e = Math.max(0, enrolled[m - 1] + newThisMonth - dropping);
      enrolled.push(e);

      const adherenceMultiplier = adherenceRate / 100;
      const rev = (newThisMonth * setupOnce + e * monthlyPer) * adherenceMultiplier;
      monthRevenue.push(rev);
      cumSum += rev;
      cumulative.push(cumSum);
    }
    return { enrolled: enrolled.slice(1), monthRevenue, cumulative };
  }, [newPerMonth, avgMonths, adherenceRate, currentEnrolled, monthlyPer, setupOnce]);

  const month12Run = projection.monthRevenue[11];
  const month12Enrolled = projection.enrolled[11];
  const annualTotal = projection.cumulative[11];
  const currentRunRate = currentEnrolled * monthlyPer;
  const currentAnnual = currentRunRate * 12;

  const maxBar = Math.max(...projection.monthRevenue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Revenue forecast</h1>
        <p className="text-sm text-stone-600 mt-1">
          Drag the sliders. The chart updates in real time. This is the conversation
          you've never been able to have with your accountant.
        </p>
      </div>

      {/* Current vs Forecast */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
            Today
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {formatCurrency(currentRunRate)}/mo
          </div>
          <div className="text-xs text-stone-600 mt-1">
            From {currentEnrolled} enrolled Medicare patients
          </div>
        </div>
        <div className="card p-5 bg-teal-50 border-teal-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-800 mb-1">
            Month 12 run rate
          </div>
          <div className="text-2xl font-bold text-teal-900">
            {formatCurrency(month12Run)}/mo
          </div>
          <div className="text-xs text-teal-800 mt-1">
            From {Math.round(month12Enrolled)} enrolled patients
          </div>
        </div>
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-1">
            12-month cumulative
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {formatCurrency(annualTotal)}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            Total new revenue vs. {formatCurrency(currentAnnual)} status quo
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-4">
          Scenario controls
        </h3>
        <div className="space-y-5">
          <SliderRow
            label="New RTM enrollments per month"
            value={newPerMonth}
            min={0}
            max={15}
            onChange={setNewPerMonth}
            help={`At current pace, you have ${eligibleNotEnrolled} Medicare patients ready to enroll today.`}
          />
          <SliderRow
            label="Average patient duration (months)"
            value={avgMonths}
            min={2}
            max={9}
            onChange={setAvgMonths}
            help="Typical PT episode is 4–6 months including post-discharge maintenance."
          />
          <SliderRow
            label="Adherence rate (%)"
            value={adherenceRate}
            min={50}
            max={100}
            onChange={setAdherenceRate}
            suffix="%"
            help="Patients with <80% adherence cannot be billed for the monthly management code."
          />
        </div>
      </div>

      {/* 12-month bar chart */}
      <div className="card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Projected monthly RTM revenue
        </h3>
        <div className="flex items-end gap-2 h-48 mb-2">
          {projection.monthRevenue.map((rev, i) => {
            const pct = (rev / maxBar) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div
                  className="w-full bg-teal-600 hover:bg-teal-700 transition rounded-t relative"
                  style={{ height: `${pct}%`, minHeight: 2 }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-stone-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition bg-white border border-stone-200 rounded px-1.5 py-0.5">
                    {formatCurrency(rev)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 text-[10px] text-stone-500">
          {projection.monthRevenue.map((_, i) => (
            <div key={i} className="flex-1 text-center">
              M{i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Money lines */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
            5-year projection at this pace
          </h3>
          <div className="space-y-2 text-sm">
            <Line label="Year 1" value={formatCurrency(annualTotal)} />
            <Line label="Year 2" value={formatCurrency(annualTotal + month12Run * 12)} />
            <Line label="Year 3" value={formatCurrency(annualTotal + month12Run * 24)} />
            <Line
              label="5-year cumulative"
              value={formatCurrency(annualTotal + month12Run * 48)}
              bold
            />
          </div>
        </div>
        <div className="card p-5 bg-amber-50 border-amber-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 mb-2">
            What does this NOT include?
          </h3>
          <ul className="text-sm text-amber-900 space-y-1 list-disc pl-5">
            <li>Insurance visit billing (your core revenue) — unchanged</li>
            <li>Cash-pay services — unchanged</li>
            <li>RTM is incremental on top, not a replacement</li>
            <li>CPT 98981 (extra 20-min management) when sessions exceed 40 min</li>
            <li>Respiratory RTM (98976) — adds $46.83/mo for cardiopulm patients</li>
          </ul>
        </div>
      </div>

      <div className="card p-5 bg-stone-50 text-sm text-stone-700 leading-relaxed">
        <strong className="text-stone-900">Reminder:</strong> all rates are 2026 CMS
        national averages. Your actual reimbursement varies by Medicare locality
        (geographic adjustment factor). Adherence threshold of 80% is the conservative
        compliance bar; some practices bill the management code at lower adherence with
        clear documentation. Don't take this to your auditor without local CPA review.
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  help,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  help?: string;
  suffix?: string;
}) {
  const sliderId = `slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={sliderId} className="text-sm font-medium text-stone-800">{label}</label>
        <span className="text-2xl font-bold text-teal-700" aria-hidden="true">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuetext={`${value}${suffix ?? ""}`}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-teal-700"
      />
      {help && <p className="text-xs text-stone-500 mt-1">{help}</p>}
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between py-1 ${
        bold ? "border-t border-stone-200 pt-2 mt-2 font-bold text-stone-900" : "text-stone-700"
      }`}
    >
      <span>{label}</span>
      <span className={bold ? "text-emerald-700" : ""}>{value}</span>
    </div>
  );
}

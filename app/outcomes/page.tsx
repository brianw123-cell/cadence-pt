"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePatientsRepo, usePROMsRepo } from "@/lib/repo";
import InfoTip from "@/components/InfoTip";
import { PROM_INSTRUMENTS, type PROMScore } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PatientOutcome {
  patientId: string;
  patientName: string;
  instrumentCode: keyof typeof PROM_INSTRUMENTS;
  scores: PROMScore[];
  initialScore: number;
  latestScore: number;
  delta: number;
  metMCID: boolean;
  trendingBetter: boolean;
}

export default function OutcomesPage() {
  const patients = usePatientsRepo().list();
  const promScores = usePROMsRepo().list();

  const outcomes = useMemo<PatientOutcome[]>(() => {
    const byPatient = new Map<string, PROMScore[]>();
    for (const s of promScores) {
      const arr = byPatient.get(s.patientId) ?? [];
      arr.push(s);
      byPatient.set(s.patientId, arr);
    }

    const out: PatientOutcome[] = [];
    for (const [patientId, scores] of byPatient.entries()) {
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) continue;
      const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date));
      const initial = sorted[0];
      const latest = sorted[sorted.length - 1];
      const instrument = PROM_INSTRUMENTS[initial.instrumentCode];
      const delta = latest.score - initial.score;
      const trendingBetter =
        instrument.betterIs === "lower" ? delta < 0 : delta > 0;
      const metMCID = Math.abs(delta) >= instrument.mcid && trendingBetter;
      out.push({
        patientId,
        patientName: patient.name,
        instrumentCode: initial.instrumentCode,
        scores: sorted,
        initialScore: initial.score,
        latestScore: latest.score,
        delta,
        metMCID,
        trendingBetter,
      });
    }
    // Sort: met MCID first, then by absolute improvement
    return out.sort((a, b) => {
      if (a.metMCID !== b.metMCID) return a.metMCID ? -1 : 1;
      return Math.abs(b.delta) - Math.abs(a.delta);
    });
  }, [promScores, patients]);

  const metMCID = outcomes.filter((o) => o.metMCID).length;
  const measured = outcomes.length;
  const totalPatients = patients.filter((p) => p.status === "active").length;
  const measureRate = totalPatients > 0 ? Math.round((measured / totalPatients) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Clinical outcomes</h1>
        <p className="text-sm text-stone-600 mt-1">
          Patient-reported outcomes (PROMs) over the course of care. The data that
          tells you whether your treatment is actually working — and proves it to
          referring physicians.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Summary label="Patients measured" value={`${measured}/${totalPatients}`} sub={`${measureRate}% of active`} />
        <Summary
          label={<>Met MCID <InfoTip label="MCID">Minimal Clinically Important Difference — the smallest score change that matters to the patient. Hitting MCID is the bar that proves your treatment had an effect, separate from natural recovery or measurement noise.</InfoTip></>}
          value={metMCID.toString()}
          sub="Clinically meaningful improvement"
          tone="emerald"
        />
        <Summary label="Trending better" value={outcomes.filter((o) => o.trendingBetter).length.toString()} />
        <Summary label="Avg score change" value={`${outcomes.length > 0 ? (outcomes.reduce((s, o) => s + Math.abs(o.delta), 0) / outcomes.length).toFixed(1) : "0"} pts`} />
      </div>

      {/* Instrument legend */}
      <div className="card p-4 md:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Instruments in use
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(PROM_INSTRUMENTS).map((i) => (
            <div key={i.code} className="text-xs border border-stone-200 rounded p-3">
              <div className="font-mono font-bold text-teal-700 mb-1">{i.code}</div>
              <div className="font-semibold text-stone-900">{i.name}</div>
              <div className="text-stone-600 mt-1">{i.region}</div>
              <div className="text-stone-500 mt-1">
                MCID {i.mcid} pts · {i.betterIs === "lower" ? "Lower is better" : "Higher is better"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-patient outcomes */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Patient progress
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {outcomes.map((o) => {
            const inst = PROM_INSTRUMENTS[o.instrumentCode];
            const [min, max] = inst.scoreRange;
            const initialPct = ((o.initialScore - min) / (max - min)) * 100;
            const latestPct = ((o.latestScore - min) / (max - min)) * 100;
            return (
              <Link key={o.patientId} href={`/rtm/${o.patientId}`} className="card p-4 md:p-5 hover:shadow-md transition block">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-stone-900">{o.patientName}</div>
                    <div className="text-xs text-stone-600">{inst.name} ({inst.code})</div>
                  </div>
                  {o.metMCID ? (
                    <span className="badge bg-emerald-100 text-emerald-800">✓ Met MCID</span>
                  ) : o.trendingBetter ? (
                    <span className="badge bg-teal-100 text-teal-800">Improving</span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-800">Watch</span>
                  )}
                </div>

                {/* Score progression bars */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-stone-500 mb-0.5">
                      <span>Initial · {formatDate(o.scores[0].date)}</span>
                      <span>{o.initialScore} / {max}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-400" style={{ width: `${Math.min(100, initialPct)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-stone-500 mb-0.5">
                      <span>Latest · {formatDate(o.scores[o.scores.length - 1].date)}</span>
                      <span>{o.latestScore} / {max}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${o.metMCID ? "bg-emerald-600" : o.trendingBetter ? "bg-teal-600" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(100, latestPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sparkline of all visits */}
                <div className="flex items-end gap-1 h-12">
                  {o.scores.map((s) => {
                    const pct = ((s.score - min) / (max - min)) * 100;
                    return (
                      <div
                        key={s.id}
                        className={`flex-1 rounded-t ${o.metMCID ? "bg-emerald-500" : "bg-teal-500"}`}
                        style={{ height: `${Math.max(5, pct)}%` }}
                        title={`Visit ${s.visit}: ${s.score}`}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between mt-3 pt-3 border-t border-stone-100 text-xs">
                  <span className="text-stone-600">
                    {o.scores.length} measurement{o.scores.length !== 1 ? "s" : ""} · Visit {o.scores[o.scores.length - 1].visit}
                  </span>
                  <span className={`font-semibold ${o.trendingBetter ? "text-emerald-700" : "text-amber-700"}`}>
                    {o.delta > 0 ? "+" : ""}
                    {o.delta.toFixed(0)} pt change
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="card p-5 bg-teal-50 border-teal-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-teal-800 mb-2">
          Why outcomes data is a business asset
        </h3>
        <ul className="text-sm text-teal-900 space-y-2 list-disc pl-5">
          <li>
            <strong>Physician marketing:</strong> Send referring docs a quarterly
            outcomes report. "Your patients in our care improved on average 14 pts
            on ODI." They'll send you more patients.
          </li>
          <li>
            <strong>Payer leverage:</strong> Value-based contracts pay PT practices
            differently for documented improvement. Without PROM data, you can't
            negotiate one.
          </li>
          <li>
            <strong>Medicare 8-Minute Rule audits:</strong> Outcomes prove medical
            necessity for extended visits.
          </li>
          <li>
            <strong>Patient retention:</strong> Patients who see their own progress
            graph stay in care 30% longer (industry estimate, not from this dataset).
          </li>
        </ul>
      </div>
    </div>
  );
}

function Summary({ label, value, sub, tone }: { label: React.ReactNode; value: string; sub?: string; tone?: "emerald" }) {
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

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { usePatientsRepo, useCheckinsRepo } from "@/lib/repo";
import { RTM_RATES } from "@/lib/types";
import { age, daysSince, formatCurrency, formatDate } from "@/lib/utils";

export default function RTMDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patientsRepo = usePatientsRepo();
  const checkinsRepo = useCheckinsRepo();
  const patient = patientsRepo.get(id);
  const checkins = [...checkinsRepo.listForPatient(id)].sort((a, b) => b.date.localeCompare(a.date));
  const addCheckin = checkinsRepo.create;
  const enroll = patientsRepo.enrollRTM;
  const unenroll = patientsRepo.unenrollRTM;

  const [checkinForm, setCheckinForm] = useState({
    painLevel: 4,
    exercisesCompleted: 5,
    exercisesPrescribed: 6,
    minutesActive: 30,
    notes: "",
  });

  if (!patient) {
    return (
      <div>
        <p>Patient not found.</p>
        <Link href="/rtm" className="text-teal-700">← Back to RTM</Link>
      </div>
    );
  }

  const billable = patient.payerCategory === "medicare" || patient.payerCategory === "medicare-advantage";
  const daysEnrolled = patient.rtmEnrolledAt ? daysSince(patient.rtmEnrolledAt) ?? 0 : 0;
  const monthlyMonitoring = RTM_RATES.monitorMSK.amount;
  const monthlyManagement = RTM_RATES.manageFirst20.amount;
  const setupOnce = RTM_RATES.setup.amount;
  const monthsEnrolled = Math.max(1, Math.ceil(daysEnrolled / 30));
  const earned = patient.rtmEnrolled && billable
    ? setupOnce + (monthlyMonitoring + monthlyManagement) * monthsEnrolled
    : 0;

  const submitCheckin = () => {
    addCheckin({
      patientId: patient.id,
      date: new Date().toISOString().slice(0, 10),
      source: "manual",
      ...checkinForm,
    });
  };

  const adherence = checkins.length > 0
    ? Math.round((checkins.reduce((sum, c) => sum + c.exercisesCompleted / c.exercisesPrescribed, 0) / checkins.length) * 100)
    : 0;

  return (
    <div className="max-w-5xl">
      <Link href="/rtm" className="text-sm text-teal-700 hover:text-teal-900">
        ← Back to RTM
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">{patient.name}</h1>
          <p className="text-sm text-stone-600 mt-1">
            Age {age(patient.dateOfBirth)} · {patient.primaryDiagnosis} · {patient.primaryInsurance}
          </p>
        </div>
        <div>
          {patient.rtmEnrolled ? (
            <button onClick={() => unenroll(patient.id)} className="btn-secondary">
              Unenroll from RTM
            </button>
          ) : billable ? (
            <button onClick={() => enroll(patient.id)} className="btn-primary">
              + Enroll in RTM
            </button>
          ) : (
            <span className="text-xs text-stone-500">Not RTM-eligible (payer)</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="md:col-span-2 space-y-4">
          {/* Adherence summary */}
          <div className="card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
              Adherence
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-stone-500">Check-ins logged</div>
                <div className="text-2xl font-bold text-stone-900">{checkins.length}</div>
              </div>
              <div>
                <div className="text-xs text-stone-500">Exercise adherence</div>
                <div className={`text-2xl font-bold ${adherence >= 70 ? "text-emerald-700" : "text-amber-700"}`}>
                  {adherence}%
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500">Last check-in</div>
                <div className="text-base font-medium text-stone-900">
                  {checkins[0] ? formatDate(checkins[0].date) : "None yet"}
                </div>
              </div>
            </div>
          </div>

          {/* Check-in log */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700">
                Check-in log
              </h3>
              <span className="text-xs text-stone-500">
                From patient app · wearable · manual entry
              </span>
            </div>

            {patient.rtmEnrolled && (
              <div className="bg-teal-50 border border-teal-200 rounded-md p-4 mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-teal-800 mb-2">
                  Manual check-in entry
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="label">Pain (0–10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      className="input"
                      value={checkinForm.painLevel}
                      onChange={(e) =>
                        setCheckinForm({ ...checkinForm, painLevel: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Done</label>
                    <input
                      type="number"
                      className="input"
                      value={checkinForm.exercisesCompleted}
                      onChange={(e) =>
                        setCheckinForm({ ...checkinForm, exercisesCompleted: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Prescribed</label>
                    <input
                      type="number"
                      className="input"
                      value={checkinForm.exercisesPrescribed}
                      onChange={(e) =>
                        setCheckinForm({ ...checkinForm, exercisesPrescribed: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Min active</label>
                    <input
                      type="number"
                      className="input"
                      value={checkinForm.minutesActive}
                      onChange={(e) =>
                        setCheckinForm({ ...checkinForm, minutesActive: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <button onClick={submitCheckin} className="btn-primary text-xs mt-3">
                  Log check-in
                </button>
              </div>
            )}

            {checkins.length === 0 ? (
              <div className="text-sm text-stone-500 text-center py-8">
                No check-ins yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-stone-500 border-b border-stone-200">
                  <tr className="text-left">
                    <th className="py-2">Date</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Pain</th>
                    <th className="py-2">Exercises</th>
                    <th className="py-2">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.slice(0, 20).map((c) => (
                    <tr key={c.id} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 text-stone-900">{formatDate(c.date)}</td>
                      <td className="py-2 text-stone-700 capitalize">{c.source}</td>
                      <td className="py-2 text-stone-700">{c.painLevel ?? "—"}</td>
                      <td className="py-2 text-stone-700">
                        {c.exercisesCompleted}/{c.exercisesPrescribed}
                      </td>
                      <td className="py-2 text-stone-700">{c.minutesActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RTM Revenue side */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
              RTM revenue (this patient)
            </h3>
            {patient.rtmEnrolled && billable ? (
              <>
                <div className="text-3xl font-bold text-emerald-700">{formatCurrency(earned)}</div>
                <div className="text-xs text-stone-600 mt-1">
                  Earned over {daysEnrolled}d ({monthsEnrolled} bill cycle{monthsEnrolled !== 1 ? "s" : ""})
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Setup (98975, once)</span>
                    <span className="text-stone-900 font-medium">{formatCurrency(setupOnce)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">MSK monitoring (98977 × {monthsEnrolled})</span>
                    <span className="text-stone-900 font-medium">
                      {formatCurrency(monthlyMonitoring * monthsEnrolled)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">First-20 mgmt (98980 × {monthsEnrolled})</span>
                    <span className="text-stone-900 font-medium">
                      {formatCurrency(monthlyManagement * monthsEnrolled)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-stone-600">
                Not generating RTM revenue. {billable ? "Enroll to start." : "Payer not RTM-eligible."}
              </div>
            )}
          </div>

          <div className="card p-4 bg-stone-50">
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900">CMS rule:</strong> Only one clinician may
              bill RTM codes per 30-day period per patient. Cadence locks billing to
              the primary therapist of record to prevent denied claims.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

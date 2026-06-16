"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFollowupsRepo, usePatientsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import EmptyState from "@/components/EmptyState";
import { FOLLOWUP_REASON_LABELS, type Followup } from "@/lib/types";
import { formatDate, daysSince } from "@/lib/utils";

export default function FollowupsPage() {
  const repo = useFollowupsRepo();
  const patients = usePatientsRepo();
  const all = repo.list();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const pending = useMemo(
    () => all.filter((f) => f.status === "pending").sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [all],
  );
  const recent = useMemo(
    () =>
      all
        .filter((f) => f.status !== "pending")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
        .slice(0, 8),
    [all],
  );

  const today = new Date().toISOString().slice(0, 10);
  const overdue = pending.filter((f) => f.dueDate < today);
  const dueToday = pending.filter((f) => f.dueDate === today);
  const upcoming = pending.filter((f) => f.dueDate > today);

  const completeFollowup = (id: string, notes: string) => {
    repo.updateStatus(id, "completed", { notes: notes || undefined, completedBy: "Front Desk" });
    toast.success("Follow-up logged as completed");
    setCompletingId(null);
    setCompleteNotes("");
  };

  const skipFollowup = (id: string) => {
    repo.updateStatus(id, "skipped");
    toast.info("Follow-up skipped");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Follow-up queue</h1>
        <p className="text-sm text-stone-600 mt-1">
          Staff call list. Cadence flags every patient who needs a touch — post-discharge
          check-ins, expiring authorizations, no-shows, and ad-hoc reminders. Pick a patient,
          make the call, log what happened.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Overdue" value={overdue.length.toString()} tone="red" />
        <Kpi label="Due today" value={dueToday.length.toString()} tone="amber" />
        <Kpi label="Upcoming" value={upcoming.length.toString()} tone="teal" />
        <Kpi label="Completed (history)" value={recent.length.toString()} tone="emerald" />
      </div>

      {/* Pending */}
      <section aria-labelledby="pending-heading" className="space-y-3">
        <h2
          id="pending-heading"
          className="text-sm font-bold uppercase tracking-wide text-stone-700"
        >
          Pending ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon="✓"
            title="Queue is clear"
            body="No outstanding follow-ups. Cadence will queue new ones as patients hit their post-discharge windows or no-show milestones."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((f) => {
              const patient = patients.get(f.patientId);
              const dueAge = daysSince(f.dueDate);
              const isOverdue = f.dueDate < today;
              const isCompletingNow = completingId === f.id;
              return (
                <li
                  key={f.id}
                  className={`card p-4 md:p-5 ${
                    isOverdue
                      ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800"
                      : f.dueDate === today
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800"
                        : ""
                  }`}
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Link
                          href={`/cases/${patient?.id ?? ""}`}
                          className="text-lg font-bold text-stone-900 dark:text-stone-50 hover:underline"
                        >
                          {patient?.name ?? "Unknown patient"}
                        </Link>
                        <span className="text-xs text-stone-600 dark:text-stone-300">
                          · {patient?.primaryDiagnosis}
                        </span>
                      </div>
                      <div className="text-sm text-stone-700 dark:text-stone-200 mt-0.5">
                        <strong>{FOLLOWUP_REASON_LABELS[f.reason]}</strong>
                        {" · "}
                        {isOverdue ? (
                          <span className="text-red-700 dark:text-red-300 font-medium">
                            <span className="sr-only">Status: </span>
                            Overdue by {Math.abs(dueAge ?? 0)} day{Math.abs(dueAge ?? 0) !== 1 ? "s" : ""}
                          </span>
                        ) : f.dueDate === today ? (
                          <span className="text-amber-700 dark:text-amber-300 font-medium">
                            Due today
                          </span>
                        ) : (
                          <span>Due {formatDate(f.dueDate)}</span>
                        )}
                      </div>
                      {f.notes && (
                        <div className="text-sm text-stone-600 dark:text-stone-300 mt-2 bg-white/50 dark:bg-stone-900/40 rounded p-2">
                          <strong>Note:</strong> {f.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setCompletingId(isCompletingNow ? null : f.id)}
                        className="btn-primary text-xs"
                      >
                        {isCompletingNow ? "Cancel" : "Mark complete"}
                      </button>
                      <button
                        onClick={() => skipFollowup(f.id)}
                        className="btn-secondary text-xs"
                      >
                        Skip
                      </button>
                    </div>
                  </div>

                  {isCompletingNow && (
                    <div className="mt-4 pt-4 border-t border-current/10">
                      <label htmlFor={`note-${f.id}`} className="label">
                        What happened on the call?
                      </label>
                      <textarea
                        id={`note-${f.id}`}
                        className="input"
                        rows={2}
                        value={completeNotes}
                        onChange={(e) => setCompleteNotes(e.target.value)}
                        placeholder="e.g. 'Spoke with patient, doing well, no return needed' or 'Voicemail left, retry next week'"
                      />
                      <button
                        onClick={() => completeFollowup(f.id, completeNotes)}
                        className="btn-primary text-sm mt-3"
                      >
                        Log call &amp; complete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Completed history */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2
            id="recent-heading"
            className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3"
          >
            Recently completed
          </h2>
          <div className="card divide-y divide-stone-100 dark:divide-stone-800">
            {recent.map((f: Followup) => {
              const patient = patients.get(f.patientId);
              return (
                <div key={f.id} className="px-4 py-3 text-sm">
                  <div className="flex items-baseline justify-between flex-wrap gap-1">
                    <div>
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {patient?.name ?? "Unknown"}
                      </span>
                      <span className="text-stone-600 dark:text-stone-300">
                        {" "}
                        — {FOLLOWUP_REASON_LABELS[f.reason]}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {f.completedAt
                        ? formatDate(f.completedAt.slice(0, 10))
                        : formatDate(f.dueDate)}
                      {f.completedBy ? ` · ${f.completedBy}` : ""}
                    </span>
                  </div>
                  {f.notes && (
                    <div className="text-xs text-stone-600 dark:text-stone-300 mt-1 italic">
                      "{f.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Why */}
      <div className="card p-4 bg-stone-50 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
        <strong className="text-stone-900 dark:text-stone-50">Why this queue exists:</strong>{" "}
        Most PT clinics lose 15-20% of discharged patients who would happily return for a
        tune-up if anyone asked. Cadence auto-queues a 30/60/90-day check-in at discharge, and
        an auth-expiring reminder a week before the auth ends. Messaging integration (SMS,
        email) is not connected in this build — staff makes the calls manually and logs the
        outcome here.
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "amber" | "teal" | "emerald";
}) {
  const map: Record<string, string> = {
    red: "text-red-700",
    amber: "text-amber-700",
    teal: "text-teal-800",
    emerald: "text-emerald-700",
  };
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${map[tone]}`}>{value}</div>
    </div>
  );
}

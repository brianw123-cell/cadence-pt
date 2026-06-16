"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWaitlistRepo, usePatientsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import EmptyState from "@/components/EmptyState";
import { DAY_LABELS, TIME_LABELS, type WaitlistPriority } from "@/lib/types";
import { formatDate, daysSince } from "@/lib/utils";

const priorityTone: Record<WaitlistPriority, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-amber-100 text-amber-800",
  normal: "bg-stone-100 text-stone-700",
  low: "bg-stone-100 text-stone-500",
};

const PRIORITY_ORDER: WaitlistPriority[] = ["urgent", "high", "normal", "low"];

export default function WaitlistPage() {
  const repo = useWaitlistRepo();
  const patients = usePatientsRepo();
  const all = repo.list();

  const [dayFilter, setDayFilter] = useState<string>("any");
  const [timeFilter, setTimeFilter] = useState<string>("any");

  const active = useMemo(() => {
    return all
      .filter((w) => w.status === "active")
      .filter((w) => dayFilter === "any" || w.preferredDays.includes(dayFilter))
      .filter((w) => timeFilter === "any" || w.preferredTimes.includes(timeFilter))
      .sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      );
  }, [all, dayFilter, timeFilter]);

  const scheduledFromWaitlist = all.filter((w) => w.status === "scheduled").length;
  const removed = all.filter((w) => w.status === "removed").length;

  const handleSchedule = (id: string, name: string) => {
    repo.updateStatus(id, "scheduled");
    toast.success(`${name} moved to scheduled`, "Book the appointment to lock the slot.");
  };

  const handleRemove = (id: string, name: string) => {
    repo.updateStatus(id, "removed");
    toast.info(`${name} removed from waitlist`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Waitlist</h1>
        <p className="text-sm text-stone-600 mt-1">
          When a slot opens — cancellation, no-show recovery, new opening — start here. Patients
          are sorted by priority. Filter by the day or time of the freed slot to see exactly who
          wants it.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="On waitlist" value={active.length.toString()} tone="teal" />
        <Kpi label="Urgent" value={active.filter((w) => w.priority === "urgent").length.toString()} tone="red" />
        <Kpi label="Scheduled from list" value={scheduledFromWaitlist.toString()} tone="emerald" sub="historical" />
        <Kpi label="Removed" value={removed.toString()} tone="neutral" sub="no longer waiting" />
      </div>

      {/* Slot-matcher filters */}
      <div className="card p-4 bg-teal-50 border-teal-200 dark:bg-teal-900/40 dark:border-teal-800">
        <div className="text-sm font-bold text-teal-900 dark:text-teal-200 mb-3">
          A slot just opened — who do I call?
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="day-filter" className="label">
              Day
            </label>
            <select
              id="day-filter"
              className="input"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              style={{ minWidth: 130 }}
            >
              <option value="any">Any day</option>
              {Object.entries(DAY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="time-filter" className="label">
              Time
            </label>
            <select
              id="time-filter"
              className="input"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="any">Any time</option>
              {Object.entries(TIME_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          {(dayFilter !== "any" || timeFilter !== "any") && (
            <button
              type="button"
              onClick={() => {
                setDayFilter("any");
                setTimeFilter("any");
              }}
              className="text-xs text-teal-700 dark:text-teal-200 underline self-end pb-2"
            >
              Clear
            </button>
          )}
          <div className="ml-auto text-xs text-teal-900 dark:text-teal-200 font-medium pb-2">
            {active.length} match
          </div>
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon="📞"
          title="No matching patients"
          body={
            dayFilter !== "any" || timeFilter !== "any"
              ? "Try widening the day or time filter."
              : "Nobody is currently on the waitlist. Add patients from their case detail when they can't be scheduled immediately."
          }
        />
      ) : (
        <ul className="space-y-3">
          {active.map((w) => {
            const patient = patients.get(w.patientId);
            const waitDays = daysSince(w.addedAt.slice(0, 10)) ?? 0;
            return (
              <li key={w.id} className="card p-4 md:p-5">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Link
                        href={`/cases/${patient?.id ?? ""}`}
                        className="text-lg font-bold text-stone-900 dark:text-stone-50 hover:underline"
                      >
                        {patient?.name ?? "Unknown patient"}
                      </Link>
                      <span className={`badge ${priorityTone[w.priority]}`}>
                        <span className="sr-only">Priority: </span>
                        {w.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-stone-600 dark:text-stone-300">
                        Waiting {waitDays} day{waitDays !== 1 ? "s" : ""} · added {formatDate(w.addedAt.slice(0, 10))}
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                      {patient?.primaryDiagnosis} · {patient?.primaryInsurance}
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Prefers days
                        </div>
                        <div className="text-stone-800 dark:text-stone-200">
                          {w.preferredDays.length === 0
                            ? "Any"
                            : w.preferredDays
                                .map((d) => DAY_LABELS[d] ?? d)
                                .join(", ")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Prefers times
                        </div>
                        <div className="text-stone-800 dark:text-stone-200">
                          {w.preferredTimes.length === 0
                            ? "Any"
                            : w.preferredTimes
                                .map((t) => TIME_LABELS[t] ?? t)
                                .join(", ")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Therapist
                        </div>
                        <div className="text-stone-800 dark:text-stone-200">
                          {w.therapistPreference ?? "Any"}
                        </div>
                      </div>
                    </div>

                    {w.notes && (
                      <div className="text-sm text-stone-600 dark:text-stone-300 mt-3 italic">
                        "{w.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/schedule/new?patient=${patient?.id ?? ""}`}
                      onClick={() => handleSchedule(w.id, patient?.name ?? "patient")}
                      className="btn-primary text-xs whitespace-nowrap"
                    >
                      📅 Book now
                    </Link>
                    <button
                      onClick={() => handleRemove(w.id, patient?.name ?? "patient")}
                      className="btn-secondary text-xs whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="card p-4 bg-stone-50 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
        <strong className="text-stone-900 dark:text-stone-50">How this gets used:</strong>{" "}
        Patient calls to cancel their 2pm Tuesday slot. Front desk opens this page, filters
        to <em>Tue · Afternoon</em>, calls the first urgent or high-priority match, books them.
        Messaging integration (auto-blast to all matches via SMS) isn't connected in this build —
        staff calls one at a time.
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "red" | "amber" | "teal" | "emerald" | "neutral";
}) {
  const map: Record<string, string> = {
    red: "text-red-700",
    amber: "text-amber-700",
    teal: "text-teal-800",
    emerald: "text-emerald-700",
    neutral: "text-stone-900",
  };
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${map[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-1">{sub}</div>}
    </div>
  );
}

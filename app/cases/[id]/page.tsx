"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  usePatientsRepo,
  useReferralsRepo,
  useAppointmentsRepo,
  useFollowupsRepo,
  useCheckinsRepo,
  usePROMsRepo,
} from "@/lib/repo";
import {
  PROM_INSTRUMENTS,
  VISIT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  FOLLOWUP_REASON_LABELS,
} from "@/lib/types";
import { age, formatDate, formatCurrency } from "@/lib/utils";

type TimelineEvent = {
  date: string; // ISO
  kind:
    | "referral"
    | "evaluation"
    | "poc-transmission"
    | "authorization"
    | "appointment"
    | "rtm-enrolled"
    | "rtm-checkin"
    | "prom"
    | "followup"
    | "discharge";
  title: string;
  detail?: string;
  badge?: { label: string; tone: "teal" | "emerald" | "amber" | "red" | "stone" };
  href?: string;
};

const badgeTone: Record<string, string> = {
  teal: "bg-teal-100 text-teal-800",
  emerald: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  stone: "bg-stone-100 text-stone-700",
};

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patient = usePatientsRepo().get(id);
  const referrals = useReferralsRepo().list().filter((r) => r.patientName === patient?.name);
  const appointments = useAppointmentsRepo().listForPatient(id);
  const followups = useFollowupsRepo().listForPatient(id);
  const checkins = useCheckinsRepo().listForPatient(id);
  const proms = usePROMsRepo().listForPatient(id);

  const events = useMemo<TimelineEvent[]>(() => {
    const out: TimelineEvent[] = [];

    for (const r of referrals) {
      out.push({
        date: `${r.receivedAt}T00:00:00`,
        kind: "referral",
        title: "Referral received",
        detail: `${r.referringPhysician} via ${r.intakeChannel}. Dx: ${r.diagnosis}`,
        badge: { label: r.stage, tone: "teal" },
        href: `/referrals/${r.id}`,
      });
      if (r.evaluationDate) {
        out.push({
          date: `${r.evaluationDate}T08:00:00`,
          kind: "evaluation",
          title: "Initial evaluation completed",
          detail: `Plan of care drafted; transmission window opens.`,
          href: `/referrals/${r.id}`,
        });
      }
      for (const t of r.pocTransmissions) {
        out.push({
          date: `${t.sentAt}T09:00:00`,
          kind: "poc-transmission",
          title: `Plan of care transmitted via ${t.method}`,
          detail: `Sent to ${t.recipient}, ${t.daysFromEval} day(s) after eval.${t.acknowledgedAt ? " Acknowledged " + formatDate(t.acknowledgedAt) + "." : ""}`,
          badge: { label: t.acknowledgedAt ? "Acknowledged" : "Sent", tone: "emerald" },
          href: `/referrals/${r.id}`,
        });
      }
      if (r.authorization) {
        out.push({
          date: `${r.authorization.validFrom}T00:00:00`,
          kind: "authorization",
          title: `Authorization approved — ${r.authorization.visitsApproved} visits`,
          detail: `${r.authorization.payer} · Valid ${formatDate(r.authorization.validFrom)} → ${formatDate(r.authorization.validThrough)}`,
          badge: { label: r.authorization.status, tone: "teal" },
          href: `/referrals/${r.id}`,
        });
      }
      if (r.stage === "discharged") {
        out.push({
          date: `${r.receivedAt}T23:59:59`, // approximate; in real life use discharge date
          kind: "discharge",
          title: "Discharged from active care",
          badge: { label: "Episode complete", tone: "stone" },
          href: `/referrals/${r.id}`,
        });
      }
    }

    for (const a of appointments) {
      out.push({
        date: a.scheduledAt,
        kind: "appointment",
        title: `${VISIT_TYPE_LABELS[a.visitType]} with ${a.therapist}`,
        detail: a.notes,
        badge: {
          label: APPOINTMENT_STATUS_LABELS[a.status],
          tone:
            a.status === "completed"
              ? "emerald"
              : a.status === "no-show" || a.status === "cancelled"
                ? "red"
                : a.status === "confirmed" || a.status === "arrived"
                  ? "teal"
                  : "amber",
        },
      });
    }

    if (patient?.rtmEnrolled && patient.rtmEnrolledAt) {
      out.push({
        date: `${patient.rtmEnrolledAt}T08:00:00`,
        kind: "rtm-enrolled",
        title: "Enrolled in Remote Therapeutic Monitoring",
        detail: "Setup code 98975 billed. Monthly monitoring (98977) and management (98980) begin next cycle.",
        badge: { label: "Active", tone: "emerald" },
        href: `/rtm/${patient.id}`,
      });
    }

    for (const c of checkins.slice(0, 10)) {
      out.push({
        date: `${c.date}T07:00:00`,
        kind: "rtm-checkin",
        title: `Patient check-in (${c.source})`,
        detail: `${c.exercisesCompleted}/${c.exercisesPrescribed} exercises · ${c.minutesActive} min active${c.painLevel !== undefined ? ` · pain ${c.painLevel}/10` : ""}`,
      });
    }

    for (const p of proms) {
      const inst = PROM_INSTRUMENTS[p.instrumentCode];
      out.push({
        date: `${p.date}T08:00:00`,
        kind: "prom",
        title: `${inst?.name ?? p.instrumentCode} scored ${p.score}`,
        detail: `Visit ${p.visit} · ${inst?.region ?? ""}`,
        badge: { label: inst?.code ?? "", tone: "teal" },
        href: "/outcomes",
      });
    }

    for (const f of followups) {
      out.push({
        date: `${f.dueDate}T12:00:00`,
        kind: "followup",
        title: `Follow-up — ${FOLLOWUP_REASON_LABELS[f.reason]}`,
        detail: f.notes,
        badge: {
          label: f.status,
          tone:
            f.status === "completed"
              ? "emerald"
              : f.status === "pending"
                ? "amber"
                : "stone",
        },
        href: "/followups",
      });
    }

    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [patient, referrals, appointments, followups, checkins, proms]);

  if (!patient) {
    return (
      <div>
        <p>Patient not found.</p>
        <Link href="/patients" className="text-teal-700">
          ← Back to patients
        </Link>
      </div>
    );
  }

  const upcomingApts = appointments
    .filter((a) => a.scheduledAt > new Date().toISOString() && ["scheduled", "confirmed"].includes(a.status))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const completedApts = appointments.filter((a) => a.status === "completed").length;
  const noShows = appointments.filter((a) => a.status === "no-show").length;
  const totalVisitRevenue = completedApts * 95;

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/patients" className="text-sm text-teal-700 hover:text-teal-900">
        ← Back to patients
      </Link>

      <div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-teal-900">{patient.name}</h1>
          <span className="text-sm text-stone-500">
            Age {age(patient.dateOfBirth)} · {patient.primaryDiagnosis}
          </span>
        </div>
        <p className="text-sm text-stone-600 mt-1">
          {patient.primaryInsurance} · Therapist: {patient.primaryTherapist ?? "Unassigned"}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Completed visits" value={completedApts.toString()} />
        <Kpi label="No-shows" value={noShows.toString()} tone={noShows > 0 ? "amber" : "neutral"} />
        <Kpi label="Upcoming" value={upcomingApts.length.toString()} tone="teal" />
        <Kpi
          label="Visit revenue"
          value={formatCurrency(totalVisitRevenue)}
          tone="emerald"
          sub="@ ~$95/visit estimate"
        />
      </div>

      {/* Upcoming preview */}
      {upcomingApts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
            Upcoming appointments
          </h3>
          <ul className="space-y-2">
            {upcomingApts.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-stone-900">
                    {new Date(a.scheduledAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {new Date(a.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-stone-600 ml-2">
                    · {VISIT_TYPE_LABELS[a.visitType]} · {a.therapist}
                  </span>
                </div>
                <span className={`badge ${badgeTone[a.status === "confirmed" ? "teal" : "amber"]}`}>
                  {APPOINTMENT_STATUS_LABELS[a.status]}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-right">
            <Link
              href={`/schedule/new?patient=${patient.id}`}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              + Book another →
            </Link>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
          Case timeline ({events.length} events)
        </h2>
        <ol className="border-l-2 border-teal-200 dark:border-teal-900 ml-3 space-y-5">
          {events.map((e, i) => (
            <li key={`${e.kind}-${i}`} className="relative pl-6">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-teal-600 border-2 border-white dark:border-stone-900" />
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {new Date(e.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {e.date.includes("T") && (
                  <>
                    {" · "}
                    {new Date(e.date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
                {e.href ? (
                  <Link
                    href={e.href}
                    className="font-semibold text-stone-900 hover:underline"
                  >
                    {e.title}
                  </Link>
                ) : (
                  <span className="font-semibold text-stone-900">{e.title}</span>
                )}
                {e.badge && (
                  <span className={`badge ${badgeTone[e.badge.tone]}`}>{e.badge.label}</span>
                )}
              </div>
              {e.detail && (
                <div className="text-sm text-stone-600 dark:text-stone-300 mt-0.5">
                  {e.detail}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "teal" | "emerald" | "amber";
}) {
  const toneCls: Record<string, string> = {
    neutral: "text-stone-900",
    teal: "text-teal-800",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  };
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${toneCls[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-1">{sub}</div>}
    </div>
  );
}

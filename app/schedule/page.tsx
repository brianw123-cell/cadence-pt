"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppointmentsRepo, usePatientsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  APPOINTMENT_STATUS_LABELS,
  VISIT_TYPE_LABELS,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/types";

const statusTone: Record<AppointmentStatus, string> = {
  scheduled: "bg-amber-100 text-amber-800",
  confirmed: "bg-teal-100 text-teal-800",
  arrived: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  "no-show": "bg-red-100 text-red-800",
  cancelled: "bg-stone-200 text-stone-700",
  rescheduled: "bg-blue-100 text-blue-800",
};

export default function SchedulePage() {
  const repo = useAppointmentsRepo();
  const patients = usePatientsRepo();
  const allAppointments = repo.list();

  const [therapistFilter, setTherapistFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null);

  const therapists = useMemo(() => {
    const set = new Set<string>();
    for (const a of allAppointments) set.add(a.therapist);
    return Array.from(set).sort();
  }, [allAppointments]);

  // Filter then group by day
  const groupedByDay = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    const filtered = allAppointments.filter((a) => {
      if (therapistFilter !== "all" && a.therapist !== therapistFilter) return false;
      const apptDay = a.scheduledAt.slice(0, 10);
      if (statusFilter === "upcoming") {
        return apptDay >= todayKey && ["scheduled", "confirmed"].includes(a.status);
      }
      if (statusFilter === "past") {
        return apptDay < todayKey;
      }
      if (statusFilter === "all") return true;
      return a.status === statusFilter;
    });

    const sorted = [...filtered].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

    const groups = new Map<string, Appointment[]>();
    for (const a of sorted) {
      const dayKey = a.scheduledAt.slice(0, 10);
      const arr = groups.get(dayKey) ?? [];
      arr.push(a);
      groups.set(dayKey, arr);
    }
    return Array.from(groups.entries()); // [dayKey, appointments]
  }, [allAppointments, therapistFilter, statusFilter]);

  const handleStatusChange = (id: string, name: string, next: AppointmentStatus) => {
    repo.updateStatus(id, next);
    toast.success(`${name} — ${APPOINTMENT_STATUS_LABELS[next]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Schedule</h1>
          <p className="text-sm text-stone-600 mt-1">
            Day-by-day appointment list. Filter by therapist or status, mark patients arrived,
            no-shows, or completed.
          </p>
        </div>
        <Link href="/schedule/new" className="btn-primary">
          + Book appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="therapist-filter" className="text-stone-700 font-medium">
            Therapist:
          </label>
          <select
            id="therapist-filter"
            value={therapistFilter}
            onChange={(e) => setTherapistFilter(e.target.value)}
            className="input !py-1.5 !text-sm"
            style={{ maxWidth: 240 }}
          >
            <option value="all">All</option>
            {therapists.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="status-filter" className="text-stone-700 font-medium">
            Showing:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input !py-1.5 !text-sm"
            style={{ maxWidth: 200 }}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All</option>
            <option value="completed">Completed only</option>
            <option value="no-show">No-shows only</option>
          </select>
        </div>
        <div className="text-xs text-stone-500 ml-auto">
          {groupedByDay.reduce((sum, [, a]) => sum + a.length, 0)} appointment(s)
        </div>
      </div>

      {/* Days */}
      {groupedByDay.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments match"
          body="Try a different filter, or book a new appointment to populate the schedule."
          actionLabel="+ Book appointment"
          actionHref="/schedule/new"
        />
      ) : (
        <div className="space-y-4">
          {groupedByDay.map(([dayKey, dayApts]) => {
            const dayDate = new Date(dayKey + "T12:00:00");
            const isToday = dayKey === new Date().toISOString().slice(0, 10);
            return (
              <div key={dayKey} className="card overflow-hidden">
                <div
                  className={`px-4 py-2 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between ${
                    isToday ? "bg-teal-50 dark:bg-teal-900/40" : "bg-stone-50 dark:bg-stone-800"
                  }`}
                >
                  <div>
                    <div className={`text-sm font-bold ${isToday ? "text-teal-900 dark:text-teal-200" : "text-stone-800 dark:text-stone-100"}`}>
                      {dayDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                      {isToday && <span className="ml-2 text-xs">· Today</span>}
                    </div>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {dayApts.length} appointment{dayApts.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {dayApts.map((a) => {
                    const patient = patients.get(a.patientId);
                    const time = new Date(a.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    return (
                      <li key={a.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800">
                        <div className="w-16 flex-shrink-0 font-mono text-sm text-stone-700 dark:text-stone-300">
                          {time}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-stone-900 dark:text-stone-50">
                            {patient ? (
                              <Link href={`/cases/${patient.id}`} className="hover:underline">
                                {patient.name}
                              </Link>
                            ) : (
                              "Unknown patient"
                            )}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-300">
                            {VISIT_TYPE_LABELS[a.visitType]} · {a.therapist} · {a.durationMinutes} min
                            {a.location ? ` · ${a.location}` : ""}
                          </div>
                          {a.notes && (
                            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {a.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <span className={`badge ${statusTone[a.status]}`}>
                            <span className="sr-only">Status: </span>
                            {APPOINTMENT_STATUS_LABELS[a.status]}
                          </span>
                          <select
                            aria-label={`Change status for ${patient?.name ?? "appointment"}`}
                            className="input !py-1 !text-xs !w-auto"
                            value={a.status}
                            onChange={(e) =>
                              handleStatusChange(a.id, patient?.name ?? "patient", e.target.value as AppointmentStatus)
                            }
                          >
                            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <Link
                            href={`/schedule/${a.id}/edit`}
                            className="text-xs text-teal-700 hover:text-teal-900 font-medium px-2"
                            aria-label={`Edit appointment for ${patient?.name ?? "patient"}`}
                          >
                            ✎ Edit
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(a)}
                            className="text-xs text-red-700 hover:text-red-800 font-medium px-2"
                            aria-label={`Delete appointment for ${patient?.name ?? "patient"}`}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        tone="danger"
        title="Delete this appointment?"
        body={
          confirmDelete
            ? `This permanently removes the ${new Date(confirmDelete.scheduledAt).toLocaleDateString()} appointment for ${patients.get(confirmDelete.patientId)?.name ?? "this patient"}. The patient record itself is unaffected.`
            : ""
        }
        confirmLabel="Delete appointment"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = patients.get(confirmDelete.patientId)?.name ?? "patient";
          repo.remove(confirmDelete.id);
          toast.warning(`Appointment for ${name} deleted`);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

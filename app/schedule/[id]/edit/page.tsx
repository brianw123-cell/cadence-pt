"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppointmentsRepo, usePatientsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import { useUnloadGuard } from "@/lib/hooks/useUnloadGuard";
import { VISIT_TYPE_LABELS, type VisitType } from "@/lib/types";

const THERAPISTS = ["Alex Rivera, DPT", "Morgan Chen, DPT"];

function isoToFormParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return { date, time: `${hh}:${mm}` };
}

export default function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const repo = useAppointmentsRepo();
  const patients = usePatientsRepo();
  const apt = repo.get(id);

  const seed = apt
    ? (() => {
        const parts = isoToFormParts(apt.scheduledAt);
        return {
          patientId: apt.patientId,
          therapist: apt.therapist,
          date: parts.date,
          time: parts.time,
          durationMinutes: apt.durationMinutes,
          visitType: apt.visitType,
          location: apt.location ?? "Main Clinic",
          notes: apt.notes ?? "",
        };
      })()
    : null;

  const [form, setForm] = useState(seed);

  const dirty = !!form && JSON.stringify(form) !== JSON.stringify(seed);
  useUnloadGuard(dirty);

  if (!apt || !form) {
    return (
      <div>
        <p>Appointment not found.</p>
        <Link href="/schedule" className="text-teal-700">
          ← Back to schedule
        </Link>
      </div>
    );
  }

  const patient = patients.get(form.patientId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      toast.error("Pick a patient");
      return;
    }
    const [hours, mins] = form.time.split(":").map(Number);
    const dt = new Date(form.date + "T00:00:00");
    dt.setHours(hours, mins, 0, 0);

    repo.update(apt.id, {
      patientId: form.patientId,
      therapist: form.therapist,
      scheduledAt: dt.toISOString(),
      durationMinutes: form.durationMinutes,
      visitType: form.visitType,
      location: form.location,
      notes: form.notes || undefined,
    });
    toast.success("Appointment updated");
    router.push("/schedule");
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/schedule" className="text-sm text-teal-700 hover:text-teal-900">
        ← Back to schedule
      </Link>
      <h1 className="text-2xl font-bold text-teal-900">
        Edit appointment — {patient?.name ?? "Unknown patient"}
      </h1>
      <p className="text-sm text-stone-600">
        Reschedule, change therapist, or update visit type. Status is managed from the schedule list.
      </p>

      <form onSubmit={submit} className="card p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="patient" className="label">
              Patient
            </label>
            <select
              id="patient"
              className="input"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              required
            >
              <option value="">Choose…</option>
              {patients.list().map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="therapist" className="label">
              Therapist
            </label>
            <select
              id="therapist"
              className="input"
              value={form.therapist}
              onChange={(e) => setForm({ ...form, therapist: e.target.value })}
            >
              {THERAPISTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date" className="label">
              Date
            </label>
            <input
              id="date"
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="time" className="label">
              Time
            </label>
            <input
              id="time"
              type="time"
              className="input"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="label">
              Duration (min)
            </label>
            <select
              id="duration"
              className="input"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) })}
            >
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="visit-type" className="label">
              Visit type
            </label>
            <select
              id="visit-type"
              className="input"
              value={form.visitType}
              onChange={(e) => setForm({ ...form, visitType: e.target.value as VisitType })}
            >
              {Object.entries(VISIT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="location" className="label">
              Location
            </label>
            <select
              id="location"
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option>Main Clinic</option>
              <option>Satellite Clinic</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="label">
            Notes
          </label>
          <textarea
            id="notes"
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-stone-200 dark:border-stone-700">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

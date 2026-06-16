"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useAppointmentsRepo, usePatientsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import { useUnloadGuard } from "@/lib/hooks/useUnloadGuard";
import { VISIT_TYPE_LABELS, type VisitType, type Appointment } from "@/lib/types";

export default function NewAppointmentPageWrapper() {
  return (
    <Suspense fallback={<div className="text-sm text-stone-500">Loading…</div>}>
      <NewAppointmentPage />
    </Suspense>
  );
}

const DAY_NAMES = [
  { key: "mon", label: "Mon", dow: 1 },
  { key: "tue", label: "Tue", dow: 2 },
  { key: "wed", label: "Wed", dow: 3 },
  { key: "thu", label: "Thu", dow: 4 },
  { key: "fri", label: "Fri", dow: 5 },
];

const THERAPISTS = ["Alex Rivera, DPT", "Morgan Chen, DPT"];

function makeSeriesId(): string {
  return `series-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

function NewAppointmentPage() {
  const router = useRouter();
  const search = useSearchParams();
  const repo = useAppointmentsRepo();
  const patients = usePatientsRepo().list();

  const prefillPatient = search.get("patient") ?? "";

  const [form, setForm] = useState({
    patientId: prefillPatient,
    therapist: THERAPISTS[0],
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    durationMinutes: 45,
    visitType: "treatment" as VisitType,
    location: "Main Clinic",
    notes: "",
  });

  const [recurring, setRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState<string[]>(["mon", "wed", "fri"]);
  const [recurWeeks, setRecurWeeks] = useState(6);

  const isDirty = useMemo(
    () => form.patientId !== prefillPatient || form.notes !== "" || recurring,
    [form, prefillPatient, recurring],
  );
  useUnloadGuard(isDirty);

  const previewCount = useMemo(() => {
    if (!recurring) return 1;
    return recurDays.length * recurWeeks;
  }, [recurring, recurDays, recurWeeks]);

  const toggleDay = (key: string) => {
    setRecurDays((days) =>
      days.includes(key) ? days.filter((d) => d !== key) : [...days, key],
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      toast.error("Pick a patient first");
      return;
    }
    if (recurring && recurDays.length === 0) {
      toast.error("Pick at least one recurring day");
      return;
    }

    const [hours, mins] = form.time.split(":").map(Number);

    if (!recurring) {
      const dt = new Date(form.date + "T00:00:00");
      dt.setHours(hours, mins, 0, 0);
      const apt: Omit<Appointment, "id"> = {
        patientId: form.patientId,
        therapist: form.therapist,
        scheduledAt: dt.toISOString(),
        durationMinutes: form.durationMinutes,
        visitType: form.visitType,
        status: "scheduled",
        location: form.location,
        notes: form.notes || undefined,
      };
      repo.create(apt);
      toast.success("Appointment booked");
      router.push("/schedule");
      return;
    }

    // Recurring: generate one appointment per matching DOW per week
    const seriesId = makeSeriesId();
    const startDate = new Date(form.date + "T00:00:00");
    const apts: Omit<Appointment, "id">[] = [];

    for (let week = 0; week < recurWeeks; week++) {
      for (const dayKey of recurDays) {
        const dayDef = DAY_NAMES.find((d) => d.key === dayKey);
        if (!dayDef) continue;
        const apt = new Date(startDate);
        // Find the next occurrence of this DOW on or after startDate, then add weeks
        const daysToAdd = (dayDef.dow - startDate.getDay() + 7) % 7;
        apt.setDate(startDate.getDate() + daysToAdd + week * 7);
        apt.setHours(hours, mins, 0, 0);
        apts.push({
          patientId: form.patientId,
          therapist: form.therapist,
          scheduledAt: apt.toISOString(),
          durationMinutes: form.durationMinutes,
          visitType: form.visitType,
          status: "scheduled",
          location: form.location,
          notes: form.notes || undefined,
          recurringSeriesId: seriesId,
        });
      }
    }

    repo.createBatch(apts);
    toast.success(`${apts.length} appointments booked`, "Recurring series created.");
    router.push("/schedule");
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-teal-900">Book appointment</h1>
      <p className="text-sm text-stone-600">
        Single visit or a recurring series. The recurring option generates one appointment
        per selected weekday for the requested number of weeks.
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
              <option value="">Choose a patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.primaryDiagnosis})
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
              {recurring ? "First occurrence on/after" : "Date"}
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
            placeholder="Anything the therapist or front desk should know"
          />
        </div>

        {/* Recurring */}
        <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded border-stone-300"
            />
            Make this a recurring series
          </label>

          {recurring && (
            <div className="mt-4 space-y-3 bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-800 rounded-md p-4">
              <fieldset>
                <legend className="label">Which days?</legend>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((d) => {
                    const on = recurDays.includes(d.key);
                    return (
                      <button
                        type="button"
                        key={d.key}
                        onClick={() => toggleDay(d.key)}
                        aria-pressed={on}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                          on
                            ? "bg-teal-700 text-white border-teal-700"
                            : "bg-white text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-200"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <label htmlFor="weeks" className="label">
                  Number of weeks
                </label>
                <input
                  id="weeks"
                  type="number"
                  min={1}
                  max={26}
                  className="input"
                  style={{ maxWidth: 120 }}
                  value={recurWeeks}
                  onChange={(e) => setRecurWeeks(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="text-xs text-teal-900 dark:text-teal-200 font-medium">
                This will create <strong>{previewCount}</strong> appointment{previewCount !== 1 ? "s" : ""} over {recurWeeks} week{recurWeeks !== 1 ? "s" : ""}.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-stone-200 dark:border-stone-700">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {recurring ? `Create ${previewCount} appointments` : "Book appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}

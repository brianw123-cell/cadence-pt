"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatientsRepo } from "@/lib/repo";
import { patientSchema, flattenZodErrors } from "@/lib/schemas";
import { toast } from "@/lib/toast";
import { useUnloadGuard } from "@/lib/hooks/useUnloadGuard";
import type { Patient } from "@/lib/types";

interface Props {
  mode: "new" | "edit";
  existing?: Patient;
}

const emptyDefaults: Omit<Patient, "id"> = {
  name: "",
  dateOfBirth: "",
  primaryDiagnosis: "",
  primaryInsurance: "",
  payerCategory: "commercial",
  status: "active",
  rtmEnrolled: false,
  rtmEnrolledAt: undefined,
  primaryTherapist: "",
};

export default function PatientForm({ mode, existing }: Props) {
  const router = useRouter();
  const repo = usePatientsRepo();

  const seed: Omit<Patient, "id"> = existing
    ? {
        name: existing.name,
        dateOfBirth: existing.dateOfBirth,
        primaryDiagnosis: existing.primaryDiagnosis,
        primaryInsurance: existing.primaryInsurance,
        payerCategory: existing.payerCategory,
        status: existing.status,
        rtmEnrolled: existing.rtmEnrolled,
        rtmEnrolledAt: existing.rtmEnrolledAt,
        primaryTherapist: existing.primaryTherapist ?? "",
      }
    : emptyDefaults;

  const [form, setForm] = useState(seed);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const dirty = !submitting && JSON.stringify(form) !== JSON.stringify(seed);
  useUnloadGuard(dirty);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const parsed = patientSchema.safeParse(form);
    if (!parsed.success) {
      const flat = flattenZodErrors(parsed.error);
      setErrors(flat);
      setSubmitting(false);
      toast.error(`${Object.keys(flat).length} field(s) need attention`);
      return;
    }
    setErrors({});
    try {
      if (mode === "new") {
        const newId = repo.create({
          ...parsed.data,
          primaryTherapist: parsed.data.primaryTherapist || undefined,
        });
        toast.success("Patient created", `${parsed.data.name} added to caseload.`);
        router.push(`/cases/${newId}`);
      } else if (existing) {
        repo.update(existing.id, {
          ...parsed.data,
          primaryTherapist: parsed.data.primaryTherapist || undefined,
        });
        toast.success("Patient updated");
        router.push(`/cases/${existing.id}`);
      }
    } catch {
      setSubmitting(false);
      toast.error("Could not save patient", "Try again, or refresh.");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card p-4 md:p-6 space-y-5">
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3" role="alert">
          <div className="text-sm font-bold text-red-800 mb-1">
            {Object.keys(errors).length} field(s) need attention:
          </div>
          <ul className="text-sm text-red-700 list-disc pl-5">
            {Object.entries(errors).map(([f, m]) => (
              <li key={f}>
                <strong>{f}:</strong> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" error={errors.name}>
          <input
            name="name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Maria Hernandez"
            required
          />
        </Field>
        <Field label="Date of birth" error={errors.dateOfBirth}>
          <input
            name="dateOfBirth"
            type="date"
            className="input"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            required
          />
        </Field>
      </div>

      <Field label="Primary diagnosis" error={errors.primaryDiagnosis}>
        <input
          name="primaryDiagnosis"
          className="input"
          value={form.primaryDiagnosis}
          onChange={(e) => setForm({ ...form, primaryDiagnosis: e.target.value })}
          placeholder="Right knee osteoarthritis (M17.11)"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Primary insurance" error={errors.primaryInsurance}>
          <input
            name="primaryInsurance"
            className="input"
            value={form.primaryInsurance}
            onChange={(e) => setForm({ ...form, primaryInsurance: e.target.value })}
            placeholder="UnitedHealthcare Medicare Advantage"
          />
        </Field>
        <Field label="Payer category" error={errors.payerCategory}>
          <select
            name="payerCategory"
            className="input"
            value={form.payerCategory}
            onChange={(e) =>
              setForm({ ...form, payerCategory: e.target.value as Patient["payerCategory"] })
            }
          >
            <option value="medicare">Medicare</option>
            <option value="medicare-advantage">Medicare Advantage</option>
            <option value="commercial">Commercial</option>
            <option value="medicaid">Medicaid</option>
            <option value="self-pay">Self-pay</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Primary therapist" error={errors.primaryTherapist}>
          <input
            name="primaryTherapist"
            className="input"
            value={form.primaryTherapist ?? ""}
            onChange={(e) => setForm({ ...form, primaryTherapist: e.target.value })}
            placeholder="Alex Rivera, DPT"
          />
        </Field>
        <Field label="Status" error={errors.status}>
          <select
            name="status"
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Patient["status"] })}
          >
            <option value="active">Active</option>
            <option value="on-hold">On hold</option>
            <option value="discharged">Discharged</option>
          </select>
        </Field>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-200 dark:border-stone-700">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {mode === "new" ? "Create patient" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactElement;
}) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = `${slug}-error`;
  const child = React.cloneElement(children, {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  } as React.HTMLAttributes<HTMLElement>);
  return (
    <div>
      <label className="block">
        <span className="label">{label}</span>
        {child}
      </label>
      {error && (
        <div id={errorId} role="alert" className="text-xs text-red-700 mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

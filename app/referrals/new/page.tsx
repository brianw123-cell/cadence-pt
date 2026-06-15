"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useReferralsRepo } from "@/lib/repo";
import { newReferralSchema, flattenZodErrors } from "@/lib/schemas";
import { toast } from "@/lib/toast";
import { useUnloadGuard } from "@/lib/hooks/useUnloadGuard";
import type { IntakeChannel } from "@/lib/types";

const initial = {
  patientName: "",
  dateOfBirth: "",
  diagnosis: "",
  diagnosisCode: "",
  referringPhysician: "",
  physicianFax: "",
  intakeChannel: "fax" as IntakeChannel,
  insurancePrimary: "",
  insuranceMemberId: "",
  priorAuthRequired: false,
  location: "Main Clinic",
  notes: "",
};

export default function NewReferralPage() {
  const router = useRouter();
  const repo = useReferralsRepo();

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const dirty =
    !submitting &&
    Object.entries(initial).some(
      ([k, v]) => form[k as keyof typeof form] !== v,
    );
  useUnloadGuard(dirty);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const parsed = newReferralSchema.safeParse(form);
    if (!parsed.success) {
      const flat = flattenZodErrors(parsed.error);
      setErrors(flat);
      setSubmitting(false);
      toast.error(
        `${Object.keys(flat).length} field${Object.keys(flat).length === 1 ? "" : "s"} need${Object.keys(flat).length === 1 ? "s" : ""} attention`,
        "Scroll up to see what's missing.",
      );
      const first = Object.keys(flat)[0];
      if (first) {
        const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
        el?.focus();
      }
      return;
    }
    setErrors({});
    try {
      repo.create({
        ...parsed.data,
        diagnosisCode: parsed.data.diagnosisCode || undefined,
        physicianFax: parsed.data.physicianFax || undefined,
        insuranceMemberId: parsed.data.insuranceMemberId || undefined,
        notes: parsed.data.notes || undefined,
        receivedAt: new Date().toISOString().slice(0, 10),
        stage: "new",
      });
      toast.success("Referral added to funnel", `${parsed.data.patientName} is now in the "New" column.`);
      router.push("/referrals");
    } catch {
      setSubmitting(false);
      toast.error("Could not save referral", "Something went wrong. Try again, or refresh the page.");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-teal-900 mb-1">New referral</h1>
      <p className="text-sm text-stone-600 mb-6">
        Capture a physician order. Cadence handles the rest of the lifecycle.
      </p>

      {Object.keys(errors).length > 0 && (
        <div className="card p-4 mb-4 bg-red-50 border-red-200">
          <div className="text-sm font-bold text-red-800 mb-1">
            {Object.keys(errors).length} field{Object.keys(errors).length === 1 ? "" : "s"} need{Object.keys(errors).length === 1 ? "s" : ""} attention:
          </div>
          <ul className="text-sm text-red-700 list-disc pl-5">
            {Object.entries(errors).map(([f, m]) => (
              <li key={f}>
                <strong>{labelFor(f)}:</strong> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={submit} noValidate className="card p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patient name" error={errors.patientName}>
            <input
              name="patientName"
              className={inputClass(errors.patientName)}
              value={form.patientName}
              onChange={(e) => setForm({ ...form, patientName: e.target.value })}
              placeholder="Maria Hernandez"
            />
          </Field>
          <Field label="Date of birth" error={errors.dateOfBirth}>
            <input
              name="dateOfBirth"
              type="date"
              className={inputClass(errors.dateOfBirth)}
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Diagnosis" error={errors.diagnosis}>
          <input
            name="diagnosis"
            className={inputClass(errors.diagnosis)}
            value={form.diagnosis}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            placeholder="Right knee osteoarthritis, post-op TKA"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ICD-10 code" error={errors.diagnosisCode}>
            <input
              name="diagnosisCode"
              className={inputClass(errors.diagnosisCode)}
              value={form.diagnosisCode}
              onChange={(e) => setForm({ ...form, diagnosisCode: e.target.value })}
              placeholder="M17.11"
            />
          </Field>
          <Field label="Intake channel" error={errors.intakeChannel}>
            <select
              name="intakeChannel"
              className={inputClass(errors.intakeChannel)}
              value={form.intakeChannel}
              onChange={(e) => setForm({ ...form, intakeChannel: e.target.value as IntakeChannel })}
            >
              <option value="fax">Fax</option>
              <option value="portal">Physician portal</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="walk-in">Walk-in</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Referring physician" error={errors.referringPhysician}>
            <input
              name="referringPhysician"
              className={inputClass(errors.referringPhysician)}
              value={form.referringPhysician}
              onChange={(e) => setForm({ ...form, referringPhysician: e.target.value })}
              placeholder="Dr. James Patel, MD"
            />
          </Field>
          <Field label="Physician fax" error={errors.physicianFax}>
            <input
              name="physicianFax"
              className={inputClass(errors.physicianFax)}
              value={form.physicianFax}
              onChange={(e) => setForm({ ...form, physicianFax: e.target.value })}
              placeholder="703-555-0142"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Primary insurance" error={errors.insurancePrimary}>
            <input
              name="insurancePrimary"
              className={inputClass(errors.insurancePrimary)}
              value={form.insurancePrimary}
              onChange={(e) => setForm({ ...form, insurancePrimary: e.target.value })}
              placeholder="UnitedHealthcare Medicare Advantage"
            />
          </Field>
          <Field label="Member ID" error={errors.insuranceMemberId}>
            <input
              name="insuranceMemberId"
              className={inputClass(errors.insuranceMemberId)}
              value={form.insuranceMemberId}
              onChange={(e) => setForm({ ...form, insuranceMemberId: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Location" error={errors.location}>
            <select
              name="location"
              className={inputClass(errors.location)}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option>Main Clinic</option>
              <option>Satellite Clinic</option>
            </select>
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.priorAuthRequired}
                onChange={(e) => setForm({ ...form, priorAuthRequired: e.target.checked })}
                className="rounded border-stone-300"
              />
              Prior authorization required
            </label>
          </div>
        </div>

        <Field label="Notes" error={errors.notes}>
          <textarea
            name="notes"
            className={inputClass(errors.notes)}
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any context for the front desk"
          />
        </Field>

        <div className="flex gap-2 justify-end pt-2 border-t border-stone-200">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            Add to funnel
          </button>
        </div>
      </form>
    </div>
  );
}

function inputClass(error?: string) {
  return `input ${error ? "border-red-400 focus:border-red-600 focus:ring-red-600" : ""}`;
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
  // Inject aria-describedby + aria-invalid onto the actual form control so
  // screen readers announce the error inline as the user moves into the field.
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

const labelFor = (field: string): string => {
  const map: Record<string, string> = {
    patientName: "Patient name",
    dateOfBirth: "Date of birth",
    diagnosis: "Diagnosis",
    diagnosisCode: "ICD-10 code",
    referringPhysician: "Referring physician",
    physicianFax: "Physician fax",
    intakeChannel: "Intake channel",
    insurancePrimary: "Primary insurance",
    insuranceMemberId: "Member ID",
    location: "Location",
    notes: "Notes",
  };
  return map[field] ?? field;
};

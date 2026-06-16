"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useReferralsRepo } from "@/lib/repo";
import { newReferralSchema, flattenZodErrors } from "@/lib/schemas";
import { toast } from "@/lib/toast";
import { useUnloadGuard } from "@/lib/hooks/useUnloadGuard";
import type { IntakeChannel } from "@/lib/types";

export default function EditReferralPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const repo = useReferralsRepo();
  const ref = repo.get(id);

  const seed = ref
    ? {
        patientName: ref.patientName,
        dateOfBirth: ref.dateOfBirth,
        diagnosis: ref.diagnosis,
        diagnosisCode: ref.diagnosisCode ?? "",
        referringPhysician: ref.referringPhysician,
        physicianFax: ref.physicianFax ?? "",
        intakeChannel: ref.intakeChannel,
        insurancePrimary: ref.insurancePrimary,
        insuranceMemberId: ref.insuranceMemberId ?? "",
        priorAuthRequired: ref.priorAuthRequired,
        location: ref.location,
        notes: ref.notes ?? "",
      }
    : null;

  const [form, setForm] = useState(seed);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const dirty = !!form && !submitting && JSON.stringify(form) !== JSON.stringify(seed);
  useUnloadGuard(dirty);

  if (!ref || !form) {
    return (
      <div>
        <p>Referral not found.</p>
        <Link href="/referrals" className="text-teal-700">
          ← Back to funnel
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const parsed = newReferralSchema.safeParse(form);
    if (!parsed.success) {
      const flat = flattenZodErrors(parsed.error);
      setErrors(flat);
      setSubmitting(false);
      toast.error(`${Object.keys(flat).length} field(s) need attention`);
      return;
    }
    setErrors({});
    repo.update(ref.id, {
      patientName: parsed.data.patientName,
      dateOfBirth: parsed.data.dateOfBirth,
      diagnosis: parsed.data.diagnosis,
      diagnosisCode: parsed.data.diagnosisCode || undefined,
      referringPhysician: parsed.data.referringPhysician,
      physicianFax: parsed.data.physicianFax || undefined,
      intakeChannel: parsed.data.intakeChannel,
      insurancePrimary: parsed.data.insurancePrimary,
      insuranceMemberId: parsed.data.insuranceMemberId || undefined,
      priorAuthRequired: parsed.data.priorAuthRequired,
      location: parsed.data.location,
      notes: parsed.data.notes || undefined,
    });
    toast.success("Referral updated");
    router.push(`/referrals/${ref.id}`);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Link href={`/referrals/${ref.id}`} className="text-sm text-teal-700 hover:text-teal-900">
        ← Back to referral
      </Link>
      <h1 className="text-2xl font-bold text-teal-900">Edit referral</h1>
      <p className="text-sm text-stone-600">
        Update demographic, payer, physician, or intake information. Authorization and POC
        transmissions are managed on the referral detail page.
      </p>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3" role="alert">
          <div className="text-sm font-bold text-red-800 mb-1">
            {Object.keys(errors).length} field(s) need attention
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="card p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patient name" error={errors.patientName}>
            <input
              className="input"
              value={form.patientName}
              onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            />
          </Field>
          <Field label="Date of birth" error={errors.dateOfBirth}>
            <input
              type="date"
              className="input"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Diagnosis" error={errors.diagnosis}>
          <input
            className="input"
            value={form.diagnosis}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ICD-10 code" error={errors.diagnosisCode}>
            <input
              className="input"
              value={form.diagnosisCode}
              onChange={(e) => setForm({ ...form, diagnosisCode: e.target.value })}
            />
          </Field>
          <Field label="Intake channel" error={errors.intakeChannel}>
            <select
              className="input"
              value={form.intakeChannel}
              onChange={(e) =>
                setForm({ ...form, intakeChannel: e.target.value as IntakeChannel })
              }
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
              className="input"
              value={form.referringPhysician}
              onChange={(e) => setForm({ ...form, referringPhysician: e.target.value })}
            />
          </Field>
          <Field label="Physician fax" error={errors.physicianFax}>
            <input
              className="input"
              value={form.physicianFax}
              onChange={(e) => setForm({ ...form, physicianFax: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Primary insurance" error={errors.insurancePrimary}>
            <input
              className="input"
              value={form.insurancePrimary}
              onChange={(e) => setForm({ ...form, insurancePrimary: e.target.value })}
            />
          </Field>
          <Field label="Member ID" error={errors.insuranceMemberId}>
            <input
              className="input"
              value={form.insuranceMemberId}
              onChange={(e) => setForm({ ...form, insuranceMemberId: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Location" error={errors.location}>
            <select
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option>Main Clinic</option>
              <option>Satellite Clinic</option>
            </select>
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
              <input
                type="checkbox"
                checked={form.priorAuthRequired}
                onChange={(e) =>
                  setForm({ ...form, priorAuthRequired: e.target.checked })
                }
                className="rounded border-stone-300"
              />
              Prior authorization required
            </label>
          </div>
        </div>

        <Field label="Notes" error={errors.notes}>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>

        <div className="flex gap-2 justify-end pt-2 border-t border-stone-200 dark:border-stone-700">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            Save changes
          </button>
        </div>
      </form>
    </div>
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

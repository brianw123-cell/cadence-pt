"use client";

import PatientForm from "@/components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-teal-900">New patient</h1>
      <p className="text-sm text-stone-600">
        Add a patient to the active caseload. Existing referrals can be attached later
        from the case detail page.
      </p>
      <PatientForm mode="new" />
    </div>
  );
}

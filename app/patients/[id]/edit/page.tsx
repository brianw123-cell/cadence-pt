"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePatientsRepo } from "@/lib/repo";
import PatientForm from "@/components/patients/PatientForm";

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const patient = usePatientsRepo().get(id);

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

  return (
    <div className="max-w-3xl space-y-4">
      <Link href={`/cases/${patient.id}`} className="text-sm text-teal-700 hover:text-teal-900">
        ← Back to case
      </Link>
      <h1 className="text-2xl font-bold text-teal-900">Edit {patient.name}</h1>
      <p className="text-sm text-stone-600">
        Update demographic, diagnosis, payer, or therapist assignment.
      </p>
      <PatientForm mode="edit" existing={patient} />
    </div>
  );
}

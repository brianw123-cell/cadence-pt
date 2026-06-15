"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePatientsRepo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { age, formatDate } from "@/lib/utils";

const payerColor: Record<string, string> = {
  medicare: "bg-blue-100 text-blue-800",
  "medicare-advantage": "bg-indigo-100 text-indigo-800",
  commercial: "bg-stone-100 text-stone-800",
  medicaid: "bg-amber-100 text-amber-800",
  "self-pay": "bg-emerald-100 text-emerald-800",
};

export default function PatientsPage() {
  const repo = usePatientsRepo();
  const patients = repo.list();

  const [query, setQuery] = useState("");
  const [confirmUnenroll, setConfirmUnenroll] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.name, p.primaryDiagnosis, p.primaryInsurance, p.primaryTherapist ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [patients, query]);

  const enroll = (id: string, name: string) => {
    try {
      repo.enrollRTM(id);
      toast.success("Enrolled in RTM", `${name} is now generating monthly RTM revenue.`);
    } catch {
      toast.error("Could not enroll", "Try again, or refresh the page.");
    }
  };

  const requestUnenroll = (id: string, name: string) => setConfirmUnenroll({ id, name });

  const doUnenroll = () => {
    if (!confirmUnenroll) return;
    try {
      repo.unenrollRTM(confirmUnenroll.id);
      toast.warning(
        "Unenrolled from RTM",
        `${confirmUnenroll.name} will no longer be included in next month's RTM claim batch.`,
      );
    } catch {
      toast.error("Could not unenroll");
    }
    setConfirmUnenroll(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Patients</h1>
        <p className="text-sm text-stone-600 mt-1">
          Active caseload across all locations. Enroll Medicare patients in RTM with one click.
        </p>
      </div>

      {/* Search */}
      <div className="card p-3">
        <label className="sr-only" htmlFor="patient-search">Search patients</label>
        <input
          id="patient-search"
          type="search"
          className="input"
          placeholder="Search by name, diagnosis, payer, or therapist…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <div className="text-xs text-stone-500 mt-2">
            {filtered.length} of {patients.length} match
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={query ? "No patients match your search" : "No patients on caseload"}
          body={
            query
              ? "Try a different search term, or clear the filter."
              : "When you add referrals and complete evaluations, patients show up here."
          }
          actionLabel={query ? undefined : "+ New referral"}
          actionHref={query ? undefined : "/referrals/new"}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <caption className="sr-only">Active patient roster with RTM enrollment status</caption>
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-stone-700 text-xs uppercase tracking-wide">Patient</th>
                <th scope="col" className="px-4 py-3 font-semibold text-stone-700 text-xs uppercase tracking-wide">Age</th>
                <th scope="col" className="px-4 py-3 font-semibold text-stone-700 text-xs uppercase tracking-wide">Diagnosis</th>
                <th scope="col" className="px-4 py-3 font-semibold text-stone-700 text-xs uppercase tracking-wide">Payer</th>
                <th scope="col" className="px-4 py-3 font-semibold text-stone-700 text-xs uppercase tracking-wide">Therapist</th>
                <th scope="col" className="px-4 py-3 font-semibold text-stone-700 text-xs uppercase tracking-wide">RTM</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const billable = p.payerCategory === "medicare" || p.payerCategory === "medicare-advantage";
                return (
                  <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link href={`/rtm/${p.id}`} className="font-medium text-teal-800 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{age(p.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-stone-700">{p.primaryDiagnosis}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${payerColor[p.payerCategory]}`}>
                        {p.payerCategory.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{p.primaryTherapist}</td>
                    <td className="px-4 py-3">
                      {p.rtmEnrolled ? (
                        <span className="badge bg-emerald-100 text-emerald-800">
                          Enrolled {p.rtmEnrolledAt ? formatDate(p.rtmEnrolledAt) : ""}
                        </span>
                      ) : billable ? (
                        <span className="badge bg-amber-100 text-amber-800">
                          Not enrolled
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500">Not eligible</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.rtmEnrolled ? (
                        <button
                          onClick={() => requestUnenroll(p.id, p.name)}
                          className="text-xs text-stone-600 hover:text-red-700"
                        >
                          Unenroll
                        </button>
                      ) : billable ? (
                        <button
                          onClick={() => enroll(p.id, p.name)}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Enroll in RTM →
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmUnenroll}
        tone="danger"
        title="Unenroll from RTM?"
        body={`This will stop billing RTM codes for ${confirmUnenroll?.name ?? "this patient"} next month. You can re-enroll any time, but the setup fee (CPT 98975) cannot be re-billed for the same episode of care.`}
        confirmLabel="Unenroll"
        cancelLabel="Keep enrolled"
        onConfirm={doUnenroll}
        onCancel={() => setConfirmUnenroll(null)}
      />
    </div>
  );
}

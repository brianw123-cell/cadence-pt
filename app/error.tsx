"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would push to Sentry / Datadog / etc.
    if (typeof window !== "undefined") {
      console.error("Cadence page error:", error);
    }
  }, [error]);

  return (
    <div className="card p-8 md:p-12 text-center max-w-2xl mx-auto mt-12">
      <div className="text-5xl mb-3">⚠</div>
      <h1 className="text-2xl font-bold text-red-700 mb-2">Something went wrong on this page</h1>
      <p className="text-stone-700 mb-6">
        Cadence caught an error so the rest of the app keeps working. The other pages
        (Dashboard, Referrals, RTM, etc.) are still fine — just this one needs a refresh.
      </p>
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
      {error.digest && (
        <div className="mt-6 text-xs text-stone-500 font-mono">
          Error ID: {error.digest}
        </div>
      )}
    </div>
  );
}

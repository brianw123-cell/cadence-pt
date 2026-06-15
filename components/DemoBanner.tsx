"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "cadence-pt-demo-banner-dismissed";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(true); // start true to avoid SSR flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold flex-shrink-0">DEMO</span>
          <span className="truncate">
            All patient names, diagnoses, and clinical data are fictional. Not for use with real PHI. No login required.
          </span>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "true");
            setDismissed(true);
          }}
          className="font-bold flex-shrink-0 px-2 hover:bg-amber-200 rounded"
          aria-label="Dismiss demo banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}

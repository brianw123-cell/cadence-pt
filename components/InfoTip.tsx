"use client";

import { useState } from "react";

/**
 * Lightweight inline tooltip for jargon (KX, MCID, CPT codes, etc).
 * Works on touch via tap-toggle, on desktop via hover/focus.
 */
export default function InfoTip({ children, label }: { children: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center h-4 w-4 ml-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold leading-none hover:bg-stone-300 align-middle"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full mt-1 -translate-x-1/2 z-30 w-56 bg-stone-900 text-white text-xs leading-snug rounded p-2 shadow-lg pointer-events-none"
        >
          {children}
        </span>
      )}
    </span>
  );
}

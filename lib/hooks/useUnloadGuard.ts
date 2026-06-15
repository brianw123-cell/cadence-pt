"use client";

import { useEffect } from "react";

/**
 * Warns the user before leaving the page if `dirty` is true.
 * Catches: tab close, browser back, refresh, link clicks that trigger full nav.
 *
 * Note: Next.js client-side navigation (router.push) does NOT trigger
 * beforeunload. Components should handle that case separately if needed.
 */
export function useUnloadGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for legacy browsers; modern browsers show a generic prompt
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}

"use client";

import { useEffect, useState } from "react";

/**
 * Detects when localStorage is unavailable (private browsing, blocked by
 * extension, quota exceeded) and shows a non-dismissable banner.
 *
 * If localStorage doesn't work, the Zustand persistence will silently fail —
 * the user will think their changes saved but they won't survive a refresh.
 * Better to surface that explicitly.
 */
export default function StorageHealthCheck() {
  const [issue, setIssue] = useState<"none" | "blocked" | "quota">("none");

  useEffect(() => {
    try {
      const key = "__cadence_storage_check__";
      localStorage.setItem(key, "1");
      const echo = localStorage.getItem(key);
      localStorage.removeItem(key);
      if (echo !== "1") {
        setIssue("blocked");
      }
    } catch (err) {
      if (err instanceof Error && /quota/i.test(err.message)) {
        setIssue("quota");
      } else {
        setIssue("blocked");
      }
    }
  }, []);

  if (issue === "none") return null;

  const messages: Record<"blocked" | "quota", { title: string; body: string }> = {
    blocked: {
      title: "Browser storage is blocked",
      body:
        "Cadence saves your changes in your browser's local storage. It looks like that's disabled — likely private/incognito mode or a tracking-protection extension. Any changes you make will not persist past a refresh.",
    },
    quota: {
      title: "Browser storage is full",
      body:
        "Your browser ran out of local storage space. Cadence cannot save new changes. Free up some space by clearing data for other sites, then refresh.",
    },
  };

  const { title, body } = messages[issue];

  return (
    <div className="bg-red-100 border-b border-red-300 text-red-900 text-xs">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-2">
        <div className="flex items-start gap-2">
          <span className="font-bold flex-shrink-0">⚠ {title}</span>
          <span className="opacity-90">{body}</span>
        </div>
      </div>
    </div>
  );
}

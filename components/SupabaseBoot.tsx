"use client";

import { useEffect } from "react";
import { bootSupabaseSync } from "@/lib/repo/supabase-sync";

/** Mounted once at the app root. Boots the Supabase ↔ Zustand sync. */
export default function SupabaseBoot() {
  useEffect(() => {
    bootSupabaseSync().catch((err) => {
      // Don't crash the UI — the app falls back to localStorage if Supabase
      // is unreachable. Surfacing the error via console keeps it diagnosable.
      console.error("[cadence-supabase] boot failed:", err);
    });
  }, []);
  return null;
}

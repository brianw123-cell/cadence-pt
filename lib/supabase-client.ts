"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_ENABLED = !!(url && key);

const SESSION_KEY = "cadence-session-id";

function readOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = "";
  try {
    id = localStorage.getItem(SESSION_KEY) ?? "";
  } catch {
    /* private browsing */
  }
  if (!id) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {
      /* private browsing */
    }
  }
  return id;
}

let cachedClient: SupabaseClient<Database> | null = null;
let cachedSessionId = "";

export function getSupabase(): { client: SupabaseClient<Database>; sessionId: string } | null {
  if (!SUPABASE_ENABLED) return null;
  if (!cachedClient) {
    cachedSessionId = readOrCreateSessionId();
    cachedClient = createClient<Database>(url!, key!, {
      global: { headers: { "x-cadence-session": cachedSessionId } },
      auth: { persistSession: false },
    });
  }
  return { client: cachedClient, sessionId: cachedSessionId };
}

/** Useful for diagnostics. Don't ship to UI. */
export function getCadenceSessionId(): string {
  if (!cachedSessionId && typeof window !== "undefined") {
    cachedSessionId = readOrCreateSessionId();
  }
  return cachedSessionId;
}

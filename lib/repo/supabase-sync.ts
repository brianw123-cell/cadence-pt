"use client";

/**
 * Supabase sync layer. Strategy: keep the existing synchronous repo API
 * (powered by Zustand) and use Supabase as the source of truth in a
 * read-on-mount / write-through pattern.
 *
 * - On first paint, if SUPABASE_ENABLED, hydrate the Zustand store from
 *   Supabase. If the session has no rows yet, seed the canonical demo data
 *   and persist it.
 * - On every Zustand mutation (subscribed via store.subscribe), push the
 *   diff to Supabase. Optimistic UI — local update is instant; Supabase
 *   write happens async.
 *
 * This pattern lets us deliver "real database" while keeping page code
 * untouched.
 */

import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase-client";
import { useAppStore } from "@/lib/store";
import { seedReferrals, seedPatients, seedCheckins, seedPromScores } from "@/lib/data/seed";
import type {
  Referral,
  Patient,
  RTMCheckin,
  PROMScore,
  Authorization,
  POCTransmission,
  ReferralStage,
} from "@/lib/types";
import type { Database } from "@/lib/db.types";

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type CheckinRow = Database["public"]["Tables"]["rtm_checkins"]["Row"];
type PROMRow = Database["public"]["Tables"]["prom_scores"]["Row"];

let booted = false;

// When a Realtime event arrives we update Zustand. That update triggers the
// write-back subscriber, which would write the change back to Supabase, which
// would broadcast another Realtime event, infinite loop. This flag is set
// while we apply a remote change so the write-back subscriber knows to skip.
let applyingRemote = false;

export async function bootSupabaseSync(): Promise<void> {
  if (booted || !SUPABASE_ENABLED) return;
  booted = true;
  const sb = getSupabase();
  if (!sb) return;
  const { client, sessionId } = sb;

  // 1. Try to read existing rows for this session
  const [refRes, patRes, chkRes, prmRes] = await Promise.all([
    client.from("referrals").select("*"),
    client.from("patients").select("*"),
    client.from("rtm_checkins").select("*"),
    client.from("prom_scores").select("*"),
  ]);

  const hasData =
    (refRes.data && refRes.data.length > 0) ||
    (patRes.data && patRes.data.length > 0);

  if (hasData) {
    // Replace the Zustand state with what Supabase has
    useAppStore.setState({
      referrals: (refRes.data ?? []).map(rowToReferral),
      patients: (patRes.data ?? []).map(rowToPatient),
      checkins: (chkRes.data ?? []).map(rowToCheckin),
      promScores: (prmRes.data ?? []).map(rowToProm),
    });
  } else {
    // Fresh session — seed Supabase with the demo data
    await Promise.all([
      client.from("referrals").insert(
        seedReferrals.map((r) => referralToRow(r, sessionId)),
      ),
      client.from("patients").insert(
        seedPatients.map((p) => patientToRow(p, sessionId)),
      ),
      client.from("rtm_checkins").insert(
        seedCheckins.map((c) => checkinToRow(c, sessionId)),
      ),
      client.from("prom_scores").insert(
        seedPromScores.map((s) => promToRow(s, sessionId)),
      ),
    ]);
  }

  // 2. Subscribe to local mutations and write through to Supabase
  let prev = useAppStore.getState();
  useAppStore.subscribe((next) => {
    if (applyingRemote) {
      // The mutation came from a Realtime broadcast; don't echo it back to
      // Supabase. Just refresh the diff baseline so the next real local
      // mutation is detected correctly.
      prev = next;
      return;
    }
    const tasks: Promise<unknown>[] = [];

    // Referrals: detect inserts and updates by id
    for (const r of next.referrals) {
      const before = prev.referrals.find((x) => x.id === r.id);
      if (!before) {
        tasks.push(Promise.resolve(client.from("referrals").upsert(referralToRow(r, sessionId))));
      } else if (referralDiff(before, r)) {
        tasks.push(Promise.resolve(client.from("referrals").update(referralToRow(r, sessionId)).eq("id", r.id)));
      }
    }

    // Patients: enrollment flips are the most common write
    for (const p of next.patients) {
      const before = prev.patients.find((x) => x.id === p.id);
      if (!before) {
        tasks.push(Promise.resolve(client.from("patients").upsert(patientToRow(p, sessionId))));
      } else if (patientDiff(before, p)) {
        tasks.push(Promise.resolve(client.from("patients").update(patientToRow(p, sessionId)).eq("id", p.id)));
      }
    }

    // Check-ins: insert-only (no edit UI)
    for (const c of next.checkins) {
      const before = prev.checkins.find((x) => x.id === c.id);
      if (!before) {
        tasks.push(Promise.resolve(client.from("rtm_checkins").upsert(checkinToRow(c, sessionId))));
      }
    }

    // PROMs: insert-only
    for (const s of next.promScores) {
      const before = prev.promScores.find((x) => x.id === s.id);
      if (!before) {
        tasks.push(Promise.resolve(client.from("prom_scores").upsert(promToRow(s, sessionId))));
      }
    }

    prev = next;
    // Fire-and-forget; errors logged to console for visibility
    Promise.all(tasks).catch((err) => {
      console.error("[cadence-supabase-sync] write failed:", err);
    });
  });

  // 3. Supabase Realtime — broadcast inbound changes to all tabs that share
  //    this session_id. Open two browser tabs to the live site, mutate in one,
  //    watch the other update within ~200ms. Proves the database is real.
  const sessionFilter = `session_id=eq.${sessionId}`;
  client
    .channel(`cadence-session-${sessionId}`)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "referrals", filter: sessionFilter },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => applyReferralChange(payload as Payload<ReferralRow>),
    )
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "patients", filter: sessionFilter },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => applyPatientChange(payload as Payload<PatientRow>),
    )
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "rtm_checkins", filter: sessionFilter },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => applyCheckinChange(payload as Payload<CheckinRow>),
    )
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "prom_scores", filter: sessionFilter },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => applyPromChange(payload as Payload<PROMRow>),
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info("[cadence-supabase-realtime] subscribed for session", sessionId);
      }
    });
}

// ---------- Realtime change appliers ----------
// Each function applies a single row change from Postgres to the Zustand store
// while applyingRemote=true so the write-back subscriber skips it. We don't
// just naively replace state — we merge by id, preserving the existing
// reactivity model.

type Payload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
};

function withRemoteUpdate(fn: () => void): void {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

function applyReferralChange(payload: Payload<ReferralRow>): void {
  withRemoteUpdate(() => {
    useAppStore.setState((state) => {
      if (payload.eventType === "DELETE") {
        return { referrals: state.referrals.filter((r) => r.id !== payload.old.id) };
      }
      const next = rowToReferral(payload.new);
      const idx = state.referrals.findIndex((r) => r.id === next.id);
      if (idx < 0) return { referrals: [next, ...state.referrals] };
      const copy = state.referrals.slice();
      copy[idx] = next;
      return { referrals: copy };
    });
  });
}

function applyPatientChange(payload: Payload<PatientRow>): void {
  withRemoteUpdate(() => {
    useAppStore.setState((state) => {
      if (payload.eventType === "DELETE") {
        return { patients: state.patients.filter((p) => p.id !== payload.old.id) };
      }
      const next = rowToPatient(payload.new);
      const idx = state.patients.findIndex((p) => p.id === next.id);
      if (idx < 0) return { patients: [next, ...state.patients] };
      const copy = state.patients.slice();
      copy[idx] = next;
      return { patients: copy };
    });
  });
}

function applyCheckinChange(payload: Payload<CheckinRow>): void {
  withRemoteUpdate(() => {
    useAppStore.setState((state) => {
      if (payload.eventType === "DELETE") {
        return { checkins: state.checkins.filter((c) => c.id !== payload.old.id) };
      }
      const next = rowToCheckin(payload.new);
      const idx = state.checkins.findIndex((c) => c.id === next.id);
      if (idx < 0) return { checkins: [next, ...state.checkins] };
      const copy = state.checkins.slice();
      copy[idx] = next;
      return { checkins: copy };
    });
  });
}

function applyPromChange(payload: Payload<PROMRow>): void {
  withRemoteUpdate(() => {
    useAppStore.setState((state) => {
      if (payload.eventType === "DELETE") {
        return { promScores: state.promScores.filter((p) => p.id !== payload.old.id) };
      }
      const next = rowToProm(payload.new);
      const idx = state.promScores.findIndex((p) => p.id === next.id);
      if (idx < 0) return { promScores: [next, ...state.promScores] };
      const copy = state.promScores.slice();
      copy[idx] = next;
      return { promScores: copy };
    });
  });
}

// ---------- Row ↔ domain mappers ----------

function rowToReferral(r: ReferralRow): Referral {
  return {
    id: r.id,
    patientName: r.patient_name,
    dateOfBirth: r.date_of_birth,
    diagnosis: r.diagnosis,
    diagnosisCode: r.diagnosis_code ?? undefined,
    referringPhysician: r.referring_physician,
    physicianNPI: r.physician_npi ?? undefined,
    physicianFax: r.physician_fax ?? undefined,
    intakeChannel: r.intake_channel as Referral["intakeChannel"],
    receivedAt: r.received_at,
    insurancePrimary: r.insurance_primary,
    insuranceMemberId: r.insurance_member_id ?? undefined,
    priorAuthRequired: r.prior_auth_required,
    stage: r.stage as ReferralStage,
    evaluationDate: r.evaluation_date ?? undefined,
    pocTransmissions: (r.poc_transmissions as unknown as POCTransmission[]) ?? [],
    authorization: (r.authorization as unknown as Authorization | null) ?? undefined,
    assignedTherapist: r.assigned_therapist ?? undefined,
    location: r.location,
    notes: r.notes ?? undefined,
  };
}

function referralToRow(r: Referral, sessionId: string): ReferralRow {
  return {
    id: r.id,
    session_id: sessionId,
    patient_name: r.patientName,
    date_of_birth: r.dateOfBirth,
    diagnosis: r.diagnosis,
    diagnosis_code: r.diagnosisCode ?? null,
    referring_physician: r.referringPhysician,
    physician_npi: r.physicianNPI ?? null,
    physician_fax: r.physicianFax ?? null,
    intake_channel: r.intakeChannel,
    received_at: r.receivedAt,
    insurance_primary: r.insurancePrimary,
    insurance_member_id: r.insuranceMemberId ?? null,
    prior_auth_required: r.priorAuthRequired,
    stage: r.stage,
    evaluation_date: r.evaluationDate ?? null,
    assigned_therapist: r.assignedTherapist ?? null,
    location: r.location,
    notes: r.notes ?? null,
    authorization: (r.authorization ?? null) as never,
    poc_transmissions: r.pocTransmissions as never,
    created_at: new Date().toISOString(),
  };
}

function rowToPatient(r: PatientRow): Patient {
  return {
    id: r.id,
    name: r.name,
    dateOfBirth: r.date_of_birth,
    primaryDiagnosis: r.primary_diagnosis,
    primaryInsurance: r.primary_insurance,
    payerCategory: r.payer_category as Patient["payerCategory"],
    status: r.status as Patient["status"],
    rtmEnrolled: r.rtm_enrolled,
    rtmEnrolledAt: r.rtm_enrolled_at ?? undefined,
    primaryTherapist: r.primary_therapist ?? undefined,
  };
}

function patientToRow(p: Patient, sessionId: string): PatientRow {
  return {
    id: p.id,
    session_id: sessionId,
    name: p.name,
    date_of_birth: p.dateOfBirth,
    primary_diagnosis: p.primaryDiagnosis,
    primary_insurance: p.primaryInsurance,
    payer_category: p.payerCategory,
    status: p.status,
    rtm_enrolled: p.rtmEnrolled,
    rtm_enrolled_at: p.rtmEnrolledAt ?? null,
    primary_therapist: p.primaryTherapist ?? null,
    created_at: new Date().toISOString(),
  };
}

function rowToCheckin(r: CheckinRow): RTMCheckin {
  return {
    id: r.id,
    patientId: r.patient_id,
    date: r.date,
    source: r.source as RTMCheckin["source"],
    painLevel: r.pain_level ?? undefined,
    exercisesCompleted: r.exercises_completed,
    exercisesPrescribed: r.exercises_prescribed,
    minutesActive: r.minutes_active,
    notes: r.notes ?? undefined,
  };
}

function checkinToRow(c: RTMCheckin, sessionId: string): CheckinRow {
  return {
    id: c.id,
    session_id: sessionId,
    patient_id: c.patientId,
    date: c.date,
    source: c.source,
    pain_level: c.painLevel ?? null,
    exercises_completed: c.exercisesCompleted,
    exercises_prescribed: c.exercisesPrescribed,
    minutes_active: c.minutesActive,
    notes: c.notes ?? null,
    created_at: new Date().toISOString(),
  };
}

function rowToProm(r: PROMRow): PROMScore {
  return {
    id: r.id,
    patientId: r.patient_id,
    instrumentCode: r.instrument_code as PROMScore["instrumentCode"],
    date: r.date,
    score: r.score,
    visit: r.visit,
  };
}

function promToRow(s: PROMScore, sessionId: string): PROMRow {
  return {
    id: s.id,
    session_id: sessionId,
    patient_id: s.patientId,
    instrument_code: s.instrumentCode,
    date: s.date,
    score: s.score,
    visit: s.visit,
    created_at: new Date().toISOString(),
  };
}

// Cheap shallow-ish diff helpers. Avoid full deep equality — we only need
// to know "did anything user-facing change?"
function referralDiff(a: Referral, b: Referral): boolean {
  return (
    a.stage !== b.stage ||
    a.evaluationDate !== b.evaluationDate ||
    a.pocTransmissions.length !== b.pocTransmissions.length ||
    JSON.stringify(a.authorization) !== JSON.stringify(b.authorization) ||
    a.notes !== b.notes
  );
}

function patientDiff(a: Patient, b: Patient): boolean {
  return (
    a.rtmEnrolled !== b.rtmEnrolled ||
    a.rtmEnrolledAt !== b.rtmEnrolledAt ||
    a.status !== b.status
  );
}

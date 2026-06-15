# Cadence PT — Storage migration guide

This document covers the path from the current localStorage demo to a real
Supabase-backed multi-tenant production database. The repo pattern in
`lib/repo/` was built specifically for this migration.

## Why we waited

The current demo uses Zustand + `localStorage` because:

- **Demo sharing means N visitors, N independent demos.** Every PT owner who
  opens `https://cadence-pt.vercel.app` gets their own working copy with the
  same seed data. With a shared Supabase backend, every visitor would see and
  step on every other visitor's edits — terrible for sales demos.
- **Zero setup cost.** No env vars, no project creation, no RLS rules, no
  migration files, no `npm run db:generate-types`. The link just works.
- **Zero runtime cost.** $0/month at any traffic level.
- **No PHI risk.** Real database with real schemas creates a fiction that this
  could hold patient data. localStorage with a DEMO banner makes the
  demo-ness explicit.

When a real PT owner says "I want my staff to use this" — that's when we flip.

## What changes when we migrate

| Concern | Today | After Supabase |
|---------|-------|----------------|
| Storage | `localStorage` via Zustand persist | Postgres via Supabase client |
| Multi-user | One browser, one user | RLS scopes each clinic's data |
| Auth | None — DEMO banner | Supabase Auth (email magic link) |
| Realtime | None | Supabase Realtime subscriptions |
| Audit log | None | Append-only `audit_log` table on every mutation |
| Sensitive data | Demo only — DO NOT add PHI | PHI lives here, encrypted at rest, BAA in place |

## The repo pattern as the swap point

Every page already talks to repository interfaces, not to Zustand directly:

```typescript
// app/patients/page.tsx
import { usePatientsRepo } from "@/lib/repo";
const patients = usePatientsRepo().list();
```

The interfaces live in `lib/repo/types.ts`:

```typescript
export interface PatientsRepo {
  list(): Patient[];
  get(id: string): Patient | undefined;
  enrollRTM(id: string): void;
  unenrollRTM(id: string): void;
}
```

The current implementation in `lib/repo/hooks.ts` calls the Zustand store. To
swap to Supabase, we create `lib/repo/supabase.ts` that implements the same
interfaces against the Supabase client. Then we change one line in
`lib/repo/index.ts`:

```typescript
// Before
export { useReferralsRepo, usePatientsRepo, ... } from "./hooks";

// After
export { useReferralsRepo, usePatientsRepo, ... } from "./supabase";
```

That's it. No page or component changes.

## Step-by-step migration

### 1. Create the Supabase project (5 min)

```bash
# In the Supabase dashboard at supabase.com:
#   - New project: cadence-pt
#   - Region: us-east-1 (lowest latency to most US clinics)
#   - Pricing: Free tier is fine for the first ~25 clinics
```

Capture the project URL and `anon` key — they go into Vercel as env vars.

### 2. Apply the schema migration (10 min)

Create `supabase/migrations/0001_initial.sql`:

```sql
-- Tenant isolation: every row knows which clinic owns it
create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  date_of_birth date not null,
  primary_diagnosis text not null,
  primary_insurance text not null,
  payer_category text not null check (payer_category in (
    'medicare','medicare-advantage','commercial','medicaid','self-pay'
  )),
  status text not null default 'active',
  rtm_enrolled boolean not null default false,
  rtm_enrolled_at date,
  primary_therapist text,
  created_at timestamptz default now()
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_name text not null,
  date_of_birth date not null,
  diagnosis text not null,
  diagnosis_code text,
  referring_physician text not null,
  physician_npi text,
  physician_fax text,
  intake_channel text not null,
  received_at date not null,
  insurance_primary text not null,
  insurance_member_id text,
  prior_auth_required boolean not null default false,
  stage text not null default 'new',
  evaluation_date date,
  location text not null,
  notes text,
  created_at timestamptz default now()
);

create table authorizations (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id) on delete cascade,
  payer text not null,
  auth_number text,
  visits_approved int not null,
  visits_used int not null default 0,
  valid_from date not null,
  valid_through date not null,
  status text not null default 'pending'
);

create table poc_transmissions (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id) on delete cascade,
  sent_at date not null,
  method text not null,
  recipient text not null,
  days_from_eval int not null,
  acknowledged_at date,
  notes text
);

create table rtm_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  date date not null,
  source text not null,
  pain_level int,
  exercises_completed int not null,
  exercises_prescribed int not null,
  minutes_active int not null,
  notes text
);

create table prom_scores (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  instrument_code text not null,
  date date not null,
  score numeric not null,
  visit int not null
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  user_id uuid not null,
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Row-level security: every clinic only sees its own data
alter table patients enable row level security;
alter table referrals enable row level security;
alter table authorizations enable row level security;
alter table poc_transmissions enable row level security;
alter table rtm_checkins enable row level security;
alter table prom_scores enable row level security;

-- One example policy — repeat the pattern for every table
create policy "Tenants see own patients only"
  on patients for all
  using (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- Indexes for query patterns Cadence uses
create index on patients (clinic_id, status) where status = 'active';
create index on referrals (clinic_id, stage);
create index on poc_transmissions (referral_id);
create index on authorizations (referral_id);
create index on rtm_checkins (patient_id, date desc);
create index on prom_scores (patient_id, instrument_code, date);
```

Apply via Supabase MCP `apply_migration` (or via the SQL editor).

### 3. Generate TypeScript types (1 min)

```bash
npx supabase gen types typescript --project-id <project-id> > lib/db.types.ts
```

### 4. Implement the Supabase repo (1-2 hours)

Create `lib/repo/supabase.ts` that implements the same interfaces as
`lib/repo/hooks.ts`. Use TanStack Query for caching, optimistic updates, and
loading/error states:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { ReferralsRepo, PatientsRepo, CheckinsRepo, PROMsRepo } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useReferralsRepo(): ReferralsRepo {
  const qc = useQueryClient();
  const { data: referrals = [] } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*, authorization:authorizations(*), poc_transmissions(*)");
      if (error) throw error;
      return data;
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: ReferralStage }) => {
      const { error } = await supabase
        .from("referrals")
        .update({ stage })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrals"] }),
  });

  return {
    list: () => referrals,
    get: (id) => referrals.find((r) => r.id === id),
    updateStage: (id, stage) => updateStage.mutate({ id, stage }),
    // ...rest of the interface
  };
}
```

### 5. Flip the import (5 sec)

In `lib/repo/index.ts`:

```typescript
// Old
export { useReferralsRepo, usePatientsRepo, useCheckinsRepo, usePROMsRepo } from "./hooks";

// New
export { useReferralsRepo, usePatientsRepo, useCheckinsRepo, usePROMsRepo } from "./supabase";
```

### 6. Wire env vars in Vercel (5 min)

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 7. Add loading states

Page-level components currently assume `repo.list()` returns immediately. After
Supabase, the first render has no data. Update each page to handle:

```typescript
const { isPending, data: referrals = [] } = useReferralsRepo();
if (isPending) return <ReferralsListSkeleton />;
```

The repo interface should be extended to expose `isPending` and `error`, OR we
keep the interface synchronous and have the hook block on Suspense. The
Suspense path is cleaner long-term.

### 8. Auth (one more session of work)

- Add `@supabase/ssr` package
- Create `app/login/page.tsx` with magic-link sign-in
- Create middleware to redirect un-authed users to `/login`
- Strip the DEMO banner

## What does NOT change

- All pages
- All components in `components/`
- All calculation logic in `lib/calculations.ts`
- All Zod schemas in `lib/schemas.ts`
- All tests in `__tests__/` (they're against pure logic, not storage)
- The Playwright E2E tests (they hit URLs, not the backend directly)

This is the entire point of the repo pattern. The pages don't know — and don't
need to know — whether they're talking to localStorage, Supabase, or a future
multi-region replication layer.

## Cost projection

| Tier | Clinics | Monthly cost | Notes |
|------|---------|--------------|-------|
| Supabase Free | 1-25 | $0 | 500 MB DB, 2 GB bandwidth |
| Supabase Pro | 25-200 | $25 | + daily backups, point-in-time restore |
| Supabase Team | 200-1000 | $599 | + SOC 2, SLA, HIPAA BAA |
| Supabase Enterprise | 1000+ | Custom | Dedicated infra, custom SLA |

For HIPAA: you need at least the **Team** tier ($599/mo) to get a signed BAA
from Supabase. The Free and Pro tiers explicitly do not cover PHI.

## Open questions to resolve before the migration

1. **What's the tenant boundary?** Per-clinic? Per-organization (parent of
   multiple clinics)? Per-therapist?
2. **Patient data import path** — most clinics will want to import from their
   existing EMR. Build a CSV importer first, integrations second.
3. **Real-time vs polling** — Supabase Realtime is great but pricey at scale.
   For a busy clinic with 50 active users, 10-second polling may be cheaper.
4. **Self-hosted alternative** — if HIPAA cost is prohibitive, self-hosting
   Postgres + Supabase Studio in AWS gives full control and is BAA-compatible
   under AWS's umbrella BAA.

## Until then

Stay on localStorage. The repo pattern, the tests, and the calculation logic
are all production-ready. The only thing waiting is the storage backend.

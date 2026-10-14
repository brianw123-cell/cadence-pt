# Cadence PT

**Live demo:** https://cadence-pt.vercel.app

POC build of two physical therapy software opportunities, packaged as one product.

**Opportunity 1 — Referral Lifecycle Manager.** Captures every inbound physician referral, runs it through a kanban funnel, tracks authorization counts against the UHC 6-visit threshold, and logs Plan-of-Care transmissions to satisfy Medicare's January 2025 certification rule.

**Opportunity 2 — RTM Revenue Engine.** Enrolls Medicare patients in Remote Therapeutic Monitoring, logs check-ins, and generates claim-ready billing reports using CMS 2026 reimbursement rates.

## Quick start

```bash
git clone https://github.com/brianw123-cell/cadence-pt.git
cd cadence-pt
npm install
npm run dev
```

Then open http://localhost:3000

No `.env.local` required. All data is seeded from `lib/data/seed.ts` and persisted client-side in localStorage. To reset, open browser DevTools → Application → Local Storage → delete `cadence-pt-store-v1`.

## What's built

| Route | What it does |
|-------|--------------|
| `/` | Dashboard — referral KPIs, auth-at-risk alerts, projected RTM revenue, the Jan 2025 POC rule explainer |
| `/referrals` | Kanban funnel — drag-style "Advance" buttons move referrals through 8 stages |
| `/referrals/new` | Manual referral entry form (substitutes for fax OCR until that's wired) |
| `/referrals/[id]` | Detail view — authorization tracking with visit counter, POC transmission log with 30-day compliance banner |
| `/patients` | Active caseload — one-click RTM enrollment for Medicare-eligible patients |
| `/rtm` | RTM dashboard — projected vs. untapped Medicare revenue, CMS code reference, enrolled patient cards |
| `/rtm/[id]` | Per-patient adherence log + earned-revenue calculation |
| `/billing` | Monthly RTM claim report with CPT 98975 / 98977 / 98980 breakdown by patient |

## What's stubbed (would need real integration in production)

- **E-fax intake.** Form-based for now. Production: Documo, Notifyre, or SR Fax API → OCR via Azure Document Intelligence → auto-populate referral record.
- **Insurance eligibility.** Manual entry for now. Production: Change Healthcare, Availity, or Stedi eligibility API.
- **Claim submission.** "Export CSV" / "Send to clearinghouse" buttons are visual. Production: 837P generation via clearinghouse SDK.
- **Patient mobile app.** Manual check-in entry stands in for an iOS/Android app + wearable HealthKit/Google Fit integration.
- **Auth (login).** None — POC is single-tenant single-user. Production: Supabase Auth or Auth0, multi-tenant by clinic.
- **Database.** localStorage. Production: Supabase (Postgres) with RLS per clinic.
- **AI scribe.** Not in scope for Opp 1/2 build. Would integrate Abridge / Suki / DeepScribe / Hathr in Opp 3 (full mid-market EMR).

## Test this

1. `npm install && npm run dev`
2. Open `http://localhost:3000/` — confirm the Dashboard shows KPIs (New today: 1, In funnel: 4, Active treatment: 2, Auth at risk: 1, Projected RTM revenue ~ $451)
3. Click **Referrals** → confirm the kanban shows 8 columns with referrals in each stage
4. Click any referral card → confirm the detail page shows Authorization sidebar and POC transmission log
5. On a referral that has an `evaluationDate` and no POC sent (pick one in the `evaluated` stage), click **+ Log transmission** and confirm a row appears in the POC log
6. Click **+ New referral**, fill out the form, submit, and confirm it lands in the "New" column of the funnel
7. Click **Patients** → confirm the table lists 8 patients with payer badges, click **Enroll in RTM** on a Medicare patient who isn't enrolled (Linda Patel) and confirm the Dashboard's Projected RTM revenue increases
8. Click **RTM** → confirm Projected/Untapped/Annualized revenue cards, CMS code table, and enrolled-patient grid
9. Click **Billing** → confirm the monthly report lists every RTM-billable patient with CPT codes 98975 / 98977 / 98980 broken out
10. Click **Reset** in browser localStorage to reset all demo data

Also verify:
- Auth at risk badge appears on Eleanor Brooks' referral (5/6 visits used)
- POC overdue banner appears on any "evaluated" referral with no transmission > 30 days
- "Untapped revenue" decreases by ~$90/mo when you enroll one Medicare patient

## Tech stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS 3
- Zustand with localStorage persistence
- No backend, no auth, no API calls

## Where this lives in the engagement

- See `../PT_business_opportunities_2026-06-14.md` for the four opportunities and why these two were picked first
- See `../PT_feature_comparison_2026-06-14.md` for the competitive matrix this build differentiates against
- See `../PT_supplemental_findings_2026-06-14.md` for the Jan 2025 Medicare POC rule that the referral compliance feature is built around

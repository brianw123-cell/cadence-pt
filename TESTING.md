# Testing — Cadence PT

## Current state

| Layer | Coverage | Notes |
|-------|----------|-------|
| **Unit tests** | 30 tests, 85.88% statement / 94.73% branch on `lib/calculations.ts` | Pure functions only — RTM revenue, denial scan, POC compliance, physician scorecard, auth-at-risk |
| **Integration tests** | 0 | Should add Playwright for Kanban + form flows |
| **Production smoke** | 12 routes verified return 200 | `curl` only — doesn't catch JS runtime errors |
| **TypeScript strict** | Passes clean | `tsc --noEmit` shows no errors |
| **Lint** | Not configured | Next.js ESLint awaits interactive setup |
| **A11y** | Not audited | Should run axe-core |
| **Performance** | Not measured | Should run Lighthouse |

## Before sending the link to a PT owner — pre-flight checklist

These are the steps to run before sharing the URL with a real customer-facing audience.

### 1. Functional smoke (5 min, manual)

Open https://cadence-pt.vercel.app and confirm:

- [ ] Dashboard loads — KPIs show numbers, no "NaN" or "undefined"
- [ ] Click every nav item — all 9 pages render without a blank screen
- [ ] Kanban funnel shows all 8 columns with cards in 7 of them
- [ ] Click any referral card → detail page opens with auth sidebar + POC log visible
- [ ] Click "Advance →" on a kanban card → it jumps to the next column
- [ ] Click "+ New referral" → fill out the form → submit → it lands in the "New" column
- [ ] Click "Log a visit (+1 used)" on an authorization → counter increments, progress bar updates
- [ ] Click "Log transmission" on a referral with no POC → form opens → submit → green "compliant" banner appears
- [ ] Patients page lists 8 patients, click "Enroll in RTM" → patient gets enrolled badge
- [ ] RTM page shows Projected / Untapped / Annualized cards with dollar figures
- [ ] Billing page shows monthly claim breakdown with CPT codes
- [ ] Patient app preview shows the phone mockup with 3 tabs that work
- [ ] Physicians page shows scorecard with conversion %, revenue, POC compliance
- [ ] Forecast page sliders move and the bar chart updates
- [ ] Denials page lists critical + warning items, "Fix it" buttons link to detail pages

### 2. Browser compatibility (15 min)

Open in each browser and click through the main flows:

- [ ] Safari (Mac) — most PT owners use Mac
- [ ] Safari (iPhone, mobile size) — they will open this on their phone
- [ ] Chrome (desktop + mobile)
- [ ] Firefox (lower priority)
- [ ] Edge (lower priority)

### 3. Mobile responsiveness (5 min)

Open Chrome DevTools → toggle device toolbar → test at 375px wide (iPhone SE):

- [ ] Header navigation doesn't overflow or hide critical links
- [ ] Kanban scrolls horizontally without breaking
- [ ] Cards stack vertically on dashboard / RTM / forecast pages
- [ ] Phone mockup on `/patient-app` is centered and readable
- [ ] No horizontal scroll on pages that shouldn't have one
- [ ] Buttons are at least 44×44px tap targets

### 4. State persistence (3 min)

- [ ] Make a change (enroll an RTM patient, add a referral)
- [ ] Hard refresh (Cmd+Shift+R)
- [ ] Confirm change persisted
- [ ] Open Incognito window → confirm you see the fresh seed state, not other visitor's changes
- [ ] Open browser DevTools → Application → Local Storage → confirm `cadence-pt-store-v1` key exists

### 5. Console / network health (3 min)

- [ ] DevTools → Console → no red errors on any page (warnings OK)
- [ ] DevTools → Network → no 404s, no failed JS chunks
- [ ] Page load < 3 seconds on a normal connection
- [ ] No memory leak on extended kanban interaction (move 20+ cards, check Memory tab)

### 6. Demo data sanity (5 min)

A PT owner will scrutinize the numbers. Confirm:

- [ ] RTM dollar figures are believable (~$451 projected, ~$271 untapped)
- [ ] Auth-at-risk count matches what shows up in the funnel (Eleanor Brooks 5/6)
- [ ] Denial protector shows at least 1 critical item (Eleanor's auth limit)
- [ ] Physician scorecard ranks Dr. Patel first (he has most referrals)
- [ ] Forecast chart has 12 bars that grow over time
- [ ] All dates display in 2026 (not 1970 or "Invalid Date")

### 7. Accessibility quick pass (10 min)

Install axe-core browser extension, run on:

- [ ] Dashboard — should be 0 critical issues
- [ ] Kanban — likely has color-contrast issues on stage tones, fix before launch
- [ ] Forecast — sliders need ARIA labels (currently relying on visible text)
- [ ] Patient app — color contrast on the phone gradient may flag

### 8. The "bad PT owner" test

A PT owner might be hostile or skeptical. Things they'll click on purpose:

- [ ] Click "+ New referral" → submit empty form → does it reject gracefully? (Currently: HTML5 required attrs catch most, but not all)
- [ ] Enter a future DOB on new referral → does it show a sensible error? (Currently: accepts)
- [ ] Enter "999" in the visits-approved field → does it cap or display oddly? (Currently: accepts)
- [ ] Open 2 browser tabs, make changes in both → tab 2's localStorage overwrites tab 1's → expected for now, document it
- [ ] Resize browser to 320px wide → confirm nothing breaks catastrophically

## What still needs to be added for production-grade

These are the gaps a senior reviewer would flag in a real code review:

1. **Form validation with Zod** — every form input should be schema-validated, with friendly error messages.
2. **Error boundary at root layout** — one unhandled error currently blanks the entire page.
3. **Loading states** — instant from localStorage today, but the moment you wire Supabase, you'll see flash-of-empty-data without skeleton screens.
4. **Playwright E2E tests** — at least 5 critical user paths (new referral, advance referral, enroll RTM, log POC, run denial scan).
5. **axe-core in CI** — block PRs that introduce a11y regressions.
6. **Lighthouse budget** — block PRs that drop performance score below 90.
7. **Sentry / error tracking** — without this, you have no signal when something breaks for a real user.
8. **HIPAA review** — even demo data should be flagged "DEMO — not PHI" everywhere it appears. Production data needs encryption-at-rest, audit logs, BAA with hosting provider.
9. **Tenant isolation** — current localStorage is single-tenant. The Supabase migration needs Row-Level Security on every table from day one.
10. **Time-zone handling** — all current dates assume browser local time. Real Medicare claims need clinic-local time consistently.

## Running tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Type check
npx tsc --noEmit

# Production build (catches a different class of errors)
npm run build
```

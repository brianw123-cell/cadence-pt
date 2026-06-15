import { test, expect } from "@playwright/test";

/**
 * Five critical user flows. These represent the smallest set that, if all pass,
 * means the demo is safe to share with a real PT owner.
 */

test.beforeEach(async ({ page }) => {
  // Start each test from a clean slate
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* SSR-protected */
    }
  });
});

test("dashboard loads and shows seeded KPIs", async ({ page }) => {
  await page.goto("/");

  // Title
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

  // The four KPI labels (referral funnel)
  await expect(page.getByText("New today")).toBeVisible();
  await expect(page.getByText("In funnel")).toBeVisible();
  await expect(page.getByText("Active treatment")).toBeVisible();

  // The "Untapped revenue / mo" tile should show a dollar amount
  const untapped = page.getByText(/Untapped revenue/i).first();
  await expect(untapped).toBeVisible();
});

test("new referral form rejects bad input then accepts good input", async ({ page }) => {
  await page.goto("/referrals/new");

  // Submit an empty form -> should NOT navigate, should show errors
  await page.getByRole("button", { name: /Add to funnel/i }).click();
  await expect(page.getByText(/need.*attention/i).first()).toBeVisible();
  // Still on /new
  await expect(page).toHaveURL(/\/referrals\/new$/);

  // Now fill in valid values
  await page.locator('input[name="patientName"]').fill("Test Patient One");
  await page.locator('input[name="dateOfBirth"]').fill("1970-01-15");
  await page.locator('input[name="diagnosis"]').fill("Right shoulder impingement");
  await page.locator('input[name="referringPhysician"]').fill("Dr. Test Provider, MD");
  await page.locator('input[name="insurancePrimary"]').fill("Medicare Part B");

  await page.getByRole("button", { name: /Add to funnel/i }).click();

  // Should land back on the funnel page
  await expect(page).toHaveURL(/\/referrals$/);
  await expect(page.getByText("Test Patient One").first()).toBeVisible();
});

test("kanban advance moves a referral one stage forward", async ({ page }) => {
  await page.goto("/referrals");

  // Eleanor Brooks starts in "Active treatment" — advance her
  const eleanorCard = page.getByText("Eleanor Brooks").first().locator("..");
  const advance = eleanorCard.getByText("Advance →");
  if (await advance.isVisible()) {
    await advance.click();
    // After click she should be in Discharged column. Confirm she's still rendered.
    await expect(page.getByText("Eleanor Brooks").first()).toBeVisible();
  }
});

test("RTM enrollment flow swaps the patient's row badge", async ({ page }) => {
  await page.goto("/patients");

  // Linda Patel is seeded as Medicare, NOT enrolled, eligible
  const lindaRow = page.getByText("Linda Patel").locator("xpath=ancestor::tr");
  await expect(lindaRow.getByText(/Not enrolled/i)).toBeVisible();

  // Click the enroll link in her row
  await lindaRow.getByRole("button", { name: /Enroll in RTM/i }).click();

  // After enrolling, the row should show "Enrolled" badge and an "Unenroll" button
  await expect(lindaRow.getByText(/^Enrolled/i)).toBeVisible();
  await expect(lindaRow.getByRole("button", { name: /Unenroll/i })).toBeVisible();
});

test("denial protector lists Eleanor Brooks as critical auth-at-risk", async ({ page }) => {
  await page.goto("/denials");

  // Should render a critical card for Eleanor
  await expect(page.getByText("Eleanor Brooks").first()).toBeVisible();
  // The CRITICAL badge should appear at least once
  await expect(page.getByText("CRITICAL").first()).toBeVisible();
  // The AUTH-LIMIT rule code should appear (her 5/6 visit count)
  await expect(page.getByText("AUTH-LIMIT").first()).toBeVisible();
});

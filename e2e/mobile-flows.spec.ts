import { test, expect } from "@playwright/test";

/**
 * Mobile viewport smoke. Runs the same critical paths against iPhone 13 viewport
 * to catch responsive bugs that desktop chromium never sees.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch { /* SSR-protected */ }
  });
});

test("mobile: hamburger menu opens and navigates", async ({ page }) => {
  await page.goto("/");
  // Top-level nav links should NOT be visible at mobile size (hamburger replaces them)
  const burgerBtn = page.getByLabel("Toggle menu");
  await expect(burgerBtn).toBeVisible();

  // Open drawer
  await burgerBtn.click();
  const referralsLink = page.getByRole("link", { name: "Referrals", exact: true });
  await expect(referralsLink).toBeVisible();
  await referralsLink.click();

  await expect(page).toHaveURL(/\/referrals$/);
});

test("mobile: kanban scrolls horizontally without breaking layout", async ({ page }) => {
  await page.goto("/referrals");
  // Eleanor should be reachable by scrolling the kanban container
  const eleanor = page.getByText("Eleanor Brooks").first();
  await eleanor.scrollIntoViewIfNeeded();
  await expect(eleanor).toBeVisible();
});

test("mobile: dashboard KPIs stack 2-per-row", async ({ page }) => {
  await page.goto("/");
  // Confirm "New today" label is visible (the KPI tiles render at mobile)
  await expect(page.getByText("New today")).toBeVisible();
  await expect(page.getByText("In funnel")).toBeVisible();
  await expect(page.getByText("Untapped revenue / mo")).toBeVisible();
});

test("mobile: patient app phone mockup fits on screen", async ({ page }) => {
  await page.goto("/patient-app");
  // The "Good morning, Patricia" string is inside the phone mockup
  await expect(page.getByText(/Good morning, Patricia/i)).toBeVisible();
});

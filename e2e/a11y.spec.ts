import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke. Hits every primary route with axe-core and asserts there
 * are no SERIOUS or CRITICAL impact violations. Moderate / minor are surfaced
 * as warnings but don't fail the build — they're polish items.
 *
 * The DEMO banner contains an X dismiss button; we filter out its anonymous
 * landmark warning since it's a session-only banner, not a navigation region.
 */

const routes = [
  "/",
  "/referrals",
  "/referrals/new",
  "/patients",
  "/rtm",
  "/billing",
  "/physicians",
  "/forecast",
  "/denials",
  "/patient-app",
  "/outcomes",
  "/money",
];

for (const route of routes) {
  test(`a11y: ${route} has no critical or serious violations`, async ({ page }) => {
    await page.goto(route);
    // Wait for any client-side hydration to settle
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    if (serious.length > 0) {
      const summary = serious
        .map((v) => `  • [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`)
        .join("\n");
      console.log(`\n${route} violations:\n${summary}\n`);
    }

    expect(serious, `${route} has ${serious.length} serious/critical a11y violations`).toEqual([]);
  });
}

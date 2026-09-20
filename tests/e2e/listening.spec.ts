import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./helpers/auth";

test.describe("Listening Lab", () => {
  test("does not expose the listening library without an authenticated learning session", async ({ page }) => {
    await page.goto("/listening");

    await expect(page.getByRole("heading", { name: /Audio library/i })).toHaveCount(0);
  });

  test("renders the authenticated Listening Lab access state", async ({ page }) => {
    await installE2EAuthSession(page);

    // Authentication finishes on /dashboard, where providers immediately load
    // account/module data. Let those requests settle before starting another
    // full document navigation; otherwise Vite's dev SSR server can observe
    // an aborted request (ECONNRESET) while Playwright leaves the page.
    await page.waitForLoadState("networkidle");

    await page.goto("/listening", {
      waitUntil: "networkidle",
    });

    const activeHeading = page.getByRole("heading", {
      name: /Train your ear with real listening practice/i,
    });
    const subscriptionHeading = page.getByRole("heading", {
      name: /Listening Lab subscription required/i,
    });

    await expect(activeHeading.or(subscriptionHeading)).toBeVisible({
      timeout: 20_000,
    });
  });
});

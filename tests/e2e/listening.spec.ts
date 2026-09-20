import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./helpers/auth";

test.describe("Listening Lab", () => {
  test("does not expose the listening library without an authenticated learning session", async ({ page }) => {
    await page.goto("/listening");

    await expect(page.getByRole("heading", { name: /Audio library/i })).toHaveCount(0);
  });

  test("renders the authenticated Listening Lab access state", async ({ page }) => {
    await installE2EAuthSession(page);

    // TanStack/Vite development pages can keep background/provider requests
    // active, so "networkidle" is not a reliable readiness signal here.
    // Give the authenticated dashboard a brief chance to settle, then navigate
    // on DOM readiness and assert the actual Listening Lab UI state.
    await page.waitForTimeout(750);

    await page.goto("/listening", {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
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

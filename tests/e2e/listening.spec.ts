import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./helpers/auth";

test.describe("Listening Lab", () => {
  test("does not expose the listening library without an authenticated learning session", async ({ page }) => {
    await page.goto("/listening");
    await expect(page.getByRole("heading", { name: /Audio library/i })).toHaveCount(0);
  });

  test("renders the authenticated Listening Lab access state", async ({ page }) => {
    await installE2EAuthSession(page);
    await page.goto("/listening");

    const activeHeading = page.getByRole("heading", { name: /Train your ear with real listening practice/i });
    const subscriptionHeading = page.getByRole("heading", { name: /Listening Lab subscription required/i });

    await expect(activeHeading.or(subscriptionHeading)).toBeVisible({ timeout: 20_000 });
  });
});

import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./helpers/auth";

test.describe("Listening Lab", () => {
  test("does not expose the listening library without an authenticated learning session", async ({ page }) => {
    await page.goto("/listening");

    await expect(page.getByRole("heading", { name: /Audio library/i })).toHaveCount(0);
  });

  test("renders the authenticated Listening Lab access state", async ({ page }) => {
    await installE2EAuthSession(page);

    // Keep the authenticated React providers alive. A second full document
    // navigation would recreate AuthProvider with session=null and start a new
    // current-account request; in Vite dev that request can be aborted with
    // ECONNRESET while the previous page is still settling.
    await page.evaluate(() => {
      window.history.pushState({}, "", "/listening");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page).toHaveURL(/\/listening(?:\/|$|\?)/, {
      timeout: 10_000,
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

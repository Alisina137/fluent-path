import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./helpers/auth";

test.describe("Listening Lab", () => {
  test("does not expose the listening library without an authenticated learning session", async ({ page }) => {
    await page.goto("/listening");

    await expect(page.getByRole("heading", { name: /Audio library/i })).toHaveCount(0);
  });

  test("renders the authenticated Listening Lab through the real module flow", async ({ page }) => {
    await installE2EAuthSession(page);

    await page.getByRole("link", { name: "Modules" }).click();
    await expect(page.getByRole("heading", { name: "Module marketplace" })).toBeVisible({
      timeout: 15_000,
    });

    const listeningHeading = page.getByRole("heading", {
      name: "Listening Lab",
      level: 3,
    });
    await expect(listeningHeading).toBeVisible();

    const listeningCard = listeningHeading.locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    const subscribe = listeningCard.getByRole("button", { name: "Subscribe" });
    const openModule = listeningCard.getByRole("button", { name: "Open module" });

    if (await subscribe.isVisible().catch(() => false)) {
      await subscribe.click();
      await expect(openModule).toBeVisible({
        timeout: 15_000,
      });
    }

    await openModule.click();

    await expect(page).toHaveURL(/\/listening(?:\/|$|\?)/, {
      timeout: 15_000,
    });

    await expect(
      page.getByRole("heading", {
        name: /Train your ear with real listening practice/i,
      }),
    ).toBeVisible({
      timeout: 20_000,
    });
  });
});

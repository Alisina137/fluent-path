import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./helpers/auth";

test.describe("Vocabulary Builder", () => {
  test("protects vocabulary data from unauthenticated users", async ({ page }) => {
    await page.goto("/vocabulary");
    await expect(page.getByRole("heading", { name: "Sign in to build your vocabulary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Word library" })).toHaveCount(0);
  });

  test("loads the authenticated vocabulary experience", async ({ page }) => {
    await installE2EAuthSession(page);
    await page.goto("/vocabulary");
    await expect(page.getByRole("heading", { name: /Turn new words into words you can use/i })).toBeVisible({\n      timeout: 20_000,\n    });
  });
});

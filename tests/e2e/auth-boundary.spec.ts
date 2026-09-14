import { expect, test } from "@playwright/test";

test("does not expose an authenticated speaking workspace from an empty browser session", async ({
  page,
}) => {
  await page.goto("/speaking");

  const composer = page.getByLabel("Your English message");

  await expect(composer).toHaveCount(0);
});

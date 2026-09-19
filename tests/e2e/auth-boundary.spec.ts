import { expect, test } from "@playwright/test";

test("does not expose an authenticated speaking workspace from an empty browser session", async ({
  page,
}) => {
  await page.goto("/speaking");

  const composer = page.getByLabel("Your English message");

  await expect(composer).toHaveCount(0);
});

test("does not expose an authenticated writing workspace from an empty browser session", async ({
  page,
}) => {
  await page.goto("/writing");
  const editor = page.getByRole("textbox", {
    name: "Your English writing",
    exact: true,
  });

  await expect(editor).toHaveCount(0);
});

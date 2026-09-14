import { expect, test } from "@playwright/test";

import { installE2EAuthSession } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await installE2EAuthSession(page);

  await page.goto("/speaking");
});

test.describe("AI Speaking Coach", () => {
  test("loads the authenticated speaking experience", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Speaking Progress",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Speaking Practice",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("region", {
        name: "Speaking conversation",
      }),
    ).toBeVisible();

    await expect(page.getByLabel("Your English message")).toBeVisible();
  });

  test("supports the message composer without making a paid AI request", async ({ page }) => {
    const message = page.getByLabel("Your English message");

    const sendButton = page.getByRole("button", {
      name: "Send message",
    });

    await expect(message).toBeEnabled();

    await expect(sendButton).toBeDisabled();

    await message.fill("I would like to practice speaking English today.");

    await expect(message).toHaveValue("I would like to practice speaking English today.");

    await expect(page.getByText("48/10000 characters")).toBeVisible();

    await expect(sendButton).toBeEnabled();

    await message.fill("");

    await expect(sendButton).toBeDisabled();
  });

  test("exposes voice recording controls", async ({ page }) => {
    await expect(page.getByText("Microphone access is ready for voice practice.")).toBeVisible({
      timeout: 10_000,
    });

    const startRecording = page.getByRole("button", {
      name: /start voice recording/i,
    });

    await expect(startRecording).toBeVisible();

    await expect(startRecording).toBeEnabled();
  });

  test("supports keyboard navigation into the message composer", async ({ page }) => {
    const message = page.getByLabel("Your English message");

    await message.focus();

    await expect(message).toBeFocused();

    await page.keyboard.type("Keyboard speaking practice");

    await expect(message).toHaveValue("Keyboard speaking practice");

    await page.keyboard.press("Tab");

    await expect(
      page.getByRole("button", {
        name: "Send message",
      }),
    ).toBeFocused();
  });

  test("starts and stops browser audio recording with a fake microphone", async ({ page }) => {
    const startRecording = page.getByRole("button", {
      name: /start voice recording/i,
    });

    await expect(startRecording).toBeEnabled();

    await startRecording.click();

    const stopRecording = page.getByRole("button", {
      name: "Stop voice recording",
    });

    await expect(stopRecording).toBeVisible();

    await page.waitForTimeout(1_200);

    await stopRecording.click();

    await expect(
      page.getByRole("button", {
        name: /clear the current voice recording/i,
      }),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test("does not automatically invoke paid feedback or AI actions", async ({ page }) => {
    await expect(page.getByText("AI Coach is thinking...")).toHaveCount(0);

    await expect(page.getByText("Analyzing your English...")).toHaveCount(0);

    await expect(page.getByText("Transcribing...")).toHaveCount(0);
  });
});

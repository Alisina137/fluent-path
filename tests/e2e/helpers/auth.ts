import { expect, type Page } from "@playwright/test";

function getRequiredE2ECredentials() {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD?.trim();

  if (!email) {
    throw new Error(
      "E2E_USER_EMAIL is required. Add the email of your dedicated E2E user to .env.local.",
    );
  }

  if (!password) {
    throw new Error(
      "E2E_USER_PASSWORD is required. Add the password of your dedicated E2E user to .env.local.",
    );
  }

  return { email, password };
}

async function hasAuthCookie(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();

  return cookies.some(
    (cookie) =>
      cookie.name === "fluent_path_session" &&
      cookie.httpOnly &&
      cookie.value.length > 0,
  );
}

export async function installE2EAuthSession(page: Page): Promise<void> {
  const { email, password } = getRequiredE2ECredentials();

  await page.goto("/login", {
    waitUntil: "domcontentloaded",
  });

  const emailInput = page.getByLabel("Email");
  const passwordInput = page.getByLabel("Password");
  const signInButton = page.getByRole("button", { name: "Sign in" });
  const loginError = page.getByRole("alert");

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(signInButton).toBeEnabled();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await signInButton.click();

  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (await hasAuthCookie(page)) {
      await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/, {
        timeout: 20_000,
      });
      return;
    }

    if (await loginError.isVisible().catch(() => false)) {
      const message = (await loginError.textContent())?.trim() || "Unknown login error.";

      throw new Error(
        `E2E sign-in was rejected by the application. UI message: "${message}". Verify E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local and confirm that account can sign in manually.`,
      );
    }

    await page.waitForTimeout(250);
  }

  const url = page.url();
  const buttonText = (await signInButton.textContent().catch(() => null))?.trim() ?? "unavailable";
  const visibleError = await loginError.isVisible().catch(() => false);
  const errorText = visibleError
    ? (await loginError.textContent())?.trim() || "Unknown login error."
    : "none";

  throw new Error(
    [
      "E2E sign-in did not establish an authenticated session within 20 seconds.",
      `Current URL: ${url}`,
      `Session cookie present: ${await hasAuthCookie(page)}`,
      `Sign-in button text: ${buttonText}`,
      `Visible login error: ${errorText}`,
      "This failure occurs before Listening Lab starts.",
    ].join("\n"),
  );
}

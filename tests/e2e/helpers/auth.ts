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

  const result = await Promise.race([
    expect
      .poll(
        async () => {
          const cookies = await page.context().cookies();
          return cookies.some(
            (cookie) =>
              cookie.name === "fluent_path_session" &&
              cookie.httpOnly &&
              cookie.value.length > 0,
          );
        },
        {
          timeout: 20_000,
          intervals: [200, 500, 1_000],
        },
      )
      .toBe(true)
      .then(() => "authenticated" as const),
    loginError
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "login-error" as const)
      .catch(() => new Promise<never>(() => {})),
  ]);

  if (result === "login-error") {
    const message = (await loginError.textContent())?.trim() || "Unknown login error.";
    throw new Error(
      `E2E sign-in failed before the test could start. UI message: "${message}". Verify E2E_USER_EMAIL/E2E_USER_PASSWORD in .env.local and that the dedicated E2E account exists.`,
    );
  }

  await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/, {
    timeout: 20_000,
  });
}

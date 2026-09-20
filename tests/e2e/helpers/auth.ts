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

  return {
    email,
    password,
  };
}

export async function installE2EAuthSession(page: Page): Promise<void> {
  const { email, password } = getRequiredE2ECredentials();

  await page.goto("/login", {
    waitUntil: "domcontentloaded",
  });

  const emailInput = page.getByLabel("Email");
  const passwordInput = page.getByLabel("Password");
  const signInButton = page.getByRole("button", {
    name: "Sign in",
  });

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(signInButton).toBeEnabled();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  await signInButton.click();

  // Do not depend on TanStack Start's internal server-function URL or
  // transport shape. Successful authentication is proven by the durable
  // HttpOnly session cookie and the app's post-login dashboard navigation.
  await expect
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
        message: "Expected authenticated session cookie to be created",
      },
    )
    .toBe(true);

  await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/, {
    timeout: 20_000,
  });
}

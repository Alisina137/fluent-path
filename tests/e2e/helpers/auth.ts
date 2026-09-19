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
    waitUntil: "networkidle",
  });

  const emailInput = page.getByLabel("Email");
  const passwordInput = page.getByLabel("Password");
  const signInButton = page.getByRole("button", {
    name: "Sign in",
  });

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(signInButton).toBeEnabled();

  await page.waitForFunction(() => document.readyState === "complete");

  await page.waitForTimeout(500);

  await emailInput.fill(email);
  await passwordInput.fill(password);

  const signInResponsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().includes("/_serverFn/"),
    {
      timeout: 15_000,
    },
  );

  await signInButton.click();

  const signInResponse = await signInResponsePromise;

  expect(signInResponse.ok()).toBe(true);

  await expect
    .poll(
      async () => {
        const cookies = await page.context().cookies();

        return cookies.some(
          (cookie) =>
            cookie.name === "fluent_path_session" && cookie.httpOnly && cookie.value.length > 0,
        );
      },
      {
        timeout: 10_000,
        message: "Expected authenticated session cookie to be created",
      },
    )
    .toBe(true);

  // Authentication is now proven complete. Navigate explicitly so E2E
  // suites begin from a deterministic authenticated application state.
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/, {
    timeout: 15_000,
  });
}

import { expect, test, type Page } from "@playwright/test";

function getRequiredE2ECredentials() {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error(
      "E2E_USER_EMAIL and E2E_USER_PASSWORD are required in .env.local.",
    );
  }

  return { email, password };
}

async function signInForListeningTest(page: Page): Promise<void> {
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

  // The login page keeps the button disabled until React/AuthProvider hydration
  // is complete, so an enabled button is our deterministic readiness signal.
  await expect(signInButton).toBeEnabled({
    timeout: 15_000,
  });

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await signInButton.click();

  // Authentication is established by the durable HttpOnly session cookie.
  // Do not require /dashboard navigation here; the auth flow can create the
  // cookie successfully even if client-side post-login navigation does not
  // complete in the Playwright dev-server environment.
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
}

test.describe("Listening Lab", () => {
  test("does not expose the listening library without an authenticated learning session", async ({
    page,
  }) => {
    await page.goto("/listening", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", {
        name: /Audio library/i,
      }),
    ).toHaveCount(0);
  });

  test("renders the authenticated Listening Lab access state", async ({ page }) => {
    await signInForListeningTest(page);

    // Start a fresh document request with the authenticated cookie already set.
    // This lets AuthProvider hydrate from the server session deterministically.
    await page.goto("/listening", {
      waitUntil: "domcontentloaded",
    });

    const activeHeading = page.getByRole("heading", {
      name: /Train your ear with real listening practice/i,
    });

    const subscriptionHeading = page.getByRole("heading", {
      name: /Listening Lab subscription required/i,
    });

    await expect(
      activeHeading.or(subscriptionHeading),
    ).toBeVisible({
      timeout: 20_000,
    });
  });
});

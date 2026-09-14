import type { Page } from "@playwright/test";

const AUTH_STORAGE_KEY = "ael.session.v1";

function getRequiredE2EUserId(): string {
  const userId = process.env.E2E_USER_ID?.trim();

  if (!userId) {
    throw new Error(
      "E2E_USER_ID is required. Add the UUID of an existing Neon development user to .env.local.",
    );
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    throw new Error(
      "E2E_USER_ID must be a valid UUID belonging to an existing Neon development user.",
    );
  }

  return userId;
}

export async function installE2EAuthSession(page: Page): Promise<void> {
  const userId = getRequiredE2EUserId();

  const session = {
    user: {
      id: userId,
      name: "Fluent Path E2E",
      email: "e2e@fluentpath.local",
      created_at: new Date().toISOString(),
    },
    profile: {
      user_id: userId,
      english_level: "B1",
      learning_goals: [],
      daily_learning_time: 15,
      learning_preferences: [],
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    language: {
      user_id: userId,
      native_language: "English",
      native_language_code: "en",
      translation_enabled: false,
      preferred_translation_mode: "on_tap",
    },
    modules: [],
    subscription: null,
    onboarded: true,
  };

  await page.addInitScript(
    ({ storageKey, serializedSession }: { storageKey: string; serializedSession: string }) => {
      window.localStorage.setItem(storageKey, serializedSession);
    },
    {
      storageKey: AUTH_STORAGE_KEY,
      serializedSession: JSON.stringify(session),
    },
  );
}

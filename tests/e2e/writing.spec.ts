import { expect, test, type Page } from "@playwright/test";

import { installE2EAuthSession } from "./helpers/auth";

const WRITING_TEST_DRAFT =
  "This is an automated Fluent Path writing test. I am practicing English writing and checking that my draft is saved correctly.";

test.describe.configure({
  mode: "serial",
});

test.setTimeout(60_000);

function getWritingEditor(page: Page) {
  return page.getByRole("textbox", {
    name: "Your English writing",
  });
}

function getPracticeCefrGroup(page: Page) {
  return page.getByRole("group", {
    name: "CEFR level",
    exact: true,
  });
}

async function waitForWritingHome(page: Page): Promise<void> {
  await expect(
    page.getByRole("heading", {
      name: /improve your english writing through practice/i,
      level: 1,
    }),
  ).toBeVisible({
    timeout: 30_000,
  });

  await expect(
    page.getByRole("button", {
      name: "Practice",
      exact: true,
    }),
  ).toBeVisible({
    timeout: 30_000,
  });
}

async function waitForPracticeLibrary(page: Page): Promise<void> {
  await expect(
    page.getByRole("heading", {
      name: "Practice Library",
      exact: true,
    }),
  ).toBeVisible({
    timeout: 30_000,
  });

  /*
   * Do not use:
   *
   *   expect("Loading practice exercises...").toHaveCount(0)
   *
   * as the readiness condition.
   *
   * isLoadingLibrary initially starts false and is changed by useEffect,
   * so absence of the loading UI can succeed before loading has even begun.
   *
   * A visible task is the deterministic signal that the real library has
   * finished loading and rendering.
   */
  await expect(
    page
      .getByRole("button", {
        name: "View task",
        exact: true,
      })
      .first(),
  ).toBeVisible({
    timeout: 30_000,
  });
}

async function startFreeWritingSession(page: Page): Promise<void> {
  const startButton = page.getByRole("button", {
    name: "Start writing",
    exact: true,
  });

  await expect(startButton).toBeVisible({
    timeout: 30_000,
  });

  await expect(startButton).toBeEnabled({
    timeout: 30_000,
  });

  await startButton.click();

  await expect(
    page.getByRole("heading", {
      name: "Your writing",
      exact: true,
    }),
  ).toBeVisible({
    timeout: 30_000,
  });

  await expect(getWritingEditor(page)).toBeVisible({
    timeout: 30_000,
  });

  await expect(getWritingEditor(page)).toBeEditable();
}

async function abandonActiveSession(page: Page): Promise<void> {
  const abandonButton = page.getByRole("button", {
    name: "Abandon",
    exact: true,
  });

  if (!(await abandonButton.isVisible().catch(() => false))) {
    return;
  }

  await expect(abandonButton).toBeEnabled({
    timeout: 30_000,
  });

  await abandonButton.click();

  await expect(
    page.getByText("Writing abandoned", {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 30_000,
  });
}

test.beforeEach(async ({ page }) => {
  await installE2EAuthSession(page);

  await page.goto("/writing", {
    waitUntil: "domcontentloaded",
  });

  await waitForWritingHome(page);
});

test.describe("AI Writing Coach", () => {
  test("loads the authenticated writing experience", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: /improve your english writing through practice/i,
        level: 1,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Practice",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Progress",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("loads the writing practice library without starting a paid AI request", async ({
    page,
  }) => {
    await waitForPracticeLibrary(page);

    await expect(page.getByText(/evaluating\.\.\./i)).toHaveCount(0);
    await expect(page.getByText(/generating\.\.\./i)).toHaveCount(0);
    await expect(page.getByText(/ai feedback is being generated/i)).toHaveCount(0);
  });

  test("supports switching between practice and progress", async ({ page }) => {
    const progressButton = page.getByRole("button", {
      name: "Progress",
      exact: true,
    });

    await progressButton.click();

    await expect(
      page.getByRole("heading", {
        name: "Writing Progress",
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    const practiceButton = page.getByRole("button", {
      name: "Practice",
      exact: true,
    });

    await practiceButton.click();

    await expect(practiceButton).toHaveAttribute("aria-pressed", "true");

    await expect(
      page.getByRole("heading", {
        name: "Practice Library",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("supports keyboard navigation between primary writing views", async ({ page }) => {
    const practiceButton = page.getByRole("button", {
      name: "Practice",
      exact: true,
    });

    const progressButton = page.getByRole("button", {
      name: "Progress",
      exact: true,
    });

    await practiceButton.focus();
    await expect(practiceButton).toBeFocused();

    await page.keyboard.press("Tab");

    await expect(progressButton).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", {
        name: "Writing Progress",
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });
  });

  test("shows no more than ten practice exercises on one page", async ({ page }) => {
    await waitForPracticeLibrary(page);

    const taskButtons = page.getByRole("button", {
      name: "View task",
      exact: true,
    });

    const count = await taskButtons.count();

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);

    await expect(page.getByText(/showing 1-\d+ of \d+ exercises/i)).toBeVisible();
  });

  test("supports practice library next and previous pagination", async ({ page }) => {
    await waitForPracticeLibrary(page);

    let pagination = page.getByRole("navigation", {
      name: "Practice exercise pagination",
      exact: true,
    });

    await expect(pagination).toBeVisible({
      timeout: 30_000,
    });

    let previousButton = pagination.getByRole("button", {
      name: "Previous",
      exact: true,
    });

    const nextButton = pagination.getByRole("button", {
      name: "Next",
      exact: true,
    });

    await expect(previousButton).toBeDisabled();
    await expect(pagination.getByText(/page 1 of \d+/i)).toBeVisible();

    await nextButton.click();

    // Server-side pagination performs a fresh library request.
    await waitForPracticeLibrary(page);

    pagination = page.getByRole("navigation", {
      name: "Practice exercise pagination",
      exact: true,
    });

    previousButton = pagination.getByRole("button", {
      name: "Previous",
      exact: true,
    });

    await expect(pagination.getByText(/page 2 of \d+/i)).toBeVisible({
      timeout: 30_000,
    });

    await expect(previousButton).toBeEnabled();

    await previousButton.click();

    await waitForPracticeLibrary(page);

    pagination = page.getByRole("navigation", {
      name: "Practice exercise pagination",
      exact: true,
    });

    await expect(pagination.getByText(/page 1 of \d+/i)).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      pagination.getByRole("button", {
        name: "Previous",
        exact: true,
      }),
    ).toBeDisabled();
  });

  test("resets pagination when a CEFR filter changes", async ({ page }) => {
    await waitForPracticeLibrary(page);

    let pagination = page.getByRole("navigation", {
      name: "Practice exercise pagination",
      exact: true,
    });

    await expect(pagination).toBeVisible({
      timeout: 30_000,
    });

    await expect(pagination.getByText(/page 1 of \d+/i)).toBeVisible();

    await pagination
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .click();

    // Pagination is server-side, so wait for the refreshed library.
    await waitForPracticeLibrary(page);

    pagination = page.getByRole("navigation", {
      name: "Practice exercise pagination",
      exact: true,
    });

    await expect(pagination.getByText(/page 2 of \d+/i)).toBeVisible({
      timeout: 30_000,
    });

    const cefrGroup = getPracticeCefrGroup(page);

    await cefrGroup
      .getByRole("button", {
        name: /A1 · Beginner/i,
      })
      .click();

    // Changing CEFR resets page to 1 and triggers another server request.
    await waitForPracticeLibrary(page);

    pagination = page.getByRole("navigation", {
      name: "Practice exercise pagination",
      exact: true,
    });

    await expect(pagination.getByText(/page 1 of \d+/i)).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      pagination.getByRole("button", {
        name: "Previous",
        exact: true,
      }),
    ).toBeDisabled();

    await expect(
      cefrGroup.getByRole("button", {
        name: /A1 · Beginner/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("CEFR selection constrains the visible practice exercises", async ({ page }) => {
    await waitForPracticeLibrary(page);

    const cefrGroup = getPracticeCefrGroup(page);

    const a1Button = cefrGroup.getByRole("button", {
      name: "A1 Â· Beginner",
      exact: true,
    });

    await a1Button.click();

    await expect(a1Button).toHaveAttribute("aria-pressed", "true");

    // CEFR filtering is server-side, so wait for the filtered
    // practice exercises to finish loading.
    await waitForPracticeLibrary(page);

    const visibleA1Badges = page.getByText("CEFR A1", {
      exact: true,
    });

    await expect(visibleA1Badges.first()).toBeVisible({
      timeout: 30_000,
    });

    expect(await visibleA1Badges.count()).toBeGreaterThan(0);

    await expect(
      page.getByText("CEFR C2", {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("category filtering resets the writing type selection", async ({ page }) => {
    await waitForPracticeLibrary(page);

    const categoryGroup = page.getByRole("group", {
      name: "Category",
      exact: true,
    });

    const categoryButtons = categoryGroup.locator('button[aria-pressed="false"]');

    expect(await categoryButtons.count()).toBeGreaterThan(0);

    await categoryButtons.first().click();

    const writingTypeGroup = page.getByRole("group", {
      name: "Writing type",
      exact: true,
    });

    await expect(
      writingTypeGroup.getByRole("button", {
        name: "All types",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("clear filters restores the unfiltered practice library", async ({ page }) => {
    await waitForPracticeLibrary(page);

    const cefrGroup = getPracticeCefrGroup(page);

    const a1Button = cefrGroup.getByRole("button", {
      name: "A1 · Beginner",
      exact: true,
    });

    await a1Button.click();

    const clearFiltersButton = page.getByRole("button", {
      name: "Clear filters",
      exact: true,
    });

    await expect(clearFiltersButton).toBeVisible();

    await clearFiltersButton.click();

    await expect(
      cefrGroup.getByRole("button", {
        name: "All levels",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(clearFiltersButton).toHaveCount(0);
  });

  test("opens a practice task and can return to the library", async ({ page }) => {
    await waitForPracticeLibrary(page);

    await page
      .getByRole("button", {
        name: "View task",
        exact: true,
      })
      .first()
      .click();

    const backButton = page.getByRole("button", {
      name: /back/i,
    });

    await expect(backButton).toBeVisible({
      timeout: 30_000,
    });

    await backButton.click();

    await waitForPracticeLibrary(page);
  });

  test("starts a free-writing session without triggering paid AI", async ({ page }) => {
    await startFreeWritingSession(page);

    const editor = getWritingEditor(page);

    await expect(editor).toBeEditable();

    await expect(
      page.getByRole("button", {
        name: "Get AI feedback",
        exact: true,
      }),
    ).toBeDisabled();

    await expect(page.getByText(/evaluating\.\.\./i)).toHaveCount(0);

    await abandonActiveSession(page);
  });

  test("updates writing statistics while typing", async ({ page }) => {
    await startFreeWritingSession(page);

    const editor = getWritingEditor(page);

    await editor.fill("One two three four five.");

    const statistics = page.getByLabel("Writing statistics", {
      exact: true,
    });

    await expect(statistics).toContainText("5");
    await expect(statistics).toContainText("words");

    await abandonActiveSession(page);
  });

  test("supports manually saving a writing draft", async ({ page }) => {
    await startFreeWritingSession(page);

    const editor = getWritingEditor(page);

    await editor.fill(WRITING_TEST_DRAFT);

    const saveButton = page.getByRole("button", {
      name: "Save now",
      exact: true,
    });

    await expect(saveButton).toBeEnabled({
      timeout: 30_000,
    });

    await saveButton.click();

    await expect(
      page.getByText("Saved", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await abandonActiveSession(page);
  });

  test("autosaves and restores the draft after a page refresh", async ({ page }) => {
    await startFreeWritingSession(page);

    const editor = getWritingEditor(page);

    await editor.fill(WRITING_TEST_DRAFT);

    await expect(
      page.getByText("Saved", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText(/restoring your draft/i)).toHaveCount(0, {
      timeout: 30_000,
    });

    const restoredEditor = getWritingEditor(page);

    await expect(restoredEditor).toBeVisible({
      timeout: 30_000,
    });

    await expect(restoredEditor).toHaveValue(WRITING_TEST_DRAFT);

    await abandonActiveSession(page);
  });

  test("enables AI feedback only after the draft contains writing", async ({ page }) => {
    await startFreeWritingSession(page);

    const feedbackButton = page.getByRole("button", {
      name: "Get AI feedback",
      exact: true,
    });

    await expect(feedbackButton).toBeDisabled();

    await getWritingEditor(page).fill("A short test draft.");

    await expect(feedbackButton).toBeEnabled();

    // Intentionally do not click this button.
    // The automated E2E suite must not consume paid AI.
    await abandonActiveSession(page);
  });

  test("completes a writing session after saving the latest draft", async ({ page }) => {
    await startFreeWritingSession(page);

    const editor = getWritingEditor(page);

    await editor.fill(WRITING_TEST_DRAFT);

    const completeButton = page.getByRole("button", {
      name: "Complete",
      exact: true,
    });

    await expect(completeButton).toBeEnabled();

    await completeButton.click();

    await expect(
      page.getByText("Writing completed", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(editor).toHaveAttribute("aria-readonly", "true");

    await expect(
      page.getByRole("button", {
        name: "Start another",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("abandons a writing session while preserving the saved draft", async ({ page }) => {
    await startFreeWritingSession(page);

    const editor = getWritingEditor(page);

    await editor.fill(WRITING_TEST_DRAFT);

    await page
      .getByRole("button", {
        name: "Abandon",
        exact: true,
      })
      .click();

    await expect(
      page.getByText("Writing abandoned", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(editor).toHaveValue(WRITING_TEST_DRAFT);
    await expect(editor).toHaveAttribute("aria-readonly", "true");
  });

  test("returns to practice after closing a writing session", async ({ page }) => {
    await startFreeWritingSession(page);

    await getWritingEditor(page).fill("Lifecycle test.");

    await page
      .getByRole("button", {
        name: "Abandon",
        exact: true,
      })
      .click();

    await expect(
      page.getByText("Writing abandoned", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await page
      .getByRole("button", {
        name: "Start another",
        exact: true,
      })
      .click();

    await waitForPracticeLibrary(page);
  });

  test("authenticated session survives a browser page refresh", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: /improve your english writing through practice/i,
        level: 1,
      }),
    ).toBeVisible();

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    await waitForWritingHome(page);

    await expect(page).toHaveURL(/\/writing/);
  });

  test("does not expose paid writing AI activity during normal draft lifecycle", async ({
    page,
  }) => {
    await startFreeWritingSession(page);

    await getWritingEditor(page).fill(WRITING_TEST_DRAFT);

    const saveButton = page.getByRole("button", {
      name: "Save now",
      exact: true,
    });

    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(
      page.getByText("Saved", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByText(/evaluating\.\.\./i)).toHaveCount(0);
    await expect(page.getByText(/generating\.\.\./i)).toHaveCount(0);
    await expect(page.getByText(/ai feedback is being generated/i)).toHaveCount(0);

    await abandonActiveSession(page);
  });

  test("progress view handles the authenticated user's current state", async ({ page }) => {
    const progressButton = page.getByRole("button", {
      name: "Progress",
      exact: true,
    });

    await expect(progressButton).toBeVisible({
      timeout: 30_000,
    });

    await progressButton.click();

    await expect(page.getByText(/loading your writing progress/i)).toHaveCount(0, {
      timeout: 30_000,
    });

    const progressHeading = page.getByRole("heading", {
      name: "Writing Progress",
      exact: true,
    });

    const emptyState = page.getByText(/your progress starts with your first evaluation/i);

    const unavailableState = page.getByText(/progress unavailable/i);

    await expect(progressHeading.or(emptyState).or(unavailableState).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

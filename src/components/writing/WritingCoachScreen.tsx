import { useEffect, useState } from "react";
import {
  BookOpen,
  BookOpenCheck,
  Clock3,
  FileText,
  Filter,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";

import { WritingEditor } from "@/components/writing/WritingEditor";
import { WritingPracticeTaskDetails } from "@/components/writing/WritingPracticeTaskDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";
import { getWritingPracticeLibraryServerFn } from "@/lib/writing/practice-library-functions";
import {
  abandonWritingSessionServerFn,
  completeWritingSessionServerFn,
  startWritingSessionServerFn,
} from "@/lib/writing/session-functions";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type CefrLevel = (typeof CEFR_LEVELS)[number];

interface WritingTaskSnapshot {
  source: "task" | "custom";
  title: string | null;
  prompt: string | null;
  category: string | null;
  writingType: string;
  cefrLevel: string;
  minWords: number | null;
  maxWords: number | null;
  audience: string | null;
  purpose: string | null;
  tone: string | null;
}

interface ActiveWritingSession {
  id: string;
  status: "active" | "completed" | "abandoned";
  title: string | null;
  writingType: string;
  targetCefrLevel: string;
  taskSnapshot: WritingTaskSnapshot;
}

type PracticeLibraryResult = Awaited<ReturnType<typeof getWritingPracticeLibraryServerFn>>;

type PracticeTask = PracticeLibraryResult["tasks"][number];

interface PracticeFilters {
  cefrLevel: CefrLevel | null;
  category: string | null;
  writingType: string | null;
}

const EMPTY_FILTERS: PracticeFilters = {
  cefrLevel: null,
  category: null,
  writingType: null,
};

function formatWritingType(value: string): string {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCefrDescription(level: CefrLevel): string {
  switch (level) {
    case "A1":
      return "Beginner";
    case "A2":
      return "Elementary";
    case "B1":
      return "Intermediate";
    case "B2":
      return "Upper intermediate";
    case "C1":
      return "Advanced";
    case "C2":
      return "Proficient";
  }
}

function getWordGoal(task: PracticeTask): string | null {
  if (task.minWords !== null && task.maxWords !== null) {
    return `${task.minWords}-${task.maxWords} words`;
  }

  if (task.minWords !== null) {
    return `${task.minWords}+ words`;
  }

  if (task.maxWords !== null) {
    return `Up to ${task.maxWords} words`;
  }

  return null;
}

function hasActiveFilters(filters: PracticeFilters): boolean {
  return Boolean(filters.cefrLevel || filters.category || filters.writingType);
}

export function WritingCoachScreen() {
  const { session: authSession } = useAuth();
  const user = authSession?.user ?? null;

  const [selectedCefrLevel, setSelectedCefrLevel] = useState<CefrLevel>("A1");

  const [session, setSession] = useState<ActiveWritingSession | null>(null);

  const [practiceLibrary, setPracticeLibrary] = useState<PracticeLibraryResult | null>(null);

  const [selectedPracticeTask, setSelectedPracticeTask] = useState<PracticeTask | null>(null);

  const [practiceFilters, setPracticeFilters] = useState<PracticeFilters>(EMPTY_FILTERS);

  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || session) {
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function loadPracticeLibrary() {
      setIsLoadingLibrary(true);
      setLibraryError(null);

      try {
        const result = await getWritingPracticeLibraryServerFn({
          data: {
            userId,
            cefrLevel: practiceFilters.cefrLevel ?? undefined,
            category: practiceFilters.category ?? undefined,
            writingType: practiceFilters.writingType ?? undefined,
          },
        });

        if (!cancelled) {
          setPracticeLibrary(result);
        }
      } catch {
        if (!cancelled) {
          setLibraryError(
            "The practice library could not be loaded right now. You can still use free writing.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLibrary(false);
        }
      }
    }

    void loadPracticeLibrary();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    session,
    practiceFilters.cefrLevel,
    practiceFilters.category,
    practiceFilters.writingType,
  ]);

  async function handleStartFreeWriting() {
    if (!user) {
      setOperationError("You must be signed in to start writing.");
      return;
    }

    setIsStarting(true);
    setOperationError(null);

    try {
      const created = await startWritingSessionServerFn({
        data: {
          userId: user.id,
          title: "Free Writing",
          writingType: "free-writing",
          targetCefrLevel: selectedCefrLevel,
        },
      });

      setSelectedPracticeTask(null);
      setSession(created);
    } catch {
      setOperationError("Your writing session could not be started. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleStartPracticeTask(taskId: string) {
    if (!user) {
      setOperationError("You must be signed in to start a practice task.");
      return;
    }

    setIsStarting(true);
    setOperationError(null);

    try {
      const created = await startWritingSessionServerFn({
        data: {
          userId: user.id,
          taskId,
        },
      });

      setSelectedPracticeTask(null);
      setSession(created);
    } catch {
      setOperationError("This practice task could not be started. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleCompleteSession() {
    if (!user || !session) {
      return;
    }

    setIsClosing(true);
    setOperationError(null);

    try {
      const updated = await completeWritingSessionServerFn({
        data: {
          userId: user.id,
          sessionId: session.id,
        },
      });

      setSession(updated);
    } catch {
      setOperationError("Your writing session could not be completed. Please try again.");
    } finally {
      setIsClosing(false);
    }
  }

  async function handleAbandonSession() {
    if (!user || !session) {
      return;
    }

    setIsClosing(true);
    setOperationError(null);

    try {
      const updated = await abandonWritingSessionServerFn({
        data: {
          userId: user.id,
          sessionId: session.id,
        },
      });

      setSession(updated);
    } catch {
      setOperationError("Your writing session could not be abandoned. Please try again.");
    } finally {
      setIsClosing(false);
    }
  }

  function updateCefrFilter(cefrLevel: CefrLevel | null) {
    setSelectedPracticeTask(null);

    setPracticeFilters((current) => ({
      ...current,
      cefrLevel,
    }));
  }

  function updateCategoryFilter(category: string | null) {
    setSelectedPracticeTask(null);

    setPracticeFilters((current) => ({
      ...current,
      category,
    }));
  }

  function updateWritingTypeFilter(writingType: string | null) {
    setSelectedPracticeTask(null);

    setPracticeFilters((current) => ({
      ...current,
      writingType,
    }));
  }

  function resetPracticeFilters() {
    setSelectedPracticeTask(null);
    setPracticeFilters(EMPTY_FILTERS);
  }

  const filtersAreActive = hasActiveFilters(practiceFilters);

  return (
    <main className="space-y-6" aria-labelledby="writing-coach-heading">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <PenLine className="size-5" aria-hidden="true" />

          <span className="text-sm font-medium">AI Writing Coach</span>
        </div>

        <h1
          id="writing-coach-heading"
          className="text-2xl font-semibold tracking-tight md:text-3xl"
        >
          Improve your English writing through practice
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Write in English, understand your mistakes, revise your work, and track how your writing
          improves over time.
        </p>
      </header>

      {operationError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {operationError}
        </div>
      ) : null}

      {session && user ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{session.title ?? "Writing session"}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  CEFR {session.targetCefrLevel}
                  {" · "}
                  {session.status === "active"
                    ? "In progress"
                    : session.status === "completed"
                      ? "Completed"
                      : "Abandoned"}
                </p>
              </div>

              {session.status !== "active" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSession(null);
                    setOperationError(null);
                  }}
                >
                  Start another
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <WritingEditor
            userId={user.id}
            sessionId={session.id}
            sessionStatus={session.status}
            title={session.title}
            writingType={session.writingType}
            targetCefrLevel={session.targetCefrLevel}
            taskSnapshot={session.taskSnapshot}
            isClosing={isClosing}
            onComplete={handleCompleteSession}
            onAbandon={handleAbandonSession}
          />
        </div>
      ) : selectedPracticeTask && user ? (
        <WritingPracticeTaskDetails
          task={selectedPracticeTask}
          isStarting={isStarting}
          onBack={() => {
            setSelectedPracticeTask(null);
            setOperationError(null);
          }}
          onStart={handleStartPracticeTask}
        />
      ) : (
        <>
          <section
            className="grid gap-4 md:grid-cols-3"
            aria-label="Writing Coach learning workflow"
          >
            <Card>
              <CardHeader>
                <PenLine className="size-5 text-primary" aria-hidden="true" />

                <CardTitle className="text-base">Write first</CardTitle>
              </CardHeader>

              <CardContent className="text-sm leading-6 text-muted-foreground">
                Create your own first draft before asking AI for help.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpenCheck className="size-5 text-primary" aria-hidden="true" />

                <CardTitle className="text-base">Understand feedback</CardTitle>
              </CardHeader>

              <CardContent className="text-sm leading-6 text-muted-foreground">
                Learn why something should change instead of receiving only a rewritten answer.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="size-5 text-primary" aria-hidden="true" />

                <CardTitle className="text-base">Revise and improve</CardTitle>
              </CardHeader>

              <CardContent className="text-sm leading-6 text-muted-foreground">
                Improve your own writing through revisions and measurable progress.
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5" aria-labelledby="practice-library-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" aria-hidden="true" />

                  <h2
                    id="practice-library-heading"
                    className="text-xl font-semibold tracking-tight"
                  >
                    Practice Library
                  </h2>
                </div>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Find a guided exercise by English level, category, or writing type.
                </p>
              </div>

              {practiceLibrary ? (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {practiceLibrary.tasks.length}{" "}
                  {practiceLibrary.tasks.length === 1 ? "exercise" : "exercises"}
                </p>
              ) : null}
            </div>

            {user && practiceLibrary ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="size-4" aria-hidden="true" />
                        Find the right exercise
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        CEFR represents the language difficulty of each exercise.
                      </p>
                    </div>

                    {filtersAreActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetPracticeFilters}
                      >
                        <RotateCcw aria-hidden="true" />
                        Clear filters
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <fieldset>
                    <legend className="text-sm font-medium">CEFR level</legend>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={practiceFilters.cefrLevel === null ? "default" : "outline"}
                        aria-pressed={practiceFilters.cefrLevel === null}
                        onClick={() => {
                          updateCefrFilter(null);
                        }}
                      >
                        All levels
                      </Button>

                      {practiceLibrary.facets.cefrLevels.map((level) => (
                        <Button
                          key={level}
                          type="button"
                          size="sm"
                          variant={practiceFilters.cefrLevel === level ? "default" : "outline"}
                          aria-pressed={practiceFilters.cefrLevel === level}
                          title={`${level} — ${getCefrDescription(level)}`}
                          onClick={() => {
                            updateCefrFilter(level);
                          }}
                        >
                          {level}
                          <span className="hidden sm:inline"> · {getCefrDescription(level)}</span>
                        </Button>
                      ))}
                    </div>
                  </fieldset>

                  {practiceLibrary.facets.categories.length > 0 ? (
                    <fieldset>
                      <legend className="text-sm font-medium">Category</legend>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={practiceFilters.category === null ? "default" : "outline"}
                          aria-pressed={practiceFilters.category === null}
                          onClick={() => {
                            updateCategoryFilter(null);
                          }}
                        >
                          All categories
                        </Button>

                        {practiceLibrary.facets.categories.map((category) => (
                          <Button
                            key={category}
                            type="button"
                            size="sm"
                            variant={practiceFilters.category === category ? "default" : "outline"}
                            aria-pressed={practiceFilters.category === category}
                            onClick={() => {
                              updateCategoryFilter(category);
                            }}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {practiceLibrary.facets.writingTypes.length > 0 ? (
                    <fieldset>
                      <legend className="text-sm font-medium">Writing type</legend>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={practiceFilters.writingType === null ? "default" : "outline"}
                          aria-pressed={practiceFilters.writingType === null}
                          onClick={() => {
                            updateWritingTypeFilter(null);
                          }}
                        >
                          All types
                        </Button>

                        {practiceLibrary.facets.writingTypes.map((writingType) => (
                          <Button
                            key={writingType}
                            type="button"
                            size="sm"
                            variant={
                              practiceFilters.writingType === writingType ? "default" : "outline"
                            }
                            aria-pressed={practiceFilters.writingType === writingType}
                            onClick={() => {
                              updateWritingTypeFilter(writingType);
                            }}
                          >
                            {formatWritingType(writingType)}
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {!user ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />

                  <p className="mt-3 font-medium">Sign in to browse practice exercises</p>

                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    Sign in to access guided Writing Coach exercises.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {user && isLoadingLibrary ? (
              <Card>
                <CardContent
                  className="flex min-h-40 items-center justify-center py-8"
                  role="status"
                  aria-live="polite"
                >
                  <div className="text-center">
                    <Loader2
                      className="mx-auto size-6 motion-safe:animate-spin text-primary"
                      aria-hidden="true"
                    />

                    <p className="mt-3 font-medium">Loading practice exercises...</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Applying your practice preferences.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {user && !isLoadingLibrary && libraryError ? (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                role="alert"
              >
                <p className="font-medium text-destructive">Practice library unavailable</p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">{libraryError}</p>
              </div>
            ) : null}

            {user &&
            !isLoadingLibrary &&
            !libraryError &&
            practiceLibrary &&
            practiceLibrary.tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />

                  <p className="mt-3 font-medium">
                    {filtersAreActive
                      ? "No exercises match these filters"
                      : "No practice exercises yet"}
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    {filtersAreActive
                      ? "Try another level, category, or writing type."
                      : "Guided exercises will appear here when they are available. You can continue practicing with free writing below."}
                  </p>

                  {filtersAreActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={resetPracticeFilters}
                    >
                      <RotateCcw aria-hidden="true" />
                      Clear filters
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {user &&
            !isLoadingLibrary &&
            !libraryError &&
            practiceLibrary &&
            practiceLibrary.tasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {practiceLibrary.tasks.map((task) => {
                  const wordGoal = getWordGoal(task);

                  return (
                    <Card key={task.id} className="flex h-full flex-col">
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">CEFR {task.cefrLevel}</Badge>

                          <Badge variant="outline">{task.category}</Badge>
                        </div>

                        <div>
                          <CardTitle className="text-lg leading-6">{task.title}</CardTitle>

                          <p className="mt-1 text-sm font-medium text-muted-foreground">
                            {formatWritingType(task.writingType)}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="flex flex-1 flex-col">
                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {task.description ?? task.prompt}
                        </p>

                        <dl className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          {wordGoal ? (
                            <div className="flex items-center gap-1.5">
                              <Target className="size-3.5" aria-hidden="true" />

                              <dt className="sr-only">Word goal</dt>

                              <dd>{wordGoal}</dd>
                            </div>
                          ) : null}

                          {task.estimatedMinutes !== null ? (
                            <div className="flex items-center gap-1.5">
                              <Clock3 className="size-3.5" aria-hidden="true" />

                              <dt className="sr-only">Estimated time</dt>

                              <dd>About {task.estimatedMinutes} min</dd>
                            </div>
                          ) : null}
                        </dl>

                        <Button
                          type="button"
                          variant="outline"
                          className="mt-5 w-full"
                          onClick={() => {
                            setSelectedPracticeTask(task);
                            setOperationError(null);
                          }}
                        >
                          <BookOpen aria-hidden="true" />
                          View task
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Start free writing</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">
                Prefer to choose your own topic? Select the English level you want to practice and
                start a free-writing session.
              </p>

              <fieldset>
                <legend className="text-sm font-medium">Target CEFR level</legend>

                <div className="mt-3 flex flex-wrap gap-2">
                  {CEFR_LEVELS.map((level) => (
                    <Button
                      key={level}
                      type="button"
                      size="sm"
                      variant={selectedCefrLevel === level ? "default" : "outline"}
                      aria-pressed={selectedCefrLevel === level}
                      onClick={() => {
                        setSelectedCefrLevel(level);
                      }}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </fieldset>

              <Button
                type="button"
                disabled={!user || isStarting}
                onClick={() => {
                  void handleStartFreeWriting();
                }}
              >
                {isStarting ? (
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <PenLine aria-hidden="true" />
                )}

                {isStarting ? "Starting..." : "Start writing"}
              </Button>

              {!user ? (
                <p className="text-sm text-muted-foreground">
                  Sign in to start a Writing Coach session.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

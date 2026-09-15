import { useState } from "react";
import { BookOpenCheck, Loader2, PenLine, Sparkles } from "lucide-react";

import { WritingEditor } from "@/components/writing/WritingEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";
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

export function WritingCoachScreen() {
  const { session: authSession } = useAuth();
  const user = authSession?.user ?? null;

  const [selectedCefrLevel, setSelectedCefrLevel] = useState<CefrLevel>("A1");
  const [session, setSession] = useState<ActiveWritingSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  async function handleStartWriting() {
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

      setSession(created);
    } catch {
      setOperationError("Your writing session could not be started. Please try again.");
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

          <Card>
            <CardHeader>
              <CardTitle>Start free writing</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Choose the English level you want to practice. Writing tasks and guided exercises
                  will be added later.
                </p>
              </div>

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
                  void handleStartWriting();
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

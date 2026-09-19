import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Sparkles,
  XCircle,
} from "lucide-react";
import { WritingVocabularySuggestions } from "@/components/writing/WritingVocabularySuggestions";
import { WritingToneGuidance } from "@/components/writing/WritingToneGuidance";
import {
  WritingFeedback,
  type WritingSuggestionApplyResult,
} from "@/components/writing/WritingFeedback";
import { WritingGrammarHelp } from "@/components/writing/WritingGrammarHelp";
import { WritingRevisionComparison } from "@/components/writing/WritingRevisionComparison";
import { WritingParaphraseAssistance } from "@/components/writing/WritingParaphraseAssistance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requestWritingFeedbackServerFn } from "@/lib/writing/evaluation-functions";
import { compareWritingRevisionsServerFn } from "@/lib/writing/revision-functions";
import { getWritingTextStatistics } from "@/lib/writing/text-statistics";
import { useWritingAutosave } from "@/lib/writing/use-writing-autosave";

type WritingAssistanceCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const writingAssistanceCefrLevels: readonly WritingAssistanceCefrLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];
const MAX_WRITING_EVALUATION_CHARACTERS = 20_000;

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

interface WritingEditorProps {
  sessionId: string;
  sessionStatus: "active" | "completed" | "abandoned";
  title: string | null;
  writingType: string;
  targetCefrLevel: string;
  taskSnapshot: WritingTaskSnapshot;
  onComplete: () => Promise<void>;
  onAbandon: () => Promise<void>;
  isClosing?: boolean;
}

function normalizeWritingCefrLevel(value: string): WritingAssistanceCefrLevel {
  const matchedLevel = writingAssistanceCefrLevels.find((level) => level === value);

  return matchedLevel ?? "B1";
}

export function WritingEditor({
  sessionId,
  sessionStatus,
  title,
  writingType,
  targetCefrLevel,
  taskSnapshot,
  onComplete,
  onAbandon,
  isClosing = false,
}: WritingEditorProps) {
  const { content, setContent, status, isLoading, error, lastSavedAt, saveNow } =
    useWritingAutosave({
      sessionId,
      sessionStatus,
    });

  const [isPreparingClose, setIsPreparingClose] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);

  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const [writingFeedback, setWritingFeedback] = useState<Awaited<
    ReturnType<typeof requestWritingFeedbackServerFn>
  > | null>(null);

  const [previousFeedback, setPreviousFeedback] = useState<typeof writingFeedback>(null);

  const [hasChangesSinceFeedback, setHasChangesSinceFeedback] = useState(false);

  const [revisionComparison, setRevisionComparison] = useState<Awaited<
    ReturnType<typeof compareWritingRevisionsServerFn>
  > | null>(null);

  const [revisionComparisonError, setRevisionComparisonError] = useState<string | null>(null);

  const [isComparing, setIsComparing] = useState(false);

  const [grammarHelpText, setGrammarHelpText] = useState<string | null>(null);

  const sessionClosed = sessionStatus !== "active";

  const interactionLocked = isClosing || isPreparingClose;

  const { wordCount: liveWordCount, characterCount: liveCharacterCount } =
    getWritingTextStatistics(content);

  const minimumWords = taskSnapshot.minWords;
  const maximumWords = taskSnapshot.maxWords;

  const hasWordGoal = minimumWords !== null || maximumWords !== null;

  const minimumReached = minimumWords === null || liveWordCount >= minimumWords;

  const maximumExceeded = maximumWords !== null && liveWordCount > maximumWords;

  const wordGoalProgress =
    minimumWords && minimumWords > 0 ? Math.min((liveWordCount / minimumWords) * 100, 100) : null;

  function handleGrammarSelection(event: React.SyntheticEvent<HTMLTextAreaElement>): void {
    if (sessionClosed || interactionLocked) {
      return;
    }

    const textarea = event.currentTarget;

    const selectedText = textarea.value
      .slice(textarea.selectionStart, textarea.selectionEnd)
      .trim();

    if (!selectedText) {
      return;
    }

    setGrammarHelpText(selectedText);
  }

  async function handleCloseSession(action: () => Promise<void>): Promise<void> {
    if (sessionClosed || interactionLocked) {
      return;
    }

    setIsPreparingClose(true);

    try {
      const saved = await saveNow();

      if (!saved) {
        return;
      }

      await action();
    } finally {
      setIsPreparingClose(false);
    }
  }

  async function handleCompareRevisions(): Promise<void> {
    if (!previousFeedback || !writingFeedback || isComparing) {
      return;
    }

    setIsComparing(true);
    setRevisionComparisonError(null);

    try {
      const result = await compareWritingRevisionsServerFn({
        data: {
          sessionId,
          beforeRevisionId: previousFeedback.revision.id,
          afterRevisionId: writingFeedback.revision.id,
        },
      });

      setRevisionComparison(result);
    } catch {
      setRevisionComparisonError(
        "The revisions could not be compared right now. Please try again.",
      );
    } finally {
      setIsComparing(false);
    }
  }

  async function handleRequestFeedback(): Promise<void> {
    if (sessionClosed || isEvaluating || isClosing) {
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const saved = await saveNow();

      if (!saved) {
        setEvaluationError(
          "Your latest changes could not be saved. Please save your writing before requesting feedback.",
        );

        return;
      }

      const result = await requestWritingFeedbackServerFn({
        data: {
          sessionId,
        },
      });

      const existingFeedback = writingFeedback;

      setWritingFeedback(result);
      setRevisionComparison(null);
      setRevisionComparisonError(null);

      if (existingFeedback && existingFeedback.revision.id !== result.revision.id) {
        setPreviousFeedback(existingFeedback);
      } else if (!existingFeedback) {
        setPreviousFeedback(null);
      }

      setHasChangesSinceFeedback(false);
    } catch {
      setEvaluationError("Your writing could not be evaluated right now. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  }

  function handleApplySuggestion(
    originalText: string,
    replacementText: string,
  ): WritingSuggestionApplyResult {
    if (sessionClosed) {
      return {
        applied: false,
        message: "This writing session is closed and can no longer be edited.",
      };
    }

    if (interactionLocked) {
      return {
        applied: false,
        message: "Your writing cannot be changed while the session is being updated.",
      };
    }

    const source = originalText.trim();
    const replacement = replacementText.trim();

    if (!source || !replacement) {
      return {
        applied: false,
        message: "This suggestion does not contain valid replacement text.",
      };
    }

    if (source === replacement) {
      return {
        applied: false,
        message: "The suggested text is the same as your current text.",
      };
    }

    const firstIndex = content.indexOf(originalText);

    if (firstIndex === -1) {
      return {
        applied: false,
        message:
          "This part of your writing has already changed. Review the latest draft before applying this suggestion.",
      };
    }

    const secondIndex = content.indexOf(originalText, firstIndex + originalText.length);

    if (secondIndex !== -1) {
      return {
        applied: false,
        message:
          "This exact text appears more than once in your draft, so Fluent Path cannot safely choose which occurrence to replace. Edit it manually instead.",
      };
    }

    const nextContent =
      content.slice(0, firstIndex) +
      replacementText +
      content.slice(firstIndex + originalText.length);

    if (nextContent.length > 100_000) {
      return {
        applied: false,
        message: "Applying this suggestion would make the draft too long.",
      };
    }

    setContent(nextContent);

    setEvaluationError(null);

    if (writingFeedback) {
      setHasChangesSinceFeedback(true);
    }

    return {
      applied: true,
      message:
        "Suggestion applied to your draft. Your updated writing will be saved automatically.",
    };
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-80 items-center justify-center rounded-xl border bg-card p-6"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <Loader2
            className="mx-auto size-6 motion-safe:animate-spin text-primary"
            aria-hidden="true"
          />

          <p className="mt-3 font-medium">Restoring your draft...</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Your latest saved writing is being loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
      aria-labelledby="writing-editor-heading"
    >
      <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="writing-editor-heading" className="font-medium">
            Your writing
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {sessionClosed
              ? "This writing session is closed and can no longer be edited."
              : "Write naturally. Your work is saved automatically."}
          </p>
        </div>

        <div
          className="flex min-h-8 items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status === "saving" ? (
            <>
              <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : null}

          {status === "unsaved" ? (
            <>
              <Clock3 className="size-4" aria-hidden="true" />
              Unsaved changes
            </>
          ) : null}

          {status === "saved" ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Saved
            </>
          ) : null}

          {status === "error" ? (
            <>
              <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
              <span className="text-destructive">Save failed</span>
            </>
          ) : null}
        </div>
      </header>

      {sessionClosed ? (
        <div className="border-b bg-muted/30 px-4 py-3" aria-live="polite">
          <div className="flex items-start gap-3">
            {sessionStatus === "completed" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <XCircle
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}

            <div>
              <p className="text-sm font-medium">
                {sessionStatus === "completed" ? "Writing completed" : "Writing abandoned"}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Your saved draft remains available for review.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-3" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>

            {!sessionClosed ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void saveNow();
                }}
              >
                <Save aria-hidden="true" />
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-b bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 wrap-break-word font-semibold">
                {taskSnapshot.title ?? title ?? "Free Writing"}
              </h3>

              <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                CEFR {targetCefrLevel}
              </span>

              <span className="rounded-full border bg-background px-2.5 py-1 text-xs capitalize text-muted-foreground">
                {writingType.replaceAll("-", " ")}
              </span>
            </div>

            {taskSnapshot.prompt ? (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap wrap-break-word text-sm leading-6">
                {taskSnapshot.prompt}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Write freely in English about a topic of your choice.
              </p>
            )}
          </div>

          {taskSnapshot.audience || taskSnapshot.purpose || taskSnapshot.tone ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              {taskSnapshot.audience ? (
                <div className="rounded-lg border bg-background p-3">
                  <dt className="text-xs font-medium text-muted-foreground">Audience</dt>
                  <dd className="mt-1">{taskSnapshot.audience}</dd>
                </div>
              ) : null}

              {taskSnapshot.purpose ? (
                <div className="rounded-lg border bg-background p-3">
                  <dt className="text-xs font-medium text-muted-foreground">Purpose</dt>
                  <dd className="mt-1">{taskSnapshot.purpose}</dd>
                </div>
              ) : null}

              {taskSnapshot.tone ? (
                <div className="rounded-lg border bg-background p-3">
                  <dt className="text-xs font-medium text-muted-foreground">Tone</dt>
                  <dd className="mt-1">{taskSnapshot.tone}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {hasWordGoal ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">Word goal</span>

                <span
                  className={
                    maximumExceeded
                      ? "font-medium text-destructive"
                      : minimumReached
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                  }
                >
                  {minimumWords !== null && maximumWords !== null
                    ? `${minimumWords}-${maximumWords} words`
                    : minimumWords !== null
                      ? `At least ${minimumWords} words`
                      : `Up to ${maximumWords} words`}
                </span>
              </div>

              {wordGoalProgress !== null ? (
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Minimum word goal progress"
                  aria-valuemin={0}
                  aria-valuemax={minimumWords ?? undefined}
                  aria-valuenow={Math.min(liveWordCount, minimumWords ?? liveWordCount)}
                >
                  <div
                    className="h-full bg-primary motion-safe:transition-[width]"
                    style={{
                      width: `${wordGoalProgress}%`,
                    }}
                  />
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">
                {maximumExceeded
                  ? `You are ${liveWordCount - maximumWords!} words over the maximum.`
                  : minimumWords !== null && liveWordCount < minimumWords
                    ? `${minimumWords - liveWordCount} more words to reach the minimum.`
                    : minimumWords !== null
                      ? "Minimum word goal reached."
                      : "Keep your writing within the maximum word limit."}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <label htmlFor="writing-editor-content" className="sr-only">
          Your English writing
        </label>

        <Textarea
          id="writing-editor-content"
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setEvaluationError(null);

            if (writingFeedback) {
              setHasChangesSinceFeedback(true);
            }
          }}
          onSelect={handleGrammarSelection}
          placeholder={
            sessionClosed ? "This writing session has ended." : "Start writing in English..."
          }
          readOnly={sessionClosed || interactionLocked}
          aria-readonly={sessionClosed || interactionLocked}
          maxLength={100_000}
          aria-describedby="writing-editor-help writing-editor-statistics"
          className="min-h-88 resize-y text-base leading-7 sm:min-h-96"
        />

        <div
          id="writing-editor-statistics"
          className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
          aria-label="Writing statistics"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tabular-nums">{liveWordCount.toLocaleString()}</span>
            <span className="text-muted-foreground">{liveWordCount === 1 ? "word" : "words"}</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tabular-nums">
              {liveCharacterCount.toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              {liveCharacterCount === 1 ? "character" : "characters"}
            </span>
          </div>
        </div>

        {grammarHelpText && !sessionClosed ? (
          <div className="mt-4">
            {grammarHelpText && !sessionClosed ? (
              <div className="mt-4 space-y-4">
                <WritingGrammarHelp
                  selectedText={grammarHelpText}
                  targetCefrLevel={normalizeWritingCefrLevel(targetCefrLevel)}
                  disabled={interactionLocked}
                  onClearSelection={() => {
                    setGrammarHelpText(null);
                  }}
                />

                <WritingVocabularySuggestions
                  selectedText={grammarHelpText}
                  targetCefrLevel={normalizeWritingCefrLevel(targetCefrLevel)}
                  disabled={interactionLocked}
                />

                <WritingToneGuidance
                  selectedText={grammarHelpText}
                  targetCefrLevel={normalizeWritingCefrLevel(targetCefrLevel)}
                  disabled={interactionLocked}
                />

                <WritingParaphraseAssistance
                  selectedText={grammarHelpText}
                  targetCefrLevel={normalizeWritingCefrLevel(targetCefrLevel)}
                  disabled={interactionLocked}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p id="writing-editor-help" className="text-xs text-muted-foreground">
            {lastSavedAt
              ? `Last saved ${lastSavedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}.`
              : "Your draft will be saved as you write."}
          </p>

          {!sessionClosed ? (
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-4">
              <Button
                type="button"
                variant="outline"
                disabled={interactionLocked || status === "saving"}
                onClick={() => {
                  void saveNow();
                }}
              >
                {status === "saving" ? (
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                Save now
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={interactionLocked}
                onClick={() => {
                  void handleCloseSession(onAbandon);
                }}
              >
                {isPreparingClose ? (
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                ) : null}
                Abandon
              </Button>

              <Button
                type="button"
                disabled={interactionLocked}
                onClick={() => {
                  void handleCloseSession(onComplete);
                }}
              >
                {interactionLocked ? (
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 aria-hidden="true" />
                )}
                Complete
              </Button>

              {content.length > MAX_WRITING_EVALUATION_CHARACTERS ? (
                <p className="text-xs text-destructive sm:col-span-4" role="alert">
                  AI feedback supports writing up to{" "}
                  {MAX_WRITING_EVALUATION_CHARACTERS.toLocaleString()} characters. Shorten this
                  draft before requesting feedback.
                </p>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={
                  sessionClosed ||
                  isEvaluating ||
                  isClosing ||
                  isLoading ||
                  !content.trim() ||
                  content.length > MAX_WRITING_EVALUATION_CHARACTERS
                }
                onClick={() => {
                  void handleRequestFeedback();
                }}
              >
                {isEvaluating ? (
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles aria-hidden="true" />
                )}

                {isEvaluating ? "Evaluating..." : "Get AI feedback"}
              </Button>
            </div>
          ) : null}
        </div>

        {evaluationError ? (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {evaluationError}
          </div>
        ) : null}

        {writingFeedback && hasChangesSinceFeedback ? (
          <div className="mt-6 rounded-lg border px-4 py-3" role="status">
            <p className="text-sm font-medium">
              You have changed your writing since this feedback.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              The feedback below belongs to revision {writingFeedback.revision.revisionNumber}.
              Request feedback again when you are ready to evaluate your updated draft.
            </p>
          </div>
        ) : null}

        {writingFeedback ? (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div>
              <p className="text-sm font-medium">
                Feedback for revision {writingFeedback.revision.revisionNumber}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {writingFeedback.revision.created
                  ? "A new revision snapshot was created from your latest saved draft."
                  : "Your writing has not changed since this revision, so its existing snapshot was reused."}
              </p>
            </div>

            <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              Revision {writingFeedback.revision.revisionNumber}
            </span>
          </div>
        ) : null}

        {writingFeedback ? (
          <WritingFeedback
            revisionId={writingFeedback.revision.id}
            overall={writingFeedback.overall}
            explanations={writingFeedback.explanations}
            canApplySuggestions={!sessionClosed && !interactionLocked}
            onApplySuggestion={handleApplySuggestion}
          />
        ) : null}

        {previousFeedback &&
        writingFeedback &&
        previousFeedback.revision.id !== writingFeedback.revision.id ? (
          <div className="mt-6 rounded-xl border p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Compare your revisions</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Compare revision {previousFeedback.revision.revisionNumber} with revision{" "}
                  {writingFeedback.revision.revisionNumber}.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isComparing}
                onClick={() => {
                  void handleCompareRevisions();
                }}
              >
                {isComparing ? (
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                ) : null}

                {isComparing ? "Comparing..." : "Compare revisions"}
              </Button>
            </div>

            {revisionComparisonError ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {revisionComparisonError}
              </p>
            ) : null}
          </div>
        ) : null}

        {revisionComparison ? <WritingRevisionComparison comparison={revisionComparison} /> : null}
      </div>
    </section>
  );
}

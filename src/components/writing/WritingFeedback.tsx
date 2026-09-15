import { useState } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, Loader2, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WritingRewriteSuggestion } from "@/components/writing/WritingRewriteSuggestion";
import { requestWritingRewriteServerFn } from "@/lib/writing/rewrite-functions";

import type { WritingFeedbackExplanation } from "@/server/writing/feedback/explanations";
import type { WritingOverallFeedback } from "@/server/writing/feedback/overall-feedback";
import type { WritingRewriteSuggestion as WritingRewriteSuggestionResult } from "@/server/writing/rewrite/types";

export interface WritingSuggestionApplyResult {
  applied: boolean;
  message: string;
}

interface WritingFeedbackProps {
  userId: string;
  revisionId: string;
  overall: WritingOverallFeedback;
  explanations: WritingFeedbackExplanation[];
  canApplySuggestions: boolean;
  onApplySuggestion: (
    originalText: string,
    replacementText: string,
  ) => WritingSuggestionApplyResult;
}

export function WritingFeedback({
  userId,
  revisionId,
  overall,
  explanations,
  canApplySuggestions,
  onApplySuggestion,
}: WritingFeedbackProps) {
  return (
    <section className="space-y-6" aria-labelledby="writing-feedback-heading">
      <Card>
        <CardHeader>
          <CardTitle id="writing-feedback-heading">Your writing feedback</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Overall score</p>

              <p className="mt-1 text-3xl font-semibold">
                {overall.overallScore}
                <span className="text-base font-normal text-muted-foreground">/100</span>
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Estimated writing level</p>

              <p className="mt-1 text-3xl font-semibold">{overall.estimatedCefrLevel}</p>
            </div>
          </div>

          <p className="leading-7">{overall.summary}</p>
        </CardContent>
      </Card>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Writing skill scores"
      >
        {overall.dimensions.map((dimension) => (
          <Card key={dimension.dimension}>
            <CardContent className="p-4">
              <p className="text-sm font-medium">{formatDimension(dimension.dimension)}</p>

              <p className="mt-2 text-2xl font-semibold">{dimension.score}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {dimension.issueCount} {dimension.issueCount === 1 ? "issue" : "issues"}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {overall.strengths.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5" aria-hidden="true" />
              What you did well
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3">
              {overall.strengths.map((strength, index) => (
                <li
                  key={`${strength.dimension}:${strength.category}:${index}`}
                  className="rounded-lg border p-3"
                >
                  <p className="text-sm font-medium">{formatDimension(strength.dimension)}</p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{strength.message}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {overall.priorityImprovements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" aria-hidden="true" />
              Priority improvements
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3">
              {overall.priorityImprovements.map((item, index) => (
                <li
                  key={`${item.dimension}:${item.category}:${index}`}
                  className="rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{formatDimension(item.dimension)}</span>

                    <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                      {item.severity}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium">{item.message}</p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.explanation}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {explanations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-5" aria-hidden="true" />
              Detailed feedback
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="space-y-4">
              {explanations.map((item) => (
                <FeedbackItem
                  key={item.feedbackId}
                  userId={userId}
                  revisionId={revisionId}
                  item={item}
                  canApplySuggestions={canApplySuggestions}
                  onApplySuggestion={onApplySuggestion}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex gap-3 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />

            <p className="text-sm leading-6">
              No specific writing problems were identified in this evaluation.
            </p>
          </CardContent>
        </Card>
      )}

      {overall.nextSteps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" aria-hidden="true" />
              What to work on next
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ol className="space-y-2 pl-5 text-sm leading-6">
              {overall.nextSteps.map((step, index) => (
                <li key={`${index}:${step}`} className="list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

interface FeedbackItemProps {
  userId: string;
  revisionId: string;
  item: WritingFeedbackExplanation;
  canApplySuggestions: boolean;
  onApplySuggestion: (
    originalText: string,
    replacementText: string,
  ) => WritingSuggestionApplyResult;
}

function FeedbackItem({
  userId,
  revisionId,
  item,
  canApplySuggestions,
  onApplySuggestion,
}: FeedbackItemProps) {
  const [isLoadingRewrite, setIsLoadingRewrite] = useState(false);

  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const [rewriteSuggestion, setRewriteSuggestion] = useState<WritingRewriteSuggestionResult | null>(
    null,
  );

  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const [applyError, setApplyError] = useState<string | null>(null);

  const canRequestRewrite = Boolean(item.example?.before.trim());

  async function handleRequestRewrite(): Promise<void> {
    if (!canRequestRewrite || isLoadingRewrite || rewriteSuggestion) {
      return;
    }

    setIsLoadingRewrite(true);
    setRewriteError(null);

    try {
      const result = await requestWritingRewriteServerFn({
        data: {
          userId,
          revisionId,
          feedbackId: item.feedbackId,
        },
      });

      setRewriteSuggestion(result);
    } catch {
      setRewriteError("A rewrite suggestion could not be generated right now. Please try again.");
    } finally {
      setIsLoadingRewrite(false);
    }
  }

  function handleApply(originalText: string, replacementText: string): void {
    setApplyMessage(null);
    setApplyError(null);

    const result = onApplySuggestion(originalText, replacementText);

    if (result.applied) {
      setApplyMessage(result.message);
      return;
    }

    setApplyError(result.message);
  }

  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium">{item.dimensionLabel}</span>

        <span className="rounded-full border px-2 py-0.5 text-xs">{item.categoryLabel}</span>

        <span className="rounded-full border px-2 py-0.5 text-xs">{item.severityLabel}</span>
      </div>

      <h3 className="mt-3 font-medium">{item.title}</h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.explanation}</p>

      {item.example ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Your writing</p>

            <p className="mt-2 wrap-break-word text-sm">{item.example.before}</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Suggested correction</p>

            <p className="mt-2 wrap-break-word text-sm">{item.example.after}</p>

            {canApplySuggestions &&
            item.example.after.trim() &&
            item.example.after !== item.example.before ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  handleApply(item.example!.before, item.example!.after);
                }}
              >
                <CheckCircle2 aria-hidden="true" />
                Apply correction
              </Button>
            ) : null}
          </div>
        </div>
      ) : item.suggestion ? (
        <div className="mt-4 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Suggestion</p>

          <p className="mt-2 wrap-break-word text-sm">{item.suggestion}</p>
        </div>
      ) : null}

      {canRequestRewrite ? (
        <div className="mt-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLoadingRewrite || rewriteSuggestion !== null}
            onClick={() => {
              void handleRequestRewrite();
            }}
          >
            {isLoadingRewrite ? (
              <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}

            {isLoadingRewrite
              ? "Generating..."
              : rewriteSuggestion
                ? "Suggestion generated"
                : "Show rewrite suggestion"}
          </Button>
        </div>
      ) : null}

      {rewriteError ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {rewriteError}
        </p>
      ) : null}

      {rewriteSuggestion && item.example ? (
        <>
          <WritingRewriteSuggestion
            originalText={item.example.before}
            suggestion={rewriteSuggestion}
          />

          {canApplySuggestions ? (
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => {
                handleApply(item.example!.before, rewriteSuggestion.rewrittenText);
              }}
            >
              <CheckCircle2 aria-hidden="true" />
              Apply AI rewrite
            </Button>
          ) : null}
        </>
      ) : null}

      {applyMessage ? (
        <p className="mt-3 text-sm font-medium" role="status" aria-live="polite">
          {applyMessage}
        </p>
      ) : null}

      {applyError ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {applyError}
        </p>
      ) : null}
    </li>
  );
}

function formatDimension(
  dimension: "grammar" | "vocabulary" | "coherence" | "taskAchievement" | "mechanics",
): string {
  switch (dimension) {
    case "grammar":
      return "Grammar";

    case "vocabulary":
      return "Vocabulary";

    case "coherence":
      return "Coherence";

    case "taskAchievement":
      return "Task Achievement";

    case "mechanics":
      return "Mechanics";
  }
}

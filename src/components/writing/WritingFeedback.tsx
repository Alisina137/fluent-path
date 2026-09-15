import { AlertTriangle, CheckCircle2, Lightbulb, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WritingFeedbackExplanation } from "@/server/writing/feedback/explanations";

import type { WritingOverallFeedback } from "@/server/writing/feedback/overall-feedback";

interface WritingFeedbackProps {
  overall: WritingOverallFeedback;
  explanations: WritingFeedbackExplanation[];
}

export function WritingFeedback({ overall, explanations }: WritingFeedbackProps) {
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
                <li key={item.feedbackId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium">{item.dimensionLabel}</span>

                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      {item.categoryLabel}
                    </span>

                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      {item.severityLabel}
                    </span>
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
                        <p className="text-xs font-medium text-muted-foreground">
                          Suggested correction
                        </p>

                        <p className="mt-2 wrap-break-word text-sm">{item.example.after}</p>
                      </div>
                    </div>
                  ) : item.suggestion ? (
                    <div className="mt-4 rounded-lg border p-3">
                      <p className="text-xs font-medium text-muted-foreground">Suggestion</p>

                      <p className="mt-2 wrap-break-word text-sm">{item.suggestion}</p>
                    </div>
                  ) : null}
                </li>
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

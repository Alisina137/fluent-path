import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock3,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getWritingImprovementTrendsServerFn,
  getWritingSkillMetricsServerFn,
  getWritingSubmissionHistoryServerFn,
} from "@/lib/writing/progress-functions";

type SkillMetrics = Awaited<ReturnType<typeof getWritingSkillMetricsServerFn>>;

type SubmissionHistory = Awaited<ReturnType<typeof getWritingSubmissionHistoryServerFn>>;

type ImprovementTrends = Awaited<ReturnType<typeof getWritingImprovementTrendsServerFn>>;

type TrendDirection = ImprovementTrends["trends"]["overall"]["direction"];

interface ProgressData {
  metrics: SkillMetrics;
  history: SubmissionHistory;
  trends: ImprovementTrends;
}

const SKILL_LABELS = [
  ["grammar", "Grammar"],
  ["vocabulary", "Vocabulary"],
  ["coherence", "Coherence"],
  ["taskAchievement", "Task achievement"],
  ["mechanics", "Mechanics"],
] as const;

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatWritingType(value: string): string {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getTrendLabel(direction: TrendDirection): string {
  switch (direction) {
    case "improving":
      return "Improving";
    case "declining":
      return "Recent scores lower";
    case "stable":
      return "Stable";
    case "insufficient-data":
      return "More writing needed";
  }
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  switch (direction) {
    case "improving":
      return <ArrowUpRight className="size-4" aria-hidden="true" />;

    case "declining":
      return <ArrowDownRight className="size-4" aria-hidden="true" />;

    case "stable":
      return <ArrowRight className="size-4" aria-hidden="true" />;

    case "insufficient-data":
      return <Clock3 className="size-4" aria-hidden="true" />;
  }
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const boundedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>

        <span className="tabular-nums text-muted-foreground">{score.toFixed(1)}</span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${label} average`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(boundedScore)}
      >
        <div
          className="h-full rounded-full bg-primary motion-safe:transition-[width]"
          style={{
            width: `${boundedScore}%`,
          }}
        />
      </div>
    </div>
  );
}

function TrendSummary({
  label,
  trend,
}: {
  label: string;
  trend: ImprovementTrends["trends"]["overall"];
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>

          <p className="mt-1 text-xs text-muted-foreground">{getTrendLabel(trend.direction)}</p>
        </div>

        <TrendIcon direction={trend.direction} />
      </div>

      {trend.change !== null ? (
        <p className="mt-3 text-sm tabular-nums">
          {trend.change > 0 ? "+" : ""}
          {trend.change.toFixed(1)} points
        </p>
      ) : null}
    </div>
  );
}

export function WritingProgressDashboard() {
  const [data, setData] = useState<ProgressData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setIsLoading(true);
      setError(null);

      try {
        const [metrics, history, trends] = await Promise.all([
          getWritingSkillMetricsServerFn(),

          getWritingSubmissionHistoryServerFn(),

          getWritingImprovementTrendsServerFn(),
        ]);

        if (!cancelled) {
          setData({
            metrics,
            history,
            trends,
          });
        }
      } catch {
        if (!cancelled) {
          setError("Your writing progress could not be loaded right now.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (isLoading) {
    return (
      <Card>
        <CardContent
          className="flex min-h-64 items-center justify-center py-10"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <Loader2
              className="mx-auto size-6 motion-safe:animate-spin text-primary"
              aria-hidden="true"
            />

            <p className="mt-3 font-medium">Loading your writing progress...</p>

            <p className="mt-1 text-sm text-muted-foreground">Reviewing your evaluated writing.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <BarChart3 className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />

          <p className="mt-3 font-medium">Progress unavailable</p>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground" role="alert">
            {error ?? "Your writing progress could not be loaded."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setReloadKey((current) => current + 1);
            }}
          >
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { metrics, history, trends } = data;

  if (metrics.evaluatedRevisionCount === 0 || !metrics.latest || !metrics.averages) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <TrendingUp className="mx-auto size-8 text-primary" aria-hidden="true" />

          <p className="mt-4 text-lg font-semibold">
            Your progress starts with your first evaluation
          </p>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Submit some writing for feedback. Once you have evaluated revisions, your skill scores
            and writing history will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }
  const averageScores = metrics.averages;
  const recentSessions = history.sessions.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="space-y-4" aria-labelledby="writing-progress-overview">
        <div>
          <h2 id="writing-progress-overview" className="text-xl font-semibold tracking-tight">
            Writing Progress
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Based only on writing revisions you submitted and evaluated.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Latest score
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{metrics.latest.overall}</p>

              <p className="mt-1 text-xs text-muted-foreground">Most recent evaluated revision</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average score
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {metrics.averages.overall.toFixed(1)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">Across all evaluated revisions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Evaluated revisions
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {metrics.evaluatedRevisionCount}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">Submitted versions with feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Writing sessions
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{metrics.evaluatedSessionCount}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Sessions containing evaluated writing
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5 text-primary" aria-hidden="true" />
              Skill breakdown
            </CardTitle>

            <p className="text-sm leading-6 text-muted-foreground">
              Average scores across your evaluated revisions.
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {SKILL_LABELS.map(([key, label]) => (
              <ScoreBar key={key} label={label} score={averageScores[key]} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" aria-hidden="true" />
              Recent movement
            </CardTitle>

            <p className="text-sm leading-6 text-muted-foreground">
              Recent score averages compared with the preceding evaluation window.
            </p>
          </CardHeader>

          <CardContent>
            {trends.evaluatedRevisionCount < 3 ? (
              <div className="rounded-lg border border-dashed p-5">
                <p className="font-medium">More evaluated writing is needed</p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Complete at least three evaluated revisions before Fluent Path describes recent
                  score movement.
                </p>

                <p className="mt-3 text-sm">
                  {trends.evaluatedRevisionCount}/3 evaluated revisions
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <TrendSummary label="Overall" trend={trends.trends.overall} />

                <TrendSummary label="Grammar" trend={trends.trends.grammar} />

                <TrendSummary label="Vocabulary" trend={trends.trends.vocabulary} />

                <TrendSummary label="Coherence" trend={trends.trends.coherence} />

                <TrendSummary label="Task achievement" trend={trends.trends.taskAchievement} />

                <TrendSummary label="Mechanics" trend={trends.trends.mechanics} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" aria-hidden="true" />
            Recent submissions
          </CardTitle>

          <p className="text-sm leading-6 text-muted-foreground">
            Your most recently evaluated writing sessions.
          </p>
        </CardHeader>

        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluated submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((submission) => {
                const latestRevision = submission.revisions[0];

                if (!latestRevision) {
                  return null;
                }

                return (
                  <article key={submission.sessionId} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{submission.title}</h3>

                          <Badge variant="secondary">CEFR {submission.targetCefrLevel}</Badge>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatWritingType(submission.writingType)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <FileText className="size-3.5" aria-hidden="true" />
                            Revision {latestRevision.revisionNumber}
                          </span>

                          <span>{latestRevision.wordCount} words</span>

                          <span>{formatDate(latestRevision.evaluatedAt)}</span>
                        </div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="text-2xl font-semibold tabular-nums">
                          {latestRevision.scores.overall}
                        </p>

                        <p className="text-xs text-muted-foreground">overall</p>
                      </div>
                    </div>

                    {submission.revisions.length > 1 ? (
                      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                        {submission.revisions.length} evaluated revisions in this writing session
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-5 text-muted-foreground">
        Progress indicators summarize evaluated writing scores. They are learning signals, not
        standardized language-test results.
      </p>
    </div>
  );
}

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/context";

import {
  getSpeakingImprovementTrendsServerFn,
  getSpeakingSessionHistoryServerFn,
  getSpeakingSkillMetricsServerFn,
} from "@/lib/speaking/progress-functions";

type SkillMetrics = Awaited<ReturnType<typeof getSpeakingSkillMetricsServerFn>>;

type SessionHistory = Awaited<ReturnType<typeof getSpeakingSessionHistoryServerFn>>;

type ImprovementTrends = Awaited<ReturnType<typeof getSpeakingImprovementTrendsServerFn>>;

type DashboardState = {
  metrics: SkillMetrics | null;
  history: SessionHistory | null;
  trends: ImprovementTrends | null;
  loading: boolean;
  error: string | null;
};

type TrendDirection = "improving" | "stable" | "declining" | "insufficient_data";

type SkillName = "grammar" | "vocabulary" | "fluency";

const SKILLS: Array<{
  key: SkillName;
  label: string;
  description: string;
}> = [
  {
    key: "grammar",
    label: "Grammar",
    description: "Accuracy and sentence structure",
  },
  {
    key: "vocabulary",
    label: "Vocabulary",
    description: "Word choice and natural expression",
  },
  {
    key: "fluency",
    label: "Fluency",
    description: "Transcript-visible speaking flow",
  },
];

function formatScore(score: number | null): string {
  if (score === null) {
    return "--";
  }

  return `${Math.round(score)}`;
}

function formatDuration(durationMs: number): string {
  if (durationMs <= 0) {
    return "Less than 1 min";
  }

  const totalMinutes = Math.max(1, Math.round(durationMs / 60_000));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function formatSessionDate(value: Date | string): string {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTrendLabel(direction: TrendDirection): string {
  switch (direction) {
    case "improving":
      return "Improving";

    case "declining":
      return "Needs attention";

    case "stable":
      return "Stable";

    default:
      return "More practice needed";
  }
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === "improving") {
    return <ArrowUpRight className="h-4 w-4" aria-hidden="true" />;
  }

  if (direction === "declining") {
    return <ArrowDownRight className="h-4 w-4" aria-hidden="true" />;
  }

  return <ArrowRight className="h-4 w-4" aria-hidden="true" />;
}

function SkillCard({
  label,
  description,
  score,
  evaluationCount,
  direction,
  change,
}: {
  label: string;
  description: string;
  score: number | null;
  evaluationCount: number;
  direction: TrendDirection;
  change: number | null;
}) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{label}</h3>

          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight">{formatScore(score)}</p>

          <p className="text-xs text-muted-foreground">/100</p>
        </div>
      </div>

      <Progress value={score ?? 0} aria-label={`${label} score`} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {evaluationCount} {evaluationCount === 1 ? "evaluation" : "evaluations"}
        </span>

        <span className="flex items-center gap-1 font-medium">
          <TrendIcon direction={direction} />

          {getTrendLabel(direction)}

          {change !== null ? (
            <span className="text-muted-foreground">
              ({change > 0 ? "+" : ""}
              {change.toFixed(1)})
            </span>
          ) : null}
        </span>
      </div>
    </Card>
  );
}

function OverallProgressCard({
  metrics,
  trends,
}: {
  metrics: SkillMetrics;
  trends: ImprovementTrends;
}) {
  const score = metrics.overallScore;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Target className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <h3 className="font-semibold">Overall speaking performance</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Based on your available Grammar, Vocabulary, and Fluency feedback.
            </p>
          </div>
        </div>

        <div className="min-w-44">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <span className="text-3xl font-semibold tracking-tight">{formatScore(score)}</span>

              <span className="ml-1 text-sm text-muted-foreground">/100</span>
            </div>

            <div className="flex items-center gap-1 text-sm font-medium">
              <TrendIcon direction={trends.overall.direction} />

              {getTrendLabel(trends.overall.direction)}
            </div>
          </div>

          <Progress value={score ?? 0} aria-label="Overall speaking score" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Evaluations</p>

          <p className="mt-1 font-medium">{metrics.totalEvaluations}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Evaluated messages</p>

          <p className="mt-1 font-medium">{metrics.evaluatedMessages}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Recent change</p>

          <p className="mt-1 font-medium">
            {trends.overall.change === null
              ? "Not enough data"
              : `${trends.overall.change > 0 ? "+" : ""}${trends.overall.change.toFixed(1)} points`}
          </p>
        </div>
      </div>
    </Card>
  );
}

function RecentTrendCard({ trends }: { trends: ImprovementTrends }) {
  const availablePoints = SKILLS.flatMap(({ key, label }) =>
    trends.skills[key].points.map((point) => ({
      ...point,
      label,
    })),
  );

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </div>

        <div>
          <h3 className="font-medium">Improvement trend</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Recent feedback compared with your previous performance.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {SKILLS.map(({ key, label }) => {
          const trend = trends.skills[key];

          return (
            <div
              key={key}
              className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="text-sm font-medium">{label}</div>

              <div
                className="flex h-12 items-end gap-1 overflow-hidden rounded-md bg-muted/40 px-2 pt-2"
                aria-label={`${label} recent score history`}
              >
                {trend.points.length > 0 ? (
                  trend.points.map((point, index) => (
                    <div
                      key={`${point.messageId}-${index}`}
                      className="min-w-1 flex-1 rounded-t-sm bg-primary/70"
                      style={{
                        height: `${Math.max(point.score, 4)}%`,
                      }}
                      title={`${label}: ${point.score}/100`}
                    />
                  ))
                ) : (
                  <div className="flex h-full items-center text-xs text-muted-foreground">
                    No feedback yet
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs font-medium">
                <TrendIcon direction={trend.direction} />

                {getTrendLabel(trend.direction)}
              </div>
            </div>
          );
        })}
      </div>

      {availablePoints.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Request feedback on learner messages to begin building your progress history.
        </p>
      ) : null}
    </Card>
  );
}

function SessionHistoryList({ history }: { history: SessionHistory }) {
  if (history.sessions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <History className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />

        <h3 className="mt-3 font-medium">No speaking sessions yet</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Start a conversation below and your speaking history will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {history.sessions.slice(0, 5).map((session) => (
        <Card key={session.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{formatSessionDate(session.startedAt)}</p>

                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {session.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />

                  {formatDuration(session.durationMs)}
                </span>

                <span>{session.learnerMessageCount} learner messages</span>

                <span>{session.feedbackEvaluationCount} evaluations</span>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-xl font-semibold">{formatScore(session.overallFeedbackScore)}</p>

              <p className="text-xs text-muted-foreground">session score</p>
            </div>
          </div>

          {session.overallFeedbackScore !== null ? (
            <Progress
              className="mt-3"
              value={session.overallFeedbackScore}
              aria-label={`Session score ${session.overallFeedbackScore} out of 100`}
            />
          ) : null}
        </Card>
      ))}
    </div>
  );
}

export function SpeakingProgressDashboard() {
  const { hydrated, isAuthenticated, session } = useAuth();

  const userId = session?.user.id ?? null;

  const [state, setState] = useState<DashboardState>({
    metrics: null,
    history: null,
    trends: null,
    loading: false,
    error: null,
  });

  const loadProgress = useCallback(async () => {
    if (!userId) {
      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const [metrics, history, trends] = await Promise.all([
        getSpeakingSkillMetricsServerFn({
          data: {
            userId,
          },
        }),

        getSpeakingSessionHistoryServerFn({
          data: {
            userId,
            limit: 10,
          },
        }),

        getSpeakingImprovementTrendsServerFn({
          data: {
            userId,
          },
        }),
      ]);

      setState({
        metrics,
        history,
        trends,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("[Speaking Progress] Unable to load dashboard", error);

      setState((current) => ({
        ...current,
        loading: false,
        error:
          "Your speaking progress could not be loaded. Your conversations are still available below.",
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (hydrated && isAuthenticated && userId) {
      void loadProgress();
    }
  }, [hydrated, isAuthenticated, userId, loadProgress]);

  if (!hydrated) {
    return (
      <Card
        className="flex items-center gap-3 p-4 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading speaking progress...
      </Card>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  const dashboardData =
    state.metrics && state.history && state.trends
      ? {
          metrics: state.metrics,
          history: state.history,
          trends: state.trends,
        }
      : null;

  const hasData = dashboardData !== null;

  return (
    <div className="space-y-8">
      <DashboardSection
        title="Speaking Progress"
        description="Track your English speaking performance from saved feedback and conversations."
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.loading}
            onClick={() => {
              void loadProgress();
            }}
          >
            {state.loading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            Refresh
          </Button>
        }
      >
        {state.error ? (
          <Card className="border-destructive/30 p-4" role="alert">
            <p className="text-sm font-medium text-destructive">Progress unavailable</p>

            <p className="mt-1 text-sm text-muted-foreground">{state.error}</p>
          </Card>
        ) : null}

        {state.loading && !hasData ? (
          <Card className="flex items-center gap-3 p-6" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />

            <div>
              <p className="font-medium">Loading your progress</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Reading your saved speaking sessions and feedback.
              </p>
            </div>
          </Card>
        ) : null}

        {hasData ? (
          <div className="space-y-6">
            <OverallProgressCard metrics={dashboardData.metrics} trends={dashboardData.trends} />

            <div className="grid gap-4 md:grid-cols-3">
              {SKILLS.map(({ key, label, description }) => (
                <SkillCard
                  key={key}
                  label={label}
                  description={description}
                  score={dashboardData.metrics.skills[key].averageScore}
                  evaluationCount={dashboardData.metrics.skills[key].evaluationCount}
                  direction={dashboardData.trends.skills[key].direction}
                  change={dashboardData.trends.skills[key].change}
                />
              ))}
            </div>

            <RecentTrendCard trends={dashboardData.trends} />

            <Card className="border-dashed p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />

                <div>
                  <p className="text-sm font-medium">Pronunciation</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Pronunciation progress is not scored yet. Fluent Path will only show it when an
                    audio-based pronunciation assessment provider is available.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </DashboardSection>

      {hasData ? (
        <DashboardSection
          title="Recent Sessions"
          description="Your latest speaking conversations and their available feedback."
          action={
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {dashboardData.history.totalSessions} loaded
            </div>
          }
        >
          <SessionHistoryList history={dashboardData.history} />
        </DashboardSection>
      ) : null}
    </div>
  );
}

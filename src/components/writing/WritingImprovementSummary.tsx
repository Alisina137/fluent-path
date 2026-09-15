import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

import type {
  WritingImprovementClassification,
  WritingImprovementMeasurement,
  WritingScoreDimension,
} from "@/server/writing/improvement/types";

interface WritingImprovementSummaryProps {
  improvement: WritingImprovementMeasurement;
}

export function WritingImprovementSummary({ improvement }: WritingImprovementSummaryProps) {
  if (!improvement.available || !improvement.overall || !improvement.classification) {
    return (
      <section
        className="rounded-lg border bg-muted/20 p-4"
        aria-labelledby="writing-improvement-heading"
      >
        <h4 id="writing-improvement-heading" className="font-medium">
          Improvement measurement
        </h4>

        <p className="mt-2 text-sm text-muted-foreground">
          Both revisions need evaluations before improvement can be measured.
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-xl border p-4"
      aria-labelledby="writing-improvement-heading"
    >
      <div>
        <h4 id="writing-improvement-heading" className="font-semibold">
          Your improvement
        </h4>

        <p className="mt-1 text-sm text-muted-foreground">
          {getClassificationMessage(improvement.classification)}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4" role="status">
        <ImprovementIcon classification={improvement.classification} />

        <div>
          <p className="text-sm text-muted-foreground">Overall score</p>

          <div className="mt-1 flex flex-wrap items-center gap-2 font-semibold">
            <span>{improvement.overall.beforeScore}</span>

            <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />

            <span>{improvement.overall.afterScore}</span>

            <span className="text-sm">({formatDifference(improvement.overall.difference)})</span>
          </div>
        </div>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Writing skill improvement"
      >
        {improvement.dimensions.map((dimension) => (
          <div key={dimension.dimension} className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {formatDimension(dimension.dimension)}
            </p>

            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <span>{dimension.beforeScore}</span>

              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />

              <span className="font-medium">{dimension.afterScore}</span>
            </div>

            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatDifference(dimension.difference)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStatistic label="Improved skills" value={improvement.improvedDimensions} />

        <SummaryStatistic label="Unchanged skills" value={improvement.unchangedDimensions} />

        <SummaryStatistic label="Declined skills" value={improvement.declinedDimensions} />
      </div>

      {improvement.strongestImprovement ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">Strongest improvement</p>

          <p className="mt-1 text-sm font-medium">
            {formatDimension(improvement.strongestImprovement.dimension)} improved by{" "}
            {improvement.strongestImprovement.difference} points.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function ImprovementIcon({ classification }: { classification: WritingImprovementClassification }) {
  if (classification === "strong_improvement" || classification === "improvement") {
    return <TrendingUp className="size-5 shrink-0" aria-hidden="true" />;
  }

  if (classification === "decline") {
    return <TrendingDown className="size-5 shrink-0" aria-hidden="true" />;
  }

  return <Minus className="size-5 shrink-0" aria-hidden="true" />;
}

function SummaryStatistic({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function getClassificationMessage(classification: WritingImprovementClassification): string {
  switch (classification) {
    case "strong_improvement":
      return "Your newer revision shows strong overall improvement without a decline in the measured writing skills.";

    case "improvement":
      return "Your newer revision shows overall improvement across the measured writing skills.";

    case "mixed":
      return "Your revision improved in some areas while other areas stayed the same or declined.";

    case "unchanged":
      return "Your measured writing scores stayed at approximately the same level.";

    case "decline":
      return "Your newer revision received a lower overall score. Review the skill changes below to see what needs more work.";
  }
}

function formatDimension(dimension: WritingScoreDimension): string {
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

function formatDifference(difference: number): string {
  if (difference > 0) {
    return `+${difference}`;
  }

  return difference.toString();
}

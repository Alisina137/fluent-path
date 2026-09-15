import { ArrowRight, Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { WritingImprovementSummary } from "@/components/writing/WritingImprovementSummary";

import type {
  WritingComparisonSegment,
  WritingRevisionComparison,
} from "@/server/writing/comparison/types";

interface WritingRevisionComparisonProps {
  comparison: WritingRevisionComparison;
}

export function WritingRevisionComparison({ comparison }: WritingRevisionComparisonProps) {
  const { before, after, beforeSegments, afterSegments, statistics } = comparison;

  return (
    <section
      className="mt-6 space-y-4 rounded-xl border bg-card p-4 sm:p-5"
      aria-labelledby="writing-revision-comparison-heading"
    >
      <div>
        <h3 id="writing-revision-comparison-heading" className="font-semibold">
          Revision comparison
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          See what changed between your two evaluated drafts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border px-2.5 py-1 font-medium">
          Revision {before.revisionNumber}
        </span>

        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />

        <span className="rounded-full border px-2.5 py-1 font-medium">
          Revision {after.revisionNumber}
        </span>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Revision improvement statistics"
      >
        <Statistic
          label="Score change"
          value={
            statistics.scoreDifference === null
              ? "Not available"
              : formatDifference(statistics.scoreDifference)
          }
        />

        <Statistic label="Word change" value={formatDifference(statistics.wordCountDifference)} />

        <Statistic label="Words added" value={`+${statistics.addedWordCount}`} />

        <Statistic label="Words removed" value={`-${statistics.removedWordCount}`} />
      </div>

      {statistics.scoreDifference !== null ? (
        <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3" role="status">
          {statistics.scoreDifference > 0 ? (
            <TrendingUp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : statistics.scoreDifference < 0 ? (
            <TrendingDown className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Minus className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}

          <p className="text-sm">
            {statistics.scoreDifference > 0
              ? `Your overall score improved by ${statistics.scoreDifference} points.`
              : statistics.scoreDifference < 0
                ? `Your overall score changed by ${statistics.scoreDifference} points.`
                : "Your overall score stayed the same."}
          </p>
        </div>
      ) : null}

      <WritingImprovementSummary improvement={comparison.improvement} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RevisionPanel
          title={`Revision ${before.revisionNumber}`}
          score={before.overallScore}
          wordCount={before.wordCount}
          segments={beforeSegments}
          changedType="removed"
        />

        <RevisionPanel
          title={`Revision ${after.revisionNumber}`}
          score={after.overallScore}
          wordCount={after.wordCount}
          segments={afterSegments}
          changedType="added"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Minus className="size-3.5" aria-hidden="true" />
          Removed from the earlier revision
        </span>

        <span className="flex items-center gap-1.5">
          <Plus className="size-3.5" aria-hidden="true" />
          Added in the newer revision
        </span>
      </div>
    </section>
  );
}

interface StatisticProps {
  label: string;
  value: string;
}

function Statistic({ label, value }: StatisticProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

interface RevisionPanelProps {
  title: string;
  score: number | null;
  wordCount: number;
  segments: WritingComparisonSegment[];
  changedType: "added" | "removed";
}

function RevisionPanel({ title, score, wordCount, segments, changedType }: RevisionPanelProps) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border">
      <header className="border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-medium">{title}</h4>

          <span className="text-sm font-medium">
            {score === null ? "Not evaluated" : `${score}/100`}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
        </p>
      </header>

      <div className="max-h-96 overflow-auto p-4">
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">
          {segments.map((segment, index) => (
            <span
              key={`${segment.type}-${index}`}
              className={
                segment.type === changedType ? "rounded bg-muted px-0.5 font-medium" : undefined
              }
              data-change-type={segment.type}
            >
              {segment.text}
            </span>
          ))}
        </p>
      </div>
    </article>
  );
}

function formatDifference(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return value.toString();
}

import { Card } from "@/components/ui/card";
import { LevelBadge } from "./LevelBadge";
import { Sparkles } from "lucide-react";
import type { AssessmentResult } from "@/lib/types";

export function ResultSummary({ result }: { result: AssessmentResult }) {
  return (
    <Card className="flex flex-col gap-4 border-primary/20 p-6" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/80">
        <Sparkles className="h-3.5 w-3.5" /> Your placement result
      </div>
      <div className="flex flex-wrap items-end gap-4 text-primary-foreground">
        <div>
          <div className="text-sm opacity-80">Estimated level</div>
          <div className="mt-1"><LevelBadge level={result.estimated_level} size="lg" /></div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm opacity-80">Overall score</div>
          <div className="text-4xl font-semibold tabular-nums">{result.overall_percentage}%</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-primary-foreground">
        <div><div className="text-xs opacity-80">Confidence</div><div className="text-lg font-semibold">{result.confidence}%</div></div>
        <div><div className="text-xs opacity-80">Time taken</div><div className="text-lg font-semibold">{Math.max(1, Math.round(result.duration_ms / 60000))} min</div></div>
      </div>
    </Card>
  );
}
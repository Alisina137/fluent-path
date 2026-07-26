import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SKILL_LABELS } from "@/lib/assessment/sections";
import type { SkillScore } from "@/lib/types";

export function SkillScoreCard({ score }: { score: SkillScore }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{SKILL_LABELS[score.skill]}</span>
        <span className="text-2xl font-semibold tabular-nums">
          {score.total ? `${score.percentage}%` : "—"}
        </span>
      </div>
      <Progress value={score.percentage} />
      <div className="text-xs text-muted-foreground">
        {score.total ? `${score.correct} of ${score.total} correct` : "Not attempted"}
      </div>
    </Card>
  );
}
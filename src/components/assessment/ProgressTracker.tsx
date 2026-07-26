import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS } from "@/lib/assessment/sections";
import type { SkillId } from "@/lib/types";

export function ProgressTracker({ current, total, skill }: { current: number; total: number; skill: SkillId }) {
  const pct = total ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{SKILL_LABELS[skill]}</Badge>
        <span className="text-sm text-muted-foreground">
          Question {Math.min(current + 1, total)} of {total}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
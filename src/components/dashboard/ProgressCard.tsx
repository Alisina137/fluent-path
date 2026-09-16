import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { LearningModule } from "@/lib/types";

export function ProgressCard({
  module,
  percent = 0,
  onOpen,
}: {
  module: LearningModule;
  percent?: number;
  onOpen?: (id: LearningModule["id"]) => void;
}) {
  const Icon = (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{module.name}</div>
          <div className="text-xs text-muted-foreground">{percent}% complete</div>
        </div>
        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => onOpen?.(module.id)}>
          Open
        </Button>
      </div>
      <Progress value={percent} />
    </Card>
  );
}

export interface ProgressEntry {
  moduleId: string;
  percent: number;
}

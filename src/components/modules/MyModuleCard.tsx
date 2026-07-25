import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import type { LearningModule, UserModule } from "@/lib/types";
import { formatRelativeDate } from "@/lib/modules/access";
import { ModuleStatusBadge } from "./ModuleStatusBadge";

export function MyModuleCard({
  module,
  userModule,
  onOpen,
}: {
  module: LearningModule;
  userModule: UserModule;
  onOpen?: (id: LearningModule["id"]) => void;
}) {
  const Icon =
    (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;
  const percent = userModule.progress_percentage ?? 0;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{module.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              Last opened {formatRelativeDate(userModule.last_accessed)}
            </div>
          </div>
        </div>
        <ModuleStatusBadge state="subscribed" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
        <Progress value={percent} />
      </div>
      <Button size="sm" onClick={() => onOpen?.(module.id)}>
        <Play className="mr-1.5 h-4 w-4" /> Quick launch
      </Button>
    </Card>
  );
}
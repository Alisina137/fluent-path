import * as Icons from "lucide-react";
import type { LearningModule, ModuleAccessState } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABELS } from "@/lib/modules/registry";
import { ModuleStatusBadge } from "./ModuleStatusBadge";
import { ModuleActionButton } from "./ModuleActionButton";

export function ModuleCard({
  module,
  accessState,
  onSelect,
  onSubscribe,
  onOpen,
  onRenew,
  onNotify,
}: {
  module: LearningModule;
  accessState: ModuleAccessState;
  onSelect?: (id: LearningModule["id"]) => void;
  onSubscribe?: (id: LearningModule["id"]) => void;
  onOpen?: (id: LearningModule["id"]) => void;
  onRenew?: (id: LearningModule["id"]) => void;
  onNotify?: (id: LearningModule["id"]) => void;
}) {
  const Icon = (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;
  return (
    <Card className="group relative flex flex-col gap-4 overflow-hidden p-5 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          <ModuleStatusBadge state={accessState} />
          {module.featured && accessState !== "subscribed" ? <Badge>Featured</Badge> : null}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">{module.name}</h3>
        <p className="text-sm text-muted-foreground">{module.short_description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {DIFFICULTY_LABELS[module.difficulty]}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {module.estimated_learning_time}
        </Badge>
      </div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-sm">
          <span className="font-semibold">${module.monthly_price}</span>
          <span className="text-muted-foreground">/mo</span>
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onSelect?.(module.id)}>
            Details
          </Button>
          <ModuleActionButton
            state={accessState}
            module={module}
            onSubscribe={onSubscribe}
            onOpen={onOpen}
            onRenew={onRenew}
            onNotify={onNotify}
          />
        </div>
      </div>
    </Card>
  );
}
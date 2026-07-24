import * as Icons from "lucide-react";
import type { LearningModule } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABELS } from "@/lib/modules/registry";

export function ModuleCard({
  module,
  active,
  onSelect,
}: {
  module: LearningModule;
  active?: boolean;
  onSelect?: (id: LearningModule["id"]) => void;
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
          {active && <Badge variant="secondary">Active</Badge>}
          {module.status === "coming_soon" && <Badge variant="outline">Coming soon</Badge>}
          {module.status === "beta" && <Badge>Beta</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">{module.name}</h3>
        <p className="text-sm text-muted-foreground">{module.tagline}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {DIFFICULTY_LABELS[module.difficulty]}
        </Badge>
      </div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-sm">
          <span className="font-semibold">${module.price}</span>
          <span className="text-muted-foreground">/mo</span>
        </span>
        <Button
          size="sm"
          variant={active ? "outline" : "default"}
          onClick={() => onSelect?.(module.id)}
        >
          {active ? "Open" : "View details"}
        </Button>
      </div>
    </Card>
  );
}
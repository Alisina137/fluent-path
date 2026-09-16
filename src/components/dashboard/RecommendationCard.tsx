import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { LearningModule } from "@/lib/types";

export function RecommendationCard({
  module,
  reason,
  onOpen,
}: {
  module: LearningModule;
  reason: string;
  onOpen?: (id: LearningModule["id"]) => void;
}) {
  const Icon = (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;
  return (
    <Card className="flex flex-col gap-3 border-primary/20 bg-linear-to-br from-primary/4 to-transparent p-5">
      <div className="flex items-center justify-between">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="secondary" className="gap-1">
          <Star className="h-3 w-3 fill-current" /> Recommended
        </Badge>
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight">{module.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-1 self-start"
        onClick={() => onOpen?.(module.id)}
      >
        View details
      </Button>
    </Card>
  );
}

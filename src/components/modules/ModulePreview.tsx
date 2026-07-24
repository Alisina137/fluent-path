import * as Icons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Target } from "lucide-react";
import type { LearningModule } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/modules/registry";

export function ModulePreview({
  module,
  open,
  onOpenChange,
}: {
  module: LearningModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!module) return null;
  const Icon =
    (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{module.name}</DialogTitle>
              <DialogDescription>{module.tagline}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{DIFFICULTY_LABELS[module.difficulty]}</Badge>
          <Badge variant="outline">
            <span className="font-semibold">${module.price}</span>
            <span className="ml-1 text-muted-foreground">/mo</span>
          </Badge>
          {module.status === "coming_soon" ? (
            <Badge variant="outline">Coming soon</Badge>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">{module.description}</p>

        <div className="grid gap-5 md:grid-cols-2">
          <Section title="Benefits" icon={<Sparkles className="h-4 w-4" />} items={module.benefits} />
          <Section title="Features" icon={<Check className="h-4 w-4" />} items={module.features} />
        </div>
        <Section
          title="Estimated outcomes"
          icon={<Target className="h-4 w-4" />}
          items={module.outcomes}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled>Coming soon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
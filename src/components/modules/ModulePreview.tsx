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
import { Check, Clock, Sparkles, Target, Users } from "lucide-react";
import type { LearningModule, UserModule } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/modules/registry";
import { ModuleStatusBadge } from "./ModuleStatusBadge";
import { ModuleActionButton } from "./ModuleActionButton";
import { getAccessState } from "@/lib/modules/access";

export function ModulePreview({
  module,
  userModule,
  open,
  onOpenChange,
  onSubscribe,
  onOpen,
  onRenew,
  onNotify,
}: {
  module: LearningModule | null;
  userModule?: UserModule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe?: (id: LearningModule["id"]) => void;
  onOpen?: (id: LearningModule["id"]) => void;
  onRenew?: (id: LearningModule["id"]) => void;
  onNotify?: (id: LearningModule["id"]) => void;
}) {
  if (!module) return null;
  const Icon = (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;
  const state = getAccessState(module, userModule);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{module.name}</DialogTitle>
              <DialogDescription>{module.tagline}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <ModuleStatusBadge state={state} />
          <Badge variant="secondary">{DIFFICULTY_LABELS[module.difficulty]}</Badge>
          <Badge variant="outline">
            <span className="font-semibold">${module.monthly_price}</span>
            <span className="ml-1 text-muted-foreground">/mo</span>
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {module.estimated_learning_time}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{module.full_description}</p>

        <div className="grid gap-5 md:grid-cols-2">
          <Section
            title="What you'll learn"
            icon={<Sparkles className="h-4 w-4" />}
            items={module.benefits}
          />
          <Section title="Features" icon={<Check className="h-4 w-4" />} items={module.features} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Section
            title="Who this is for"
            icon={<Users className="h-4 w-4" />}
            items={module.audience.length ? module.audience : ["Learners at any level"]}
          />
          <Section
            title="Estimated outcomes"
            icon={<Target className="h-4 w-4" />}
            items={module.outcomes}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <ModuleActionButton
            state={state}
            module={module}
            size="default"
            onSubscribe={(id) => {
              onSubscribe?.(id);
              onOpenChange(false);
            }}
            onOpen={(id) => {
              onOpen?.(id);
              onOpenChange(false);
            }}
            onRenew={(id) => {
              onRenew?.(id);
              onOpenChange(false);
            }}
            onNotify={onNotify}
          />
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

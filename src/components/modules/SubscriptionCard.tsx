import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LearningModule, UserModule } from "@/lib/types";
import { ModuleStatusBadge } from "./ModuleStatusBadge";
import { getAccessState } from "@/lib/modules/access";

export function SubscriptionCard({
  module,
  userModule,
  onCancel,
}: {
  module: LearningModule;
  userModule: UserModule;
  onCancel?: (id: LearningModule["id"]) => void;
}) {
  const Icon = (Icons[module.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Sparkles;
  const state = getAccessState(module, userModule);
  const renewal = userModule.expiration_date
    ? new Date(userModule.expiration_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{module.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            Renews {renewal} · {userModule.auto_renew ? "Auto-renew on" : "Auto-renew off"}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right text-sm">
          <div className="font-semibold">${module.monthly_price}</div>
          <div className="text-xs text-muted-foreground">/month</div>
        </div>
        <ModuleStatusBadge state={state} />
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={() => onCancel(module.id)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

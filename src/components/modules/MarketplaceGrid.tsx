import type { LearningModule, ModuleAccessState, UserModule } from "@/lib/types";
import { ModuleCard } from "./ModuleCard";
import { Card } from "@/components/ui/card";
import { getAccessState, findUserModule } from "@/lib/modules/access";

export function MarketplaceGrid({
  modules,
  userModules,
  onOpen,
  onSubscribe,
  onOpenModule,
  onRenew,
  onNotify,
}: {
  modules: LearningModule[];
  userModules?: UserModule[];
  onOpen: (id: LearningModule["id"]) => void;
  onSubscribe?: (id: LearningModule["id"]) => void;
  onOpenModule?: (id: LearningModule["id"]) => void;
  onRenew?: (id: LearningModule["id"]) => void;
  onNotify?: (id: LearningModule["id"]) => void;
}) {
  if (modules.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        No modules match your filters yet.
      </Card>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m) => {
        const um = findUserModule(userModules, m.id);
        const state: ModuleAccessState = getAccessState(m, um);
        return (
          <ModuleCard
            key={m.id}
            module={m}
            accessState={state}
            onSelect={onOpen}
            onSubscribe={onSubscribe}
            onOpen={onOpenModule}
            onRenew={onRenew}
            onNotify={onNotify}
          />
        );
      })}
    </div>
  );
}

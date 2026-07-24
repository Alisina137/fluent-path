import type { LearningModule } from "@/lib/types";
import { ModuleCard } from "./ModuleCard";
import { Card } from "@/components/ui/card";

export function MarketplaceGrid({
  modules,
  activeIds,
  onOpen,
}: {
  modules: LearningModule[];
  activeIds?: LearningModule["id"][];
  onOpen: (id: LearningModule["id"]) => void;
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
      {modules.map((m) => (
        <ModuleCard
          key={m.id}
          module={m}
          active={activeIds?.includes(m.id)}
          onSelect={onOpen}
        />
      ))}
    </div>
  );
}
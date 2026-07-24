import { Button } from "@/components/ui/button";
import { MODULE_CATEGORIES, DIFFICULTY_LABELS } from "@/lib/modules/registry";
import type { LearningModule, ModuleDifficulty } from "@/lib/types";

export type CategoryFilter = "all" | LearningModule["category"];
export type DifficultyFilter = "all" | ModuleDifficulty;

export function FilterPanel({
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
}: {
  category: CategoryFilter;
  onCategoryChange: (c: CategoryFilter) => void;
  difficulty: DifficultyFilter;
  onDifficultyChange: (d: DifficultyFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4">
      <FilterRow label="Difficulty">
        <Chip active={difficulty === "all"} onClick={() => onDifficultyChange("all")}>
          All
        </Chip>
        {(["beginner", "intermediate", "advanced"] as const).map((d) => (
          <Chip key={d} active={difficulty === d} onClick={() => onDifficultyChange(d)}>
            {DIFFICULTY_LABELS[d]}
          </Chip>
        ))}
      </FilterRow>
      <FilterRow label="Category">
        <Chip active={category === "all"} onClick={() => onCategoryChange("all")}>
          All
        </Chip>
        {MODULE_CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={category === c.value}
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
          </Chip>
        ))}
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="h-7 rounded-full px-3 text-xs"
    >
      {children}
    </Button>
  );
}
import { LEARNING_GOALS } from "@/lib/onboarding/options";
import type { LearningGoal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: LearningGoal[];
  onChange: (next: LearningGoal[]) => void;
}

export function GoalSelector({ value, onChange }: Props) {
  function toggle(g: LearningGoal) {
    onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {LEARNING_GOALS.map((g) => {
        const active = value.includes(g.value);
        return (
          <button
            key={g.value}
            type="button"
            onClick={() => toggle(g.value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 text-left transition",
              active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary",
            )}
          >
            <span className="text-xl">{g.icon}</span>
            <span className="text-sm font-medium">{g.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import { LEARNING_STYLES } from "@/lib/onboarding/options";
import type { LearningStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: LearningStyle[];
  onChange: (next: LearningStyle[]) => void;
}

export function PreferenceSelector({ value, onChange }: Props) {
  function toggle(s: LearningStyle) {
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {LEARNING_STYLES.map((s) => {
        const active = value.includes(s.value);
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => toggle(s.value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 text-left transition",
              active
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary",
            )}
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-medium">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
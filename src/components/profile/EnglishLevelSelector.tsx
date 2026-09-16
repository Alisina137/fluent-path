import { ENGLISH_LEVELS } from "@/lib/onboarding/options";
import type { EnglishLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: EnglishLevel | null;
  onChange: (level: EnglishLevel) => void;
}

export function EnglishLevelSelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-2">
      {ENGLISH_LEVELS.map((l) => {
        const active = value === l.value;
        return (
          <button
            key={l.value}
            type="button"
            onClick={() => onChange(l.value)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition",
              active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-secondary",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {l.code}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{l.label}</span>
              <span className="text-xs text-muted-foreground">{l.example}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

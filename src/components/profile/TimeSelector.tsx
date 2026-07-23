import { DAILY_TIMES } from "@/lib/onboarding/options";
import type { DailyLearningTime } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: DailyLearningTime;
  onChange: (t: DailyLearningTime) => void;
}

export function TimeSelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {DAILY_TIMES.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "flex flex-col items-center rounded-xl border p-3 transition",
              active
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary",
            )}
          >
            <span className="text-sm font-semibold">{t.label}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ASSESSMENT_SECTIONS } from "@/lib/assessment/sections";
import { totalQuestionsForSection } from "@/lib/assessment/questions";
import type { SkillId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SectionList({
  selected,
  onToggle,
}: {
  selected: SkillId[];
  onToggle?: (id: SkillId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ASSESSMENT_SECTIONS.map((s) => {
        const Icon = (Icons[s.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.CircleDot;
        const active = selected.includes(s.id);
        const disabled = s.status === "coming_soon";
        const total = totalQuestionsForSection(s.id);
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onToggle?.(s.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition",
              disabled && "cursor-not-allowed opacity-70",
              active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-secondary",
            )}
          >
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{s.name}</span>
                {disabled ? (
                  <Badge variant="outline" className="text-[10px]">
                    Coming soon
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ~{s.estimated_minutes} min
                </span>
                {!disabled ? <span>{total} questions</span> : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

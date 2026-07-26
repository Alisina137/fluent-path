import { Badge } from "@/components/ui/badge";
import type { EnglishLevel } from "@/lib/types";
import { LEVEL_LABELS } from "@/lib/assessment/level";
import { cn } from "@/lib/utils";

const TONE: Record<EnglishLevel, string> = {
  a1: "bg-sky-100 text-sky-900",
  a2: "bg-emerald-100 text-emerald-900",
  b1: "bg-amber-100 text-amber-900",
  b2: "bg-orange-100 text-orange-900",
  c1: "bg-fuchsia-100 text-fuchsia-900",
  c2: "bg-primary/15 text-primary",
};

export function LevelBadge({ level, size = "sm" }: { level: EnglishLevel; size?: "sm" | "lg" }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent font-semibold", TONE[level], size === "lg" && "px-3 py-1 text-sm")}
    >
      {LEVEL_LABELS[level]}
    </Badge>
  );
}
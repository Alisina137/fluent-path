import { Badge } from "@/components/ui/badge";
import type { ModuleAccessState } from "@/lib/types";
import { ACCESS_LABELS } from "@/lib/modules/access";

const VARIANTS: Record<ModuleAccessState, { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }> = {
  subscribed: { variant: "default" },
  available: { variant: "secondary" },
  coming_soon: { variant: "outline" },
  expired: { variant: "destructive" },
  locked: { variant: "outline" },
};

export function ModuleStatusBadge({ state }: { state: ModuleAccessState }) {
  const cfg = VARIANTS[state];
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {ACCESS_LABELS[state]}
    </Badge>
  );
}
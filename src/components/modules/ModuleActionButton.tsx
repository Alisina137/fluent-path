import { Button } from "@/components/ui/button";
import type { LearningModule, ModuleAccessState } from "@/lib/types";
import { Bell, Lock, Play, RefreshCcw, ShoppingBag } from "lucide-react";

export function ModuleActionButton({
  state,
  module,
  size = "sm",
  variant,
  className,
  onSubscribe,
  onOpen,
  onRenew,
  onNotify,
}: {
  state: ModuleAccessState;
  module: LearningModule;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  onSubscribe?: (id: LearningModule["id"]) => void;
  onOpen?: (id: LearningModule["id"]) => void;
  onRenew?: (id: LearningModule["id"]) => void;
  onNotify?: (id: LearningModule["id"]) => void;
}) {
  const shared = { size, className } as const;
  switch (state) {
    case "subscribed":
      return (
        <Button {...shared} variant={variant ?? "default"} onClick={() => onOpen?.(module.id)}>
          <Play className="mr-1.5 h-4 w-4" /> Open module
        </Button>
      );
    case "expired":
      return (
        <Button {...shared} variant={variant ?? "default"} onClick={() => onRenew?.(module.id)}>
          <RefreshCcw className="mr-1.5 h-4 w-4" /> Renew
        </Button>
      );
    case "coming_soon":
      return (
        <Button {...shared} variant={variant ?? "outline"} onClick={() => onNotify?.(module.id)}>
          <Bell className="mr-1.5 h-4 w-4" /> Notify me
        </Button>
      );
    case "locked":
      return (
        <Button {...shared} variant={variant ?? "outline"} disabled>
          <Lock className="mr-1.5 h-4 w-4" /> Locked
        </Button>
      );
    case "available":
    default:
      return (
        <Button {...shared} variant={variant ?? "default"} onClick={() => onSubscribe?.(module.id)}>
          <ShoppingBag className="mr-1.5 h-4 w-4" /> Subscribe
        </Button>
      );
  }
}

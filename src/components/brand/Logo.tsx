import { Sparkles } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground shadow-(--shadow-soft)"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Sparkles className="h-4 w-4" />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">Lumen English</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            AI Learning
          </span>
        </div>
      )}
    </div>
  );
}

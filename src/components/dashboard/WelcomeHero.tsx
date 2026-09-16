import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Target, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { levelLabel } from "@/lib/onboarding/options";
import { getLanguageByCode } from "@/lib/i18n/languages";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeHero() {
  const { session } = useAuth();
  const name = session?.user.name?.split(" ")[0] ?? "there";
  const initials = session?.user.name?.slice(0, 2).toUpperCase() ?? "??";
  const level = levelLabel(session?.profile?.english_level ?? null);
  const lang = session?.language?.native_language_code
    ? getLanguageByCode(session.language.native_language_code)
    : undefined;
  const goal = session?.profile?.daily_learning_time ?? 15;

  return (
    <Card
      className="overflow-hidden border-none p-0 text-primary-foreground shadow-(--shadow-elegant)"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0 border-2 border-white/40">
            <AvatarFallback className="bg-white/15 text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="text-sm text-primary-foreground/85">{greeting()}</span>
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              {name} 👋
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-primary-foreground hover:bg-white/25">
                <Sparkles className="mr-1 h-3 w-3" /> {level}
              </Badge>
              {lang ? (
                <Badge className="bg-white/20 text-primary-foreground hover:bg-white/25">
                  <span className="mr-1">{lang.flag}</span> {lang.native}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:min-w-70">
          <StatPill
            icon={<Target className="h-4 w-4" />}
            label="Today's goal"
            value={`${goal} min`}
          />
          <StatPill icon={<Flame className="h-4 w-4" />} label="Streak" value="0 days" />
        </div>
      </div>
    </Card>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/12 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-primary-foreground/85">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

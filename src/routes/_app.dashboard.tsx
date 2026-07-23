import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { MODULES } from "@/lib/modules/registry";
import { useAuth } from "@/lib/auth/context";
import { Flame, Target, Clock } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumen English" },
      { name: "description", content: "Your learning overview and active modules." },
      { property: "og:title", content: "Dashboard — Lumen English" },
      { property: "og:description", content: "Your learning overview and active modules." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useAuth();
  const name = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Welcome back</span>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Hi {name} 👋</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Current streak" value="0 days" />
        <StatCard icon={<Target className="h-4 w-4" />} label="Daily goal" value={`${session?.profile?.daily_learning_time ?? 15} min`} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Time this week" value="0 min" />
      </section>

      <section>
        <Card className="overflow-hidden p-0">
          <div className="p-6" style={{ background: "var(--gradient-hero)" }}>
            <Badge className="bg-white/20 text-white hover:bg-white/25">Personalised for you</Badge>
            <h2 className="mt-3 text-xl font-semibold text-primary-foreground md:text-2xl">
              Pick your first module to begin
            </h2>
            <p className="mt-1 max-w-lg text-sm text-primary-foreground/85">
              Modules unlock focused practice with an AI coach in your native language.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Available modules</h2>
          <span className="text-xs text-muted-foreground">{MODULES.length} modules</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (<ModuleCard key={m.id} module={m} />))}
        </div>
      </section>

      <section>
        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Weekly goal</h3>
            <span className="text-xs text-muted-foreground">0 / {(session?.profile?.daily_learning_time ?? 15) * 7} min</span>
          </div>
          <Progress value={0} />
        </Card>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold">{value}</span>
      </div>
    </Card>
  );
}
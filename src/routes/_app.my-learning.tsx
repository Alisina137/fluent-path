import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { MODULES } from "@/lib/modules/registry";
import { ProgressCard } from "@/components/dashboard/ProgressCard";

export const Route = createFileRoute("/_app/my-learning")({
  head: () => ({
    meta: [
      { title: "My Learning — Lumen English" },
      { name: "description", content: "Your active modules and continue-learning items." },
      { property: "og:title", content: "My Learning — Lumen English" },
      { property: "og:description", content: "Your active modules and continue-learning items." },
    ],
  }),
  component: MyLearning,
});

function MyLearning() {
  const { session } = useAuth();
  const ownedIds = (session?.modules ?? [])
    .filter((m) => m.subscription_status === "active" || m.subscription_status === "trialing")
    .map((m) => m.module_id);
  const owned = MODULES.filter((m) => ownedIds.includes(m.id));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My learning</h1>
        <p className="text-sm text-muted-foreground">
          Continue where you left off across your active modules.
        </p>
      </header>
      {owned.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Choose your first learning module.</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Pick a module from the marketplace to start building your daily practice.
            </p>
          </div>
          <Button asChild>
            <Link to="/modules">
              <Compass className="mr-2 h-4 w-4" /> Browse marketplace
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map((m) => (
            <ProgressCard key={m.id} module={m} percent={0} />
          ))}
        </div>
      )}
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/context";
import { MODULES } from "@/lib/modules/registry";
import { findUserModule, isSubscribed } from "@/lib/modules/access";
import { SubscriptionCard } from "@/components/modules/SubscriptionCard";
import { SubscriptionSummary } from "@/components/modules/SubscriptionSummary";
import { EmptyModuleState } from "@/components/modules/EmptyModuleState";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import type { LearningModule, UserModule } from "@/lib/types";

export const Route = createFileRoute("/_app/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription — Lumen English" },
      { name: "description", content: "Manage your active learning modules and monthly plan." },
      { property: "og:title", content: "Subscription — Lumen English" },
      {
        property: "og:description",
        content: "Manage your active learning modules and monthly plan.",
      },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { session, cancelModule } = useAuth();
  const userModules = session?.modules ?? [];
  const items: { module: LearningModule; userModule: UserModule }[] = MODULES.map((module) => ({
    module,
    userModule: findUserModule(userModules, module.id),
  })).filter(
    (i): i is { module: LearningModule; userModule: UserModule } =>
      !!i.userModule && isSubscribed(i.userModule),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Your active modules, monthly total and next renewal date.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyModuleState
          title="You don't have any active modules"
          description="Subscribe to a module to start your plan. You can mix and match anytime."
          action={
            <Button asChild>
              <Link to="/modules">
                <Compass className="mr-2 h-4 w-4" /> Browse marketplace
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-3">
            {items.map(({ module, userModule }) => (
              <SubscriptionCard
                key={module.id}
                module={module}
                userModule={userModule}
                onCancel={(id) => {
                  cancelModule(id);
                  toast.success("Subscription canceled.");
                }}
              />
            ))}
          </div>
          <SubscriptionSummary items={items} />
        </div>
      )}
    </div>
  );
}

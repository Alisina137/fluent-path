import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/context";
import { MODULES } from "@/lib/modules/registry";
import { MyModuleCard } from "@/components/modules/MyModuleCard";
import { EmptyModuleState } from "@/components/modules/EmptyModuleState";
import { isSubscribed, findUserModule } from "@/lib/modules/access";
import { toast } from "sonner";

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
  const { session, markModuleOpened } = useAuth();
  const userModules = session?.modules ?? [];
  const owned = MODULES
    .filter((m) => isSubscribed(findUserModule(userModules, m.id)))
    .map((m) => ({ module: m, userModule: findUserModule(userModules, m.id)! }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My learning</h1>
        <p className="text-sm text-muted-foreground">
          Continue where you left off across your active modules.
        </p>
      </header>
      {owned.length === 0 ? (
        <EmptyModuleState
          title="Choose your first learning module"
          description="Pick a module from the marketplace to start building your daily practice."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map(({ module, userModule }) => (
            <MyModuleCard
              key={module.id}
              module={module}
              userModule={userModule}
              onOpen={(id) => {
                markModuleOpened(id);
                toast.success(`${module.name} lesson content ships soon.`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { toUserModule } from "@/lib/modules/user-module-adapter";
import { EmptyModuleState } from "@/components/modules/EmptyModuleState";
import { MyModuleCard } from "@/components/modules/MyModuleCard";
import { useModules } from "@/lib/modules/context";
import { MODULES } from "@/lib/modules/registry";

export const Route = createFileRoute("/_app/my-learning")({
  head: () => ({
    meta: [
      { title: "My Learning — Fluent Path" },
      {
        name: "description",
        content: "Your active modules and continue-learning items.",
      },
      {
        property: "og:title",
        content: "My Learning — Fluent Path",
      },
      {
        property: "og:description",
        content: "Your active modules and continue-learning items.",
      },
    ],
  }),
  component: MyLearning,
});

function MyLearning() {
  const navigate = useNavigate();

  const { modules: serverModules, isSubscribed, markModuleOpened } = useModules();
  const owned = MODULES.flatMap((module) => {
    if (!isSubscribed(module.id)) {
      return [];
    }

    const serverModule = serverModules.find((item) => item.moduleId === module.id);

    if (!serverModule) {
      return [];
    }

    const userModule = toUserModule(serverModule);

    if (!userModule) {
      return [];
    }

    return [
      {
        module,
        userModule,
      },
    ];
  });

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
                void markModuleOpened(id);

                if (id === "speaking") {
                  void navigate({ to: "/speaking" });
                  return;
                }

                if (id === "writing") {
                  void navigate({ to: "/writing" });
                  return;
                }

                if (id === "vocabulary") {
                  void navigate({ to: "/vocabulary" });
                  return;
                }

                toast.info(`${module.name} lesson content is not available yet.`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

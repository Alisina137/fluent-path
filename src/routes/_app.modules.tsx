import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { toUserModules } from "@/lib/modules/user-module-adapter";

import {
  FilterPanel,
  type CategoryFilter,
  type DifficultyFilter,
} from "@/components/modules/FilterPanel";
import { MarketplaceGrid } from "@/components/modules/MarketplaceGrid";
import { ModulePreview } from "@/components/modules/ModulePreview";
import { SearchBar } from "@/components/modules/SearchBar";
import { useAuth } from "@/lib/auth/context";
import { useModules } from "@/lib/modules/context";
import { MODULES, getModule } from "@/lib/modules/registry";

export const Route = createFileRoute("/_app/modules")({
  head: () => ({
    meta: [
      { title: "Module marketplace — Fluent Path" },
      {
        name: "description",
        content: "Browse every English learning module and pick the ones you need.",
      },
      {
        property: "og:title",
        content: "Module marketplace — Fluent Path",
      },
      {
        property: "og:description",
        content: "Browse every English learning module and pick the ones you need.",
      },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const { session } = useAuth();

  const { modules: serverModules, subscribeModule, renewModule, markModuleOpened } = useModules();

  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const userModules = toUserModules(serverModules);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MODULES.filter((module) => {
      if (category !== "all" && module.category !== category) {
        return false;
      }

      if (
        difficulty !== "all" &&
        module.difficulty !== difficulty &&
        module.difficulty !== "all_levels"
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        module.name.toLowerCase().includes(q) ||
        module.tagline.toLowerCase().includes(q) ||
        module.description.toLowerCase().includes(q)
      );
    });
  }, [query, category, difficulty]);

  const activeModule = previewId ? (getModule(previewId) ?? null) : null;

  async function handleSubscribe(id: Parameters<typeof subscribeModule>[0]) {
    if (!session?.user) {
      toast.error("Please sign in before subscribing.");
      return;
    }

    try {
      await subscribeModule(id);
      toast.success("Subscribed. Find it under My Learning.");
    } catch {
      toast.error("The module could not be activated.");
    }
  }

  async function handleRenew(id: Parameters<typeof renewModule>[0]) {
    try {
      await renewModule(id);
      toast.success("Subscription renewed.");
    } catch {
      toast.error("The subscription could not be renewed.");
    }
  }

  function handleOpenModule(id: Parameters<typeof markModuleOpened>[0]) {
    void markModuleOpened(id);

    if (id === "speaking") {
      setPreviewId(null);
      void navigate({ to: "/speaking" });
      return;
    }

    if (id === "writing") {
      setPreviewId(null);
      void navigate({ to: "/writing" });
      return;
    }

    setPreviewId(null);
    void navigate({ to: "/my-learning" });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Module marketplace</h1>

        <p className="text-sm text-muted-foreground">
          Browse every learning module. Mix and match to build your plan.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <SearchBar value={query} onChange={setQuery} />

        <div className="text-xs text-muted-foreground lg:self-center">
          Showing {filtered.length} of {MODULES.length}
        </div>
      </div>

      <FilterPanel
        category={category}
        onCategoryChange={setCategory}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      <MarketplaceGrid
        modules={filtered}
        userModules={userModules}
        onOpen={(id) => setPreviewId(id)}
        onSubscribe={handleSubscribe}
        onOpenModule={handleOpenModule}
        onRenew={handleRenew}
        onNotify={() => toast.success("We'll let you know when it launches.")}
      />

      <ModulePreview
        module={activeModule}
        userModule={
          activeModule
            ? userModules.find((module) => module.module_id === activeModule.id)
            : undefined
        }
        open={!!activeModule}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewId(null);
          }
        }}
        onSubscribe={handleSubscribe}
        onOpen={handleOpenModule}
        onRenew={handleRenew}
        onNotify={() => toast.success("We'll let you know when it launches.")}
      />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MODULES, getModule } from "@/lib/modules/registry";
import { MarketplaceGrid } from "@/components/modules/MarketplaceGrid";
import { SearchBar } from "@/components/modules/SearchBar";
import {
  FilterPanel,
  type CategoryFilter,
  type DifficultyFilter,
} from "@/components/modules/FilterPanel";
import { ModulePreview } from "@/components/modules/ModulePreview";
import { useAuth } from "@/lib/auth/context";

export const Route = createFileRoute("/_app/modules")({
  head: () => ({
    meta: [
      { title: "Module marketplace — Lumen English" },
      { name: "description", content: "Browse every English learning module and pick the ones you need." },
      { property: "og:title", content: "Module marketplace — Lumen English" },
      { property: "og:description", content: "Browse every English learning module and pick the ones you need." },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const ownedIds = (session?.modules ?? [])
    .filter((m) => m.subscription_status === "active" || m.subscription_status === "trialing")
    .map((m) => m.module_id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODULES.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (
        difficulty !== "all" &&
        m.difficulty !== difficulty &&
        m.difficulty !== "all_levels"
      )
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [query, category, difficulty]);

  const activeModule = previewId ? (getModule(previewId) ?? null) : null;

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
        activeIds={ownedIds}
        onOpen={(id) => setPreviewId(id)}
      />

      <ModulePreview
        module={activeModule}
        open={!!activeModule}
        onOpenChange={(o) => !o && setPreviewId(null)}
      />
    </div>
  );
}
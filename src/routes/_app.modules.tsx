import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { MODULES } from "@/lib/modules/registry";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LearningModule } from "@/lib/types";

export const Route = createFileRoute("/_app/modules")({
  head: () => ({
    meta: [
      { title: "Modules — Lumen English" },
      { name: "description", content: "Browse and subscribe to English learning modules." },
      { property: "og:title", content: "Modules — Lumen English" },
      { property: "og:description", content: "Browse and subscribe to English learning modules." },
    ],
  }),
  component: ModulesPage,
});

type Filter = "all" | LearningModule["category"];

function ModulesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const list = MODULES.filter((m) => filter === "all" || m.category === filter);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Modules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscribe to any combination — mix and match to build your plan.
        </p>
      </div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="exam">Exam</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (<ModuleCard key={m.id} module={m} />))}
      </div>
    </div>
  );
}
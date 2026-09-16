import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toUserModule } from "@/lib/modules/user-module-adapter";
import { AssessmentCard } from "@/components/assessment/AssessmentCard";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { TodayPlan } from "@/components/dashboard/TodayPlan";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { ModulePreview } from "@/components/modules/ModulePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { latestResult } from "@/lib/assessment/storage";
import { useAuth } from "@/lib/auth/context";
import { useModules } from "@/lib/modules/context";
import { recommendModules } from "@/lib/modules/recommend";
import { MODULES, getModule } from "@/lib/modules/registry";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fluent Path" },
      {
        name: "description",
        content: "Your learning overview, today's plan and recommended modules.",
      },
      {
        property: "og:title",
        content: "Dashboard — Fluent Path",
      },
      {
        property: "og:description",
        content: "Your learning overview, today's plan and recommended modules.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useAuth();

  const { modules: serverModules, isSubscribed, markModuleOpened } = useModules();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [assessmentResult, setAssessmentResult] = useState<ReturnType<typeof latestResult>>(null);

  useEffect(() => {
    setAssessmentResult(latestResult());
  }, []);

  const goals = session?.profile?.learning_goals;
  const level = session?.profile?.english_level ?? null;

  const ownedIds = MODULES.filter((module) => isSubscribed(module.id)).map((module) => module.id);

  const recommendations = useMemo(
    () =>
      recommendModules({
        goals: goals ?? [],
        level,
        ownedIds,
        limit: 3,
      }),
    [goals, level, ownedIds],
  );

  const activeModule = previewId ? (getModule(previewId) ?? null) : null;

  const ownedModules = MODULES.filter((module) => ownedIds.includes(module.id));

  const activeServerModule = activeModule
    ? serverModules.find((module) => module.moduleId === activeModule.id)
    : undefined;

  const activeUserModule = activeServerModule
    ? (toUserModule(activeServerModule) ?? undefined)
    : undefined;

  function handleOpenModule(id: Parameters<typeof markModuleOpened>[0]) {
    void markModuleOpened(id);
    setPreviewId(null);

    if (id === "speaking") {
      void navigate({ to: "/speaking" });
      return;
    }

    if (id === "writing") {
      void navigate({ to: "/writing" });
      return;
    }

    void navigate({ to: "/my-learning" });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <WelcomeHero />

      <AssessmentCard result={assessmentResult} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TodayPlan />

        <Card className="flex flex-col gap-3 p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Compass className="h-3.5 w-3.5" />
            Where to next
          </div>

          <h3 className="text-lg font-semibold tracking-tight">
            {ownedModules.length === 0
              ? "Choose your first learning module."
              : "Keep your streak going."}
          </h3>

          <p className="text-sm text-muted-foreground">
            {ownedModules.length === 0
              ? "Modules unlock focused practice with an AI coach in your native language."
              : "Jump back into your active modules or explore something new."}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/modules">Browse marketplace</Link>
            </Button>

            {ownedModules.length > 0 ? (
              <Button asChild variant="outline">
                <Link to="/my-learning">My learning</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </div>

      <DashboardSection
        title="Recommended for you"
        description="Based on your goals and current English level."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/modules">See all</Link>
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.module.id}
              module={recommendation.module}
              reason={recommendation.reason}
              onOpen={(id) => setPreviewId(id)}
            />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Learning progress"
        description="Track how far you've come across every module."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <ProgressCard
              key={module.id}
              module={module}
              percent={0}
              onOpen={(id) => setPreviewId(id)}
            />
          ))}
        </div>
      </DashboardSection>

      <ModulePreview
        module={activeModule}
        userModule={activeUserModule}
        open={!!activeModule}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewId(null);
          }
        }}
        onOpen={handleOpenModule}
      />
    </div>
  );
}

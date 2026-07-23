import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Lumen English" },
      { name: "description", content: "Track your English learning progress over time." },
      { property: "og:title", content: "Progress — Lumen English" },
      { property: "og:description", content: "Track your English learning progress over time." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Progress</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {["Speaking", "Writing", "Vocabulary", "Listening"].map((skill) => (
          <Card key={skill} className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{skill}</span>
              <span className="text-xs text-muted-foreground">0%</span>
            </div>
            <Progress value={0} />
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Detailed analytics unlock once you activate learning modules.
      </p>
    </div>
  );
}
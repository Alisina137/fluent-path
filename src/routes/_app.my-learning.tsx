import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

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
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My Learning</h1>
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Nothing here yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Activate a module to start tracking your learning here.
          </p>
        </div>
        <Button asChild><Link to="/modules">Browse modules</Link></Button>
      </Card>
    </div>
  );
}
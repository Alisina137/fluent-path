import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { BookOpen, Compass } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyModuleState({
  title = "No modules yet",
  description = "Pick a module from the marketplace to start building your daily practice.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <BookOpen className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action ?? (
        <Button asChild>
          <Link to="/modules">
            <Compass className="mr-2 h-4 w-4" /> Browse marketplace
          </Link>
        </Button>
      )}
    </Card>
  );
}
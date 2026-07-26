import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Sparkles } from "lucide-react";
import type { AssessmentResult } from "@/lib/types";
import { LevelBadge } from "./LevelBadge";
import { formatRelativeDate } from "@/lib/modules/access";

export function AssessmentCard({
  result,
  variant = "default",
}: {
  result: AssessmentResult | null;
  variant?: "default" | "compact";
}) {
  if (!result) {
    return (
      <Card className="flex flex-col gap-3 border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Placement test
        </div>
        <h3 className="text-lg font-semibold tracking-tight">
          Find your English level in 10 minutes.
        </h3>
        <p className="text-sm text-muted-foreground">
          Take a short placement test to unlock personalised module
          recommendations across vocabulary, grammar, reading and listening.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/assessment">Start assessment</Link>
          </Button>
          {variant === "default" ? (
            <Button asChild variant="outline">
              <Link to="/modules">Explore modules</Link>
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <ClipboardCheck className="h-3.5 w-3.5" /> Latest assessment
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <LevelBadge level={result.estimated_level} size="lg" />
        <Badge variant="outline">Overall {result.overall_percentage}%</Badge>
        <Badge variant="secondary">
          Confidence {result.confidence}%
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Completed {formatRelativeDate(result.completed_at)}.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/assessment">Retake assessment</Link>
        </Button>
      </div>
    </Card>
  );
}
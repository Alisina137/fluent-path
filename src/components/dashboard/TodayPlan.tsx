import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Lock, Sparkles } from "lucide-react";

type Status = "not_started" | "in_progress" | "locked" | "done";

interface Task {
  title: string;
  subtitle: string;
  status: Status;
}

const TASKS: Task[] = [
  { title: "Vocabulary", subtitle: "10 new words", status: "not_started" },
  { title: "Speaking Practice", subtitle: "5-min AI chat", status: "locked" },
  { title: "Grammar", subtitle: "Present perfect", status: "locked" },
  { title: "Reading", subtitle: "Short article", status: "locked" },
];

export function TodayPlan() {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Today's plan
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">What to do today</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A short daily plan personalised to your goals.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">Preview</Badge>
      </div>
      <ul className="mt-5 flex flex-col gap-2">
        {TASKS.map((t) => (
          <li
            key={t.title}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3"
          >
            <TaskIcon status={t.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{t.title}</div>
              <div className="truncate text-xs text-muted-foreground">{t.subtitle}</div>
            </div>
            <StatusLabel status={t.status} />
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-end">
        <Button size="sm" variant="outline" disabled>
          Start today's plan
        </Button>
      </div>
    </Card>
  );
}

function TaskIcon({ status }: { status: Status }) {
  if (status === "done") return <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />;
  if (status === "locked") return <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />;
  return <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />;
}

function StatusLabel({ status }: { status: Status }) {
  const map: Record<Status, { label: string; variant: "default" | "outline" | "secondary" }> = {
    not_started: { label: "Not started", variant: "secondary" },
    in_progress: { label: "In progress", variant: "default" },
    locked: { label: "Locked", variant: "outline" },
    done: { label: "Done", variant: "default" },
  };
  const cfg = map[status];
  return (
    <Badge variant={cfg.variant} className="shrink-0 text-[10px]">
      {cfg.label}
    </Badge>
  );
}
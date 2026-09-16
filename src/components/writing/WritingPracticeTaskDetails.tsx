import { ArrowLeft, Clock3, FileText, Loader2, PenLine, Target, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWritingPracticeLibraryServerFn } from "@/lib/writing/practice-library-functions";

type PracticeLibraryResult = Awaited<ReturnType<typeof getWritingPracticeLibraryServerFn>>;

type PracticeTask = PracticeLibraryResult["tasks"][number];

interface WritingPracticeTaskDetailsProps {
  task: PracticeTask;
  isStarting: boolean;
  onBack: () => void;
  onStart: (taskId: string) => Promise<void>;
}

function formatWritingType(value: string): string {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getWordGoal(task: PracticeTask): string | null {
  if (task.minWords !== null && task.maxWords !== null) {
    return `${task.minWords}-${task.maxWords} words`;
  }

  if (task.minWords !== null) {
    return `At least ${task.minWords} words`;
  }

  if (task.maxWords !== null) {
    return `Up to ${task.maxWords} words`;
  }

  return null;
}

export function WritingPracticeTaskDetails({
  task,
  isStarting,
  onBack,
  onStart,
}: WritingPracticeTaskDetailsProps) {
  const wordGoal = getWordGoal(task);

  return (
    <section className="space-y-4" aria-labelledby="practice-task-heading">
      <Button
        type="button"
        variant="ghost"
        className="-ml-3"
        disabled={isStarting}
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" />
        Back to practice library
      </Button>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">CEFR {task.cefrLevel}</Badge>

            <Badge variant="outline">{task.category}</Badge>

            <Badge variant="outline">{formatWritingType(task.writingType)}</Badge>
          </div>

          <div>
            <CardTitle id="practice-task-heading" className="text-xl leading-7 sm:text-2xl">
              {task.title}
            </CardTitle>

            {task.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {task.description}
              </p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-muted/30 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" aria-hidden="true" />

              <h3 className="font-semibold">Your writing task</h3>
            </div>

            <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-7">
              {task.prompt}
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <PenLine className="size-4" aria-hidden="true" />
                Writing type
              </dt>

              <dd className="mt-2 text-sm font-medium">{formatWritingType(task.writingType)}</dd>
            </div>

            {wordGoal ? (
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Target className="size-4" aria-hidden="true" />
                  Word target
                </dt>

                <dd className="mt-2 text-sm font-medium">{wordGoal}</dd>
              </div>
            ) : null}

            {task.estimatedMinutes !== null ? (
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock3 className="size-4" aria-hidden="true" />
                  Estimated time
                </dt>

                <dd className="mt-2 text-sm font-medium">About {task.estimatedMinutes} minutes</dd>
              </div>
            ) : null}

            {task.audience ? (
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="size-4" aria-hidden="true" />
                  Audience
                </dt>

                <dd className="mt-2 text-sm font-medium">{task.audience}</dd>
              </div>
            ) : null}

            {task.purpose ? (
              <div className="rounded-lg border p-3">
                <dt className="text-xs font-medium text-muted-foreground">Purpose</dt>

                <dd className="mt-2 text-sm font-medium">{task.purpose}</dd>
              </div>
            ) : null}

            {task.tone ? (
              <div className="rounded-lg border p-3">
                <dt className="text-xs font-medium text-muted-foreground">Tone</dt>

                <dd className="mt-2 text-sm font-medium">{task.tone}</dd>
              </div>
            ) : null}
          </dl>

          <div className="rounded-xl border bg-card p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h3 className="font-semibold">Ready to practice?</h3>

              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Start with your own draft. When you are ready, the Writing Coach can evaluate it and
                explain how to improve it.
              </p>
            </div>

            <Button
              type="button"
              className="mt-4 w-full sm:mt-0 sm:w-auto"
              disabled={isStarting}
              onClick={() => {
                void onStart(task.id);
              }}
            >
              {isStarting ? (
                <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <PenLine aria-hidden="true" />
              )}

              {isStarting ? "Starting..." : "Start writing"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

import { BookOpenCheck, PenLine, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WritingCoachScreen() {
  return (
    <main className="space-y-6" aria-labelledby="writing-coach-heading">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <PenLine className="size-5" aria-hidden="true" />
          <span className="text-sm font-medium">AI Writing Coach</span>
        </div>

        <h1
          id="writing-coach-heading"
          className="text-2xl font-semibold tracking-tight md:text-3xl"
        >
          Improve your English writing through practice
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Write in English, understand your mistakes, revise your work, and track how your writing
          improves over time.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Writing Coach learning workflow">
        <Card>
          <CardHeader>
            <PenLine className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Write first</CardTitle>
          </CardHeader>

          <CardContent className="text-sm leading-6 text-muted-foreground">
            Start from a writing task or your own idea and create the first draft yourself.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpenCheck className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Understand feedback</CardTitle>
          </CardHeader>

          <CardContent className="text-sm leading-6 text-muted-foreground">
            Learn from feedback on grammar, vocabulary, organization, task achievement, and writing
            mechanics.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Revise and improve</CardTitle>
          </CardHeader>

          <CardContent className="text-sm leading-6 text-muted-foreground">
            Revise your writing and compare later submissions to see measurable improvement.
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="py-6">
          <h2 className="font-semibold">Writing practice is being prepared</h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your Writing Coach workspace is ready. Writing sessions, draft saving, evaluation,
            revision, and progress tools will be connected as we build the next parts of the module.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

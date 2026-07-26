import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ClipboardCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  availableSkills,
  buildQuestionList,
  finalizeAttempt,
  newAttempt,
  recordAnswer,
} from "@/lib/assessment/engine";
import { LISTENING_CLIPS } from "@/lib/assessment/questions";
import { ASSESSMENT_SECTIONS, SKILL_LABELS } from "@/lib/assessment/sections";
import { saveAttempt, latestResult } from "@/lib/assessment/storage";
import { QuestionCard, type AnswerValue } from "@/components/assessment/QuestionCard";
import { ProgressTracker } from "@/components/assessment/ProgressTracker";
import { AudioPlayer } from "@/components/assessment/AudioPlayer";
import { SkillScoreCard } from "@/components/assessment/SkillScoreCard";
import { ResultSummary } from "@/components/assessment/ResultSummary";
import { SectionList } from "@/components/assessment/SectionList";
import { getModule } from "@/lib/modules/registry";
import type {
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentResult,
  SkillId,
} from "@/lib/types";

export const Route = createFileRoute("/_app/assessment")({
  head: () => ({
    meta: [
      { title: "English Assessment — Lumen English" },
      { name: "description", content: "Take a placement test across vocabulary, grammar, reading and listening." },
      { property: "og:title", content: "English Assessment — Lumen English" },
      { property: "og:description", content: "Estimate your CEFR level and get module recommendations." },
    ],
  }),
  component: AssessmentPage,
});

type Phase = "intro" | "run" | "results";

function AssessmentPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>(() => (latestResult() ? "results" : "intro"));
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [selected, setSelected] = useState<SkillId[]>(() => availableSkills());
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [current, setCurrent] = useState(0);
  const [value, setValue] = useState<AnswerValue>(null);
  const [result, setResult] = useState<AssessmentResult | null>(() => latestResult());

  const questions = useMemo(() => (attempt ? buildQuestionList(attempt.section_ids) : []), [attempt]);
  const q = questions[current];

  function start() {
    if (!session) {
      navigate({ to: "/signup" });
      return;
    }
    if (!selected.length) return;
    const a = newAttempt(session.user.id, selected);
    setAttempt(a);
    setAnswers([]);
    setCurrent(0);
    setValue(null);
    setPhase("run");
  }

  function submitAnswer() {
    if (!q || !attempt) return;
    const next = [...answers, recordAnswer(q, value)];
    if (current + 1 >= questions.length) {
      const { attempt: finished, result: r } = finalizeAttempt(attempt, next);
      saveAttempt(finished, r);
      setResult(r);
      setPhase("results");
    } else {
      setAnswers(next);
      setCurrent(current + 1);
      setValue(null);
    }
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card
          className="flex flex-col gap-3 border-primary/20 p-6"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/80">
            <Sparkles className="h-3.5 w-3.5" /> English Assessment
          </div>
          <h1 className="text-2xl font-semibold text-primary-foreground">
            Find your English level in about 10–15 minutes.
          </h1>
          <p className="text-sm text-primary-foreground/80">
            This placement test evaluates vocabulary, grammar, reading and listening.
            Speaking and writing are coming soon.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-primary-foreground">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> 10–15 min
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <ClipboardCheck className="h-3 w-3" /> No prior setup
            </Badge>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Choose sections</h2>
            <p className="text-sm text-muted-foreground">
              Pick the skills you want to be assessed on today.
            </p>
          </div>
          <SectionList
            selected={selected}
            onToggle={(id) =>
              setSelected((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild variant="ghost">
              <Link to="/dashboard">Skip for now</Link>
            </Button>
            <Button onClick={start} disabled={selected.length === 0}>
              Start assessment
            </Button>
          </div>
        </Card>

        {result ? (
          <Card className="flex flex-col gap-3 p-6">
            <div className="text-xs font-medium text-primary">Previous attempt</div>
            <p className="text-sm text-muted-foreground">
              Your latest estimated level was{" "}
              <span className="font-semibold text-foreground">
                {result.estimated_level.toUpperCase()}
              </span>{" "}
              at {result.overall_percentage}%.
            </p>
            <div>
              <Button variant="outline" onClick={() => setPhase("results")}>
                View last results
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    );
  }

  if (phase === "run" && q) {
    const clip =
      q.skill === "listening"
        ? LISTENING_CLIPS.find((c) =>
            q.prompt.startsWith("Clip 1") ? c.id === "l-c1" : c.id === "l-c2",
          )
        : null;
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <ProgressTracker current={current} total={questions.length} skill={q.skill} />
        <QuestionCard
          question={q}
          value={value}
          onChange={setValue}
          onSubmit={submitAnswer}
          showAudio={clip ? <AudioPlayer clip={clip} /> : undefined}
        />
        <div className="text-center text-xs text-muted-foreground">
          Section: {SKILL_LABELS[q.skill]}
        </div>
      </div>
    );
  }

  if (phase === "results" && result) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <ResultSummary result={result} />
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Skill breakdown</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {result.scores.map((s) => (
              <SkillScoreCard key={s.skill} score={s} />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-2 p-5">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Strengths
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.strengths.length
                ? result.strengths.map((s) => SKILL_LABELS[s]).join(", ")
                : "Keep practising — strengths will appear as your scores rise."}
            </p>
          </Card>
          <Card className="flex flex-col gap-2 p-5">
            <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Focus areas
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.weaknesses.length
                ? result.weaknesses.map((s) => SKILL_LABELS[s]).join(", ")
                : "No significant weaknesses detected. Great job!"}
            </p>
          </Card>
        </div>

        {result.recommended_module_ids.length ? (
          <Card className="flex flex-col gap-3 p-5">
            <h3 className="text-sm font-semibold">Recommended modules</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {result.recommended_module_ids.map((id) => {
                const m = getModule(id);
                if (!m) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.tagline}</div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/modules">View</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setPhase("intro")}>Retake assessment</Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssessmentQuestion } from "@/lib/types";

export type AnswerValue = string | number | boolean | null;

export function QuestionCard({
  question,
  value,
  onChange,
  onSubmit,
  showAudio,
}: {
  question: AssessmentQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  onSubmit: () => void;
  showAudio?: React.ReactNode;
}) {
  const canSubmit = useMemo(() => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  }, [value]);

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="capitalize">{question.difficulty}</Badge>
        <Badge variant="secondary" className="capitalize">
          {question.type.replace(/_/g, " ")}
        </Badge>
      </div>
      {showAudio}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{question.prompt}</h3>
        {question.type === "synonym" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Word: <span className="font-semibold text-foreground">{question.word}</span>
          </p>
        ) : null}
      </div>
      <Body question={question} value={value} onChange={onChange} />
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={!canSubmit}>Submit answer</Button>
      </div>
    </Card>
  );
}

function Body({
  question,
  value,
  onChange,
}: {
  question: AssessmentQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  switch (question.type) {
    case "multiple_choice":
    case "synonym":
    case "sentence_correction":
      return (
        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                value === i
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:bg-secondary",
              )}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm">{opt}</span>
            </button>
          ))}
        </div>
      );
    case "true_false":
      return (
        <div className="grid grid-cols-2 gap-2">
          {[{ label: "True", v: true }, { label: "False", v: false }].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.v)}
              className={cn(
                "rounded-xl border p-3 text-center text-sm font-medium transition",
                value === o.v
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    case "fill_blank":
      return (
        <Input
          placeholder="Type your answer"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      );
    case "match":
      return <Match question={question} value={value} onChange={onChange} />;
  }
}

function Match({
  question,
  value,
  onChange,
}: {
  question: Extract<AssessmentQuestion, { type: "match" }>;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  const [pairs, setPairs] = useState<Record<string, string>>(() => {
    if (typeof value === "string") {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return {};
  });
  const options = useMemo(
    () => [...question.pairs.map((p) => p.right)].sort(),
    [question.pairs],
  );
  useEffect(() => { onChange(JSON.stringify(pairs)); }, [pairs, onChange]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.pairs.map((p) => (
        <div key={p.left} className="flex items-center gap-2 rounded-xl border p-3">
          <span className="min-w-[6rem] text-sm font-medium">{p.left}</span>
          <select
            className="flex-1 rounded-md border bg-background p-2 text-sm"
            value={pairs[p.left] ?? ""}
            onChange={(e) => setPairs((prev) => ({ ...prev, [p.left]: e.target.value }))}
          >
            <option value="">Choose…</option>
            {options.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
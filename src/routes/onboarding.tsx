import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { NATIVE_LANGUAGES } from "@/lib/i18n/languages";
import type { EnglishLevel, LearningGoal, DailyLearningTime } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Lumen English" },
      { name: "description", content: "Tell us about your English goals to personalise your plan." },
      { property: "og:title", content: "Set up your profile — Lumen English" },
      { property: "og:description", content: "Personalise your English learning plan." },
    ],
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("ael.session.v1");
    if (!raw) throw redirect({ to: "/signup" });
  },
  component: OnboardingPage,
});

const LEVELS: { value: EnglishLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Just starting" },
  { value: "elementary", label: "Elementary", hint: "Basic sentences" },
  { value: "intermediate", label: "Intermediate", hint: "Everyday conversations" },
  { value: "upper", label: "Upper-intermediate", hint: "Complex topics" },
  { value: "advanced", label: "Advanced", hint: "Fluent and precise" },
];

const GOALS: { value: LearningGoal; label: string }[] = [
  { value: "career", label: "Career" },
  { value: "business", label: "Business" },
  { value: "ielts", label: "IELTS" },
  { value: "interview", label: "Interviews" },
  { value: "academic", label: "Academic" },
  { value: "travel", label: "Travel" },
  { value: "daily", label: "Daily life" },
  { value: "culture", label: "Culture & media" },
];

const TIMES: DailyLearningTime[] = [5, 10, 15, 30, 60];

function OnboardingPage() {
  const { updateProfile, updateLanguage, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [langCode, setLangCode] = useState("en");
  const [level, setLevel] = useState<EnglishLevel>("intermediate");
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [time, setTime] = useState<DailyLearningTime>(15);

  const total = 4;
  const progress = ((step + 1) / total) * 100;

  function toggleGoal(g: LearningGoal) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function finish() {
    const lang = NATIVE_LANGUAGES.find((l) => l.code === langCode)!;
    updateLanguage({
      native_language: lang.name,
      native_language_code: lang.code,
      translation_enabled: lang.code !== "en",
      preferred_translation_mode: "on_tap",
    });
    updateProfile({
      english_level: level,
      learning_goals: goals,
      daily_learning_time: time,
    });
    completeOnboarding();
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--gradient-subtle)" }}>
      <Card className="w-full max-w-xl p-6">
        <div className="mb-6">
          <Progress value={progress} />
          <p className="mt-2 text-xs text-muted-foreground">Step {step + 1} of {total}</p>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold tracking-tight">What's your native language?</h1>
            <p className="text-sm text-muted-foreground">We'll translate lessons and explanations into your language.</p>
            <Select value={langCode} onValueChange={setLangCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NATIVE_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.native} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold tracking-tight">Your English level</h1>
            <div className="grid gap-2">
              {LEVELS.map((l) => (
                <button key={l.value} type="button" onClick={() => setLevel(l.value)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${level === l.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                  <div>
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="text-xs text-muted-foreground">{l.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold tracking-tight">What are your goals?</h1>
            <p className="text-sm text-muted-foreground">Pick as many as you like.</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const active = goals.includes(g.value);
                return (
                  <button key={g.value} type="button" onClick={() => toggleGoal(g.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold tracking-tight">Daily learning time</h1>
            <div className="grid grid-cols-5 gap-2">
              {TIMES.map((t) => (
                <button key={t} type="button" onClick={() => setTime(t)}
                  className={`rounded-lg border p-3 text-sm font-medium transition ${time === t ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                  {t}m
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Consistency beats intensity</Badge>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
          {step < total - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button onClick={finish}>Enter dashboard</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
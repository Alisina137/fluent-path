import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/brand/Logo";
import { LanguageSelector } from "@/components/profile/LanguageSelector";
import { EnglishLevelSelector } from "@/components/profile/EnglishLevelSelector";
import { GoalSelector } from "@/components/profile/GoalSelector";
import { TimeSelector } from "@/components/profile/TimeSelector";
import { PreferenceSelector } from "@/components/profile/PreferenceSelector";
import { useAuth } from "@/lib/auth/context";
import { NATIVE_LANGUAGES } from "@/lib/i18n/languages";
import {
  DAILY_TIMES,
  LEARNING_GOALS,
  goalLabel,
  levelLabel,
  styleLabel,
} from "@/lib/onboarding/options";
import type { DailyLearningTime, EnglishLevel, LearningGoal, LearningStyle } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Lumen English" },
      {
        name: "description",
        content: "Tell us about your English goals to personalise your plan.",
      },
      { property: "og:title", content: "Set up your profile — Lumen English" },
      { property: "og:description", content: "Personalise your English learning plan." },
    ],
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("ael.session.v1");
    if (!raw) throw redirect({ to: "/signup" });
    try {
      const parsed = JSON.parse(raw) as {
        onboarded?: boolean;
        profile?: { onboarding_completed?: boolean };
      };
      if (parsed.onboarded || parsed.profile?.onboarding_completed) {
        throw redirect({ to: "/dashboard" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
    }
  },
  component: OnboardingWizard,
});

const TOTAL_STEPS = 7;

function OnboardingWizard() {
  const { session, updateProfile, updateLanguage, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [langCode, setLangCode] = useState<string>("en");
  const [level, setLevel] = useState<EnglishLevel | null>(null);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [time, setTime] = useState<DailyLearningTime>(15);
  const [styles, setStyles] = useState<LearningStyle[]>([]);

  const progress = (step / TOTAL_STEPS) * 100;

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    const lang = NATIVE_LANGUAGES.find((l) => l.code === langCode) ?? NATIVE_LANGUAGES[0];
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
      learning_preferences: styles,
    });
    await completeOnboarding();
    await navigate({ to: "/dashboard" });
  }

  async function finishAndAssess() {
    const lang = NATIVE_LANGUAGES.find((l) => l.code === langCode) ?? NATIVE_LANGUAGES[0];
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
      learning_preferences: styles,
    });
    await completeOnboarding();
    await navigate({ to: "/assessment" });
  }

  const canContinue =
    step === 1 ||
    (step === 2 && !!langCode) ||
    (step === 3 && !!level) ||
    (step === 4 && goals.length > 0) ||
    (step === 5 && !!time) ||
    step === 6 ||
    step === 7;

  const isSkippable = step === 6; // preferences optional

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "var(--gradient-subtle)" }}
    >
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b p-6 pb-4">
            <Progress value={progress} className="h-1.5" />
          </div>

          <div className="min-h-90 p-6 md:p-8">
            {step === 1 && <StepWelcome name={session?.user.name} />}
            {step === 2 && (
              <StepShell
                title="What's your native language?"
                subtitle="We'll translate lessons and explanations into your language."
              >
                <LanguageSelector value={langCode} onChange={setLangCode} />
              </StepShell>
            )}
            {step === 3 && (
              <StepShell
                title="Your English level"
                subtitle="Pick the CEFR level that best describes you today."
              >
                <EnglishLevelSelector value={level} onChange={setLevel} />
              </StepShell>
            )}
            {step === 4 && (
              <StepShell
                title="What are your goals?"
                subtitle="Pick as many as you like — we'll suggest matching modules."
              >
                <GoalSelector value={goals} onChange={setGoals} />
              </StepShell>
            )}
            {step === 5 && (
              <StepShell
                title="How much time can you commit each day?"
                subtitle="Consistency beats intensity."
              >
                <TimeSelector value={time} onChange={setTime} />
              </StepShell>
            )}
            {step === 6 && (
              <StepShell
                title="How do you like to learn?"
                subtitle="Optional. Choose the styles that work for you."
              >
                <PreferenceSelector value={styles} onChange={setStyles} />
              </StepShell>
            )}
            {step === 7 && (
              <StepSummary
                langCode={langCode}
                level={level}
                goals={goals}
                time={time}
                styles={styles}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t bg-secondary/40 p-4">
            <Button variant="ghost" onClick={back} disabled={step === 1}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {isSkippable && (
                <Button variant="ghost" onClick={next}>
                  Skip
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button onClick={next} disabled={!canContinue}>
                  Continue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={finishAndAssess}>
                    <ClipboardCheck className="mr-1.5 h-4 w-4" />
                    Take placement test
                  </Button>
                  <Button onClick={finish}>
                    Start learning
                    <Check className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StepWelcome({ name }: { name?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Sparkles className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome{name ? `, ${name.split(" ")[0]}` : ""} to your AI English learning journey
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A modular English coach that adapts to how you learn.
        </p>
      </div>
      <ul className="mt-4 grid w-full gap-2 text-left sm:grid-cols-3">
        <FeatureBullet title="Personalised" text="Lessons tuned to your level and goals." />
        <FeatureBullet title="AI-powered" text="Practice with instant feedback anytime." />
        <FeatureBullet title="Modular" text="Pick only the skills you want to improve." />
      </ul>
    </div>
  );
}

function FeatureBullet({ title, text }: { title: string; text: string }) {
  return (
    <li className="rounded-xl border bg-card p-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{text}</div>
    </li>
  );
}

function StepSummary({
  langCode,
  level,
  goals,
  time,
  styles,
}: {
  langCode: string;
  level: EnglishLevel | null;
  goals: LearningGoal[];
  time: DailyLearningTime;
  styles: LearningStyle[];
}) {
  const lang = NATIVE_LANGUAGES.find((l) => l.code === langCode);
  const timeLabel = DAILY_TIMES.find((t) => t.value === time)?.label ?? `${time} min`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Your English profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your plan. You can change any of this later in Settings.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryRow label="Native language" value={lang ? `${lang.flag} ${lang.native}` : "—"} />
        <SummaryRow label="Current level" value={levelLabel(level)} />
        <SummaryRow label="Daily commitment" value={timeLabel} />
        <SummaryRow
          label="Learning styles"
          value={styles.length ? styles.map(styleLabel).join(", ") : "Any"}
        />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Goals</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {goals.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
          {goals.map((g) => (
            <Badge key={g} variant="secondary">
              {LEARNING_GOALS.find((x) => x.value === g)?.icon} {goalLabel(g)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

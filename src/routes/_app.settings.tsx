import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageSelector } from "@/components/profile/LanguageSelector";
import { EnglishLevelSelector } from "@/components/profile/EnglishLevelSelector";
import { GoalSelector } from "@/components/profile/GoalSelector";
import { TimeSelector } from "@/components/profile/TimeSelector";
import { PreferenceSelector } from "@/components/profile/PreferenceSelector";
import { useAuth } from "@/lib/auth/context";
import { NATIVE_LANGUAGES } from "@/lib/i18n/languages";
import type {
  DailyLearningTime,
  EnglishLevel,
  LearningGoal,
  LearningStyle,
  TranslationMode,
} from "@/lib/types";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lumen English" },
      { name: "description", content: "Update your account, language and learning preferences." },
      { property: "og:title", content: "Settings — Lumen English" },
      {
        property: "og:description",
        content: "Manage your learning profile and translation settings.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session, updateUser, updateProfile, updateLanguage } = useAuth();

  const [name, setName] = useState(session?.user.name ?? "");
  const [avatar, setAvatar] = useState(session?.user.avatar ?? "");

  const [langCode, setLangCode] = useState(session?.language?.native_language_code ?? "en");
  const [level, setLevel] = useState<EnglishLevel | null>(session?.profile?.english_level ?? null);
  const [goals, setGoals] = useState<LearningGoal[]>(session?.profile?.learning_goals ?? []);
  const [time, setTime] = useState<DailyLearningTime>(session?.profile?.daily_learning_time ?? 15);
  const [styles, setStyles] = useState<LearningStyle[]>(
    session?.profile?.learning_preferences ?? [],
  );

  // Re-sync form when the session hydrates after mount.
  useEffect(() => {
    if (!session) return;
    setName(session.user.name);
    setAvatar(session.user.avatar ?? "");
    setLangCode(session.language?.native_language_code ?? "en");
    setLevel(session.profile?.english_level ?? null);
    setGoals(session.profile?.learning_goals ?? []);
    setTime(session.profile?.daily_learning_time ?? 15);
    setStyles(session.profile?.learning_preferences ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  if (!session) return null;
  const initials = (name || "??").slice(0, 2).toUpperCase();
  const lang = session.language;

  function saveAccount() {
    updateUser({ name, avatar: avatar || undefined });
    toast.success("Account updated");
  }

  function saveLearning() {
    const l = NATIVE_LANGUAGES.find((x) => x.code === langCode);
    if (l) {
      updateLanguage({
        native_language: l.name,
        native_language_code: l.code,
      });
    }
    updateProfile({
      english_level: level,
      learning_goals: goals,
      daily_learning_time: time,
      learning_preferences: styles,
    });
    toast.success("Learning profile updated");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your name and avatar.</p>

        <div className="mt-5 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              placeholder="https://…"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={saveAccount}>Save account</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Learning profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Level, goals, and time — used across every module.
        </p>

        <div className="mt-5 flex flex-col gap-6">
          <div className="space-y-1.5">
            <Label>Native language</Label>
            <LanguageSelector value={langCode} onChange={setLangCode} />
          </div>

          <div className="space-y-2">
            <Label>English level</Label>
            <EnglishLevelSelector value={level} onChange={setLevel} />
          </div>

          <div className="space-y-2">
            <Label>Learning goals</Label>
            <GoalSelector value={goals} onChange={setGoals} />
          </div>

          <div className="space-y-2">
            <Label>Daily learning time</Label>
            <TimeSelector value={time} onChange={setTime} />
          </div>

          <div className="space-y-2">
            <Label>Learning preferences</Label>
            <PreferenceSelector value={styles} onChange={setStyles} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={saveLearning}>Save learning profile</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Translation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how translations appear inside lessons.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Enable translations</Label>
              <p className="text-xs text-muted-foreground">
                Show translations for words, stories and lessons.
              </p>
            </div>
            <Switch
              checked={!!lang?.translation_enabled}
              onCheckedChange={(v) => updateLanguage({ translation_enabled: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Translation mode</Label>
            <Select
              value={lang?.preferred_translation_mode ?? "on_tap"}
              onValueChange={(v) =>
                updateLanguage({ preferred_translation_mode: v as TranslationMode })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="on_tap">On tap</SelectItem>
                <SelectItem value="side_by_side">Side by side</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}

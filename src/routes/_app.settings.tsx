import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth/context";
import { NATIVE_LANGUAGES } from "@/lib/i18n/languages";
import type { TranslationMode } from "@/lib/types";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lumen English" },
      { name: "description", content: "Manage your language, translation and app preferences." },
      { property: "og:title", content: "Settings — Lumen English" },
      { property: "og:description", content: "Manage your language and translation preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session, updateLanguage } = useAuth();
  const lang = session?.language;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Language & translation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose your native language and how translations appear.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Native language</Label>
            <Select
              value={lang?.native_language_code ?? "en"}
              onValueChange={(code) => {
                const l = NATIVE_LANGUAGES.find((x) => x.code === code)!;
                updateLanguage({ native_language: l.name, native_language_code: l.code });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NATIVE_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.native} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex flex-col gap-1.5">
            <Label>Translation mode</Label>
            <Select
              value={lang?.preferred_translation_mode ?? "on_tap"}
              onValueChange={(v) => updateLanguage({ preferred_translation_mode: v as TranslationMode })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
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
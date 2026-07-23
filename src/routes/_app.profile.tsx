import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import {
  DAILY_TIMES,
  goalLabel,
  LEARNING_GOALS,
  levelLabel,
  styleLabel,
} from "@/lib/onboarding/options";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Lumen English" },
      { name: "description", content: "Your account details and learning profile." },
      { property: "og:title", content: "Profile — Lumen English" },
      { property: "og:description", content: "Your account details and learning profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useAuth();
  if (!session) return null;
  const { user, profile, language } = session;
  const initials = user.name.slice(0, 2).toUpperCase();
  const timeLabel = DAILY_TIMES.find((t) => t.value === profile?.daily_learning_time)?.label ?? "—";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>

      <Card className="flex items-center gap-4 p-6">
        <Avatar className="h-16 w-16">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="bg-primary text-lg text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">Learning profile</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Row label="English level" value={levelLabel(profile?.english_level ?? null)} />
          <Row label="Daily commitment" value={timeLabel} />
          <Row
            label="Native language"
            value={language ? `${language.native_language} (${language.native_language_code})` : "—"}
          />
          <Row
            label="Translations"
            value={language?.translation_enabled ? "Enabled" : "Disabled"}
          />
        </dl>

        {profile?.learning_goals?.length ? (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Goals</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.learning_goals.map((g) => (
                <Badge key={g} variant="secondary">
                  {LEARNING_GOALS.find((x) => x.value === g)?.icon} {goalLabel(g)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {profile?.learning_preferences?.length ? (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Learning styles
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.learning_preferences.map((s) => (
                <Badge key={s} variant="outline">
                  {styleLabel(s)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-xs text-muted-foreground">
          Update any of this in <span className="font-medium">Settings</span>.
        </p>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
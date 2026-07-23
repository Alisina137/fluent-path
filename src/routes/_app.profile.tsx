import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";

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
  const initials = session.user.name.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>

      <Card className="flex items-center gap-4 p-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{session.user.name}</h2>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">Learning profile</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Row label="English level" value={session.profile?.english_level ?? "—"} />
          <Row label="Daily time" value={`${session.profile?.daily_learning_time ?? "—"} min`} />
          <Row label="Native language" value={session.language ? `${session.language.native_language} (${session.language.native_language_code})` : "—"} />
          <Row label="Translations" value={session.language?.translation_enabled ? "Enabled" : "Disabled"} />
        </dl>

        {session.profile?.learning_goals?.length ? (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Goals</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {session.profile.learning_goals.map((g) => (
                <Badge key={g} variant="secondary" className="capitalize">{g}</Badge>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
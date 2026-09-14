import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { MODULES } from "@/lib/modules/registry";
import { NATIVE_LANGUAGES } from "@/lib/i18n/languages";
import { ArrowRight, Globe, Layers, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen English — Modular AI English learning" },
      {
        name: "description",
        content:
          "Subscribe to only the modules you need — speaking, writing, IELTS, business — taught in your native language.",
      },
      { property: "og:title", content: "Lumen English — Modular AI English learning" },
      {
        property: "og:description",
        content: "An AI English platform built around the way you actually learn.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { isAuthenticated, hydrated, session } = useAuth();
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {!hydrated ? (
            <div className="h-9 w-28" aria-hidden="true" />
          ) : isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session?.user.name}
              </span>

              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {!hydrated ? (
                <div className="h-11 w-40" aria-hidden="true" />
              ) : isAuthenticated ? (
                <>
                  <Button asChild size="lg">
                    <Link to="/dashboard">
                      Continue learning
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="outline">
                    <Link to="/modules">Explore modules</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/signup">
                      Start free
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="outline">
                    <Link to="/login">I already have an account</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="h-3 w-3" /> AI English, built modular
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Learn English the way{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              you actually study
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Pick only the modules you need. Speaking, writing, IELTS, business — each taught by a
            focused AI coach, in your native language.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!hydrated ? (
              <div className="h-11 w-40" aria-hidden="true" />
            ) : isAuthenticated ? (
              <>
                <Button asChild size="lg">
                  <Link to="/dashboard">
                    Continue learning
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline">
                  <Link to="/modules">Explore modules</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/signup">
                    Start free
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline">
                  <Link to="/login">I already have an account</Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>Available in</span>
            {NATIVE_LANGUAGES.slice(0, 8).map((l) => (
              <span key={l.code} className="rounded-full bg-secondary px-2 py-0.5">
                {l.flag} {l.native}
              </span>
            ))}
            <span className="rounded-full bg-secondary px-2 py-0.5">+3 more</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" /> Modules
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              One platform, ten focused coaches
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              accessState={m.release_status === "coming_soon" ? "coming_soon" : "available"}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Lumen English</span>
          <span>Foundation build · modules launching soon</span>
        </div>
      </footer>
    </div>
  );
}

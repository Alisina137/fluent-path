import { useEffect, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/context";
import { useModules } from "@/lib/modules/context";
import {
  getVocabularyDashboardServerFn,
  getVocabularyReviewQueueServerFn,
  reviewVocabularyWordServerFn,
  startVocabularyWordServerFn,
} from "@/lib/vocabulary/functions";

type Dashboard = Awaited<ReturnType<typeof getVocabularyDashboardServerFn>>;
type ReviewWord = Awaited<ReturnType<typeof getVocabularyReviewQueueServerFn>>[number];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export function VocabularyBuilderScreen() {
  const { session } = useAuth();
  const { isSubscribed } = useModules();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number] | undefined>();
  const [topic, setTopic] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewWord[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const subscribed = isSubscribed("vocabulary");

  async function load() {
    if (!session?.user || !subscribed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDashboard(await getVocabularyDashboardServerFn({ data: { level, topic, query: searchQuery || undefined, page, pageSize: 30 } }));
    } catch {
      setError("Your vocabulary library could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, subscribed, level, topic, searchQuery, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function beginReview() {
    setBusy(true);
    setError(null);
    try {
      setReviewQueue(await getVocabularyReviewQueueServerFn());
      setRevealed(false);
    } catch {
      setError("Your review queue could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  async function rate(rating: "again" | "hard" | "good" | "easy") {
    const word = reviewQueue?.[0];
    if (!word) return;
    setBusy(true);
    try {
      await reviewVocabularyWordServerFn({ data: { wordId: word.id, rating } });
      setReviewQueue((current) => current?.slice(1) ?? []);
      setRevealed(false);
      await load();
    } catch {
      setError("That review could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!session?.user)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookMarked className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Sign in to build your vocabulary</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your words and review schedule are saved to your account.
          </p>
        </CardContent>
      </Card>
    );
  if (!subscribed)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookMarked className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Vocabulary Builder subscription required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Activate Vocabulary Builder from the module marketplace to begin.
          </p>
        </CardContent>
      </Card>
    );

  const currentReview = reviewQueue?.[0];
  if (reviewQueue)
    return (
      <main className="mx-auto max-w-3xl space-y-6" aria-labelledby="vocabulary-review-heading">
        <div>
          <Button variant="ghost" onClick={() => setReviewQueue(null)}>
            ← Back to library
          </Button>
          <h1 id="vocabulary-review-heading" className="mt-3 text-3xl font-semibold">
            Daily review
          </h1>
          <p className="mt-1 text-muted-foreground">{reviewQueue.length} words remaining</p>
        </div>
        {!currentReview ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">Review complete</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You are caught up. Come back when more words are due.
              </p>
              <Button className="mt-5" onClick={() => setReviewQueue(null)}>
                Return to library
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex gap-2">
                <Badge>CEFR {currentReview.cefrLevel}</Badge>
                <Badge variant="outline">{currentReview.topic}</Badge>
              </div>
              <CardTitle className="pt-4 text-4xl">{currentReview.term}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentReview.partOfSpeech}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {revealed ? (
                <div className="space-y-3" aria-live="polite">
                  <p className="text-lg">{currentReview.definition}</p>
                  {currentReview.translation ? (
                    <p className="rounded-lg bg-muted p-3">
                      <span className="font-medium">Translation:</span> {currentReview.translation}
                    </p>
                  ) : null}
                  <p className="italic text-muted-foreground">“{currentReview.example}”</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["again", "hard", "good", "easy"] as const).map((rating) => (
                      <Button
                        key={rating}
                        disabled={busy}
                        variant={rating === "good" ? "default" : "outline"}
                        onClick={() => void rate(rating)}
                        className="capitalize"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <Button className="w-full" onClick={() => setRevealed(true)}>
                  Show meaning
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl space-y-6" aria-labelledby="vocabulary-heading">
      <header className="rounded-2xl border bg-linear-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          Vocabulary Builder
        </div>
        <h1
          id="vocabulary-heading"
          className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
        >
          Turn new words into words you can use.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Learn level-appropriate vocabulary in context, see translations in your native language,
          and review words with spaced repetition.
        </p>
      </header>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Vocabulary progress">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Due today</p>
            <p className="mt-1 text-3xl font-semibold">{dashboard?.stats.due ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Mastered</p>
            <p className="mt-1 text-3xl font-semibold">{dashboard?.stats.mastered ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reviews completed</p>
            <p className="mt-1 text-3xl font-semibold">{dashboard?.stats.reviews ?? 0}</p>
          </CardContent>
        </Card>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void beginReview()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}Review due words
        </Button>
        {LEVELS.map((item) => (
          <Button
            key={item}
            variant={level === item ? "default" : "outline"}
            onClick={() => {
              setLevel(level === item ? undefined : item);
              setTopic(undefined);
              setPage(1);
            }}
          >
            {item}
          </Button>
        ))}
      </div>
      <section className="space-y-4" aria-labelledby="word-library-heading">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="word-library-heading" className="text-2xl font-semibold">
              Word library
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose words that match your level and goals.
            </p>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Search vocabulary</span>
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words or meanings"
              className="pl-9"
            />
          </label>
        </div>
        {dashboard?.topics.length ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={!topic ? "secondary" : "outline"}
              onClick={() => { setTopic(undefined); setPage(1); }}
            >
              All topics
            </Button>
            {dashboard.topics.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={topic === item ? "secondary" : "outline"}
                onClick={() => { setTopic(item); setPage(1); }}
              >
                {item}
              </Button>
            ))}
          </div>
        ) : null}
        {loading ? (
          <div className="flex min-h-48 items-center justify-center" role="status">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading vocabulary…
          </div>
        ) : (dashboard?.words.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Layers3 className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 font-medium">No words match these filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard?.words.map((word) => (
              <Card key={word.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge>CEFR {word.cefrLevel}</Badge>
                    <Badge variant="outline">{word.topic}</Badge>
                  </div>
                  <CardTitle className="pt-2 text-2xl">{word.term}</CardTitle>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {word.partOfSpeech}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p>{word.definition}</p>
                  {word.translation ? (
                    <p className="rounded-lg bg-muted p-3 text-sm">
                      <span className="font-medium">Translation:</span> {word.translation}
                    </p>
                  ) : null}
                  <p className="text-sm italic text-muted-foreground">“{word.example}”</p>
                  {word.synonyms.length ? (
                    <p className="text-xs text-muted-foreground">
                      Similar: {word.synonyms.join(", ")}
                    </p>
                  ) : null}
                  <Button
                    className="mt-auto"
                    variant={word.status ? "secondary" : "outline"}
                    disabled={Boolean(word.status) || busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await startVocabularyWordServerFn({ data: { wordId: word.id } });
                        await load();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {word.status ? "Added to reviews" : "Learn this word"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {dashboard && dashboard.pagination.total > 0 ? (
          <nav className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Vocabulary pagination">
            <p className="text-sm text-muted-foreground">
              Showing {(dashboard.pagination.page - 1) * dashboard.pagination.pageSize + 1}–
              {Math.min(dashboard.pagination.page * dashboard.pagination.pageSize, dashboard.pagination.total)} of{" "}
              {dashboard.pagination.total.toLocaleString()} words
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={loading || dashboard.pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="min-w-24 text-center text-sm">
                Page {dashboard.pagination.page} of {dashboard.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={loading || dashboard.pagination.page >= dashboard.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

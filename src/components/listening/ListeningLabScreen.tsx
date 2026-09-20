import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Headphones, Loader2, Mic, Pause, Play, RotateCcw, Search, Sparkles, Square, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/context";
import {
  getListeningDashboardServerFn,
  getListeningLessonServerFn,
  recordListeningShadowingServerFn,
  submitListeningComprehensionServerFn,
  submitListeningDictationServerFn,
} from "@/lib/listening/functions";
import { useModules } from "@/lib/modules/context";

type Dashboard = Awaited<ReturnType<typeof getListeningDashboardServerFn>>;
type Lesson = Awaited<ReturnType<typeof getListeningLessonServerFn>>;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

function LessonAudio({ lesson }: { lesson: Lesson }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.transcript);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Listening audio</p>
            <p className="text-sm text-muted-foreground">
              {lesson.accent} · about {Math.max(1, Math.round(lesson.durationSeconds / 60))} min
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Playback speed">
            {SPEEDS.map((speed) => (
              <Button key={speed} size="sm" variant={rate === speed ? "default" : "outline"} onClick={() => setRate(speed)}>
                {speed}×
              </Button>
            ))}
          </div>
        </div>

        {lesson.audioUrl ? (
          <audio ref={audioRef} className="w-full" controls src={lesson.audioUrl}>
            Your browser does not support audio playback.
          </audio>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border bg-background p-3">
            <Button
              size="icon"
              aria-label={speaking ? "Pause speech" : "Play speech"}
              onClick={() => {
                if (speaking) {
                  window.speechSynthesis.cancel();
                  setSpeaking(false);
                } else {
                  speak();
                }
              }}
            >
              {speaking ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                window.speechSynthesis.cancel();
                setSpeaking(false);
                window.setTimeout(speak, 50);
              }}
              aria-label="Replay audio"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Volume2 className="size-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Development voice fallback. Recorded audio URLs are used automatically when populated.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShadowingRecorder({
  lessonId,
  transcript,
  onSaved,
}: {
  lessonId: string;
  transcript: string;
  onSaved: () => Promise<void>;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setError("Audio recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const duration = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
        setSeconds(duration);
        setPreviewUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType })));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission is required for shadowing practice.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function save() {
    if (!seconds) return;
    setBusy(true);
    setError(null);
    try {
      await recordListeningShadowingServerFn({ data: { lessonId, durationSeconds: seconds } });
      await onSaved();
    } catch {
      setError("Your shadowing session could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Shadow this passage</p>
        <p className="mt-2 leading-7">{transcript}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <Button onClick={() => void start()}>
            <Mic className="size-4" /> Start recording
          </Button>
        ) : (
          <Button variant="destructive" onClick={stop}>
            <Square className="size-4" /> Stop
          </Button>
        )}

        {previewUrl ? (
          <Button variant="outline" disabled={busy} onClick={() => void save()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Save shadowing practice
          </Button>
        ) : null}
      </div>

      {previewUrl ? <audio className="w-full" controls src={previewUrl} /> : null}
      <p className="text-xs text-muted-foreground">
        Your microphone recording stays in this browser. Fluent Path stores only the session duration and progress metadata.
      </p>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function ListeningLabScreen() {
  const { session } = useAuth();
  const { isSubscribed } = useModules();
  const subscribed = isSubscribed("listening");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number] | undefined>();
  const [topic, setTopic] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"overview" | "comprehension" | "dictation" | "shadowing">("overview");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<Awaited<ReturnType<typeof submitListeningComprehensionServerFn>> | null>(null);
  const [dictation, setDictation] = useState("");
  const [dictationResult, setDictationResult] = useState<Awaited<ReturnType<typeof submitListeningDictationServerFn>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    if (!session?.user || !subscribed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDashboard(
        await getListeningDashboardServerFn({
          data: { level, topic, query: searchQuery || undefined, page, pageSize: 12 },
        }),
      );
    } catch {
      setError("Your listening library could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, subscribed, level, topic, searchQuery, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const canSubmitQuiz = useMemo(
    () => Boolean(lesson?.questions.length) && lesson!.questions.every((question) => answers[question.id] !== undefined),
    [lesson, answers],
  );

  async function openLesson(lessonId: string) {
    setBusy(true);
    setError(null);
    try {
      setLesson(await getListeningLessonServerFn({ data: { lessonId } }));
      setMode("overview");
      setAnswers({});
      setQuizResult(null);
      setDictation("");
      setDictationResult(null);
    } catch {
      setError("That listening lesson could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Headphones className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Sign in to use Listening Lab</h2>
          <p className="mt-2 text-sm text-muted-foreground">Listening progress is saved to your account.</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscribed) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Headphones className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Listening Lab subscription required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Activate Listening Lab from the module marketplace to begin.</p>
        </CardContent>
      </Card>
    );
  }

  if (lesson) {
    return (
      <main className="mx-auto max-w-4xl space-y-6" aria-labelledby="listening-lesson-heading">
        <Button variant="ghost" onClick={() => setLesson(null)}>← Back to Listening Lab</Button>

        <header>
          <div className="flex flex-wrap gap-2">
            <Badge>CEFR {lesson.cefrLevel}</Badge>
            <Badge variant="outline">{lesson.topic}</Badge>
            <Badge variant="secondary">{lesson.accent}</Badge>
          </div>
          <h1 id="listening-lesson-heading" className="mt-3 text-3xl font-semibold">{lesson.title}</h1>
          <p className="mt-2 text-muted-foreground">{lesson.description}</p>
        </header>

        <LessonAudio lesson={lesson} />

        <div className="grid gap-2 sm:grid-cols-4">
          {(["overview", "comprehension", "dictation", "shadowing"] as const).map((item) => (
            <Button key={item} variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)} className="capitalize">
              {item}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {mode === "overview" ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Practice plan</h2>
                <p className="text-muted-foreground">
                  Listen once without the transcript. Then test comprehension, complete dictation, and shadow the recording.
                </p>
                <details className="rounded-xl border p-4">
                  <summary className="cursor-pointer font-medium">Reveal transcript</summary>
                  <p className="mt-3 leading-7 text-muted-foreground">{lesson.transcript}</p>
                </details>
              </div>
            ) : null}

            {mode === "comprehension" ? (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold">Comprehension check</h2>
                {lesson.questions.map((question, questionIndex) => (
                  <fieldset key={question.id} className="space-y-3 rounded-xl border p-4">
                    <legend className="px-1 font-medium">{questionIndex + 1}. {question.prompt}</legend>
                    {question.options.map((option, optionIndex) => (
                      <label key={option} className="flex cursor-pointer gap-3 rounded-lg border p-3">
                        <input
                          type="radio"
                          name={question.id}
                          checked={answers[question.id] === optionIndex}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                    {quizResult ? (
                      <p className="text-sm text-muted-foreground">
                        {quizResult.results[questionIndex]?.correct ? "Correct. " : "Review this one. "}
                        {quizResult.results[questionIndex]?.explanation}
                      </p>
                    ) : null}
                  </fieldset>
                ))}

                {!quizResult ? (
                  <Button
                    disabled={!canSubmitQuiz || busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const ordered = lesson.questions.map((question) => answers[question.id]);
                        setQuizResult(await submitListeningComprehensionServerFn({ data: { lessonId: lesson.id, answers: ordered } }));
                        await loadDashboard();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Check answers
                  </Button>
                ) : (
                  <div className="rounded-xl bg-primary/5 p-4">
                    <p className="text-2xl font-semibold">{quizResult.score}%</p>
                    <p className="text-sm text-muted-foreground">{quizResult.correct} of {quizResult.total} correct</p>
                  </div>
                )}
              </div>
            ) : null}

            {mode === "dictation" ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Dictation</h2>
                  <p className="text-sm text-muted-foreground">Listen again and type exactly what you hear. Punctuation and capitalization are ignored.</p>
                </div>
                <Textarea value={dictation} onChange={(event) => setDictation(event.target.value)} rows={8} placeholder="Type what you hear…" />
                <Button
                  disabled={!dictation.trim() || busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      setDictationResult(await submitListeningDictationServerFn({ data: { lessonId: lesson.id, answer: dictation } }));
                      await loadDashboard();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Check dictation
                </Button>

                {dictationResult ? (
                  <div className="space-y-3 rounded-xl border p-4">
                    <p className="text-2xl font-semibold">{dictationResult.score}% word accuracy</p>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transcript</p>
                      <p className="mt-1 leading-7">{dictationResult.expected}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === "shadowing" ? (
              <ShadowingRecorder
                lessonId={lesson.id}
                transcript={lesson.transcript}
                onSaved={async () => {
                  await loadDashboard();
                  setLesson(await getListeningLessonServerFn({ data: { lessonId: lesson.id } }));
                }}
              />
            ) : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6" aria-labelledby="listening-heading">
      <header className="rounded-2xl border bg-linear-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" /> Listening Lab
        </div>
        <h1 id="listening-heading" className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Train your ear with real listening practice.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Listen at your level, test comprehension, build dictation accuracy, and practice shadowing with adjustable playback speed.
        </p>
      </header>

      {error ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Listening progress">
        {[
          ["Completed", dashboard?.stats.completed ?? 0],
          ["Listening minutes", dashboard?.stats.listeningMinutes ?? 0],
          ["Dictation average", `${dashboard?.stats.dictationAverage ?? 0}%`],
          ["Shadowing sessions", dashboard?.stats.shadowingSessions ?? 0],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4" aria-labelledby="listening-library-heading">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="listening-library-heading" className="text-2xl font-semibold">Audio library</h2>
            <p className="text-sm text-muted-foreground">Choose a lesson by level or topic.</p>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Search listening lessons</span>
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons" className="pl-9" />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {LEVELS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={level === item ? "default" : "outline"}
              onClick={() => { setLevel(level === item ? undefined : item); setPage(1); }}
            >
              {item}
            </Button>
          ))}
        </div>

        {dashboard?.topics.length ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={!topic ? "secondary" : "outline"} onClick={() => { setTopic(undefined); setPage(1); }}>
              All topics
            </Button>
            {dashboard.topics.map((item) => (
              <Button key={item} size="sm" variant={topic === item ? "secondary" : "outline"} onClick={() => { setTopic(item); setPage(1); }}>
                {item}
              </Button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-48 items-center justify-center" role="status">
            <Loader2 className="mr-2 size-5 animate-spin" /> Loading listening lessons…
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard?.lessons.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge>CEFR {item.cefrLevel}</Badge>
                    <Badge variant="outline">{item.topic}</Badge>
                  </div>
                  <CardTitle className="pt-2">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{item.accent}</span>
                    <span className="text-right">{Math.max(1, Math.round(item.durationSeconds / 60))} min</span>
                    <span>Comprehension {item.comprehensionScore ?? 0}%</span>
                    <span className="text-right">Dictation {item.dictationScore ?? 0}%</span>
                  </div>
                  {item.completed ? <Progress value={100} className="h-1.5" /> : null}
                  <Button className="w-full" disabled={busy} onClick={() => void openLesson(item.id)}>
                    <Headphones className="size-4" /> {item.completed ? "Practice again" : "Start lesson"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {dashboard && dashboard.pagination.total > 0 ? (
          <nav className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Listening pagination">
            <p className="text-sm text-muted-foreground">
              Showing {(dashboard.pagination.page - 1) * dashboard.pagination.pageSize + 1}–
              {Math.min(dashboard.pagination.page * dashboard.pagination.pageSize, dashboard.pagination.total)} of {dashboard.pagination.total} lessons
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={loading || dashboard.pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <span className="text-sm">Page {dashboard.pagination.page} of {dashboard.pagination.totalPages}</span>
              <Button variant="outline" disabled={loading || dashboard.pagination.page >= dashboard.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

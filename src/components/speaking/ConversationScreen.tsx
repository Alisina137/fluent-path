import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  StopCircle,
  WifiOff,
  XCircle,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/context";
import {
  addUserSpeakingMessageServerFn,
  getSpeakingConversationServerFn,
} from "@/lib/speaking/message-functions";

import {
  abandonSpeakingSessionServerFn,
  completeSpeakingSessionServerFn,
  getActiveSpeakingSessionServerFn,
  getSpeakingSessionServerFn,
  startSpeakingSessionServerFn,
} from "@/lib/speaking/session-functions";

type SpeakingSession = Awaited<ReturnType<typeof startSpeakingSessionServerFn>>;

type SpeakingMessage = Awaited<ReturnType<typeof getSpeakingConversationServerFn>>[number];

type ScreenStatus = "booting" | "ready" | "sending" | "recovering" | "closing" | "closed" | "error";

type OperationError = {
  message: string;
  retryable: boolean;
};

function classifyError(error: unknown): OperationError {
  if (!(error instanceof Error)) {
    return {
      message: "Something unexpected went wrong. Please try again.",
      retryable: true,
    };
  }

  const message = error.message;

  if (message.includes("coming_soon")) {
    return {
      message: "The Speaking Coach is not available yet.",
      retryable: false,
    };
  }

  if (message.includes("not_subscribed")) {
    return {
      message: "Your account does not currently have access to the Speaking Coach.",
      retryable: false,
    };
  }

  if (message.includes("module_not_found")) {
    return {
      message: "The Speaking Coach module could not be found.",
      retryable: false,
    };
  }

  if (message.includes("Speaking session not found")) {
    return {
      message: "This speaking session is no longer available. We can recover your current session.",
      retryable: true,
    };
  }

  if (message.includes("Cannot") && message.includes("speaking session with status")) {
    return {
      message:
        "This session changed while you were using it. Refresh the session to continue safely.",
      retryable: true,
    };
  }

  if (
    message.toLowerCase().includes("fetch") ||
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("failed to fetch")
  ) {
    return {
      message: "We could not reach the server. Check your connection and try again.",
      retryable: true,
    };
  }

  return {
    message,
    retryable: true,
  };
}

function formatMessageTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationScreen() {
  const { session: authSession } = useAuth();

  const [speakingSession, setSpeakingSession] = useState<SpeakingSession | null>(null);

  const [messages, setMessages] = useState<SpeakingMessage[]>([]);
  const [draft, setDraft] = useState("");

  const [status, setStatus] = useState<ScreenStatus>("booting");

  const [operationError, setOperationError] = useState<OperationError | null>(null);

  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const userId = authSession?.user?.id ?? null;

  const loadConversation = useCallback(
    async (sessionId: string) => {
      if (!userId) {
        throw new Error("Your current account session is unavailable.");
      }

      const conversation = await getSpeakingConversationServerFn({
        data: {
          userId,
          sessionId,
        },
      });

      setMessages(conversation);
    },
    [userId],
  );

  const bootstrapSession = useCallback(async () => {
    if (!userId) {
      setOperationError({
        message: "Your current account session is unavailable. Please sign in again.",
        retryable: false,
      });

      setStatus("error");
      return;
    }

    setStatus("booting");
    setOperationError(null);

    try {
      let activeSession = await getActiveSpeakingSessionServerFn({
        data: {
          userId,
        },
      });

      if (!activeSession) {
        activeSession = await startSpeakingSessionServerFn({
          data: {
            userId,
          },
        });
      }

      await loadConversation(activeSession.id);

      setSpeakingSession(activeSession);
      setStatus("ready");
    } catch (error) {
      setOperationError(classifyError(error));
      setStatus("error");
    }
  }, [loadConversation, userId]);

  const recoverSession = useCallback(async () => {
    if (!userId) {
      return;
    }

    setStatus("recovering");
    setOperationError(null);

    try {
      let recoveredSession: SpeakingSession | null = null;

      if (speakingSession) {
        try {
          recoveredSession = await getSpeakingSessionServerFn({
            data: {
              userId,
              sessionId: speakingSession.id,
            },
          });
        } catch {
          recoveredSession = null;
        }
      }

      if (!recoveredSession) {
        recoveredSession = await getActiveSpeakingSessionServerFn({
          data: {
            userId,
          },
        });
      }

      if (!recoveredSession) {
        recoveredSession = await startSpeakingSessionServerFn({
          data: {
            userId,
          },
        });
      }

      await loadConversation(recoveredSession.id);

      setSpeakingSession(recoveredSession);

      if (recoveredSession.status === "active") {
        setStatus("ready");
      } else {
        setStatus("closed");
      }
    } catch (error) {
      setOperationError(classifyError(error));

      setStatus(speakingSession ? "ready" : "error");
    }
  }, [loadConversation, speakingSession, userId]);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !speakingSession) {
      return;
    }

    const content = draft.trim();

    if (!content || status !== "ready") {
      return;
    }

    setStatus("sending");
    setOperationError(null);

    try {
      await addUserSpeakingMessageServerFn({
        data: {
          userId,
          sessionId: speakingSession.id,
          content,
        },
      });

      setDraft("");

      await loadConversation(speakingSession.id);

      setStatus("ready");
    } catch (error) {
      // Deliberately keep the draft.
      // The learner can retry without retyping.
      setOperationError(classifyError(error));

      try {
        const latestSession = await getSpeakingSessionServerFn({
          data: {
            userId,
            sessionId: speakingSession.id,
          },
        });

        setSpeakingSession(latestSession);

        if (latestSession.status === "active") {
          setStatus("ready");
        } else {
          await loadConversation(latestSession.id);

          setStatus("closed");
        }
      } catch {
        setStatus("ready");
      }
    }
  }

  async function handleComplete() {
    if (!userId || !speakingSession || status !== "ready") {
      return;
    }

    setStatus("closing");
    setOperationError(null);

    try {
      const completed = await completeSpeakingSessionServerFn({
        data: {
          userId,
          sessionId: speakingSession.id,
        },
      });

      setSpeakingSession(completed);
      setStatus("closed");
    } catch (error) {
      setOperationError(classifyError(error));

      await recoverSession();
    }
  }

  async function handleAbandon() {
    if (!userId || !speakingSession || status !== "ready") {
      return;
    }

    setStatus("closing");
    setOperationError(null);

    try {
      const abandoned = await abandonSpeakingSessionServerFn({
        data: {
          userId,
          sessionId: speakingSession.id,
        },
      });

      setSpeakingSession(abandoned);
      setStatus("closed");
    } catch (error) {
      setOperationError(classifyError(error));

      await recoverSession();
    }
  }

  if (status === "booting") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="flex flex-col items-center gap-3 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />

          <div>
            <p className="font-medium">Recovering your conversation</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Checking for an existing Speaking Coach session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-xl border bg-card p-6 text-center shadow-sm" role="alert">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />

          <h1 className="mt-4 text-xl font-semibold">Speaking Coach unavailable</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {operationError?.message ?? "The Speaking Coach could not be loaded."}
          </p>

          {operationError?.retryable ? (
            <Button
              className="mt-5"
              onClick={() => {
                void bootstrapSession();
              }}
            >
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!speakingSession) {
    return null;
  }

  const conversationClosed = status === "closed" || speakingSession.status !== "active";

  const interactionBusy = status === "sending" || status === "closing" || status === "recovering";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />

            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">AI Speaking Coach</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Practice an English conversation and build your speaking confidence.
          </p>
        </div>

        {!conversationClosed ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleAbandon();
              }}
              disabled={interactionBusy}
            >
              <XCircle aria-hidden="true" />
              End session
            </Button>

            <Button
              type="button"
              onClick={() => {
                void handleComplete();
              }}
              disabled={interactionBusy}
            >
              {status === "closing" ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
              Complete
            </Button>
          </div>
        ) : null}
      </header>

      {status === "recovering" ? (
        <div
          className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />

          <span>Synchronizing this session with the server…</span>
        </div>
      ) : null}

      {operationError ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />

            <p>{operationError.message}</p>
          </div>

          {operationError.retryable ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={interactionBusy}
              onClick={() => {
                void recoverSession();
              }}
            >
              <RefreshCw aria-hidden="true" />
              Refresh session
            </Button>
          ) : null}
        </div>
      ) : null}

      {conversationClosed ? (
        <div className="rounded-xl border bg-card p-5" aria-live="polite">
          <div className="flex items-start gap-3">
            <StopCircle className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />

            <div>
              <h2 className="font-semibold">Session ended</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                This session was {speakingSession.status}. Your conversation has been saved.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section
        className="flex min-h-105 flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
        aria-label="Speaking conversation"
      >
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">Conversation</h2>

              <p className="text-xs text-muted-foreground">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </p>
            </div>

            <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
              {speakingSession.status}
            </div>
          </div>
        </div>

        <div
          className="flex max-h-[56vh] min-h-85 flex-1 flex-col gap-4 overflow-y-auto p-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="max-w-sm text-center">
                <MessageCircle
                  className="mx-auto h-8 w-8 text-muted-foreground"
                  aria-hidden="true"
                />

                <h3 className="mt-3 font-medium">Start the conversation</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Write your first English message below. Your conversation is saved so it can be
                  recovered if you return later.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <article
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${
                      isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs opacity-75">
                      <span>{isUser ? "You" : "AI Coach"}</span>

                      <span aria-hidden="true">&bull;</span>

                      <time dateTime={new Date(message.createdAt).toISOString()}>
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>

                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </article>
              );
            })
          )}

          <div ref={conversationEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t bg-background p-3 sm:p-4">
          <label htmlFor="speaking-message" className="sr-only">
            Your English message
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Textarea
              id="speaking-message"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              placeholder={
                conversationClosed ? "This session has ended." : "Write something in English..."
              }
              disabled={conversationClosed || interactionBusy}
              maxLength={10_000}
              rows={3}
              className="min-h-21 resize-none"
            />

            <Button
              type="submit"
              className="sm:h-21 sm:w-24"
              disabled={conversationClosed || interactionBusy || !draft.trim()}
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  <span className="sm:sr-only">Sending</span>
                </>
              ) : (
                <>
                  <Send aria-hidden="true" />
                  <span className="sm:sr-only">Send message</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>Your draft stays here if sending fails.</span>

            <span>{draft.length}/10000</span>
          </div>
        </form>
      </section>
    </div>
  );
}

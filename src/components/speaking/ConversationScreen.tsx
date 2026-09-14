import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Mic,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  StopCircle,
  Volume2,
  WifiOff,
  XCircle,
} from "lucide-react";
import { generateSpeakingMessageSpeechServerFn } from "@/lib/speaking/tts-functions";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPreviewUrl } from "@/hooks/useAudioPreviewUrl";
import { formatAudioDuration } from "@/lib/speaking/audio-format";
import { createTranscriptionFormData } from "@/lib/speaking/create-transcription-form-data";
import { transcribeSpeakingAudioServerFn } from "@/lib/speaking/transcription-functions";
import { validateAudioRecording } from "@/lib/speaking/audio-validation";

import { useMicrophonePermission } from "@/hooks/useMicrophonePermission";
import { generateSpeakingCoachReplyServerFn } from "@/lib/speaking/conversation-functions";

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

type SpeechPlaybackStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

type SpeechPlaybackError = {
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
function createAudioObjectUrl(audioBase64: string, contentType: string): string {
  const binary = window.atob(audioBase64);

  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], {
    type: contentType,
  });

  return URL.createObjectURL(blob);
}

export function ConversationScreen() {
  const { session: authSession } = useAuth();

  const [speakingSession, setSpeakingSession] = useState<SpeakingSession | null>(null);

  const [messages, setMessages] = useState<SpeakingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<{
    code: string;
    message: string;
    retryable: boolean;
  } | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  const [aiReplyError, setAiReplyError] = useState<{
    code: string;
    message: string;
    retryable: boolean;
  } | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  const [speechMessageId, setSpeechMessageId] = useState<string | null>(null);

  const [speechPlaybackStatus, setSpeechPlaybackStatus] = useState<SpeechPlaybackStatus>("idle");

  const [speechPlaybackError, setSpeechPlaybackError] = useState<SpeechPlaybackError | null>(null);

  const [status, setStatus] = useState<ScreenStatus>("booting");

  const [operationError, setOperationError] = useState<OperationError | null>(null);

  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const coachAudioRef = useRef<HTMLAudioElement | null>(null);

  const coachAudioUrlRef = useRef<string | null>(null);

  const speechRequestIdRef = useRef(0);

  const userId = authSession?.user?.id ?? null;
  const {
    state: microphonePermission,
    errorMessage: microphoneError,
    requestPermission,
    refreshPermission,
  } = useMicrophonePermission();
  const {
    status: audioRecorderStatus,
    recording,
    errorMessage: audioRecorderError,
    elapsedMs: audioRecordingElapsedMs,
    isSupported: isAudioRecorderSupported,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const audioValidation = recording ? validateAudioRecording(recording) : null;

  const audioPreviewUrl = useAudioPreviewUrl(recording?.blob);

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
    return () => {
      speechRequestIdRef.current += 1;

      const audio = coachAudioRef.current;

      if (audio) {
        audio.pause();
        audio.src = "";

        coachAudioRef.current = null;
      }

      if (coachAudioUrlRef.current) {
        URL.revokeObjectURL(coachAudioUrlRef.current);

        coachAudioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  async function generateAiReply(): Promise<boolean> {
    if (!userId || !speakingSession || speakingSession.status !== "active" || isGeneratingReply) {
      return false;
    }

    setIsGeneratingReply(true);
    setAiReplyError(null);

    try {
      const result = await generateSpeakingCoachReplyServerFn({
        data: {
          userId,
          sessionId: speakingSession.id,
        },
      });

      if (!result.ok) {
        setAiReplyError(result.error);

        await loadConversation(speakingSession.id);

        return false;
      }

      await loadConversation(speakingSession.id);

      return true;
    } catch (error) {
      console.error("[Speaking AI] Request failed", error);

      setAiReplyError({
        code: "network_error",
        message:
          "The AI Coach could not be reached. Your message has been saved, so you can retry the AI response.",
        retryable: true,
      });

      await loadConversation(speakingSession.id);

      return false;
    } finally {
      setIsGeneratingReply(false);
    }
  }

  function releaseCoachAudio() {
    const audio = coachAudioRef.current;

    if (audio) {
      audio.pause();
      audio.src = "";

      coachAudioRef.current = null;
    }

    if (coachAudioUrlRef.current) {
      URL.revokeObjectURL(coachAudioUrlRef.current);

      coachAudioUrlRef.current = null;
    }
  }

  function handleRetrySpeech(messageId: string) {
    /*
     * If audio already exists,
     * reuse it rather than making
     * another paid TTS request.
     */
    if (speechMessageId === messageId && coachAudioRef.current) {
      setSpeechPlaybackStatus(coachAudioRef.current.ended ? "ended" : "paused");

      setSpeechPlaybackError(null);

      return;
    }

    void handlePlaySpeech(messageId);
  }

  async function handlePlaySpeech(messageId: string) {
    if (!userId || !speakingSession) {
      return;
    }

    /*
     * Resume an already prepared
     * audio response.
     */
    if (
      speechMessageId === messageId &&
      coachAudioRef.current &&
      speechPlaybackStatus === "paused"
    ) {
      try {
        await coachAudioRef.current.play();

        setSpeechPlaybackStatus("playing");

        setSpeechPlaybackError(null);
      } catch (error) {
        console.error("[Speaking TTS] Playback failed", error);

        setSpeechPlaybackStatus("error");

        setSpeechPlaybackError({
          message: "The audio is ready but your browser could not start playback.",
          retryable: true,
        });
      }

      return;
    }

    /*
     * Replay completed audio
     * without another paid TTS call.
     */
    if (
      speechMessageId === messageId &&
      coachAudioRef.current &&
      speechPlaybackStatus === "ended"
    ) {
      try {
        coachAudioRef.current.currentTime = 0;

        await coachAudioRef.current.play();

        setSpeechPlaybackStatus("playing");

        setSpeechPlaybackError(null);
      } catch (error) {
        console.error("[Speaking TTS] Replay failed", error);

        setSpeechPlaybackStatus("error");

        setSpeechPlaybackError({
          message: "The audio could not be replayed.",
          retryable: true,
        });
      }

      return;
    }

    /*
     * A new message requires new
     * speech generation.
     */
    const requestId = speechRequestIdRef.current + 1;

    speechRequestIdRef.current = requestId;

    releaseCoachAudio();

    setSpeechMessageId(messageId);

    setSpeechPlaybackStatus("loading");

    setSpeechPlaybackError(null);

    try {
      const result = await generateSpeakingMessageSpeechServerFn({
        data: {
          userId,
          sessionId: speakingSession.id,
          messageId,
        },
      });

      /*
       * Ignore a response if the
       * learner selected another
       * message while this request
       * was running.
       */
      if (speechRequestIdRef.current !== requestId) {
        return;
      }

      if (!result.ok) {
        setSpeechPlaybackStatus("error");

        setSpeechPlaybackError({
          message: result.error.message,
          retryable: result.error.retryable,
        });

        return;
      }

      const audioUrl = createAudioObjectUrl(result.audioBase64, result.contentType);

      const audio = new Audio(audioUrl);

      audio.preload = "auto";

      coachAudioUrlRef.current = audioUrl;

      coachAudioRef.current = audio;

      audio.onplay = () => {
        if (speechRequestIdRef.current === requestId) {
          setSpeechPlaybackStatus("playing");
        }
      };

      audio.onpause = () => {
        if (speechRequestIdRef.current !== requestId || audio.ended) {
          return;
        }

        setSpeechPlaybackStatus("paused");
      };

      audio.onended = () => {
        if (speechRequestIdRef.current === requestId) {
          setSpeechPlaybackStatus("ended");
        }
      };

      audio.onerror = () => {
        if (speechRequestIdRef.current !== requestId) {
          return;
        }

        setSpeechPlaybackStatus("error");

        setSpeechPlaybackError({
          message: "The generated audio could not be played.",
          retryable: true,
        });
      };

      try {
        await audio.play();
      } catch (error) {
        /*
         * Some browsers can block
         * playback after an async
         * network operation.
         *
         * Keep the generated audio
         * so the learner can press
         * Play again without another
         * paid request.
         */
        console.error("[Speaking TTS] Automatic playback was blocked", error);

        setSpeechPlaybackStatus("paused");

        setSpeechPlaybackError({
          message: "The voice is ready. Press Play again to hear it.",
          retryable: true,
        });
      }
    } catch (error) {
      if (speechRequestIdRef.current !== requestId) {
        return;
      }

      console.error("[Speaking TTS] Request failed", error);

      setSpeechPlaybackStatus("error");

      setSpeechPlaybackError({
        message: "The voice request could not reach the server. Please try again.",
        retryable: true,
      });
    }
  }

  function handlePauseSpeech(messageId: string) {
    if (speechMessageId !== messageId || !coachAudioRef.current) {
      return;
    }

    coachAudioRef.current.pause();
  }

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
    setAiReplyError(null);

    try {
      await addUserSpeakingMessageServerFn({
        data: {
          userId,
          sessionId: speakingSession.id,
          content,
        },
      });

      /*
       * The learner message now exists in Neon.
       *
       * Clear the draft here so an AI failure does
       * not cause the learner to accidentally submit
       * the same message again.
       */
      setDraft("");

      await loadConversation(speakingSession.id);

      setStatus("ready");

      await generateAiReply();
    } catch (error) {
      /*
       * This catch covers failure while saving the
       * learner message itself.
       *
       * Therefore we keep the draft so the learner
       * can safely retry sending it.
       */
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

  async function handleTranscription() {
    if (
      !userId ||
      !speakingSession ||
      !recording ||
      !audioValidation?.valid ||
      isTranscribing ||
      status !== "ready"
    ) {
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null);
    setLastTranscript(null);
    setOperationError(null);

    try {
      const formData = createTranscriptionFormData({
        userId,
        sessionId: speakingSession.id,
        recording,
        language: "en",
      });

      const result = await transcribeSpeakingAudioServerFn({
        data: formData,
      });

      if (!result.ok) {
        setTranscriptionError(result.error);
        return;
      }

      setLastTranscript(result.transcript);

      await loadConversation(speakingSession.id);

      resetRecording();

      setIsTranscribing(false);

      await generateAiReply();
    } catch (error) {
      console.error("[Speaking STT] Request failed", error);

      setTranscriptionError({
        code: "network_error",
        message:
          "The transcription request could not reach the server. Check your connection and try again.",
        retryable: true,
      });
    } finally {
      setIsTranscribing(false);
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

  async function handleMicrophonePermissionRequest() {
    await requestPermission();
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

  const interactionBusy =
    status === "sending" ||
    status === "closing" ||
    status === "recovering" ||
    isTranscribing ||
    isGeneratingReply;

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

      <section
        className="rounded-xl border bg-card p-4 shadow-sm"
        aria-labelledby="microphone-permission-title"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Mic className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 id="microphone-permission-title" className="font-medium">
                Microphone access
              </h2>

              {microphonePermission === "checking" ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Checking microphone availability...
                </p>
              ) : null}

              {microphonePermission === "prompt" ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Allow microphone access to prepare for voice practice.
                </p>
              ) : null}

              {microphonePermission === "granted" ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Microphone access is ready for voice practice.
                </p>
              ) : null}

              {microphonePermission === "denied" ? (
                <p className="mt-1 text-sm text-destructive">
                  Microphone permission is blocked. Update your browser permission settings and
                  check again.
                </p>
              ) : null}

              {microphonePermission === "unsupported" ? (
                <p className="mt-1 text-sm text-destructive">
                  Microphone access is not supported in this browser or environment.
                </p>
              ) : null}

              {microphonePermission === "unavailable" ? (
                <p className="mt-1 text-sm text-destructive">No usable microphone was found.</p>
              ) : null}

              {microphonePermission === "error" ? (
                <p className="mt-1 text-sm text-destructive">
                  {microphoneError ?? "The microphone could not be accessed."}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {microphonePermission === "prompt" ? (
              <Button
                type="button"
                onClick={() => {
                  void handleMicrophonePermissionRequest();
                }}
              >
                <Mic aria-hidden="true" />
                Allow microphone
              </Button>
            ) : null}

            {microphonePermission === "denied" ||
            microphonePermission === "error" ||
            microphonePermission === "unavailable" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void refreshPermission();
                }}
              >
                <RefreshCw aria-hidden="true" />
                Check again
              </Button>
            ) : null}

            {microphonePermission === "granted" ? (
              <div
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                role="status"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Ready
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="rounded-xl border bg-card p-4 shadow-sm"
        aria-labelledby="audio-recorder-title"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="audio-recorder-title" className="font-medium">
                Voice recording
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Record your answer for up to 2 minutes. You can listen to it before it is used for
                speaking practice.
              </p>
            </div>

            <div
              className="shrink-0 rounded-md border px-3 py-2 text-sm font-medium"
              aria-label={`Recording time ${formatAudioDuration(
                audioRecordingElapsedMs,
              )} of 2 minutes`}
            >
              {formatAudioDuration(audioRecordingElapsedMs)} / 2:00
            </div>
          </div>

          {!isAudioRecorderSupported ? (
            <p className="text-sm text-destructive" role="alert">
              Audio recording is not supported by this browser.
            </p>
          ) : null}

          {isAudioRecorderSupported && microphonePermission !== "granted" ? (
            <p className="text-sm text-muted-foreground">
              Allow microphone access before starting a recording.
            </p>
          ) : null}

          {microphonePermission === "granted" && audioRecorderStatus === "idle" ? (
            <p className="text-sm text-muted-foreground">
              Your microphone is ready. Start recording when you are ready to speak.
            </p>
          ) : null}

          {audioRecorderStatus === "acquiring" ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Preparing your microphone...</span>
            </div>
          ) : null}

          {audioRecorderStatus === "recording" ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive" aria-hidden="true" />

                <p className="text-sm font-medium text-destructive">Recording in progress</p>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Speak naturally. Click Stop recording when you are finished.
              </p>
            </div>
          ) : null}

          {audioRecorderStatus === "stopping" ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Finishing your recording...</span>
            </div>
          ) : null}

          {audioRecorderStatus === "recorded" && recording ? (
            <div className="space-y-3 rounded-lg border p-3" aria-live="polite">
              {audioValidation?.valid ? (
                <div>
                  <p className="font-medium">Audio captured and ready.</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    You can listen to your recording before continuing.
                  </p>
                </div>
              ) : (
                <div role="alert">
                  <p className="font-medium text-destructive">Recording needs attention.</p>

                  {audioValidation && !audioValidation.valid ? (
                    <p className="mt-1 text-sm text-destructive">{audioValidation.error.message}</p>
                  ) : null}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {(recording.size / 1024).toFixed(1)} KB
                {" | "}
                {(recording.durationMs / 1000).toFixed(1)} seconds
                {" | "}
                {recording.mimeType}
              </p>

              {audioPreviewUrl ? (
                <div>
                  <label
                    htmlFor="speaking-recording-preview"
                    className="mb-2 block text-sm font-medium"
                  >
                    Recording preview
                  </label>

                  <audio
                    id="speaking-recording-preview"
                    className="w-full"
                    controls
                    preload="metadata"
                    src={audioPreviewUrl}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : null}
            </div>
          ) : null}

          {isTranscribing ? (
            <div
              className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />

              <span>Converting your speech to text...</span>
            </div>
          ) : null}

          {transcriptionError ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
              role="alert"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-destructive">Transcription failed</p>

                  <p className="mt-1 text-destructive">{transcriptionError.message}</p>

                  <p className="mt-1 text-muted-foreground">
                    {transcriptionError.retryable
                      ? "Your recording has been kept. You can retry without recording again."
                      : "Your recording has been kept. You may listen to it or make a new recording."}
                  </p>
                </div>

                {transcriptionError.retryable && recording && audioValidation?.valid ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={interactionBusy || conversationClosed}
                    onClick={() => {
                      void handleTranscription();
                    }}
                  >
                    <RefreshCw aria-hidden="true" />
                    Retry transcription
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
          {audioRecorderError ? (
            <p className="text-sm text-destructive" role="alert">
              {audioRecorderError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2" aria-label="Voice recording controls">
            {(audioRecorderStatus === "idle" ||
              audioRecorderStatus === "recorded" ||
              audioRecorderStatus === "error") && (
              <Button
                type="button"
                onClick={() => {
                  setTranscriptionError(null);
                  setLastTranscript(null);
                  void startRecording();
                }}
                disabled={
                  conversationClosed ||
                  interactionBusy ||
                  microphonePermission !== "granted" ||
                  !isAudioRecorderSupported
                }
                aria-label={
                  audioRecorderStatus === "recorded"
                    ? "Discard the current recording and record again"
                    : "Start voice recording"
                }
              >
                <Mic aria-hidden="true" />

                {audioRecorderStatus === "recorded" ? "Record again" : "Start recording"}
              </Button>
            )}

            {audioRecorderStatus === "recording" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={stopRecording}
                aria-label="Stop voice recording"
              >
                <StopCircle aria-hidden="true" />
                Stop recording
              </Button>
            ) : null}

            {audioRecorderStatus === "acquiring" || audioRecorderStatus === "stopping" ? (
              <Button type="button" disabled aria-disabled="true">
                <Loader2 className="animate-spin" aria-hidden="true" />

                {audioRecorderStatus === "acquiring" ? "Preparing" : "Stopping"}
              </Button>
            ) : null}

            {audioRecorderStatus === "recorded" && recording && audioValidation?.valid ? (
              <Button
                type="button"
                onClick={() => {
                  void handleTranscription();
                }}
                disabled={conversationClosed || interactionBusy}
                aria-label="Transcribe this recording and add it to the conversation"
              >
                {isTranscribing ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Send aria-hidden="true" />
                )}

                {isTranscribing
                  ? "Transcribing..."
                  : transcriptionError?.retryable
                    ? "Retry"
                    : "Use recording"}
              </Button>
            ) : null}

            {audioRecorderStatus === "recorded" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTranscriptionError(null);
                  setLastTranscript(null);
                  resetRecording();
                }}
                aria-label="Clear the current voice recording"
              >
                Clear recording
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {status === "recovering" ? (
        <div
          className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />

          <span>Synchronizing this session with the server...</span>
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

      {lastTranscript ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />

            <div>
              <p className="font-medium">Speech recognized</p>

              <p className="mt-1 text-sm text-muted-foreground">"{lastTranscript}"</p>

              <p className="mt-2 text-xs text-muted-foreground">
                The transcript has been added to your conversation.
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

                    {!isUser ? (
                      <div className="mt-3 border-t border-border/50 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {speechMessageId === message.id && speechPlaybackStatus === "loading" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled
                              aria-label="Preparing AI Coach voice"
                            >
                              <Loader2 className="animate-spin" aria-hidden="true" />
                              Preparing voice
                            </Button>
                          ) : speechMessageId === message.id &&
                            speechPlaybackStatus === "playing" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                handlePauseSpeech(message.id);
                              }}
                              aria-label="Pause AI Coach voice"
                            >
                              <Pause aria-hidden="true" />
                              Pause
                            </Button>
                          ) : speechMessageId === message.id &&
                            speechPlaybackStatus === "paused" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                void handlePlaySpeech(message.id);
                              }}
                              aria-label="Resume AI Coach voice"
                            >
                              <Play aria-hidden="true" />
                              Resume
                            </Button>
                          ) : speechMessageId === message.id && speechPlaybackStatus === "ended" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                void handlePlaySpeech(message.id);
                              }}
                              aria-label="Replay AI Coach voice"
                            >
                              <RotateCcw aria-hidden="true" />
                              Replay
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                void handlePlaySpeech(message.id);
                              }}
                              aria-label="Play AI Coach voice"
                            >
                              <Volume2 aria-hidden="true" />
                              Play
                            </Button>
                          )}
                        </div>

                        {speechMessageId === message.id && speechPlaybackError ? (
                          <div className="mt-2 text-xs" role="alert">
                            <p className="text-destructive">{speechPlaybackError.message}</p>

                            {speechPlaybackStatus === "error" && speechPlaybackError.retryable ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="mt-1 h-auto px-2 py-1 text-xs"
                                onClick={() => {
                                  handleRetrySpeech(message.id);
                                }}
                              >
                                <RefreshCw aria-hidden="true" />
                                Retry voice
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}

          {isGeneratingReply ? (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="flex max-w-[85%] items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground sm:max-w-[72%]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />

                <span>AI Coach is thinking...</span>
              </div>
            </div>
          ) : null}
          <div ref={conversationEndRef} />
        </div>

        {aiReplyError ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            role="alert"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-destructive">AI Coach could not respond</p>

                <p className="mt-1 text-sm text-destructive">{aiReplyError.message}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your message has already been saved.
                </p>
              </div>

              {aiReplyError.retryable ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={interactionBusy || conversationClosed}
                  onClick={() => {
                    void generateAiReply();
                  }}
                >
                  <RefreshCw aria-hidden="true" />
                  Retry AI response
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

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

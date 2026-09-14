import { useCallback, useEffect, useRef, useState } from "react";

export type AudioRecorderStatus =
  "idle" | "acquiring" | "recording" | "stopping" | "recorded" | "unsupported" | "error";

export type AudioRecording = {
  blob: Blob;
  mimeType: string;
  size: number;
  durationMs: number;
  createdAt: string;
};

type AudioRecorderResult = {
  status: AudioRecorderStatus;
  recording: AudioRecording | null;
  errorMessage: string | null;
  elapsedMs: number;
  isSupported: boolean;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  resetRecording: () => void;
};

const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function getPreferredMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  return PREFERRED_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function getRecordingErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "Unable to start audio recording.";
  }

  switch (error.name) {
    case "NotAllowedError":
      return "Microphone permission is required before recording can start.";

    case "NotFoundError":
      return "No microphone was found on this device.";

    case "NotReadableError":
      return "Your microphone is unavailable or is being used by another application.";

    case "SecurityError":
      return "Audio recording is blocked by the browser's security settings.";

    case "AbortError":
      return "Audio recording was interrupted. Please try again.";

    default:
      return "Unable to start audio recording.";
  }
}

export function useAudioRecorder(): AudioRecorderResult {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setStatus("unsupported");
      setErrorMessage("Audio recording is not supported by this browser.");
      return false;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      return false;
    }

    clearElapsedTimer();

    setStatus("acquiring");
    setErrorMessage(null);
    setRecording(null);
    setElapsedMs(0);

    chunksRef.current = [];

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      streamRef.current = stream;

      const preferredMimeType = getPreferredMimeType();

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, {
            mimeType: preferredMimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearElapsedTimer();
        setErrorMessage("An error occurred while recording audio.");
      };

      recorder.onstop = () => {
        clearElapsedTimer();

        const durationMs =
          startedAtRef.current === null ? 0 : Math.max(0, Date.now() - startedAtRef.current);

        const mimeType =
          recorder.mimeType || preferredMimeType || chunksRef.current[0]?.type || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        mediaRecorderRef.current = null;
        startedAtRef.current = null;
        chunksRef.current = [];

        setElapsedMs(durationMs);

        releaseStream();

        if (blob.size === 0) {
          setRecording(null);
          setErrorMessage("The recording finished without producing audio data. Please try again.");
          setStatus("error");
          return;
        }

        setRecording({
          blob,
          mimeType,
          size: blob.size,
          durationMs,
          createdAt: new Date().toISOString(),
        });

        setErrorMessage(null);
        setStatus("recorded");
      };

      recorder.start();

      startedAtRef.current = Date.now();

      elapsedTimerRef.current = setInterval(() => {
        if (startedAtRef.current !== null) {
          setElapsedMs(Math.max(0, Date.now() - startedAtRef.current));
        }
      }, 250);

      setStatus("recording");

      return true;
    } catch (error) {
      clearElapsedTimer();
      stopStream(stream);

      streamRef.current = null;
      mediaRecorderRef.current = null;
      startedAtRef.current = null;
      chunksRef.current = [];

      setElapsedMs(0);
      setErrorMessage(getRecordingErrorMessage(error));
      setStatus("error");

      return false;
    }
  }, [clearElapsedTimer, releaseStream]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    clearElapsedTimer();
    setStatus("stopping");

    recorder.stop();
  }, [clearElapsedTimer]);

  const resetRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      return;
    }

    clearElapsedTimer();

    setRecording(null);
    setErrorMessage(null);
    setElapsedMs(0);
    setStatus("idle");
  }, [clearElapsedTimer]);

  useEffect(() => {
    return () => {
      clearElapsedTimer();

      const recorder = mediaRecorderRef.current;

      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;

        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }

      stopStream(streamRef.current);

      mediaRecorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
      startedAtRef.current = null;
    };
  }, [clearElapsedTimer]);

  return {
    status,
    recording,
    errorMessage,
    elapsedMs,
    isSupported,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

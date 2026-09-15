import { SpeechToTextError } from "./types";

const MAX_TRANSCRIPT_LENGTH = 10_000;

export function normalizeSpeechTranscript(transcript: string): string {
  const normalized = transcript.replaceAll("\u0000", "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    throw new SpeechToTextError({
      code: "transcription_failed",
      message: "No recognizable speech was found in the recording.",
      provider: "openai",
      retryable: false,
    });
  }

  if (normalized.length > MAX_TRANSCRIPT_LENGTH) {
    throw new SpeechToTextError({
      code: "transcription_failed",
      message: "The transcription is too long to use as a conversation message.",
      provider: "openai",
      retryable: false,
    });
  }

  return normalized;
}

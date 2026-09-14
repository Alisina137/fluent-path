import type { AudioRecording } from "@/hooks/useAudioRecorder";

export const AUDIO_VALIDATION_LIMITS = {
  minDurationMs: 1_000,
  maxDurationMs: 120_000,
  maxSizeBytes: 15 * 1024 * 1024,
} as const;

const SUPPORTED_AUDIO_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"] as const;

export type AudioValidationErrorCode =
  "empty" | "too_short" | "too_long" | "too_large" | "unsupported_type";

export type AudioValidationError = {
  code: AudioValidationErrorCode;
  message: string;
};

export type AudioValidationResult =
  | {
      valid: true;
      error: null;
    }
  | {
      valid: false;
      error: AudioValidationError;
    };

function invalid(code: AudioValidationErrorCode, message: string): AudioValidationResult {
  return {
    valid: false,
    error: {
      code,
      message,
    },
  };
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase().split(";")[0]?.trim() ?? "";
}

export function isSupportedAudioMimeType(mimeType: string): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);

  return SUPPORTED_AUDIO_MIME_TYPES.some((supportedType) => supportedType === normalizedMimeType);
}

export function validateAudioRecording(recording: AudioRecording): AudioValidationResult {
  if (recording.size <= 0 || recording.blob.size <= 0) {
    return invalid("empty", "The recording does not contain audio data. Please record again.");
  }

  if (recording.durationMs < AUDIO_VALIDATION_LIMITS.minDurationMs) {
    return invalid("too_short", "Your recording is too short. Please speak for at least 1 second.");
  }

  if (recording.durationMs > AUDIO_VALIDATION_LIMITS.maxDurationMs) {
    return invalid("too_long", "Your recording is too long. Please keep it under 2 minutes.");
  }

  if (recording.size > AUDIO_VALIDATION_LIMITS.maxSizeBytes) {
    return invalid("too_large", "Your recording is too large. Please make a shorter recording.");
  }

  if (!isSupportedAudioMimeType(recording.mimeType)) {
    return invalid(
      "unsupported_type",
      "This audio format is not supported. Please record again using a supported browser.",
    );
  }

  return {
    valid: true,
    error: null,
  };
}

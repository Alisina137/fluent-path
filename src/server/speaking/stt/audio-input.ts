import { SpeechToTextError, type SpeechToTextAudioInput } from "./types";

const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024;

const SUPPORTED_AUDIO_TYPES = new Set(["audio/webm", "audio/mp4", "audio/ogg"]);

function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase().split(";")[0]?.trim() ?? "";
}

function getAudioExtension(mimeType: string): string {
  switch (normalizeMimeType(mimeType)) {
    case "audio/webm":
      return "webm";

    case "audio/mp4":
      return "m4a";

    case "audio/ogg":
      return "ogg";

    default:
      return "audio";
  }
}

export async function createSpeechToTextAudioInput(
  file: File,
  durationMs?: number,
): Promise<SpeechToTextAudioInput> {
  if (file.size <= 0) {
    throw new SpeechToTextError({
      code: "invalid_audio",
      message: "The uploaded recording is empty.",
    });
  }

  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    throw new SpeechToTextError({
      code: "invalid_audio",
      message: "The uploaded recording is too large.",
    });
  }

  const normalizedMimeType = normalizeMimeType(file.type);

  if (!SUPPORTED_AUDIO_TYPES.has(normalizedMimeType)) {
    throw new SpeechToTextError({
      code: "unsupported_audio",
      message: "The uploaded audio format is not supported.",
    });
  }

  if (
    durationMs !== undefined &&
    (!Number.isFinite(durationMs) || durationMs < 1_000 || durationMs > 120_000)
  ) {
    throw new SpeechToTextError({
      code: "invalid_audio",
      message: "The uploaded recording duration is outside the allowed range.",
    });
  }

  const buffer = await file.arrayBuffer();

  return {
    data: new Uint8Array(buffer),
    mimeType: normalizedMimeType,
    fileName: `speaking-recording.${getAudioExtension(normalizedMimeType)}`,
    durationMs,
  };
}

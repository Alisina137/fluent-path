import { getSpeechToTextProvider } from "./provider-registry";
import { ensureSpeechToTextProvidersRegistered } from "./providers";
import { SpeechToTextError, type SpeechToTextRequest, type SpeechToTextResult } from "./types";

export async function transcribeSpeech(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
  if (request.audio.data.byteLength === 0) {
    throw new SpeechToTextError({
      code: "invalid_audio",
      message: "The audio input is empty.",
    });
  }

  if (!request.audio.mimeType.trim()) {
    throw new SpeechToTextError({
      code: "invalid_audio",
      message: "The audio MIME type is required.",
    });
  }

  if (!request.audio.fileName.trim()) {
    throw new SpeechToTextError({
      code: "invalid_audio",
      message: "The audio file name is required.",
    });
  }

  ensureSpeechToTextProvidersRegistered();

  const provider = getSpeechToTextProvider();

  return provider.transcribe(request);
}

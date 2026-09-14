import {
  cacheSpeech,
  clearInFlightSpeechRequest,
  createSpeechCacheKey,
  getCachedSpeech,
  getInFlightSpeechRequest,
  setInFlightSpeechRequest,
} from "./cache";
import { getTextToSpeechModel, getTextToSpeechVoice } from "./config";
import { getTextToSpeechProvider } from "./provider-registry";
import { ensureTextToSpeechProvidersRegistered } from "./providers";
import type { TextToSpeechRequest, TextToSpeechResult } from "./types";

export async function generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
  ensureTextToSpeechProvidersRegistered();

  const provider = getTextToSpeechProvider();

  /*
   * The provider still performs
   * authoritative validation.
   *
   * Normalizing here only ensures
   * equivalent requests share the
   * same cache entry.
   */
  const text = request.text.trim();

  const model = getTextToSpeechModel();

  const voice = request.voice?.trim() || getTextToSpeechVoice();

  const cacheKey = createSpeechCacheKey({
    provider: provider.id,
    model,
    voice,
    text,
  });

  const cached = getCachedSpeech(cacheKey);

  if (cached) {
    return cached;
  }

  /*
   * If two requests for the same
   * speech arrive simultaneously,
   * share the first provider call
   * instead of paying twice.
   */
  const existingRequest = getInFlightSpeechRequest(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const generationRequest = provider
    .generate({
      text,
      voice,
    })
    .then((result) => {
      cacheSpeech(cacheKey, result);

      return result;
    })
    .finally(() => {
      clearInFlightSpeechRequest(cacheKey);
    });

  setInFlightSpeechRequest(cacheKey, generationRequest);

  return generationRequest;
}

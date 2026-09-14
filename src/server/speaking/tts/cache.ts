import { createHash } from "node:crypto";

import type { TextToSpeechProviderId, TextToSpeechResult } from "./types";

const SPEECH_CACHE_TTL_MS = 15 * 60 * 1000;

const MAX_SPEECH_CACHE_ENTRIES = 100;

type SpeechCacheKeyInput = {
  provider: TextToSpeechProviderId;
  model: string;
  voice: string;
  text: string;
};

type SpeechCacheEntry = {
  expiresAt: number;
  result: TextToSpeechResult;
};

const speechCache = new Map<string, SpeechCacheEntry>();

const inFlightSpeechRequests = new Map<string, Promise<TextToSpeechResult>>();

function cloneSpeechResult(result: TextToSpeechResult): TextToSpeechResult {
  return {
    ...result,
    audio: new Uint8Array(result.audio),
  };
}

export function createSpeechCacheKey(input: SpeechCacheKeyInput): string {
  const hash = createHash("sha256");

  hash.update(input.provider);

  hash.update("\0");

  hash.update(input.model);

  hash.update("\0");

  hash.update(input.voice);

  hash.update("\0");

  hash.update(input.text);

  return hash.digest("hex");
}

function removeExpiredSpeechEntries(now: number): void {
  for (const [key, entry] of speechCache) {
    if (entry.expiresAt <= now) {
      speechCache.delete(key);
    }
  }
}

function enforceCacheSize(): void {
  while (speechCache.size > MAX_SPEECH_CACHE_ENTRIES) {
    const oldestKey = speechCache.keys().next().value;

    if (typeof oldestKey !== "string") {
      return;
    }

    speechCache.delete(oldestKey);
  }
}

export function getCachedSpeech(key: string): TextToSpeechResult | null {
  const now = Date.now();

  removeExpiredSpeechEntries(now);

  const entry = speechCache.get(key);

  if (!entry) {
    return null;
  }

  /*
   * Refresh insertion order so
   * frequently used entries stay
   * longer when the cache fills.
   */
  speechCache.delete(key);

  speechCache.set(key, entry);

  return cloneSpeechResult(entry.result);
}

export function cacheSpeech(key: string, result: TextToSpeechResult): void {
  const entry: SpeechCacheEntry = {
    expiresAt: Date.now() + SPEECH_CACHE_TTL_MS,
    result: cloneSpeechResult(result),
  };

  speechCache.delete(key);

  speechCache.set(key, entry);

  enforceCacheSize();
}

export function getInFlightSpeechRequest(key: string): Promise<TextToSpeechResult> | undefined {
  return inFlightSpeechRequests.get(key);
}

export function setInFlightSpeechRequest(key: string, request: Promise<TextToSpeechResult>): void {
  inFlightSpeechRequests.set(key, request);
}

export function clearInFlightSpeechRequest(key: string): void {
  inFlightSpeechRequests.delete(key);
}

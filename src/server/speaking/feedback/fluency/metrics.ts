import type { FluencyTranscriptMetrics } from "./types";

const VISIBLE_FILLERS = new Set(["um", "uh", "erm", "hmm"]);

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z'\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function calculateFluencyTranscriptMetrics(text: string): FluencyTranscriptMetrics {
  const words = normalizeWords(text);

  if (words.length === 0) {
    return {
      wordCount: 0,
      uniqueWordCount: 0,
      lexicalRepetitionRatio: 0,
      visibleFillerCount: 0,
    };
  }

  const uniqueWords = new Set(words);

  const repeatedWordCount = words.length - uniqueWords.size;

  const visibleFillerCount = words.reduce(
    (count, word) => (VISIBLE_FILLERS.has(word) ? count + 1 : count),
    0,
  );

  return {
    wordCount: words.length,

    uniqueWordCount: uniqueWords.size,

    lexicalRepetitionRatio: roundRatio(repeatedWordCount / words.length),

    visibleFillerCount,
  };
}

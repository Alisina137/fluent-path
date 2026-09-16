export const vocabularySuggestionKinds = [
  "more-precise",
  "more-natural",
  "less-repetitive",
  "stronger-collocation",
  "cefr-appropriate",
  "other",
] as const;

export type VocabularySuggestionKind = (typeof vocabularySuggestionKinds)[number];

export type VocabularyCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface VocabularySuggestionRequest {
  selectedText: string;
  targetCefrLevel: VocabularyCefrLevel;
}

export interface VocabularySuggestion {
  originalText: string;
  suggestedText: string;
  kind: VocabularySuggestionKind;
  explanation: string;
  example: string | null;
}

export interface VocabularySuggestionResult {
  schemaVersion: 1;
  originalText: string;
  summary: string;
  suggestions: VocabularySuggestion[];
}

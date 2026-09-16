export const writingAssistanceCefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type WritingAssistanceCefrLevel = (typeof writingAssistanceCefrLevels)[number];

export const grammarHelpCategories = [
  "agreement",
  "articles",
  "prepositions",
  "verb-form",
  "verb-tense",
  "word-order",
  "pronouns",
  "plural",
  "sentence-structure",
  "punctuation",
  "other",
] as const;

export type GrammarHelpCategory = (typeof grammarHelpCategories)[number];

export interface GrammarHelpRequest {
  selectedText: string;
  targetCefrLevel: WritingAssistanceCefrLevel;
}

export interface GrammarHelpIssue {
  originalText: string;
  correctedText: string;
  category: GrammarHelpCategory;
  explanation: string;
  example: string | null;
}

export interface GrammarHelpResult {
  schemaVersion: 1;
  originalText: string;
  correctedText: string;
  hasErrors: boolean;
  summary: string;
  issues: GrammarHelpIssue[];
}

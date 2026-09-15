export const vocabularyIssueCategories = [
  "word_choice",
  "collocation",
  "repetition",
  "register",
  "precision",
  "word_form",
  "idiomatic_usage",
  "overuse",
  "other",
] as const;

export type VocabularyIssueCategory = (typeof vocabularyIssueCategories)[number];

export const vocabularyIssueSeverities = ["minor", "moderate", "major"] as const;

export type VocabularyIssueSeverity = (typeof vocabularyIssueSeverities)[number];

export interface VocabularyIssue {
  category: VocabularyIssueCategory;

  severity: VocabularyIssueSeverity;

  originalText: string;

  suggestedText: string;

  explanation: string;

  startOffset: number | null;

  endOffset: number | null;
}

export interface VocabularyStrength {
  message: string;
}

export interface VocabularyEvaluation {
  score: number;

  summary: string;

  strengths: VocabularyStrength[];

  issues: VocabularyIssue[];
}

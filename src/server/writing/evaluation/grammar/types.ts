export const grammarIssueCategories = [
  "articles",
  "verb_tense",
  "subject_verb_agreement",
  "prepositions",
  "pronouns",
  "word_order",
  "sentence_structure",
  "conditionals",
  "modals",
  "comparatives",
  "conjunctions",
  "relative_clauses",
  "gerunds_infinitives",
  "countability",
  "pluralization",
  "possessives",
  "other",
] as const;

export type GrammarIssueCategory = (typeof grammarIssueCategories)[number];

export const grammarIssueSeverities = ["minor", "moderate", "major"] as const;

export type GrammarIssueSeverity = (typeof grammarIssueSeverities)[number];

export interface GrammarIssue {
  category: GrammarIssueCategory;
  severity: GrammarIssueSeverity;

  originalText: string;

  suggestedText: string;

  explanation: string;

  startOffset: number | null;

  endOffset: number | null;
}

export interface GrammarStrength {
  message: string;
}

export interface GrammarEvaluation {
  score: number;

  summary: string;

  strengths: GrammarStrength[];

  issues: GrammarIssue[];
}

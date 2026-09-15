export const coherenceIssueCategories = [
  "logical_flow",
  "paragraph_structure",
  "idea_development",
  "transitions",
  "referencing",
  "relevance",
  "redundancy",
  "introduction",
  "conclusion",
  "other",
] as const;

export type CoherenceIssueCategory = (typeof coherenceIssueCategories)[number];

export const coherenceIssueSeverities = ["minor", "moderate", "major"] as const;

export type CoherenceIssueSeverity = (typeof coherenceIssueSeverities)[number];

export interface CoherenceIssue {
  category: CoherenceIssueCategory;

  severity: CoherenceIssueSeverity;

  originalText: string | null;

  suggestedText: string | null;

  explanation: string;

  startOffset: number | null;

  endOffset: number | null;
}

export interface CoherenceStrength {
  message: string;
}

export interface CoherenceEvaluation {
  score: number;

  summary: string;

  strengths: CoherenceStrength[];

  issues: CoherenceIssue[];
}

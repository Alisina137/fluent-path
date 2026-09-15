export const mechanicsIssueCategories = [
  "spelling",
  "punctuation",
  "capitalization",
  "apostrophe",
  "spacing",
  "formatting",
  "other",
] as const;

export type MechanicsIssueCategory = (typeof mechanicsIssueCategories)[number];

export const mechanicsIssueSeverities = ["minor", "moderate", "major"] as const;

export type MechanicsIssueSeverity = (typeof mechanicsIssueSeverities)[number];

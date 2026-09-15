export const taskAchievementIssueCategories = [
  "prompt_fulfillment",
  "missing_requirement",
  "purpose",
  "audience",
  "tone",
  "content_relevance",
  "development",
  "word_count",
  "other",
] as const;

export type TaskAchievementIssueCategory = (typeof taskAchievementIssueCategories)[number];

export const taskAchievementIssueSeverities = ["minor", "moderate", "major"] as const;

export type TaskAchievementIssueSeverity = (typeof taskAchievementIssueSeverities)[number];

export interface TaskAchievementIssue {
  category: TaskAchievementIssueCategory;

  severity: TaskAchievementIssueSeverity;

  originalText: string | null;

  suggestedText: string | null;

  explanation: string;

  startOffset: number | null;

  endOffset: number | null;
}

export interface TaskAchievementStrength {
  message: string;
}

export interface TaskAchievementEvaluation {
  score: number;

  summary: string;

  strengths: TaskAchievementStrength[];

  issues: TaskAchievementIssue[];
}

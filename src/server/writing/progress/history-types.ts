export interface WritingSubmissionScores {
  overall: number;
  grammar: number;
  vocabulary: number;
  coherence: number;
  taskAchievement: number;
  mechanics: number;
}

export interface WritingSubmissionHistoryRevision {
  revisionId: string;
  revisionNumber: number;
  wordCount: number;
  characterCount: number;
  submittedAt: Date;
  evaluatedAt: Date;
  scores: WritingSubmissionScores;
}

export interface WritingSubmissionHistorySession {
  sessionId: string;
  taskId: string | null;
  title: string;
  writingType: string;
  targetCefrLevel: string;
  category: string | null;
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  completedAt: Date | null;
  revisions: WritingSubmissionHistoryRevision[];
}

export interface WritingSubmissionHistory {
  totalEvaluatedRevisions: number;
  totalSessions: number;
  sessions: WritingSubmissionHistorySession[];
}

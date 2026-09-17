export interface WritingSkillScores {
  overall: number;
  grammar: number;
  vocabulary: number;
  coherence: number;
  taskAchievement: number;
  mechanics: number;
}

export interface WritingSkillMetrics {
  evaluatedRevisionCount: number;
  evaluatedSessionCount: number;

  latest: WritingSkillScores | null;

  averages: WritingSkillScores | null;
}

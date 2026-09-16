export const paraphraseGoals = ["natural", "simpler", "concise", "clearer"] as const;

export type ParaphraseGoal = (typeof paraphraseGoals)[number];

export type ParaphraseCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ParaphraseRequest {
  selectedText: string;
  targetCefrLevel: ParaphraseCefrLevel;
  goal: ParaphraseGoal;
}

export interface ParaphraseOption {
  text: string;
  explanation: string;
}

export interface ParaphraseResult {
  schemaVersion: 1;
  originalText: string;
  goal: ParaphraseGoal;
  summary: string;
  options: ParaphraseOption[];
}

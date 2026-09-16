export const writingToneTargets = [
  "neutral",
  "formal",
  "informal",
  "professional",
  "friendly",
  "academic",
] as const;

export type WritingToneTarget = (typeof writingToneTargets)[number];

export type ToneCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const toneGuidanceCategories = [
  "formality",
  "word-choice",
  "directness",
  "politeness",
  "sentence-style",
  "contractions",
  "personal-language",
  "academic-style",
  "professional-style",
  "other",
] as const;

export type ToneGuidanceCategory = (typeof toneGuidanceCategories)[number];

export interface ToneGuidanceRequest {
  selectedText: string;
  targetCefrLevel: ToneCefrLevel;
  targetTone: WritingToneTarget;
}

export interface ToneGuidanceIssue {
  originalText: string;
  suggestedText: string;
  category: ToneGuidanceCategory;
  explanation: string;
}

export interface ToneGuidanceResult {
  schemaVersion: 1;
  originalText: string;
  targetTone: WritingToneTarget;
  matchesTargetTone: boolean;
  detectedTone: string;
  summary: string;
  issues: ToneGuidanceIssue[];
}

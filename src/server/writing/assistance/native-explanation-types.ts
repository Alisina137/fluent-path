export const writingNativeLanguages = [
  "English",
  "Spanish",
  "Persian",
  "Arabic",
  "Chinese",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Japanese",
  "Korean",
] as const;

export type WritingNativeLanguage = (typeof writingNativeLanguages)[number];

export type NativeExplanationCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const nativeExplanationContexts = [
  "grammar",
  "vocabulary",
  "tone",
  "paraphrasing",
  "general",
] as const;

export type NativeExplanationContext = (typeof nativeExplanationContexts)[number];

export interface NativeExplanationRequest {
  englishExplanation: string;
  targetLanguage: WritingNativeLanguage;
  targetCefrLevel: NativeExplanationCefrLevel;
  context: NativeExplanationContext;
}

export interface NativeExplanationResult {
  schemaVersion: 1;
  targetLanguage: WritingNativeLanguage;
  explanation: string;
}

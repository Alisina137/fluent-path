export const MODULE_IDS = {
  speaking: "speaking",
  writing: "writing",
  vocabulary: "vocabulary",
  listening: "listening",
  reading: "reading",
  grammar: "grammar",
  stories: "stories",
  ielts: "ielts",
  interview: "interview",
  business: "business",
} as const;

export type ServerModuleId = (typeof MODULE_IDS)[keyof typeof MODULE_IDS];

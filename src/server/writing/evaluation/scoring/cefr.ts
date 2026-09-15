export const writingCefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type WritingCefrLevel = (typeof writingCefrLevels)[number];

export function isWritingCefrLevel(value: string): value is WritingCefrLevel {
  return writingCefrLevels.includes(value as WritingCefrLevel);
}

export function requireWritingCefrLevel(value: string): WritingCefrLevel {
  const normalized = value.trim().toUpperCase();

  if (!isWritingCefrLevel(normalized)) {
    throw new Error(`Unsupported writing CEFR level: ${value}`);
  }

  return normalized;
}

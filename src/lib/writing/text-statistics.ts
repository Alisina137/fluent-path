export interface WritingTextStatistics {
  wordCount: number;
  characterCount: number;
}

export function getWritingTextStatistics(content: string): WritingTextStatistics {
  const trimmedContent = content.trim();

  const wordCount = trimmedContent.length === 0 ? 0 : trimmedContent.split(/\s+/u).length;

  const characterCount = Array.from(content).length;

  return {
    wordCount,
    characterCount,
  };
}

import type {
  WritingComparisonSegment,
  WritingRevisionComparison,
  WritingRevisionComparisonSide,
} from "./types";
import { measureWritingImprovement } from "../improvement/measure";

interface DiffOperation {
  type: "unchanged" | "added" | "removed";
  value: string;
}

export function compareWritingRevisions(
  before: WritingRevisionComparisonSide,
  after: WritingRevisionComparisonSide,
): WritingRevisionComparison {
  const operations = createWordDiff(tokenize(before.content), tokenize(after.content));

  const beforeSegments = mergeSegments(
    operations
      .filter((operation) => operation.type !== "added")
      .map((operation) => ({
        type: operation.type,
        text: operation.value,
      })),
  );

  const afterSegments = mergeSegments(
    operations
      .filter((operation) => operation.type !== "removed")
      .map((operation) => ({
        type: operation.type,
        text: operation.value,
      })),
  );

  const addedWordCount = operations.filter(
    (operation) => operation.type === "added" && isWordToken(operation.value),
  ).length;

  const removedWordCount = operations.filter(
    (operation) => operation.type === "removed" && isWordToken(operation.value),
  ).length;
  const improvement = measureWritingImprovement({
    beforeOverallScore: before.overallScore,
    afterOverallScore: after.overallScore,
    beforeDimensions: before.dimensionScores,
    afterDimensions: after.dimensionScores,
  });

  return {
    before,
    after,

    beforeSegments,
    afterSegments,

    statistics: {
      wordCountDifference: after.wordCount - before.wordCount,

      characterCountDifference: after.characterCount - before.characterCount,

      scoreDifference:
        before.overallScore !== null && after.overallScore !== null
          ? after.overallScore - before.overallScore
          : null,

      addedWordCount,
      removedWordCount,
    },

    improvement,
  };
}

function tokenize(content: string): string[] {
  return content.match(/\s+|[^\s]+/g) ?? [];
}

function isWordToken(token: string): boolean {
  return /\p{L}|\p{N}/u.test(token);
}

function createWordDiff(before: string[], after: string[]): DiffOperation[] {
  const beforeLength = before.length;
  const afterLength = after.length;

  const table = Array.from({ length: beforeLength + 1 }, () => new Uint32Array(afterLength + 1));

  for (let beforeIndex = beforeLength - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = afterLength - 1; afterIndex >= 0; afterIndex -= 1) {
      if (before[beforeIndex] === after[afterIndex]) {
        table[beforeIndex]![afterIndex] = table[beforeIndex + 1]![afterIndex + 1]! + 1;
      } else {
        table[beforeIndex]![afterIndex] = Math.max(
          table[beforeIndex + 1]![afterIndex]!,
          table[beforeIndex]![afterIndex + 1]!,
        );
      }
    }
  }

  const operations: DiffOperation[] = [];

  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < beforeLength && afterIndex < afterLength) {
    if (before[beforeIndex] === after[afterIndex]) {
      operations.push({
        type: "unchanged",
        value: before[beforeIndex]!,
      });

      beforeIndex += 1;
      afterIndex += 1;

      continue;
    }

    if (table[beforeIndex + 1]![afterIndex]! >= table[beforeIndex]![afterIndex + 1]!) {
      operations.push({
        type: "removed",
        value: before[beforeIndex]!,
      });

      beforeIndex += 1;
    } else {
      operations.push({
        type: "added",
        value: after[afterIndex]!,
      });

      afterIndex += 1;
    }
  }

  while (beforeIndex < beforeLength) {
    operations.push({
      type: "removed",
      value: before[beforeIndex]!,
    });

    beforeIndex += 1;
  }

  while (afterIndex < afterLength) {
    operations.push({
      type: "added",
      value: after[afterIndex]!,
    });

    afterIndex += 1;
  }

  return operations;
}

function mergeSegments(segments: WritingComparisonSegment[]): WritingComparisonSegment[] {
  const merged: WritingComparisonSegment[] = [];

  for (const segment of segments) {
    const previous = merged.at(-1);

    if (previous?.type === segment.type) {
      previous.text += segment.text;
      continue;
    }

    merged.push({
      ...segment,
    });
  }

  return merged;
}

import type { WritingFeedbackCollection, WritingTextFeedback } from "./types";

import { splitWritingIntoSentences, type WritingSentence } from "./sentences";

export interface WritingSentenceFeedback {
  sentence: WritingSentence;
  feedback: WritingTextFeedback[];
  counts: {
    total: number;
    minor: number;
    moderate: number;
    major: number;
  };
}

export interface WritingSentenceFeedbackResult {
  sentences: WritingSentenceFeedback[];
  unassignedFeedback: WritingTextFeedback[];
}

export function buildSentenceFeedback(
  learnerText: string,
  feedback: WritingFeedbackCollection,
): WritingSentenceFeedbackResult {
  const sentences = splitWritingIntoSentences(learnerText);

  const groups: WritingSentenceFeedback[] = sentences.map((sentence) => ({
    sentence,

    feedback: [],

    counts: {
      total: 0,
      minor: 0,
      moderate: 0,
      major: 0,
    },
  }));

  const unassignedFeedback: WritingTextFeedback[] = [];

  for (const item of feedback.textItems) {
    const group = findSentenceForFeedback(groups, item);

    if (!group) {
      unassignedFeedback.push(item);
      continue;
    }

    group.feedback.push(item);
  }

  for (const group of groups) {
    group.feedback.sort(
      (left, right) =>
        left.startOffset - right.startOffset ||
        left.endOffset - right.endOffset ||
        left.id.localeCompare(right.id),
    );

    group.counts = {
      total: group.feedback.length,

      minor: countSeverity(group.feedback, "minor"),

      moderate: countSeverity(group.feedback, "moderate"),

      major: countSeverity(group.feedback, "major"),
    };
  }

  return {
    sentences: groups,
    unassignedFeedback,
  };
}

function findSentenceForFeedback(
  groups: WritingSentenceFeedback[],
  feedback: WritingTextFeedback,
): WritingSentenceFeedback | null {
  for (const group of groups) {
    if (
      feedback.startOffset >= group.sentence.startOffset &&
      feedback.endOffset <= group.sentence.endOffset
    ) {
      return group;
    }
  }

  return null;
}

function countSeverity(
  feedback: WritingTextFeedback[],
  severity: WritingTextFeedback["severity"],
): number {
  return feedback.reduce((count, item) => (item.severity === severity ? count + 1 : count), 0);
}

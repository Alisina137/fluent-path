import type { WritingEvaluationRequest } from "../types";

import { GRAMMAR_EVALUATION_INSTRUCTIONS } from "./instructions";

export function buildGrammarEvaluationPrompt(request: WritingEvaluationRequest): string {
  const { revision, task } = request;

  return `
${GRAMMAR_EVALUATION_INSTRUCTIONS}

LEARNER WRITING CONTEXT

Target CEFR level:
${task.targetCefrLevel}

Writing type:
${task.writingType}

Task title:
${task.title ?? "Not provided"}

Writing prompt:
${task.prompt ?? "Not provided"}

Intended audience:
${task.audience ?? "Not provided"}

Purpose:
${task.purpose ?? "Not provided"}

Expected tone:
${task.tone ?? "Not provided"}

Target word range:
${formatWordRange(task.minWords, task.maxWords)}

Actual word count:
${revision.wordCount}

LEARNER TEXT

<learner_text>
${revision.content}
</learner_text>
`.trim();
}

function formatWordRange(minWords: number | null, maxWords: number | null): string {
  if (minWords !== null && maxWords !== null) {
    return `${minWords}-${maxWords} words`;
  }

  if (minWords !== null) {
    return `At least ${minWords} words`;
  }

  if (maxWords !== null) {
    return `At most ${maxWords} words`;
  }

  return "Not specified";
}

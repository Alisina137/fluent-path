import type { WritingEvaluationRequest } from "../types";

import { TASK_ACHIEVEMENT_EVALUATION_INSTRUCTIONS } from "./instructions";

export function buildTaskAchievementEvaluationPrompt(request: WritingEvaluationRequest): string {
  const { revision, task } = request;

  return `
${TASK_ACHIEVEMENT_EVALUATION_INSTRUCTIONS}

LEARNER WRITING CONTEXT

Target CEFR level:
${task.targetCefrLevel}

Writing type:
${task.writingType}

Task source:
${task.source}

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

Minimum words:
${formatOptionalNumber(task.minWords)}

Maximum words:
${formatOptionalNumber(task.maxWords)}

Actual word count:
${revision.wordCount}

LEARNER TEXT

<learner_text>
${revision.content}
</learner_text>
`.trim();
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "Not specified" : String(value);
}

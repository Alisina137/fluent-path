import type { WritingEvaluationRequest, WritingEvaluationResult } from "./types";

export interface WritingEvaluationProvider {
  readonly id: string;

  evaluate(request: WritingEvaluationRequest): Promise<WritingEvaluationResult>;
}

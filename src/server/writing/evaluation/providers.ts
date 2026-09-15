import { openAiWritingEvaluationProvider } from "./openai-provider";
import { registerWritingEvaluationProvider } from "./provider-registry";

let registered = false;

export function ensureWritingEvaluationProvidersRegistered(): void {
  if (registered) {
    return;
  }

  registerWritingEvaluationProvider(openAiWritingEvaluationProvider);

  registered = true;
}

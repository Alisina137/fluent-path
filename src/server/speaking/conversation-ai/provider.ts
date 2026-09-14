import type { ConversationAiRequest, ConversationAiResult } from "./types";

export interface ConversationAiProvider {
  readonly id: "openai";

  generate(request: ConversationAiRequest): Promise<ConversationAiResult>;
}

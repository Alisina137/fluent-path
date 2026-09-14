import type { TextToSpeechProviderId, TextToSpeechRequest, TextToSpeechResult } from "./types";

export type TextToSpeechProvider = {
  id: TextToSpeechProviderId;

  generate(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
};

import type { SpeechToTextProviderId, SpeechToTextRequest, SpeechToTextResult } from "./types";

export interface SpeechToTextProvider {
  readonly id: SpeechToTextProviderId;

  transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult>;
}

import { WritingEvaluationError } from "./errors";
import type { WritingEvaluationProvider } from "./provider";

const providers = new Map<string, WritingEvaluationProvider>();

export function registerWritingEvaluationProvider(provider: WritingEvaluationProvider): void {
  providers.set(provider.id, provider);
}

export function getWritingEvaluationProvider(providerId: string): WritingEvaluationProvider {
  const provider = providers.get(providerId);

  if (!provider) {
    throw new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The writing evaluation provider is unavailable.",
      retryable: true,
    });
  }

  return provider;
}

export function clearWritingEvaluationProviders(): void {
  providers.clear();
}

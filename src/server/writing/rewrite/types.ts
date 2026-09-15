export interface WritingRewriteRequest {
  revisionId: string;
  feedbackId: string;
}

export interface WritingRewriteProviderRequest {
  originalText: string;
  category: string;
  dimension: string;
  feedbackMessage: string;
  feedbackExplanation: string;
  existingSuggestion: string | null;
  targetCefrLevel: string;
}

export interface WritingRewriteSuggestion {
  rewrittenText: string;
  explanation: string;
  learningPoint: string;
  provider: string;
  model: string;
  providerRequestId: string | null;
}

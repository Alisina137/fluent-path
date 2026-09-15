import { GraduationCap, Sparkles } from "lucide-react";

import type { WritingRewriteSuggestion as WritingRewriteSuggestionResult } from "@/server/writing/rewrite/types";

interface WritingRewriteSuggestionProps {
  originalText: string;
  suggestion: WritingRewriteSuggestionResult;
}

export function WritingRewriteSuggestion({
  originalText,
  suggestion,
}: WritingRewriteSuggestionProps) {
  return (
    <div
      className="mt-4 space-y-4 rounded-lg border bg-muted/20 p-4"
      aria-label="AI rewrite suggestion"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4" aria-hidden="true" />

        <p className="text-sm font-medium">AI rewrite suggestion</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Your writing</p>

          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6">
            {originalText}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Possible rewrite</p>

          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6">
            {suggestion.rewrittenText}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Why this is better</p>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">{suggestion.explanation}</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-background p-3">
        <GraduationCap className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

        <div>
          <p className="text-sm font-medium">Learning point</p>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">{suggestion.learningPoint}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This is a learning suggestion, not an automatic replacement. You decide how to revise your
        writing.
      </p>
    </div>
  );
}

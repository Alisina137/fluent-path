import { BookOpen, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { WritingNativeExplanation } from "@/components/writing/WritingNativeExplanation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestVocabularySuggestionsServerFn } from "@/lib/writing/vocabulary-assistance-functions";

type VocabularyCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type VocabularySuggestionResult = Awaited<ReturnType<typeof requestVocabularySuggestionsServerFn>>;

interface WritingVocabularySuggestionsProps {
  userId: string;
  selectedText: string;
  targetCefrLevel: VocabularyCefrLevel;
  disabled?: boolean;
}

function formatSuggestionKind(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WritingVocabularySuggestions({
  userId,
  selectedText,
  targetCefrLevel,
  disabled = false,
}: WritingVocabularySuggestionsProps) {
  const [result, setResult] = useState<VocabularySuggestionResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  async function handleRequestSuggestions(): Promise<void> {
    if (disabled || isLoading || !selectedText.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await requestVocabularySuggestionsServerFn({
        data: {
          userId,
          selectedText,
          targetCefrLevel,
        },
      });

      setResult(response);
    } catch {
      setError("Vocabulary suggestions could not analyze this text right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Vocabulary Suggestions</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Explore clearer, more natural, and more precise vocabulary.
            </p>
          </div>

          <Badge variant="outline">CEFR {targetCefrLevel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Selected text</p>

          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6">
            {selectedText}
          </p>
        </div>

        <Button
          type="button"
          disabled={disabled || isLoading || !selectedText.trim()}
          onClick={() => {
            void handleRequestSuggestions();
          }}
        >
          {isLoading ? (
            <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <BookOpen aria-hidden="true" />
          )}

          {isLoading ? "Finding vocabulary..." : "Suggest vocabulary"}
        </Button>

        {error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-4 border-t pt-4" aria-live="polite">
            <div className="flex items-start gap-3">
              {result.suggestions.length > 0 ? (
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              )}

              <div>
                <p className="font-medium">
                  {result.suggestions.length > 0
                    ? "Vocabulary suggestions ready"
                    : "Your vocabulary already fits well"}
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">{result.summary}</p>
                <WritingNativeExplanation
                  userId={userId}
                  englishExplanation={result.summary}
                  targetCefrLevel={targetCefrLevel}
                  context="vocabulary"
                  disabled={disabled}
                />
              </div>
            </div>

            {result.suggestions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Vocabulary to explore</h4>

                {result.suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.originalText}-${suggestion.suggestedText}-${index}`}
                    className="rounded-lg border p-3"
                  >
                    <Badge variant="secondary">{formatSuggestionKind(suggestion.kind)}</Badge>

                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Your wording</dt>

                        <dd className="mt-1 text-sm">{suggestion.originalText}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Alternative</dt>

                        <dd className="mt-1 text-sm font-medium">{suggestion.suggestedText}</dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">Why consider it?</p>

                      <p className="mt-1 text-sm leading-6">{suggestion.explanation}</p>
                      <WritingNativeExplanation
                        userId={userId}
                        englishExplanation={suggestion.explanation}
                        targetCefrLevel={targetCefrLevel}
                        context="vocabulary"
                        disabled={disabled}
                      />
                    </div>

                    {suggestion.example ? (
                      <div className="mt-3 rounded-md bg-muted/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Example</p>

                        <p className="mt-1 text-sm">{suggestion.example}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs leading-5 text-muted-foreground">
              Vocabulary Suggestions does not change your draft. Consider the alternatives and
              choose the wording that best expresses what you mean.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

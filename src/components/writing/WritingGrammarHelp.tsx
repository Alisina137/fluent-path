import { CheckCircle2, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestGrammarHelpServerFn } from "@/lib/writing/grammar-assistance-functions";
import { WritingNativeExplanation } from "@/components/writing/WritingNativeExplanation";
type GrammarHelpResult = Awaited<ReturnType<typeof requestGrammarHelpServerFn>>;

type WritingAssistanceCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface WritingGrammarHelpProps {
  userId: string;
  selectedText: string;
  targetCefrLevel: WritingAssistanceCefrLevel;
  disabled?: boolean;
  onClearSelection: () => void;
}

function formatCategory(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WritingGrammarHelp({
  userId,
  selectedText,
  targetCefrLevel,
  disabled = false,
  onClearSelection,
}: WritingGrammarHelpProps) {
  const [result, setResult] = useState<GrammarHelpResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  async function handleRequestGrammarHelp() {
    if (disabled || isLoading || !selectedText.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await requestGrammarHelpServerFn({
        data: {
          userId,
          selectedText,
          targetCefrLevel,
        },
      });

      setResult(response);
    } catch {
      setError("Grammar help could not analyze this text right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Grammar Help</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Understand grammar in the text you selected.
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

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={disabled || isLoading || !selectedText.trim()}
            onClick={() => {
              void handleRequestGrammarHelp();
            }}
          >
            {isLoading ? (
              <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}

            {isLoading ? "Checking grammar..." : "Check grammar"}
          </Button>

          <Button type="button" variant="outline" disabled={isLoading} onClick={onClearSelection}>
            <RotateCcw aria-hidden="true" />
            Clear selection
          </Button>
        </div>

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
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />

              <div>
                <p className="font-medium">
                  {result.hasErrors ? "Grammar review complete" : "No grammar problems found"}
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">{result.summary}</p>
                <WritingNativeExplanation
                  userId={userId}
                  englishExplanation={result.summary}
                  targetCefrLevel={targetCefrLevel}
                  context="grammar"
                  disabled={disabled}
                />
              </div>
            </div>

            {result.hasErrors ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">Corrected version</p>

                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6">
                  {result.correctedText}
                </p>
              </div>
            ) : null}

            {result.issues.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">What to learn</h4>

                {result.issues.map((issue, index) => (
                  <div key={`${issue.category}-${index}`} className="rounded-lg border p-3">
                    <Badge variant="secondary">{formatCategory(issue.category)}</Badge>

                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Your text</dt>

                        <dd className="mt-1 text-sm">{issue.originalText}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Correction</dt>

                        <dd className="mt-1 text-sm font-medium">{issue.correctedText}</dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">Why?</p>

                      <p className="mt-1 text-sm leading-6">{issue.explanation}</p>
                      <WritingNativeExplanation
                        userId={userId}
                        englishExplanation={issue.explanation}
                        targetCefrLevel={targetCefrLevel}
                        context="grammar"
                        disabled={disabled}
                      />
                    </div>

                    {issue.example ? (
                      <div className="mt-3 rounded-md bg-muted/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Example</p>

                        <p className="mt-1 text-sm">{issue.example}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs leading-5 text-muted-foreground">
              Grammar Help does not change your draft. Review the explanation and decide how you
              want to revise your writing.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

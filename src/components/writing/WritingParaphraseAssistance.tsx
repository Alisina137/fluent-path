import { Languages, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { WritingNativeExplanation } from "@/components/writing/WritingNativeExplanation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestParaphrasesServerFn } from "@/lib/writing/paraphrase-assistance-functions";

type ParaphraseCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type ParaphraseGoal = "natural" | "simpler" | "concise" | "clearer";

type ParaphraseResult = Awaited<ReturnType<typeof requestParaphrasesServerFn>>;

interface WritingParaphraseAssistanceProps {
  selectedText: string;
  targetCefrLevel: ParaphraseCefrLevel;
  disabled?: boolean;
}

function formatGoal(value: string): string {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WritingParaphraseAssistance({
  selectedText,
  targetCefrLevel,
  disabled = false,
}: WritingParaphraseAssistanceProps) {
  const [goal, setGoal] = useState<ParaphraseGoal>("natural");

  const [result, setResult] = useState<ParaphraseResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleGoalChange(value: string): void {
    setGoal(value as ParaphraseGoal);
    setResult(null);
    setError(null);
  }

  async function handleParaphrase(): Promise<void> {
    if (disabled || isLoading || !selectedText.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await requestParaphrasesServerFn({
        data: {
          selectedText,
          targetCefrLevel,
          goal,
        },
      });

      setResult(response);
    } catch {
      setError("Paraphrasing assistance is unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Paraphrasing Assistance</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Explore different ways to express the same meaning.
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

        <div className="space-y-2">
          <Label htmlFor="writing-paraphrase-goal">Paraphrasing goal</Label>

          <Select value={goal} onValueChange={handleGoalChange} disabled={disabled || isLoading}>
            <SelectTrigger id="writing-paraphrase-goal">
              <SelectValue placeholder="Choose a goal" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="natural">More natural</SelectItem>

              <SelectItem value="simpler">Simpler</SelectItem>

              <SelectItem value="concise">More concise</SelectItem>

              <SelectItem value="clearer">Clearer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          disabled={disabled || isLoading || !selectedText.trim()}
          onClick={() => {
            void handleParaphrase();
          }}
        >
          {isLoading ? (
            <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Languages aria-hidden="true" />
          )}

          {isLoading ? "Creating alternatives..." : "Show paraphrases"}
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
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />

              <div>
                <p className="font-medium">{formatGoal(result.goal)} alternatives</p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">{result.summary}</p>
                <WritingNativeExplanation
                  englishExplanation={result.summary}
                  targetCefrLevel={targetCefrLevel}
                  context="paraphrasing"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-3">
              {result.options.map((option, index) => (
                <div key={`${option.text}-${index}`} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Option {index + 1}</Badge>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm font-medium leading-6">
                    {option.text}
                  </p>

                  <div className="mt-3 rounded-md bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground">What changed?</p>

                    <p className="mt-1 text-sm leading-6">{option.explanation}</p>
                    <WritingNativeExplanation
                      englishExplanation={option.explanation}
                      targetCefrLevel={targetCefrLevel}
                      context="paraphrasing"
                      disabled={disabled}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Paraphrasing Assistance does not replace your selected text. Compare the alternatives,
              learn from them, and decide how you want to revise your draft.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

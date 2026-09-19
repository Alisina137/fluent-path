import { CheckCircle2, Loader2, MessageSquareText } from "lucide-react";
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
import { requestToneGuidanceServerFn } from "@/lib/writing/tone-assistance-functions";

type ToneCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type WritingToneTarget =
  "neutral" | "formal" | "informal" | "professional" | "friendly" | "academic";

type ToneGuidanceResult = Awaited<ReturnType<typeof requestToneGuidanceServerFn>>;

interface WritingToneGuidanceProps {
  selectedText: string;
  targetCefrLevel: ToneCefrLevel;
  disabled?: boolean;
}

function formatValue(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WritingToneGuidance({
  selectedText,
  targetCefrLevel,
  disabled = false,
}: WritingToneGuidanceProps) {
  const [targetTone, setTargetTone] = useState<WritingToneTarget>("neutral");

  const [result, setResult] = useState<ToneGuidanceResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  function handleToneChange(value: string): void {
    setTargetTone(value as WritingToneTarget);
    setResult(null);
    setError(null);
  }

  async function handleAnalyzeTone(): Promise<void> {
    if (disabled || isLoading || !selectedText.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await requestToneGuidanceServerFn({
        data: {
          selectedText,
          targetCefrLevel,
          targetTone,
        },
      });

      setResult(response);
    } catch {
      setError("Tone guidance could not analyze this text right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Tone & Formality Guidance</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              See how your wording fits the tone you want to communicate.
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
          <Label htmlFor="writing-target-tone">Desired tone</Label>

          <Select
            value={targetTone}
            onValueChange={handleToneChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger id="writing-target-tone">
              <SelectValue placeholder="Choose a tone" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          disabled={disabled || isLoading || !selectedText.trim()}
          onClick={() => {
            void handleAnalyzeTone();
          }}
        >
          {isLoading ? (
            <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <MessageSquareText aria-hidden="true" />
          )}

          {isLoading ? "Analyzing tone..." : "Analyze tone"}
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
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />

              <div>
                <p className="font-medium">
                  {result.matchesTargetTone
                    ? `Your writing fits a ${formatValue(result.targetTone)} tone`
                    : `Your writing could better match a ${formatValue(result.targetTone)} tone`}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Detected: {result.detectedTone}
                </p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.summary}</p>
                <WritingNativeExplanation
                  englishExplanation={result.summary}
                  targetCefrLevel={targetCefrLevel}
                  context="tone"
                  disabled={disabled}
                />
              </div>
            </div>

            {result.issues.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Tone points to consider</h4>

                {result.issues.map((issue, index) => (
                  <div
                    key={`${issue.category}-${issue.originalText}-${index}`}
                    className="rounded-lg border p-3"
                  >
                    <Badge variant="secondary">{formatValue(issue.category)}</Badge>

                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Your wording</dt>

                        <dd className="mt-1 text-sm">{issue.originalText}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Possible alternative
                        </dt>

                        <dd className="mt-1 text-sm font-medium">{issue.suggestedText}</dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">Why?</p>

                      <p className="mt-1 text-sm leading-6">{issue.explanation}</p>
                      <WritingNativeExplanation
                        englishExplanation={issue.explanation}
                        targetCefrLevel={targetCefrLevel}
                        context="tone"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs leading-5 text-muted-foreground">
              Tone Guidance does not change your draft. Consider the guidance and decide whether the
              suggested tone fits what you want to communicate.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

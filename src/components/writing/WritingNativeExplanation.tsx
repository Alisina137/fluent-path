import { Languages, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { requestNativeExplanationServerFn } from "@/lib/writing/native-explanation-functions";

type NativeExplanationLanguage =
  | "English"
  | "Spanish"
  | "Persian"
  | "Arabic"
  | "Chinese"
  | "French"
  | "German"
  | "Portuguese"
  | "Hindi"
  | "Japanese"
  | "Korean";

type NativeExplanationCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type NativeExplanationContext = "grammar" | "vocabulary" | "tone" | "paraphrasing" | "general";

interface WritingNativeExplanationProps {
  englishExplanation: string;
  targetCefrLevel: NativeExplanationCefrLevel;
  context: NativeExplanationContext;
  disabled?: boolean;
}

type NativeExplanationResult = Awaited<ReturnType<typeof requestNativeExplanationServerFn>>;

const supportedLanguages: readonly NativeExplanationLanguage[] = [
  "English",
  "Spanish",
  "Persian",
  "Arabic",
  "Chinese",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Japanese",
  "Korean",
];

function normalizeNativeLanguage(value: string | null | undefined): NativeExplanationLanguage {
  const language = supportedLanguages.find((supportedLanguage) => supportedLanguage === value);

  return language ?? "English";
}

function getLanguageCode(language: NativeExplanationLanguage): string {
  const codes: Record<NativeExplanationLanguage, string> = {
    English: "en",
    Spanish: "es",
    Persian: "fa",
    Arabic: "ar",
    Chinese: "zh-CN",
    French: "fr",
    German: "de",
    Portuguese: "pt",
    Hindi: "hi",
    Japanese: "ja",
    Korean: "ko",
  };

  return codes[language];
}

function getLanguageDirection(language: NativeExplanationLanguage): "ltr" | "rtl" {
  return language === "Persian" || language === "Arabic" ? "rtl" : "ltr";
}

export function WritingNativeExplanation({
  englishExplanation,
  targetCefrLevel,
  context,
  disabled = false,
}: WritingNativeExplanationProps) {
  const { session } = useAuth();

  const targetLanguage = useMemo(
    () => normalizeNativeLanguage(session?.language?.native_language),
    [session?.language?.native_language],
  );

  const [result, setResult] = useState<NativeExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [englishExplanation, targetLanguage]);

  async function handleExplain(): Promise<void> {
    if (disabled || isLoading || !englishExplanation.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await requestNativeExplanationServerFn({
        data: {
          englishExplanation,
          targetLanguage,
          targetCefrLevel,
          context,
        },
      });

      setResult(response);
    } catch {
      setError(`The explanation could not be provided in ${targetLanguage} right now.`);
    } finally {
      setIsLoading(false);
    }
  }

  if (targetLanguage === "English") {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isLoading || !englishExplanation.trim()}
        onClick={() => {
          void handleExplain();
        }}
      >
        {isLoading ? (
          <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <Languages aria-hidden="true" />
        )}

        {isLoading ? "Explaining..." : `Explain in ${targetLanguage}`}
      </Button>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          className="rounded-md border bg-muted/40 p-3"
          aria-live="polite"
          lang={getLanguageCode(result.targetLanguage)}
          dir={getLanguageDirection(result.targetLanguage)}
        >
          <p className="text-xs font-medium text-muted-foreground">
            Explanation in {result.targetLanguage}
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{result.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}

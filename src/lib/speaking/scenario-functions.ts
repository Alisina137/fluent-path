import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const generateCustomSpeakingScenarioInputSchema = z.object({
  userId: z.string().uuid(),

  description: z.string().trim().min(10).max(2_000),
});

type CustomScenarioFailureCode =
  | "invalid_request"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "generation_failed"
  | "invalid_response"
  | "unexpected_error";

type CustomScenarioFailure = {
  ok: false;

  error: {
    code: CustomScenarioFailureCode;

    message: string;

    retryable: boolean;
  };
};

type CustomScenarioSuccess = {
  ok: true;

  scenario: {
    id: string;

    slug: string;

    title: string;

    description: string;

    category: string;

    difficulty: string;

    cefrRange: {
      min: string;

      max: string;
    };

    conversationType: string;

    learnerRole: string | null;

    coachRole: string | null;

    objective: string;

    setting: string | null;

    skills: string[];

    suggestedOpening: string | null;

    tags: string[];

    estimatedMinutes: number;

    active: boolean;
  };

  context: {
    id: string;

    title: string;

    description: string;

    learnerRole?: string | null;

    coachRole?: string | null;

    objective?: string | null;

    setting?: string | null;

    adaptation?: {
      mode: "simplify" | "standard" | "challenge" | "neutral";

      instructions: string[];
    } | null;
  };
};

export type GenerateCustomSpeakingScenarioServerResult =
  CustomScenarioSuccess | CustomScenarioFailure;

export const generateCustomSpeakingScenarioServerFn = createServerFn({
  method: "POST",
})
  .inputValidator(generateCustomSpeakingScenarioInputSchema)
  .handler(async ({ data }): Promise<GenerateCustomSpeakingScenarioServerResult> => {
    try {
      const customModule = await import("@/server/speaking/scenarios/custom/resolver");

      const result = await customModule.generateCustomSpeakingScenarioForUser(
        data.userId,
        data.description,
      );

      return {
        ok: true,

        scenario: result.scenario,

        context: result.context,
      };
    } catch (error) {
      if (error && typeof error === "object") {
        const candidate = error as {
          name?: unknown;

          code?: unknown;

          retryable?: unknown;
        };

        if (
          candidate.name === "CustomSpeakingScenarioError" &&
          typeof candidate.code === "string" &&
          typeof candidate.retryable === "boolean"
        ) {
          const code = candidate.code as CustomScenarioFailureCode;

          return {
            ok: false,

            error: {
              code,

              message:
                code === "invalid_request"
                  ? "Describe the speaking situation you want to practice in a little more detail."
                  : code === "rate_limited"
                    ? "Custom scenario generation is busy. Please try again shortly."
                    : "The custom scenario could not be generated right now.",

              retryable: candidate.retryable,
            },
          };
        }
      }

      console.error("[Speaking Custom Scenario] Generation failed", error);

      return {
        ok: false,

        error: {
          code: "unexpected_error",

          message: "The custom scenario could not be generated right now.",

          retryable: true,
        },
      };
    }
  });

const listSpeakingScenariosInputSchema = z
  .object({
    category: z
      .enum([
        "daily_life",
        "travel",
        "work",
        "education",
        "social",
        "shopping_services",
        "health_wellness",
        "problem_solving",
        "public_situations",
        "free_conversation",
      ])
      .optional(),

    difficulty: z
      .enum(["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"])
      .optional(),

    cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  })
  .optional();

const getSpeakingScenarioInputSchema = z.object({
  id: z.string().min(1).max(100),
});

export const listSpeakingScenariosServerFn = createServerFn({
  method: "GET",
})
  .inputValidator(listSpeakingScenariosInputSchema)
  .handler(async ({ data }) => {
    const scenarioModule = await import("@/server/speaking/scenarios/service");

    return scenarioModule.listSpeakingScenarios(
      data
        ? {
            category: data.category,

            difficulty: data.difficulty,

            cefrLevel: data.cefrLevel,

            activeOnly: true,
          }
        : undefined,
    );
  });

export const getSpeakingScenarioServerFn = createServerFn({
  method: "GET",
})
  .inputValidator(getSpeakingScenarioInputSchema)
  .handler(async ({ data }) => {
    const scenarioModule = await import("@/server/speaking/scenarios/service");

    return scenarioModule.findSpeakingScenarioById(data.id);
  });

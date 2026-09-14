import { z } from "zod";

import {
  SPEAKING_SCENARIO_CATEGORIES,
  SPEAKING_SCENARIO_CEFR_LEVELS,
  SPEAKING_SCENARIO_CONVERSATION_TYPES,
  SPEAKING_SCENARIO_DIFFICULTIES,
  SPEAKING_SCENARIO_SKILLS,
} from "./taxonomy";

export const speakingScenarioDefinitionSchema = z
  .object({
    id: z.string().min(1).max(100),

    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

    title: z.string().min(1).max(150),

    description: z.string().min(1).max(1_000),

    category: z.enum(SPEAKING_SCENARIO_CATEGORIES),

    difficulty: z.enum(SPEAKING_SCENARIO_DIFFICULTIES),

    cefrRange: z.object({
      min: z.enum(SPEAKING_SCENARIO_CEFR_LEVELS),
      max: z.enum(SPEAKING_SCENARIO_CEFR_LEVELS),
    }),

    conversationType: z.enum(SPEAKING_SCENARIO_CONVERSATION_TYPES),

    learnerRole: z.string().min(1).max(500).nullable(),

    coachRole: z.string().min(1).max(500).nullable(),

    objective: z.string().min(1).max(1_000),

    setting: z.string().min(1).max(500).nullable(),

    skills: z.array(z.enum(SPEAKING_SCENARIO_SKILLS)).min(1).max(10),

    suggestedOpening: z.string().min(1).max(500).nullable(),

    tags: z.array(z.string().min(1).max(50)).max(15),

    estimatedMinutes: z.number().int().min(1).max(60),

    active: z.boolean(),
  })
  .superRefine((scenario, context) => {
    const order = {
      A1: 1,
      A2: 2,
      B1: 3,
      B2: 4,
      C1: 5,
      C2: 6,
    } as const;

    if (order[scenario.cefrRange.min] > order[scenario.cefrRange.max]) {
      context.addIssue({
        code: "custom",
        path: ["cefrRange"],
        message: "The minimum CEFR level cannot be higher than the maximum CEFR level.",
      });
    }
  });

export type ValidatedSpeakingScenarioDefinition = z.infer<typeof speakingScenarioDefinitionSchema>;

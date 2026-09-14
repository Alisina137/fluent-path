import { z } from "zod";

import {
  SPEAKING_SCENARIO_CATEGORIES,
  SPEAKING_SCENARIO_CEFR_LEVELS,
  SPEAKING_SCENARIO_CONVERSATION_TYPES,
  SPEAKING_SCENARIO_DIFFICULTIES,
  SPEAKING_SCENARIO_SKILLS,
} from "../taxonomy";

export const generatedCustomScenarioSchema = z.object({
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

  tags: z.array(z.string().min(1).max(50)).max(10),

  estimatedMinutes: z.number().int().min(3).max(30),
});

export type GeneratedCustomScenarioPayload = z.infer<typeof generatedCustomScenarioSchema>;

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { completeUserOnboarding } from "@/server/onboarding/profile";

const englishLevelSchema = z.enum(["a1", "a2", "b1", "b2", "c1", "c2"]);

const learningGoalSchema = z.enum([
  "speaking",
  "writing",
  "vocabulary",
  "listening",
  "reading",
  "ielts",
  "interview",
  "business",
  "travel",
]);

const learningStyleSchema = z.enum(["visual", "listening", "reading", "speaking", "writing"]);

const dailyLearningTimeSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(30),
  z.literal(60),
]);

const translationModeSchema = z.enum(["instant", "on_tap", "side_by_side", "off"]);

const completeOnboardingSchema = z.object({
  userId: z.string().uuid(),

  englishLevel: englishLevelSchema.nullable(),

  learningGoals: z.array(learningGoalSchema),

  dailyLearningTime: dailyLearningTimeSchema,

  learningPreferences: z.array(learningStyleSchema),

  nativeLanguage: z.string().trim().min(1).max(100),

  nativeLanguageCode: z.string().trim().min(2).max(20),

  translationEnabled: z.boolean(),

  preferredTranslationMode: translationModeSchema,
});

export const completeOnboardingServerFn = createServerFn({
  method: "POST",
})
  .inputValidator(completeOnboardingSchema)
  .handler(async ({ data }) => {
    return completeUserOnboarding(data);
  });

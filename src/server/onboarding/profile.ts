import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { userLanguageSettings, userProfiles, users } from "@/db/schema";
import type {
  DailyLearningTime,
  EnglishLevel,
  LearningGoal,
  LearningStyle,
  TranslationMode,
} from "@/lib/types";

export interface CompleteOnboardingInput {
  userId: string;
  englishLevel: EnglishLevel | null;
  learningGoals: LearningGoal[];
  dailyLearningTime: DailyLearningTime;
  learningPreferences: LearningStyle[];
  nativeLanguage: string;
  nativeLanguageCode: string;
  translationEnabled: boolean;
  preferredTranslationMode: TranslationMode;
}

export interface CompletedOnboarding {
  profile: {
    user_id: string;
    english_level: EnglishLevel | null;
    learning_goals: LearningGoal[];
    daily_learning_time: DailyLearningTime;
    learning_preferences: LearningStyle[];
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
  };

  language: {
    user_id: string;
    native_language: string;
    native_language_code: string;
    translation_enabled: boolean;
    preferred_translation_mode: TranslationMode;
  };
}

export async function completeUserOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompletedOnboarding> {
  const db = getDb();

  const [existingUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  if (!existingUser) {
    throw new Error("The authenticated user could not be found.");
  }

  const now = new Date();

  return db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(userProfiles)
      .values({
        userId: input.userId,
        englishLevel: input.englishLevel,
        learningGoals: input.learningGoals,
        dailyLearningTime: input.dailyLearningTime,
        learningPreferences: input.learningPreferences,
        onboardingCompleted: true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          englishLevel: input.englishLevel,
          learningGoals: input.learningGoals,
          dailyLearningTime: input.dailyLearningTime,
          learningPreferences: input.learningPreferences,
          onboardingCompleted: true,
          updatedAt: now,
        },
      })
      .returning();

    const [language] = await tx
      .insert(userLanguageSettings)
      .values({
        userId: input.userId,
        nativeLanguageCode: input.nativeLanguageCode,
        translationEnabled: input.translationEnabled,
        preferredTranslationMode: input.preferredTranslationMode,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userLanguageSettings.userId,
        set: {
          nativeLanguageCode: input.nativeLanguageCode,
          translationEnabled: input.translationEnabled,
          preferredTranslationMode: input.preferredTranslationMode,
          updatedAt: now,
        },
      })
      .returning();

    if (!profile || !language) {
      throw new Error("The onboarding profile could not be saved.");
    }

    return {
      profile: {
        user_id: profile.userId,
        english_level: profile.englishLevel as EnglishLevel | null,
        learning_goals: profile.learningGoals as LearningGoal[],
        daily_learning_time: profile.dailyLearningTime as DailyLearningTime,
        learning_preferences: profile.learningPreferences as LearningStyle[],
        onboarding_completed: profile.onboardingCompleted,
        created_at: profile.createdAt.toISOString(),
        updated_at: profile.updatedAt.toISOString(),
      },

      language: {
        user_id: language.userId,
        native_language: input.nativeLanguage,
        native_language_code: language.nativeLanguageCode,
        translation_enabled: language.translationEnabled,
        preferred_translation_mode: language.preferredTranslationMode as TranslationMode,
      },
    };
  });
}

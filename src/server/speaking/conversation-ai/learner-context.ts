import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { userProfiles } from "@/db/schema";

import { normalizeSpeakingCoachCefrLevel, type SpeakingCoachLearnerLevel } from "./cefr";

export type SpeakingCoachLearnerContext = {
  englishLevel: SpeakingCoachLearnerLevel;
};

export async function getSpeakingCoachLearnerContext(
  userId: string,
): Promise<SpeakingCoachLearnerContext> {
  const db = getDb();

  const [profile] = await db
    .select({
      englishLevel: userProfiles.englishLevel,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return {
    englishLevel: normalizeSpeakingCoachCefrLevel(profile?.englishLevel),
  };
}

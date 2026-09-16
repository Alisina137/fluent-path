import type { LearningGoal, LearningModule } from "@/lib/types";
import { MODULES } from "./registry";

/**
 * Rule-based recommendation. Ranks modules by overlap with the user's
 * learning goals, then boosts by difficulty match. A future prompt can
 * swap in an AI scorer without changing the callsite.
 */
export function recommendModules(input: {
  goals: LearningGoal[];
  level: string | null;
  ownedIds?: LearningModule["id"][];
  limit?: number;
}): { module: LearningModule; reason: string }[] {
  const { goals, level, ownedIds = [], limit = 3 } = input;
  const scored = MODULES.filter((m) => !ownedIds.includes(m.id)).map((m) => {
    const overlapGoal = m.related_goals.find((g) => goals.includes(g));
    const overlap = m.related_goals.filter((g) => goals.includes(g)).length;
    const levelBoost = matchesLevel(m.difficulty, level) ? 1 : 0;
    const score = overlap * 3 + levelBoost;
    const reason = overlapGoal
      ? `Matches your goal to improve ${overlapGoal}.`
      : levelBoost
        ? `A good fit for your current level.`
        : `Popular starting point for new learners.`;
    return { module: m, score, reason };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ module, reason }) => ({ module, reason }));
}

function matchesLevel(difficulty: LearningModule["difficulty"], level: string | null) {
  if (!level || difficulty === "all_levels") return true;
  if (["a1", "a2"].includes(level)) return difficulty === "beginner";
  if (["b1", "b2"].includes(level)) return difficulty === "intermediate";
  return difficulty === "advanced";
}

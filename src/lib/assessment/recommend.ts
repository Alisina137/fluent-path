import type { ModuleId, SkillId, SkillScore } from "@/lib/types";
import { MODULES } from "@/lib/modules/registry";

const SKILL_TO_MODULE: Record<SkillId, ModuleId | null> = {
  vocabulary: "vocabulary",
  grammar: "grammar",
  reading: "reading",
  listening: "listening",
  speaking: "speaking",
  writing: "writing",
};

export function recommendFromScores(scores: SkillScore[]): ModuleId[] {
  const weakFirst = [...scores]
    .filter((s) => s.total > 0)
    .sort((a, b) => a.percentage - b.percentage);

  const ids = new Set<ModuleId>();
  for (const s of weakFirst) {
    if (s.percentage >= 75) continue;
    const id = SKILL_TO_MODULE[s.skill];
    if (id && MODULES.some((m) => m.id === id)) ids.add(id);
  }
  return Array.from(ids).slice(0, 3);
}

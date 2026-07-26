import type { AssessmentSectionMeta } from "@/lib/types";

export const ASSESSMENT_SECTIONS: AssessmentSectionMeta[] = [
  {
    id: "vocabulary",
    name: "Vocabulary",
    description: "Word meanings, synonyms and everyday usage.",
    icon: "BookA",
    status: "available",
    estimated_minutes: 3,
  },
  {
    id: "grammar",
    name: "Grammar",
    description: "Tenses, articles, prepositions and structure.",
    icon: "SquareStack",
    status: "available",
    estimated_minutes: 4,
  },
  {
    id: "reading",
    name: "Reading",
    description: "Short passages with comprehension questions.",
    icon: "BookOpen",
    status: "available",
    estimated_minutes: 4,
  },
  {
    id: "listening",
    name: "Listening",
    description: "Short clips with follow-up questions.",
    icon: "Headphones",
    status: "available",
    estimated_minutes: 3,
  },
  {
    id: "speaking",
    name: "Speaking",
    description: "Speak aloud to an AI examiner.",
    icon: "Mic",
    status: "coming_soon",
    estimated_minutes: 5,
  },
  {
    id: "writing",
    name: "Writing",
    description: "Short guided writing tasks with feedback.",
    icon: "PenLine",
    status: "coming_soon",
    estimated_minutes: 8,
  },
];

export const SKILL_LABELS: Record<
  AssessmentSectionMeta["id"],
  string
> = ASSESSMENT_SECTIONS.reduce(
  (acc, s) => {
    acc[s.id] = s.name;
    return acc;
  },
  {} as Record<AssessmentSectionMeta["id"], string>,
);
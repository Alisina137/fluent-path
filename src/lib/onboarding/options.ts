import type {
  DailyLearningTime,
  EnglishLevel,
  LearningGoal,
  LearningStyle,
} from "@/lib/types";

export const ENGLISH_LEVELS: {
  value: EnglishLevel;
  code: string;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    value: "a1",
    code: "A1",
    label: "Beginner",
    description: "Starting out.",
    example: "I can introduce myself and use basic phrases.",
  },
  {
    value: "a2",
    code: "A2",
    label: "Elementary",
    description: "Familiar everyday topics.",
    example: "I can handle simple tasks like ordering food or shopping.",
  },
  {
    value: "b1",
    code: "B1",
    label: "Intermediate",
    description: "Confident in everyday conversations.",
    example:
      "I can understand everyday conversations and communicate about familiar topics.",
  },
  {
    value: "b2",
    code: "B2",
    label: "Upper intermediate",
    description: "Comfortable with complex topics.",
    example: "I can discuss abstract ideas and interact with fluent speakers.",
  },
  {
    value: "c1",
    code: "C1",
    label: "Advanced",
    description: "Fluent and flexible.",
    example: "I can express ideas precisely in work and academic settings.",
  },
  {
    value: "c2",
    code: "C2",
    label: "Proficient",
    description: "Near-native mastery.",
    example: "I can understand virtually everything I read or hear.",
  },
];

export const LEARNING_GOALS: { value: LearningGoal; label: string; icon: string }[] = [
  { value: "speaking", label: "Improve speaking", icon: "🗣️" },
  { value: "writing", label: "Improve writing", icon: "✍️" },
  { value: "vocabulary", label: "Improve vocabulary", icon: "📚" },
  { value: "listening", label: "Improve listening", icon: "🎧" },
  { value: "reading", label: "Improve reading", icon: "📖" },
  { value: "ielts", label: "Prepare for IELTS", icon: "🎓" },
  { value: "interview", label: "Prepare for job interviews", icon: "💼" },
  { value: "business", label: "Learn business English", icon: "🏢" },
  { value: "travel", label: "English for travel", icon: "✈️" },
];

export const DAILY_TIMES: { value: DailyLearningTime; label: string; hint: string }[] = [
  { value: 5, label: "5 min", hint: "Quick daily habit" },
  { value: 10, label: "10 min", hint: "Steady progress" },
  { value: 15, label: "15 min", hint: "Recommended" },
  { value: 30, label: "30 min", hint: "Focused practice" },
  { value: 60, label: "1 hour", hint: "Intensive" },
];

export const LEARNING_STYLES: { value: LearningStyle; label: string; icon: string }[] = [
  { value: "visual", label: "Visual learning", icon: "👀" },
  { value: "listening", label: "Listening practice", icon: "🎧" },
  { value: "reading", label: "Reading practice", icon: "📖" },
  { value: "speaking", label: "Speaking practice", icon: "🗣️" },
  { value: "writing", label: "Writing practice", icon: "✍️" },
];

export function levelLabel(level: EnglishLevel | null): string {
  if (!level) return "Not set";
  const l = ENGLISH_LEVELS.find((x) => x.value === level);
  return l ? `${l.code} ${l.label}` : String(level).toUpperCase();
}

export function goalLabel(goal: LearningGoal): string {
  return LEARNING_GOALS.find((g) => g.value === goal)?.label ?? goal;
}

export function styleLabel(style: LearningStyle): string {
  return LEARNING_STYLES.find((s) => s.value === style)?.label ?? style;
}
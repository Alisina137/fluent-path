import type { SpeakingScenarioCategory } from "./taxonomy";

export type SpeakingScenarioCategoryDefinition = {
  id: SpeakingScenarioCategory;
  label: string;
  description: string;
};

export const speakingScenarioCategories: SpeakingScenarioCategoryDefinition[] = [
  {
    id: "daily_life",
    label: "Daily Life",
    description:
      "Practice everyday conversations such as routines, food, transport, appointments, and household situations.",
  },

  {
    id: "travel",
    label: "Travel",
    description:
      "Practice conversations for airports, hotels, transportation, directions, tourism, and travel problems.",
  },

  {
    id: "work",
    label: "Work",
    description:
      "Practice workplace communication, meetings, colleagues, interviews, tasks, and professional situations.",
  },

  {
    id: "education",
    label: "Education",
    description:
      "Practice communication in schools, universities, courses, classrooms, and study situations.",
  },

  {
    id: "social",
    label: "Social",
    description:
      "Practice introductions, small talk, friendships, invitations, opinions, and everyday social interaction.",
  },

  {
    id: "shopping_services",
    label: "Shopping & Services",
    description:
      "Practice buying products, ordering services, asking questions, returning items, and handling customer-service situations.",
  },

  {
    id: "health_wellness",
    label: "Health & Wellness",
    description:
      "Practice ordinary communication about health, appointments, symptoms, fitness, and wellness without replacing professional medical advice.",
  },

  {
    id: "problem_solving",
    label: "Problem Solving",
    description:
      "Practice explaining problems, asking for help, clarifying misunderstandings, negotiating solutions, and resolving situations.",
  },

  {
    id: "public_situations",
    label: "Public Situations",
    description:
      "Practice communication in public places such as banks, government offices, transport stations, and community services.",
  },

  {
    id: "free_conversation",
    label: "Free Conversation",
    description: "Practice natural conversation without a predefined role-play scenario.",
  },
];

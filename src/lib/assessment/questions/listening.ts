import type { AssessmentQuestion, ListeningClip } from "@/lib/types";

export const LISTENING_CLIPS: ListeningClip[] = [
  {
    id: "l-c1",
    title: "Airport Announcement",
    difficulty: "easy",
    duration_seconds: 22,
    transcript:
      "Attention passengers. Flight 402 to London is now boarding at gate 14. Please have your boarding pass and passport ready. This is the final call for passenger Miller.",
  },
  {
    id: "l-c2",
    title: "Interview Excerpt",
    difficulty: "medium",
    duration_seconds: 34,
    transcript:
      "The most surprising part of the study was that people who took short walking breaks reported better focus than those who worked straight through the morning. It wasn't the length of the break that mattered — it was the movement.",
  },
];

export const LISTENING_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "l1",
    skill: "listening",
    difficulty: "easy",
    type: "multiple_choice",
    prompt: "Clip 1 — What is the gate number for flight 402?",
    options: ["4", "14", "40", "42"],
    answer_index: 1,
  },
  {
    id: "l2",
    skill: "listening",
    difficulty: "easy",
    type: "true_false",
    prompt: "Clip 1 — This is the first call for the flight.",
    answer: false,
  },
  {
    id: "l3",
    skill: "listening",
    difficulty: "medium",
    type: "multiple_choice",
    prompt: "Clip 2 — What improved focus, according to the speaker?",
    options: [
      "Longer breaks",
      "Skipping breaks",
      "Short walking breaks",
      "Working in the afternoon",
    ],
    answer_index: 2,
  },
  {
    id: "l4",
    skill: "listening",
    difficulty: "medium",
    type: "fill_blank",
    prompt: "Clip 2 — 'It wasn't the length of the break that mattered — it was the ______.'",
    answer: "movement",
  },
  {
    id: "l5",
    skill: "listening",
    difficulty: "hard",
    type: "multiple_choice",
    prompt: "Clip 2 — The speaker's tone suggests they find the result:",
    options: ["Disappointing", "Expected", "Surprising", "Confusing"],
    answer_index: 2,
  },
];

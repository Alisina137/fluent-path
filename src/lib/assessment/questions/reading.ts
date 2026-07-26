import type { AssessmentQuestion, ReadingPassage } from "@/lib/types";

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: "r-p1",
    title: "The Morning Market",
    difficulty: "easy",
    body: "Every Saturday, Ana walks to the local market. She buys fresh bread, tomatoes and a small bunch of flowers for the kitchen table. The market is busy but friendly, and she usually meets a neighbour on the way home.",
    highlights: ["market", "fresh", "neighbour"],
  },
  {
    id: "r-p2",
    title: "A New Kind of City Park",
    difficulty: "medium",
    body: "Urban planners around the world are redesigning city parks to fight rising temperatures. New parks use light-coloured surfaces, dense tree cover and shallow water features that cool the surrounding air. Residents report that these spaces feel noticeably cooler on hot afternoons, and studies confirm the effect can lower nearby street temperatures by several degrees.",
    highlights: ["urban", "temperatures", "surfaces"],
  },
];

export const READING_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "r1",
    skill: "reading",
    difficulty: "easy",
    type: "multiple_choice",
    prompt: "Passage 1 — What does Ana buy at the market?",
    options: [
      "Bread, tomatoes and flowers",
      "Bread and cheese",
      "Only flowers",
      "Fish and vegetables",
    ],
    answer_index: 0,
  },
  {
    id: "r2",
    skill: "reading",
    difficulty: "easy",
    type: "true_false",
    prompt: "Passage 1 — Ana goes to the market on Sundays.",
    passage_id: "r-p1",
    answer: false,
  },
  {
    id: "r3",
    skill: "reading",
    difficulty: "medium",
    type: "multiple_choice",
    prompt: "Passage 2 — What is the main idea of the passage?",
    options: [
      "Cities are building fewer parks.",
      "New park designs help cool cities.",
      "Trees are too expensive for cities.",
      "Old parks are being closed.",
    ],
    answer_index: 1,
  },
  {
    id: "r4",
    skill: "reading",
    difficulty: "medium",
    type: "multiple_choice",
    prompt: "Passage 2 — In the passage, 'dense' most nearly means:",
    options: ["Thick", "Colourful", "Rare", "Wet"],
    answer_index: 0,
  },
  {
    id: "r5",
    skill: "reading",
    difficulty: "hard",
    type: "true_false",
    prompt: "Passage 2 — Studies show new park designs lower street temperatures.",
    passage_id: "r-p2",
    answer: true,
  },
  {
    id: "r6",
    skill: "reading",
    difficulty: "hard",
    type: "multiple_choice",
    prompt: "Passage 2 — Which detail is NOT mentioned?",
    options: [
      "Light-coloured surfaces",
      "Dense tree cover",
      "Shallow water features",
      "Underground cooling pipes",
    ],
    answer_index: 3,
  },
];
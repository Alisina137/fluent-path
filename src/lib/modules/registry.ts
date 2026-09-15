import type { LearningModule } from "@/lib/types";

const CREATED = "2025-01-01T00:00:00.000Z";
const UPDATED = "2025-06-01T00:00:00.000Z";

type ModuleSeed = Omit<
  LearningModule,
  | "slug"
  | "monthly_price"
  | "release_status"
  | "featured"
  | "display_order"
  | "estimated_learning_time"
  | "short_description"
  | "full_description"
  | "audience"
  | "updated_at"
> & {
  slug?: string;
  monthly_price?: number;
  release_status?: LearningModule["release_status"];
  featured?: boolean;
  display_order?: number;
  estimated_learning_time?: string;
  short_description?: string;
  full_description?: string;
  audience?: string[];
  updated_at?: string;
};

function seed(order: number, m: ModuleSeed): LearningModule {
  return {
    ...m,
    slug: m.slug ?? m.id,
    monthly_price: m.monthly_price ?? m.price,
    release_status: m.release_status ?? m.status,
    featured: m.featured ?? false,
    display_order: m.display_order ?? order,
    estimated_learning_time: m.estimated_learning_time ?? "10–15 min / day",
    short_description: m.short_description ?? m.tagline,
    full_description: m.full_description ?? m.description,
    audience: m.audience ?? [],
    updated_at: m.updated_at ?? UPDATED,
  };
}

export const MODULES: LearningModule[] = [
  seed(1, {
    id: "speaking",
    name: "AI Speaking Coach",
    tagline: "Practice real conversations with AI.",
    description:
      "Real-time pronunciation and fluency feedback with an AI conversation partner who adapts to your level.",
    icon: "Mic",
    price: 5,
    status: "available",
    release_status: "available",
    category: "speaking",
    difficulty: "all_levels",
    featured: true,
    estimated_learning_time: "15 min / day · ~8 weeks to fluency boost",
    audience: [
      "Learners nervous about speaking out loud",
      "Travelers and professionals prepping for real conversations",
    ],
    benefits: [
      "Speak more confidently in everyday situations",
      "Reduce hesitation with instant AI feedback",
      "Improve pronunciation and rhythm",
    ],
    features: [
      "AI conversation partner",
      "Pronunciation scoring",
      "Role-play scenarios",
      "Session transcripts",
    ],
    outcomes: ["Hold a 5-minute unscripted conversation", "Pronounce tricky sounds correctly"],
    related_goals: ["speaking", "travel", "interview"],
    created_at: CREATED,
  }),
  seed(2, {
    id: "writing",
    name: "AI Writing Coach",
    tagline: "Get instant feedback on anything you write.",
    description: "Grammar, style and structure feedback on essays, emails and messages.",
    icon: "PenLine",
    price: 5,
    status: "available",
    release_status: "available",
    category: "writing",
    difficulty: "intermediate",
    featured: true,
    estimated_learning_time: "10 min / day · ~6 weeks to clearer writing",
    audience: [
      "Professionals writing English at work",
      "Students preparing essays and applications",
    ],
    benefits: [
      "Write clearer emails and essays",
      "Fix recurring grammar mistakes",
      "Learn native phrasing",
    ],
    features: ["Inline corrections", "Style suggestions", "Rewrite mode", "Progress tracking"],
    outcomes: ["Draft a professional email in minutes", "Reduce grammar errors by 60%"],
    related_goals: ["writing", "business", "ielts"],
    created_at: CREATED,
  }),
  seed(3, {
    id: "vocabulary",
    name: "Vocabulary Builder",
    tagline: "Learn the right words, faster.",
    description: "Spaced-repetition word packs adapted to your level and goals.",
    icon: "BookMarked",
    price: 4,
    status: "coming_soon",
    category: "vocabulary",
    difficulty: "all_levels",
    estimated_learning_time: "5–10 min / day",
    audience: ["Learners who forget new words quickly", "Anyone building an active vocabulary"],
    benefits: [
      "Grow active vocabulary steadily",
      "Remember words long-term",
      "Learn in your native language",
    ],
    features: ["Spaced repetition", "Themed word packs", "Native translations", "Daily reviews"],
    outcomes: ["Add 500+ words per year", "Recognise words in context"],
    related_goals: ["vocabulary", "reading", "ielts"],
    created_at: CREATED,
  }),
  seed(4, {
    id: "listening",
    name: "Listening Lab",
    tagline: "Train your ear with native audio.",
    description: "Native audio, dictation and shadowing exercises with instant transcripts.",
    icon: "Headphones",
    price: 4,
    status: "coming_soon",
    category: "listening",
    difficulty: "all_levels",
    estimated_learning_time: "10 min / day",
    audience: ["Learners who freeze with native speech", "Podcast and film fans"],
    benefits: [
      "Understand fast native speech",
      "Improve accent through shadowing",
      "Catch details in conversations",
    ],
    features: ["Native audio library", "Dictation mode", "Shadowing tool", "Adjustable speed"],
    outcomes: ["Follow podcasts at native speed", "Take accurate notes from audio"],
    related_goals: ["listening", "speaking"],
    created_at: CREATED,
  }),
  seed(5, {
    id: "reading",
    name: "Reading Trainer",
    tagline: "Read real English at your level.",
    description: "Level-adapted articles with in-context translation and comprehension checks.",
    icon: "BookOpen",
    price: 4,
    status: "coming_soon",
    category: "reading",
    difficulty: "all_levels",
    estimated_learning_time: "10–15 min / day",
    audience: ["Learners who want to read news and books", "Test-prep students"],
    benefits: [
      "Read faster with fewer stops",
      "Learn vocabulary in context",
      "Understand complex texts",
    ],
    features: [
      "Level-adapted articles",
      "Tap-to-translate",
      "Comprehension quizzes",
      "Reading stats",
    ],
    outcomes: ["Read a news article without translation", "Score higher on reading tests"],
    related_goals: ["reading", "vocabulary", "ielts"],
    created_at: CREATED,
  }),
  seed(6, {
    id: "grammar",
    name: "Grammar Academy",
    tagline: "Grammar that finally makes sense.",
    description: "Structured lessons explained in your native language.",
    icon: "GraduationCap",
    price: 4,
    status: "coming_soon",
    category: "grammar",
    difficulty: "beginner",
    estimated_learning_time: "15 min / day · ~12 weeks",
    audience: [
      "Beginners rebuilding grammar foundations",
      "Learners who want native-language explanations",
    ],
    benefits: [
      "Fix the mistakes you keep making",
      "Understand tenses clearly",
      "Build sentences with confidence",
    ],
    features: [
      "Native-language explanations",
      "Interactive exercises",
      "Level tracks",
      "Cheat sheets",
    ],
    outcomes: ["Master all 12 English tenses", "Write grammatically correct sentences"],
    related_goals: ["writing", "speaking"],
    created_at: CREATED,
  }),
  seed(7, {
    id: "stories",
    name: "English Stories",
    tagline: "Learn English through stories you love.",
    description: "Bilingual short stories that grow vocabulary through reading.",
    icon: "BookHeart",
    price: 3,
    status: "coming_soon",
    category: "stories",
    difficulty: "beginner",
    estimated_learning_time: "10 min / day",
    audience: ["Learners who prefer stories over drills", "Readers building habits"],
    benefits: [
      "Enjoy learning through narrative",
      "Pick up natural phrasing",
      "Build a reading habit",
    ],
    features: ["Bilingual view", "Audio narration", "Vocabulary highlights", "Weekly new stories"],
    outcomes: ["Finish your first English short story", "Learn 200+ words from context"],
    related_goals: ["reading", "vocabulary"],
    created_at: CREATED,
  }),
  seed(8, {
    id: "ielts",
    name: "IELTS Preparation",
    tagline: "Score higher on every band.",
    description: "Full-band practice for Listening, Reading, Writing and Speaking.",
    icon: "Award",
    price: 9,
    status: "coming_soon",
    category: "exams",
    difficulty: "advanced",
    featured: true,
    estimated_learning_time: "30 min / day · 6–12 week programs",
    audience: ["IELTS candidates targeting band 7+", "University applicants"],
    benefits: [
      "Practice all four IELTS bands",
      "Learn exam strategies that work",
      "Track your band score progress",
    ],
    features: [
      "Full mock tests",
      "Writing band feedback",
      "Speaking simulator",
      "Vocabulary packs",
    ],
    outcomes: ["Target band 7+ across sections", "Feel exam-ready in weeks"],
    related_goals: ["ielts", "writing", "speaking"],
    created_at: CREATED,
  }),
  seed(9, {
    id: "interview",
    name: "Interview Coach",
    tagline: "Ace your next English interview.",
    description: "Mock interviews with AI feedback on answers, tone and clarity.",
    icon: "Briefcase",
    price: 6,
    status: "coming_soon",
    category: "career",
    difficulty: "intermediate",
    estimated_learning_time: "20 min / session · 2–4 weeks",
    audience: ["Job seekers with English interviews", "Career switchers"],
    benefits: [
      "Answer common questions confidently",
      "Refine tone and clarity",
      "Prepare for real-world scenarios",
    ],
    features: [
      "Industry question packs",
      "AI mock interviews",
      "Answer scoring",
      "Body of examples",
    ],
    outcomes: ["Handle behavioural questions with ease", "Feel calm and prepared"],
    related_goals: ["interview", "speaking", "business"],
    created_at: CREATED,
  }),
  seed(10, {
    id: "business",
    name: "Business English",
    tagline: "Sound professional at work.",
    description: "Meetings, emails and negotiation language for the workplace.",
    icon: "Building2",
    price: 6,
    status: "coming_soon",
    category: "career",
    difficulty: "intermediate",
    estimated_learning_time: "15 min / day · ongoing",
    audience: ["Professionals in international teams", "Managers running English meetings"],
    benefits: [
      "Run meetings in English",
      "Write polished business emails",
      "Negotiate with confidence",
    ],
    features: ["Meeting phrases", "Email templates", "Negotiation drills", "Presentation coaching"],
    outcomes: ["Lead an English meeting", "Send professional emails daily"],
    related_goals: ["business", "writing", "speaking"],
    created_at: CREATED,
  }),
];

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export const MODULE_CATEGORIES = [
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "grammar", label: "Grammar" },
  { value: "stories", label: "Stories" },
  { value: "exams", label: "Exams" },
  { value: "career", label: "Career" },
] as const;

export const DIFFICULTY_LABELS: Record<import("@/lib/types").ModuleDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All levels",
};

import type { LearningModule } from "@/lib/types";

export const MODULES: LearningModule[] = [
  { id: "speaking", name: "AI Speaking Coach", description: "Real-time pronunciation and fluency feedback with an AI conversation partner.", icon: "Mic", price: 5, status: "coming_soon", category: "practice", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "writing", name: "AI Writing Coach", description: "Grammar, style and structure feedback on essays, emails and messages.", icon: "PenLine", price: 5, status: "coming_soon", category: "practice", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "vocabulary", name: "Vocabulary Builder", description: "Spaced-repetition word packs adapted to your level and goals.", icon: "BookMarked", price: 4, status: "coming_soon", category: "content", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "listening", name: "Listening Lab", description: "Native audio, dictation and shadowing exercises with instant transcripts.", icon: "Headphones", price: 4, status: "coming_soon", category: "practice", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "reading", name: "Reading Trainer", description: "Level-adapted articles with in-context translation and comprehension checks.", icon: "BookOpen", price: 4, status: "coming_soon", category: "content", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "grammar", name: "Grammar Academy", description: "Structured lessons explained in your native language.", icon: "GraduationCap", price: 4, status: "coming_soon", category: "content", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "stories", name: "English Stories", description: "Bilingual short stories that grow vocabulary through reading.", icon: "BookHeart", price: 3, status: "coming_soon", category: "content", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "ielts", name: "IELTS Preparation", description: "Full-band practice for Listening, Reading, Writing and Speaking.", icon: "Award", price: 9, status: "coming_soon", category: "exam", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "interview", name: "Interview Coach", description: "Mock interviews with AI feedback on answers, tone and clarity.", icon: "Briefcase", price: 6, status: "coming_soon", category: "career", created_at: "2025-01-01T00:00:00.000Z" },
  { id: "business", name: "Business English", description: "Meetings, emails and negotiation language for the workplace.", icon: "Building2", price: 6, status: "coming_soon", category: "career", created_at: "2025-01-01T00:00:00.000Z" },
];

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}
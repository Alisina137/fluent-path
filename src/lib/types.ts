// Core domain entities for the AI English Learning Platform.
export type ISODate = string;

// CEFR levels.
export type EnglishLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type LearningGoal =
  | "speaking"
  | "writing"
  | "vocabulary"
  | "listening"
  | "reading"
  | "ielts"
  | "interview"
  | "business"
  | "travel";

export type LearningStyle = "visual" | "listening" | "reading" | "speaking" | "writing";

export type DailyLearningTime = 5 | 10 | 15 | 30 | 60;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: ISODate;
}

export interface UserProfile {
  user_id: string;
  english_level: EnglishLevel | null;
  learning_goals: LearningGoal[];
  daily_learning_time: DailyLearningTime;
  learning_preferences: LearningStyle[];
  onboarding_completed: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export type TranslationMode = "instant" | "on_tap" | "side_by_side" | "off";

export interface UserLanguageSettings {
  user_id: string;
  native_language: string;
  native_language_code: string;
  translation_enabled: boolean;
  preferred_translation_mode: TranslationMode;
}

export type ModuleStatus = "available" | "coming_soon" | "beta";
export type ModuleReleaseStatus = "available" | "coming_soon" | "beta" | "retired";
export type ModuleDifficulty = "beginner" | "intermediate" | "advanced" | "all_levels";
export type ModuleId =
  | "speaking"
  | "writing"
  | "vocabulary"
  | "listening"
  | "reading"
  | "grammar"
  | "stories"
  | "ielts"
  | "interview"
  | "business";

export interface LearningModule {
  id: ModuleId;
  slug: string;
  name: string;
  short_description: string;
  full_description: string;
  description: string;
  icon: string;
  price: number;
  monthly_price: number;
  status: ModuleStatus;
  release_status: ModuleReleaseStatus;
  featured: boolean;
  display_order: number;
  estimated_learning_time: string;
  category:
    | "speaking"
    | "writing"
    | "vocabulary"
    | "reading"
    | "listening"
    | "grammar"
    | "stories"
    | "exams"
    | "career";
  difficulty: ModuleDifficulty;
  tagline: string;
  benefits: string[];
  features: string[];
  outcomes: string[];
  audience: string[];
  related_goals: import("./types").LearningGoal[];
  created_at: ISODate;
  updated_at: ISODate;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "inactive"
  | "expired";

export type ModuleAccessState =
  | "available"
  | "subscribed"
  | "expired"
  | "coming_soon"
  | "locked";

export interface UserModule {
  user_id: string;
  module_id: ModuleId;
  subscription_status: SubscriptionStatus;
  activation_date: ISODate | null;
  expiration_date: ISODate | null;
  auto_renew: boolean;
  last_accessed: ISODate | null;
  progress_percentage: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  start_date: ISODate | null;
  renewal_date: ISODate | null;
  module_ids: ModuleId[];
}

export type NotificationType =
  | "subscription_expiring"
  | "new_module_available"
  | "module_updated"
  | "daily_reminder";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  created_at: ISODate;
  read: boolean;
  module_id?: ModuleId;
}

// ============ Assessment ============
export type SkillId =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening"
  | "speaking"
  | "writing";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "match"
  | "synonym"
  | "true_false"
  | "sentence_correction";

interface BaseQuestion {
  id: string;
  skill: SkillId;
  difficulty: QuestionDifficulty;
  prompt: string;
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: string[];
  answer_index: number;
}

export interface FillBlankQuestion extends BaseQuestion {
  type: "fill_blank";
  answer: string;
  accepted?: string[];
}

export interface MatchQuestion extends BaseQuestion {
  type: "match";
  pairs: { left: string; right: string }[];
}

export interface SynonymQuestion extends BaseQuestion {
  type: "synonym";
  word: string;
  options: string[];
  answer_index: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  passage_id?: string;
  answer: boolean;
}

export interface SentenceCorrectionQuestion extends BaseQuestion {
  type: "sentence_correction";
  options: string[];
  answer_index: number;
}

export type AssessmentQuestion =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | MatchQuestion
  | SynonymQuestion
  | TrueFalseQuestion
  | SentenceCorrectionQuestion;

export interface ReadingPassage {
  id: string;
  title: string;
  difficulty: QuestionDifficulty;
  body: string;
  highlights: string[];
}

export interface ListeningClip {
  id: string;
  title: string;
  difficulty: QuestionDifficulty;
  transcript: string;
  duration_seconds: number;
  audio_url?: string;
}

export interface AssessmentSectionMeta {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  status: "available" | "coming_soon";
  estimated_minutes: number;
}

export interface AssessmentAnswer {
  question_id: string;
  skill: SkillId;
  difficulty: QuestionDifficulty;
  correct: boolean;
  value: string | number | boolean | null;
}

export interface SkillScore {
  skill: SkillId;
  correct: number;
  total: number;
  weighted_correct: number;
  weighted_total: number;
  percentage: number;
}

export interface AssessmentAttempt {
  id: string;
  user_id: string;
  started_at: ISODate;
  completed_at: ISODate | null;
  duration_ms: number;
  answers: AssessmentAnswer[];
  section_ids: SkillId[];
}

export interface AssessmentResult {
  attempt_id: string;
  completed_at: ISODate;
  scores: SkillScore[];
  overall_percentage: number;
  estimated_level: EnglishLevel;
  confidence: number;
  strengths: SkillId[];
  weaknesses: SkillId[];
  recommended_module_ids: ModuleId[];
  duration_ms: number;
}
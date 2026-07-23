// Core domain entities for the AI English Learning Platform.
// These are the source-of-truth TypeScript models used across the app.
// Persistence (DB / Lovable Cloud) will be added in a later phase.

export type ISODate = string;

export type EnglishLevel = "beginner" | "elementary" | "intermediate" | "upper" | "advanced";

export type LearningGoal =
  | "travel"
  | "career"
  | "academic"
  | "ielts"
  | "interview"
  | "business"
  | "daily"
  | "culture";

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
  created_at: ISODate;
}

export type TranslationMode = "instant" | "on_tap" | "side_by_side" | "off";

export interface UserLanguageSettings {
  user_id: string;
  native_language: string; // display name
  native_language_code: string; // ISO 639-1
  translation_enabled: boolean;
  preferred_translation_mode: TranslationMode;
}

export type ModuleStatus = "available" | "coming_soon" | "beta";
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
  name: string;
  description: string;
  icon: string; // lucide icon name
  price: number; // monthly USD
  status: ModuleStatus;
  category: "practice" | "content" | "exam" | "career";
  created_at: ISODate;
}

export type SubscriptionStatus = "active" | "trialing" | "canceled" | "inactive";

export interface UserModule {
  user_id: string;
  module_id: ModuleId;
  subscription_status: SubscriptionStatus;
  activation_date: ISODate | null;
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
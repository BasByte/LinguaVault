export interface User {
  id: number;
  name: string;
  email: string;
  role: "free_tier" | "standard" | "educator" | "admin";
  avatar_url?: string;
  bio?: string;
  total_points: number;
  streak_days: number;
  is_active: boolean;
  created_at: string;
}

export interface Language {
  id: number;
  name: string;
  code: string;
  flag_emoji?: string;
  description?: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  language_id: number;
  educator_id: number;
  level: "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficiency";
  thumbnail_url?: string;
  is_public: boolean;
  is_published: boolean;
  enrollment_count: number;
  rating: number;
  duration_minutes: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  language_name?: string;
  language_code?: string;
  flag_emoji?: string;
  educator_name?: string;
  lesson_count?: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content?: string;
  lesson_type: "lesson" | "article" | "exercise" | "video" | "quiz";
  order_index: number;
  duration_minutes: number;
  is_published: boolean;
  media_url?: string;
  created_at: string;
}

export interface Exercise {
  id: number;
  lesson_id: number;
  exercise_type: "multiple_choice" | "fill_blank" | "matching" | "translation" | "listening" | "speaking" | "writing";
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  educator_id: number;
  language_id: number;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  duration_minutes: number;
  passing_score: number;
  is_public: boolean;
  is_published: boolean;
  attempt_count: number;
  created_at: string;
  language_name?: string;
  flag_emoji?: string;
  educator_name?: string;
  question_count?: number;
}

export interface TestQuestion {
  id: number;
  test_id: number;
  question: string;
  question_type: "multiple_choice" | "fill_blank" | "matching" | "translation" | "listening" | "writing";
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

export interface TestAttempt {
  id: number;
  user_id: number;
  test_id: number;
  score?: number;
  percentage?: number;
  cefr_result?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  answers?: Record<string, string>;
  time_spent_seconds?: number;
  status: "in_progress" | "completed" | "abandoned";
  started_at: string;
  completed_at?: string;
  test_title?: string;
  language_name?: string;
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  badge_type: string;
  points_reward: number;
}

export interface UserBadge {
  id: number;
  badge: Badge;
  earned_at: string;
}

export interface UserProgress {
  id: number;
  user_id: number;
  course_id: number;
  lesson_id: number;
  is_completed: boolean;
  progress_percentage: number;
  time_spent_seconds: number;
  completed_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  avatar_url?: string;
  total_points: number;
  test_count: number;
  avg_score: number;
  badges_count: number;
}

export interface CEFRLevel {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
  description: string;
  color: string;
}

export const CEFR_LEVELS: CEFRLevel[] = [
  { level: "A1", label: "Beginner", description: "Can understand and use basic phrases", color: "bg-green-100 text-green-800" },
  { level: "A2", label: "Elementary", description: "Can communicate in simple tasks", color: "bg-emerald-100 text-emerald-800" },
  { level: "B1", label: "Intermediate", description: "Can deal with most situations", color: "bg-blue-100 text-blue-800" },
  { level: "B2", label: "Upper-Intermediate", description: "Can interact with fluency", color: "bg-indigo-100 text-indigo-800" },
  { level: "C1", label: "Advanced", description: "Can express fluently and spontaneously", color: "bg-purple-100 text-purple-800" },
  { level: "C2", label: "Mastery", description: "Can understand virtually everything", color: "bg-rose-100 text-rose-800" },
];

export const COURSE_LEVELS = [
  { value: "beginner", label: "Beginner (A1)", cefr: "A1" },
  { value: "elementary", label: "Elementary (A2)", cefr: "A2" },
  { value: "intermediate", label: "Intermediate (B1)", cefr: "B1" },
  { value: "upper_intermediate", label: "Upper-Intermediate (B2)", cefr: "B2" },
  { value: "advanced", label: "Advanced (C1)", cefr: "C1" },
  { value: "proficiency", label: "Proficiency (C2)", cefr: "C2" },
];

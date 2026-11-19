import type { BannerType, CategoryIconName, CategorySlug } from '@/constants/theme';

export interface Topic {
  id: string;
  slug: CategorySlug;
  title: string;
  description: string;
  icon: CategoryIconName;
  sortOrder: number;
  isPremium: boolean;
}

export interface Level {
  id: string;
  slug: string;
  topicId: string;
  topicSlug: CategorySlug;
  levelNumber: number;
  globalOrder: number;
  title: string;
  subtitle: string;
  difficulty: 1 | 2 | 3;
  questionsPerRound: number;
  isPremium: boolean;
}

export interface Question {
  id: string;
  topicId: string;
  topicSlug: CategorySlug;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  sourceRef: string;
}

export interface BannerItem {
  id: string;
  tipo: BannerType;
  titulo: string;
  texto: string;
  imagen?: string | null;
  link?: string | null;
  orden: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  authProvider?: 'google' | 'apple' | null;
  xp: number;
  streakCount: number;
  longestStreak: number;
  lastPlayedDate: string | null; // YYYY-MM-DD
  hearts: number;
  heartsUpdatedAt: string; // ISO
  gamesPlayedGuest: number;
  isPremium: boolean;
  timerEnabled: boolean;
  soundEnabled: boolean;
}

export interface LevelProgress {
  levelId: string;
  bestScore: number;
  totalQuestions: number;
  stars: 0 | 1 | 2 | 3;
  completedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  xp: number;
  streakCount: number;
  isCurrentUser?: boolean;
}

export interface QuestionReport {
  id: string;
  questionId: string;
  reason: string;
  createdAt: string;
}

export interface VaticanNewsQuizItem {
  id: string;
  sectionLabel: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string; // ISO
  questions: Question[];
}

import type { BannerType, CategoryIconName, CategorySlug } from '@/constants/theme';
import type { AvatarId } from '@/data/avatars';
import type { AppLanguage } from '@/i18n/translations';

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
  levelId?: string | null;
  levelSlug?: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  sourceRef: string;
}

export interface DailyChallenge {
  id: string;
  challengeDate: string; // YYYY-MM-DD
  liturgicalDay: string;
  title: string;
  subtitle: string;
  firstReadingRef: string;
  gospelRef: string;
  firstReadingText?: string;
  gospelText?: string;
  sourceLabel: string;
  isCustom?: boolean;
  questions: Question[];
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
  username: string;
  hasCompletedOnboarding: boolean;
  isAnonymous: boolean;
  authProvider?: 'google' | 'apple' | 'email' | null;
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
  country?: string | null; // ISO-2 ej. 'PY', 'AR', 'MX'
  avatarId?: AvatarId;
  language?: AppLanguage;
  streakShieldUsedWeek?: string | null; // ej. '2026-W47'
  createdAt?: string; // ISO
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
  username?: string;
  country?: string | null;
  avatarId?: AvatarId;
  xp: number;
  streakCount: number;
  longestStreak?: number;
  createdAt?: string;
  isCurrentUser?: boolean;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  username: string;
  country?: string | null;
  avatarId?: AvatarId;
  xp: number;
  streakCount: number;
  longestStreak: number;
  createdAt: string;
  levelsCompleted: number;
  totalStars: number;
  perfectLevels?: number;
  rankPosition: number | null;
}

export interface QuestionReport {
  id: string;
  questionId: string;
  reason: string;
  createdAt: string;
}

export interface VaticanNewsQuizItem {
  id: string;
  sourceName: string;
  sectionLabel: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string; // ISO
  questions: Question[];
}

export interface VersusMatch {
  id: string;
  challengerId: string;
  challengerUsername: string;
  challengerName: string;
  opponentId?: string | null;
  opponentUsername: string;
  opponentName: string;
  questionIds: string[];
  totalQuestions: number;
  challengerScore: number;
  opponentScore: number | null;
  status: 'waiting_opponent' | 'completed';
  winner: 'challenger' | 'opponent' | 'tie' | null;
  createdAt: string;
  completedAt?: string | null;
}

export type CommunityReactionEmoji = '❤️' | '🙏' | '🔥' | '👏' | '👍';

export interface Community {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerId: string | null;
  ownerUsername: string;
  ownerName: string;
  groupStreak: number;
  lastStreakDate?: string | null;
  memberCount: number;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string | null;
  authorUsername: string;
  authorName: string;
  postType: 'message' | 'quiz';
  body: string;
  quizSlug?: string | null;
  quizTitle?: string | null;
  createdAt: string;
  reactionCounts: Record<CommunityReactionEmoji, number>;
  myReactions: CommunityReactionEmoji[];
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  GUEST_SOFT_LIMIT_GAMES,
  HEART_RECHARGE_MINUTES,
  LOCAL_BANNERS,
  LOCAL_LEADERBOARD_PEERS,
  LOCAL_LEVELS,
  LOCAL_QUESTIONS,
  LOCAL_TOPICS,
  MAX_HEARTS,
} from '@/data/localSeed';
import { LOCAL_VATICAN_NEWS } from '@/data/vaticanNewsSeed';
import { initRevenueCat } from '@/lib/revenuecat';
import { ensureAnonymousSession, linkIdentityProvider } from '@/services/authService';
import { loadVaticanNewsQuizzes } from '@/services/newsService';
import {
  loadCatalogData,
  sendQuestionReport,
  syncLevelProgressToSupabase,
  syncProfileToSupabase,
} from '@/services/quizService';
import type {
  BannerItem,
  LeaderboardEntry,
  Level,
  LevelProgress,
  Question,
  QuestionReport,
  Topic,
  UserProfile,
  VaticanNewsQuizItem,
} from '@/types/trivia';

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeRechargedHearts(profile: UserProfile): { hearts: number; heartsUpdatedAt: string } {
  if (profile.isPremium) {
    return { hearts: MAX_HEARTS, heartsUpdatedAt: new Date().toISOString() };
  }
  if (profile.hearts >= MAX_HEARTS) {
    return { hearts: MAX_HEARTS, heartsUpdatedAt: profile.heartsUpdatedAt };
  }
  const elapsedMs = Date.now() - new Date(profile.heartsUpdatedAt).getTime();
  const rechargeMs = HEART_RECHARGE_MINUTES * 60 * 1000;
  const gained = Math.floor(elapsedMs / rechargeMs);
  if (gained <= 0) {
    return { hearts: profile.hearts, heartsUpdatedAt: profile.heartsUpdatedAt };
  }
  const nextHearts = Math.min(MAX_HEARTS, profile.hearts + gained);
  const nextUpdated =
    nextHearts >= MAX_HEARTS
      ? new Date().toISOString()
      : new Date(new Date(profile.heartsUpdatedAt).getTime() + gained * rechargeMs).toISOString();
  return { hearts: nextHearts, heartsUpdatedAt: nextUpdated };
}

function createInitialProfile(): UserProfile {
  return {
    id: 'guest-local',
    displayName: 'Peregrino',
    username: '',
    hasCompletedOnboarding: false,
    isAnonymous: true,
    authProvider: null,
    xp: 0,
    streakCount: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    hearts: MAX_HEARTS,
    heartsUpdatedAt: new Date().toISOString(),
    gamesPlayedGuest: 0,
    isPremium: false,
    timerEnabled: false, // Desactivado por defecto pensando en personas mayores (LINEA_GRAFICA.md)
    soundEnabled: true,
  };
}

export function sanitizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

export interface RoundCompletionInput {
  levelId: string | 'daily';
  topicSlug: string;
  newsQuizId?: string;
  correctCount: number;
  totalQuestions: number;
  correctQuestionIds: string[];
}

export interface RoundCompletionResult {
  xpEarned: number;
  stars: 0 | 1 | 2 | 3;
  shouldPromptAuth: boolean;
  streakCount: number;
}

interface GameState {
  isHydrated: boolean;
  isBootstrapping: boolean;
  dataSource: 'supabase' | 'local';
  topics: Topic[];
  levels: Level[];
  questions: Question[];
  banners: BannerItem[];
  vaticanNews: VaticanNewsQuizItem[];
  leaderboardPeers: LeaderboardEntry[];

  profile: UserProfile;
  levelProgress: Record<string, LevelProgress>;
  answeredCorrectByTopic: Record<string, string[]>;
  completedNewsIds: string[];
  dailyCompletedDate: string | null;
  reports: QuestionReport[];
  hasDismissedSoftAuth: boolean;

  bootstrap: () => Promise<void>;
  refreshHearts: () => void;
  consumeHeart: () => number;
  refillHeartsNow: () => void;
  completeRound: (input: RoundCompletionInput) => RoundCompletionResult;
  linkAccount: (
    provider: 'google' | 'apple',
    displayName?: string
  ) => Promise<{ ok: boolean; message: string }>;
  dismissSoftAuth: () => void;
  completeOnboarding: (displayName: string, username: string) => void;
  updateDisplayName: (name: string) => void;
  updateUsername: (username: string) => void;
  toggleTimer: () => void;
  toggleSound: () => void;
  setPremiumDemo: (enabled: boolean) => void;
  submitQuestionReport: (questionId: string, reason: string) => Promise<void>;
  resetLocalProgress: () => void;
}

const storage = createJSONStorage(() =>
  Platform.OS === 'web'
    ? {
        getItem: async (name: string) =>
          typeof window !== 'undefined' ? window.localStorage.getItem(name) : null,
        setItem: async (name: string, value: string) => {
          if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          if (typeof window !== 'undefined') window.localStorage.removeItem(name);
        },
      }
    : AsyncStorage
);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      isBootstrapping: false,
      dataSource: 'local',
      topics: LOCAL_TOPICS,
      levels: LOCAL_LEVELS,
      questions: LOCAL_QUESTIONS,
      banners: LOCAL_BANNERS,
      vaticanNews: LOCAL_VATICAN_NEWS,
      leaderboardPeers: LOCAL_LEADERBOARD_PEERS,

      profile: createInitialProfile(),
      levelProgress: {},
      answeredCorrectByTopic: {},
      completedNewsIds: [],
      dailyCompletedDate: null,
      reports: [],
      hasDismissedSoftAuth: false,

      bootstrap: async () => {
        if (get().isBootstrapping) return;
        set({ isBootstrapping: true });

        try {
          const currentProfile = get().profile;
          const [session, catalog, vaticanNews] = await Promise.all([
            ensureAnonymousSession(currentProfile.id),
            loadCatalogData(),
            loadVaticanNewsQuizzes(),
          ]);
          const recharged = computeRechargedHearts(currentProfile);
          void initRevenueCat(session.userId);

          set((state) => ({
            isBootstrapping: false,
            dataSource: catalog.source,
            topics: catalog.topics,
            levels: catalog.levels,
            questions: catalog.questions,
            banners: catalog.banners,
            vaticanNews,
            leaderboardPeers: catalog.leaderboard,
            profile: {
              ...state.profile,
              id: session.userId,
              isAnonymous: state.profile.authProvider ? false : session.isAnonymous,
              hearts: recharged.hearts,
              heartsUpdatedAt: recharged.heartsUpdatedAt,
              soundEnabled: state.profile.soundEnabled ?? true,
            },
          }));
        } catch {
          set({ isBootstrapping: false });
        }
      },

      refreshHearts: () => {
        const current = get().profile;
        const next = computeRechargedHearts(current);
        if (next.hearts !== current.hearts) {
          set((state) => ({
            profile: {
              ...state.profile,
              hearts: next.hearts,
              heartsUpdatedAt: next.heartsUpdatedAt,
            },
          }));
        }
      },

      consumeHeart: () => {
        const current = get().profile;
        if (current.isPremium) {
          return MAX_HEARTS;
        }
        const recharged = computeRechargedHearts(current);
        const nextHearts = Math.max(0, recharged.hearts - 1);
        const updatedProfile: UserProfile = {
          ...current,
          hearts: nextHearts,
          heartsUpdatedAt:
            recharged.hearts === MAX_HEARTS ? new Date().toISOString() : recharged.heartsUpdatedAt,
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
        return nextHearts;
      },

      refillHeartsNow: () => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          hearts: MAX_HEARTS,
          heartsUpdatedAt: new Date().toISOString(),
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
      },

      completeRound: (input) => {
        const state = get();
        const profile = state.profile;
        const today = todayKey();
        const yesterday = yesterdayKey();

        const ratio = input.totalQuestions > 0 ? input.correctCount / input.totalQuestions : 0;
        const stars: 0 | 1 | 2 | 3 =
          ratio >= 0.95 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
        const xpEarned = input.correctCount * 15 + (stars === 3 ? 25 : stars >= 1 ? 10 : 0);

        let nextStreak = profile.streakCount;
        if (profile.lastPlayedDate !== today) {
          if (profile.lastPlayedDate === yesterday) {
            nextStreak = profile.streakCount + 1;
          } else {
            nextStreak = 1;
          }
        }

        const nextGamesPlayedGuest = profile.isAnonymous
          ? profile.gamesPlayedGuest + 1
          : profile.gamesPlayedGuest;

        const updatedProfile: UserProfile = {
          ...profile,
          xp: profile.xp + xpEarned,
          streakCount: nextStreak,
          longestStreak: Math.max(profile.longestStreak, nextStreak),
          lastPlayedDate: today,
          gamesPlayedGuest: nextGamesPlayedGuest,
        };

        // Registrar preguntas respondidas correctamente en cada categoría (solo si no es noticia)
        const updatedCorrectByTopic = { ...state.answeredCorrectByTopic };
        if (!input.newsQuizId) {
          const existingIds = new Set(updatedCorrectByTopic[input.topicSlug] ?? []);
          for (const qid of input.correctQuestionIds) {
            existingIds.add(qid);
          }
          updatedCorrectByTopic[input.topicSlug] = Array.from(existingIds);
        }

        const updatedCompletedNews = input.newsQuizId
          ? Array.from(new Set([...state.completedNewsIds, input.newsQuizId]))
          : state.completedNewsIds;

        // Actualizar progreso por nivel (si no es el desafío diario ni noticia)
        const updatedProgress = { ...state.levelProgress };
        if (input.levelId !== 'daily' && !input.newsQuizId) {
          const prev = updatedProgress[input.levelId];
          const merged: LevelProgress = {
            levelId: input.levelId,
            bestScore: Math.max(prev?.bestScore ?? 0, input.correctCount),
            totalQuestions: input.totalQuestions,
            stars: Math.max(prev?.stars ?? 0, stars) as 0 | 1 | 2 | 3,
            completedAt: new Date().toISOString(),
          };
          updatedProgress[input.levelId] = merged;
          void syncLevelProgressToSupabase(updatedProfile.id, merged);
        }

        set({
          profile: updatedProfile,
          levelProgress: updatedProgress,
          answeredCorrectByTopic: updatedCorrectByTopic,
          completedNewsIds: updatedCompletedNews,
          dailyCompletedDate:
            input.levelId === 'daily' ? today : state.dailyCompletedDate,
        });

        void syncProfileToSupabase(updatedProfile);

        const shouldPromptAuth =
          updatedProfile.isAnonymous &&
          !state.hasDismissedSoftAuth &&
          updatedProfile.gamesPlayedGuest >= GUEST_SOFT_LIMIT_GAMES;

        return {
          xpEarned,
          stars,
          shouldPromptAuth,
          streakCount: nextStreak,
        };
      },

      linkAccount: async (provider, displayName) => {
        const res = await linkIdentityProvider(provider, displayName);
        if (res.ok) {
          const updatedProfile: UserProfile = {
            ...get().profile,
            isAnonymous: false,
            authProvider: provider,
            displayName: displayName?.trim() || get().profile.displayName || 'Peregrino',
          };
          set({ profile: updatedProfile, hasDismissedSoftAuth: true });
          void syncProfileToSupabase(updatedProfile);
        }
        return { ok: res.ok, message: res.message };
      },

      dismissSoftAuth: () => set({ hasDismissedSoftAuth: true }),

      completeOnboarding: (displayName, username) => {
        const cleanName = displayName.trim() || 'Peregrino';
        const cleanUser = sanitizeUsername(username || cleanName);
        const updatedProfile: UserProfile = {
          ...get().profile,
          displayName: cleanName,
          username: cleanUser,
          hasCompletedOnboarding: true,
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
      },

      updateDisplayName: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const updatedProfile: UserProfile = {
          ...get().profile,
          displayName: clean,
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
      },

      updateUsername: (username) => {
        const clean = sanitizeUsername(username);
        if (!clean) return;
        const updatedProfile: UserProfile = {
          ...get().profile,
          username: clean,
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
      },

      toggleTimer: () => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          timerEnabled: !get().profile.timerEnabled,
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
      },

      toggleSound: () => {
        const current = get().profile.soundEnabled ?? true;
        set((state) => ({
          profile: {
            ...state.profile,
            soundEnabled: !current,
          },
        }));
      },

      setPremiumDemo: (enabled) => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          isPremium: enabled,
          hearts: enabled ? MAX_HEARTS : get().profile.hearts,
          heartsUpdatedAt: new Date().toISOString(),
        };
        set({ profile: updatedProfile });
        void syncProfileToSupabase(updatedProfile);
      },

      submitQuestionReport: async (questionId, reason) => {
        const report: QuestionReport = {
          id: `rep-${Date.now()}`,
          questionId,
          reason: reason.trim(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ reports: [report, ...state.reports] }));
        await sendQuestionReport(questionId, get().profile.id, reason);
      },

      resetLocalProgress: () => {
        const currentId = get().profile.id;
        set({
          profile: {
            ...createInitialProfile(),
            id: currentId,
          },
          levelProgress: {},
          answeredCorrectByTopic: {},
          completedNewsIds: [],
          dailyCompletedDate: null,
          hasDismissedSoftAuth: false,
        });
      },
    }),
    {
      name: 'trivia-catolica-state-v1',
      storage,
      partialize: (state) => ({
        profile: state.profile,
        levelProgress: state.levelProgress,
        answeredCorrectByTopic: state.answeredCorrectByTopic,
        completedNewsIds: state.completedNewsIds,
        dailyCompletedDate: state.dailyCompletedDate,
        reports: state.reports,
        hasDismissedSoftAuth: state.hasDismissedSoftAuth,
      }),
      onRehydrateStorage: () => () => {
        useGameStore.setState({ isHydrated: true });
      },
    }
  )
);

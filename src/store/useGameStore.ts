import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DAILY_FREE_QUIZZES_LIMIT,
  DAILY_FREE_VERSUS_LIMIT,
  GUEST_FREE_QUIZZES_LIMIT,
  PAYWALL_ENABLED,
} from '@/constants/features';
import {
  DEFAULT_AVATAR_ID,
  getNewlyUnlockedAvatars,
  type AvatarId,
  type AvatarOption,
} from '@/data/avatars';
import {
  HEART_RECHARGE_MINUTES,
  LOCAL_BANNERS,
  LOCAL_LEADERBOARD_PEERS,
  LOCAL_LEVELS,
  LOCAL_QUESTIONS,
  LOCAL_TOPICS,
  MAX_HEARTS,
} from '@/data/localSeed';
import { LOCAL_VATICAN_NEWS } from '@/data/vaticanNewsSeed';
import type { AppLanguage } from '@/i18n/translations';
import { initRevenueCat } from '@/lib/revenuecat';
import {
  deleteOwnAccount,
  ensureAnonymousSession,
  linkIdentityProvider,
  signInWithEmailPassword,
  signOutUser,
  signUpWithEmailPassword,
  verifyEmailOtp,
} from '@/services/authService';
import {
  LOCAL_SEED_COMMUNITIES,
  LOCAL_SEED_COMMUNITY_POSTS,
  createCommunityRemote,
  fetchCommunitiesRemote,
  fetchCommunityPostsRemote,
  findCommunityByCodeRemote,
  joinCommunityRemote,
  publishCommunityPostRemote,
  recordCommunityStreakRemote,
  togglePostReactionRemote,
} from '@/services/communityService';
import {
  getLocalDailyChallengeForDate,
  loadTodayDailyChallenge,
} from '@/services/dailyChallengeService';
import { loadVaticanNewsQuizzes } from '@/services/newsService';
import {
  cancelDailyChallengeReminder,
  registerPushTokenForUser,
  requestNotificationPermissionAndSetup,
} from '@/services/pushService';
import {
  fetchLeaderboard,
  fetchRemoteAccountData,
  loadCatalogData,
  sendQuestionReport,
  syncLevelProgressToSupabase,
  syncProfileToSupabase,
} from '@/services/quizService';
import { fetchMyVersusMatches } from '@/services/versusService';
import type {
  BannerItem,
  Community,
  CommunityPost,
  CommunityReactionEmoji,
  DailyChallenge,
  LeaderboardEntry,
  Level,
  LevelProgress,
  Question,
  QuestionReport,
  Topic,
  UserProfile,
  VaticanNewsQuizItem,
  VersusMatch,
} from '@/types/trivia';

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return formatDateKey(new Date());
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDateKey(d);
}

function currentIsoWeekKey(): string {
  const d = new Date();
  const temp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
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
    timerEnabled: false,
    soundEnabled: true,
    country: null,
    avatarId: DEFAULT_AVATAR_ID,
    language: 'es',
    streakShieldUsedWeek: null,
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
  levelId: string | 'daily' | 'error-review' | 'free-play' | 'versus';
  topicSlug: string;
  newsQuizId?: string;
  correctCount: number;
  totalQuestions: number;
  correctQuestionIds: string[];
  wrongQuestionIds?: string[];
}

export interface RoundCompletionResult {
  xpEarned: number;
  stars: 0 | 1 | 2 | 3;
  shouldPromptAuth: boolean;
  streakCount: number;
  streakShieldActivated: boolean;
  newlyUnlockedAvatars: AvatarOption[];
}

export type QuizGateStatus = 'ok' | 'guest_limit' | 'daily_limit';

interface GameState {
  isHydrated: boolean;
  isBootstrapping: boolean;
  dataSource: 'supabase' | 'local';
  topics: Topic[];
  levels: Level[];
  questions: Question[];
  banners: BannerItem[];
  dailyChallenge: DailyChallenge;
  vaticanNews: VaticanNewsQuizItem[];
  leaderboardPeers: LeaderboardEntry[];

  profile: UserProfile;
  levelProgress: Record<string, LevelProgress>;
  answeredCorrectByTopic: Record<string, string[]>;
  wrongQuestionIds: string[];
  completedNewsIds: string[];
  dailyCompletedDate: string | null;
  dailyQuizzesDate: string | null;
  dailyQuizzesCount: number;
  dailyVersusDate: string | null;
  dailyVersusCount: number;
  versusMatches: VersusMatch[];
  communities: Community[];
  joinedCommunityIds: string[];
  communityPostsByRoom: Record<string, CommunityPost[]>;
  reports: QuestionReport[];
  hasDismissedSoftAuth: boolean;
  hasDismissedCountryPrompt: boolean;
  hasPromptedNotifications: boolean;
  notificationsEnabled: boolean;
  /** @usuario que se quiso guardar pero ya lo tenía otra persona (se avisa en Perfil). */
  usernameConflict: string | null;

  bootstrap: () => Promise<void>;
  refreshDailyChallengeIfNeeded: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  refreshHearts: () => void;
  consumeHeart: () => number;
  refillHeartsNow: () => void;
  getDailyQuizzesPlayedToday: () => number;
  canStartQuiz: () => QuizGateStatus;
  getDailyVersusPlayedToday: () => number;
  canStartVersus: () => QuizGateStatus;
  refreshVersusMatches: () => Promise<void>;
  upsertVersusMatch: (match: VersusMatch) => void;
  refreshCommunities: () => Promise<void>;
  loadCommunityPosts: (communityId: string) => Promise<void>;
  createCommunity: (input: {
    name: string;
    description: string;
    isPrivate: boolean;
  }) => Promise<Community>;
  joinCommunity: (communityId: string) => Promise<boolean>;
  joinCommunityByCode: (code: string) => Promise<{ ok: boolean; community?: Community; message: string }>;
  publishCommunityPost: (input: {
    communityId: string;
    postType: 'message' | 'quiz';
    body: string;
    quizSlug?: string | null;
    quizTitle?: string | null;
  }) => Promise<CommunityPost>;
  toggleCommunityReaction: (
    communityId: string,
    postId: string,
    emoji: CommunityReactionEmoji
  ) => void;
  completeRound: (input: RoundCompletionInput) => RoundCompletionResult;
  linkAccount: (
    provider: 'google' | 'apple',
    displayName?: string
  ) => Promise<{ ok: boolean; message: string }>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ ok: boolean; needsEmailConfirmation?: boolean; message: string }>;
  completeEmailOtpLogin: (
    email: string,
    token: string,
    displayName?: string
  ) => Promise<{ ok: boolean; message: string }>;
  dismissSoftAuth: () => void;
  dismissCountryPrompt: () => void;
  dismissNotificationPrompt: () => void;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  completeOnboarding: (
    displayName: string,
    username: string,
    country?: string | null,
    language?: AppLanguage
  ) => void;
  updateDisplayName: (name: string) => void;
  updateUsername: (username: string) => void;
  setCountry: (countryCode: string) => void;
  setAvatar: (avatarId: AvatarId) => void;
  setLanguage: (language: AppLanguage) => void;
  toggleTimer: () => void;
  toggleSound: () => void;
  setPremiumDemo: (enabled: boolean) => void;
  submitQuestionReport: (questionId: string, reason: string) => Promise<void>;
  resetLocalProgress: () => void;
  clearUsernameConflict: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; message: string }>;
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

function syncProfile(profile: UserProfile): void {
  void syncProfileToSupabase(profile).then((result) => {
    if (result === 'ok' && !profile.isAnonymous && profile.username) {
      void useGameStore.getState().refreshLeaderboard();
      return;
    }
    if (result !== 'username_taken') return;
    const state = useGameStore.getState();
    if (state.profile.id !== profile.id || state.profile.username !== profile.username) return;
    useGameStore.setState({
      profile: { ...state.profile, username: '' },
      usernameConflict: profile.username,
    });
  });
}

function freshGuestState() {
  return {
    profile: createInitialProfile(),
    levelProgress: {},
    answeredCorrectByTopic: {},
    wrongQuestionIds: [],
    completedNewsIds: [],
    dailyCompletedDate: null,
    dailyQuizzesDate: null,
    dailyQuizzesCount: 0,
    reports: [],
    hasDismissedSoftAuth: false,
    hasDismissedCountryPrompt: false,
    usernameConflict: null,
  };
}

async function mergeAuthenticatedSession(
  provider: 'google' | 'apple' | 'email',
  finalUserId: string,
  displayName?: string
): Promise<void> {
  const current = useGameStore.getState();
  const baseProfile: UserProfile = {
    ...current.profile,
    id: finalUserId,
    isAnonymous: false,
    authProvider: provider,
    displayName: displayName?.trim() || current.profile.displayName || 'Peregrino',
  };

  let mergedProfile: UserProfile = {
    ...baseProfile,
    hasCompletedOnboarding: true,
  };
  const mergedProgress: Record<string, LevelProgress> = { ...current.levelProgress };
  const remote = await fetchRemoteAccountData(finalUserId);

  if (remote) {
    const r = remote.profile;
    const localDate = baseProfile.lastPlayedDate ?? '';
    const remoteDate = r.lastPlayedDate ?? '';
    const remoteName =
      r.displayName && r.displayName !== 'Peregrino' ? r.displayName : undefined;
    mergedProfile = {
      ...baseProfile,
      hasCompletedOnboarding: true,
      displayName: displayName?.trim() || remoteName || baseProfile.displayName,
      username: r.username || baseProfile.username,
      country: r.country ?? baseProfile.country ?? null,
      avatarId: r.avatarId ?? baseProfile.avatarId ?? DEFAULT_AVATAR_ID,
      language: r.language ?? baseProfile.language ?? 'es',
      isPremium: Boolean(baseProfile.isPremium || r.isPremium),
      xp: Math.max(baseProfile.xp, r.xp ?? 0),
      longestStreak: Math.max(baseProfile.longestStreak, r.longestStreak ?? 0),
      streakCount:
        remoteDate > localDate
          ? (r.streakCount ?? 0)
          : Math.max(
              baseProfile.streakCount,
              remoteDate === localDate ? (r.streakCount ?? 0) : 0
            ),
      lastPlayedDate: (remoteDate > localDate ? remoteDate : localDate) || null,
      createdAt: r.createdAt ?? baseProfile.createdAt,
    };

    for (const prog of remote.levelProgress) {
      const existing = mergedProgress[prog.levelId];
      if (!existing || prog.stars > existing.stars) {
        mergedProgress[prog.levelId] = {
          ...prog,
          totalQuestions: existing?.totalQuestions || 5,
        };
      }
    }
  }

  useGameStore.setState({
    profile: mergedProfile,
    levelProgress: mergedProgress,
    hasDismissedSoftAuth: true,
    usernameConflict: null,
  });

  syncProfile(mergedProfile);
  for (const prog of Object.values(current.levelProgress)) {
    void syncLevelProgressToSupabase(finalUserId, prog);
  }
  void useGameStore.getState().refreshLeaderboard();
}

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
      dailyChallenge: getLocalDailyChallengeForDate(),
      vaticanNews: LOCAL_VATICAN_NEWS,
      leaderboardPeers: LOCAL_LEADERBOARD_PEERS,

      profile: createInitialProfile(),
      levelProgress: {},
      answeredCorrectByTopic: {},
      wrongQuestionIds: [],
      completedNewsIds: [],
      dailyCompletedDate: null,
      dailyQuizzesDate: null,
      dailyQuizzesCount: 0,
      dailyVersusDate: null,
      dailyVersusCount: 0,
      versusMatches: [],
      communities: LOCAL_SEED_COMMUNITIES,
      joinedCommunityIds: ['55555555-5555-4555-8555-555555555501'],
      communityPostsByRoom: LOCAL_SEED_COMMUNITY_POSTS,
      reports: [],
      hasDismissedSoftAuth: false,
      hasDismissedCountryPrompt: false,
      hasPromptedNotifications: false,
      notificationsEnabled: false,
      usernameConflict: null,

      bootstrap: async () => {
        if (get().isBootstrapping) return;
        set({ isBootstrapping: true });

        try {
          const currentProfile = get().profile;
          const [session, catalog, vaticanNews, dailyChallenge] = await Promise.all([
            ensureAnonymousSession(currentProfile.id),
            loadCatalogData(),
            loadVaticanNewsQuizzes(),
            loadTodayDailyChallenge(todayKey()),
          ]);
          const recharged = computeRechargedHearts(currentProfile);
          void initRevenueCat(session.userId);
          void registerPushTokenForUser(session.userId);

          // Si ya hay una sesión registrada activa en Supabase, recuperar sus datos remotos
          // (especialmente clave en navegadores nuevos o al reabrir sin pasar de nuevo por onboarding).
          let hydratedProfile: UserProfile = {
            ...get().profile,
            id: session.userId,
            isAnonymous: get().profile.authProvider ? false : session.isAnonymous,
            hearts: recharged.hearts,
            heartsUpdatedAt: recharged.heartsUpdatedAt,
            soundEnabled: get().profile.soundEnabled ?? true,
            avatarId: get().profile.avatarId ?? DEFAULT_AVATAR_ID,
            language: get().profile.language ?? 'es',
          };
          const hydratedProgress: Record<string, LevelProgress> = { ...get().levelProgress };

          if (!session.isAnonymous && session.mode === 'supabase') {
            const remote = await fetchRemoteAccountData(session.userId);
            if (remote) {
              const r = remote.profile;
              const remoteName =
                r.displayName && r.displayName !== 'Peregrino' ? r.displayName : undefined;
              hydratedProfile = {
                ...hydratedProfile,
                isAnonymous: false,
                hasCompletedOnboarding: true,
                displayName: remoteName || hydratedProfile.displayName,
                username: r.username || hydratedProfile.username,
                country: r.country ?? hydratedProfile.country ?? null,
                avatarId: r.avatarId ?? hydratedProfile.avatarId ?? DEFAULT_AVATAR_ID,
                language: r.language ?? hydratedProfile.language ?? 'es',
                isPremium: Boolean(hydratedProfile.isPremium || r.isPremium),
                xp: Math.max(hydratedProfile.xp, r.xp ?? 0),
                streakCount: Math.max(hydratedProfile.streakCount, r.streakCount ?? 0),
                longestStreak: Math.max(hydratedProfile.longestStreak, r.longestStreak ?? 0),
                lastPlayedDate: r.lastPlayedDate ?? hydratedProfile.lastPlayedDate,
                createdAt: r.createdAt ?? hydratedProfile.createdAt,
              };
              for (const prog of remote.levelProgress) {
                const existing = hydratedProgress[prog.levelId];
                if (!existing || prog.stars > existing.stars) {
                  hydratedProgress[prog.levelId] = {
                    ...prog,
                    totalQuestions: existing?.totalQuestions || 5,
                  };
                }
              }
            }
          }

          set({
            isBootstrapping: false,
            dataSource: catalog.source,
            topics: catalog.topics,
            levels: catalog.levels,
            questions: catalog.questions,
            banners: catalog.banners,
            dailyChallenge,
            vaticanNews,
            leaderboardPeers: catalog.leaderboard,
            profile: hydratedProfile,
            levelProgress: hydratedProgress,
          });
        } catch {
          set({ isBootstrapping: false });
        }
      },

      refreshDailyChallengeIfNeeded: async () => {
        const today = todayKey();
        if (get().dailyChallenge.challengeDate === today) return;
        const fresh = await loadTodayDailyChallenge(today);
        set({ dailyChallenge: fresh });
      },

      refreshLeaderboard: async () => {
        const fresh = await fetchLeaderboard();
        if (fresh) {
          set({ leaderboardPeers: fresh });
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
        syncProfile(updatedProfile);
        return nextHearts;
      },

      refillHeartsNow: () => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          hearts: MAX_HEARTS,
          heartsUpdatedAt: new Date().toISOString(),
        };
        set({ profile: updatedProfile });
        syncProfile(updatedProfile);
      },

      getDailyQuizzesPlayedToday: () => {
        const state = get();
        return state.dailyQuizzesDate === todayKey() ? state.dailyQuizzesCount : 0;
      },

      canStartQuiz: () => {
        const state = get();
        const profile = state.profile;
        if (profile.isAnonymous && profile.gamesPlayedGuest >= GUEST_FREE_QUIZZES_LIMIT) {
          return 'guest_limit';
        }
        if (
          !profile.isAnonymous &&
          PAYWALL_ENABLED &&
          !profile.isPremium &&
          state.getDailyQuizzesPlayedToday() >= DAILY_FREE_QUIZZES_LIMIT
        ) {
          return 'daily_limit';
        }
        return 'ok';
      },

      getDailyVersusPlayedToday: () => {
        const state = get();
        return state.dailyVersusDate === todayKey() ? state.dailyVersusCount : 0;
      },

      canStartVersus: () => {
        const state = get();
        const profile = state.profile;
        if (profile.isAnonymous && profile.gamesPlayedGuest >= GUEST_FREE_QUIZZES_LIMIT) {
          return 'guest_limit';
        }
        if (
          !profile.isAnonymous &&
          PAYWALL_ENABLED &&
          !profile.isPremium &&
          state.getDailyVersusPlayedToday() >= DAILY_FREE_VERSUS_LIMIT
        ) {
          return 'daily_limit';
        }
        return 'ok';
      },

      refreshVersusMatches: async () => {
        const profile = get().profile;
        if (!profile.id || profile.isAnonymous) return;
        const remote = await fetchMyVersusMatches(profile.id, profile.username);
        if (!remote) return;
        // Combinar los remotos con los locales aún no sincronizados
        const seen = new Set(remote.map((m) => m.id));
        const localOnly = get().versusMatches.filter(
          (m) => m.id.startsWith('local-vs-') && !seen.has(m.id)
        );
        set({ versusMatches: [...remote, ...localOnly].slice(0, 30) });
      },

      upsertVersusMatch: (match) => {
        set((state) => {
          const rest = state.versusMatches.filter((m) => m.id !== match.id);
          return { versusMatches: [match, ...rest].slice(0, 30) };
        });
      },

      refreshCommunities: async () => {
        const userId = get().profile.id;
        const res = await fetchCommunitiesRemote(userId);
        if (!res) return;
        const localOwned = get().communities.filter((c) => c.id.startsWith('local-comm-'));
        const seen = new Set(res.communities.map((c) => c.id));
        const merged = [...res.communities, ...localOwned.filter((c) => !seen.has(c.id))];
        const mergedJoined = Array.from(
          new Set([
            ...res.joinedIds,
            ...get().joinedCommunityIds.filter((id) => id.startsWith('local-comm-')),
          ])
        );
        set({
          communities: merged.length > 0 ? merged : LOCAL_SEED_COMMUNITIES,
          joinedCommunityIds: mergedJoined,
        });
      },

      loadCommunityPosts: async (communityId) => {
        const userId = get().profile.id;
        const remote = await fetchCommunityPostsRemote(communityId, userId);
        if (!remote) return;
        set((state) => ({
          communityPostsByRoom: {
            ...state.communityPostsByRoom,
            [communityId]: remote,
          },
        }));
      },

      createCommunity: async ({ name, description, isPrivate }) => {
        const p = get().profile;
        const created = await createCommunityRemote({
          name,
          description,
          isPrivate,
          ownerId: p.id,
          ownerUsername: p.username || 'peregrino',
          ownerName: p.displayName || 'Peregrino',
        });
        set((state) => ({
          communities: [created, ...state.communities.filter((c) => c.id !== created.id)],
          joinedCommunityIds: Array.from(new Set([created.id, ...state.joinedCommunityIds])),
          communityPostsByRoom: {
            ...state.communityPostsByRoom,
            [created.id]: state.communityPostsByRoom[created.id] ?? [],
          },
        }));
        return created;
      },

      joinCommunity: async (communityId) => {
        const p = get().profile;
        const ok = await joinCommunityRemote({
          communityId,
          userId: p.id,
          username: p.username || '',
          displayName: p.displayName || 'Peregrino',
        });
        if (!ok) return false;
        set((state) => {
          const already = state.joinedCommunityIds.includes(communityId);
          return {
            joinedCommunityIds: already
              ? state.joinedCommunityIds
              : [communityId, ...state.joinedCommunityIds],
            communities: state.communities.map((c) =>
              c.id === communityId && !already ? { ...c, memberCount: c.memberCount + 1 } : c
            ),
          };
        });
        return true;
      },

      joinCommunityByCode: async (code) => {
        const clean = code.trim().toUpperCase();
        if (!clean) return { ok: false, message: 'Escribí un código de sala.' };
        const localHit = get().communities.find((c) => c.inviteCode.toUpperCase() === clean);
        const found = localHit ?? (await findCommunityByCodeRemote(clean));
        if (!found) {
          return { ok: false, message: `No encontramos ninguna sala con el código ${clean}.` };
        }
        set((state) => ({
          communities: state.communities.some((c) => c.id === found.id)
            ? state.communities
            : [found, ...state.communities],
        }));
        await get().joinCommunity(found.id);
        return { ok: true, community: found, message: `¡Te sumaste a ${found.name}!` };
      },

      publishCommunityPost: async (input) => {
        const p = get().profile;
        const created = await publishCommunityPostRemote({
          communityId: input.communityId,
          authorId: p.id,
          authorUsername: p.username || 'peregrino',
          authorName: p.displayName || 'Peregrino',
          postType: input.postType,
          body: input.body,
          quizSlug: input.quizSlug,
          quizTitle: input.quizTitle,
        });
        set((state) => ({
          communityPostsByRoom: {
            ...state.communityPostsByRoom,
            [input.communityId]: [
              created,
              ...(state.communityPostsByRoom[input.communityId] ?? []),
            ],
          },
        }));
        return created;
      },

      toggleCommunityReaction: (communityId, postId, emoji) => {
        const userId = get().profile.id;
        let wasActive = false;
        set((state) => {
          const roomPosts = state.communityPostsByRoom[communityId] ?? [];
          const nextPosts = roomPosts.map((post) => {
            if (post.id !== postId) return post;
            wasActive = post.myReactions.includes(emoji);
            const nextMine = wasActive
              ? post.myReactions.filter((e) => e !== emoji)
              : [...post.myReactions, emoji];
            const nextCounts = {
              ...post.reactionCounts,
              [emoji]: Math.max(0, (post.reactionCounts[emoji] ?? 0) + (wasActive ? -1 : 1)),
            };
            return {
              ...post,
              myReactions: nextMine,
              reactionCounts: nextCounts,
            };
          });
          return {
            communityPostsByRoom: {
              ...state.communityPostsByRoom,
              [communityId]: nextPosts,
            },
          };
        });
        void togglePostReactionRemote({
          postId,
          userId,
          emoji,
          currentlyActive: wasActive,
        });
      },

      completeRound: (input) => {
        const state = get();
        const profile = state.profile;
        const today = todayKey();
        const yesterday = daysAgoKey(1);
        const twoDaysAgo = daysAgoKey(2);
        const isoWeek = currentIsoWeekKey();

        // El Desafío del Día solo se puede completar y sumar puntos una vez por fecha.
        if (input.levelId === 'daily' && state.dailyCompletedDate === today) {
          return {
            xpEarned: 0,
            stars: 0,
            shouldPromptAuth: false,
            streakCount: profile.streakCount,
            streakShieldActivated: false,
            newlyUnlockedAvatars: [],
          };
        }

        const ratio = input.totalQuestions > 0 ? input.correctCount / input.totalQuestions : 0;
        const stars: 0 | 1 | 2 | 3 =
          ratio >= 0.95 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
        const xpEarned = input.correctCount * 15 + (stars === 3 ? 25 : stars >= 1 ? 10 : 0);

        let nextStreak = profile.streakCount;
        let streakShieldActivated = false;
        let nextShieldWeek = profile.streakShieldUsedWeek ?? null;

        if (profile.lastPlayedDate !== today) {
          if (profile.lastPlayedDate === yesterday) {
            nextStreak = profile.streakCount + 1;
          } else if (
            profile.lastPlayedDate === twoDaysAgo &&
            profile.isPremium &&
            profile.streakCount > 0 &&
            profile.streakShieldUsedWeek !== isoWeek
          ) {
            // Protector de racha semanal automático para usuarios Pro
            nextStreak = profile.streakCount + 1;
            streakShieldActivated = true;
            nextShieldWeek = isoWeek;
          } else {
            nextStreak = 1;
          }
        }

        const nextGamesPlayedGuest = profile.isAnonymous
          ? profile.gamesPlayedGuest + 1
          : profile.gamesPlayedGuest;

        const prevXp = profile.xp;
        const nextXp = prevXp + xpEarned;
        const newlyUnlockedAvatars = getNewlyUnlockedAvatars(prevXp, nextXp);

        const updatedProfile: UserProfile = {
          ...profile,
          xp: nextXp,
          streakCount: nextStreak,
          longestStreak: Math.max(profile.longestStreak, nextStreak),
          lastPlayedDate: today,
          gamesPlayedGuest: nextGamesPlayedGuest,
          streakShieldUsedWeek: nextShieldWeek,
        };

        // Registrar preguntas respondidas correctamente en cada categoría (solo niveles de categoría)
        const isSpecialMode =
          input.levelId === 'daily' ||
          input.levelId === 'error-review' ||
          input.levelId === 'free-play' ||
          input.levelId === 'versus';
        const updatedCorrectByTopic = { ...state.answeredCorrectByTopic };
        if (!input.newsQuizId && !isSpecialMode) {
          const existingIds = new Set(updatedCorrectByTopic[input.topicSlug] ?? []);
          for (const qid of input.correctQuestionIds) {
            existingIds.add(qid);
          }
          updatedCorrectByTopic[input.topicSlug] = Array.from(existingIds);
        }

        // Actualizar banco de errores para "Repasar mis errores" (Pro)
        const wrongSet = new Set(state.wrongQuestionIds ?? []);
        for (const qid of input.correctQuestionIds) {
          wrongSet.delete(qid);
        }
        for (const qid of input.wrongQuestionIds ?? []) {
          wrongSet.add(qid);
        }
        const updatedWrongIds = Array.from(wrongSet).slice(-40);

        const updatedCompletedNews = input.newsQuizId
          ? Array.from(new Set([...state.completedNewsIds, input.newsQuizId]))
          : state.completedNewsIds;

        // Actualizar progreso por nivel (si no es desafío diario, noticia, libre, versus ni repaso)
        const updatedProgress = { ...state.levelProgress };
        if (!isSpecialMode && !input.newsQuizId) {
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

        const prevDailyCount = state.dailyQuizzesDate === today ? state.dailyQuizzesCount : 0;
        const prevVersusCount = state.dailyVersusDate === today ? state.dailyVersusCount : 0;

        set({
          profile: updatedProfile,
          levelProgress: updatedProgress,
          answeredCorrectByTopic: updatedCorrectByTopic,
          wrongQuestionIds: updatedWrongIds,
          completedNewsIds: updatedCompletedNews,
          dailyCompletedDate: input.levelId === 'daily' ? today : state.dailyCompletedDate,
          dailyQuizzesDate: today,
          dailyQuizzesCount: prevDailyCount + 1,
          dailyVersusDate: input.levelId === 'versus' ? today : state.dailyVersusDate,
          dailyVersusCount:
            input.levelId === 'versus' ? prevVersusCount + 1 : state.dailyVersusCount,
        });

        syncProfile(updatedProfile);
        void recordCommunityStreakRemote();

        // Actualizar racha grupal local de las salas donde participa el usuario
        const joinedSet = new Set(state.joinedCommunityIds);
        if (joinedSet.size > 0) {
          set((curr) => ({
            communities: curr.communities.map((c) => {
              if (!joinedSet.has(c.id)) return c;
              if (c.lastStreakDate === today) return c;
              return {
                ...c,
                groupStreak:
                  c.lastStreakDate === yesterday
                    ? c.groupStreak + 1
                    : Math.max(1, c.groupStreak),
                lastStreakDate: today,
              };
            }),
          }));
        }

        const shouldPromptAuth =
          updatedProfile.isAnonymous &&
          updatedProfile.gamesPlayedGuest >= GUEST_FREE_QUIZZES_LIMIT;

        return {
          xpEarned,
          stars,
          shouldPromptAuth,
          streakCount: nextStreak,
          streakShieldActivated,
          newlyUnlockedAvatars,
        };
      },

      linkAccount: async (provider, displayName) => {
        const res = await linkIdentityProvider(provider, displayName);
        if (res.ok) {
          const finalUserId = res.userId || get().profile.id;
          await mergeAuthenticatedSession(provider, finalUserId, displayName);
        }
        return { ok: res.ok, message: res.message };
      },

      signInWithPassword: async (email, password) => {
        const res = await signInWithEmailPassword(email, password);
        if (res.ok) {
          const finalUserId = res.userId || get().profile.id;
          await mergeAuthenticatedSession('email', finalUserId);
        }
        return { ok: res.ok, message: res.message };
      },

      signUpWithPassword: async (email, password, displayName) => {
        const res = await signUpWithEmailPassword(email, password, displayName);
        if (res.ok && !res.needsEmailConfirmation) {
          const finalUserId = res.userId || get().profile.id;
          await mergeAuthenticatedSession('email', finalUserId, displayName);
        }
        return {
          ok: res.ok,
          needsEmailConfirmation: res.needsEmailConfirmation,
          message: res.message,
        };
      },

      completeEmailOtpLogin: async (email, token, displayName) => {
        const res = await verifyEmailOtp(email, token, displayName);
        if (res.ok) {
          const finalUserId = res.userId || get().profile.id;
          await mergeAuthenticatedSession('email', finalUserId, displayName);
        }
        return { ok: res.ok, message: res.message };
      },

      dismissSoftAuth: () => set({ hasDismissedSoftAuth: true }),
      dismissCountryPrompt: () => set({ hasDismissedCountryPrompt: true }),
      dismissNotificationPrompt: () => set({ hasPromptedNotifications: true }),

      enableNotifications: async () => {
        const userId = get().profile.id;
        const granted = await requestNotificationPermissionAndSetup(userId);
        set({
          hasPromptedNotifications: true,
          notificationsEnabled: granted,
        });
        return granted;
      },

      disableNotifications: async () => {
        const userId = get().profile.id;
        await cancelDailyChallengeReminder(userId);
        set({ notificationsEnabled: false });
      },

      completeOnboarding: (displayName, username, country, language) => {
        const cleanName = displayName.trim() || 'Peregrino';
        const cleanUser = sanitizeUsername(username);
        const current = get().profile;
        const updatedProfile: UserProfile = {
          ...current,
          displayName: cleanName,
          username: cleanUser,
          country: country !== undefined ? country : current.country ?? null,
          language: language ?? current.language ?? 'es',
          hasCompletedOnboarding: true,
        };
        set({ profile: updatedProfile, usernameConflict: null });
        syncProfile(updatedProfile);
      },

      updateDisplayName: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const updatedProfile: UserProfile = {
          ...get().profile,
          displayName: clean,
        };
        set({ profile: updatedProfile });
        syncProfile(updatedProfile);
      },

      updateUsername: (username) => {
        const clean = sanitizeUsername(username);
        if (!clean) return;
        const updatedProfile: UserProfile = {
          ...get().profile,
          username: clean,
        };
        set({ profile: updatedProfile, usernameConflict: null });
        syncProfile(updatedProfile);
      },

      setCountry: (countryCode) => {
        const clean = countryCode.trim().toUpperCase().slice(0, 2) || null;
        const updatedProfile: UserProfile = {
          ...get().profile,
          country: clean,
        };
        set({ profile: updatedProfile, hasDismissedCountryPrompt: true });
        syncProfile(updatedProfile);
      },

      setAvatar: (avatarId) => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          avatarId,
        };
        set({ profile: updatedProfile });
        syncProfile(updatedProfile);
      },

      setLanguage: (language) => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          language,
        };
        set({ profile: updatedProfile });
        syncProfile(updatedProfile);
      },

      toggleTimer: () => {
        const updatedProfile: UserProfile = {
          ...get().profile,
          timerEnabled: !get().profile.timerEnabled,
        };
        set({ profile: updatedProfile });
        syncProfile(updatedProfile);
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
        syncProfile(updatedProfile);
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
          ...freshGuestState(),
          profile: {
            ...createInitialProfile(),
            id: currentId,
          },
        });
      },

      clearUsernameConflict: () => set({ usernameConflict: null }),

      signOut: async () => {
        await signOutUser();
        set(freshGuestState());
        await get().bootstrap();
      },

      deleteAccount: async () => {
        const res = await deleteOwnAccount();
        if (res.ok) {
          set(freshGuestState());
          await get().bootstrap();
        }
        return res;
      },
    }),
    {
      name: 'trivia-catolica-state-v1',
      storage,
      partialize: (state) => ({
        profile: state.profile,
        levelProgress: state.levelProgress,
        answeredCorrectByTopic: state.answeredCorrectByTopic,
        wrongQuestionIds: state.wrongQuestionIds,
        completedNewsIds: state.completedNewsIds,
        dailyCompletedDate: state.dailyCompletedDate,
        dailyQuizzesDate: state.dailyQuizzesDate,
        dailyQuizzesCount: state.dailyQuizzesCount,
        dailyVersusDate: state.dailyVersusDate,
        dailyVersusCount: state.dailyVersusCount,
        versusMatches: state.versusMatches,
        communities: state.communities,
        joinedCommunityIds: state.joinedCommunityIds,
        communityPostsByRoom: state.communityPostsByRoom,
        reports: state.reports,
        hasDismissedSoftAuth: state.hasDismissedSoftAuth,
        hasPromptedNotifications: state.hasPromptedNotifications,
        notificationsEnabled: state.notificationsEnabled,
      }),
      onRehydrateStorage: () => () => {
        useGameStore.setState({ isHydrated: true });
      },
    }
  )
);

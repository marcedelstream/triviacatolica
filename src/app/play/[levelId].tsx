import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  FlameIcon,
  HeartBreakIcon,
  HeartIcon,
  InfinityIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StarIcon,
  XIcon,
} from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AvatarBadge } from '@/components/AvatarBadge';
import { CloudBackdrop } from '@/components/CloudBackdrop';
import { DailyReadingsView } from '@/components/DailyReadingsView';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { QuestionCard } from '@/components/QuestionCard';
import { ScreenFrame } from '@/components/ScreenFrame';
import {
  DAILY_FREE_QUIZZES_LIMIT,
  FREE_PLAY_QUESTIONS_LIMIT,
  PAYWALL_ENABLED,
} from '@/constants/features';
import { LIENZO, getCategoryTheme } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { playGameCue } from '@/lib/gameFeedback';
import { getTodayDateKey } from '@/services/dailyChallengeService';
import {
  selectQuestionsForDailyChallenge,
  selectQuestionsForLevel,
} from '@/services/quizService';
import {
  completeOpponentVersusTurn,
  createVersusMatchRemote,
  fetchVersusMatchById,
} from '@/services/versusService';
import { useGameStore, type RoundCompletionResult } from '@/store/useGameStore';
import type { Question, VersusMatch } from '@/types/trivia';

const SECONDS_PER_QUESTION = 25;

const PRAISE_PHRASES = [
  '¡Excelente!',
  '¡Muy bien!',
  '¡Así se hace!',
  '¡Brillante!',
  '¡Respuesta perfecta!',
];

function hashSeed(input: string, baseSeed: number): number {
  let h = (baseSeed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 0x85ebca6b) >>> 0;
  }
  return h || 1;
}

function nextPrng(state: number): number {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Mezcla al azar el orden de las 4 opciones de cada pregunta para que cada jugador
 * y cada partida reciba posiciones distintas, remapeando `correctIndex`.
 */
function shuffleQuestionOptions(question: Question, sessionSeed: number): Question {
  const indexed = question.options.map((text, idx) => ({
    text,
    isCorrect: idx === question.correctIndex,
  }));
  let rng = hashSeed(question.id, sessionSeed);
  for (let i = indexed.length - 1; i > 0; i -= 1) {
    rng = (rng + 0x6d2b79f5) | 0;
    const j = Math.floor(nextPrng(rng) * (i + 1));
    const tmp = indexed[i];
    indexed[i] = indexed[j];
    indexed[j] = tmp;
  }
  const newCorrectIndex = indexed.findIndex((item) => item.isCorrect);
  return {
    ...question,
    options: [
      indexed[0].text,
      indexed[1].text,
      indexed[2].text,
      indexed[3].text,
    ],
    correctIndex: (newCorrectIndex >= 0 ? newCorrectIndex : 0) as 0 | 1 | 2 | 3,
  };
}

function pickRandomMixedQuestions(
  pool: Question[],
  count: number,
  sessionSeed: number
): Question[] {
  const copy = [...pool];
  let rng = hashSeed('mixed-pool', sessionSeed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    rng = (rng + 0x6d2b79f5) | 0;
    const j = Math.floor(nextPrng(rng) * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function createRandomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

export default function PlayScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const router = useRouter();

  const topics = useGameStore((s) => s.topics);
  const levels = useGameStore((s) => s.levels);
  const allQuestions = useGameStore((s) => s.questions);
  const dailyChallenge = useGameStore((s) => s.dailyChallenge);
  const vaticanNews = useGameStore((s) => s.vaticanNews);
  const wrongQuestionIds = useGameStore((s) => s.wrongQuestionIds);
  const dailyCompletedDate = useGameStore((s) => s.dailyCompletedDate);
  const versusMatches = useGameStore((s) => s.versusMatches);
  const leaderboardPeers = useGameStore((s) => s.leaderboardPeers);
  const profile = useGameStore((s) => s.profile);
  const consumeHeart = useGameStore((s) => s.consumeHeart);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);
  const completeRound = useGameStore((s) => s.completeRound);
  const submitQuestionReport = useGameStore((s) => s.submitQuestionReport);
  const setAvatar = useGameStore((s) => s.setAvatar);
  const upsertVersusMatch = useGameStore((s) => s.upsertVersusMatch);
  const getDailyQuizzesPlayedToday = useGameStore((s) => s.getDailyQuizzesPlayedToday);

  const [sessionSeed, setSessionSeed] = useState<number>(() => createRandomSeed());
  const [hasStartedDailyQuiz, setHasStartedDailyQuiz] = useState(false);
  const [loadedVersusMatch, setLoadedVersusMatch] = useState<VersusMatch | null>(null);
  const [versusLookupKey, setVersusLookupKey] = useState<string | null>(null);
  const [completedVersusMatch, setCompletedVersusMatch] = useState<VersusMatch | null>(null);

  const soundEnabled = profile.soundEnabled ?? true;

  const isDaily = levelId === 'daily' || levelId === 'desafio-del-dia';
  const isErrorReview = levelId === 'repaso-errores';
  const isFreePlay = levelId === 'jugar-libre';
  const isVersusResponse =
    typeof levelId === 'string' && levelId.startsWith('versus-match-');
  const versusMatchId = isVersusResponse ? levelId.replace(/^versus-match-/, '') : null;
  const isVersusNew =
    typeof levelId === 'string' && levelId.startsWith('versus-') && !isVersusResponse;
  const isVersus = isVersusNew || isVersusResponse;

  const localVersusMatch = useMemo(() => {
    if (versusMatchId) {
      return versusMatches.find((m) => m.id === versusMatchId) ?? null;
    }
    if (isVersusNew) {
      const targetUser = levelId.replace(/^versus-/, '').replace(/^@/, '').toLowerCase();
      return (
        versusMatches.find(
          (m) =>
            m.status === 'waiting_opponent' &&
            m.challengerId === profile.id &&
            m.opponentUsername.toLowerCase() === targetUser
        ) ?? null
      );
    }
    return null;
  }, [isVersusNew, levelId, profile.id, versusMatchId, versusMatches]);

  const activeVersusMatch = loadedVersusMatch ?? localVersusMatch;
  const isLoadingVersusMatch =
    Boolean(versusMatchId) && !activeVersusMatch && versusLookupKey !== versusMatchId;

  useEffect(() => {
    if (!versusMatchId || localVersusMatch) return;
    let active = true;
    void fetchVersusMatchById(versusMatchId).then((res) => {
      if (!active) return;
      if (res) setLoadedVersusMatch(res);
      setVersusLookupKey(versusMatchId);
    });
    return () => {
      active = false;
    };
  }, [localVersusMatch, versusMatchId]);

  const versusOpponent = isVersusNew
    ? levelId.replace(/^versus-/, '').replace(/^@/, '')
    : activeVersusMatch
      ? activeVersusMatch.challengerId === profile.id
        ? activeVersusMatch.opponentUsername
        : activeVersusMatch.challengerUsername
      : null;
  const isNewsQuiz =
    typeof levelId === 'string' &&
    (levelId.startsWith('news-') || levelId.startsWith('noticia-'));
  const newsQuizId = isNewsQuiz
    ? levelId.replace(/^(news-|noticia-)/, '')
    : null;

  const currentNewsItem = useMemo(
    () => (newsQuizId ? vaticanNews.find((n) => n.id === newsQuizId) ?? null : null),
    [newsQuizId, vaticanNews]
  );

  const currentLevel = useMemo(
    () =>
      isDaily || isNewsQuiz || isErrorReview || isFreePlay || isVersus
        ? null
        : levels.find((l) => l.slug === levelId || l.id === levelId) ?? levels[0],
    [isDaily, isErrorReview, isFreePlay, isNewsQuiz, isVersus, levelId, levels]
  );

  const shareableSlug = isDaily
    ? 'desafio-del-dia'
    : isFreePlay
      ? 'jugar-libre'
      : completedVersusMatch
        ? `versus-match-${completedVersusMatch.id}`
        : isVersus && versusOpponent
          ? `versus-${versusOpponent}`
          : currentNewsItem
            ? `noticia-${currentNewsItem.id}`
            : (currentLevel?.slug ?? 'desafio-del-dia');
  const shareUrl = `https://triviacatolica.com/play/${shareableSlug}`;

  const roundQuestions = useMemo(() => {
    let base: Question[];
    if (isErrorReview) {
      const wrongSet = new Set(wrongQuestionIds);
      const fromBank = allQuestions.filter((q) => wrongSet.has(q.id));
      base = (fromBank.length > 0 ? fromBank : allQuestions).slice(0, 5);
    } else if (isVersusResponse && activeVersusMatch && activeVersusMatch.questionIds.length > 0) {
      const byId = new Map(allQuestions.map((q) => [q.id, q]));
      const exact = activeVersusMatch.questionIds
        .map((id) => byId.get(id))
        .filter((q): q is Question => Boolean(q));
      base =
        exact.length > 0
          ? exact
          : pickRandomMixedQuestions(allQuestions, FREE_PLAY_QUESTIONS_LIMIT, sessionSeed);
    } else if (isFreePlay || isVersus) {
      base = pickRandomMixedQuestions(allQuestions, FREE_PLAY_QUESTIONS_LIMIT, sessionSeed);
    } else if (isNewsQuiz && currentNewsItem) {
      base = currentNewsItem.questions;
    } else if (isDaily) {
      base =
        dailyChallenge.questions.length > 0
          ? dailyChallenge.questions
          : selectQuestionsForDailyChallenge(allQuestions, 5);
    } else if (currentLevel) {
      base = selectQuestionsForLevel(allQuestions, currentLevel);
    } else {
      base = allQuestions.slice(0, 5);
    }
    return base.map((q) => shuffleQuestionOptions(q, sessionSeed));
  }, [
    activeVersusMatch,
    allQuestions,
    currentLevel,
    currentNewsItem,
    dailyChallenge.questions,
    isDaily,
    isErrorReview,
    isFreePlay,
    isNewsQuiz,
    isVersus,
    isVersusResponse,
    sessionSeed,
    wrongQuestionIds,
  ]);

  const handleSafeExit = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [equippedAvatarId, setEquippedAvatarId] = useState<string | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [lastXpGain, setLastXpGain] = useState(15);
  const [roundXpRunning, setRoundXpRunning] = useState(0);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [summary, setSummary] = useState<RoundCompletionResult | null>(null);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Animaciones suaves Lienzo (150-250ms)
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [xpPopAnim] = useState(() => new Animated.Value(0));
  const [starScale1] = useState(() => new Animated.Value(0.4));
  const [starScale2] = useState(() => new Animated.Value(0.4));
  const [starScale3] = useState(() => new Animated.Value(0.4));
  const starScales = useMemo(() => [starScale1, starScale2, starScale3], [starScale1, starScale2, starScale3]);

  const alreadyCompletedDailyToday =
    isDaily && dailyCompletedDate === getTodayDateKey() && !summary;
  const showingDailyReadingsIntro =
    isDaily && !alreadyCompletedDailyToday && !hasStartedDailyQuiz && !summary;

  const activeQuestion = roundQuestions[currentIndex];
  const topicForQuestion = topics.find(
    (t) => t.slug === activeQuestion?.topicSlug || t.id === activeQuestion?.topicId
  );
  const catTheme = getCategoryTheme(activeQuestion?.topicSlug ?? 'nuevo-testamento');

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const triggerXpPop = () => {
    xpPopAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpPopAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(550),
      Animated.timing(xpPopAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  // Animación de estrellas y contador de XP al terminar la partida
  useEffect(() => {
    if (!summary) return;

    playGameCue('celebrate', soundEnabled);

    starScales.forEach((anim, idx) => {
      anim.setValue(0.4);
      Animated.sequence([
        Animated.delay(idx * 140),
        Animated.spring(anim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    });

    let step = 0;
    const steps = 18;
    const target = summary.xpEarned;
    const id = setInterval(() => {
      step += 1;
      if (step >= steps) {
        setAnimatedXp(target);
        clearInterval(id);
      } else {
        setAnimatedXp(Math.round((target * step) / steps));
      }
    }, 30);

    return () => clearInterval(id);
  }, [soundEnabled, starScales, summary]);

  // Temporizador opcional (desactivado por defecto en ajustes pensando en adultos mayores)
  useEffect(() => {
    if (
      !profile.timerEnabled ||
      isRevealed ||
      summary ||
      outOfHearts ||
      alreadyCompletedDailyToday ||
      showingDailyReadingsIntro ||
      !activeQuestion
    ) {
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimedOut(true);
          setIsRevealed(true);
          setComboCount(0);
          setWrongIds((prevWrong) =>
            prevWrong.includes(activeQuestion.id) ? prevWrong : [...prevWrong, activeQuestion.id]
          );
          playGameCue('wrong', soundEnabled);
          triggerShake();
          const remaining = consumeHeart();
          if (remaining <= 0 && !useGameStore.getState().profile.isPremium) {
            setOutOfHearts(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    activeQuestion,
    alreadyCompletedDailyToday,
    consumeHeart,
    currentIndex,
    isRevealed,
    outOfHearts,
    profile.timerEnabled,
    showingDailyReadingsIntro,
    soundEnabled,
    summary,
    triggerShake,
  ]);

  const handleSelectOption = (idx: number) => {
    setSelectedIndex(idx);
    playGameCue('tap', soundEnabled);
  };

  const handleConfirmAnswer = () => {
    if (selectedIndex === null || !activeQuestion || isRevealed) return;
    setIsRevealed(true);
    setTimedOut(false);

    if (selectedIndex === activeQuestion.correctIndex) {
      const nextCombo = comboCount + 1;
      const gain = nextCombo >= 3 ? 20 : 15;
      setComboCount(nextCombo);
      setLastXpGain(gain);
      setRoundXpRunning((prev) => prev + gain);
      setCorrectIds((prev) => [...prev, activeQuestion.id]);
      playGameCue('correct', soundEnabled);
      triggerXpPop();
    } else {
      setComboCount(0);
      setWrongIds((prev) =>
        prev.includes(activeQuestion.id) ? prev : [...prev, activeQuestion.id]
      );
      playGameCue('wrong', soundEnabled);
      triggerShake();
      const remaining = consumeHeart();
      if (remaining <= 0 && !useGameStore.getState().profile.isPremium) {
        setOutOfHearts(true);
      }
    }
  };

  const handleNext = () => {
    playGameCue('tap', soundEnabled);
    if (currentIndex + 1 < roundQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsRevealed(false);
      setTimedOut(false);
      setSecondsLeft(SECONDS_PER_QUESTION);
      return;
    }

    const result = completeRound({
      levelId: isErrorReview
        ? 'error-review'
        : isFreePlay
          ? 'free-play'
          : isVersus
            ? 'versus'
            : isDaily
              ? 'daily'
              : (currentLevel?.id ?? `news-${newsQuizId ?? 'item'}`),
      topicSlug: currentLevel?.topicSlug ?? activeQuestion?.topicSlug ?? 'nuevo-testamento',
      newsQuizId: currentNewsItem?.id,
      correctCount: correctIds.length,
      totalQuestions: roundQuestions.length,
      correctQuestionIds: correctIds,
      wrongQuestionIds: wrongIds,
    });
    setAnimatedXp(0);
    setSummary(result);

    // Guardar o resolver el duelo Versus por turnos (estilo Preguntados, con empate incluido)
    if (isVersusNew && versusOpponent) {
      const peer = leaderboardPeers.find(
        (p) => p.username?.trim().toLowerCase() === versusOpponent.toLowerCase()
      );
      void createVersusMatchRemote({
        challengerId: profile.id,
        challengerUsername: profile.username || 'peregrino',
        challengerName: profile.displayName || 'Peregrino',
        opponentId: peer?.id ?? null,
        opponentUsername: versusOpponent.toLowerCase(),
        opponentName: peer?.displayName ?? `@${versusOpponent}`,
        questionIds: roundQuestions.map((q) => q.id),
        totalQuestions: roundQuestions.length,
        challengerScore: correctIds.length,
      }).then((saved) => {
        upsertVersusMatch(saved);
        setCompletedVersusMatch(saved);
      });
    } else if (isVersusResponse && activeVersusMatch && activeVersusMatch.status === 'waiting_opponent') {
      void completeOpponentVersusTurn({
        match: activeVersusMatch,
        opponentId: profile.id,
        opponentScore: correctIds.length,
      }).then((resolved) => {
        upsertVersusMatch(resolved);
        setCompletedVersusMatch(resolved);
      });
    }
  };

  const handleRetry = () => {
    if (isDaily) return;
    if (!profile.isPremium && profile.hearts <= 0) {
      if (PAYWALL_ENABLED) {
        router.push('/paywall?reason=hearts');
        return;
      }
      refillHeartsNow();
    }
    setSessionSeed(createRandomSeed());
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsRevealed(false);
    setTimedOut(false);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setCorrectIds([]);
    setWrongIds([]);
    setEquippedAvatarId(null);
    setComboCount(0);
    setRoundXpRunning(0);
    setOutOfHearts(false);
    setSummary(null);
  };

  if (isLoadingVersusMatch) {
    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <View style={styles.outContainer}>
          <ActivityIndicator color={LIENZO.color.primary} size="large" />
          <Text style={styles.summarySub}>Cargando duelo Versus…</Text>
        </View>
      </ScreenFrame>
    );
  }

  // Si ya jugaste tu turno en este duelo (o el duelo ya terminó), NO dejar volver a jugarlo
  const selfUsernameLower = profile.username?.trim().toLowerCase() ?? '';
  const isChallengerOfActive = Boolean(
    activeVersusMatch &&
      (activeVersusMatch.challengerId === profile.id ||
        (selfUsernameLower &&
          activeVersusMatch.challengerUsername.toLowerCase() === selfUsernameLower))
  );
  const versusAlreadyWaitingOnOpponent = Boolean(
    !summary &&
      isVersus &&
      activeVersusMatch &&
      activeVersusMatch.status === 'waiting_opponent' &&
      isChallengerOfActive
  );
  const versusAlreadyCompleted = Boolean(
    !summary && isVersus && activeVersusMatch && activeVersusMatch.status === 'completed'
  );

  if ((versusAlreadyWaitingOnOpponent || versusAlreadyCompleted) && activeVersusMatch) {
    const rivalName = isChallengerOfActive
      ? activeVersusMatch.opponentUsername
      : activeVersusMatch.challengerUsername;
    const myScore = isChallengerOfActive
      ? activeVersusMatch.challengerScore
      : (activeVersusMatch.opponentScore ?? 0);
    const rivalScore = isChallengerOfActive
      ? (activeVersusMatch.opponentScore ?? 0)
      : activeVersusMatch.challengerScore;
    const inviteUrl = `https://triviacatolica.com/play/versus-match-${activeVersusMatch.id}`;

    const resultTitle = versusAlreadyWaitingOnOpponent
      ? `Esperando a @${rivalName}`
      : activeVersusMatch.winner === 'tie'
        ? `Empate contra @${rivalName}`
        : (isChallengerOfActive && activeVersusMatch.winner === 'challenger') ||
            (!isChallengerOfActive && activeVersusMatch.winner === 'opponent')
          ? `¡Le ganaste a @${rivalName}!`
          : `Ganó @${rivalName}`;

    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <View style={styles.outContainer}>
          <View
            style={[
              styles.outIconBox,
              { backgroundColor: LIENZO.color.primarySoft },
            ]}
          >
            {versusAlreadyWaitingOnOpponent ? (
              <ClockIcon size={36} color={LIENZO.color.primaryInk} weight="duotone" />
            ) : (
              <CheckCircleIcon size={36} color={LIENZO.color.success} weight="duotone" />
            )}
          </View>
          <Text style={styles.summaryTitle}>{resultTitle}</Text>
          <Text style={styles.summarySub}>
            {versusAlreadyWaitingOnOpponent
              ? `Ya completaste tu turno con ${activeVersusMatch.challengerScore}/${activeVersusMatch.totalQuestions}. Estamos esperando que @${rivalName} juegue su turno con las mismas ${activeVersusMatch.totalQuestions} preguntas.`
              : `Este duelo ya finalizó con marcador ${myScore} – ${rivalScore}. Podés iniciar un nuevo desafío desde Modo Versus.`}
          </Text>

          <View style={styles.summaryActions}>
            <Pressable
              onPress={() => router.replace('/versus')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Ir a Modo Versus</Text>
            </Pressable>

            {versusAlreadyWaitingOnOpponent ? (
              <Pressable
                onPress={async () => {
                  const textOnly = `¡Te desafié en Trivia Católica! Hice ${activeVersusMatch.challengerScore}/${activeVersusMatch.totalQuestions}. Es tu turno de contestar las mismas preguntas:`;
                  const full = `${textOnly} ${inviteUrl}`;
                  if (Platform.OS === 'web') {
                    try {
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        await navigator.share({ title: 'Trivia Católica · Versus', text: textOnly, url: inviteUrl });
                        return;
                      }
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        await navigator.clipboard.writeText(full);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2400);
                        return;
                      }
                    } catch {
                      // fallback
                    }
                  }
                  await Share.share({ message: full });
                }}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <ShareNetworkIcon size={18} color={LIENZO.color.ink} weight="regular" />
                <Text style={styles.secondaryBtnText}>
                  {copiedLink ? '¡Enlace copiado!' : 'Reenviar enlace al rival'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScreenFrame>
    );
  }

  if (alreadyCompletedDailyToday) {
    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleSafeExit}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
          >
            <XIcon size={24} color={LIENZO.color.ink} weight="regular" />
          </Pressable>
          <Text style={styles.dailyHeaderTitle} numberOfLines={1}>
            Desafío del día
          </Text>
          <View style={styles.dailyHeaderSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.dailyIntroContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dailyDoneBanner}>
            <CheckCircleIcon size={28} color={LIENZO.color.success} weight="duotone" />
            <View style={styles.dailyDoneBannerBody}>
              <Text style={styles.dailyDoneTitle}>¡Ya completaste el Desafío de hoy!</Text>
              <Text style={styles.dailyDoneText}>
                El desafío diario se puede jugar una sola vez por día. Volvé mañana para nuevas
                lecturas y sumar más XP.
              </Text>
            </View>
          </View>

          <DailyReadingsView dailyChallenge={dailyChallenge} />
        </ScrollView>

        <View style={styles.dailyIntroFooter}>
          <Pressable
            onPress={handleSafeExit}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </ScreenFrame>
    );
  }

  if (showingDailyReadingsIntro) {
    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleSafeExit}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Salir de las lecturas"
          >
            <XIcon size={24} color={LIENZO.color.ink} weight="regular" />
          </Pressable>
          <Text style={styles.dailyHeaderTitle} numberOfLines={1}>
            Lecturas de hoy
          </Text>
          <View style={styles.dailyHeaderSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.dailyIntroContent}
          showsVerticalScrollIndicator={false}
        >
          <DailyReadingsView dailyChallenge={dailyChallenge} />
        </ScrollView>

        <View style={styles.dailyIntroFooter}>
          <Pressable
            onPress={() => {
              playGameCue('tap', soundEnabled);
              setSecondsLeft(SECONDS_PER_QUESTION);
              setHasStartedDailyQuiz(true);
            }}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>
              Ya leí · Comenzar desafío ({roundQuestions.length})
            </Text>
            <ArrowRightIcon size={20} color={LIENZO.color.onPrimary} weight="bold" />
          </Pressable>
        </View>
      </ScreenFrame>
    );
  }

  if (summary) {
    const versusOutcomeTitle =
      completedVersusMatch?.status === 'completed'
        ? completedVersusMatch.winner === 'tie'
          ? '¡Empate en el duelo!'
          : (completedVersusMatch.challengerId === profile.id &&
                completedVersusMatch.winner === 'challenger') ||
              (completedVersusMatch.challengerId !== profile.id &&
                completedVersusMatch.winner === 'opponent')
            ? '¡Ganaste el duelo Versus!'
            : `Ganó @${versusOpponent ?? 'tu rival'}`
        : isVersusNew && versusOpponent
          ? `¡Turno listo contra @${versusOpponent}!`
          : null;

    const congratsTitle =
      versusOutcomeTitle ??
      (summary.stars === 3
        ? '¡Felicitaciones, puntaje perfecto!'
        : summary.stars === 2
          ? '¡Muy buen trabajo!'
          : summary.stars === 1
            ? '¡Bien hecho, seguís sumando!'
            : 'Buen intento, seguí practicando');

    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.summaryContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.starsBigRow}>
            {[1, 2, 3].map((n, idx) => {
              const earned = summary.stars >= n;
              return (
                <Animated.View
                  key={n}
                  style={{ transform: [{ scale: starScales[idx] }] }}
                >
                  <StarIcon
                    size={46}
                    color={earned ? LIENZO.color.gold : LIENZO.color.line}
                    weight={earned ? 'duotone' : 'regular'}
                  />
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.summaryTitle}>{congratsTitle}</Text>

          <Text style={styles.summarySub}>
            {completedVersusMatch?.status === 'completed'
              ? `Marcador final: Vos ${
                  completedVersusMatch.challengerId === profile.id
                    ? completedVersusMatch.challengerScore
                    : (completedVersusMatch.opponentScore ?? correctIds.length)
                } – ${
                  completedVersusMatch.challengerId === profile.id
                    ? (completedVersusMatch.opponentScore ?? 0)
                    : completedVersusMatch.challengerScore
                } @${versusOpponent ?? 'rival'}.`
              : isVersusNew && versusOpponent
                ? `Hiciste ${correctIds.length} de ${roundQuestions.length}. Ahora es el turno de @${versusOpponent} con las mismas 5 preguntas.`
                : `Respondiste bien ${correctIds.length} de ${roundQuestions.length} preguntas${
                    isErrorReview
                      ? ' en tu Repaso de errores.'
                      : isFreePlay
                        ? ' en Juego libre (5 al azar).'
                        : currentNewsItem
                          ? ` sobre "${currentNewsItem.title}".`
                          : isDaily
                            ? ' del Desafío del día.'
                            : ` en ${currentLevel?.title ?? 'este nivel'}.`
                  }`}
          </Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatCard}>
              <SparkleIcon size={24} color={LIENZO.color.primary} weight="duotone" />
              <Text style={styles.summaryStatValue}>+{animatedXp} XP</Text>
              <Text style={styles.summaryStatLabel}>Sumados</Text>
            </View>
            <View style={styles.summaryStatCard}>
              <FlameIcon size={24} color={LIENZO.color.gold} weight="duotone" />
              <Text style={styles.summaryStatValue}>
                {summary.streakCount === 1 ? '1 día' : `${summary.streakCount} días`}
              </Text>
              <Text style={styles.summaryStatLabel}>Racha</Text>
            </View>
          </View>

          {summary.streakShieldActivated ? (
            <View style={styles.shieldBanner}>
              <ShieldCheckIcon size={22} color={LIENZO.color.success} weight="duotone" />
              <Text style={styles.shieldBannerText}>
                Tu Protector de Racha Pro salvó tu racha esta semana.
              </Text>
            </View>
          ) : null}

          {summary.newlyUnlockedAvatars.length > 0 ? (
            <View style={styles.avatarUnlockCard}>
              <AvatarBadge
                avatarId={summary.newlyUnlockedAvatars[0].id}
                size={60}
                highlight
              />
              <View style={styles.authPromptBody}>
                <Text style={styles.avatarUnlockTag}>¡Nuevo personaje desbloqueado!</Text>
                <Text style={styles.avatarUnlockTitle}>
                  {summary.newlyUnlockedAvatars[0].name}
                </Text>
                <Text style={styles.authPromptText}>
                  {summary.newlyUnlockedAvatars[0].subtitle}. Ya podés usarlo como tu foto de
                  perfil.
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  const unlocked = summary.newlyUnlockedAvatars[0];
                  setAvatar(unlocked.id);
                  setEquippedAvatarId(unlocked.id);
                }}
                style={styles.authPromptBtn}
                accessibilityRole="button"
              >
                <Text style={styles.authPromptBtnText}>
                  {equippedAvatarId === summary.newlyUnlockedAvatars[0].id
                    ? '¡Equipado!'
                    : 'Usar como foto de perfil'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {summary.shouldPromptAuth ? (
            <View style={styles.authPromptCard}>
              <ShieldCheckIcon size={26} color={LIENZO.color.primary} weight="duotone" />
              <View style={styles.authPromptBody}>
                <Text style={styles.authPromptTitle}>¡Completaste tu quiz de prueba!</Text>
                <Text style={styles.authPromptText}>
                  Creá tu cuenta gratis o iniciá sesión para seguir jugando, guardar tus XP y entrar
                  al Ranking.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/auth-modal?reason=guest_limit')}
                style={styles.authPromptBtn}
                accessibilityRole="button"
              >
                <Text style={styles.authPromptBtnText}>Crear cuenta / Iniciar sesión</Text>
              </Pressable>
            </View>
          ) : PAYWALL_ENABLED && !profile.isAnonymous && !profile.isPremium ? (
            <View style={styles.proUpsellCard}>
              <View style={styles.proUpsellHead}>
                <CrownIcon size={22} color={LIENZO.color.goldInk} weight="duotone" />
                <Text style={styles.proUpsellTitle}>
                  {Math.max(0, DAILY_FREE_QUIZZES_LIMIT - getDailyQuizzesPlayedToday()) === 0
                    ? 'Completaste tus 3 quizzes gratuitos de hoy'
                    : `Te quedan ${Math.max(0, DAILY_FREE_QUIZZES_LIMIT - getDailyQuizzesPlayedToday())} quizzes gratis hoy`}
                </Text>
              </View>
              <Text style={styles.authPromptText}>
                Con Trivia Católica Pro jugás sin límite diario, sumás XP más rápido y desbloqueás
                todos los personajes antes.
              </Text>
              <Pressable
                onPress={() => router.push('/paywall?reason=daily_limit')}
                style={styles.proUpsellBtn}
                accessibilityRole="button"
              >
                <Text style={styles.proUpsellBtnText}>Ver Plan Pro</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.summaryActions}>
            <Pressable
              onPress={async () => {
                const shareTextOnly =
                  isVersus && versusOpponent
                    ? `¡Desafío Versus en Trivia Católica! Hice ${correctIds.length}/${roundQuestions.length} contra @${versusOpponent}. ¿Podés superarme?`
                    : `Respondí ${correctIds.length}/${roundQuestions.length} en Trivia Católica (${
                        isFreePlay
                          ? 'Juego libre'
                          : currentNewsItem?.title ?? currentLevel?.title ?? dailyChallenge.title
                      }). ¡Probalo acá!`;
                const shareMessage = `${shareTextOnly} ${shareUrl}`;

                if (Platform.OS === 'web') {
                  try {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      await navigator.share({
                        title: 'Trivia Católica',
                        text: shareTextOnly,
                        url: shareUrl,
                      });
                      return;
                    }
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      await navigator.clipboard.writeText(shareMessage);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2600);
                      return;
                    }
                  } catch {
                    // fallback below
                  }
                }
                // Evita link duplicado en iOS/Android al incluir la URL una sola vez en `message`
                await Share.share({ message: shareMessage });
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <ShareNetworkIcon size={20} color={LIENZO.color.onPrimary} weight="duotone" />
              <Text style={styles.primaryBtnText}>
                {copiedLink ? '¡Enlace copiado!' : 'Compartir mi resultado'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSafeExit}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>
                {isDaily || isNewsQuiz || isFreePlay || isVersus || !router.canGoBack()
                  ? 'Volver al inicio'
                  : 'Volver a la categoría'}
              </Text>
            </Pressable>

            {currentNewsItem?.url ? (
              <Pressable
                onPress={() => void Linking.openURL(currentNewsItem.url)}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="link"
              >
                <ArrowSquareOutIcon size={20} color={LIENZO.color.ink} weight="regular" />
                <Text style={styles.secondaryBtnText}>
                  Leer nota en {currentNewsItem.sourceName}
                </Text>
              </Pressable>
            ) : null}

            {!isDaily && !isVersus && correctIds.length < roundQuestions.length ? (
              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Intentar de nuevo</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </ScreenFrame>
    );
  }

  if (outOfHearts) {
    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <View style={styles.outContainer}>
          <View style={styles.outIconBox}>
            <HeartBreakIcon size={40} color={LIENZO.color.danger} weight="duotone" />
          </View>
          <Text style={styles.summaryTitle}>Te quedaste sin vidas</Text>
          <Text style={styles.summarySub}>
            {PAYWALL_ENABLED
              ? 'Tus vidas gratuitas se recargan solas cada 30 minutos, o podés pasar al plan Pro para jugar con vidas infinitas.'
              : 'Podés recuperar tus 3 vidas gratis ahora mismo para seguir aprendiendo sin pausas.'}
          </Text>

          <View style={styles.summaryActions}>
            {PAYWALL_ENABLED ? (
              <Pressable
                onPress={() => router.replace('/paywall?reason=hearts')}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Ver vidas infinitas (Pro)</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  refillHeartsNow();
                  setOutOfHearts(false);
                }}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Recuperar 3 vidas y seguir</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleSafeExit}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Volver</Text>
            </Pressable>
          </View>
        </View>
      </ScreenFrame>
    );
  }

  if (!activeQuestion) {
    return null;
  }

  const progressPct = Math.round(
    ((currentIndex + (isRevealed ? 1 : 0)) / roundQuestions.length) * 100
  );
  const isCorrect = !timedOut && selectedIndex === activeQuestion.correctIndex;
  const praiseLabel =
    comboCount >= 3
      ? `¡Imparable! ${comboCount} seguidas`
      : PRAISE_PHRASES[currentIndex % PRAISE_PHRASES.length];

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <CloudBackdrop />

      {/* Barra superior de la pregunta */}
      <View style={styles.header}>
        <Pressable
          onPress={handleSafeExit}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Salir de la partida"
        >
          <XIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%`, backgroundColor: catTheme.color },
              ]}
            />
          </View>
          <View style={styles.progressMetaRow}>
            <Text style={styles.progressText}>
              Pregunta {currentIndex + 1} de {roundQuestions.length}
            </Text>
            {roundXpRunning > 0 ? (
              <Text style={styles.runningXpText}>+{roundXpRunning} XP</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightMeta}>
          {comboCount >= 2 ? (
            <View style={styles.comboChip}>
              <FlameIcon size={15} color={LIENZO.color.gold} weight="duotone" />
              <Text style={styles.comboText}>x{comboCount}</Text>
            </View>
          ) : null}

          {profile.timerEnabled ? (
            <View
              style={[
                styles.timerChip,
                secondsLeft <= 5 && { backgroundColor: LIENZO.color.dangerSoft },
              ]}
            >
              <ClockIcon
                size={16}
                color={secondsLeft <= 5 ? LIENZO.color.danger : LIENZO.color.ink2}
                weight="regular"
              />
              <Text
                style={[
                  styles.timerText,
                  secondsLeft <= 5 && { color: LIENZO.color.danger },
                ]}
              >
                {secondsLeft}s
              </Text>
            </View>
          ) : null}

          <View style={styles.heartsChip}>
            <HeartIcon size={18} color={LIENZO.color.danger} weight="duotone" />
            {profile.isPremium ? (
              <InfinityIcon size={16} color={LIENZO.color.danger} weight="regular" />
            ) : (
              <Text style={styles.heartsText}>
                {profile.hearts}/{MAX_HEARTS}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Pill flotante +XP al acertar */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingXp,
          {
            opacity: xpPopAnim,
            transform: [
              {
                translateY: xpPopAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, -6],
                }),
              },
            ],
          },
        ]}
      >
        <SparkleIcon size={16} color={LIENZO.color.gold} weight="duotone" />
        <Text style={styles.floatingXpText}>+{lastXpGain} XP</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <QuestionCard
            question={activeQuestion}
            categoryTitle={
              isErrorReview
                ? 'Repaso de errores'
                : isFreePlay
                  ? `Juego libre · ${topicForQuestion?.title ?? 'Mixto'}`
                  : isVersus && versusOpponent
                    ? `Versus vs @${versusOpponent} · ${topicForQuestion?.title ?? 'Mixto'}`
                    : currentNewsItem
                      ? `${currentNewsItem.sourceName} · ${currentNewsItem.sectionLabel}`
                      : isDaily
                        ? `${dailyChallenge.sourceLabel}${
                            dailyChallenge.gospelRef ? ` · ${dailyChallenge.gospelRef}` : ''
                          }`
                        : (topicForQuestion?.title ?? 'Trivia')
            }
            selectedIndex={selectedIndex}
            isRevealed={isRevealed}
            onSelectOption={handleSelectOption}
          />
        </Animated.View>

        {!isRevealed ? (
          <Pressable
            onPress={handleConfirmAnswer}
            disabled={selectedIndex === null}
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedIndex === null }}
            style={({ pressed }) => [
              styles.confirmBtn,
              selectedIndex === null && styles.confirmBtnDisabled,
              pressed && selectedIndex !== null && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.confirmBtnText,
                selectedIndex === null && { color: LIENZO.color.ink2 },
              ]}
            >
              Confirmar respuesta
            </Text>
          </Pressable>
        ) : (
          <FeedbackSheet
            question={activeQuestion}
            isCorrect={isCorrect}
            timedOut={timedOut}
            praiseLabel={praiseLabel}
            xpGain={lastXpGain}
            isLastQuestion={currentIndex + 1 >= roundQuestions.length}
            onNext={handleNext}
            onReport={(reason) => submitQuestionReport(activeQuestion.id, reason)}
          />
        )}
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.md,
    paddingTop: 14,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  progressWrap: {
    flex: 1,
    gap: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: LIENZO.color.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  runningXpText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comboChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: LIENZO.radius.chip,
    backgroundColor: LIENZO.color.goldSoft,
  },
  comboText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: LIENZO.radius.chip,
    backgroundColor: LIENZO.color.track,
  },
  timerText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  heartsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: LIENZO.radius.chip,
    backgroundColor: LIENZO.color.dangerSoft,
  },
  heartsText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.danger,
  },
  floatingXp: {
    position: 'absolute',
    top: 76,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.goldSoft,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.gold,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  floatingXpText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 24,
    paddingBottom: 28,
  },
  confirmBtn: {
    marginTop: 18,
    width: '100%',
    minHeight: 52,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  confirmBtnDisabled: {
    backgroundColor: LIENZO.color.track,
  },
  confirmBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
  summaryContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.xxl,
    paddingBottom: LIENZO.space.xxxl,
    alignItems: 'center',
    gap: LIENZO.space.md,
  },
  starsBigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    marginBottom: LIENZO.space.xs,
  },
  summaryTitle: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  summarySub: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: LIENZO.space.md,
    width: '100%',
    marginTop: LIENZO.space.sm,
  },
  summaryStatCard: {
    flex: 1,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.lg,
    alignItems: 'center',
    gap: 4,
  },
  summaryStatValue: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
    marginTop: 4,
  },
  summaryStatLabel: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  authPromptCard: {
    width: '100%',
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.primarySoft,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.sm,
    marginTop: LIENZO.space.sm,
  },
  authPromptBody: {
    gap: 2,
  },
  authPromptTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.primaryInk,
  },
  authPromptText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  authPromptBtn: {
    alignSelf: 'flex-start',
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: LIENZO.space.xs,
  },
  authPromptBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.primaryInk,
  },
  shieldBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.icon,
    padding: LIENZO.space.md,
  },
  shieldBannerText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.successInk,
    flex: 1,
  },
  avatarUnlockCard: {
    width: '100%',
    backgroundColor: LIENZO.color.goldSoft,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.gold,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.sm,
    alignItems: 'flex-start',
  },
  avatarUnlockTag: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  avatarUnlockTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  proUpsellCard: {
    width: '100%',
    backgroundColor: LIENZO.color.goldSoft,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.gold,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.sm,
  },
  proUpsellHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proUpsellTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.goldInk,
    flex: 1,
  },
  proUpsellBtn: {
    alignSelf: 'flex-start',
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  proUpsellBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.goldInk,
  },
  summaryActions: {
    width: '100%',
    gap: LIENZO.space.sm,
    marginTop: LIENZO.space.lg,
  },
  primaryBtn: {
    width: '100%',
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.lg,
  },
  primaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  secondaryBtn: {
    width: '100%',
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.lg,
  },
  secondaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.ink,
  },
  outContainer: {
    flex: 1,
    paddingHorizontal: LIENZO.space.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: LIENZO.space.md,
  },
  outIconBox: {
    width: 76,
    height: 76,
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyHeaderTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    flex: 1,
    textAlign: 'center',
  },
  dailyHeaderSpacer: {
    width: 44,
  },
  dailyIntroContent: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.lg,
    paddingBottom: LIENZO.space.xxl,
    gap: LIENZO.space.lg,
  },
  dailyIntroFooter: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: LIENZO.borderWidth.hairline,
    borderTopColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
  },
  dailyDoneBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: LIENZO.color.successSoft,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.success,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.md,
  },
  dailyDoneBannerBody: {
    flex: 1,
    gap: 2,
  },
  dailyDoneTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.successInk,
  },
  dailyDoneText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
});

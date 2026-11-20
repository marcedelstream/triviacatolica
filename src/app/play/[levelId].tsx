import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowSquareOutIcon,
  ClockIcon,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { FeedbackSheet } from '@/components/FeedbackSheet';
import { QuestionCard } from '@/components/QuestionCard';
import { ScreenFrame } from '@/components/ScreenFrame';
import { PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO, getCategoryTheme } from '@/constants/theme';
import { DAILY_CHALLENGE, MAX_HEARTS } from '@/data/localSeed';
import { playGameCue } from '@/lib/gameFeedback';
import {
  selectQuestionsForDailyChallenge,
  selectQuestionsForLevel,
} from '@/services/quizService';
import { useGameStore, type RoundCompletionResult } from '@/store/useGameStore';

const SECONDS_PER_QUESTION = 25;

const PRAISE_PHRASES = [
  '¡Excelente!',
  '¡Muy bien!',
  '¡Así se hace!',
  '¡Brillante!',
  '¡Respuesta perfecta!',
];

export default function PlayScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const router = useRouter();

  const topics = useGameStore((s) => s.topics);
  const levels = useGameStore((s) => s.levels);
  const allQuestions = useGameStore((s) => s.questions);
  const vaticanNews = useGameStore((s) => s.vaticanNews);
  const profile = useGameStore((s) => s.profile);
  const consumeHeart = useGameStore((s) => s.consumeHeart);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);
  const completeRound = useGameStore((s) => s.completeRound);
  const submitQuestionReport = useGameStore((s) => s.submitQuestionReport);

  const soundEnabled = profile.soundEnabled ?? true;

  const isDaily = levelId === 'daily' || levelId === 'desafio-del-dia';
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
      isDaily || isNewsQuiz
        ? null
        : levels.find((l) => l.slug === levelId || l.id === levelId) ?? levels[0],
    [isDaily, isNewsQuiz, levelId, levels]
  );

  const shareableSlug = isDaily
    ? 'desafio-del-dia'
    : currentNewsItem
      ? `noticia-${currentNewsItem.id}`
      : (currentLevel?.slug ?? 'desafio-del-dia');
  const shareUrl = `https://triviacatolica.com/play/${shareableSlug}`;

  const roundQuestions = useMemo(() => {
    if (isNewsQuiz && currentNewsItem) {
      return currentNewsItem.questions;
    }
    if (isDaily) {
      return selectQuestionsForDailyChallenge(allQuestions, DAILY_CHALLENGE.questionCount);
    }
    if (currentLevel) {
      return selectQuestionsForLevel(allQuestions, currentLevel);
    }
    return allQuestions.slice(0, 5);
  }, [allQuestions, currentLevel, currentNewsItem, isDaily, isNewsQuiz]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [lastXpGain, setLastXpGain] = useState(15);
  const [roundXpRunning, setRoundXpRunning] = useState(0);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [summary, setSummary] = useState<RoundCompletionResult | null>(null);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Animaciones suaves Lienzo (150-250ms)
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const xpPopAnim = useRef(new Animated.Value(0)).current;
  const starScale1 = useRef(new Animated.Value(0.4)).current;
  const starScale2 = useRef(new Animated.Value(0.4)).current;
  const starScale3 = useRef(new Animated.Value(0.4)).current;
  const starScales = useMemo(() => [starScale1, starScale2, starScale3], [starScale1, starScale2, starScale3]);

  const activeQuestion = roundQuestions[currentIndex];
  const topicForQuestion = topics.find(
    (t) => t.slug === activeQuestion?.topicSlug || t.id === activeQuestion?.topicId
  );
  const catTheme = getCategoryTheme(activeQuestion?.topicSlug ?? 'nuevo-testamento');

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

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
    setAnimatedXp(0);
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
    if (!profile.timerEnabled || isRevealed || summary || outOfHearts || !activeQuestion) {
      return;
    }
    setSecondsLeft(SECONDS_PER_QUESTION);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimedOut(true);
          setIsRevealed(true);
          setComboCount(0);
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
  }, [activeQuestion, consumeHeart, currentIndex, isRevealed, outOfHearts, profile.timerEnabled, soundEnabled, summary]);

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
      return;
    }

    const result = completeRound({
      levelId: isDaily ? 'daily' : (currentLevel?.id ?? `news-${newsQuizId ?? 'item'}`),
      topicSlug: currentLevel?.topicSlug ?? activeQuestion?.topicSlug ?? 'nuevo-testamento',
      newsQuizId: currentNewsItem?.id,
      correctCount: correctIds.length,
      totalQuestions: roundQuestions.length,
      correctQuestionIds: correctIds,
    });
    setSummary(result);
  };

  const handleRetry = () => {
    if (!profile.isPremium && profile.hearts <= 0) {
      if (PAYWALL_ENABLED) {
        router.push('/paywall?reason=hearts');
        return;
      }
      refillHeartsNow();
    }
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsRevealed(false);
    setTimedOut(false);
    setCorrectIds([]);
    setComboCount(0);
    setRoundXpRunning(0);
    setOutOfHearts(false);
    setSummary(null);
  };

  if (summary) {
    const congratsTitle =
      summary.stars === 3
        ? '¡Felicitaciones, puntaje perfecto!'
        : summary.stars === 2
          ? '¡Muy buen trabajo!'
          : summary.stars === 1
            ? '¡Bien hecho, seguís sumando!'
            : 'Buen intento, seguí practicando';

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
            Respondiste bien {correctIds.length} de {roundQuestions.length} preguntas
            {currentNewsItem
              ? ` sobre "${currentNewsItem.title}".`
              : isDaily
                ? ' del Desafío del día.'
                : ` en ${currentLevel?.title ?? 'este nivel'}.`}
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

          {summary.shouldPromptAuth ? (
            <View style={styles.authPromptCard}>
              <ShieldCheckIcon size={26} color={LIENZO.color.primary} weight="duotone" />
              <View style={styles.authPromptBody}>
                <Text style={styles.authPromptTitle}>Guardá tu racha y tu progreso</Text>
                <Text style={styles.authPromptText}>
                  Ya completaste varias partidas. Vinculá Google o Apple para no perder tus puntos.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/auth-modal')}
                style={styles.authPromptBtn}
                accessibilityRole="button"
              >
                <Text style={styles.authPromptBtnText}>Guardar cuenta</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.summaryActions}>
            <Pressable
              onPress={async () => {
                const shareMessage = `Respondí ${correctIds.length}/${roundQuestions.length} en Trivia Católica (${
                  currentNewsItem?.title ?? currentLevel?.title ?? DAILY_CHALLENGE.title
                }). ¡Probalo acá! ${shareUrl}`;

                if (Platform.OS === 'web') {
                  try {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      await navigator.share({
                        title: 'Trivia Católica',
                        text: shareMessage,
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
                await Share.share({ message: shareMessage, url: shareUrl });
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
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>
                {isDaily || isNewsQuiz ? 'Volver al inicio' : 'Volver a la categoría'}
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

            {correctIds.length < roundQuestions.length ? (
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
              onPress={() => router.back()}
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
      {/* Barra superior de la pregunta */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
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
              currentNewsItem
                ? `${currentNewsItem.sourceName} · ${currentNewsItem.sectionLabel}`
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
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
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
});

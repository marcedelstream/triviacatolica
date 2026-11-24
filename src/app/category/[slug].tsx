import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftIcon, HeartIcon, InfinityIcon, LockIcon, XIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { LevelNode } from '@/components/LevelNode';
import { ScreenFrame } from '@/components/ScreenFrame';
import { PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO, getCategoryTheme } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { useGameStore } from '@/store/useGameStore';
import type { Level } from '@/types/trivia';

export default function CategoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const topics = useGameStore((s) => s.topics);
  const levels = useGameStore((s) => s.levels);
  const questions = useGameStore((s) => s.questions);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const answeredCorrectByTopic = useGameStore((s) => s.answeredCorrectByTopic);
  const profile = useGameStore((s) => s.profile);
  const refreshHearts = useGameStore((s) => s.refreshHearts);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);
  const canStartQuiz = useGameStore((s) => s.canStartQuiz);

  const [lockedModal, setLockedModal] = useState<{
    target: Level;
    previous: Level | null;
  } | null>(null);

  const topic = useMemo(
    () => topics.find((t) => t.slug === slug) ?? topics[0],
    [slug, topics]
  );

  const topicLevels = useMemo(
    () =>
      levels
        .filter((l) => l.topicSlug === topic?.slug || l.topicId === topic?.id)
        .sort((a, b) => a.levelNumber - b.levelNumber),
    [levels, topic]
  );

  if (!topic) {
    return null;
  }

  const theme = getCategoryTheme(topic.slug);
  const totalQuestions = Math.max(
    questions.filter((q) => q.topicId === topic.id || q.topicSlug === topic.slug).length,
    1
  );
  const completedQuestions = (answeredCorrectByTopic[topic.slug] ?? []).length;
  const pct = Math.min(100, Math.round((completedQuestions / totalQuestions) * 100));

  const nextRecommendedId =
    topicLevels.find((lvl) => {
      const done = Boolean(levelProgress[lvl.id]?.stars);
      return !done && (!PAYWALL_ENABLED || !lvl.isPremium || profile.isPremium);
    })?.id ?? topicLevels[0]?.id;

  const launchLevel = (level: Level) => {
    const gate = canStartQuiz();
    if (gate === 'guest_limit') {
      router.push({
        pathname: '/auth-modal',
        params: { reason: 'guest_limit', nextLevelId: level.slug },
      });
      return;
    }
    if (gate === 'daily_limit') {
      router.push('/paywall?reason=daily_limit');
      return;
    }

    refreshHearts();
    const currentProfile = useGameStore.getState().profile;

    if (!currentProfile.isPremium && currentProfile.hearts <= 0) {
      if (PAYWALL_ENABLED) {
        router.push('/paywall?reason=hearts');
        return;
      }
      refillHeartsNow();
    }

    router.push({
      pathname: '/play/[levelId]',
      params: { levelId: level.slug },
    });
  };

  const handleOpenLevel = (
    level: Level,
    isLockedByOrder: boolean,
    prevLevel: Level | null
  ) => {
    refreshHearts();
    const currentProfile = useGameStore.getState().profile;

    if (PAYWALL_ENABLED && level.isPremium && !currentProfile.isPremium) {
      router.push('/paywall?reason=level');
      return;
    }

    if (isLockedByOrder) {
      setLockedModal({ target: level, previous: prevLevel });
      return;
    }

    launchLevel(level);
  };

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ArrowLeftIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>

        <Text style={styles.topTitle} numberOfLines={1}>
          {topic.title}
        </Text>

        <Pressable
          onPress={() => {
            if (PAYWALL_ENABLED) {
              router.push('/paywall?reason=hearts');
            } else if (profile.hearts < MAX_HEARTS) {
              refillHeartsNow();
            }
          }}
          style={styles.heartsPill}
          accessibilityRole="button"
          accessibilityLabel={
            profile.isPremium
              ? 'Vidas infinitas'
              : `${profile.hearts} de ${MAX_HEARTS} vidas`
          }
        >
          <HeartIcon size={18} color={LIENZO.color.danger} weight="duotone" />
          {profile.isPremium ? (
            <InfinityIcon size={18} color={LIENZO.color.danger} weight="regular" />
          ) : (
            <Text style={styles.heartsText}>
              {profile.hearts}/{MAX_HEARTS}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera de categoría */}
        <View style={[styles.hero, { backgroundColor: theme.soft }]}>
          <View style={styles.heroIcon}>
            <CategoryIcon name={topic.icon} color={theme.color} size={30} />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>{topic.title}</Text>
            <Text style={styles.heroDesc}>{topic.description}</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pct}%`, backgroundColor: theme.color },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: theme.color }]}>
                {completedQuestions}/{totalQuestions}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Camino de niveles</Text>

        <View style={styles.path}>
          {topicLevels.map((level, index) => {
            const prevLevel = index > 0 ? topicLevels[index - 1] : null;
            const prevCompleted = prevLevel
              ? Boolean(levelProgress[prevLevel.id]?.stars)
              : true;
            const isLockedByPremium =
              PAYWALL_ENABLED && level.isPremium && !profile.isPremium;
            const isLockedByOrder = index > 0 && !prevCompleted && !isLockedByPremium;

            return (
              <View key={level.id} style={styles.nodeWrapper}>
                {index > 0 ? (
                  <View
                    style={[
                      styles.connector,
                      {
                        backgroundColor: prevCompleted
                          ? theme.color
                          : LIENZO.color.line,
                      },
                    ]}
                  />
                ) : null}

                <LevelNode
                  level={level}
                  progress={levelProgress[level.id]}
                  isLockedByOrder={isLockedByOrder}
                  isLockedByPremium={isLockedByPremium}
                  isNextRecommended={level.id === nextRecommendedId}
                  onPress={() => handleOpenLevel(level, isLockedByOrder, prevLevel)}
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.hint}>
          Completá un nivel con al menos 1 estrella para desbloquear el siguiente.
        </Text>
      </ScrollView>

      {/* Popup amable al tocar un nivel bloqueado */}
      <Modal
        visible={Boolean(lockedModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModal(null)}
      >
        {lockedModal ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalTop}>
                <View style={styles.lockIconBox}>
                  <LockIcon size={28} color={LIENZO.color.primaryInk} weight="duotone" />
                </View>
                <Pressable
                  onPress={() => setLockedModal(null)}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar aviso"
                >
                  <XIcon size={22} color={LIENZO.color.ink} weight="regular" />
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>
                Nivel {lockedModal.target.levelNumber} bloqueado
              </Text>
              <Text style={styles.modalText}>
                Para desbloquear «{lockedModal.target.title}», primero tenés que completar el{' '}
                {lockedModal.previous
                  ? `Nivel ${lockedModal.previous.levelNumber} («${lockedModal.previous.title}»)`
                  : 'nivel anterior'}{' '}
                con al menos 1 estrella.
              </Text>

              {lockedModal.previous &&
              (lockedModal.previous.levelNumber === 1 ||
                Boolean(
                  levelProgress[
                    topicLevels[lockedModal.previous.levelNumber - 2]?.id ?? ''
                  ]?.stars
                )) ? (
                <Pressable
                  onPress={() => {
                    const prev = lockedModal.previous!;
                    setLockedModal(null);
                    launchLevel(prev);
                  }}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>
                    Jugar Nivel {lockedModal.previous.levelNumber} ahora
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setLockedModal(null)}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Entendido</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.md,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  backBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  topTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    flex: 1,
    textAlign: 'center',
  },
  heartsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.dangerSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
  },
  heartsText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.danger,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.xl,
    paddingBottom: LIENZO.space.xxxl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.ms,
    borderRadius: LIENZO.radius.block,
    padding: LIENZO.space.lg,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  heroTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  heroDesc: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: LIENZO.color.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    ...LIENZO.type.captionBold,
  },
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    marginTop: LIENZO.space.xxl,
    marginBottom: LIENZO.space.md,
  },
  path: {
    gap: 0,
  },
  nodeWrapper: {
    alignItems: 'stretch',
  },
  connector: {
    width: 2,
    height: 18,
    marginLeft: 37,
  },
  hint: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: LIENZO.space.lg,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LIENZO.space.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.block,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.xl,
    gap: LIENZO.space.md,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockIconBox: {
    width: 52,
    height: 52,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  modalText: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  primaryBtn: {
    width: '100%',
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.lg,
  },
  secondaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.ink,
  },
  pressed: {
    opacity: 0.9,
  },
});

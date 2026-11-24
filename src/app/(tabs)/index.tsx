import { useRouter } from 'expo-router';
import { FlameIcon, HeartIcon, InfinityIcon } from 'phosphor-react-native';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryGridCard } from '@/components/CategoryGridCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { VaticanNewsSection } from '@/components/VaticanNewsSection';
import { PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { useGameStore } from '@/store/useGameStore';
import type { VaticanNewsQuizItem } from '@/types/trivia';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const topics = useGameStore((s) => s.topics);
  const questions = useGameStore((s) => s.questions);
  const banners = useGameStore((s) => s.banners);
  const dailyChallenge = useGameStore((s) => s.dailyChallenge);
  const vaticanNews = useGameStore((s) => s.vaticanNews);
  const completedNewsIds = useGameStore((s) => s.completedNewsIds);
  const profile = useGameStore((s) => s.profile);
  const answeredCorrectByTopic = useGameStore((s) => s.answeredCorrectByTopic);
  const dailyCompletedDate = useGameStore((s) => s.dailyCompletedDate);
  const refreshHearts = useGameStore((s) => s.refreshHearts);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);
  const refreshDailyChallengeIfNeeded = useGameStore((s) => s.refreshDailyChallengeIfNeeded);

  useEffect(() => {
    refreshHearts();
    void refreshDailyChallengeIfNeeded();
  }, [refreshDailyChallengeIfNeeded, refreshHearts]);

  const dailyReadingsLabel = [
    dailyChallenge.firstReadingRef ? `Lectura: ${dailyChallenge.firstReadingRef}` : null,
    dailyChallenge.gospelRef ? `Evangelio: ${dailyChallenge.gospelRef}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const completedDailyToday = dailyCompletedDate === getTodayKey();
  const streakLabel =
    profile.streakCount === 1 ? '1 día' : `${profile.streakCount} días`;

  const handleStartDaily = () => {
    refreshHearts();
    const current = useGameStore.getState().profile;
    if (!current.isPremium && current.hearts <= 0) {
      if (PAYWALL_ENABLED) {
        router.push('/paywall?reason=hearts');
        return;
      }
      refillHeartsNow();
    }
    router.push('/play/desafio-del-dia');
  };

  const handlePlayNewsQuiz = (item: VaticanNewsQuizItem) => {
    refreshHearts();
    const current = useGameStore.getState().profile;
    if (!current.isPremium && current.hearts <= 0) {
      if (PAYWALL_ENABLED) {
        router.push('/paywall?reason=hearts');
        return;
      }
      refillHeartsNow();
    }
    router.push({
      pathname: '/play/[levelId]',
      params: { levelId: `noticia-${item.id}` },
    });
  };

  const isOddTopics = topics.length % 2 === 1;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado con buen respiro arriba */}
        <View style={styles.top}>
          <View style={styles.greetingCol}>
            <Text style={styles.hello} numberOfLines={1}>
              {getGreeting()}, {profile.displayName}
            </Text>
            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              ¿Jugamos hoy?
            </Text>
          </View>

          <View style={styles.chipsCol}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel={`Racha actual: ${streakLabel}`}
              style={styles.streakChip}
            >
              <FlameIcon size={18} color={LIENZO.color.gold} weight="duotone" />
              <Text style={styles.streakText}>{streakLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (PAYWALL_ENABLED) {
                  router.push('/paywall?reason=hearts');
                } else if (profile.hearts < MAX_HEARTS) {
                  refillHeartsNow();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={
                profile.isPremium
                  ? 'Vidas infinitas activas'
                  : `Tenés ${profile.hearts} de ${MAX_HEARTS} vidas disponibles`
              }
              style={styles.heartsChip}
            >
              <HeartIcon size={17} color={LIENZO.color.danger} weight="duotone" />
              {profile.isPremium ? (
                <InfinityIcon size={17} color={LIENZO.color.danger} weight="regular" />
              ) : (
                <Text style={styles.heartsText}>
                  {profile.hearts}/{MAX_HEARTS}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Banner superior unificado y deslizable: Desafío del día + Novedades/Oración/Iniciativa */}
        <HeroCarousel
          dailyTitle={dailyChallenge.title}
          dailySubtitle={dailyChallenge.subtitle}
          dailyReadingsLabel={dailyReadingsLabel}
          dailyQuestionCount={dailyChallenge.questions.length}
          dailyCompletedToday={completedDailyToday}
          onStartDaily={handleStartDaily}
          banners={banners}
        />

        {/* Categorías en grilla de cuadros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <Pressable
            onPress={() => router.push('/categories')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ver todas las categorías"
          >
            <Text style={styles.sectionLink}>Ver todas</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {topics.map((topic, index) => {
            const totalInTopic = questions.filter(
              (q) => q.topicId === topic.id || q.topicSlug === topic.slug
            ).length;
            const completedInTopic = (answeredCorrectByTopic[topic.slug] ?? []).length;
            const isLastOdd = isOddTopics && index === topics.length - 1;

            return (
              <CategoryGridCard
                key={topic.id}
                topic={topic}
                completedCount={completedInTopic}
                totalCount={totalInTopic}
                fullWidth={isLastOdd}
                onPress={() =>
                  router.push({
                    pathname: '/category/[slug]',
                    params: { slug: topic.slug },
                  })
                }
              />
            );
          })}
        </View>

        {/* Nuevas noticias multimedios (Vatican News, ACI Prensa, Aleteia) con mini-quiz */}
        <VaticanNewsSection
          items={vaticanNews}
          completedNewsIds={completedNewsIds}
          onPlayNewsQuiz={handlePlayNewsQuiz}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LIENZO.color.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: LIENZO.color.bg,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 34,
    paddingBottom: LIENZO.space.xxxl,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  greetingCol: {
    flex: 1,
    minWidth: 0,
  },
  hello: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  title: {
    fontSize: 25,
    lineHeight: 30,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
    marginTop: 1,
  },
  chipsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 34,
  },
  streakText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  heartsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.dangerSoft,
    borderRadius: LIENZO.radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 9,
    minHeight: 34,
  },
  heartsText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.danger,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  sectionLink: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

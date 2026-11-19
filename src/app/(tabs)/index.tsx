import { useRouter } from 'expo-router';
import { FlameIcon, HeartIcon, InfinityIcon } from 'phosphor-react-native';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BannerCarousel } from '@/components/BannerCarousel';
import { CategoryCard } from '@/components/CategoryCard';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { VaticanNewsSection } from '@/components/VaticanNewsSection';
import { LIENZO } from '@/constants/theme';
import { DAILY_CHALLENGE, MAX_HEARTS } from '@/data/localSeed';
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
  const vaticanNews = useGameStore((s) => s.vaticanNews);
  const completedNewsIds = useGameStore((s) => s.completedNewsIds);
  const profile = useGameStore((s) => s.profile);
  const answeredCorrectByTopic = useGameStore((s) => s.answeredCorrectByTopic);
  const dailyCompletedDate = useGameStore((s) => s.dailyCompletedDate);
  const refreshHearts = useGameStore((s) => s.refreshHearts);

  useEffect(() => {
    refreshHearts();
  }, [refreshHearts]);

  const completedDailyToday = dailyCompletedDate === getTodayKey();
  const streakLabel =
    profile.streakCount === 1 ? '1 día' : `${profile.streakCount} días`;

  const handleStartDaily = () => {
    refreshHearts();
    const current = useGameStore.getState().profile;
    if (!current.isPremium && current.hearts <= 0) {
      router.push('/paywall?reason=hearts');
      return;
    }
    router.push('/play/desafio-del-dia');
  };

  const handlePlayNewsQuiz = (item: VaticanNewsQuizItem) => {
    refreshHearts();
    const current = useGameStore.getState().profile;
    if (!current.isPremium && current.hearts <= 0) {
      router.push('/paywall?reason=hearts');
      return;
    }
    router.push({
      pathname: '/play/[levelId]',
      params: { levelId: `noticia-${item.id}` },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado de inicio — fiel a boceto-inicio.html */}
        <View style={styles.top}>
          <View style={styles.greetingCol}>
            <Text style={styles.hello}>
              {getGreeting()}, {profile.displayName}
            </Text>
            <Text style={styles.title}>¿Jugamos hoy?</Text>
          </View>

          <View style={styles.chipsCol}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel={`Racha actual: ${streakLabel}`}
              style={styles.streakChip}
            >
              <FlameIcon size={20} color={LIENZO.color.gold} weight="duotone" />
              <Text style={styles.streakText}>{streakLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/paywall?reason=hearts')}
              accessibilityRole="button"
              accessibilityLabel={
                profile.isPremium
                  ? 'Vidas infinitas activas con plan Pro'
                  : `Tenés ${profile.hearts} de ${MAX_HEARTS} vidas disponibles`
              }
              style={styles.heartsChip}
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
        </View>

        {/* Banner administrable de novedades / oración / iniciativa */}
        <BannerCarousel banners={banners} />

        {/* Desafío del día — único bloque de color sólido de la pantalla */}
        <DailyChallengeCard
          title={DAILY_CHALLENGE.title}
          questionCount={DAILY_CHALLENGE.questionCount}
          completedToday={completedDailyToday}
          onStart={handleStartDaily}
        />

        {/* Sección Categorías */}
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

        {topics.map((topic) => {
          const totalInTopic = questions.filter(
            (q) => q.topicId === topic.id || q.topicSlug === topic.slug
          ).length;
          const completedInTopic = (answeredCorrectByTopic[topic.slug] ?? []).length;

          return (
            <CategoryCard
              key={topic.id}
              topic={topic}
              completedCount={completedInTopic}
              totalCount={totalInTopic}
              compact
              onPress={() =>
                router.push({
                  pathname: '/category/[slug]',
                  params: { slug: topic.slug },
                })
              }
            />
          );
        })}

        {/* Sección inferior: últimas noticias de Vatican News con quiz individual */}
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
    paddingTop: 28,
    paddingBottom: LIENZO.space.xl,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    flexWrap: 'wrap',
  },
  greetingCol: {
    flexShrink: 1,
    minWidth: 140,
  },
  hello: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  title: {
    fontSize: 23,
    lineHeight: 27,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
    marginTop: 1,
  },
  chipsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingVertical: 5,
    paddingHorizontal: 10,
    minHeight: 32,
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
    paddingVertical: 5,
    paddingHorizontal: 9,
    minHeight: 32,
  },
  heartsText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.danger,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 16,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
  },
  sectionLink: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primary,
  },
});

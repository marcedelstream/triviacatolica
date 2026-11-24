import { useRouter } from 'expo-router';
import {
  ArrowCounterClockwiseIcon,
  CaretRightIcon,
  ChurchIcon,
  CrownIcon,
  FlameIcon,
  HeartIcon,
  InfinityIcon,
  LightningIcon,
  QrCodeIcon,
  ShuffleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarBadge } from '@/components/AvatarBadge';
import { CategoryGridCard } from '@/components/CategoryGridCard';
import { CountryPromptModal } from '@/components/CountryPromptModal';
import { DailyReadingsView } from '@/components/DailyReadingsView';
import { HeroCarousel } from '@/components/HeroCarousel';
import { NotificationPromptModal } from '@/components/NotificationPromptModal';
import { VaticanNewsSection } from '@/components/VaticanNewsSection';
import {
  PAYWALL_ENABLED,
} from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { translate, type AppLanguage } from '@/i18n/translations';
import { useGameStore } from '@/store/useGameStore';
import type { VaticanNewsQuizItem } from '@/types/trivia';

function getGreeting(lang: AppLanguage | undefined): string {
  const hour = new Date().getHours();
  if (hour < 12) return translate(lang, 'greetingMorning');
  if (hour < 20) return translate(lang, 'greetingAfternoon');
  return translate(lang, 'greetingEvening');
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [showReadingsModal, setShowReadingsModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const isHydrated = useGameStore((s) => s.isHydrated);
  const isBootstrapping = useGameStore((s) => s.isBootstrapping);
  const topics = useGameStore((s) => s.topics);
  const levels = useGameStore((s) => s.levels);
  const questions = useGameStore((s) => s.questions);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const banners = useGameStore((s) => s.banners);
  const dailyChallenge = useGameStore((s) => s.dailyChallenge);
  const vaticanNews = useGameStore((s) => s.vaticanNews);
  const completedNewsIds = useGameStore((s) => s.completedNewsIds);
  const wrongQuestionIds = useGameStore((s) => s.wrongQuestionIds);
  const profile = useGameStore((s) => s.profile);
  const answeredCorrectByTopic = useGameStore((s) => s.answeredCorrectByTopic);
  const dailyCompletedDate = useGameStore((s) => s.dailyCompletedDate);
  const hasDismissedCountryPrompt = useGameStore((s) => s.hasDismissedCountryPrompt);
  const hasPromptedNotifications = useGameStore((s) => s.hasPromptedNotifications);
  const refreshHearts = useGameStore((s) => s.refreshHearts);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);
  const canStartQuiz = useGameStore((s) => s.canStartQuiz);
  const setCountry = useGameStore((s) => s.setCountry);
  const dismissCountryPrompt = useGameStore((s) => s.dismissCountryPrompt);
  const enableNotifications = useGameStore((s) => s.enableNotifications);
  const dismissNotificationPrompt = useGameStore((s) => s.dismissNotificationPrompt);
  const refreshDailyChallengeIfNeeded = useGameStore((s) => s.refreshDailyChallengeIfNeeded);

  useEffect(() => {
    refreshHearts();
    void refreshDailyChallengeIfNeeded();
  }, [refreshDailyChallengeIfNeeded, refreshHearts]);

  // Si es usuario nuevo invitado que aún no pasó el abordaje, llevarlo una vez a elegir idioma/nombre/país
  useEffect(() => {
    if (isHydrated && !isBootstrapping && !profile.hasCompletedOnboarding) {
      router.push('/onboarding');
    }
  }, [isBootstrapping, isHydrated, profile.hasCompletedOnboarding, router]);

  const lang = profile.language ?? 'es';
  const today = getTodayKey();
  const completedDailyToday = dailyCompletedDate === today;

  const dailyReadingsLabel = [
    dailyChallenge.firstReadingRef ? `Lectura: ${dailyChallenge.firstReadingRef}` : null,
    dailyChallenge.gospelRef ? `Evangelio: ${dailyChallenge.gospelRef}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const streakLabel =
    profile.streakCount === 1 ? '1 día' : `${profile.streakCount} días`;

  const guardQuizLaunch = (nextSlug?: string): boolean => {
    const gate = canStartQuiz();
    if (gate === 'guest_limit') {
      router.push({
        pathname: '/auth-modal',
        params: nextSlug ? { reason: 'guest_limit', nextLevelId: nextSlug } : { reason: 'guest_limit' },
      });
      return false;
    }
    if (gate === 'daily_limit') {
      router.push('/paywall?reason=daily_limit');
      return false;
    }
    refreshHearts();
    const current = useGameStore.getState().profile;
    if (!current.isPremium && current.hearts <= 0) {
      if (PAYWALL_ENABLED) {
        router.push('/paywall?reason=hearts');
        return false;
      }
      refillHeartsNow();
    }
    return true;
  };

  const handleStartDaily = () => {
    if (completedDailyToday) {
      setShowReadingsModal(true);
      return;
    }
    if (!guardQuizLaunch('desafio-del-dia')) return;
    router.push('/play/desafio-del-dia');
  };

  const handleStartFreePlay = () => {
    if (!guardQuizLaunch('jugar-libre')) return;
    router.push('/play/jugar-libre');
  };

  const handlePlayNewsQuiz = (item: VaticanNewsQuizItem) => {
    const slug = `noticia-${item.id}`;
    if (!guardQuizLaunch(slug)) return;
    router.push({
      pathname: '/play/[levelId]',
      params: { levelId: slug },
    });
  };

  const handleOpenErrorReview = () => {
    if (profile.isAnonymous) {
      router.push('/auth-modal?reason=guest_limit');
      return;
    }
    if (PAYWALL_ENABLED && !profile.isPremium) {
      router.push('/paywall?reason=mistakes');
      return;
    }
    if (wrongQuestionIds.length === 0) {
      return;
    }
    router.push('/play/repaso-errores');
  };

  const showCountryPrompt =
    isHydrated &&
    !isBootstrapping &&
    profile.hasCompletedOnboarding &&
    !profile.isAnonymous &&
    !profile.country &&
    !hasDismissedCountryPrompt;

  const showNotificationPrompt =
    isHydrated &&
    !isBootstrapping &&
    profile.hasCompletedOnboarding &&
    !showCountryPrompt &&
    !hasPromptedNotifications;

  const orderedTopics = useMemo(() => {
    const items = topics.map((topic) => {
      const totalInTopic = questions.filter(
        (q) => q.topicId === topic.id || q.topicSlug === topic.slug
      ).length;
      const completedInTopic = (answeredCorrectByTopic[topic.slug] ?? []).length;
      const topicLevels = levels.filter(
        (l) => l.topicId === topic.id || l.topicSlug === topic.slug
      );
      const allLevelsCleared =
        topicLevels.length > 0 &&
        topicLevels.every((l) => Boolean(levelProgress[l.id]?.stars));
      const isCompleted =
        (totalInTopic > 0 && completedInTopic >= totalInTopic) || allLevelsCleared;
      return {
        topic,
        totalInTopic,
        completedInTopic,
        isCompleted,
      };
    });

    // Las categorías terminadas pasan automáticamente al final del slide
    return items.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.topic.sortOrder - b.topic.sortOrder;
    });
  }, [answeredCorrectByTopic, levelProgress, levels, questions, topics]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado con avatar, saludo y chips de racha + vidas */}
        <View style={styles.top}>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Abrir mi perfil"
            style={styles.profileHead}
          >
            <AvatarBadge
              avatarId={profile.avatarId}
              country={profile.country}
              size={44}
              highlight={profile.isPremium}
            />
            <View style={styles.greetingCol}>
              <Text style={styles.hello} numberOfLines={1}>
                {getGreeting(lang)}, {profile.displayName}
              </Text>
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {translate(lang, 'homeQuestion')}
              </Text>
            </View>
          </Pressable>

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

        {/* Accesos rápidos debajo del saludo: 1. Jugar libre, 2. Versus, 3. Ingresar código */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={handleStartFreePlay}
            accessibilityRole="button"
            accessibilityLabel="Jugar libre: 5 preguntas al azar de cualquier tema"
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: LIENZO.color.primarySoft }]}>
              <ShuffleIcon size={20} color={LIENZO.color.primaryInk} weight="duotone" />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1}>
              Jugar libre
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              5 al azar
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/versus')}
            accessibilityRole="button"
            accessibilityLabel="Modo Versus: desafiar a otros jugadores por arroba"
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: LIENZO.color.goldSoft }]}>
              <LightningIcon size={20} color={LIENZO.color.goldInk} weight="duotone" />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1}>
              Versus
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              1 vs 1 · @ID
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowCodeModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Ingresar código de cuestionario de parroquia, próximamente"
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.quickIconBox,
                { backgroundColor: LIENZO.category.liturgia.soft },
              ]}
            >
              <QrCodeIcon size={20} color={LIENZO.category.liturgia.color} weight="duotone" />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1}>
              Código
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              Pronto
            </Text>
          </Pressable>
        </View>

        {/* Banner superior unificado y deslizable: Desafío del día + Novedades/Oración/Iniciativa */}
        <HeroCarousel
          dailyTitle={dailyChallenge.title}
          dailySubtitle={dailyChallenge.subtitle}
          dailyReadingsLabel={dailyReadingsLabel}
          dailyQuestionCount={dailyChallenge.questions.length}
          dailyCompletedToday={completedDailyToday}
          onStartDaily={handleStartDaily}
          onReadDaily={() => setShowReadingsModal(true)}
          banners={banners}
        />

        {/* Repasar mis errores (Pro): solo aparece cuando hay preguntas falladas pendientes */}
        {wrongQuestionIds.length > 0 ? (
          <Pressable
            onPress={handleOpenErrorReview}
            accessibilityRole="button"
            style={({ pressed }) => [styles.reviewCard, pressed && styles.pressed]}
          >
            <View style={styles.reviewIcon}>
              <ArrowCounterClockwiseIcon
                size={22}
                color={LIENZO.color.primary}
                weight="duotone"
              />
            </View>
            <View style={styles.reviewBody}>
              <View style={styles.reviewHead}>
                <Text style={styles.reviewTitle}>
                  {translate(lang, 'reviewMistakesTitle')}
                </Text>
                {!profile.isPremium ? (
                  <View style={styles.proMiniPill}>
                    <CrownIcon size={12} color={LIENZO.color.goldInk} weight="duotone" />
                    <Text style={styles.proMiniText}>
                      {translate(lang, 'reviewMistakesProTag')}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.reviewSub}>
                {translate(lang, 'reviewMistakesSub', { count: wrongQuestionIds.length })}
              </Text>
            </View>
            <CaretRightIcon size={20} color={LIENZO.color.ink2} weight="regular" />
          </Pressable>
        ) : null}

        {/* Categorías en slide horizontal (las completadas pasan automáticamente al final) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{translate(lang, 'categoriesTitle')}</Text>
          <Pressable
            onPress={() => router.push('/categories')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ver todas las categorías"
          >
            <Text style={styles.sectionLink}>{translate(lang, 'seeAll')}</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={158}
          snapToAlignment="start"
          style={styles.categoriesSlide}
          contentContainerStyle={styles.categoriesSlideContent}
        >
          {orderedTopics.map(({ topic, completedInTopic, totalInTopic, isCompleted }) => (
            <CategoryGridCard
              key={topic.id}
              topic={topic}
              completedCount={completedInTopic}
              totalCount={totalInTopic}
              cardWidth={148}
              isCompleted={isCompleted}
              onPress={() =>
                router.push({
                  pathname: '/category/[slug]',
                  params: { slug: topic.slug },
                })
              }
            />
          ))}
        </ScrollView>

        {/* Nuevas noticias multimedios (Vatican News, ACI Prensa, Aleteia) con mini-quiz */}
        <VaticanNewsSection
          items={vaticanNews}
          completedNewsIds={completedNewsIds}
          onPlayNewsQuiz={handlePlayNewsQuiz}
        />
      </ScrollView>

      {/* Popup amable para usuarios registrados que todavía no eligieron su banderita */}
      <CountryPromptModal
        visible={showCountryPrompt}
        selectedCountry={profile.country}
        onSelectCountry={(code) => setCountry(code)}
        onClose={dismissCountryPrompt}
      />

      {/* Popup personalizado Lienzo para pedir permiso de notificaciones */}
      <NotificationPromptModal
        visible={showNotificationPrompt}
        onEnable={enableNotifications}
        onDismiss={dismissNotificationPrompt}
      />

      {/* Modal de lectura de las Lecturas del Día (cuando ya completó el desafío hoy) */}
      <Modal
        visible={showReadingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReadingsModal(false)}
      >
        <View style={styles.readingsBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowReadingsModal(false)}
            accessibilityLabel="Cerrar lecturas"
          />
          <View style={styles.readingsSheet}>
            <View style={styles.readingsHeader}>
              <Text style={styles.readingsHeaderTitle}>Lecturas de hoy</Text>
              <Pressable
                onPress={() => setShowReadingsModal(false)}
                style={styles.readingsCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar lecturas de hoy"
              >
                <XIcon size={22} color={LIENZO.color.ink} weight="regular" />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.readingsScrollContent}
            >
              <DailyReadingsView dailyChallenge={dailyChallenge} />
            </ScrollView>
            <View style={styles.readingsFooter}>
              <Pressable
                onPress={() => setShowReadingsModal(false)}
                style={({ pressed }) => [styles.readingsDoneBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.readingsDoneBtnText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal de Ingresar Código para Parroquias y Catequesis (Próximamente) */}
      <Modal
        visible={showCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.codeBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCodeModal(false)}
            accessibilityLabel="Cerrar aviso de código"
          />
          <View style={styles.codeCard}>
            <View style={styles.codeTopRow}>
              <View style={styles.codeBadge}>
                <ChurchIcon size={16} color={LIENZO.category.liturgia.color} weight="duotone" />
                <Text style={styles.codeBadgeText}>Próximamente · Parroquias</Text>
              </View>
              <Pressable
                onPress={() => setShowCodeModal(false)}
                style={styles.readingsCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <XIcon size={20} color={LIENZO.color.ink} weight="regular" />
              </Pressable>
            </View>

            <Text style={styles.codeTitle}>Ingresar código de cuestionario</Text>
            <Text style={styles.codeDesc}>
              Muy pronto vas a poder cargar cuestionarios personalizados creados por parroquias,
              catequistas y grupos juveniles con un código único.
            </Text>

            <View style={styles.codeBullets}>
              <Text style={styles.codeBullet}>• No afecta tu puesto en el Ranking.</Text>
              <Text style={styles.codeBullet}>• No consume tu límite diario de quizzes.</Text>
              <Text style={styles.codeBullet}>• Ideal para encuentros de catequesis y retiros.</Text>
            </View>

            <TextInput
              editable={false}
              value=""
              placeholder="Ej. CATEQ-2026 (disponible muy pronto)"
              placeholderTextColor={LIENZO.color.ink2}
              style={styles.codeInputPreview}
            />

            <Pressable
              onPress={() => setShowCodeModal(false)}
              style={({ pressed }) => [styles.readingsDoneBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.readingsDoneBtnText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 104,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  profileHead: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greetingCol: {
    flex: 1,
    minWidth: 0,
  },
  hello: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
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
  reviewCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 14,
  },
  reviewIcon: {
    width: 42,
    height: 42,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBody: {
    flex: 1,
    gap: 2,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  proMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  proMiniText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.goldInk,
  },
  reviewSub: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  pressed: {
    opacity: 0.9,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 24,
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
  categoriesSlide: {
    marginHorizontal: -LIENZO.space.xl,
  },
  categoriesSlideContent: {
    paddingHorizontal: LIENZO.space.xl,
    gap: 10,
  },
  readingsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'flex-end',
  },
  readingsSheet: {
    maxHeight: '88%',
    backgroundColor: LIENZO.color.bg,
    borderTopLeftRadius: LIENZO.radius.block,
    borderTopRightRadius: LIENZO.radius.block,
    borderTopWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
  },
  readingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LIENZO.space.xl,
    paddingVertical: 14,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  readingsHeaderTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  readingsCloseBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  readingsScrollContent: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.lg,
    paddingBottom: LIENZO.space.xl,
  },
  readingsFooter: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: LIENZO.borderWidth.hairline,
    borderTopColor: LIENZO.color.line,
  },
  readingsDoneBtn: {
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingsDoneBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quickTile: {
    flex: 1,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    minHeight: 86,
    justifyContent: 'center',
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickTitle: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  quickSub: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  codeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LIENZO.space.xl,
  },
  codeCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.block,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.xl,
    gap: LIENZO.space.md,
  },
  codeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LIENZO.category.liturgia.soft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  codeBadgeText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.category.liturgia.color,
  },
  codeTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  codeDesc: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  codeBullets: {
    backgroundColor: LIENZO.color.track,
    borderRadius: LIENZO.radius.icon,
    padding: 12,
    gap: 5,
  },
  codeBullet: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink,
  },
  codeInputPreview: {
    minHeight: 46,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.track,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink2,
  },
});

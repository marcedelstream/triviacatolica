import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  EqualsIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  ShareNetworkIcon,
  XIcon,
} from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AvatarBadge } from '@/components/AvatarBadge';
import { ScreenFrame } from '@/components/ScreenFrame';
import { DAILY_FREE_VERSUS_LIMIT, PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { getCountryByCode } from '@/data/countries';
import { fetchPublicProfile } from '@/services/quizService';
import { useGameStore } from '@/store/useGameStore';
import type { PublicProfile, VersusMatch } from '@/types/trivia';

export default function VersusScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const leaderboardPeers = useGameStore((s) => s.leaderboardPeers);
  const versusMatches = useGameStore((s) => s.versusMatches);
  const refreshVersusMatches = useGameStore((s) => s.refreshVersusMatches);
  const getDailyVersusPlayedToday = useGameStore((s) => s.getDailyVersusPlayedToday);
  const canStartVersus = useGameStore((s) => s.canStartVersus);
  const refreshHearts = useGameStore((s) => s.refreshHearts);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<PublicProfile | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'not_found' | 'self' | 'found'>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshVersusMatches();
    }, [refreshVersusMatches])
  );

  const versusUsedToday = getDailyVersusPlayedToday();
  const versusRemaining = Math.max(0, DAILY_FREE_VERSUS_LIMIT - versusUsedToday);
  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');
  const selfUsername = profile.username?.trim().toLowerCase() ?? '';

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSearch = async () => {
    if (!cleanQuery) return;
    if (selfUsername && cleanQuery === selfUsername) {
      setFoundPlayer(null);
      setSearchStatus('self');
      return;
    }

    setSearching(true);
    setFoundPlayer(null);

    // 1. Buscar primero en Supabase por @usuario exacto
    let result = await fetchPublicProfile(cleanQuery);

    // 2. Respaldo en leaderboard cargado en memoria
    if (!result) {
      const peer = leaderboardPeers.find(
        (p) => p.username?.trim().toLowerCase() === cleanQuery
      );
      if (peer && peer.username && peer.id !== profile.id) {
        result = {
          id: peer.id,
          displayName: peer.displayName,
          username: peer.username.trim().toLowerCase(),
          country: peer.country ?? null,
          avatarId: peer.avatarId ?? 'noe',
          xp: peer.xp,
          streakCount: peer.streakCount,
          longestStreak: peer.longestStreak ?? peer.streakCount,
          createdAt: peer.createdAt ?? '',
          levelsCompleted: 0,
          totalStars: 0,
          rankPosition: null,
        };
      }
    }

    setSearching(false);
    if (result && result.id === profile.id) {
      setSearchStatus('self');
      return;
    }
    if (result) {
      setFoundPlayer(result);
      setSearchStatus('found');
    } else {
      setSearchStatus('not_found');
    }
  };

  const guardAndLaunch = (targetSlug: string, enforceDailyQuota: boolean) => {
    if (enforceDailyQuota) {
      const gate = canStartVersus();
      if (gate === 'guest_limit') {
        router.push({
          pathname: '/auth-modal',
          params: { reason: 'guest_limit', nextLevelId: targetSlug },
        });
        return;
      }
      if (gate === 'daily_limit') {
        router.push('/paywall?reason=daily_limit');
        return;
      }
    }

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
      params: { levelId: targetSlug },
    });
  };

  const handleShareMatch = async (match: VersusMatch) => {
    const url = `https://triviacatolica.com/play/versus-match-${match.id}`;
    const textOnly = `¡Te desafié en Trivia Católica! Hice ${match.challengerScore}/${match.totalQuestions}. Es tu turno de responder las mismas ${match.totalQuestions} preguntas:`;
    const fullMessage = `${textOnly} ${url}`;
    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: 'Desafío Versus · Trivia Católica', text: textOnly, url });
          return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(fullMessage);
          setCopiedId(match.id);
          setTimeout(() => setCopiedId(null), 2200);
          return;
        }
      } catch {
        // fallback below
      }
    }
    // En iOS/Android no pasar `url` aparte cuando ya va dentro de `message`, para evitar link duplicado
    await Share.share({ message: fullMessage });
  };

  // Separar duelos por estado para el jugador actual
  const incomingTurns = versusMatches.filter((m) => {
    const isOpponent =
      m.opponentId === profile.id ||
      (selfUsername && m.opponentUsername.toLowerCase() === selfUsername);
    return m.status === 'waiting_opponent' && isOpponent && m.challengerId !== profile.id;
  });

  const waitingForRival = versusMatches.filter(
    (m) => m.status === 'waiting_opponent' && m.challengerId === profile.id
  );

  const completedDuels = versusMatches.filter((m) => m.status === 'completed');

  const foundCountry = getCountryByCode(foundPlayer?.country);

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={handleSafeBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ArrowLeftIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>
        <Text style={styles.topTitle}>Versus</Text>
        <View style={styles.quotaPill}>
          {profile.isPremium ? (
            <>
              <CrownIcon size={14} color={LIENZO.color.goldInk} weight="duotone" />
              <Text style={styles.quotaText}>Ilimitado</Text>
            </>
          ) : (
            <Text style={styles.quotaText}>
              {versusRemaining}/{DAILY_FREE_VERSUS_LIMIT} hoy
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Buscador minimalista por @usuario */}
        <View style={styles.searchSection}>
          <Text style={styles.heading}>Desafiar por @usuario</Text>
          <Text style={styles.sub}>
            Jugás 5 preguntas y luego tu rival tiene su turno con las mismas. Pueden ganar, perder o
            empatar.
          </Text>

          <View style={styles.searchBox}>
            <MagnifyingGlassIcon size={19} color={LIENZO.color.ink2} weight="regular" />
            <TextInput
              value={query}
              onChangeText={(txt) => {
                setQuery(txt);
                setSearchStatus('idle');
                setFoundPlayer(null);
              }}
              onSubmitEditing={() => void handleSearch()}
              placeholder="Escribí el @usuario (ej. @marce)"
              placeholderTextColor={LIENZO.color.ink2}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setFoundPlayer(null);
                  setSearchStatus('idle');
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Limpiar"
              >
                <XIcon size={17} color={LIENZO.color.ink2} weight="regular" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => void handleSearch()}
              disabled={!cleanQuery || searching}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.findBtn,
                (!cleanQuery || searching) && styles.findBtnDisabled,
                pressed && styles.pressed,
              ]}
            >
              {searching ? (
                <ActivityIndicator size="small" color={LIENZO.color.primaryInk} />
              ) : (
                <Text style={styles.findBtnText}>Buscar</Text>
              )}
            </Pressable>
          </View>

          {searchStatus === 'self' ? (
            <Text style={styles.feedbackText}>
              Ese es tu propio @usuario. Probá buscar el de un amigo.
            </Text>
          ) : null}

          {searchStatus === 'not_found' ? (
            <Text style={styles.feedbackText}>
              No encontramos a @{cleanQuery}. Revisá que esté bien escrito y tenga cuenta vinculada.
            </Text>
          ) : null}

          {searchStatus === 'found' && foundPlayer ? (
            <View style={styles.resultCard}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/u/[username]',
                    params: { username: foundPlayer.username },
                  })
                }
                style={styles.resultLeft}
              >
                <AvatarBadge
                  avatarId={foundPlayer.avatarId}
                  country={foundPlayer.country}
                  size={46}
                />
                <View style={styles.resultBody}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {foundPlayer.displayName}
                  </Text>
                  <Text style={styles.resultMeta} numberOfLines={1}>
                    @{foundPlayer.username}
                    {foundCountry ? ` · ${foundCountry.flag}` : ''} · {foundPlayer.xp} XP
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => guardAndLaunch(`versus-${foundPlayer.username}`, true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.duelBtn, pressed && styles.pressed]}
              >
                <LightningIcon size={15} color={LIENZO.color.primaryInk} weight="duotone" />
                <Text style={styles.duelBtnText}>Desafiar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {!profile.isPremium && versusRemaining === 0 ? (
          <Pressable
            onPress={() => router.push('/paywall?reason=daily_limit')}
            style={({ pressed }) => [styles.limitNotice, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <CrownIcon size={18} color={LIENZO.color.goldInk} weight="duotone" />
            <Text style={styles.limitNoticeText}>
              Usaste tu 1 Versus gratis de hoy. Pasá a Pro para duelos ilimitados.
            </Text>
          </Pressable>
        ) : null}

        {/* Tu turno: desafíos recibidos */}
        {incomingTurns.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Tu turno ({incomingTurns.length})</Text>
            {incomingTurns.map((m) => (
              <View key={m.id} style={styles.matchCard}>
                <View style={styles.matchInfo}>
                  <View style={styles.turnDotRow}>
                    <View style={styles.turnDot} />
                    <Text style={styles.matchTitle} numberOfLines={1}>
                      @{m.challengerUsername} te desafió
                    </Text>
                  </View>
                  <Text style={styles.matchMeta}>
                    Respondé las mismas {m.totalQuestions} preguntas para definir el duelo
                  </Text>
                </View>
                <Pressable
                  onPress={() => guardAndLaunch(`versus-match-${m.id}`, false)}
                  style={({ pressed }) => [styles.duelBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.duelBtnText}>Responder</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Esperando respuesta del rival */}
        {waitingForRival.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Esperando respuesta ({waitingForRival.length})</Text>
            {waitingForRival.map((m) => (
              <View key={m.id} style={styles.matchCard}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTitle} numberOfLines={1}>
                    vs @{m.opponentUsername}
                  </Text>
                  <View style={styles.waitMetaRow}>
                    <ClockIcon size={14} color={LIENZO.color.ink2} weight="regular" />
                    <Text style={styles.matchMeta}>
                      Tu puntaje: {m.challengerScore}/{m.totalQuestions} · Falta su turno
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => void handleShareMatch(m)}
                  style={({ pressed }) => [styles.subtleIconBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Compartir duelo con @${m.opponentUsername}`}
                >
                  <ShareNetworkIcon size={17} color={LIENZO.color.ink} weight="regular" />
                  <Text style={styles.subtleIconText}>
                    {copiedId === m.id ? 'Copiado' : 'Enviar'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Duelos finalizados (victoria, empate o derrota) */}
        {completedDuels.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Finalizados</Text>
            {completedDuels.map((m) => {
              const iAmChallenger = m.challengerId === profile.id;
              const rivalUser = iAmChallenger ? m.opponentUsername : m.challengerUsername;
              const myScore = iAmChallenger ? m.challengerScore : (m.opponentScore ?? 0);
              const rivalScore = iAmChallenger ? (m.opponentScore ?? 0) : m.challengerScore;
              const isTie = m.winner === 'tie';
              const iWon =
                (iAmChallenger && m.winner === 'challenger') ||
                (!iAmChallenger && m.winner === 'opponent');

              return (
                <View key={m.id} style={styles.matchCard}>
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchTitle} numberOfLines={1}>
                      vs @{rivalUser}
                    </Text>
                    <Text style={styles.matchMeta}>
                      Marcador final: {myScore} – {rivalScore}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.outcomePill,
                      isTie
                        ? styles.outcomeTie
                        : iWon
                          ? styles.outcomeWin
                          : styles.outcomeLoss,
                    ]}
                  >
                    {isTie ? (
                      <EqualsIcon size={14} color={LIENZO.color.goldInk} weight="bold" />
                    ) : iWon ? (
                      <CheckCircleIcon size={14} color={LIENZO.color.success} weight="duotone" />
                    ) : null}
                    <Text
                      style={[
                        styles.outcomeText,
                        isTie
                          ? { color: LIENZO.color.goldInk }
                          : iWon
                            ? { color: LIENZO.color.successInk }
                            : { color: LIENZO.color.ink2 },
                      ]}
                    >
                      {isTie ? 'Empate' : iWon ? 'Ganaste' : `Ganó @${rivalUser}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
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
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.track,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quotaText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.xl,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.xl,
  },
  searchSection: {
    gap: 10,
  },
  heading: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  sub: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  searchBox: {
    marginTop: 4,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    paddingLeft: 12,
    paddingRight: 6,
    backgroundColor: LIENZO.color.bg,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
    paddingVertical: 10,
  },
  findBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findBtnDisabled: {
    opacity: 0.45,
  },
  findBtnText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  feedbackText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 2,
  },
  resultCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 12,
  },
  resultLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resultName: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  resultMeta: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  duelBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  duelBtnText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  limitNoticeText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
    flex: 1,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 14,
  },
  matchInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  turnDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  turnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LIENZO.color.gold,
  },
  matchTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    flexShrink: 1,
  },
  waitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  matchMeta: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  subtleIconBtn: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subtleIconText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink,
  },
  outcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  outcomeWin: {
    backgroundColor: LIENZO.color.successSoft,
  },
  outcomeTie: {
    backgroundColor: LIENZO.color.goldSoft,
  },
  outcomeLoss: {
    backgroundColor: LIENZO.color.track,
  },
  outcomeText: {
    ...LIENZO.type.captionBold,
  },
  pressed: {
    opacity: 0.85,
  },
});

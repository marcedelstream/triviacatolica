import { useFocusEffect, useRouter } from 'expo-router';
import {
  AtIcon,
  CaretRightIcon,
  FlameIcon,
  GlobeHemisphereWestIcon,
  MedalIcon,
  TrophyIcon,
  UserPlusIcon,
} from 'phosphor-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarBadge } from '@/components/AvatarBadge';
import { CountryPromptModal } from '@/components/CountryPromptModal';
import { LIENZO } from '@/constants/theme';
import { getCountryByCode } from '@/data/countries';
import { translate } from '@/i18n/translations';
import { useGameStore } from '@/store/useGameStore';
import type { LeaderboardEntry } from '@/types/trivia';

export default function RankingScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const leaderboardPeers = useGameStore((s) => s.leaderboardPeers);
  const refreshLeaderboard = useGameStore((s) => s.refreshLeaderboard);
  const setCountry = useGameStore((s) => s.setCountry);

  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<'world' | 'country'>('world');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const lang = profile.language ?? 'es';
  const myCountry = getCountryByCode(profile.country);

  useFocusEffect(
    useCallback(() => {
      void refreshLeaderboard();
    }, [refreshLeaderboard])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLeaderboard();
    setRefreshing(false);
  };

  const canAppearInRanking =
    !profile.isAnonymous && Boolean(profile.username && profile.username.trim().length > 0);

  const allRanked = useMemo<LeaderboardEntry[]>(() => {
    const seenIds = new Set<string>();
    const seenUsernames = new Set<string>();
    const combined: LeaderboardEntry[] = [];

    if (canAppearInRanking && profile.xp > 0) {
      const normalizedSelfUser = profile.username.trim().toLowerCase();
      seenIds.add(profile.id);
      seenUsernames.add(normalizedSelfUser);
      combined.push({
        id: profile.id,
        displayName: profile.displayName || 'Peregrino',
        username: normalizedSelfUser,
        country: profile.country ?? null,
        avatarId: profile.avatarId ?? 'noe',
        xp: profile.xp,
        streakCount: profile.streakCount,
        longestStreak: profile.longestStreak,
        createdAt: profile.createdAt,
        isCurrentUser: true,
      });
    }

    for (const peer of leaderboardPeers) {
      const cleanUser = peer.username?.trim().toLowerCase();
      if (!cleanUser) continue;
      if (seenIds.has(peer.id) || seenUsernames.has(cleanUser)) continue;
      seenIds.add(peer.id);
      seenUsernames.add(cleanUser);
      combined.push({
        ...peer,
        username: cleanUser,
        isCurrentUser: peer.id === profile.id,
      });
    }

    return combined.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.streakCount !== a.streakCount) return b.streakCount - a.streakCount;
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    });
  }, [
    canAppearInRanking,
    leaderboardPeers,
    profile.avatarId,
    profile.country,
    profile.createdAt,
    profile.displayName,
    profile.id,
    profile.longestStreak,
    profile.streakCount,
    profile.username,
    profile.xp,
  ]);

  const countryRanked = useMemo(() => {
    if (!myCountry) return [];
    return allRanked.filter(
      (item) => item.country?.trim().toUpperCase() === myCountry.code
    );
  }, [allRanked, myCountry]);

  const rankedList = scope === 'country' && myCountry ? countryRanked : allRanked;

  const worldRankIdx = allRanked.findIndex((item) => item.isCurrentUser);
  const worldRank = worldRankIdx >= 0 ? worldRankIdx + 1 : null;

  const countryRankIdx = countryRanked.findIndex((item) => item.isCurrentUser);
  const countryRank = countryRankIdx >= 0 ? countryRankIdx + 1 : null;

  const handleOpenProfile = (username: string) => {
    router.push({
      pathname: '/u/[username]',
      params: { username },
    });
  };

  const handleSelectCountryTab = () => {
    if (!myCountry) {
      setShowCountryPicker(true);
      return;
    }
    setScope('country');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={LIENZO.color.primary}
            colors={[LIENZO.color.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>{translate(lang, 'rankingSubtitle')}</Text>
          <Text style={styles.title}>{translate(lang, 'rankingTitle')}</Text>
        </View>

        {/* Filtro Mundial / Mi país */}
        <View style={styles.scopeRow}>
          <Pressable
            onPress={() => setScope('world')}
            accessibilityRole="tab"
            accessibilityState={{ selected: scope === 'world' }}
            style={[styles.scopeBtn, scope === 'world' && styles.scopeBtnActive]}
          >
            <GlobeHemisphereWestIcon
              size={18}
              color={scope === 'world' ? LIENZO.color.primaryInk : LIENZO.color.ink2}
              weight={scope === 'world' ? 'duotone' : 'regular'}
            />
            <Text style={[styles.scopeText, scope === 'world' && styles.scopeTextActive]}>
              {translate(lang, 'rankingWorld')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSelectCountryTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: scope === 'country' }}
            style={[styles.scopeBtn, scope === 'country' && styles.scopeBtnActive]}
          >
            <Text style={styles.scopeFlag}>{myCountry ? myCountry.flag : '🏳️'}</Text>
            <Text style={[styles.scopeText, scope === 'country' && styles.scopeTextActive]}>
              {myCountry ? myCountry.name : translate(lang, 'rankingMyCountry')}
            </Text>
          </Pressable>
        </View>

        {/* Tarjeta resumen del usuario: puesto en el mundo y en su país */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryIcon}>
              <TrophyIcon size={26} color={LIENZO.color.gold} weight="duotone" />
            </View>
            <View style={styles.summaryBody}>
              <Text style={styles.summaryLabel}>
                {worldRank ? 'Tu posición en el ranking' : 'Tu puntaje acumulado'}
              </Text>
              <Text style={styles.summaryValue}>{profile.xp} XP</Text>
            </View>
          </View>

          {worldRank ? (
            <View style={styles.rankPillsRow}>
              <Pressable
                onPress={() => setScope('world')}
                accessibilityRole="button"
                style={[
                  styles.rankStatPill,
                  scope === 'world' && styles.rankStatPillActive,
                ]}
              >
                <GlobeHemisphereWestIcon
                  size={16}
                  color={LIENZO.color.primaryInk}
                  weight="duotone"
                />
                <Text style={styles.rankStatText} numberOfLines={1}>
                  #{worldRank} en el mundo
                </Text>
              </Pressable>

              {myCountry && countryRank ? (
                <Pressable
                  onPress={() => setScope('country')}
                  accessibilityRole="button"
                  style={[
                    styles.rankStatPill,
                    scope === 'country' && styles.rankStatPillActive,
                  ]}
                >
                  <Text style={styles.rankStatFlag}>{myCountry.flag}</Text>
                  <Text style={styles.rankStatText} numberOfLines={1}>
                    #{countryRank} en {myCountry.name}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setShowCountryPicker(true)}
                  accessibilityRole="button"
                  style={styles.rankStatPill}
                >
                  <Text style={styles.rankStatFlag}>🏳️</Text>
                  <Text style={styles.rankStatText} numberOfLines={1}>
                    Elegir mi país
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text style={styles.summaryHint}>
              {profile.isAnonymous
                ? 'Vinculá tu cuenta y elegí tu @usuario para entrar al ranking.'
                : !profile.username
                  ? 'Elegí un @usuario en tu Perfil para aparecer en la tabla.'
                  : 'Completá tu primera partida para subir al ranking.'}
            </Text>
          )}
        </View>

        {profile.isAnonymous ? (
          <Pressable
            onPress={() => router.push('/auth-modal')}
            style={({ pressed }) => [styles.inviteCard, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.inviteIcon}>
              <UserPlusIcon size={24} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.inviteBody}>
              <Text style={styles.inviteTitle}>Entrá al ranking con tu cuenta</Text>
              <Text style={styles.inviteText}>
                Iniciá sesión con correo, Google o Apple para reservar tu @usuario y conservar tu
                racha.
              </Text>
            </View>
            <CaretRightIcon size={20} color={LIENZO.color.ink2} weight="regular" />
          </Pressable>
        ) : !profile.username ? (
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [styles.inviteCard, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.inviteIcon}>
              <AtIcon size={24} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.inviteBody}>
              <Text style={styles.inviteTitle}>Elegí tu @usuario para figurar acá</Text>
              <Text style={styles.inviteText}>
                En el ranking participan cuentas con @usuario para poder ver perfiles y futuros
                desafíos.
              </Text>
            </View>
            <CaretRightIcon size={20} color={LIENZO.color.ink2} weight="regular" />
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tabla de posiciones</Text>
          <Text style={styles.sectionHint}>{translate(lang, 'rankingHint')}</Text>
        </View>

        {rankedList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {scope === 'country' && myCountry
                ? `Todavía no hay jugadores con bandera de ${myCountry.name}`
                : 'Todavía no hay jugadores en el ranking'}
            </Text>
            <Text style={styles.emptyText}>
              Jugá tu primera partida con tu cuenta vinculada y tu @usuario para estrenar la tabla.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rankedList.map((entry, idx) => {
              const rank = idx + 1;
              const isTopThree = rank <= 3;

              return (
                <Pressable
                  key={entry.id}
                  onPress={() => entry.username && handleOpenProfile(entry.username)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver perfil de ${entry.displayName}, @${entry.username}, puesto ${rank}, ${entry.xp} XP`}
                  style={({ pressed }) => [
                    styles.row,
                    entry.isCurrentUser && styles.rowCurrent,
                    pressed && styles.pressedRow,
                  ]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      isTopThree
                        ? { backgroundColor: LIENZO.color.goldSoft }
                        : { backgroundColor: LIENZO.color.track },
                    ]}
                  >
                    {isTopThree ? (
                      <MedalIcon size={18} color={LIENZO.color.goldInk} weight="duotone" />
                    ) : (
                      <Text style={styles.rankNumber}>{rank}</Text>
                    )}
                  </View>

                  <AvatarBadge
                    avatarId={entry.avatarId}
                    country={entry.country}
                    size={40}
                    highlight={entry.isCurrentUser}
                  />

                  <View style={styles.rowBody}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.rowName,
                          entry.isCurrentUser && { color: LIENZO.color.primaryInk },
                        ]}
                        numberOfLines={1}
                      >
                        {entry.displayName}
                      </Text>
                      {entry.isCurrentUser ? (
                        <View style={styles.youChip}>
                          <Text style={styles.youChipText}>Vos</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.streakInline}>
                      <FlameIcon size={15} color={LIENZO.color.gold} weight="duotone" />
                      <Text style={styles.streakInlineText} numberOfLines={1}>
                        @{entry.username} ·{' '}
                        {entry.streakCount === 1 ? '1 día' : `${entry.streakCount} días`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rightCol}>
                    <Text style={styles.xpText}>{entry.xp} XP</Text>
                    <CaretRightIcon size={16} color={LIENZO.color.ink2} weight="regular" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CountryPromptModal
        visible={showCountryPicker}
        selectedCountry={profile.country}
        onSelectCountry={(code) => {
          setCountry(code);
          setShowCountryPicker(false);
          setScope('country');
        }}
        onClose={() => setShowCountryPicker(false)}
      />
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
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 32,
    paddingBottom: 104,
  },
  header: {
    marginBottom: LIENZO.space.md,
  },
  subtitle: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
  },
  scopeRow: {
    flexDirection: 'row',
    backgroundColor: LIENZO.color.track,
    borderRadius: LIENZO.radius.icon,
    padding: 4,
    gap: 4,
    marginBottom: LIENZO.space.md,
  },
  scopeBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  scopeBtnActive: {
    backgroundColor: LIENZO.color.bg,
  },
  scopeFlag: {
    fontSize: 16,
  },
  scopeText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  scopeTextActive: {
    color: LIENZO.color.primaryInk,
    fontFamily: LIENZO.font.bold,
  },
  summaryCard: {
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.banner,
    padding: LIENZO.space.lg,
    gap: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.ms,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: {
    flex: 1,
  },
  summaryLabel: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  summaryValue: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
    marginTop: 1,
  },
  rankPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankStatPill: {
    flex: 1,
    minWidth: 138,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rankStatPillActive: {
    borderColor: LIENZO.color.gold,
  },
  rankStatFlag: {
    fontSize: 15,
  },
  rankStatText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink,
    flexShrink: 1,
  },
  summaryHint: {
    ...LIENZO.type.caption,
    color: LIENZO.color.goldInk,
  },
  inviteCard: {
    marginTop: LIENZO.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.ms,
    padding: LIENZO.space.ms,
    borderRadius: LIENZO.radius.card,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
  },
  pressed: {
    backgroundColor: LIENZO.color.track,
  },
  pressedRow: {
    opacity: 0.88,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBody: {
    flex: 1,
  },
  inviteTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  inviteText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: LIENZO.space.xl,
    marginBottom: LIENZO.space.sm,
    gap: 2,
  },
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  sectionHint: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  emptyCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.xl,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  emptyText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  list: {
    gap: LIENZO.space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: LIENZO.space.md,
    paddingHorizontal: LIENZO.space.md,
    borderRadius: LIENZO.radius.card,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    minHeight: 68,
  },
  rowCurrent: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
    borderWidth: LIENZO.borderWidth.active,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankNumber: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    flexShrink: 1,
  },
  youChip: {
    backgroundColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  youChipText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.onPrimary,
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  streakInlineText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    flexShrink: 1,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  xpText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
});

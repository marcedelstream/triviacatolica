import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  FlameIcon,
  LightningIcon,
  MedalIcon,
  SparkleIcon,
  StarIcon,
  TrophyIcon,
} from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenFrame } from '@/components/ScreenFrame';
import { LIENZO } from '@/constants/theme';
import { fetchPublicProfile } from '@/services/quizService';
import { useGameStore } from '@/store/useGameStore';
import type { PublicProfile } from '@/types/trivia';

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatMemberSince(iso?: string): string {
  if (!iso) return 'Miembro de la comunidad';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Miembro de la comunidad';
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()] ?? '';
  const year = date.getFullYear();
  return `En Trivia Católica desde el ${day} de ${month} de ${year}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();

  const currentProfile = useGameStore((s) => s.profile);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const leaderboardPeers = useGameStore((s) => s.leaderboardPeers);

  const cleanUsername = (username ?? '').trim().toLowerCase().replace(/^@/, '');

  const fallbackProfile = useMemo<PublicProfile | null>(() => {
    if (!cleanUsername) return null;

    if (
      currentProfile.username &&
      currentProfile.username.trim().toLowerCase() === cleanUsername
    ) {
      const levelsList = Object.values(levelProgress);
      return {
        id: currentProfile.id,
        displayName: currentProfile.displayName || 'Peregrino',
        username: cleanUsername,
        xp: currentProfile.xp,
        streakCount: currentProfile.streakCount,
        longestStreak: currentProfile.longestStreak,
        createdAt: currentProfile.createdAt ?? '',
        levelsCompleted: levelsList.filter((p) => p.stars > 0).length,
        totalStars: levelsList.reduce((acc, p) => acc + p.stars, 0),
        rankPosition: null,
      };
    }

    const peerIdx = leaderboardPeers.findIndex(
      (p) => p.username?.trim().toLowerCase() === cleanUsername
    );
    const peer = peerIdx >= 0 ? leaderboardPeers[peerIdx] : null;
    if (!peer || !peer.username) return null;

    return {
      id: peer.id,
      displayName: peer.displayName,
      username: peer.username,
      xp: peer.xp,
      streakCount: peer.streakCount,
      longestStreak: peer.longestStreak ?? peer.streakCount,
      createdAt: peer.createdAt ?? '',
      levelsCompleted: 0,
      totalStars: 0,
      rankPosition: peerIdx + 1,
    };
  }, [
    cleanUsername,
    currentProfile.createdAt,
    currentProfile.displayName,
    currentProfile.id,
    currentProfile.longestStreak,
    currentProfile.streakCount,
    currentProfile.username,
    currentProfile.xp,
    leaderboardPeers,
    levelProgress,
  ]);

  const [remoteProfile, setRemoteProfile] = useState<PublicProfile | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!cleanUsername) return;
    let active = true;
    void fetchPublicProfile(cleanUsername).then((res) => {
      if (!active) return;
      setRemoteProfile(res);
      setLoadedKey(cleanUsername);
    });
    return () => {
      active = false;
    };
  }, [cleanUsername]);

  const isLoading = loadedKey !== cleanUsername;
  const player = remoteProfile ?? fallbackProfile;
  const isOwnProfile = Boolean(
    player &&
      (player.id === currentProfile.id ||
        (currentProfile.username &&
          currentProfile.username.trim().toLowerCase() === player.username.toLowerCase()))
  );

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver al ranking"
        >
          <ArrowLeftIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {cleanUsername ? `@${cleanUsername}` : 'Perfil de jugador'}
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!player && isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={LIENZO.color.primary} />
            <Text style={styles.loadingText}>Cargando perfil…</Text>
          </View>
        ) : !player ? (
          <View style={styles.centerBox}>
            <Text style={styles.notFoundTitle}>No encontramos este perfil</Text>
            <Text style={styles.notFoundText}>
              Es posible que el usuario haya cambiado su @usuario o eliminado su cuenta.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Volver al ranking</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Cabecera del jugador */}
            <View style={styles.heroCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(player.displayName)}</Text>
              </View>

              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{player.displayName}</Text>
                {isOwnProfile ? (
                  <View style={styles.ownPill}>
                    <Text style={styles.ownPillText}>Vos</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.heroUsername}>@{player.username}</Text>

              {player.rankPosition ? (
                <View style={styles.rankChip}>
                  {player.rankPosition <= 3 ? (
                    <MedalIcon size={17} color={LIENZO.color.goldInk} weight="duotone" />
                  ) : (
                    <TrophyIcon size={17} color={LIENZO.color.goldInk} weight="duotone" />
                  )}
                  <Text style={styles.rankChipText}>Puesto #{player.rankPosition} en el Ranking</Text>
                </View>
              ) : null}

              <View style={styles.sinceRow}>
                <CalendarBlankIcon size={17} color={LIENZO.color.ink2} weight="duotone" />
                <Text style={styles.sinceText}>{formatMemberSince(player.createdAt)}</Text>
              </View>
            </View>

            {/* Estadísticas públicas */}
            <Text style={styles.sectionTitle}>Trayectoria</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <SparkleIcon size={24} color={LIENZO.color.primary} weight="duotone" />
                <Text style={styles.statValue}>{player.xp}</Text>
                <Text style={styles.statLabel}>Puntos XP</Text>
              </View>

              <View style={styles.statCard}>
                <FlameIcon size={24} color={LIENZO.color.gold} weight="duotone" />
                <Text style={styles.statValue}>
                  {player.streakCount === 1 ? '1 día' : `${player.streakCount} días`}
                </Text>
                <Text style={styles.statLabel}>Racha actual</Text>
              </View>

              <View style={styles.statCard}>
                <TrophyIcon size={24} color={LIENZO.color.gold} weight="duotone" />
                <Text style={styles.statValue}>
                  {player.longestStreak === 1 ? '1 día' : `${player.longestStreak} días`}
                </Text>
                <Text style={styles.statLabel}>Mejor racha</Text>
              </View>

              <View style={styles.statCard}>
                <StarIcon size={24} color={LIENZO.color.gold} weight="duotone" />
                <Text style={styles.statValue}>
                  {player.levelsCompleted}
                  {player.totalStars > 0 ? ` · ${player.totalStars}★` : ''}
                </Text>
                <Text style={styles.statLabel}>Niveles listos</Text>
              </View>
            </View>

            {/* Base lista para futuros desafíos 1 vs 1 */}
            {isOwnProfile ? (
              <Pressable
                onPress={() => router.replace('/(tabs)/profile')}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Editar mi perfil</Text>
              </Pressable>
            ) : (
              <View style={styles.challengeCard}>
                <View style={styles.challengeTop}>
                  <View style={styles.challengeIcon}>
                    <LightningIcon size={24} color={LIENZO.color.primary} weight="duotone" />
                  </View>
                  <View style={styles.challengePill}>
                    <Text style={styles.challengePillText}>Próximamente</Text>
                  </View>
                </View>

                <Text style={styles.challengeTitle}>Desafiar a @{player.username}</Text>
                <Text style={styles.challengeText}>
                  Muy pronto vas a poder invitar a otros jugadores de la comunidad a una partida
                  1 vs 1 en vivo sobre Biblia, Santos y Catecismo.
                </Text>

                <View style={styles.challengeBtnDisabled}>
                  <LightningIcon size={18} color={LIENZO.color.ink2} weight="regular" />
                  <Text style={styles.challengeBtnDisabledText}>Desafío 1 vs 1 · Muy pronto</Text>
                </View>
              </View>
            )}
          </>
        )}
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
  topSpacer: {
    width: LIENZO.touchMin,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.xl,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.lg,
  },
  centerBox: {
    paddingVertical: 56,
    alignItems: 'center',
    gap: LIENZO.space.md,
  },
  loadingText: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  notFoundTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  notFoundText: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  heroCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.bg,
    padding: LIENZO.space.xl,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroName: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  ownPill: {
    backgroundColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  ownPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.onPrimary,
  },
  heroUsername: {
    ...LIENZO.type.item,
    color: LIENZO.color.primaryInk,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  rankChipText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  sinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  sinceText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    marginBottom: -8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LIENZO.space.sm,
  },
  statCard: {
    width: '48.5%',
    flexGrow: 1,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.ms,
    gap: 4,
    backgroundColor: LIENZO.color.bg,
  },
  statValue: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
    marginTop: 4,
  },
  statLabel: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  challengeCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.primarySoft,
    padding: LIENZO.space.lg,
    gap: 10,
  },
  challengeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengePill: {
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  challengePillText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  challengeTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  challengeText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  challengeBtnDisabled: {
    minHeight: 48,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  challengeBtnDisabledText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink2,
  },
  primaryBtn: {
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.xl,
  },
  primaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  secondaryBtn: {
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

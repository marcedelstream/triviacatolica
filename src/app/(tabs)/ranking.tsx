import { useRouter } from 'expo-router';
import { FlameIcon, MedalIcon, TrophyIcon, UserPlusIcon } from 'phosphor-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';
import type { LeaderboardEntry } from '@/types/trivia';

export default function RankingScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const leaderboardPeers = useGameStore((s) => s.leaderboardPeers);

  const rankedList = useMemo<LeaderboardEntry[]>(() => {
    const withoutSelf = leaderboardPeers.filter((p) => p.id !== profile.id);
    const selfEntry: LeaderboardEntry = {
      id: profile.id,
      displayName: profile.displayName || 'Peregrino',
      xp: profile.xp,
      streakCount: profile.streakCount,
      isCurrentUser: true,
    };
    return [...withoutSelf, selfEntry].sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.streakCount - a.streakCount;
    });
  }, [leaderboardPeers, profile.displayName, profile.id, profile.streakCount, profile.xp]);

  const userRank = rankedList.findIndex((item) => item.isCurrentUser) + 1;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>Comunidad semanal</Text>
          <Text style={styles.title}>Ranking</Text>
        </View>

        {/* Tarjeta resumen del usuario */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <TrophyIcon size={28} color={LIENZO.color.gold} weight="duotone" />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryLabel}>Tu posición actual</Text>
            <Text style={styles.summaryValue}>
              Puesto #{userRank} · {profile.xp} XP
            </Text>
          </View>
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
              <Text style={styles.inviteTitle}>Guardá tu lugar en el ranking</Text>
              <Text style={styles.inviteText}>
                Iniciá sesión con Google o Apple para conservar tu racha y tus puntos.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Tabla de posiciones</Text>

        <View style={styles.list}>
          {rankedList.map((entry, idx) => {
            const rank = idx + 1;
            const isTopThree = rank <= 3;

            return (
              <View
                key={entry.id}
                style={[
                  styles.row,
                  entry.isCurrentUser && styles.rowCurrent,
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
                    <MedalIcon size={20} color={LIENZO.color.goldInk} weight="duotone" />
                  ) : (
                    <Text style={styles.rankNumber}>{rank}</Text>
                  )}
                </View>

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
                    <FlameIcon size={16} color={LIENZO.color.gold} weight="duotone" />
                    <Text style={styles.streakInlineText}>
                      {entry.streakCount === 1 ? '1 día' : `${entry.streakCount} días`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.xpText}>{entry.xp} XP</Text>
              </View>
            );
          })}
        </View>
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
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 38,
    paddingBottom: LIENZO.space.xxxl,
  },
  header: {
    marginBottom: LIENZO.space.lg,
  },
  subtitle: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.ms,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.banner,
    padding: LIENZO.space.lg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
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
    marginTop: 2,
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
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    marginTop: LIENZO.space.xxl,
    marginBottom: LIENZO.space.sm,
  },
  list: {
    gap: LIENZO.space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.md,
    paddingVertical: LIENZO.space.md,
    paddingHorizontal: LIENZO.space.ms,
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
    width: 38,
    height: 38,
    borderRadius: LIENZO.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankNumber: {
    ...LIENZO.type.smallBold,
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
  },
  xpText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
    flexShrink: 0,
  },
});

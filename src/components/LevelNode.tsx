import {
  CaretRightIcon,
  CheckCircleIcon,
  CrownIcon,
  LockIcon,
  StarIcon,
} from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LIENZO, getCategoryTheme } from '@/constants/theme';
import type { Level, LevelProgress } from '@/types/trivia';

interface LevelNodeProps {
  level: Level;
  progress?: LevelProgress;
  isLockedByOrder: boolean;
  isLockedByPremium: boolean;
  isNextRecommended: boolean;
  onPress: () => void;
}

const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Inicial',
  2: 'Intermedio',
  3: 'Avanzado',
};

export function LevelNode({
  level,
  progress,
  isLockedByOrder,
  isLockedByPremium,
  isNextRecommended,
  onPress,
}: LevelNodeProps) {
  const theme = getCategoryTheme(level.topicSlug);
  const completed = Boolean(progress && progress.stars > 0);
  const locked = isLockedByOrder || isLockedByPremium;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Nivel ${level.levelNumber}: ${level.title}. ${
        isLockedByPremium
          ? 'Disponible en plan Pro'
          : isLockedByOrder
            ? 'Completá el nivel anterior para desbloquearlo'
            : completed
              ? `Completado con ${progress?.stars ?? 0} de 3 estrellas`
              : 'Disponible para jugar'
      }`}
      style={({ pressed }) => [
        styles.card,
        isNextRecommended && !locked && { borderColor: theme.color, borderWidth: 2 },
        locked && styles.cardMuted,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.badge,
          completed
            ? { backgroundColor: LIENZO.color.successSoft }
            : locked
              ? { backgroundColor: LIENZO.color.track }
              : { backgroundColor: theme.soft },
        ]}
      >
        {completed ? (
          <CheckCircleIcon size={24} color={LIENZO.color.success} weight="duotone" />
        ) : isLockedByPremium ? (
          <CrownIcon size={24} color={LIENZO.color.goldInk} weight="duotone" />
        ) : isLockedByOrder ? (
          <LockIcon size={22} color={LIENZO.color.ink2} weight="regular" />
        ) : (
          <Text style={[styles.badgeNumber, { color: theme.color }]}>{level.levelNumber}</Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.levelTag, { color: locked ? LIENZO.color.ink2 : theme.color }]}>
            Nivel {level.levelNumber} · {DIFFICULTY_LABELS[level.difficulty]}
          </Text>
          {level.isPremium ? (
            <View style={styles.proChip}>
              <Text style={styles.proChipText}>Pro</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, locked && styles.mutedText]}>{level.title}</Text>
        {level.subtitle ? <Text style={styles.subtitle}>{level.subtitle}</Text> : null}

        <View style={styles.footerRow}>
          <View style={styles.starsRow}>
            {[1, 2, 3].map((n) => {
              const earned = (progress?.stars ?? 0) >= n;
              return (
                <StarIcon
                  key={n}
                  size={18}
                  color={earned ? LIENZO.color.gold : LIENZO.color.line}
                  weight={earned ? 'duotone' : 'regular'}
                />
              );
            })}
          </View>
          <Text style={styles.questionsCount}>
            {completed
              ? `Mejor: ${progress?.bestScore}/${progress?.totalQuestions}`
              : `${level.questionsPerRound} preguntas`}
          </Text>
        </View>
      </View>

      <CaretRightIcon
        size={22}
        color={locked ? LIENZO.color.ink2 : theme.color}
        weight="regular"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.ms,
    padding: LIENZO.space.ms,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    minHeight: 84,
  },
  cardMuted: {
    backgroundColor: LIENZO.color.bg,
  },
  pressed: {
    backgroundColor: LIENZO.color.track,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: LIENZO.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeNumber: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: LIENZO.font.bold,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    flexWrap: 'wrap',
  },
  levelTag: {
    ...LIENZO.type.captionBold,
  },
  proChip: {
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proChipText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.goldInk,
  },
  title: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  mutedText: {
    color: LIENZO.color.ink2,
  },
  subtitle: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: LIENZO.space.sm,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  questionsCount: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
});

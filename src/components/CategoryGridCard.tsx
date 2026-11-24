import { CheckCircleIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { LIENZO, getCategoryTheme } from '@/constants/theme';
import type { Topic } from '@/types/trivia';

interface CategoryGridCardProps {
  topic: Topic;
  completedCount: number;
  totalCount: number;
  fullWidth?: boolean;
  cardWidth?: number;
  isCompleted?: boolean;
  onPress: () => void;
}

export function CategoryGridCard({
  topic,
  completedCount,
  totalCount,
  fullWidth = false,
  cardWidth,
  isCompleted: isCompletedProp,
  onPress,
}: CategoryGridCardProps) {
  const theme = getCategoryTheme(topic.slug);
  const safeTotal = Math.max(totalCount, 1);
  const pct = Math.min(100, Math.round((completedCount / safeTotal) * 100));
  const isCompleted = isCompletedProp ?? (totalCount > 0 && completedCount >= totalCount);
  const isNew = !isCompleted && completedCount === 0;

  if (fullWidth) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${topic.title}, ${
          isNew ? 'Nuevo' : `${completedCount} de ${safeTotal} respondidas`
        }`}
        style={({ pressed }) => [styles.wideCard, pressed && styles.pressed]}
      >
        <View style={[styles.iconBox, { backgroundColor: theme.soft }]}>
          <CategoryIcon name={topic.icon} color={theme.color} size={26} />
        </View>

        <View style={styles.wideBody}>
          <View style={styles.wideTopRow}>
            <Text style={styles.name}>{topic.title}</Text>
            {isNew ? (
              <Text style={[styles.newLabel, { color: theme.color }]}>Nuevo</Text>
            ) : (
              <Text style={styles.count}>
                {completedCount}/{safeTotal}
              </Text>
            )}
          </View>
          <View style={styles.barTrack}>
            <View
              style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.color }]}
            />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}, ${
        isCompleted
          ? 'Completada'
          : isNew
            ? 'Nuevo'
            : `${completedCount} de ${safeTotal} respondidas`
      }`}
      style={({ pressed }) => [
        styles.tile,
        cardWidth ? [styles.tileCompact, { width: cardWidth }] : null,
        isCompleted && styles.tileCompleted,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tileTop}>
        <View style={[styles.iconBox, cardWidth ? styles.iconBoxCompact : null, { backgroundColor: theme.soft }]}>
          <CategoryIcon name={topic.icon} color={theme.color} size={cardWidth ? 22 : 26} />
        </View>

        {isCompleted ? (
          <View style={styles.donePill}>
            <CheckCircleIcon size={13} color={LIENZO.color.success} weight="duotone" />
            <Text style={styles.donePillText}>Lista</Text>
          </View>
        ) : isNew ? (
          <View style={[styles.newPill, { backgroundColor: theme.soft }]}>
            <Text style={[styles.newPillText, { color: theme.color }]}>Nuevo</Text>
          </View>
        ) : (
          <Text style={styles.count}>
            {completedCount}/{safeTotal}
          </Text>
        )}
      </View>

      <Text style={[styles.name, cardWidth ? styles.nameCompact : null]} numberOfLines={2}>
        {topic.title}
      </Text>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${isCompleted ? 100 : pct}%`,
              backgroundColor: isCompleted ? LIENZO.color.success : theme.color,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48.2%',
    flexGrow: 1,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 126,
    gap: 10,
  },
  tileCompact: {
    flexGrow: 0,
    padding: 12,
    minHeight: 112,
    gap: 8,
  },
  tileCompleted: {
    borderColor: LIENZO.color.successSoft,
  },
  iconBoxCompact: {
    width: 38,
    height: 38,
  },
  nameCompact: {
    fontSize: 15,
    lineHeight: 19,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  donePillText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.successInk,
  },
  wideCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 14,
    minHeight: 74,
  },
  pressed: {
    backgroundColor: LIENZO.color.track,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: LIENZO.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wideBody: {
    flex: 1,
    gap: 8,
  },
  wideTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
  },
  barTrack: {
    height: 6,
    backgroundColor: LIENZO.color.track,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  newPill: {
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
  },
  newLabel: {
    ...LIENZO.type.captionBold,
  },
  count: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
});

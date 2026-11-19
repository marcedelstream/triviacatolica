import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { LIENZO, getCategoryTheme } from '@/constants/theme';
import type { Topic } from '@/types/trivia';

interface CategoryCardProps {
  topic: Topic;
  completedCount: number;
  totalCount: number;
  showDescription?: boolean;
  compact?: boolean;
  onPress: () => void;
}

export function CategoryCard({
  topic,
  completedCount,
  totalCount,
  showDescription = false,
  compact = false,
  onPress,
}: CategoryCardProps) {
  const theme = getCategoryTheme(topic.slug);
  const safeTotal = Math.max(totalCount, 1);
  const pct = Math.min(100, Math.round((completedCount / safeTotal) * 100));
  const isNew = completedCount === 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}, ${
        isNew ? 'Nuevo' : `${completedCount} de ${safeTotal} respondidas`
      }`}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          compact && styles.iconBoxCompact,
          { backgroundColor: theme.soft },
        ]}
      >
        <CategoryIcon
          name={topic.icon}
          color={theme.color}
          size={compact ? 20 : 26}
        />
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, compact && styles.nameCompact]}>{topic.title}</Text>
        {showDescription && topic.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {topic.description}
          </Text>
        ) : null}
        <View style={[styles.barTrack, compact && styles.barTrackCompact]}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: theme.color },
            ]}
          />
        </View>
      </View>

      {isNew ? (
        <Text style={[styles.newLabel, { color: theme.color }]}>Nuevo</Text>
      ) : (
        <Text style={styles.count}>
          {completedCount}/{safeTotal}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.ms,
    paddingVertical: LIENZO.space.md,
    paddingHorizontal: LIENZO.space.ms,
    marginTop: LIENZO.space.sm,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    minHeight: 72,
  },
  cardCompact: {
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    borderRadius: 14,
    minHeight: 52,
  },
  pressed: {
    backgroundColor: LIENZO.color.track,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: LIENZO.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxCompact: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  nameCompact: {
    fontSize: 15,
    lineHeight: 19,
  },
  description: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 2,
  },
  barTrack: {
    height: 6,
    backgroundColor: LIENZO.color.track,
    borderRadius: 3,
    marginTop: 7,
    overflow: 'hidden',
  },
  barTrackCompact: {
    height: 5,
    marginTop: 5,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  count: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    flexShrink: 0,
  },
  newLabel: {
    ...LIENZO.type.captionBold,
    flexShrink: 0,
  },
});

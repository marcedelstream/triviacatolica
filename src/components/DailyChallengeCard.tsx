import { SparkleIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LIENZO } from '@/constants/theme';

interface DailyChallengeCardProps {
  title: string;
  questionCount: number;
  completedToday: boolean;
  onStart: () => void;
}

export function DailyChallengeCard({
  title,
  questionCount,
  completedToday,
  onStart,
}: DailyChallengeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.tag}>
          {completedToday
            ? `Completado hoy · ${questionCount} preguntas`
            : `Desafío del día · ${questionCount} preguntas`}
        </Text>
        <SparkleIcon size={24} color={LIENZO.color.goldSparkle} weight="duotone" />
      </View>

      <Text style={styles.title}>{title}</Text>

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel={`${completedToday ? 'Volver a jugar' : 'Comenzar'} desafío del día: ${title}`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>
          {completedToday ? 'Volver a jugar' : 'Comenzar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    backgroundColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.banner,
    padding: 14,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: LIENZO.space.sm,
  },
  tag: {
    ...LIENZO.type.caption,
    color: LIENZO.color.onPrimary2,
    flexShrink: 1,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.onPrimary,
    marginTop: 2,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    minHeight: 44,
    backgroundColor: LIENZO.color.bg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: LIENZO.space.lg,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  pressed: {
    opacity: 0.9,
  },
});

import { Image } from 'expo-image';
import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  NewspaperIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { LIENZO } from '@/constants/theme';
import type { VaticanNewsQuizItem } from '@/types/trivia';

interface VaticanNewsSectionProps {
  items: VaticanNewsQuizItem[];
  completedNewsIds: string[];
  onPlayNewsQuiz: (item: VaticanNewsQuizItem) => void;
}

const CARD_GAP = 12;

function formatShortDate(iso: string): string {
  try {
    const date = new Date(iso);
    const months = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  } catch {
    return 'Hoy';
  }
}

function getSourceColors(sourceName: string): { bg: string; ink: string } {
  const s = sourceName.toLowerCase();
  if (s.includes('aci')) {
    return { bg: LIENZO.color.goldSoft, ink: LIENZO.color.goldInk };
  }
  if (s.includes('aleteia')) {
    return { bg: LIENZO.category.liturgia.soft, ink: LIENZO.category.liturgia.color };
  }
  return { bg: LIENZO.color.primarySoft, ink: LIENZO.color.primaryInk };
}

export function VaticanNewsSection({
  items,
  completedNewsIds,
  onPlayNewsQuiz,
}: VaticanNewsSectionProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items.length) return null;

  const containerWidth = Math.min(width, LIENZO.maxPhoneWidth);
  const cardWidth = Math.max(276, containerWidth - 68);

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Ignorar si no hay navegador disponible
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (cardWidth + CARD_GAP));
    if (idx >= 0 && idx < items.length) {
      setActiveIndex(idx);
    }
  };

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <NewspaperIcon size={22} color={LIENZO.color.primary} weight="duotone" />
          <Text style={styles.sectionTitle}>Nuevas noticias</Text>
        </View>
        <Text style={styles.sourcesHint}>Vatican News · ACI · Aleteia</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {items.map((item) => {
          const isCompleted = completedNewsIds.includes(item.id);
          const sourceColors = getSourceColors(item.sourceName);

          return (
            <View key={item.id} style={[styles.card, { width: cardWidth }]}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={160}
                />
              ) : null}

              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <View style={[styles.tagChip, { backgroundColor: sourceColors.bg }]}>
                    <Text style={[styles.tagText, { color: sourceColors.ink }]}>
                      {item.sourceName}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {item.sectionLabel} · {formatShortDate(item.publishedAt)}
                  </Text>
                  {isCompleted ? (
                    <View style={styles.doneChip}>
                      <CheckCircleIcon
                        size={14}
                        color={LIENZO.color.success}
                        weight="duotone"
                      />
                      <Text style={styles.doneText}>Jugado</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                <Text style={styles.summary} numberOfLines={2}>
                  {item.summary}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => onPlayNewsQuiz(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Jugar quiz de la noticia: ${item.title}`}
                    style={({ pressed }) => [styles.quizBtn, pressed && styles.pressed]}
                  >
                    <SparkleIcon size={17} color={LIENZO.color.primaryInk} weight="duotone" />
                    <Text style={styles.quizBtnText}>
                      {isCompleted
                        ? `Repetir quiz (${item.questions.length})`
                        : `Jugar quiz (${item.questions.length})`}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void handleOpenUrl(item.url)}
                    accessibilityRole="link"
                    accessibilityLabel={`Leer noticia completa en ${item.sourceName}: ${item.title}`}
                    style={({ pressed }) => [styles.readBtn, pressed && styles.pressed]}
                  >
                    <ArrowSquareOutIcon
                      size={17}
                      color={LIENZO.color.ink2}
                      weight="regular"
                    />
                    <Text style={styles.readBtnText}>Leer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dotsRow}>
          {items.map((item, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  isCurrent
                    ? { width: 18, backgroundColor: LIENZO.color.primary }
                    : { width: 6, backgroundColor: LIENZO.color.line },
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: LIENZO.space.sm,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  sourcesHint: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink2,
  },
  carousel: {
    marginHorizontal: -LIENZO.space.xl,
  },
  carouselContent: {
    paddingHorizontal: LIENZO.space.xl,
    gap: CARD_GAP,
  },
  card: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: 122,
    backgroundColor: LIENZO.color.track,
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagChip: {
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
  },
  dateText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink2,
  },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  doneText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.successInk,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
  },
  summary: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quizBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  quizBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.primaryInk,
  },
  readBtn: {
    minHeight: 46,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
  },
  readBtnText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink,
  },
  pressed: {
    opacity: 0.85,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

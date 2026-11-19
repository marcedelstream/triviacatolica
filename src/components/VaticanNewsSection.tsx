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
} from 'react-native';

import { LIENZO } from '@/constants/theme';
import { VATICAN_NEWS_PORTAL_URL } from '@/services/newsService';
import type { VaticanNewsQuizItem } from '@/types/trivia';

interface VaticanNewsSectionProps {
  items: VaticanNewsQuizItem[];
  completedNewsIds: string[];
  onPlayNewsQuiz: (item: VaticanNewsQuizItem) => void;
}

const CARD_WIDTH = 276;
const CARD_GAP = 10;

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

export function VaticanNewsSection({
  items,
  completedNewsIds,
  onPlayNewsQuiz,
}: VaticanNewsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items.length) return null;

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
    const idx = Math.round(x / (CARD_WIDTH + CARD_GAP));
    if (idx >= 0 && idx < items.length) {
      setActiveIndex(idx);
    }
  };

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <NewspaperIcon size={20} color={LIENZO.color.primary} weight="duotone" />
          <Text style={styles.sectionTitle}>Vatican News</Text>
        </View>

        <Pressable
          onPress={() => void handleOpenUrl(VATICAN_NEWS_PORTAL_URL)}
          hitSlop={10}
          accessibilityRole="link"
          accessibilityLabel="Abrir portal Vatican News en español"
        >
          <Text style={styles.portalLink}>Ver portal</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {items.map((item) => {
          const isCompleted = completedNewsIds.includes(item.id);

          return (
            <View key={item.id} style={styles.card}>
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
                  <View style={styles.tagChip}>
                    <Text style={styles.tagText}>{item.sectionLabel}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatShortDate(item.publishedAt)}</Text>
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

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => onPlayNewsQuiz(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Jugar quiz de la noticia: ${item.title}`}
                    style={({ pressed }) => [styles.quizBtn, pressed && styles.pressed]}
                  >
                    <SparkleIcon size={16} color={LIENZO.color.primaryInk} weight="duotone" />
                    <Text style={styles.quizBtnText}>
                      {isCompleted
                        ? `Repetir (${item.questions.length})`
                        : `Quiz (${item.questions.length})`}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void handleOpenUrl(item.url)}
                    accessibilityRole="link"
                    accessibilityLabel={`Leer noticia completa en Vatican News: ${item.title}`}
                    style={({ pressed }) => [styles.readBtn, pressed && styles.pressed]}
                  >
                    <ArrowSquareOutIcon
                      size={16}
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
                    ? { width: 16, backgroundColor: LIENZO.color.primary }
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
    marginTop: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
  },
  portalLink: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primary,
  },
  carousel: {
    marginHorizontal: -LIENZO.space.xl,
  },
  carouselContent: {
    paddingHorizontal: LIENZO.space.xl,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: 98,
    backgroundColor: LIENZO.color.track,
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagChip: {
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
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
    paddingHorizontal: 7,
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
    fontSize: 15,
    lineHeight: 20,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
    minHeight: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  quizBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  quizBtnText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  readBtn: {
    minHeight: 42,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },
  readBtnText: {
    ...LIENZO.type.captionBold,
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
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
});

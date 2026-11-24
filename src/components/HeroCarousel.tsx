import { Image } from 'expo-image';
import {
  ArrowSquareOutIcon,
  BookOpenTextIcon,
  CaretRightIcon,
  CheckCircleIcon,
  SparkleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  Linking,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { LIENZO, getBannerTheme } from '@/constants/theme';
import type { BannerItem } from '@/types/trivia';

interface HeroCarouselProps {
  dailyTitle: string;
  dailySubtitle?: string;
  dailyReadingsLabel?: string;
  dailyQuestionCount: number;
  dailyCompletedToday: boolean;
  onStartDaily: () => void;
  onReadDaily?: () => void;
  banners: BannerItem[];
}

const SLIDE_GAP = 12;

export function HeroCarousel({
  dailyTitle,
  dailySubtitle,
  dailyReadingsLabel,
  dailyQuestionCount,
  dailyCompletedToday,
  onStartDaily,
  onReadDaily,
  banners,
}: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);

  // Tarjeta ancha con pequeño asomo de la siguiente para invitar a deslizar
  const containerWidth = Math.min(width, LIENZO.maxPhoneWidth);
  const cardWidth = Math.max(280, containerWidth - 52);
  const totalSlides = 1 + banners.length;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (cardWidth + SLIDE_GAP));
    if (idx >= 0 && idx < totalSlides) {
      setActiveIndex(idx);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Silencioso si no hay navegador
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + SLIDE_GAP}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Slide 1: Desafío del día — bloque compacto */}
        <View style={[styles.dailyCard, { width: cardWidth }]}>
          <View style={styles.dailyTagPill}>
            {dailyCompletedToday ? (
              <CheckCircleIcon size={15} color={LIENZO.color.goldSparkle} weight="duotone" />
            ) : (
              <SparkleIcon size={15} color={LIENZO.color.goldSparkle} weight="duotone" />
            )}
            <Text style={styles.dailyTag} numberOfLines={1}>
              {dailyCompletedToday
                ? 'Completado hoy · Volvé mañana'
                : dailyReadingsLabel
                  ? `Desafío · ${dailyReadingsLabel}`
                  : `Desafío del día · ${dailyQuestionCount} preguntas`}
            </Text>
          </View>

          <Text style={styles.dailyTitle} numberOfLines={1}>
            {dailyTitle}
          </Text>

          {dailyCompletedToday ? (
            <Pressable
              onPress={onReadDaily ?? onStartDaily}
              accessibilityRole="button"
              accessibilityLabel={`Leer las lecturas de hoy: ${dailyTitle}`}
              style={({ pressed }) => [styles.dailyBtnDone, pressed && styles.pressed]}
            >
              <BookOpenTextIcon size={16} color={LIENZO.color.onPrimary} weight="duotone" />
              <Text style={styles.dailyBtnDoneText}>Ver lecturas de hoy</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onStartDaily}
              accessibilityRole="button"
              accessibilityLabel={`Leer lecturas y comenzar desafío del día: ${dailyTitle}`}
              style={({ pressed }) => [styles.dailyBtn, pressed && styles.pressed]}
            >
              <BookOpenTextIcon size={16} color={LIENZO.color.primaryInk} weight="duotone" />
              <Text style={styles.dailyBtnText}>Leer lecturas y jugar</Text>
            </Pressable>
          )}
        </View>

        {/* Slides 2+: Banners compactos */}
        {banners.map((banner) => {
          const theme = getBannerTheme(banner.tipo);
          return (
            <Pressable
              key={banner.id}
              onPress={() => setSelectedBanner(banner)}
              accessibilityRole="button"
              accessibilityLabel={`${theme.label}: ${banner.titulo}. ${banner.texto}`}
              style={({ pressed }) => [
                styles.bannerCard,
                { width: cardWidth, backgroundColor: theme.soft },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bannerTop}>
                {banner.imagen ? (
                  <Image
                    source={{ uri: banner.imagen }}
                    style={styles.bannerImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.bannerIconBox}>
                    <CategoryIcon name={theme.icon} color={theme.color} size={20} />
                  </View>
                )}

                <View style={styles.bannerTagPill}>
                  <Text style={[styles.bannerTag, { color: theme.color }]}>
                    {theme.label}
                  </Text>
                </View>

                <View style={styles.bannerArrow}>
                  <CaretRightIcon size={18} color={theme.color} weight="regular" />
                </View>
              </View>

              <Text style={styles.bannerTitle} numberOfLines={1}>
                {banner.titulo}
              </Text>
              <Text style={styles.bannerText} numberOfLines={1}>
                {banner.texto}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Indicadores de carrusel */}
      {totalSlides > 1 ? (
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSlides }).map((_, idx) => {
            const isCurrent = idx === activeIndex;
            const activeColor =
              idx === 0
                ? LIENZO.color.primary
                : getBannerTheme(banners[idx - 1]?.tipo ?? 'novedad').color;
            return (
              <View
                key={`hero-dot-${idx}`}
                style={[
                  styles.dot,
                  isCurrent
                    ? { width: 20, backgroundColor: activeColor }
                    : { width: 6, backgroundColor: LIENZO.color.line },
                ]}
              />
            );
          })}
        </View>
      ) : null}

      {/* Modal de detalle del banner */}
      <Modal
        visible={Boolean(selectedBanner)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBanner(null)}
      >
        {selectedBanner ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalTagChip,
                    { backgroundColor: getBannerTheme(selectedBanner.tipo).soft },
                  ]}
                >
                  <CategoryIcon
                    name={getBannerTheme(selectedBanner.tipo).icon}
                    color={getBannerTheme(selectedBanner.tipo).color}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.modalTagText,
                      { color: getBannerTheme(selectedBanner.tipo).color },
                    ]}
                  >
                    {getBannerTheme(selectedBanner.tipo).label}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSelectedBanner(null)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar aviso"
                >
                  <XIcon size={22} color={LIENZO.color.ink} weight="regular" />
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>{selectedBanner.titulo}</Text>
              <Text style={styles.modalText}>{selectedBanner.texto}</Text>

              {selectedBanner.link ? (
                <Pressable
                  onPress={() => void handleOpenLink(selectedBanner.link!)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="link"
                >
                  <ArrowSquareOutIcon size={20} color={LIENZO.color.onPrimary} weight="regular" />
                  <Text style={styles.primaryBtnText}>Abrir enlace</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setSelectedBanner(null)}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 14,
  },
  scroll: {
    marginHorizontal: -LIENZO.space.xl,
  },
  scrollContent: {
    paddingHorizontal: LIENZO.space.xl,
    gap: SLIDE_GAP,
  },
  dailyCard: {
    backgroundColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.card,
    padding: 14,
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 118,
  },
  dailyTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dailyTag: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.onPrimary2,
    flexShrink: 1,
  },
  dailyTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.onPrimary,
  },
  dailyBtn: {
    width: '100%',
    minHeight: 40,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.icon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: LIENZO.space.md,
  },
  dailyBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.primaryInk,
  },
  dailyBtnDone: {
    width: '100%',
    minHeight: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: LIENZO.borderWidth.card,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: LIENZO.radius.icon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: LIENZO.space.md,
  },
  dailyBtnDoneText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.onPrimary,
  },
  bannerCard: {
    borderRadius: LIENZO.radius.card,
    padding: 14,
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 118,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImg: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  bannerTagPill: {
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  bannerTag: {
    ...LIENZO.type.captionBold,
  },
  bannerArrow: {
    marginLeft: 'auto',
  },
  bannerTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
  },
  bannerText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  pressed: {
    opacity: 0.9,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LIENZO.space.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.block,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.xl,
    gap: LIENZO.space.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 6,
  },
  modalTagText: {
    ...LIENZO.type.captionBold,
  },
  closeBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  modalTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  modalText: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  primaryBtn: {
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: LIENZO.space.lg,
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
});

import { Image } from 'expo-image';
import { CaretRightIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { LIENZO, getBannerTheme } from '@/constants/theme';
import type { BannerItem } from '@/types/trivia';

interface BannerCarouselProps {
  banners: BannerItem[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);

  const safeIndex = banners.length > 0 ? activeIndex % banners.length : 0;
  const activeBanner = banners[safeIndex];

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 7000); // Rotación automática lenta (>= 6s según LINEA_GRAFICA.md)
    return () => clearInterval(id);
  }, [banners.length, paused]);

  if (!activeBanner) return null;

  const theme = getBannerTheme(activeBanner.tipo);

  const handlePressBanner = () => {
    setPaused(true);
    setSelectedBanner(activeBanner);
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Silencioso si no hay navegador disponible
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePressBanner}
        accessibilityRole="button"
        accessibilityLabel={`${theme.label}: ${activeBanner.titulo}. ${activeBanner.texto}`}
        style={({ pressed }) => [
          styles.banner,
          { backgroundColor: theme.soft },
          pressed && styles.pressed,
        ]}
      >
        {activeBanner.imagen ? (
          <Image
            source={{ uri: activeBanner.imagen }}
            style={styles.bannerImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.iconBox}>
            <CategoryIcon name={theme.icon} color={theme.color} size={22} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.tagLine}>
            <Text style={[styles.tag, { color: theme.color }]}>{theme.label}</Text>
            <Text style={styles.title} numberOfLines={1}>
              · {activeBanner.titulo}
            </Text>
          </View>
          <Text style={styles.text} numberOfLines={1}>
            {activeBanner.texto}
          </Text>
        </View>

        <CaretRightIcon size={18} color={theme.color} weight="regular" />
      </Pressable>

      {banners.length > 1 && (
        <View style={styles.dotsRow} accessibilityRole="tablist">
          {banners.map((item, idx) => {
            const isCurrent = idx === safeIndex;
            const dotTheme = getBannerTheme(item.tipo);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setPaused(true);
                  setActiveIndex(idx);
                }}
                hitSlop={12}
                accessibilityRole="tab"
                accessibilityState={{ selected: isCurrent }}
                accessibilityLabel={`Ver aviso ${idx + 1} de ${banners.length}`}
                style={styles.dotHit}
              >
                <View
                  style={[
                    styles.dot,
                    isCurrent
                      ? { width: 18, backgroundColor: dotTheme.color }
                      : { width: 6, backgroundColor: LIENZO.color.line },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal
        visible={Boolean(selectedBanner)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBanner(null)}
      >
        {selectedBanner && (
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
                  onPress={() => handleOpenLink(selectedBanner.link!)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
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
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: LIENZO.radius.card,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 10,
    minHeight: 60,
  },
  pressed: {
    opacity: 0.88,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  tagLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tag: {
    ...LIENZO.type.navActive,
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
    flexShrink: 1,
  },
  text: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dotHit: {
    paddingVertical: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
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
    maxWidth: 390,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.lg,
    marginTop: LIENZO.space.xs,
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

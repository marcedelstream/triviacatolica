import { GlobeHemisphereWestIcon, XIcon } from 'phosphor-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';
import { COUNTRY_OPTIONS } from '@/data/countries';

interface CountryPromptModalProps {
  visible: boolean;
  selectedCountry?: string | null;
  onSelectCountry: (code: string) => void;
  onClose: () => void;
}

export function CountryPromptModal({
  visible,
  selectedCountry,
  onSelectCountry,
  onClose,
}: CountryPromptModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconBox}>
                <GlobeHemisphereWestIcon
                  size={22}
                  color={LIENZO.color.primary}
                  weight="duotone"
                />
              </View>
              <View style={styles.titleCol}>
                <Text style={styles.title}>Sumá tu bandera al Ranking</Text>
                <Text style={styles.sub}>
                  Elegí tu país para competir en el ranking nacional y mundial.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de país"
            >
              <XIcon size={22} color={LIENZO.color.ink} weight="regular" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {COUNTRY_OPTIONS.map((c) => {
              const active = selectedCountry?.toUpperCase() === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => onSelectCountry(c.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}`}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <Text
                    style={[styles.name, active && styles.nameActive]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={styles.skipBtn}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Elegir más tarde</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    maxWidth: LIENZO.maxPhoneWidth + 40,
    alignSelf: 'center',
    maxHeight: '80%',
    backgroundColor: LIENZO.color.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: LIENZO.borderWidth.card,
    borderLeftWidth: LIENZO.borderWidth.card,
    borderRightWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    paddingTop: 10,
    paddingHorizontal: LIENZO.space.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIENZO.color.line,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: LIENZO.space.sm,
    paddingBottom: 12,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  title: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  sub: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 2,
  },
  closeBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 340,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 14,
  },
  chip: {
    width: '48.2%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 48,
    backgroundColor: LIENZO.color.bg,
  },
  chipActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  flag: {
    fontSize: 20,
  },
  name: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink,
    flex: 1,
  },
  nameActive: {
    color: LIENZO.color.primaryInk,
  },
  pressed: {
    opacity: 0.85,
  },
  skipBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  skipText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
});

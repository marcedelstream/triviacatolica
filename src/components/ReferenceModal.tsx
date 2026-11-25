import { BookBookmarkIcon, BookOpenTextIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LIENZO } from '@/constants/theme';
import { lookupReferenceText, type ReferenceTextEntry } from '@/data/scriptureCicBank';

interface ReferenceModalProps {
  referenceToken: string | null;
  onClose: () => void;
}

export function ReferenceModal({ referenceToken, onClose }: ReferenceModalProps) {
  // Guarda el resultado junto con la referencia que lo pidió: así "cargando" y el
  // texto a mostrar se derivan en el render, sin setState sincrónico en el efecto.
  const [result, setResult] = useState<{
    token: string;
    entry: ReferenceTextEntry | null;
  } | null>(null);

  useEffect(() => {
    if (!referenceToken) return;
    let active = true;
    void lookupReferenceText(referenceToken).then((res) => {
      if (active) setResult({ token: referenceToken, entry: res });
    });
    return () => {
      active = false;
    };
  }, [referenceToken]);

  const isCurrent = Boolean(referenceToken) && result?.token === referenceToken;
  const loading = Boolean(referenceToken) && !isCurrent;
  const entry = isCurrent ? (result?.entry ?? null) : null;

  const isBible = entry?.sourceType === 'biblia';
  const badgeBg = isBible ? LIENZO.color.primarySoft : LIENZO.color.goldSoft;
  const badgeColor = isBible ? LIENZO.color.primaryInk : LIENZO.color.goldInk;
  const badgeLabel = isBible
    ? 'Sagrada Escritura'
    : entry?.sourceType === 'cic'
      ? 'Catecismo (CIC)'
      : 'Referencia';

  return (
    <Modal
      visible={Boolean(referenceToken)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              {isBible ? (
                <BookOpenTextIcon size={18} color={badgeColor} weight="duotone" />
              ) : (
                <BookBookmarkIcon size={18} color={badgeColor} weight="duotone" />
              )}
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar lectura"
            >
              <XIcon size={22} color={LIENZO.color.ink} weight="regular" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={LIENZO.color.primary} />
            </View>
          ) : entry ? (
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{entry.title}</Text>
              {entry.bookOrSection ? (
                <Text style={styles.section}>{entry.bookOrSection}</Text>
              ) : null}
              <Text style={styles.passage}>{entry.body}</Text>
            </ScrollView>
          ) : null}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Cerrar y volver al quiz</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LIENZO.space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 410,
    maxHeight: '80%',
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.block,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.xl,
    gap: LIENZO.space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LIENZO.space.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 6,
  },
  badgeText: {
    ...LIENZO.type.captionBold,
  },
  closeBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  bodyScroll: {
    maxHeight: 300,
  },
  bodyContent: {
    gap: 8,
  },
  title: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  section: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  passage: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
    marginTop: 4,
  },
  primaryBtn: {
    width: '100%',
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.lg,
  },
  primaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});

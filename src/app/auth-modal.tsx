import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppleLogoIcon,
  GoogleLogoIcon,
  ShieldCheckIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenFrame } from '@/components/ScreenFrame';
import { LIENZO } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';

export default function AuthModalScreen() {
  const router = useRouter();
  const { nextLevelId } = useLocalSearchParams<{ nextLevelId?: string }>();
  const profile = useGameStore((s) => s.profile);
  const linkAccount = useGameStore((s) => s.linkAccount);
  const dismissSoftAuth = useGameStore((s) => s.dismissSoftAuth);

  const [name, setName] = useState(
    profile.displayName === 'Peregrino' ? '' : profile.displayName
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const proceedAfterClose = () => {
    if (nextLevelId) {
      router.replace({
        pathname: '/play/[levelId]',
        params: { levelId: nextLevelId },
      });
    } else {
      router.back();
    }
  };

  const handleLink = async (provider: 'google' | 'apple') => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);
    const res = await linkAccount(provider, name.trim() || undefined);
    setIsLoading(false);
    if (res.ok) {
      proceedAfterClose();
    } else {
      setStatusMessage(res.message);
    }
  };

  const handleSkip = () => {
    dismissSoftAuth();
    proceedAfterClose();
  };

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Text style={styles.topTitle}>Guardar progreso</Text>
        <Pressable
          onPress={handleSkip}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <XIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <ShieldCheckIcon size={38} color={LIENZO.color.primary} weight="duotone" />
        </View>

        <Text style={styles.title}>Conservá tu racha y tus estrellas</Text>
        <Text style={styles.body}>
          Al vincular tu cuenta mantenés todo lo que ya jugaste ({profile.xp} XP y tu racha actual)
          sin empezar de cero si cambiás de teléfono.
        </Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>¿Cómo querés que te saludemos? (opcional)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej.: Marta"
            placeholderTextColor={LIENZO.color.ink2}
            style={styles.input}
          />
        </View>

        {statusMessage ? <Text style={styles.errorText}>{statusMessage}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => void handleLink('google')}
            disabled={isLoading}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <GoogleLogoIcon size={22} color={LIENZO.color.onPrimary} weight="duotone" />
            <Text style={styles.primaryBtnText}>Continuar con Google</Text>
          </Pressable>

          <Pressable
            onPress={() => void handleLink('apple')}
            disabled={isLoading}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <AppleLogoIcon size={22} color={LIENZO.color.ink} weight="duotone" />
            <Text style={styles.secondaryBtnText}>Continuar con Apple</Text>
          </Pressable>

          <Pressable
            onPress={handleSkip}
            style={styles.skipBtn}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Seguir como invitado por ahora</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: LIENZO.space.sm,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  topSpacer: {
    width: LIENZO.touchMin,
  },
  topTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  closeBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.xxl,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.lg,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  body: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink,
  },
  input: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 12,
    minHeight: LIENZO.buttonMinHeight,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
    backgroundColor: LIENZO.color.bg,
  },
  errorText: {
    ...LIENZO.type.small,
    color: LIENZO.color.danger,
    textAlign: 'center',
  },
  actions: {
    gap: LIENZO.space.sm,
    marginTop: LIENZO.space.xs,
  },
  primaryBtn: {
    width: '100%',
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.lg,
  },
  primaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  secondaryBtn: {
    width: '100%',
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.lg,
  },
  secondaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.ink,
  },
  skipBtn: {
    minHeight: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: LIENZO.space.xs,
  },
  skipText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  pressed: {
    opacity: 0.9,
  },
});

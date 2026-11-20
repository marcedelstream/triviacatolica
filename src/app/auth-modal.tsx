import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppleLogoIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GoogleLogoIcon,
  ShieldCheckIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenFrame } from '@/components/ScreenFrame';
import { LIENZO } from '@/constants/theme';
import { sendEmailOtp } from '@/services/authService';
import { useGameStore } from '@/store/useGameStore';

export default function AuthModalScreen() {
  const router = useRouter();
  const { nextLevelId } = useLocalSearchParams<{ nextLevelId?: string }>();
  const profile = useGameStore((s) => s.profile);
  const linkAccount = useGameStore((s) => s.linkAccount);
  const completeEmailOtpLogin = useGameStore((s) => s.completeEmailOtpLogin);
  const dismissSoftAuth = useGameStore((s) => s.dismissSoftAuth);

  const [name, setName] = useState(
    profile.displayName === 'Peregrino' ? '' : profile.displayName
  );
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const handleSendCode = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    const res = await sendEmailOtp(email);
    setIsLoading(false);
    if (res.ok) {
      setOtpStep('code');
      setInfoMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleVerifyCode = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    const res = await completeEmailOtpLogin(email, otpCode, name.trim() || undefined);
    setIsLoading(false);
    if (res.ok) {
      proceedAfterClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleLinkOAuth = async (provider: 'google' | 'apple') => {
    if (isLoading) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    const res = await linkAccount(provider, name.trim() || undefined);
    setIsLoading(false);
    if (res.ok) {
      proceedAfterClose();
    } else {
      setErrorMessage(res.message);
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            {otpStep === 'code' ? (
              <EnvelopeSimpleIcon size={36} color={LIENZO.color.primary} weight="duotone" />
            ) : (
              <ShieldCheckIcon size={36} color={LIENZO.color.primary} weight="duotone" />
            )}
          </View>

          <Text style={styles.title}>
            {otpStep === 'code'
              ? 'Ingresá el código de 6 dígitos'
              : 'Conservá tu racha y tus estrellas'}
          </Text>
          <Text style={styles.body}>
            {otpStep === 'code'
              ? `Revisá tu correo (${email.trim().toLowerCase()}) y escribí el código que te enviamos.`
              : `Al iniciar sesión mantenés todo lo que ya jugaste (${profile.xp} XP y tu racha actual) sin empezar de cero.`}
          </Text>

          {infoMessage ? (
            <View style={styles.infoBox}>
              <CheckCircleIcon size={20} color={LIENZO.color.success} weight="duotone" />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {otpStep === 'email' ? (
            <>
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tu nombre (opcional)</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej.: Marta"
                    placeholderTextColor={LIENZO.color.ink2}
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Correo electrónico</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@correo.com"
                    placeholderTextColor={LIENZO.color.ink2}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    returnKeyType="send"
                    onSubmitEditing={() => void handleSendCode()}
                  />
                </View>

                <Pressable
                  onPress={() => void handleSendCode()}
                  disabled={isLoading || !email.trim()}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (isLoading || !email.trim()) && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <EnvelopeSimpleIcon size={22} color={LIENZO.color.onPrimary} weight="duotone" />
                  <Text style={styles.primaryBtnText}>
                    {isLoading ? 'Enviando...' : 'Enviar código al correo'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o también</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.oauthActions}>
                <Pressable
                  onPress={() => void handleLinkOAuth('google')}
                  disabled={isLoading}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <GoogleLogoIcon size={22} color={LIENZO.color.ink} weight="duotone" />
                  <Text style={styles.secondaryBtnText}>Continuar con Google</Text>
                </Pressable>

                <Pressable
                  onPress={() => void handleLinkOAuth('apple')}
                  disabled={isLoading}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <AppleLogoIcon size={22} color={LIENZO.color.ink} weight="duotone" />
                  <Text style={styles.secondaryBtnText}>Continuar con Apple</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.form}>
              <TextInput
                value={otpCode}
                onChangeText={(txt) => setOtpCode(txt.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={LIENZO.color.line}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.otpInput}
                returnKeyType="done"
                onSubmitEditing={() => void handleVerifyCode()}
              />

              <Pressable
                onPress={() => void handleVerifyCode()}
                disabled={isLoading || otpCode.length < 6}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (isLoading || otpCode.length < 6) && styles.disabledBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? 'Verificando...' : 'Verificar e ingresar'}
                </Text>
              </Pressable>

              <View style={styles.otpFooterRow}>
                <Pressable
                  onPress={() => {
                    setOtpStep('email');
                    setOtpCode('');
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  style={styles.textLinkBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.textLink}>Cambiar correo</Text>
                </Pressable>

                <Pressable
                  onPress={() => void handleSendCode()}
                  disabled={isLoading}
                  style={styles.textLinkBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.textLinkPrimary}>Reenviar código</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable onPress={handleSkip} style={styles.skipBtn} accessibilityRole="button">
            <Text style={styles.skipText}>Seguir como invitado por ahora</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LIENZO.space.md,
    paddingTop: 12,
    paddingBottom: 10,
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.xl,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.md,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.icon,
    padding: LIENZO.space.md,
  },
  infoText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.successInk,
    flex: 1,
  },
  errorBox: {
    backgroundColor: LIENZO.color.dangerSoft,
    borderRadius: LIENZO.radius.icon,
    padding: LIENZO.space.md,
  },
  errorText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.danger,
    textAlign: 'center',
  },
  form: {
    gap: LIENZO.space.md,
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
    minHeight: 52,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
    backgroundColor: LIENZO.color.bg,
  },
  otpInput: {
    borderWidth: LIENZO.borderWidth.active,
    borderColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.primarySoft,
    minHeight: 64,
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 10,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
    paddingHorizontal: LIENZO.space.lg,
  },
  otpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textLinkBtn: {
    minHeight: LIENZO.touchMin,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  textLink: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  textLinkPrimary: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.md,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIENZO.color.line,
  },
  dividerText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  oauthActions: {
    gap: LIENZO.space.sm,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 52,
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
    minHeight: 50,
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
  disabledBtn: {
    opacity: 0.5,
  },
  skipBtn: {
    minHeight: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  skipText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  pressed: {
    opacity: 0.9,
  },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppleLogoIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GoogleLogoIcon,
  LockKeyIcon,
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
import { sendEmailOtp, updateUserPassword } from '@/services/authService';
import { useGameStore } from '@/store/useGameStore';

type AuthMode = 'login' | 'signup' | 'otp' | 'otp_verify' | 'set_password';

export default function AuthModalScreen() {
  const router = useRouter();
  const { nextLevelId, reason } = useLocalSearchParams<{
    nextLevelId?: string;
    reason?: string;
  }>();
  const profile = useGameStore((s) => s.profile);
  const linkAccount = useGameStore((s) => s.linkAccount);
  const signInWithPassword = useGameStore((s) => s.signInWithPassword);
  const signUpWithPassword = useGameStore((s) => s.signUpWithPassword);
  const completeEmailOtpLogin = useGameStore((s) => s.completeEmailOtpLogin);
  const dismissSoftAuth = useGameStore((s) => s.dismissSoftAuth);

  const isGuestLimit = reason === 'guest_limit';

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState(
    profile.displayName === 'Peregrino' ? '' : profile.displayName
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const proceedAfterAuthSuccess = () => {
    // Nunca reenviar al onboarding a un usuario que ya inició sesión.
    if (nextLevelId) {
      router.replace({
        pathname: '/play/[levelId]',
        params: { levelId: nextLevelId },
      });
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleClose = () => {
    if (!isGuestLimit) {
      dismissSoftAuth();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handlePasswordSubmit = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = await signInWithPassword(email, password);
      setIsLoading(false);
      if (res.ok) {
        proceedAfterAuthSuccess();
      } else {
        setErrorMessage(res.message);
      }
      return;
    }

    const res = await signUpWithPassword(email, password, name.trim() || undefined);
    setIsLoading(false);
    if (!res.ok) {
      setErrorMessage(res.message);
      return;
    }
    if (res.needsEmailConfirmation) {
      setMode('otp_verify');
      setInfoMessage(res.message);
      return;
    }
    proceedAfterAuthSuccess();
  };

  const handleSendOtp = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    const res = await sendEmailOtp(email);
    setIsLoading(false);
    if (res.ok) {
      setMode('otp_verify');
      setInfoMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    const res = await completeEmailOtpLogin(email, otpCode, name.trim() || undefined);
    setIsLoading(false);
    if (!res.ok) {
      setErrorMessage(res.message);
      return;
    }
    // Si venía del flujo "Entrar con código / Olvidé mi contraseña", ofrecer guardar contraseña ahora
    if (!password) {
      setInfoMessage('¡Sesión verificada! Si querés, elegí una contraseña para entrar más rápido la próxima vez.');
      setMode('set_password');
      return;
    }
    proceedAfterAuthSuccess();
  };

  const handleSaveNewPassword = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    const res = await updateUserPassword(newPassword);
    setIsLoading(false);
    if (res.ok) {
      proceedAfterAuthSuccess();
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
      proceedAfterAuthSuccess();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Text style={styles.topTitle}>
          {mode === 'signup' ? 'Crear cuenta' : 'Tu cuenta'}
        </Text>
        <Pressable
          onPress={handleClose}
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
            {mode === 'otp' || mode === 'otp_verify' ? (
              <EnvelopeSimpleIcon size={36} color={LIENZO.color.primary} weight="duotone" />
            ) : mode === 'set_password' ? (
              <LockKeyIcon size={36} color={LIENZO.color.primary} weight="duotone" />
            ) : (
              <ShieldCheckIcon size={36} color={LIENZO.color.primary} weight="duotone" />
            )}
          </View>

          <Text style={styles.title}>
            {isGuestLimit && (mode === 'login' || mode === 'signup')
              ? '¡Te gustó tu primer quiz!'
              : mode === 'login'
                ? 'Iniciá sesión en tu cuenta'
                : mode === 'signup'
                  ? 'Creá tu cuenta gratis'
                  : mode === 'otp'
                    ? 'Entrar con código al correo'
                    : mode === 'otp_verify'
                      ? 'Ingresá el código de 6 dígitos'
                      : 'Elegí tu contraseña'}
          </Text>

          <Text style={styles.body}>
            {isGuestLimit && (mode === 'login' || mode === 'signup')
              ? `Creá tu cuenta o iniciá sesión para seguir jugando, conservar tus ${profile.xp} XP y entrar al Ranking.`
              : mode === 'otp'
                ? 'Te enviamos un código de 6 dígitos a tu correo para recuperar acceso o definir contraseña.'
                : mode === 'otp_verify'
                  ? `Revisá tu correo (${email.trim().toLowerCase()}) y escribí el código.`
                  : mode === 'set_password'
                    ? 'Así la próxima vez entrás directo con tu correo y contraseña.'
                    : `Conservá tus ${profile.xp} XP, tu racha y tu lugar en el Ranking en todos tus dispositivos.`}
          </Text>

          {mode === 'login' || mode === 'signup' ? (
            <View style={styles.segmentWrap}>
              <Pressable
                onPress={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                style={[styles.segmentBtn, mode === 'login' && styles.segmentBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'login' }}
              >
                <Text
                  style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}
                >
                  Iniciar sesión
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'signup' }}
              >
                <Text
                  style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}
                >
                  Crear cuenta
                </Text>
              </Pressable>
            </View>
          ) : null}

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

          {mode === 'login' || mode === 'signup' ? (
            <>
              <View style={styles.form}>
                {mode === 'signup' ? (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Tu nombre</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Ej.: Marta"
                      placeholderTextColor={LIENZO.color.ink2}
                      style={styles.input}
                    />
                  </View>
                ) : null}

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
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Contraseña</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                    placeholderTextColor={LIENZO.color.ink2}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={() => void handlePasswordSubmit()}
                  />
                </View>

                <Pressable
                  onPress={() => void handlePasswordSubmit()}
                  disabled={isLoading || !email.trim() || password.length < 6}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (isLoading || !email.trim() || password.length < 6) && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <LockKeyIcon size={20} color={LIENZO.color.onPrimary} weight="duotone" />
                  <Text style={styles.primaryBtnText}>
                    {isLoading
                      ? 'Procesando…'
                      : mode === 'login'
                        ? 'Iniciar sesión'
                        : 'Crear cuenta'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMode('otp');
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  style={styles.helperLinkBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.textLinkPrimary}>
                    ¿Olvidaste tu contraseña o entrabas con código? Entrar con código al correo
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
          ) : mode === 'otp' ? (
            <View style={styles.form}>
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
                  onSubmitEditing={() => void handleSendOtp()}
                />
              </View>

              <Pressable
                onPress={() => void handleSendOtp()}
                disabled={isLoading || !email.trim()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (isLoading || !email.trim()) && styles.disabledBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <EnvelopeSimpleIcon size={20} color={LIENZO.color.onPrimary} weight="duotone" />
                <Text style={styles.primaryBtnText}>
                  {isLoading ? 'Enviando…' : 'Enviar código de 6 dígitos'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                style={styles.skipBtn}
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>Volver a iniciar sesión con contraseña</Text>
              </Pressable>
            </View>
          ) : mode === 'otp_verify' ? (
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
                onSubmitEditing={() => void handleVerifyOtp()}
              />

              <Pressable
                onPress={() => void handleVerifyOtp()}
                disabled={isLoading || otpCode.length < 6}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (isLoading || otpCode.length < 6) && styles.disabledBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? 'Verificando…' : 'Verificar e ingresar'}
                </Text>
              </Pressable>

              <View style={styles.otpFooterRow}>
                <Pressable
                  onPress={() => {
                    setMode('otp');
                    setOtpCode('');
                    setErrorMessage(null);
                  }}
                  style={styles.textLinkBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.textLink}>Cambiar correo</Text>
                </Pressable>

                <Pressable
                  onPress={() => void handleSendOtp()}
                  disabled={isLoading}
                  style={styles.textLinkBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.textLinkPrimary}>Reenviar código</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nueva contraseña</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={LIENZO.color.ink2}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSaveNewPassword()}
                />
              </View>

              <Pressable
                onPress={() => void handleSaveNewPassword()}
                disabled={isLoading || newPassword.length < 6}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (isLoading || newPassword.length < 6) && styles.disabledBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? 'Guardando…' : 'Guardar contraseña y entrar'}
                </Text>
              </Pressable>

              <Pressable
                onPress={proceedAfterAuthSuccess}
                style={styles.skipBtn}
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>Entrar sin cambiarla ahora</Text>
              </Pressable>
            </View>
          )}

          {!isGuestLimit && (mode === 'login' || mode === 'signup') ? (
            <Pressable onPress={handleClose} style={styles.skipBtn} accessibilityRole="button">
              <Text style={styles.skipText}>Seguir como invitado por ahora</Text>
            </Pressable>
          ) : null}
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
    paddingTop: LIENZO.space.lg,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
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
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: LIENZO.color.track,
    borderRadius: LIENZO.radius.icon,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: LIENZO.color.bg,
  },
  segmentText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  segmentTextActive: {
    color: LIENZO.color.primaryInk,
    fontFamily: LIENZO.font.bold,
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
  helperLinkBtn: {
    alignItems: 'center',
    paddingVertical: 4,
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
    textAlign: 'center',
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

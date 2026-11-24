import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AtIcon,
  BookOpenTextIcon,
  CheckCircleIcon,
  SparkleIcon,
  UserCircleIcon,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  Animated,
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
import { playGameCue } from '@/lib/gameFeedback';
import { checkUsernameAvailability } from '@/services/quizService';
import { sanitizeUsername, useGameStore } from '@/store/useGameStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { nextLevelId } = useLocalSearchParams<{ nextLevelId?: string }>();
  const profile = useGameStore((s) => s.profile);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<0 | 1>(0);
  const [displayName, setDisplayName] = useState(
    profile.displayName === 'Peregrino' ? '' : profile.displayName
  );
  const [usernameInput, setUsernameInput] = useState(profile.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(16));

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, step]);

  const cleanUsername = sanitizeUsername(usernameInput || displayName);
  const soundEnabled = profile.soundEnabled ?? true;

  const handleContinue = () => {
    playGameCue('tap', soundEnabled);
    setStep(1);
  };

  const handleFinish = async (skipAll = false) => {
    if (checkingUsername) return;
    if (!skipAll && cleanUsername && cleanUsername !== profile.username) {
      setCheckingUsername(true);
      const availability = await checkUsernameAvailability(cleanUsername);
      setCheckingUsername(false);
      if (availability === 'taken') {
        setUsernameError(`@${cleanUsername} ya lo eligió otra persona. Probá con otro.`);
        return;
      }
    }
    playGameCue('celebrate', soundEnabled);
    completeOnboarding(
      skipAll ? profile.displayName || 'Peregrino' : displayName.trim() || 'Peregrino',
      skipAll ? profile.username || '' : cleanUsername
    );
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

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Indicador de pasos */}
          <View style={styles.stepsRow}>
            <View
              style={[
                styles.stepDot,
                step === 0 ? styles.stepDotActive : styles.stepDotDone,
              ]}
            />
            <View
              style={[
                styles.stepDot,
                step === 1 ? styles.stepDotActive : styles.stepDotIdle,
              ]}
            />
          </View>

          <Animated.View
            style={[
              styles.body,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {step === 0 ? (
              <>
                <View style={styles.heroBadge}>
                  <BookOpenTextIcon size={40} color={LIENZO.color.primary} weight="duotone" />
                </View>

                <Text style={styles.title}>Bienvenido a Trivia Católica</Text>
                <Text style={styles.subtitle}>
                  Aprendé sobre la Biblia, los Santos, los Sacramentos y la Liturgia jugando
                  unos minutos cada día, con explicaciones claras y citas completas.
                </Text>

                <View style={styles.highlights}>
                  <View style={styles.highlightRow}>
                    <SparkleIcon size={22} color={LIENZO.color.gold} weight="duotone" />
                    <Text style={styles.highlightText}>
                      Desafío diario, niveles progresivos y noticias católicas con quiz.
                    </Text>
                  </View>
                  <View style={styles.highlightRow}>
                    <CheckCircleIcon size={22} color={LIENZO.color.success} weight="duotone" />
                    <Text style={styles.highlightText}>
                      Cada respuesta incluye explicación y lectura de la Biblia y el Catecismo.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleContinue}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.heroBadge}>
                  <UserCircleIcon size={40} color={LIENZO.color.primary} weight="duotone" />
                </View>

                <Text style={styles.title}>Elegí tu nombre de usuario</Text>
                <Text style={styles.subtitle}>
                  Así te vamos a saludar y te van a reconocer en el ranking y en los próximos
                  desafíos contra otros jugadores.
                </Text>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Tu nombre</Text>
                    <TextInput
                      value={displayName}
                      onChangeText={(txt) => {
                        setDisplayName(txt);
                        if (!usernameInput) {
                          setUsernameInput(sanitizeUsername(txt));
                        }
                      }}
                      placeholder="Ej.: Marta"
                      placeholderTextColor={LIENZO.color.ink2}
                      style={styles.input}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre de usuario (para desafíos)</Text>
                    <View style={styles.usernameBox}>
                      <AtIcon size={20} color={LIENZO.color.primary} weight="regular" />
                      <TextInput
                        value={usernameInput}
                        onChangeText={(txt) => {
                          setUsernameInput(sanitizeUsername(txt));
                          setUsernameError(null);
                        }}
                        placeholder="ej. marta_fe"
                        placeholderTextColor={LIENZO.color.ink2}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.usernameInput}
                        returnKeyType="done"
                        onSubmitEditing={() => void handleFinish()}
                      />
                    </View>
                    {usernameError ? (
                      <Text style={styles.errorText} accessibilityLiveRegion="polite">
                        {usernameError}
                      </Text>
                    ) : cleanUsername ? (
                      <Text style={styles.previewText}>
                        Tu perfil aparecerá como @{cleanUsername}
                      </Text>
                    ) : (
                      <Text style={styles.helperText}>
                        Usá solo letras minúsculas, números o guion bajo.
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={() => void handleFinish()}
                  disabled={checkingUsername}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>
                    {checkingUsername ? 'Revisando usuario…' : 'Empezar a jugar'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => void handleFinish(true)}
                  style={styles.skipBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.skipText}>Completar después</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.xl,
    paddingVertical: LIENZO.space.xxl,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: LIENZO.space.xxl,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  stepDotActive: {
    width: 28,
    backgroundColor: LIENZO.color.primary,
  },
  stepDotDone: {
    width: 12,
    backgroundColor: LIENZO.color.primarySoft,
  },
  stepDotIdle: {
    width: 12,
    backgroundColor: LIENZO.color.line,
  },
  body: {
    alignItems: 'center',
    gap: LIENZO.space.lg,
  },
  heroBadge: {
    width: 76,
    height: 76,
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  highlights: {
    width: '100%',
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LIENZO.space.md,
  },
  highlightText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink,
    flex: 1,
  },
  form: {
    width: '100%',
    gap: LIENZO.space.md,
  },
  field: {
    gap: 6,
  },
  label: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink,
  },
  input: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    minHeight: 52,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
    backgroundColor: LIENZO.color.bg,
  },
  usernameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    minHeight: 52,
    backgroundColor: LIENZO.color.bg,
  },
  usernameInput: {
    flex: 1,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
    paddingVertical: 10,
  },
  previewText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  helperText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  errorText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.danger,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 52,
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
  skipBtn: {
    minHeight: LIENZO.touchMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  pressed: {
    opacity: 0.9,
  },
});

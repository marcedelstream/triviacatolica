import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AtIcon,
  CheckCircleIcon,
  GlobeHemisphereWestIcon,
  SparkleIcon,
  TranslateIcon,
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
import { COUNTRY_OPTIONS } from '@/data/countries';
import { LANGUAGE_OPTIONS, translate, type AppLanguage } from '@/i18n/translations';
import { playGameCue } from '@/lib/gameFeedback';
import { checkUsernameAvailability } from '@/services/quizService';
import { sanitizeUsername, useGameStore } from '@/store/useGameStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { nextLevelId } = useLocalSearchParams<{ nextLevelId?: string }>();
  const profile = useGameStore((s) => s.profile);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const setLanguageInStore = useGameStore((s) => s.setLanguage);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(profile.language ?? 'es');
  const [displayName, setDisplayName] = useState(
    profile.displayName === 'Peregrino' ? '' : profile.displayName
  );
  const [usernameInput, setUsernameInput] = useState(profile.username || '');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(profile.country ?? 'PY');
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

  const handleSelectLanguage = (code: AppLanguage) => {
    playGameCue('tap', soundEnabled);
    setSelectedLang(code);
    setLanguageInStore(code);
  };

  const handleNextFromLang = () => {
    playGameCue('tap', soundEnabled);
    setStep(1);
  };

  const handleNextFromProfile = async () => {
    if (checkingUsername) return;
    if (cleanUsername && cleanUsername !== profile.username) {
      setCheckingUsername(true);
      const availability = await checkUsernameAvailability(cleanUsername);
      setCheckingUsername(false);
      if (availability === 'taken') {
        setUsernameError(`@${cleanUsername} ya lo eligió otra persona. Probá con otro.`);
        return;
      }
    }
    playGameCue('tap', soundEnabled);
    setStep(2);
  };

  const handleFinish = (skipAll = false) => {
    playGameCue('celebrate', soundEnabled);
    completeOnboarding(
      skipAll ? profile.displayName || 'Peregrino' : displayName.trim() || 'Peregrino',
      skipAll ? profile.username || '' : cleanUsername,
      skipAll ? profile.country ?? null : selectedCountry,
      selectedLang
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
          {/* Indicador de 3 pasos: Idioma -> Perfil -> Bandera */}
          <View style={styles.stepsRow}>
            {[0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.stepDot,
                  step === idx
                    ? styles.stepDotActive
                    : step > idx
                      ? styles.stepDotDone
                      : styles.stepDotIdle,
                ]}
              />
            ))}
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
                  <TranslateIcon size={40} color={LIENZO.color.primary} weight="duotone" />
                </View>

                <Text style={styles.title}>
                  {translate(selectedLang, 'onboardingLangTitle')}
                </Text>
                <Text style={styles.subtitle}>
                  {translate(selectedLang, 'onboardingLangSub')}
                </Text>

                <View style={styles.langList}>
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const active = selectedLang === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        onPress={() => handleSelectLanguage(lang.code)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        style={({ pressed }) => [
                          styles.langCard,
                          active && styles.langCardActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.langFlag}>{lang.flag}</Text>
                        <Text style={[styles.langLabel, active && styles.langLabelActive]}>
                          {lang.nativeLabel}
                        </Text>
                        {active ? (
                          <CheckCircleIcon
                            size={22}
                            color={LIENZO.color.primary}
                            weight="duotone"
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.highlights}>
                  <View style={styles.highlightRow}>
                    <SparkleIcon size={20} color={LIENZO.color.gold} weight="duotone" />
                    <Text style={styles.highlightText}>
                      Desafío diario por Lectura + Evangelio, avatares desbloqueables con XP y
                      ranking mundial y nacional.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleNextFromLang}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>
                    {translate(selectedLang, 'onboardingContinue')}
                  </Text>
                </Pressable>
              </>
            ) : step === 1 ? (
              <>
                <View style={styles.heroBadge}>
                  <UserCircleIcon size={40} color={LIENZO.color.primary} weight="duotone" />
                </View>

                <Text style={styles.title}>Elegí tu nombre y @usuario</Text>
                <Text style={styles.subtitle}>
                  Así te vamos a saludar y te van a reconocer en el ranking y en los próximos
                  desafíos 1 vs 1.
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
                    <Text style={styles.label}>Nombre de usuario (para ranking y desafíos)</Text>
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
                        onSubmitEditing={() => void handleNextFromProfile()}
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
                  onPress={() => void handleNextFromProfile()}
                  disabled={checkingUsername}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>
                    {checkingUsername
                      ? 'Revisando usuario…'
                      : translate(selectedLang, 'onboardingContinue')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleFinish(true)}
                  style={styles.skipBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.skipText}>Completar después</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.heroBadge}>
                  <GlobeHemisphereWestIcon
                    size={40}
                    color={LIENZO.color.primary}
                    weight="duotone"
                  />
                </View>

                <Text style={styles.title}>¿De qué país jugás?</Text>
                <Text style={styles.subtitle}>
                  Tu bandera aparecerá junto a tu nombre en el Ranking mundial y en tu país.
                </Text>

                <View style={styles.countryGrid}>
                  {COUNTRY_OPTIONS.map((c) => {
                    const active = selectedCountry === c.code;
                    return (
                      <Pressable
                        key={c.code}
                        onPress={() => {
                          playGameCue('tap', soundEnabled);
                          setSelectedCountry(c.code);
                        }}
                        style={({ pressed }) => [
                          styles.countryChip,
                          active && styles.countryChipActive,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                      >
                        <Text style={styles.countryFlag}>{c.flag}</Text>
                        <Text
                          style={[styles.countryName, active && styles.countryNameActive]}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => handleFinish(false)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>
                    {translate(selectedLang, 'onboardingStart')}
                  </Text>
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
    marginBottom: LIENZO.space.xl,
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
    width: 72,
    height: 72,
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
  langList: {
    width: '100%',
    gap: 10,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 58,
    backgroundColor: LIENZO.color.bg,
  },
  langCardActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
    borderWidth: LIENZO.borderWidth.active,
  },
  langFlag: {
    fontSize: 24,
  },
  langLabel: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    flex: 1,
  },
  langLabelActive: {
    color: LIENZO.color.primaryInk,
  },
  highlights: {
    width: '100%',
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LIENZO.space.sm,
  },
  highlightText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
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
  countryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryChip: {
    width: '48.2%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: 11,
    paddingVertical: 10,
    minHeight: 48,
    backgroundColor: LIENZO.color.bg,
  },
  countryChipActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink,
    flex: 1,
  },
  countryNameActive: {
    color: LIENZO.color.primaryInk,
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

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  CrownIcon,
  HeartIcon,
  InfinityIcon,
  LightningIcon,
  ShieldCheckIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenFrame } from '@/components/ScreenFrame';
import { DAILY_FREE_QUIZZES_LIMIT } from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { purchasePlan, type SubscriptionPlan } from '@/lib/revenuecat';
import { useGameStore } from '@/store/useGameStore';

export default function PaywallScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const profile = useGameStore((s) => s.profile);
  const setPremiumDemo = useGameStore((s) => s.setPremiumDemo);
  const refillHeartsNow = useGameStore((s) => s.refillHeartsNow);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [feedback, setFeedback] = useState<string | null>(null);

  const headline =
    reason === 'daily_limit'
      ? `Completaste tus ${DAILY_FREE_QUIZZES_LIMIT} quizzes de hoy`
      : reason === 'mistakes'
        ? 'Repasá tus errores con Plan Pro'
        : reason === 'hearts'
          ? 'Jugá sin pausas con vidas infinitas'
          : reason === 'level'
            ? 'Desbloqueá todos los niveles avanzados'
            : 'Trivia Católica Pro';

  const subtitle =
    reason === 'daily_limit'
      ? 'Pasate a Pro para jugar sin límite diario, sumar XP más rápido y desbloquear todos los personajes.'
      : 'Acompañá el proyecto y accedé a toda la formación sin límites diarios ni de vidas.';

  const handleActivatePro = async () => {
    const res = await purchasePlan(selectedPlan);
    if (res.success) {
      setPremiumDemo(true);
      setFeedback('¡Plan Pro activado! Ya tenés quizzes ilimitados, vidas infinitas y repaso de errores.');
    }
  };

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Text style={styles.topTitle}>Plan Pro</Text>
        <Pressable
          onPress={() => router.back()}
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
        <View style={styles.badgeWrap}>
          <CrownIcon size={36} color={LIENZO.color.goldInk} weight="duotone" />
        </View>

        <Text style={styles.title}>{headline}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Beneficios */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitRow}>
            <LightningIcon size={24} color={LIENZO.color.gold} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Quizzes ilimitados cada día</Text>
              <Text style={styles.benefitText}>
                Sin tope de {DAILY_FREE_QUIZZES_LIMIT} partidas diarias: ganá XP más rápido y
                desbloqueá antes a todos los personajes.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitRow}>
            <InfinityIcon size={24} color={LIENZO.color.primary} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Vidas infinitas y niveles Pro</Text>
              <Text style={styles.benefitText}>
                Respondé y aprendé a tu ritmo en todos los niveles avanzados sin esperar recargas.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitRow}>
            <ArrowCounterClockwiseIcon size={24} color={LIENZO.color.primary} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Modo Repaso de errores</Text>
              <Text style={styles.benefitText}>
                Practicá específicamente las preguntas en las que te equivocaste hasta dominarlas.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitRow}>
            <ShieldCheckIcon size={24} color={LIENZO.color.success} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Protector de racha semanal</Text>
              <Text style={styles.benefitText}>
                Un escudo automático por semana para no perder tu racha si un día no pudiste entrar.
              </Text>
            </View>
          </View>
        </View>

        {/* Selector de planes */}
        <View style={styles.plans}>
          <Pressable
            onPress={() => setSelectedPlan('annual')}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedPlan === 'annual' }}
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected,
            ]}
          >
            <View style={styles.planHead}>
              <Text style={styles.planName}>Plan Anual</Text>
              <View style={styles.saveChip}>
                <Text style={styles.saveChipText}>Ahorrá 45%</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>USD 19,99 / año</Text>
            <Text style={styles.planSub}>Equivale a USD 1,66 por mes · 7 días gratis</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedPlan === 'monthly' }}
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
          >
            <View style={styles.planHead}>
              <Text style={styles.planName}>Plan Mensual</Text>
            </View>
            <Text style={styles.planPrice}>USD 2,99 / mes</Text>
            <Text style={styles.planSub}>Cancelás cuando quieras desde tu tienda</Text>
          </Pressable>
        </View>

        {feedback ? (
          <View style={styles.feedbackBox}>
            <CheckCircleIcon size={20} color={LIENZO.color.success} weight="duotone" />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        ) : null}

        {profile.isPremium ? (
          <View style={styles.activeActions}>
            <View style={styles.feedbackBox}>
              <CheckCircleIcon size={20} color={LIENZO.color.success} weight="duotone" />
              <Text style={styles.feedbackText}>Ya tenés Trivia Católica Pro activo.</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Seguir jugando</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setPremiumDemo(false);
                setFeedback(null);
              }}
              style={styles.secondaryBtn}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Volver a plan gratuito (prueba)</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.activeActions}>
            <Pressable
              onPress={() => void handleActivatePro()}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <CrownIcon size={20} color={LIENZO.color.onPrimary} weight="duotone" />
              <Text style={styles.primaryBtnText}>Activar Plan Pro (simulación prueba)</Text>
            </Pressable>

            {reason === 'hearts' ? (
              <Pressable
                onPress={() => {
                  refillHeartsNow();
                  router.back();
                }}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <HeartIcon size={18} color={LIENZO.color.danger} weight="duotone" />
                <Text style={styles.secondaryBtnText}>
                  Recargar {MAX_HEARTS} vidas (modo prueba)
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.back()}
              style={styles.dismissBtn}
              accessibilityRole="button"
            >
              <Text style={styles.dismissText}>Ahora no</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footnote}>
          Modo prueba activo para testers: al conectar RevenueCat este botón abrirá el pago real de
          Google Play / App Store.
        </Text>
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
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.lg,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.md,
  },
  badgeWrap: {
    width: 68,
    height: 68,
    borderRadius: LIENZO.radius.block,
    backgroundColor: LIENZO.color.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
  benefitsCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.md,
    backgroundColor: LIENZO.color.bg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LIENZO.space.md,
  },
  benefitBody: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  benefitText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  divider: {
    height: 1,
    backgroundColor: LIENZO.color.line,
  },
  plans: {
    gap: LIENZO.space.sm,
  },
  planCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.lg,
    gap: 4,
    backgroundColor: LIENZO.color.bg,
  },
  planCardSelected: {
    borderColor: LIENZO.color.primary,
    borderWidth: LIENZO.borderWidth.active,
    backgroundColor: LIENZO.color.primarySoft,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  saveChip: {
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  saveChipText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.goldInk,
  },
  planPrice: {
    ...LIENZO.type.title,
    color: LIENZO.color.primaryInk,
  },
  planSub: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.icon,
    padding: LIENZO.space.md,
  },
  feedbackText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.successInk,
    flex: 1,
  },
  activeActions: {
    gap: LIENZO.space.sm,
  },
  primaryBtn: {
    minHeight: 52,
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
    minHeight: 48,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: LIENZO.space.lg,
  },
  secondaryBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  dismissBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  pressed: {
    opacity: 0.9,
  },
  footnote: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    textAlign: 'center',
    marginTop: 4,
  },
});

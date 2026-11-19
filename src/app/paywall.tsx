import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircleIcon,
  CrownIcon,
  HeartIcon,
  InfinityIcon,
  ShieldCheckIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenFrame } from '@/components/ScreenFrame';
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
    reason === 'hearts'
      ? 'Jugá sin pausas con vidas infinitas'
      : reason === 'level'
        ? 'Desbloqueá todos los niveles avanzados'
        : 'Trivia Católica Pro';

  const handleActivateDemo = async () => {
    const res = await purchasePlan(selectedPlan);
    if (res.success) {
      setPremiumDemo(true);
      setFeedback(res.message);
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
        <Text style={styles.subtitle}>
          Acompañá el proyecto y accedé a toda la formación sin límites de vidas.
        </Text>

        {/* Beneficios */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitRow}>
            <InfinityIcon size={24} color={LIENZO.color.primary} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Vidas infinitas</Text>
              <Text style={styles.benefitText}>
                Respondé y aprendé a tu ritmo sin esperar recargas.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitRow}>
            <CrownIcon size={24} color={LIENZO.color.gold} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Todos los niveles y tópicos</Text>
              <Text style={styles.benefitText}>
                Acceso libre a niveles avanzados de Escritura, Santos, Sacramentos y Liturgia.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitRow}>
            <ShieldCheckIcon size={24} color={LIENZO.color.success} weight="duotone" />
            <View style={styles.benefitBody}>
              <Text style={styles.benefitTitle}>Protector de racha</Text>
              <Text style={styles.benefitText}>
                Conservá tu racha aunque un día no puedas entrar a jugar.
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
              <Text style={styles.planName}>Plan anual</Text>
              <View style={styles.saveChip}>
                <Text style={styles.saveChipText}>Ahorrás 40%</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>USD 24,99 / año</Text>
            <Text style={styles.planNote}>Equivale a USD 2,08 por mes</Text>
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
            <Text style={styles.planName}>Plan mensual</Text>
            <Text style={styles.planPrice}>USD 3,49 / mes</Text>
            <Text style={styles.planNote}>Cancelás cuando quieras</Text>
          </Pressable>
        </View>

        {feedback ? (
          <View style={styles.feedbackBox}>
            <CheckCircleIcon size={22} color={LIENZO.color.success} weight="duotone" />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        ) : null}

        {profile.isPremium ? (
          <View style={styles.actions}>
            <View style={styles.feedbackBox}>
              <CheckCircleIcon size={22} color={LIENZO.color.success} weight="duotone" />
              <Text style={styles.feedbackText}>
                Tenés el Plan Pro activo (modo prueba local).
              </Text>
            </View>
            <Pressable
              onPress={() => setPremiumDemo(false)}
              style={styles.secondaryBtn}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Volver a plan gratuito (prueba)</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={() => void handleActivateDemo()}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Activar Pro (modo prueba)</Text>
            </Pressable>

            {profile.hearts < MAX_HEARTS ? (
              <Pressable
                onPress={() => {
                  refillHeartsNow();
                  router.back();
                }}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <HeartIcon size={20} color={LIENZO.color.danger} weight="duotone" />
                <Text style={styles.secondaryBtnText}>
                  Recargar {MAX_HEARTS} vidas gratis (prueba)
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <Text style={styles.footnote}>
          Integración preparada para RevenueCat (react-native-purchases) en el development build
          para Android (Google Play) e iOS (App Store).
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
    paddingTop: LIENZO.space.xl,
    paddingBottom: LIENZO.space.xxxl,
    gap: LIENZO.space.lg,
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
    ...LIENZO.type.caption,
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
    backgroundColor: LIENZO.color.bg,
    gap: 2,
  },
  planCardSelected: {
    borderWidth: LIENZO.borderWidth.active,
    borderColor: LIENZO.color.primary,
    backgroundColor: LIENZO.color.primarySoft,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LIENZO.space.sm,
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
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.goldInk,
  },
  planPrice: {
    ...LIENZO.type.title,
    color: LIENZO.color.primaryInk,
    marginTop: 2,
  },
  planNote: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.md,
  },
  feedbackText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.successInk,
    flex: 1,
  },
  actions: {
    gap: LIENZO.space.sm,
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
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  pressed: {
    opacity: 0.9,
  },
  footnote: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
});

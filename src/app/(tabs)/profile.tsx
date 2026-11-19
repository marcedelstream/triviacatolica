import { useRouter } from 'expo-router';
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  DatabaseIcon,
  FlameIcon,
  HeartIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SpeakerHighIcon,
  StarIcon,
  TrashIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { checkAndApplyOtaUpdate, getOtaStatus } from '@/lib/otaUpdates';
import { useGameStore } from '@/store/useGameStore';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const dataSource = useGameStore((s) => s.dataSource);
  const updateDisplayName = useGameStore((s) => s.updateDisplayName);
  const toggleTimer = useGameStore((s) => s.toggleTimer);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const resetLocalProgress = useGameStore((s) => s.resetLocalProgress);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName);
  const [confirmReset, setConfirmReset] = useState(false);
  const [otaMessage, setOtaMessage] = useState<string | null>(null);
  const [checkingOta, setCheckingOta] = useState(false);

  const otaStatus = getOtaStatus();

  const handleCheckOta = async () => {
    if (checkingOta) return;
    setCheckingOta(true);
    const res = await checkAndApplyOtaUpdate();
    setOtaMessage(res.message);
    setCheckingOta(false);
  };

  const completedLevelsCount = Object.values(levelProgress).filter((p) => p.stars > 0).length;

  const handleSaveName = () => {
    if (draftName.trim()) {
      updateDisplayName(draftName.trim());
    }
    setEditingName(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subtitle}>Tu camino de fe</Text>
            <Text style={styles.title}>Perfil</Text>
          </View>

          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            style={[
              styles.proPill,
              profile.isPremium
                ? { backgroundColor: LIENZO.color.successSoft }
                : { backgroundColor: LIENZO.color.goldSoft },
            ]}
          >
            <CrownIcon
              size={18}
              color={profile.isPremium ? LIENZO.color.success : LIENZO.color.goldInk}
              weight="duotone"
            />
            <Text
              style={[
                styles.proPillText,
                { color: profile.isPremium ? LIENZO.color.successInk : LIENZO.color.goldInk },
              ]}
            >
              {profile.isPremium ? 'Plan Pro activo' : 'Ver Pro'}
            </Text>
          </Pressable>
        </View>

        {/* Tarjeta de cuenta y nombre */}
        <View style={styles.card}>
          {editingName ? (
            <View style={styles.nameEditBox}>
              <Text style={styles.fieldLabel}>¿Cómo te llamamos en el saludo?</Text>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Tu nombre"
                placeholderTextColor={LIENZO.color.ink2}
                style={styles.input}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => {
                    setDraftName(profile.displayName);
                    setEditingName(false);
                  }}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveName}
                  style={styles.saveBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{profile.displayName}</Text>
                <Text style={styles.accountStatus}>
                  {profile.isAnonymous
                    ? 'Modo invitado · progreso guardado en este dispositivo'
                    : `Cuenta vinculada con ${
                        profile.authProvider === 'apple' ? 'Apple' : 'Google'
                      }`}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setDraftName(profile.displayName);
                  setEditingName(true);
                }}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Cambiar nombre"
              >
                <PencilSimpleIcon size={22} color={LIENZO.color.primary} weight="regular" />
              </Pressable>
            </View>
          )}

          {profile.isAnonymous ? (
            <Pressable
              onPress={() => router.push('/auth-modal')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <ShieldCheckIcon size={22} color={LIENZO.color.onPrimary} weight="duotone" />
              <Text style={styles.primaryBtnText}>Guardar progreso con Google o Apple</Text>
            </Pressable>
          ) : (
            <View style={styles.verifiedRow}>
              <CheckCircleIcon size={20} color={LIENZO.color.success} weight="duotone" />
              <Text style={styles.verifiedText}>Tu racha y estrellas están respaldadas.</Text>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <SparkleIcon size={24} color={LIENZO.color.primary} weight="duotone" />
            <Text style={styles.statValue}>{profile.xp}</Text>
            <Text style={styles.statLabel}>Puntos XP</Text>
          </View>

          <View style={styles.statCard}>
            <FlameIcon size={24} color={LIENZO.color.gold} weight="duotone" />
            <Text style={styles.statValue}>
              {profile.streakCount === 1 ? '1 día' : `${profile.streakCount} días`}
            </Text>
            <Text style={styles.statLabel}>Racha actual</Text>
          </View>

          <View style={styles.statCard}>
            <StarIcon size={24} color={LIENZO.color.gold} weight="duotone" />
            <Text style={styles.statValue}>{completedLevelsCount}</Text>
            <Text style={styles.statLabel}>Niveles listos</Text>
          </View>

          <View style={styles.statCard}>
            <HeartIcon size={24} color={LIENZO.color.danger} weight="duotone" />
            <Text style={styles.statValue}>
              {profile.isPremium ? 'Infinitas' : `${profile.hearts}/${MAX_HEARTS}`}
            </Text>
            <Text style={styles.statLabel}>Vidas</Text>
          </View>
        </View>

        {/* Ajustes y accesibilidad */}
        <Text style={styles.sectionTitle}>Ajustes</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <SpeakerHighIcon size={22} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Sonidos y vibración</Text>
              <Text style={styles.settingDesc}>
                Efectos suaves al acertar, equivocarte y completar partidas.
              </Text>
            </View>
            <Switch
              value={profile.soundEnabled ?? true}
              onValueChange={toggleSound}
              trackColor={{ false: LIENZO.color.line, true: LIENZO.color.primary }}
              thumbColor={LIENZO.color.bg}
              accessibilityLabel="Activar o desactivar sonidos y vibración"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <ClockIcon size={22} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Temporizador en preguntas</Text>
              <Text style={styles.settingDesc}>
                Desactivado por defecto para leer y responder sin apuro.
              </Text>
            </View>
            <Switch
              value={profile.timerEnabled}
              onValueChange={toggleTimer}
              trackColor={{ false: LIENZO.color.line, true: LIENZO.color.primary }}
              thumbColor={LIENZO.color.bg}
              accessibilityLabel="Activar o desactivar temporizador en preguntas"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <ArrowsClockwiseIcon size={22} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Actualizaciones OTA</Text>
              <Text style={styles.settingDesc}>
                {otaMessage ??
                  `Versión ${otaStatus.runtimeVersion} · canal ${otaStatus.channel}`}
              </Text>
            </View>
            <Pressable
              onPress={() => void handleCheckOta()}
              disabled={checkingOta}
              style={styles.otaBtn}
              accessibilityRole="button"
            >
              <Text style={styles.otaBtnText}>
                {checkingOta ? '...' : 'Buscar'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <DatabaseIcon size={22} color={LIENZO.color.ink2} weight="regular" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Origen de datos</Text>
              <Text style={styles.settingDesc}>
                {dataSource === 'supabase'
                  ? 'Conectado a Supabase'
                  : 'Modo local precargado (listo para conectar con .env)'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {confirmReset ? (
            <View style={styles.resetConfirmBox}>
              <Text style={styles.resetConfirmText}>
                ¿Reiniciar tu racha, XP y niveles completados en este dispositivo?
              </Text>
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setConfirmReset(false)}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    resetLocalProgress();
                    setConfirmReset(false);
                  }}
                  style={styles.dangerBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.dangerBtnText}>Sí, reiniciar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirmReset(true)}
              style={styles.resetTrigger}
              accessibilityRole="button"
            >
              <TrashIcon size={20} color={LIENZO.color.danger} weight="regular" />
              <Text style={styles.resetTriggerText}>Reiniciar progreso local</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LIENZO.color.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: 38,
    paddingBottom: LIENZO.space.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: LIENZO.space.md,
    marginBottom: LIENZO.space.lg,
    flexWrap: 'wrap',
  },
  subtitle: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 8,
    minHeight: 40,
  },
  proPillText: {
    ...LIENZO.type.smallBold,
  },
  card: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.md,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LIENZO.space.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  accountStatus: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 2,
  },
  iconBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameEditBox: {
    gap: LIENZO.space.sm,
  },
  fieldLabel: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink,
  },
  input: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 10,
    minHeight: LIENZO.touchMin,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: LIENZO.space.sm,
  },
  cancelBtn: {
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  saveBtn: {
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.onPrimary,
  },
  primaryBtn: {
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LIENZO.space.sm,
    paddingHorizontal: LIENZO.space.lg,
    paddingVertical: LIENZO.space.md,
  },
  primaryBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    backgroundColor: LIENZO.color.successSoft,
    borderRadius: LIENZO.radius.icon,
    padding: LIENZO.space.md,
  },
  verifiedText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.successInk,
    flex: 1,
  },
  sectionTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    marginTop: LIENZO.space.xxl,
    marginBottom: LIENZO.space.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LIENZO.space.sm,
  },
  statCard: {
    width: '48.5%',
    flexGrow: 1,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.ms,
    gap: 4,
    backgroundColor: LIENZO.color.bg,
  },
  statValue: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
    marginTop: 4,
  },
  statLabel: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.track,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingBody: {
    flex: 1,
  },
  settingTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  settingDesc: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: LIENZO.color.line,
  },
  otaBtn: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otaBtnText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  resetTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.sm,
    minHeight: LIENZO.touchMin,
  },
  resetTriggerText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.danger,
  },
  resetConfirmBox: {
    gap: LIENZO.space.sm,
  },
  resetConfirmText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink,
  },
  dangerBtn: {
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.onPrimary,
  },
});

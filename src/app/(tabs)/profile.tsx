import { useRouter } from 'expo-router';
import {
  AtIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  FileTextIcon,
  FlameIcon,
  HeartIcon,
  LifebuoyIcon,
  LockKeyIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  SpeakerHighIcon,
  StarIcon,
  TrashIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { MAX_HEARTS } from '@/data/localSeed';
import { checkUsernameAvailability } from '@/services/quizService';
import { sanitizeUsername, useGameStore } from '@/store/useGameStore';

const LEGAL_LINKS = [
  {
    label: 'Ayuda y soporte',
    url: 'https://triviacatolica.com/soporte',
    icon: <LifebuoyIcon size={22} color={LIENZO.color.primary} weight="duotone" />,
  },
  {
    label: 'Política de privacidad',
    url: 'https://triviacatolica.com/privacidad',
    icon: <LockKeyIcon size={22} color={LIENZO.color.primary} weight="duotone" />,
  },
  {
    label: 'Términos y condiciones',
    url: 'https://triviacatolica.com/terminos',
    icon: <FileTextIcon size={22} color={LIENZO.color.primary} weight="duotone" />,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const updateDisplayName = useGameStore((s) => s.updateDisplayName);
  const updateUsername = useGameStore((s) => s.updateUsername);
  const toggleTimer = useGameStore((s) => s.toggleTimer);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const usernameConflict = useGameStore((s) => s.usernameConflict);
  const clearUsernameConflict = useGameStore((s) => s.clearUsernameConflict);
  const signOut = useGameStore((s) => s.signOut);
  const deleteAccount = useGameStore((s) => s.deleteAccount);

  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName);
  const [draftUsername, setDraftUsername] = useState(profile.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  const completedLevelsCount = Object.values(levelProgress).filter((p) => p.stars > 0).length;

  const handleSaveProfile = async () => {
    if (checkingUsername) return;
    const cleanUser = sanitizeUsername(draftUsername);
    if (cleanUser && cleanUser !== profile.username) {
      setCheckingUsername(true);
      const availability = await checkUsernameAvailability(cleanUser);
      setCheckingUsername(false);
      if (availability === 'taken') {
        setUsernameError(`@${cleanUser} ya lo eligió otra persona. Probá con otro.`);
        return;
      }
    }
    if (draftName.trim()) {
      updateDisplayName(draftName.trim());
    }
    if (cleanUser) {
      updateUsername(cleanUser);
      clearUsernameConflict();
    }
    setUsernameError(null);
    setEditingProfile(false);
  };

  const startEditing = () => {
    setDraftName(profile.displayName);
    setDraftUsername(profile.username || '');
    setUsernameError(null);
    setEditingProfile(true);
  };

  const handleSignOut = async () => {
    setAccountBusy(true);
    await signOut();
    setAccountBusy(false);
    setConfirmingDelete(false);
  };

  const handleDeleteAccount = async () => {
    setAccountBusy(true);
    setAccountMessage(null);
    const res = await deleteAccount();
    setAccountBusy(false);
    setConfirmingDelete(false);
    setAccountMessage(res.message);
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

          {PAYWALL_ENABLED ? (
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
          ) : null}
        </View>

        {/* Tarjeta de cuenta, nombre y @usuario */}
        <View style={styles.card}>
          {editingProfile ? (
            <View style={styles.nameEditBox}>
              <Text style={styles.fieldLabel}>Tu nombre</Text>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Ej.: Marta"
                placeholderTextColor={LIENZO.color.ink2}
                style={styles.input}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Nombre de usuario (para desafíos)</Text>
              <View style={styles.usernameField}>
                <AtIcon size={18} color={LIENZO.color.primary} weight="regular" />
                <TextInput
                  value={draftUsername}
                  onChangeText={(txt) => {
                    setDraftUsername(sanitizeUsername(txt));
                    setUsernameError(null);
                  }}
                  placeholder="ej. marta_fe"
                  placeholderTextColor={LIENZO.color.ink2}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.usernameInput}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSaveProfile()}
                />
              </View>
              {usernameError ? (
                <Text style={styles.errorText} accessibilityLiveRegion="polite">
                  {usernameError}
                </Text>
              ) : null}

              <View style={styles.editActions}>
                <Pressable
                  onPress={() => {
                    setDraftName(profile.displayName);
                    setDraftUsername(profile.username || '');
                    setEditingProfile(false);
                  }}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleSaveProfile()}
                  disabled={checkingUsername}
                  style={styles.saveBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.saveBtnText}>
                    {checkingUsername ? 'Revisando…' : 'Guardar'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{profile.displayName}</Text>
                {profile.username ? (
                  <Text style={styles.usernameLabel}>@{profile.username}</Text>
                ) : (
                  <Pressable onPress={startEditing} accessibilityRole="button">
                    <Text style={styles.usernamePrompt}>
                      Elegir @usuario para futuros desafíos
                    </Text>
                  </Pressable>
                )}
                {usernameConflict ? (
                  <Text style={styles.errorText}>
                    @{usernameConflict} ya lo eligió otra persona. Elegí otro: tu progreso está a salvo.
                  </Text>
                ) : null}
                <Text style={styles.accountStatus}>
                  {profile.isAnonymous
                    ? 'Cuenta invitada · vinculala para guardar tu progreso'
                    : profile.authProvider === 'email'
                      ? 'Cuenta vinculada con correo electrónico'
                      : `Cuenta vinculada con ${
                          profile.authProvider === 'apple' ? 'Apple' : 'Google'
                        }`}
                </Text>
              </View>
              <Pressable
                onPress={startEditing}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Editar nombre y usuario"
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
              <Text style={styles.primaryBtnText}>Guardar progreso con tu cuenta</Text>
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

        {/* Ajustes limpios (solo opciones pensadas para el usuario final) */}
        <Text style={styles.sectionTitle}>Preferencias</Text>
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
        </View>

        {/* Cuenta: ayuda, legales, cerrar sesión y eliminar cuenta */}
        <Text style={styles.sectionTitle}>Cuenta y ayuda</Text>
        <View style={styles.card}>
          {LEGAL_LINKS.map((link, idx) => (
            <View key={link.url}>
              {idx > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                onPress={() => void Linking.openURL(link.url)}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                accessibilityRole="link"
              >
                <View style={styles.settingIcon}>{link.icon}</View>
                <Text style={[styles.settingTitle, styles.linkText]}>{link.label}</Text>
                <CaretRightIcon size={20} color={LIENZO.color.ink2} weight="regular" />
              </Pressable>
            </View>
          ))}

          {!profile.isAnonymous ? (
            <>
              <View style={styles.divider} />
              <Pressable
                onPress={() => void handleSignOut()}
                disabled={accountBusy}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={styles.settingIcon}>
                  <SignOutIcon size={22} color={LIENZO.color.primary} weight="duotone" />
                </View>
                <View style={[styles.settingBody, styles.linkText]}>
                  <Text style={styles.settingTitle}>Cerrar sesión</Text>
                  <Text style={styles.settingDesc}>
                    Tu progreso queda guardado en tu cuenta para cuando vuelvas a entrar.
                  </Text>
                </View>
              </Pressable>
            </>
          ) : null}

          <View style={styles.divider} />
          {confirmingDelete ? (
            <View style={styles.deleteBox}>
              <Text style={styles.deleteTitle}>¿Eliminar tu cuenta?</Text>
              <Text style={styles.settingDesc}>
                Se borran para siempre tu perfil, tu @usuario, tu XP, tu racha y tu progreso. No se
                puede deshacer.
              </Text>
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => setConfirmingDelete(false)}
                  disabled={accountBusy}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleDeleteAccount()}
                  disabled={accountBusy}
                  style={styles.deleteBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.saveBtnText}>
                    {accountBusy ? 'Eliminando…' : 'Sí, eliminar'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setAccountMessage(null);
                setConfirmingDelete(true);
              }}
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={[styles.settingIcon, { backgroundColor: LIENZO.color.dangerSoft }]}>
                <TrashIcon size={22} color={LIENZO.color.danger} weight="duotone" />
              </View>
              <Text style={[styles.settingTitle, styles.linkText, { color: LIENZO.color.danger }]}>
                Eliminar cuenta y datos
              </Text>
            </Pressable>
          )}
          {accountMessage ? <Text style={styles.settingDesc}>{accountMessage}</Text> : null}
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
    paddingTop: 36,
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
    gap: 2,
  },
  accountName: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  usernameLabel: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.primaryInk,
  },
  usernamePrompt: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.primary,
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
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 10,
    minHeight: LIENZO.touchMin,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
  },
  usernameField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    minHeight: LIENZO.touchMin,
  },
  usernameInput: {
    flex: 1,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
    paddingVertical: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: LIENZO.space.sm,
    marginTop: 4,
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
    width: 42,
    height: 42,
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
  errorText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.danger,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LIENZO.space.md,
    minHeight: LIENZO.touchMin,
  },
  linkText: {
    flex: 1,
  },
  deleteBox: {
    gap: LIENZO.space.sm,
  },
  deleteTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.danger,
  },
  deleteBtn: {
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AtIcon,
  BellRingingIcon,
  BookOpenTextIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  FileTextIcon,
  FlameIcon,
  GlobeHemisphereWestIcon,
  HeartIcon,
  LifebuoyIcon,
  LockIcon,
  LockKeyIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  SpeakerHighIcon,
  StarIcon,
  TranslateIcon,
  TrashIcon,
  TrophyIcon,
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

import { AvatarBadge } from '@/components/AvatarBadge';
import { CountryPromptModal } from '@/components/CountryPromptModal';
import { PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { computeAchievements, type AchievementBadge } from '@/data/achievements';
import { AVATAR_CATALOG, isAvatarUnlocked, type AvatarOption } from '@/data/avatars';
import { getCountryByCode } from '@/data/countries';
import { MAX_HEARTS } from '@/data/localSeed';
import { LANGUAGE_OPTIONS, translate } from '@/i18n/translations';
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

function renderAchievementIcon(icon: AchievementBadge['icon'], unlocked: boolean) {
  const color = unlocked ? LIENZO.color.goldInk : LIENZO.color.ink2;
  const weight = unlocked ? 'duotone' : 'regular';
  switch (icon) {
    case 'flame':
      return <FlameIcon size={20} color={color} weight={weight} />;
    case 'trophy':
      return <TrophyIcon size={20} color={color} weight={weight} />;
    case 'crown':
      return <CrownIcon size={20} color={color} weight={weight} />;
    case 'book':
      return <BookOpenTextIcon size={20} color={color} weight={weight} />;
    case 'shield':
      return <ShieldCheckIcon size={20} color={color} weight={weight} />;
    case 'star':
      return <StarIcon size={20} color={color} weight={weight} />;
    case 'heart':
      return <HeartIcon size={20} color={color} weight={weight} />;
    default:
      return <SparkleIcon size={20} color={color} weight={weight} />;
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const updateDisplayName = useGameStore((s) => s.updateDisplayName);
  const updateUsername = useGameStore((s) => s.updateUsername);
  const setCountry = useGameStore((s) => s.setCountry);
  const setAvatar = useGameStore((s) => s.setAvatar);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const toggleTimer = useGameStore((s) => s.toggleTimer);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);
  const enableNotifications = useGameStore((s) => s.enableNotifications);
  const disableNotifications = useGameStore((s) => s.disableNotifications);
  const usernameConflict = useGameStore((s) => s.usernameConflict);
  const clearUsernameConflict = useGameStore((s) => s.clearUsernameConflict);
  const signOut = useGameStore((s) => s.signOut);
  const deleteAccount = useGameStore((s) => s.deleteAccount);

  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName);
  const [draftUsername, setDraftUsername] = useState(profile.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarHint, setAvatarHint] = useState<string | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  const lang = profile.language ?? 'es';
  const countryInfo = getCountryByCode(profile.country);
  const progressValues = Object.values(levelProgress);
  const completedLevelsCount = progressValues.filter((p) => p.stars > 0).length;
  const totalStars = progressValues.reduce((acc, p) => acc + p.stars, 0);
  const perfectLevels = progressValues.filter((p) => p.stars >= 3).length;

  const achievements = computeAchievements({
    xp: profile.xp,
    streakCount: profile.streakCount,
    longestStreak: profile.longestStreak,
    levelsCompleted: completedLevelsCount,
    totalStars,
    perfectLevels,
  });

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

  const handleSelectAvatar = (avatar: AvatarOption) => {
    if (isAvatarUnlocked(avatar, profile.xp)) {
      setAvatar(avatar.id);
      setAvatarHint(null);
      return;
    }
    const missing = Math.max(1, avatar.requiredXp - profile.xp);
    setAvatarHint(
      `Sumá ${missing} XP más para desbloquear a ${avatar.name} (${avatar.requiredXp} XP).`
    );
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
            <Text style={styles.subtitle}>{translate(lang, 'profileSubtitle')}</Text>
            <Text style={styles.title}>{translate(lang, 'profileTitle')}</Text>
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

        {/* Tarjeta de cuenta, avatar, bandera, nombre y @usuario */}
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
              ) : profile.isAnonymous ? (
                <Text style={styles.settingDesc}>
                  Tu @usuario quedará reservado oficialmente en el ranking al vincular tu cuenta.
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
              <AvatarBadge
                avatarId={profile.avatarId}
                country={profile.country}
                size={56}
                highlight={profile.isPremium}
              />
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{profile.displayName}</Text>
                {profile.username ? (
                  <Text style={styles.usernameLabel}>
                    @{profile.username}
                    {countryInfo ? ` · ${countryInfo.flag} ${countryInfo.name}` : ''}
                  </Text>
                ) : (
                  <Pressable onPress={startEditing} accessibilityRole="button">
                    <Text style={styles.usernamePrompt}>
                      Elegir @usuario para futuros desafíos
                    </Text>
                  </Pressable>
                )}
                {usernameConflict ? (
                  <Text style={styles.errorText}>
                    @{usernameConflict} ya lo eligió otra persona. Elegí otro: tu progreso está a
                    salvo.
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

        {/* Tarjeta destacada de oferta Pro */}
        {PAYWALL_ENABLED && !profile.isPremium ? (
          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.proPromoCard, pressed && styles.pressed]}
          >
            <View style={styles.proPromoTop}>
              <View style={styles.proPromoIcon}>
                <CrownIcon size={24} color={LIENZO.color.goldInk} weight="duotone" />
              </View>
              <View style={styles.proPromoBody}>
                <Text style={styles.proPromoTitle}>{translate(lang, 'proBannerTitle')}</Text>
                <Text style={styles.proPromoDesc}>{translate(lang, 'proBannerDesc')}</Text>
              </View>
            </View>
            <View style={styles.proPromoBtn}>
              <Text style={styles.proPromoBtnText}>{translate(lang, 'proBannerCta')}</Text>
            </View>
          </Pressable>
        ) : null}

        {/* Estadísticas */}
        <Text style={styles.sectionTitle}>{translate(lang, 'profileStats')}</Text>
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

        {/* Foto de perfil: 8 personajes desbloqueables por mérito (XP) */}
        <Text style={styles.sectionTitle}>{translate(lang, 'profileAvatars')}</Text>
        <View style={styles.card}>
          <Text style={styles.settingDesc}>
            Desbloqueá cada personaje sumando XP en los quizzes. Con Plan Pro jugás sin límite
            diario para llegar más rápido.
          </Text>

          <View style={styles.avatarGrid}>
            {AVATAR_CATALOG.map((avatar) => {
              const unlocked = isAvatarUnlocked(avatar, profile.xp);
              const selected = (profile.avatarId ?? 'noe') === avatar.id;

              return (
                <Pressable
                  key={avatar.id}
                  onPress={() => handleSelectAvatar(avatar)}
                  accessibilityRole="button"
                  accessibilityLabel={`${avatar.name}, ${
                    unlocked ? 'desbloqueado' : `se desbloquea con ${avatar.requiredXp} XP`
                  }`}
                  style={({ pressed }) => [
                    styles.avatarTile,
                    selected && styles.avatarTileSelected,
                    !unlocked && styles.avatarTileLocked,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.avatarThumbWrap}>
                    <Image
                      source={avatar.source}
                      style={[styles.avatarThumb, !unlocked && styles.avatarThumbLocked]}
                      contentFit="cover"
                    />
                    {!unlocked ? (
                      <View style={styles.lockOverlay}>
                        <LockIcon size={18} color={LIENZO.color.ink} weight="bold" />
                      </View>
                    ) : selected ? (
                      <View style={styles.selectedCheck}>
                        <CheckCircleIcon
                          size={18}
                          color={LIENZO.color.primary}
                          weight="fill"
                        />
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.avatarTileName} numberOfLines={1}>
                    {avatar.name}
                  </Text>
                  <Text
                    style={[
                      styles.avatarTileMeta,
                      unlocked && { color: LIENZO.color.successInk },
                    ]}
                  >
                    {unlocked
                      ? selected
                        ? 'En uso'
                        : 'Libre'
                      : `${avatar.requiredXp} XP`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {avatarHint ? (
            <View style={styles.avatarHintBox}>
              <Text style={styles.avatarHintText}>{avatarHint}</Text>
              {PAYWALL_ENABLED && !profile.isPremium ? (
                <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button">
                  <Text style={styles.avatarHintLink}>Ganar XP sin límite con Pro →</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Sellos y logros */}
        <Text style={styles.sectionTitle}>{translate(lang, 'profileAchievements')}</Text>
        <View style={styles.badgeGrid}>
          {achievements.map((badge) => (
            <View
              key={badge.id}
              style={[styles.badgeCard, badge.unlocked && styles.badgeCardUnlocked]}
            >
              <View
                style={[styles.badgeIconBox, badge.unlocked && styles.badgeIconBoxUnlocked]}
              >
                {renderAchievementIcon(badge.icon, badge.unlocked)}
              </View>
              <Text
                style={[styles.badgeTitle, !badge.unlocked && { color: LIENZO.color.ink2 }]}
                numberOfLines={1}
              >
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {badge.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Preferencias */}
        <Text style={styles.sectionTitle}>{translate(lang, 'profilePreferences')}</Text>
        <View style={styles.card}>
          {/* País / bandera */}
          <Pressable
            onPress={() => setShowCountryModal(true)}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.settingIcon}>
              <GlobeHemisphereWestIcon size={22} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>{translate(lang, 'profileCountry')}</Text>
              <Text style={styles.settingDesc}>
                {countryInfo
                  ? `${countryInfo.flag} ${countryInfo.name}`
                  : 'Elegí tu bandera para el Ranking'}
              </Text>
            </View>
            <CaretRightIcon size={20} color={LIENZO.color.ink2} weight="regular" />
          </Pressable>

          <View style={styles.divider} />

          {/* Idioma */}
          <View style={styles.langPrefBlock}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <TranslateIcon size={22} color={LIENZO.color.primary} weight="duotone" />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingTitle}>{translate(lang, 'profileLanguage')}</Text>
                <Text style={styles.settingDesc}>Español · English · Português</Text>
              </View>
            </View>
            <View style={styles.langPillsRow}>
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = lang === opt.code;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => setLanguage(opt.code)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={[styles.langPill, active && styles.langPillActive]}
                  >
                    <Text style={styles.langPillFlag}>{opt.flag}</Text>
                    <Text style={[styles.langPillText, active && styles.langPillTextActive]}>
                      {opt.nativeLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

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
              <BellRingingIcon size={22} color={LIENZO.color.primary} weight="duotone" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Avisos y Desafío del Día</Text>
              <Text style={styles.settingDesc}>
                Recordatorio diario de las lecturas, tu racha y duelos Versus.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(next) => {
                if (next) {
                  void enableNotifications();
                } else {
                  void disableNotifications();
                }
              }}
              trackColor={{ false: LIENZO.color.line, true: LIENZO.color.primary }}
              thumbColor={LIENZO.color.bg}
              accessibilityLabel="Activar o desactivar notificaciones diarias"
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
        <Text style={styles.sectionTitle}>{translate(lang, 'profileAccountHelp')}</Text>
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

      <CountryPromptModal
        visible={showCountryModal}
        selectedCountry={profile.country}
        onSelectCountry={(code) => {
          setCountry(code);
          setShowCountryModal(false);
        }}
        onClose={() => setShowCountryModal(false)}
      />
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
    paddingTop: 32,
    paddingBottom: 104,
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
  proPromoCard: {
    marginTop: LIENZO.space.md,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.gold,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.block,
    padding: LIENZO.space.lg,
    gap: LIENZO.space.md,
  },
  proPromoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  proPromoIcon: {
    width: 44,
    height: 44,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPromoBody: {
    flex: 1,
    gap: 2,
  },
  proPromoTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.goldInk,
  },
  proPromoDesc: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink,
  },
  proPromoBtn: {
    minHeight: 46,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPromoBtnText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.goldInk,
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarTile: {
    width: '23%',
    minWidth: 74,
    flexGrow: 1,
    alignItems: 'center',
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
    backgroundColor: LIENZO.color.bg,
  },
  avatarTileSelected: {
    borderColor: LIENZO.color.primary,
    borderWidth: LIENZO.borderWidth.active,
    backgroundColor: LIENZO.color.primarySoft,
  },
  avatarTileLocked: {
    backgroundColor: LIENZO.color.track,
  },
  avatarThumbWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarThumb: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarThumbLocked: {
    opacity: 0.35,
  },
  lockOverlay: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: LIENZO.color.bg,
    borderRadius: 10,
  },
  avatarTileName: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  avatarTileMeta: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink2,
  },
  avatarHintBox: {
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.icon,
    padding: LIENZO.space.md,
    gap: 4,
  },
  avatarHintText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  avatarHintLink: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primary,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LIENZO.space.sm,
  },
  badgeCard: {
    width: '48.2%',
    flexGrow: 1,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: 12,
    gap: 4,
    backgroundColor: LIENZO.color.track,
  },
  badgeCardUnlocked: {
    backgroundColor: LIENZO.color.bg,
    borderColor: LIENZO.color.gold,
  },
  badgeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  badgeIconBoxUnlocked: {
    backgroundColor: LIENZO.color.goldSoft,
  },
  badgeTitle: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  badgeDesc: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  langPrefBlock: {
    gap: 10,
  },
  langPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  langPillActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  langPillFlag: {
    fontSize: 15,
  },
  langPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
  },
  langPillTextActive: {
    color: LIENZO.color.primaryInk,
    fontFamily: LIENZO.font.bold,
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

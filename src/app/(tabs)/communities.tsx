import { useFocusEffect, useRouter } from 'expo-router';
import {
  CaretRightIcon,
  CrownIcon,
  FlameIcon,
  GlobeHemisphereWestIcon,
  KeyIcon,
  LockIcon,
  PlusIcon,
  UsersThreeIcon,
  XIcon,
} from 'phosphor-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PAYWALL_ENABLED } from '@/constants/features';
import { LIENZO } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';
import type { Community } from '@/types/trivia';

export default function CommunitiesScreen() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const communities = useGameStore((s) => s.communities);
  const joinedCommunityIds = useGameStore((s) => s.joinedCommunityIds);
  const refreshCommunities = useGameStore((s) => s.refreshCommunities);
  const createCommunity = useGameStore((s) => s.createCommunity);
  const joinCommunity = useGameStore((s) => s.joinCommunity);
  const joinCommunityByCode = useGameStore((s) => s.joinCommunityByCode);

  const [tab, setTab] = useState<'mine' | 'public'>('mine');
  const [refreshing, setRefreshing] = useState(false);

  // Unirse por código privado
  const [inviteCode, setInviteCode] = useState('');
  const [codeMessage, setCodeMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [joiningCode, setJoiningCode] = useState(false);

  // Modal de creación de sala (Pro)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshCommunities();
    }, [refreshCommunities])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCommunities();
    setRefreshing(false);
  };

  const joinedSet = useMemo(() => new Set(joinedCommunityIds), [joinedCommunityIds]);

  const myRooms = useMemo(
    () => communities.filter((c) => joinedSet.has(c.id) || c.ownerId === profile.id),
    [communities, joinedSet, profile.id]
  );

  const publicRooms = useMemo(
    () => communities.filter((c) => !c.isPrivate),
    [communities]
  );

  const handlePressCreate = () => {
    if (profile.isAnonymous) {
      router.push('/auth-modal');
      return;
    }
    if (PAYWALL_ENABLED && !profile.isPremium) {
      router.push('/paywall?reason=daily_limit');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createCommunity({
      name: newName,
      description: newDesc,
      isPrivate: newIsPrivate,
    });
    setCreating(false);
    setNewName('');
    setNewDesc('');
    setNewIsPrivate(false);
    setShowCreateModal(false);
    router.push({
      pathname: '/community/[id]',
      params: { id: created.id },
    });
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    setJoiningCode(true);
    setCodeMessage(null);
    const res = await joinCommunityByCode(inviteCode);
    setJoiningCode(false);
    setCodeMessage({ ok: res.ok, text: res.message });
    if (res.ok && res.community) {
      setInviteCode('');
      router.push({
        pathname: '/community/[id]',
        params: { id: res.community.id },
      });
    }
  };

  const handleOpenRoom = async (room: Community) => {
    if (!joinedSet.has(room.id) && room.ownerId !== profile.id) {
      await joinCommunity(room.id);
    }
    router.push({
      pathname: '/community/[id]',
      params: { id: room.id },
    });
  };

  const visibleList = tab === 'mine' ? myRooms : publicRooms;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={LIENZO.color.primary}
            colors={[LIENZO.color.primary]}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>Rachas grupales y foros</Text>
            <Text style={styles.title}>Comunidades</Text>
          </View>

          <Pressable
            onPress={handlePressCreate}
            accessibilityRole="button"
            style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]}
          >
            <PlusIcon size={16} color={LIENZO.color.primaryInk} weight="bold" />
            <Text style={styles.createBtnText}>Crear sala</Text>
            {!profile.isPremium ? (
              <CrownIcon size={14} color={LIENZO.color.goldInk} weight="duotone" />
            ) : null}
          </Pressable>
        </View>

        {/* Unirse a una sala privada con código */}
        <View style={styles.codeBox}>
          <KeyIcon size={18} color={LIENZO.color.ink2} weight="regular" />
          <TextInput
            value={inviteCode}
            onChangeText={(txt) => {
              setInviteCode(txt.toUpperCase());
              setCodeMessage(null);
            }}
            onSubmitEditing={() => void handleJoinByCode()}
            placeholder="Código de sala privada (ej. TRIVIA1)"
            placeholderTextColor={LIENZO.color.ink2}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.codeInput}
          />
          <Pressable
            onPress={() => void handleJoinByCode()}
            disabled={!inviteCode.trim() || joiningCode}
            style={({ pressed }) => [
              styles.codeBtn,
              (!inviteCode.trim() || joiningCode) && styles.disabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.codeBtnText}>Unirme</Text>
          </Pressable>
        </View>
        {codeMessage ? (
          <Text
            style={[
              styles.codeFeedback,
              { color: codeMessage.ok ? LIENZO.color.successInk : LIENZO.color.danger },
            ]}
          >
            {codeMessage.text}
          </Text>
        ) : null}

        {/* Pestañas: Mis salas / Explorar públicas */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setTab('mine')}
            style={[styles.tabBtn, tab === 'mine' && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'mine' }}
          >
            <UsersThreeIcon
              size={17}
              color={tab === 'mine' ? LIENZO.color.primaryInk : LIENZO.color.ink2}
              weight={tab === 'mine' ? 'duotone' : 'regular'}
            />
            <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
              Mis salas ({myRooms.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('public')}
            style={[styles.tabBtn, tab === 'public' && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'public' }}
          >
            <GlobeHemisphereWestIcon
              size={17}
              color={tab === 'public' ? LIENZO.color.primaryInk : LIENZO.color.ink2}
              weight={tab === 'public' ? 'duotone' : 'regular'}
            />
            <Text style={[styles.tabText, tab === 'public' && styles.tabTextActive]}>
              Públicas ({publicRooms.length})
            </Text>
          </Pressable>
        </View>

        {visibleList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía no te sumaste a una comunidad</Text>
            <Text style={styles.emptyText}>
              Entrá a una sala pública o ingresá un código privado para sumar juntos a la racha
              grupal.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleList.map((room) => {
              const isJoined = joinedSet.has(room.id) || room.ownerId === profile.id;
              return (
                <Pressable
                  key={room.id}
                  onPress={() => void handleOpenRoom(room)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.roomCard, pressed && styles.pressed]}
                >
                  <View style={styles.roomTop}>
                    <View style={styles.roomBadgeRow}>
                      <View
                        style={[
                          styles.visPill,
                          room.isPrivate && { backgroundColor: LIENZO.color.goldSoft },
                        ]}
                      >
                        {room.isPrivate ? (
                          <LockIcon size={12} color={LIENZO.color.goldInk} weight="bold" />
                        ) : (
                          <GlobeHemisphereWestIcon
                            size={12}
                            color={LIENZO.color.primaryInk}
                            weight="duotone"
                          />
                        )}
                        <Text
                          style={[
                            styles.visText,
                            room.isPrivate && { color: LIENZO.color.goldInk },
                          ]}
                        >
                          {room.isPrivate ? 'Privada' : 'Pública'}
                        </Text>
                      </View>

                      <View style={styles.streakPill}>
                        <FlameIcon size={14} color={LIENZO.color.gold} weight="duotone" />
                        <Text style={styles.streakText}>
                          Racha {room.groupStreak} {room.groupStreak === 1 ? 'día' : 'días'}
                        </Text>
                      </View>
                    </View>

                    <CaretRightIcon size={18} color={LIENZO.color.ink2} weight="regular" />
                  </View>

                  <Text style={styles.roomName} numberOfLines={1}>
                    {room.name}
                  </Text>
                  {room.description ? (
                    <Text style={styles.roomDesc} numberOfLines={2}>
                      {room.description}
                    </Text>
                  ) : null}

                  <View style={styles.roomFooter}>
                    <Text style={styles.roomMeta}>
                      @{room.ownerUsername} · {room.memberCount}{' '}
                      {room.memberCount === 1 ? 'miembro' : 'miembros'}
                    </Text>
                    <Text style={styles.roomAction}>
                      {isJoined ? 'Entrar' : 'Unirme'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal para crear comunidad (Pro) */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Nueva comunidad</Text>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <XIcon size={20} color={LIENZO.color.ink} weight="regular" />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Como creador Pro vas a poder publicar avisos y compartir quizzes en el foro; los
              miembros suman a la racha grupal y reaccionan con emojis.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nombre de la sala</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Ej. Parroquia San José · Jóvenes"
                placeholderTextColor={LIENZO.color.ink2}
                style={styles.input}
                maxLength={48}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descripción breve</Text>
              <TextInput
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="De qué trata el grupo o qué quizzes van a compartir"
                placeholderTextColor={LIENZO.color.ink2}
                style={[styles.input, styles.textArea]}
                multiline
                maxLength={140}
              />
            </View>

            <View style={styles.visToggleRow}>
              <Pressable
                onPress={() => setNewIsPrivate(false)}
                style={[styles.visToggleBtn, !newIsPrivate && styles.visToggleActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: !newIsPrivate }}
              >
                <GlobeHemisphereWestIcon
                  size={16}
                  color={!newIsPrivate ? LIENZO.color.primaryInk : LIENZO.color.ink2}
                  weight="duotone"
                />
                <Text
                  style={[
                    styles.visToggleText,
                    !newIsPrivate && { color: LIENZO.color.primaryInk },
                  ]}
                >
                  Pública
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setNewIsPrivate(true)}
                style={[styles.visToggleBtn, newIsPrivate && styles.visToggleActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: newIsPrivate }}
              >
                <LockIcon
                  size={16}
                  color={newIsPrivate ? LIENZO.color.primaryInk : LIENZO.color.ink2}
                  weight="duotone"
                />
                <Text
                  style={[
                    styles.visToggleText,
                    newIsPrivate && { color: LIENZO.color.primaryInk },
                  ]}
                >
                  Privada (con código)
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => void handleCreateSubmit()}
              disabled={!newName.trim() || creating}
              style={({ pressed }) => [
                styles.primaryBtn,
                (!newName.trim() || creating) && styles.disabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {creating ? 'Creando sala…' : 'Crear comunidad'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingTop: 28,
    paddingBottom: 108,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
  },
  subtitle: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
  },
  createBtnText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    paddingLeft: 12,
    paddingRight: 6,
    backgroundColor: LIENZO.color.bg,
  },
  codeInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
    paddingVertical: 10,
  },
  codeBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: LIENZO.color.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink,
  },
  codeFeedback: {
    ...LIENZO.type.captionBold,
    marginTop: -6,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: LIENZO.color.track,
    borderRadius: LIENZO.radius.icon,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: LIENZO.color.bg,
  },
  tabText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  tabTextActive: {
    color: LIENZO.color.primaryInk,
  },
  list: {
    gap: 10,
  },
  roomCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 14,
    gap: 6,
  },
  roomTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  roomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  visPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  visText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.goldInk,
  },
  roomName: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    marginTop: 2,
  },
  roomDesc: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  roomMeta: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  roomAction: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primary,
  },
  emptyCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.xl,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  emptyText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LIENZO.space.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.block,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.xl,
    gap: 12,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSub: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  field: {
    gap: 4,
  },
  label: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  input: {
    minHeight: 46,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
  },
  textArea: {
    minHeight: 74,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  visToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visToggleBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  visToggleActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  visToggleText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  primaryBtn: {
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
  },
});

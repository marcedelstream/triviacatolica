import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  FlameIcon,
  LockIcon,
  PaperPlaneRightIcon,
  ShareNetworkIcon,
  SparkleIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenFrame } from '@/components/ScreenFrame';
import { LIENZO } from '@/constants/theme';
import { COMMUNITY_EMOJIS } from '@/services/communityService';
import { useGameStore } from '@/store/useGameStore';

const QUICK_SHARE_QUIZZES = [
  { slug: 'desafio-del-dia', title: 'Desafío del Día' },
  { slug: 'jugar-libre', title: 'Jugar libre (5 al azar)' },
  { slug: 'vida-diaria-adversidades-ansiedad', title: 'Fe en la vida diaria · Adversidades' },
  { slug: 'completa-frase-palabras-de-jesus', title: 'Completá la frase · Palabras de Jesús' },
  { slug: 'canciones-catolicas-clasicos-misa', title: 'Adiviná la canción · Clásicos de Misa' },
  { slug: 'santos-san-anibal-maria-di-francia', title: 'Especial: San Aníbal María Di Francia' },
];

export default function CommunityRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const profile = useGameStore((s) => s.profile);
  const communities = useGameStore((s) => s.communities);
  const communityPostsByRoom = useGameStore((s) => s.communityPostsByRoom);
  const loadCommunityPosts = useGameStore((s) => s.loadCommunityPosts);
  const publishCommunityPost = useGameStore((s) => s.publishCommunityPost);
  const toggleCommunityReaction = useGameStore((s) => s.toggleCommunityReaction);

  const [draft, setDraft] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<{ slug: string; title: string } | null>(null);
  const [showQuizPicker, setShowQuizPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const room = useMemo(() => communities.find((c) => c.id === id) ?? null, [communities, id]);
  const posts = useMemo(
    () => (id ? communityPostsByRoom[id] ?? [] : []),
    [communityPostsByRoom, id]
  );

  useFocusEffect(
    useCallback(() => {
      if (id) void loadCommunityPosts(id);
    }, [id, loadCommunityPosts])
  );

  const isOwner = Boolean(room && room.ownerId && room.ownerId === profile.id);

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/communities');
    }
  };

  const handleShareInvite = async () => {
    if (!room) return;
    const msg = `¡Sumate a mi comunidad «${room.name}» en Trivia Católica! Usá el código ${room.inviteCode} en la pestaña Salas para unirte a nuestra racha grupal.`;
    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(msg);
          setCopiedInvite(true);
          setTimeout(() => setCopiedInvite(false), 2200);
          return;
        }
      } catch {
        // fallback
      }
    }
    await Share.share({ message: msg });
  };

  const handlePublish = async () => {
    if (!room || !isOwner) return;
    const body = draft.trim() || (selectedQuiz ? `¡Les comparto este quiz para hoy!` : '');
    if (!body) return;
    setSending(true);
    await publishCommunityPost({
      communityId: room.id,
      postType: selectedQuiz ? 'quiz' : 'message',
      body,
      quizSlug: selectedQuiz?.slug ?? null,
      quizTitle: selectedQuiz?.title ?? null,
    });
    setSending(false);
    setDraft('');
    setSelectedQuiz(null);
    setShowQuizPicker(false);
  };

  if (!room) {
    return (
      <ScreenFrame edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={handleSafeBack} style={styles.backBtn} accessibilityRole="button">
            <ArrowLeftIcon size={24} color={LIENZO.color.ink} weight="regular" />
          </Pressable>
          <Text style={styles.topTitle}>Comunidad</Text>
          <View style={styles.topSpacer} />
        </View>
        <View style={styles.centerEmpty}>
          <Text style={styles.emptyTitle}>No encontramos esta sala</Text>
          <Pressable onPress={handleSafeBack} style={styles.primaryBtn} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Volver a Comunidades</Text>
          </Pressable>
        </View>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      {/* Cabecera */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleSafeBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver a Comunidades"
        >
          <ArrowLeftIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={styles.topMeta} numberOfLines={1}>
            @{room.ownerUsername} · {room.memberCount}{' '}
            {room.memberCount === 1 ? 'miembro' : 'miembros'}
          </Text>
        </View>

        <Pressable
          onPress={() => void handleShareInvite()}
          style={styles.inviteBtn}
          accessibilityRole="button"
          accessibilityLabel="Compartir código de la sala"
        >
          <ShareNetworkIcon size={18} color={LIENZO.color.primaryInk} weight="duotone" />
          <Text style={styles.inviteBtnText}>
            {copiedInvite ? 'Copiado' : room.inviteCode}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Racha Grupal */}
        <View style={styles.streakBanner}>
          <View style={styles.streakIconBox}>
            <FlameIcon size={24} color={LIENZO.color.gold} weight="duotone" />
          </View>
          <View style={styles.streakBody}>
            <Text style={styles.streakTitle}>
              Racha grupal: {room.groupStreak}{' '}
              {room.groupStreak === 1 ? 'día seguido' : 'días seguidos'}
            </Text>
            <Text style={styles.streakSub}>
              Cada partida que jugás mantiene viva la racha de toda la sala.
            </Text>
          </View>
          {room.isPrivate ? (
            <LockIcon size={16} color={LIENZO.color.goldInk} weight="duotone" />
          ) : (
            <UsersThreeIcon size={18} color={LIENZO.color.goldInk} weight="duotone" />
          )}
        </View>

        {/* Feed del foro / canal */}
        {posts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyTitle}>
              {isOwner
                ? 'Publicá el primer mensaje o quiz en tu sala'
                : `Todavía no hay publicaciones de @${room.ownerUsername}`}
            </Text>
            <Text style={styles.emptySub}>
              Los miembros pueden jugar los quizzes compartidos y reaccionar con emojis tipo
              WhatsApp.
            </Text>
          </View>
        ) : (
          <View style={styles.feed}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.postAuthor}>{post.authorName}</Text>
                  <Text style={styles.postHandle}>@{post.authorUsername}</Text>
                </View>

                <Text style={styles.postBody}>{post.body}</Text>

                {post.postType === 'quiz' && post.quizSlug ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/play/[levelId]',
                        params: { levelId: post.quizSlug! },
                      })
                    }
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.quizAttach, pressed && styles.pressed]}
                  >
                    <SparkleIcon size={18} color={LIENZO.color.primaryInk} weight="duotone" />
                    <View style={styles.quizAttachBody}>
                      <Text style={styles.quizAttachTag}>Quiz compartido</Text>
                      <Text style={styles.quizAttachTitle} numberOfLines={1}>
                        {post.quizTitle || post.quizSlug}
                      </Text>
                    </View>
                    <Text style={styles.quizAttachCta}>Jugar</Text>
                  </Pressable>
                ) : null}

                {/* Reacciones tipo WhatsApp */}
                <View style={styles.reactionsRow}>
                  {COMMUNITY_EMOJIS.map((emoji) => {
                    const count = post.reactionCounts[emoji] ?? 0;
                    const active = post.myReactions.includes(emoji);
                    return (
                      <Pressable
                        key={emoji}
                        onPress={() => toggleCommunityReaction(room.id, post.id, emoji)}
                        accessibilityRole="button"
                        accessibilityLabel={`Reaccionar con ${emoji}, ${count} reacciones`}
                        style={({ pressed }) => [
                          styles.reactChip,
                          active && styles.reactChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.reactEmoji}>{emoji}</Text>
                        {count > 0 ? (
                          <Text
                            style={[
                              styles.reactCount,
                              active && { color: LIENZO.color.primaryInk },
                            ]}
                          >
                            {count}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pie: solo el creador Pro puede escribir o compartir quizzes; los miembros reaccionan */}
      {isOwner ? (
        <View style={styles.composerWrap}>
          {showQuizPicker ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerRow}
            >
              {QUICK_SHARE_QUIZZES.map((q) => {
                const active = selectedQuiz?.slug === q.slug;
                return (
                  <Pressable
                    key={q.slug}
                    onPress={() => setSelectedQuiz(active ? null : q)}
                    style={[styles.quizPickChip, active && styles.quizPickChipActive]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.quizPickText,
                        active && { color: LIENZO.color.primaryInk },
                      ]}
                    >
                      {q.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.composerRow}>
            <Pressable
              onPress={() => setShowQuizPicker((v) => !v)}
              style={[
                styles.attachBtn,
                (showQuizPicker || selectedQuiz) && styles.attachBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Adjuntar un quiz"
            >
              <SparkleIcon
                size={20}
                color={
                  showQuizPicker || selectedQuiz ? LIENZO.color.primaryInk : LIENZO.color.ink2
                }
                weight="duotone"
              />
            </Pressable>

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={
                selectedQuiz
                  ? `Mensaje para «${selectedQuiz.title}»…`
                  : 'Escribí un mensaje para tu comunidad…'
              }
              placeholderTextColor={LIENZO.color.ink2}
              style={styles.composerInput}
            />

            <Pressable
              onPress={() => void handlePublish()}
              disabled={sending || (!draft.trim() && !selectedQuiz)}
              style={({ pressed }) => [
                styles.sendBtn,
                (sending || (!draft.trim() && !selectedQuiz)) && styles.disabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Publicar en la sala"
            >
              <PaperPlaneRightIcon size={19} color={LIENZO.color.onPrimary} weight="fill" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.readOnlyBar}>
          <Text style={styles.readOnlyText}>
            Solo @{room.ownerUsername} puede publicar · Tocá un emoji para reaccionar
          </Text>
        </View>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: LIENZO.space.md,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  backBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  topCenter: {
    flex: 1,
    minWidth: 0,
  },
  topTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
  },
  topMeta: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink2,
  },
  topSpacer: {
    width: LIENZO.touchMin,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inviteBtnText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.lg,
    paddingBottom: LIENZO.space.xxl,
    gap: 14,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LIENZO.color.goldSoft,
    borderRadius: LIENZO.radius.card,
    padding: 14,
  },
  streakIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBody: {
    flex: 1,
    gap: 2,
  },
  streakTitle: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.goldInk,
  },
  streakSub: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  feed: {
    gap: 12,
  },
  postCard: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: 14,
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postAuthor: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  postHandle: {
    ...LIENZO.type.caption,
    color: LIENZO.color.primaryInk,
  },
  postBody: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
  },
  quizAttach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.icon,
    padding: 12,
  },
  quizAttachBody: {
    flex: 1,
    minWidth: 0,
  },
  quizAttachTag: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  quizAttachTitle: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  quizAttachCta: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 11,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: LIENZO.radius.chip,
    borderWidth: LIENZO.borderWidth.hairline,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
  },
  reactChipActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  reactEmoji: {
    fontSize: 15,
  },
  reactCount: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink2,
  },
  emptyFeed: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: LIENZO.space.xl,
    alignItems: 'center',
    gap: 6,
  },
  centerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: LIENZO.space.xl,
    gap: 12,
  },
  emptyTitle: {
    ...LIENZO.type.item,
    color: LIENZO.color.ink,
    textAlign: 'center',
  },
  emptySub: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  composerWrap: {
    borderTopWidth: LIENZO.borderWidth.hairline,
    borderTopColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 10,
    gap: 8,
  },
  pickerRow: {
    gap: 6,
    paddingBottom: 2,
  },
  quizPickChip: {
    borderWidth: LIENZO.borderWidth.hairline,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: LIENZO.color.bg,
  },
  quizPickChipActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  quizPickText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink2,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnActive: {
    backgroundColor: LIENZO.color.primarySoft,
    borderColor: LIENZO.color.primary,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyBar: {
    borderTopWidth: LIENZO.borderWidth.hairline,
    borderTopColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.track,
    paddingHorizontal: LIENZO.space.xl,
    paddingVertical: 12,
    alignItems: 'center',
  },
  readOnlyText: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
    textAlign: 'center',
  },
  primaryBtn: {
    minHeight: LIENZO.buttonMinHeight,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
});

import {
  BellRingingIcon,
  BookOpenTextIcon,
  FlameIcon,
  LightningIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LIENZO } from '@/constants/theme';

interface NotificationPromptModalProps {
  visible: boolean;
  onEnable: () => Promise<boolean>;
  onDismiss: () => void;
}

export function NotificationPromptModal({
  visible,
  onEnable,
  onDismiss,
}: NotificationPromptModalProps) {
  const [working, setWorking] = useState(false);

  const handleAccept = async () => {
    setWorking(true);
    await onEnable();
    setWorking(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.bellBox}>
              <BellRingingIcon size={26} color={LIENZO.color.primaryInk} weight="duotone" />
            </View>
            <Pressable
              onPress={onDismiss}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar aviso de notificaciones"
            >
              <XIcon size={20} color={LIENZO.color.ink2} weight="regular" />
            </Pressable>
          </View>

          <Text style={styles.title}>¿Querés recibir avisos diarios?</Text>
          <Text style={styles.sub}>
            Te mandamos solo lo importante para acompañarte cada día, sin molestar. Podés cambiarlo
            cuando quieras desde tu Perfil.
          </Text>

          <View style={styles.benefits}>
            <View style={styles.benefitRow}>
              <View style={[styles.miniIcon, { backgroundColor: LIENZO.color.primarySoft }]}>
                <BookOpenTextIcon size={17} color={LIENZO.color.primaryInk} weight="duotone" />
              </View>
              <View style={styles.benefitBody}>
                <Text style={styles.benefitTitle}>Desafío del Día</Text>
                <Text style={styles.benefitText}>
                  Las lecturas y el Evangelio de cada mañana.
                </Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniIcon, { backgroundColor: LIENZO.color.goldSoft }]}>
                <FlameIcon size={17} color={LIENZO.color.goldInk} weight="duotone" />
              </View>
              <View style={styles.benefitBody}>
                <Text style={styles.benefitTitle}>Cuidá tu racha</Text>
                <Text style={styles.benefitText}>
                  Un recordatorio amable para no perder tus días seguidos.
                </Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniIcon, { backgroundColor: LIENZO.color.successSoft }]}>
                <LightningIcon size={17} color={LIENZO.color.successInk} weight="duotone" />
              </View>
              <View style={styles.benefitBody}>
                <Text style={styles.benefitTitle}>Duelos Versus y novedades</Text>
                <Text style={styles.benefitText}>
                  Enterate cuando un amigo te desafía o responde tu turno.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => void handleAccept()}
            disabled={working}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            {working ? (
              <ActivityIndicator color={LIENZO.color.onPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Activar notificaciones</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onDismiss}
            disabled={working}
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryBtnText}>Ahora no</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LIENZO.space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.block,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.xl,
    gap: LIENZO.space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellBox: {
    width: 50,
    height: 50,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  title: {
    ...LIENZO.type.title,
    color: LIENZO.color.ink,
  },
  sub: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  benefits: {
    gap: 10,
    marginVertical: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitBody: {
    flex: 1,
    gap: 1,
  },
  benefitTitle: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  benefitText: {
    ...LIENZO.type.caption,
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
  secondaryBtn: {
    minHeight: 44,
    borderRadius: LIENZO.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  pressed: {
    opacity: 0.88,
  },
});

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Notificaciones locales (recordatorio del Desafío del Día) y push remotas (Expo Push Service).
 * - Nunca dispara el diálogo nativo del sistema por sorpresa: primero se muestra el
 *   popup personalizado Lienzo (`NotificationPromptModal`) y solo si el usuario acepta
 *   se llama a `requestNotificationPermissionAndSetup`.
 * - Guarda el Expo push token en `public.user_push_tokens` para los envíos desde
 *   el panel admin (`send-push-notifications`) y futuros avisos de duelos Versus.
 */

export const ANDROID_CHANNEL_ID = 'default';
const DAILY_REMINDER_ID = 'daily-challenge-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let lastSaved: { userId: string; token: string } | null = null;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Trivia Católica',
    // eslint-disable-next-line import/namespace -- se reexporta con `export *`; tsc lo resuelve
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2F5BD3',
  });
}

async function fetchAndStoreExpoPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  if (!isSupabaseConfigured || !supabase) return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (!token) return;
  if (lastSaved && lastSaved.userId === userId && lastSaved.token === token) return;

  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' }
  );
  if (!error) {
    lastSaved = { userId, token };
  }
}

/** Programa un recordatorio amable todos los días a las 09:00 hs locales para el Desafío del Día. */
export async function scheduleDailyChallengeReminder(hour = 9, minute = 0): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureAndroidChannel();
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: 'Nuevo Desafío del Día',
        body: 'Leé el Evangelio de hoy, respondé 5 preguntas y mantené viva tu racha.',
        sound: 'default',
        data: { url: '/play/desafio-del-dia' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
      },
    });
  } catch {
    // Silencioso en emuladores o si el SO restringe alarmas exactas
  }
}

export async function cancelDailyChallengeReminder(userId?: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  }
  if (userId && isSupabaseConfigured && supabase) {
    await supabase
      .from('user_push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }
}

/**
 * Solicita permiso nativo (solo tras aceptar el popup personalizado Lienzo),
 * programa el recordatorio diario y registra el Expo push token en Supabase.
 */
export async function requestNotificationPermissionAndSetup(userId: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await window.Notification.requestPermission();
        return perm === 'granted';
      }
      return true;
    }

    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return false;

    await scheduleDailyChallengeReminder();
    await fetchAndStoreExpoPushToken(userId);
    return true;
  } catch {
    return false;
  }
}

/** Refresca el token silenciosamente solo si el usuario YA otorgó permiso anteriormente. */
export async function registerPushTokenForUser(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) return;
    await ensureAndroidChannel();
    await fetchAndStoreExpoPushToken(userId);
  } catch {
    // Sin red o sin FCM: se reintenta en la próxima sesión.
  }
}

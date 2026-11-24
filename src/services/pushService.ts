import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Notificaciones push (Expo Push Service).
 * - Pide permiso, obtiene el Expo push token y lo guarda en public.user_push_tokens
 *   para que la Edge Function `send-push-notifications` (panel admin) pueda enviarle.
 * - Requiere build nativo (en Expo Go para Android no hay push remotas desde SDK 53) y,
 *   en Android, FCM configurado (google-services.json + clave FCM V1 en EAS).
 */

export const ANDROID_CHANNEL_ID = 'default';

// Mostrar la notificación aunque la app esté abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let lastSaved: { userId: string; token: string } | null = null;

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  // Android 13+: el canal tiene que existir antes de pedir el token/permiso.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Trivia Católica',
      // eslint-disable-next-line import/namespace -- se reexporta con `export *`; tsc lo resuelve
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F5BD3',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

/** Registra (o refresca) el token del dispositivo para el usuario dado. Nunca lanza. */
export async function registerPushTokenForUser(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const token = await getExpoPushToken();
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
    if (!error) lastSaved = { userId, token };
  } catch {
    // Sin red, sin permiso o sin FCM: se reintenta en el próximo inicio de sesión.
  }
}

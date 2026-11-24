import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { registerPushTokenForUser } from '@/services/pushService';

function openFromNotification(response: Notifications.NotificationResponse | null) {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const url = response.notification.request.content.data?.url;
  // Solo rutas internas de la app (ej. "/play/desafio-del-dia" o "/category/santos").
  if (typeof url === 'string' && url.startsWith('/')) {
    router.push(url as never);
  }
}

/**
 * Montar una vez en el layout raíz:
 * - guarda el push token cada vez que hay sesión (anónima o con correo),
 * - al tocar una notificación con `data.url`, navega a esa pantalla.
 * `navigationReady` debe ser true cuando el <Stack> ya está montado.
 */
export function usePushNotifications(navigationReady: boolean) {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Sesión actual y cambios (login con correo, cuenta nueva, etc.).
    const authSub = supabase?.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (userId) void registerPushTokenForUser(userId);
    });
    return () => authSub?.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !navigationReady) return;

    // App abierta desde una notificación estando cerrada.
    openFromNotification(Notifications.getLastNotificationResponse());
    Notifications.clearLastNotificationResponse();

    // Notificación tocada con la app abierta o en segundo plano.
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response);
      Notifications.clearLastNotificationResponse();
    });
    return () => tapSub.remove();
  }, [navigationReady]);
}

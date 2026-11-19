import { Platform } from 'react-native';

export type SubscriptionPlan = 'monthly' | 'annual';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() ?? '';
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() ?? '';

export const isRevenueCatConfigured =
  Platform.OS !== 'web' &&
  ((Platform.OS === 'android' && Boolean(ANDROID_KEY)) ||
    (Platform.OS === 'ios' && Boolean(IOS_KEY)));

let configured = false;

async function getPurchasesSdk() {
  if (Platform.OS === 'web') return null;
  try {
    const mod = await import('react-native-purchases');
    return mod.default;
  } catch {
    return null;
  }
}

export async function initRevenueCat(userId: string): Promise<void> {
  if (!isRevenueCatConfigured || configured) return;
  const Purchases = await getPurchasesSdk();
  if (!Purchases) return;

  try {
    const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  } catch {
    // Continúa sin bloquear la app si corre en Expo Go sin nativo
  }
}

export async function getActiveEntitlement(): Promise<boolean> {
  if (!isRevenueCatConfigured || !configured) return false;
  const Purchases = await getPurchasesSdk();
  if (!Purchases) return false;

  try {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active['pro']);
  } catch {
    return false;
  }
}

export async function purchasePlan(plan: SubscriptionPlan): Promise<{
  success: boolean;
  isSandboxDemo: boolean;
  message: string;
}> {
  if (isRevenueCatConfigured && configured) {
    const Purchases = await getPurchasesSdk();
    if (Purchases) {
      try {
        const offerings = await Purchases.getOfferings();
        const pkg =
          plan === 'annual'
            ? offerings.current?.annual
            : offerings.current?.monthly;
        if (pkg) {
          const res = await Purchases.purchasePackage(pkg);
          const active = Boolean(res.customerInfo.entitlements.active['pro']);
          return {
            success: active,
            isSandboxDemo: false,
            message: active
              ? '¡Suscripción Pro activada!'
              : 'No se completó la suscripción.',
          };
        }
      } catch (err) {
        return {
          success: false,
          isSandboxDemo: false,
          message:
            err instanceof Error ? err.message : 'No se pudo iniciar la compra.',
        };
      }
    }
  }

  return {
    success: true,
    isSandboxDemo: true,
    message:
      'Modo demostración activado localmente. Cuando cargues tus claves de RevenueCat en .env se conectará a Google Play / App Store por OTA.',
  };
}

export async function restorePurchases(): Promise<{ restored: boolean; message: string }> {
  if (isRevenueCatConfigured && configured) {
    const Purchases = await getPurchasesSdk();
    if (Purchases) {
      try {
        const info = await Purchases.restorePurchases();
        const active = Boolean(info.entitlements.active['pro']);
        return {
          restored: active,
          message: active
            ? 'Compras restauradas correctamente.'
            : 'No se encontraron suscripciones activas.',
        };
      } catch {
        return { restored: false, message: 'Error al restaurar compras.' };
      }
    }
  }

  return {
    restored: false,
    message: 'Sin compras vinculadas todavía (RevenueCat en modo preparación).',
  };
}

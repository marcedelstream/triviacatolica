import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export interface AuthSessionResult {
  userId: string;
  isAnonymous: boolean;
  provider?: 'google' | 'apple' | null;
  mode: 'supabase' | 'local';
}

function generateLocalGuestId(): string {
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'triviacatolica',
    path: 'auth-callback',
  });
}

function extractTokensFromCallbackUrl(url: string): {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
} {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const accessToken =
      hashParams.get('access_token') ?? parsed.searchParams.get('access_token');
    const refreshToken =
      hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token');
    return { accessToken, refreshToken, code };
  } catch {
    return { accessToken: null, refreshToken: null, code: null };
  }
}

/**
 * Garantiza una sesión activa sin fricción desde el primer segundo (Guest Mode).
 * Si Supabase está configurado, usa Anonymous Sign-In; si no, crea un ID local persistente.
 */
export async function ensureAnonymousSession(existingUserId?: string): Promise<AuthSessionResult> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const user = sessionData.session.user;
        return {
          userId: user.id,
          isAnonymous: Boolean(user.is_anonymous),
          mode: 'supabase',
        };
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.user) {
        return {
          userId: data.user.id,
          isAnonymous: true,
          mode: 'supabase',
        };
      }
    } catch {
      // Fallback transparente a modo local
    }
  }

  return {
    userId: existingUserId || generateLocalGuestId(),
    isAnonymous: true,
    mode: 'local',
  };
}

async function updateProfileAfterAuth(displayName?: string): Promise<void> {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const payload: Record<string, unknown> = {
    is_anonymous: false,
    updated_at: new Date().toISOString(),
  };
  if (displayName?.trim()) {
    payload.display_name = displayName.trim();
  }

  await supabase.from('profiles').update(payload).eq('id', userData.user.id);
}

/**
 * Vincula la cuenta anónima a Google o Apple sin perder progreso ni user_id.
 * - En iOS con Apple: usa Apple Sign-In nativo (Face ID / Touch ID) con nonce SHA-256.
 * - En Google (y Apple fuera de iOS): abre sesión OAuth segura con expo-web-browser + redirectTo.
 */
export async function linkIdentityProvider(
  provider: 'google' | 'apple',
  displayName?: string
): Promise<{ ok: boolean; mode: 'supabase' | 'local'; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: true,
      mode: 'local',
      message: `Cuenta guardada en modo local (${provider === 'google' ? 'Google' : 'Apple'} listo para conectar con Supabase).`,
    };
  }

  try {
    // 1. Apple Sign-In nativo en iOS (Face ID / Touch ID)
    if (provider === 'apple' && Platform.OS === 'ios') {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (isAvailable) {
        const rawNonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          rawNonce
        );

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });

        if (!credential.identityToken) {
          return {
            ok: false,
            mode: 'supabase',
            message: 'Apple no devolvió token de identidad.',
          };
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce,
        });

        if (error) {
          return { ok: false, mode: 'supabase', message: error.message };
        }

        const appleName =
          displayName?.trim() ||
          [credential.fullName?.givenName, credential.fullName?.familyName]
            .filter(Boolean)
            .join(' ')
            .trim();

        await updateProfileAfterAuth(appleName || undefined);
        return {
          ok: true,
          mode: 'supabase',
          message: 'Cuenta vinculada con Apple.',
        };
      }
    }

    // 2. OAuth con linkIdentity (preserva user_id anónimo en Google / Web / Android)
    const redirectTo = getOAuthRedirectUri();
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) {
      return { ok: false, mode: 'supabase', message: error.message };
    }

    if (Platform.OS !== 'web' && data?.url) {
      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (authResult.type !== 'success' || !authResult.url) {
        return {
          ok: false,
          mode: 'supabase',
          message: 'Inicio de sesión cancelado.',
        };
      }

      const { accessToken, refreshToken, code } = extractTokensFromCallbackUrl(authResult.url);
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          return { ok: false, mode: 'supabase', message: exchangeErr.message };
        }
      } else if (accessToken && refreshToken) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionErr) {
          return { ok: false, mode: 'supabase', message: sessionErr.message };
        }
      }
    }

    await updateProfileAfterAuth(displayName);
    return {
      ok: true,
      mode: 'supabase',
      message: `Cuenta vinculada con ${provider === 'google' ? 'Google' : 'Apple'}.`,
    };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'ERR_REQUEST_CANCELED') {
      return {
        ok: false,
        mode: 'supabase',
        message: 'Inicio de sesión cancelado.',
      };
    }
    return {
      ok: false,
      mode: 'supabase',
      message: err instanceof Error ? err.message : 'No se pudo vincular la cuenta.',
    };
  }
}

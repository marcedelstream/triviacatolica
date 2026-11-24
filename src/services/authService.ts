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
  provider?: 'google' | 'apple' | 'email' | null;
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

interface GuestHandoffTicket {
  guestId: string;
  token: string;
}

/**
 * Si la sesión actual es anónima, genera un pase temporal en Supabase antes de iniciar sesión
 * con correo o Apple/Google. Así, apenas se autentica la cuenta real, fusionamos el progreso
 * y borramos el perfil anónimo viejo para evitar duplicados en el Ranking y @usuarios bloqueados.
 */
async function prepareGuestHandoff(): Promise<GuestHandoffTicket | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.rpc('prepare_guest_handoff');
    if (error || !data || typeof data !== 'object') return null;
    const raw = data as { guest_id?: unknown; token?: unknown };
    if (typeof raw.guest_id === 'string' && typeof raw.token === 'string') {
      return { guestId: raw.guest_id, token: raw.token };
    }
    return null;
  } catch {
    return null;
  }
}

async function completeGuestHandoff(
  ticket: GuestHandoffTicket | null,
  newUserId?: string
): Promise<void> {
  if (!ticket || !isSupabaseConfigured || !supabase) return;
  if (newUserId && newUserId === ticket.guestId) return;
  try {
    await supabase.rpc('complete_guest_handoff', {
      p_guest_id: ticket.guestId,
      p_token: ticket.token,
    });
  } catch {
    // Silencioso si todavía no se corrió la migración 007
  }
}

async function updateProfileAfterAuth(displayName?: string): Promise<string | undefined> {
  if (!supabase) return undefined;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return undefined;

  const payload: Record<string, unknown> = {
    is_anonymous: false,
    updated_at: new Date().toISOString(),
  };
  if (displayName?.trim()) {
    payload.display_name = displayName.trim();
  }

  await supabase.from('profiles').update(payload).eq('id', userData.user.id);
  return userData.user.id;
}

/**
 * Vincula la cuenta anónima a Google o Apple sin perder progreso ni dejar cuentas fantasma.
 * - En iOS con Apple: usa Apple Sign-In nativo (Face ID / Touch ID) con nonce SHA-256.
 * - En Google (y Apple fuera de iOS): abre sesión OAuth segura con expo-web-browser + redirectTo.
 */
export async function linkIdentityProvider(
  provider: 'google' | 'apple',
  displayName?: string
): Promise<{ ok: boolean; userId?: string; mode: 'supabase' | 'local'; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: true,
      mode: 'local',
      message: `Cuenta guardada en modo local (${provider === 'google' ? 'Google' : 'Apple'} listo para conectar con Supabase).`,
    };
  }

  try {
    const handoff = await prepareGuestHandoff();

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

        const { data: appleData, error } = await supabase.auth.signInWithIdToken({
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

        await completeGuestHandoff(handoff, appleData.user?.id);
        const finalId = await updateProfileAfterAuth(appleName || undefined);
        return {
          ok: true,
          userId: finalId ?? appleData.user?.id,
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

    const finalId = await updateProfileAfterAuth(displayName);
    await completeGuestHandoff(handoff, finalId);
    return {
      ok: true,
      userId: finalId,
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

/**
 * Inicia sesión con correo electrónico y contraseña (para usuarios ya registrados).
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ ok: boolean; userId?: string; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Ingresá un correo electrónico válido.' };
  }
  if (!password || password.length < 6) {
    return { ok: false, message: 'Ingresá tu contraseña (mínimo 6 caracteres).' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, message: 'Sesión iniciada correctamente.' };
  }

  try {
    const handoff = await prepareGuestHandoff();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      const msg = error?.message?.toLowerCase() ?? '';
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        return {
          ok: false,
          message:
            'Correo o contraseña incorrectos. Si antes entrabas con código al correo, usá "Entrar con código" para definir tu contraseña.',
        };
      }
      return {
        ok: false,
        message: error?.message || 'No pudimos iniciar sesión. Revisá tus datos.',
      };
    }

    await completeGuestHandoff(handoff, data.user.id);
    await updateProfileAfterAuth();
    return {
      ok: true,
      userId: data.user.id,
      message: '¡Bienvenido de nuevo!',
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
    };
  }
}

/**
 * Crea una cuenta nueva con correo y contraseña. Si Supabase exige confirmar el correo,
 * devuelve `needsEmailConfirmation: true` para ingresar el código de 6 dígitos en el mismo modal.
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<{
  ok: boolean;
  userId?: string;
  needsEmailConfirmation?: boolean;
  message: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Ingresá un correo electrónico válido.' };
  }
  if (!password || password.length < 6) {
    return { ok: false, message: 'Elegí una contraseña de al menos 6 caracteres.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, message: '¡Cuenta creada correctamente!' };
  }

  try {
    const handoff = await prepareGuestHandoff();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: displayName?.trim() ? { display_name: displayName.trim() } : undefined,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already')) {
        return {
          ok: false,
          message: 'Ese correo ya tiene una cuenta. Cambiá a "Iniciar sesión" o usá un código al correo.',
        };
      }
      return { ok: false, message: error.message };
    }

    if (data.session && data.user) {
      await completeGuestHandoff(handoff, data.user.id);
      await updateProfileAfterAuth(displayName);
      return {
        ok: true,
        userId: data.user.id,
        message: '¡Cuenta creada! Tu progreso quedó guardado.',
      };
    }

    // Supabase envió correo de confirmación (OTP de 6 dígitos)
    return {
      ok: true,
      needsEmailConfirmation: true,
      message: `Enviamos un código de 6 dígitos a ${cleanEmail} para confirmar tu cuenta.`,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'No pudimos crear la cuenta ahora.',
    };
  }
}

/**
 * Permite definir o actualizar la contraseña de la cuenta actualmente autenticada
 * (útil después de entrar con código OTP para cuentas creadas anteriormente).
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, message: 'Contraseña guardada.' };
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: '¡Contraseña guardada! Ya podés entrar con correo y contraseña.' };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'No pudimos guardar la contraseña.',
    };
  }
}

/**
 * Envía un código OTP de 6 dígitos al correo del usuario mediante Supabase Auth.
 */
export async function sendEmailOtp(
  email: string
): Promise<{ ok: boolean; mode: 'supabase' | 'local'; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      ok: false,
      mode: isSupabaseConfigured ? 'supabase' : 'local',
      message: 'Ingresá un correo electrónico válido.',
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: true,
      mode: 'local',
      message: 'Te enviamos un código de verificación (modo local: ingresá cualquier 6 dígitos).',
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        ok: false,
        mode: 'supabase',
        message: error.message,
      };
    }

    return {
      ok: true,
      mode: 'supabase',
      message: `Enviamos un código de 6 dígitos a ${cleanEmail}. Revisá tu bandeja de entrada o spam.`,
    };
  } catch (err) {
    return {
      ok: false,
      mode: 'supabase',
      message:
        err instanceof Error
          ? err.message
          : 'No pudimos enviar el código en este momento.',
    };
  }
}

/**
 * Verifica el código OTP de 6 dígitos enviado por correo y devuelve el userId autenticado.
 */
export async function verifyEmailOtp(
  email: string,
  token: string,
  displayName?: string
): Promise<{ ok: boolean; userId?: string; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.replace(/\s+/g, '').trim();

  if (cleanToken.length < 6) {
    return { ok: false, message: 'Ingresá el código completo de 6 dígitos.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: true,
      message: 'Correo verificado correctamente.',
    };
  }

  try {
    const handoff = await prepareGuestHandoff();

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    });

    if (error || !data.user) {
      return {
        ok: false,
        message: error?.message || 'El código es incorrecto o venció. Probá pedir uno nuevo.',
      };
    }

    await completeGuestHandoff(handoff, data.user.id);
    await updateProfileAfterAuth(displayName);
    return {
      ok: true,
      userId: data.user.id,
      message: '¡Correo verificado! Tu progreso quedó guardado.',
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : 'No se pudo verificar el código.',
    };
  }
}

/**
 * Cierra la sesión de la cuenta. Después el store crea una sesión invitada nueva.
 */
export async function signOutUser(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Si falla la red, igual limpiamos la sesión local
  }
}

/**
 * Elimina la cuenta del usuario y todos sus datos (perfil, progreso) con la función
 * `delete_own_account` de Supabase, y cierra la sesión.
 */
export async function deleteOwnAccount(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, message: 'Tus datos locales fueron eliminados.' };
  }
  try {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      return {
        ok: false,
        message:
          'No pudimos eliminar la cuenta en este momento. Revisá tu conexión o escribinos a hola@triviacatolica.com.',
      };
    }
    await supabase.auth.signOut().catch(() => undefined);
    return { ok: true, message: 'Tu cuenta y tus datos fueron eliminados.' };
  } catch {
    return {
      ok: false,
      message:
        'No pudimos eliminar la cuenta en este momento. Revisá tu conexión o escribinos a hola@triviacatolica.com.',
    };
  }
}

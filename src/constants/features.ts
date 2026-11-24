/**
 * Flags y límites de producto de Trivia Católica.
 *
 * - PAYWALL_ENABLED = true habilita los límites diarios (3 quizzes/día gratis) y los
 *   puntos de oferta del Plan Pro. Mientras RevenueCat no tenga las API keys reales,
 *   el botón de activar Pro funciona en modo prueba para testers.
 * - GUEST_FREE_QUIZZES_LIMIT = 1 permite probar 1 quiz completo como visitante y luego
 *   pide crear cuenta o iniciar sesión para seguir jugando y guardar el progreso.
 */
export const PAYWALL_ENABLED = true;
export const DAILY_FREE_QUIZZES_LIMIT = 3;
export const GUEST_FREE_QUIZZES_LIMIT = 1;

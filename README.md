# Trivia Católica — MVP (Expo + Supabase + Línea Gráfica "Lienzo")

App móvil (Android, iOS y Web) construida con **Expo**, **Expo Router**, **TypeScript**, **Zustand**, **Supabase** y el sistema de diseño **Lienzo** (*Source Sans 3* + *Phosphor Icons*).

## Qué incluye esta versión

- **Inicio fiel a `boceto-inicio.html`**: saludo contextual, chips de racha y vidas, carrusel de banners administrables (Oración, Iniciativa, Novedad), bloque sólido **Desafío del día**, las 5 categorías con progreso y la sección inferior **Vatican News** con mini-quiz de 3 preguntas por noticia.
- **Camino progresivo por categoría** (`/category/[slug]`): 3 niveles por categoría (2 gratuitos + 1 Pro), estrellas y desbloqueo secuencial.
- **Partida de trivia** (`/play/[levelId]`, `/play/daily` y `/play/news-[id]`): selección + confirmación segura para adultos mayores, 6 estados de respuesta (siempre color + ícono + texto), explicación doctrinal inmediata con cita del CIC/Biblia, reporte de errores y temporizador opcional (desactivado por defecto).
- **Onboarding sin fricción y Paywall**: Guest Mode transparente, modal suave para vincular Google/Apple (`/auth-modal`) y pantalla Pro (`/paywall` + `src/lib/revenuecat.ts`).
- **Identidad lista para tiendas**: nombre **Trivia Católica** e ícono propio estilo Lienzo (`assets/images/icon.png`, `android-icon-foreground.png`, `splash-icon.png`, `favicon.png`).
- **Backend Supabase listo**:
  - `supabase/migrations/001_initial_schema.sql`: tablas base, vista `leaderboard_top`, trigger `handle_new_user` y RLS.
  - `supabase/migrations/002_vatican_news.sql`: tabla `news_quizzes` para las noticias de Vatican News.
  - `supabase/seed.sql`: 5 categorías, 15 niveles, 30 preguntas doctrinales y 3 banners.
  - `supabase/functions/generate-questions/index.ts`: Edge Function para generar preguntas con Gemini Structured Outputs.
  - `supabase/functions/sync-vatican-news/index.ts`: Edge Function para leer el RSS oficial `https://www.vaticannews.va/es.rss.xml` y generar automáticamente 3 preguntas por noticia con Gemini.

---

## Cómo probarlo en tu teléfono HOY

### Opción 1 — Al instante con Expo Go (Android e iOS, gratis)
1. Instalá **Expo Go** desde Google Play o App Store.
2. En esta carpeta ejecutá:
   ```powershell
   npx expo start
   ```
3. Escaneá el código QR con la cámara (iPhone) o desde Expo Go (Android). *(Ambos dispositivos deben estar en el mismo Wi-Fi, o usá `npx expo start --tunnel`.)*

### Opción 2 — Instalarla como app propia con tu ícono y nombre (EAS Build)
Este proyecto ya incluye `eas.json` listo para Android e iOS:

1. Instalá EAS CLI e iniciá sesión en tu cuenta gratuita de Expo:
   ```powershell
   npm install -g eas-cli
   eas login
   eas init
   ```
2. **Para Android (APK instalable directo en tu teléfono, sin pagar licencia):**
   - App independiente lista para usar sin PC encendida (*Preview APK*):
     ```powershell
     eas build --platform android --profile preview
     ```
   - O **Development Build** (para desarrollar en vivo + luego integrar RevenueCat):
     ```powershell
     npx expo install expo-dev-client
     eas build --platform android --profile development
     ```
   Al terminar, EAS te da un link/QR para descargar e instalar el `.apk` directo en tu Android.
3. **Para iPhone (iOS):**
   - En simulador de Mac (gratis):
     ```powershell
     eas build --platform ios --profile development-simulator
     ```
   - En un iPhone físico: requiere cuenta de **Apple Developer Program** (USD 99/año). Con esa cuenta activa, registrás el dispositivo con `eas device:create` y corrés:
     ```powershell
     eas build --platform ios --profile preview
     ```

---

## Cómo conectar tu proyecto de Supabase

1. Copiá `.env.example` a `.env` y completá `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. En el SQL Editor de Supabase ejecutá en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_vatican_news.sql`
   - `supabase/seed.sql`
3. Activá **Anonymous Sign-Ins** en *Authentication → Providers*.
4. Desplegá las Edge Functions (`generate-questions` y `sync-vatican-news`) configurando el secreto `GEMINI_API_KEY`.

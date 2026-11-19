# Documento Técnico del MVP: Trivia Católica (Expo + Supabase)

Este documento sirve como especificación base para arrancar el desarrollo local en [Google Antigravity](https://antigravity.google/blog/gemini-4-neon-in-google-antigravity/) usando [Gemini 4 Neon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/). Está diseñado para una app móvil nativa en Android e iOS con experiencia de niveles y rachas estilo Duolingo, onboarding sin login obligatorio y paywall desde el MVP.

## 1. Alcance del MVP y Hoja de Ruta

### Incluido en el MVP (Fase 1)
* **Juego por niveles y tópicos:** Mapa vertical progresivo con tópicos iniciales (Sagradas Escrituras, Sacramentos, Vida de Santos, Liturgia y Misa, Historia de la Iglesia).
* **Sistema de rachas, XP y vidas:** Racha diaria, puntos de experiencia por respuesta correcta y límite de vidas (3 vidas gratuitas por sesión) para incentivar la conversión al plan Pro.
* **Onboarding sin fricción (Guest Mode):** El usuario abre la app y juega de inmediato sin crear cuenta. Al completar el Nivel 1 (o tras 2 partidas), aparece un modal suave para iniciar sesión con Google o Apple y guardar su racha.
* **Explicación doctrinal inmediata:** Cada respuesta muestra una breve explicación con referencia (Catecismo de la Iglesia Católica o cita bíblica) y un botón para reportar posibles errores.
* **Paywall funcional (Android e iOS):** Suscripción mensual/anual con vidas infinitas, acceso completo a todos los niveles/tópicos y protector de racha.
* **Banco de preguntas autoalimentado:** Generación periódica por lotes mediante IA hacia Supabase para evitar latencia y costos por partida.

### Evolución Posterior (Fases 2 y 3)
* **Fase 2:** Perfiles públicos, tabla de posiciones semanal (ligas) y logros/insignias.
* **Fase 3:** Modo Versus en tiempo real (usando Supabase Realtime) y torneos parroquiales o temáticos.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Motivo en el MVP |
| :--- | :--- | :--- |
| **App Móvil** | [Expo](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) (TypeScript) | Un solo código para Android e iOS, enrutamiento basado en archivos y experiencia previa del desarrollador. |
| **Estado Local** | Zustand + AsyncStorage | Manejo liviano de la partida activa, caché offline y progreso antes de sincronizar. |
| **Base de Datos y Auth** | [Supabase](https://supabase.com/docs) (Postgres + [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)) | Permite sesión anónima transparente desde el primer segundo y luego vincular Google/Apple sin perder el `user_id`. |
| **Lógica Serverless** | [Supabase Edge Functions](https://supabase.com/docs/guides/functions) + [`pg_cron`](https://supabase.com/docs/guides/functions/schedule-functions) | Ejecuta la generación de preguntas en segundo plano sin exponer claves de API en la app móvil. |
| **Generación de Contenido** | [Gemini API](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-neon) con [Structured Outputs](https://aistudio.google.com/docs/structured-output) | Devuelve lotes de preguntas en JSON estricto validado por esquema. |
| **Monetización / Paywall** | [RevenueCat](https://www.revenuecat.com/docs/getting-started/installation/expo) (`react-native-purchases`) | Unifica Google Play Billing y App Store StoreKit con validación en servidor y paywalls remotos (requiere *development build* de Expo según la [guía de compras in-app](https://docs.expo.dev/guides/in-app-purchases/)). |

---

## 3. Estructura de Carpetas Sugerida (Expo Router)

```text
trivia-catolica/
├── app/
│   ├── _layout.tsx              # Providers (Auth, RevenueCat, Theme)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tabs: Camino, Tópicos, Perfil
│   │   ├── index.tsx            # Mapa de niveles, racha y vidas
│   │   ├── topics.tsx           # Práctica libre por tópico
│   │   └── profile.tsx          # Estadísticas, cuenta y estado Pro
│   ├── play/
│   │   └── [levelId].tsx        # Pantalla de trivia activa + feedback
│   ├── auth-modal.tsx           # Modal de login suave (Google / Apple)
│   └── paywall.tsx              # Pantalla de suscripción (RevenueCat)
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Cliente Supabase + persistencia de sesión
│   │   └── revenuecat.ts        # Inicialización y helpers de entitlements
│   ├── store/
│   │   └── useGameStore.ts      # Estado de partida, racha, vidas y XP
│   ├── services/
│   │   ├── authService.ts       # signInAnonymously + linkIdentity
│   │   └── quizService.ts       # Consultas de niveles, preguntas y reportes
│   └── components/
│       ├── LevelNode.tsx        # Nodo interactivo del camino
│       ├── QuestionCard.tsx     # Tarjeta de pregunta y 4 opciones
│       └── FeedbackSheet.tsx    # Bottom sheet con explicación y cita
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── generate-questions/
│           └── index.ts         # Edge Function para generar lotes con Gemini
└── MVP_SPEC.md                  # Este documento
```

---

## 4. Esquema SQL para Supabase

Ejecutá esta migración inicial en el SQL Editor de Supabase o mediante Supabase CLI. Deja listas las tablas del MVP y preparadas las relaciones para futuras ligas y torneos.

```sql
-- 1. Tópicos principales
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  icon text not null,
  sort_order int not null default 0,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Niveles del camino (estilo Duolingo)
create table public.levels (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  level_number int not null unique,
  title text not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  questions_per_round int not null default 5,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Banco de preguntas (generadas por lotes y auditables)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  difficulty smallint not null check (difficulty between 1 and 3),
  prompt text not null,
  options jsonb not null, -- array de 4 strings: ["A", "B", "C", "D"]
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation text not null,
  source_ref text, -- ej: "CIC 1213" o "Mt 16,18"
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_questions_topic_diff on public.questions(topic_id, difficulty) where is_active = true;

-- 4. Perfil y progreso del usuario (soporta usuarios anónimos y registrados)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default true,
  xp int not null default 0,
  streak_count int not null default 0,
  longest_streak int not null default 0,
  last_played_date date,
  hearts int not null default 3,
  hearts_updated_at timestamptz not null default now(),
  games_played_guest int not null default 0,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Progreso por nivel completado
create table public.user_level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  level_id uuid not null references public.levels(id) on delete cascade,
  best_score int not null default 0,
  stars smallint not null default 0 check (stars between 0 and 3),
  completed_at timestamptz not null default now(),
  unique(user_id, level_id)
);

-- 6. Reportes de preguntas (control de calidad doctrinal)
create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil automáticamente al crearse cualquier usuario (incluso anónimo)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_anonymous)
  values (new.id, coalesce(new.is_anonymous, true));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seguridad RLS
alter table public.topics enable row level security;
alter table public.levels enable row level security;
alter table public.questions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_level_progress enable row level security;
alter table public.question_reports enable row level security;

create policy "Lectura pública de tópicos" on public.topics for select using (true);
create policy "Lectura pública de niveles" on public.levels for select using (true);
create policy "Lectura pública de preguntas activas" on public.questions for select using (is_active = true);

create policy "Usuario ve su propio perfil" on public.profiles for select using (auth.uid() = id);
create policy "Usuario actualiza su propio perfil" on public.profiles for update using (auth.uid() = id);

create policy "Usuario gestiona su progreso" on public.user_level_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuario autenticado o anónimo puede reportar" on public.question_reports
  for insert with check (auth.uid() = user_id);
```

---

## 5. Flujo de Autenticación Sin Fricción y Paywall

### Regla de Onboarding (Guest -> Login -> Pro)
1. **Primer ingreso:** Al abrir la app sin sesión previa, se ejecuta `supabase.auth.signInAnonymously()` en segundo plano ([documentación oficial](https://supabase.com/docs/guides/auth/auth-anonymous)). El usuario va directo al mapa de niveles sin ver formularios.
2. **Tope suave de invitado:** Cuando `games_played_guest >= 2` (o al intentar iniciar el Nivel 2) y `is_anonymous === true`, se abre `auth-modal.tsx` invitando a guardar su racha y XP con **Continuar con Google** o **Continuar con Apple**.
3. **Migración sin pérdida:** Se usa la vinculación de identidad (`linkIdentity` / `signInWithIdToken`) para convertir el usuario anónimo en definitivo manteniendo su mismo `user_id`, racha y estrellas.
4. **Disparadores del Paywall (RevenueCat):**
   * El usuario se queda sin vidas (`hearts === 0`) y quiere seguir jugando sin esperar recarga.
   * El usuario toca un nivel o tópico marcado con `is_premium = true`.
   * El usuario toca el botón **Pro** en la barra superior o en su perfil.

### Integración con RevenueCat en Expo
* Instalar `react-native-purchases` siguiendo la [guía oficial de RevenueCat para Expo](https://www.revenuecat.com/docs/getting-started/installation/expo).
* Usar `npx expo prebuild` / EAS Development Build (no funciona en Expo Go).
* Pasar el `user.id` de Supabase como `appUserID` en `Purchases.logIn(user.id)` para sincronizar compras entre Android, iOS y tu base de datos (opcionalmente actualizar `profiles.is_premium` vía webhook de RevenueCat hacia una Edge Function).

---

## 6. Generación Automática de Preguntas (Edge Function + Gemini)

En lugar de llamar a la IA en tiempo real en cada partida, configurá una [Edge Function](https://supabase.com/docs/guides/functions) que genere lotes de preguntas con [Structured Outputs](https://aistudio.google.com/docs/structured-output) y las inserte en `public.questions`. Podés dispararla manualmente al inicio y luego semanalmente con [`pg_cron`](https://supabase.com/docs/guides/functions/schedule-functions).

### Esquema JSON esperado de la API de Gemini
```json
{
  "type": "ARRAY",
  "items": {
    "type": "OBJECT",
    "properties": {
      "prompt": { "type": "STRING" },
      "options": {
        "type": "ARRAY",
        "items": { "type": "STRING" }
      },
      "correct_index": { "type": "INTEGER" },
      "explanation": { "type": "STRING" },
      "source_ref": { "type": "STRING" }
    },
    "required": ["prompt", "options", "correct_index", "explanation", "source_ref"]
  }
}
```

### Reglas de Prompt para Precisión Doctrinal
* Pedir fidelidad estricta al **Catecismo de la Iglesia Católica (CIC)** y a la **Biblia católica** (incluyendo libros deuterocanónicos cuando corresponda).
* Exigir exactamente 4 opciones plausibles, sin ambigüedades, y una explicación de máximo 2 frases con la cita exacta en `source_ref` (por ejemplo, `"CIC 1324"` o `"Jn 6,51"`).
* Enviar los últimos 20 títulos de preguntas existentes de ese tópico para evitar duplicados.

---

## 7. Prompt Inicial para Pegar en Google Antigravity

Una vez que guardes este archivo como `MVP_SPEC.md` en la raíz de tu carpeta local y abras el proyecto en [Google Antigravity](https://antigravity.google/blog/gemini-4-neon-in-google-antigravity/) con **Gemini 4 Neon**, pegá este mensaje para arrancar:

> Lee `MVP_SPEC.md` completo. Vamos a construir el MVP paso a paso en esta carpeta.
>
> **Paso 1:** Inicializa un proyecto Expo con TypeScript y Expo Router, configura el cliente de Supabase (`src/lib/supabase.ts`), crea el archivo de migración `supabase/migrations/001_initial_schema.sql` con el SQL del documento y agrega un archivo `supabase/seed.sql` con 5 tópicos católicos, 5 niveles y 25 preguntas reales listas para probar.
>
> No instales RevenueCat todavía; primero dejemos funcionando el flujo completo de juego (mapa de niveles, partida con vidas/racha/feedback, usuario anónimo y modal de login suave) y después integramos el paywall con development build.

# Trivia Católica — Pendientes a Revisar y Roadmap de Ideas

Documento vivo de trabajo. Separa lo que queda **pendiente para el próximo ciclo de ajustes y lanzamiento** de las **ideas mapeadas para próximas versiones**.

---

## 0. Bloqueantes antes de publicar v1.0 (revisión 2026-11-20)

- [x] **Links compartidos dan 404:** publicado el 2026-11-23. `/play/*` y `/category/*` cargan `landing/abrir.html` (rewrite en `vercel.json`): en Android intenta abrir la app con `intent://` y, si no está, muestra la descarga de Google Play. Cuando salga en iOS, completar `IOS_URL` en ese archivo.
- [ ] **Deep links sin verificar:** `app.json` declara `associatedDomains` (iOS) e `intentFilters` con `autoVerify` (Android), pero faltan `/.well-known/apple-app-site-association` y `/.well-known/assetlinks.json`. Hacen falta el **Apple Team ID** y el **SHA-256 del certificado de firma** (Play Console → Integridad de la app). El redirect de `www` ya excluye `/.well-known` y `vercel.json` sirve ambos archivos como JSON; solo falta crearlos en `landing/.well-known/`.
- [x] **Eliminar cuenta desde la app (Apple 5.1.1(v)):** Perfil → *Cuenta y ayuda* tiene Soporte, Privacidad, Términos, **Cerrar sesión** (solo cuentas vinculadas) y **Eliminar cuenta y datos** con confirmación (borra el usuario real vía `delete_own_account`).
- [x] **Usuario repetido rompe la sincronización:** onboarding y Perfil consultan `is_username_available` antes de guardar; si igual choca, se guarda XP y racha sin el usuario y se avisa en Perfil. Al iniciar sesión con correo se trae el progreso de la cuenta y se combina con el local en vez de pisarlo.
- [x] **Migración 005 (usuario libre + eliminar cuenta):** ejecutada en Supabase.
- [x] **Correos de Supabase:** plantillas activas y enviando correctamente.
- [x] **Migración 004 (categoría Virgen María):** ejecutada en Supabase.
- [x] **Migración 006 (cuestionarios, niveles, fuentes y Desafío del día):** ejecutada el 2026-11-23 en el SQL Editor de Supabase (`questions.level_id`, `public.daily_challenges`, 8 categorías, 32 niveles, 160 preguntas vinculadas 1-a-1 a su nivel, 316 textos en `reference_texts` y 13 desafíos diarios iniciales).
- [ ] **Edge Function `sync-daily-challenge` + cron diario:** desplegar `sync-daily-challenge` con `GEMINI_API_KEY` y programar un cron diario (`0 3 * * *` UTC) para que genere automáticamente el Desafío del día según la Primera Lectura + Evangelio del día (respetando cualquier fecha programada manualmente con `is_custom = true`). Además requiere el secreto `CRON_SECRET` (está en `supabase/.env.local`, no se sube al repo): cargarlo en Edge Functions → Secrets y mandarlo en el header `x-cron-secret` del cron; sin él responde 401.
- [ ] **Lint:** `npx expo lint` da errores de reglas del React Compiler (`react-hooks/refs` por `useRef(new Animated.Value())`, `set-state-in-effect`) en onboarding, play, ReferenceModal y ranking. No rompen el build, pero el compilador saltea esos componentes. `tsc` pasa sin errores.
- [x] **Fichas de tiendas:** completadas.

---

## 1. Pendientes a revisar (Próximas iteraciones)

### A. Tiendas (Google Play Store y App Store) + Dominio `triviacatolica.com`
- [ ] Completar ficha de Google Play Console (Feature Graphic `1024×500`, capturas de pantalla, Política de Privacidad en `https://triviacatolica.com/privacidad`, instrucciones de eliminación de cuenta, Data Safety, IARC, Prueba cerrada si aplica).
- [ ] Completar ficha de App Store Connect / TestFlight.
- [ ] **Deep links + fallback web en `triviacatolica.com/play/<slug>`:**
  - Publicar `/.well-known/apple-app-site-association` (iOS Universal Links) y `/.well-known/assetlinks.json` (Android App Links) para que quien tenga la app instalada entre **directo al cuestionario** dentro de la app.
  - Configurar ruta web en `triviacatolica.com/play/<slug>` (sin 404): si el usuario **no** tiene la app instalada, mostrar vista previa del cuestionario (o jugarlo en web) con botón **Abrir en Trivia Católica** (`triviacatolica://play/<slug>`) y enlaces de descarga a App Store / Google Play + metadatos Open Graph para WhatsApp/redes.

### B. Monetización real (Apple Pay / Google Play vía RevenueCat)
- [x] Eliminar todo rastro de "modo prueba" / demo en la app (paywall, recargas de prueba, textos internos). *(v1.0 sale gratis con `PAYWALL_ENABLED = false`: el paywall demo sigue en el código pero no se puede abrir. Al activar pagos, quitar `setPremiumDemo` y agregar el botón **Restaurar compras**, obligatorio en iOS)*
- [ ] Conectar pasarelas reales de **Apple App Store** y **Google Play** con **RevenueCat**.
- [ ] Cargar `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (`goog_...`) y `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_...`) en `.env` y en EAS Environments, y activar `PAYWALL_ENABLED = true` en `src/constants/features.ts`.
  - *Dónde obtenerlas en RevenueCat:* Dashboard → tu proyecto → **Project Settings → API keys → Public app-specific API keys** (una clave para Apple App Store y otra para Google Play).

### C. Creación de cuenta y onboarding
- [x] Diseñar un onboarding / abordaje sencillo con animaciones suaves (fiel a *Lienzo*).
- [x] Permitir elegir un **nombre de usuario (`@username`)** único pensado para futuros desafíos contra otros usuarios y el ranking.

### D. Rediseño visual de Inicio (más aire y mejor jerarquía)
- [x] Dar más aire general a toda la interfaz: **tipografías más grandes**, **cuadros más anchos** y **más espacio alrededor de los títulos**.
- [x] **Unificar el Desafío del día + Banners de novedades** en un único carrusel superior más ancho con más contenido e interacción deslizable de izquierda a derecha.
- [x] Cambiar las **Categorías** a una **grilla de cuadros** (tarjetas) para aprovechar mejor el espacio y mejorar la estética.
- [x] **Sección "Nuevas noticias" multimedios:** renombrar la sección (ya no solo *Vatican News*) e integrar feeds de **Vatican News**, **ACI Prensa** y otro medio católico reconocido (ej. *Aleteia* o *Alfa y Omega*), manteniendo el carrusel horizontal y el mini-quiz por noticia.

### E. Pantalla de Quiz, Citas completas y Felicitaciones
- [x] **Centrar la pantalla de preguntas** (enunciado, opciones y explicación) para que no queden pegados al borde superior del teléfono, dando más aire y espacio entre opciones.
- [~] **Popup de Biblia Católica y Catecismo (CIC):** *(hecho con un banco local de citas en `src/data/scriptureCicBank.ts`; falta cargar la Biblia y el CIC completos en la base)* cargar los textos de la Biblia y los numerales del CIC en la base de datos para que al tocar cualquier referencia (ej. `Gn 6,14` o `CIC 1219`) se abra un popup con el pasaje o artículo completo.
- [x] **Pantalla de felicitaciones / resultado:** centrar toda la composición y destacar el botón de **compartir resultado con enlace** a `https://triviacatolica.com/play/<slug>`.

### F. Experiencia de usuario y limpieza de Ajustes
- [x] **Popup en niveles bloqueados:** al tocar un nivel bloqueado, mostrar siempre un popup claro indicando que hay que completar el nivel anterior para desbloquearlo.
- [x] **Limpiar Ajustes / Perfil:** quitar textos y controles técnicos/internos (*Origen de datos: Supabase*, *Actualizaciones OTA · canal...*, *Reiniciar progreso local* visible para usuarios comunes).

---

## 2. Ideas mapeadas para próximas versiones (Fases 2 y 3 — NO implementar aún)

### A. Nuevos formatos y mecánicas de juego
- **Línea de tiempo / Acertar el año:** pregunta con barra deslizable (*slider*) para ubicar un año histórico (ej. *"¿En qué año asumió el Papa Francisco?"*). Gana quien quede más cerca del año exacto; empate si dos jugadores coinciden.
- **Quiz visual con fotos:** mostrar la imagen de un santo (o lugar/símbolo litúrgico) y elegir la respuesta correcta entre las opciones.
- **Rompecabezas y secuencias:** ordenar partes de la Misa, etapas bíblicas o armar piezas visuales.

### B. Contenido dinámico según el calendario litúrgico
- **Evangelio del día:** preguntas diarias vinculadas directamente a la lectura del Evangelio de cada jornada.
- **Preguntas por tiempo litúrgico:** paquetes especiales según la época del año (Adviento, Navidad, Cuaresma, Semana Santa, Pascua, Pentecostés, solemnidades).

### C. Comunidad, verificación y desafíos
- **Perfil especial de Sacerdote:** insignia / sello verificado de sacerdote visible en su perfil y en el **Ranking**, con opción de **desafiar a un sacerdote en un quiz** (modo 1 vs 1).

### D. Perfil social, nacionalidad y logros (pedido 2026-11-20)
- **Nacionalidad:** elegir país en onboarding o Perfil (`profiles.country`, código ISO de 2 letras) y mostrar la **banderita** junto al nombre en el Ranking.
- **Ranking nacional e internacional:** filtro *Mi país / Mundial* en Ranking (la vista `leaderboard_top` necesita la columna `country`).
- **Perfil público individual:** pantalla `/u/<username>` con bandera, nivel, racha, estadísticas y sellos, punto de entrada para **desafiar en versus**.
- **Panel de logros (sellos):** sellos por hitos (rachas, categorías completas, niveles perfectos, primer versus), con tablas `achievements` y `user_achievements`.
- **Versus 1 vs 1** contra otros jugadores (se conecta con el desafío al Sacerdote de la sección C).

### E. Panel de administración personal (`app.triviacatolica.com` — estética *Lienzo*) (pedido 2026-11-23)
Panel web privado para administrar todo el ecosistema de Trivia Católica, respetando la línea gráfica *Lienzo* (fondo blanco limpio, Source Sans 3, acentos de color por categoría, cero sombras ni sobrecarga) y protegido con autenticación de administrador (Supabase Auth + rol `admin` en RLS):
- **Desafío del día (calendario):** vista mensual/semanal de `daily_challenges`, ver qué días tienen desafío automático vs. programado (`is_custom = true`), crear/editar desafíos especiales por fecha (solemnidades, Adviento, Cuaresma, campañas), disparar manualmente `sync-daily-challenge` y previsualizar cómo se verá la tarjeta en Inicio.
- **Categorías, niveles y preguntas:** CRUD completo de `topics`, `levels` (orden, slug compartible, dificultad, gratuito/Pro) y `questions` vinculadas a `level_id`, con vista previa de opciones, explicación y chips de `source_ref` + botón para generar borradores con Gemini (`generate-questions`) y aprobarlos antes de activar (`is_active`).
- **Banco de fuentes (Biblia, CIC, IGMR):** buscador y editor de `reference_texts` para agregar, corregir o importar pasajes bíblicos y numerales del Catecismo, con alerta automática si alguna pregunta cita una referencia sin texto cargado.
- **Banners de Inicio:** alta, edición, orden y programación por vigencia (`vigencia_desde` / `vigencia_hasta`) de avisos de *Oración*, *Iniciativa* y *Novedad* (`public.banners`).
- **Noticias y mini-quizzes:** gestionar `news_quizzes`, disparar `sync-vatican-news` manualmente, editar preguntas generadas o desactivar notas.
- **Moderación de reportes doctrinales:** bandeja de entrada de `question_reports` enviados por usuarios desde la app, con acceso directo a editar la pregunta reportada y marcar el reporte como resuelto.
- **Notificaciones push personalizadas:** envío de notificaciones desde el panel (vía Expo Push Service + tabla `user_push_tokens` / `notification_campaigns` en Supabase) con título, mensaje, enlace interno opcional (ej. abrir directo `/play/desafio-del-dia` o una categoría), segmentación (todos los usuarios, usuarios con racha en riesgo, inactivos, por país o un `@usuario` puntual), programación por fecha/hora e historial de envíos.
- **Usuarios y comunidad:** listado y búsqueda de `profiles` (`@username`, XP, racha, estado Pro/gratuito, fecha de actividad), gestión de insignias verificadas (ej. sello de *Sacerdote* cuando se habilite) y métricas básicas de uso (jugadores activos diarios, niveles más jugados, preguntas con mayor tasa de error).
- **Configuración operativa y checklists de publicación:** estado de migraciones, links de tiendas / deep links (`/.well-known/`), estado de RevenueCat / paywall y acceso rápido a logs de Edge Functions.

# Trivia Católica — Pendientes a Revisar y Roadmap de Ideas

Documento vivo de trabajo. Separa lo que queda **pendiente para el próximo ciclo de ajustes y lanzamiento** de las **ideas mapeadas para próximas versiones**.

---

## 0. Bloqueantes antes de publicar v1.0 (revisión 2026-11-20)

- [x] **Links compartidos dan 404:** publicado el 2026-11-23. `/play/*` y `/category/*` cargan `landing/abrir.html` (rewrite en `vercel.json`): en Android intenta abrir la app con `intent://` y, si no está, muestra la descarga de Google Play. Cuando salga en iOS, completar `IOS_URL` en ese archivo.
- [ ] **Deep links sin verificar:** `app.json` declara `associatedDomains` (iOS) e `intentFilters` con `autoVerify` (Android), pero faltan `/.well-known/apple-app-site-association` y `/.well-known/assetlinks.json`. Hacen falta el **Apple Team ID** y el **SHA-256 del certificado de firma** (Play Console → Integridad de la app). El redirect de `www` ya excluye `/.well-known` y `vercel.json` sirve ambos archivos como JSON; solo falta crearlos en `landing/.well-known/`.
- [x] **Eliminar cuenta desde la app (Apple 5.1.1(v)):** Perfil → *Cuenta y ayuda* tiene Soporte, Privacidad, Términos, **Cerrar sesión** (solo cuentas vinculadas) y **Eliminar cuenta y datos** con confirmación (borra el usuario real vía `delete_own_account`).
- [x] **Usuario repetido rompe la sincronización:** onboarding y Perfil consultan `is_username_available` antes de guardar; si igual choca, se guarda XP y racha sin el usuario y se avisa en Perfil. Al iniciar sesión con correo se trae el progreso de la cuenta y se combina con el local en vez de pisarlo.
- [ ] **Migración 005 (usuario libre + eliminar cuenta):** correr `supabase/migrations/005_username_check_y_borrar_cuenta.sql` en el SQL Editor. **Sin ella el botón de eliminar cuenta da error.**
- [ ] **Correos de Supabase:** pegar las plantillas de `supabase/email-templates/` en **Confirm signup** y **Magic Link** (sin la primera, los usuarios nuevos no reciben el código), configurar SMTP propio (Purelymail) y OTP de 6 dígitos. Ver `supabase/email-templates/README.md`.
- [ ] **Migración 004 (categoría Virgen María):** correr `supabase/migrations/004_categoria_virgen_maria.sql` en el SQL Editor; la app lee las categorías desde Supabase.
- [ ] **Lint:** `npx expo lint` da 34 errores de reglas del React Compiler (31 `react-hooks/refs` por `useRef(new Animated.Value())`, 3 `set-state-in-effect`) en onboarding, play, FeedbackSheet, ReferenceModal y ranking. No rompen el build, pero el compilador saltea esos componentes. `tsc` pasa sin errores.
- [ ] Fichas de tiendas: capturas, Feature Graphic, Data Safety, IARC y App Privacy (ver sección A).

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

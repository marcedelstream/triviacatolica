# Trivia Católica — Pendientes a Revisar y Roadmap de Ideas

Documento vivo de trabajo. Separa lo que queda **pendiente para el próximo ciclo de ajustes y lanzamiento** de las **ideas mapeadas para próximas versiones**.

---

## 1. Pendientes a revisar (Próximas iteraciones)

### A. Tiendas (Google Play Store y App Store) + Dominio `triviacatolica.com`
- [ ] Completar ficha de Google Play Console (Feature Graphic `1024×500`, capturas de pantalla, Política de Privacidad en `https://triviacatolica.com/privacidad`, instrucciones de eliminación de cuenta, Data Safety, IARC, Prueba cerrada si aplica).
- [ ] Completar ficha de App Store Connect / TestFlight.
- [ ] Publicar en `triviacatolica.com` los archivos de verificación de deep links (`/.well-known/apple-app-site-association` y `/.well-known/assetlinks.json`) y páginas con metadatos Open Graph para enlaces compartidos (`/play/<slug>`).

### B. Monetización real (Apple Pay / Google Play vía RevenueCat)
- [ ] Eliminar todo rastro de "modo prueba" / demo en la app (paywall, recargas de prueba, textos internos).
- [ ] Conectar pasarelas reales de **Apple App Store** y **Google Play** con **RevenueCat**.
- [ ] Cargar `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (`goog_...`) y `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_...`) en `.env` y en EAS Environments, y activar `PAYWALL_ENABLED = true` en `src/constants/features.ts`.
  - *Dónde obtenerlas en RevenueCat:* Dashboard → tu proyecto → **Project Settings → API keys → Public app-specific API keys** (una clave para Apple App Store y otra para Google Play).

### C. Creación de cuenta y onboarding
- [ ] Diseñar un onboarding / abordaje sencillo con animaciones suaves (fiel a *Lienzo*).
- [ ] Permitir elegir un **nombre de usuario (`@username`)** único pensado para futuros desafíos contra otros usuarios y el ranking.

### D. Rediseño visual de Inicio (más aire y mejor jerarquía)
- [ ] Dar más aire general a toda la interfaz: **tipografías más grandes**, **cuadros más anchos** y **más espacio alrededor de los títulos**.
- [ ] **Unificar el Desafío del día + Banners de novedades** en un único carrusel superior más ancho con más contenido e interacción deslizable de izquierda a derecha.
- [ ] Cambiar las **Categorías** a una **grilla de cuadros** (tarjetas) para aprovechar mejor el espacio y mejorar la estética.
- [ ] **Sección "Nuevas noticias" multimedios:** renombrar la sección (ya no solo *Vatican News*) e integrar feeds de **Vatican News**, **ACI Prensa** y otro medio católico reconocido (ej. *Aleteia* o *Alfa y Omega*), manteniendo el carrusel horizontal y el mini-quiz por noticia.

### E. Pantalla de Quiz, Citas completas y Felicitaciones
- [ ] **Centrar la pantalla de preguntas** (enunciado, opciones y explicación) para que no queden pegados al borde superior del teléfono, dando más aire y espacio entre opciones.
- [ ] **Popup de Biblia Católica y Catecismo (CIC):** cargar los textos de la Biblia y los numerales del CIC en la base de datos para que al tocar cualquier referencia (ej. `Gn 6,14` o `CIC 1219`) se abra un popup con el pasaje o artículo completo.
- [ ] **Pantalla de felicitaciones / resultado:** centrar toda la composición y destacar el botón de **compartir resultado con enlace** a `https://triviacatolica.com/play/<slug>`.

### F. Experiencia de usuario y limpieza de Ajustes
- [ ] **Popup en niveles bloqueados:** al tocar un nivel bloqueado, mostrar siempre un popup claro indicando que hay que completar el nivel anterior para desbloquearlo.
- [ ] **Limpiar Ajustes / Perfil:** quitar textos y controles técnicos/internos (*Origen de datos: Supabase*, *Actualizaciones OTA · canal...*, *Reiniciar progreso local* visible para usuarios comunes).

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

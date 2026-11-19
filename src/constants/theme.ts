/**
 * Trivia Católica — Sistema de diseño "Lienzo"
 * Fuente de verdad: LINEA_GRAFICA.md y boceto-inicio.html
 *
 * Reglas invariantes:
 * - Cero sombras, cero degradados, cero blur, cero modo oscuro en esta versión.
 * - Familia única: Source Sans 3 (pesos 400, 600, 700, sin itálicas).
 * - Nada por debajo de 13 px. Área táctil mínima: 48 x 48 px.
 */

export type CategorySlug =
  | 'antiguo-testamento'
  | 'nuevo-testamento'
  | 'santos'
  | 'sacramentos'
  | 'liturgia';

export type BannerType = 'oracion' | 'iniciativa' | 'novedad';

export type CategoryIconName =
  | 'scroll'
  | 'book-open-text'
  | 'hands-praying'
  | 'drop'
  | 'church';

export type BannerIconName = 'hands-praying' | 'hand-heart' | 'megaphone';

export const LIENZO = {
  color: {
    bg: '#FFFFFF',
    bgApp: '#F2F3F6',
    ink: '#14161C',
    ink2: '#5B6170',
    line: '#E6E8EE',
    track: '#EEF0F4',

    primary: '#2F5BD3',
    primaryInk: '#1E3F9E',
    primarySoft: '#EEF2FD',
    onPrimary: '#FFFFFF',
    onPrimary2: '#DCE4FA',

    gold: '#E8A33D',
    goldSparkle: '#FFD27A',
    goldInk: '#8A5A0B',
    goldSoft: '#FDF3E1',

    success: '#2B754D',
    successInk: '#1E5A3A',
    successSoft: '#E7F4EC',

    danger: '#B42318',
    dangerSoft: '#FDECEA',
  },

  category: {
    'antiguo-testamento': {
      color: '#A94C25',
      soft: '#FBEFE6',
      icon: 'scroll' as CategoryIconName,
    },
    'nuevo-testamento': {
      color: '#2F5BD3',
      soft: '#EEF2FD',
      icon: 'book-open-text' as CategoryIconName,
    },
    santos: {
      color: '#A83E5A',
      soft: '#FBECEF',
      icon: 'hands-praying' as CategoryIconName,
    },
    sacramentos: {
      color: '#2B754D',
      soft: '#E7F4EC',
      icon: 'drop' as CategoryIconName,
    },
    liturgia: {
      color: '#6A52C2',
      soft: '#F1EEFB',
      icon: 'church' as CategoryIconName,
    },
  },

  banner: {
    oracion: {
      label: 'Oración',
      color: '#6A52C2',
      soft: '#F1EEFB',
      icon: 'hands-praying' as BannerIconName,
    },
    iniciativa: {
      label: 'Iniciativa',
      color: '#2B754D',
      soft: '#E7F4EC',
      icon: 'hand-heart' as BannerIconName,
    },
    novedad: {
      label: 'Novedad',
      color: '#8A5A0B',
      soft: '#FDF3E1',
      icon: 'megaphone' as BannerIconName,
    },
  },

  font: {
    regular: 'SourceSans3_400Regular',
    semiBold: 'SourceSans3_600SemiBold',
    bold: 'SourceSans3_700Bold',
  },

  type: {
    display: { fontSize: 28, lineHeight: 32, fontFamily: 'SourceSans3_700Bold' },
    question: { fontSize: 22, lineHeight: 29, fontFamily: 'SourceSans3_600SemiBold' },
    title: { fontSize: 22, lineHeight: 28, fontFamily: 'SourceSans3_600SemiBold' },
    section: { fontSize: 20, lineHeight: 26, fontFamily: 'SourceSans3_600SemiBold' },
    answer: { fontSize: 18, lineHeight: 23, fontFamily: 'SourceSans3_600SemiBold' },
    button: { fontSize: 18, lineHeight: 20, fontFamily: 'SourceSans3_700Bold' },
    item: { fontSize: 17, lineHeight: 22, fontFamily: 'SourceSans3_600SemiBold' },
    body: { fontSize: 16, lineHeight: 23, fontFamily: 'SourceSans3_400Regular' },
    small: { fontSize: 15, lineHeight: 20, fontFamily: 'SourceSans3_400Regular' },
    smallSemiBold: { fontSize: 15, lineHeight: 20, fontFamily: 'SourceSans3_600SemiBold' },
    smallBold: { fontSize: 15, lineHeight: 20, fontFamily: 'SourceSans3_700Bold' },
    caption: { fontSize: 14, lineHeight: 18, fontFamily: 'SourceSans3_400Regular' },
    captionBold: { fontSize: 14, lineHeight: 18, fontFamily: 'SourceSans3_700Bold' },
    nav: { fontSize: 13, lineHeight: 16, fontFamily: 'SourceSans3_400Regular' },
    navActive: { fontSize: 13, lineHeight: 16, fontFamily: 'SourceSans3_700Bold' },
  },

  radius: {
    chip: 999,
    icon: 14,
    card: 16,
    banner: 18,
    block: 20,
    frame: 32,
  },

  space: {
    xs: 4,
    sm: 8,
    md: 12,
    ms: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderWidth: {
    hairline: 1,
    card: 1.5,
    active: 2,
  },

  touchMin: 48,
  buttonMinHeight: 50,
  answerMinHeight: 56,
  maxPhoneWidth: 430,
} as const;

export function getCategoryTheme(slug: string) {
  if (slug in LIENZO.category) {
    return LIENZO.category[slug as CategorySlug];
  }
  return LIENZO.category['nuevo-testamento'];
}

export function getBannerTheme(tipo: BannerType) {
  return LIENZO.banner[tipo] ?? LIENZO.banner.novedad;
}

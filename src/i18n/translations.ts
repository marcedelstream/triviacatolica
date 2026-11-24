export type AppLanguage = 'es' | 'en' | 'pt';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'es', label: 'Español', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', nativeLabel: 'Português', flag: '🇧🇷' },
];

const TRANSLATIONS = {
  es: {
    greetingMorning: 'Buen día',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    homeQuestion: '¿Jugamos hoy?',
    dailyGoalTitle: 'Meta de hoy',
    dailyGoalFree: '{used} de {limit} quizzes gratuitos hoy',
    dailyGoalPro: 'Quizzes ilimitados activos (Pro)',
    dailyGoalCta: 'Hacerme Pro',
    categoriesTitle: 'Categorías',
    seeAll: 'Ver todas',
    reviewMistakesTitle: 'Repasar mis errores',
    reviewMistakesSub: 'Practicá las {count} preguntas que fallaste',
    reviewMistakesProTag: 'Pro',
    tabHome: 'Inicio',
    tabRanking: 'Ranking',
    tabProfile: 'Perfil',
    rankingSubtitle: 'Comunidad registrada',
    rankingTitle: 'Ranking',
    rankingWorld: 'Mundial',
    rankingMyCountry: 'Mi país',
    rankingHint: 'Tocá un jugador para ver su perfil',
    profileSubtitle: 'Tu camino de fe',
    profileTitle: 'Perfil',
    profileStats: 'Estadísticas',
    profileAvatars: 'Foto de perfil (personajes)',
    profileAchievements: 'Sellos y logros',
    profilePreferences: 'Preferencias',
    profileLanguage: 'Idioma de la app',
    profileCountry: 'Tu país y bandera',
    profileAccountHelp: 'Cuenta y ayuda',
    proBannerTitle: 'Pasate a Trivia Católica Pro',
    proBannerDesc: 'Quizzes ilimitados por día, vidas infinitas, repaso de errores y protector de racha.',
    proBannerCta: 'Ver Plan Pro',
    guestLimitTitle: '¡Te gustó tu primer quiz!',
    guestLimitBody: 'Creá tu cuenta gratis o iniciá sesión para seguir jugando, guardar tu XP y entrar al Ranking.',
    dailyLimitHeadline: 'Completaste tus 3 quizzes de hoy',
    dailyLimitSub: 'Pasate a Pro para jugar sin límite diario, tener vidas infinitas y ganar XP más rápido.',
    onboardingLangTitle: 'Elegí tu idioma',
    onboardingLangSub: 'Podés cambiarlo en cualquier momento desde tu Perfil.',
    onboardingContinue: 'Continuar',
    onboardingStart: 'Empezar a jugar',
  },
  en: {
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    homeQuestion: 'Ready to play?',
    dailyGoalTitle: "Today's goal",
    dailyGoalFree: '{used} of {limit} free quizzes today',
    dailyGoalPro: 'Unlimited quizzes active (Pro)',
    dailyGoalCta: 'Go Pro',
    categoriesTitle: 'Categories',
    seeAll: 'See all',
    reviewMistakesTitle: 'Review mistakes',
    reviewMistakesSub: 'Practice the {count} questions you missed',
    reviewMistakesProTag: 'Pro',
    tabHome: 'Home',
    tabRanking: 'Ranking',
    tabProfile: 'Profile',
    rankingSubtitle: 'Registered community',
    rankingTitle: 'Leaderboard',
    rankingWorld: 'Global',
    rankingMyCountry: 'My country',
    rankingHint: 'Tap a player to view their profile',
    profileSubtitle: 'Your journey of faith',
    profileTitle: 'Profile',
    profileStats: 'Statistics',
    profileAvatars: 'Profile picture (characters)',
    profileAchievements: 'Badges & achievements',
    profilePreferences: 'Preferences',
    profileLanguage: 'App language',
    profileCountry: 'Your country & flag',
    profileAccountHelp: 'Account & help',
    proBannerTitle: 'Upgrade to Trivia Católica Pro',
    proBannerDesc: 'Unlimited daily quizzes, infinite hearts, mistake review, and weekly streak shield.',
    proBannerCta: 'View Pro Plan',
    guestLimitTitle: 'Enjoyed your first quiz?',
    guestLimitBody: 'Create a free account or sign in to keep playing, save your XP, and join the leaderboard.',
    dailyLimitHeadline: "You've completed your 3 quizzes today",
    dailyLimitSub: 'Go Pro for unlimited daily quizzes, infinite hearts, and faster XP progress.',
    onboardingLangTitle: 'Choose your language',
    onboardingLangSub: 'You can change this anytime from your Profile.',
    onboardingContinue: 'Continue',
    onboardingStart: 'Start playing',
  },
  pt: {
    greetingMorning: 'Bom dia',
    greetingAfternoon: 'Boa tarde',
    greetingEvening: 'Boa noite',
    homeQuestion: 'Vamos jogar hoje?',
    dailyGoalTitle: 'Meta de hoje',
    dailyGoalFree: '{used} de {limit} quizzes gratuitos hoje',
    dailyGoalPro: 'Quizzes ilimitados ativos (Pro)',
    dailyGoalCta: 'Ser Pro',
    categoriesTitle: 'Categorias',
    seeAll: 'Ver todas',
    reviewMistakesTitle: 'Revisar meus erros',
    reviewMistakesSub: 'Pratique as {count} perguntas que você errou',
    reviewMistakesProTag: 'Pro',
    tabHome: 'Início',
    tabRanking: 'Ranking',
    tabProfile: 'Perfil',
    rankingSubtitle: 'Comunidade registrada',
    rankingTitle: 'Ranking',
    rankingWorld: 'Mundial',
    rankingMyCountry: 'Meu país',
    rankingHint: 'Toque em um jogador para ver o perfil',
    profileSubtitle: 'Sua caminhada de fé',
    profileTitle: 'Perfil',
    profileStats: 'Estatísticas',
    profileAvatars: 'Foto de perfil (personagens)',
    profileAchievements: 'Selos e conquistas',
    profilePreferences: 'Preferências',
    profileLanguage: 'Idioma do app',
    profileCountry: 'Seu país e bandeira',
    profileAccountHelp: 'Conta e ajuda',
    proBannerTitle: 'Assine o Trivia Católica Pro',
    proBannerDesc: 'Quizzes ilimitados por dia, vidas infinitas, revisão de erros e escudo de sequência.',
    proBannerCta: 'Ver Plano Pro',
    guestLimitTitle: 'Gostou do seu primeiro quiz?',
    guestLimitBody: 'Crie sua conta grátis ou entre para continuar jogando, salvar seu XP e entrar no Ranking.',
    dailyLimitHeadline: 'Você completou seus 3 quizzes de hoje',
    dailyLimitSub: 'Assine o Pro para jogar sem limite diário, ter vidas infinitas e ganhar XP mais rápido.',
    onboardingLangTitle: 'Escolha seu idioma',
    onboardingLangSub: 'Você pode alterar a qualquer momento no seu Perfil.',
    onboardingContinue: 'Continuar',
    onboardingStart: 'Começar a jogar',
  },
} as const;

export type TranslationKey = keyof (typeof TRANSLATIONS)['es'];

export function translate(
  lang: AppLanguage | undefined,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[lang ?? 'es'] ?? TRANSLATIONS.es;
  let text: string = dict[key] ?? TRANSLATIONS.es[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

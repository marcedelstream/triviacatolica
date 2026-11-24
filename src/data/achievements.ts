export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: 'star' | 'flame' | 'trophy' | 'sparkle' | 'crown' | 'book' | 'shield' | 'heart';
  unlocked: boolean;
}

export interface AchievementMetrics {
  xp: number;
  streakCount: number;
  longestStreak: number;
  levelsCompleted: number;
  totalStars: number;
  perfectLevels?: number;
}

export function computeAchievements(metrics: AchievementMetrics): AchievementBadge[] {
  const bestStreak = Math.max(metrics.streakCount, metrics.longestStreak);
  return [
    {
      id: 'first-step',
      title: 'Primer paso',
      description: 'Completaste tu primer nivel o desafío.',
      icon: 'sparkle',
      unlocked: metrics.xp > 0 || metrics.levelsCompleted >= 1,
    },
    {
      id: 'streak-3',
      title: 'Constancia',
      description: 'Alcanzaste una racha de 3 días seguidos.',
      icon: 'flame',
      unlocked: bestStreak >= 3,
    },
    {
      id: 'streak-7',
      title: 'Semana fiel',
      description: 'Mantuviste una racha de 7 días.',
      icon: 'trophy',
      unlocked: bestStreak >= 7,
    },
    {
      id: 'xp-300',
      title: 'Discípulo activo',
      description: 'Sumaste 300 XP aprendiendo sobre la fe.',
      icon: 'book',
      unlocked: metrics.xp >= 300,
    },
    {
      id: 'xp-1000',
      title: 'Testigo de la fe',
      description: 'Superaste los 1.000 XP en Trivia Católica.',
      icon: 'crown',
      unlocked: metrics.xp >= 1000,
    },
    {
      id: 'levels-5',
      title: 'Peregrino',
      description: 'Completaste 5 niveles distintos.',
      icon: 'shield',
      unlocked: metrics.levelsCompleted >= 5,
    },
    {
      id: 'stars-15',
      title: 'Luz brillante',
      description: 'Reuniste al menos 15 estrellas en niveles.',
      icon: 'star',
      unlocked: metrics.totalStars >= 15,
    },
    {
      id: 'perfect-round',
      title: 'Puntaje perfecto',
      description: 'Lograste 3 estrellas en un nivel.',
      icon: 'heart',
      unlocked: (metrics.perfectLevels ?? 0) >= 1 || metrics.totalStars >= 3,
    },
  ];
}

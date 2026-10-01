export interface RollingDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  dateStr: string;
  displayDate: string;
  isToday: boolean;
}

/**
 * Returns the rolling past 7 days ending with Today.
 */
export function getRolling7Days(): RollingDay[] {
  const days: RollingDay[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const isToday = i === 0;
    days.push({
      date: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      dateStr: d.toISOString().split('T')[0],
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday,
    });
  }

  return days;
}

/**
 * Safely extracts a 7-element status array [day-6 ... day-0 (today)]
 * ensuring 'today' is always synchronized with habit.completedToday.
 */
export function getHabit7DayStatuses(
  history: number[] | undefined,
  completedToday: boolean
): number[] {
  const safeHist = Array.isArray(history) ? history : [];
  const result: number[] = [];

  for (let i = 6; i >= 0; i--) {
    if (i === 0) {
      // Today (index 6 in the 7-day array)
      result.push(completedToday ? 1 : 0);
    } else {
      const histIndex = safeHist.length - 1 - i;
      const val = histIndex >= 0 && histIndex < safeHist.length ? safeHist[histIndex] : 0;
      result.push(val === 1 ? 1 : 0);
    }
  }

  return result;
}

/**
 * Calculates consistency % defensively.
 */
export function calculateConsistency(statuses: number[]): number {
  if (!statuses || statuses.length === 0) return 0;
  const completed = statuses.filter((s) => s === 1).length;
  return Math.round((completed / statuses.length) * 100);
}

/**
 * Returns dynamic category badge styling classes.
 */
export function getCategoryBadgeClass(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('health')) return 'habit-cat-health';
  if (cat.includes('fit') || cat.includes('gym') || cat.includes('sport')) return 'habit-cat-fitness';
  if (cat.includes('mind') || cat.includes('meditat') || cat.includes('spirit')) return 'habit-cat-mindset';
  if (cat.includes('prod') || cat.includes('work') || cat.includes('focus')) return 'habit-cat-productivity';
  if (cat.includes('learn') || cat.includes('read') || cat.includes('study')) return 'habit-cat-learning';
  if (cat.includes('finan') || cat.includes('money') || cat.includes('save')) return 'habit-cat-finance';
  return 'habit-cat-general';
}

/**
 * Rich gamified streak tiers that reward consistency and bring joy!
 */
export interface StreakTier {
  name: string;
  emoji: string;
  color: string;
  glow: string;
  badgeClass: string;
  motto: string;
}

export function getStreakTier(streak: number): StreakTier {
  if (streak >= 30) {
    return {
      name: 'God Mode',
      emoji: '👑',
      color: '#ec4899',
      glow: 'rgba(236, 72, 153, 0.45)',
      badgeClass: 'streak-god',
      motto: 'Legendary discipline! 30+ days of excellence.',
    };
  }
  if (streak >= 14) {
    return {
      name: 'Diamond',
      emoji: '💎',
      color: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.4)',
      badgeClass: 'streak-diamond',
      motto: '2+ weeks unbroken! You are unstoppable.',
    };
  }
  if (streak >= 7) {
    return {
      name: 'On Fire',
      emoji: '🔥',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.4)',
      badgeClass: 'streak-fire',
      motto: '7+ day streak! You are in the top 5% consistency.',
    };
  }
  if (streak >= 3) {
    return {
      name: 'Momentum',
      emoji: '⚡',
      color: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.35)',
      badgeClass: 'streak-momentum',
      motto: '3+ days! The momentum is building fast.',
    };
  }
  if (streak >= 1) {
    return {
      name: 'Spark',
      emoji: '✨',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.3)',
      badgeClass: 'streak-spark',
      motto: 'Daily spark ignited! Keep the chain going.',
    };
  }
  return {
    name: 'Ready',
    emoji: '🎯',
    color: '#94a3b8',
    glow: 'transparent',
    badgeClass: 'streak-ready',
    motto: 'Check in today to start a new streak!',
  };
}

/**
 * Authentic iPhone Streaks App Signature Color Palette.
 */
export const STREAKS_PALETTE = [
  { color: '#ff6b35', glow: 'rgba(255, 107, 53, 0.45)', name: 'Tangerine' },
  { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.45)', name: 'Lime' },
  { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.45)', name: 'Cyan' },
  { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)', name: 'Hot Pink' },
  { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)', name: 'Purple' },
  { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)', name: 'Amber' },
  { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.45)', name: 'Electric Blue' },
  { color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.45)', name: 'Teal' },
  { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.45)', name: 'Rose' },
];

export function getStreaksColor(index: number, category?: string): { color: string; glow: string } {
  const cat = (category || '').toLowerCase();
  if (cat.includes('health')) return { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.45)' };
  if (cat.includes('fit')) return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.45)' };
  if (cat.includes('mind')) return { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' };
  if (cat.includes('prod')) return { color: '#ff6b35', glow: 'rgba(255, 107, 53, 0.45)' };
  if (cat.includes('learn')) return { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.45)' };
  if (cat.includes('finan')) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' };
  return STREAKS_PALETTE[index % STREAKS_PALETTE.length];
}

export type StreaksIconType =
  | 'Droplets'
  | 'Dumbbell'
  | 'BookOpen'
  | 'Brain'
  | 'Code'
  | 'Wallet'
  | 'Footprints'
  | 'Heart'
  | 'Moon'
  | 'Target';

export function getStreaksIconType(title: string, category?: string): StreaksIconType {
  const text = `${title} ${category || ''}`.toLowerCase();
  if (text.includes('water') || text.includes('drink') || text.includes('hydrate')) return 'Droplets';
  if (text.includes('read') || text.includes('book') || text.includes('page') || text.includes('study')) return 'BookOpen';
  if (
    text.includes('workout') ||
    text.includes('gym') ||
    text.includes('exercise') ||
    text.includes('train') ||
    text.includes('lift') ||
    text.includes('pushup') ||
    text.includes('run') ||
    text.includes('fitness')
  ) {
    return 'Dumbbell';
  }
  if (text.includes('walk') || text.includes('step')) return 'Footprints';
  if (text.includes('meditat') || text.includes('mind') || text.includes('breath') || text.includes('focus') || text.includes('zen')) {
    return 'Brain';
  }
  if (text.includes('code') || text.includes('dev') || text.includes('program') || text.includes('build') || text.includes('software')) {
    return 'Code';
  }
  if (text.includes('money') || text.includes('save') || text.includes('spend') || text.includes('budget') || text.includes('expense') || text.includes('finance')) {
    return 'Wallet';
  }
  if (text.includes('sleep') || text.includes('bed') || text.includes('rest') || text.includes('night')) return 'Moon';
  if (text.includes('eat') || text.includes('diet') || text.includes('health') || text.includes('nutrition') || text.includes('fasting')) {
    return 'Heart';
  }
  return 'Target';
}

/**
 * Synthesizes a crisp, uplifting audio chime using Web Audio API.
 * Provides immediate auditory dopamine upon completing a habit!
 */
export function playHabitChime(isCompleted: boolean = true) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isCompleted) {
      // Ascending celebratory dual chime (F5 -> A5 -> C6)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.15); // C6
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    } else {
      // Soft gentle uncheck tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isCompleted ? 0.36 : 0.22));
  } catch {
    // Gracefully ignore if browser blocks audio autoplay
  }
}

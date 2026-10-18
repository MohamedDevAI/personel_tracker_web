/**
 * Atomic Habits local enhancement & synchronization service.
 * Enriches base backend habits with James Clear's core mechanics:
 * 1. Identity Statements ("Who you are becoming")
 * 2. Habit Stacking Anchor Cues ("After [current routine], I will...")
 * 3. 2-Minute Gateway Starter Rule ("The micro-action to show up")
 * 4. Time-of-day Ritual categorization (Morning, Afternoon, Evening)
 * 5. Multi-date completion tracking and "Never Miss Twice" protocol
 */

import { Habit } from '../interface/habit.interface';
import { getLocalDateISO } from '../utils/dateHelpers';

export interface HabitAtomicMeta {
  identity?: string;
  habitStack?: string;
  twoMinuteRule?: string;
  completedDates?: string[];
}

const STORAGE_KEY_META = 'personel_tracker_atomic_habits_meta_v3';
const STORAGE_KEY_OFFLINE_HABITS = 'personel_tracker_offline_habits_v3';
const STORAGE_KEY_DELETED = 'personel_tracker_deleted_habit_ids_v3';

// Starter Atomic Habits with Coding & English Practice
export const STARTER_ATOMIC_HABITS: Habit[] = [
  {
    id: 'habit-starter-code',
    title: 'Daily Coding & Problem Solving',
    category: 'Productivity',
    streak: 12,
    targetFrequency: 'Daily',
    completedToday: true,
    history: [1, 1, 1, 1, 1, 1, 1],
    identity: 'Master Software Engineer',
    habitStack: 'After I open my workstation and sip my coffee, I will write code for 45 minutes',
    twoMinuteRule: 'Open IDE or LeetCode and write 1 function skeleton',
    completedDates: [],
  },
  {
    id: 'habit-starter-english',
    title: 'English Speaking & Fluency Practice',
    category: 'Learning',
    streak: 7,
    targetFrequency: 'Daily',
    completedToday: false,
    history: [1, 1, 1, 1, 1, 1, 0],
    identity: 'Fluent English Communicator',
    habitStack: 'After I finish lunch, I will practice speaking and shadow an English podcast for 15 mins',
    twoMinuteRule: 'Read 1 paragraph out loud with clear pronunciation',
    completedDates: [],
  },
  {
    id: 'habit-starter-health',
    title: 'Hydrate & Morning Sunlight',
    category: 'Health',
    streak: 8,
    targetFrequency: 'Daily',
    completedToday: true,
    history: [1, 1, 1, 1, 1, 1, 1],
    identity: 'Healthy & Vital Person',
    habitStack: 'After I get out of bed, I will drink 500ml water and step outside for 5 mins',
    twoMinuteRule: 'Drink 1 full glass of water immediately',
    completedDates: [],
  },
  {
    id: 'habit-starter-fitness',
    title: 'Movement & Bodyweight Workout',
    category: 'Fitness',
    streak: 5,
    targetFrequency: 'Daily',
    completedToday: false,
    history: [1, 1, 1, 0, 1, 1, 0],
    identity: 'Resilient & Strong Athlete',
    habitStack: 'After I finish my work session, I will change into workout gear',
    twoMinuteRule: 'Put on training shoes and do 5 pushups',
    completedDates: [],
  },
  {
    id: 'habit-starter-reading',
    title: 'Read 10 Pages of Non-Fiction',
    category: 'Learning',
    streak: 14,
    targetFrequency: 'Daily',
    completedToday: false,
    history: [1, 1, 1, 1, 1, 1, 0],
    identity: 'Lifelong Learner & Thinker',
    habitStack: 'After I sit on the couch in the evening, I will open my physical book',
    twoMinuteRule: 'Read just 1 page',
    completedDates: [],
  },
  {
    id: 'habit-starter-mindset',
    title: 'Daily Reflection & Gratitude',
    category: 'Mindset',
    streak: 6,
    targetFrequency: 'Daily',
    completedToday: false,
    history: [1, 1, 1, 1, 1, 0, 0],
    identity: 'Mindful & Grounded Stoic',
    habitStack: 'After I plug my phone to charge, I will write down 3 wins for the day',
    twoMinuteRule: 'Write down 1 win from today',
    completedDates: [],
  },
];

class AtomicHabitsStorageService {
  private getMetaMap(): Record<string, HabitAtomicMeta> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_META);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveMetaMap(map: Record<string, HabitAtomicMeta>): void {
    try {
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save atomic habit metadata:', e);
    }
  }

  private getDeletedIds(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveDeletedId(id: string): void {
    try {
      const set = this.getDeletedIds();
      set.add(id);
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }

  public getOfflineHabits(): Habit[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_HABITS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Default to starter habits if no local habits yet
    const todayISO = getLocalDateISO();
    const initializedStarters = STARTER_ATOMIC_HABITS.map((h, i) => {
      // Seed initial completed dates matching history
      const dates: string[] = [];
      if (i === 0) dates.push(todayISO);
      return { ...h, completedDates: dates };
    });
    this.saveOfflineHabits(initializedStarters);
    return initializedStarters;
  }

  public saveOfflineHabits(habits: Habit[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_HABITS, JSON.stringify(habits));
    } catch (e) {
      console.warn('Failed to save offline habits:', e);
    }
  }

  /**
   * Enriches a list of habits (from backend or local) with atomic metadata and computation
   */
  public enrichHabits(habits: Habit[], referenceDateISO: string = getLocalDateISO()): Habit[] {
    const metaMap = this.getMetaMap();
    const todayISO = getLocalDateISO();

    // Compute yesterday's ISO date string
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = getLocalDateISO(yesterday);

    const deletedIds = this.getDeletedIds();
    const offlineList = this.getOfflineHabits().filter((h) => !deletedIds.has(h.id));

    // Existing titles from backend (case-insensitive)
    const existingTitles = new Set(habits.map((h) => h.title.trim().toLowerCase()));

    // Merge offline & starter habits (e.g. Coding & English) that aren't already present in backend
    const extraHabits = offlineList.filter(
      (h) => !existingTitles.has(h.title.trim().toLowerCase()) && !deletedIds.has(h.id)
    );

    const baseList = [...habits, ...extraHabits];

    return baseList.map((habit) => {
      const meta = metaMap[habit.id] || {};
      const completedDates = meta.completedDates || habit.completedDates || [];

      // Is completed on the reference date?
      const isCompletedOnRefDate =
        referenceDateISO === todayISO
          ? (habit.completedToday ?? completedDates.includes(todayISO))
          : completedDates.includes(referenceDateISO);

      // Check if missed yesterday (to trigger "Never Miss Twice")
      const completedYesterday = completedDates.includes(yesterdayISO);
      const missedYesterday =
        !completedYesterday &&
        habit.streak > 0 &&
        !completedDates.includes(todayISO);

      return {
        ...habit,
        identity: meta.identity || habit.identity || this.deriveDefaultIdentity(habit.category),
        habitStack: meta.habitStack || habit.habitStack || '',
        twoMinuteRule: meta.twoMinuteRule || habit.twoMinuteRule || '',
        completedDates,
        completedToday: completedDates.includes(todayISO) || habit.completedToday,
        isCompletedOnSelectedDate: isCompletedOnRefDate,
        missedYesterday,
      } as Habit & { isCompletedOnSelectedDate: boolean };
    });
  }

  /**
   * Save Atomic attributes for a given habit ID
   */
  public saveHabitMeta(id: string, updates: Partial<HabitAtomicMeta>): void {
    const metaMap = this.getMetaMap();
    metaMap[id] = {
      ...metaMap[id],
      ...updates,
    };
    this.saveMetaMap(metaMap);

    // Also update in offline habits list if present
    const offline = this.getOfflineHabits();
    const idx = offline.findIndex((h) => h.id === id);
    if (idx !== -1) {
      offline[idx] = { ...offline[idx], ...updates };
      this.saveOfflineHabits(offline);
    }
  }

  /**
   * Toggle completion of a habit for a specific date
   */
  public toggleDateCompletion(
    id: string,
    dateISO: string,
    currentHabits: Habit[]
  ): { updatedHabit: Habit; allHabits: Habit[] } {
    const todayISO = getLocalDateISO();
    const metaMap = this.getMetaMap();
    const meta = metaMap[id] || {};
    const datesSet = new Set(meta.completedDates || []);

    const willBeCompleted = !datesSet.has(dateISO);
    if (willBeCompleted) {
      datesSet.add(dateISO);
    } else {
      datesSet.delete(dateISO);
    }

    const updatedDates = Array.from(datesSet);
    meta.completedDates = updatedDates;
    metaMap[id] = meta;
    this.saveMetaMap(metaMap);

    // Update in offline cache as well
    const offline = this.getOfflineHabits();
    const offIdx = offline.findIndex((h) => h.id === id);
    if (offIdx !== -1) {
      const isToday = dateISO === todayISO;
      const curStreak = offline[offIdx].streak || 0;
      const newStreak = willBeCompleted
        ? curStreak + (isToday ? 1 : 0)
        : Math.max(0, curStreak - (isToday ? 1 : 0));

      offline[offIdx] = {
        ...offline[offIdx],
        completedDates: updatedDates,
        completedToday: updatedDates.includes(todayISO),
        streak: newStreak,
      };
      this.saveOfflineHabits(offline);
    }

    // Return updated list
    const updatedList = currentHabits.map((h) => {
      if (h.id !== id) return h;
      const isToday = dateISO === todayISO;
      const curStreak = h.streak || 0;
      const newStreak = willBeCompleted
        ? curStreak + (isToday ? 1 : 0)
        : Math.max(0, curStreak - (isToday ? 1 : 0));

      return {
        ...h,
        completedDates: updatedDates,
        completedToday: updatedDates.includes(todayISO),
        streak: newStreak,
      };
    });

    const updatedHabit = updatedList.find((h) => h.id === id)!;
    return { updatedHabit, allHabits: updatedList };
  }

  /**
   * Add a newly created habit locally
   */
  public addHabitLocally(newHabit: Habit): Habit[] {
    const metaMap = this.getMetaMap();
    metaMap[newHabit.id] = {
      identity: newHabit.identity,
      habitStack: newHabit.habitStack,
      twoMinuteRule: newHabit.twoMinuteRule,
      completedDates: newHabit.completedDates || [],
    };
    this.saveMetaMap(metaMap);

    const offline = this.getOfflineHabits();
    const updated = [newHabit, ...offline];
    this.saveOfflineHabits(updated);
    return updated;
  }

  /**
   * Delete a habit locally
   */
  public deleteHabitLocally(id: string): Habit[] {
    this.saveDeletedId(id);
    const metaMap = this.getMetaMap();
    delete metaMap[id];
    this.saveMetaMap(metaMap);

    const offline = this.getOfflineHabits();
    const updated = offline.filter((h) => h.id !== id);
    this.saveOfflineHabits(updated);
    return updated;
  }

  /**
   * Preset identity statement generator based on category
   */
  public deriveDefaultIdentity(category: string): string {
    switch (category?.toLowerCase()) {
      case 'health':
        return 'Healthy & Vital Person';
      case 'fitness':
        return 'Resilient & Strong Athlete';
      case 'productivity':
        return 'Master Software Engineer';
      case 'learning':
        return 'Fluent English Communicator';
      case 'mindset':
        return 'Mindful & Grounded Stoic';
      case 'finance':
        return 'Disciplined Wealth Builder';
      default:
        return 'Dedicated & Consistent Individual';
    }
  }
}

export const atomicHabitsStorage = new AtomicHabitsStorageService();

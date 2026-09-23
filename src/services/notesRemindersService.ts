import type { StickyNote, ReminderItem } from '../types/notesReminders';

const NOTES_STORAGE_KEY = 'pt_sticky_notes_data';
const REMINDERS_STORAGE_KEY = 'pt_reminders_data';

// Helper to get formatted date string for today and offsets
const today = new Date();
const formatDate = (offsetDays: number = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const INITIAL_NOTES: StickyNote[] = [
  {
    id: 'note-1',
    title: '🧠 Architecture Brainstorming',
    content: 'Microservices architecture with Spring Boot & MongoDB Atlas. Focus on caching read-heavy planned budget matrices with Redis or localized IndexedDB cache.',
    color: 'yellow',
    isPinned: true,
    tags: ['Tech', 'Architecture', 'Sprint'],
    createdAt: '2026-09-21T09:00:00.000Z',
    updatedAt: '2026-09-22T14:30:00.000Z',
  },
  {
    id: 'note-2',
    title: '💡 Investment Strategy 2026',
    content: 'Review 60/40 Equity vs Debt ratio before next quarterly rebalance. Ensure emergency fund in high-yield liquid funds covers at least 8 months of living expenses.',
    color: 'green',
    isPinned: true,
    tags: ['Finance', 'Strategy'],
    createdAt: '2026-09-20T10:15:00.000Z',
    updatedAt: '2026-09-23T11:00:00.000Z',
    reminderId: 'rem-2',
  },
  {
    id: 'note-3',
    title: '📚 Books to Read This Quarter',
    content: '1. Thinking in Systems by Donella Meadows\n2. The Psychology of Money by Morgan Housel\n3. High Output Management by Andy Grove',
    color: 'purple',
    isPinned: false,
    tags: ['Personal', 'Reading', 'Growth'],
    createdAt: '2026-09-19T18:40:00.000Z',
    updatedAt: '2026-09-19T18:40:00.000Z',
  },
  {
    id: 'note-4',
    title: '⚡ UI/UX Enhancements',
    content: 'Add smooth micro-animations for sticky note pin toggles, confetti on reminder completion, and accessible contrast palettes for dark/light themes.',
    color: 'blue',
    isPinned: false,
    tags: ['Design', 'Frontend'],
    createdAt: '2026-09-22T16:20:00.000Z',
    updatedAt: '2026-09-23T08:15:00.000Z',
  },
  {
    id: 'note-5',
    title: '🎯 Weekly Habit Focus',
    content: '• Hydration: 3.5L per day\n• 45 mins strength or cardio training\n• Zero screens 30 mins before sleep\n• Evening journaling check-in',
    color: 'pink',
    isPinned: false,
    tags: ['Health', 'Habits'],
    createdAt: '2026-09-21T07:30:00.000Z',
    updatedAt: '2026-09-21T07:30:00.000Z',
  },
  {
    id: 'note-6',
    title: '🔑 Key Credentials & Configs',
    content: 'Remember to verify Atlas connection string before production deploy. Keep SSL certificates updated and check JWT rotation expiry policy.',
    color: 'slate',
    isPinned: false,
    tags: ['DevOps', 'Security'],
    createdAt: '2026-09-18T12:00:00.000Z',
    updatedAt: '2026-09-18T12:00:00.000Z',
  },
];

const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-1',
    title: '⚡ Cloud Infrastructure Review & Audit',
    description: 'Verify MongoDB Atlas performance metrics, active connections, and cluster utilization before end of sprint.',
    dueDate: formatDate(-1), // Yesterday (Overdue)
    dueTime: '18:00',
    priority: 'HIGH',
    isCompleted: false,
    category: 'Work',
  },
  {
    id: 'rem-2',
    title: '💰 Quarterly Portfolio Rebalance Review',
    description: 'Check asset allocation against 60/40 targets and review mutual fund SIP performance.',
    dueDate: formatDate(0), // Today
    dueTime: '17:00',
    priority: 'HIGH',
    isCompleted: false,
    noteId: 'note-2',
    category: 'Finance',
  },
  {
    id: 'rem-3',
    title: '🩺 Annual Executive Health Checkup Booking',
    description: 'Confirm appointment with clinic for annual preventive checkup package.',
    dueDate: formatDate(0), // Today
    dueTime: '19:30',
    priority: 'MEDIUM',
    isCompleted: false,
    category: 'Personal',
  },
  {
    id: 'rem-4',
    title: '🚗 Vehicle Insurance & Registration Renewal',
    description: 'Download policy renewal document and schedule vehicle inspection.',
    dueDate: formatDate(3), // In 3 days
    dueTime: '11:00',
    priority: 'MEDIUM',
    isCompleted: false,
    category: 'Personal',
  },
  {
    id: 'rem-5',
    title: '📋 Submit Expense Claims & Invoices',
    description: 'Upload client travel invoices and team reimbursement receipts.',
    dueDate: formatDate(5), // In 5 days
    dueTime: '16:00',
    priority: 'LOW',
    isCompleted: false,
    category: 'Work',
  },
  {
    id: 'rem-6',
    title: '💳 Pay Broadband Fiber & Utilities Bill',
    description: 'Fiber internet bill SAR 280 paid via online banking transfer.',
    dueDate: formatDate(-3),
    dueTime: '10:00',
    priority: 'LOW',
    isCompleted: true,
    completedAt: '2026-09-20T10:15:00.000Z',
    category: 'Finance',
  },
];

function getStoredNotes(): StickyNote[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notes from localStorage', e);
    return INITIAL_NOTES;
  }
}

function setStoredNotes(notes: StickyNote[]) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to localStorage', e);
  }
}

function getStoredReminders(): ReminderItem[] {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(INITIAL_REMINDERS));
      return INITIAL_REMINDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reminders from localStorage', e);
    return INITIAL_REMINDERS;
  }
}

function setStoredReminders(reminders: ReminderItem[]) {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save reminders to localStorage', e);
  }
}

// ─── Asynchronous API Service (Ready for REST backend endpoint swap) ───────────

export const notesRemindersService = {
  // ── Notes CRUD ──
  async getNotes(): Promise<StickyNote[]> {
    // Simulated async network delay for realism
    await new Promise((r) => setTimeout(r, 60));
    return getStoredNotes();
  },

  async createNote(
    data: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StickyNote> {
    await new Promise((r) => setTimeout(r, 60));
    const notes = getStoredNotes();
    const newNote: StickyNote = {
      ...data,
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setStoredNotes(updated);
    return newNote;
  },

  async updateNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote> {
    await new Promise((r) => setTimeout(r, 60));
    const notes = getStoredNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Note ${id} not found`);

    const updatedNote: StickyNote = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    notes[index] = updatedNote;
    setStoredNotes(notes);
    return updatedNote;
  },

  async deleteNote(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 60));
    const notes = getStoredNotes().filter((n) => n.id !== id);
    setStoredNotes(notes);
  },

  async togglePinNote(id: string): Promise<StickyNote> {
    const notes = getStoredNotes();
    const target = notes.find((n) => n.id === id);
    if (!target) throw new Error(`Note ${id} not found`);
    return this.updateNote(id, { isPinned: !target.isPinned });
  },

  // ── Reminders CRUD ──
  async getReminders(): Promise<ReminderItem[]> {
    await new Promise((r) => setTimeout(r, 60));
    return getStoredReminders();
  },

  async createReminder(data: Omit<ReminderItem, 'id'>): Promise<ReminderItem> {
    await new Promise((r) => setTimeout(r, 60));
    const reminders = getStoredReminders();
    const newReminder: ReminderItem = {
      ...data,
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const updated = [newReminder, ...reminders];
    setStoredReminders(updated);
    return newReminder;
  },

  async updateReminder(id: string, updates: Partial<ReminderItem>): Promise<ReminderItem> {
    await new Promise((r) => setTimeout(r, 60));
    const reminders = getStoredReminders();
    const index = reminders.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Reminder ${id} not found`);

    const updatedItem: ReminderItem = {
      ...reminders[index],
      ...updates,
    };
    reminders[index] = updatedItem;
    setStoredReminders(reminders);
    return updatedItem;
  },

  async toggleReminder(id: string): Promise<ReminderItem> {
    const reminders = getStoredReminders();
    const target = reminders.find((r) => r.id === id);
    if (!target) throw new Error(`Reminder ${id} not found`);

    const isCompleted = !target.isCompleted;
    return this.updateReminder(id, {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });
  },

  async deleteReminder(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 60));
    const reminders = getStoredReminders().filter((r) => r.id !== id);
    setStoredReminders(reminders);
  },

  async snoozeReminder(id: string, days: number = 1): Promise<ReminderItem> {
    const reminders = getStoredReminders();
    const target = reminders.find((r) => r.id === id);
    if (!target) throw new Error(`Reminder ${id} not found`);

    const targetDate = new Date(target.dueDate || today);
    targetDate.setDate(targetDate.getDate() + days);
    const newDueDate = targetDate.toISOString().split('T')[0];

    return this.updateReminder(id, {
      dueDate: newDueDate,
      isCompleted: false,
    });
  },

  async snoozeReminderMinutes(id: string, minutes: number = 10): Promise<ReminderItem> {
    const reminders = getStoredReminders();
    const target = reminders.find((r) => r.id === id);
    if (!target) throw new Error(`Reminder ${id} not found`);

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const newDueDate = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const newDueTime = `${hours}:${mins}`;

    return this.updateReminder(id, {
      dueDate: newDueDate,
      dueTime: newDueTime,
      isCompleted: false,
    });
  },

  async resetToDefaultData(): Promise<{ notes: StickyNote[]; reminders: ReminderItem[] }> {
    setStoredNotes(INITIAL_NOTES);
    setStoredReminders(INITIAL_REMINDERS);
    return { notes: INITIAL_NOTES, reminders: INITIAL_REMINDERS };
  },
};


/**
 * Sticky Notes & Reminders API Service.
 * Connects directly to Spring Boot + MongoDB Atlas collections:
 *   - Collection `sticky_notes` -> Endpoint `/api/sticky_notes`
 *   - Collection `remainder`    -> Endpoint `/api/remainder`
 *
 * Real actual data from MongoDB with localized offline cache fallback.
 * Zero dummy seed data.
 */

import apiClient from './apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import type { StickyNote, ReminderItem, NoteColor } from '../types/notesReminders';

// Clean up any legacy dummy cache keys from initial UI preview
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('pt_sticky_notes_data');
    localStorage.removeItem('pt_reminders_data');
  } catch {
    // Ignore in non-browser environments
  }
}

// ─── Document Normalizers ────────────────────────────────────────────────────

export function normalizeStickyNote(doc: any): StickyNote {
  const id = String(doc.id || doc._id || '');
  return {
    id,
    title: doc.title || '',
    content: doc.content || '',
    color: (doc.color as NoteColor) || 'yellow',
    isPinned: Boolean(doc.isPinned),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
    reminderId: doc.reminderId ? String(doc.reminderId) : undefined,
  };
}

export function normalizeReminder(doc: any): ReminderItem {
  const id = String(doc.id || doc._id || '');
  return {
    id,
    title: doc.title || '',
    description: doc.description || '',
    dueDate: doc.dueDate || '',
    dueTime: doc.dueTime || '',
    priority: doc.priority || 'MEDIUM',
    isCompleted: Boolean(doc.isCompleted),
    completedAt: doc.completedAt || undefined,
    noteId: doc.noteId ? String(doc.noteId) : undefined,
    category: doc.category || undefined,
  };
}

// ─── Local Cache Helpers ──────────────────────────────────────────────────────

function getNotesCache(): StickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STICKY_NOTES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeStickyNote) : [];
  } catch (e) {
    console.warn('Failed to parse sticky_notes cache:', e);
    return [];
  }
}

function setNotesCache(notes: StickyNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.warn('Failed to save sticky_notes cache:', e);
  }
}

function getRemindersCache(): ReminderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMAINDER);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeReminder) : [];
  } catch (e) {
    console.warn('Failed to parse remainder cache:', e);
    return [];
  }
}

function setRemindersCache(reminders: ReminderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMAINDER, JSON.stringify(reminders));
  } catch (e) {
    console.warn('Failed to save remainder cache:', e);
  }
}

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
};

// ─── API Service (Real Endpoints /sticky_notes & /remainder) ───────────────────

export const notesRemindersService = {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. STICKY NOTES API (Collection: sticky_notes)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all sticky notes from MongoDB collection `sticky_notes`.
   * Endpoint: GET /api/sticky_notes
   */
  async getNotes(): Promise<StickyNote[]> {
    try {
      const response = await apiClient.get<any[]>('/sticky_notes');
      if (Array.isArray(response.data)) {
        const normalized = response.data.map(normalizeStickyNote);

        // Auto-sync any notes created while backend was offline/restarting
        const localCache = getNotesCache();
        const pendingSync = localCache.filter(
          (loc) => loc.id.startsWith('note-') && !normalized.some((n) => n.title === loc.title && n.content === loc.content)
        );
        if (pendingSync.length > 0) {
          for (const item of pendingSync) {
            try {
              const { id, ...data } = item;
              const res = await apiClient.post<any>('/sticky_notes', data);
              if (res.data) {
                normalized.push(normalizeStickyNote(res.data));
              }
            } catch {
              // Ignore failure for individual sync
            }
          }
        }

        setNotesCache(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('[API] Could not fetch from /sticky_notes, using local storage cache:', err);
    }
    return getNotesCache();
  },

  /**
   * Create a new sticky note in MongoDB collection `sticky_notes`.
   * Endpoint: POST /api/sticky_notes
   */
  async createNote(
    data: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StickyNote> {
    const payload = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await apiClient.post<any>('/sticky_notes', payload);
      if (response.data) {
        const created = normalizeStickyNote(response.data);
        const cache = getNotesCache().filter((n) => n.id !== created.id);
        setNotesCache([created, ...cache]);
        return created;
      }
    } catch (err) {
      console.warn('[API] Failed to POST to /sticky_notes, storing locally:', err);
    }

    // Local fallback if server offline
    const localNote: StickyNote = {
      ...payload,
      id: generateId('note'),
    };
    const cache = getNotesCache();
    setNotesCache([localNote, ...cache]);
    return localNote;
  },

  /**
   * Update an existing sticky note in MongoDB collection `sticky_notes`.
   * Endpoint: PUT /api/sticky_notes/{id}
   */
  async updateNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote> {
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await apiClient.put<any>(`/sticky_notes/${id}`, payload);
      if (response.data) {
        const updated = normalizeStickyNote(response.data);
        const cache = getNotesCache().map((n) => (n.id === id ? updated : n));
        setNotesCache(cache);
        return updated;
      }
    } catch (err) {
      console.warn(`[API] Failed to PUT to /sticky_notes/${id}, updating locally:`, err);
    }

    // Local cache update
    const cache = getNotesCache();
    const index = cache.findIndex((n) => n.id === id);
    if (index !== -1) {
      const updatedLocal: StickyNote = {
        ...cache[index],
        ...payload,
      };
      cache[index] = updatedLocal;
      setNotesCache(cache);
      return updatedLocal;
    }
    throw new Error(`Note ${id} not found in database or cache`);
  },

  /**
   * Delete a sticky note from MongoDB collection `sticky_notes`.
   * Endpoint: DELETE /api/sticky_notes/{id}
   */
  async deleteNote(id: string): Promise<void> {
    try {
      await apiClient.delete(`/sticky_notes/${id}`);
    } catch (err) {
      console.warn(`[API] Failed to DELETE /sticky_notes/${id}, removing locally:`, err);
    }
    const cache = getNotesCache().filter((n) => n.id !== id);
    setNotesCache(cache);
  },

  /**
   * Pin or unpin a sticky note.
   */
  async togglePinNote(id: string): Promise<StickyNote> {
    const cache = getNotesCache();
    const target = cache.find((n) => n.id === id);
    const newPinned = target ? !target.isPinned : true;
    return this.updateNote(id, { isPinned: newPinned });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. REMAINDER API (Collection: remainder)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all reminders from MongoDB collection `remainder`.
   * Endpoint: GET /api/remainder
   */
  async getReminders(): Promise<ReminderItem[]> {
    try {
      const response = await apiClient.get<any[]>('/remainder');
      if (Array.isArray(response.data)) {
        const normalized = response.data.map(normalizeReminder);

        // Auto-sync any reminders created while backend was offline/restarting
        const localCache = getRemindersCache();
        const pendingSync = localCache.filter(
          (loc) => loc.id.startsWith('rem-') && !normalized.some((n) => n.title === loc.title && n.dueDate === loc.dueDate)
        );
        if (pendingSync.length > 0) {
          for (const item of pendingSync) {
            try {
              const { id, ...data } = item;
              const res = await apiClient.post<any>('/remainder', data);
              if (res.data) {
                normalized.push(normalizeReminder(res.data));
              }
            } catch {
              // Ignore failure for individual sync
            }
          }
        }

        setRemindersCache(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('[API] Could not fetch from /remainder, using local storage cache:', err);
    }
    return getRemindersCache();
  },

  /**
   * Create a new reminder in MongoDB collection `remainder`.
   * Endpoint: POST /api/remainder
   */
  async createReminder(data: Omit<ReminderItem, 'id'>): Promise<ReminderItem> {
    try {
      const response = await apiClient.post<any>('/remainder', data);
      if (response.data) {
        const created = normalizeReminder(response.data);
        const cache = getRemindersCache().filter((r) => r.id !== created.id);
        setRemindersCache([created, ...cache]);
        return created;
      }
    } catch (err) {
      console.warn('[API] Failed to POST to /remainder, storing locally:', err);
    }

    // Local fallback if server offline
    const localReminder: ReminderItem = {
      ...data,
      id: generateId('rem'),
    };
    const cache = getRemindersCache();
    setRemindersCache([localReminder, ...cache]);
    return localReminder;
  },

  /**
   * Update an existing reminder in MongoDB collection `remainder`.
   * Endpoint: PUT /api/remainder/{id}
   */
  async updateReminder(id: string, updates: Partial<ReminderItem>): Promise<ReminderItem> {
    try {
      const response = await apiClient.put<any>(`/remainder/${id}`, updates);
      if (response.data) {
        const updated = normalizeReminder(response.data);
        const cache = getRemindersCache().map((r) => (r.id === id ? updated : r));
        setRemindersCache(cache);
        return updated;
      }
    } catch (err) {
      console.warn(`[API] Failed to PUT to /remainder/${id}, updating locally:`, err);
    }

    // Local cache update
    const cache = getRemindersCache();
    const index = cache.findIndex((r) => r.id === id);
    if (index !== -1) {
      const updatedLocal: ReminderItem = {
        ...cache[index],
        ...updates,
      };
      cache[index] = updatedLocal;
      setRemindersCache(cache);
      return updatedLocal;
    }
    throw new Error(`Reminder ${id} not found in database or cache`);
  },

  /**
   * Toggle completion status of a reminder.
   */
  async toggleReminder(id: string): Promise<ReminderItem> {
    const cache = getRemindersCache();
    const target = cache.find((r) => r.id === id);
    const isCompleted = target ? !target.isCompleted : true;

    return this.updateReminder(id, {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });
  },

  /**
   * Delete a reminder from MongoDB collection `remainder`.
   * Endpoint: DELETE /api/remainder/{id}
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      await apiClient.delete(`/remainder/${id}`);
    } catch (err) {
      console.warn(`[API] Failed to DELETE /remainder/${id}, removing locally:`, err);
    }
    const cache = getRemindersCache().filter((r) => r.id !== id);
    setRemindersCache(cache);
  },

  /**
   * Snooze a reminder by specified minutes.
   */
  async snoozeReminderMinutes(id: string, minutes: number = 10): Promise<ReminderItem> {
    const cache = getRemindersCache();
    const target = cache.find((r) => r.id === id);
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

  /**
   * Snooze a reminder by specified days.
   */
  async snoozeReminder(id: string, days: number = 1): Promise<ReminderItem> {
    const cache = getRemindersCache();
    const target = cache.find((r) => r.id === id);
    if (!target) throw new Error(`Reminder ${id} not found`);

    const targetDate = new Date(target.dueDate || new Date().toISOString().split('T')[0]);
    targetDate.setDate(targetDate.getDate() + days);
    const newDueDate = targetDate.toISOString().split('T')[0];

    return this.updateReminder(id, {
      dueDate: newDueDate,
      isCompleted: false,
    });
  },
};

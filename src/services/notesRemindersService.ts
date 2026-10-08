/**
 * Sticky Notes & Reminders API Service.
 * Connects directly to Spring Boot + MongoDB Atlas collections:
 *   - Collection `sticky_notes` -> Endpoint `/api/sticky_notes`
 *   - Collection `remainder`    -> Endpoint `/api/remainder`
 */

import apiClient from './apiClient';
import { NoteColor, ReminderItem, StickyNote } from '../interface';
import { getLocalDateISO } from '../utils/dateHelpers';

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
    const response = await apiClient.get<any[]>('/sticky_notes');
    return Array.isArray(response.data) ? response.data.map(normalizeStickyNote) : [];
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

    const response = await apiClient.post<any>('/sticky_notes', payload);
    return normalizeStickyNote(response.data);
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

    const response = await apiClient.put<any>(`/sticky_notes/${id}`, payload);
    return normalizeStickyNote(response.data);
  },

  /**
   * Delete a sticky note from MongoDB collection `sticky_notes`.
   * Endpoint: DELETE /api/sticky_notes/{id}
   */
  async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`/sticky_notes/${id}`);
  },

  /**
   * Pin or unpin a sticky note.
   * If currentPinned boolean is provided, updates directly without extra GET.
   */
  async togglePinNote(id: string, currentPinned?: boolean): Promise<StickyNote> {
    if (typeof currentPinned === 'boolean') {
      return this.updateNote(id, { isPinned: !currentPinned });
    }
    try {
      const { data } = await apiClient.post<any>(`/sticky_notes/${id}/toggle-pin`);
      if (data) return normalizeStickyNote(data);
    } catch (err: any) {
      // Only fallback to GET + PUT if the endpoint doesn't exist on server (404/405)
      if (err?.response?.status !== 404 && err?.response?.status !== 405) {
        throw err;
      }
    }
    const { data: note } = await apiClient.get<any>(`/sticky_notes/${id}`);
    const normalized = normalizeStickyNote(note);
    return this.updateNote(id, { isPinned: !normalized.isPinned });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. REMAINDER API (Collection: remainder)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all reminders from MongoDB collection `remainder`.
   * Endpoint: GET /api/remainder
   */
  async getReminders(): Promise<ReminderItem[]> {
    const response = await apiClient.get<any[]>('/remainder');
    return Array.isArray(response.data) ? response.data.map(normalizeReminder) : [];
  },

  /**
   * Create a new reminder in MongoDB collection `remainder`.
   * Endpoint: POST /api/remainder
   */
  async createReminder(data: Omit<ReminderItem, 'id'>): Promise<ReminderItem> {
    const response = await apiClient.post<any>('/remainder', data);
    return normalizeReminder(response.data);
  },

  /**
   * Update an existing reminder in MongoDB collection `remainder`.
   * Endpoint: PUT /api/remainder/{id}
   */
  async updateReminder(id: string, updates: Partial<ReminderItem>): Promise<ReminderItem> {
    const response = await apiClient.put<any>(`/remainder/${id}`, updates);
    return normalizeReminder(response.data);
  },

  /**
   * Toggle completion status of a reminder.
   * If currentCompleted boolean is provided, updates directly without extra GET.
   */
  async toggleReminder(id: string, currentCompleted?: boolean): Promise<ReminderItem> {
    if (typeof currentCompleted === 'boolean') {
      const isCompleted = !currentCompleted;
      return this.updateReminder(id, {
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : '',
      });
    }
    try {
      const { data } = await apiClient.post<any>(`/remainder/${id}/toggle`);
      if (data) return normalizeReminder(data);
    } catch (err: any) {
      // Only fallback to GET + PUT if the endpoint doesn't exist on server (404/405)
      if (err?.response?.status !== 404 && err?.response?.status !== 405) {
        throw err;
      }
    }
    const { data: rem } = await apiClient.get<any>(`/remainder/${id}`);
    const normalized = normalizeReminder(rem);
    const isCompleted = !normalized.isCompleted;

    return this.updateReminder(id, {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : '',
    });
  },

  /**
   * Delete a reminder from MongoDB collection `remainder`.
   * Endpoint: DELETE /api/remainder/{id}
   */
  async deleteReminder(id: string): Promise<void> {
    await apiClient.delete(`/remainder/${id}`);
  },

  /**
   * Snooze a reminder by specified minutes.
   */
  async snoozeReminderMinutes(id: string, minutes: number = 10): Promise<ReminderItem> {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const newDueDate = getLocalDateISO(now);
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
    const { data: rem } = await apiClient.get<any>(`/remainder/${id}`);
    const normalized = normalizeReminder(rem);
    const targetDate = new Date(normalized.dueDate || getLocalDateISO());
    targetDate.setDate(targetDate.getDate() + days);
    const newDueDate = getLocalDateISO(targetDate);

    return this.updateReminder(id, {
      dueDate: newDueDate,
      isCompleted: false,
    });
  },
};

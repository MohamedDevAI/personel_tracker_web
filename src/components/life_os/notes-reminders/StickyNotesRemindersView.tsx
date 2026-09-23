import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { Pin, StickyNote as StickyNoteIcon, Bell, Calendar, Plus } from 'lucide-react';
import { notesRemindersService } from '../../../services/notesRemindersService';
import type { StickyNote, ReminderItem, NoteColor } from '../../../types/notesReminders';
import StickyNotesKpiBanner from './StickyNotesKpiBanner';
import StickyNotesToolbar, { NotesViewMode } from './StickyNotesToolbar';
import StickyNoteCard from './StickyNoteCard';
import ReminderItemRow from './ReminderItemRow';
import StickyNoteModal from './StickyNoteModal';
import ReminderModal from './ReminderModal';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import './notes-reminders.css';

export default function StickyNotesRemindersView() {
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: notes = [] } = useQuery<StickyNote[]>({
    queryKey: ['sticky-notes'],
    queryFn: () => notesRemindersService.getNotes(),
  });

  const { data: reminders = [] } = useQuery<ReminderItem[]>({
    queryKey: ['reminders'],
    queryFn: () => notesRemindersService.getReminders(),
  });

  // ── Note Mutations ─────────────────────────────────────────────────────────
  const createNoteMutation = useMutation({
    mutationFn: (data: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) =>
      notesRemindersService.createNote(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StickyNote> }) =>
      notesRemindersService.updateNote(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  const togglePinMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.togglePinNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  // ── Reminder Mutations ─────────────────────────────────────────────────────
  const createReminderMutation = useMutation({
    mutationFn: (data: Omit<ReminderItem, 'id'>) =>
      notesRemindersService.createReminder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReminderItem> }) =>
      notesRemindersService.updateReminder(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.deleteReminder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const toggleReminderMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.toggleReminder(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      if (data.isCompleted) {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
        });
      }
    },
  });

  const snoozeReminderMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.snoozeReminder(id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  // ── Local UI State ─────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<NotesViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor | 'ALL'>('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');

  // Modal States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'note' | 'reminder';
    id: string;
    title: string;
  } | null>(null);

  // ── Available Tags ─────────────────────────────────────────────────────────
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  // ── Filtered Notes ─────────────────────────────────────────────────────────
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Color filter
      if (selectedColor !== 'ALL' && n.color !== selectedColor) return false;

      // Tag filter
      if (selectedTag !== 'ALL' && !n.tags?.includes(selectedTag)) return false;

      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesTags = n.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      return true;
    });
  }, [notes, selectedColor, selectedTag, searchQuery]);

  // Pinned vs Unpinned
  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  // ── Filtered Reminders ─────────────────────────────────────────────────────
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        const matchesCat = (r.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [reminders, searchQuery]);

  // Reminders Grouped by Overdue, Today, Upcoming, and Completed
  const todayStr = new Date().toISOString().split('T')[0];

  const groupedReminders = useMemo(() => {
    const overdue: ReminderItem[] = [];
    const todayList: ReminderItem[] = [];
    const upcoming: ReminderItem[] = [];
    const completed: ReminderItem[] = [];

    filteredReminders.forEach((r) => {
      if (r.isCompleted) {
        completed.push(r);
      } else if (r.dueDate < todayStr) {
        overdue.push(r);
      } else if (r.dueDate === todayStr) {
        todayList.push(r);
      } else {
        upcoming.push(r);
      }
    });

    // Sort active reminders by due date asc, completed by completedAt desc
    overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    todayList.sort((a, b) => (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    return { overdue, today: todayList, upcoming, completed };
  }, [filteredReminders, todayStr]);

  // ── Note Handlers ──────────────────────────────────────────────────────────
  const handleOpenAddNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: StickyNote) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (data: {
    title: string;
    content: string;
    color: NoteColor;
    isPinned: boolean;
    tags: string[];
  }) => {
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, updates: data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const handleColorChange = (id: string, color: NoteColor) => {
    updateNoteMutation.mutate({ id, updates: { color } });
  };

  // ── Reminder Handlers ──────────────────────────────────────────────────────
  const handleOpenAddReminder = () => {
    setEditingReminder(null);
    setIsReminderModalOpen(true);
  };

  const handleEditReminder = (reminder: ReminderItem) => {
    setEditingReminder(reminder);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = (data: Omit<ReminderItem, 'id' | 'isCompleted'>) => {
    if (editingReminder) {
      updateReminderMutation.mutate({ id: editingReminder.id, updates: data });
    } else {
      createReminderMutation.mutate({ ...data, isCompleted: false });
    }
  };

  // ── Delete Confirmation ────────────────────────────────────────────────────
  const confirmDeleteAction = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'note') {
      deleteNoteMutation.mutate(deleteTarget.id);
    } else {
      deleteReminderMutation.mutate(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="notes-reminders-container">
      {/* ── 1. Top Executive KPI Banner ────────────────────────────────────── */}
      <StickyNotesKpiBanner notes={notes} reminders={reminders} />

      {/* ── 2. Interactive Toolbar ─────────────────────────────────────────── */}
      <StickyNotesToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        availableTags={availableTags}
        onAddNote={handleOpenAddNote}
        onAddReminder={handleOpenAddReminder}
      />

      {/* ── 3. Main Views ──────────────────────────────────────────────────── */}

      {/* VIEW A: All-in-One Dashboard (Split View) */}
      {viewMode === 'all' && (
        <div className="all-in-one-layout">
          {/* Left Column: Sticky Notes Canvas */}
          <div className="aio-column">
            <div className="sticky-section-title-wrap">
              <h3 className="sticky-section-title">
                <StickyNoteIcon size={18} color="#fbbf24" />
                <span>Stationery Board</span>
              </h3>
              <span className="sticky-section-badge">{filteredNotes.length} notes</span>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="notes-empty-state">
                <div className="notes-empty-icon">
                  <StickyNoteIcon size={28} />
                </div>
                <h4 className="notes-empty-title">No Sticky Notes Found</h4>
                <p className="notes-empty-desc">
                  Capture quick thoughts, sprint ideas, and research highlights.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddNote}
                  className="notes-action-btn-primary"
                  style={{ marginTop: 8 }}
                >
                  <Plus size={14} /> Add First Note
                </button>
              </div>
            ) : (
              <div className="sticky-notes-grid">
                {filteredNotes.map((note) => (
                  <StickyNoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={(id) => togglePinMutation.mutate(id)}
                    onColorChange={handleColorChange}
                    onEdit={handleEditNote}
                    onDelete={(n) =>
                      setDeleteTarget({ type: 'note', id: n.id, title: n.title })
                    }
                    linkedReminder={
                      note.reminderId
                        ? reminders.find((r) => r.id === note.reminderId)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Reminders Schedule */}
          <div className="aio-column">
            <div className="sticky-section-title-wrap">
              <h3 className="sticky-section-title">
                <Bell size={18} color="#c084fc" />
                <span>Reminders Schedule</span>
              </h3>
              <span className="sticky-section-badge">
                {groupedReminders.overdue.length +
                  groupedReminders.today.length +
                  groupedReminders.upcoming.length}{' '}
                pending
              </span>
            </div>

            <div className="reminders-section">
              {/* Overdue Group */}
              {groupedReminders.overdue.length > 0 && (
                <div className="reminders-group-container">
                  <div className="reminders-group-header">
                    <span>⚠️ Overdue Alerts</span>
                    <span className="reminders-group-badge overdue">
                      {groupedReminders.overdue.length}
                    </span>
                  </div>
                  {groupedReminders.overdue.map((r) => (
                    <ReminderItemRow
                      key={r.id}
                      reminder={r}
                      onToggle={(id) => toggleReminderMutation.mutate(id)}
                      onEdit={handleEditReminder}
                      onDelete={(rem) =>
                        setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                      }
                      onSnooze={(id) => snoozeReminderMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}

              {/* Today Group */}
              {groupedReminders.today.length > 0 && (
                <div className="reminders-group-container">
                  <div className="reminders-group-header">
                    <span>🔔 Due Today</span>
                    <span className="reminders-group-badge today">
                      {groupedReminders.today.length}
                    </span>
                  </div>
                  {groupedReminders.today.map((r) => (
                    <ReminderItemRow
                      key={r.id}
                      reminder={r}
                      onToggle={(id) => toggleReminderMutation.mutate(id)}
                      onEdit={handleEditReminder}
                      onDelete={(rem) =>
                        setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                      }
                      onSnooze={(id) => snoozeReminderMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}

              {/* Upcoming Group */}
              {groupedReminders.upcoming.length > 0 && (
                <div className="reminders-group-container">
                  <div className="reminders-group-header">
                    <span>📅 Upcoming</span>
                    <span className="reminders-group-badge">
                      {groupedReminders.upcoming.length}
                    </span>
                  </div>
                  {groupedReminders.upcoming.map((r) => (
                    <ReminderItemRow
                      key={r.id}
                      reminder={r}
                      onToggle={(id) => toggleReminderMutation.mutate(id)}
                      onEdit={handleEditReminder}
                      onDelete={(rem) =>
                        setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                      }
                      onSnooze={(id) => snoozeReminderMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}

              {/* Completed Group */}
              {groupedReminders.completed.length > 0 && (
                <div className="reminders-group-container">
                  <div className="reminders-group-header">
                    <span>✓ Completed History</span>
                    <span className="reminders-group-badge">
                      {groupedReminders.completed.length}
                    </span>
                  </div>
                  {groupedReminders.completed.slice(0, 5).map((r) => (
                    <ReminderItemRow
                      key={r.id}
                      reminder={r}
                      onToggle={(id) => toggleReminderMutation.mutate(id)}
                      onEdit={handleEditReminder}
                      onDelete={(rem) =>
                        setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                      }
                    />
                  ))}
                </div>
              )}

              {filteredReminders.length === 0 && (
                <div className="notes-empty-state">
                  <div className="notes-empty-icon">
                    <Calendar size={28} />
                  </div>
                  <h4 className="notes-empty-title">No Reminders Scheduled</h4>
                  <p className="notes-empty-desc">
                    Set date/time reminders with urgency priorities to stay on track.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddReminder}
                    className="notes-action-btn-secondary"
                    style={{ marginTop: 8 }}
                  >
                    <Plus size={14} /> Schedule Reminder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Dedicated Sticky Notes Canvas */}
      {viewMode === 'notes' && (
        <div className="sticky-canvas-section">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="sticky-section-title-wrap">
                <h3 className="sticky-section-title">
                  <Pin size={16} color="#fbbf24" fill="#fbbf24" />
                  <span>Pinned Notes</span>
                </h3>
                <span className="sticky-section-badge">{pinnedNotes.length}</span>
              </div>

              <div className="sticky-notes-grid">
                {pinnedNotes.map((note) => (
                  <StickyNoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={(id) => togglePinMutation.mutate(id)}
                    onColorChange={handleColorChange}
                    onEdit={handleEditNote}
                    onDelete={(n) =>
                      setDeleteTarget({ type: 'note', id: n.id, title: n.title })
                    }
                    linkedReminder={
                      note.reminderId
                        ? reminders.find((r) => r.id === note.reminderId)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unpinned / Regular Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: pinnedNotes.length > 0 ? 12 : 0 }}>
            {pinnedNotes.length > 0 && (
              <div className="sticky-section-title-wrap">
                <h3 className="sticky-section-title">
                  <StickyNoteIcon size={16} />
                  <span>All Other Notes</span>
                </h3>
                <span className="sticky-section-badge">{unpinnedNotes.length}</span>
              </div>
            )}

            {unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
              <div className="notes-empty-state">
                <div className="notes-empty-icon">
                  <StickyNoteIcon size={28} />
                </div>
                <h4 className="notes-empty-title">No Sticky Notes</h4>
                <p className="notes-empty-desc">
                  Start writing down your ideas, checklist items, and project notes.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddNote}
                  className="notes-action-btn-primary"
                  style={{ marginTop: 8 }}
                >
                  <Plus size={14} /> Add Sticky Note
                </button>
              </div>
            ) : (
              <div className="sticky-notes-grid">
                {unpinnedNotes.map((note) => (
                  <StickyNoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={(id) => togglePinMutation.mutate(id)}
                    onColorChange={handleColorChange}
                    onEdit={handleEditNote}
                    onDelete={(n) =>
                      setDeleteTarget({ type: 'note', id: n.id, title: n.title })
                    }
                    linkedReminder={
                      note.reminderId
                        ? reminders.find((r) => r.id === note.reminderId)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW C: Dedicated Reminders Ledger */}
      {viewMode === 'reminders' && (
        <div className="reminders-section" style={{ maxWidth: 840, margin: '0 auto' }}>
          {/* Overdue Group */}
          {groupedReminders.overdue.length > 0 && (
            <div className="reminders-group-container">
              <div className="reminders-group-header">
                <span>⚠️ Overdue Alerts</span>
                <span className="reminders-group-badge overdue">
                  {groupedReminders.overdue.length}
                </span>
              </div>
              {groupedReminders.overdue.map((r) => (
                <ReminderItemRow
                  key={r.id}
                  reminder={r}
                  onToggle={(id) => toggleReminderMutation.mutate(id)}
                  onEdit={handleEditReminder}
                  onDelete={(rem) =>
                    setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                  }
                  onSnooze={(id) => snoozeReminderMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {/* Today Group */}
          {groupedReminders.today.length > 0 && (
            <div className="reminders-group-container">
              <div className="reminders-group-header">
                <span>🔔 Due Today</span>
                <span className="reminders-group-badge today">
                  {groupedReminders.today.length}
                </span>
              </div>
              {groupedReminders.today.map((r) => (
                <ReminderItemRow
                  key={r.id}
                  reminder={r}
                  onToggle={(id) => toggleReminderMutation.mutate(id)}
                  onEdit={handleEditReminder}
                  onDelete={(rem) =>
                    setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                  }
                  onSnooze={(id) => snoozeReminderMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {/* Upcoming Group */}
          {groupedReminders.upcoming.length > 0 && (
            <div className="reminders-group-container">
              <div className="reminders-group-header">
                <span>📅 Upcoming Horizons</span>
                <span className="reminders-group-badge">
                  {groupedReminders.upcoming.length}
                </span>
              </div>
              {groupedReminders.upcoming.map((r) => (
                <ReminderItemRow
                  key={r.id}
                  reminder={r}
                  onToggle={(id) => toggleReminderMutation.mutate(id)}
                  onEdit={handleEditReminder}
                  onDelete={(rem) =>
                    setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                  }
                  onSnooze={(id) => snoozeReminderMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {/* Completed Group */}
          {groupedReminders.completed.length > 0 && (
            <div className="reminders-group-container">
              <div className="reminders-group-header">
                <span>✓ Completed History</span>
                <span className="reminders-group-badge">
                  {groupedReminders.completed.length}
                </span>
              </div>
              {groupedReminders.completed.map((r) => (
                <ReminderItemRow
                  key={r.id}
                  reminder={r}
                  onToggle={(id) => toggleReminderMutation.mutate(id)}
                  onEdit={handleEditReminder}
                  onDelete={(rem) =>
                    setDeleteTarget({ type: 'reminder', id: rem.id, title: rem.title })
                  }
                />
              ))}
            </div>
          )}

          {filteredReminders.length === 0 && (
            <div className="notes-empty-state">
              <div className="notes-empty-icon">
                <Calendar size={28} />
              </div>
              <h4 className="notes-empty-title">No Reminders Found</h4>
              <p className="notes-empty-desc">
                Keep track of critical deadlines, renewals, and medical checks.
              </p>
              <button
                type="button"
                onClick={handleOpenAddReminder}
                className="notes-action-btn-secondary"
                style={{ marginTop: 8 }}
              >
                <Plus size={14} /> Schedule Reminder
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Modals ──────────────────────────────────────────────────────── */}
      {/* Sticky Note Modal */}
      <StickyNoteModal
        isOpen={isNoteModalOpen}
        noteToEdit={editingNote}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        reminderToEdit={editingReminder}
        onClose={() => setIsReminderModalOpen(false)}
        onSave={handleSaveReminder}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'note' ? 'Delete Sticky Note' : 'Delete Reminder'}
        message={
          deleteTarget?.type === 'note'
            ? 'Are you sure you want to remove this sticky note? This action cannot be undone.'
            : 'Are you sure you want to remove this scheduled reminder?'
        }
        itemName={deleteTarget?.title}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAction}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

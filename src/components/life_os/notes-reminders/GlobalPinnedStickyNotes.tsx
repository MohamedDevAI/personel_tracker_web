import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pin, ChevronDown, ChevronUp, X, Plus, Edit3, Check } from 'lucide-react';
import { notesRemindersService } from '../../../services/notesRemindersService';
import type { StickyNote, NoteColor } from '../../../types/notesReminders';

const COLOR_LIST: NoteColor[] = ['yellow', 'green', 'blue', 'purple', 'pink', 'orange', 'slate'];

export default function GlobalPinnedStickyNotes() {
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery<StickyNote[]>({
    queryKey: ['sticky-notes'],
    queryFn: () => notesRemindersService.getNotes(),
  });

  const pinnedNotes = notes.filter((n) => n.isPinned);

  // Unpin mutation
  const unpinMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.togglePinNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  // Color change mutation
  const colorMutation = useMutation({
    mutationFn: ({ id, color }: { id: string; color: NoteColor }) =>
      notesRemindersService.updateNote(id, { color }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  // Fast inline edit mutation
  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      notesRemindersService.updateNote(id, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  // Fast quick create note mutation
  const quickCreateMutation = useMutation({
    mutationFn: (title: string) =>
      notesRemindersService.createNote({
        title,
        content: 'New pinned quick note...',
        color: 'yellow',
        isPinned: true,
        tags: ['Quick'],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sticky-notes'] }),
  });

  // Global state for dock expanded / collapsed
  const [isExpanded, setIsExpanded] = useState(true);
  const [minimizedNotes, setMinimizedNotes] = useState<Record<string, boolean>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // If there are no pinned notes, do not render or disrupt the screen
  if (pinnedNotes.length === 0) {
    return null;
  }

  const toggleMinimizeSingle = (id: string) => {
    setMinimizedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartEdit = (note: StickyNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = (id: string) => {
    editMutation.mutate({ id, content: editingContent });
    setEditingNoteId(null);
  };

  const handleQuickAdd = () => {
    const title = prompt('Enter title for quick pinned note:');
    if (title && title.trim()) {
      quickCreateMutation.mutate(title.trim());
    }
  };

  return (
    <aside className="global-pinned-dock" aria-label="Pinned Sticky Notes Dock">
      {/* ── Collapsed Floating Pill ────────────────────────────────────────── */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="global-pinned-pill-btn"
          title="Click to view your pinned sticky notes across pages"
        >
          <div className="pinned-pill-pin-wrap">
            <Pin size={15} fill="#fbbf24" color="#fbbf24" />
          </div>
          <span className="pinned-pill-title">Pinned Notes</span>
          <span className="pinned-pill-counter">{pinnedNotes.length}</span>
          <ChevronUp size={14} className="pinned-pill-arrow" />
        </button>
      ) : (
        /* ── Expanded Floating Tray ───────────────────────────────────────── */
        <div className="global-pinned-tray glass-panel">
          {/* Tray Header Bar */}
          <div className="global-pinned-tray-header">
            <div className="global-pinned-header-left">
              <Pin size={15} fill="#fbbf24" color="#fbbf24" />
              <span className="global-pinned-title">Pinned Sticky Notes</span>
              <span className="pinned-pill-counter">{pinnedNotes.length}</span>
            </div>

            <div className="global-pinned-header-right">
              {/* Quick Add Button */}
              <button
                type="button"
                className="pinned-header-btn"
                onClick={handleQuickAdd}
                title="Quickly add new pinned note"
              >
                <Plus size={14} />
              </button>

              {/* Minimize Dock Button */}
              <button
                type="button"
                className="pinned-header-btn"
                onClick={() => setIsExpanded(false)}
                title="Minimize sticky notes to small corner pill"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </div>

          {/* Floating Notes Container */}
          <div className="global-pinned-notes-list">
            {pinnedNotes.map((note) => {
              const isMinimized = minimizedNotes[note.id];
              const isEditing = editingNoteId === note.id;

              return (
                <div key={note.id} className={`floating-sticky-card ${note.color}`}>
                  {/* Card Tape accent */}
                  <div className="floating-sticky-tape" />

                  {/* Card Header */}
                  <div className="floating-card-header">
                    <span className="floating-card-title" title={note.title}>
                      {note.title}
                    </span>

                    <div className="floating-card-actions">
                      {/* Minimize / Expand single card */}
                      <button
                        type="button"
                        className="floating-mini-btn"
                        onClick={() => toggleMinimizeSingle(note.id)}
                        title={isMinimized ? 'Expand note' : 'Minimize note to title'}
                      >
                        {isMinimized ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      </button>

                      {/* Edit Button */}
                      {!isMinimized && (
                        <button
                          type="button"
                          className="floating-mini-btn"
                          onClick={() =>
                            isEditing ? handleSaveEdit(note.id) : handleStartEdit(note)
                          }
                          title={isEditing ? 'Save edits' : 'Edit note content'}
                        >
                          {isEditing ? <Check size={12} color="#34d399" /> : <Edit3 size={12} />}
                        </button>
                      )}

                      {/* Unpin Button */}
                      <button
                        type="button"
                        className="floating-mini-btn unpin-btn"
                        onClick={() => unpinMutation.mutate(note.id)}
                        title="Unpin note (removes from floating view across pages)"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body (hidden if single note minimized) */}
                  {!isMinimized && (
                    <>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          className="floating-card-edit-textarea"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="floating-card-body"
                          onClick={() => handleStartEdit(note)}
                          title="Click to edit"
                        >
                          {note.content}
                        </div>
                      )}

                      {/* Card Footer: color swatches & unpin label */}
                      <div className="floating-card-footer">
                        <div className="floating-quick-colors">
                          {COLOR_LIST.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`floating-color-dot ${c} ${note.color === c ? 'active' : ''}`}
                              onClick={() => colorMutation.mutate({ id: note.id, color: c })}
                              title={`Set color to ${c}`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          className="floating-unpin-link"
                          onClick={() => unpinMutation.mutate(note.id)}
                        >
                          Unpin
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

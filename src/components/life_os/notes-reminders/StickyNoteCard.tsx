import { Pin, Edit3, Trash2, Bell } from 'lucide-react';
import type { StickyNote, NoteColor, ReminderItem } from '../../../types/notesReminders';

interface StickyNoteCardProps {
  note: StickyNote;
  onTogglePin: (id: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
  onEdit: (note: StickyNote) => void;
  onDelete: (note: StickyNote) => void;
  linkedReminder?: ReminderItem;
}

const COLOR_LIST: NoteColor[] = ['yellow', 'green', 'blue', 'purple', 'pink', 'orange', 'slate'];

export default function StickyNoteCard({
  note,
  onTogglePin,
  onColorChange,
  onEdit,
  onDelete,
  linkedReminder,
}: StickyNoteCardProps) {
  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`sticky-note-card ${note.color}`}>
      {/* Visual Scotch Tape on Top Center */}
      <div className="sticky-tape" />

      {/* ── Card Header: Title & Action Icons ── */}
      <div className="sticky-card-header">
        <h4 className="sticky-note-title" onClick={() => onEdit(note)} style={{ cursor: 'pointer' }}>
          {note.title}
        </h4>

        <div className="sticky-card-actions">
          {/* Pin Button */}
          <button
            type="button"
            className={`sticky-icon-btn ${note.isPinned ? 'pinned' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={15} fill={note.isPinned ? '#fbbf24' : 'none'} />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            className="sticky-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            title="Edit note"
          >
            <Edit3 size={14} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            className="sticky-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note);
            }}
            title="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Card Content Body ── */}
      <div
        className="sticky-note-body"
        onClick={() => onEdit(note)}
        style={{ cursor: 'pointer' }}
        title="Click to edit content"
      >
        {note.content}
      </div>

      {/* ── Card Footer: Tags & Color Dots ── */}
      <div className="sticky-card-footer">
        {/* Tag pills and linked reminder indicator */}
        <div className="sticky-tag-row">
          {note.tags &&
            note.tags.map((tag) => (
              <span key={tag} className="sticky-tag-chip">
                #{tag}
              </span>
            ))}

          {linkedReminder && (
            <span
              className="sticky-tag-chip"
              style={{
                background: linkedReminder.isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: linkedReminder.isCompleted ? '#34d399' : '#fbbf24',
                borderColor: linkedReminder.isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              }}
              title={`Reminder: ${linkedReminder.dueDate} ${linkedReminder.dueTime || ''}`}
            >
              <Bell size={10} style={{ display: 'inline', marginRight: 3 }} />
              {linkedReminder.dueDate}
            </span>
          )}
        </div>

        {/* Quick color change dots & timestamp */}
        <div className="sticky-card-meta-row">
          <div className="sticky-quick-colors">
            {COLOR_LIST.map((c) => (
              <button
                key={c}
                type="button"
                className={`sticky-mini-dot ${c}`}
                style={{
                  background:
                    c === 'yellow'
                      ? '#facc15'
                      : c === 'green'
                      ? '#34d399'
                      : c === 'blue'
                      ? '#38bdf8'
                      : c === 'purple'
                      ? '#c084fc'
                      : c === 'pink'
                      ? '#f472b6'
                      : c === 'orange'
                      ? '#fb923c'
                      : '#94a3b8',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorChange(note.id, c);
                }}
                title={`Change color to ${c}`}
              />
            ))}
          </div>

          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

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
            <Pin size={15} fill={note.isPinned ? '#f98705' : 'none'} />
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
                background: linkedReminder.isCompleted ? 'rgba(225, 106, 14, 0.15)' : 'rgba(245, 129, 11, 0.15)',
                color: linkedReminder.isCompleted ? '#be590c' : '#d47304',
                borderColor: linkedReminder.isCompleted ? 'rgba(225, 106, 14, 0.3)' : 'rgba(245, 129, 11, 0.3)',
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
                      ? '#f48a05'
                      : c === 'green'
                      ? '#df690e'
                      : c === 'blue'
                      ? '#f79926'
                      : c === 'purple'
                      ? '#f94d0e'
                      : c === 'pink'
                      ? '#f2512c'
                      : c === 'orange'
                      ? '#fa770c'
                      : '#7c716a',
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

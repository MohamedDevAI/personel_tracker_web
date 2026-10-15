import { Pin, Edit3, Trash2, Bell } from 'lucide-react';
import type { StickyNote, NoteColor, ReminderItem } from '../../../types/notesReminders';

interface StickyNoteCardProps {
  note: StickyNote;
  onTogglePin: (id: string, currentPinned?: boolean) => void;
  onColorChange: (id: string, color: NoteColor) => void;
  onEdit: (note: StickyNote) => void;
  onDelete: (note: StickyNote) => void;
  linkedReminder?: ReminderItem;
}

const COLOR_LIST: NoteColor[] = ['yellow', 'green', 'blue', 'purple', 'pink', 'orange', 'slate'];

const COLOR_DOT_HEX_MAP: Record<NoteColor, string> = {
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#38bdf8',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  slate: '#94a3b8',
};

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
    <div className={`sticky-note-card ${note.color} ${note.isPinned ? 'is-pinned' : ''}`}>
      {/* Visual Scotch Tape on Top Center */}
      <div className="sticky-tape" />

      {/* ── Card Header: Title & Action Icons ── */}
      <div className="sticky-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {note.isPinned && (
            <span className="sticky-pinned-badge" title="Pinned to top">
              <Pin size={10} fill="#f59e0b" color="#f59e0b" />
              PINNED
            </span>
          )}
          <h4
            className="sticky-note-title"
            onClick={() => onEdit(note)}
            style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {note.title}
          </h4>
        </div>

        <div className="sticky-card-actions">
          {/* Pin Button */}
          <button
            type="button"
            className={`sticky-icon-btn ${note.isPinned ? 'pinned' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, note.isPinned);
            }}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin
              size={15}
              fill={note.isPinned ? '#f59e0b' : 'none'}
              color={note.isPinned ? '#f59e0b' : 'currentColor'}
            />
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
                className={`sticky-mini-dot ${c} ${note.color === c ? 'active' : ''}`}
                style={{
                  background: COLOR_DOT_HEX_MAP[c],
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

import { useState, useEffect, type FormEvent } from 'react';
import { X, StickyNote as StickyNoteIcon, Pin } from 'lucide-react';
import type { StickyNote, NoteColor } from '../../../types/notesReminders';

interface StickyNoteModalProps {
  isOpen: boolean;
  noteToEdit?: StickyNote | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    color: NoteColor;
    isPinned: boolean;
    tags: string[];
  }) => void;
}

const COLOR_LIST: NoteColor[] = ['yellow', 'green', 'blue', 'purple', 'pink', 'orange', 'slate'];

export default function StickyNoteModal({
  isOpen,
  noteToEdit,
  onClose,
  onSave,
}: StickyNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [isPinned, setIsPinned] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setColor(noteToEdit.color);
      setIsPinned(noteToEdit.isPinned);
      setTagsInput(noteToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setContent('');
      setColor('yellow');
      setIsPinned(false);
      setTagsInput('');
    }
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color,
      isPinned,
      tags,
    });
    onClose();
  };

  return (
    <div className="notes-modal-overlay" onClick={onClose}>
      <div className="notes-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notes-modal-header">
          <div className="notes-modal-title">
            <StickyNoteIcon size={20} color="#fbbf24" />
            <span>{noteToEdit ? 'Edit Sticky Note' : 'Create New Sticky Note'}</span>
          </div>
          <button type="button" className="sticky-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="notes-modal-form">
          <div className="notes-form-field">
            <label className="notes-form-label">Note Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Brainstorming, Grocery List, Project Next Steps..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="notes-form-input"
              autoFocus
            />
          </div>

          <div className="notes-form-field">
            <label className="notes-form-label">Content *</label>
            <textarea
              required
              rows={5}
              placeholder="Type your thoughts, quick bullets, or reminders here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="notes-form-textarea"
            />
          </div>

          <div className="notes-form-field">
            <label className="notes-form-label">Stationery Color</label>
            <div className="notes-color-swatches">
              {COLOR_LIST.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch-btn ${c} ${color === c ? 'selected' : ''}`}
                  onClick={() => setColor(c)}
                  title={`Select ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="notes-form-field">
            <label className="notes-form-label">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Work, Ideas, Finance, Sprint"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="notes-form-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <Pin size={13} style={{ color: isPinned ? '#fbbf24' : 'inherit' }} />
              <span>Pin this note to the top of the canvas</span>
            </label>
          </div>

          <div className="notes-modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" className="notes-action-btn-primary">
              {noteToEdit ? 'Save Changes' : 'Create Sticky Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

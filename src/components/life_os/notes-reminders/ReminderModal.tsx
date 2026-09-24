import { useState, useEffect, type FormEvent } from 'react';
import { X, Bell } from 'lucide-react';
import type { ReminderItem, ReminderPriority } from '../../../types/notesReminders';

interface ReminderModalProps {
  isOpen: boolean;
  reminderToEdit?: ReminderItem | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    dueDate: string;
    dueTime?: string;
    priority: ReminderPriority;
    category?: string;
  }) => void;
}

export default function ReminderModal({
  isOpen,
  reminderToEdit,
  onClose,
  onSave,
}: ReminderModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<ReminderPriority>('MEDIUM');
  const [category, setCategory] = useState('General');

  useEffect(() => {
    if (reminderToEdit) {
      setTitle(reminderToEdit.title);
      setDescription(reminderToEdit.description || '');
      setDueDate(reminderToEdit.dueDate || todayStr);
      setDueTime(reminderToEdit.dueTime || '17:00');
      setPriority(reminderToEdit.priority || 'MEDIUM');
      setCategory(reminderToEdit.category || 'General');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(todayStr);
      setDueTime('17:00');
      setPriority('MEDIUM');
      setCategory('General');
    }
  }, [reminderToEdit, isOpen, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      dueTime: dueTime || undefined,
      priority,
      category: category.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="notes-modal-overlay" onClick={onClose}>
      <div className="notes-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notes-modal-header">
          <div className="notes-modal-title">
            <Bell size={20} color="#c084fc" />
            <span>{reminderToEdit ? 'Edit Reminder' : 'Set New Reminder'}</span>
          </div>
          <button type="button" className="sticky-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="notes-modal-form">
          <div className="notes-form-field">
            <label className="notes-form-label">Reminder Objective *</label>
            <input
              type="text"
              required
              placeholder="e.g. Portfolio Rebalancing, Doctor Appointment, Bill Payment..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="notes-form-input"
              autoFocus
            />
          </div>

          <div className="notes-form-field">
            <label className="notes-form-label">Description / Context (Optional)</label>
            <textarea
              rows={3}
              placeholder="Add key notes, meeting links, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="notes-form-textarea"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="notes-form-field">
              <label className="notes-form-label">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="notes-form-input"
              />
            </div>

            <div className="notes-form-field">
              <label className="notes-form-label">Due Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="notes-form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="notes-form-field">
              <label className="notes-form-label">Urgency Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ReminderPriority)}
                className="notes-form-select"
              >
                <option value="HIGH">🔴 High (Urgent)</option>
                <option value="MEDIUM">🟡 Medium (Important)</option>
                <option value="LOW">🔵 Low (Standard)</option>
              </select>
            </div>

            <div className="notes-form-field">
              <label className="notes-form-label">Category</label>
              <input
                type="text"
                placeholder="e.g. Work, Finance, Health"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="notes-form-input"
              />
            </div>
          </div>

          <div className="notes-modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" className="notes-action-btn-secondary">
              {reminderToEdit ? 'Save Changes' : 'Schedule Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

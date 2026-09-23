import { Check, Clock, AlertCircle, Edit3, Trash2, RotateCw } from 'lucide-react';
import type { ReminderItem, StickyNote } from '../../../types/notesReminders';

interface ReminderItemRowProps {
  reminder: ReminderItem;
  onToggle: (id: string) => void;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onSnooze?: (id: string) => void;
  linkedNote?: StickyNote;
}

export default function ReminderItemRow({
  reminder,
  onToggle,
  onEdit,
  onDelete,
  onSnooze,
}: ReminderItemRowProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !reminder.isCompleted && reminder.dueDate < todayStr;
  const isToday = !reminder.isCompleted && reminder.dueDate === todayStr;

  // Humanize due status
  const getDueLabel = () => {
    if (reminder.isCompleted) {
      return reminder.completedAt
        ? `Completed ${new Date(reminder.completedAt).toLocaleDateString()}`
        : 'Completed';
    }
    if (isOverdue) {
      return `Overdue (${reminder.dueDate})`;
    }
    if (isToday) {
      return `Today ${reminder.dueTime ? `at ${reminder.dueTime}` : ''}`;
    }
    return `${reminder.dueDate} ${reminder.dueTime ? `at ${reminder.dueTime}` : ''}`;
  };

  return (
    <div
      className={`reminder-item-row ${reminder.isCompleted ? 'completed' : ''} ${
        isOverdue ? 'is-overdue' : isToday ? 'is-today' : ''
      }`}
    >
      {/* ── Left Side: Checkbox & Content ── */}
      <div className="reminder-item-left">
        <button
          type="button"
          className={`reminder-checkbox-btn ${reminder.isCompleted ? 'checked' : ''}`}
          onClick={() => onToggle(reminder.id)}
          title={reminder.isCompleted ? 'Mark as pending' : 'Mark as completed'}
        >
          <Check size={14} />
        </button>

        <div className="reminder-content-wrap">
          <div className={`reminder-title ${reminder.isCompleted ? 'strike' : ''}`}>
            {reminder.title}
          </div>
          {reminder.description && (
            <div className="reminder-desc">{reminder.description}</div>
          )}
        </div>
      </div>

      {/* ── Right Side: Badges & Actions ── */}
      <div className="reminder-item-right">
        {/* Priority Badge */}
        <span className={`priority-pill ${reminder.priority.toLowerCase()}`}>
          {reminder.priority === 'HIGH' && <AlertCircle size={11} />}
          {reminder.priority}
        </span>

        {/* Due Date Badge */}
        <span
          className={`reminder-date-badge ${
            isOverdue ? 'overdue' : isToday ? 'today' : ''
          }`}
        >
          <Clock size={12} />
          <span>{getDueLabel()}</span>
        </span>

        {/* Action Buttons: Snooze, Edit, Delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {!reminder.isCompleted && onSnooze && (
            <button
              type="button"
              className="sticky-icon-btn"
              onClick={() => onSnooze(reminder.id)}
              title="Snooze by 1 day"
            >
              <RotateCw size={13} />
            </button>
          )}

          <button
            type="button"
            className="sticky-icon-btn"
            onClick={() => onEdit(reminder)}
            title="Edit reminder"
          >
            <Edit3 size={13} />
          </button>

          <button
            type="button"
            className="sticky-icon-btn"
            onClick={() => onDelete(reminder)}
            title="Delete reminder"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

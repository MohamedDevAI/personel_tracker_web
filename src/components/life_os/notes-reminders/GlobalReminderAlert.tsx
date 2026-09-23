import { Bell, Check, Clock, X, AlertTriangle } from 'lucide-react';
import type { ReminderItem } from '../../../types/notesReminders';

interface GlobalReminderAlertProps {
  alert: ReminderItem | null;
  onComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDismiss: (id: string) => void;
}

export default function GlobalReminderAlert({
  alert,
  onComplete,
  onSnooze,
  onDismiss,
}: GlobalReminderAlertProps) {
  if (!alert) return null;

  return (
    <aside
      className="global-reminder-alert-backdrop"
      role="alert"
      aria-live="assertive"
      aria-label="Active Reminder Notification"
    >
      <div className={`global-reminder-alert-card ${alert.priority.toLowerCase()}`}>
        {/* Pulsing Bell Icon */}
        <div className="alert-bell-wrapper">
          <div className="alert-bell-pulse" />
          <Bell size={24} className="alert-bell-icon" />
        </div>

        {/* Content */}
        <div className="alert-content-container">
          <div className="alert-meta-row">
            <span className="alert-kicker">
              <AlertTriangle size={12} />
              <span>REMINDER DUE</span>
            </span>

            <span className={`priority-pill ${alert.priority.toLowerCase()}`}>
              {alert.priority}
            </span>

            {alert.category && (
              <span className="alert-category-tag">#{alert.category}</span>
            )}
          </div>

          <h3 className="alert-title">{alert.title}</h3>

          {alert.description && (
            <p className="alert-description">{alert.description}</p>
          )}

          {/* Action Buttons */}
          <div className="alert-actions-row">
            {/* Mark Completed */}
            <button
              type="button"
              className="alert-btn-complete"
              onClick={() => onComplete(alert.id)}
            >
              <Check size={14} />
              <span>Mark Completed</span>
            </button>

            {/* Snooze 5 Min */}
            <button
              type="button"
              className="alert-btn-snooze"
              onClick={() => onSnooze(alert.id, 5)}
              title="Remind me again in 5 minutes"
            >
              <Clock size={13} />
              <span>Snooze 5m</span>
            </button>

            {/* Snooze 1 Hour */}
            <button
              type="button"
              className="alert-btn-snooze"
              onClick={() => onSnooze(alert.id, 60)}
              title="Remind me again in 1 hour"
            >
              <Clock size={13} />
              <span>Snooze 1h</span>
            </button>

            {/* Dismiss */}
            <button
              type="button"
              className="alert-btn-dismiss"
              onClick={() => onDismiss(alert.id)}
              title="Dismiss alert"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { StickyNote as StickyNoteIcon, Bell, AlertTriangle, CheckCircle2, Pin } from 'lucide-react';
import type { StickyNote, ReminderItem } from '../../../types/notesReminders';

interface StickyNotesKpiBannerProps {
  notes: StickyNote[];
  reminders: ReminderItem[];
}

export default function StickyNotesKpiBanner({ notes, reminders }: StickyNotesKpiBannerProps) {
  const pinnedNotesCount = notes.filter((n) => n.isPinned).length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingReminders = reminders.filter((r) => !r.isCompleted);
  const overdueCount = pendingReminders.filter((r) => r.dueDate < todayStr).length;
  const todayCount = pendingReminders.filter((r) => r.dueDate === todayStr).length;
  const completedCount = reminders.filter((r) => r.isCompleted).length;
  const completionRate = reminders.length > 0 ? Math.round((completedCount / reminders.length) * 100) : 0;

  return (
    <div className="notes-kpi-banner">
      {/* 1. Total Notes */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap yellow">
          <StickyNoteIcon size={24} />
        </div>
        <div className="notes-kpi-info">
          <span className="notes-kpi-label">Active Sticky Notes</span>
          <span className="notes-kpi-value">{notes.length}</span>
          <span className="notes-kpi-sub">
            <Pin size={11} style={{ display: 'inline', marginRight: 4 }} />
            {pinnedNotesCount} Pinned to Top
          </span>
        </div>
      </div>

      {/* 2. Pending Reminders */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap purple">
          <Bell size={24} />
        </div>
        <div className="notes-kpi-info">
          <span className="notes-kpi-label">Active Reminders</span>
          <span className="notes-kpi-value">{pendingReminders.length}</span>
          <span className="notes-kpi-sub">
            {todayCount > 0 ? `${todayCount} due today` : 'No urgent alerts for today'}
          </span>
        </div>
      </div>

      {/* 3. Overdue Urgency */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap rose">
          <AlertTriangle size={24} />
        </div>
        <div className="notes-kpi-info">
          <span className="notes-kpi-label">Overdue Alerts</span>
          <span className="notes-kpi-value" style={{ color: overdueCount > 0 ? '#fb7185' : undefined }}>
            {overdueCount}
          </span>
          <span className="notes-kpi-sub">
            {overdueCount > 0 ? 'Requires immediate action' : 'All schedules on track ✓'}
          </span>
        </div>
      </div>

      {/* 4. Resolved / Completed */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap emerald">
          <CheckCircle2 size={24} />
        </div>
        <div className="notes-kpi-info">
          <span className="notes-kpi-label">Completed Reminders</span>
          <span className="notes-kpi-value" style={{ color: '#34d399' }}>
            {completedCount}
          </span>
          <span className="notes-kpi-sub">
            {completionRate}% Fulfillment rate
          </span>
        </div>
      </div>
    </div>
  );
}

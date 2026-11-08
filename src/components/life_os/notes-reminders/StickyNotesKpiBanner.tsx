import { StickyNote as StickyNoteIcon, Bell, AlertTriangle, CheckCircle2, Pin } from 'lucide-react';
import type { StickyNote, ReminderItem } from '../../../types/notesReminders';
import { getLocalDateISO } from '../../../utils/dateHelpers';
import { KpiValueSkeleton } from '../../common/LoadingState';

interface StickyNotesKpiBannerProps {
  notes: StickyNote[];
  reminders: ReminderItem[];
  isNotesLoading?: boolean;
  isRemindersLoading?: boolean;
  isLoading?: boolean;
}

export default function StickyNotesKpiBanner({
  notes,
  reminders,
  isNotesLoading = false,
  isRemindersLoading = false,
  isLoading = false,
}: StickyNotesKpiBannerProps) {
  const notesLoading = isLoading || isNotesLoading;
  const remindersLoading = isLoading || isRemindersLoading;

  const pinnedNotesCount = notes.filter((n) => n.isPinned).length;
  
  const todayStr = getLocalDateISO();
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
        <div className="notes-kpi-info" style={{ flex: 1 }}>
          <span className="notes-kpi-label">Active Sticky Notes</span>
          {notesLoading ? (
            <KpiValueSkeleton />
          ) : (
            <>
              <span className="notes-kpi-value">{notes.length}</span>
              <span className="notes-kpi-sub">
                <Pin size={11} style={{ display: 'inline', marginRight: 4 }} />
                {pinnedNotesCount} Pinned to Top
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. Pending Reminders */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap purple">
          <Bell size={24} />
        </div>
        <div className="notes-kpi-info" style={{ flex: 1 }}>
          <span className="notes-kpi-label">Active Reminders</span>
          {remindersLoading ? (
            <KpiValueSkeleton />
          ) : (
            <>
              <span className="notes-kpi-value">{pendingReminders.length}</span>
              <span className="notes-kpi-sub">
                {todayCount > 0 ? `${todayCount} due today` : 'No urgent alerts for today'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Overdue Urgency */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap rose">
          <AlertTriangle size={24} />
        </div>
        <div className="notes-kpi-info" style={{ flex: 1 }}>
          <span className="notes-kpi-label">Overdue Alerts</span>
          {remindersLoading ? (
            <KpiValueSkeleton />
          ) : (
            <>
              <span className="notes-kpi-value" style={{ color: overdueCount > 0 ? '#58514d' : undefined }}>
                {overdueCount}
              </span>
              <span className="notes-kpi-sub">
                {overdueCount > 0 ? 'Requires immediate action' : 'All schedules on track ✓'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 4. Resolved / Completed */}
      <div className="notes-kpi-card">
        <div className="notes-kpi-icon-wrap emerald">
          <CheckCircle2 size={24} />
        </div>
        <div className="notes-kpi-info" style={{ flex: 1 }}>
          <span className="notes-kpi-label">Completed Reminders</span>
          {remindersLoading ? (
            <KpiValueSkeleton />
          ) : (
            <>
              <span className="notes-kpi-value" style={{ color: '#be590c' }}>
                {completedCount}
              </span>
              <span className="notes-kpi-sub">
                {completionRate}% Fulfillment rate
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

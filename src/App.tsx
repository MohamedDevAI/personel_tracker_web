import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LifeOSHub from './pages/LifeOSHub';
import GlobalPinnedStickyNotes from './components/life_os/notes-reminders/GlobalPinnedStickyNotes';
import GlobalReminderAlert from './components/life_os/notes-reminders/GlobalReminderAlert';
import { useGlobalRemindersNotifier } from './hooks/useGlobalRemindersNotifier';
import { useTheme } from './hooks/useTheme';
import { useBackendHealth } from './hooks/useBackendHealth';
import './App.css';

/**
 * App is the root component of the Life OS Personal Tracker.
 *
 * It sets up:
 * - Persistent Life OS Navbar (backend status + reminders)
 * - Life OS hub: tasks, habits, goals, notes & overview (Orange & White Theme)
 * - Global Pinned Sticky Notes dock (active on all screens when pinned)
 * - Global Real-time Reminder Notifier (alerts on any screen when due)
 */
export default function App() {
  useTheme();
  const backendStatus = useBackendHealth();

  useEffect(() => {
    document.documentElement.setAttribute('data-app', 'life-os');
    document.body.setAttribute('data-app', 'life-os');
  }, []);

  // Global Real-time Reminders Notifier across all screens
  const {
    activeAlert,
    handleComplete: handleCompleteReminder,
    handleSnooze: handleSnoozeReminder,
    handleDismiss: handleDismissReminder,
    reminders,
  } = useGlobalRemindersNotifier();

  const activeRemindersCount = reminders.filter((r) => !r.isCompleted).length;

  return (
    <div className="app-wrapper" data-app="life-os">
      <Navbar
        backendStatus={backendStatus}
        activeRemindersCount={activeRemindersCount}
      />

      <main className="app-main-content">
        <Routes>
          {/* Default: redirect to Life OS overview */}
          <Route path="/" element={<Navigate to="/life-os/overview" replace />} />

          {/* Main Life OS hub */}
          <Route path="/life-os/*" element={<LifeOSHub />} />

          {/* Direct convenience / legacy redirects */}
          <Route path="/productivity/*" element={<Navigate to="/life-os/overview" replace />} />
          <Route path="/habits" element={<Navigate to="/life-os/habits" replace />} />
          <Route path="/goals" element={<Navigate to="/life-os/goals" replace />} />
          <Route path="/tasks" element={<Navigate to="/life-os/overview" replace />} />
          <Route path="/notes" element={<Navigate to="/life-os/notes" replace />} />
          <Route path="/reminders" element={<Navigate to="/life-os/notes" replace />} />
          <Route path="/sticky-notes" element={<Navigate to="/life-os/notes" replace />} />

          {/* Catch-all: redirect unknown paths to overview */}
          <Route path="*" element={<Navigate to="/life-os/overview" replace />} />
        </Routes>
      </main>

      {/* Global Pinned Sticky Notes Dock (Active across all pages when pinned) */}
      <GlobalPinnedStickyNotes />

      {/* Global Real-time Reminder Alert (Fires across all screens when due) */}
      <GlobalReminderAlert
        alert={activeAlert}
        onComplete={handleCompleteReminder}
        onSnooze={handleSnoozeReminder}
        onDismiss={handleDismissReminder}
      />
    </div>
  );
}

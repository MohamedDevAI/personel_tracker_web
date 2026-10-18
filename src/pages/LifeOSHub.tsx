import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import ExpenseTracker from './ExpenseTracker';
import GoalsView from '../components/life_os/goals/GoalsView';
import HabitsView from '../components/life_os/habits/HabitsView';
import SingleHabitPage from './SingleHabitPage';
import StickyNotesRemindersView from '../components/life_os/notes-reminders/StickyNotesRemindersView';
import '../components/life_os/productivity/productivity.css';

export default function LifeOSHub() {
  return (
    <div className="productivity-hub-container">
      {/* Sub-tab Views */}
      <div className="productivity-subtab-content">
        <Routes>
          <Route path="overview" element={<Dashboard />} />
          <Route path="finances/*" element={<ExpenseTracker />} />
          <Route path="finances" element={<ExpenseTracker />} />
          <Route path="goals" element={<GoalsView />} />
          <Route path="habits" element={<HabitsView />} />
          <Route path="habits/:id" element={<SingleHabitPage />} />
          <Route path="notes" element={<StickyNotesRemindersView />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </div>
  );
}


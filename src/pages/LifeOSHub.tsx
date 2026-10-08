import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import ExpenseTracker from './ExpenseTracker';
import GoalsView from '../components/life_os/goals/GoalsView';
import HabitsView from '../components/life_os/habits/HabitsView';
import StickyNotesRemindersView from '../components/life_os/notes-reminders/StickyNotesRemindersView';
import '../components/life_os/productivity/productivity.css';

export type LifeOSTabKey = 'overview' | 'finances' | 'goals' | 'habits' | 'notes';

export default function LifeOSHub() {
  const location = useLocation();

  // Active sub-tab from current path
  const activeTab: LifeOSTabKey = useMemo(() => {
    if (location.pathname.includes('/finances') || location.pathname.includes('/finance')) return 'finances';
    if (location.pathname.includes('/goals')) return 'goals';
    if (location.pathname.includes('/habits')) return 'habits';
    if (location.pathname.includes('/notes') || location.pathname.includes('/reminders')) return 'notes';
    return 'overview';
  }, [location.pathname]);

  return (
    <div className="productivity-hub-container">
      {/* Sub-tab Views */}
      <div className="productivity-subtab-content">
        {activeTab === 'overview' && <Dashboard />}
        {activeTab === 'finances' && <ExpenseTracker />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'habits' && <HabitsView />}
        {activeTab === 'notes' && <StickyNotesRemindersView />}
      </div>
    </div>
  );
}

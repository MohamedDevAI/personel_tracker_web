import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Target, Flame, StickyNote as StickyNoteIcon } from 'lucide-react';
import Dashboard from './Dashboard';
import ExpenseTracker from './ExpenseTracker';
import GoalsView from '../components/life_os/goals/GoalsView';
import HabitsView from '../components/life_os/habits/HabitsView';
import StickyNotesRemindersView from '../components/life_os/notes-reminders/StickyNotesRemindersView';
import '../components/life_os/productivity/productivity.css';

export type LifeOSTabKey = 'overview' | 'finances' | 'goals' | 'habits' | 'notes';

export default function LifeOSHub() {
  const location = useLocation();
  const navigate = useNavigate();

  // Active sub-tab from current path
  const activeTab: LifeOSTabKey = useMemo(() => {
    if (location.pathname.includes('/finances') || location.pathname.includes('/finance')) return 'finances';
    if (location.pathname.includes('/goals')) return 'goals';
    if (location.pathname.includes('/habits')) return 'habits';
    if (location.pathname.includes('/notes') || location.pathname.includes('/reminders')) return 'notes';
    return 'overview';
  }, [location.pathname]);

  const handleSelectTab = (tab: LifeOSTabKey) => {
    navigate(`/life-os/${tab}`);
  };

  return (
    <div className="productivity-hub-container">
      {/* Life OS Header */}
      <div className="productivity-hub-header">
        {/* Life OS Sub-Navigation Bar */}
        <div className="productivity-nav-tabs-wrapper">
          <div className="productivity-nav-tabs-bar">
            <button
              onClick={() => handleSelectTab('overview')}
              className={`productivity-main-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => handleSelectTab('finances')}
              className={`productivity-main-nav-tab ${activeTab === 'finances' ? 'active' : ''}`}
            >
              <Wallet size={17} />
              <span>Finances & Ledger</span>
            </button>

            <button
              onClick={() => handleSelectTab('goals')}
              className={`productivity-main-nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
            >
              <Target size={17} />
              <span>Strategic Goals</span>
            </button>

            <button
              onClick={() => handleSelectTab('habits')}
              className={`productivity-main-nav-tab ${activeTab === 'habits' ? 'active' : ''}`}
            >
              <Flame size={17} />
              <span>Habit Routines</span>
            </button>

            <button
              onClick={() => handleSelectTab('notes')}
              className={`productivity-main-nav-tab ${activeTab === 'notes' ? 'active' : ''}`}
            >
              <StickyNoteIcon size={17} />
              <span>Sticky Notes & Reminders</span>
            </button>
          </div>
        </div>
      </div>

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

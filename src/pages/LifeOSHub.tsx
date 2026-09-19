import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, CheckSquare, Target, Flame, Sparkles } from 'lucide-react';
import Dashboard from './Dashboard';
import ExpenseTracker from './ExpenseTracker';
import TasksView from '../components/life_os/tasks/TasksView';
import GoalsView from '../components/life_os/goals/GoalsView';
import HabitsView from '../components/life_os/habits/HabitsView';
import '../components/life_os/productivity/productivity.css';

export type LifeOSTabKey = 'overview' | 'finances' | 'tasks' | 'goals' | 'habits';

export default function LifeOSHub() {
  const location = useLocation();
  const navigate = useNavigate();

  // Active sub-tab from current path
  const activeTab: LifeOSTabKey = useMemo(() => {
    if (location.pathname.includes('/finances') || location.pathname.includes('/finance')) return 'finances';
    if (location.pathname.includes('/tasks')) return 'tasks';
    if (location.pathname.includes('/goals')) return 'goals';
    if (location.pathname.includes('/habits')) return 'habits';
    return 'overview';
  }, [location.pathname]);

  const handleSelectTab = (tab: LifeOSTabKey) => {
    navigate(`/life-os/${tab}`);
  };

  return (
    <div className="productivity-hub-container">
      {/* Life OS Header */}
      <div className="productivity-hub-header">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-indigo">
                <Sparkles size={12} /> Life OS Umbrella
              </span>
            </div>
            <h1 className="page-header-title">
              Life OS & <span className="gradient-text">Personal Executive Engine</span>
            </h1>
            <p className="page-header-subtitle">
              Central command for personal finances, daily execution, habit routines, strategic goals, and executive performance.
            </p>
          </div>
        </div>

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
              onClick={() => handleSelectTab('tasks')}
              className={`productivity-main-nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            >
              <CheckSquare size={17} />
              <span>Daily Tasks</span>
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
          </div>
        </div>
      </div>

      {/* Sub-tab Views */}
      <div className="productivity-subtab-content">
        {activeTab === 'overview' && <Dashboard />}
        {activeTab === 'finances' && <ExpenseTracker />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'habits' && <HabitsView />}
      </div>
    </div>
  );
}

import React from 'react';
import { CheckSquare, Target, Flame } from 'lucide-react';
import './productivity.css';

export type ProductivityTabKey = 'tasks' | 'goals' | 'habits';

interface ProductivityTabsHeaderProps {
  activeTab: ProductivityTabKey;
  onSelectTab: (tab: ProductivityTabKey) => void;
  pendingTasksCount?: number;
  activeGoalsCount?: number;
  habitsDoneCount?: number;
  totalHabitsCount?: number;
}

export default function ProductivityTabsHeader({
  activeTab,
  onSelectTab,
  pendingTasksCount = 0,
  activeGoalsCount = 0,
  habitsDoneCount = 0,
  totalHabitsCount = 0,
}: ProductivityTabsHeaderProps) {
  return (
    <div className="productivity-nav-tabs-wrapper">
      <div className="productivity-nav-tabs-bar">
        <button
          onClick={() => onSelectTab('tasks')}
          className={`productivity-main-nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
        >
          <CheckSquare size={17} />
          <span>Tasks Board</span>
          {pendingTasksCount > 0 && (
            <span className="productivity-nav-pill-counter">{pendingTasksCount} pending</span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('goals')}
          className={`productivity-main-nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
        >
          <Target size={17} />
          <span>Strategic Goals</span>
          {activeGoalsCount > 0 && (
            <span className="productivity-nav-pill-counter">{activeGoalsCount} active</span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('habits')}
          className={`productivity-main-nav-tab ${activeTab === 'habits' ? 'active' : ''}`}
        >
          <Flame size={17} />
          <span>Habit Routines</span>
          {totalHabitsCount > 0 && (
            <span className="productivity-nav-pill-counter alert">
              {habitsDoneCount}/{totalHabitsCount} today
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

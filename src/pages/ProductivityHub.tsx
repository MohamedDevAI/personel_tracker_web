import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { TaskItem, Goal, Habit } from '../types';
import ProductivityTabsHeader, { ProductivityTabKey } from '../components/productivity/ProductivityTabsHeader';
import Tasks from './Tasks';
import Goals from './Goals';
import Habits from './Habits';
import '../components/productivity/productivity.css';

export default function ProductivityHub() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active sub-tab based on current path
  const activeTab: ProductivityTabKey = useMemo(() => {
    if (location.pathname.includes('/goals')) return 'goals';
    if (location.pathname.includes('/habits')) return 'habits';
    return 'tasks';
  }, [location.pathname]);

  // Data queries for tab counters
  const { data: tasks = [] } = useQuery<TaskItem[]>({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: api.getGoals,
  });

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: api.getHabits,
  });

  const pendingTasksCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const activeGoalsCount = useMemo(() => goals.filter((g) => (g.progress || 0) < 100).length, [goals]);
  const habitsDoneCount = useMemo(() => habits.filter((h) => h.completedToday).length, [habits]);

  const handleSelectTab = (tab: ProductivityTabKey) => {
    navigate(`/productivity/${tab}`);
  };

  return (
    <div className="productivity-hub-container">
      <div className="productivity-hub-header">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <div>
            <h1 className="page-header-title">
              Productivity & <span className="gradient-text">Execution Hub</span>
            </h1>
            <p className="page-header-subtitle">
              Manage daily task action items, strategic goals, and habit routines in a single unified workspace.
            </p>
          </div>
        </div>

        <ProductivityTabsHeader
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          pendingTasksCount={pendingTasksCount}
          activeGoalsCount={activeGoalsCount}
          habitsDoneCount={habitsDoneCount}
          totalHabitsCount={habits.length}
        />
      </div>

      <div className="productivity-subtab-content">
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'goals' && <Goals />}
        {activeTab === 'habits' && <Habits />}
      </div>
    </div>
  );
}

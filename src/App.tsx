import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import QuickAddModal from './components/QuickAddModal';
import Dashboard from './pages/Dashboard';
import ExpenseTracker from './pages/ExpenseTracker';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Tasks from './pages/Tasks';
import { api, checkBackendHealth } from './services/api';
import { ShieldCheck, GitBranch, Terminal } from 'lucide-react';
import { Expense, Habit, Goal, TaskItem, BackendHealth } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>('dark');
  const [backendStatus, setBackendStatus] = useState<BackendHealth>({ connected: false, mode: 'local' });

  // Core Data States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);

  // Initialize theme and load data
  useEffect(() => {
    const savedTheme = localStorage.getItem('pt_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const loadData = async () => {
      setLoading(true);
      const [expList, habitList, goalList, taskList, health] = await Promise.all([
        api.getExpenses(),
        api.getHabits(),
        api.getGoals(),
        api.getTasks(),
        checkBackendHealth()
      ]);
      setExpenses(expList || []);
      setHabits(habitList || []);
      setGoals(goalList || []);
      setTasks(taskList || []);
      setBackendStatus(health);
      setLoading(false);
    };

    loadData();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('pt_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Handlers for data mutations
  const handleAddExpense = async (item: Omit<Expense, 'id'>) => {
    const created = await api.createExpense(item);
    setExpenses(prev => [created, ...prev]);
  };

  const _handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleHabit = async (id: string) => {
    const updated = await api.toggleHabit(id);
    setHabits(prev => prev.map(h => h.id === id ? updated : h));
  };

  const handleAddHabit = async (habit: Pick<Habit, 'title' | 'category' | 'targetFrequency'>) => {
    const created = await api.createHabit(habit);
    setHabits(prev => [...prev, created]);
  };

  const handleUpdateGoalProgress = async (id: string, val: number) => {
    const updated = await api.updateGoalProgress(id, val);
    setGoals(prev => prev.map(g => g.id === id ? updated : g));
  };

  const handleAddGoal = async (goal: Omit<Goal, 'id'>) => {
    const created = await api.createGoal(goal);
    setGoals(prev => [...prev, created]);
  };

  const handleToggleTask = async (id: string) => {
    const updated = await api.toggleTask(id);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const handleAddTask = async (task: Omit<TaskItem, 'id' | 'completed'>) => {
    const created = await api.createTask(task);
    setTasks(prev => [created, ...prev]);
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        backendStatus={backendStatus}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main style={{ flex: 1, paddingTop: '8px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            habits={habits}
            goals={goals}
            tasks={tasks}
            onToggleHabit={handleToggleHabit}
            onToggleTask={handleToggleTask}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'finances' && (
          <ExpenseTracker />
        )}

        {activeTab === 'habits' && (
          <Habits
            habits={habits}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
          />
        )}

        {activeTab === 'goals' && (
          <Goals
            goals={goals}
            onUpdateProgress={handleUpdateGoalProgress}
            onAddGoal={handleAddGoal}
          />
        )}

        {activeTab === 'tasks' && (
          <Tasks
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      {/* Universal Quick Add */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddExpense={handleAddExpense}
        onAddHabit={handleAddHabit}
        onAddGoal={handleAddGoal}
        onAddTask={handleAddTask}
      />

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Personal Tracker Architecture • Spring Boot 3.x (Java 25 Target) & React</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={14} /> Git Ready: <code>main</code>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} /> MongoDB Atlas Driver Configured
          </span>
        </div>
      </footer>
    </div>
  );
}

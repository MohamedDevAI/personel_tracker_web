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
import './App.css';

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

  const handleToggleHabit = async (id: string) => {
    const updated = await api.toggleHabit(id);
    setHabits(prev => prev.map(h => h.id === id ? updated : h));
  };

  const handleAddHabit = async (habit: Pick<Habit, 'title' | 'category' | 'targetFrequency'>) => {
    const created = await api.createHabit(habit);
    setHabits(prev => [...prev, created]);
  };

  const handleUpdateGoalProgress = async (id: string, progress: number) => {
    const updated = await api.updateGoalProgress(id, progress);
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
    <div className="app-wrapper">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        backendStatus={backendStatus}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="app-main-content">
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
      <footer className="app-footer">
        <div className="app-footer-brand-info">
          <ShieldCheck size={16} color="#10b981" />
          <span>Personal Tracker Architecture • Spring Boot 3.x (Java 25 Target) & React</span>
        </div>
        <div className="app-footer-links-group">
          <span className="app-footer-item">
            <GitBranch size={14} /> Git Ready: <code>main</code>
          </span>
          <span className="app-footer-item">
            <Terminal size={14} /> MongoDB Atlas Driver Configured
          </span>
        </div>
      </footer>
    </div>
  );
}

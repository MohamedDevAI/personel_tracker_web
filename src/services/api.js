// API Service for Spring Boot Backend with Local Fallback Engine

const API_BASE = '/api';

// Initial Mock Seed Data (Refined, Realistic, High-Value)
const initialStorage = {
  dashboard: {
    streakDays: 14,
    monthlyIncome: 6450.00,
    monthlyExpense: 2310.50,
    savingsRate: 64.2,
    activeHabitsCount: 6,
    completedTasksToday: 7,
    totalTasksToday: 9,
    goalsCompletedCount: 3,
    activeGoalsCount: 5,
  },
  expenses: [
    { id: '1', title: 'MacBook Pro M4 Monitor Setup', amount: 849.00, type: 'EXPENSE', category: 'Tech & Work', date: '2026-09-02', notes: 'Tax-deductible office workstation' },
    { id: '2', title: 'Consulting Retainer Client A', amount: 4200.00, type: 'INCOME', category: 'Consulting', date: '2026-09-01', notes: 'Monthly engineering deliverables' },
    { id: '3', title: 'Whole Foods Organic Groceries', amount: 165.40, type: 'EXPENSE', category: 'Nutrition', date: '2026-09-05', notes: 'Weekly meal prep' },
    { id: '4', title: 'SaaS Subscriptions (JetBrains, Cloud)', amount: 78.00, type: 'EXPENSE', category: 'Software', date: '2026-09-06', notes: 'Dev tools' },
    { id: '5', title: 'Equity Dividend Payout', amount: 2250.00, type: 'INCOME', category: 'Investment', date: '2026-09-07', notes: 'Quarterly dividend distribution' },
    { id: '6', title: 'Equinox Gym & Wellness Membership', amount: 260.00, type: 'EXPENSE', category: 'Fitness', date: '2026-09-04', notes: 'Monthly membership' }
  ],
  habits: [
    { id: '1', title: '6:30 AM Morning Run & Mobility', category: 'Health', streak: 14, targetFrequency: 'Daily', completedToday: true, history: [1, 1, 1, 1, 1, 1, 1] },
    { id: '2', title: 'Deep Work Block (90 Mins No Distraction)', category: 'Productivity', streak: 9, targetFrequency: 'Daily', completedToday: true, history: [1, 0, 1, 1, 1, 1, 1] },
    { id: '3', title: 'Read 25 Pages (Architecture & Tech)', category: 'Learning', streak: 21, targetFrequency: 'Daily', completedToday: false, history: [1, 1, 1, 1, 1, 1, 0] },
    { id: '4', title: 'Cold Shower & Wim Hof Breathing', category: 'Health', streak: 8, targetFrequency: 'Daily', completedToday: true, history: [0, 1, 1, 1, 1, 1, 1] },
    { id: '5', title: 'Evening Portfolio & Budget Review', category: 'Finance', streak: 12, targetFrequency: 'Daily', completedToday: false, history: [1, 1, 1, 1, 1, 0, 0] },
  ],
  goals: [
    { id: '1', title: 'Launch Production Micro-SaaS Product', category: 'Career', targetDate: '2026-11-30', progress: 75, targetValue: 100, currentValue: 75, unit: '%', status: 'IN_PROGRESS' },
    { id: '2', title: 'Emergency Fund ($30,000 Liquid)', category: 'Finance', targetDate: '2026-12-31', progress: 85, targetValue: 30000, currentValue: 25500, unit: '$', status: 'IN_PROGRESS' },
    { id: '3', title: 'Run Half-Marathon under 1h 45m', category: 'Fitness', targetDate: '2026-10-15', progress: 60, targetValue: 100, currentValue: 60, unit: '%', status: 'IN_PROGRESS' },
    { id: '4', title: 'Master Distributed Systems with Java & Go', category: 'Learning', targetDate: '2026-10-01', progress: 90, targetValue: 100, currentValue: 90, unit: '%', status: 'NEAR_COMPLETION' }
  ],
  tasks: [
    { id: '1', title: 'Connect Spring Boot to MongoDB Atlas Cluster', priority: 'HIGH', category: 'Development', completed: false, dueDate: '2026-09-09' },
    { id: '2', title: 'Review Personal Tracker Github Repository remote sync', priority: 'HIGH', category: 'DevOps', completed: true, dueDate: '2026-09-08' },
    { id: '3', title: 'Configure monthly recurring savings transfer', priority: 'MEDIUM', category: 'Finance', completed: false, dueDate: '2026-09-10' },
    { id: '4', title: 'Write unit tests for Spring Boot Mongo controllers', priority: 'MEDIUM', category: 'Development', completed: false, dueDate: '2026-09-11' },
    { id: '5', title: 'Order electrolyte supplements for marathon training', priority: 'LOW', category: 'Health', completed: true, dueDate: '2026-09-07' }
  ]
};

// Initialize localStorage if empty
const getLocal = (key) => {
  const data = localStorage.getItem(`pt_${key}`);
  if (!data) {
    localStorage.setItem(`pt_${key}`, JSON.stringify(initialStorage[key]));
    return initialStorage[key];
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialStorage[key];
  }
};

const setLocal = (key, val) => {
  localStorage.setItem(`pt_${key}`, JSON.stringify(val));
};

// Check backend connectivity
export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      return { connected: true, ...data };
    }
    return { connected: false, mode: 'local' };
  } catch (err) {
    return { connected: false, mode: 'local' };
  }
};

export const api = {
  // Expenses API
  getExpenses: async () => {
    try {
      const res = await fetch(`${API_BASE}/expenses`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocal('expenses');
  },

  createExpense: async (expense) => {
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('expenses');
    const newItem = { ...expense, id: Date.now().toString() };
    const updated = [newItem, ...list];
    setLocal('expenses', updated);
    return newItem;
  },

  deleteExpense: async (id) => {
    try {
      await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const list = getLocal('expenses').filter(x => x.id !== id);
    setLocal('expenses', list);
    return true;
  },

  // Habits API
  getHabits: async () => {
    try {
      const res = await fetch(`${API_BASE}/habits`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocal('habits');
  },

  toggleHabit: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/habits/${id}/toggle`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('habits');
    const updated = list.map(h => {
      if (h.id === id) {
        const nextState = !h.completedToday;
        const nextStreak = nextState ? h.streak + 1 : Math.max(0, h.streak - 1);
        const nextHist = [...h.history.slice(1), nextState ? 1 : 0];
        return { ...h, completedToday: nextState, streak: nextStreak, history: nextHist };
      }
      return h;
    });
    setLocal('habits', updated);
    return updated.find(h => h.id === id);
  },

  createHabit: async (habit) => {
    try {
      const res = await fetch(`${API_BASE}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habit),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('habits');
    const newItem = {
      ...habit,
      id: Date.now().toString(),
      streak: 1,
      completedToday: true,
      history: [0, 0, 0, 0, 0, 0, 1]
    };
    const updated = [...list, newItem];
    setLocal('habits', updated);
    return newItem;
  },

  // Goals API
  getGoals: async () => {
    try {
      const res = await fetch(`${API_BASE}/goals`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocal('goals');
  },

  updateGoalProgress: async (id, newProgress) => {
    try {
      const res = await fetch(`${API_BASE}/goals/${id}/progress?value=${newProgress}`, { method: 'PATCH' });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('goals');
    const updated = list.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, newProgress)) } : g);
    setLocal('goals', updated);
    return updated.find(g => g.id === id);
  },

  createGoal: async (goal) => {
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('goals');
    const newItem = { ...goal, id: Date.now().toString(), status: 'IN_PROGRESS' };
    const updated = [...list, newItem];
    setLocal('goals', updated);
    return newItem;
  },

  // Tasks API
  getTasks: async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocal('tasks');
  },

  toggleTask: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('tasks');
    const updated = list.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setLocal('tasks', updated);
    return updated.find(t => t.id === id);
  },

  createTask: async (task) => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocal('tasks');
    const newItem = { ...task, id: Date.now().toString(), completed: false };
    const updated = [newItem, ...list];
    setLocal('tasks', updated);
    return newItem;
  },

  deleteTask: async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const list = getLocal('tasks').filter(t => t.id !== id);
    setLocal('tasks', list);
    return true;
  }
};

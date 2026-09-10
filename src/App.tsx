/**
 * App Shell — Layout, routing, and app-level concerns only.
 * Individual pages manage their own data fetching and state.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ExpenseTracker from './pages/ExpenseTracker';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Tasks from './pages/Tasks';
import { useTheme } from './hooks/useTheme';
import { useBackendHealth } from './hooks/useBackendHealth';
import { ShieldCheck, GitBranch, Terminal } from 'lucide-react';
import './App.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const backendStatus = useBackendHealth();

  return (
    <div className="app-wrapper">
      <Navbar
        backendStatus={backendStatus}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="app-main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finances" element={<ExpenseTracker />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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

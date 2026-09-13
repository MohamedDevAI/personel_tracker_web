import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LifeOSHub from './pages/LifeOSHub';
import MoneyHub from './pages/MoneyHub';
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
          <Route path="/" element={<Navigate to="/life-os/overview" replace />} />
          <Route path="/life-os/*" element={<LifeOSHub />} />
          <Route path="/money/*" element={<MoneyHub />} />

          {/* Backwards compatibility redirects */}
          <Route path="/finances/*" element={<Navigate to="/money" replace />} />
          <Route path="/productivity/*" element={<Navigate to="/life-os/tasks" replace />} />
          <Route path="/habits" element={<Navigate to="/life-os/habits" replace />} />
          <Route path="/goals" element={<Navigate to="/life-os/goals" replace />} />
          <Route path="/tasks" element={<Navigate to="/life-os/tasks" replace />} />
          <Route path="*" element={<Navigate to="/life-os/overview" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer-brand-info">
          <ShieldCheck size={16} color="#10b981" />
          <span>Personal Tracker Architecture • Life OS & Money Engine • Spring Boot 3.x & React</span>
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

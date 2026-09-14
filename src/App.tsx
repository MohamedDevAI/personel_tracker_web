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


    </div>
  );
}

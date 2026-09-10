import React from 'react';
import { LayoutDashboard, Wallet, Flame, Target, CheckSquare, Plus, Database, Sparkles, Moon, Sun, LucideIcon } from 'lucide-react';
import { BackendHealth } from '../types';
import './Navbar.css';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  backendStatus: BackendHealth;
  theme: string;
  toggleTheme: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  backendStatus,
  theme,
  toggleTheme
}: NavbarProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finances', label: 'Finances', icon: Wallet },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <header className="glass-panel navbar-header">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="navbar-brand-icon">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="navbar-brand-title-wrap">
            <span className="navbar-brand-title">
              Personal<span className="gradient-text">Tracker</span>
            </span>
            <span className="badge badge-indigo navbar-pro-badge">PRO</span>
          </div>
          <div className="navbar-brand-subtitle">Life, Finances & Habits Engine</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="navbar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`navbar-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Actions & Status */}
      <div className="navbar-actions">
        {/* Backend / Mongo Atlas Indicator */}
        <div
          title={backendStatus.connected ? "Spring Boot & MongoDB Atlas connected" : "Spring Boot offline / running local storage cache"}
          className={`navbar-status-badge ${backendStatus.connected ? 'navbar-status-connected' : 'navbar-status-local'}`}
        >
          <Database size={13} />
          <span className="navbar-status-label">
            {backendStatus.connected ? 'Server: Live' : 'Atlas Ready (Local)'}
          </span>
          <span className={`navbar-status-dot ${backendStatus.connected ? 'navbar-status-dot-connected' : 'navbar-status-dot-local'}`} />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Quick Log</span>
        </button>
      </div>
    </header>
  );
}

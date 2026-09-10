/**
 * Navigation bar with react-router-dom NavLink integration.
 * Uses URL-based navigation instead of manual state callbacks.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Flame, Target, CheckSquare,
  Plus, Database, Sparkles, Moon, Sun, LucideIcon,
} from 'lucide-react';
import type { BackendHealth } from '../types';
import './Navbar.css';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavbarProps {
  backendStatus: BackendHealth;
  theme: string;
  toggleTheme: () => void;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/finances', label: 'Finances', icon: Wallet },
  { path: '/habits', label: 'Habits', icon: Flame },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
];

export default function Navbar({ backendStatus, theme, toggleTheme }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="glass-panel navbar-header">
      {/* Brand */}
      <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `navbar-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Actions & Status */}
      <div className="navbar-actions">
        {/* Backend / Mongo Atlas Indicator */}
        <div
          title={backendStatus.connected
            ? 'Spring Boot & MongoDB Atlas connected'
            : 'Spring Boot offline / running local storage cache'}
          className={`navbar-status-badge ${
            backendStatus.connected ? 'navbar-status-connected' : 'navbar-status-local'
          }`}
        >
          <Database size={13} />
          <span className="navbar-status-label">
            {backendStatus.connected ? 'Server: Live' : 'Atlas Ready (Local)'}
          </span>
          <span className={`navbar-status-dot ${
            backendStatus.connected ? 'navbar-status-dot-connected' : 'navbar-status-dot-local'
          }`} />
        </div>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

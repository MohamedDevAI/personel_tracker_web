import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Database, Bell, LayoutDashboard, Wallet, Target, Flame, StickyNote } from 'lucide-react';
import type { BackendHealth } from '../types';
import './Navbar.css';

interface NavbarProps {
  backendStatus: BackendHealth;
  activeRemindersCount?: number;
}

export default function Navbar({ backendStatus, activeRemindersCount = 0 }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="glass-panel navbar-header">
      {/* Brand */}
      <div
        className="navbar-brand"
        onClick={() => navigate('/life-os/overview')}
        style={{ cursor: 'pointer' }}
      >
        <div className="navbar-brand-icon">
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div>
          <div className="navbar-brand-title-wrap">
            <span className="navbar-brand-title">
              Life <span className="gradient-text">OS</span>
            </span>
            <span className="badge badge-orange navbar-pro-badge">
              LIFE OS APP
            </span>
          </div>
          <div className="navbar-brand-subtitle">
            Executive Goals, Habits & Productivity Engine
          </div>
        </div>
      </div>

      {/* Life OS Sub-Navigation Bar */}
      <div className="app-switcher-container">
        <div className="app-switcher-tabs">
          <NavLink
            to="/life-os/overview"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive ? 'active-life-os' : ''}`
            }
          >
            <LayoutDashboard size={15} />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/life-os/finances"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive ? 'active-life-os' : ''}`
            }
          >
            <Wallet size={15} />
            <span>Finances & Ledger</span>
          </NavLink>

          <NavLink
            to="/life-os/goals"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive ? 'active-life-os' : ''}`
            }
          >
            <Target size={15} />
            <span>Goals</span>
          </NavLink>

          <NavLink
            to="/life-os/habits"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive ? 'active-life-os' : ''}`
            }
          >
            <Flame size={15} />
            <span>Habits</span>
          </NavLink>

          <NavLink
            to="/life-os/notes"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive ? 'active-life-os' : ''}`
            }
          >
            <StickyNote size={15} />
            <span>Notes</span>
          </NavLink>
        </div>
      </div>

      {/* System Status & Controls */}
      <div className="navbar-actions">
        <div
          title={
            backendStatus.connected
              ? 'Spring Boot & MongoDB Atlas connected'
              : 'Connecting to Spring Boot Server API...'
          }
          className={`navbar-status-badge ${
            backendStatus.connected ? 'navbar-status-connected' : 'navbar-status-local'
          }`}
        >
          <Database size={13} />
          <span className="navbar-status-label">
            {backendStatus.connected ? 'Server: Live' : 'Server: Connecting'}
          </span>
          <span
            className={`navbar-status-dot ${
              backendStatus.connected ? 'navbar-status-dot-connected' : 'navbar-status-dot-local'
            }`}
          />
        </div>

        {/* Quick Reminders Hub Button */}
        <button
          type="button"
          onClick={() => navigate('/life-os/notes')}
          className="btn-icon"
          style={{ position: 'relative' }}
          title={`Reminders & Sticky Notes (${activeRemindersCount} active)`}
        >
          <Bell size={18} />
          {activeRemindersCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#cb6b08',
                boxShadow: '0 0 8px #cb6b08',
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
}

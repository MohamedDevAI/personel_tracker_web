import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Coins, Database, Moon, Sun } from 'lucide-react';
import type { BackendHealth } from '../types';
import './Navbar.css';

interface NavbarProps {
  backendStatus: BackendHealth;
  theme: string;
  toggleTheme: () => void;
}

export default function Navbar({ backendStatus, theme, toggleTheme }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMoneyApp = location.pathname.startsWith('/money');

  return (
    <header className={`glass-panel navbar-header ${isMoneyApp ? 'is-money-app' : ''}`}>
      {/* Dynamic App Brand */}
      <div
        className="navbar-brand"
        onClick={() => navigate(isMoneyApp ? '/money' : '/life-os')}
        style={{ cursor: 'pointer' }}
      >
        <div className={`navbar-brand-icon ${isMoneyApp ? 'money-brand-icon' : ''}`}>
          {isMoneyApp ? <Coins size={22} color="#fbbf24" /> : <Sparkles size={22} color="#ffffff" />}
        </div>
        <div>
          <div className="navbar-brand-title-wrap">
            <span className="navbar-brand-title">
              {isMoneyApp ? (
                <>
                  Money <span className="money-gold-gradient">OS</span>
                </>
              ) : (
                <>
                  Life <span className="gradient-text">OS</span>
                </>
              )}
            </span>
            <span className={`badge ${isMoneyApp ? 'badge-amber' : 'badge-indigo'} navbar-pro-badge`}>
              {isMoneyApp ? 'MONEY APP' : 'LIFE OS APP'}
            </span>
          </div>
          <div className="navbar-brand-subtitle">
            {isMoneyApp ? 'Wealth Management & Financial Suite' : 'Executive Tasks, Goals & Habit Engine'}
          </div>
        </div>
      </div>

      {/* Dual Application Switcher Bar */}
      <div className="app-switcher-container">
        <div className="app-switcher-tabs">
          <NavLink
            to="/life-os"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive || location.pathname === '/' || location.pathname.startsWith('/productivity')
                ? 'active-life-os'
                : ''
              }`
            }
          >
            <Sparkles size={15} />
            <span>Life OS</span>
          </NavLink>

          <NavLink
            to="/money"
            className={({ isActive }) =>
              `app-switcher-btn ${isActive || location.pathname.startsWith('/finances') ? 'active-money-os' : ''}`
            }
          >
            <Coins size={15} />
            <span>Money</span>
          </NavLink>
        </div>
      </div>

      {/* System Status & Controls */}
      <div className="navbar-actions">
        <div
          title={
            backendStatus.connected
              ? 'Spring Boot & MongoDB Atlas connected'
              : 'Spring Boot offline / running local storage cache'
          }
          className={`navbar-status-badge ${backendStatus.connected ? 'navbar-status-connected' : 'navbar-status-local'
            }`}
        >
          <Database size={13} />
          <span className="navbar-status-label">
            {backendStatus.connected ? 'Server: Live' : 'Atlas Ready (Local)'}
          </span>
          <span
            className={`navbar-status-dot ${backendStatus.connected ? 'navbar-status-dot-connected' : 'navbar-status-dot-local'
              }`}
          />
        </div>

        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

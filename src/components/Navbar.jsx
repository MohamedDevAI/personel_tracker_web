import React from 'react';
import { LayoutDashboard, Wallet, Flame, Target, CheckSquare, Plus, Database, Sparkles, Moon, Sun } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenQuickAdd, backendStatus, theme, toggleTheme }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finances', label: 'Finances', icon: Wallet },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: '16px',
      zIndex: 50,
      margin: '16px 24px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: 'var(--glow-primary)'
        }}>
          <Sparkles size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              Personal<span className="gradient-text">Tracker</span>
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>PRO</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Life, Finances & Habits Engine</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Actions & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Backend / Mongo Atlas Indicator */}
        <div
          title={backendStatus.connected ? "Spring Boot & MongoDB Atlas connected" : "Spring Boot offline / running local storage cache"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            background: backendStatus.connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: backendStatus.connected ? '#34d399' : '#fbbf24',
            border: `1px solid ${backendStatus.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
          }}
        >
          <Database size={13} />
          <span style={{ fontWeight: 600 }}>
            {backendStatus.connected ? 'Mongo Atlas: Live' : 'Atlas Ready (Local)'}
          </span>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: backendStatus.connected ? '#10b981' : '#f59e0b',
            display: 'inline-block'
          }} />
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

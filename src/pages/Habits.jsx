import React, { useState } from 'react';
import { Flame, Plus, CheckCircle2, Circle, Sparkles, Trophy, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Habits({ habits, onToggleHabit, onAddHabit }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Health',
    targetFrequency: 'Daily'
  });

  const categories = ['Health', 'Productivity', 'Mindset', 'Learning', 'Fitness', 'Finance'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleToggle = (id, isDone) => {
    onToggleHabit(id);
    if (!isDone) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    onAddHabit(formData);
    setFormData({ title: '', category: 'Health', targetFrequency: 'Daily' });
    setShowModal(false);
  };

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Habit & <span className="gradient-text">Routine Engine</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Transform consistency into identity. Build compounding micro-habits.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* Habits Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {habits.map(habit => {
          const completedCount = habit.history.filter(x => x === 1).length;
          const consistency = Math.round((completedCount / habit.history.length) * 100);

          return (
            <div key={habit.id} className="glass-panel" style={{ padding: '22px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span className="badge badge-indigo" style={{ marginBottom: '6px' }}>{habit.category}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{habit.title}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: {habit.targetFrequency}</div>
                </div>

                {/* Streak Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <Flame size={18} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-display)' }}>
                    {habit.streak}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days</span>
                </div>
              </div>

              {/* Weekly History Heatmap */}
              <div style={{ marginTop: '16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Last 7 Days</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{consistency}% Consistency</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {habit.history.map((val, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div style={{
                        height: '32px',
                        borderRadius: '8px',
                        background: val === 1 ? 'var(--emerald-gradient)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: val === 1 ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
                      }}>
                        {val === 1 && <Sparkles size={12} />}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        {dayNames[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Toggle for Today */}
              <button
                onClick={() => handleToggle(habit.id, habit.completedToday)}
                className={`btn ${habit.completedToday ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: habit.completedToday ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-gradient)',
                  borderColor: habit.completedToday ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
                  color: habit.completedToday ? '#34d399' : 'white'
                }}
              >
                {habit.completedToday ? (
                  <>
                    <CheckCircle2 size={16} /> Completed for Today
                  </>
                ) : (
                  <>
                    <Circle size={16} /> Check In Today
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Habit */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Build New Habit</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Read 20 Pages"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Target Frequency</label>
                <select
                  value={formData.targetFrequency}
                  onChange={(e) => setFormData({ ...formData, targetFrequency: e.target.value })}
                >
                  <option value="Daily">Daily (7 days / week)</option>
                  <option value="Weekdays">Weekdays (Mon-Fri)</option>
                  <option value="3x Weekly">3x Weekly</option>
                  <option value="Weekends">Weekends Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

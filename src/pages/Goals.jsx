import React, { useState } from 'react';
import { Target, Plus, Calendar, Flag, Sparkles, CheckCircle, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Goals({ goals, onUpdateProgress, onAddGoal }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Career',
    targetDate: '',
    progress: 0,
    targetValue: 100,
    currentValue: 0,
    unit: '%'
  });

  const categories = ['Career', 'Finance', 'Fitness', 'Learning', 'Personal'];

  const handleIncrement = (id, currentProgress, step) => {
    const nextVal = Math.min(100, Math.max(0, currentProgress + step));
    onUpdateProgress(id, nextVal);
    if (nextVal === 100) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    onAddGoal(formData);
    setFormData({
      title: '',
      category: 'Career',
      targetDate: '',
      progress: 0,
      targetValue: 100,
      currentValue: 0,
      unit: '%'
    });
    setShowModal(false);
  };

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Strategic <span className="cyan-gradient-text">Goals & Milestones</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            High-leverage targets and quarterly achievements tracked systematically.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Milestone
        </button>
      </div>

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {goals.map(goal => {
          const isDone = goal.progress >= 100;

          return (
            <div key={goal.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-indigo">{goal.category}</span>
                  {isDone ? (
                    <span className="badge badge-emerald"><CheckCircle size={12} /> Achieved</span>
                  ) : (
                    <span className="badge badge-amber">{goal.progress}% Completed</span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{goal.title}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  <Calendar size={13} />
                  <span>Target Deadline: {goal.targetDate || 'Continuous'}</span>
                </div>

                {/* Progress Visual */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Overall Progress</span>
                    <span style={{ color: isDone ? '#10b981' : 'var(--accent-primary)' }}>{goal.progress}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${goal.progress}%`,
                      height: '100%',
                      background: isDone ? 'var(--emerald-gradient)' : 'var(--cyan-gradient)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => handleIncrement(goal.id, goal.progress, 10)}
                  disabled={isDone}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  +10%
                </button>
                <button
                  onClick={() => handleIncrement(goal.id, goal.progress, 25)}
                  disabled={isDone}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  +25%
                </button>
                <button
                  onClick={() => handleIncrement(goal.id, 0, 100)}
                  disabled={isDone}
                  className="btn btn-primary"
                  style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  <Sparkles size={14} /> Finish
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Goal */}
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
            <h3 style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Define New Milestone</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. Build SaaS MVP"
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Target Deadline</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Starting Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

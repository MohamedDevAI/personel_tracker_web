import React, { useState } from 'react';
import { Plus, Calendar, Sparkles, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal } from '../types';

interface GoalsProps {
  goals: Goal[];
  onUpdateProgress: (id: string, val: number) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
}

export default function Goals({ goals, onUpdateProgress, onAddGoal }: GoalsProps) {
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

  const handleIncrement = (id: string, currentProgress: number, step: number) => {
    const nextVal = Math.min(100, Math.max(0, currentProgress + step));
    onUpdateProgress(id, nextVal);
    if (nextVal === 100) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Strategic <span className="cyan-gradient-text">Goals & Milestones</span></h1>
          <p className="page-header-subtitle">
            High-leverage targets and quarterly achievements tracked systematically.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Milestone
        </button>
      </div>

      {/* Goals Grid */}
      <div className="goals-page-grid">
        {goals.map(goal => {
          const isDone = goal.progress >= 100;

          return (
            <div key={goal.id} className="glass-panel goal-card-item">
              <div>
                <div className="goal-card-top">
                  <span className="badge badge-indigo">{goal.category}</span>
                  {isDone ? (
                    <span className="badge badge-emerald"><CheckCircle size={12} /> Achieved</span>
                  ) : (
                    <span className="badge badge-amber">{goal.progress}% Completed</span>
                  )}
                </div>

                <h3 className="goal-card-title">{goal.title}</h3>

                <div className="goal-deadline-row">
                  <Calendar size={13} />
                  <span>Target Deadline: {goal.targetDate || 'Continuous'}</span>
                </div>

                {/* Progress Visual */}
                <div className="goal-progress-section">
                  <div className="goal-progress-header">
                    <span>Overall Progress</span>
                    <span className={`goal-progress-pct ${isDone ? 'done' : ''}`}>{goal.progress}%</span>
                  </div>
                  <div className="goal-progress-track">
                    <div 
                      className={`goal-progress-fill ${isDone ? 'done' : ''}`}
                      style={{ width: `${goal.progress}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="goal-action-buttons">
                <button
                  onClick={() => handleIncrement(goal.id, goal.progress, 10)}
                  disabled={isDone}
                  className="btn btn-secondary goal-step-btn"
                >
                  +10%
                </button>
                <button
                  onClick={() => handleIncrement(goal.id, goal.progress, 25)}
                  disabled={isDone}
                  className="btn btn-secondary goal-step-btn"
                >
                  +25%
                </button>
                <button
                  onClick={() => handleIncrement(goal.id, 0, 100)}
                  disabled={isDone}
                  className="btn btn-primary goal-step-btn goal-finish-btn"
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
        <div className="modal-overlay-backdrop">
          <div className="glass-panel modal-content-card modal-content-card-sm">
            <h3 className="modal-title-main">Define New Milestone</h3>
            <form onSubmit={handleSubmit} className="modal-form-vertical">
              <div>
                <label className="modal-field-label">Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. Build SaaS MVP"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="modal-input-field"
                />
              </div>

              <div>
                <label className="modal-field-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="modal-select-field"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="modal-field-label">Target Deadline</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="modal-input-field"
                />
              </div>

              <div>
                <label className="modal-field-label">Starting Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="modal-input-field"
                />
              </div>

              <div className="modal-footer-actions">
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

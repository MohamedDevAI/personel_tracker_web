/**
 * Habits page — self-contained with react-query data fetching and mutations.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Plus, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { HABIT_CATEGORIES, DAY_NAMES } from '../utils/constants';
import type { Habit } from '../types';

export default function Habits() {
  const queryClient = useQueryClient();

  // ── Data ────────────────────────────────────────────────────────────────

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: api.getHabits,
  });

  const toggleMutation = useMutation({
    mutationFn: api.toggleHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const createMutation = useMutation({
    mutationFn: api.createHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  // ── Modal State ─────────────────────────────────────────────────────────

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Health',
    targetFrequency: 'Daily',
  });

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleToggle = (id: string, isDone: boolean) => {
    toggleMutation.mutate(id);
    if (!isDone) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    createMutation.mutate(formData);
    setFormData({ title: '', category: 'Health', targetFrequency: 'Daily' });
    setShowModal(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Habit & <span className="gradient-text">Routine Engine</span></h1>
          <p className="page-header-subtitle">
            Transform consistency into identity. Build compounding micro-habits.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* Habits Grid */}
      <div className="habits-page-grid">
        {habits.map((habit) => {
          const completedCount = habit.history.filter((x) => x === 1).length;
          const consistency = Math.round((completedCount / (habit.history.length || 1)) * 100);

          return (
            <div key={habit.id} className="glass-panel habit-full-card">
              <div className="habit-full-card-top">
                <div>
                  <span className="badge badge-indigo habit-category-badge">{habit.category}</span>
                  <h3 className="habit-full-title">{habit.title}</h3>
                  <div className="habit-target-freq">Target: {habit.targetFrequency}</div>
                </div>

                <div className="habit-streak-pill">
                  <Flame size={18} color="#f59e0b" fill="#f59e0b" />
                  <span className="habit-streak-pill-val">{habit.streak}</span>
                  <span className="habit-streak-unit">days</span>
                </div>
              </div>

              {/* Weekly History Heatmap */}
              <div className="habit-heatmap-container">
                <div className="habit-heatmap-header">
                  <span>Last 7 Days</span>
                  <span className="habit-consistency-val">{consistency}% Consistency</span>
                </div>
                <div className="habit-heatmap-grid">
                  {habit.history.map((val, idx) => (
                    <div key={idx} className="habit-heatmap-cell">
                      <div className={`habit-heatmap-box ${val === 1 ? 'completed' : 'missed'}`}>
                        {val === 1 && <Sparkles size={12} />}
                      </div>
                      <span className="habit-heatmap-dayname">{DAY_NAMES[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Toggle */}
              <button
                onClick={() => handleToggle(habit.id, habit.completedToday)}
                className={`btn habit-toggle-btn ${habit.completedToday ? 'btn-secondary done' : 'btn-primary'}`}
              >
                {habit.completedToday ? (
                  <><CheckCircle2 size={16} /> Completed for Today</>
                ) : (
                  <><Circle size={16} /> Check In Today</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Habit */}
      {showModal && (
        <div className="modal-overlay-backdrop">
          <div className="glass-panel modal-content-card modal-content-card-sm">
            <h3 className="modal-title-main">Build New Habit</h3>
            <form onSubmit={handleSubmit} className="modal-form-vertical">
              <div>
                <label className="modal-field-label">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Read 20 Pages"
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
                  {HABIT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="modal-field-label">Target Frequency</label>
                <select
                  value={formData.targetFrequency}
                  onChange={(e) => setFormData({ ...formData, targetFrequency: e.target.value })}
                  className="modal-select-field"
                >
                  <option value="Daily">Daily (7 days / week)</option>
                  <option value="Weekdays">Weekdays (Mon-Fri)</option>
                  <option value="3x Weekly">3x Weekly</option>
                  <option value="Weekends">Weekends Only</option>
                </select>
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

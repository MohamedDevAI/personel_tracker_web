import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import { HABIT_CATEGORIES } from '../../../utils/constants';
import './habits.css';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

export default function HabitModal({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}: HabitModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Productivity');
  const [targetFrequency, setTargetFrequency] = useState('Daily');

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setCategory(editingHabit.category || 'Productivity');
      setTargetFrequency(editingHabit.targetFrequency || 'Daily');
    } else {
      setTitle('');
      setCategory('Productivity');
      setTargetFrequency('Daily');
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...(editingHabit ? { id: editingHabit.id } : {}),
      title: title.trim(),
      category,
      targetFrequency,
    });

    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel habit-modal-card" style={{ maxWidth: 480 }}>
        {/* Modal Header */}
        <div className="habit-modal-header">
          <div className="habit-modal-title-group">
            <h2 className="habit-modal-title">
              {editingHabit ? 'Edit Habit' : 'New Habit'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="habit-modal-close-btn"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="habit-modal-form">
          {/* 1. Habit Name */}
          <div className="habit-form-group">
            <label className="habit-form-label">
              Habit Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Coding, Gym Workout, Read Books"
              className="habit-form-input"
              autoFocus
            />
          </div>

          {/* 2. Category & Frequency */}
          <div className="habit-form-row">
            <div className="habit-form-group flex-1">
              <label className="habit-form-label">Category</label>
              <div className="habit-select-wrapper">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="habit-form-select"
                >
                  {HABIT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="habit-form-group flex-1">
              <label className="habit-form-label">Frequency</label>
              <div className="habit-select-wrapper">
                <select
                  value={targetFrequency}
                  onChange={(e) => setTargetFrequency(e.target.value)}
                  className="habit-form-select"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekdays">Weekdays (Mon-Fri)</option>
                  <option value="3x per week">3x per week</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="habit-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary habit-modal-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary habit-modal-btn submit"
            >
              <Plus size={16} />
              <span>{editingHabit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

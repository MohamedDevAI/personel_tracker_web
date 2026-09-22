import React, { useState } from 'react';
import { CheckSquare, X } from 'lucide-react';
import { TASK_CATEGORIES } from '../../../utils/constants';
import type { TaskPriority } from '../../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; category: string; priority: TaskPriority; dueDate: string }) => void;
}

export default function TaskModal({ isOpen, onClose, onSubmit }: TaskModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    category: 'Development',
    priority: 'HIGH' as TaskPriority,
    dueDate: todayStr,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      title: formData.title.trim(),
      category: formData.category,
      priority: formData.priority,
      dueDate: formData.dueDate,
    });

    setFormData({
      title: '',
      category: 'Development',
      priority: 'HIGH',
      dueDate: todayStr,
    });
    onClose();
  };



  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card modal-content-card-sm">
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div
              className="modal-icon-badge planned"
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}
            >
              <CheckSquare size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">Create Actionable Task</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          {/* Title */}
          <div className="form-group-custom">
            <label className="modal-field-label">Task Title / Deliverable</label>
            <input
              type="text"
              placeholder="e.g. Implement Spring Security Filter..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="modal-input-field"
              autoFocus
            />
          </div>

          {/* Priority & Category */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="modal-field-label">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TaskPriority })
                }
                className="modal-select-field"
              >
                <option value="HIGH">🔥 High Priority</option>
                <option value="MEDIUM">⚡ Medium Priority</option>
                <option value="LOW">🔹 Low Priority</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label className="modal-field-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="modal-select-field"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group-custom">
            <label className="modal-field-label">Target Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="modal-input-field"
            />
          </div>

          <div className="modal-footer-actions" style={{ marginTop: 24 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Action Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

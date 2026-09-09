import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { TaskItem, TaskPriority } from '../types';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

interface TasksProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
  onDeleteTask: (id: string) => void;
}

type TaskFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'HIGH';

export default function Tasks({ tasks, onToggleTask, onAddTask, onDeleteTask }: TasksProps) {
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteTaskTitle, setDeleteTaskTitle] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Development',
    priority: 'HIGH' as TaskPriority,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const categories = ['Development', 'DevOps', 'Finance', 'Health', 'Personal', 'General'];

  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    if (filter === 'HIGH') return t.priority === 'HIGH';
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onAddTask(formData);
    setFormData({
      title: '',
      category: 'Development',
      priority: 'HIGH',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setShowModal(false);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    if (p === 'HIGH') return <span className="badge badge-rose">HIGH</span>;
    if (p === 'MEDIUM') return <span className="badge badge-amber">MED</span>;
    return <span className="badge badge-indigo">LOW</span>;
  };

  const filterOptions: { id: TaskFilter; label: string }[] = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'HIGH', label: 'High Priority' }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Daily <span className="gradient-text">Execution & Tasks</span></h1>
          <p className="page-header-subtitle">
            Capture, prioritize, and execute mission-critical action items.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="tasks-filter-bar">
        {filterOptions.map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`btn btn-secondary tasks-filter-btn ${filter === item.id ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="glass-panel tasks-list-panel">
        <div className="tasks-page-list">
          {filteredTasks.length === 0 ? (
            <div className="tasks-empty-state">
              No tasks match this filter. Everything is up to date!
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`task-row-card ${task.completed ? 'completed' : 'pending'}`}
              >
                <div
                  onClick={() => onToggleTask(task.id)}
                  className="task-row-left"
                >
                  {task.completed ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : (
                    <Circle size={20} color="var(--text-muted)" />
                  )}
                  <div>
                    <div className={`task-row-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </div>
                    <div className="task-row-meta">
                      <span>{task.category}</span>
                      {task.dueDate && (
                        <span className="task-due-date">
                          <Calendar size={11} /> Due: {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-row-right">
                  {getPriorityBadge(task.priority)}
                  <button
                    onClick={() => {
                      setDeleteTaskId(task.id);
                      setDeleteTaskTitle(task.title);
                    }}
                    className="btn-icon task-delete-btn"
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Add Task */}
      {showModal && (
        <div className="modal-overlay-backdrop">
          <div className="glass-panel modal-content-card modal-content-card-sm">
            <h3 className="modal-title-main">Create New Task</h3>
            <form onSubmit={handleSubmit} className="modal-form-vertical">
              <div>
                <label className="modal-field-label">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Spring Security filter"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="modal-input-field"
                />
              </div>

              <div className="modal-grid-equal">
                <div>
                  <label className="modal-field-label">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="modal-select-field"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
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
              </div>

              <div>
                <label className="modal-field-label">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="modal-input-field"
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Task Deletion Modal (Yes / No Prompt) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTaskId)}
        title="Delete Task"
        message="Are you sure you want to delete this task? Please choose Yes to delete or No to cancel."
        itemName={deleteTaskTitle}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        onConfirm={() => {
          if (deleteTaskId) {
            onDeleteTask(deleteTaskId);
            setDeleteTaskId(null);
          }
        }}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>

  );
}

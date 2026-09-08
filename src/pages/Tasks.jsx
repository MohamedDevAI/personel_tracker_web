import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, AlertCircle, Calendar } from 'lucide-react';

export default function Tasks({ tasks, onToggleTask, onAddTask, onDeleteTask }) {
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Development',
    priority: 'HIGH',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const categories = ['Development', 'DevOps', 'Finance', 'Health', 'Personal', 'General'];

  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    if (filter === 'HIGH') return t.priority === 'HIGH';
    return true;
  });

  const handleSubmit = (e) => {
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

  const getPriorityBadge = (p) => {
    if (p === 'HIGH') return <span className="badge badge-rose">HIGH</span>;
    if (p === 'MEDIUM') return <span className="badge badge-amber">MED</span>;
    return <span className="badge badge-indigo">LOW</span>;
  };

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Daily <span className="gradient-text">Execution & Tasks</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Capture, prioritize, and execute mission-critical action items.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'ALL', label: 'All Tasks' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'HIGH', label: 'High Priority' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className="btn btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '6px 14px',
              background: filter === item.id ? 'var(--bg-surface)' : 'transparent',
              borderColor: filter === item.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: filter === item.id ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="glass-panel" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tasks match this filter. Everything is up to date!
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: task.completed ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'background 0.2s ease'
                }}
              >
                <div
                  onClick={() => onToggleTask(task.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 }}
                >
                  {task.completed ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : (
                    <Circle size={20} color="var(--text-muted)" />
                  )}
                  <div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>
                      {task.title}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>{task.category}</span>
                      {task.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} /> Due: {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {getPriorityBadge(task.priority)}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="btn-icon"
                    style={{ width: '30px', height: '30px', color: '#f43f5e' }}
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
            <h3 style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Create New Task</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Spring Security filter"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
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
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
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
    </div>
  );
}

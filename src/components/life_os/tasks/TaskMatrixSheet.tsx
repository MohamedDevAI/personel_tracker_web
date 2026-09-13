import React from 'react';
import { CheckCircle2, Circle, Calendar, Trash2, Zap } from 'lucide-react';
import type { TaskItem, TaskPriority } from '../../../types';

interface TaskMatrixSheetProps {
  tasks: TaskItem[];
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TaskMatrixSheet({
  tasks,
  onToggle,
  onDelete,
}: TaskMatrixSheetProps) {
  const getPriorityClass = (priority: TaskPriority) => {
    if (priority === 'HIGH') return 'task-priority-high';
    if (priority === 'MEDIUM') return 'task-priority-medium';
    return 'task-priority-low';
  };

  return (
    <div className="glass-panel task-matrix-card">
      <div className="task-matrix-table-wrap">
        <table className="task-matrix-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Status</th>
              <th style={{ width: '42%' }}>Task Title / Deliverable</th>
              <th style={{ width: '15%' }}>Priority</th>
              <th style={{ width: '15%' }}>Category</th>
              <th style={{ width: '12%' }}>Due Date</th>
              <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className={task.completed ? 'row-completed' : ''}>
                {/* Status Toggle */}
                <td>
                  <button
                    onClick={() => onToggle(task.id, task.completed)}
                    className="task-check-toggle-btn"
                    title={task.completed ? 'Mark pending' : 'Mark complete'}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={19} color="#10b981" />
                    ) : (
                      <Circle size={19} color="var(--text-muted)" />
                    )}
                  </button>
                </td>

                {/* Title */}
                <td>
                  <span
                    className={`task-item-title ${task.completed ? 'completed' : ''}`}
                    style={{ fontWeight: 600 }}
                  >
                    {task.title}
                  </span>
                </td>

                {/* Priority */}
                <td>
                  <span className={`task-priority-badge ${getPriorityClass(task.priority)}`}>
                    {task.priority === 'HIGH' && <Zap size={10} style={{ display: 'inline', marginRight: 3 }} />}
                    {task.priority}
                  </span>
                </td>

                {/* Category */}
                <td>
                  <span className="task-cat-tag">{task.category}</span>
                </td>

                {/* Due Date */}
                <td>
                  {task.dueDate ? (
                    <span className="task-date-tag">
                      <Calendar size={12} /> {task.dueDate}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No Date</span>
                  )}
                </td>

                {/* Action */}
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="task-delete-btn"
                    title="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

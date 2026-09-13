import React from 'react';
import { CheckCircle2, Circle, Calendar, Trash2, Zap } from 'lucide-react';
import type { TaskItem, TaskPriority } from '../../../types';

interface TaskCardProps {
  task: TaskItem;
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const getPriorityClass = (priority: TaskPriority) => {
    if (priority === 'HIGH') return 'task-priority-high';
    if (priority === 'MEDIUM') return 'task-priority-medium';
    return 'task-priority-low';
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isDueSoon = task.dueDate && !task.completed && task.dueDate <= todayStr;

  return (
    <div className={`task-item-card ${task.completed ? 'completed' : ''}`}>
      <div className="task-item-top">
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className="task-check-toggle-btn"
          title={task.completed ? 'Mark pending' : 'Mark complete'}
        >
          {task.completed ? (
            <CheckCircle2 size={20} color="#10b981" />
          ) : (
            <Circle size={20} color="var(--text-muted)" />
          )}
        </button>

        <div className="task-item-content">
          <h4 className={`task-item-title ${task.completed ? 'completed' : ''}`}>
            {task.title}
          </h4>
        </div>
      </div>

      <div className="task-item-bottom">
        <div className="task-meta-left">
          <span className={`task-priority-badge ${getPriorityClass(task.priority)}`}>
            {task.priority === 'HIGH' && <Zap size={10} style={{ display: 'inline', marginRight: 3 }} />}
            {task.priority}
          </span>

          <span className="task-cat-tag">{task.category}</span>

          {task.dueDate && (
            <span className={`task-date-tag ${isDueSoon ? 'due-soon' : ''}`}>
              <Calendar size={12} /> {task.dueDate}
            </span>
          )}
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="task-delete-btn"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

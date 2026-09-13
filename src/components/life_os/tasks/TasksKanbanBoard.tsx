import React from 'react';
import { CheckCircle2, Zap, Clock } from 'lucide-react';
import TaskCard from './TaskCard';
import type { TaskItem } from '../../../types';

interface TasksKanbanBoardProps {
  tasks: TaskItem[];
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TasksKanbanBoard({
  tasks,
  onToggle,
  onDelete,
}: TasksKanbanBoardProps) {
  const highPriorityPending = tasks.filter((t) => !t.completed && t.priority === 'HIGH');
  const otherPending = tasks.filter((t) => !t.completed && t.priority !== 'HIGH');
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="tasks-kanban-board">
      {/* Column 1: High Priority Focus */}
      <div className="tasks-kanban-column" style={{ borderColor: 'rgba(244, 63, 94, 0.3)' }}>
        <div className="tasks-kanban-column-header">
          <div className="tasks-column-title" style={{ color: '#f43f5e' }}>
            <Zap size={18} /> High Priority Focus
          </div>
          <span
            className="tasks-column-count"
            style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}
          >
            {highPriorityPending.length}
          </span>
        </div>

        <div className="tasks-kanban-cards-list">
          {highPriorityPending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No critical high-priority action items pending.
            </div>
          ) : (
            highPriorityPending.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
            ))
          )}
        </div>
      </div>

      {/* Column 2: Standard Pending Pool */}
      <div className="tasks-kanban-column">
        <div className="tasks-kanban-column-header">
          <div className="tasks-column-title">
            <Clock size={18} color="#6366f1" /> Action Items / To Do
          </div>
          <span className="tasks-column-count">{otherPending.length}</span>
        </div>

        <div className="tasks-kanban-cards-list">
          {otherPending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No standard tasks pending.
            </div>
          ) : (
            otherPending.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
            ))
          )}
        </div>
      </div>

      {/* Column 3: Completed */}
      <div className="tasks-kanban-column" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
        <div className="tasks-kanban-column-header">
          <div className="tasks-column-title" style={{ color: '#34d399' }}>
            <CheckCircle2 size={18} /> Completed Deliverables
          </div>
          <span
            className="tasks-column-count"
            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
          >
            {completedTasks.length}
          </span>
        </div>

        <div className="tasks-kanban-cards-list">
          {completedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No completed tasks yet today.
            </div>
          ) : (
            completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { CheckSquare, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import type { TaskItem } from '../../../types';

interface TasksKpiCardsProps {
  tasks: TaskItem[];
}

export default function TasksKpiCards({ tasks }: TasksKpiCardsProps) {
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const executionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const highPriorityPending = tasks.filter((t) => !t.completed && t.priority === 'HIGH').length;

  // Due today or soon (<= 3 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const dueSoonCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    return t.dueDate <= todayStr;
  }).length;

  return (
    <div className="tasks-kpi-grid">
      {/* Card 1: Daily Execution Rate */}
      <div className="glass-panel tasks-kpi-card">
        <div className="tasks-kpi-top">
          <span className="tasks-kpi-label">Daily Execution Rate</span>
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} /> {completedCount}/{totalTasks} Done
          </span>
        </div>
        <div className="tasks-kpi-value-row">
          <span className="tasks-kpi-value">{executionRate}%</span>
          <span className="tasks-kpi-unit">Completed</span>
        </div>
        <div>
          <div className="tasks-progress-track">
            <div className="tasks-progress-bar" style={{ width: `${executionRate}%` }} />
          </div>
          <div className="tasks-kpi-subtext" style={{ marginTop: 6 }}>
            {totalTasks - completedCount} action items remaining for today
          </div>
        </div>
      </div>

      {/* Card 2: High Priority Urgent */}
      <div className="glass-panel tasks-kpi-card">
        <div className="tasks-kpi-top">
          <span className="tasks-kpi-label">High Priority Focus</span>
          <span className="badge badge-rose">
            <Zap size={12} /> Urgent
          </span>
        </div>
        <div className="tasks-kpi-value-row">
          <span className="tasks-kpi-value">{highPriorityPending}</span>
          <span className="tasks-kpi-unit">Critical Tasks</span>
        </div>
        <div className="tasks-kpi-subtext">
          Deliverables requiring immediate attention
        </div>
      </div>

      {/* Card 3: Total Action Items */}
      <div className="glass-panel tasks-kpi-card">
        <div className="tasks-kpi-top">
          <span className="tasks-kpi-label">Total Task Pool</span>
          <span className="badge badge-indigo">Active</span>
        </div>
        <div className="tasks-kpi-value-row">
          <span className="tasks-kpi-value">{totalTasks}</span>
          <span className="tasks-kpi-unit">Tasks</span>
        </div>
        <div className="tasks-kpi-subtext">
          Across all active categories & projects
        </div>
      </div>

      {/* Card 4: Overdue & Due Today */}
      <div className="glass-panel tasks-kpi-card">
        <div className="tasks-kpi-top">
          <span className="tasks-kpi-label">Due Today / Overdue</span>
          <span className="badge badge-amber">
            <Clock size={12} /> Time Sensitivity
          </span>
        </div>
        <div className="tasks-kpi-value-row">
          <span className="tasks-kpi-value">{dueSoonCount}</span>
          <span className="tasks-kpi-unit">Items Due</span>
        </div>
        <div className="tasks-kpi-subtext">
          Pending tasks scheduled for completion today
        </div>
      </div>
    </div>
  );
}

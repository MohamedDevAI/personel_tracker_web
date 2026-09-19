import { Trophy, Clock, TrendingUp } from 'lucide-react';
import type { Goal } from '../../../types';

interface GoalsKpiCardsProps {
  goals: Goal[];
}

export default function GoalsKpiCards({ goals }: GoalsKpiCardsProps) {
  const totalGoals = goals.length;

  const achievedGoals = goals.filter((g) => (g.progress || 0) >= 100);
  const activeGoals = goals.filter((g) => (g.progress || 0) < 100);

  const avgProgress = totalGoals > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals)
    : 0;

  // Upcoming within 30 days
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingCount = activeGoals.filter((g) => {
    if (!g.targetDate) return false;
    const target = new Date(g.targetDate);
    return target >= now && target <= thirtyDaysLater;
  }).length;

  return (
    <div className="goals-kpi-grid">
      {/* Card 1: Average Progress Index */}
      <div className="glass-panel goals-kpi-card">
        <div className="goals-kpi-top">
          <span className="goals-kpi-label">Strategic Progress Index</span>
          <span className="badge badge-indigo">
            <TrendingUp size={12} /> {achievedGoals.length}/{totalGoals} Achieved
          </span>
        </div>
        <div className="goals-kpi-value-row">
          <span className="goals-kpi-value">{avgProgress}%</span>
          <span className="goals-kpi-unit">Achieved</span>
        </div>
        <div>
          <div className="goals-progress-track">
            <div
              className="goals-progress-bar"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
          <div className="goals-kpi-subtext" style={{ marginTop: 6 }}>
            Overall progress across all active & completed milestones
          </div>
        </div>
      </div>

      {/* Card 2: Achieved Milestones */}
      <div className="glass-panel goals-kpi-card">
        <div className="goals-kpi-top">
          <span className="goals-kpi-label">Achieved Targets</span>
          <span className="badge badge-emerald">
            <Trophy size={12} /> Complete
          </span>
        </div>
        <div className="goals-kpi-value-row">
          <span className="goals-kpi-value">{achievedGoals.length}</span>
          <span className="goals-kpi-unit">Milestones</span>
        </div>
        <div className="goals-kpi-subtext">
          Successfully delivered strategic objectives
        </div>
      </div>

      {/* Card 3: Active Pursuits */}
      <div className="glass-panel goals-kpi-card">
        <div className="goals-kpi-top">
          <span className="goals-kpi-label">Active Pursuits</span>
          <span className="badge badge-cyan">In Progress</span>
        </div>
        <div className="goals-kpi-value-row">
          <span className="goals-kpi-value">{activeGoals.length}</span>
          <span className="goals-kpi-unit">Goals</span>
        </div>
        <div className="goals-kpi-subtext">
          Currently being tracked & executed
        </div>
      </div>

      {/* Card 4: Upcoming Deadlines */}
      <div className="glass-panel goals-kpi-card">
        <div className="goals-kpi-top">
          <span className="goals-kpi-label">Due Next 30 Days</span>
          <span className="badge badge-amber">
            <Clock size={12} /> Horizon
          </span>
        </div>
        <div className="goals-kpi-value-row">
          <span className="goals-kpi-value">{upcomingCount}</span>
          <span className="goals-kpi-unit">Deadlines</span>
        </div>
        <div className="goals-kpi-subtext">
          Milestones approaching completion target
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import type { FinancialHealthResult } from '../../services/financialHealthService';

interface FinancialHealthCardProps {
  healthResult: FinancialHealthResult;
  onOpenDiagnostic: () => void;
}

export default function FinancialHealthCard({
  healthResult,
  onOpenDiagnostic
}: FinancialHealthCardProps) {
  const { totalScore, maxScore, tier, tierDescription, achievedCount, gapsCount, nextBestAction } = healthResult;

  const getTierClass = () => {
    if (totalScore >= 85) return 'elite';
    if (totalScore >= 70) return 'strong';
    if (totalScore >= 50) return 'stable';
    return 'risk';
  };

  const getRingColor = () => {
    if (totalScore >= 85) return '#10b981';
    if (totalScore >= 70) return '#34d399';
    if (totalScore >= 50) return '#fbbf24';
    return '#f43f5e';
  };

  return (
    <div className="health-card-root">
      {/* Header */}
      <div className="health-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color={getRingColor()} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Financial Health Score
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Diagnostic audit across 6 safety, debt, and wealth pillars
          </p>
        </div>

        <button
          onClick={onOpenDiagnostic}
          className="btn-glass"
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Open complete diagnostic assessment"
        >
          <HelpCircle size={13} />
          <span>Audit Questions</span>
        </button>
      </div>

      {/* Center Score Row */}
      <div className="health-score-center">
        <div
          className="score-radial-wrap"
          style={{
            borderColor: getRingColor(),
            boxShadow: `0 0 25px ${getRingColor()}33`
          }}
        >
          <span className="score-number" style={{ color: getRingColor() }}>
            {totalScore}
          </span>
          <span className="score-total-denom">/ {maxScore}</span>
        </div>

        <div style={{ flex: 1 }}>
          <div className={`health-tier-badge ${getTierClass()}`}>
            <Award size={13} />
            <span>{tier}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {tierDescription}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '0.78rem' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>
              ✓ {achievedCount} Pillars Secured
            </span>
            {gapsCount > 0 && (
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                ⚠️ {gapsCount} Open Gap{gapsCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Next Best Action / Gap Banner */}
      <div className="health-gap-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: gapsCount > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: gapsCount > 0 ? '#fbbf24' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {gapsCount > 0 ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {gapsCount > 0 ? 'Priority Gap to Fill' : 'Status'}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: '#fff',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {nextBestAction}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenDiagnostic}
          className="btn-primary"
          style={{
            fontSize: '0.75rem',
            padding: '6px 12px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: gapsCount > 0 ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : undefined,
            color: gapsCount > 0 ? '#000' : undefined,
            fontWeight: 700,
            border: 'none'
          }}
        >
          <span>{gapsCount > 0 ? 'Fill Gaps' : 'Review'}</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Flame,
  Calendar,
  Sparkles,
  Sliders,
  TrendingUp,
  Target,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { FireCalculationResult, FireSettings } from '../../services/financialHealthService';
import { formatINR, formatINRCompact, formatPercent } from '../../utils/formatters';
import { useMoneyPrivacy } from '../../context/MoneyPrivacyContext';

interface FireCalculatorCardProps {
  fireResult: FireCalculationResult;
  onUpdateSettings: (newSettings: Partial<FireSettings>) => void;
}

export default function FireCalculatorCard({
  fireResult,
  onUpdateSettings
}: FireCalculatorCardProps) {
  const { mask } = useMoneyPrivacy();
  const [showSettings, setShowSettings] = useState(false);
  const [tempExpense, setTempExpense] = useState(String(fireResult.monthlyExpenses));
  const [multiplier, setMultiplier] = useState(25);

  const {
    leanFireTarget,
    standardFireTarget,
    fatFireTarget,
    currentNetWorth,
    progressPct,
    shortfall,
    yearsToFire,
    targetYear,
    monthlyInvestment
  } = fireResult;

  const currentTarget =
    multiplier === 20 ? leanFireTarget : multiplier === 33 ? fatFireTarget : standardFireTarget;

  const currentProgress =
    currentTarget > 0
      ? Math.min(100, Math.round((currentNetWorth / currentTarget) * 1000) / 10)
      : 0;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempExpense) || 60000;
    onUpdateSettings({ monthlyExpenses: parsed, multiplier });
    setShowSettings(false);
  };

  return (
    <div className="fire-card-root">
      {/* Header */}
      <div className="fire-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={19} color="#fbbf24" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              FIRE Number & Freedom Calculator
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Financial Independence target & compounding runway in Indian Rupee (INR ₹)
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn-glass"
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Customize monthly expenses and assumptions"
        >
          <Sliders size={13} />
          <span>{showSettings ? 'Close' : 'Adjust Expense'}</span>
        </button>
      </div>

      {/* Settings Drawer if open */}
      {showSettings ? (
        <form
          onSubmit={handleSaveSettings}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 14,
            borderRadius: 12,
            marginBottom: 16,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Estimated Monthly Expense (₹)
              </label>
              <input
                type="number"
                step="1000"
                value={tempExpense}
                onChange={(e) => setTempExpense(e.target.value)}
                className="modal-text-input"
                style={{ marginTop: 4, padding: '6px 10px', width: '100%' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>
              Apply
            </button>
          </div>
        </form>
      ) : null}

      {/* Main Target Display */}
      <div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
          Target Freedom Corpus ({multiplier}x Annual Expense)
        </div>
        <div className="fire-big-number">
          <span>{mask(formatINR(currentTarget))}</span>
          <span style={{ fontSize: '1.15rem', color: '#fbbf24', fontWeight: 700 }}>
            ({mask(formatINRCompact(currentTarget))})
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fire-progress-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Current Net Worth: <strong style={{ color: '#fff' }}>{mask(formatINRCompact(currentNetWorth))}</strong>
          </span>
          <span style={{ color: '#34d399', fontWeight: 800 }}>
            {formatPercent(currentProgress, 1)} Reached
          </span>
        </div>

        <div className="fire-progress-track">
          <div
            className="fire-progress-fill"
            style={{ width: `${Math.min(100, Math.max(2, currentProgress))}%` }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          <span>Shortfall: {mask(formatINR(Math.max(0, currentTarget - currentNetWorth)))}</span>
          <span>
            {yearsToFire > 0
              ? `Est. Freedom: ~${yearsToFire} Years (Year ${targetYear})`
              : '🎉 Financially Independent!'}
          </span>
        </div>
      </div>

      {/* Milestones Row */}
      <div className="fire-milestones-row">
        <div
          className={`fire-milestone-box ${multiplier === 20 ? 'active' : ''}`}
          onClick={() => {
            setMultiplier(20);
            onUpdateSettings({ multiplier: 20 });
          }}
        >
          <div className="fire-milestone-label">Lean FIRE (20x)</div>
          <div className="fire-milestone-val">{mask(formatINRCompact(leanFireTarget))}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Essential only</div>
        </div>

        <div
          className={`fire-milestone-box ${multiplier === 25 ? 'active' : ''}`}
          onClick={() => {
            setMultiplier(25);
            onUpdateSettings({ multiplier: 25 });
          }}
        >
          <div className="fire-milestone-label">Standard (25x)</div>
          <div className="fire-milestone-val" style={{ color: '#34d399' }}>
            {mask(formatINRCompact(standardFireTarget))}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#34d399' }}>4% Rule Standard</div>
        </div>

        <div
          className={`fire-milestone-box ${multiplier === 33 ? 'active' : ''}`}
          onClick={() => {
            setMultiplier(33);
            onUpdateSettings({ multiplier: 33 });
          }}
        >
          <div className="fire-milestone-label">Fat FIRE (33x)</div>
          <div className="fire-milestone-val">{mask(formatINRCompact(fatFireTarget))}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Luxury & Travel</div>
        </div>
      </div>
    </div>
  );
}

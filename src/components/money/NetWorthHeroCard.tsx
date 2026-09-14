import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RotateCw,
  Wallet,
  Coins,
  CreditCard,
  Layers,
  CalendarCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatINR, formatINRCompact, formatPctChange } from '../../utils/formatters';

interface NetWorthHeroCardProps {
  netWorth: number;
  portfolioValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPct: number;
  todayChange: number;
  todayChangePct: number;
  cashLiquidity: number;
  debtLiabilities: number;
  activeSipMonthly: number;
  includeCashAndDebt: boolean;
  onToggleNetWorthMode: () => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function NetWorthHeroCard({
  netWorth,
  portfolioValue,
  totalInvested,
  totalReturn,
  totalReturnPct,
  todayChange,
  todayChangePct,
  cashLiquidity,
  debtLiabilities,
  activeSipMonthly,
  includeCashAndDebt,
  onToggleNetWorthMode,
  onOpenAddModal,
  onRefresh,
  isRefreshing = false
}: NetWorthHeroCardProps) {
  const isGain = totalReturn >= 0;
  const displayedNetWorth = includeCashAndDebt ? netWorth : portfolioValue;

  return (
    <div className="networth-hero-card">
      {/* Top Banner Row */}
      <div className="networth-top-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="networth-badge-pill">
              <Coins size={13} />
              {includeCashAndDebt ? 'Total Comprehensive Net Worth' : 'Investment Portfolio Value'}
            </span>
            <button
              onClick={onToggleNetWorthMode}
              className="btn-glass"
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '20px',
                height: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
              title={
                includeCashAndDebt
                  ? 'Switch to Investment Portfolio only'
                  : 'Include Liquid Cash & Debt liabilities'
              }
            >
              {includeCashAndDebt ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>{includeCashAndDebt ? 'Viewing: Full Net Worth' : 'Viewing: Investments Only'}</span>
            </button>
          </div>

          <div className="networth-main-val">
            <span>{formatINR(displayedNetWorth)}</span>
            <span
              style={{
                fontSize: '1.25rem',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              ({formatINRCompact(displayedNetWorth)})
            </span>

            <span className={`networth-pill-gain ${isGain ? 'positive' : 'negative'}`}>
              {isGain ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{formatPctChange(totalReturnPct)}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                ({formatINRCompact(totalReturn)})
              </span>
            </span>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {includeCashAndDebt ? (
              <span>
                Calculated from <strong style={{ color: '#34d399' }}>Portfolio Value</strong> +{' '}
                <strong style={{ color: '#60a5fa' }}>Liquid Cash</strong> −{' '}
                <strong style={{ color: '#fb7185' }}>Outstanding Liabilities</strong>
              </span>
            ) : (
              <span>Aggregated market value across FDs, Bonds, Stocks & SIPs</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="money-header-actions">
          <button
            onClick={onRefresh}
            className="btn-glass"
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh Portfolio Quotes & Recalculate"
          >
            <RotateCw size={15} className={isRefreshing ? 'spin-animation' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Prices'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              fontWeight: 700
            }}
          >
            <Plus size={16} />
            <span>Add Investment</span>
          </button>
        </div>
      </div>

      {/* Sub-Metrics Row */}
      <div className="networth-sub-metrics">
        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <Layers size={13} color="#60a5fa" />
            Total Invested Capital
          </div>
          <div className="hero-sub-value">{formatINR(totalInvested)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Purchase cost basis
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <TrendingUp size={13} color={isGain ? '#34d399' : '#fb7185'} />
            Unrealized Returns
          </div>
          <div
            className="hero-sub-value"
            style={{ color: isGain ? '#34d399' : '#fb7185' }}
          >
            {isGain ? '+' : ''}
            {formatINR(totalReturn)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            All-time net gain/loss
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <CalendarCheck size={13} color="#34d399" />
            Active Monthly SIPs
          </div>
          <div className="hero-sub-value" style={{ color: '#34d399' }}>
            {formatINR(activeSipMonthly)}/mo
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Recurring monthly investment
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <Wallet size={13} color="#38bdf8" />
            Liquid Cash
          </div>
          <div className="hero-sub-value" style={{ color: '#38bdf8' }}>
            {formatINR(cashLiquidity)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Ledger cash on hand
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <CreditCard size={13} color="#fb7185" />
            Liabilities (Debt)
          </div>
          <div className="hero-sub-value" style={{ color: '#fb7185' }}>
            {formatINR(debtLiabilities)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Borrowings payable
          </div>
        </div>
      </div>
    </div>
  );
}

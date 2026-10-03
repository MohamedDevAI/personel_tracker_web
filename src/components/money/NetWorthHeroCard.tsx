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
import { useMoneyPrivacy } from '../../context/MoneyPrivacyContext';

interface NetWorthHeroCardProps {
  netWorth: number;
  portfolioValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPct: number;
  /** Currently unused — reserved for future today-change display. */
  todayChange: number;
  /** Currently unused — reserved for future today-change display. */
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
  todayChange: _todayChange,
  todayChangePct: _todayChangePct,
  cashLiquidity,
  debtLiabilities,
  activeSipMonthly,
  includeCashAndDebt,
  onToggleNetWorthMode,
  onOpenAddModal,
  onRefresh,
  isRefreshing = false
}: NetWorthHeroCardProps) {
  const { mask } = useMoneyPrivacy();
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
                border: '1px solid rgba(186, 54, 242, 0.24)'
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
            <span>{mask(formatINR(displayedNetWorth))}</span>
            <span
              style={{
                fontSize: '1.25rem',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              ({mask(formatINRCompact(displayedNetWorth))})
            </span>

            <span className={`networth-pill-gain ${isGain ? 'positive' : 'negative'}`}>
              {isGain ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{mask(formatPctChange(totalReturnPct))}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                ({mask(formatINRCompact(totalReturn))})
              </span>
            </span>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {includeCashAndDebt ? (
              <span>
                Calculated from <strong style={{ color: '#900dc8' }}>Portfolio Value</strong> +{' '}
                <strong style={{ color: '#9406d0' }}>Liquid Cash</strong> −{' '}
                <strong style={{ color: '#6b677f' }}>Outstanding Liabilities</strong>
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
              background: 'linear-gradient(135deg, #a80fea 0%, #aa08f0 100%)',
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
            <Layers size={13} color="#9406d0" />
            Total Invested Capital
          </div>
          <div className="hero-sub-value">{mask(formatINR(totalInvested))}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Purchase cost basis
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <TrendingUp size={13} color={isGain ? '#900dc8' : '#6b677f'} />
            Unrealized Returns
          </div>
          <div
            className="hero-sub-value"
            style={{ color: isGain ? '#900dc8' : '#6b677f' }}
          >
            {mask(`${isGain ? '+' : ''}${formatINR(totalReturn)}`)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            All-time net gain/loss
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <CalendarCheck size={13} color="#900dc8" />
            Active Monthly SIPs
          </div>
          <div className="hero-sub-value" style={{ color: '#900dc8' }}>
            {mask(formatINR(activeSipMonthly))}/mo
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Recurring monthly investment
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <Wallet size={13} color="#9307cf" />
            Liquid Cash
          </div>
          <div className="hero-sub-value" style={{ color: '#9307cf' }}>
            {mask(formatINR(cashLiquidity))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Ledger cash on hand
          </div>
        </div>

        <div className="hero-sub-metric-box">
          <div className="hero-sub-label">
            <CreditCard size={13} color="#6b677f" />
            Liabilities (Debt)
          </div>
          <div className="hero-sub-value" style={{ color: '#6b677f' }}>
            {mask(formatINR(debtLiabilities))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Borrowings payable
          </div>
        </div>
      </div>
    </div>
  );
}

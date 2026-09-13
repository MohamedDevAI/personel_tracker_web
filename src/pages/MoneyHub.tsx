import React from 'react';
import { CircleDollarSign, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Expense } from '../types';
import '../components/money/money-theme.css';

export default function MoneyHub() {
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: api.getExpenses,
  });

  const totalIncome = (expenses || [])
    .filter((e) => e.type === 'INCOME')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalExpense = (expenses || [])
    .filter((e) => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="money-screen-root">
      {/* Money Screen Header */}
      <div className="money-header-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="money-sub-badge">
              <CircleDollarSign size={13} style={{ display: 'inline', marginRight: 4 }} />
              Money Engine
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dedicated Wealth Workspace
            </span>
          </div>
          <h1 className="money-title-text">
            Personal <span className="money-gold-gradient">Money Command Center</span>
          </h1>
          <p className="page-header-subtitle">
            Dedicated screen for your custom money concepts, wealth tracking, and capital allocation.
          </p>
        </div>
      </div>

      {/* Financial Snapshot KPI Bar */}
      <div className="goals-kpi-grid" style={{ marginBottom: 28 }}>
        <div className="glass-panel habits-kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="habits-kpi-top">
            <span className="habits-kpi-label">NET CASH LIQUIDITY</span>
            <span className="badge badge-emerald">Live Asset</span>
          </div>
          <div className="habits-kpi-value-row">
            <span className="habits-kpi-value" style={{ color: '#34d399' }}>
              ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="habits-kpi-subtext">Total net capital balance across ledgers</div>
        </div>

        <div className="glass-panel habits-kpi-card">
          <div className="habits-kpi-top">
            <span className="habits-kpi-label">TOTAL INFLOWS</span>
            <span className="badge badge-emerald"><ArrowUpRight size={12} /> Credit</span>
          </div>
          <div className="habits-kpi-value-row">
            <span className="habits-kpi-value">${totalIncome.toLocaleString()}</span>
          </div>
          <div className="habits-kpi-subtext">Cumulative income and deposit inflows</div>
        </div>

        <div className="glass-panel habits-kpi-card">
          <div className="habits-kpi-top">
            <span className="habits-kpi-label">TOTAL OUTFLOWS</span>
            <span className="badge badge-rose"><ArrowDownRight size={12} /> Debit</span>
          </div>
          <div className="habits-kpi-value-row">
            <span className="habits-kpi-value">${totalExpense.toLocaleString()}</span>
          </div>
          <div className="habits-kpi-subtext">Cumulative expenditure and debits</div>
        </div>
      </div>

      {/* Money Feature Canvas */}
      <div
        className="glass-panel"
        style={{
          padding: '60px 30px',
          borderRadius: 24,
          textAlign: 'center',
          border: '1px dashed rgba(16, 185, 129, 0.35)',
          background: 'rgba(12, 24, 20, 0.65)',
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fbbf24',
          }}
        >
          <Coins size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Money Command Screen Ready
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto 24px', fontSize: '0.95rem' }}>
          All standard finances (Expense Ledger, Planned Expenses, Borrow & Repay, Analytics) have been moved under <strong style={{ color: '#34d399' }}>Life OS → Finances & Ledger</strong>.
          <br /><br />
          This screen is now your clean, dedicated workspace for your new Money idea. Tell me what you'd like to build here!
        </p>
      </div>
    </div>
  );
}

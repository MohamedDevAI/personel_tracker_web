import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Filter } from 'lucide-react';
import { formatCurrency } from './financeConstants';

interface FinanceSummaryCardsProps {
  selectedMonth: string;
  selectedYear: number;
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  transactionCount: number;
}

export default function FinanceSummaryCards({
  selectedMonth,
  selectedYear,
  totalCredit,
  totalDebit,
  netBalance,
  transactionCount
}: FinanceSummaryCardsProps) {
  const isAll = selectedMonth === 'All';
  const periodLabel = isAll ? `${selectedYear}` : `${selectedMonth.toUpperCase()} ${selectedYear}`;
  const savingsRate = totalCredit > 0 ? ((netBalance / totalCredit) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
      
      {/* Total Credit */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {isAll ? `${selectedYear} TOTAL CREDIT` : `${periodLabel} CREDIT`}
          </div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
          }}>
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          +SAR {formatCurrency(totalCredit)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Inflows & Salary deposits
        </div>
      </div>

      {/* Total Debit */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#f43f5e' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {isAll ? `${selectedYear} TOTAL DEBIT` : `${periodLabel} DEBIT`}
          </div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e'
          }}>
            <ArrowDownRight size={16} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          -SAR {formatCurrency(Math.abs(totalDebit))}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Expenses & Outgoing payments
        </div>
      </div>

      {/* Net Monthly Balance */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
          background: netBalance >= 0 ? '#38bdf8' : '#f43f5e' 
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {isAll ? `${selectedYear} NET SAVINGS` : `${periodLabel} NET SAVINGS`}
          </div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: netBalance >= 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: netBalance >= 0 ? '#38bdf8' : '#f43f5e'
          }}>
            <Wallet size={16} />
          </div>
        </div>
        <div style={{ 
          fontSize: '1.75rem', fontWeight: 800, 
          color: netBalance >= 0 ? '#38bdf8' : '#f43f5e', 
          fontFamily: 'var(--font-display)', marginBottom: '4px' 
        }}>
          SAR {formatCurrency(netBalance)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {totalCredit > 0 ? `${savingsRate}% savings rate` : 'Cash balance for period'}
        </div>
      </div>

      {/* Monthly Activity */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            TRANSACTIONS COUNT
          </div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6'
          }}>
            <Filter size={16} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          {transactionCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Entries</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          In {isAll ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`}
        </div>
      </div>

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Wallet, Target, HandCoins, ArrowDownRight, ArrowUpRight, 
  TrendingUp, TrendingDown, ShieldCheck, Printer, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Category, Transaction, DashboardSummary } from '../../types';
import { borrowRepayApi } from '../../services/borrowRepayApi';
import { plannedExpenseApi } from '../../services/plannedExpenseApi';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear, parseTxDate } from '../../utils/dateHelpers';

interface FinanceAnalyticsReportViewProps {
  transactions?: Transaction[];
  categories?: Category[];
  summary?: DashboardSummary;
  initialMonth?: string;
  initialYear?: number;
}

export default function FinanceAnalyticsReportView({
  transactions = [],
  categories = [],
  summary,
  initialMonth,
  initialYear
}: FinanceAnalyticsReportViewProps) {
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => initialMonth || currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(() => initialYear || currentYear);

  // Available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    transactions.forEach(t => {
      const { year } = parseTxDate(t);
      if (!isNaN(year) && year > 1900 && year < 2100) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Filtered transactions by selected month & year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const { year, month } = parseTxDate(tx);
      if (selectedYear !== 0 && year !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
      return true;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Tab 1: Tracked Expenses Data
  const trackedStats = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    const categoryExpenses: Record<string, number> = {};

    for (const tx of filteredTransactions) {
      const amt = Math.abs(Number(tx.amount || tx.amountSar || 0));
      const isCredit = String(tx.type).toUpperCase() === 'CREDIT';
      if (isCredit) {
        totalCredit += amt;
      } else {
        totalDebit += amt;
        const cat = tx.category || tx.categoryName || 'Other';
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
      }
    }

    return {
      totalCredit,
      totalDebit,
      netCashflow: totalCredit - totalDebit,
      categoryExpenses,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Tab 2: Planned Expenses Data
  const plannedStats = useMemo(() => {
    const allPlans = plannedExpenseApi.getPlannedExpenses().filter(p => {
      if (selectedYear !== 0 && p.year !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && p.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
      return true;
    });
    const totalPlanned = allPlans.reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const fulfilledCount = allPlans.filter(p => p.status === 'Fulfilled').length;
    return {
      totalPlanned,
      plansCount: allPlans.length,
      fulfilledCount,
      adherenceRate: allPlans.length > 0 ? Math.round((fulfilledCount / allPlans.length) * 100) : 100
    };
  }, [selectedMonth, selectedYear]);

  // Tab 3: Borrow and Repay Data (INR ₹)
  const borrowRepayStats = useMemo(() => {
    const stats = borrowRepayApi.getOverallStats();
    const summaries = borrowRepayApi.getCreditorSummaries();
    const settledCount = summaries.filter(s => s.status === 'Settled').length;
    const clearanceRate = stats.totalBorrowed > 0 
      ? Math.min(100, Math.round((stats.totalRepaid / stats.totalBorrowed) * 100)) 
      : 100;

    return {
      ...stats,
      summaries,
      settledCount,
      clearanceRate
    };
  }, []);

  const formatSAR = (val: number) => {
    return `SAR ${Math.round(val).toLocaleString('en-US')}`;
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="analytics-report-container">
      
      {/* Header */}
      <div className="report-header-banner">
        <div>
          <div className="report-badge-top">
            <BarChart3 size={14} /> Comprehensive 3-in-1 Financial Intelligence
          </div>
          <h2 className="report-title-main">
            Unified Financial <span className="emerald-gradient-text">Analytics & Report</span>
          </h2>
          <p className="report-subtitle">
            Holistic cross-tab consolidation across Expense Tracked (SAR), Planned Budgets (SAR), and Borrow & Repay liabilities (INR ₹).
          </p>
        </div>

        <div className="report-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="month-year-select-bar">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="select-custom-pill"
              title="Filter by Month"
            >
              <option value="ALL">All Months</option>
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="select-custom-pill"
              title="Filter by Year"
            >
              <option value={0}>All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
          <button onClick={handlePrint} className="btn btn-secondary btn-print-report">
            <Printer size={16} /> Print / Export Report
          </button>
        </div>
      </div>

      {/* Cross-Tab Executive Scorecards */}
      <div className="report-three-pillars-grid">
        
        {/* Pillar 1: Tracked Ledger (SAR) */}
        <div className="pillar-card glass-panel pillar-ledger">
          <div className="pillar-header">
            <div className="pillar-icon ledger-icon">
              <Wallet size={18} />
            </div>
            <div>
              <h4 className="pillar-title">1. Tracked Cash Flow (SAR)</h4>
              <div className="pillar-caption">{trackedStats.transactionCount} Live Transactions</div>
            </div>
          </div>
          <div className="pillar-stats-body">
            <div className="pillar-stat-row">
              <span>Total Inflows:</span>
              <strong className="stat-green">+{formatSAR(trackedStats.totalCredit)}</strong>
            </div>
            <div className="pillar-stat-row">
              <span>Total Outflows:</span>
              <strong className="stat-red">-{formatSAR(trackedStats.totalDebit)}</strong>
            </div>
            <div className="pillar-stat-divider" />
            <div className="pillar-stat-row total-highlight">
              <span>Net Savings:</span>
              <strong className={trackedStats.netCashflow >= 0 ? 'stat-green' : 'stat-red'}>
                {formatSAR(trackedStats.netCashflow)}
              </strong>
            </div>
          </div>
        </div>

        {/* Pillar 2: Planned Budget (SAR) */}
        <div className="pillar-card glass-panel pillar-planned">
          <div className="pillar-header">
            <div className="pillar-icon planned-icon">
              <Target size={18} />
            </div>
            <div>
              <h4 className="pillar-title">2. Budget Planning (SAR)</h4>
              <div className="pillar-caption">{plannedStats.plansCount} Budgeted Targets</div>
            </div>
          </div>
          <div className="pillar-stats-body">
            <div className="pillar-stat-row">
              <span>Total Planned:</span>
              <strong>{formatSAR(plannedStats.totalPlanned)}</strong>
            </div>
            <div className="pillar-stat-row">
              <span>Fulfilled Objectives:</span>
              <strong className="stat-green">{plannedStats.fulfilledCount} of {plannedStats.plansCount}</strong>
            </div>
            <div className="pillar-stat-divider" />
            <div className="pillar-stat-row total-highlight">
              <span>Target Adherence:</span>
              <strong className="stat-blue">{plannedStats.adherenceRate}%</strong>
            </div>
          </div>
        </div>

        {/* Pillar 3: Borrow & Repay (INR ₹) */}
        <div className="pillar-card glass-panel pillar-debt">
          <div className="pillar-header">
            <div className="pillar-icon debt-icon">
              <HandCoins size={18} />
            </div>
            <div>
              <h4 className="pillar-title">3. Borrow & Repay (INR ₹)</h4>
              <div className="pillar-caption">{borrowRepayStats.totalCreditorsCount} Creditors Tracked</div>
            </div>
          </div>
          <div className="pillar-stats-body">
            <div className="pillar-stat-row">
              <span>Total Borrowed:</span>
              <strong className="stat-amber">{formatINR(borrowRepayStats.totalBorrowed)}</strong>
            </div>
            <div className="pillar-stat-row">
              <span>Total Repaid:</span>
              <strong className="stat-green">{formatINR(borrowRepayStats.totalRepaid)}</strong>
            </div>
            <div className="pillar-stat-divider" />
            <div className="pillar-stat-row total-highlight">
              <span>Outstanding Due:</span>
              <strong className={borrowRepayStats.netOutstanding > 0 ? 'stat-red' : 'stat-green'}>
                {formatINR(borrowRepayStats.netOutstanding)}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* Combined Financial Health Matrix Card (SAR) */}
      <div className="report-matrix-card glass-panel">
        <h3 className="matrix-title">Cross-Module Financial Performance Matrix (SAR)</h3>
        <p className="matrix-subtitle">
          Consolidated breakdown aligning your actual MongoDB spendings with planned limits in Saudi Riyals (SAR).
        </p>

        <div className="matrix-table-wrap">
          <table className="report-matrix-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Actual Spent (SAR)</th>
                <th>Planned Limit (SAR)</th>
                <th>Variance Status</th>
                <th>Health Indicator</th>
              </tr>
            </thead>
            <tbody>
              {categories.slice(0, 8).map(cat => {
                const actual = trackedStats.categoryExpenses[cat.name] || 0;
                // find plan for active month/year
                const plans = plannedExpenseApi.getPlannedExpenses().filter(p => {
                  if (selectedYear !== 0 && p.year !== selectedYear) return false;
                  if (selectedMonth !== 'ALL' && p.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
                  return p.category === cat.name;
                });
                const planned = plans.reduce((acc, p) => acc + Number(p.plannedAmount), 0);
                const hasPlan = planned > 0;
                const isOver = hasPlan && actual > planned;
                const variance = hasPlan ? planned - actual : 0;

                return (
                  <tr key={cat.name}>
                    <td>
                      <span className="matrix-cat-badge">{cat.name}</span>
                    </td>
                    <td>{formatSAR(actual)}</td>
                    <td>{hasPlan ? formatSAR(planned) : <span className="no-plan">No Plan Set</span>}</td>
                    <td>
                      {hasPlan ? (
                        <span className={`badge ${isOver ? 'badge-alert' : 'badge-emerald'}`}>
                          {isOver ? `Over by ${formatSAR(Math.abs(variance))}` : `Surplus ${formatSAR(variance)}`}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {hasPlan ? (
                        <div className="health-bar-track">
                          <div 
                            className={`health-bar-fill ${isOver ? 'danger' : 'safe'}`}
                            style={{ width: `${Math.min(100, Math.round((actual / planned) * 100))}%` }}
                          />
                        </div>
                      ) : (
                        <span className="text-muted">Unmonitored</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creditors Clearance Status Section */}
      <div className="report-creditors-section glass-panel">
        <h3 className="matrix-title">Creditors Repayment & Liabilities Position</h3>
        <div className="creditor-report-grid">
          {borrowRepayStats.summaries.map(c => (
            <div key={c.creditorName} className="creditor-report-item">
              <div className="creditor-report-top">
                <strong>{c.creditorName}</strong>
                <span className={`badge ${c.status === 'Settled' ? 'badge-emerald' : 'badge-amber'}`}>
                  {c.status}
                </span>
              </div>
              <div className="creditor-report-bar-wrap">
                <div className="creditor-report-numbers">
                  <span>Repaid: {formatINR(c.totalRepaid)}</span>
                  <span>Borrowed: {formatINR(c.totalBorrowed)}</span>
                </div>
                <div className="health-bar-track">
                  <div 
                    className="health-bar-fill safe"
                    style={{ 
                      width: c.totalBorrowed > 0 
                        ? `${Math.min(100, Math.round((c.totalRepaid / c.totalBorrowed) * 100))}%` 
                        : '100%' 
                    }}
                  />
                </div>
              </div>
              <div className="creditor-report-bottom">
                Net Pending: <strong className={c.netBalance > 0 ? 'stat-red' : 'stat-green'}>{formatINR(c.netBalance)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

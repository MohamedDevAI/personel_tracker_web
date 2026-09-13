import React from 'react';
import { Search, Calendar, Filter } from 'lucide-react';

interface CreditorSummary {
  creditorName: string;
  totalBorrowed: number;
  totalRepaid: number;
  creditGiven?: number;
  netBalance: number;
  txCount?: number;
  lastActivityDate?: string;
  status: string;
}

interface YearlySummary {
  year: string;
  txCount: number;
  totalBorrowed: number;
  totalRepaid: number;
  creditGiven: number;
}

interface AggregationTableProps {
  filteredCreditorSummaries: CreditorSummary[];
  creditorSummaries: CreditorSummary[];
  yearlySummaries: YearlySummary[];
  stats: {
    totalBorrowed: number;
    totalRepaid: number;
    totalCreditGiven?: number;
    netOutstanding: number;
    totalTransactions?: number;
  };
  aggSearchQuery: string;
  aggStatusFilter: 'ALL' | 'Due' | 'Settled' | 'Credit Given';
  onAggSearchChange: (v: string) => void;
  onAggStatusFilterChange: (v: 'ALL' | 'Due' | 'Settled' | 'Credit Given') => void;
  onInspectCreditor: (name: string) => void;
  onInspectYear: (year: string) => void;
  onGoToLedger: () => void;
  formatINR: (val: number) => string;
}

export default function AggregationTable({
  filteredCreditorSummaries, creditorSummaries, yearlySummaries,
  stats, aggSearchQuery, aggStatusFilter,
  onAggSearchChange, onAggStatusFilterChange, onInspectCreditor, onInspectYear, onGoToLedger, formatINR
}: AggregationTableProps) {
  const STATUS_PILLS: { label: 'ALL' | 'Due' | 'Settled' | 'Credit Given'; color: string }[] = [
    { label: 'ALL',          color: 'pill-all' },
    { label: 'Due',          color: 'pill-due' },
    { label: 'Settled',      color: 'pill-settled' },
    { label: 'Credit Given', color: 'pill-credit' },
  ];

  const countForStatus = (status: 'ALL' | 'Due' | 'Settled' | 'Credit Given') => {
    if (status === 'ALL') return creditorSummaries.length;
    return creditorSummaries.filter(c =>
      status === 'Due'          ? c.netBalance > 0 :
      status === 'Settled'      ? c.netBalance === 0 :
                                  c.netBalance < 0
    ).length;
  };
  return (
    <>
      {/* Search + Status Filter Toolbar */}
      <div className="borrow-table-toolbar agg-toolbar">
        <div className="borrow-search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search creditor in aggregations..."
            value={aggSearchQuery}
            onChange={e => onAggSearchChange(e.target.value)}
            className="borrow-search-input"
          />
        </div>

        {/* Status Pills */}
        <div className="agg-status-pill-group">
          <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {STATUS_PILLS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => onAggStatusFilterChange(p.label)}
              className={`agg-status-pill ${p.color} ${aggStatusFilter === p.label ? 'active' : ''}`}
            >
              {p.label}
              <span className="agg-pill-count">{countForStatus(p.label)}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Showing <strong>{filteredCreditorSummaries.length}</strong> of <strong>{creditorSummaries.length}</strong> creditors
          </span>
          <button type="button" onClick={onGoToLedger} className="btn-table-filter-inspect">
            ← Back to Ledger &amp; Grid
          </button>
        </div>
      </div>

      {/* Creditor Aggregation Table */}
      <div className="creditors-aggregation-table-wrap">
        <table className="creditor-agg-table">
          <thead>
            <tr>
              <th>Creditor Name</th>
              <th className="text-align-right">Total Borrowed</th>
              <th className="text-align-right">Total Repaid</th>
              <th className="text-align-right">Credit Given</th>
              <th className="text-align-right">Net Balance</th>
              <th className="text-align-center">Tx Count</th>
              <th className="text-align-center">Status</th>
              <th>Last Activity</th>
              <th className="text-align-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCreditorSummaries.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No creditors match the search "{aggSearchQuery}".
                </td>
              </tr>
            ) : (
              filteredCreditorSummaries.map(c => {
                const isDue = c.netBalance > 0;
                const isSettled = c.netBalance === 0;
                const isCreditGiven = c.netBalance < 0;
                return (
                  <tr
                    key={c.creditorName}
                    onClick={() => onInspectCreditor(c.creditorName)}
                    title={`Click to view transactions for ${c.creditorName}`}
                  >
                    <td>
                      <div className="creditor-name-cell">
                        <div className="creditor-mini-avatar">{c.creditorName.charAt(0).toUpperCase()}</div>
                        <span className="creditor-display-name">{c.creditorName}</span>
                      </div>
                    </td>
                    <td className="amount-borrowed-col">
                      {c.totalBorrowed > 0 ? `₹ ${c.totalBorrowed.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="amount-repaid-col">
                      {c.totalRepaid > 0 ? `₹ ${c.totalRepaid.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="amount-credit-given-col">
                      {c.creditGiven && c.creditGiven > 0 ? `₹ ${c.creditGiven.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className={`net-balance-col ${isDue ? 'due' : isSettled ? 'settled' : 'credit-given'}`}>
                      {isDue ? `Due: ₹ ${c.netBalance.toLocaleString('en-IN')}`
                        : isSettled ? 'Cleared (₹0)'
                        : `Given: ₹ ${Math.abs(c.netBalance).toLocaleString('en-IN')}`}
                    </td>
                    <td className="tx-count-col">{c.txCount || '—'}</td>
                    <td className="text-align-center">
                      <span className={`badge ${isSettled ? 'badge-emerald' : isCreditGiven ? 'badge-sky' : 'badge-amber'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="last-activity-col">{c.lastActivityDate || '—'}</td>
                    <td className="text-align-center" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onInspectCreditor(c.creditorName)}
                        className="btn-table-filter-inspect"
                        title={`Inspect transactions for ${c.creditorName}`}
                      >
                        Inspect ({c.txCount || 0}) →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="aggregation-footer-row">
              <td>
                <div className="footer-label">
                  <span>Grand Total</span>
                  <span className="footer-reset-hint">({creditorSummaries.length} Creditors)</span>
                </div>
              </td>
              <td className="amount-borrowed-col">₹ {stats.totalBorrowed.toLocaleString('en-IN')}</td>
              <td className="amount-repaid-col">₹ {stats.totalRepaid.toLocaleString('en-IN')}</td>
              <td className="amount-credit-given-col">₹ {(stats.totalCreditGiven || 0).toLocaleString('en-IN')}</td>
              <td className="net-balance-col due">₹ {stats.netOutstanding.toLocaleString('en-IN')}</td>
              <td className="tx-count-col">{stats.totalTransactions}</td>
              <td colSpan={3} className="text-align-center">
                <button type="button" onClick={onGoToLedger} className="btn-clear-all-filters">
                  View All in Ledger →
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Yearly Historical Table */}
      {yearlySummaries.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="creditors-header-bar" style={{ marginBottom: 12 }}>
            <div className="creditors-header-title">
              <Calendar size={16} />
              <span>Yearly Aggregations (Historical Ledger)</span>
              <span className="creditors-count-badge">{yearlySummaries.length} Years</span>
            </div>
          </div>
          <div className="creditors-aggregation-table-wrap">
            <table className="creditor-agg-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="text-align-center">Transactions</th>
                  <th className="text-align-right">Total Borrowed</th>
                  <th className="text-align-right">Total Repaid</th>
                  <th className="text-align-right">Credit Given</th>
                  <th className="text-align-right">Net Position</th>
                  <th className="text-align-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {yearlySummaries.map(y => {
                  const net = y.totalBorrowed - y.totalRepaid - y.creditGiven;
                  return (
                    <tr
                      key={y.year}
                      onClick={() => onInspectYear(y.year)}
                      title={`Click to view all transactions for ${y.year}`}
                    >
                      <td><strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{y.year}</strong></td>
                      <td className="tx-count-col">{y.txCount}</td>
                      <td className="amount-borrowed-col">
                        {y.totalBorrowed > 0 ? `₹ ${y.totalBorrowed.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="amount-repaid-col">
                        {y.totalRepaid > 0 ? `₹ ${y.totalRepaid.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="amount-credit-given-col">
                        {y.creditGiven > 0 ? `₹ ${y.creditGiven.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className={`net-balance-col ${net > 0 ? 'due' : 'settled'}`}>
                        {net > 0 ? `+₹ ${net.toLocaleString('en-IN')}` : `₹ ${net.toLocaleString('en-IN')}`}
                      </td>
                      <td className="text-align-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onInspectYear(y.year)}
                          className="btn-table-filter-inspect"
                        >
                          View {y.year} Records ({y.txCount}) →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

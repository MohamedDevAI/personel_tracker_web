import { useState, useMemo } from 'react';
import { Search, Calendar, Filter, Clock, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { MONTH_NAMES } from '../../../../utils/dateHelpers';

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

type SortField = 'creditorName' | 'totalBorrowed' | 'totalRepaid' | 'creditGiven' | 'netBalance' | 'txCount' | 'status' | 'lastActivityDate';
type SortDirection = 'asc' | 'desc';

interface AggregationTableProps {
  filteredCreditorSummaries: CreditorSummary[];
  creditorSummaries: CreditorSummary[];
  yearlySummaries: YearlySummary[];
  stats: {
    totalBorrowed: number;
    totalRepaid: number;
    totalCreditGiven?: number;
    netOutstanding: number;
    totalOverpaid?: number;
    totalTransactions?: number;
    activeCreditorsCount?: number;
    settledCreditorsCount?: number;
    creditGivenCreditorsCount?: number;
    overpaidCreditorsCount?: number;
  };
  aggSearchQuery: string;
  aggStatusFilter: 'ALL' | 'Due' | 'Settled' | 'Credit Given' | 'Overpaid';
  onAggSearchChange: (v: string) => void;
  onAggStatusFilterChange: (v: 'ALL' | 'Due' | 'Settled' | 'Credit Given' | 'Overpaid') => void;
  selectedMonth?: string;
  onMonthChange?: (m: string) => void;
  selectedYear?: string;
  onYearChange?: (y: string) => void;
  availableYears?: string[];
  onInspectCreditor: (name: string) => void;
  onInspectYear: (year: string) => void;
  onGoToLedger: () => void;
  formatINR: (val: number) => string;
}

export default function AggregationTable({
  filteredCreditorSummaries, creditorSummaries, yearlySummaries,
  stats, aggSearchQuery, aggStatusFilter,
  onAggSearchChange, onAggStatusFilterChange,
  selectedMonth, onMonthChange,
  selectedYear, onYearChange,
  availableYears = [],
  onInspectCreditor, onInspectYear, onGoToLedger, formatINR: _formatINR
}: AggregationTableProps) {
  const [sortField, setSortField] = useState<SortField>('netBalance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const countForStatus = (status: 'ALL' | 'Due' | 'Settled' | 'Credit Given' | 'Overpaid') => {
    if (status === 'ALL') return creditorSummaries.length;
    return creditorSummaries.filter(c =>
      status === 'Due'          ? c.netBalance > 0 :
      status === 'Settled'      ? c.netBalance === 0 :
      status === 'Credit Given' ? (c.status === 'Credit Given' || ((c.creditGiven || 0) > 0 && c.netBalance <= 0)) :
                                  c.status === 'Overpaid'
    ).length;
  };

  const hasOverpaid = countForStatus('Overpaid') > 0;

  const STATUS_PILLS: { label: 'ALL' | 'Due' | 'Settled' | 'Credit Given' | 'Overpaid'; color: string }[] = [
    { label: 'ALL',          color: 'pill-all' },
    { label: 'Due',          color: 'pill-due' },
    { label: 'Settled',      color: 'pill-settled' },
    { label: 'Credit Given', color: 'pill-credit' },
    ...(hasOverpaid ? [{ label: 'Overpaid' as const, color: 'pill-overpaid' }] : []),
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'creditorName' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ArrowUp size={13} className="sort-icon-active" />
      ) : (
        <ArrowDown size={13} className="sort-icon-active" />
      );
    }
    return <ArrowUpDown size={12} className="sort-icon-muted" />;
  };

  const sortedCreditorSummaries = useMemo(() => {
    return [...filteredCreditorSummaries].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'creditorName') {
        valA = (a.creditorName || '').toLowerCase();
        valB = (b.creditorName || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortField === 'lastActivityDate') {
        const timeA = a.lastActivityDate && a.lastActivityDate !== 'N/A' ? new Date(a.lastActivityDate).getTime() : 0;
        const timeB = b.lastActivityDate && b.lastActivityDate !== 'N/A' ? new Date(b.lastActivityDate).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredCreditorSummaries, sortField, sortDirection]);

  const hasActiveFilters = Boolean(
    aggSearchQuery ||
    aggStatusFilter !== 'ALL' ||
    (selectedMonth && selectedMonth !== 'ALL') ||
    (selectedYear && selectedYear !== 'ALL')
  );

  const handleClearFilters = () => {
    onAggSearchChange('');
    onAggStatusFilterChange('ALL');
    if (onMonthChange) onMonthChange('ALL');
    if (onYearChange) onYearChange('ALL');
    setSortField('netBalance');
    setSortDirection('desc');
  };

  return (
    <>
      {/* Search + Comprehensive Filter Toolbar */}
      <div className="borrow-table-toolbar agg-toolbar">
        {/* Search */}
        <div className="borrow-search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search creditor name..."
            value={aggSearchQuery}
            onChange={e => onAggSearchChange(e.target.value)}
            className="borrow-search-input"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="borrow-filters-group">
          {/* Month Filter */}
          {onMonthChange && (
            <div className="filter-select-wrapper">
              <Calendar size={14} className="filter-icon" />
              <select
                value={selectedMonth || 'ALL'}
                onChange={e => onMonthChange(e.target.value)}
                className="borrow-select-filter"
                title="Filter by Month"
              >
                <option value="ALL">All Months</option>
                {MONTH_NAMES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Year Filter */}
          {onYearChange && (
            <div className="filter-select-wrapper">
              <Clock size={14} className="filter-icon" />
              <select
                value={selectedYear || 'ALL'}
                onChange={e => onYearChange(e.target.value)}
                className="borrow-select-filter"
                title="Filter by Year"
              >
                <option value="ALL">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Select */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={aggStatusFilter}
              onChange={e => onAggStatusFilterChange(e.target.value as any)}
              className="borrow-select-filter"
              title="Filter by Status"
            >
              <option value="ALL">All Statuses ({creditorSummaries.length})</option>
              <option value="Due">Due / Outstanding ({countForStatus('Due')})</option>
              <option value="Settled">Settled ({countForStatus('Settled')})</option>
              <option value="Credit Given">Credit Given ({countForStatus('Credit Given')})</option>
              {hasOverpaid && <option value="Overpaid">Overpaid ({countForStatus('Overpaid')})</option>}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={14} className="filter-icon" />
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={e => {
                const [f, d] = e.target.value.split('-') as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d);
              }}
              className="borrow-select-filter"
              title="Sort Table"
            >
              <option value="netBalance-desc">Net Balance: High to Low</option>
              <option value="netBalance-asc">Net Balance: Low to High</option>
              <option value="totalBorrowed-desc">Total Borrowed: High to Low</option>
              <option value="totalRepaid-desc">Total Repaid: High to Low</option>
              <option value="creditGiven-desc">Credit Given: High to Low</option>
              <option value="txCount-desc">Tx Count: Most to Least</option>
              <option value="creditorName-asc">Creditor Name: A to Z</option>
              <option value="creditorName-desc">Creditor Name: Z to A</option>
              <option value="lastActivityDate-desc">Recent Activity</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-clear-all-filters"
              title="Reset all filters"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Quick Status Pills & Count */}
      <div className="agg-status-pills-row">
        <div className="agg-status-pill-group">
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
            Showing <strong>{sortedCreditorSummaries.length}</strong> of <strong>{creditorSummaries.length}</strong> creditors
          </span>
          {onGoToLedger && (
            <button type="button" onClick={onGoToLedger} className="btn-table-filter-inspect" title="View all transaction entries">
              View All Transactions ({stats.totalTransactions || 0}) →
            </button>
          )}
        </div>
      </div>

      {/* Creditor Aggregation Table */}
      <div className="creditors-aggregation-table-wrap">
        <table className="creditor-agg-table">
          <thead>
            <tr>
              <th
                className={`sortable-th ${sortField === 'creditorName' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('creditorName')}
                title="Click to sort by Creditor Name"
              >
                <div className="th-sort-content">
                  <span>Creditor Name</span>
                  {renderSortIcon('creditorName')}
                </div>
              </th>

              <th
                className={`sortable-th text-align-right ${sortField === 'totalBorrowed' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('totalBorrowed')}
                title="Click to sort by Total Borrowed"
              >
                <div className="th-sort-content justify-end">
                  <span>Total Borrowed</span>
                  {renderSortIcon('totalBorrowed')}
                </div>
              </th>

              <th
                className={`sortable-th text-align-right ${sortField === 'totalRepaid' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('totalRepaid')}
                title="Click to sort by Total Repaid"
              >
                <div className="th-sort-content justify-end">
                  <span>Total Repaid</span>
                  {renderSortIcon('totalRepaid')}
                </div>
              </th>

              <th
                className={`sortable-th text-align-right ${sortField === 'creditGiven' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('creditGiven')}
                title="Click to sort by Credit Given"
              >
                <div className="th-sort-content justify-end">
                  <span>Credit Given</span>
                  {renderSortIcon('creditGiven')}
                </div>
              </th>

              <th
                className={`sortable-th text-align-right ${sortField === 'netBalance' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('netBalance')}
                title="Click to sort by Net Balance"
              >
                <div className="th-sort-content justify-end">
                  <span>Net Balance</span>
                  {renderSortIcon('netBalance')}
                </div>
              </th>

              <th
                className={`sortable-th text-align-center ${sortField === 'txCount' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('txCount')}
                title="Click to sort by Tx Count"
              >
                <div className="th-sort-content justify-center">
                  <span>Tx Count</span>
                  {renderSortIcon('txCount')}
                </div>
              </th>

              <th
                className={`sortable-th text-align-center ${sortField === 'status' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('status')}
                title="Click to sort by Status"
              >
                <div className="th-sort-content justify-center">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th
                className={`sortable-th ${sortField === 'lastActivityDate' ? 'sorted-th' : ''}`}
                onClick={() => handleSort('lastActivityDate')}
                title="Click to sort by Last Activity"
              >
                <div className="th-sort-content">
                  <span>Last Activity</span>
                  {renderSortIcon('lastActivityDate')}
                </div>
              </th>

              <th className="text-align-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedCreditorSummaries.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <span>No creditors match your filters{aggSearchQuery ? ` for "${aggSearchQuery}"` : ''}.</span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="btn-clear-all-filters"
                      >
                        <RotateCcw size={13} /> Reset Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedCreditorSummaries.map(c => {
                const isDue = c.netBalance > 0;
                const isSettled = c.netBalance === 0;
                const isCreditGiven = c.status === 'Credit Given';
                const isOverpaid = c.status === 'Overpaid';
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
                    <td className={`net-balance-col ${isDue ? 'due' : isSettled ? 'settled' : isCreditGiven ? 'credit-given' : 'overpaid'}`}>
                      {isDue ? `Due: ₹ ${c.netBalance.toLocaleString('en-IN')}`
                        : isSettled ? 'Cleared (₹0)'
                        : isCreditGiven ? `Given: ₹ ${Math.abs(c.netBalance).toLocaleString('en-IN')}`
                        : `Overpaid: ₹ ${Math.abs(c.netBalance).toLocaleString('en-IN')}`}
                    </td>
                    <td className="tx-count-col">{c.txCount || '—'}</td>
                    <td className="text-align-center">
                      <span className={`badge ${
                        isSettled ? 'badge-emerald' :
                        isCreditGiven ? 'badge-sky' :
                        isOverpaid ? 'badge-purple' :
                        'badge-amber'
                      }`}>
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
              <td className="net-balance-col due" title={`Total Due: ₹${stats.netOutstanding.toLocaleString('en-IN')}${stats.totalOverpaid ? ` | Overpaid: ₹${stats.totalOverpaid.toLocaleString('en-IN')}` : ''}`}>
                Due: ₹ {stats.netOutstanding.toLocaleString('en-IN')}
                {stats.totalOverpaid && stats.totalOverpaid > 0 ? (
                  <div style={{ fontSize: '0.72rem', color: '#9333ea', fontWeight: 600, marginTop: 2 }}>
                    Overpaid: ₹ {stats.totalOverpaid.toLocaleString('en-IN')}
                  </div>
                ) : null}
              </td>
              <td className="tx-count-col">{stats.totalTransactions}</td>
              <td colSpan={3} className="text-align-center">
                {onGoToLedger && (
                  <button type="button" onClick={onGoToLedger} className="btn-clear-all-filters">
                    View All Transactions ({stats.totalTransactions || 0}) →
                  </button>
                )}
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
                      <td><strong style={{ color: 'var(--text-primary, #f8fafc)', fontSize: '0.95rem' }}>{y.year}</strong></td>
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

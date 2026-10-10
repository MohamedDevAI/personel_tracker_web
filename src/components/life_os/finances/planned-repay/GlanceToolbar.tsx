import { Search, Filter, CheckCircle2, Clock, LayoutGrid, Table2, RefreshCw, Link2, Calendar } from 'lucide-react';
import { GlanceViewMode, GlanceStatusFilter } from './useGlanceData';

interface GlanceToolbarProps {
  viewMode: GlanceViewMode;
  statusFilter: GlanceStatusFilter;
  selectedCreditor: string;
  searchQuery: string;
  uniqueCreditors: string[];
  totalMonths: number;
  completedMonthsCount: number;
  rolloverCount: number;
  isFetching: boolean;
  onViewModeChange: (v: GlanceViewMode) => void;
  onStatusFilterChange: (v: GlanceStatusFilter) => void;
  onCreditorChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onAddSchedule: () => void;
  onScrollToCurrentMonth?: () => void;
}

export default function GlanceToolbar({
  viewMode, statusFilter, selectedCreditor, searchQuery,
  uniqueCreditors, totalMonths, completedMonthsCount, rolloverCount,
  isFetching,
  onViewModeChange, onStatusFilterChange, onCreditorChange, onSearchChange, onRefresh, onAddSchedule,
  onScrollToCurrentMonth
}: GlanceToolbarProps) {
  return (
    <div className="glance-toolbar glass-panel">
      <div className="glance-toolbar-left">
        {/* View Toggle */}
        <div className="glance-view-toggle">
          <button
            type="button"
            onClick={() => onViewModeChange('matrix')}
            className={`glance-toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`}
          >
            <LayoutGrid size={15} /> Single Glance Board
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`glance-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          >
            <Table2 size={15} /> Detailed Ledger Table
          </button>
          {viewMode === 'matrix' && onScrollToCurrentMonth && (
            <button
              type="button"
              onClick={onScrollToCurrentMonth}
              className="glance-toggle-btn"
              title="Jump to Current Month"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.08)'
              }}
            >
              <Calendar size={14} style={{ color: '#fbbf24' }} /> Current Month
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="glance-status-pills">
          <button type="button" onClick={() => onStatusFilterChange('ALL')} className={`glance-pill ${statusFilter === 'ALL' ? 'active' : ''}`}>
            All ({totalMonths} Mos)
          </button>
          <button type="button" onClick={() => onStatusFilterChange('Completed')} className={`glance-pill completed ${statusFilter === 'Completed' ? 'active' : ''}`}>
            <CheckCircle2 size={13} /> Completed ({completedMonthsCount})
          </button>
          <button type="button" onClick={() => onStatusFilterChange('In-Completed')} className={`glance-pill incompleted ${statusFilter === 'In-Completed' ? 'active' : ''}`}>
            <Clock size={13} /> In-Completed ({totalMonths - completedMonthsCount})
          </button>
          {rolloverCount > 0 && (
            <button
              type="button"
              onClick={() => onStatusFilterChange('RolloverRecovered')}
              className={`glance-pill ${statusFilter === 'RolloverRecovered' ? 'active' : ''}`}
              style={{ borderColor: 'rgba(242, 129, 54, 0.4)', color: '#ae3b0a' }}
              title="Filter months where unfulfilled debts got fulfilled in next month"
            >
              <Link2 size={13} /> Next-Month Fulfilled ({rolloverCount})
            </button>
          )}
        </div>
      </div>

      <div className="glance-toolbar-right">
        {/* Search */}
        <div className="borrow-search-wrapper" style={{ minWidth: 200 }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search month or creditor..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="borrow-search-input"
          />
        </div>

        {/* Creditor Dropdown */}
        <div className="filter-select-wrapper">
          <Filter size={13} className="filter-icon" />
          <select value={selectedCreditor} onChange={e => onCreditorChange(e.target.value)} className="borrow-select-filter">
            <option value="ALL">All Creditors ({uniqueCreditors.length})</option>
            {uniqueCreditors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Add Schedule */}
        <button type="button" onClick={onAddSchedule} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}> Add Schedule
        </button>

        {/* Refresh */}
        <button type="button" onClick={onRefresh} className="btn btn-secondary btn-sm" title="Refresh schedule">
          <RefreshCw size={13} className={isFetching ? 'spin-icon' : ''} />
        </button>
      </div>
    </div>
  );
}

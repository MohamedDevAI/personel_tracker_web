import {
  CheckCircle2,
  Clock,
  Search,
  Filter,
  LayoutGrid,
  Plus,
  RefreshCw,
  Target
} from 'lucide-react';
import { GlanceViewMode, GlanceStatusFilter } from './PlannedExpensesGlanceTable';

interface GlanceToolbarProps {
  viewMode: GlanceViewMode;
  setViewMode: (mode: GlanceViewMode) => void;
  statusFilter: GlanceStatusFilter;
  setStatusFilter: (filter: GlanceStatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  uniqueCategories: string[];
  calendarMonthShort: string;
  calendarYear: number;
  totalMonths: number;
  completedMonthsCount: number;
  isLoading: boolean;
  onScrollToCurrentMonth: () => void;
  onAddPlan: () => void;
  onRefresh?: () => void;
}

export default function GlanceToolbar({
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  uniqueCategories,
  calendarMonthShort,
  calendarYear,
  totalMonths,
  completedMonthsCount,
  isLoading,
  onScrollToCurrentMonth,
  onAddPlan,
  onRefresh
}: GlanceToolbarProps) {
  return (
    <div className="glance-toolbar glass-panel">
      <div className="glance-toolbar-left">
        {/* View Toggle */}
        <div className="glance-view-toggle">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`glance-toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`}
          >
            <LayoutGrid size={15} /> Single Glance Board
          </button>
        </div>

        {/* Quick Jump to Current Month Button */}
        <button
          type="button"
          onClick={onScrollToCurrentMonth}
          className="glance-jump-current-btn"
          title={`Center view on current month (${calendarMonthShort} ${calendarYear})`}
        >
          <Target size={13} /> Current Month ({calendarMonthShort})
        </button>

        {/* Status Filter Pills */}
        <div className="glance-status-pills">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`glance-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All ({totalMonths} Mos)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Completed')}
            className={`glance-pill completed ${statusFilter === 'Completed' ? 'active' : ''}`}
          >
            <CheckCircle2 size={13} /> Completed ({completedMonthsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('In-Completed')}
            className={`glance-pill incompleted ${statusFilter === 'In-Completed' ? 'active' : ''}`}
          >
            <Clock size={13} /> In-Completed ({totalMonths - completedMonthsCount})
          </button>
        </div>
      </div>

      <div className="glance-toolbar-right">
        {/* Search */}
        <div className="borrow-search-wrapper glance-search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search expense objective..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="borrow-search-input"
          />
        </div>

        {/* Category Dropdown */}
        {uniqueCategories.length > 0 && (
          <div className="filter-select-wrapper">
            <Filter size={13} className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="borrow-select-filter"
            >
              <option value="ALL">All Categories ({uniqueCategories.length})</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add Plan Button */}
        <button
          type="button"
          onClick={onAddPlan}
          className="btn btn-primary btn-sm glance-hero-add-btn"
        >
          <Plus size={15} /> + Add Expense
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => {
            if (onRefresh) onRefresh();
          }}
          className="btn btn-secondary btn-sm"
          title="Refresh schedule"
        >
          <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
        </button>
      </div>
    </div>
  );
}

import { Search, X, Filter } from 'lucide-react';
import { HABIT_CATEGORIES } from '../../../utils/constants';
import './habits.css';

export type HabitStatusFilter = 'ALL' | 'PENDING' | 'COMPLETED';

interface HabitsToolbarProps {
  categoryFilter: string;
  onChangeCategory: (category: string) => void;
  statusFilter: HabitStatusFilter;
  onChangeStatus: (status: HabitStatusFilter) => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  onClearFilters: () => void;
  counts: {
    all: number;
  };
}

export default function HabitsToolbar({
  categoryFilter,
  onChangeCategory,
  statusFilter,
  onChangeStatus,
  searchQuery,
  onChangeSearch,
  onClearFilters,
  counts,
}: HabitsToolbarProps) {
  const hasActiveFilters =
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  return (
    <div className="habits-toolbar-container">
      {/* Filter Bar: Search, Category & Status */}
      <div className="habits-filter-row">
        {/* Search */}
        <div className="habits-search-box">
          <Search size={15} className="habits-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search habits..."
            className="habits-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeSearch('')}
              className="habits-search-clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="habits-select-wrap">
          <Filter size={14} className="habits-select-icon" />
          <select
            value={categoryFilter}
            onChange={(e) => onChangeCategory(e.target.value)}
            className="habits-category-select"
          >
            <option value="ALL">All Categories</option>
            {HABIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="habits-status-filters">
          <button
            type="button"
            onClick={() => onChangeStatus('ALL')}
            className={`habits-status-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => onChangeStatus('PENDING')}
            className={`habits-status-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
          >
            To-Do
          </button>
          <button
            type="button"
            onClick={() => onChangeStatus('COMPLETED')}
            className={`habits-status-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
          >
            Completed
          </button>
        </div>

        {/* Reset button if any filter active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="habits-clear-filters-btn"
            title="Reset all filters"
          >
            <X size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}

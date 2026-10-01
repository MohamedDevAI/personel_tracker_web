import { Search, Plus, LayoutGrid, Table, X, Flame, CircleDot } from 'lucide-react';
import { HABIT_CATEGORIES } from '../../../utils/constants';

export type HabitStatusFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'HOT_STREAK';
export type HabitViewMode = 'streaks' | 'sheet' | 'cards';

interface HabitsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: HabitStatusFilter;
  onStatusFilterChange: (f: HabitStatusFilter) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  viewMode: HabitViewMode;
  onViewModeChange: (v: HabitViewMode) => void;
  onOpenAddModal: () => void;
  pendingCount?: number;
  completedCount?: number;
}

export default function HabitsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  pendingCount = 0,
  completedCount = 0,
}: HabitsToolbarProps) {
  return (
    <div className="habits-toolbar-container">
      <div className="habits-toolbar-left">
        {/* Search Input with Clear Button */}
        <div className="habits-search-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search habits or routines..."
            className="habits-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="habits-search-clear-btn"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="habits-status-filters">
          <button
            onClick={() => onStatusFilterChange('ALL')}
            className={`habits-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All Routines
          </button>
          <button
            onClick={() => onStatusFilterChange('PENDING')}
            className={`habits-filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
          >
            Pending
            {pendingCount > 0 && <span className="habits-filter-count-badge">{pendingCount}</span>}
          </button>
          <button
            onClick={() => onStatusFilterChange('COMPLETED')}
            className={`habits-filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
          >
            Completed
            {completedCount > 0 && <span className="habits-filter-count-badge done">{completedCount}</span>}
          </button>
          <button
            onClick={() => onStatusFilterChange('HOT_STREAK')}
            className={`habits-filter-btn ${statusFilter === 'HOT_STREAK' ? 'active' : ''}`}
          >
            <Flame size={14} color="#f59e0b" /> Hot Streak (5d+)
          </button>
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
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

      <div className="habits-toolbar-right">
        {/* View Mode Switcher: Streaks (iPhone) vs Matrix Sheet vs Cards */}
        <div className="habits-view-switcher">
          <button
            onClick={() => onViewModeChange('streaks')}
            className={`habits-view-toggle-btn ${viewMode === 'streaks' ? 'active' : ''}`}
            title="iPhone Streaks Circular Rings View"
          >
            <CircleDot size={15} /> Streaks
          </button>
          <button
            onClick={() => onViewModeChange('sheet')}
            className={`habits-view-toggle-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            title="Matrix Sheet Tracker (Bullet Journal Grid)"
          >
            <Table size={15} /> Matrix
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
            className={`habits-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            title="Interactive Habit Cards Grid"
          >
            <LayoutGrid size={15} /> Cards
          </button>
        </div>

        {/* New Habit Routine Button */}
        <button onClick={onOpenAddModal} className="btn btn-primary habits-new-btn">
          <Plus size={16} /> New Routine
        </button>
      </div>
    </div>
  );
}

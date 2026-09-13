import React from 'react';
import { Search, Plus, LayoutGrid, Table } from 'lucide-react';
import { HABIT_CATEGORIES } from '../../utils/constants';

export type HabitStatusFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'HOT_STREAK';
export type HabitViewMode = 'cards' | 'sheet';

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
}: HabitsToolbarProps) {
  return (
    <div className="habits-toolbar-container">
      <div className="habits-toolbar-left">
        {/* Search */}
        <div className="habits-search-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search habit routines..."
            className="habits-search-input"
          />
        </div>

        {/* Status Filters */}
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
            Pending Today
          </button>
          <button
            onClick={() => onStatusFilterChange('COMPLETED')}
            className={`habits-filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
          >
            Completed Today
          </button>
          <button
            onClick={() => onStatusFilterChange('HOT_STREAK')}
            className={`habits-filter-btn ${statusFilter === 'HOT_STREAK' ? 'active' : ''}`}
          >
            🔥 Hot Streak (5d+)
          </button>
        </div>

        {/* Category Select */}
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

      <div className="habits-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* View Mode Toggle */}
        <div className="habits-status-filters">
          <button
            onClick={() => onViewModeChange('sheet')}
            className={`habits-filter-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            title="Matrix Sheet Tracker View"
          >
            <Table size={15} /> Sheet
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
            className={`habits-filter-btn ${viewMode === 'cards' ? 'active' : ''}`}
            title="Interactive Cards Grid View"
          >
            <LayoutGrid size={15} /> Cards
          </button>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary">
          <Plus size={16} /> New Habit Routine
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Search, Plus, LayoutGrid, Table, Target } from 'lucide-react';
import { GOAL_CATEGORIES } from '../../../utils/constants';

export type GoalStatusFilter = 'ALL' | 'IN_PROGRESS' | 'ACHIEVED' | 'UPCOMING';
export type GoalViewMode = 'cards' | 'sheet';

interface GoalsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: GoalStatusFilter;
  onStatusFilterChange: (f: GoalStatusFilter) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  viewMode: GoalViewMode;
  onViewModeChange: (v: GoalViewMode) => void;
  onOpenAddModal: () => void;
}

export default function GoalsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  onOpenAddModal,
}: GoalsToolbarProps) {
  return (
    <div className="goals-toolbar-container">
      <div className="goals-toolbar-left">
        {/* Search */}
        <div className="goals-search-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search strategic goals & milestones..."
            className="goals-search-input"
          />
        </div>

        {/* Status Filters */}
        <div className="goals-status-filters">
          <button
            onClick={() => onStatusFilterChange('ALL')}
            className={`goals-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All Milestones
          </button>
          <button
            onClick={() => onStatusFilterChange('IN_PROGRESS')}
            className={`goals-filter-btn ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
          >
            In Progress
          </button>
          <button
            onClick={() => onStatusFilterChange('ACHIEVED')}
            className={`goals-filter-btn ${statusFilter === 'ACHIEVED' ? 'active' : ''}`}
          >
            🎉 Achieved (100%)
          </button>
          <button
            onClick={() => onStatusFilterChange('UPCOMING')}
            className={`goals-filter-btn ${statusFilter === 'UPCOMING' ? 'active' : ''}`}
          >
            Due Soon (30d)
          </button>
        </div>

        {/* Category Select */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="goals-category-select"
        >
          <option value="ALL">All Categories</option>
          {GOAL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* View Mode Toggle */}
        <div className="goals-status-filters">
          <button
            onClick={() => onViewModeChange('cards')}
            className={`goals-filter-btn ${viewMode === 'cards' ? 'active' : ''}`}
            title="Interactive Grid Cards View"
          >
            <LayoutGrid size={15} /> Cards
          </button>
          <button
            onClick={() => onViewModeChange('sheet')}
            className={`goals-filter-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            title="Milestone Table Matrix View"
          >
            <Table size={15} /> Sheet
          </button>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary">
          <Plus size={16} /> New Milestone
        </button>
      </div>
    </div>
  );
}

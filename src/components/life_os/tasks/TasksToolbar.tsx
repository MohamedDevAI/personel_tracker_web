import React from 'react';
import { Search, Plus, Kanban, Table, List, Zap } from 'lucide-react';
import { TASK_CATEGORIES } from '../../../utils/constants';

export type TaskStatusFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'HIGH_PRIORITY';
export type TaskViewMode = 'board' | 'sheet' | 'list';

interface TasksToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: TaskStatusFilter;
  onStatusFilterChange: (f: TaskStatusFilter) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  viewMode: TaskViewMode;
  onViewModeChange: (v: TaskViewMode) => void;
  onOpenAddModal: () => void;
}

export default function TasksToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  onOpenAddModal,
}: TasksToolbarProps) {
  return (
    <div className="tasks-toolbar-wrapper">
      <div className="tasks-toolbar-left">
        {/* Search */}
        <div className="tasks-search-input-box">
          <Search className="tasks-search-icon" />
          <input
            type="text"
            placeholder="Search daily tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="tasks-search-input"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="tasks-filter-pills">
          <button
            type="button"
            className={`tasks-filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('ALL')}
          >
            All
          </button>
          <button
            type="button"
            className={`tasks-filter-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('PENDING')}
          >
            Pending
          </button>
          <button
            type="button"
            className={`tasks-filter-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('COMPLETED')}
          >
            Completed
          </button>
          <button
            type="button"
            className={`tasks-filter-pill high-prio ${statusFilter === 'HIGH_PRIORITY' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('HIGH_PRIORITY')}
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            High Prio
          </button>
        </div>

        {/* Category Select */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="tasks-category-select"
        >
          <option value="ALL">All Categories</option>
          {TASK_CATEGORIES.map((cat: string) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* View Mode Toggle */}
        <div className="tasks-status-filters">
          <button
            onClick={() => onViewModeChange('board')}
            className={`tasks-filter-btn ${viewMode === 'board' ? 'active' : ''}`}
            title="Kanban Columns View"
          >
            <Kanban size={15} /> Kanban
          </button>
          <button
            onClick={() => onViewModeChange('sheet')}
            className={`tasks-filter-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            title="Matrix Sheet Table View"
          >
            <Table size={15} /> Sheet
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`tasks-filter-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="Linear List View"
          >
            <List size={15} /> List
          </button>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary">
          <Plus size={16} /> New Task
        </button>
      </div>
    </div>
  );
}

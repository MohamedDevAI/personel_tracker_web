import React from 'react';
import { Search, Filter } from 'lucide-react';
import { PlannedExpenseStatus } from '../../../types';

interface PlannedExpensesToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'ALL' | PlannedExpenseStatus;
  onStatusFilterChange: (value: 'ALL' | PlannedExpenseStatus) => void;
}

export default function PlannedExpensesToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: PlannedExpensesToolbarProps) {
  return (
    <div className="borrow-table-toolbar">
      <div className="borrow-search-wrapper">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          placeholder="Search planned items or notes..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="borrow-search-input"
        />
      </div>

      <div className="filter-select-wrapper">
        <Filter size={14} className="filter-icon" />
        <select
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value as 'ALL' | PlannedExpenseStatus)}
          className="borrow-select-filter"
        >
          <option value="ALL">All Statuses</option>
          <option value="Fulfilled">Fulfilled (Complete)</option>
          <option value="Partial">Partially Paid</option>
          <option value="Planned">Unfulfilled / Planned</option>
        </select>
      </div>
    </div>
  );
}

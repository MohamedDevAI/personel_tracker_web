import React from 'react';
import {
  HandCoins, Search, Filter, ArrowDownLeft, ArrowUpRight,
  Trash2, Calendar, Clock, User, RotateCcw
} from 'lucide-react';
import { BorrowRepayRecord, BorrowRepayType } from '../../../types';
import { MONTH_NAMES } from '../../../utils/dateHelpers';

interface CreditLedgerTableProps {
  filteredRecords: BorrowRepayRecord[];
  totalRecords: number;
  activeFilterTotals: { borrowed: number; repaid: number; creditGiven: number; net: number };
  searchQuery: string;
  typeFilter: 'ALL' | BorrowRepayType;
  selectedMonth: string;
  selectedYear: string;
  selectedCreditorFilter: string;
  availableYears: string[];
  existingCreditors: string[];
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: 'ALL' | BorrowRepayType) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onCreditorFilterChange: (v: string) => void;
  onDeleteRecord: (item: BorrowRepayRecord) => void;
  onAddRecord: () => void;
  onResetFilters: () => void;
  formatINR: (val: number) => string;
}

export default function CreditLedgerTable({
  filteredRecords, totalRecords, activeFilterTotals,
  searchQuery, typeFilter, selectedMonth, selectedYear, selectedCreditorFilter,
  availableYears, existingCreditors,
  onSearchChange, onTypeFilterChange, onMonthChange, onYearChange, onCreditorFilterChange,
  onDeleteRecord, onAddRecord, onResetFilters, formatINR
}: CreditLedgerTableProps) {
  const hasFilter = selectedMonth !== 'ALL' || selectedYear !== 'ALL' || typeFilter !== 'ALL' ||
    selectedCreditorFilter !== 'ALL' || !!searchQuery;

  return (
    <>
      {/* Summary Strip */}
      <div className="table-summary-strip">
        <div className="summary-strip-left">
          <HandCoins size={16} />
          <span>
            Showing <strong>{filteredRecords.length}</strong> of <strong>{totalRecords}</strong> transactions
            {selectedCreditorFilter !== 'ALL' && <> for <strong>{selectedCreditorFilter}</strong></>}
          </span>
        </div>
        <div className="summary-strip-right">
          <div className="summary-stat-item">
            <span style={{ color: 'var(--text-muted)' }}>Borrowed:</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>₹ {activeFilterTotals.borrowed.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-stat-item">
            <span style={{ color: 'var(--text-muted)' }}>Repaid:</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>₹ {activeFilterTotals.repaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-stat-item">
            <span style={{ color: 'var(--text-muted)' }}>Net:</span>
            <span style={{ color: activeFilterTotals.net > 0 ? '#fb7185' : '#34d399', fontWeight: 700 }}>
              ₹ {activeFilterTotals.net.toLocaleString('en-IN')}
            </span>
          </div>
          {hasFilter && (
            <button type="button" onClick={onResetFilters} className="btn-clear-all-filters" title="Reset all filters">
              <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="borrow-table-toolbar">
        <div className="borrow-search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Creditor Name or Notes..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="borrow-search-input"
          />
        </div>

        <div className="borrow-filters-group">
          <div className="filter-select-wrapper">
            <Calendar size={14} className="filter-icon" />
            <select value={selectedMonth} onChange={e => onMonthChange(e.target.value)} className="borrow-select-filter">
              <option value="ALL">All Months</option>
              {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <Clock size={14} className="filter-icon" />
            <select value={selectedYear} onChange={e => onYearChange(e.target.value)} className="borrow-select-filter">
              <option value="ALL">All Years</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select value={typeFilter} onChange={e => onTypeFilterChange(e.target.value as any)} className="borrow-select-filter">
              <option value="ALL">All Types</option>
              <option value="Borrow">Borrow (+INR)</option>
              <option value="Repaid">Repaid (-INR)</option>
            </select>
          </div>

          {existingCreditors.length > 0 && (
            <div className="filter-select-wrapper">
              <User size={14} className="filter-icon" />
              <select value={selectedCreditorFilter} onChange={e => onCreditorFilterChange(e.target.value)} className="borrow-select-filter">
                <option value="ALL">All Creditors ({existingCreditors.length})</option>
                {existingCreditors.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="borrow-table-container glass-panel">
        <table className="borrow-data-table">
          <thead>
            <tr>
              <th>Creditor Name</th>
              <th>Date</th>
              <th>Transaction Type</th>
              <th className="th-amount">Amount (INR)</th>
              <th>Notes</th>
              <th className="th-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <div className="empty-table-placeholder">
                    <HandCoins size={28} />
                    <p>No borrow or repayment records found for the selected filter.</p>
                    <button onClick={onAddRecord} className="btn btn-secondary btn-sm">
                      + Add First Record
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map(item => {
                const isBorrow = item.type === 'Borrow';
                return (
                  <tr key={item.id} className="borrow-row">
                    <td className="td-creditor">
                      <div className="creditor-avatar-cell">
                        <div className="creditor-avatar-circle">{item.creditorName.charAt(0).toUpperCase()}</div>
                        <span className="creditor-fullname">{item.creditorName}</span>
                      </div>
                    </td>
                    <td className="td-date">
                      <div className="date-cell-flex">
                        <Calendar size={13} className="date-icon" />
                        <span>{item.date}</span>
                      </div>
                    </td>
                    <td className="td-type">
                      <span className={`badge ${isBorrow ? 'badge-borrow' : 'badge-repaid'}`}>
                        {isBorrow ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {item.type}
                      </span>
                    </td>
                    <td className={`td-amount ${isBorrow ? (Number(item.amount) < 0 ? 'repaid-amt' : 'borrow-amt') : 'repaid-amt'}`}>
                      {isBorrow
                        ? Number(item.amount) < 0
                          ? `-₹ ${Math.abs(Number(item.amount)).toLocaleString('en-IN')} (Credit Given)`
                          : `+₹ ${Number(item.amount).toLocaleString('en-IN')}`
                        : `-₹ ${Number(item.amount).toLocaleString('en-IN')}`}
                    </td>
                    <td className="td-notes"><span className="notes-text">{item.notes || '—'}</span></td>
                    <td className="td-action">
                      <button onClick={() => onDeleteRecord(item)} className="btn-icon-delete" title="Delete Record">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

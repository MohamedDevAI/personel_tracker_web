import React from 'react';
import { Filter, Table2, User, X } from 'lucide-react';
import { BorrowRepayType } from '../../../types';

interface CreditorSummary {
  creditorName: string;
  netBalance: number;
  status: string;
  creditGiven?: number;
}

interface CreditorsGridProps {
  creditorSummaries: CreditorSummary[];
  selectedCreditorFilter: string;
  filteredRecordsCount: number;
  onSelectCreditor: (name: string) => void;
  onClearFilter: () => void;
  onGoToAggregation: () => void;
  onSettleBalance: (creditorName: string) => void;
  formatINR: (val: number) => string;
}

export default function CreditorsGrid({
  creditorSummaries, selectedCreditorFilter, filteredRecordsCount,
  onSelectCreditor, onClearFilter, onGoToAggregation, onSettleBalance, formatINR
}: CreditorsGridProps) {
  if (creditorSummaries.length === 0) return null;

  return (
    <div className="creditors-section">
      <div className="creditors-header-bar">
        <div className="creditors-header-title">
          <User size={16} />
          <span>Creditors Summary</span>
          <span className="creditors-count-badge">{creditorSummaries.length}</span>
        </div>
        <button
          type="button"
          onClick={onGoToAggregation}
          className="btn-table-filter-inspect"
          style={{ fontSize: '0.8rem', padding: '5px 12px' }}
        >
          <Table2 size={14} /> View Aggregation Table →
        </button>
      </div>

      {/* Active Creditor Filter Banner */}
      {selectedCreditorFilter !== 'ALL' && (
        <div className="creditor-active-banner">
          <div className="banner-left">
            <Filter size={15} />
            <span>Filtering transactions for:</span>
            <span className="banner-creditor-name">{selectedCreditorFilter}</span>
            <span className="banner-count-badge">({filteredRecordsCount} records matching)</span>
          </div>
          <button type="button" onClick={onClearFilter} className="banner-clear-btn" title="Show all creditors">
            <X size={14} />
            <span>Show All Creditors</span>
          </button>
        </div>
      )}

      {/* Chip Grid */}
      <div className="creditors-chip-grid">
        {creditorSummaries.map(c => {
          const isSelected = selectedCreditorFilter === c.creditorName;
          return (
            <div
              key={c.creditorName}
              onClick={() => onSelectCreditor(c.creditorName)}
              className={`creditor-chip-card ${isSelected ? 'active-filter' : ''} ${c.status === 'Settled' ? 'settled' : 'pending'}`}
              title={isSelected ? 'Active filter – click to show all' : `Click to filter for ${c.creditorName}`}
            >
              <div className="creditor-chip-top">
                <span className="creditor-chip-name">{c.creditorName}</span>
                <span className={`badge ${c.status === 'Settled' ? 'badge-emerald' : 'badge-amber'}`}>
                  {c.status}
                </span>
              </div>
              <div className="creditor-chip-balance">
                {c.netBalance > 0 ? (
                  <span className="balance-due">Due: {formatINR(c.netBalance)}</span>
                ) : c.netBalance < 0 ? (
                  <span className="balance-overpaid" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    Credit Given: {formatINR(Math.abs(c.netBalance))}
                  </span>
                ) : (
                  <span className="balance-cleared">Fully Cleared (₹0)</span>
                )}
              </div>
              <div className="creditor-chip-actions">
                {c.netBalance > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); onSettleBalance(c.creditorName); }}
                    className="btn-link-settle"
                  >
                    Settle Balance →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { PlannedExpense } from '../../../../types';
import { formatSAR } from './plannedExpenseSync';
import { GlanceColumn } from './PlannedExpensesGlanceTable';

interface GlanceMonthCardProps {
  col: GlanceColumn;
  isCurrent: boolean;
  cardRef: React.Ref<HTMLDivElement> | null;
  onToggleItem: (plan: PlannedExpense, e?: React.MouseEvent) => void;
  onToggleColumn: (monthShort: string, year: number, isCompleted: boolean) => void;
  onDeleteItem: (plan: PlannedExpense, e?: React.MouseEvent) => void;
  onSelectMonth?: (monthShort: string, year?: number) => void;
}

export default function GlanceMonthCard({
  col,
  isCurrent,
  cardRef,
  onToggleItem,
  onToggleColumn,
  onDeleteItem,
  onSelectMonth
}: GlanceMonthCardProps) {
  const isColCompleted = col.status === 'Completed';

  return (
    <div
      key={`${col.mShort}-${col.year}`}
      ref={cardRef}
      className={`glance-month-card glass-panel ${isColCompleted ? 'completed-card' : 'incompleted-card'
        } ${isCurrent ? 'is-current-month' : ''} ${col.isNextYear ? 'is-next-year-month' : ''}`}
    >
      {/* Card Header */}
      <div className="glance-card-header">
        <div className="glance-month-meta">
          <span className="glance-month-index">
            Month {col.monthIndex < 10 ? `0${col.monthIndex}` : col.monthIndex} • {col.year}
          </span>
          {isCurrent ? (
            <span className="badge glance-badge-current">
              ★ CURRENT
            </span>
          ) : col.isNextYear ? (
            <span className="badge glance-badge-next-year">
              NEXT YEAR
            </span>
          ) : (
            <span className="glance-target-date">{col.targetDate}</span>
          )}
        </div>

        <div className="glance-month-title-row">
          <h4
            className={`glance-month-title ${onSelectMonth ? 'clickable' : ''}`}
            onClick={() => onSelectMonth && onSelectMonth(col.mShort, col.year)}
            title={onSelectMonth ? `Click to open detailed view for ${col.targetMonth}` : undefined}
          >
            {col.targetMonth}
          </h4>
          {onSelectMonth && (
            <button
              type="button"
              onClick={() => onSelectMonth(col.mShort, col.year)}
              className="btn btn-secondary btn-xs glance-month-details-btn"
              title={`Open detailed ${col.targetMonth} table`}
            >
              Details →
            </button>
          )}
        </div>

        <div className="glance-month-total-box">
          <span className="glance-total-label">MONTH TOTAL</span>
          <span className="glance-total-amount">{formatSAR(col.monthTotal)}</span>
        </div>

        <button
          type="button"
          onClick={() => onToggleColumn(col.mShort, col.year, isColCompleted)}
          className={`glance-col-status-pill ${isColCompleted ? 'completed' : 'incompleted'
            }`}
          title="Click to toggle all expense objectives in this month"
        >
          {isColCompleted ? (
            <>
              <CheckCircle2 size={13} />
              <span>Completed</span>
            </>
          ) : (
            <>
              <Clock size={13} />
              <span>In-Completed</span>
            </>
          )}
        </button>
      </div>

      {/* Card Body: Items List */}
      <div className="glance-card-body">
        <div className="glance-items-heading">
          <span>Expense Objectives ({col.itemCount})</span>
          <span className="glance-hint-text">1-click to toggle</span>
        </div>

        <div className="glance-items-list">
          {col.items.length === 0 ? (
            <div className="glance-empty-month-placeholder">
              No expenses planned
            </div>
          ) : (
            col.items.map(item => {
              const isItemFulfilled =
                item.isFulfilled ||
                item.status === 'Fulfilled' ||
                (item.paidAmount ?? 0) >= item.plannedAmount;

              return (
                <div
                  key={item.id || item.title}
                  className={`glance-item-row ${isItemFulfilled ? 'item-done' : 'item-pending'
                    }`}
                >
                  {/* 1. Expense Objective & Planned Budget */}
                  <div className="glance-item-info">
                    <div className="glance-item-creditor-row">
                      <span
                        className="glance-creditor-name"
                        title={item.title}
                      >
                        {item.title}
                      </span>
                      <span className="glance-item-amount">
                        {formatSAR(item.plannedAmount)}
                      </span>
                    </div>
                  </div>

                  {/* 2. Actions: Tick Mark (✓) or Close Mark (✕) */}
                  <div className="glance-item-actions-group">
                    <button
                      type="button"
                      onClick={e => onToggleItem(item, e)}
                      className={`glance-item-toggle-btn ${isItemFulfilled ? 'done' : 'pending'
                        }`}
                      title={
                        isItemFulfilled
                          ? 'Fulfilled (Click to mark Pending)'
                          : 'Not Fulfilled (Click to mark Fulfilled)'
                      }
                    >
                      {isItemFulfilled ? (
                        <>
                          <CheckCircle2 size={13} className="emerald-icon" />
                        </>
                      ) : (
                        <>
                          <XCircle
                            size={13}
                            className="glance-unfulfilled-icon"
                          />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={e => onDeleteItem(item, e)}
                      className="glance-item-del-btn"
                      title={`Delete planned expense: ${item.title}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="glance-card-footer">
        <span className="glance-footer-badge">
          {col.items.length === 0
            ? '— No Expenses Planned'
            : isColCompleted
              ? '✓ 100% Fulfilled on Schedule'
              : '⏳ Action Required (Unfulfilled)'}
        </span>
        {onSelectMonth && (
          <button
            type="button"
            onClick={() => onSelectMonth(col.mShort, col.year)}
            className="glance-expand-details-btn"
            title={`Expand full details for ${col.targetMonth}`}
          >
            <span>Expand {col.mShort} Details</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

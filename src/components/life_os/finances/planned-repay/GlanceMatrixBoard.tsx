import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { CheckCircle2, Clock, Link2, CheckSquare, Trash2, AlertTriangle, Sparkles, Calendar } from 'lucide-react';
import type { PlannedRepayCreditItem, PlannedRepayCreditColumn, PlannedRepayCreditMatrix } from '../../../../types';
import { NextMonthCheckInfo } from './useGlanceData';

export interface GlanceMatrixBoardHandle {
  scrollToCurrentMonth: (smooth?: boolean) => void;
}

interface GlanceMatrixBoardProps {
  filteredColumns: PlannedRepayCreditMatrix['columns'];
  allColumns: PlannedRepayCreditMatrix['columns'];
  formatINR: (val: number) => string;
  toggleStatusPending: boolean;
  deleteItemPending: boolean;
  onToggleItem: (item: PlannedRepayCreditItem, e?: React.MouseEvent) => void;
  onToggleColumn: (col: PlannedRepayCreditColumn) => void;
  onDeleteItem: (item: PlannedRepayCreditItem, e?: React.MouseEvent) => void;
  checkNextMonthFulfillment: (item: PlannedRepayCreditItem, colIdx: number, cols: PlannedRepayCreditMatrix['columns']) => NextMonthCheckInfo;
  checkIsPreviousMonthRollover: (item: PlannedRepayCreditItem, colIdx: number, cols: PlannedRepayCreditMatrix['columns']) => { isRollover: boolean; prevMonthName: string; prevAmount: number };
}

const GlanceMatrixBoard = forwardRef<GlanceMatrixBoardHandle, GlanceMatrixBoardProps>(
  function GlanceMatrixBoard({
    filteredColumns, allColumns, formatINR,
    toggleStatusPending, deleteItemPending,
    onToggleItem, onToggleColumn, onDeleteItem,
    checkNextMonthFulfillment, checkIsPreviousMonthRollover
  }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentMonthCardRef = useRef<HTMLDivElement>(null);

    const scrollToCurrentMonth = (smooth = true) => {
      if (currentMonthCardRef.current && containerRef.current) {
        const container = containerRef.current;
        const card = currentMonthCardRef.current;
        const targetLeft = Math.max(0, card.offsetLeft - container.offsetLeft - 16);
        container.scrollTo({
          left: targetLeft,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToCurrentMonth
    }));

    useEffect(() => {
      // Auto-scroll to current month immediately and smoothly after render
      scrollToCurrentMonth(false);
      const timer = setTimeout(() => {
        scrollToCurrentMonth(true);
      }, 80);
      return () => clearTimeout(timer);
    }, [filteredColumns]);

    const isCurrentMonth = (col: PlannedRepayCreditColumn) => {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonthIndex = now.getMonth() + 1; // 1-12

      if (col.monthIndex) {
        const yr = col.targetDate ? parseInt(col.targetDate.split('-')[0], 10) : curYear;
        return col.monthIndex === curMonthIndex && yr === curYear;
      }
      if (col.targetDate) {
        const parts = col.targetDate.split('-');
        if (parts.length >= 2) {
          return parseInt(parts[0], 10) === curYear && parseInt(parts[1], 10) === curMonthIndex;
        }
      }
      if (col.targetMonth) {
        const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const curFull = fullMonths[now.getMonth()];
        const curShort = shortMonths[now.getMonth()];
        const t = col.targetMonth.toLowerCase();
        const matchesMonth = t.includes(curFull.toLowerCase()) || t.includes(curShort.toLowerCase());
        const matchesYear = t.includes(String(curYear));
        return matchesMonth && matchesYear;
      }
      return false;
    };

    return (
      <div className="glance-matrix-container" ref={containerRef}>
        <div className="glance-columns-track">
          {filteredColumns.map(col => {
            const realColIdx = allColumns.findIndex(c => c.targetMonth === col.targetMonth);
            const isColCompleted = col.status === 'Completed';
            const unfulfilledItems = col.items.filter(it => it.status !== 'Completed');
            const nextMonthRecoveredCount = unfulfilledItems.filter(it => checkNextMonthFulfillment(it, realColIdx, allColumns).isFulfilledInNextMonth).length;
            const nextCol = allColumns[realColIdx + 1];
            const isCurrent = isCurrentMonth(col);

            return (
              <div
                key={col.targetMonth}
                ref={isCurrent ? currentMonthCardRef : undefined}
                className={`glance-month-card glass-panel ${isColCompleted ? 'completed-card' : 'incompleted-card'} ${isCurrent ? 'current-month-card' : ''}`}
              >
                {/* Current Month Prominent Notification Banner */}
                {isCurrent && (
                  <div className="glance-current-month-banner">
                    <Sparkles size={12} />
                    <span>CURRENT MONTH (ACTIVE)</span>
                  </div>
                )}

                {/* Card Header */}
                <div className="glance-card-header">
                  <div className="glance-month-meta">
                    <span className="glance-month-index">Month 0{col.monthIndex || realColIdx + 1}</span>
                    {isCurrent && (
                      <span className="glance-current-month-badge">
                        <Calendar size={11} /> Current Month
                      </span>
                    )}
                    <span className="glance-target-date">{col.targetDate}</span>
                  </div>
                  <h4 className="glance-month-title">{col.targetMonth}</h4>

                  <div className="glance-month-total-box">
                    <span className="glance-total-label">MONTH TOTAL</span>
                    <span className="glance-total-amount">{formatINR(col.monthTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleColumn(col)}
                    className={`glance-col-status-pill ${isColCompleted ? 'completed' : 'incompleted'}`}
                    title="Click to toggle all items in this month"
                  >
                    {isColCompleted ? <><CheckCircle2 size={13} /><span>Completed</span></> : <><Clock size={13} /><span>In-Completed</span></>}
                  </button>
                </div>

                {/* Next-Month Constraint Check Banner */}
                {!isColCompleted && nextCol && (
                  <div className="glance-constraint-alert-box">
                    <div className="glance-constraint-header">
                      <Link2 size={13} className="constraint-icon" />
                      <span>Next Month Check ({nextCol.targetMonth}):</span>
                    </div>
                    <div className="glance-constraint-content">
                      {nextMonthRecoveredCount > 0 ? (
                        <span className="constraint-success-text">
                          ✓ {nextMonthRecoveredCount} of {unfulfilledItems.length} unfulfilled items fulfilled in {nextCol.targetMonth}!
                        </span>
                      ) : (
                        <span className="constraint-warning-text">
                          ⚠️ Not yet fulfilled in next month ({nextCol.targetMonth}).
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="glance-card-body">
                  <div className="glance-items-heading">
                    <span>Creditor Breakdown ({col.itemCount})</span>
                  </div>

                  <div className="glance-items-list">
                    {col.items.map(item => {
                      const isItemCompleted = item.status === 'Completed';
                      const nextCheck = checkNextMonthFulfillment(item, realColIdx, allColumns);
                      const prevRollover = checkIsPreviousMonthRollover(item, realColIdx, allColumns);

                      return (
                        <div
                          key={item.id || item._id}
                          className={`glance-item-row ${isItemCompleted ? 'item-done' : 'item-pending'}`}
                        >
                          <div className="glance-item-info">
                            <div className="glance-item-creditor-row">
                              <span className="glance-creditor-name">{item.creditorName}</span>
                              <span className="glance-item-amount">{formatINR(item.plannedAmount)}</span>
                            </div>

                            {prevRollover.isRollover && isItemCompleted && (
                              <div className="glance-rollover-tag settled" title={`Settles commitment from ${prevRollover.prevMonthName}`}>
                                <Sparkles size={11} /> Settles {prevRollover.prevMonthName} rollover
                              </div>
                            )}

                            {!isItemCompleted && nextCheck.hasCheck && (
                              <div className={`glance-next-month-chip ${nextCheck.badgeType}`} title={nextCheck.detailMessage}>
                                {nextCheck.badgeType === 'fulfilled' ? <CheckCircle2 size={11} className="chip-icon" />
                                  : nextCheck.badgeType === 'partial' ? <AlertTriangle size={11} className="chip-icon" />
                                    : <Clock size={11} className="chip-icon" />}
                                <span>{nextCheck.badgeText}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="glance-item-actions-group">
                            <button
                              type="button"
                              onClick={e => onToggleItem(item, e)}
                              disabled={toggleStatusPending}
                              className={`glance-item-toggle-btn ${isItemCompleted ? 'done' : 'pending'}`}
                              title={`Mark as ${isItemCompleted ? 'In-Completed' : 'Completed'}`}
                            >
                              {isItemCompleted ? <CheckSquare size={13} className="emerald-icon" /> : <Clock size={13} className="amber-icon" />}
                              <span>{isItemCompleted ? 'Done' : 'Pending'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={e => onDeleteItem(item, e)}
                              disabled={deleteItemPending}
                              className="glance-item-del-btn"
                              title={`Delete scheduled repayment for ${item.creditorName}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="glance-card-footer">
                  <span className="glance-footer-badge">
                    {isColCompleted
                      ? '✓ 100% Settled on Schedule'
                      : nextMonthRecoveredCount > 0
                        ? '✓ Partially Resolved in Next Month'
                        : '⏳ Action Required (Unsettled)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default GlanceMatrixBoard;

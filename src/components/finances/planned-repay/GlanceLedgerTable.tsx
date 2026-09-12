import React from 'react';
import { CalendarClock, CheckCircle2, Clock, Trash2, Sparkles, Plus } from 'lucide-react';
import { NextMonthCheckInfo } from './useGlanceData';
import type { PlannedRepayCreditItem } from '../../../types';

type FlatItem = PlannedRepayCreditItem & {
  monthLabel: string;
  columnIndex: number;
  nextCheck: NextMonthCheckInfo;
  prevRollover: { isRollover: boolean; prevMonthName: string; prevAmount: number };
};

interface GlanceLedgerTableProps {
  allFlattenedItems: FlatItem[];
  completedMonthsCount: number;
  totalMonths: number;
  totalCompleted: number;
  toggleStatusPending: boolean;
  deleteItemPending: boolean;
  onToggleItem: (item: PlannedRepayCreditItem) => void;
  onDeleteItem: (item: PlannedRepayCreditItem) => void;
  onAddSchedule: () => void;
  formatINR: (val: number) => string;
}

export default function GlanceLedgerTable({
  allFlattenedItems, completedMonthsCount, totalMonths, totalCompleted,
  toggleStatusPending, deleteItemPending,
  onToggleItem, onDeleteItem, onAddSchedule, formatINR
}: GlanceLedgerTableProps) {
  return (
    <div className="borrow-table-container glass-panel">
      <table className="borrow-data-table">
        <thead>
          <tr>
            <th>Scheduled Month</th>
            <th>Target Date</th>
            <th>Creditor Name</th>
            <th className="th-amount">Planned Amount (INR)</th>
            <th>Current Status</th>
            <th>Next-Month Constraint Check</th>
            <th className="th-action">Actions</th>
          </tr>
        </thead>
        <tbody>
          {allFlattenedItems.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-table-cell">
                <div className="empty-table-placeholder">
                  <CalendarClock size={28} />
                  <p>No planned repayment items matched your filter criteria.</p>
                  <button type="button" onClick={onAddSchedule} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    <Plus size={14} /> Add First Planned Repayment
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            allFlattenedItems.map(item => {
              const isDone = item.status === 'Completed';
              const nextCheck = item.nextCheck;
              return (
                <tr key={item.id || item._id} className="borrow-row">
                  <td><strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{item.monthLabel}</strong></td>
                  <td className="td-date"><span>{item.targetDate}</span></td>
                  <td className="td-creditor">
                    <div className="creditor-avatar-cell">
                      <div className="creditor-avatar-circle">{item.creditorName.charAt(0).toUpperCase()}</div>
                      <span className="creditor-fullname">{item.creditorName}</span>
                    </div>
                  </td>
                  <td className="td-amount borrow-amt">{formatINR(item.plannedAmount)}</td>
                  <td>
                    <span className={`badge ${isDone ? 'badge-emerald' : 'badge-amber'}`}>
                      {isDone ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {isDone ? (
                      item.prevRollover.isRollover ? (
                        <span className="glance-table-pill settled">
                          <Sparkles size={11} /> Settled rollover from {item.prevRollover.prevMonthName}
                        </span>
                      ) : (
                        <span className="glance-table-pill on-time">
                          <CheckCircle2 size={11} /> On Schedule
                        </span>
                      )
                    ) : (
                      <span className={`glance-table-pill ${nextCheck.badgeType}`}>
                        {nextCheck.badgeType === 'fulfilled' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {nextCheck.badgeText}
                      </span>
                    )}
                  </td>
                  <td className="td-action">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => onToggleItem(item)}
                        disabled={toggleStatusPending}
                        className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        {isDone ? 'Mark In-Completed' : 'Mark Completed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        disabled={deleteItemPending}
                        className="btn-icon-delete"
                        title={`Delete ${item.creditorName}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="aggregation-footer-row">
            <td colSpan={3}>
              <div className="footer-label"><span>Grand Total ({allFlattenedItems.length} items)</span></div>
            </td>
            <td className="amount-borrowed-col">
              {formatINR(allFlattenedItems.reduce((acc, it) => acc + (Number(it.plannedAmount) || 0), 0))}
            </td>
            <td colSpan={3} className="text-align-center">
              <span className="footer-reset-hint">
                {completedMonthsCount} of {totalMonths} months fulfilled ({formatINR(totalCompleted)})
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

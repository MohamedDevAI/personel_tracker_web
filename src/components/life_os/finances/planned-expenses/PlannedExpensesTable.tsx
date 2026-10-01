import {
  Target,
  Trash2,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Database,
  Calendar,
  Tag,
  FileText
} from 'lucide-react';
import { PlannedExpense } from '../../../../types';
import { formatSAR } from './plannedExpenseSync';

interface PlannedExpensesTableProps {
  plans: PlannedExpense[];
  isLoading: boolean;
  selectedMonth: string;
  selectedYear: number;
  onPlanExpense: () => void;
  onFulfillPlan: (plan: PlannedExpense) => void;
  onEditPlan: (plan: PlannedExpense) => void;
  onDeletePlan: (plan: PlannedExpense) => void;
}

export default function PlannedExpensesTable({
  plans,
  isLoading,
  onPlanExpense,
  onFulfillPlan,
  onEditPlan,
  onDeletePlan
}: PlannedExpensesTableProps) {
  // Aggregate grand totals for table footer
  const totalPlanned = plans.reduce((acc, p) => acc + (p.plannedAmount || 0), 0);
  const totalPaid = plans.reduce((acc, p) => {
    const isDone = p.isFulfilled || p.status === 'Fulfilled';
    const paidVal =
      p.paidAmount !== undefined && p.paidAmount !== null
        ? p.paidAmount
        : isDone
        ? p.plannedAmount || 0
        : 0;
    return acc + paidVal;
  }, 0);
  const totalRemaining = Math.max(0, totalPlanned - totalPaid);
  const totalFulfilledCount = plans.filter(
    p =>
      p.isFulfilled ||
      p.status === 'Fulfilled' ||
      (p.paidAmount ?? 0) >= (p.plannedAmount || 0)
  ).length;
  const overallRate =
    totalPlanned > 0 ? Math.min(100, Math.round((totalPaid / totalPlanned) * 100)) : 0;

  return (
    <div className="borrow-table-container glass-panel">
      <table className="borrow-data-table">
        <thead>
          <tr>
            <th>Expense Objective</th>
            <th className="th-amount">Planned Budget</th>
            <th className="th-amount">Amount Paid &amp; Progress</th>
            <th className="th-amount">Remaining Due</th>
            <th className="text-align-center">Fulfillment</th>
            <th className="th-action">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="empty-table-cell">
                <div className="empty-table-placeholder">
                  <Database size={28} className="animate-spin text-primary" />
                  <p>Loading planned expenses from MongoDB...</p>
                </div>
              </td>
            </tr>
          ) : plans.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-table-cell">
                <div className="empty-table-placeholder">
                  <Target size={28} />
                  <p>No planned expenses recorded for this period</p>
                  <button
                    onClick={onPlanExpense}
                    className="btn btn-secondary btn-sm"
                  >
                    + Plan An Expense
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            plans.map(plan => {
              const plannedVal = Number(plan.plannedAmount) || 0;
              const hasExplicitPaid = plan.paidAmount !== undefined && plan.paidAmount !== null;
              const isExplicitPending = plan.status === 'Pending' || plan.status === 'Planned';
              const isExplicitFulfilled =
                !isExplicitPending && (Boolean(plan.isFulfilled) || plan.status === 'Fulfilled');

              const paidVal = hasExplicitPaid
                ? plan.paidAmount!
                : isExplicitFulfilled
                  ? plannedVal
                  : 0;

              const isPartial = paidVal > 0 && plannedVal > 0 && paidVal < plannedVal;
              const isItemFulfilled =
                !isExplicitPending &&
                !isPartial &&
                ((paidVal >= plannedVal && plannedVal > 0) || (isExplicitFulfilled && !hasExplicitPaid));
              const isOverpaid = paidVal > plannedVal;
              const extraAmt = Math.max(0, paidVal - plannedVal);
              const remainingVal = Math.max(0, plannedVal - paidVal);
              const progressPct =
                plannedVal > 0 ? Math.round((paidVal / plannedVal) * 100) : 0;

              return (
                <tr
                  key={plan.id || plan.title}
                  className={`borrow-row ${isOverpaid ? 'row-overpaid' : ''}`}
                >
                  {/* Objective with Category & Due Date details */}
                  <td>
                    <div className="plan-title-cell">
                      <div className="plan-title-main-row">
                        <span className="plan-title-main">{plan.title}</span>
                        {plan.category && (
                          <span className="badge badge-category-soft">
                            <Tag size={10} /> {plan.category}
                          </span>
                        )}
                      </div>
                      <div className="plan-meta-row">
                        <span className="plan-meta-date">
                          <Calendar size={11} />{' '}
                          {plan.dueDate || `${plan.month} ${plan.year}`}
                        </span>
                        {plan.notes && (
                          <span className="plan-notes-sub" title={plan.notes}>
                            <FileText size={11} /> {plan.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Planned Budget Amount */}
                  <td className="td-amount plan-amt">
                    {formatSAR(plannedVal)}
                  </td>

                  {/* Amount Paid with Progress Bar */}
                  <td className="td-amount td-paid">
                    <div className="paid-amount-cell">
                      <div className="paid-val-row">
                        <span
                          className={isOverpaid ? 'paid-over-val text-amber' : ''}
                        >
                          {formatSAR(paidVal)}
                        </span>
                        {isOverpaid && (
                          <span
                            className="badge-extra-pill"
                            title={`Budgeted ${formatSAR(plannedVal)}, paid ${formatSAR(paidVal)}`}
                          >
                            +{formatSAR(extraAmt)} extra
                          </span>
                        )}
                      </div>

                      <div
                        className="plan-progress-bar-wrap"
                        title={`${progressPct}% of planned budget paid`}
                      >
                        <div className="plan-progress-bar-track">
                          <div
                            className={`plan-progress-bar-fill ${
                              isOverpaid
                                ? 'fill-amber'
                                : isItemFulfilled
                                ? 'fill-emerald'
                                : 'fill-primary'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, progressPct))}%`
                            }}
                          />
                        </div>
                        <span className="plan-progress-bar-text">
                          {progressPct}%
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Remaining Due */}
                  <td
                    className={`td-amount td-remaining ${
                      remainingVal === 0 ? 'zero-due' : ''
                    }`}
                  >
                    {remainingVal === 0 ? (
                      isOverpaid ? (
                        <div className="remaining-over-wrap">
                          <span className="text-emerald font-semibold">
                            ✓ Zero Due
                          </span>
                          <span className="over-indicator">
                            +SAR {extraAmt.toFixed(2)} extra
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald font-semibold">
                          ✓ Zero Due
                        </span>
                      )
                    ) : (
                      formatSAR(remainingVal)
                    )}
                  </td>

                  {/* Prominent Fulfillment Button */}
                  <td className="text-align-center">
                    <button
                      type="button"
                      onClick={() => onFulfillPlan(plan)}
                      className={`btn-table-fulfill ${
                        isOverpaid
                          ? 'overpaid'
                          : isItemFulfilled
                          ? 'fulfilled'
                          : isPartial
                          ? 'partial'
                          : 'pending'
                      }`}
                      title={`Fulfillment: ${
                        isItemFulfilled
                          ? `Fulfilled (${formatSAR(paidVal)})`
                          : isPartial
                          ? `Partially Paid (${formatSAR(paidVal)})`
                          : 'Unpaid'
                      } — Click to update payment (Full or Customized)`}
                    >
                      {isItemFulfilled ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald" />
                          <span>Fulfilled</span>
                        </>
                      ) : isPartial ? (
                        <>
                          <Clock size={13} className="text-amber" />
                          <span>Partial ({progressPct}%)</span>
                        </>
                      ) : isOverpaid ? (
                        <>
                          <AlertCircle size={13} className="text-amber" />
                          <span>Over Budget</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare size={13} />
                          <span>Record Payment</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Edit and Delete Actions */}
                  <td className="td-action">
                    <div className="table-actions-cluster">
                      <button
                        type="button"
                        onClick={() => onEditPlan(plan)}
                        className="btn-icon"
                        title="Edit Plan"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePlan(plan)}
                        className="btn-icon-delete"
                        title="Delete Plan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

        {plans.length > 0 && (
          <tfoot>
            <tr className="aggregation-footer-row">
              <td>
                <div className="footer-label">
                  <span>Grand Total ({plans.length} objectives)</span>
                </div>
              </td>
              <td className="amount-borrowed-col">
                {formatSAR(totalPlanned)}
              </td>
              <td className="amount-repaid-col">
                {formatSAR(totalPaid)}
              </td>
              <td
                className={`net-balance-col ${
                  totalRemaining === 0 ? 'settled' : 'due'
                }`}
              >
                {formatSAR(totalRemaining)}
              </td>
              <td className="text-align-center">
                <span
                  className={`badge ${
                    overallRate === 100 ? 'badge-emerald' : 'badge-amber'
                  }`}
                  title={`${totalFulfilledCount} of ${plans.length} objectives fulfilled (${overallRate}%)`}
                >
                  {totalFulfilledCount}/{plans.length} Done ({overallRate}%)
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

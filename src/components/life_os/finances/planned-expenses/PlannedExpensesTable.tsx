import {
  Target, Trash2,
  CheckSquare, Pencil, Database
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
  return (
    <div className="borrow-table-container glass-panel">
      <table className="borrow-data-table">
        <thead>
          <tr>
            <th>Expense Objective</th>
            <th className="th-amount">Planned Budget</th>
            <th className="th-amount">Amount Paid</th>
            <th className="th-amount">Remaining</th>
            <th className="th-action">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="empty-table-cell">
                <div className="empty-table-placeholder">
                  <Database size={28} className="animate-spin text-primary" />
                  <p>Loading planned expenses from MongoDB...</p>
                </div>
              </td>
            </tr>
          ) : plans.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-table-cell">
                <div className="empty-table-placeholder">
                  <Target size={28} />
                  <p>No planned expenses recorded</p>
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
              const plannedVal = plan.plannedAmount;
              const paidVal = plan.paidAmount !== undefined && plan.paidAmount !== null
                ? plan.paidAmount
                : (plan.isFulfilled ? plan.plannedAmount : 0);
              const isOverpaid = paidVal > plannedVal;
              const extraAmt = Math.max(0, paidVal - plannedVal);
              const remainingVal = Math.max(0, plannedVal - paidVal);

              return (
                <tr key={plan.id || plan.title} className={`borrow-row ${isOverpaid ? 'row-overpaid' : ''}`}>
                  {/* Title */}
                  <td>
                    <div className="plan-title-cell">
                      <span className="plan-title-main">{plan.title}</span>
                      {plan.notes && <span className="plan-notes-sub">{plan.notes}</span>}
                    </div>
                  </td>

                  {/* Planned Amount */}
                  <td className="td-amount plan-amt">
                    {formatSAR(plannedVal)}
                  </td>

                  {/* Amount Paid */}
                  <td className="td-amount td-paid">
                    <div className="paid-amount-cell">
                      <span className={isOverpaid ? 'paid-over-val text-amber' : ''}>{formatSAR(paidVal)}</span>
                      {isOverpaid && (
                        <span className="badge-extra-pill" title={`Budgeted ${formatSAR(plannedVal)}, paid ${formatSAR(paidVal)}`}>
                          +{formatSAR(extraAmt)} extra
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Remaining Due */}
                  <td className={`td-amount td-remaining ${remainingVal === 0 ? 'zero-due' : ''}`}>
                    {remainingVal === 0 ? (
                      isOverpaid ? (
                        <div className="remaining-over-wrap">
                          <span>SAR 0.00</span>
                          <span className="over-indicator">+SAR {extraAmt.toFixed(2)} extra</span>
                        </div>
                      ) : (
                        'SAR 0.00'
                      )
                    ) : (
                      formatSAR(remainingVal)
                    )}
                  </td>



                  {/* Actions */}
                  <td className="td-action">
                    <div className="table-actions-cluster">
                      <button
                        onClick={() => onFulfillPlan(plan)}
                        className="btn-icon-fulfill"
                        title="Update Fulfillment & How much paid"
                      >
                        <CheckSquare size={15} />
                      </button>
                      <button
                        onClick={() => onEditPlan(plan)}
                        className="btn-icon"
                        title="Edit Plan"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
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
      </table>
    </div>
  );
}

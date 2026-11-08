import { formatSAR } from './plannedExpenseSync';
import { KpiValueSkeleton } from '../../../common/LoadingState';

export interface PlannedBudgetSummary {
  totalPlanned: number;
  totalPaid: number;
  totalRemaining: number;
  totalOverpaid?: number;
  fulfilledCount: number;
  totalItems: number;
  fulfillmentRate: number;
}

interface PlannedExpensesKpiCardsProps {
  budgetSummary: PlannedBudgetSummary;
  selectedMonth: string;
  selectedYear: number;
  overspentItemsCount: number;
  isLoading?: boolean;
}

export default function PlannedExpensesKpiCards({
  budgetSummary,
  selectedMonth,
  selectedYear,
  overspentItemsCount,
  isLoading = false,
}: PlannedExpensesKpiCardsProps) {
  return (
    <div className="planned-kpi-grid">
      <div className="planned-kpi-card total-planned">
        <div className="planned-kpi-label">TOTAL PLANNED BUDGET</div>
        {isLoading ? (
          <KpiValueSkeleton />
        ) : (
          <>
            <div className="planned-kpi-val">{formatSAR(budgetSummary.totalPlanned)}</div>
            <div className="planned-kpi-meta">{selectedMonth} {selectedYear}</div>
          </>
        )}
      </div>

      <div className="planned-kpi-card actual-spent">
        <div className="planned-kpi-label">TOTAL AMOUNT PAID</div>
        {isLoading ? (
          <KpiValueSkeleton />
        ) : (
          <>
            <div className="planned-kpi-val text-emerald">{formatSAR(budgetSummary.totalPaid)}</div>
            <div className="planned-kpi-meta">
              {(budgetSummary.totalOverpaid ?? 0) > 0 ? (
                <span className="kpi-meta-alert">
                  +{formatSAR(budgetSummary.totalOverpaid ?? 0)} extra spent over budget
                </span>
              ) : (
                'Paid towards planned items'
              )}
            </div>
          </>
        )}
      </div>

      <div className={`planned-kpi-card ${budgetSummary.totalRemaining === 0 ? 'remaining-budget' : 'over-budget'}`}>
        <div className="planned-kpi-label">
          {budgetSummary.totalRemaining === 0 ? 'REMAINING UNPAID' : 'PENDING PAYMENT'}
        </div>
        {isLoading ? (
          <KpiValueSkeleton />
        ) : (
          <>
            <div className={`planned-kpi-val ${budgetSummary.totalRemaining === 0 ? 'remaining-text' : 'over-text'}`}>
              {formatSAR(budgetSummary.totalRemaining)}
            </div>
            <div className="planned-kpi-meta">
              {budgetSummary.totalRemaining === 0 ? 'All planned expenses fulfilled!' : 'Balance left to pay'}
            </div>
          </>
        )}
      </div>

      {!isLoading && (budgetSummary.totalOverpaid ?? 0) > 0 && (
        <div className="planned-kpi-card card-overspent">
          <div className="planned-kpi-label text-amber">EXTRA PAID (OVER BUDGET)</div>
          <div className="planned-kpi-val text-amber">+{formatSAR(budgetSummary.totalOverpaid ?? 0)}</div>
          <div className="planned-kpi-meta">
            Exceeded budget on {overspentItemsCount} item(s)
          </div>
        </div>
      )}

      <div className="planned-kpi-card burn-rate">
        <div className="planned-kpi-label">FULFILLMENT STATUS</div>
        {isLoading ? (
          <KpiValueSkeleton />
        ) : (
          <>
            <div className="planned-kpi-val">{budgetSummary.fulfillmentRate}%</div>
            <div className="planned-kpi-meta">
              <span>{budgetSummary.fulfilledCount} of {budgetSummary.totalItems} items fulfilled</span>
              <div className="mini-progress-bar">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${Math.min(100, budgetSummary.fulfillmentRate)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import {
  CreditCard,
  DebitCard,
  NetSavingsCard,
  TransactionsCountCard,
} from './FinanceSummaryCardsParts';

/**
 * Props for the FinanceSummaryCards component.
 */
export interface FinanceSummaryCardsProps {
  /** Selected month for the summary, e.g., "Jan" or "All" */
  selectedMonth: string;
  /** Selected year for the summary */
  selectedYear: number;
  /** Total credit amount for the period */
  totalCredit: number;
  /** Total debit amount for the period */
  totalDebit: number;
  /** Net balance (credit minus debit) for the period */
  netBalance: number;
  /** Number of transactions in the period */
  transactionCount: number;
}

/**
 * FinanceSummaryCards composes four focused KPI sub-cards:
 * - CreditCard: total income/inflows
 * - DebitCard: total expenses/outflows
 * - NetSavingsCard: net savings and savings rate
 * - TransactionsCountCard: number of entries
 *
 * Each sub-card lives in ./FinanceSummaryCardsParts/ and can be
 * reused independently elsewhere in the app.
 */
export default function FinanceSummaryCards({
  selectedMonth,
  selectedYear,
  totalCredit,
  totalDebit,
  netBalance,
  transactionCount,
}: FinanceSummaryCardsProps) {
  const isAll = selectedMonth === 'All';
  const periodLabel = isAll
    ? `${selectedYear}`
    : `${selectedMonth.toUpperCase()} ${selectedYear}`;

  return (
    <div className="finance-summary-grid">
      <CreditCard
        isAll={isAll}
        periodLabel={periodLabel}
        selectedYear={selectedYear}
        totalCredit={totalCredit}
      />
      <DebitCard
        isAll={isAll}
        periodLabel={periodLabel}
        selectedYear={selectedYear}
        totalDebit={totalDebit}
      />
      <NetSavingsCard
        isAll={isAll}
        periodLabel={periodLabel}
        selectedYear={selectedYear}
        netBalance={netBalance}
        totalCredit={totalCredit}
      />
      <TransactionsCountCard
        isAll={isAll}
        periodLabel={periodLabel}
        transactionCount={transactionCount}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
}

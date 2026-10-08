import { CalendarClock, ArrowDownLeft, ArrowUpRight, ArrowLeft, Table2, HandCoins } from 'lucide-react';
import { useBorrowRepayData } from './borrow-repay/useBorrowRepayData';
import BorrowKpiCards from './borrow-repay/BorrowKpiCards';
import CreditLedgerTable from './borrow-repay/CreditLedgerTable';
import AggregationTable from './borrow-repay/AggregationTable';
import BorrowRepayModal from './BorrowRepayModal';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import PlannedRepayCreditGlanceView from './planned-repay/PlannedRepayCreditGlanceView';

interface BorrowRepayViewProps {
  initialMonth?: string;
  initialYear?: string;
}

export default function BorrowRepayView({ initialMonth, initialYear }: BorrowRepayViewProps = {}) {
  const d = useBorrowRepayData(initialMonth, initialYear);

  const handleBackToAggregation = () => {
    d.setSelectedCreditorFilter('ALL');
    d.setActiveStep('aggregation');
  };

  const inspectedSummary = d.selectedCreditorFilter !== 'ALL'
    ? d.creditorSummaries.find(c => c.creditorName.toLowerCase() === d.selectedCreditorFilter.toLowerCase())
    : null;

  return (
    <div className="borrow-repay-container">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="borrow-repay-header">
        <div>
          <h2 className="borrow-repay-title">
            Borrow &amp; Repay <span className="emerald-gradient-text">Management</span>
          </h2>
        </div>

        <div className="borrow-header-buttons">
          {d.activeStep !== 'planned_repayment' && (
            <>
              <button
                onClick={() => d.handleOpenCreditModal('Borrow', d.selectedCreditorFilter !== 'ALL' ? d.selectedCreditorFilter : '')}
                className="btn btn-secondary btn-borrow-action"
              >
                <ArrowDownLeft size={16} /> Log Borrow
              </button>
              <button
                onClick={() => d.handleOpenCreditModal('Repaid', d.selectedCreditorFilter !== 'ALL' ? d.selectedCreditorFilter : '')}
                className="btn btn-primary"
              >
                <ArrowUpRight size={16} /> Log Repayment
              </button>
              <button
                onClick={() => d.handleOpenCreditModal('Credit Given', d.selectedCreditorFilter !== 'ALL' ? d.selectedCreditorFilter : '')}
                className="btn btn-credit-given-action"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
              >
                <HandCoins size={16} /> Give Credit
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Step Tabs ────────────────────────────────────────────────────────── */}
      <div className="borrow-two-step-tabs">
        <button
          onClick={handleBackToAggregation}
          className={`borrow-step-btn ${d.activeStep !== 'planned_repayment' ? 'active' : ''}`}
        >
          <Table2 size={16} />
          <span>Credit Tracker</span>
          <span className="step-counter">{d.creditorSummaries.length} Creditors</span>
        </button>

        <button
          onClick={() => d.setActiveStep('planned_repayment')}
          className={`borrow-step-btn ${d.activeStep === 'planned_repayment' ? 'active' : ''}`}
        >
          <CalendarClock size={16} />
          <span>Planned Payback</span>
          <span className="step-counter" style={{ background: 'rgba(225, 106, 14, 0.2)', color: '#be590c', border: '1px solid rgba(225, 106, 14, 0.4)' }}>
            9 Mos
          </span>
        </button>
      </div>

      {/* ── MAIN SCREEN: Creditor Aggregations (Only screen shown initially) ── */}
      {(d.activeStep === 'aggregation' || d.activeStep === 'credit_tracker') && (
        <>
          <BorrowKpiCards stats={d.stats} formatINR={d.formatINR} variant="aggregation" />

          <AggregationTable
            filteredCreditorSummaries={d.filteredCreditorSummaries}
            creditorSummaries={d.creditorSummaries}
            yearlySummaries={d.yearlySummaries}
            stats={d.stats}
            aggSearchQuery={d.aggSearchQuery}
            aggStatusFilter={d.aggStatusFilter}
            onAggSearchChange={d.setAggSearchQuery}
            onAggStatusFilterChange={d.setAggStatusFilter}
            onInspectCreditor={name => {
              d.setSelectedCreditorFilter(name);
              d.setActiveStep('creditor_transactions');
            }}
            onInspectYear={year => {
              d.setSelectedYear(year);
              d.setSelectedMonth('ALL');
              d.setSelectedCreditorFilter('ALL');
              d.setActiveStep('all_transactions');
            }}
            onGoToLedger={() => {
              d.setSelectedCreditorFilter('ALL');
              d.setActiveStep('all_transactions');
            }}
            formatINR={d.formatINR}
          />
        </>
      )}

      {/* ── INSPECTED CREDITOR TRANSACTIONS SCREEN ─────────────────────────── */}
      {d.activeStep === 'creditor_transactions' && (
        <>
          <div className="inspected-creditor-banner">
            <div className="inspected-creditor-left">
              <button
                type="button"
                onClick={handleBackToAggregation}
                className="btn-back-to-agg"
                title="Return to Aggregation Table"
              >
                <ArrowLeft size={15} /> Back to Aggregation Table
              </button>
              <div className="inspected-creditor-info">
                <div className="inspected-creditor-avatar">
                  {(d.selectedCreditorFilter || '?').charAt(0).toUpperCase()}
                </div>
                <div className="inspected-creditor-meta">
                  <div className="inspected-creditor-name-row">
                    <h3 className="inspected-creditor-name">{d.selectedCreditorFilter}</h3>
                    {inspectedSummary && (
                      <span className={`badge ${
                        inspectedSummary.status === 'Settled' ? 'badge-emerald' :
                        inspectedSummary.status === 'Credit Given' ? 'badge-sky' :
                        inspectedSummary.status === 'Overpaid' ? 'badge-purple' :
                        'badge-amber'
                      }`}>
                        {inspectedSummary.status}
                      </span>
                    )}
                  </div>
                  {inspectedSummary && (
                    <div className="inspected-creditor-stats">
                      <span className="inspected-stat-chip">
                        Total Borrowed: <strong>₹ {inspectedSummary.totalBorrowed.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="inspected-stat-chip">
                        Total Repaid: <strong>₹ {inspectedSummary.totalRepaid.toLocaleString('en-IN')}</strong>
                      </span>
                      {inspectedSummary.creditGiven && inspectedSummary.creditGiven > 0 ? (
                        <span className="inspected-stat-chip">
                          Credit Given: <strong>₹ {inspectedSummary.creditGiven.toLocaleString('en-IN')}</strong>
                        </span>
                      ) : null}
                      <span className={`inspected-stat-chip ${inspectedSummary.netBalance > 0 ? 'due' : 'settled'}`}>
                        {inspectedSummary.netBalance > 0 ? (
                          <>Due: <strong style={{ color: '#be590c' }}>₹ {inspectedSummary.netBalance.toLocaleString('en-IN')}</strong></>
                        ) : inspectedSummary.netBalance === 0 ? (
                          <strong style={{ color: '#10b981' }}>Cleared (₹0)</strong>
                        ) : inspectedSummary.status === 'Credit Given' ? (
                          <>Given: <strong style={{ color: '#e88308' }}>₹ {Math.abs(inspectedSummary.netBalance).toLocaleString('en-IN')}</strong></>
                        ) : (
                          <>Overpaid: <strong style={{ color: '#9333ea' }}>₹ {Math.abs(inspectedSummary.netBalance).toLocaleString('en-IN')}</strong></>
                        )}
                      </span>
                      <span className="inspected-stat-chip">
                        Transactions: <strong>{inspectedSummary.txCount || d.filteredRecords.length}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="inspected-creditor-actions">
              <button
                type="button"
                onClick={() => d.handleOpenCreditModal('Borrow', d.selectedCreditorFilter)}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownLeft size={14} /> Log Borrow
              </button>
              <button
                type="button"
                onClick={() => d.handleOpenCreditModal('Repaid', d.selectedCreditorFilter)}
                className="btn btn-primary btn-sm"
              >
                <ArrowUpRight size={14} /> Log Repayment
              </button>
              <button
                type="button"
                onClick={() => d.handleOpenCreditModal('Credit Given', d.selectedCreditorFilter)}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'rgba(234, 88, 12, 0.4)', color: '#ea580c', fontWeight: 600 }}
              >
                <HandCoins size={14} /> Give Credit
              </button>
            </div>
          </div>

          <CreditLedgerTable
            filteredRecords={d.filteredRecords}
            totalRecords={d.records.length}
            activeFilterTotals={d.activeFilterTotals}
            searchQuery={d.searchQuery}
            typeFilter={d.typeFilter}
            selectedMonth={d.selectedMonth}
            selectedYear={d.selectedYear}
            selectedCreditorFilter={d.selectedCreditorFilter}
            availableYears={d.availableYears}
            existingCreditors={d.existingCreditors}
            onSearchChange={d.setSearchQuery}
            onTypeFilterChange={d.setTypeFilter}
            onMonthChange={d.setSelectedMonth}
            onYearChange={d.setSelectedYear}
            onCreditorFilterChange={d.setSelectedCreditorFilter}
            onDeleteRecord={d.triggerDeleteCreditRecord}
            onAddRecord={() => d.handleOpenCreditModal('Borrow', d.selectedCreditorFilter)}
            onResetFilters={d.resetFilters}
            onBackToAggregation={handleBackToAggregation}
            formatINR={d.formatINR}
          />
        </>
      )}

      {/* ── ALL TRANSACTIONS SCREEN (Navigated from Aggregation Footer or Year) ── */}
      {d.activeStep === 'all_transactions' && (
        <>
          <div className="inspected-creditor-banner">
            <div className="inspected-creditor-left">
              <button
                type="button"
                onClick={handleBackToAggregation}
                className="btn-back-to-agg"
                title="Return to Aggregation Table"
              >
                <ArrowLeft size={15} /> Back to Aggregation Table
              </button>
              <div className="inspected-creditor-meta">
                <h3 className="inspected-creditor-name">
                  {d.selectedYear !== 'ALL' ? `Year ${d.selectedYear} Transactions` : 'All Borrow & Repay Transactions'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Showing all individual transaction entries
                </span>
              </div>
            </div>
            <div className="inspected-creditor-actions">
              <button
                type="button"
                onClick={() => d.handleOpenCreditModal('Borrow')}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownLeft size={14} /> Log Borrow
              </button>
              <button
                type="button"
                onClick={() => d.handleOpenCreditModal('Repaid')}
                className="btn btn-primary btn-sm"
              >
                <ArrowUpRight size={14} /> Log Repayment
              </button>
            </div>
          </div>

          <CreditLedgerTable
            filteredRecords={d.filteredRecords}
            totalRecords={d.records.length}
            activeFilterTotals={d.activeFilterTotals}
            searchQuery={d.searchQuery}
            typeFilter={d.typeFilter}
            selectedMonth={d.selectedMonth}
            selectedYear={d.selectedYear}
            selectedCreditorFilter={d.selectedCreditorFilter}
            availableYears={d.availableYears}
            existingCreditors={d.existingCreditors}
            onSearchChange={d.setSearchQuery}
            onTypeFilterChange={d.setTypeFilter}
            onMonthChange={d.setSelectedMonth}
            onYearChange={d.setSelectedYear}
            onCreditorFilterChange={d.setSelectedCreditorFilter}
            onDeleteRecord={d.triggerDeleteCreditRecord}
            onAddRecord={() => d.handleOpenCreditModal('Borrow')}
            onResetFilters={d.resetFilters}
            onBackToAggregation={handleBackToAggregation}
            formatINR={d.formatINR}
          />
        </>
      )}

      {/* ── STEP 3: Planned Repayment Schedule ──────────────────────────────── */}
      {d.activeStep === 'planned_repayment' && (
        <PlannedRepayCreditGlanceView
          actualRecords={d.records}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <BorrowRepayModal
        isOpen={d.isCreditModalOpen}
        onClose={() => d.setIsCreditModalOpen(false)}
        onSubmit={d.handleAddCreditRecord}
        existingCreditors={d.existingCreditors}
        initialType={d.modalInitialType}
        initialCreditor={d.modalInitialCreditor}
      />

      <ConfirmDeleteModal
        isOpen={d.deleteConfirm.isOpen}
        title={d.deleteConfirm.type === 'credit_record' ? 'Delete Credit Transaction' : 'Delete Planned Repayment'}
        message="Are you sure you want to delete this data? Please choose Yes to delete or No to cancel."
        itemName={d.deleteConfirm.itemName}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        onConfirm={d.handleConfirmDelete}
        onCancel={() => d.setDeleteConfirm({ isOpen: false, type: 'credit_record', id: '', itemName: '' })}
      />
    </div>
  );
}

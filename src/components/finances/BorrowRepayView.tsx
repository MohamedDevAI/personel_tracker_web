import React from 'react';
import { HandCoins, Table2, CalendarClock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useBorrowRepayData } from './borrow-repay/useBorrowRepayData';
import BorrowKpiCards from './borrow-repay/BorrowKpiCards';
import CreditorsGrid from './borrow-repay/CreditorsGrid';
import CreditLedgerTable from './borrow-repay/CreditLedgerTable';
import AggregationTable from './borrow-repay/AggregationTable';
import BorrowRepayModal from './BorrowRepayModal';
import PlannedRepaymentModal from './PlannedRepaymentModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import PlannedRepayCreditGlanceView from './planned-repay/PlannedRepayCreditGlanceView';

interface BorrowRepayViewProps {
  initialMonth?: string;
  initialYear?: string;
}

export default function BorrowRepayView({ initialMonth, initialYear }: BorrowRepayViewProps = {}) {
  const d = useBorrowRepayData(initialMonth, initialYear);

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
          {d.activeStep !== 'planned_repayment' ? (
            <>
              <button onClick={() => d.handleOpenCreditModal('Borrow')} className="btn btn-secondary btn-borrow-action">
                <ArrowDownLeft size={16} /> + Log Borrow
              </button>
              <button onClick={() => d.handleOpenCreditModal('Repaid')} className="btn btn-primary">
                <ArrowUpRight size={16} /> + Log Repayment
              </button>
            </>
          ) : (
            <button onClick={() => d.setIsPlannedModalOpen(true)} className="btn btn-primary">
              <CalendarClock size={16} /> + Schedule Planned Repayment
            </button>
          )}
        </div>
      </div>

      {/* ── Step Tabs ────────────────────────────────────────────────────────── */}
      <div className="borrow-two-step-tabs">
        <button
          onClick={() => d.setActiveStep('credit_tracker')}
          className={`borrow-step-btn ${d.activeStep === 'credit_tracker' ? 'active' : ''}`}
        >
          <HandCoins size={16} />
          <span>Step 1: Credit Tracker (Ledger &amp; Grid)</span>
          <span className="step-counter">{d.records.length}</span>
        </button>

        <button
          onClick={() => d.setActiveStep('aggregation')}
          className={`borrow-step-btn ${d.activeStep === 'aggregation' ? 'active' : ''}`}
        >
          <Table2 size={16} />
          <span>Step 2: Creditor Aggregations (Table)</span>
          <span className="step-counter">{d.creditorSummaries.length}</span>
        </button>

        <button
          onClick={() => d.setActiveStep('planned_repayment')}
          className={`borrow-step-btn ${d.activeStep === 'planned_repayment' ? 'active' : ''}`}
        >
          <CalendarClock size={16} />
          <span>Step 3: 2026 Planned Schedule (Single Glance)</span>
          <span className="step-counter" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            9 Mos
          </span>
        </button>
      </div>

      {/* ── STEP 1: Credit Tracker ───────────────────────────────────────────── */}
      {d.activeStep === 'credit_tracker' && (
        <>
          <BorrowKpiCards stats={d.stats} formatINR={d.formatINR} variant="tracker" />

          <CreditorsGrid
            creditorSummaries={d.creditorSummaries}
            selectedCreditorFilter={d.selectedCreditorFilter}
            filteredRecordsCount={d.filteredRecords.length}
            onSelectCreditor={name => d.setSelectedCreditorFilter(prev => prev === name ? 'ALL' : name)}
            onClearFilter={() => d.setSelectedCreditorFilter('ALL')}
            onGoToAggregation={() => d.setActiveStep('aggregation')}
            onSettleBalance={name => d.handleOpenCreditModal('Repaid', name)}
            formatINR={d.formatINR}
          />

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
            formatINR={d.formatINR}
          />
        </>
      )}

      {/* ── STEP 2: Creditor & Yearly Aggregations ───────────────────────────── */}
      {d.activeStep === 'aggregation' && (
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
            onInspectCreditor={name => { d.setSelectedCreditorFilter(name); d.setActiveStep('credit_tracker'); }}
            onInspectYear={year => { d.setSelectedYear(year); d.setSelectedMonth('ALL'); d.setSelectedCreditorFilter('ALL'); d.setActiveStep('credit_tracker'); }}
            onGoToLedger={() => { d.setSelectedCreditorFilter('ALL'); d.setActiveStep('credit_tracker'); }}
            formatINR={d.formatINR}
          />
        </>
      )}

      {/* ── STEP 3: Planned Repayment Schedule ──────────────────────────────── */}
      {d.activeStep === 'planned_repayment' && (
        <PlannedRepayCreditGlanceView
          onOpenScheduleModal={() => d.setIsPlannedModalOpen(true)}
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

      <PlannedRepaymentModal
        isOpen={d.isPlannedModalOpen}
        onClose={() => d.setIsPlannedModalOpen(false)}
        onSubmit={d.handleAddPlannedRepayment}
        existingCreditors={d.existingCreditors}
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

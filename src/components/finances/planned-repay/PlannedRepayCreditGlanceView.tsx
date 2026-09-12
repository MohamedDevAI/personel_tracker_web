import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { BorrowRepayRecord } from '../../../types';
import { useGlanceData } from './useGlanceData';
import GlanceKpiStats from './GlanceKpiStats';
import GlanceToolbar from './GlanceToolbar';
import GlanceMatrixBoard from './GlanceMatrixBoard';
import GlanceLedgerTable from './GlanceLedgerTable';
import GlanceAddModal from './GlanceAddModal';
import GlanceDeleteModal from './GlanceDeleteModal';

interface PlannedRepayCreditGlanceViewProps {
  onOpenScheduleModal?: () => void;
  actualRecords?: BorrowRepayRecord[];
}

export default function PlannedRepayCreditGlanceView({
  onOpenScheduleModal,
  actualRecords = []
}: PlannedRepayCreditGlanceViewProps) {
  const g = useGlanceData(actualRecords);

  if (g.isLoading) {
    return (
      <div className="glance-loading-state glass-panel">
        <RefreshCw className="spin-icon" size={28} />
        <h4>Loading Planned Repayments Matrix...</h4>
      </div>
    );
  }

  if (g.error || !g.matrix) {
    return (
      <div className="glance-error-state glass-panel">
        <AlertCircle size={32} className="error-icon" />
        <h4>Failed to load planned repayments schedule</h4>
        <button onClick={() => g.refetch()} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const m = g.matrix;

  return (
    <div className="glance-schedule-wrapper">

      {/* ── KPI Stats ──────────────────────────────────────────────────────── */}
      <GlanceKpiStats
        totalPlanned={m.totalPlanned}
        effectiveFulfilled={g.effectiveFulfilled}
        truePending={g.truePending}
        completedMonthsCount={m.completedMonthsCount}
        totalMonths={m.totalMonths}
        totalItems={m.totalItems}
        rolloverStats={g.rolloverStats}
        formatINR={g.formatINR}
      />

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <GlanceToolbar
        viewMode={g.viewMode}
        statusFilter={g.statusFilter}
        selectedCreditor={g.selectedCreditor}
        searchQuery={g.searchQuery}
        uniqueCreditors={g.uniqueCreditors}
        totalMonths={m.totalMonths}
        completedMonthsCount={m.completedMonthsCount}
        rolloverCount={g.rolloverStats.countRecovered}
        isFetching={g.isFetching}
        onViewModeChange={g.setViewMode}
        onStatusFilterChange={g.setStatusFilter}
        onCreditorChange={g.setSelectedCreditor}
        onSearchChange={g.setSearchQuery}
        onRefresh={() => g.refetch()}
        onAddSchedule={() => g.setIsAddModalOpen(true)}
      />

      {/* ── Matrix Board ───────────────────────────────────────────────────── */}
      {g.viewMode === 'matrix' && (
        <GlanceMatrixBoard
          filteredColumns={g.filteredColumns}
          allColumns={m.columns}
          formatINR={g.formatINR}
          toggleStatusPending={g.toggleStatusMutation.isPending}
          deleteItemPending={g.deleteItemMutation.isPending}
          onToggleItem={g.handleToggleItemStatus}
          onToggleColumn={g.handleToggleColumnAll}
          onDeleteItem={g.triggerDeleteItem}
          checkNextMonthFulfillment={g.checkNextMonthFulfillment}
          checkIsPreviousMonthRollover={g.checkIsPreviousMonthRollover}
        />
      )}

      {/* ── Detailed Ledger Table ──────────────────────────────────────────── */}
      {g.viewMode === 'table' && (
        <GlanceLedgerTable
          allFlattenedItems={g.allFlattenedItems}
          completedMonthsCount={m.completedMonthsCount}
          totalMonths={m.totalMonths}
          totalCompleted={m.totalCompleted}
          toggleStatusPending={g.toggleStatusMutation.isPending}
          deleteItemPending={g.deleteItemMutation.isPending}
          onToggleItem={g.handleToggleItemStatus}
          onDeleteItem={g.triggerDeleteItem}
          onAddSchedule={() => g.setIsAddModalOpen(true)}
          formatINR={g.formatINR}
        />
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      <GlanceAddModal
        isOpen={g.isAddModalOpen}
        addForm={g.addForm}
        uniqueCreditors={g.uniqueCreditors}
        isSaving={g.createItemMutation.isPending}
        onClose={() => g.setIsAddModalOpen(false)}
        onFormChange={g.setAddForm}
        onSubmit={g.handleAddSubmit}
      />

      {/* ── Delete Modal ───────────────────────────────────────────────────── */}
      <GlanceDeleteModal
        isOpen={g.deleteConfirm.isOpen}
        creditorName={g.deleteConfirm.creditorName}
        amount={g.deleteConfirm.amount}
        month={g.deleteConfirm.month}
        isDeleting={g.deleteItemMutation.isPending}
        onClose={() => g.setDeleteConfirm({ isOpen: false, id: '', creditorName: '', amount: 0, month: '' })}
        onConfirm={g.handleConfirmDelete}
        formatINR={g.formatINR}
      />

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  HandCoins, Plus, Search, Filter, ArrowDownLeft, ArrowUpRight, 
  Trash2, CheckCircle2, Clock, CalendarClock, User, Calendar, 
  DollarSign, CheckSquare
} from 'lucide-react';
import { BorrowRepayRecord, BorrowRepayType, PlannedRepayment, PlannedRepaymentStatus } from '../../types';
import { borrowRepayApi } from '../../services/borrowRepayApi';
import BorrowRepayModal from './BorrowRepayModal';
import PlannedRepaymentModal from './PlannedRepaymentModal';

type BorrowRepayStep = 'planned_repayment' | 'credit_tracker';

export default function BorrowRepayView() {
  const [activeStep, setActiveStep] = useState<BorrowRepayStep>('credit_tracker');

  // Step 2 Data: Credit Tracker
  const [records, setRecords] = useState<BorrowRepayRecord[]>(() => borrowRepayApi.getRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | BorrowRepayType>('ALL');
  const [selectedCreditorFilter, setSelectedCreditorFilter] = useState<string>('ALL');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<BorrowRepayType>('Borrow');
  const [modalInitialCreditor, setModalInitialCreditor] = useState<string>('');

  // Step 1 Data: Planned Repayments
  const [plannedRepayments, setPlannedRepayments] = useState<PlannedRepayment[]>(() => borrowRepayApi.getPlannedRepayments());
  const [isPlannedModalOpen, setIsPlannedModalOpen] = useState(false);
  const [plannedStatusFilter, setPlannedStatusFilter] = useState<'ALL' | PlannedRepaymentStatus>('ALL');

  // Reload data
  const refreshAllData = () => {
    setRecords(borrowRepayApi.getRecords());
    setPlannedRepayments(borrowRepayApi.getPlannedRepayments());
  };

  // Creditor summaries & stats (INR)
  const creditorSummaries = useMemo(() => {
    return borrowRepayApi.getCreditorSummaries();
  }, [records]);

  const stats = useMemo(() => {
    return borrowRepayApi.getOverallStats();
  }, [records]);

  // Unique creditor list for filters & suggestions
  const existingCreditors = useMemo(() => {
    const fromRecords = records.map(r => r.creditorName.trim());
    const fromPlans = plannedRepayments.map(p => p.creditorName.trim());
    return Array.from(new Set([...fromRecords, ...fromPlans])).filter(Boolean);
  }, [records, plannedRepayments]);

  // Filtered Credit Tracker records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
      const matchesCreditor = selectedCreditorFilter === 'ALL' || r.creditorName === selectedCreditorFilter;
      return matchesSearch && matchesType && matchesCreditor;
    });
  }, [records, searchQuery, typeFilter, selectedCreditorFilter]);

  // Filtered Planned Repayments
  const filteredPlannedRepayments = useMemo(() => {
    return plannedRepayments.filter(p => {
      const matchesSearch = p.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = plannedStatusFilter === 'ALL' || p.status === plannedStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [plannedRepayments, searchQuery, plannedStatusFilter]);

  // Planned Repayments Stats
  const plannedStats = useMemo(() => {
    const totalPlanned = plannedRepayments.reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const totalPaid = plannedRepayments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const pendingScheduled = totalPlanned - totalPaid;
    return {
      totalPlanned,
      totalPaid,
      pendingScheduled: Math.max(0, pendingScheduled),
      scheduledCount: plannedRepayments.filter(p => p.status === 'Scheduled').length
    };
  }, [plannedRepayments]);

  // Actions for Credit Tracker
  const handleAddCreditRecord = (newRecord: Omit<BorrowRepayRecord, 'id' | 'createdAt'>) => {
    borrowRepayApi.createRecord(newRecord);
    refreshAllData();
  };

  const handleDeleteCreditRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this borrow/repay entry?')) {
      borrowRepayApi.deleteRecord(id);
      refreshAllData();
    }
  };

  const handleOpenCreditModal = (type: BorrowRepayType, creditorName: string = '') => {
    setModalInitialType(type);
    setModalInitialCreditor(creditorName);
    setIsCreditModalOpen(true);
  };

  // Actions for Planned Repayments
  const handleAddPlannedRepayment = (newPlan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => {
    borrowRepayApi.createPlannedRepayment(newPlan);
    refreshAllData();
  };

  const handleDeletePlannedRepayment = (id: string) => {
    if (window.confirm('Delete this planned repayment?')) {
      borrowRepayApi.deletePlannedRepayment(id);
      refreshAllData();
    }
  };

  const handleMarkAsPaid = (id: string) => {
    const res = borrowRepayApi.markPlannedRepaymentAsPaid(id);
    if (res) {
      refreshAllData();
      alert(`Marked repayment to ${res.plan.creditorName} as Paid and recorded ₹${res.plan.plannedAmount} into Credit Tracker!`);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="borrow-repay-container">
      
      {/* Top Header */}
      <div className="borrow-repay-header">
        <div>
          <h2 className="borrow-repay-title">
            Borrow & Repay <span className="emerald-gradient-text">Management</span>
          </h2>
          <p className="borrow-repay-subtitle">
            Split into two steps: Plan your debt repayments, and track all actual borrow & repaid transactions. All values in Indian Rupees (₹).
          </p>
        </div>

        {/* Action Buttons depending on Step */}
        <div className="borrow-header-buttons">
          {activeStep === 'credit_tracker' ? (
            <>
              <button 
                onClick={() => handleOpenCreditModal('Borrow')}
                className="btn btn-secondary btn-borrow-action"
              >
                <ArrowDownLeft size={16} /> + Log Borrow
              </button>
              <button 
                onClick={() => handleOpenCreditModal('Repaid')}
                className="btn btn-primary"
              >
                <ArrowUpRight size={16} /> + Log Repayment
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsPlannedModalOpen(true)}
              className="btn btn-primary"
            >
              <CalendarClock size={16} /> + Schedule Planned Repayment
            </button>
          )}
        </div>
      </div>

      {/* Two-Step Switcher: 1. Planned Repayment | 2. Credit Tracker */}
      <div className="borrow-two-step-tabs">
        <button
          onClick={() => setActiveStep('credit_tracker')}
          className={`borrow-step-btn ${activeStep === 'credit_tracker' ? 'active' : ''}`}
        >
          <HandCoins size={16} />
          <span>Step 1: Credit Tracker (Actual Ledger)</span>
          <span className="step-counter">{records.length}</span>
        </button>

        <button
          onClick={() => setActiveStep('planned_repayment')}
          className={`borrow-step-btn ${activeStep === 'planned_repayment' ? 'active' : ''}`}
        >
          <CalendarClock size={16} />
          <span>Step 2: Planned Repayment (Schedule)</span>
          {plannedStats.scheduledCount > 0 && (
            <span className="step-counter alert">{plannedStats.scheduledCount}</span>
          )}
        </button>
      </div>

      {/* =========================================================
          STEP 1: CREDIT TRACKER (ACTUAL LEDGER IN INR ₹)
          ========================================================= */}
      {activeStep === 'credit_tracker' && (
        <>
          {/* Top KPI Cards (INR ₹) */}
          <div className="borrow-kpi-grid">
            <div className="borrow-kpi-card borrow-card">
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">TOTAL BORROWED</span>
                <div className="borrow-kpi-icon borrow-icon">
                  <ArrowDownLeft size={16} />
                </div>
              </div>
              <div className="borrow-kpi-val borrow-text">
                {formatINR(stats.totalBorrowed)}
              </div>
              <div className="borrow-kpi-meta">Money received as credit/loans</div>
            </div>

            <div className="borrow-kpi-card repaid-card">
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">TOTAL REPAID</span>
                <div className="borrow-kpi-icon repaid-icon">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="borrow-kpi-val repaid-text">
                {formatINR(stats.totalRepaid)}
              </div>
              <div className="borrow-kpi-meta">Total debt returned to creditors</div>
            </div>

            <div className={`borrow-kpi-card ${stats.netOutstanding > 0 ? 'outstanding-card' : 'settled-card'}`}>
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">NET OUTSTANDING</span>
                <div className="borrow-kpi-icon outstanding-icon">
                  <HandCoins size={16} />
                </div>
              </div>
              <div className={`borrow-kpi-val ${stats.netOutstanding > 0 ? 'outstanding-text' : 'settled-text'}`}>
                {formatINR(stats.netOutstanding)}
              </div>
              <div className="borrow-kpi-meta">
                {stats.netOutstanding > 0 
                  ? `${stats.activeCreditorsCount} creditor(s) pending settlement`
                  : 'All borrowed money fully settled!'}
              </div>
            </div>
          </div>

          {/* Creditors Balance Breakdown Cards */}
          {creditorSummaries.length > 0 && (
            <div className="creditors-section">
              <h3 className="creditors-section-title">
                <User size={16} /> Creditors Summary
              </h3>
              <div className="creditors-chip-grid">
                {creditorSummaries.map(c => (
                  <div 
                    key={c.creditorName}
                    onClick={() => setSelectedCreditorFilter(prev => prev === c.creditorName ? 'ALL' : c.creditorName)}
                    className={`creditor-chip-card ${selectedCreditorFilter === c.creditorName ? 'active-filter' : ''} ${c.status === 'Settled' ? 'settled' : 'pending'}`}
                  >
                    <div className="creditor-chip-top">
                      <span className="creditor-chip-name">{c.creditorName}</span>
                      <span className={`badge ${c.status === 'Settled' ? 'badge-emerald' : 'badge-amber'}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="creditor-chip-balance">
                      {c.netBalance > 0 ? (
                        <span className="balance-due">Due: {formatINR(c.netBalance)}</span>
                      ) : (
                        <span className="balance-cleared">Fully Cleared (₹0)</span>
                      )}
                    </div>
                    <div className="creditor-chip-actions">
                      {c.netBalance > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreditModal('Repaid', c.creditorName);
                          }}
                          className="btn-link-settle"
                        >
                          Settle Balance →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="borrow-table-toolbar">
            <div className="borrow-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Creditor Name or Notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="borrow-search-input"
              />
            </div>

            <div className="borrow-filters-group">
              <div className="filter-select-wrapper">
                <Filter size={14} className="filter-icon" />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="borrow-select-filter"
                >
                  <option value="ALL">All Types</option>
                  <option value="Borrow">Borrow (+INR)</option>
                  <option value="Repaid">Repaid (-INR)</option>
                </select>
              </div>

              {existingCreditors.length > 0 && (
                <div className="filter-select-wrapper">
                  <User size={14} className="filter-icon" />
                  <select
                    value={selectedCreditorFilter}
                    onChange={e => setSelectedCreditorFilter(e.target.value)}
                    className="borrow-select-filter"
                  >
                    <option value="ALL">All Creditors</option>
                    {existingCreditors.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Credit Tracker Table */}
          <div className="borrow-table-container glass-panel">
            <table className="borrow-data-table">
              <thead>
                <tr>
                  <th>Creditor Name</th>
                  <th>Date</th>
                  <th>Transaction Type</th>
                  <th className="th-amount">Amount (INR)</th>
                  <th>Notes</th>
                  <th className="th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table-cell">
                      <div className="empty-table-placeholder">
                        <HandCoins size={28} />
                        <p>No borrow or repayment records found.</p>
                        <button 
                          onClick={() => handleOpenCreditModal('Borrow')}
                          className="btn btn-secondary btn-sm"
                        >
                          + Add First Record
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(item => {
                    const isBorrow = item.type === 'Borrow';
                    return (
                      <tr key={item.id} className="borrow-row">
                        <td className="td-creditor">
                          <div className="creditor-avatar-cell">
                            <div className="creditor-avatar-circle">
                              {item.creditorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="creditor-fullname">{item.creditorName}</span>
                          </div>
                        </td>

                        <td className="td-date">
                          <div className="date-cell-flex">
                            <Calendar size={13} className="date-icon" />
                            <span>{item.date}</span>
                          </div>
                        </td>

                        <td className="td-type">
                          <span className={`badge ${isBorrow ? 'badge-borrow' : 'badge-repaid'}`}>
                            {isBorrow ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {item.type}
                          </span>
                        </td>

                        <td className={`td-amount ${isBorrow ? 'borrow-amt' : 'repaid-amt'}`}>
                          {isBorrow ? `+₹ ${Number(item.amount).toLocaleString('en-IN')}` : `-₹ ${Number(item.amount).toLocaleString('en-IN')}`}
                        </td>

                        <td className="td-notes">
                          <span className="notes-text">{item.notes || '—'}</span>
                        </td>

                        <td className="td-action">
                          <button
                            onClick={() => handleDeleteCreditRecord(item.id)}
                            className="btn-icon-delete"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =========================================================
          STEP 2: PLANNED REPAYMENT (SCHEDULE & TARGETS IN INR ₹)
          ========================================================= */}
      {activeStep === 'planned_repayment' && (
        <>
          {/* Planned Repayment KPI Cards */}
          <div className="borrow-kpi-grid">
            <div className="planned-kpi-card total-planned">
              <div className="planned-kpi-label">TOTAL PLANNED REPAYMENTS</div>
              <div className="planned-kpi-val">{formatINR(plannedStats.totalPlanned)}</div>
              <div className="planned-kpi-meta">Scheduled debt repayments</div>
            </div>

            <div className="planned-kpi-card actual-spent">
              <div className="planned-kpi-label">FULFILLED / COMPLETED</div>
              <div className="planned-kpi-val repaid-text">{formatINR(plannedStats.totalPaid)}</div>
              <div className="planned-kpi-meta">Paid and logged into ledger</div>
            </div>

            <div className="planned-kpi-card outstanding-card">
              <div className="planned-kpi-label">PENDING REPAYMENTS</div>
              <div className="planned-kpi-val outstanding-text">{formatINR(plannedStats.pendingScheduled)}</div>
              <div className="planned-kpi-meta">Remaining planned payoff</div>
            </div>
          </div>

          {/* Toolbar for Planned Repayments */}
          <div className="borrow-table-toolbar">
            <div className="borrow-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search planned repayments by creditor or notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="borrow-search-input"
              />
            </div>

            <div className="filter-select-wrapper">
              <Filter size={14} className="filter-icon" />
              <select
                value={plannedStatusFilter}
                onChange={e => setPlannedStatusFilter(e.target.value as any)}
                className="borrow-select-filter"
              >
                <option value="ALL">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Planned Repayments Table */}
          <div className="borrow-table-container glass-panel">
            <table className="borrow-data-table">
              <thead>
                <tr>
                  <th>Creditor Name</th>
                  <th>Target Date</th>
                  <th className="th-amount">Planned Amount (INR)</th>
                  <th>Status</th>
                  <th>Installment Notes</th>
                  <th className="th-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlannedRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table-cell">
                      <div className="empty-table-placeholder">
                        <CalendarClock size={28} />
                        <p>No planned repayments scheduled yet.</p>
                        <button 
                          onClick={() => setIsPlannedModalOpen(true)}
                          className="btn btn-secondary btn-sm"
                        >
                          + Schedule A Repayment
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlannedRepayments.map(plan => {
                    const isPaid = plan.status === 'Paid';
                    return (
                      <tr key={plan.id} className="borrow-row">
                        <td className="td-creditor">
                          <div className="creditor-avatar-cell">
                            <div className="creditor-avatar-circle">
                              {plan.creditorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="creditor-fullname">{plan.creditorName}</span>
                          </div>
                        </td>

                        <td className="td-date">
                          <div className="date-cell-flex">
                            <Calendar size={13} className="date-icon" />
                            <span>{plan.targetDate}</span>
                          </div>
                        </td>

                        <td className="td-amount repaid-amt">
                          ₹ {Number(plan.plannedAmount).toLocaleString('en-IN')}
                        </td>

                        <td>
                          <span className={`badge ${isPaid ? 'badge-emerald' : 'badge-amber'}`}>
                            {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {plan.status}
                          </span>
                        </td>

                        <td className="td-notes">
                          <span className="notes-text">{plan.notes || '—'}</span>
                        </td>

                        <td className="td-action">
                          <div className="actions-inline-group">
                            {!isPaid && (
                              <button
                                onClick={() => handleMarkAsPaid(plan.id)}
                                className="btn-table-action-pay"
                                title="Mark as Paid and Log into Credit Tracker"
                              >
                                <CheckSquare size={14} /> Pay
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePlannedRepayment(plan.id)}
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
        </>
      )}

      {/* Modals */}
      <BorrowRepayModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onSubmit={handleAddCreditRecord}
        existingCreditors={existingCreditors}
        initialType={modalInitialType}
        initialCreditor={modalInitialCreditor}
      />

      <PlannedRepaymentModal
        isOpen={isPlannedModalOpen}
        onClose={() => setIsPlannedModalOpen(false)}
        onSubmit={handleAddPlannedRepayment}
        existingCreditors={existingCreditors}
      />

    </div>
  );
}

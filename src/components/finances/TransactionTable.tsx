import React from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CreditCard, 
  Building2, 
  Coins, 
  Search 
} from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency } from './financeConstants';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  selectedMonth: string;
  selectedYear: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: 'ALL' | 'Credit' | 'Debit';
  setTypeFilter: (type: 'ALL' | 'Credit' | 'Debit') => void;
  activeTab: 'transactions' | 'categories';
  setActiveTab: (tab: 'transactions' | 'categories') => void;
  categoriesCount: number;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: (type?: TransactionType) => void;
}

export default function TransactionTable({
  transactions,
  isLoading,
  selectedMonth,
  selectedYear,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  activeTab,
  setActiveTab,
  categoriesCount,
  onDeleteTransaction,
  onOpenAddModal
}: TransactionTableProps) {
  
  const renderPaymentIcon = (method?: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('card')) return <CreditCard size={14} />;
    if (m.includes('cash')) return <Coins size={14} />;
    return <Building2 size={14} />;
  };

  return (
    <div>
      {/* Subheader & Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* View switcher tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={activeTab === 'transactions' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '0.82rem', padding: '7px 16px' }}
          >
            Transactions List ({transactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={activeTab === 'categories' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '0.82rem', padding: '7px 16px' }}
          >
            Categories ({categoriesCount})
          </button>
        </div>

        {/* Search & Type filter */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search note, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  width: '180px'
                }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{
                padding: '6px 10px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL" style={{ background: '#101522' }}>All Types</option>
              <option value="Credit" style={{ background: '#101522' }}>Credit (+)</option>
              <option value="Debit" style={{ background: '#101522' }}>Debit (-)</option>
            </select>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Calendar size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
              No Transactions in {selectedMonth === 'All' ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 20px' }}>
              There are no financial logs matching your current filter. You can add a transaction for this month right away.
            </p>
            <button 
              onClick={() => onOpenAddModal('Credit')}
              className="btn btn-primary"
            >
              <Plus size={16} /> Log Entry for {selectedMonth === 'All' ? 'Year' : selectedMonth}
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '14px 20px' }}>DATE & MONTH</th>
                  <th style={{ padding: '14px 20px' }}>DESCRIPTION</th>
                  <th style={{ padding: '14px 20px' }}>CATEGORY</th>
                  <th style={{ padding: '14px 20px' }}>PAYMENT METHOD</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>AMOUNT (SAR)</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(item => {
                  const isCredit = String(item.type).toUpperCase() === 'CREDIT';
                  const itemId = item._id || item.id || '';
                  const dateDisplay = item.transactionDate || (item.date ? item.date.split('T')[0] : 'N/A');
                  const amountVal = Number(item.amount || item.amountSar || 0);

                  return (
                    <tr 
                      key={itemId} 
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)', 
                        transition: 'background 0.2s ease',
                      }}
                      className="table-row-hover"
                    >
                      {/* Date & Month */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-indigo" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                            {item.month || 'Mar'}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {dateDisplay}
                          </span>
                        </div>
                      </td>

                      {/* Description / Note */}
                      <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.92rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isCredit ? '#34d399' : '#fb7185',
                            flexShrink: 0
                          }}>
                            {isCredit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          </div>
                          <div>
                            <span>{item.description || item.note || 'Untitled'}</span>
                            {item._id && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                ID: {item._id.slice(0, 10)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 20px' }}>
                        <span className={isCredit ? "badge badge-emerald" : "badge badge-indigo"}>
                          {item.category || item.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {renderPaymentIcon(item.paymentMethod)}
                          <span>{item.paymentMethod || 'Account'}</span>
                        </div>
                      </td>

                      {/* Amount SAR */}
                      <td style={{
                        padding: '14px 20px', 
                        textAlign: 'right', 
                        fontWeight: 700, 
                        fontSize: '0.98rem', 
                        fontFamily: 'var(--font-display)',
                        color: isCredit ? '#10b981' : '#f43f5e'
                      }}>
                        {isCredit ? '+' : '-'}SAR {formatCurrency(amountVal)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => itemId && onDeleteTransaction(itemId)}
                          className="btn-icon" 
                          style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

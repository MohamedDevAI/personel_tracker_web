import React from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CreditCard, 
  Building2, 
  Coins 
} from 'lucide-react';
import { Category, Transaction, TransactionType } from '../../types';
import { formatCurrency } from './financeConstants';

interface TransactionTableProps {
  transactions: Transaction[];
  categories?: Category[];
  isLoading: boolean;
  selectedMonth: string;
  selectedYear: number;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: (type?: TransactionType) => void;
}

export default function TransactionTable({
  transactions,
  categories = [],
  isLoading,
  selectedMonth,
  selectedYear,
  onDeleteTransaction,
  onOpenAddModal
}: TransactionTableProps) {
  
  const resolveCategory = (item: Transaction) => {
    if (categories && categories.length > 0) {
      const match = categories.find(c =>
        (c.id && (c.id === item.category || c.id === item.categoryId)) ||
        (c._id && (c._id === item.category || c._id === item.categoryId)) ||
        (c.name && item.category && c.name.toLowerCase() === item.category.toLowerCase()) ||
        (c.name && item.categoryName && c.name.toLowerCase() === item.categoryName.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  const renderPaymentIcon = (method?: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('card')) return <CreditCard size={14} />;
    if (m.includes('cash')) return <Coins size={14} />;
    return <Building2 size={14} />;
  };

  return (
    <div className="glass-panel finance-card-fixed-90vh">
      {isLoading ? (
        <div className="finance-loading-state">
          Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="finance-empty-state">
          <div className="finance-empty-icon">
            <Calendar size={28} />
          </div>
          <h3 className="finance-empty-title">
            No Transactions in {selectedMonth === 'All' ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`}
          </h3>
          <p className="finance-empty-desc">
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
        <div className="finance-table-scroll">
          <table className="finance-table">
            <thead>
              <tr>
                <th>DATE & MONTH</th>
                <th>DESCRIPTION</th>
                <th>CATEGORY</th>
                <th>PAYMENT METHOD</th>
                <th className="th-right">AMOUNT (SAR)</th>
                <th className="th-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(item => {
                const isCredit = String(item.type).toUpperCase() === 'CREDIT';
                const itemId = item._id || item.id || '';
                const dateDisplay = item.transactionDate || (item.date ? item.date.split('T')[0] : 'N/A');
                const amountVal = Number(item.amount || item.amountSar || 0);

                return (
                  <tr key={itemId} className="table-row-hover">
                    {/* Date & Month */}
                    <td>
                      <div className="tx-date-cell">
                        <span className="badge badge-indigo tx-month-badge">
                          {item.month || 'Mar'}
                        </span>
                        <span className="tx-date-text">
                          {dateDisplay}
                        </span>
                      </div>
                    </td>

                    {/* Description / Note */}
                    <td className="tx-desc-cell">
                      <div className="tx-desc-wrapper">
                        <div className={`tx-type-icon ${isCredit ? 'tx-type-credit' : 'tx-type-debit'}`}>
                          {isCredit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                          <span>{item.description || item.note || 'Untitled'}</span>
                          {item._id && (
                            <div className="tx-id-label">
                              ID: {item._id.slice(0, 10)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category (resolved from MongoDB categories collection) */}
                    <td>
                      {(() => {
                        const matched = resolveCategory(item);
                        const catName = matched ? matched.name : (item.category || item.categoryName || 'General');
                        const catIsCredit = matched 
                          ? String(matched.type).toUpperCase() === 'CREDIT' 
                          : isCredit;
                        return (
                          <span className={catIsCredit ? "badge badge-emerald" : "badge badge-indigo"}>
                            {catName}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Payment Method */}
                    <td>
                      <div className="tx-payment-badge">
                        {renderPaymentIcon(item.paymentMethod)}
                        <span>{item.paymentMethod || 'Account'}</span>
                      </div>
                    </td>

                    {/* Amount SAR (Fixed double negative with Math.abs) */}
                    <td className={`tx-amount-cell ${isCredit ? 'tx-amount-credit' : 'tx-amount-debit'}`}>
                      {isCredit ? '+' : '-'}SAR {formatCurrency(Math.abs(amountVal))}
                    </td>

                    {/* Action */}
                    <td className="tx-delete-action">
                      <button
                        onClick={() => itemId && onDeleteTransaction(itemId)}
                        className="btn-icon tx-delete-btn" 
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
  );
}

import React from 'react';
import { Wallet, Target, HandCoins, BarChart3 } from 'lucide-react';

export type FinanceTabKey = 'ledger' | 'planned' | 'borrow_repay' | 'analytics';

interface FinanceTabsHeaderProps {
  activeTab: FinanceTabKey;
  onSelectTab: (tab: FinanceTabKey) => void;
  outstandingDebtCount?: number;
  activePlansCount?: number;
}

export default function FinanceTabsHeader({
  activeTab,
  onSelectTab,
  outstandingDebtCount = 0,
  activePlansCount = 0
}: FinanceTabsHeaderProps) {
  return (
    <div className="finance-nav-tabs-wrapper">
      <div className="finance-nav-tabs-bar">
        <button
          onClick={() => onSelectTab('ledger')}
          className={`finance-main-nav-tab ${activeTab === 'ledger' ? 'active' : ''}`}
        >
          <Wallet size={17} />
          <span>Expense Tracked</span>
        </button>

        <button
          onClick={() => onSelectTab('planned')}
          className={`finance-main-nav-tab ${activeTab === 'planned' ? 'active' : ''}`}
        >
          <Target size={17} />
          <span>Planned Expenses</span>
          {activePlansCount > 0 && (
            <span className="finance-nav-pill-counter">{activePlansCount}</span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('borrow_repay')}
          className={`finance-main-nav-tab ${activeTab === 'borrow_repay' ? 'active' : ''}`}
        >
          <HandCoins size={17} />
          <span>Borrow and Repay</span>
          {outstandingDebtCount > 0 && (
            <span className="finance-nav-pill-counter alert">{outstandingDebtCount}</span>
          )}
        </button>

      </div>
    </div>
  );
}

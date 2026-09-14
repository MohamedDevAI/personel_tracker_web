import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  CircleDollarSign,
  Plus,
  Compass,
  PieChart as PieIcon,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentApi } from '../services/investmentApi';
import { borrowRepayApi } from '../services/borrowRepayApi';
import { api } from '../services/api';
import type { InvestmentHolding, InvestmentCategory, Expense } from '../types';
import NetWorthHeroCard from '../components/money/NetWorthHeroCard';
import CategoryBreakdownCards from '../components/money/CategoryBreakdownCards';
import InvestmentAssetAllocationChart from '../components/money/InvestmentAssetAllocationChart';
import InvestmentPerformanceChart from '../components/money/InvestmentPerformanceChart';
import HoldingsTable from '../components/money/HoldingsTable';
import InvestmentModal from '../components/money/InvestmentModal';
import '../components/money/money-theme.css';

export default function MoneyHub() {
  const queryClient = useQueryClient();

  // Selected category filter: 'All' | 'Stocks' | 'Mutual Funds' | 'Bonds' | 'FDs'
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [includeCashAndDebt, setIncludeCashAndDebt] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);
  const [modalCategory, setModalCategory] = useState<InvestmentCategory>('Stocks');

  // Fetch Investment Holdings
  const {
    data: holdings = [],
    refetch: refetchHoldings,
    isFetching: isFetchingHoldings
  } = useQuery<InvestmentHolding[]>({
    queryKey: ['investmentHoldings'],
    queryFn: investmentApi.getHoldings,
  });

  // Fetch Ledger Expenses (for Net Cash Liquidity)
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: api.getExpenses,
  });

  // Fetch Borrow/Repay (for Debt Liabilities)
  const { data: borrowRecords = [] } = useQuery({
    queryKey: ['borrowRepayRecords'],
    queryFn: borrowRepayApi.getRecords,
  });

  // Compute Liquid Cash Balance
  const totalIncome = (expenses || [])
    .filter((e) => e.type === 'INCOME')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalExpense = (expenses || [])
    .filter((e) => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const cashLiquidity = Math.max(0, totalIncome - totalExpense);

  // Compute Outstanding Liabilities (Money borrowed minus repaid)
  const totalBorrowed = (borrowRecords || [])
    .filter((r) => r.type === 'Borrow')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalRepaid = (borrowRecords || [])
    .filter((r) => r.type === 'Repaid')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const debtLiabilities = Math.max(0, totalBorrowed - totalRepaid);

  // Compute Portfolio Level Stats
  const portfolioStats = investmentApi.computePortfolioStats(holdings);

  // Total Comprehensive Net Worth: Portfolio + Cash - Liabilities
  const totalNetWorth =
    portfolioStats.currentValue + cashLiquidity - debtLiabilities;

  // Handlers for Holding Actions
  const handleOpenAdd = (categoryToSelect?: InvestmentCategory) => {
    setEditingHolding(null);
    if (categoryToSelect) {
      setModalCategory(categoryToSelect);
    } else if (selectedCategory !== 'All') {
      setModalCategory(
        (selectedCategory === 'Mutual Funds' || selectedCategory === 'SIPs')
          ? 'Mutual Funds'
          : (selectedCategory as InvestmentCategory)
      );
    } else {
      setModalCategory('Stocks');
    }
    setIsModalOpen(true);
  };

  const handleEditHolding = (holding: InvestmentHolding) => {
    setEditingHolding(holding);
    setModalCategory(holding.category);
    setIsModalOpen(true);
  };

  const handleDeleteHolding = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from your portfolio?`)) {
      await investmentApi.deleteHolding(id);
      queryClient.invalidateQueries({ queryKey: ['investmentHoldings'] });
    }
  };

  const handleSaveHolding = async (holdingData: Partial<InvestmentHolding>) => {
    if (editingHolding) {
      await investmentApi.updateHolding(editingHolding.id, holdingData);
    } else {
      await investmentApi.createHolding(
        holdingData as Omit<InvestmentHolding, 'id' | '_id' | 'createdAt' | 'updatedAt'>
      );
    }
    queryClient.invalidateQueries({ queryKey: ['investmentHoldings'] });
  };

  const handleRefresh = async () => {
    await refetchHoldings();
  };

  return (
    <div className="money-screen-root">
      {/* Header Banner */}
      <div className="money-header-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="money-sub-badge">
              <CircleDollarSign size={13} style={{ display: 'inline', marginRight: 4 }} />
              Investment & Wealth Engine
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comprehensive Portfolio Center
            </span>
          </div>
          <h1 className="money-title-text">
            Net Worth & <span className="money-gold-gradient">Investment Command Center</span>
          </h1>
          <p className="page-header-subtitle">
            Centralized visualization centre for tracking your Fixed Deposits, Bonds, Stocks, and SIPs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <ShieldCheck size={14} color="#10b981" />
            <span>4 Asset Classes Tracked</span>
          </span>
        </div>
      </div>

      {/* 1. Net Worth Hero Card */}
      <NetWorthHeroCard
        netWorth={totalNetWorth}
        portfolioValue={portfolioStats.currentValue}
        totalInvested={portfolioStats.totalInvested}
        totalReturn={portfolioStats.totalReturn}
        totalReturnPct={portfolioStats.totalReturnPct}
        todayChange={portfolioStats.todayChange}
        todayChangePct={portfolioStats.todayChangePct}
        cashLiquidity={cashLiquidity}
        debtLiabilities={debtLiabilities}
        activeSipMonthly={portfolioStats.monthlySipTotal || 0}
        includeCashAndDebt={includeCashAndDebt}
        onToggleNetWorthMode={() => setIncludeCashAndDebt((prev) => !prev)}
        onOpenAddModal={() => handleOpenAdd()}
        onRefresh={handleRefresh}
        isRefreshing={isFetchingHoldings}
      />

      {/* 2. Four Asset Class KPI Cards (FD, Bonds, Stocks, SIPs) */}
      <CategoryBreakdownCards
        holdings={holdings}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* 3. Visualization Centre (Asset Allocation Donut + Growth Trajectory / Comparison Chart) */}
      <div className="visualization-centre-grid">
        <InvestmentAssetAllocationChart
          holdings={holdings}
          cashLiquidity={cashLiquidity}
          includeCash={includeCashAndDebt}
        />

        <InvestmentPerformanceChart holdings={holdings} />
      </div>

      {/* 4. Filterable Holdings Management Table */}
      <HoldingsTable
        holdings={holdings}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onOpenAddModal={(cat) => handleOpenAdd(cat)}
        onEditHolding={handleEditHolding}
        onDeleteHolding={handleDeleteHolding}
      />

      {/* 5. Add / Edit Investment Modal */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHolding}
        initialHolding={editingHolding}
        defaultCategory={modalCategory}
      />
    </div>
  );
}

import React, { useState } from 'react';
import {
  ShieldCheck,
  CircleDollarSign,
  TrendingUp,
  LayoutDashboard,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentApi } from '../services/investmentApi';
import { borrowRepayApi } from '../services/borrowRepayApi';
import { api } from '../services/api';
import { tradingService } from '../services/tradingService';
import {
  computeFinancialHealth,
  calculateFireNumbers,
  getStoredFireSettings,
  saveFireSettings,
  saveHealthAnswer,
  FireSettings
} from '../services/financialHealthService';
import type { InvestmentHolding, InvestmentCategory, Expense, Trade } from '../types';
import { MoneyPrivacyProvider, useMoneyPrivacy } from '../context/MoneyPrivacyContext';

// Investment Components
import NetWorthHeroCard from '../components/money/NetWorthHeroCard';
import CategoryBreakdownCards from '../components/money/CategoryBreakdownCards';
import InvestmentAssetAllocationChart from '../components/money/InvestmentAssetAllocationChart';
import InvestmentPerformanceChart from '../components/money/InvestmentPerformanceChart';
import HoldingsTable from '../components/money/HoldingsTable';
import InvestmentModal from '../components/money/InvestmentModal';
import FinancialHealthCard from '../components/money/FinancialHealthCard';
import FinancialHealthModal from '../components/money/FinancialHealthModal';
import FireCalculatorCard from '../components/money/FireCalculatorCard';

// Trading Components
import TradingKPIHeader from '../components/money/trading/TradingKPIHeader';
import TradingPerformanceChart from '../components/money/trading/TradingPerformanceChart';
import TradingPositionsTable from '../components/money/trading/TradingPositionsTable';
import TradeModal from '../components/money/trading/TradeModal';

import '../components/money/money-theme.css';

type MainTab = 'dashboard' | 'investment' | 'trading';

function MoneyHubInner() {
  const queryClient = useQueryClient();
  const { isMoneyHidden, toggleHideMoney } = useMoneyPrivacy();

  // Active top navigation tab: 'dashboard' | 'investment' | 'trading'
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');

  // Selected category filter: 'All' | 'Stocks' | 'Mutual Funds' | 'Bonds' | 'FDs'
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [includeCashAndDebt, setIncludeCashAndDebt] = useState<boolean>(true);

  // Modal State for Investment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);
  const [modalCategory, setModalCategory] = useState<InvestmentCategory>('Stocks');

  // Modal State for Diagnostic Health Questions
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [, setHealthStateNonce] = useState(0);
  const [, setFireSettingsNonce] = useState(0);

  // Modal State for Trading
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

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

  // Fetch Trading Positions & Trades
  const {
    data: trades = [],
    refetch: refetchTrades,
  } = useQuery<Trade[]>({
    queryKey: ['tradingTrades'],
    queryFn: tradingService.getTrades,
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

  // Financial Health & FIRE Computations
  const fireSettings = getStoredFireSettings();
  const healthResult = computeFinancialHealth(
    holdings,
    cashLiquidity,
    debtLiabilities,
    portfolioStats.monthlySipTotal || 0,
    fireSettings.monthlyExpenses
  );

  const fireResult = calculateFireNumbers(
    totalNetWorth,
    portfolioStats.monthlySipTotal || 0,
    fireSettings
  );

  // Trading Stats
  const tradingStats = tradingService.computeTradingStats(trades);
  const openTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  const handleTogglePillar = (pillarId: string, newState: boolean) => {
    saveHealthAnswer(pillarId, newState);
    setHealthStateNonce((n) => n + 1);
  };

  const handleUpdateFireSettings = (newSettings: Partial<FireSettings>) => {
    saveFireSettings(newSettings);
    setFireSettingsNonce((n) => n + 1);
  };

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
    await Promise.all([refetchHoldings(), refetchTrades()]);
  };

  // Handlers for Trading Actions
  const handleOpenAddTrade = () => {
    setEditingTrade(null);
    setIsTradeModalOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (editingTrade) {
      await tradingService.updateTrade(editingTrade.id, tradeData);
    } else {
      await tradingService.createTrade(tradeData as Omit<Trade, 'id'>);
    }
    queryClient.invalidateQueries({ queryKey: ['tradingTrades'] });
    setIsTradeModalOpen(false);
  };

  const handleCloseTrade = async (id: string, exitPrice: number) => {
    await tradingService.closeTrade(id, exitPrice);
    queryClient.invalidateQueries({ queryKey: ['tradingTrades'] });
  };

  const handleDeleteTrade = async (id: string) => {
    await tradingService.deleteTrade(id);
    queryClient.invalidateQueries({ queryKey: ['tradingTrades'] });
  };

  return (
    <div className="money-screen-root">
      {/* Header Banner */}
      <div className="money-header-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="money-sub-badge">
              <CircleDollarSign size={13} style={{ display: 'inline', marginRight: 4 }} />
              Personal Wealth & Capital Engine
            </span>
          </div>
          <h1 className="money-title-text">
            Net Worth & <span className="money-gold-gradient">Financial Command Center</span>
          </h1>
          <p className="page-header-subtitle">
            Centralized visualization centre for tracking your Fixed Deposits, Bonds, Stocks, SIPs & Trading in INR (₹).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Eye Hide/Unhide Money Button */}
          <button
            onClick={toggleHideMoney}
            className={`money-eye-toggle-btn ${isMoneyHidden ? 'active-hidden' : ''}`}
            title={isMoneyHidden ? 'Click to unhide monetary balances' : 'Click to hide monetary balances'}
          >
            {isMoneyHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{isMoneyHidden ? 'Show Balances' : 'Hide Balances'}</span>
          </button>

          {/* Health Score Pill */}
          <span
            className="money-header-health-badge"
            onClick={() => setIsDiagnosticOpen(true)}
            title="Click to view Financial Health Diagnostic"
          >
            <ShieldCheck size={14} color="#10b981" />
            <span>Health Score: {healthResult.totalScore}/100</span>
          </span>
        </div>
      </div>

      {/* 3 Main Tabs: Dashboard | Investment | Trading */}
      <div className="money-main-tabs-bar">
        <button
          className={`money-main-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </button>

        <button
          className={`money-main-tab-btn ${activeTab === 'investment' ? 'active' : ''}`}
          onClick={() => setActiveTab('investment')}
        >
          <TrendingUp size={17} />
          <span>Investment</span>
          <span className="money-tab-count-pill">{holdings.length}</span>
        </button>

        <button
          className={`money-main-tab-btn tab-trading ${activeTab === 'trading' ? 'active' : ''}`}
          onClick={() => setActiveTab('trading')}
        >
          <Activity size={17} />
          <span>Trading</span>
          <span className="money-tab-count-pill">{openTradesCount} Open</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: DASHBOARD
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

          {/* 2. Financial Health Score & FIRE Freedom Hub */}
          <div className="financial-intelligence-grid">
            <FinancialHealthCard
              healthResult={healthResult}
              onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
            />
            <FireCalculatorCard
              fireResult={fireResult}
              onUpdateSettings={handleUpdateFireSettings}
            />
          </div>

          {/* 3. Four Asset Class KPI Cards (FD, Bonds, Stocks, SIPs) */}
          <CategoryBreakdownCards
            holdings={holdings}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          {/* 4. Visualization Centre (Asset Allocation Donut + Growth Comparison Chart) */}
          <div className="visualization-centre-grid">
            <InvestmentAssetAllocationChart
              holdings={holdings}
              cashLiquidity={cashLiquidity}
              includeCash={includeCashAndDebt}
            />
            <InvestmentPerformanceChart holdings={holdings} />
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: INVESTMENT
          ======================================================== */}
      {activeTab === 'investment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Category Breakdown Cards */}
          <CategoryBreakdownCards
            holdings={holdings}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          {/* Visualization Centre (Donut + Performance Chart) */}
          <div className="visualization-centre-grid">
            <InvestmentAssetAllocationChart
              holdings={holdings}
              cashLiquidity={cashLiquidity}
              includeCash={includeCashAndDebt}
            />
            <InvestmentPerformanceChart holdings={holdings} />
          </div>

          {/* Filterable Holdings Management Table */}
          <HoldingsTable
            holdings={holdings}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onOpenAddModal={(cat) => handleOpenAdd(cat)}
            onEditHolding={handleEditHolding}
            onDeleteHolding={handleDeleteHolding}
          />
        </div>
      )}

      {/* ========================================================
          TAB 3: TRADING
          ======================================================== */}
      {activeTab === 'trading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Trading KPI Header */}
          <TradingKPIHeader
            stats={tradingStats}
            onOpenAddModal={handleOpenAddTrade}
          />

          {/* Trading Performance & Equity Curve Chart */}
          <TradingPerformanceChart trades={trades} />

          {/* Positions & Journal Table */}
          <TradingPositionsTable
            trades={trades}
            onOpenAddModal={handleOpenAddTrade}
            onEditTrade={handleEditTrade}
            onCloseTrade={handleCloseTrade}
            onDeleteTrade={handleDeleteTrade}
          />
        </div>
      )}

      {/* ========================================================
          MODALS
          ======================================================== */}
      {/* 1. Add / Edit Investment Modal */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHolding}
        initialHolding={editingHolding}
        defaultCategory={modalCategory}
      />

      {/* 2. Add / Edit Trade Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
      />

      {/* 3. Financial Health Diagnostic & Gap-Filling Modal */}
      <FinancialHealthModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        healthResult={healthResult}
        onTogglePillar={handleTogglePillar}
      />
    </div>
  );
}

export default function MoneyHub() {
  return (
    <MoneyPrivacyProvider>
      <MoneyHubInner />
    </MoneyPrivacyProvider>
  );
}

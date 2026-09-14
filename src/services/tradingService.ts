/**
 * Trading Service & Local Storage Manager for Money Hub Trading Workspace.
 * Tracks Open Positions, Trade Journal (Closed Trades), Realized & Unrealized P&L in INR (₹).
 */

import type { Trade, TradingStats } from '../types';

const TRADES_STORAGE_KEY = 'money_trading_positions';

const SEED_TRADES: Trade[] = [
  {
    id: 'tr-1',
    symbol: 'NIFTY 24800 CE',
    instrument: 'F&O',
    direction: 'LONG',
    tradeType: 'INTRADAY',
    entryPrice: 125,
    currentPrice: 168,
    stopLoss: 95,
    targetPrice: 190,
    quantity: 150, // 3 lots
    entryDate: '2026-09-14T09:20:00.000Z',
    status: 'OPEN',
    strategy: 'Morning ORB Breakout',
    notes: 'Strong index momentum above PDH with heavy banking call buying.',
    unrealizedPnl: (168 - 125) * 150, // +6,450
    pnlPercent: ((168 - 125) / 125) * 100, // +34.4%
    riskRewardRatio: (190 - 125) / (125 - 95), // 2.16
  },
  {
    id: 'tr-2',
    symbol: 'TATAMOTORS',
    instrument: 'EQUITY',
    direction: 'LONG',
    tradeType: 'SWING',
    entryPrice: 980,
    currentPrice: 1045,
    stopLoss: 940,
    targetPrice: 1080,
    quantity: 200,
    entryDate: '2026-09-08T10:15:00.000Z',
    status: 'OPEN',
    strategy: 'Cup & Handle Breakout',
    notes: 'Strong volume expansion on weekly breakout with EV sales catalyst.',
    unrealizedPnl: (1045 - 980) * 200, // +13,000
    pnlPercent: ((1045 - 980) / 980) * 100, // +6.63%
    riskRewardRatio: (1080 - 980) / (980 - 940), // 2.5
  },
  {
    id: 'tr-3',
    symbol: 'BANKNIFTY 51500 PE',
    instrument: 'F&O',
    direction: 'LONG',
    tradeType: 'INTRADAY',
    entryPrice: 280,
    currentPrice: 245,
    stopLoss: 220,
    targetPrice: 380,
    quantity: 60, // 4 lots
    entryDate: '2026-09-14T10:05:00.000Z',
    status: 'OPEN',
    strategy: 'Resistance Rejection',
    notes: 'Scalp hedge against long bias at major supply zone.',
    unrealizedPnl: (245 - 280) * 60, // -2,100
    pnlPercent: ((245 - 280) / 280) * 100, // -12.5%
    riskRewardRatio: (380 - 280) / (280 - 220), // 1.66
  },
  {
    id: 'tr-4',
    symbol: 'RELIANCE',
    instrument: 'EQUITY',
    direction: 'LONG',
    tradeType: 'SWING',
    entryPrice: 2950,
    currentPrice: 3120,
    exitPrice: 3120,
    stopLoss: 2880,
    targetPrice: 3100,
    quantity: 100,
    entryDate: '2026-08-25T09:30:00.000Z',
    exitDate: '2026-09-05T14:45:00.000Z',
    status: 'CLOSED',
    strategy: '20 EMA Pullback',
    notes: 'Hit final target with trailing stop for disciplined exit.',
    realizedPnl: (3120 - 2950) * 100, // +17,000
    pnlPercent: ((3120 - 2950) / 2950) * 100, // +5.76%
    riskRewardRatio: (3100 - 2950) / (2950 - 2880), // 2.14
  },
  {
    id: 'tr-5',
    symbol: 'INFY 1900 CE',
    instrument: 'F&O',
    direction: 'LONG',
    tradeType: 'INTRADAY',
    entryPrice: 42,
    currentPrice: 28,
    exitPrice: 28,
    stopLoss: 28,
    targetPrice: 65,
    quantity: 400, // 1 lot
    entryDate: '2026-09-02T11:00:00.000Z',
    exitDate: '2026-09-02T13:30:00.000Z',
    status: 'CLOSED',
    strategy: 'Gap Fill Momentum',
    notes: 'Stopped out at defined SL. Managed risk tightly.',
    realizedPnl: (28 - 42) * 400, // -5,600
    pnlPercent: ((28 - 42) / 42) * 100, // -33.3%
    riskRewardRatio: (65 - 42) / (42 - 28), // 1.64
  },
  {
    id: 'tr-6',
    symbol: 'HDFCBANK',
    instrument: 'EQUITY',
    direction: 'LONG',
    tradeType: 'SWING',
    entryPrice: 1620,
    currentPrice: 1715,
    exitPrice: 1715,
    stopLoss: 1580,
    targetPrice: 1720,
    quantity: 150,
    entryDate: '2026-08-15T09:45:00.000Z',
    exitDate: '2026-08-28T15:00:00.000Z',
    status: 'CLOSED',
    strategy: 'Base Breakout',
    notes: 'Solid trend continuation after institutional accumulation.',
    realizedPnl: (1715 - 1620) * 150, // +14,250
    pnlPercent: ((1715 - 1620) / 1620) * 100, // +5.86%
    riskRewardRatio: (1720 - 1620) / (1620 - 1580), // 2.5
  }
];

const loadTradesFromStorage = (): Trade[] => {
  try {
    const raw = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(SEED_TRADES));
      return SEED_TRADES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_TRADES;
  } catch {
    return SEED_TRADES;
  }
};

const saveTradesToStorage = (trades: Trade[]): void => {
  try {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save trades to storage:', e);
  }
};

export const tradingService = {
  getTrades: async (): Promise<Trade[]> => {
    return loadTradesFromStorage();
  },

  createTrade: async (tradeData: Omit<Trade, 'id'>): Promise<Trade> => {
    const list = loadTradesFromStorage();
    const isLong = tradeData.direction === 'LONG';
    const currentPrice = Number(tradeData.currentPrice || tradeData.entryPrice);
    const entryPrice = Number(tradeData.entryPrice);
    const qty = Number(tradeData.quantity);
    const isClosed = tradeData.status === 'CLOSED';

    const pnlMultiplier = isLong ? 1 : -1;
    const diff = (isClosed && tradeData.exitPrice ? Number(tradeData.exitPrice) : currentPrice) - entryPrice;
    const computedPnl = diff * qty * pnlMultiplier;
    const pnlPct = entryPrice > 0 ? (diff / entryPrice) * 100 * pnlMultiplier : 0;

    const risk = Math.abs(entryPrice - Number(tradeData.stopLoss));
    const reward = Math.abs(Number(tradeData.targetPrice) - entryPrice);
    const rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 1;

    const newTrade: Trade = {
      ...tradeData,
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entryPrice,
      currentPrice,
      quantity: qty,
      stopLoss: Number(tradeData.stopLoss),
      targetPrice: Number(tradeData.targetPrice),
      unrealizedPnl: isClosed ? 0 : computedPnl,
      realizedPnl: isClosed ? computedPnl : 0,
      pnlPercent: Number(pnlPct.toFixed(2)),
      riskRewardRatio: rr,
      entryDate: tradeData.entryDate || new Date().toISOString(),
    };

    const updated = [newTrade, ...list];
    saveTradesToStorage(updated);
    return newTrade;
  },

  updateTrade: async (id: string, updates: Partial<Trade>): Promise<Trade> => {
    const list = loadTradesFromStorage();
    const existing = list.find((t) => t.id === id);
    if (!existing) throw new Error('Trade not found');

    const merged = { ...existing, ...updates };
    const isLong = merged.direction === 'LONG';
    const isClosed = merged.status === 'CLOSED';
    const entryPrice = Number(merged.entryPrice);
    const effectivePrice = isClosed && merged.exitPrice ? Number(merged.exitPrice) : Number(merged.currentPrice);
    const pnlMultiplier = isLong ? 1 : -1;
    const diff = effectivePrice - entryPrice;
    const computedPnl = diff * Number(merged.quantity) * pnlMultiplier;

    const risk = Math.abs(entryPrice - Number(merged.stopLoss));
    const reward = Math.abs(Number(merged.targetPrice) - entryPrice);
    const rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 1;

    const finalTrade: Trade = {
      ...merged,
      unrealizedPnl: isClosed ? 0 : computedPnl,
      realizedPnl: isClosed ? computedPnl : 0,
      pnlPercent: entryPrice > 0 ? Number(((diff / entryPrice) * 100 * pnlMultiplier).toFixed(2)) : 0,
      riskRewardRatio: rr,
    };

    const updatedList = list.map((t) => (t.id === id ? finalTrade : t));
    saveTradesToStorage(updatedList);
    return finalTrade;
  },

  closeTrade: async (id: string, exitPrice: number): Promise<Trade> => {
    return tradingService.updateTrade(id, {
      status: 'CLOSED',
      exitPrice: Number(exitPrice),
      exitDate: new Date().toISOString(),
    });
  },

  deleteTrade: async (id: string): Promise<boolean> => {
    const list = loadTradesFromStorage();
    const updated = list.filter((t) => t.id !== id);
    saveTradesToStorage(updated);
    return true;
  },

  computeTradingStats: (trades: Trade[]): TradingStats => {
    let capitalDeployed = 0;
    let totalRealizedPnl = 0;
    let totalUnrealizedPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    let rrSum = 0;
    let rrCount = 0;

    trades.forEach((t) => {
      if (t.riskRewardRatio) {
        rrSum += t.riskRewardRatio;
        rrCount++;
      }

      if (t.status === 'OPEN') {
        capitalDeployed += t.entryPrice * t.quantity;
        totalUnrealizedPnl += (t.unrealizedPnl || 0);
      } else {
        const pnl = t.realizedPnl || 0;
        totalRealizedPnl += pnl;
        if (pnl > 0) winCount++;
        else if (pnl < 0) lossCount++;
      }
    });

    const totalClosed = winCount + lossCount;
    const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;
    const avgRiskReward = rrCount > 0 ? Number((rrSum / rrCount).toFixed(2)) : 2.0;

    return {
      capitalDeployed,
      totalRealizedPnl,
      totalUnrealizedPnl,
      winRate: Number(winRate.toFixed(1)),
      winCount,
      lossCount,
      totalTrades: trades.length,
      openTradesCount: trades.filter((t) => t.status === 'OPEN').length,
      avgRiskReward,
    };
  },

  getEquityCurveData: (trades: Trade[]) => {
    // Generate cumulative P&L progression for closed and open trades
    const closed = trades
      .filter((t) => t.status === 'CLOSED' && t.exitDate)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    let runningPnl = 0;
    const points: { date: string; pnl: number; trade: string }[] = [
      { date: 'Initial', pnl: 0, trade: 'Base Capital' }
    ];

    closed.forEach((t) => {
      runningPnl += (t.realizedPnl || 0);
      const label = t.exitDate ? t.exitDate.split('T')[0] : 'Trade';
      points.push({
        date: label,
        pnl: runningPnl,
        trade: `${t.symbol} (${(t.realizedPnl || 0) >= 0 ? '+' : ''}₹${(t.realizedPnl || 0).toLocaleString('en-IN')})`
      });
    });

    return points;
  }
};

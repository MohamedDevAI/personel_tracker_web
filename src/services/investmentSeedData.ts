/**
 * Investment Holdings Seed Data — Indian Market (NSE/BSE)
 * Used as localStorage fallback when the money MongoDB collection is empty or unreachable.
 * Collection: money.investment_holdings (via moneyTemplate bean)
 */

import type {
  InvestmentHolding,
  FundamentalMetrics,
  MutualFundMetrics,
  BondMetrics,
  FDMetrics,
  TechnicalIndicators,
} from '../types';

// --- Price History Generator -------------------------------------------------

/**
 * Generate N days of realistic closing prices via random walk + trend.
 * Walk backwards from the current price so the last element = current price.
 */
const generatePriceHistory = (
  basePrice: number,
  annualVolatility: number = 0.25,
  dailyTrend: number = 0.0003,
  days: number = 90
): number[] => {
  const dailySigma = annualVolatility / Math.sqrt(252);
  const prices: number[] = [];
  let price = basePrice;

  for (let i = days; i >= 0; i--) {
    prices.unshift(Math.round(price * 100) / 100);
    const shock = (Math.random() - 0.5) * 2 * dailySigma;
    price = price / (1 + dailyTrend + shock);
  }
  return prices;
};

// --- Fundamentals -----------------------------------------------------------

const RELIANCE_FUNDAMENTALS: FundamentalMetrics = {
  roe: 19.2, roce: 14.8, debtToEquity: 0.44, freeCashFlow: 52800,
  peRatio: 22.4, pbRatio: 2.1, marketCap: 1856000,
  promoterHolding: 50.3, promoterHoldingChange: 0.1,
  moatRating: 'Wide', governanceScore: 7, sector: 'Energy & Telecom',
};

const HDFC_BANK_FUNDAMENTALS: FundamentalMetrics = {
  roe: 17.1, roce: 8.9, debtToEquity: 7.8, freeCashFlow: 28400,
  peRatio: 18.6, pbRatio: 2.6, marketCap: 1242000,
  promoterHolding: 26.0, promoterHoldingChange: -0.2,
  moatRating: 'Wide', governanceScore: 9, sector: 'Banking & Finance',
};

const INFOSYS_FUNDAMENTALS: FundamentalMetrics = {
  roe: 31.4, roce: 40.6, debtToEquity: 0.08, freeCashFlow: 18200,
  peRatio: 27.8, pbRatio: 7.2, marketCap: 612000,
  promoterHolding: 14.9, promoterHoldingChange: -0.3,
  moatRating: 'Narrow', governanceScore: 8, sector: 'IT Services',
};

const TCS_FUNDAMENTALS: FundamentalMetrics = {
  roe: 52.6, roce: 68.4, debtToEquity: 0.02, freeCashFlow: 44100,
  peRatio: 31.2, pbRatio: 13.4, marketCap: 1445000,
  promoterHolding: 72.3, promoterHoldingChange: 0.0,
  moatRating: 'Wide', governanceScore: 9, sector: 'IT Services',
};

// --- Technical Indicators (pre-computed for seed) ---------------------------

const RELIANCE_TECHNICALS: TechnicalIndicators = {
  rsi14: 58.4, macdLine: 12.6, macdSignal: 8.3, macdHistogram: 4.3,
  sma50: 2520, sma200: 2380, ema20: 2548,
  bollingerUpper: 2780, bollingerLower: 2510, bollingerMiddle: 2645,
  atr14: 48.2, volume: 8200000, avgVolume20: 7100000,
};

const HDFC_BANK_TECHNICALS: TechnicalIndicators = {
  rsi14: 52.1, macdLine: 6.8, macdSignal: 5.2, macdHistogram: 1.6,
  sma50: 1680, sma200: 1590, ema20: 1700,
  bollingerUpper: 1810, bollingerLower: 1650, bollingerMiddle: 1730,
  atr14: 32.5, volume: 12400000, avgVolume20: 11200000,
};

const INFOSYS_TECHNICALS: TechnicalIndicators = {
  rsi14: 44.7, macdLine: -4.2, macdSignal: 1.8, macdHistogram: -6.0,
  sma50: 1420, sma200: 1450, ema20: 1395,
  bollingerUpper: 1520, bollingerLower: 1340, bollingerMiddle: 1430,
  atr14: 28.8, volume: 7600000, avgVolume20: 8300000,
};

const TCS_TECHNICALS: TechnicalIndicators = {
  rsi14: 61.2, macdLine: 22.4, macdSignal: 14.8, macdHistogram: 7.6,
  sma50: 3780, sma200: 3540, ema20: 3840,
  bollingerUpper: 4050, bollingerLower: 3720, bollingerMiddle: 3885,
  atr14: 56.1, volume: 2800000, avgVolume20: 2500000,
};

// --- Mutual Fund Metrics ---------------------------------------------------

const HDFC_MIDCAP_MF: MutualFundMetrics = {
  cagr3yr: 24.8, cagr5yr: 22.1, cagr10yr: 18.4,
  sharpeRatio: 1.42, sortinoRatio: 2.08, expenseRatio: 0.52,
  alphaVsBenchmark: 3.6, beta: 0.88, fundManagerTenure: 9,
  exitLoadPeriod: 12, exitLoadPercent: 1.0, sipAmount: 5000,
  fundHouse: 'HDFC AMC', benchmark: 'Nifty Midcap 150',
};

const PARAG_PARIKH_MF: MutualFundMetrics = {
  cagr3yr: 19.6, cagr5yr: 21.4, cagr10yr: 20.2,
  sharpeRatio: 1.68, sortinoRatio: 2.41, expenseRatio: 0.63,
  alphaVsBenchmark: 5.2, beta: 0.72, fundManagerTenure: 12,
  exitLoadPeriod: 12, exitLoadPercent: 2.0, sipAmount: 10000,
  fundHouse: 'PPFAS AMC', benchmark: 'Nifty 500',
};

// --- Bond & FD Metrics -----------------------------------------------------

const SBI_GILT_BOND: BondMetrics = {
  creditRating: 'AAA', yieldToMaturity: 7.18, duration: 8.4,
  bondType: 'Government', couponRate: 7.26, maturityDate: '2032-06-10',
  faceValue: 1000, issuer: 'Reserve Bank of India (Sovereign)',
};

const SBI_TAX_SAVER_FD: FDMetrics = {
  interestRate: 6.5, fdType: 'Cumulative', tenure: 60,
  maturityDate: '2028-09-15', maturityAmount: 136856,
  bankName: 'State Bank of India', taxTreatment: 'Tax-Saver (80C)',
  payoutFrequency: 'Maturity',
};

// --- Exported Seed Array ---------------------------------------------------

export const SEED_INVESTMENT_HOLDINGS: InvestmentHolding[] = [
  // Stocks
  {
    id: 'inv-rel-001', name: 'Reliance Industries', ticker: 'RELIANCE.NS',
    category: 'Stocks', buyPrice: 2450, currentPrice: 2678, quantity: 10,
    buyDate: '2023-06-15', currency: 'INR',
    priceHistory: generatePriceHistory(2678, 0.22, 0.0004),
    fundamentals: RELIANCE_FUNDAMENTALS, technicals: RELIANCE_TECHNICALS,
    notes: 'Core blue-chip. Jio + Retail expansion thesis.',
    createdAt: '2023-06-15T00:00:00.000Z',
  },
  {
    id: 'inv-hdfcb-002', name: 'HDFC Bank', ticker: 'HDFCBANK.NS',
    category: 'Stocks', buyPrice: 1580, currentPrice: 1724, quantity: 15,
    buyDate: '2023-08-20', currency: 'INR',
    priceHistory: generatePriceHistory(1724, 0.20, 0.0003),
    fundamentals: HDFC_BANK_FUNDAMENTALS, technicals: HDFC_BANK_TECHNICALS,
    notes: 'Post-merger HDFC Ltd. CASA ratio recovery play.',
    createdAt: '2023-08-20T00:00:00.000Z',
  },
  {
    id: 'inv-infy-003', name: 'Infosys', ticker: 'INFY.NS',
    category: 'Stocks', buyPrice: 1410, currentPrice: 1382, quantity: 12,
    buyDate: '2023-11-05', currency: 'INR',
    priceHistory: generatePriceHistory(1382, 0.26, -0.0002),
    fundamentals: INFOSYS_FUNDAMENTALS, technicals: INFOSYS_TECHNICALS,
    notes: 'IT sector slowdown. Monitor large deal wins.',
    createdAt: '2023-11-05T00:00:00.000Z',
  },
  {
    id: 'inv-tcs-004', name: 'Tata Consultancy Services', ticker: 'TCS.NS',
    category: 'Stocks', buyPrice: 3650, currentPrice: 3892, quantity: 5,
    buyDate: '2023-04-10', currency: 'INR',
    priceHistory: generatePriceHistory(3892, 0.18, 0.0004),
    fundamentals: TCS_FUNDAMENTALS, technicals: TCS_TECHNICALS,
    notes: 'Bellwether IT. Dividend yield + buyback history.',
    createdAt: '2023-04-10T00:00:00.000Z',
  },
  // Mutual Funds
  {
    id: 'inv-hdfcmid-005', name: 'HDFC Mid-Cap Opportunities Fund', ticker: 'HDFCMID',
    category: 'Mutual Funds', buyPrice: 285, currentPrice: 342, quantity: 1000,
    buyDate: '2022-03-01', currency: 'INR',
    priceHistory: generatePriceHistory(342, 0.24, 0.0005),
    mutualFundMetrics: HDFC_MIDCAP_MF,
    notes: 'Monthly SIP Rs5,000. Mid-cap allocation.',
    createdAt: '2022-03-01T00:00:00.000Z',
  },
  {
    id: 'inv-ppfas-006', name: 'Parag Parikh Flexi Cap Fund', ticker: 'PPFAS',
    category: 'Mutual Funds', buyPrice: 56, currentPrice: 74, quantity: 2000,
    buyDate: '2021-09-15', currency: 'INR',
    priceHistory: generatePriceHistory(74, 0.20, 0.0005),
    mutualFundMetrics: PARAG_PARIKH_MF,
    notes: 'Core long-term SIP. Partial international exposure.',
    createdAt: '2021-09-15T00:00:00.000Z',
  },
  // Bonds
  {
    id: 'inv-sbigilt-007', name: 'SBI Magnum Gilt Fund', ticker: 'SBIGILT',
    category: 'Bonds', buyPrice: 100, currentPrice: 103.4, quantity: 5000,
    buyDate: '2024-01-10', currency: 'INR',
    priceHistory: generatePriceHistory(103.4, 0.04, 0.0002),
    bondMetrics: SBI_GILT_BOND,
    notes: 'Sovereign risk-free debt. Duration hedge on equity.',
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  // FDs
  {
    id: 'inv-sbifd-008', name: 'SBI 5-Year Tax Saver FD',
    category: 'FDs', buyPrice: 100000, currentPrice: 118240, quantity: 1,
    buyDate: '2023-09-15', currency: 'INR',
    priceHistory: generatePriceHistory(118240, 0.01, 0.0002),
    fdMetrics: SBI_TAX_SAVER_FD,
    notes: '80C deduction. Lock-in until Sep 2028.',
    createdAt: '2023-09-15T00:00:00.000Z',
  },
];

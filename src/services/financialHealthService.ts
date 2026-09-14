/**
 * Financial Health Score Diagnostic & FIRE Freedom Service
 * All figures computed in Indian Rupee (INR ₹)
 */

import { STORAGE_KEYS } from '../utils/constants';
import type { InvestmentHolding } from '../types';

export interface HealthPillar {
  id: string;
  title: string;
  category: 'Safety' | 'Debt' | 'Growth' | 'Protection' | 'Estate';
  maxPoints: number;
  question: string;
  whyItMatters: string;
  gapText: string;
  isAutoDetected: boolean;
  isFulfilled: boolean;
  earnedPoints: number;
  details?: string;
}

export interface FinancialHealthResult {
  totalScore: number;
  maxScore: number;
  tier: 'Elite Fortress' | 'Strong Compounding' | 'Stable with Gaps' | 'High Risk';
  tierColor: string;
  tierDescription: string;
  pillars: HealthPillar[];
  achievedCount: number;
  gapsCount: number;
  nextBestAction: string;
}

export interface FireSettings {
  monthlyExpenses: number; // in INR ₹
  multiplier: number; // default 25 (Standard 4% rule)
  expectedAnnualReturn: number; // % default 11% p.a.
}

export interface FireCalculationResult {
  monthlyExpenses: number;
  annualExpenses: number;
  leanFireTarget: number; // 20x
  standardFireTarget: number; // 25x
  fatFireTarget: number; // 33x
  selectedTarget: number;
  currentNetWorth: number;
  progressPct: number;
  shortfall: number;
  yearsToFire: number;
  targetYear: number;
  monthlyInvestment: number;
}

const DEFAULT_FIRE_SETTINGS: FireSettings = {
  monthlyExpenses: 60000, // ₹60,000 / month
  multiplier: 25,
  expectedAnnualReturn: 11, // 11% CAGR
};

// ─── LocalStorage Helpers ───────────────────────────────────────────────────

export const getStoredHealthAnswers = (): Record<string, boolean> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FINANCIAL_HEALTH_ANSWERS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const saveHealthAnswer = (pillarId: string, fulfilled: boolean): void => {
  const current = getStoredHealthAnswers();
  current[pillarId] = fulfilled;
  localStorage.setItem(STORAGE_KEYS.FINANCIAL_HEALTH_ANSWERS, JSON.stringify(current));
};

export const getStoredFireSettings = (): FireSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FIRE_SETTINGS);
    return data ? { ...DEFAULT_FIRE_SETTINGS, ...JSON.parse(data) } : DEFAULT_FIRE_SETTINGS;
  } catch (e) {
    return DEFAULT_FIRE_SETTINGS;
  }
};

export const saveFireSettings = (settings: Partial<FireSettings>): FireSettings => {
  const merged = { ...getStoredFireSettings(), ...settings };
  localStorage.setItem(STORAGE_KEYS.FIRE_SETTINGS, JSON.stringify(merged));
  return merged;
};

// ─── Financial Health Score Computation ─────────────────────────────────────

export const computeFinancialHealth = (
  holdings: InvestmentHolding[],
  cashLiquidity: number,
  debtLiabilities: number,
  activeSipMonthly: number,
  monthlyExpenses: number = 60000
): FinancialHealthResult => {
  const userAnswers = getStoredHealthAnswers();

  // 1. Emergency Fund Calculation:
  // Liquid cash + FD value >= 6 * monthlyExpenses
  const fdValue = holdings
    .filter((h) => h.category === 'FDs')
    .reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const liquidEmergencyFund = cashLiquidity + fdValue;
  const emergencyTarget = monthlyExpenses * 6;
  const autoEmergency = liquidEmergencyFund >= emergencyTarget;
  const fulfilledEmergency = userAnswers['emergency_fund'] !== undefined
    ? userAnswers['emergency_fund']
    : autoEmergency;

  // 2. Debt Freedom / Low Liabilities:
  // Zero debt or debt < 15% of net worth
  const portfolioVal = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const netWorth = portfolioVal + cashLiquidity - debtLiabilities;
  const autoDebt = debtLiabilities === 0 || (netWorth > 0 && debtLiabilities / netWorth < 0.15);
  const fulfilledDebt = userAnswers['debt_free'] !== undefined
    ? userAnswers['debt_free']
    : autoDebt;

  // 3. Monthly SIP Habit & Compounding:
  const autoSip = activeSipMonthly > 0;
  const fulfilledSip = userAnswers['sip_discipline'] !== undefined
    ? userAnswers['sip_discipline']
    : autoSip;

  // 4. Life & Health Insurance (User questionnaire):
  const fulfilledInsurance = !!userAnswers['insurance_cover'];

  // 5. Multi-Asset Diversification:
  // At least 3 different asset classes (Stocks, Mutual Funds/SIPs, Bonds, FDs)
  const distinctCategories = new Set(
    holdings.filter((h) => h.quantity > 0).map((h) => (h.category === 'SIPs' ? 'Mutual Funds' : h.category))
  );
  const autoDiversification = distinctCategories.size >= 3;
  const fulfilledDiversification = userAnswers['asset_diversification'] !== undefined
    ? userAnswers['asset_diversification']
    : autoDiversification;

  // 6. Nominee & Estate Safety:
  const fulfilledNominee = !!userAnswers['nominee_safety'];

  // Build the Pillars
  const pillars: HealthPillar[] = [
    {
      id: 'emergency_fund',
      title: '6-Month Emergency Buffer',
      category: 'Safety',
      maxPoints: 20,
      earnedPoints: fulfilledEmergency ? 20 : 0,
      isFulfilled: fulfilledEmergency,
      isAutoDetected: true,
      question: 'Do you have at least 6 months of living expenses saved in liquid cash or Fixed Deposits?',
      whyItMatters: 'Guarantees you never have to panic-sell stocks or liquidate long-term investments during unexpected emergencies.',
      gapText: `Build an emergency buffer of ₹${emergencyTarget.toLocaleString('en-IN')} in liquid cash or FDs (currently ₹${liquidEmergencyFund.toLocaleString('en-IN')}).`,
      details: `Target: ₹${(emergencyTarget / 100000).toFixed(2)}L • Liquid: ₹${(liquidEmergencyFund / 100000).toFixed(2)}L`,
    },
    {
      id: 'debt_free',
      title: 'Debt Freedom / Low Liabilities',
      category: 'Debt',
      maxPoints: 20,
      earnedPoints: fulfilledDebt ? 20 : 0,
      isFulfilled: fulfilledDebt,
      isAutoDetected: true,
      question: 'Are you free of high-interest unsecured debt and have manageable liabilities (<15% of Net Worth)?',
      whyItMatters: 'Debt interest works in reverse compounding, draining your wealth creation potential.',
      gapText: `Pay down outstanding liabilities of ₹${debtLiabilities.toLocaleString('en-IN')} to clear interest drain.`,
      details: debtLiabilities === 0 ? 'Zero outstanding liabilities' : `Outstanding: ₹${debtLiabilities.toLocaleString('en-IN')}`,
    },
    {
      id: 'sip_discipline',
      title: 'Active Monthly SIP Engine',
      category: 'Growth',
      maxPoints: 20,
      earnedPoints: fulfilledSip ? 20 : 0,
      isFulfilled: fulfilledSip,
      isAutoDetected: true,
      question: 'Do you automatically invest a disciplined portion of your income every month via SIPs or recurring deposits?',
      whyItMatters: 'Rupee-cost averaging and regular investing are the single greatest drivers of retail wealth compounding.',
      gapText: 'Set up an automated monthly SIP into equity index or mutual funds.',
      details: activeSipMonthly > 0 ? `Active SIP: ₹${activeSipMonthly.toLocaleString('en-IN')}/month` : 'No active SIP detected',
    },
    {
      id: 'insurance_cover',
      title: 'Comprehensive Insurance Protection',
      category: 'Protection',
      maxPoints: 15,
      earnedPoints: fulfilledInsurance ? 15 : 0,
      isFulfilled: fulfilledInsurance,
      isAutoDetected: false,
      question: 'Do you have dedicated Term Life Insurance (10x-20x annual income) and family Health Insurance?',
      whyItMatters: 'A single medical crisis or unforeseen event can wipe out years of investment savings without proper insurance.',
      gapText: 'Procure adequate term life cover and a separate family floater health policy.',
      details: fulfilledInsurance ? 'Term & Health policies active' : 'Policy gap identified',
    },
    {
      id: 'asset_diversification',
      title: 'Multi-Asset Diversification',
      category: 'Safety',
      maxPoints: 15,
      earnedPoints: fulfilledDiversification ? 15 : 0,
      isFulfilled: fulfilledDiversification,
      isAutoDetected: true,
      question: 'Is your portfolio spread across at least 3 distinct asset classes (Stocks, SIPs/MFs, Bonds, FDs)?',
      whyItMatters: 'Prevents heavy drawdown when a single asset class or sector experiences a market slump.',
      gapText: `Currently across ${distinctCategories.size} of 4 classes. Add missing classes like Bonds or FDs for balance.`,
      details: `${distinctCategories.size}/4 asset classes active`,
    },
    {
      id: 'nominee_safety',
      title: 'Nominee & Legal Safeguards',
      category: 'Estate',
      maxPoints: 10,
      earnedPoints: fulfilledNominee ? 10 : 0,
      isFulfilled: fulfilledNominee,
      isAutoDetected: false,
      question: 'Are registered nominees up-to-date across all your bank accounts, demat folios, and insurance?',
      whyItMatters: 'Ensures your loved ones can seamlessly access your accumulated wealth without legal disputes.',
      gapText: 'Audit your demat and bank accounts to ensure updated registered nominees.',
      details: fulfilledNominee ? 'Nominees fully registered' : 'Nominee audit pending',
    },
  ];

  const totalScore = pillars.reduce((sum, p) => sum + p.earnedPoints, 0);
  const maxScore = 100;
  const achievedCount = pillars.filter((p) => p.isFulfilled).length;
  const gapsCount = pillars.length - achievedCount;

  // Tier Classification
  let tier: FinancialHealthResult['tier'] = 'High Risk';
  let tierColor = '#f43f5e';
  let tierDescription = 'Urgent gaps in safety buffer or liabilities require immediate attention.';

  if (totalScore >= 85) {
    tier = 'Elite Fortress';
    tierColor = '#10b981';
    tierDescription = 'Your wealth architecture is bulletproof, diversified, and primed for rapid compounding.';
  } else if (totalScore >= 70) {
    tier = 'Strong Compounding';
    tierColor = '#34d399';
    tierDescription = 'Robust foundations with strong regular investing. Address remaining minor gaps for elite status.';
  } else if (totalScore >= 50) {
    tier = 'Stable with Gaps';
    tierColor = '#fbbf24';
    tierDescription = 'Core assets are in place, but protective gaps leave you vulnerable to market or life shocks.';
  }

  // Identify next best action
  const firstUnfulfilled = pillars.find((p) => !p.isFulfilled);
  const nextBestAction = firstUnfulfilled
    ? `${firstUnfulfilled.title}: ${firstUnfulfilled.gapText}`
    : 'All core financial health pillars achieved! Keep compounding.';

  return {
    totalScore,
    maxScore,
    tier,
    tierColor,
    tierDescription,
    pillars,
    achievedCount,
    gapsCount,
    nextBestAction,
  };
};

// ─── FIRE Number Calculations ──────────────────────────────────────────────

export const calculateFireNumbers = (
  currentNetWorth: number,
  activeSipMonthly: number,
  customSettings?: Partial<FireSettings>
): FireCalculationResult => {
  const settings = { ...getStoredFireSettings(), ...customSettings };
  const monthlyExpenses = settings.monthlyExpenses;
  const annualExpenses = monthlyExpenses * 12;

  // Rule of 20 (Lean), 25 (Standard), 33 (Fat)
  const leanFireTarget = annualExpenses * 20;
  const standardFireTarget = annualExpenses * 25;
  const fatFireTarget = annualExpenses * 33;

  const selectedTarget = annualExpenses * settings.multiplier;
  const validNetWorth = Math.max(0, currentNetWorth);
  const progressPct = selectedTarget > 0
    ? Math.min(100, Math.round((validNetWorth / selectedTarget) * 1000) / 10)
    : 0;

  const shortfall = Math.max(0, selectedTarget - validNetWorth);

  // Projection: How many years to reach selectedTarget?
  // Future Value of currentNetWorth compounding at r% + monthly SIP compounding at r%
  const monthlyRate = (settings.expectedAnnualReturn / 100) / 12;
  const monthlyInvestment = activeSipMonthly > 0 ? activeSipMonthly : monthlyExpenses * 0.2; // default to 20% savings if no SIP

  let months = 0;
  let accumulated = validNetWorth;
  const maxMonths = 600; // 50 years cap

  while (accumulated < selectedTarget && months < maxMonths) {
    accumulated = accumulated * (1 + monthlyRate) + monthlyInvestment;
    months++;
  }

  const yearsToFire = Math.round((months / 12) * 10) / 10;
  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + Math.ceil(yearsToFire);

  return {
    monthlyExpenses,
    annualExpenses,
    leanFireTarget,
    standardFireTarget,
    fatFireTarget,
    selectedTarget,
    currentNetWorth: validNetWorth,
    progressPct,
    shortfall,
    yearsToFire,
    targetYear,
    monthlyInvestment,
  };
};

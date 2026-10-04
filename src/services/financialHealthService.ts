/**
 * Financial Health Score Diagnostic & FIRE Freedom Service
 * All figures computed in Indian Rupee (INR ₹)
 *
 * Backend Target:
 *   Database: MongoDB
 *   Collection: financial_health
 *   Base path: /api/financial_health
 */

import { InvestmentHolding } from '../interface';
import apiClient from './apiClient';

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

export interface FinancialHealthRecord {
  id?: string;
  userId?: string;
  answers: Record<string, boolean>;
  fireSettings: FireSettings;
  totalScore?: number;
  maxScore?: number;
  tier?: FinancialHealthResult['tier'];
  tierColor?: string;
  tierDescription?: string;
  achievedCount?: number;
  gapsCount?: number;
  nextBestAction?: string;
  pillars?: HealthPillar[];
  fireCalculations?: Partial<FireCalculationResult>;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FIRE_SETTINGS: FireSettings = {
  monthlyExpenses: 60000, // ₹60,000 / month
  multiplier: 25,
  expectedAnnualReturn: 11, // 11% CAGR
};

// ─── In-Memory / Local Cache (for instant UI response and resilient fallback) ─────
let inMemoryHealthAnswers: Record<string, boolean> = {
  emergency_fund: false,
  debt_free: false,
  sip_discipline: false,
  insurance_cover: false,
  asset_diversification: false,
  nominee_safety: false,
};
let inMemoryFireSettings: FireSettings = { ...DEFAULT_FIRE_SETTINGS };
let inMemoryRecordId: string | undefined = undefined;

export const getStoredHealthAnswers = (): Record<string, boolean> => {
  return { ...inMemoryHealthAnswers };
};

export const saveHealthAnswer = (pillarId: string, fulfilled: boolean): void => {
  inMemoryHealthAnswers[pillarId] = fulfilled;
};

export const getStoredFireSettings = (): FireSettings => {
  return { ...inMemoryFireSettings };
};

export const saveFireSettings = (settings: Partial<FireSettings>): FireSettings => {
  inMemoryFireSettings = { ...inMemoryFireSettings, ...settings };
  return { ...inMemoryFireSettings };
};

// ─── Financial Health Score Computation ─────────────────────────────────────

export const computeFinancialHealth = (
  holdings: InvestmentHolding[],
  cashLiquidity: number,
  debtLiabilities: number,
  activeSipMonthly: number,
  monthlyExpenses: number = 60000,
  answersOverride?: Record<string, boolean>
): FinancialHealthResult => {
  const userAnswers = answersOverride || getStoredHealthAnswers();

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
  let tierColor = '#6b7280';
  let tierDescription = 'Urgent gaps in safety buffer or liabilities require immediate attention.';

  if (totalScore >= 85) {
    tier = 'Elite Fortress';
    tierColor = '#7c3aed';
    tierDescription = 'Your wealth architecture is bulletproof, diversified, and primed for rapid compounding.';
  } else if (totalScore >= 70) {
    tier = 'Strong Compounding';
    tierColor = '#9333ea';
    tierDescription = 'Robust foundations with strong regular investing. Address remaining minor gaps for elite status.';
  } else if (totalScore >= 50) {
    tier = 'Stable with Gaps';
    tierColor = '#a855f7';
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

// ─── Database & API Service (`financial_health` collection) ─────────────────

const ENDPOINT = '/financial_health';

export const financialHealthApi = {
  /**
   * Fetch the latest Financial Health record from MongoDB collection `financial_health`.
   */
  getHealthRecord: async (): Promise<FinancialHealthRecord> => {
    try {
      const { data } = await apiClient.get<FinancialHealthRecord>(ENDPOINT);
      if (data) {
        if (data.id) inMemoryRecordId = data.id;
        if (data.answers) {
          inMemoryHealthAnswers = { ...inMemoryHealthAnswers, ...data.answers };
        }
        if (data.fireSettings) {
          inMemoryFireSettings = {
            ...inMemoryFireSettings,
            monthlyExpenses: Number(data.fireSettings.monthlyExpenses || inMemoryFireSettings.monthlyExpenses),
            multiplier: Number(data.fireSettings.multiplier || inMemoryFireSettings.multiplier),
            expectedAnnualReturn: Number(data.fireSettings.expectedAnnualReturn || inMemoryFireSettings.expectedAnnualReturn),
          };
        }
        return data;
      }
    } catch (error) {
      console.warn('[financialHealthApi] GET failed, using fallback:', error);
    }

    return {
      id: inMemoryRecordId,
      userId: 'default_user',
      answers: { ...inMemoryHealthAnswers },
      fireSettings: { ...inMemoryFireSettings },
      totalScore: 0,
      maxScore: 100,
      tier: 'High Risk',
      tierColor: '#6b7280',
      tierDescription: 'Initial assessment required to compute financial fortress rating.',
      achievedCount: 0,
      gapsCount: 6,
      nextBestAction: 'Complete financial diagnostic survey.',
      pillars: [],
      fireCalculations: {},
    };
  },

  /**
   * Save / Upsert complete Financial Health record in MongoDB collection `financial_health`.
   */
  saveHealthRecord: async (record: Partial<FinancialHealthRecord>): Promise<FinancialHealthRecord> => {
    const payload: FinancialHealthRecord = {
      id: record.id || inMemoryRecordId,
      userId: record.userId || 'default_user',
      answers: record.answers || inMemoryHealthAnswers,
      fireSettings: record.fireSettings || inMemoryFireSettings,
      totalScore: record.totalScore ?? 0,
      maxScore: record.maxScore ?? 100,
      tier: record.tier || 'High Risk',
      tierColor: record.tierColor || '#6b7280',
      tierDescription: record.tierDescription || '',
      achievedCount: record.achievedCount ?? 0,
      gapsCount: record.gapsCount ?? 6,
      nextBestAction: record.nextBestAction || '',
      pillars: record.pillars || [],
      fireCalculations: record.fireCalculations || {},
      updatedAt: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post<FinancialHealthRecord>(ENDPOINT, payload);
      if (data?.id) inMemoryRecordId = data.id;
      if (data?.answers) inMemoryHealthAnswers = { ...data.answers };
      if (data?.fireSettings) inMemoryFireSettings = { ...data.fireSettings };
      return data || payload;
    } catch (error) {
      console.warn('[financialHealthApi] POST failed, cached locally:', error);
      return payload;
    }
  },

  /**
   * Toggle or update a specific health pillar answer and save to MongoDB `financial_health`.
   */
  updateHealthAnswer: async (
    pillarId: string,
    fulfilled: boolean,
    context?: {
      holdings: InvestmentHolding[];
      cashLiquidity: number;
      debtLiabilities: number;
      activeSipMonthly: number;
    }
  ): Promise<FinancialHealthRecord> => {
    inMemoryHealthAnswers[pillarId] = fulfilled;

    if (context) {
      return financialHealthApi.syncAndPersist({
        holdings: context.holdings,
        cashLiquidity: context.cashLiquidity,
        debtLiabilities: context.debtLiabilities,
        activeSipMonthly: context.activeSipMonthly,
        answersOverride: { [pillarId]: fulfilled },
      });
    }

    try {
      const { data } = await apiClient.patch<FinancialHealthRecord>(`${ENDPOINT}/answers`, {
        [pillarId]: fulfilled,
      });
      return data;
    } catch {
      return financialHealthApi.saveHealthRecord({
        answers: { ...inMemoryHealthAnswers },
      });
    }
  },

  /**
   * Update FIRE calculator settings and save to MongoDB `financial_health`.
   */
  updateFireSettings: async (
    settings: Partial<FireSettings>,
    context?: {
      holdings: InvestmentHolding[];
      cashLiquidity: number;
      debtLiabilities: number;
      activeSipMonthly: number;
    }
  ): Promise<FinancialHealthRecord> => {
    inMemoryFireSettings = { ...inMemoryFireSettings, ...settings };

    if (context) {
      return financialHealthApi.syncAndPersist({
        holdings: context.holdings,
        cashLiquidity: context.cashLiquidity,
        debtLiabilities: context.debtLiabilities,
        activeSipMonthly: context.activeSipMonthly,
        fireSettingsOverride: settings,
      });
    }

    try {
      const { data } = await apiClient.patch<FinancialHealthRecord>(`${ENDPOINT}/fire-settings`, settings);
      return data;
    } catch {
      return financialHealthApi.saveHealthRecord({
        fireSettings: { ...inMemoryFireSettings },
      });
    }
  },

  /**
   * Compute all diagnostic pillars & FIRE metrics with live data and persist to MongoDB `financial_health`.
   */
  syncAndPersist: async (params: {
    holdings: InvestmentHolding[];
    cashLiquidity: number;
    debtLiabilities: number;
    activeSipMonthly: number;
    fireSettingsOverride?: Partial<FireSettings>;
    answersOverride?: Record<string, boolean>;
  }): Promise<FinancialHealthRecord> => {
    const mergedAnswers = {
      ...inMemoryHealthAnswers,
      ...(params.answersOverride || {}),
    };
    inMemoryHealthAnswers = mergedAnswers;

    const mergedSettings = {
      ...inMemoryFireSettings,
      ...(params.fireSettingsOverride || {}),
    };
    inMemoryFireSettings = mergedSettings;

    const healthResult = computeFinancialHealth(
      params.holdings,
      params.cashLiquidity,
      params.debtLiabilities,
      params.activeSipMonthly,
      mergedSettings.monthlyExpenses,
      mergedAnswers
    );

    const portfolioVal = params.holdings.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );
    const netWorth = portfolioVal + params.cashLiquidity - params.debtLiabilities;

    const fireResult = calculateFireNumbers(
      netWorth,
      params.activeSipMonthly,
      mergedSettings
    );

    const recordPayload: FinancialHealthRecord = {
      id: inMemoryRecordId,
      userId: 'default_user',
      answers: mergedAnswers,
      fireSettings: mergedSettings,
      totalScore: healthResult.totalScore,
      maxScore: healthResult.maxScore,
      tier: healthResult.tier,
      tierColor: healthResult.tierColor,
      tierDescription: healthResult.tierDescription,
      achievedCount: healthResult.achievedCount,
      gapsCount: healthResult.gapsCount,
      nextBestAction: healthResult.nextBestAction,
      pillars: healthResult.pillars,
      fireCalculations: fireResult,
      updatedAt: new Date().toISOString(),
    };

    return financialHealthApi.saveHealthRecord(recordPayload);
  },
};

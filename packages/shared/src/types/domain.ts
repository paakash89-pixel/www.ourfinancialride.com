export type Region = "US" | "IN";
export type AccountingStandard = "US_GAAP" | "IFRS" | "IND_AS";

export type ScoringTemplate = "OPERATING_COMPANY_V1" | "FINANCIALS_V1";
export type SectorProfile =
  | "OPERATING_GENERAL"
  | "TECHNOLOGY_ASSET_LIGHT"
  | "CAPITAL_INTENSIVE"
  | "FINANCIALS";

export type DataConfidence = "HIGH" | "MED" | "LOW" | "BELOW_MINIMUM";
export type OwnerVerdict =
  | "Owner-Quality"
  | "Watchlist"
  | "Avoid for Long-Term Ownership"
  | "Insufficient history";

export interface FiscalPoint {
  year: number;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  operatingCashFlow?: number;
  capex?: number;
  totalDebt?: number;
  totalEquity?: number;
  totalAssets?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  interestExpense?: number;
  sharesOutstanding?: number;
  roic?: number;
  roe?: number;

  // Financial-sector friendly fields
  netInterestIncome?: number;
  nonInterestIncome?: number;
  efficiencyRatio?: number;
  capitalAdequacyRatio?: number;
  nonPerformingAssetsRatio?: number;
  loanLossCoverageRatio?: number;
}

export interface CompanyFinancials {
  ticker: string;
  region: Region;
  accountingStandard: AccountingStandard;
  template: ScoringTemplate;
  points: FiscalPoint[];
  currency: string;
  updatedAt: string;
}

export interface Driver {
  key: string;
  impact: number;
  explanation: string;
}

export interface ContributorBreakdown {
  profitabilityMarginStrength: number;
  debtBalanceSheetSafety: number;
  cashReality: number;
  durabilityCapitalEfficiency: number;
}

export interface OwnerScoreResult {
  ownerScore: number;
  contributors: ContributorBreakdown;
  verdict: OwnerVerdict;
  confidence: DataConfidence;
  yearsOfHistory: number;
  sectorProfile: SectorProfile;
  drivers: Driver[];
  positives: Driver[];
  negatives: Driver[];
  template: ScoringTemplate;
  asOf: string;
}

export type EntitlementPlan = "EXPLORER" | "OWNER";

export interface PccContractInput {
  horizonYears: number;
  maxDrawdownTolerance: 20 | 40 | 60;
  thesisHowMoney: string;
  thesisWhyWin10Years: string;
  thesisBreaksPermanently: string;
  breakConditionChecks: string[];
  breakConditionNotes?: string;
}

export type BehaviorEventType = "PANIC_SELL_SIMULATED" | "HELD";

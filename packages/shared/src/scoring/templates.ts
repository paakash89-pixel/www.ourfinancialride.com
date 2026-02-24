import type { ScoringTemplate, SectorProfile } from "../types/domain";
import operatingConfig from "./scoring_operating_v1.json";
import financialsConfig from "./scoring_financials_v1.json";

export interface TemplateWeights {
  profitability: number;
  debtSafety: number;
  cashReality: number;
  durability: number;
}

export const TEMPLATE_WEIGHTS: Record<ScoringTemplate, TemplateWeights> = {
  OPERATING_COMPANY_V1: operatingConfig.weights,
  FINANCIALS_V1: financialsConfig.weights
};

export interface SectorThresholds {
  operatingMarginFloor: number;
  operatingMarginCeiling: number;
  debtToEquityFloor: number;
  debtToEquityCeiling: number;
  interestCoverageFloor: number;
  interestCoverageCeiling: number;
  roicFloor: number;
  roicCeiling: number;
}

export const SECTOR_THRESHOLDS: Record<SectorProfile, SectorThresholds> = {
  OPERATING_GENERAL: operatingConfig.sectorThresholds.OPERATING_GENERAL,
  TECHNOLOGY_ASSET_LIGHT: operatingConfig.sectorThresholds.TECHNOLOGY_ASSET_LIGHT,
  CAPITAL_INTENSIVE: operatingConfig.sectorThresholds.CAPITAL_INTENSIVE,
  FINANCIALS: operatingConfig.sectorThresholds.FINANCIALS
};

export const MIN_HISTORY_YEARS = Math.max(
  operatingConfig.minHistoryYears,
  financialsConfig.minHistoryYears
);

export const SCORING_CONFIG_VERSIONS = {
  operating: operatingConfig.version,
  financials: financialsConfig.version
} as const;

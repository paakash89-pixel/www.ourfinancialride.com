import type {
  CompanyFinancials,
  ContributorBreakdown,
  DataConfidence,
  Driver,
  OwnerScoreResult,
  OwnerVerdict,
  ScoringTemplate,
  SectorProfile
} from "../types/domain";
import {
  average,
  clamp,
  consistency,
  invertNormalizeRatio,
  median,
  normalizeRatio,
  round2,
  stability,
  trend
} from "./helpers";
import {
  MIN_HISTORY_YEARS,
  SECTOR_THRESHOLDS,
  TEMPLATE_WEIGHTS
} from "./templates";

const MAX_CONTRIBUTOR = 25;

const safeRatio = (num?: number, den?: number): number | undefined => {
  if (num === undefined || den === undefined || den === 0) return undefined;
  return num / den;
};

const compact = (values: Array<number | undefined>): number[] =>
  values.filter((value): value is number => value !== undefined && Number.isFinite(value));

const defaultContributors: ContributorBreakdown = {
  profitabilityMarginStrength: 0,
  debtBalanceSheetSafety: 0,
  cashReality: 0,
  durabilityCapitalEfficiency: 0
};

const SECTOR_PROFILE_OVERRIDES: Record<string, SectorProfile> = {
  AAPL: "TECHNOLOGY_ASSET_LIGHT",
  MSFT: "TECHNOLOGY_ASSET_LIGHT",
  GOOGL: "TECHNOLOGY_ASSET_LIGHT",
  GOOG: "TECHNOLOGY_ASSET_LIGHT",
  META: "TECHNOLOGY_ASSET_LIGHT",
  NVDA: "TECHNOLOGY_ASSET_LIGHT",
  ADBE: "TECHNOLOGY_ASSET_LIGHT",
  CRM: "TECHNOLOGY_ASSET_LIGHT",
  INTU: "TECHNOLOGY_ASSET_LIGHT",
  ORCL: "TECHNOLOGY_ASSET_LIGHT"
};

const resolveTemplate = (
  template: ScoringTemplate | undefined,
  pointsSize: number
): ScoringTemplate => {
  if (template) return template;
  if (pointsSize >= 1) return "OPERATING_COMPANY_V1";
  return "OPERATING_COMPANY_V1";
};

const inferSectorProfile = (financials: CompanyFinancials): SectorProfile => {
  if (financials.template === "FINANCIALS_V1") return "FINANCIALS";
  const tickerOverride = SECTOR_PROFILE_OVERRIDES[financials.ticker.toUpperCase()];
  if (tickerOverride) return tickerOverride;

  const capexToRevenue = compact(
    financials.points.map((point) => safeRatio(point.capex, point.revenue))
  );
  const grossMargins = compact(
    financials.points.map((point) => safeRatio(point.grossProfit, point.revenue))
  );
  const operatingMargins = compact(
    financials.points.map((point) => safeRatio(point.operatingIncome, point.revenue))
  );

  const capexMedian = median(capexToRevenue);
  const grossAvg = average(grossMargins);
  const operatingAvg = average(operatingMargins);

  // Keep profile stable: if data depth is thin, default to general operating profile.
  if (capexToRevenue.length < 5 || (grossMargins.length < 5 && operatingMargins.length < 5)) {
    return "OPERATING_GENERAL";
  }

  if (capexMedian >= 0.12) return "CAPITAL_INTENSIVE";
  if (capexMedian <= 0.06 && grossAvg >= 0.35 && operatingAvg >= 0.16) {
    return "TECHNOLOGY_ASSET_LIGHT";
  }
  return "OPERATING_GENERAL";
};

const fieldIsFinite = (
  point: CompanyFinancials["points"][number],
  field: keyof CompanyFinancials["points"][number]
): boolean => typeof point[field] === "number" && Number.isFinite(point[field] as number);

const completenessScore = (
  point: CompanyFinancials["points"][number],
  coreFields: Array<keyof CompanyFinancials["points"][number]>,
  supportingFields: Array<keyof CompanyFinancials["points"][number]>
): number => {
  if (!coreFields.length) return 0;
  const corePresent = coreFields.filter((field) => fieldIsFinite(point, field)).length;
  const supportingPresent = supportingFields.filter((field) => fieldIsFinite(point, field)).length;
  const coreRatio = corePresent / coreFields.length;
  const supportingRatio = supportingFields.length ? supportingPresent / supportingFields.length : 0;
  return coreRatio * 0.8 + supportingRatio * 0.2;
};

const dataConfidence = (
  financials: CompanyFinancials,
  template: ScoringTemplate
): DataConfidence => {
  const years = financials.points.length;
  if (years < MIN_HISTORY_YEARS) return "BELOW_MINIMUM";

  const coreFields: Array<keyof CompanyFinancials["points"][number]> =
    template === "FINANCIALS_V1"
      ? ["netIncome", "totalEquity", "capitalAdequacyRatio"]
      : ["revenue", "operatingIncome", "netIncome", "operatingCashFlow", "totalEquity"];
  const supportingFields: Array<keyof CompanyFinancials["points"][number]> =
    template === "FINANCIALS_V1"
      ? ["operatingCashFlow", "loanLossCoverageRatio", "nonPerformingAssetsRatio"]
      : ["capex", "totalDebt", "sharesOutstanding"];

  let completeYears = 0;
  for (const point of financials.points) {
    const isComplete = completenessScore(point, coreFields, supportingFields) >= 0.7;
    if (isComplete) completeYears += 1;
  }

  if (completeYears >= 10) return "HIGH";
  if (completeYears >= MIN_HISTORY_YEARS) return "MED";
  return "BELOW_MINIMUM";
};

const scoreOperatingCompany = (
  financials: CompanyFinancials,
  sectorProfile: SectorProfile
): { contributors: ContributorBreakdown; drivers: Driver[] } => {
  const points = financials.points;
  const thresholds = SECTOR_THRESHOLDS[sectorProfile];

  const operatingMargins = compact(
    points.map((point) => safeRatio(point.operatingIncome, point.revenue))
  );
  const grossMargins = compact(
    points.map((point) => safeRatio(point.grossProfit, point.revenue))
  );
  const netMargins = compact(
    points.map((point) => safeRatio(point.netIncome, point.revenue))
  );
  const debtToEquity = compact(
    points.map((point) => safeRatio(point.totalDebt, point.totalEquity))
  );
  const interestCoverage = compact(
    points.map((point) => safeRatio(point.operatingIncome, point.interestExpense))
  );
  const currentRatios = compact(
    points.map((point) => safeRatio(point.currentAssets, point.currentLiabilities))
  );
  const ocfToIncome = compact(
    points.map((point) => safeRatio(point.operatingCashFlow, point.netIncome))
  );
  const fcfMargins = compact(
    points.map((point) =>
      safeRatio(
        (point.operatingCashFlow ?? 0) - (point.capex ?? 0),
        point.revenue
      )
    )
  );
  const roic = compact(points.map((point) => point.roic));
  const roe = compact(points.map((point) => point.roe));
  const revenueSeries = compact(points.map((point) => point.revenue));
  const sharesSeries = compact(points.map((point) => point.sharesOutstanding));

  const profitabilityParts = [
    normalizeRatio(
      average(operatingMargins),
      thresholds.operatingMarginFloor,
      thresholds.operatingMarginCeiling
    ),
    normalizeRatio(average(grossMargins), 0.2, 0.75),
    normalizeRatio(average(roe), 0.08, 0.3),
    stability(netMargins)
  ];

  const debtParts = [
    invertNormalizeRatio(
      median(debtToEquity),
      thresholds.debtToEquityFloor,
      thresholds.debtToEquityCeiling
    ),
    normalizeRatio(
      median(interestCoverage),
      thresholds.interestCoverageFloor,
      thresholds.interestCoverageCeiling
    ),
    normalizeRatio(median(currentRatios), 1, 2.5),
    invertNormalizeRatio(trend(debtToEquity), -0.2, 0.2)
  ];

  const cashParts = [
    normalizeRatio(average(ocfToIncome), 0.7, 1.6),
    normalizeRatio(average(fcfMargins), 0.02, 0.25),
    consistency(fcfMargins, (value) => value > 0),
    stability(ocfToIncome)
  ];

  const durabilityParts = [
    normalizeRatio(average(roic), thresholds.roicFloor, thresholds.roicCeiling),
    stability(roic),
    normalizeRatio(trend(revenueSeries), 0, 0.3),
    invertNormalizeRatio(trend(sharesSeries), -0.2, 0.2)
  ];

  const profitability = round2(average(profitabilityParts) * MAX_CONTRIBUTOR);
  const debtSafety = round2(average(debtParts) * MAX_CONTRIBUTOR);
  const cashReality = round2(average(cashParts) * MAX_CONTRIBUTOR);
  const durability = round2(average(durabilityParts) * MAX_CONTRIBUTOR);

  const drivers: Driver[] = [
    {
      key: "operating_margin",
      impact: profitabilityParts[0] - 0.5,
      explanation: "Average operating margin level across fiscal history."
    },
    {
      key: "roe_level",
      impact: profitabilityParts[2] - 0.5,
      explanation: "Return on equity indicates owner earnings power."
    },
    {
      key: "debt_to_equity",
      impact: debtParts[0] - 0.5,
      explanation: "Lower debt-to-equity improves balance sheet resilience."
    },
    {
      key: "interest_coverage",
      impact: debtParts[1] - 0.5,
      explanation: "Ability to service debt via operating earnings."
    },
    {
      key: "cash_conversion",
      impact: cashParts[0] - 0.5,
      explanation: "Operating cash flow should track accounting earnings."
    },
    {
      key: "fcf_margin",
      impact: cashParts[1] - 0.5,
      explanation: "Free cash flow supports long-term owner compounding."
    },
    {
      key: "roic",
      impact: durabilityParts[0] - 0.5,
      explanation: "Sustained returns on capital reflect economic moat quality."
    },
    {
      key: "revenue_trend",
      impact: durabilityParts[2] - 0.5,
      explanation: "Revenue direction helps assess business durability."
    }
  ];

  return {
    contributors: {
      profitabilityMarginStrength: clamp(profitability, 0, MAX_CONTRIBUTOR),
      debtBalanceSheetSafety: clamp(debtSafety, 0, MAX_CONTRIBUTOR),
      cashReality: clamp(cashReality, 0, MAX_CONTRIBUTOR),
      durabilityCapitalEfficiency: clamp(durability, 0, MAX_CONTRIBUTOR)
    },
    drivers
  };
};

const scoreFinancialsTemplate = (
  financials: CompanyFinancials
): { contributors: ContributorBreakdown; drivers: Driver[] } => {
  const points = financials.points;

  const roe = compact(points.map((point) => point.roe));
  const efficiency = compact(points.map((point) => point.efficiencyRatio));
  const capAdequacy = compact(points.map((point) => point.capitalAdequacyRatio));
  const npa = compact(points.map((point) => point.nonPerformingAssetsRatio));
  const loanLoss = compact(points.map((point) => point.loanLossCoverageRatio));
  const cashProxy = compact(
    points.map((point) => safeRatio(point.operatingCashFlow, point.netIncome))
  );
  const netIncomeSeries = compact(points.map((point) => point.netIncome));

  const profitabilityParts = [
    normalizeRatio(average(roe), 0.08, 0.2),
    invertNormalizeRatio(average(efficiency), 0.35, 0.7),
    stability(roe),
    normalizeRatio(trend(netIncomeSeries), 0, 0.3)
  ];

  const debtParts = [
    normalizeRatio(average(capAdequacy), 0.1, 0.2),
    invertNormalizeRatio(average(npa), 0.005, 0.08),
    normalizeRatio(average(loanLoss), 0.7, 1.5),
    stability(capAdequacy)
  ];

  const cashParts = [
    normalizeRatio(average(cashProxy), 0.7, 1.5),
    consistency(cashProxy, (value) => value > 0.9),
    stability(cashProxy),
    normalizeRatio(average(netIncomeSeries), 1, 1_000_000_000)
  ];

  const durabilityParts = [
    stability(netIncomeSeries),
    normalizeRatio(trend(netIncomeSeries), 0, 0.3),
    stability(roe),
    normalizeRatio(average(roe), 0.08, 0.2)
  ];

  const profitability = round2(average(profitabilityParts) * MAX_CONTRIBUTOR);
  const debtSafety = round2(average(debtParts) * MAX_CONTRIBUTOR);
  const cashReality = round2(average(cashParts) * MAX_CONTRIBUTOR);
  const durability = round2(average(durabilityParts) * MAX_CONTRIBUTOR);

  const drivers: Driver[] = [
    {
      key: "roe",
      impact: profitabilityParts[0] - 0.5,
      explanation: "Return on equity reflects franchise earnings power."
    },
    {
      key: "efficiency_ratio",
      impact: profitabilityParts[1] - 0.5,
      explanation: "Lower efficiency ratio implies stronger cost discipline."
    },
    {
      key: "capital_adequacy",
      impact: debtParts[0] - 0.5,
      explanation: "Higher capital buffers support stress resilience."
    },
    {
      key: "npa_ratio",
      impact: debtParts[1] - 0.5,
      explanation: "Lower bad-asset ratio improves balance sheet quality."
    },
    {
      key: "loan_loss_coverage",
      impact: debtParts[2] - 0.5,
      explanation: "Provisioning coverage supports downside protection."
    },
    {
      key: "cash_earnings_alignment",
      impact: cashParts[0] - 0.5,
      explanation: "Cash realization of accounting profits supports quality."
    },
    {
      key: "net_income_trend",
      impact: durabilityParts[1] - 0.5,
      explanation: "Earnings trend contributes to durability assessment."
    }
  ];

  return {
    contributors: {
      profitabilityMarginStrength: clamp(profitability, 0, MAX_CONTRIBUTOR),
      debtBalanceSheetSafety: clamp(debtSafety, 0, MAX_CONTRIBUTOR),
      cashReality: clamp(cashReality, 0, MAX_CONTRIBUTOR),
      durabilityCapitalEfficiency: clamp(durability, 0, MAX_CONTRIBUTOR)
    },
    drivers
  };
};

const verdictFromScore = (score: number, confidence: DataConfidence): OwnerVerdict => {
  if (confidence === "BELOW_MINIMUM") return "Insufficient history";
  if (score >= 80) {
    return confidence === "LOW" ? "Watchlist" : "Owner-Quality";
  }
  if (score >= 60) return "Watchlist";
  return "Avoid for Long-Term Ownership";
};

const topDrivers = (drivers: Driver[]): { positives: Driver[]; negatives: Driver[] } => {
  const positives = [...drivers]
    .filter((driver) => driver.impact > 0)
    .sort((a, b) => b.impact - a.impact || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((driver) => ({ ...driver, impact: round2(driver.impact) }));

  const negatives = [...drivers]
    .filter((driver) => driver.impact < 0)
    .sort((a, b) => a.impact - b.impact || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((driver) => ({ ...driver, impact: round2(driver.impact) }));

  return { positives, negatives };
};

const normalizedDrivers = (drivers: Driver[]): Driver[] =>
  [...drivers]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact) || a.key.localeCompare(b.key))
    .map((driver) => ({ ...driver, impact: round2(driver.impact) }));

export const scoreOwnerQuality = (financials: CompanyFinancials): OwnerScoreResult => {
  const template = resolveTemplate(financials.template, financials.points.length);
  const sectorProfile =
    template === "FINANCIALS_V1" ? "FINANCIALS" : inferSectorProfile(financials);
  const confidence = dataConfidence(financials, template);
  const yearsOfHistory = financials.points.length;

  if (confidence === "BELOW_MINIMUM") {
    return {
      ownerScore: 0,
      contributors: defaultContributors,
      verdict: "Insufficient history",
      confidence,
      yearsOfHistory,
      sectorProfile,
      drivers: [],
      positives: [],
      negatives: [],
      template,
      asOf: new Date().toISOString()
    };
  }

  const weights = TEMPLATE_WEIGHTS[template];
  const { contributors, drivers } =
    template === "FINANCIALS_V1"
      ? scoreFinancialsTemplate(financials)
      : scoreOperatingCompany(financials, sectorProfile);

  const rawTotal =
    contributors.profitabilityMarginStrength * weights.profitability +
    contributors.debtBalanceSheetSafety * weights.debtSafety +
    contributors.cashReality * weights.cashReality +
    contributors.durabilityCapitalEfficiency * weights.durability;

  const weightSum =
    weights.profitability +
    weights.debtSafety +
    weights.cashReality +
    weights.durability;

  const ownerScore = round2(clamp((rawTotal / (weightSum * MAX_CONTRIBUTOR)) * 100, 0, 100));
  const verdict = verdictFromScore(ownerScore, confidence);
  const driversSorted = normalizedDrivers(drivers);
  const { positives, negatives } = topDrivers(drivers);

  return {
    ownerScore,
    contributors,
    verdict,
    confidence,
    yearsOfHistory,
    sectorProfile,
    drivers: driversSorted,
    positives,
    negatives,
    template,
    asOf: new Date().toISOString()
  };
};

import type { CompanyFinancials } from "../types/domain";

export type OwnerQualityBadge = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT_HISTORY";

export interface SimpleOwnerScoreResult {
  score: number | null;
  badge: OwnerQualityBadge;
  yearsOfHistory: number;
  explanation: string;
  components: {
    profitability: number;
    cashDiscipline: number;
    balanceSheet: number;
    capitalEfficiency: number;
  };
}

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const average = (values: number[]): number =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

const componentScore = (ratio: number): number => round2(clamp(ratio, 0, 1) * 25);

export const scoreSimpleOwnerQuality = (
  financials: CompanyFinancials
): SimpleOwnerScoreResult => {
  const points = [...financials.points].sort((a, b) => a.year - b.year);
  const yearsOfHistory = points.length;

  if (yearsOfHistory < 7) {
    return {
      score: null,
      badge: "INSUFFICIENT_HISTORY",
      yearsOfHistory,
      explanation: "Insufficient history for scoring (minimum 7 annual periods).",
      components: {
        profitability: 0,
        cashDiscipline: 0,
        balanceSheet: 0,
        capitalEfficiency: 0
      }
    };
  }

  const profitableYears = points.filter(
    (point) => typeof point.netIncome === "number" && point.netIncome > 0
  ).length;
  const profitability = componentScore(profitableYears / yearsOfHistory);

  const cashSupportYears = points.filter((point) => {
    if (
      typeof point.netIncome !== "number" ||
      typeof point.operatingCashFlow !== "number"
    ) {
      return false;
    }
    return point.operatingCashFlow >= point.netIncome && point.operatingCashFlow > 0;
  }).length;
  const cashDiscipline = componentScore(cashSupportYears / yearsOfHistory);

  const debtToEquityValues = points
    .map((point) => {
      if (
        typeof point.totalDebt !== "number" ||
        typeof point.totalEquity !== "number" ||
        point.totalEquity <= 0
      ) {
        return undefined;
      }
      return point.totalDebt / point.totalEquity;
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const debtToEquityMedian = median(debtToEquityValues);
  const balanceSheet = componentScore(1 - clamp(debtToEquityMedian / 2, 0, 1));

  const efficiencyValues = points
    .map((point) => {
      if (typeof point.roe === "number" && Number.isFinite(point.roe)) return point.roe;
      if (typeof point.roic === "number" && Number.isFinite(point.roic)) return point.roic;
      return undefined;
    })
    .filter((value): value is number => typeof value === "number");
  const efficiencyAvg = average(efficiencyValues);
  const capitalEfficiency = componentScore(clamp((efficiencyAvg - 0.02) / 0.18, 0, 1));

  const score = round2(
    profitability + cashDiscipline + balanceSheet + capitalEfficiency
  );
  const badge: OwnerQualityBadge =
    score >= 75 ? "HIGH" : score >= 55 ? "MODERATE" : "LOW";

  return {
    score,
    badge,
    yearsOfHistory,
    explanation:
      badge === "HIGH"
        ? "Business quality appears durable on long-term fundamentals."
        : badge === "MODERATE"
          ? "Business quality is mixed and needs monitoring."
          : "Business quality is currently weak on core long-term signals.",
    components: {
      profitability,
      cashDiscipline,
      balanceSheet,
      capitalEfficiency
    }
  };
};

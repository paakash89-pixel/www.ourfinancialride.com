import { z } from "zod";
import { USD_INR_RATE } from "./currency";

const positive = (label: string, min = 0) =>
  z.number().min(min, `${label} must be at least ${min}`).finite();

const practicalRange = (label: string, min: number, max: number) =>
  z
    .number()
    .finite()
    .min(min, `${label} is too low to be practical. Use at least ${min.toLocaleString()}.`)
    .max(max, `${label} is too high to be practical. Use ${max.toLocaleString()} or less.`);

const practicalPercent = (label: string, min: number, max: number) =>
  z
    .number()
    .finite()
    .min(min, `${label} is too low to be practical. Enter at least ${min}%.`)
    .max(max, `${label} is too high to be practical. Enter ${max}% or less.`);

const practicalSignedPercent = (label: string, min: number, max: number) =>
  z
    .number()
    .finite()
    .min(min, `${label} is too low to be practical. Enter at least ${min}%.`)
    .max(max, `${label} is too high to be practical. Enter ${max}% or less.`);

const annualToMonthly = (annualPct: number): number =>
  Math.pow(1 + annualPct / 100, 1 / 12) - 1;

const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export const compoundSchema = z.object({
  initialAmount: practicalRange("Initial amount", 1000, 5000000000),
  monthlyContribution: practicalRange("Monthly contribution", 0, 100000000),
  years: practicalRange("Years", 1, 80),
  annualReturnPct: practicalPercent("Annual return", 0, 20),
  inflationPct: practicalPercent("Inflation", 0, 15)
});

export type CompoundInput = z.infer<typeof compoundSchema>;

export interface CompoundPoint {
  year: number;
  nominal: number;
  real: number;
}

export const computeCompound = (raw: CompoundInput) => {
  const input = compoundSchema.parse(raw);
  const monthlyRate = annualToMonthly(input.annualReturnPct);
  const months = input.years * 12;

  const growthFactor = Math.pow(1 + monthlyRate, months);
  const annuityFactor =
    monthlyRate === 0 ? months : (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

  const futureValueNominal =
    input.initialAmount * growthFactor + input.monthlyContribution * annuityFactor;

  const futureValueReal =
    futureValueNominal / Math.pow(1 + input.inflationPct / 100, input.years);

  const totalContributions = input.initialAmount + input.monthlyContribution * months;
  const totalGrowth = futureValueNominal - totalContributions;

  const points: CompoundPoint[] = [];
  for (let year = 1; year <= input.years; year += 1) {
    const m = year * 12;
    const factor = Math.pow(1 + monthlyRate, m);
    const nominal =
      input.initialAmount * factor +
      input.monthlyContribution * (monthlyRate === 0 ? m : (factor - 1) / monthlyRate);

    points.push({
      year,
      nominal,
      real: nominal / Math.pow(1 + input.inflationPct / 100, year)
    });
  }

  let score = 90;
  if (input.monthlyContribution <= 0) score -= 25;
  if (input.years < 10) score -= (10 - input.years) * 3;
  if (input.annualReturnPct <= input.inflationPct) score -= 20;

  const recommendation =
    input.monthlyContribution <= 0
      ? "No monthly investing yet. Start a fixed auto-invest this month."
      : input.years < 10
        ? "Extend your horizon to 12-15 years."
        : "Increase monthly investing by 10% after each raise.";

  return {
    futureValueNominal,
    futureValueReal,
    totalContributions,
    totalGrowth,
    points,
    disciplineScore: clampScore(score),
    recommendation,
    explanation:
      "Nominal shows total growth. Real adjusts for inflation."
  };
};

export const fiSchema = z.object({
  annualExpenses: practicalRange("Annual expenses", 10000, 500000000),
  withdrawalRatePct: practicalPercent("Withdrawal rate", 2, 7),
  currentPortfolio: practicalRange("Current portfolio", 0, 5000000000),
  annualSavings: practicalRange("Annual savings", 0, 500000000),
  annualReturnPct: practicalPercent("Annual return", 0, 15),
  inflationPct: practicalPercent("Inflation", 0, 12)
});

export type FIInput = z.infer<typeof fiSchema>;

export interface FiPoint {
  year: number;
  portfolio: number;
  fiLine: number;
}

const annualToRealReturn = (
  annualReturnPct: number,
  inflationPct: number
): number => (1 + annualReturnPct / 100) / (1 + inflationPct / 100) - 1;

const simulateFi = (
  portfolioStart: number,
  annualSavings: number,
  annualReturnPct: number,
  inflationPct: number,
  fiNumber: number,
  horizonYears = 60
) => {
  const points: FiPoint[] = [];
  let portfolio = portfolioStart;
  const fiLine = fiNumber;
  const realReturn = annualToRealReturn(annualReturnPct, inflationPct);
  let yearsToFI: number | null = null;

  for (let year = 0; year <= horizonYears; year += 1) {
    points.push({ year, portfolio, fiLine });

    if (portfolio >= fiLine && yearsToFI === null) {
      yearsToFI = year;
      break;
    }

    portfolio = portfolio * (1 + realReturn) + annualSavings;
  }

  return { yearsToFI, points };
};

export const computeFi = (raw: FIInput) => {
  const input = fiSchema.parse(raw);

  const fiNumber = input.annualExpenses / (input.withdrawalRatePct / 100);
  const hasArrived = input.currentPortfolio >= fiNumber;
  const baseSimulation = simulateFi(
    input.currentPortfolio,
    input.annualSavings,
    input.annualReturnPct,
    input.inflationPct
    ,
    fiNumber
  );

  const now = new Date();
  const targetYear =
    baseSimulation.yearsToFI === null ? null : now.getFullYear() + baseSimulation.yearsToFI;

  const scenarios = [6, 8, 10].map((rate) => {
    const simulation = simulateFi(
      input.currentPortfolio,
      input.annualSavings,
      rate,
      input.inflationPct
      ,
      fiNumber
    );

    return {
      rate,
      yearsToFI: simulation.yearsToFI
    };
  });

  const savingsRateApprox = (input.annualSavings / (input.annualExpenses + input.annualSavings)) * 100;
  let score = 92;
  if (hasArrived) {
    score = 100;
  } else {
    if (savingsRateApprox < 25) score -= (25 - savingsRateApprox) * 1.2;
    if ((baseSimulation.yearsToFI ?? 60) > 15) score -= 12;
  }

  const recommendation = hasArrived
    ? "You have arrived. Protect fixed costs and avoid lifestyle creep."
    : savingsRateApprox < 25
      ? "Raise savings to at least 25%."
      : (baseSimulation.yearsToFI ?? 100) > 12
        ? "Reduce fixed costs to speed up FI."
        : "You are on track. Stay consistent.";

  return {
    fiNumber,
    yearsToFI: baseSimulation.yearsToFI,
    targetYear,
    points: baseSimulation.points,
    scenarios,
    hasArrived,
    disciplineScore: clampScore(score),
    recommendation,
    explanation:
      "FI number is annual expenses divided by withdrawal rate. Timeline is shown in real terms."
  };
};

export const savingsGuardSchema = z.object({
  annualAfterTaxIncome: practicalRange("Annual after-tax income", 10000, 1000000000),
  annualFixedCosts: practicalRange("Annual fixed costs", 0, 800000000),
  annualVariableJoy: practicalRange("Annual variable joy", 0, 400000000),
  annualOtherVariable: practicalRange("Annual other variable", 0, 400000000)
}).refine(
  (values) =>
    values.annualFixedCosts + values.annualVariableJoy + values.annualOtherVariable <=
    values.annualAfterTaxIncome * 1.2,
  {
    message:
      "Total spending is impractically high for this model. Reduce spending or increase income inputs.",
    path: ["annualOtherVariable"]
  }
);

export type SavingsGuardInput = z.infer<typeof savingsGuardSchema>;

export const computeSavingsGuard = (raw: SavingsGuardInput) => {
  const input = savingsGuardSchema.parse(raw);

  const spending =
    input.annualFixedCosts + input.annualVariableJoy + input.annualOtherVariable;
  const savings = input.annualAfterTaxIncome - spending;
  const savingsRate = (savings / input.annualAfterTaxIncome) * 100;
  const fixedCostRatio = (input.annualFixedCosts / input.annualAfterTaxIncome) * 100;

  let score = 100;
  if (savingsRate < 25) score -= (25 - savingsRate) * 3;
  if (fixedCostRatio > 50) score -= (fixedCostRatio - 50) * 1.5;

  const targetSavings = input.annualAfterTaxIncome * 0.25;
  const requiredAnnualDelta = Math.max(0, targetSavings - savings);
  const requiredMonthlyDelta = requiredAnnualDelta / 12;

  const recommendation =
    requiredMonthlyDelta > 0
      ? "To reach 25%, reduce fixed costs first."
      : "Savings rate is above 25%. Keep fixed costs controlled.";

  return {
    savings,
    savingsRate,
    fixedCostRatio,
    disciplineScore: clampScore(score),
    warning:
      savingsRate < 25
        ? "Savings rate is below 25%."
        : "Savings rate is healthy.",
    recommendation,
    requiredMonthlyDelta,
    chartData: {
      fixed: input.annualFixedCosts,
      variableJoy: input.annualVariableJoy,
      otherVariable: input.annualOtherVariable,
      savings: Math.max(0, savings)
    }
  };
};

export const allocationSchema = z
  .object({
    usEquityPct: positive("US equity %", 0).max(100),
    indiaEquityPct: positive("India equity %", 0).max(100),
    startingPortfolio: positive("Starting portfolio", 1),
    years: positive("Years", 1).max(40),
    usCagrPct: positive("US CAGR", 0).max(25),
    indiaCagrPct: positive("India CAGR", 0).max(25),
    fxChangePct: positive("FX change", 0).max(10)
  })
  .refine(
    (values) => Math.abs(values.usEquityPct + values.indiaEquityPct - 100) <= 0.01,
    {
      message: "Allocation must sum to 100%.",
      path: ["indiaEquityPct"]
    }
  );

export type AllocationInput = z.infer<typeof allocationSchema>;

export interface AllocationPoint {
  year: number;
  inrValue: number;
  usdValue: number;
}

export const computeAllocation = (raw: AllocationInput) => {
  const input = allocationSchema.parse(raw);

  const usStartInr = input.startingPortfolio * (input.usEquityPct / 100);
  const indiaEqStart = input.startingPortfolio * (input.indiaEquityPct / 100);
  const usStartUsd = usStartInr / USD_INR_RATE;

  const points: AllocationPoint[] = [];

  for (let year = 0; year <= input.years; year += 1) {
    const fxFactor = Math.pow(1 + input.fxChangePct / 100, year);
    const usUsd = usStartUsd * Math.pow(1 + input.usCagrPct / 100, year);
    const usdInrRate = USD_INR_RATE * fxFactor;
    const usInr = usUsd * usdInrRate;
    const indiaEqInr = indiaEqStart * Math.pow(1 + input.indiaCagrPct / 100, year);

    const projectedINRValue = usInr + indiaEqInr;
    const projectedUSDValue = projectedINRValue / usdInrRate;

    points.push({
      year,
      inrValue: projectedINRValue,
      usdValue: projectedUSDValue
    });
  }

  const latest = points[points.length - 1];

  let score = 100;
  if (input.usEquityPct < 25 || input.indiaEquityPct < 25) score -= 20;
  if (input.usEquityPct > 80 || input.indiaEquityPct > 80) score -= 10;

  const recommendation =
    input.usEquityPct < 30
      ? "Increase US exposure gradually for currency diversification and global earnings participation."
      : input.indiaEquityPct < 30
        ? "Increase India exposure to balance spending-currency risk if most expenses are INR."
        : "Current split is balanced. Review annually, not after short-term market moves.";

  return {
    projectedUSDValue: latest.usdValue,
    projectedINRValue: latest.inrValue,
    diversificationScore: clampScore(score),
    points,
    disciplineScore: clampScore(score),
    recommendation,
    explanation:
      "US equity INR value includes FX movement while India equity remains INR-based. Results are scenario projections, not guarantees."
  };
};

export const withdrawalSchema = z.object({
  startingPortfolio: practicalRange("Starting portfolio", 10000, 10000000000),
  annualWithdrawal: practicalRange("Annual withdrawal", 0, 2000000000),
  annualReturnPct: practicalPercent("Annual return", 0, 12),
  inflationPct: practicalPercent("Inflation", 0, 12),
  currentAge: practicalRange("Current age", 21, 90),
  spendingDeclineStartAge: practicalRange("Spending decline start age", 30, 100),
  realSpendingChangePct: practicalSignedPercent("Real spending change", -3, 3),
  years: practicalRange("Years", 1, 60)
}).superRefine((values, ctx) => {
  if (values.spendingDeclineStartAge < values.currentAge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["spendingDeclineStartAge"],
      message: "Spending decline start age should be your current age or later."
    });
  }
});

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

export interface WithdrawalPoint {
  year: number;
  age: number;
  portfolio: number;
  withdrawal: number;
}

export const computeWithdrawal = (raw: WithdrawalInput) => {
  const input = withdrawalSchema.parse(raw);

  let portfolio = input.startingPortfolio;
  let annualWithdrawalNominal = input.annualWithdrawal;
  const inflationFactor = 1 + input.inflationPct / 100;
  const points: WithdrawalPoint[] = [
    {
      year: 0,
      age: input.currentAge,
      portfolio,
      withdrawal: annualWithdrawalNominal
    }
  ];
  let sustainable = true;
  let totalWithdrawalsNominal = 0;
  let totalWithdrawalsReal = 0;

  for (let year = 1; year <= input.years; year += 1) {
    totalWithdrawalsNominal += annualWithdrawalNominal;
    totalWithdrawalsReal +=
      input.inflationPct === 0
        ? annualWithdrawalNominal
        : annualWithdrawalNominal / Math.pow(1 + input.inflationPct / 100, year - 1);

    portfolio = portfolio * (1 + input.annualReturnPct / 100) - annualWithdrawalNominal;

    const ageAtPoint = input.currentAge + year;
    const applyRealChange = ageAtPoint >= input.spendingDeclineStartAge;
    const nextWithdrawalNominal =
      annualWithdrawalNominal *
      inflationFactor *
      (applyRealChange ? 1 + input.realSpendingChangePct / 100 : 1);

    points.push({
      year,
      age: ageAtPoint,
      portfolio: Math.max(0, portfolio),
      withdrawal: nextWithdrawalNominal
    });

    if (portfolio <= 0) {
      sustainable = false;
      break;
    }

    annualWithdrawalNominal = nextWithdrawalNominal;
  }

  const withdrawalRate = (input.annualWithdrawal / input.startingPortfolio) * 100;
  let score = 90;
  if (withdrawalRate > 4) score -= (withdrawalRate - 4) * 8;
  if (!sustainable) score -= 30;

  const recommendation =
    !sustainable
      ? "Lower annual withdrawals or delay retirement to keep withdrawals below portfolio growth."
      : withdrawalRate > 4
        ? "Your plan works, but margins are thin. Keep a spending buffer."
        : input.spendingDeclineStartAge > input.currentAge + input.years
          ? "Spending decline starts after this horizon. Extend years or lower start age."
        : input.realSpendingChangePct > 0.5
          ? "Real spending growth is high. Keep this assumption realistic."
        : "Conservative assumptions are working. Review yearly.";

  return {
    sustainable,
    endingPortfolio: Math.max(0, portfolio),
    points,
    yearsModeled: points[points.length - 1]?.year ?? 0,
    totalWithdrawalsNominal,
    totalWithdrawalsReal,
    currentAge: input.currentAge,
    declineStartAge: input.spendingDeclineStartAge,
    disciplineScore: clampScore(score),
    recommendation,
    explanation:
      "Withdrawals rise with inflation. Real spending change starts at your chosen age."
  };
};

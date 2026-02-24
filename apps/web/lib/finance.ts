export interface CompoundInterestInput {
  initialAmount: number;
  monthlyInvestment: number;
  annualReturnPct: number;
  years: number;
  inflationPct: number;
}

export interface CompoundInterestPoint {
  year: number;
  nominal: number;
  real: number;
  invested: number;
}

export interface CompoundInterestResult {
  nominalValue: number;
  inflationAdjustedValue: number;
  realPurchasingPower: number;
  consistencyScore: number;
  points: CompoundInterestPoint[];
  explanation: string;
  suggestion: string;
}

export interface FiInput {
  annualExpenses: number;
  withdrawalRatePct: number;
  yearsToRetirement: number;
  expectedReturnPct?: number;
  annualInflationPct?: number;
}

export interface FiPoint {
  year: number;
  targetCorpus: number;
  projectedCorpus: number;
}

export interface FiResult {
  fiNumber: number;
  monthlySipRequired: number;
  points: FiPoint[];
  explanation: string;
  suggestion: string;
}

export interface SipSwpInput {
  monthlySip: number;
  accumulationYears: number;
  annualReturnPct: number;
  swpYears: number;
  swpAnnualReturnPct: number;
  inflationPct: number;
  startingMonthlySwp: number;
}

export interface SipSwpPoint {
  month: number;
  yearLabel: string;
  corpus: number;
  phase: "SIP" | "SWP";
}

export interface SipSwpResult {
  retirementCorpus: number;
  endingCorpus: number;
  monthsUntilDepletion: number | null;
  sustainable: boolean;
  points: SipSwpPoint[];
  explanation: string;
  suggestion: string;
}

export interface UsRetirementInput {
  annualSalary: number;
  employeeContributionPct: number;
  employerMatchPct: number;
  annualRaisePct: number;
  annualReturnPct: number;
  years: number;
  rothAnnualContribution: number;
  retirementTaxRatePct: number;
}

export interface UsRetirementPoint {
  year: number;
  preTax401k: number;
  roth: number;
}

export interface UsRetirementResult {
  preTax401k: number;
  rothBalance: number;
  afterTaxRetirementValue: number;
  estimatedMonthlyIncomeAt4Pct: number;
  points: UsRetirementPoint[];
  explanation: string;
  suggestion: string;
}

export interface BudgetInput {
  monthlyTakeHome: number;
  needsPct: number;
  wantsPct: number;
}

export interface BudgetResult {
  needsAmount: number;
  wantsAmount: number;
  savingsAmount: number;
  savingsPct: number;
  emergencyFundTarget: number;
  explanation: string;
  suggestion: string;
}

const round = (value: number): number => Math.round(value * 100) / 100;

const monthRateFromAnnualPct = (annualPct: number): number =>
  Math.pow(1 + annualPct / 100, 1 / 12) - 1;

export const calculateCompoundInterest = (
  input: CompoundInterestInput
): CompoundInterestResult => {
  const monthlyRate = monthRateFromAnnualPct(input.annualReturnPct);
  const monthlyInflation = monthRateFromAnnualPct(input.inflationPct);

  const totalMonths = Math.max(1, Math.round(input.years * 12));
  let nominal = Math.max(0, input.initialAmount);
  let invested = Math.max(0, input.initialAmount);
  const points: CompoundInterestPoint[] = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    nominal = (nominal + Math.max(0, input.monthlyInvestment)) * (1 + monthlyRate);
    invested += Math.max(0, input.monthlyInvestment);

    if (month % 12 === 0 || month === totalMonths) {
      const inflationFactor = Math.pow(1 + monthlyInflation, month);
      points.push({
        year: Math.ceil(month / 12),
        nominal: round(nominal),
        real: round(nominal / inflationFactor),
        invested: round(invested)
      });
    }
  }

  const inflationFactor = Math.pow(1 + monthlyInflation, totalMonths);
  const inflationAdjustedValue = nominal / inflationFactor;
  const realPurchasingPower = inflationAdjustedValue;

  const yearsScore = Math.min(40, input.years * 1.8);
  const habitScore = input.monthlyInvestment > 0 ? 30 : 0;
  const inflationScore = input.annualReturnPct > input.inflationPct ? 20 : 8;
  const startScore = input.initialAmount > 0 ? 10 : 0;
  const consistencyScore = Math.max(
    0,
    Math.min(100, Math.round(20 + yearsScore + habitScore + inflationScore + startScore))
  );

  const suggestion =
    input.monthlyInvestment <= 0
      ? "Start an automatic monthly investment, even with a small amount, to build consistency."
      : input.years < 10
        ? "Extend the time horizon by at least 5 years to let compounding do more of the heavy lifting."
        : input.inflationPct >= input.annualReturnPct
          ? "Target a portfolio expected to outpace inflation over long periods (for example, broad equity index exposure)."
          : "Increase your monthly investment by 10% when income grows to accelerate real wealth creation.";

  return {
    nominalValue: round(nominal),
    inflationAdjustedValue: round(inflationAdjustedValue),
    realPurchasingPower: round(realPurchasingPower),
    consistencyScore,
    points,
    explanation:
      "This projection compounds monthly contributions and then adjusts the final value for inflation so you can see true purchasing power.",
    suggestion
  };
};

export const calculateFi = (input: FiInput): FiResult => {
  const expectedReturnPct = input.expectedReturnPct ?? 10;
  const annualInflationPct = input.annualInflationPct ?? 6;
  const withdrawalRate = Math.max(0.01, input.withdrawalRatePct / 100);

  const fiNumberToday = input.annualExpenses / withdrawalRate;
  const futureFiTarget = fiNumberToday * Math.pow(1 + annualInflationPct / 100, input.yearsToRetirement);

  const months = Math.max(1, Math.round(input.yearsToRetirement * 12));
  const monthlyRate = monthRateFromAnnualPct(expectedReturnPct);
  const growthFactor =
    monthlyRate === 0
      ? months
      : (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  const monthlySipRequired = futureFiTarget / growthFactor;

  const points: FiPoint[] = [];
  let corpus = 0;
  for (let month = 1; month <= months; month += 1) {
    corpus = (corpus + monthlySipRequired) * (1 + monthlyRate);
    if (month % 12 === 0 || month === months) {
      const year = Math.ceil(month / 12);
      points.push({
        year,
        targetCorpus: round(
          fiNumberToday * Math.pow(1 + annualInflationPct / 100, year)
        ),
        projectedCorpus: round(corpus)
      });
    }
  }

  const suggestion =
    input.withdrawalRatePct < 4
      ? "A lower withdrawal rate increases safety but needs a larger corpus; revisit timeline or savings rate to stay realistic."
      : input.yearsToRetirement < 10
        ? "To hit FI faster, combine higher monthly SIP with expense optimization so the target corpus also stays manageable."
        : "Review your annual expenses every quarter; reducing fixed costs lowers your FI number immediately.";

  return {
    fiNumber: round(futureFiTarget),
    monthlySipRequired: round(monthlySipRequired),
    points,
    explanation:
      "FI number is annual expenses divided by withdrawal rate, then adjusted for inflation until your retirement year.",
    suggestion
  };
};

export const calculateSipSwp = (input: SipSwpInput): SipSwpResult => {
  const monthlyAccumulationRate = monthRateFromAnnualPct(input.annualReturnPct);
  const monthlySwpRate = monthRateFromAnnualPct(input.swpAnnualReturnPct);
  const monthlyInflationRate = monthRateFromAnnualPct(input.inflationPct);

  const accumulationMonths = Math.max(1, Math.round(input.accumulationYears * 12));
  const swpMonths = Math.max(1, Math.round(input.swpYears * 12));

  const points: SipSwpPoint[] = [];
  let corpus = 0;

  for (let month = 1; month <= accumulationMonths; month += 1) {
    corpus = (corpus + Math.max(0, input.monthlySip)) * (1 + monthlyAccumulationRate);
    if (month % 12 === 0 || month === accumulationMonths) {
      points.push({
        month,
        yearLabel: `Year ${Math.ceil(month / 12)}`,
        corpus: round(corpus),
        phase: "SIP"
      });
    }
  }

  const retirementCorpus = corpus;
  let monthlyWithdrawal = Math.max(0, input.startingMonthlySwp);
  let monthsUntilDepletion: number | null = null;

  for (let month = 1; month <= swpMonths; month += 1) {
    corpus *= 1 + monthlySwpRate;
    corpus -= monthlyWithdrawal;

    if (month % 12 === 0) {
      monthlyWithdrawal *= Math.pow(1 + monthlyInflationRate, 12);
    }

    if (corpus <= 0 && monthsUntilDepletion === null) {
      monthsUntilDepletion = month;
      corpus = 0;
    }

    if (month % 12 === 0 || month === swpMonths || corpus <= 0) {
      points.push({
        month: accumulationMonths + month,
        yearLabel: `SWP Year ${Math.ceil(month / 12)}`,
        corpus: round(corpus),
        phase: "SWP"
      });
    }

    if (corpus <= 0) {
      break;
    }
  }

  const sustainable = monthsUntilDepletion === null;
  const suggestion = sustainable
    ? "Your plan survives the full SWP period in this scenario. Consider stress-testing with 1-2% lower returns for safety."
    : "Corpus depletes early. Increase SIP, delay retirement, or start with a lower SWP amount to improve sustainability.";

  return {
    retirementCorpus: round(retirementCorpus),
    endingCorpus: round(corpus),
    monthsUntilDepletion,
    sustainable,
    points,
    explanation:
      "SIP grows your corpus in accumulation years, then SWP simulates inflation-adjusted withdrawals during retirement.",
    suggestion
  };
};

export const calculateUsRetirement = (
  input: UsRetirementInput
): UsRetirementResult => {
  let salary = Math.max(0, input.annualSalary);
  let preTax401k = 0;
  let roth = 0;
  const points: UsRetirementPoint[] = [];

  for (let year = 1; year <= Math.max(1, input.years); year += 1) {
    const employeeContribution = salary * (input.employeeContributionPct / 100);
    const employerMatch = salary * (input.employerMatchPct / 100);
    const rothContribution = Math.max(0, input.rothAnnualContribution);

    preTax401k = (preTax401k + employeeContribution + employerMatch) * (1 + input.annualReturnPct / 100);
    roth = (roth + rothContribution) * (1 + input.annualReturnPct / 100);

    points.push({
      year,
      preTax401k: round(preTax401k),
      roth: round(roth)
    });

    salary *= 1 + input.annualRaisePct / 100;
  }

  const afterTax401k = preTax401k * (1 - input.retirementTaxRatePct / 100);
  const afterTaxRetirementValue = afterTax401k + roth;
  const estimatedMonthlyIncomeAt4Pct = (afterTaxRetirementValue * 0.04) / 12;

  const suggestion =
    input.employeeContributionPct < 15
      ? "Increase your 401(k) contribution toward 15% over time, especially when you get raises."
      : input.employerMatchPct <= 0
        ? "If your employer offers a match, contribute enough to capture the full match before other goals."
        : "Keep tax diversification: maintain both pre-tax (401k) and Roth buckets for withdrawal flexibility.";

  return {
    preTax401k: round(preTax401k),
    rothBalance: round(roth),
    afterTaxRetirementValue: round(afterTaxRetirementValue),
    estimatedMonthlyIncomeAt4Pct: round(estimatedMonthlyIncomeAt4Pct),
    points,
    explanation:
      "401(k) grows tax-deferred and Roth grows tax-free in retirement assumptions; combining both creates tax flexibility later.",
    suggestion
  };
};

export const calculateBudget = (input: BudgetInput): BudgetResult => {
  const needsPct = Math.max(0, Math.min(100, input.needsPct));
  const wantsPct = Math.max(0, Math.min(100 - needsPct, input.wantsPct));
  const savingsPct = Math.max(0, 100 - needsPct - wantsPct);

  const needsAmount = (input.monthlyTakeHome * needsPct) / 100;
  const wantsAmount = (input.monthlyTakeHome * wantsPct) / 100;
  const savingsAmount = (input.monthlyTakeHome * savingsPct) / 100;
  const emergencyFundTarget = needsAmount * 6;

  const suggestion =
    savingsPct < 20
      ? "Aim for at least 20% savings by cutting one recurring want expense and automating that transfer on salary day."
      : wantsPct > 30
        ? "Your savings rate is solid; trimming wants by 5% can speed up debt payoff or investing goals further."
        : "Current split supports long-term wealth building. Keep reviewing every 3 months as income changes.";

  return {
    needsAmount: round(needsAmount),
    wantsAmount: round(wantsAmount),
    savingsAmount: round(savingsAmount),
    savingsPct: round(savingsPct),
    emergencyFundTarget: round(emergencyFundTarget),
    explanation:
      "This budget model keeps fixed needs clear, allows lifestyle spending, and protects investing through a separate savings bucket.",
    suggestion
  };
};

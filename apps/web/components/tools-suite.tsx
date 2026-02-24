"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import { useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useAuth } from "./auth-provider";
import {
  calculateBudget,
  calculateCompoundInterest,
  calculateFi,
  calculateSipSwp,
  calculateUsRetirement
} from "../lib/finance";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function CalculatorCard({
  title,
  subtitle,
  children,
  premium = false,
  unlocked = false
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  premium?: boolean;
  unlocked?: boolean;
}) {
  if (premium && !unlocked) {
    return (
      <section className="ofr-card ofr-calculator-card">
        <div className="ofr-card-head">
          <div>
            <h2>{title}</h2>
            <p className="ofr-muted">{subtitle}</p>
          </div>
          <span className="pill">Premium</span>
        </div>
        <div className="ofr-locked">
          <h3>Unlocked in paid tier</h3>
          <p className="ofr-muted">
            This simulator is available in OFR Wealth System for paid members.
          </p>
          <a className="button" href="/courses">
            Upgrade to Unlock
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="ofr-card ofr-calculator-card">
      <div className="ofr-card-head">
        <div>
          <h2>{title}</h2>
          <p className="ofr-muted">{subtitle}</p>
        </div>
        {premium ? <span className="pill">Premium</span> : <span className="pill">Free</span>}
      </div>
      {children}
    </section>
  );
}

export function ToolsSuite() {
  const { premium } = useAuth();

  const [compoundInput, setCompoundInput] = useState({
    initialAmount: 500000,
    monthlyInvestment: 30000,
    annualReturnPct: 11,
    years: 20,
    inflationPct: 6
  });

  const [fiInput, setFiInput] = useState({
    annualExpenses: 1200000,
    withdrawalRatePct: 4,
    yearsToRetirement: 18
  });

  const [sipSwpInput, setSipSwpInput] = useState({
    monthlySip: 40000,
    accumulationYears: 20,
    annualReturnPct: 11,
    swpYears: 25,
    swpAnnualReturnPct: 8,
    inflationPct: 6,
    startingMonthlySwp: 90000
  });

  const [usInput, setUsInput] = useState({
    annualSalary: 140000,
    employeeContributionPct: 12,
    employerMatchPct: 4,
    annualRaisePct: 4,
    annualReturnPct: 8,
    years: 22,
    rothAnnualContribution: 7000,
    retirementTaxRatePct: 20
  });

  const [budgetInput, setBudgetInput] = useState({
    monthlyTakeHome: 250000,
    needsPct: 50,
    wantsPct: 25
  });

  const compoundResult = useMemo(
    () => calculateCompoundInterest(compoundInput),
    [compoundInput]
  );
  const fiResult = useMemo(() => calculateFi(fiInput), [fiInput]);
  const sipSwpResult = useMemo(() => calculateSipSwp(sipSwpInput), [sipSwpInput]);
  const usResult = useMemo(() => calculateUsRetirement(usInput), [usInput]);
  const budgetResult = useMemo(() => calculateBudget(budgetInput), [budgetInput]);

  return (
    <div className="ofr-calculator-stack">
      <CalculatorCard
        title="A. Compound Interest Calculator"
        subtitle="See nominal growth and real purchasing power after inflation"
        unlocked
      >
        <div className="ofr-form-grid">
          <label className="field">
            <span>Initial amount (INR)</span>
            <input
              type="number"
              value={compoundInput.initialAmount}
              onChange={(event) =>
                setCompoundInput((prev) => ({
                  ...prev,
                  initialAmount: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Monthly investment (INR)</span>
            <input
              type="number"
              value={compoundInput.monthlyInvestment}
              onChange={(event) =>
                setCompoundInput((prev) => ({
                  ...prev,
                  monthlyInvestment: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Rate of return (%)</span>
            <input
              type="number"
              step="0.1"
              value={compoundInput.annualReturnPct}
              onChange={(event) =>
                setCompoundInput((prev) => ({
                  ...prev,
                  annualReturnPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Years</span>
            <input
              type="number"
              value={compoundInput.years}
              onChange={(event) =>
                setCompoundInput((prev) => ({
                  ...prev,
                  years: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Inflation rate (%)</span>
            <input
              type="number"
              step="0.1"
              value={compoundInput.inflationPct}
              onChange={(event) =>
                setCompoundInput((prev) => ({
                  ...prev,
                  inflationPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
        </div>

        <div className="ofr-output-grid">
          <article className="ofr-output">
            <span className="small">Nominal value</span>
            <strong>{INR.format(compoundResult.nominalValue)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Inflation-adjusted value</span>
            <strong>{INR.format(compoundResult.inflationAdjustedValue)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Real purchasing power</span>
            <strong>{INR.format(compoundResult.realPurchasingPower)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Consistency score</span>
            <strong>{compoundResult.consistencyScore}/100</strong>
          </article>
        </div>

        <Line
          data={{
            labels: compoundResult.points.map((point) => `Y${point.year}`),
            datasets: [
              {
                label: "Nominal",
                data: compoundResult.points.map((point) => point.nominal),
                borderColor: "#3477b8",
                backgroundColor: "rgba(52, 119, 184, 0.14)",
                fill: true,
                tension: 0.25
              },
              {
                label: "Inflation-adjusted",
                data: compoundResult.points.map((point) => point.real),
                borderColor: "#5e8f76",
                backgroundColor: "rgba(94, 143, 118, 0.12)",
                fill: true,
                tension: 0.25
              }
            ]
          }}
          options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
        />

        <p className="ofr-muted">{compoundResult.explanation}</p>
        <p className="ofr-tip">Improvement suggestion: {compoundResult.suggestion}</p>
      </CalculatorCard>

      <CalculatorCard
        title="B. Financial Independence Calculator"
        subtitle="Estimate FI corpus and required monthly SIP"
        unlocked
      >
        <div className="ofr-form-grid">
          <label className="field">
            <span>Annual expenses (INR)</span>
            <input
              type="number"
              value={fiInput.annualExpenses}
              onChange={(event) =>
                setFiInput((prev) => ({
                  ...prev,
                  annualExpenses: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Withdrawal rate (%)</span>
            <input
              type="number"
              step="0.1"
              value={fiInput.withdrawalRatePct}
              onChange={(event) =>
                setFiInput((prev) => ({
                  ...prev,
                  withdrawalRatePct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Years to retirement</span>
            <input
              type="number"
              value={fiInput.yearsToRetirement}
              onChange={(event) =>
                setFiInput((prev) => ({
                  ...prev,
                  yearsToRetirement: toNumber(event.target.value)
                }))
              }
            />
          </label>
        </div>

        <div className="ofr-output-grid">
          <article className="ofr-output">
            <span className="small">FI number (future-value)</span>
            <strong>{INR.format(fiResult.fiNumber)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Monthly SIP required</span>
            <strong>{INR.format(fiResult.monthlySipRequired)}</strong>
          </article>
        </div>

        <Line
          data={{
            labels: fiResult.points.map((point) => `Y${point.year}`),
            datasets: [
              {
                label: "Target corpus",
                data: fiResult.points.map((point) => point.targetCorpus),
                borderColor: "#9f7d51",
                borderDash: [6, 4],
                tension: 0.25
              },
              {
                label: "Projected corpus",
                data: fiResult.points.map((point) => point.projectedCorpus),
                borderColor: "#3477b8",
                backgroundColor: "rgba(52, 119, 184, 0.12)",
                fill: true,
                tension: 0.25
              }
            ]
          }}
          options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
        />

        <p className="ofr-muted">{fiResult.explanation}</p>
        <p className="ofr-tip">Improvement suggestion: {fiResult.suggestion}</p>
      </CalculatorCard>

      <CalculatorCard
        title="C. India SIP + SWP Simulator"
        subtitle="Project accumulation and retirement withdrawal sustainability"
        premium
        unlocked={premium}
      >
        <div className="ofr-form-grid">
          <label className="field">
            <span>Monthly SIP (INR)</span>
            <input
              type="number"
              value={sipSwpInput.monthlySip}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  monthlySip: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Accumulation years</span>
            <input
              type="number"
              value={sipSwpInput.accumulationYears}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  accumulationYears: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>SIP return (%)</span>
            <input
              type="number"
              step="0.1"
              value={sipSwpInput.annualReturnPct}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  annualReturnPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>SWP years</span>
            <input
              type="number"
              value={sipSwpInput.swpYears}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  swpYears: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>SWP return (%)</span>
            <input
              type="number"
              step="0.1"
              value={sipSwpInput.swpAnnualReturnPct}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  swpAnnualReturnPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Inflation (%)</span>
            <input
              type="number"
              step="0.1"
              value={sipSwpInput.inflationPct}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  inflationPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Starting monthly SWP (INR)</span>
            <input
              type="number"
              value={sipSwpInput.startingMonthlySwp}
              onChange={(event) =>
                setSipSwpInput((prev) => ({
                  ...prev,
                  startingMonthlySwp: toNumber(event.target.value)
                }))
              }
            />
          </label>
        </div>

        <div className="ofr-output-grid">
          <article className="ofr-output">
            <span className="small">Corpus at retirement</span>
            <strong>{INR.format(sipSwpResult.retirementCorpus)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Corpus after SWP period</span>
            <strong>{INR.format(sipSwpResult.endingCorpus)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Plan status</span>
            <strong>{sipSwpResult.sustainable ? "Sustainable" : "Depletes early"}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Months until depletion</span>
            <strong>
              {sipSwpResult.monthsUntilDepletion === null
                ? "Not depleted"
                : `${sipSwpResult.monthsUntilDepletion} months`}
            </strong>
          </article>
        </div>

        <Line
          data={{
            labels: sipSwpResult.points.map((point) => point.yearLabel),
            datasets: [
              {
                label: "Corpus",
                data: sipSwpResult.points.map((point) => point.corpus),
                borderColor: "#3477b8",
                backgroundColor: "rgba(52, 119, 184, 0.12)",
                fill: true,
                tension: 0.25
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: "bottom" } }
          }}
        />

        <p className="ofr-muted">{sipSwpResult.explanation}</p>
        <p className="ofr-tip">Improvement suggestion: {sipSwpResult.suggestion}</p>
      </CalculatorCard>

      <CalculatorCard
        title="D. US 401(k) + Roth Simulator"
        subtitle="Model tax-diversified retirement corpus from W2 income"
        premium
        unlocked={premium}
      >
        <div className="ofr-form-grid">
          <label className="field">
            <span>Annual salary (USD)</span>
            <input
              type="number"
              value={usInput.annualSalary}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  annualSalary: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>401(k) employee contribution (%)</span>
            <input
              type="number"
              step="0.1"
              value={usInput.employeeContributionPct}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  employeeContributionPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Employer match (% of salary)</span>
            <input
              type="number"
              step="0.1"
              value={usInput.employerMatchPct}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  employerMatchPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Annual raise (%)</span>
            <input
              type="number"
              step="0.1"
              value={usInput.annualRaisePct}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  annualRaisePct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Portfolio return (%)</span>
            <input
              type="number"
              step="0.1"
              value={usInput.annualReturnPct}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  annualReturnPct: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Investment years</span>
            <input
              type="number"
              value={usInput.years}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  years: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Roth annual contribution (USD)</span>
            <input
              type="number"
              value={usInput.rothAnnualContribution}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  rothAnnualContribution: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Retirement tax rate on 401(k) (%)</span>
            <input
              type="number"
              step="0.1"
              value={usInput.retirementTaxRatePct}
              onChange={(event) =>
                setUsInput((prev) => ({
                  ...prev,
                  retirementTaxRatePct: toNumber(event.target.value)
                }))
              }
            />
          </label>
        </div>

        <div className="ofr-output-grid">
          <article className="ofr-output">
            <span className="small">Pre-tax 401(k)</span>
            <strong>{USD.format(usResult.preTax401k)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Roth balance</span>
            <strong>{USD.format(usResult.rothBalance)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">After-tax retirement value</span>
            <strong>{USD.format(usResult.afterTaxRetirementValue)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Estimated monthly income (4%)</span>
            <strong>{USD.format(usResult.estimatedMonthlyIncomeAt4Pct)}</strong>
          </article>
        </div>

        <Bar
          data={{
            labels: usResult.points.map((point) => `Y${point.year}`),
            datasets: [
              {
                label: "401(k)",
                data: usResult.points.map((point) => point.preTax401k),
                backgroundColor: "rgba(52, 119, 184, 0.75)"
              },
              {
                label: "Roth",
                data: usResult.points.map((point) => point.roth),
                backgroundColor: "rgba(94, 143, 118, 0.75)"
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: "bottom" } },
            scales: {
              x: { stacked: true },
              y: { stacked: true }
            }
          }}
        />

        <p className="ofr-muted">{usResult.explanation}</p>
        <p className="ofr-tip">Improvement suggestion: {usResult.suggestion}</p>
      </CalculatorCard>

      <CalculatorCard
        title="E. Simple Budget Tool"
        subtitle="Keep spending intentional with needs, wants, and wealth buckets"
        unlocked
      >
        <div className="ofr-form-grid">
          <label className="field">
            <span>Monthly take-home (INR)</span>
            <input
              type="number"
              value={budgetInput.monthlyTakeHome}
              onChange={(event) =>
                setBudgetInput((prev) => ({
                  ...prev,
                  monthlyTakeHome: toNumber(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Needs (%)</span>
            <input
              type="number"
              value={budgetInput.needsPct}
              onChange={(event) =>
                setBudgetInput((prev) => ({
                  ...prev,
                  needsPct: Math.min(100, toNumber(event.target.value))
                }))
              }
            />
          </label>
          <label className="field">
            <span>Wants (%)</span>
            <input
              type="number"
              value={budgetInput.wantsPct}
              onChange={(event) =>
                setBudgetInput((prev) => ({
                  ...prev,
                  wantsPct: Math.min(100, toNumber(event.target.value))
                }))
              }
            />
          </label>
        </div>

        <div className="ofr-output-grid">
          <article className="ofr-output">
            <span className="small">Needs</span>
            <strong>{INR.format(budgetResult.needsAmount)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Wants</span>
            <strong>{INR.format(budgetResult.wantsAmount)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Savings / investing</span>
            <strong>{INR.format(budgetResult.savingsAmount)}</strong>
          </article>
          <article className="ofr-output">
            <span className="small">Emergency fund target</span>
            <strong>{INR.format(budgetResult.emergencyFundTarget)}</strong>
          </article>
        </div>

        <div className="ofr-budget-visual">
          <Doughnut
            data={{
              labels: ["Needs", "Wants", "Savings"],
              datasets: [
                {
                  data: [
                    budgetResult.needsAmount,
                    budgetResult.wantsAmount,
                    budgetResult.savingsAmount
                  ],
                  backgroundColor: ["#3477b8", "#9f7d51", "#5e8f76"],
                  borderWidth: 0
                }
              ]
            }}
            options={{
              plugins: { legend: { position: "bottom" } },
              cutout: "60%"
            }}
          />
        </div>

        <p className="ofr-muted">{budgetResult.explanation}</p>
        <p className="ofr-tip">Improvement suggestion: {budgetResult.suggestion}</p>
      </CalculatorCard>
    </div>
  );
}

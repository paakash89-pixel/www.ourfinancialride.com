"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { Doughnut } from "react-chartjs-2";
import {
  computeSavingsGuard,
  savingsGuardSchema,
  type SavingsGuardInput
} from "../../lib/calculators";
import {
  currencyCodeByRegion,
  formatCompactMoney,
  getCurrencyFormatter
} from "../../lib/currency";
import { pct } from "../../lib/formatters";
import type { Region } from "../../lib/region";
import { CalculatorCard } from "./calculator-card";
import "./chart-setup";
import { CommaNumberInput } from "./comma-number-input";
import { getDoughnutMoneyOptions } from "./chart-options";
import { useRegion } from "../region-provider";
import { ToolStorySummary } from "./tool-story-summary";
import { useRegionMoneyFields } from "./use-region-money-fields";

const inputClass =
  "focus-ring mt-1 w-full rounded-xl border border-slateBlue-200 bg-white px-3 py-2 text-sm";

const starterByRegion: Record<Region, SavingsGuardInput> = {
  IN: {
    annualAfterTaxIncome: 4800000,
    annualFixedCosts: 2000000,
    annualVariableJoy: 700000,
    annualOtherVariable: 500000
  },
  US: {
    annualAfterTaxIncome: 110000,
    annualFixedCosts: 42000,
    annualVariableJoy: 14000,
    annualOtherVariable: 12000
  }
};

const moneyFields: Path<SavingsGuardInput>[] = [
  "annualAfterTaxIncome",
  "annualFixedCosts",
  "annualVariableJoy",
  "annualOtherVariable"
];

export function SavingsGuardCalculator() {
  const form = useForm<SavingsGuardInput>({
    resolver: zodResolver(savingsGuardSchema),
    defaultValues: starterByRegion.IN,
    mode: "onChange"
  });

  const region = useRegionMoneyFields(form, moneyFields);
  const { isReady } = useRegion();
  const starterHydratedRef = useRef(false);

  useEffect(() => {
    if (!isReady || starterHydratedRef.current) return;
    form.reset(starterByRegion[region]);
    starterHydratedRef.current = true;
  }, [form, isReady, region]);

  const values = form.watch();
  const parsed = savingsGuardSchema.safeParse(values);
  const result = useMemo(
    () => (parsed.success ? computeSavingsGuard(parsed.data) : null),
    [parsed]
  );

  const currencyCode = currencyCodeByRegion[region];
  const money = useMemo(() => getCurrencyFormatter(region), [region]);
  const medianNote =
    region === "IN"
      ? "Starter profile: family income around ₹48,00,000."
      : "Starter profile: family income around $150,000.";

  return (
    <CalculatorCard
      title="3) Savings Rate Protection (Lifestyle Creep Guard)"
      description="Protect savings rate by tracking fixed costs and spending mix."
    >
      <div className="ios-soft-panel flex flex-wrap items-center justify-between gap-3 p-3 text-sm text-slateBlue-600">
        <p>Quick start: {medianNote}</p>
        <button
          type="button"
          className="ios-btn-secondary px-3 py-2 text-xs"
          onClick={() => form.reset(starterByRegion[region])}
        >
          Use starter assumptions
        </button>
      </div>

      <form className="grid gap-3 sm:grid-cols-2">
        <Field label={`Annual after-tax income (${currencyCode})`} error={form.formState.errors.annualAfterTaxIncome?.message}>
          <CommaNumberInput formApi={form} name="annualAfterTaxIncome" region={region} className={inputClass} />
        </Field>
        <Field label={`Annual fixed expenses (${currencyCode})`} helper="Rent/mortgage, utilities, insurance, EMIs" error={form.formState.errors.annualFixedCosts?.message}>
          <CommaNumberInput formApi={form} name="annualFixedCosts" region={region} className={inputClass} />
        </Field>
        <Field label={`Annual variable joy (${currencyCode})`} helper="Travel, dining, coffee, experiences" error={form.formState.errors.annualVariableJoy?.message}>
          <CommaNumberInput formApi={form} name="annualVariableJoy" region={region} className={inputClass} />
        </Field>
        <Field label={`Annual other expenses (${currencyCode})`} helper="Shopping, gifts, one-offs" error={form.formState.errors.annualOtherVariable?.message}>
          <CommaNumberInput formApi={form} name="annualOtherVariable" region={region} className={inputClass} />
        </Field>
      </form>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Output
              label="Savings"
              value={money.format(result.savings)}
              hint={formatCompactMoney(result.savings, region)}
            />
            <Output label="Savings rate" value={pct(result.savingsRate)} />
            <Output label="Fixed cost ratio" value={pct(result.fixedCostRatio)} />
            <Output label="Discipline score" value={`${result.disciplineScore}/100`} />
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,260px)_1fr]">
            <div className="ios-soft-panel relative mx-auto h-64 w-full max-w-[280px] p-3">
              <Doughnut
                data={{
                  labels: ["Fixed", "Joy", "Other Variable", "Savings"],
                  datasets: [
                    {
                      data: [
                        result.chartData.fixed,
                        result.chartData.variableJoy,
                        result.chartData.otherVariable,
                        result.chartData.savings
                      ],
                      backgroundColor: ["#0A84FF", "#64D2FF", "#5E5CE6", "#30D158"],
                      borderWidth: 0
                    }
                  ]
                }}
                options={getDoughnutMoneyOptions(money)}
              />
            </div>
            <div className="space-y-3">
              <div className="ios-soft-panel p-4 text-sm text-slateBlue-700">
                <p className="font-medium text-slateBlue-700">Spending breakdown with values</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <BreakdownItem
                    label="Fixed expenses"
                    value={money.format(result.chartData.fixed)}
                    share={pct((result.chartData.fixed / values.annualAfterTaxIncome) * 100)}
                  />
                  <BreakdownItem
                    label="Variable joy"
                    value={money.format(result.chartData.variableJoy)}
                    share={pct((result.chartData.variableJoy / values.annualAfterTaxIncome) * 100)}
                  />
                  <BreakdownItem
                    label="Other expenses"
                    value={money.format(result.chartData.otherVariable)}
                    share={pct((result.chartData.otherVariable / values.annualAfterTaxIncome) * 100)}
                  />
                  <BreakdownItem
                    label="Savings"
                    value={money.format(result.chartData.savings)}
                    share={pct(result.savingsRate)}
                  />
                </div>
              </div>
              <ToolStorySummary
                quickSummary="Fixed costs decide how flexible your plan stays."
                score={result.disciplineScore}
                recommendation={
                  result.requiredMonthlyDelta > 0
                    ? `To reach 25% savings, free up ${money.format(result.requiredMonthlyDelta)} per month by reducing fixed expenses first.`
                    : result.recommendation
                }
                details={[
                  result.warning,
                  `Current savings rate: ${pct(result.savingsRate)}`
                ]}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-red-600">Please fix the form errors to view results.</p>
      )}
    </CalculatorCard>
  );
}

function Field({
  label,
  helper,
  error,
  children
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-medium text-slateBlue-700">
      {label}
      {helper ? <span className="ml-1 text-xs text-slateBlue-500">({helper})</span> : null}
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function Output({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="ios-soft-panel flex min-h-[106px] flex-col p-4">
      <p className="text-xs uppercase tracking-wide text-slateBlue-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slateBlue-700">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slateBlue-500">{hint}</p> : null}
    </div>
  );
}

function BreakdownItem({
  label,
  value,
  share
}: {
  label: string;
  value: string;
  share: string;
}) {
  return (
    <div className="rounded-xl border border-slateBlue-100 bg-white/80 p-3">
      <p className="text-xs uppercase tracking-wide text-slateBlue-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slateBlue-700">{value}</p>
      <p className="text-xs text-slateBlue-500">{share}</p>
    </div>
  );
}

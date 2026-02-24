"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { Line } from "react-chartjs-2";
import {
  computeWithdrawal,
  type WithdrawalInput,
  withdrawalSchema
} from "../../lib/calculators";
import {
  currencyCodeByRegion,
  formatCompactMoney,
  getCurrencyFormatter
} from "../../lib/currency";
import type { Region } from "../../lib/region";
import { CalculatorCard } from "./calculator-card";
import "./chart-setup";
import { CommaNumberInput } from "./comma-number-input";
import { getLineMoneyOptions } from "./chart-options";
import { useRegion } from "../region-provider";
import { ToolStorySummary } from "./tool-story-summary";
import { useRegionMoneyFields } from "./use-region-money-fields";

const inputClass =
  "focus-ring mt-1 w-full rounded-xl border border-slateBlue-200 bg-white px-3 py-2 text-sm";

const starterByRegion: Record<Region, WithdrawalInput> = {
  IN: {
    startingPortfolio: 100000000,
    annualWithdrawal: 3600000,
    annualReturnPct: 6,
    inflationPct: 5,
    currentAge: 37,
    spendingDeclineStartAge: 55,
    realSpendingChangePct: -0.5,
    years: 30
  },
  US: {
    startingPortfolio: 2250000,
    annualWithdrawal: 90000,
    annualReturnPct: 6,
    inflationPct: 3,
    currentAge: 37,
    spendingDeclineStartAge: 55,
    realSpendingChangePct: -0.5,
    years: 30
  }
};

const moneyFields: Path<WithdrawalInput>[] = ["startingPortfolio", "annualWithdrawal"];

export function WithdrawalCalculator() {
  const form = useForm<WithdrawalInput>({
    resolver: zodResolver(withdrawalSchema),
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
  const parsed = withdrawalSchema.safeParse(values);
  const result = useMemo(
    () => (parsed.success ? computeWithdrawal(parsed.data) : null),
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
      title="4) Withdrawal Sustainability (Conservative)"
      description="Stress-test withdrawals with conservative assumptions."
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

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={`Starting portfolio (${currencyCode})`} error={form.formState.errors.startingPortfolio?.message}>
          <CommaNumberInput formApi={form} name="startingPortfolio" region={region} className={inputClass} />
        </Field>
        <Field label={`Annual withdrawal (${currencyCode})`} error={form.formState.errors.annualWithdrawal?.message}>
          <CommaNumberInput formApi={form} name="annualWithdrawal" region={region} className={inputClass} />
        </Field>
        <Field label="Current age" error={form.formState.errors.currentAge?.message}>
          <input type="number" {...form.register("currentAge", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field
          label="Spending decline starts at age"
          helper="Example: 55"
          error={form.formState.errors.spendingDeclineStartAge?.message}
        >
          <input type="number" {...form.register("spendingDeclineStartAge", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Annual return %" error={form.formState.errors.annualReturnPct?.message}>
          <input type="number" step="0.1" {...form.register("annualReturnPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Inflation %" error={form.formState.errors.inflationPct?.message}>
          <input type="number" step="0.1" {...form.register("inflationPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field
          label="Real spending change %"
          helper="Negative means spending falls over time."
          error={form.formState.errors.realSpendingChangePct?.message}
        >
          <input type="number" step="0.1" {...form.register("realSpendingChangePct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Years" error={form.formState.errors.years?.message}>
          <input type="number" {...form.register("years", { valueAsNumber: true })} className={inputClass} />
        </Field>
      </form>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Output label="Sustainable" value={result.sustainable ? "Yes" : "No"} />
            <Output
              label="Ending portfolio"
              value={money.format(result.endingPortfolio)}
              hint={formatCompactMoney(result.endingPortfolio, region)}
            />
            <Output label="Discipline score" value={`${result.disciplineScore}/100`} />
            <Output
              label="Total withdrawals"
              value={money.format(result.totalWithdrawalsNominal)}
              hint={formatCompactMoney(result.totalWithdrawalsNominal, region)}
            />
          </div>

          <div className="ios-soft-panel relative p-3">
            <div className="h-72">
            <Line
              data={{
                labels: result.points.map((point) => `Age ${point.age}`),
                datasets: [
                  {
                    label: `Projected output (${currencyCode})`,
                    data: result.points.map((point) => point.portfolio),
                    borderColor: result.sustainable ? "#30D158" : "#FF9F0A",
                    pointRadius: 0,
                    borderWidth: 2.6,
                    fill: false,
                    tension: 0.2
                  },
                  {
                    label: `Annual withdrawal (${currencyCode})`,
                    data: result.points.map((point) => point.withdrawal),
                    borderColor: "#0A84FF",
                    pointRadius: 0,
                    borderWidth: 2.6,
                    fill: false
                  }
                ]
              }}
              options={getLineMoneyOptions(region, money, {
                series: [
                  result.points.map((point) => point.portfolio),
                  result.points.map((point) => point.withdrawal)
                ]
              })}
            />
          </div>
          </div>

          <ToolStorySummary
            quickSummary="Green is portfolio. Blue is annual withdrawal by age."
            score={result.disciplineScore}
            recommendation={result.recommendation}
            details={[
              result.explanation,
              `Current age: ${values.currentAge}`,
              `Spending decline starts at age: ${values.spendingDeclineStartAge}`,
              `Real spending change assumption: ${values.realSpendingChangePct}% per year`,
              "Sustainable means withdrawals stayed funded for the full horizon.",
              `Total nominal withdrawals over ${result.yearsModeled} years: ${money.format(result.totalWithdrawalsNominal)}`,
              `Total withdrawals in today's purchasing power: ${money.format(result.totalWithdrawalsReal)}`
            ]}
          />
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
    <div className="ios-soft-panel p-4">
      <p className="text-xs uppercase tracking-wide text-slateBlue-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slateBlue-700">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slateBlue-500">{hint}</p> : null}
    </div>
  );
}

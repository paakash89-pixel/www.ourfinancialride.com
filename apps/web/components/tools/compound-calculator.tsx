"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { Line } from "react-chartjs-2";
import { compoundSchema, computeCompound, type CompoundInput } from "../../lib/calculators";
import {
  currencyCodeByRegion,
  formatCompactMoney,
  getCurrencyFormatter
} from "../../lib/currency";
import type { Region } from "../../lib/region";
import { CalculatorCard } from "./calculator-card";
import "./chart-setup";
import { getLineMoneyOptions } from "./chart-options";
import { CommaNumberInput } from "./comma-number-input";
import { useRegion } from "../region-provider";
import { ToolStorySummary } from "./tool-story-summary";
import { useRegionMoneyFields } from "./use-region-money-fields";

const inputClass =
  "focus-ring mt-1 w-full rounded-xl border border-slateBlue-200 bg-white px-3 py-2 text-sm";

const starterByRegion: Record<Region, CompoundInput> = {
  IN: {
    initialAmount: 1500000,
    monthlyContribution: 100000,
    years: 20,
    annualReturnPct: 8,
    inflationPct: 5
  },
  US: {
    initialAmount: 50000,
    monthlyContribution: 3000,
    years: 20,
    annualReturnPct: 7.5,
    inflationPct: 3
  }
};

const moneyFields: Path<CompoundInput>[] = ["initialAmount", "monthlyContribution"];

export function CompoundCalculator() {
  const form = useForm<CompoundInput>({
    resolver: zodResolver(compoundSchema),
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
  const parsed = compoundSchema.safeParse(values);
  const result = useMemo(
    () => (parsed.success ? computeCompound(parsed.data) : null),
    [parsed]
  );

  const currencyCode = currencyCodeByRegion[region];
  const money = useMemo(() => getCurrencyFormatter(region), [region]);
  const arrivalThreshold = region === "IN" ? 100000000 : 1000000;
  const arrivalLabel = region === "IN" ? "₹10 Cr" : "$1M";
  const monthlyContributionLimit = region === "IN" ? 10000000 : 100000;
  const monthlyContributionCapText =
    region === "IN" ? "Max practical: ₹1,00,00,000 per month." : "Max practical: $100,000 per month.";
  const medianNote =
    region === "IN"
      ? "Starter profile: family income around ₹48,00,000."
      : "Starter profile: family income around $150,000.";
  const hasArrived = result ? result.futureValueNominal >= arrivalThreshold : false;
  const monthlyContributionOutOfRange =
    typeof values.monthlyContribution === "number" &&
    Number.isFinite(values.monthlyContribution) &&
    values.monthlyContribution > monthlyContributionLimit;
  const displayScore = result && !monthlyContributionOutOfRange ? (hasArrived ? 100 : result.disciplineScore) : 0;
  const displayRecommendation = result && !monthlyContributionOutOfRange
    ? hasArrived
      ? "You have arrived. Protect fixed costs and avoid lifestyle creep."
      : result.recommendation
    : "";
  const displaySummary = result && !monthlyContributionOutOfRange
    ? hasArrived
      ? `Projected investments cross ${arrivalLabel}.`
      : "Green is total balance. Blue is your contribution total."
    : "";

  return (
    <CalculatorCard
      title="1) Compound Interest Calculator"
      description="See long-term growth and inflation-adjusted value."
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
        <Field label={`Initial amount (${currencyCode})`} error={form.formState.errors.initialAmount?.message}>
          <CommaNumberInput formApi={form} name="initialAmount" region={region} className={inputClass} />
        </Field>
        <Field
          label={`Monthly contribution (${currencyCode})`}
          helper="0 is allowed."
          error={
            monthlyContributionOutOfRange
              ? monthlyContributionCapText
              : form.formState.errors.monthlyContribution?.message
          }
        >
          <CommaNumberInput formApi={form} name="monthlyContribution" region={region} className={inputClass} />
        </Field>
        <Field label="Years" helper="10+ years is ideal" error={form.formState.errors.years?.message}>
          <input type="number" {...form.register("years", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Annual return %" error={form.formState.errors.annualReturnPct?.message}>
          <input type="number" step="0.1" {...form.register("annualReturnPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Inflation %" error={form.formState.errors.inflationPct?.message}>
          <input type="number" step="0.1" {...form.register("inflationPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
      </form>

      {result && !monthlyContributionOutOfRange ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Output
              label="Future value (nominal)"
              value={money.format(result.futureValueNominal)}
              hint={formatCompactMoney(result.futureValueNominal, region)}
            />
            <Output
              label="Future value (real)"
              value={money.format(result.futureValueReal)}
              hint={formatCompactMoney(result.futureValueReal, region)}
            />
            <Output
              label="Total contributions"
              value={money.format(result.totalContributions)}
              hint={formatCompactMoney(result.totalContributions, region)}
            />
            <Output
              label="Total growth"
              value={money.format(result.totalGrowth)}
              hint={formatCompactMoney(result.totalGrowth, region)}
            />
          </div>

          <div className="ios-soft-panel relative p-3">
            <div className="h-72">
            <Line
              data={{
                labels: result.points.map((point) => `Y${point.year}`),
                datasets: [
                  {
                    label: `Total balance (${currencyCode})`,
                    data: result.points.map((point) => point.nominal),
                    borderColor: "#30D158",
                    pointRadius: 0,
                    borderWidth: 2.6,
                    fill: false,
                    tension: 0.2
                  },
                  {
                    label: `Total contributions (${currencyCode})`,
                    data: result.points.map(
                      (point) =>
                        values.initialAmount + values.monthlyContribution * point.year * 12
                    ),
                    borderColor: "#0A84FF",
                    pointRadius: 0,
                    borderWidth: 2.6,
                    fill: false,
                    tension: 0.2
                  }
                ]
              }}
              options={getLineMoneyOptions(region, money, {
                series: [
                  result.points.map((point) => point.nominal),
                  result.points.map(
                    (point) =>
                      values.initialAmount + values.monthlyContribution * point.year * 12
                  )
                ]
              })}
            />
          </div>
          </div>

          <ToolStorySummary
            quickSummary={displaySummary}
            score={displayScore}
            recommendation={displayRecommendation}
            details={[
              result.explanation,
              `Arrival threshold: ${arrivalLabel} projected portfolio`,
              `Real value at year ${values.years}: ${money.format(result.futureValueReal)}`
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

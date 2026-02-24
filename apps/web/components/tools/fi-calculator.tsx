"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { Line } from "react-chartjs-2";
import { computeFi, fiSchema, type FIInput } from "../../lib/calculators";
import {
  currencyCodeByRegion,
  formatCompactMoney,
  getCurrencyFormatter
} from "../../lib/currency";
import { pct } from "../../lib/formatters";
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

const starterByRegion: Record<Region, FIInput> = {
  IN: {
    annualExpenses: 3600000,
    withdrawalRatePct: 4,
    currentPortfolio: 12000000,
    annualSavings: 1200000,
    annualReturnPct: 8,
    inflationPct: 5
  },
  US: {
    annualExpenses: 90000,
    withdrawalRatePct: 4,
    currentPortfolio: 350000,
    annualSavings: 40000,
    annualReturnPct: 7.5,
    inflationPct: 3
  }
};

const moneyFields: Path<FIInput>[] = ["annualExpenses", "currentPortfolio", "annualSavings"];

export function FICalculator() {
  const form = useForm<FIInput>({
    resolver: zodResolver(fiSchema),
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
  const parsed = fiSchema.safeParse(values);
  const result = useMemo(() => (parsed.success ? computeFi(parsed.data) : null), [parsed]);

  const currencyCode = currencyCodeByRegion[region];
  const money = useMemo(() => getCurrencyFormatter(region), [region]);
  const medianNote =
    region === "IN"
      ? "Starter profile: family income around ₹48,00,000."
      : "Starter profile: family income around $150,000.";

  return (
    <CalculatorCard
      title="2) FI Calculator + Timeline + Scenarios"
      description="Estimate your FI target and timeline."
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
        <Field label={`Annual expenses (${currencyCode})`} helper="Household spend per year" error={form.formState.errors.annualExpenses?.message}>
          <CommaNumberInput formApi={form} name="annualExpenses" region={region} className={inputClass} />
        </Field>
        <Field label="Withdrawal rate %" helper="4% is the default start" error={form.formState.errors.withdrawalRatePct?.message}>
          <input type="number" step="0.1" {...form.register("withdrawalRatePct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label={`Current portfolio (${currencyCode})`} helper="Current invested corpus" error={form.formState.errors.currentPortfolio?.message}>
          <CommaNumberInput formApi={form} name="currentPortfolio" region={region} className={inputClass} />
        </Field>
        <Field label={`Annual savings / contributions (${currencyCode})`} helper="0 is allowed" error={form.formState.errors.annualSavings?.message}>
          <CommaNumberInput formApi={form} name="annualSavings" region={region} className={inputClass} />
        </Field>
        <Field label="Annual return %" error={form.formState.errors.annualReturnPct?.message}>
          <input type="number" step="0.1" {...form.register("annualReturnPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Inflation %" error={form.formState.errors.inflationPct?.message}>
          <input type="number" step="0.1" {...form.register("inflationPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
      </form>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Output
              label="FI number"
              value={money.format(result.fiNumber)}
              hint={formatCompactMoney(result.fiNumber, region)}
            />
            <Output
              label={result.hasArrived ? "Years to FI" : "Years to FI"}
              value={result.hasArrived ? "0 (Already achieved)" : result.yearsToFI === null ? ">60 years" : `${result.yearsToFI} years`}
            />
            <Output
              label="Target year"
              value={result.hasArrived ? "Already achieved" : result.targetYear === null ? "Not within simulation" : String(result.targetYear)}
            />
            <Output
              label={result.hasArrived ? "Discipline status" : "Discipline score"}
              value={result.hasArrived ? "You have arrived. Congrats!" : `${result.disciplineScore}/100`}
            />
          </div>

          <div className="ios-soft-panel relative p-3">
            <div className="h-72">
            <Line
              data={{
                labels: result.points.map((point) => point.year),
                datasets: [
                  {
                    label: `Projected output (${currencyCode})`,
                    data: result.points.map((point) => point.portfolio),
                    borderColor: "#30D158",
                    pointRadius: 0,
                    borderWidth: 2.6,
                    fill: false,
                    tension: 0.2
                  },
                  {
                    label: `FI target (input) (${currencyCode})`,
                    data: result.points.map((point) => point.fiLine),
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
                  result.points.map((point) => point.portfolio),
                  result.points.map((point) => point.fiLine)
                ]
              })}
            />
          </div>
          </div>

          <div className="space-y-3">
            <div className="ios-soft-panel p-4">
              <p className="text-xs uppercase tracking-wide text-slateBlue-500">Scenario timeline</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {result.scenarios.map((scenario) => (
                  <div key={scenario.rate} className="ios-soft-panel p-3">
                    <p className="text-xs uppercase tracking-wide text-slateBlue-500">
                      If returns are {pct(scenario.rate)}
                    </p>
                    <p className="mt-1 font-medium text-slateBlue-700">
                      {scenario.yearsToFI === null ? ">60 years" : `${scenario.yearsToFI} years`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <ToolStorySummary
              quickSummary={
                result.hasArrived
                  ? "You have arrived. Congrats! Your portfolio already covers the FI target."
                  : result.yearsToFI === null
                  ? "At this pace, FI is outside the model window. Increase savings."
                  : `At your current pace, FI is around ${result.targetYear}.`
              }
              score={result.disciplineScore}
              recommendation={result.recommendation}
              details={[
                result.explanation,
                `FI target in today's money: ${money.format(result.fiNumber)}`
              ]}
            />
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
    <div className="ios-soft-panel p-4">
      <p className="text-xs uppercase tracking-wide text-slateBlue-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slateBlue-700">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slateBlue-500">{hint}</p> : null}
    </div>
  );
}

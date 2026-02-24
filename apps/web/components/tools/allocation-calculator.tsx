"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { Line } from "react-chartjs-2";
import {
  allocationSchema,
  computeAllocation,
  type AllocationInput
} from "../../lib/calculators";
import {
  convertAmount,
  currencyCodeByRegion,
  formatCompactMoney,
  getCurrencyFormatter
} from "../../lib/currency";
import { CalculatorCard } from "./calculator-card";
import "./chart-setup";
import { getLineMoneyOptions } from "./chart-options";
import { usePersistedForm } from "./use-persisted-form";
import { useRegionMoneyFields } from "./use-region-money-fields";

const inputClass =
  "focus-ring mt-1 w-full rounded-xl border border-slateBlue-200 bg-white px-3 py-2 text-sm";

const defaults: AllocationInput = {
  usEquityPct: 55,
  indiaEquityPct: 45,
  startingPortfolio: 15000000,
  years: 10,
  usCagrPct: 8,
  indiaCagrPct: 10,
  fxChangePct: 2.5
};

const moneyFields: Path<AllocationInput>[] = ["startingPortfolio"];

export function AllocationCalculator() {
  const form = useForm<AllocationInput>({
    resolver: zodResolver(allocationSchema),
    defaultValues: defaults,
    mode: "onChange"
  });

  usePersistedForm(form, "ofr-tool-allocation");
  const region = useRegionMoneyFields(form, moneyFields);

  const values = form.watch();
  const normalizedValues: AllocationInput = {
    ...values,
    startingPortfolio: convertAmount(values.startingPortfolio ?? 0, region, "IN")
  };
  const parsed = allocationSchema.safeParse(normalizedValues);
  const result = useMemo(
    () => (parsed.success ? computeAllocation(parsed.data) : null),
    [parsed]
  );

  const currencyCode = currencyCodeByRegion[region];
  const money = useMemo(() => getCurrencyFormatter(region), [region]);
  const secondaryRegion = region === "IN" ? "US" : "IN";
  const secondaryMoney = useMemo(() => getCurrencyFormatter(secondaryRegion), [secondaryRegion]);

  return (
    <CalculatorCard
      title="4) US vs India Allocation Simulator"
      description="Educational simulator for currency-aware diversification using US equity and India equity."
    >
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="US equity %" error={form.formState.errors.usEquityPct?.message}>
          <input type="number" step="0.1" {...form.register("usEquityPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="India equity %" helper="US + India must equal 100%" error={form.formState.errors.indiaEquityPct?.message}>
          <input type="number" step="0.1" {...form.register("indiaEquityPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label={`Starting portfolio (${currencyCode})`} error={form.formState.errors.startingPortfolio?.message}>
          <input type="number" {...form.register("startingPortfolio", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="Years" error={form.formState.errors.years?.message}>
          <input type="number" {...form.register("years", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="US CAGR %" error={form.formState.errors.usCagrPct?.message}>
          <input type="number" step="0.1" {...form.register("usCagrPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="India CAGR %" error={form.formState.errors.indiaCagrPct?.message}>
          <input type="number" step="0.1" {...form.register("indiaCagrPct", { valueAsNumber: true })} className={inputClass} />
        </Field>
        <Field label="FX change %" helper="Annual INR depreciation vs USD" error={form.formState.errors.fxChangePct?.message}>
          <input type="number" step="0.1" {...form.register("fxChangePct", { valueAsNumber: true })} className={inputClass} />
        </Field>
      </form>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Output
              label={`Projected value (${currencyCode})`}
              value={
                region === "IN"
                  ? money.format(result.projectedINRValue)
                  : money.format(result.projectedUSDValue)
              }
              hint={
                region === "IN"
                  ? formatCompactMoney(result.projectedINRValue, region)
                  : formatCompactMoney(result.projectedUSDValue, region)
              }
            />
            <Output
              label={`Projected value (${currencyCodeByRegion[secondaryRegion]})`}
              value={
                region === "IN"
                  ? secondaryMoney.format(result.projectedUSDValue)
                  : secondaryMoney.format(result.projectedINRValue)
              }
              hint={
                region === "IN"
                  ? formatCompactMoney(result.projectedUSDValue, secondaryRegion)
                  : formatCompactMoney(result.projectedINRValue, secondaryRegion)
              }
            />
            <Output label="Diversification score" value={`${result.diversificationScore}/100`} />
            <Output label="Discipline score" value={`${result.disciplineScore}/100`} />
          </div>

          <div className="h-72">
            <Line
              data={{
                labels: result.points.map((point) => `Y${point.year}`),
                datasets: [
                  {
                    label: `Projected output (${currencyCode})`,
                    data:
                      region === "IN"
                        ? result.points.map((point) => point.inrValue)
                        : result.points.map((point) => point.usdValue),
                    borderColor: "#2f8f62",
                    pointRadius: 0,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.2
                  },
                  {
                    label: `Reference (${currencyCodeByRegion[secondaryRegion]})`,
                    data:
                      region === "IN"
                        ? result.points.map((point) => point.usdValue)
                        : result.points.map((point) => point.inrValue),
                    borderColor: "#5b7390",
                    pointRadius: 0,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.2
                  }
                ]
              }}
              options={getLineMoneyOptions(region, money, {
                series: [
                  region === "IN"
                    ? result.points.map((point) => point.inrValue)
                    : result.points.map((point) => point.usdValue),
                  region === "IN"
                    ? result.points.map((point) => point.usdValue)
                    : result.points.map((point) => point.inrValue)
                ]
              })}
            />
          </div>

          <div className="rounded-xl border border-slateBlue-100 bg-slateBlue-50 p-4 text-sm text-slateBlue-600">
            <p className="font-medium text-slateBlue-700">
              Quick summary: this chart compares your projected portfolio in both currencies over time.
            </p>
            <p className="mt-1">{result.explanation}</p>
            <p className="mt-2 font-medium text-slateBlue-700">Discipline Score: {result.disciplineScore}/100</p>
            <p className="mt-1 font-medium text-calmGreen-700">Next action: {result.recommendation}</p>
            <p className="mt-2 text-xs text-slateBlue-500">
              Educational simulation only. Not investment advice and not a forecast.
            </p>
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
    <div className="rounded-xl border border-slateBlue-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slateBlue-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slateBlue-700">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slateBlue-500">{hint}</p> : null}
    </div>
  );
}

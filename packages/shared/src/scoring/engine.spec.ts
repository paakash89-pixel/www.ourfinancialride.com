import { describe, expect, it } from "vitest";
import type { CompanyFinancials } from "../types/domain";
import { scoreOwnerQuality } from "./engine";

const buildOperatingFixture = (): CompanyFinancials => ({
  ticker: "ACME",
  region: "US",
  accountingStandard: "US_GAAP",
  template: "OPERATING_COMPANY_V1",
  currency: "USD",
  updatedAt: new Date("2026-01-01").toISOString(),
  points: [
    {
      year: 2019,
      revenue: 80,
      grossProfit: 36,
      operatingIncome: 13,
      netIncome: 10,
      operatingCashFlow: 12,
      capex: 3,
      totalDebt: 24,
      totalEquity: 70,
      currentAssets: 45,
      currentLiabilities: 24,
      interestExpense: 2,
      roic: 0.16,
      roe: 0.17,
      sharesOutstanding: 103
    },
    {
      year: 2020,
      revenue: 90,
      grossProfit: 43,
      operatingIncome: 16,
      netIncome: 12,
      operatingCashFlow: 14,
      capex: 3,
      totalDebt: 22,
      totalEquity: 75,
      currentAssets: 48,
      currentLiabilities: 24,
      interestExpense: 2,
      roic: 0.17,
      roe: 0.18,
      sharesOutstanding: 101
    },
    {
      year: 2021,
      revenue: 100,
      grossProfit: 50,
      operatingIncome: 20,
      netIncome: 16,
      operatingCashFlow: 18,
      capex: 3,
      totalDebt: 20,
      totalEquity: 80,
      currentAssets: 50,
      currentLiabilities: 25,
      interestExpense: 2,
      roic: 0.18,
      roe: 0.2,
      sharesOutstanding: 100
    },
    {
      year: 2022,
      revenue: 110,
      grossProfit: 56,
      operatingIncome: 22,
      netIncome: 17,
      operatingCashFlow: 20,
      capex: 3,
      totalDebt: 19,
      totalEquity: 90,
      currentAssets: 53,
      currentLiabilities: 25,
      interestExpense: 2,
      roic: 0.19,
      roe: 0.2,
      sharesOutstanding: 99
    },
    {
      year: 2023,
      revenue: 125,
      grossProfit: 64,
      operatingIncome: 25,
      netIncome: 20,
      operatingCashFlow: 23,
      capex: 4,
      totalDebt: 18,
      totalEquity: 100,
      currentAssets: 56,
      currentLiabilities: 26,
      interestExpense: 2,
      roic: 0.2,
      roe: 0.21,
      sharesOutstanding: 98
    },
    {
      year: 2024,
      revenue: 138,
      grossProfit: 72,
      operatingIncome: 28,
      netIncome: 22,
      operatingCashFlow: 26,
      capex: 4,
      totalDebt: 16,
      totalEquity: 110,
      currentAssets: 58,
      currentLiabilities: 27,
      interestExpense: 2,
      roic: 0.21,
      roe: 0.21,
      sharesOutstanding: 97
    },
    {
      year: 2025,
      revenue: 150,
      grossProfit: 80,
      operatingIncome: 31,
      netIncome: 25,
      operatingCashFlow: 30,
      capex: 4,
      totalDebt: 15,
      totalEquity: 120,
      currentAssets: 62,
      currentLiabilities: 28,
      interestExpense: 2,
      roic: 0.22,
      roe: 0.22,
      sharesOutstanding: 96
    }
  ]
});

describe("scoreOwnerQuality", () => {
  it("returns deterministic results with bounded contributors", () => {
    const financials = buildOperatingFixture();
    const a = scoreOwnerQuality(financials);
    const b = scoreOwnerQuality(financials);

    expect(a.ownerScore).toEqual(b.ownerScore);
    expect(a.ownerScore).toBeGreaterThanOrEqual(0);
    expect(a.ownerScore).toBeLessThanOrEqual(100);

    const values = Object.values(a.contributors);
    values.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(25);
    });
    expect(a.yearsOfHistory).toBe(7);
    expect(a.sectorProfile).toBeDefined();
  });

  it("returns insufficient history when less than seven years are available", () => {
    const financials = buildOperatingFixture();
    financials.points = financials.points.slice(0, 6);
    const result = scoreOwnerQuality(financials);

    expect(result.confidence).toBe("BELOW_MINIMUM");
    expect(result.verdict).toBe("Insufficient history");
    expect(result.ownerScore).toBe(0);
  });

  it("returns explainability drivers", () => {
    const result = scoreOwnerQuality(buildOperatingFixture());
    expect(result.drivers.length).toBeGreaterThan(0);
    expect(result.positives.length + result.negatives.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import { scoreSimpleOwnerQuality } from "./index";
import type { CompanyFinancials } from "../types/domain";

const buildFinancials = (points: CompanyFinancials["points"]): CompanyFinancials => ({
  ticker: "TEST",
  region: "US",
  accountingStandard: "US_GAAP",
  template: "OPERATING_COMPANY_V1",
  currency: "USD",
  updatedAt: "2026-01-01T00:00:00.000Z",
  points
});

describe("simpleOwnerScore", () => {
  it("returns insufficient-history badge below 7 years", () => {
    const result = scoreSimpleOwnerQuality(
      buildFinancials(
        Array.from({ length: 6 }).map((_, index) => ({
          year: 2018 + index,
          netIncome: 10,
          operatingCashFlow: 11,
          totalDebt: 30,
          totalEquity: 100,
          roe: 0.15
        }))
      )
    );

    expect(result.score).toBeNull();
    expect(result.badge).toBe("INSUFFICIENT_HISTORY");
  });

  it("deterministically scores high-quality fundamentals", () => {
    const result = scoreSimpleOwnerQuality(
      buildFinancials(
        Array.from({ length: 10 }).map((_, index) => ({
          year: 2014 + index,
          netIncome: 100 + index * 10,
          operatingCashFlow: 120 + index * 10,
          totalDebt: 40,
          totalEquity: 200 + index * 5,
          roe: 0.19
        }))
      )
    );

    expect(result.badge).toBe("HIGH");
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.components.profitability).toBeCloseTo(25, 2);
  });

  it("penalizes weak cash discipline and leverage", () => {
    const result = scoreSimpleOwnerQuality(
      buildFinancials(
        Array.from({ length: 8 }).map((_, index) => ({
          year: 2016 + index,
          netIncome: index % 2 === 0 ? 50 : -20,
          operatingCashFlow: 10,
          totalDebt: 350,
          totalEquity: 100,
          roe: 0.05
        }))
      )
    );

    expect(result.badge).toBe("LOW");
    expect(result.components.balanceSheet).toBeLessThan(10);
  });
});

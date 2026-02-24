import { describe, expect, it } from "vitest";
import type { CompanyFinancials } from "../types/domain";
import { scoreOwnerQuality } from "./engine";

const operatingCalibrationFixture: CompanyFinancials = {
  ticker: "CALOP",
  region: "US",
  accountingStandard: "US_GAAP",
  template: "OPERATING_COMPANY_V1",
  currency: "USD",
  updatedAt: "2026-01-01T00:00:00.000Z",
  points: [
    { year: 2016, revenue: 90, grossProfit: 45, operatingIncome: 15, netIncome: 11, operatingCashFlow: 13, capex: 3, totalDebt: 30, totalEquity: 60, currentAssets: 42, currentLiabilities: 20, interestExpense: 2.2, sharesOutstanding: 105, roic: 0.13, roe: 0.15 },
    { year: 2017, revenue: 95, grossProfit: 49, operatingIncome: 16, netIncome: 12, operatingCashFlow: 14, capex: 3, totalDebt: 29, totalEquity: 65, currentAssets: 43, currentLiabilities: 20, interestExpense: 2.1, sharesOutstanding: 104, roic: 0.14, roe: 0.16 },
    { year: 2018, revenue: 102, grossProfit: 53, operatingIncome: 18, netIncome: 13, operatingCashFlow: 15, capex: 3, totalDebt: 28, totalEquity: 70, currentAssets: 45, currentLiabilities: 21, interestExpense: 2.0, sharesOutstanding: 103, roic: 0.15, roe: 0.16 },
    { year: 2019, revenue: 110, grossProfit: 58, operatingIncome: 20, netIncome: 15, operatingCashFlow: 17, capex: 4, totalDebt: 26, totalEquity: 76, currentAssets: 48, currentLiabilities: 22, interestExpense: 1.9, sharesOutstanding: 102, roic: 0.16, roe: 0.17 },
    { year: 2020, revenue: 118, grossProfit: 63, operatingIncome: 22, netIncome: 16, operatingCashFlow: 19, capex: 4, totalDebt: 24, totalEquity: 82, currentAssets: 50, currentLiabilities: 23, interestExpense: 1.8, sharesOutstanding: 101, roic: 0.17, roe: 0.18 },
    { year: 2021, revenue: 127, grossProfit: 69, operatingIncome: 24, netIncome: 18, operatingCashFlow: 21, capex: 4, totalDebt: 22, totalEquity: 90, currentAssets: 54, currentLiabilities: 24, interestExpense: 1.7, sharesOutstanding: 100, roic: 0.18, roe: 0.19 },
    { year: 2022, revenue: 138, grossProfit: 75, operatingIncome: 27, netIncome: 20, operatingCashFlow: 23, capex: 4, totalDebt: 20, totalEquity: 98, currentAssets: 57, currentLiabilities: 25, interestExpense: 1.6, sharesOutstanding: 99, roic: 0.19, roe: 0.2 },
    { year: 2023, revenue: 149, grossProfit: 81, operatingIncome: 29, netIncome: 22, operatingCashFlow: 26, capex: 5, totalDebt: 18, totalEquity: 108, currentAssets: 60, currentLiabilities: 26, interestExpense: 1.5, sharesOutstanding: 98, roic: 0.2, roe: 0.2 },
    { year: 2024, revenue: 161, grossProfit: 88, operatingIncome: 32, netIncome: 24, operatingCashFlow: 28, capex: 5, totalDebt: 16, totalEquity: 118, currentAssets: 64, currentLiabilities: 27, interestExpense: 1.4, sharesOutstanding: 97, roic: 0.21, roe: 0.21 },
    { year: 2025, revenue: 173, grossProfit: 95, operatingIncome: 35, netIncome: 27, operatingCashFlow: 31, capex: 5, totalDebt: 15, totalEquity: 130, currentAssets: 68, currentLiabilities: 28, interestExpense: 1.3, sharesOutstanding: 96, roic: 0.22, roe: 0.21 }
  ]
};

const financialCalibrationFixture: CompanyFinancials = {
  ticker: "CALBANK",
  region: "IN",
  accountingStandard: "IND_AS",
  template: "FINANCIALS_V1",
  currency: "INR",
  updatedAt: "2026-01-01T00:00:00.000Z",
  points: [
    { year: 2016, netIncome: 15, operatingCashFlow: 14, totalEquity: 95, capitalAdequacyRatio: 0.13, nonPerformingAssetsRatio: 0.04, loanLossCoverageRatio: 1.0, efficiencyRatio: 0.58, roe: 0.16 },
    { year: 2017, netIncome: 17, operatingCashFlow: 16, totalEquity: 102, capitalAdequacyRatio: 0.135, nonPerformingAssetsRatio: 0.038, loanLossCoverageRatio: 1.05, efficiencyRatio: 0.56, roe: 0.165 },
    { year: 2018, netIncome: 19, operatingCashFlow: 18, totalEquity: 109, capitalAdequacyRatio: 0.138, nonPerformingAssetsRatio: 0.035, loanLossCoverageRatio: 1.1, efficiencyRatio: 0.55, roe: 0.17 },
    { year: 2019, netIncome: 21, operatingCashFlow: 20, totalEquity: 117, capitalAdequacyRatio: 0.14, nonPerformingAssetsRatio: 0.033, loanLossCoverageRatio: 1.12, efficiencyRatio: 0.53, roe: 0.173 },
    { year: 2020, netIncome: 23, operatingCashFlow: 22, totalEquity: 126, capitalAdequacyRatio: 0.142, nonPerformingAssetsRatio: 0.03, loanLossCoverageRatio: 1.15, efficiencyRatio: 0.52, roe: 0.176 },
    { year: 2021, netIncome: 25, operatingCashFlow: 24, totalEquity: 136, capitalAdequacyRatio: 0.145, nonPerformingAssetsRatio: 0.028, loanLossCoverageRatio: 1.18, efficiencyRatio: 0.5, roe: 0.18 },
    { year: 2022, netIncome: 28, operatingCashFlow: 27, totalEquity: 147, capitalAdequacyRatio: 0.148, nonPerformingAssetsRatio: 0.026, loanLossCoverageRatio: 1.22, efficiencyRatio: 0.49, roe: 0.184 },
    { year: 2023, netIncome: 31, operatingCashFlow: 30, totalEquity: 159, capitalAdequacyRatio: 0.15, nonPerformingAssetsRatio: 0.024, loanLossCoverageRatio: 1.25, efficiencyRatio: 0.47, roe: 0.19 },
    { year: 2024, netIncome: 34, operatingCashFlow: 33, totalEquity: 172, capitalAdequacyRatio: 0.152, nonPerformingAssetsRatio: 0.022, loanLossCoverageRatio: 1.28, efficiencyRatio: 0.46, roe: 0.195 },
    { year: 2025, netIncome: 37, operatingCashFlow: 36, totalEquity: 186, capitalAdequacyRatio: 0.155, nonPerformingAssetsRatio: 0.02, loanLossCoverageRatio: 1.3, efficiencyRatio: 0.45, roe: 0.2 }
  ]
};

describe("owner score calibration", () => {
  it("matches operating calibration output", () => {
    const result = scoreOwnerQuality(operatingCalibrationFixture);
    expect(result.ownerScore).toBeCloseTo(64.59, 2);
    expect(result.verdict).toBe("Watchlist");
    expect(result.confidence).toBe("HIGH");
  });

  it("matches financials calibration output", () => {
    const result = scoreOwnerQuality(financialCalibrationFixture);
    expect(result.ownerScore).toBeCloseTo(64.79, 2);
    expect(result.verdict).toBe("Watchlist");
    expect(result.confidence).toBe("HIGH");
  });
});

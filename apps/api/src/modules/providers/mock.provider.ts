import type { CompanyFinancials, Region, ScoringTemplate } from "@intrinsic/shared";
import type { FinancialDataProvider, PricePoint } from "./provider.interface";

const seededNumber = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededFloat = (seed: string, min: number, max: number): number => {
  const range = max - min;
  const value = seededNumber(seed) % 10_000;
  return min + (value / 9_999) * range;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const currencyFromRegion = (region: Region): string => (region === "IN" ? "INR" : "USD");

const accountingForRegion = (region: Region): "US_GAAP" | "IND_AS" =>
  region === "IN" ? "IND_AS" : "US_GAAP";

const templateFromTicker = (ticker: string): ScoringTemplate => {
  const lower = ticker.toLowerCase();
  if (lower.includes("bank") || lower.includes("ins")) return "FINANCIALS_V1";
  return "OPERATING_COMPANY_V1";
};

export class MockFinancialProvider implements FinancialDataProvider {
  async getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials> {
    const profile = `${params.ticker}-${params.region}`;
    const seed = seededNumber(profile);
    const startRevenue = params.region === "IN" ? 120_000 : 12_000;
    const template = templateFromTicker(params.ticker);

    const quality = seededFloat(`${profile}-quality`, 0, 1);
    const growthBase = seededFloat(`${profile}-growth`, -0.04, 0.22);
    const cashConversionBase = seededFloat(`${profile}-cash-conv`, 0.55, 1.55);
    const leverageBase = seededFloat(`${profile}-leverage`, 0.1, 1.8);
    const shareDrift = seededFloat(`${profile}-share-drift`, -0.03, 0.03);
    const sectorStyle = seededNumber(`${profile}-sector`) % 3;

    const capexBase =
      sectorStyle === 0
        ? seededFloat(`${profile}-capex-0`, 0.02, 0.06)
        : sectorStyle === 1
          ? seededFloat(`${profile}-capex-1`, 0.05, 0.11)
          : seededFloat(`${profile}-capex-2`, 0.1, 0.2);

    const marginBase =
      template === "FINANCIALS_V1"
        ? seededFloat(`${profile}-margin-fin`, 0.08, 0.28)
        : seededFloat(`${profile}-margin-op`, 0.03, 0.32);

    let revenue = startRevenue * (0.7 + quality * 0.7);
    let shares = 900_000 + (seed % 400_000);

    const points = Array.from({ length: 10 }, (_, idx) => {
      const year = 2016 + idx;
      const growthShock = seededFloat(`${profile}-growth-${idx}`, -0.03, 0.03);
      const growth = clamp(growthBase + growthShock, -0.12, 0.3);
      revenue = revenue * (1 + growth);

      const marginShock = seededFloat(`${profile}-margin-${idx}`, -0.03, 0.03);
      const operatingMargin = clamp(marginBase + marginShock + (quality - 0.5) * 0.05, -0.12, 0.45);
      const grossMargin = clamp(
        operatingMargin + seededFloat(`${profile}-gross-${idx}`, 0.14, 0.36),
        0.08,
        0.78
      );
      const netMargin = clamp(
        operatingMargin * seededFloat(`${profile}-net-k-${idx}`, 0.45, 0.85) -
          seededFloat(`${profile}-net-tax-${idx}`, 0.005, 0.05),
        -0.2,
        0.35
      );

      const operatingIncome = revenue * operatingMargin;
      const netIncome = revenue * netMargin;

      const conversionShock = seededFloat(`${profile}-conv-${idx}`, -0.2, 0.2);
      const operatingCashFlow = netIncome * clamp(cashConversionBase + conversionShock, 0.3, 1.8);

      const capexShock = seededFloat(`${profile}-capex-${idx}`, -0.02, 0.02);
      const capexRatio = clamp(capexBase + capexShock, 0.01, 0.28);
      const capex = Math.abs(revenue * capexRatio);

      const equity = revenue * clamp(seededFloat(`${profile}-equity-${idx}`, 0.25, 1.05), 0.2, 1.2);
      const desiredDebtToEquity = clamp(
        leverageBase + seededFloat(`${profile}-de-${idx}`, -0.25, 0.25) - idx * 0.03,
        0.02,
        2.5
      );
      const debt = equity * desiredDebtToEquity;
      const currentAssets = revenue * clamp(seededFloat(`${profile}-ca-${idx}`, 0.12, 0.48), 0.1, 0.6);
      const currentLiabilities = revenue * clamp(
        seededFloat(`${profile}-cl-${idx}`, 0.08, 0.38),
        0.06,
        0.5
      );
      const interestExpense = Math.max(
        1,
        debt * clamp(seededFloat(`${profile}-ir-${idx}`, 0.015, 0.095), 0.01, 0.12)
      );

      shares = Math.max(120_000, shares * (1 + shareDrift + seededFloat(`${profile}-sd-${idx}`, -0.01, 0.01)));
      const roic = debt + equity > 0 ? operatingIncome / (debt + equity) : 0;
      const roe = equity > 0 ? netIncome / equity : 0;

      const base = {
        year,
        revenue,
        grossProfit: revenue * grossMargin,
        operatingIncome,
        netIncome,
        operatingCashFlow,
        capex,
        totalDebt: debt,
        totalEquity: equity,
        totalAssets: equity + debt + revenue * seededFloat(`${profile}-oa-${idx}`, 0.08, 0.45),
        currentAssets,
        currentLiabilities,
        interestExpense,
        sharesOutstanding: Math.round(shares),
        roic,
        roe
      };

      if (template === "FINANCIALS_V1") {
        return {
          ...base,
          efficiencyRatio: clamp(
            seededFloat(`${profile}-eff-${idx}`, 0.38, 0.78) - quality * 0.12,
            0.28,
            0.9
          ),
          capitalAdequacyRatio: clamp(
            seededFloat(`${profile}-car-${idx}`, 0.08, 0.2) + quality * 0.03,
            0.06,
            0.28
          ),
          nonPerformingAssetsRatio: clamp(
            seededFloat(`${profile}-npa-${idx}`, 0.004, 0.14) - quality * 0.05,
            0.002,
            0.2
          ),
          loanLossCoverageRatio: clamp(
            seededFloat(`${profile}-llc-${idx}`, 0.45, 1.8) + quality * 0.25,
            0.3,
            2.2
          ),
          netInterestIncome: revenue * clamp(seededFloat(`${profile}-nii-${idx}`, 0.12, 0.3), 0.08, 0.35),
          nonInterestIncome: revenue * clamp(seededFloat(`${profile}-noi-${idx}`, 0.04, 0.22), 0.02, 0.3)
        };
      }

      return base;
    });

    return {
      ticker: params.ticker.toUpperCase(),
      region: params.region,
      accountingStandard: accountingForRegion(params.region),
      template,
      points,
      currency: currencyFromRegion(params.region),
      updatedAt: new Date().toISOString()
    };
  }

  async getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    const profile = `${params.ticker}-${params.region}`;
    const seed = seededNumber(profile);
    const years = params.years ?? 10;
    const today = new Date();
    let base = params.region === "IN" ? 500 : 80;

    return Array.from({ length: years * 12 }, (_, idx) => {
      const date = new Date(today);
      date.setMonth(today.getMonth() - (years * 12 - idx));
      const wobble = seededFloat(`${profile}-wobble-${idx}`, -0.03, 0.03);
      const trend = seededFloat(`${profile}-trend`, -0.004, 0.018);
      base *= 1 + trend + wobble;
      base = Math.max(1, base);
      return {
        date: date.toISOString(),
        close: Number(base.toFixed(2))
      };
    });
  }
}

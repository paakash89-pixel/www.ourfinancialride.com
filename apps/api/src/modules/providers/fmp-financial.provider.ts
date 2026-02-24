import type {
  AccountingStandard,
  CompanyFinancials,
  FiscalPoint,
  Region,
  ScoringTemplate
} from "@intrinsic/shared";
import type { FinancialDataProvider, PricePoint } from "./provider.interface";

interface FmpIncomeStatement {
  fiscalYear?: string | number;
  calendarYear?: string;
  date?: string;
  period?: string;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  interestExpense?: number;
  weightedAverageShsOut?: number;
  weightedAverageShsOutDil?: number;
  commonStockSharesOutstanding?: number;
}

interface FmpBalanceStatement {
  fiscalYear?: string | number;
  calendarYear?: string;
  date?: string;
  period?: string;
  totalDebt?: number;
  totalStockholdersEquity?: number;
  totalAssets?: number;
  totalCurrentAssets?: number;
  totalCurrentLiabilities?: number;
  commonStockSharesOutstanding?: number;
}

interface FmpCashFlowStatement {
  fiscalYear?: string | number;
  calendarYear?: string;
  date?: string;
  period?: string;
  operatingCashFlow?: number;
  capitalExpenditure?: number;
}

interface FmpHistoricalPriceResponse {
  historical?: Array<{
    date?: string;
    close?: number;
  }>;
}

interface FmpStablePricePoint {
  date?: string;
  price?: number;
  close?: number;
}

interface FmpProfile {
  price?: number;
  mktCap?: number;
  marketCap?: number;
  sharesOutstanding?: number;
}

const FMP_STABLE_BASE = "https://financialmodelingprep.com/stable";
const FMP_LEGACY_BASE = "https://financialmodelingprep.com/api/v3";

const templateFromTicker = (ticker: string): ScoringTemplate => {
  const normalized = ticker.toUpperCase();
  if (
    normalized.includes("BANK") ||
    normalized.includes("INS") ||
    normalized.includes("FIN")
  ) {
    return "FINANCIALS_V1";
  }
  return "OPERATING_COMPANY_V1";
};

const currencyFromRegion = (region: Region): string => (region === "IN" ? "INR" : "USD");

const accountingFromSymbol = (symbol: string, region: Region): AccountingStandard => {
  const upper = symbol.toUpperCase();
  if (upper.endsWith(".NS") || upper.endsWith(".BO")) return "IND_AS";
  if (upper.includes(".")) return "IFRS";
  return region === "IN" ? "IND_AS" : "US_GAAP";
};

const yearFromRecord = (record: {
  fiscalYear?: string | number;
  calendarYear?: string | number;
  date?: string;
}): number | undefined => {
  if (typeof record.fiscalYear === "number" && Number.isFinite(record.fiscalYear)) {
    return record.fiscalYear;
  }
  if (typeof record.fiscalYear === "string") {
    const year = Number(record.fiscalYear);
    if (Number.isFinite(year)) return year;
  }
  if (typeof record.calendarYear === "number" && Number.isFinite(record.calendarYear)) {
    return record.calendarYear;
  }
  if (typeof record.calendarYear === "string") {
    const year = Number(record.calendarYear);
    if (Number.isFinite(year)) return year;
  }
  if (record.date) {
    const year = new Date(record.date).getUTCFullYear();
    if (Number.isFinite(year)) return year;
  }
  return undefined;
};

const toYearString = (date: Date): string => date.toISOString().slice(0, 10);

const isFullYearPeriod = (period?: string): boolean => {
  if (!period) return true;
  const normalized = period.toUpperCase();
  return normalized === "FY" || normalized === "ANNUAL";
};

const toNormalizedPoints = (
  points: Array<{
    date?: string;
    close: number;
  }>
): PricePoint[] =>
  points
    .map((point) => ({
      date: new Date(point.date ?? "").toISOString(),
      close: point.close
    }))
    .filter((point) => !Number.isNaN(new Date(point.date).getTime()))
    .sort((a, b) => a.date.localeCompare(b.date));

const redactApiKey = (url: string): string =>
  url.replace(/apikey=[^&]+/i, "apikey=***");

const toNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const buildCandidates = (ticker: string, region: Region): string[] => {
  const clean = ticker.toUpperCase().trim();
  if (!clean) return [];
  if (region === "US") return [clean];
  if (clean.endsWith(".NS") || clean.endsWith(".BO")) return [clean];
  // India path is exchange-scoped to avoid accidental cross-region symbol matches.
  return [`${clean}.NS`, `${clean}.BO`];
};

export class FmpFinancialProvider implements FinancialDataProvider {
  constructor(private readonly apiKey: string) {}

  async getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials> {
    const candidates = buildCandidates(params.ticker, params.region);
    for (const symbol of candidates) {
      const financials = await this.fetchFinancialsForSymbol(symbol, params.region);
      if (financials.points.length >= 4) return financials;
    }
    throw new Error(`FMP financial statements unavailable for ${params.ticker} (${params.region})`);
  }

  async getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    const candidates = buildCandidates(params.ticker, params.region);
    for (const symbol of candidates) {
      const prices = await this.fetchPricesForSymbol(symbol, params.years ?? 10);
      if (prices.length >= 12) return prices;
    }
    throw new Error(`FMP price history unavailable for ${params.ticker} (${params.region})`);
  }

  private async fetchFinancialsForSymbol(
    symbol: string,
    region: Region
  ): Promise<CompanyFinancials> {
    const [income, balance, cash] = await Promise.all([
      this.fetchStatementArray<FmpIncomeStatement>("income-statement", symbol),
      this.fetchStatementArray<FmpBalanceStatement>("balance-sheet-statement", symbol),
      this.fetchStatementArray<FmpCashFlowStatement>("cash-flow-statement", symbol)
    ]);

    const byYear = new Map<number, FiscalPoint>();
    const ensurePoint = (year: number): FiscalPoint => {
      const existing = byYear.get(year);
      if (existing) return existing;
      const point: FiscalPoint = { year };
      byYear.set(year, point);
      return point;
    };

    for (const item of income) {
      if (!isFullYearPeriod(item.period)) continue;
      const year = yearFromRecord(item);
      if (!year) continue;
      const point = ensurePoint(year);
      point.revenue = toNumber(item.revenue);
      point.grossProfit = toNumber(item.grossProfit);
      point.operatingIncome = toNumber(item.operatingIncome);
      point.netIncome = toNumber(item.netIncome);
      point.interestExpense = Math.abs(toNumber(item.interestExpense) ?? 0) || undefined;
      point.sharesOutstanding =
        toNumber(item.weightedAverageShsOutDil) ??
        toNumber(item.weightedAverageShsOut) ??
        toNumber(item.commonStockSharesOutstanding) ??
        point.sharesOutstanding;
    }

    for (const item of balance) {
      if (!isFullYearPeriod(item.period)) continue;
      const year = yearFromRecord(item);
      if (!year) continue;
      const point = ensurePoint(year);
      point.totalDebt = toNumber(item.totalDebt);
      point.totalEquity = toNumber(item.totalStockholdersEquity);
      point.totalAssets = toNumber(item.totalAssets);
      point.currentAssets = toNumber(item.totalCurrentAssets);
      point.currentLiabilities = toNumber(item.totalCurrentLiabilities);
      point.sharesOutstanding = toNumber(item.commonStockSharesOutstanding);
    }

    for (const item of cash) {
      if (!isFullYearPeriod(item.period)) continue;
      const year = yearFromRecord(item);
      if (!year) continue;
      const point = ensurePoint(year);
      point.operatingCashFlow = toNumber(item.operatingCashFlow);
      const capex = toNumber(item.capitalExpenditure);
      point.capex = typeof capex === "number" ? Math.abs(capex) : undefined;
    }

    const points = Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .slice(-10);

    if (points.length > 0) {
      const hasShares = points.some(
        (point) => typeof point.sharesOutstanding === "number" && point.sharesOutstanding > 0
      );
      if (!hasShares) {
        const fallbackShares = await this.fetchSharesOutstanding(symbol);
        if (typeof fallbackShares === "number" && fallbackShares > 0) {
          points[points.length - 1].sharesOutstanding = fallbackShares;
        }
      }
    }

    for (const point of points) {
      if (
        typeof point.netIncome === "number" &&
        typeof point.totalEquity === "number" &&
        point.totalEquity > 0
      ) {
        point.roe = point.netIncome / point.totalEquity;
      }

      if (
        typeof point.operatingIncome === "number" &&
        typeof point.totalDebt === "number" &&
        typeof point.totalEquity === "number"
      ) {
        const investedCapital = point.totalDebt + point.totalEquity;
        if (investedCapital > 0) {
          point.roic = point.operatingIncome / investedCapital;
        }
      }
    }

    return {
      ticker: symbol.toUpperCase().replace(/\.NS$|\.BO$/, ""),
      region,
      accountingStandard: accountingFromSymbol(symbol, region),
      template: templateFromTicker(symbol),
      points,
      currency: currencyFromRegion(region),
      updatedAt: new Date().toISOString()
    };
  }

  private async fetchPricesForSymbol(symbol: string, years: number): Promise<PricePoint[]> {
    const months = Math.max(12, Math.min(240, years * 12));
    const today = new Date();
    const from = new Date();
    from.setUTCFullYear(today.getUTCFullYear() - Math.ceil(months / 12) - 1);

    const stableUrl = this.buildUrl(FMP_STABLE_BASE, "historical-price-eod/light", {
      symbol,
      from: toYearString(from),
      to: toYearString(today)
    });
    const stablePoints = await this.fetchJson<FmpStablePricePoint[]>(stableUrl);
    if (Array.isArray(stablePoints) && stablePoints.length) {
      const mapped = stablePoints
        .map((point) => {
          const close = toNumber(point.price) ?? toNumber(point.close);
          if (!point.date || typeof close !== "number") return null;
          return {
            date: point.date,
            close
          };
        })
        .filter((point): point is { date: string; close: number } => point !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-months);
      return toNormalizedPoints(mapped);
    }

    const legacyUrl = this.buildUrl(
      FMP_LEGACY_BASE,
      `historical-price-full/${encodeURIComponent(symbol)}`,
      {
        serietype: "line",
        timeseries: String(months)
      }
    );
    const response = await this.fetchJson<FmpHistoricalPriceResponse>(legacyUrl);
    const historical = response?.historical ?? [];
    const mapped = historical
      .map((point) => {
        if (!point.date || typeof point.close !== "number" || !Number.isFinite(point.close)) {
          return null;
        }
        return { date: point.date, close: point.close };
      })
      .filter((point): point is { date: string; close: number } => point !== null)
      .slice(-months);

    return toNormalizedPoints(mapped);
  }

  private async fetchStatementArray<T>(statementType: string, symbol: string): Promise<T[]> {
    const fetchStable = async (limit: "12" | "5"): Promise<T[] | null> => {
      const stableUrl = this.buildUrl(FMP_STABLE_BASE, statementType, {
        symbol,
        limit
      });
      return this.fetchJson<T[]>(stableUrl).catch(() => null);
    };

    let stableError = "";
    const stableLong = await fetchStable("12").catch((error) => {
      stableError = error instanceof Error ? error.message : "unknown error";
      return null;
    });
    if (Array.isArray(stableLong) && stableLong.length >= 8) {
      return stableLong;
    }

    const stableShort = await fetchStable("5");
    if (Array.isArray(stableShort) && stableShort.length > 0) {
      return stableShort;
    }

    const legacyUrl = this.buildUrl(
      FMP_LEGACY_BASE,
      `${statementType}/${encodeURIComponent(symbol)}`,
      {
        period: "annual",
        limit: "12"
      }
    );
    let legacyError = "";
    const legacy = await this.fetchJson<T[]>(legacyUrl).catch((error) => {
      legacyError = error instanceof Error ? error.message : "unknown error";
      return null;
    });
    if (Array.isArray(legacy) && legacy.length > 0) {
      return legacy;
    }

    const details = [stableError, legacyError].filter(Boolean).join(" | ");
    if (details) {
      throw new Error(`${statementType} ${symbol}: ${details}`);
    }
    return [];
  }

  private async fetchSharesOutstanding(symbol: string): Promise<number | undefined> {
    const stableUrl = this.buildUrl(FMP_STABLE_BASE, "profile", { symbol });
    const stable = await this.fetchJson<FmpProfile[]>(stableUrl).catch(() => null);
    const stableProfile = Array.isArray(stable) ? stable[0] : undefined;
    const stableShares =
      toNumber(stableProfile?.sharesOutstanding) ??
      this.deriveSharesFromMarketCap(stableProfile);
    if (typeof stableShares === "number" && stableShares > 0) return stableShares;

    const legacyUrl = this.buildUrl(FMP_LEGACY_BASE, `profile/${encodeURIComponent(symbol)}`, {});
    const legacy = await this.fetchJson<FmpProfile[]>(legacyUrl).catch(() => null);
    const legacyProfile = Array.isArray(legacy) ? legacy[0] : undefined;
    const legacyShares =
      toNumber(legacyProfile?.sharesOutstanding) ??
      this.deriveSharesFromMarketCap(legacyProfile);
    if (typeof legacyShares === "number" && legacyShares > 0) return legacyShares;

    return undefined;
  }

  private deriveSharesFromMarketCap(profile?: FmpProfile): number | undefined {
    if (!profile) return undefined;
    const marketCap = toNumber(profile.marketCap) ?? toNumber(profile.mktCap);
    const price = toNumber(profile.price);
    if (
      typeof marketCap !== "number" ||
      typeof price !== "number" ||
      !Number.isFinite(marketCap) ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return undefined;
    }
    const derived = marketCap / price;
    return Number.isFinite(derived) && derived > 0 ? derived : undefined;
  }

  private buildUrl(base: string, path: string, query: Record<string, string>): string {
    const params = new URLSearchParams(query);
    params.set("apikey", this.apiKey);
    return `${base}/${path}?${params.toString()}`;
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Intrinsic/1.0"
      }
    });

    if (!response.ok) {
      const body = (await response.text().catch(() => "")).slice(0, 220);
      throw new Error(
        `FMP ${response.status} for ${redactApiKey(url)}${body ? ` :: ${body}` : ""}`
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }
}

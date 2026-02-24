import { Injectable, Logger } from "@nestjs/common";
import type {
  AccountingStandard,
  CompanyFinancials,
  FiscalPoint,
  Region,
  ScoringTemplate
} from "@intrinsic/shared";
import type { FinancialDataProvider, PricePoint } from "./provider.interface";

interface YahooRawNumber {
  raw?: number;
}

interface YahooStatementBase {
  endDate?: YahooRawNumber;
}

interface YahooIncomeStatement extends YahooStatementBase {
  totalRevenue?: YahooRawNumber;
  grossProfit?: YahooRawNumber;
  operatingIncome?: YahooRawNumber;
  netIncome?: YahooRawNumber;
  interestExpense?: YahooRawNumber;
}

interface YahooBalanceStatement extends YahooStatementBase {
  totalDebt?: YahooRawNumber;
  totalStockholderEquity?: YahooRawNumber;
  totalAssets?: YahooRawNumber;
  totalCurrentAssets?: YahooRawNumber;
  totalCurrentLiabilities?: YahooRawNumber;
  commonStockSharesOutstanding?: YahooRawNumber;
}

interface YahooCashflowStatement extends YahooStatementBase {
  totalCashFromOperatingActivities?: YahooRawNumber;
  capitalExpenditures?: YahooRawNumber;
}

interface YahooQuoteSummaryResult {
  incomeStatementHistory?: {
    incomeStatementHistory?: YahooIncomeStatement[];
  };
  balanceSheetHistory?: {
    balanceSheetStatements?: YahooBalanceStatement[];
  };
  cashflowStatementHistory?: {
    cashflowStatements?: YahooCashflowStatement[];
  };
}

interface YahooQuoteSummaryResponse {
  quoteSummary?: {
    result?: YahooQuoteSummaryResult[];
  };
}

interface YahooTimeseriesValue {
  asOfDate?: string;
  timestamp?: number;
  reportedValue?: YahooRawNumber;
}

interface YahooTimeseriesResult {
  [key: string]: unknown;
}

interface YahooTimeseriesResponse {
  timeseries?: {
    result?: YahooTimeseriesResult[];
  };
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

const YAHOO_SUMMARY_URLS = [
  "https://query2.finance.yahoo.com/v10/finance/quoteSummary",
  "https://query1.finance.yahoo.com/v10/finance/quoteSummary"
];
const YAHOO_TIMESERIES_URL =
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries";
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

const REQUEST_HEADERS: Record<string, string> = {
  accept: "application/json,text/plain,*/*",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
  referer: "https://finance.yahoo.com/",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
};

const currencyFromRegion = (region: Region): string => (region === "IN" ? "INR" : "USD");
const accountingFromSymbol = (symbol: string, region: Region): AccountingStandard => {
  const upper = symbol.toUpperCase();
  if (upper.endsWith(".NS") || upper.endsWith(".BO")) return "IND_AS";
  if (upper.includes(".")) return "IFRS";
  return region === "IN" ? "IND_AS" : "US_GAAP";
};

const asRaw = (value?: YahooRawNumber): number | undefined =>
  typeof value?.raw === "number" && Number.isFinite(value.raw) ? value.raw : undefined;

const yearFromEpoch = (epoch?: number): number | undefined => {
  if (!epoch || !Number.isFinite(epoch)) return undefined;
  return new Date(epoch * 1000).getUTCFullYear();
};

const yearFromAsOfDate = (asOfDate?: string): number | undefined => {
  if (typeof asOfDate !== "string" || asOfDate.length < 4) return undefined;
  const year = Number(asOfDate.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
};

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

const buildCandidates = (ticker: string, region: Region): string[] => {
  const clean = ticker.toUpperCase().trim();
  if (!clean) return [];
  if (region === "US") return [clean];
  if (clean.endsWith(".NS") || clean.endsWith(".BO")) return [clean];
  return [`${clean}.NS`, `${clean}.BO`, clean];
};

type NumericFiscalField = Exclude<keyof FiscalPoint, "year">;

const TIMESERIES_TYPE_TO_FIELD: Record<string, NumericFiscalField> = {
  annualTotalRevenue: "revenue",
  annualOperatingRevenue: "revenue",
  annualOperatingIncome: "operatingIncome",
  annualNetIncome: "netIncome",
  annualNetIncomeCommonStockholders: "netIncome",
  annualTotalCashFromOperatingActivities: "operatingCashFlow",
  annualOperatingCashFlow: "operatingCashFlow",
  annualCapitalExpenditure: "capex",
  annualCapitalExpenditures: "capex",
  annualTotalDebt: "totalDebt",
  annualStockholdersEquity: "totalEquity",
  annualTotalEquityGrossMinorityInterest: "totalEquity",
  annualCommonStockEquity: "totalEquity",
  annualTotalAssets: "totalAssets",
  annualCurrentAssets: "currentAssets",
  annualCurrentLiabilities: "currentLiabilities",
  annualDilutedAverageShares: "sharesOutstanding",
  annualBasicAverageShares: "sharesOutstanding",
  annualInterestExpense: "interestExpense",
  annualInterestExpenseNonOperating: "interestExpense"
};

const TIMESERIES_TYPES = Array.from(new Set(Object.keys(TIMESERIES_TYPE_TO_FIELD))).join(",");

@Injectable()
export class YahooFinancialProvider implements FinancialDataProvider {
  private readonly logger = new Logger(YahooFinancialProvider.name);

  async getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials> {
    const candidates = buildCandidates(params.ticker, params.region);

    for (const symbol of candidates) {
      const financials = await this.fetchCompanyFinancials(symbol, params.region);
      if (financials.points.length >= 4) return financials;
    }

    throw new Error(`Yahoo financial statements unavailable for ${params.ticker} (${params.region})`);
  }

  async getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    const candidates = buildCandidates(params.ticker, params.region);
    const years = params.years ?? 10;

    for (const symbol of candidates) {
      const prices = await this.fetchPriceHistory(symbol, years);
      if (prices.length >= 12) return prices;
    }

    throw new Error(`Yahoo chart unavailable for ${params.ticker} (${params.region})`);
  }

  private async fetchCompanyFinancials(
    symbol: string,
    region: Region
  ): Promise<CompanyFinancials> {
    const candidates: CompanyFinancials[] = [];

    for (const baseUrl of YAHOO_SUMMARY_URLS) {
      const summary = await this.fetchFromQuoteSummary(baseUrl, symbol, region);
      if (summary) candidates.push(summary);
    }

    const timeseries = await this.fetchFromTimeseries(symbol, region);
    if (timeseries) candidates.push(timeseries);

    const best = candidates.sort((a, b) => b.points.length - a.points.length)[0];
    return best ?? this.emptyFinancials(symbol, region);
  }

  private async fetchFromQuoteSummary(
    baseUrl: string,
    symbol: string,
    region: Region
  ): Promise<CompanyFinancials | null> {
    const modules = [
      "incomeStatementHistory",
      "balanceSheetHistory",
      "cashflowStatementHistory"
    ].join(",");
    const url = `${baseUrl}/${encodeURIComponent(symbol)}?modules=${modules}`;
    const response = await this.fetchWithRetry(url);

    if (!response) {
      this.logger.warn(`Yahoo summary ${symbol} failed before response (${baseUrl})`);
      return null;
    }

    if (!response.ok) {
      this.logger.warn(`Yahoo summary ${symbol} failed with status ${response.status} (${baseUrl})`);
      return null;
    }

    let payload: YahooQuoteSummaryResponse;
    try {
      payload = (await response.json()) as YahooQuoteSummaryResponse;
    } catch {
      return null;
    }

    const result = payload.quoteSummary?.result?.[0];
    if (!result) return null;

    const byYear = new Map<number, FiscalPoint>();
    const ensurePoint = (year: number): FiscalPoint => {
      const existing = byYear.get(year);
      if (existing) return existing;
      const point: FiscalPoint = { year };
      byYear.set(year, point);
      return point;
    };

    for (const item of result.incomeStatementHistory?.incomeStatementHistory ?? []) {
      const year = yearFromEpoch(item.endDate?.raw);
      if (!year) continue;
      const point = ensurePoint(year);
      point.revenue = asRaw(item.totalRevenue);
      point.grossProfit = asRaw(item.grossProfit);
      point.operatingIncome = asRaw(item.operatingIncome);
      point.netIncome = asRaw(item.netIncome);
      point.interestExpense = asRaw(item.interestExpense);
    }

    for (const item of result.balanceSheetHistory?.balanceSheetStatements ?? []) {
      const year = yearFromEpoch(item.endDate?.raw);
      if (!year) continue;
      const point = ensurePoint(year);
      point.totalDebt = asRaw(item.totalDebt);
      point.totalEquity = asRaw(item.totalStockholderEquity);
      point.totalAssets = asRaw(item.totalAssets);
      point.currentAssets = asRaw(item.totalCurrentAssets);
      point.currentLiabilities = asRaw(item.totalCurrentLiabilities);
      point.sharesOutstanding = asRaw(item.commonStockSharesOutstanding);
    }

    for (const item of result.cashflowStatementHistory?.cashflowStatements ?? []) {
      const year = yearFromEpoch(item.endDate?.raw);
      if (!year) continue;
      const point = ensurePoint(year);
      point.operatingCashFlow = asRaw(item.totalCashFromOperatingActivities);
      const capexRaw = asRaw(item.capitalExpenditures);
      point.capex = typeof capexRaw === "number" ? Math.abs(capexRaw) : undefined;
    }

    const points = this.applyDerivedRatios(
      Array.from(byYear.values())
        .sort((a, b) => a.year - b.year)
        .slice(-10)
    );

    if (points.length === 0) return null;

    return {
      ticker: paramsTickerFromSymbol(symbol),
      region,
      accountingStandard: accountingFromSymbol(symbol, region),
      template: templateFromTicker(symbol),
      points,
      currency: currencyFromRegion(region),
      updatedAt: new Date().toISOString()
    };
  }

  private async fetchFromTimeseries(
    symbol: string,
    region: Region
  ): Promise<CompanyFinancials | null> {
    const currentYear = new Date().getUTCFullYear();
    const period1 = Math.floor(Date.UTC(currentYear - 15, 0, 1) / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    const url =
      `${YAHOO_TIMESERIES_URL}/${encodeURIComponent(symbol)}` +
      `?type=${encodeURIComponent(TIMESERIES_TYPES)}&period1=${period1}&period2=${period2}`;
    const response = await this.fetchWithRetry(url);

    if (!response) {
      this.logger.warn(`Yahoo timeseries ${symbol} failed before response`);
      return null;
    }

    if (!response.ok) {
      this.logger.warn(`Yahoo timeseries ${symbol} failed with status ${response.status}`);
      return null;
    }

    let payload: YahooTimeseriesResponse;
    try {
      payload = (await response.json()) as YahooTimeseriesResponse;
    } catch {
      return null;
    }

    const items = payload.timeseries?.result ?? [];
    if (items.length === 0) return null;

    const byYear = new Map<number, FiscalPoint>();
    const ensurePoint = (year: number): FiscalPoint => {
      const existing = byYear.get(year);
      if (existing) return existing;
      const point: FiscalPoint = { year };
      byYear.set(year, point);
      return point;
    };

    for (const item of items) {
      for (const [typeKey, field] of Object.entries(TIMESERIES_TYPE_TO_FIELD)) {
        const series = item[typeKey];
        if (!Array.isArray(series)) continue;

        for (const value of series) {
          if (!value || typeof value !== "object") continue;
          const entry = value as YahooTimeseriesValue;
          const raw = asRaw(entry.reportedValue);
          if (typeof raw !== "number") continue;

          const year = yearFromAsOfDate(entry.asOfDate) ?? yearFromEpoch(entry.timestamp);
          if (!year) continue;

          const point = ensurePoint(year);
          if (field === "capex") {
            point.capex = Math.abs(raw);
          } else {
            const numericPoint = point as unknown as Record<string, number | undefined>;
            numericPoint[field] = raw;
          }
        }
      }
    }

    const points = this.applyDerivedRatios(
      Array.from(byYear.values())
        .sort((a, b) => a.year - b.year)
        .slice(-10)
    );

    if (points.length === 0) return null;

    return {
      ticker: paramsTickerFromSymbol(symbol),
      region,
      accountingStandard: accountingFromSymbol(symbol, region),
      template: templateFromTicker(symbol),
      points,
      currency: currencyFromRegion(region),
      updatedAt: new Date().toISOString()
    };
  }

  private async fetchPriceHistory(symbol: string, years: number): Promise<PricePoint[]> {
    const range = `${Math.max(1, Math.min(20, years))}y`;
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=1mo&range=${range}`;
    const response = await this.fetchWithRetry(url);

    if (!response) {
      this.logger.warn(`Yahoo chart ${symbol} failed before response`);
      return [];
    }

    if (!response.ok) {
      this.logger.warn(`Yahoo chart ${symbol} failed with status ${response.status}`);
      return [];
    }

    let payload: YahooChartResponse;
    try {
      payload = (await response.json()) as YahooChartResponse;
    } catch {
      return [];
    }

    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points: PricePoint[] = [];
    const size = Math.min(timestamps.length, closes.length);
    for (let idx = 0; idx < size; idx += 1) {
      const timestamp = timestamps[idx];
      const close = closes[idx];
      if (typeof timestamp !== "number" || typeof close !== "number" || !Number.isFinite(close)) {
        continue;
      }
      points.push({
        date: new Date(timestamp * 1000).toISOString(),
        close
      });
    }

    return points;
  }

  private applyDerivedRatios(points: FiscalPoint[]): FiscalPoint[] {
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

    return points;
  }

  private async fetchWithRetry(url: string): Promise<Response | null> {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, { headers: REQUEST_HEADERS });
        if (response.ok) return response;

        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === maxAttempts - 1) return response;
      } catch {
        if (attempt === maxAttempts - 1) return null;
      }

      const backoff = 250 * (attempt + 1) * (attempt + 1);
      await this.sleep(backoff);
    }

    return null;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private emptyFinancials(symbol: string, region: Region): CompanyFinancials {
    return {
      ticker: paramsTickerFromSymbol(symbol),
      region,
      accountingStandard: accountingFromSymbol(symbol, region),
      template: templateFromTicker(symbol),
      points: [],
      currency: currencyFromRegion(region),
      updatedAt: new Date().toISOString()
    };
  }
}

const paramsTickerFromSymbol = (symbol: string): string =>
  symbol.toUpperCase().replace(/\.NS$|\.BO$/, "");
